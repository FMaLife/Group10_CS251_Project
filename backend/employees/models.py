from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Employee(models.Model):
    ROLE_CHOICES = [("Admin", "Admin"), ("Staff", "Staff")]

    # ผูกกับ Django User เพื่อใช้ auth
    user       = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name="employee",
    )
    EmployeeID = models.AutoField(primary_key=True)
    EFirstName = models.CharField(max_length=100)
    ELastName  = models.CharField(max_length=100)
    role       = models.CharField(max_length=10, choices=ROLE_CHOICES, default="Staff")
    EPhone     = models.CharField(max_length=20)

    class Meta:
        db_table = "Employee"

    def __str__(self):
        return f"{self.EFirstName} {self.ELastName} ({self.role})"

    @property
    def EEmail(self):
        return self.user.email

    @property
    def is_active(self):
        return self.user.is_active