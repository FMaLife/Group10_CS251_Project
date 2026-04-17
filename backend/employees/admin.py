from django.contrib import admin
from .models import Employee


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display    = ["EmployeeID", "EFirstName", "ELastName", "EEmail", "role", "is_active"]
    list_filter     = ["role", "user__is_active"]
    search_fields   = ["EFirstName", "ELastName", "user__email"]
    ordering        = ["EmployeeID"]
    readonly_fields = ["EmployeeID", "EEmail", "is_active"]
    fieldsets = (
        (None,            {"fields": ("EmployeeID", "user", "EEmail")}),
        ("Personal Info", {"fields": ("EFirstName", "ELastName", "EPhone")}),
        ("Role & Status", {"fields": ("role", "is_active")}),
    )