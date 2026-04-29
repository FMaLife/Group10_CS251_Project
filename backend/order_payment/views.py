from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction

from .models import SaleOrder, OrderDetail, Payment
from .serializers import SaleOrderSerializer, OrderDetailSerializer, PaymentSerializer
from cart_delivery.models import Cart, Delivery
from customers.models import Customer, CustomerAddress
from catalog.models import Product


class SaleOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SaleOrderSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["order_id", "customer__FirstName", "customer__LastName", "order_status"]

    def get_queryset(self):
        qs = SaleOrder.objects.select_related("customer", "owner", "payment") \
            .prefetch_related("details__product__images") \
            .order_by("-order_id")

        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            qs = qs.filter(customer__CustomerID=customer_id)
        return qs

    def create(self, request, *args, **kwargs):
        cart_id = request.data.get("cart_id")
        address_id = request.data.get("address_id")
        payment_status_input = request.data.get("payment_status")

        if not cart_id or not address_id:
            return Response({"error": "cart_id and address_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.get(pk=cart_id)
            customer = Customer.objects.get(CustomerID=cart.customer)
            address = CustomerAddress.objects.get(pk=address_id)
            cart_items = cart.items.all()

            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

            with transaction.atomic():
                order = SaleOrder.objects.create(
                    customer=customer,
                    order_status="Pending",
                    total_amount=0
                )

                for item in cart_items:
                    product = Product.objects.get(ProductID=item.product)

                    OrderDetail.objects.create(
                        order=order,
                        product=product,
                        quantity=item.quantity,
                    )

                Delivery.objects.create(
                    order=order.order_id,
                    address=address.AddressID
                )

                ref_number = f"PAY{order.order_id:06d}"

                is_paid = payment_status_input == "paid"
                payment_status = "Complete" if is_paid else "Waiting"
                payment_timestamp = timezone.now() if is_paid else None

                Payment.objects.create(
                    order=order,
                    ref_number=ref_number,
                    locked_amount=order.total_amount,
                    payment_status=payment_status,
                    payment_timestamp=payment_timestamp
                )

                cart_items.delete()

                return Response({"order_id": order.order_id}, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
        except Customer.DoesNotExist:
            return Response({"error": "Customer not found"}, status=status.HTTP_404_NOT_FOUND)
        except CustomerAddress.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)
        except Product.DoesNotExist:
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        instance = self.get_object()
        payment_status_input = request.data.get("payment_status")
        order_status_input = request.data.get("order_status") or request.data.get("status")

        if payment_status_input == "paid":
            payment = instance.payment
            payment.payment_status = "Complete"
            payment.payment_timestamp = timezone.now()
            payment.save()

            instance.order_status = "Received"
            instance.save()
            return Response(SaleOrderSerializer(instance).data)

        if order_status_input:
            status_map = {
                "pending": "Pending",
                "received": "Received",
                "in_transit": "In transit",
                "complete": "Complete",
                "cancelled": "Cancelled",
            }

            new_status = status_map.get(order_status_input.lower(), order_status_input)

            if instance.order_status in ("Complete", "Cancelled"):
                return Response(
                    {"error": f"Cannot update order with status {instance.order_status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if new_status == "Cancelled" and instance.order_status != "Pending":
                return Response(
                    {"error": "Can only cancel orders with status Pending"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            instance.order_status = new_status
            instance.save()
            return Response(SaleOrderSerializer(instance).data)

        return super().partial_update(request, *args, **kwargs)


class OrderDetailViewSet(viewsets.ModelViewSet):
    queryset = OrderDetail.objects.select_related("order", "product") \
        .prefetch_related("product__images") \
        .all() \
        .order_by("line_number")

    serializer_class = OrderDetailSerializer


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.select_related("order").all().order_by("ref_number")
    serializer_class = PaymentSerializer
