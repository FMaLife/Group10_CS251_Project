"""
Models for the Cart & Delivery domain.

Reference: CS251 Project Topic — Data Dictionary (Phase 1).

Note:
- Customer, Product, Sale_Order and Customer_Address are owned by other team
  branches. Their FKs are stored as plain integer fields here so this app can
  migrate independently. They will be converted to real ForeignKey relations
  once the apps are merged into `backend/all`.
"""
from django.db import models


class Cart(models.Model):
    """ตะกร้าสินค้า — ลูกค้า 1 คน มีตะกร้าได้ 1 ใบ."""

    cart_id = models.AutoField(primary_key=True, db_column="CartID")
    # FK -> Customer.CustomerID (owned by accounts app). One-to-one in spec.
    customer = models.IntegerField(unique=True, db_column="CustomerID")
    create_date = models.DateTimeField(auto_now_add=True, db_column="CreateDate")
    last_updated = models.DateTimeField(auto_now=True, db_column="LastUpdated")

    class Meta:
        db_table = "Cart"
        verbose_name = "Cart"
        verbose_name_plural = "Carts"

    def __str__(self) -> str:
        return f"Cart#{self.cart_id} (customer={self.customer})"


class CartItem(models.Model):
    """รายการสินค้าในตะกร้า — ตะกร้า 1 ใบมีหลายรายการได้."""

    item_id = models.AutoField(primary_key=True, db_column="CartItemID")
    cart = models.ForeignKey(
        Cart,
        on_delete=models.CASCADE,
        related_name="items",
        db_column="CartID",
    )
    # FK -> Product.ProductID (owned by catalog app)
    product = models.IntegerField(db_column="ProductID")
    quantity = models.PositiveIntegerField(default=1, db_column="Quantity")
    cartitem_total = models.DecimalField(
        max_digits=12, decimal_places=2, default=0, db_column="CartItem_Total"
    )
    added_date = models.DateTimeField(auto_now_add=True, db_column="AddedDate")

    class Meta:
        db_table = "Cart_Item"
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        constraints = [
            models.UniqueConstraint(
                fields=["cart", "product"], name="uq_cart_product"
            ),
            models.CheckConstraint(
                check=models.Q(quantity__gt=0), name="ck_cartitem_qty_positive"
            ),
        ]

    def __str__(self) -> str:
        return f"CartItem#{self.item_id} cart={self.cart_id} product={self.product} x{self.quantity}"


class Delivery(models.Model):
    """ข้อมูลการจัดส่งสินค้า ผูกกับคำสั่งซื้อ (Sale_Order) หนึ่งบิล."""

    class Status(models.TextChoices):
        PENDING = "PENDING", "รอการจัดส่ง"
        SHIPPED = "SHIPPED", "จัดส่งแล้ว"
        IN_TRANSIT = "IN_TRANSIT", "อยู่ระหว่างจัดส่ง"
        DELIVERED = "DELIVERED", "ส่งสำเร็จ"
        FAILED = "FAILED", "จัดส่งไม่สำเร็จ"
        CANCELLED = "CANCELLED", "ยกเลิก"

    class Courier(models.TextChoices):
        KERRY = "KERRY", "Kerry Express"
        FLASH = "FLASH", "Flash Express"
        THAILAND_POST = "THAILAND_POST", "Thailand Post"
        J_AND_T = "J_AND_T", "J&T Express"
        SHOPEE = "SHOPEE", "Shopee Express"
        OTHER = "OTHER", "อื่นๆ"

    delivery_id = models.AutoField(primary_key=True, db_column="DeliveryID")
    # FK -> Sale_Order.OrderID (owned by order_payment app). One delivery per order.
    order = models.IntegerField(unique=True, db_column="OrderID")
    # FK -> Customer_Address.AddressID (owned by accounts app)
    address = models.IntegerField(db_column="AddressID")
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
        db_column="Status",
    )
    # ชื่อบริษัทขนส่ง (data dict: CourierName) — exposed as `delivery_name` in API per team
    delivery_name = models.CharField(
        max_length=30,
        choices=Courier.choices,
        blank=True,
        default="",
        db_column="CourierName",
    )
    tracking_number = models.CharField(
        max_length=64, blank=True, default="", db_column="TrackingNumber"
    )
    delivery_date = models.DateTimeField(null=True, blank=True, db_column="DeliveryDate")
    created_at = models.DateTimeField(auto_now_add=True, db_column="CreatedAt")
    updated_at = models.DateTimeField(auto_now=True, db_column="UpdatedAt")

    class Meta:
        db_table = "Delivery"
        verbose_name = "Delivery"
        verbose_name_plural = "Deliveries"

    def __str__(self) -> str:
        return f"Delivery#{self.delivery_id} order={self.order} status={self.status}"
