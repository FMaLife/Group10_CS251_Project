from django.db import models, transaction
from django.db.models import F

class Supplier(models.Model):
    supplier_id = models.AutoField(primary_key=True)
    company_name = models.CharField(max_length=150)
    contact_person = models.CharField(max_length=100)
    phone_num = models.CharField(max_length=10)
    address = models.CharField(max_length=255)

    class Meta:
        db_table = "supplier"

    def __str__(self):
        return self.company_name


class Warehouse(models.Model):
    warehouse_id = models.AutoField(primary_key=True)
    wname = models.CharField(max_length=50)
    wphone = models.CharField(max_length=10)
    waddress = models.CharField(max_length=255)

    class Meta:
        db_table = "warehouse"

    def __str__(self):
        return self.wname


class WarehouseLocation(models.Model):
    location_id = models.AutoField(primary_key=True)
    warehouse = models.ForeignKey(
        "stock.Warehouse",
        on_delete=models.CASCADE,
        related_name="locations",
    )
    aisle = models.CharField(max_length=5)
    zone = models.CharField(max_length=20)
    bin = models.CharField(max_length=20)

    class Meta:
        db_table = "warehouse_location"
        unique_together = ("warehouse", "aisle", "zone", "bin")

    def __str__(self):
        return f"{self.warehouse.wname} - {self.zone}/{self.aisle}/{self.bin}"


class RestockOrder(models.Model):
    class RestockStatusChoices(models.TextChoices):
        PENDING = "Pending", "Pending"
        IN_TRANSIT = "In transit", "In transit"
        RECEIVED = "Received", "Received"
        REJECTED = "Rejected", "Rejected"

    restock_id = models.AutoField(primary_key=True)
    supplier = models.ForeignKey(
        "stock.Supplier",
        on_delete=models.PROTECT,
        related_name="restock_orders",
    )
    employee = models.ForeignKey(
        "accounts.Employee",
        on_delete=models.PROTECT,
        related_name="restock_orders",
    )
    location = models.ForeignKey(
        "stock.WarehouseLocation",
        on_delete=models.PROTECT,
        related_name="restock_orders",
    )
    restock_date = models.DateField()
    restock_status = models.CharField(
        max_length=20,
        choices=RestockStatusChoices.choices,
        default=RestockStatusChoices.PENDING,
    )

    class Meta:
        db_table = "restock_order"

    def __str__(self):
        return f"Restock #{self.restock_id}"

    def save(self, *args, **kwargs):
        from catalog.models import Product

        with transaction.atomic():
            old_status = None

            if self.pk:
                old_status = (
                    RestockOrder.objects
                    .select_for_update()
                    .filter(pk=self.pk)
                    .values_list("restock_status", flat=True)
                    .first()
                )

            super().save(*args, **kwargs)

            if old_status != self.RestockStatusChoices.RECEIVED and self.restock_status == self.RestockStatusChoices.RECEIVED:
                details = self.details.select_related("product").all()

                for detail in details:
                    Product.objects.filter(pk=detail.product_id).update(
                        stock_quantity=F("stock_quantity") + detail.quantity
                    )

class RestockDetail(models.Model):
    restock_detail_id = models.AutoField(primary_key=True)
    restock = models.ForeignKey(
        "stock.RestockOrder",
        on_delete=models.CASCADE,
        related_name="details",
    )
    product = models.ForeignKey(
        "catalog.Product",
        on_delete=models.PROTECT,
        related_name="restock_details",
    )
    quantity = models.IntegerField()

    class Meta:
        db_table = "restock_detail"

    def __str__(self):
        return f"{self.product.product_name} x {self.quantity}"