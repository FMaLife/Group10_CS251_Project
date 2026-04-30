from django.db import transaction
from django.utils import timezone
from rest_framework import filters, status, viewsets
from rest_framework.response import Response

from cart_delivery.models import Cart, Delivery
from catalog.models import Product
from customers.models import Customer, CustomerAddress

from .models import OrderDetail, Payment, SaleOrder
from .serializers import OrderDetailSerializer, PaymentSerializer, SaleOrderSerializer


class SaleOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SaleOrderSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["order_id", "customer__FirstName", "customer__LastName", "order_status"]

    def get_queryset(self):
        qs = (
            SaleOrder.objects.select_related("customer", "owner", "payment")
            .prefetch_related("details__product__images")
            .order_by("-order_id")
        )

        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            qs = qs.filter(customer__CustomerID=customer_id)

        return qs

    def _get_product_stock_field(self, product):
        possible_fields = [
            "Stock",
            "stock",
            "Quantity",
            "quantity",
            "StockQuantity",
            "stock_quantity",
            "Inventory",
            "inventory",
        ]

        for field in possible_fields:
            if hasattr(product, field):
                return field

        return None

    def _get_product_from_cart_item(self, item):
        product_value = item.product

        if isinstance(product_value, Product):
            return Product.objects.select_for_update().get(pk=product_value.pk)

        return Product.objects.select_for_update().get(ProductID=product_value)

    def _validate_cart_items_stock(self, cart_items):
        checked_items = []

        for item in cart_items:
            product = self._get_product_from_cart_item(item)
            stock_field = self._get_product_stock_field(product)

            if not stock_field:
                raise ValueError(
                    f"Stock field not found for product {product.ProductName}. "
                    "Please check Product model stock field name."
                )

            current_stock = getattr(product, stock_field)

            if item.quantity <= 0:
                raise ValueError(f"Invalid quantity for product {product.ProductName}")

            if current_stock < item.quantity:
                raise ValueError(
                    f"Not enough stock for {product.ProductName}. "
                    f"Available: {current_stock}, requested: {item.quantity}"
                )

            checked_items.append((item, product, stock_field))

        return checked_items

    def create(self, request, *args, **kwargs):
        cart_id = request.data.get("cart_id")
        address_id = request.data.get("address_id")
        payment_status_input = request.data.get("payment_status")

        if not cart_id or not address_id:
            return Response(
                {"error": "cart_id and address_id are required"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            cart = Cart.objects.get(pk=cart_id)
            customer = Customer.objects.get(CustomerID=cart.customer)
            address = CustomerAddress.objects.get(pk=address_id, CustomerID=customer)

            cart_items = cart.items.all()

            if not cart_items.exists():
                return Response(
                    {"error": "Cart is empty"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            with transaction.atomic():
                checked_items = self._validate_cart_items_stock(cart_items)

                order = SaleOrder.objects.create(
                    customer=customer,
                    order_status=SaleOrder.OrderStatusChoices.PENDING,
                    total_amount=0,
                )

                for item, product, stock_field in checked_items:
                    OrderDetail.objects.create(
                        order=order,
                        product=product,
                        quantity=item.quantity,
                    )

                    current_stock = getattr(product, stock_field)
                    setattr(product, stock_field, current_stock - item.quantity)
                    product.save(update_fields=[stock_field])

                Delivery.objects.create(
                    order=order.order_id,
                    address=address.AddressID,
                )

                ref_number = f"PAY{order.order_id:06d}"
                is_paid = payment_status_input == "paid"

                payment_status = (
                    Payment.PaymentStatusChoices.COMPLETED
                    if is_paid
                    else Payment.PaymentStatusChoices.WAITING
                )

                payment_timestamp = timezone.now() if is_paid else None

                order.refresh_from_db()

                Payment.objects.create(
                    order=order,
                    ref_number=ref_number,
                    locked_amount=order.total_amount,
                    payment_status=payment_status,
                    payment_timestamp=payment_timestamp,
                )

                cart_items.delete()

            return Response(
                {"order_id": order.order_id},
                status=status.HTTP_201_CREATED,
            )

        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)

        except Customer.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)

        except CustomerAddress.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)

        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()

        payment_status_input = request.data.get("payment_status")
        order_status_input = request.data.get("order_status") or request.data.get("status")

        if payment_status_input == "paid":
            payment = instance.payment
            payment.payment_status = Payment.PaymentStatusChoices.COMPLETED
            payment.payment_timestamp = timezone.now()
            payment.save()

            instance.order_status = SaleOrder.OrderStatusChoices.RECEIVED
            instance.save()

            return Response(SaleOrderSerializer(instance).data)

        if order_status_input:
            status_map = {
                "pending": SaleOrder.OrderStatusChoices.PENDING,
                "received": SaleOrder.OrderStatusChoices.RECEIVED,
                "in_transit": SaleOrder.OrderStatusChoices.IN_TRANSIT,
                "in transit": SaleOrder.OrderStatusChoices.IN_TRANSIT,
                "cancelled": SaleOrder.OrderStatusChoices.CANCELLED,
            }

            new_status = status_map.get(order_status_input.lower())

            if not new_status:
                return Response(
                    {"error": "Invalid order status"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if instance.order_status == SaleOrder.OrderStatusChoices.CANCELLED:
                return Response(
                    {"error": "Cannot update cancelled order"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            if (
                new_status == SaleOrder.OrderStatusChoices.CANCELLED
                and instance.order_status != SaleOrder.OrderStatusChoices.PENDING
            ):
                return Response(
                    {"error": "Can only cancel orders with status Pending"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            instance.order_status = new_status
            instance.save()

            return Response(SaleOrderSerializer(instance).data)

        return super().partial_update(request, *args, **kwargs)


class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = (
        OrderDetail.objects.select_related("order", "product")
        .prefetch_related("product__images")
        .all()
        .order_by("line_number")
    )
    serializer_class = OrderDetailSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("order").all().order_by("ref_number")
    serializer_class = PaymentSerializer