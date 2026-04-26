from rest_framework import serializers

from .models import Cart, CartItem, Delivery


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = [
            "id",
            "cart",
            "product_id",
            "quantity",
            "cart_item_total",
            "added_date",
        ]
        read_only_fields = ["id", "cart_item_total", "added_date"]


class CartItemWriteSerializer(serializers.ModelSerializer):
    """Used when adding a product into a cart (cart is taken from URL)."""

    class Meta:
        model = CartItem
        fields = ["product_id", "quantity", "cart_item_total"]
        extra_kwargs = {
            "cart_item_total": {"required": False},
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
            "customer_id",
            "create_date",
            "last_updated",
            "items",
            "item_count",
            "total_amount",
        ]
        read_only_fields = ["cart_id", "create_date", "last_updated"]

    def get_total_amount(self, obj: Cart):
        return sum((item.cart_item_total for item in obj.items.all()), start=0)

    def get_item_count(self, obj: Cart) -> int:
        return obj.items.count()


class DeliverySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    courier_display = serializers.CharField(
        source="get_courier_name_display", read_only=True
    )

    class Meta:
        model = Delivery
        fields = [
            "delivery_id",
            "order_id",
            "address_id",
            "status",
            "status_display",
            "courier_name",
            "courier_display",
            "tracking_number",
            "delivery_date",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["delivery_id", "created_at", "updated_at"]


class DeliveryStatusUpdateSerializer(serializers.Serializer):
    """Used by employees to update delivery status."""

    status = serializers.ChoiceField(choices=Delivery.Status.choices)
    courier_name = serializers.ChoiceField(
        choices=Delivery.Courier.choices, required=False, allow_blank=True
    )
    tracking_number = serializers.CharField(required=False, allow_blank=True)
    delivery_date = serializers.DateTimeField(required=False, allow_null=True)
