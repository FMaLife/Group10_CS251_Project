from django.db import models


class SaleOrder(models.Model):
    class OrderStatusChoices(models.TextChoices):
        PENDING = "Pending", "Pending"
        RECEIVED = "Received", "Received"
        IN_TRANSIT = "In transit", "In transit"
        CANCELLED = "Cancelled", "Cancelled"

    order_id = models.AutoField(primary_key=True)
    customer = models.ForeignKey(
        "customers.Customer",
        on_delete=models.PROTECT,
        related_name="orders",
    )
    owner = models.ForeignKey(
        "employees.Employee",
        on_delete=models.SET_NULL,
        related_name="managed_orders",
        blank=True,
        null=True,
    )
    order_date = models.DateTimeField(auto_now_add=True)
    order_status = models.CharField(
        max_length=20,
        choices=OrderStatusChoices.choices,
        default=OrderStatusChoices.PENDING,
    )
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    track_number = models.CharField(max_length=100, blank=True, null=True)
    class Meta:
        db_table = "sale_order"

    def __str__(self):
        return f"Order #{self.order_id}"


class OrderDetail(models.Model):
    line_number = models.AutoField(primary_key=True)
    order = models.ForeignKey(
        "order_payment.SaleOrder",
        on_delete=models.CASCADE,
        related_name="details",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="order_details",
    )
    quantity = models.IntegerField()
    subtotal = models.DecimalField(max_digits=12, decimal_places=2, default=0)

    class Meta:
        db_table = "order_detail"
        unique_together = ("order", "product")

    def __str__(self):
        return f"Order {self.order.order_id} - {self.product.ProductName}"

    def save(self, *args, **kwargs):
        self.subtotal = self.product.Price * self.quantity
        super().save(*args, **kwargs)

        order = self.order
        total = sum(detail.subtotal for detail in order.details.all())
        order.total_amount = total
        order.save()

    def delete(self, *args, **kwargs):
        order = self.order
        super().delete(*args, **kwargs)

        total = sum(detail.subtotal for detail in order.details.all())
        order.total_amount = total
        order.save()


class Payment(models.Model):
    class PaymentStatusChoices(models.TextChoices):
        WAITING = "Waiting", "Waiting"
        COMPLETED = "Completed", "Completed"
        CANCELLED = "Cancelled", "Cancelled"

    ref_number = models.CharField(max_length=50, primary_key=True)
    order = models.OneToOneField(
        "order_payment.SaleOrder",
        on_delete=models.CASCADE,
        related_name="payment",
    )
    locked_amount = models.DecimalField(max_digits=12, decimal_places=2)
    payment_status = models.CharField(
        max_length=20,
        choices=PaymentStatusChoices.choices,
        default=PaymentStatusChoices.WAITING,
    )
    payment_timestamp = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "payment"

    def __str__(self):
        return self.ref_number
