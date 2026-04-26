from django.db import models


# -----------------------
# CATEGORY
# -----------------------
class Category(models.Model):
    name = models.CharField(max_length=100)

    def __str__(self):
        return self.name


# -----------------------
# WAREHOUSE
# -----------------------
class Warehouse(models.Model):
    name = models.CharField(max_length=100)
    warehouse_id = models.CharField(max_length=50, unique=True)
    phone = models.CharField(max_length=20)
    address = models.TextField()

    def __str__(self):
        return self.name


# -----------------------
# LOCATION
# -----------------------
class Location(models.Model):
    location_id = models.CharField(max_length=50, unique=True)
    warehouse = models.ForeignKey(Warehouse, on_delete=models.CASCADE)
    zone = models.CharField(max_length=50)
    aisle = models.CharField(max_length=50)
    bin = models.CharField(max_length=50)

    def __str__(self):
        return self.location_id


# -----------------------
# SUPPLIER
# -----------------------
class Supplier(models.Model):
    contact_name = models.CharField(max_length=100)
    supplier_id = models.CharField(max_length=50, unique=True)
    company = models.CharField(max_length=100)
    address = models.TextField()
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.company


# -----------------------
# PRODUCT
# -----------------------
class Product(models.Model):
    product_name = models.CharField(max_length=100)
    product_id = models.CharField(max_length=50, unique=True)
    company = models.CharField(max_length=100)

    warehouse = models.ForeignKey(Warehouse, on_delete=models.SET_NULL, null=True)
    category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.product_name


# -----------------------
# EMPLOYEE
# -----------------------
class Employee(models.Model):
    name = models.CharField(max_length=100)
    employee_id = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=50)
    phone = models.CharField(max_length=20)

    def __str__(self):
        return self.name


# -----------------------
# PURCHASE ORDER
# -----------------------
class PurchaseOrder(models.Model):
    purchase_order_id = models.CharField(max_length=50, unique=True)
    ordered_date = models.DateField()
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE)
    status = models.CharField(max_length=50)

    def __str__(self):
        return self.purchase_order_id


# -----------------------
# SALES ORDER
# -----------------------
class SalesOrder(models.Model):
    sales_order_id = models.CharField(max_length=50, unique=True)
    ordered_date = models.DateField()
    customer = models.CharField(max_length=100)
    status = models.CharField(max_length=50)

    def __str__(self):
        return self.sales_order_id


# -----------------------
# PAYMENT
# -----------------------
class Payment(models.Model):
    reference_number = models.CharField(max_length=50, unique=True)
    payment_date = models.DateField()
    sales_order = models.ForeignKey(SalesOrder, on_delete=models.CASCADE)
    status = models.CharField(max_length=50)

    def __str__(self):
        return self.reference_number