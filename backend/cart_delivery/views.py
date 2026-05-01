"""
Views for Cart & Delivery domain.

Endpoints follow the team API spreadsheet (mounted under /api/cart/):

Customer
  - GET    /api/cart/?customer=<id>             Get/auto-create the customer's cart
  - POST   /api/cart/items/                     Add a product into the cart
  - PATCH  /api/cart/items/<id>/                Update quantity / total
  - DELETE /api/cart/items/<id>/                Remove a product from the cart
  - DELETE /api/cart/<cart_id>/clear/           Empty the cart
  - GET    /api/cart/deliveries/by-order/<id>/  Customer tracks a delivery

Employee
  - GET    /api/cart/deliveries/                List deliveries
  - POST   /api/cart/deliveries/                Create a delivery for an order
  - GET    /api/cart/deliveries/<id>/           Detail
  - PATCH  /api/cart/deliveries/<id>/status/    Update delivery status
"""
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Cart, CartItem, Delivery
from .serializers import (
    CartItemSerializer,
    CartItemWriteSerializer,
    CartSerializer,
    DeliverySerializer,
    DeliveryStatusUpdateSerializer,
)


# ------------------------------------------------------------------ Cart ----


class CartView(APIView):
    """GET /api/cart/?customer=<id>  →  ดึงตะกร้าของลูกค้า (สร้างให้ถ้ายังไม่มี)."""

    def get(self, request):
        # accept both `customer` (team convention) and `customer_id` (legacy)
        customer = request.query_params.get("customer") or request.query_params.get(
            "customer_id"
        )
        if not customer:
            return Response(
                {"detail": "customer is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            customer_int = int(customer)
        except (TypeError, ValueError):
            return Response(
                {"detail": "customer must be an integer"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart, _ = Cart.objects.get_or_create(customer=customer_int)
        return Response(CartSerializer(cart).data)


class CartClearView(APIView):
    """DELETE /api/cart/<cart_id>/clear/  →  ลบรายการในตะกร้าทั้งหมด."""

    def delete(self, request, cart_id: int):
        cart = get_object_or_404(Cart, pk=cart_id)
        deleted, _ = cart.items.all().delete()
        return Response({"deleted": deleted}, status=status.HTTP_200_OK)


# -------------------------------------------------------------- Cart Item ---


class CartItemViewSet(viewsets.ModelViewSet):
    """
    POST   /api/cart/items/             body: {cart, product, quantity, cartitem_total}
    GET    /api/cart/items/?cart=<id>
    PATCH  /api/cart/items/<id>/
    DELETE /api/cart/items/<id>/
    """

    queryset = CartItem.objects.select_related("cart").all()

    def get_serializer_class(self):
        if self.action == "create":
            return CartItemWriteSerializer
        return CartItemSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        cart_id = self.request.query_params.get("cart")
        if cart_id:
            qs = qs.filter(cart_id=cart_id)
        return qs

    def create(self, request, *args, **kwargs):
        cart_id = request.data.get("cart")
        if not cart_id:
            return Response(
                {"detail": "cart is required"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        cart = get_object_or_404(Cart, pk=cart_id)

        write_serializer = CartItemWriteSerializer(data=request.data)
        write_serializer.is_valid(raise_exception=True)
        product = write_serializer.validated_data["product"]
        quantity = write_serializer.validated_data.get("quantity", 1)
        cartitem_total = write_serializer.validated_data.get("cartitem_total", 0)

        # ถ้ามีอยู่แล้ว เพิ่มจำนวนแทนการสร้างซ้ำ (ตามข้อกำหนด unique cart+product)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity, "cartitem_total": cartitem_total},
        )
        if not created:
            item.quantity += int(quantity)
            if cartitem_total:
                item.cartitem_total = cartitem_total
            item.save()

        # Update cart timestamp
        cart.save(update_fields=["last_updated"])

        return Response(
            CartItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.cart.save(update_fields=["last_updated"])

    def perform_destroy(self, instance):
        cart = instance.cart
        instance.delete()
        cart.save(update_fields=["last_updated"])


# --------------------------------------------------------------- Delivery ---


class DeliveryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/cart/deliveries/                list (filter ?status=, ?order=)
    POST   /api/cart/deliveries/                create
    GET    /api/cart/deliveries/<id>/           detail
    PATCH  /api/cart/deliveries/<id>/status/    update status (employee)
    GET    /api/cart/deliveries/by-order/<id>/  track by order id (customer)
    """

    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if "status" in params:
            qs = qs.filter(status=params["status"])
        if "order" in params:
            qs = qs.filter(order=params["order"])
        elif "order_id" in params:  # legacy alias
            qs = qs.filter(order=params["order_id"])
        return qs

    @action(detail=True, methods=["patch"], url_path="status")
    def update_status(self, request, pk=None):
        """อัปเดตสถานะการจัดส่ง (employee function)."""
        delivery = self.get_object()
        serializer = DeliveryStatusUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(delivery, field, value)
        # auto-stamp delivery_date เมื่อเปลี่ยนเป็น DELIVERED
        if (
            serializer.validated_data.get("status") == Delivery.Status.DELIVERED
            and delivery.delivery_date is None
        ):
            delivery.delivery_date = timezone.now()
        delivery.save()
        return Response(DeliverySerializer(delivery).data)

    @action(detail=False, methods=["get"], url_path=r"by-order/(?P<order_id>[^/.]+)")
    def by_order(self, request, order_id=None):
        """ลูกค้าตรวจสอบการจัดส่งจาก OrderID."""
        delivery = get_object_or_404(Delivery, order=order_id)
        return Response(DeliverySerializer(delivery).data)
