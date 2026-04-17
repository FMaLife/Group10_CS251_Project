from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Customer(models.Model):
    # ผูกกับ Django User เพื่อใช้ auth
    # ข้อมูลจริงเก็บที่นี่
    user        = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="customer",
    )
    CustomerID  = models.AutoField(primary_key=True)
    FirstName   = models.CharField(max_length=50)
    LastName    = models.CharField(max_length=50)
    PhoneNumber = models.JSONField(default=list)

    class Meta:
        db_table = "Customer"

    def __str__(self):
        return f"{self.FirstName} {self.LastName}"

    @property
    def Email(self):
        return self.user.email

    @property
    def is_active(self):
        return self.user.is_active


class CustomerAddress(models.Model):
    AddressID   = models.AutoField(primary_key=True)
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