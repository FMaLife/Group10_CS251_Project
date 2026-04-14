from django.contrib import admin
from .models import Supplier, Warehouse, WarehouseLocation, RestockOrder, RestockDetail


@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display = ("supplier_id", "company_name", "contact_person", "phone_num")


@admin.register(Warehouse)
class WarehouseAdmin(admin.ModelAdmin):
    list_display = ("warehouse_id", "wname", "wphone")


@admin.register(WarehouseLocation)
class WarehouseLocationAdmin(admin.ModelAdmin):
    list_display = ("location_id", "warehouse", "zone", "aisle", "bin")


@admin.register(RestockOrder)
class RestockOrderAdmin(admin.ModelAdmin):
    list_display = ("restock_id", "supplier", "employee", "location", "restock_date", "restock_status")


@admin.register(RestockDetail)
class RestockDetailAdmin(admin.ModelAdmin):
    list_display = ("restock_detail_id", "restock", "product", "quantity")
    raw_id_fields = ("restock", "product")