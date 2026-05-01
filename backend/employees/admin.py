from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display    = ["EmployeeID", "EFirstName", "ELastName", "EEmail", "role", "is_active"]
    list_filter     = ["role", "is_active"]
    search_fields   = ["EFirstName", "ELastName", "EEmail"]
    ordering        = ["EmployeeID"]
    readonly_fields = ["EmployeeID"]
    fieldsets = (
        (None,            {"fields": ("EmployeeID", "EEmail", "EPassword")}),
        ("Personal Info", {"fields": ("EFirstName", "ELastName", "EPhone")}),
        ("Role & Status", {"fields": ("role", "is_active")}),
    )