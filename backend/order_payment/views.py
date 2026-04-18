from rest_framework import viewsets, status, filters
from rest_framework.response import Response
from django.utils import timezone
from django.db import transaction


from .models import SaleOrder, OrderDetail, Payment
from .serializers import SaleOrderSerializer, OrderDetailSerializer, PaymentSerializer
from cart_delivery.models import Cart, Delivery
from customers.models import CustomerAddress

class SaleOrderViewSet(viewsets.ModelViewSet):
    serializer_class = SaleOrderSerializer
    filter_backends  = [filters.SearchFilter]
    search_fields    = ["order_id", "customer__FirstName", "customer__LastName", "order_status"]

    def get_queryset(self):
        """ 2. Filter ออเดอร์ตาม customer_id ถ้ามีการส่งมาใน URL """
        qs = SaleOrder.objects.select_related("customer", "owner", "payment").prefetch_related("details__product__images", "delivery__address").order_by("-order_id")
        customer_id = self.request.query_params.get("customer_id")
        if customer_id:
            qs = qs.filter(customer__CustomerID=customer_id)
        return qs

    def create(self, request, *args, **kwargs):
        """ 3. Override create() — ระบบการสั่งซื้อ (Place Order) """
        cart_id = request.data.get("cart_id")
        address_id = request.data.get("address_id")
        payment_status_input = request.data.get("payment_status") # รับจากหน้า UI

        # Validate เบื้องต้น
        if not cart_id or not address_id:
            return Response({"error": "cart_id and address_id are required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            cart = Cart.objects.get(pk=cart_id)
            address = CustomerAddress.objects.get(pk=address_id)
            cart_items = cart.items.all() # สมมติชื่อ related_name ใน CartItem คือ items

            if not cart_items.exists():
                return Response({"error": "Cart is empty"}, status=status.HTTP_400_BAD_REQUEST)

            # ใช้ transaction.atomic() เพื่อความเป๊ะ 100% (Rollback ถ้าพัง)
            with transaction.atomic():
                # 3.1 สร้าง SaleOrder
                order = SaleOrder.objects.create(
                    customer=cart.customer,
                    order_status="Pending",
                    total_amount=0 # เดี๋ยวจะไปอัปเดตผ่าน Signal หรือคำนวณใหม่
                )

                # 3.2 Loop สร้าง OrderDetail จาก CartItem
                for item in cart_items:
                    OrderDetail.objects.create(
                        order=order,
                        product=item.product,
                        quantity=item.quantity,
                        # subtotal จะถูกคำนวณใน save() ของ OrderDetail ตามที่คุณเขียนไว้
                    )

                # 3.3 สร้าง Delivery
                Delivery.objects.create(order=order, address=address)

                # 3.4 สร้าง Payment
                # จัดการ Format เลขที่อ้างอิง
                ref_number = f"PAY{order.order_id:06d}"
                
                # เช็คสถานะการจ่ายเงินที่ส่งมาจากหน้าจอ (ปุ่ม Complete)
                is_paid = payment_status_input == "paid"
                payment_status = "Completed" if is_paid else "Pending"
                payment_timestamp = timezone.now() if is_paid else None

                Payment.objects.create(
                    order=order,
                    ref_number=ref_number,
                    locked_amount=order.total_amount, # ยอดเงินที่บวกมาแล้วจาก Signal
                    payment_status=payment_status,
                    payment_timestamp=payment_timestamp
                )

                # 3.5 ลบสินค้าในตะกร้าทิ้งหลังจากสั่งซื้อสำเร็จ
                cart_items.delete()

                return Response({"order_id": order.order_id}, status=status.HTTP_201_CREATED)

        except Cart.DoesNotExist:
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
        except CustomerAddress.DoesNotExist:
            return Response({"error": "Address not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def partial_update(self, request, *args, **kwargs):
        """ 4. Override partial_update() — สำหรับกดปุ่ม Complete หรือ Cancel """
        instance = self.get_object()
        payment_status_input = request.data.get("payment_status")
        order_status_input = request.data.get("status")

        # กรณีอัปเดตสถานะการจ่ายเงิน (ปุ่ม Complete)
        if payment_status_input == "paid":
            payment = instance.payment
            payment.payment_status = "Completed"
            payment.payment_timestamp = timezone.now()
            payment.save()
            # เปลี่ยน order_status เป็น Received อัตโนมัติเมื่อจ่ายเงินแล้ว
            instance.order_status = "Received"
            instance.save()
            return Response(SaleOrderSerializer(instance).data)

        # กรณีอัปเดตสถานะออเดอร์ (เช่น Cancel)
        if order_status_input:
            status_map = {
                "pending":    "Pending",
                "received":   "Received",
                "in_transit": "In transit",
                "complete":   "Complete",
                "cancelled":  "Cancelled",
            }
            new_status = status_map.get(order_status_input.lower(), order_status_input)

            # Guard: Cancelled และ Complete แก้ไม่ได้
            if instance.order_status in ("Complete", "Cancelled"):
                return Response(
                    {"error": f"Cannot update order with status {instance.order_status}"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Guard: Cancel ได้เฉพาะ Pending เท่านั้น
            if new_status == "Cancelled":
                if instance.order_status != "Pending":
                    return Response(
                        {"error": "Can only cancel orders with status Pending"},
                        status=status.HTTP_400_BAD_REQUEST
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