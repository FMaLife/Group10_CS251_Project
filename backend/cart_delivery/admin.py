from django.contrib import admin

from .models import Cart, CartItem, Delivery


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("cart_id", "customer_id", "create_date", "last_updated")
    search_fields = ("cart_id", "customer_id")


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("id", "cart", "product_id", "quantity", "cart_item_total", "added_date")
    search_fields = ("cart__cart_id", "product_id")


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        "delivery_id",
        "order_id",
        "address_id",
        "status",
        "courier_name",
        "tracking_number",
        "delivery_date",
    )
    search_fields = ("delivery_id", "tracking_number", "order_id")
    list_filter = ("status", "courier_name")
