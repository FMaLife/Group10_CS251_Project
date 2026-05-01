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
        "order",
        "address",
        "delivery_name",
        "tracking_number",
        "delivery_date",
    )
    search_fields = ("order", "tracking_number", "delivery_name")
    list_filter = ("delivery_name",)
