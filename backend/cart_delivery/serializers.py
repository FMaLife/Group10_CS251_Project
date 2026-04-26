"""
Serializers for cart_delivery — JSON shapes follow the team's API spreadsheet.

Cart Item response shape:
    {item_id, cart, product, product_name, product_price,
     quantity, added_date, cartitem_total}

Cart response shape:
    {cart_id, customer, create_date, last_updated, items:[...]}

Delivery response shape:
    {delivery_id, order, address, tracking_number, delivery_name, delivery_date}

product_name / product_price are placeholders until the catalog app is merged
in (they will resolve from Product FK at that point).
"""
from rest_framework import serializers

from .models import Cart, CartItem, Delivery


class CartItemSerializer(serializers.ModelSerializer):
    # Stubs — will be filled from FK once `catalog.Product` is merged.
    product_name = serializers.SerializerMethodField()
    product_price = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "item_id",
            "cart",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "added_date",
            "cartitem_total",
        ]
        read_only_fields = ["item_id", "added_date"]

    def get_product_name(self, obj: CartItem):
        # TODO: return obj.product.product_name once Product FK is in place.
        return None

    def get_product_price(self, obj: CartItem):
        # TODO: return obj.product.price once Product FK is in place.
        return None


class CartItemWriteSerializer(serializers.ModelSerializer):
    """Used when adding a product into a cart."""

    class Meta:
        model = CartItem
        fields = ["cart", "product", "quantity", "cartitem_total"]
        extra_kwargs = {
            "cartitem_total": {"required": False},
            "quantity": {"required": False, "default": 1},
        }


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    total_amount = serializers.SerializerMethodField()
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = [
            "cart_id",
            "customer",
            "create_date",
            "last_updated",
            "items",
            "item_count",
            "total_amount",
        ]
        read_only_fields = ["cart_id", "create_date", "last_updated"]

    def get_total_amount(self, obj: Cart):
        return sum((item.cartitem_total for item in obj.items.all()), start=0)

    def get_item_count(self, obj: Cart) -> int:
        return obj.items.count()


class DeliverySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    delivery_name_display = serializers.CharField(
        source="get_delivery_name_display", read_only=True
    )

    class Meta:
        model = Delivery
        fields = [
            "delivery_id",
            "order",
            "address",
            "status",
            "status_display",
            "delivery_name",
            "delivery_name_display",
            "tracking_number",
            "delivery_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["delivery_id", "created_at", "updated_at"]


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    """Used by employees to update delivery status."""

    status = serializers.ChoiceField(choices=Delivery.Status.choices)
    delivery_name = serializers.ChoiceField(
        choices=Delivery.Courier.choices, required=False, allow_blank=True
    )
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    delivery_date = serializers.DateTimeField(required=False, allow_null=True)
