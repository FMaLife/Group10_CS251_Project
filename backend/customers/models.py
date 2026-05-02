from django.db import models


class Customer(models.Model):
    CustomerID  = models.AutoField(primary_key=True)
    FirstName   = models.CharField(max_length=50)
    LastName    = models.CharField(max_length=50)
    Email       = models.CharField(max_length=150, unique=True)
    Password    = models.CharField(max_length=255)
    PhoneNumber = models.JSONField(default=list)
    is_active   = models.BooleanField(default=True)

    class Meta:
        db_table = "Customer"

    def __str__(self):
        return f"{self.FirstName} {self.LastName}"


class CustomerAddress(models.Model):
    AddressID   = models.AutoField(primary_key=True)
    # FK ข้าม app ใช้ string "customers.Customer"
    CustomerID  = models.ForeignKey(
        "customers.Customer",
        on_delete=models.CASCADE,
        db_column="CustomerID",
        related_name="addresses",
    )
    AddressType = models.CharField(max_length=50)
    HouseNo     = models.CharField(max_length=20)
    Street      = models.CharField(max_length=50)
    SubDistrict = models.CharField(max_length=50)
    District    = models.CharField(max_length=50)
    Province    = models.CharField(max_length=50)
    ZipCode     = models.CharField(max_length=5)
    is_default  = models.BooleanField(default=False)

    class Meta:
        db_table = "Customer_Address"

    def __str__(self):
        return f"{self.HouseNo} {self.Street}, {self.Province}"