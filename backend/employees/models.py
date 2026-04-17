from django.db import models


class Employee(models.Model):
    ROLE_CHOICES = [("Admin", "Admin"), ("Staff", "Staff")]

    EmployeeID = models.AutoField(primary_key=True)
    EFirstName = models.CharField(max_length=100)
    ELastName  = models.CharField(max_length=100)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default="Staff")
    EPhone     = models.CharField(max_length=20)
    EEmail     = models.CharField(max_length=100, unique=True)
    EPassword  = models.CharField(max_length=255)
    is_active  = models.BooleanField(default=True)

    class Meta:
        db_table = "Employee"

    def __str__(self):
        return f"{self.EFirstName} {self.ELastName} ({self.role})"