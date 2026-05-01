from django.contrib import admin
from .models import Customer, CustomerAddress


@admin.register(Customer)
class CustomerAdmin(admin.ModelAdmin):
    list_display    = ["CustomerID", "FirstName", "LastName", "Email", "is_active"]
    list_filter     = ["is_active"]
    search_fields   = ["FirstName", "LastName", "Email"]
    ordering        = ["CustomerID"]
    readonly_fields = ["CustomerID"]
    fieldsets = (
        (None,            {"fields": ("CustomerID", "Email", "Password")}),
        ("Personal Info", {"fields": ("FirstName", "LastName", "PhoneNumber")}),
        ("Status",        {"fields": ("is_active",)}),
    )


@admin.register(CustomerAddress)
class CustomerAddressAdmin(admin.ModelAdmin):
    list_display    = ["AddressID", "CustomerID", "AddressType", "Province", "ZipCode", "is_default"]
    list_filter     = ["AddressType", "Province", "is_default"]
    search_fields   = ["CustomerID__Email", "Province", "ZipCode"]
    ordering        = ["AddressID"]
    readonly_fields = ["AddressID"]