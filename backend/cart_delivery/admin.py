from django.contrib import admin

from .models import Cart, CartItem, Delivery


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("cart_id", "customer", "create_date", "last_updated")
    search_fields = ("cart_id", "customer")


@admin.register(CartItem)
class CartItemAdmin(admin.ModelAdmin):
    list_display = ("item_id", "cart", "product", "quantity", "cartitem_total", "added_date")
    search_fields = ("cart__cart_id", "product")


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = (
        "delivery_id",
        "order",
        "address",
        "status",
        "delivery_name",
        "tracking_number",
        "delivery_date",
    )
    search_fields = ("delivery_id", "tracking_number", "order")
    list_filter = ("status", "delivery_name")
