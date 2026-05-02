from rest_framework import serializers
from .models import SaleOrder, OrderDetail, Payment
from cart_delivery.models import Delivery
from customers.models import CustomerAddress


class OrderDetailSerializer(serializers.ModelSerializer):
    line_number = serializers.IntegerField(read_only=True)
    product_name = serializers.CharField(source="product.ProductName", read_only=True)
    product_price = serializers.DecimalField(source="product.Price", max_digits=12, decimal_places=2, read_only=True)
    color = serializers.CharField(source="product.Color", read_only=True)
    width = serializers.IntegerField(source="product.Width", read_only=True)
    length = serializers.IntegerField(source="product.Length", read_only=True)
    height = serializers.IntegerField(source="product.Height", read_only=True)
    image = serializers.SerializerMethodField()

    class Meta:
        model = OrderDetail
        fields = [
            "line_number",
            "order",
            "product",
            "product_name",
            "product_price",
            "quantity",
            "color",
            "width",
            "length",
            "height",
            "image",
            "subtotal",
        ]
        read_only_fields = [
            "line_number",
            "subtotal",
            "product_name",
            "product_price",
            "color",
            "width",
            "length",
            "height",
            "image",
        ]

    def get_image(self, obj):
        primary = obj.product.images.filter(Is_Primary=True).first()
        if primary:
            return primary.Image_URL
        first = obj.product.images.first()
        if first:
            return first.Image_URL
        if obj.product.image:
            return obj.product.image.url
        return None


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
    order_status = serializers.CharField()
    total_amount = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    details = OrderDetailSerializer(many=True, read_only=True)
    payment = PaymentSerializer(read_only=True)

    owner_name = serializers.SerializerMethodField()
    delivery_date = serializers.SerializerMethodField()
    address = serializers.SerializerMethodField()
    customer_name = serializers.SerializerMethodField()
    customer_phone = serializers.SerializerMethodField()
    tracking_number = serializers.SerializerMethodField()

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
            "order_status",
            "total_amount",
            "delivery_date",
            "tracking_number",
            "address",
            "details",
            "payment",
        ]
        read_only_fields = [
            "order_id",
            "order_date",
            "total_amount",
            "customer_name",
            "customer_phone",
            "owner_name",
            "delivery_date",
            "tracking_number",
            "address",
            "details",
            "payment",
        ]

    def get_customer_name(self, obj):
        if not obj.customer:
            return None
        return f"{obj.customer.FirstName} {obj.customer.LastName}"

    def get_customer_phone(self, obj):
        if not obj.customer:
            return None
        return obj.customer.PhoneNumber

    def get_tracking_number(self, obj):
        delivery = Delivery.objects.filter(order=obj.order_id).first()
        if delivery:
            return delivery.tracking_number
        return None

    def get_owner_name(self, obj):
        if not obj.owner:
            return None
        return f"{obj.owner.EFirstName} {obj.owner.ELastName}"

    def get_delivery_date(self, obj):
        delivery = Delivery.objects.filter(order=obj.order_id).first()
        if delivery and delivery.delivery_date:
            return str(delivery.delivery_date)
        return None

    def get_address(self, obj):
        delivery = Delivery.objects.filter(order=obj.order_id).first()
        if not delivery:
            return None

        addr = CustomerAddress.objects.filter(AddressID=delivery.address).first()
        if not addr:
            return None

        parts = [
            addr.HouseNo,
            addr.Street,
            addr.SubDistrict,
            addr.District,
            addr.Province,
            addr.ZipCode,
        ]
        return ", ".join(str(part) for part in parts if part)

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if data.get("order_status") == "In transit":
            data["order_status"] = "In_transit"
        return data

    def to_internal_value(self, data):
        if data.get("order_status") == "In_transit":
            data = data.copy()
            data["order_status"] = "In transit"
        return super().to_internal_value(data)
