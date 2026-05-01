# from django.db import models
# import uuid


# # -----------------------
# # CATEGORY
# # -----------------------
# class Category(models.Model):
#     name = models.CharField(max_length=100)

#     def __str__(self):
#         return self.name


# # -----------------------
# # WAREHOUSE
# # -----------------------
# class Warehouse(models.Model):
#     name = models.CharField(max_length=100)
#     warehouse_id = models.CharField(max_length=50, unique=True)
#     phone = models.CharField(max_length=20)
#     address = models.TextField()

#     def save(self, *args, **kwargs):
#         if not self.warehouse_id:
#             self.warehouse_id = f"WH-{uuid.uuid4().hex[:6].upper()}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.name


# # -----------------------
# # LOCATION
# # -----------------------
# class Location(models.Model):
#     location_id = models.CharField(max_length=50, unique=True)
#     warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
#     zone = models.CharField(max_length=50)
#     aisle = models.CharField(max_length=50)
#     bin = models.CharField(max_length=50)

#     def save(self, *args, **kwargs):
#         self.location_id = f"{self.zone}{self.aisle}{self.bin}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.location_id


# # -----------------------
# # SUPPLIER
# # -----------------------
# class Supplier(models.Model):
#     contact_name = models.CharField(max_length=100)
#     supplier_id = models.CharField(max_length=50, unique=True)
#     company = models.CharField(max_length=100)
#     address = models.TextField()
#     phone = models.CharField(max_length=20)

#     def save(self, *args, **kwargs):
#         if not self.supplier_id:
#             self.supplier_id = f"SUP-{uuid.uuid4().hex[:6].upper()}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.company


# # -----------------------
# # PRODUCT
# # -----------------------
# class Product(models.Model):
#     product_name = models.CharField(max_length=100)
#     product_id = models.CharField(max_length=50, unique=True)
#     company = models.CharField(max_length=100)

#     image = models.ImageField(upload_to='products/', null=True, blank=True)

#     width = models.FloatField(null=True, blank=True)
#     length = models.FloatField(null=True, blank=True)
#     height = models.FloatField(null=True, blank=True)

#     color = models.CharField(max_length=50, null=True, blank=True)
#     price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
#     quantity = models.IntegerField(null=True, blank=True)

#     warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True)
#     category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)
#     supplier = models.ForeignKey(Supplier, on_delete=models.SET_NULL, null=True)

#     def save(self, *args, **kwargs):
#         if not self.product_id:
#             self.product_id = f"PRD-{uuid.uuid4().hex[:6].upper()}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.product_name


# # -----------------------
# # EMPLOYEE
# # -----------------------
# class Employee(models.Model):
#     name = models.CharField(max_length=100)
#     employee_id = models.CharField(max_length=50, unique=True)

#     class Role(models.TextChoices):
#         ADMIN = "admin", "Admin"
#         STAFF = "staff", "Staff"

#     role = models.CharField(max_length=50, choices=Role.choices)
#     phone = models.CharField(max_length=20)

#     def save(self, *args, **kwargs):
#         if not self.employee_id:
#             self.employee_id = f"EMP-{uuid.uuid4().hex[:6].upper()}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.name

# # -----------------------
# # PURCHASE ORDER
# # -----------------------
# class PurchaseOrder(models.Model):
#     purchase_order_id = models.CharField(max_length=50, unique=True)
#     ordered_date = models.DateField()
#     supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
#     class Status(models.TextChoices):
#         PENDING = "pending", "Pending"
#         INTRANSIT = "intransit", "In Transit"
#         RECEIVED = "received", "Received"
#         REJECTED = "rejected", "Rejected"

#     status = models.CharField(
#         max_length=50,
#         choices=Status.choices,
#         default=Status.PENDING
#     )

#     def save(self, *args, **kwargs):
#         if not self.purchase_order_id:
#             self.purchase_order_id = f"PO-{uuid.uuid4().hex[:6].upper()}"
#         super().save(*args, **kwargs)

#     def __str__(self):
#         return self.purchase_order_id

# class PurchaseOrderItem(models.Model):
#     purchase_order = models.ForeignKey(PurchaseOrder, on_delete=models.CASCADE)
#     product = models.ForeignKey(Product, on_delete=models.CASCADE)
#     quantity = models.IntegerField()

#     def __str__(self):
#         return f"{self.purchase_order.purchase_order_id} - {self.product}"
        

# # -----------------------
# # SALES ORDER
# # -----------------------
# class SalesOrder(models.Model):
#     sales_order_id = models.CharField(max_length=50, unique=True)
#     ordered_date = models.DateField()
#     customer = models.CharField(max_length=100)
#     class Status(models.TextChoices):
#         PENDING = "pending", "Pending"
#         INTRANSIT = "intransit", "In Transit"
#         RECEIVED = "received", "Received"
#         COMPLETE = "complete", "Complete"
#         CANCELLED = "cancelled", "Cancelled"

#     status = models.CharField(
#         max_length=50,
#         choices=Status.choices
#     )
#     def __str__(self):
#         return self.sales_order_id


# # -----------------------
# # PAYMENT
# # -----------------------
# class Payment(models.Model):
#     reference_number = models.CharField(max_length=50, unique=True)
#     payment_date = models.DateField()
#     sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE)
#     status = models.CharField(max_length=50)

#     def __str__(self):
#         return self.reference_number