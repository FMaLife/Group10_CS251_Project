from rest_framework import serializers
from .models import SaleOrder, OrderDetail, Payment


class OrderDetailSerializer(serializers.ModelSerializer):
    # เปลี่ยนชื่อ field ให้ตรง frontend
    item_id       = serializers.IntegerField(source="line_number", read_only=True)
    product_name  = serializers.CharField(source="product.product_name", read_only=True)
    product_price = serializers.DecimalField(source="product.price", max_digits=12, decimal_places=2, read_only=True)
    color         = serializers.CharField(source="product.color", read_only=True)
    width         = serializers.IntegerField(source="product.width", read_only=True)
    length        = serializers.IntegerField(source="product.length", read_only=True)
    height        = serializers.IntegerField(source="product.height", read_only=True)
    image         = serializers.SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = [
            "item_id",        # ← frontend ใช้ item_id (เดิมคือ line_number)
            "order",
            "product",
            "product_name",
            "product_price",  # ← ราคาต่อหน่วย
            "quantity",
            "color",
            "width",
            "length",
            "height",
            "image",
            "subtotal",
        ]
        read_only_fields = ["item_id", "subtotal", "product_name", "product_price",
                            "color", "width", "length", "height", "image"]

    def get_image(self, obj):
        # ดึงรูป primary ก่อน ถ้าไม่มีเอารูปแรก
        primary = obj.product.images.filter(is_primary=True).first()
        if primary:
            return primary.image_url
        first = obj.product.images.first()
        return first.image_url if first else None


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "ref_number",
            "order",
            "locked_amount",
            "payment_status",
            "payment_timestamp",
        ]


class SaleOrderSerializer(serializers.ModelSerializer):
    # เปลี่ยนชื่อ field ให้ตรง frontend
    status  = serializers.CharField(source="order_status")           # order_status → status
    total   = serializers.DecimalField(source="total_amount", max_digits=12, decimal_places=2, read_only=True)  # total_amount → total
    items   = OrderDetailSerializer(source="details", many=True, read_only=True)  # details → items
    payment = PaymentSerializer(read_only=True)

    owner_name       = serializers.SerializerMethodField()
    delivery_date    = serializers.SerializerMethodField()
    address          = serializers.SerializerMethodField()
    customer_name    = serializers.SerializerMethodField()
    customer_phone   = serializers.SerializerMethodField()
    tracking_number  = serializers.SerializerMethodField()

    class Meta:
        model = SaleOrder
        fields = [
            "order_id",
            "customer",
            "customer_name",
            "customer_phone",
            "owner",
            "owner_name",
            "order_date",
            "status",
            "total",
            "delivery_date",
            "tracking_number",
            "address",
            "items",
            "payment",
        ]
        read_only_fields = ["order_id", "order_date", "total"]

    def get_customer_name(self, obj):
        if not obj.customer:
            return None
        return f"{obj.customer.FirstName} {obj.customer.LastName}"

    def get_customer_phone(self, obj):
        if not obj.customer:
            return None
        return obj.customer.PhoneNumber

    def get_tracking_number(self, obj):
        delivery = getattr(obj, "delivery", None)
        if delivery:
            return delivery.tracking_number
        return None

    def get_owner_name(self, obj):
        if not obj.owner:
            return None
        return f"{obj.owner.EFirstName} {obj.owner.ELastName}"

    def get_delivery_date(self, obj):
        delivery = getattr(obj, "delivery", None)
        if delivery and delivery.delivery_date:
            return str(delivery.delivery_date)
        return None

    def get_address(self, obj):
        delivery = getattr(obj, "delivery", None)
        if not delivery or not delivery.address:
            return None
        addr = delivery.address
        # รวม field ที่อยู่เป็น string เดียว
        parts = [addr.HouseNo, addr.Street, addr.SubDistrict,
                 addr.District, addr.Province, addr.ZipCode]
        return ", ".join(p for p in parts if p)

    def to_representation(self, instance):
        """แปลง 'In transit' → 'In_transit' ตอนส่งให้ frontend"""
        data = super().to_representation(instance)
        if data.get("status") == "In transit":
            data["status"] = "In_transit"
        return data

    def to_internal_value(self, data):
        """แปลง 'In_transit' → 'In transit' ตอนรับจาก frontend"""
        if data.get("status") == "In_transit":
            data = data.copy()
            data["status"] = "In transit"
        return super().to_internal_value(data)