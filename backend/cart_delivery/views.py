"""
Views for Cart & Delivery domain.

Endpoints follow the team API spreadsheet (mounted under /api/cart/):

Customer
  - GET    /api/cart/?customer=<id>             Get/auto-create the customer's cart
  - POST   /api/cart/items/                     Add a product into the cart
  - PATCH  /api/cart/items/<id>/                Update quantity / total
  - DELETE /api/cart/items/<id>/                Remove a product from the cart
  - DELETE /api/cart/<cart_id>/clear/           Empty the cart
  - GET    /api/cart/deliveries/<order_id>/     Customer tracks a delivery (OrderID = PK)

Employee
  - GET    /api/cart/deliveries/                       List deliveries
  - POST   /api/cart/deliveries/                       Create a delivery for an order
  - GET    /api/cart/deliveries/<order_id>/            Detail (PK = OrderID)
  - PATCH  /api/cart/deliveries/<order_id>/tracking/   Update tracking & courier (Phase 2 SQL #28)
"""
from django.shortcuts import get_object_or_404
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
    DeliveryTrackingUpdateSerializer,
)


# ------------------------------------- Cart ---------------------------------


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


# ---------------------------------- Cart Item -------------------------------


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

        # ตรวจสอบ stock ก่อนเพิ่ม
        from catalog.models import Product as CatalogProduct
        try:
            prod_obj = CatalogProduct.objects.get(pk=product)
            stock = prod_obj.StockQuantity
        except CatalogProduct.DoesNotExist:
            stock = 0

        existing_qty = 0
        try:
            existing_item = CartItem.objects.get(cart=cart, product=product)
            existing_qty = existing_item.quantity
        except CartItem.DoesNotExist:
            pass

        new_qty = existing_qty + int(quantity)
        if new_qty > stock:
            return Response(
                {"error": f"Not enough stock. Available: {stock - existing_qty}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        # ถ้ามีอยู่แล้ว เพิ่มจำนวนแทนการสร้างซ้ำ (ตามข้อกำหนด unique cart+product)
        item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={"quantity": quantity},
        )
        if not created:
            item.quantity += int(quantity)
            item.save()  # item.save() จะคำนวณ cartitem_total ให้อัตโนมัติ (logic ใน models.py)

        # Update cart timestamp
        cart.save(update_fields=["last_updated"])

        return Response(
            CartItemSerializer(item).data,
            status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
        )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()
        new_qty = request.data.get("quantity")
        if new_qty is not None:
            from catalog.models import Product as CatalogProduct
            try:
                stock = CatalogProduct.objects.get(pk=instance.product).StockQuantity
            except CatalogProduct.DoesNotExist:
                stock = 0
            if int(new_qty) > stock:
                return Response(
                    {"error": f"Not enough stock. Available: {stock}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save()
        instance.cart.save(update_fields=["last_updated"])

    def perform_destroy(self, instance):
        cart = instance.cart
        instance.delete()
        cart.save(update_fields=["last_updated"])


# ---------------------------------- Delivery --------------------------------


class DeliveryViewSet(viewsets.ModelViewSet):
    """
    GET    /api/cart/deliveries/                        list (filter ?delivery_name=)
    POST   /api/cart/deliveries/                        create
    GET    /api/cart/deliveries/<order_id>/             detail (lookup by OrderID = PK)
    PATCH  /api/cart/deliveries/<order_id>/tracking/    update tracking + courier (Phase 2 SQL #28)

    — ไม่มี status field ตาม data dict (สถานะไปอยู่ที่ Sale_Order.OrderStatus)
    — PK = OrderID, URL pattern ใช้ order_id
    """

    queryset = Delivery.objects.all()
    serializer_class = DeliverySerializer
    lookup_field = "order"
    lookup_url_kwarg = "order_id"

    def get_queryset(self):
        qs = super().get_queryset()
        params = self.request.query_params
        if "delivery_name" in params:
            qs = qs.filter(delivery_name__icontains=params["delivery_name"])
        return qs

    @action(detail=True, methods=["patch"], url_path="tracking")
    def update_tracking(self, request, order_id=None):
        """พนักงานอัปเดตเลขพัสดุ + ชื่อขนส่ง (Phase 2 SQL #28).

        UPDATE Delivery SET TrackingNumber = ?, DeliveryName = ? WHERE OrderID = ?
        """
        delivery = self.get_object()
        serializer = DeliveryTrackingUpdateSerializer(data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        for field, value in serializer.validated_data.items():
            setattr(delivery, field, value)
        delivery.save()
        return Response(DeliverySerializer(delivery).data)
