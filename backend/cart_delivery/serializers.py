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
        read_only_fields = ["item_id", "added_date", "cartitem_total"]

    def get_product_name(self, obj: CartItem):
        # MOCK: ถ้า ID=101 ให้ชื่อ 'Modern Chair'
        if obj.product == 101:
            return "Modern Chair"
        return f"Product #{obj.product}"

    def get_product_price(self, obj: CartItem):
        # MOCK: ราคาคงที่ 500 ตามที่ตั้งไว้ใน model save()
        return 500.00


class CartItemWriteSerializer(serializers.ModelSerializer):
    """Used when adding a product into a cart."""

    class Meta:
        model = CartItem
        fields = ["cart", "product", "quantity"]
        extra_kwargs = {
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
    """Schema ตรงตาม Data Dictionary — ไม่มี status/timestamps."""

    class Meta:
        model = Delivery
        fields = [
            "order",          # PK
            "address",
            "delivery_name",
            "tracking_number",
            "delivery_date",
        ]


class DeliveryTrackingUpdateSerializer(serializers.Serializer):
    """พนักงานอัปเดตเลขพัสดุ + ชื่อขนส่ง + วันจัดส่ง (Phase 2 SQL #28)."""

    delivery_name = serializers.CharField(
        max_length=150, required=False, allow_blank=True
    )
    tracking_number = serializers.CharField(
        max_length=13, required=False, allow_blank=True
    )
    delivery_date = serializers.DateField(required=False, allow_null=True)
