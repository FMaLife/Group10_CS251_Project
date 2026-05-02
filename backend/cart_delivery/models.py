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

    # Data dict: column name is `Item_ID`
    item_id = models.AutoField(primary_key=True, db_column="Item_ID")
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
        max_digits=12,
        decimal_places=2,
        default=0,
        db_column="CartItem_Total",
        help_text="ราคารวมของรายการนี้ (Price * Quantity)",
    )
    added_date = models.DateTimeField(auto_now_add=True, db_column="AddedDate")

    class Meta:
        db_table = "Cart_Item"
        verbose_name = "Cart Item"
        verbose_name_plural = "Cart Items"
        constraints = [
            models.UniqueConstraint(fields=["cart", "product"], name="uq_cart_product"),
            models.CheckConstraint(
                check=models.Q(quantity__gt=0), name="ck_cartitem_qty_positive"
            ),
        ]

    def save(self, *args, **kwargs):
        """คำนวณ cartitem_total อัตโนมัติก่อนบันทึก."""
        from catalog.models import Product
        try:
            price = Product.objects.get(pk=self.product).Price
        except Product.DoesNotExist:
            price = 0
        self.cartitem_total = price * self.quantity
        super().save(*args, **kwargs)

    def __str__(self) -> str:
        return f"CartItem#{self.item_id} cart={self.cart_id} product={self.product} x{self.quantity}"


class Delivery(models.Model):
    """ข้อมูลการจัดส่งสินค้า ผูกกับคำสั่งซื้อ (Sale_Order) หนึ่งบิล.

    Schema ตรงตาม Data Dictionary (Phase 2):
        OrderID         INT          PK, FK -> Sale_Order.OrderID
        AddressID       INT          FK -> Customer_Address.AddressID
        DeliveryName    VARCHAR(150) ชื่อบริษัทขนส่ง
        TrackingNumber  VARCHAR(13)  เลขติดตามพัสดุ
        DeliveryDate    DATE         วันที่จัดส่ง

    — ไม่มีฟิลด์ Status (ระบบใช้ Sale_Order.OrderStatus แทน; ดู Phase 2 SQL #16)
    — ไม่มี DeliveryID แยกต่างหาก ใช้ OrderID เป็น PK (1:1 กับ Sale_Order)
    — ไม่มี timestamps (CreatedAt/UpdatedAt) — ไม่อยู่ใน data dict
    """

    # PK = OrderID (1 order = 1 delivery). พนักงานจะ UPDATE tracking ผ่าน OrderID (Phase 2 SQL #28).
    order = models.IntegerField(
        primary_key=True,
        db_column="OrderID",
        help_text="FK -> Sale_Order.OrderID",
    )
    address = models.IntegerField(
        db_column="AddressID",
        help_text="FK -> Customer_Address.AddressID",
    )
    delivery_name = models.CharField(
        max_length=150,
        blank=True,
        default="",
        db_column="DeliveryName",
        help_text="ชื่อบริษัทขนส่ง เช่น Kerry, Flash, SCG",
    )
    tracking_number = models.CharField(
        max_length=13,
        blank=True,
        default="",
        db_column="TrackingNumber",
        help_text="เลขติดตามพัสดุ (ได้จากขนส่งหลัง pickup)",
    )
    delivery_date = models.DateField(
        null=True,
        blank=True,
        db_column="DeliveryDate",
        help_text="วันที่จัดส่งสินค้า",
    )

    class Meta:
        db_table = "Delivery"
        verbose_name = "Delivery"
        verbose_name_plural = "Deliveries"

    def __str__(self) -> str:
        return f"Delivery(order={self.order}, tracking={self.tracking_number or '-'})"
