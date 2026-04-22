from django.db import models
from django.core.exceptions import ValidationError


class Category(models.Model):
    CategoryID = models.AutoField(primary_key=True)
    CategoryName = models.CharField(max_length=100, unique=True)

    class Meta:
        db_table = 'Category'

    def __str__(self):
        return self.CategoryName

    # --- Business Logic ---
    @classmethod
    def create(cls, categoryName):
        category = cls(CategoryName=categoryName)
        category.full_clean()
        category.save()
        return category

    def update(self, categoryName):
        self.CategoryName = categoryName
        self.full_clean()
        self.save()
        return self

    def delete(self, *args, **kwargs):
        if self.products.exists():
            raise ValidationError("ไม่สามารถลบ Category ที่มี Product ใช้อยู่ได้")
        super().delete(*args, **kwargs)

    # --- Query ---
    @classmethod
    def getAll(cls):
        return cls.objects.all()

    @classmethod
    def getById(cls, categoryID):
        return cls.objects.get(pk=categoryID)

    @classmethod
    def getProductsByCategory(cls, categoryID, page=None):
        from django.core.paginator import Paginator
        products = Product.objects.filter(CategoryID=categoryID)
        if page:
            paginator = Paginator(products, 10)
            return paginator.get_page(page)
        return products


class Product(models.Model):
    ProductID = models.AutoField(primary_key=True)
    ProductName = models.CharField(max_length=150)
    Price = models.DecimalField(max_digits=12, decimal_places=2)
    StockQuantity = models.IntegerField(default=0)
    Color = models.CharField(max_length=50, blank=True, null=True)
    Height = models.IntegerField(blank=True, null=True)
    Width = models.IntegerField(blank=True, null=True)
    Length = models.IntegerField(blank=True, null=True)
    CategoryID = models.ForeignKey(
        Category,
        on_delete=models.RESTRICT,
        db_column='CategoryID',
        related_name='products'
    )
    location = models.ForeignKey(
    'stock.WarehouseLocation',
    on_delete=models.SET_NULL,
    null=True,
    blank=True,
    db_column='location_id',
    related_name='products'
)
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'Product'

    def __str__(self):
        return self.ProductName

    # --- Business Logic ---
    @classmethod
    def create(cls, productData):
        product = cls(**productData)
        product.full_clean()
        product.save()
        return product

    def update(self, productData):
        for field, value in productData.items():
            setattr(self, field, value)
        self.full_clean()
        self.save()
        return self

    def deductStock(self, qty):
        from django.db import transaction
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=self.ProductID)
            if product.StockQuantity < qty:
                raise ValidationError(f"Stock ไม่พอ: มี {product.StockQuantity} ต้องการ {qty}")
            product.StockQuantity -= qty
            product.save(update_fields=['StockQuantity'])
            self.StockQuantity = product.StockQuantity

    def addStock(self, qty):
        from django.db import transaction
        with transaction.atomic():
            product = Product.objects.select_for_update().get(pk=self.ProductID)
            product.StockQuantity += qty
            product.save(update_fields=['StockQuantity'])
            self.StockQuantity = product.StockQuantity

    def uploadImage(self, imageURL, isPrimary=False):
        return ProductImage.upload(productID=self.ProductID, imageURL=imageURL, isPrimary=isPrimary)

    # --- State Management ---
    def setActiveStatus(self, is_active):
        self.is_active = is_active
        self.save(update_fields=['is_active'])

    def updateLocation(self, locationID):
        self.LocationID_id = locationID
        self.save(update_fields=['LocationID'])

    def updateCategory(self, categoryID):
        self.CategoryID_id = categoryID
        self.save(update_fields=['CategoryID'])

    # --- Query ---
    @classmethod
    def getAll(cls, page=None, pageSize=10):
        from django.core.paginator import Paginator
        qs = cls.objects.filter(is_active=True).prefetch_related('images')
        if page:
            paginator = Paginator(qs, pageSize)
            return paginator.get_page(page)
        return qs

    @classmethod
    def getById(cls, productID):
        return cls.objects.prefetch_related('images').get(pk=productID)

    @classmethod
    def getByCategory(cls, categoryID):
        return cls.objects.filter(CategoryID=categoryID, is_active=True)

    @classmethod
    def search(cls, keyword):
        return cls.objects.filter(ProductName__icontains=keyword, is_active=True)

    @classmethod
    def getLowStock(cls, threshold=5):
        return cls.objects.filter(StockQuantity__lte=threshold, is_active=True)

    @classmethod
    def getLocation(cls, productID):
        product = cls.objects.select_related('LocationID').get(pk=productID)
        return product.LocationID


class ProductImage(models.Model):
    ImageID = models.AutoField(primary_key=True)
    ProductID = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        db_column='ProductID',
        related_name='images'
    )
    Image_URL = models.CharField(max_length=500)
    Is_Primary = models.SmallIntegerField(default=0)

    class Meta:
        db_table = 'ProductImage'

    def __str__(self):
        return f"Image {self.ImageID} for Product {self.ProductID_id}"

    # --- Business Logic ---
    @classmethod
    def upload(cls, productID, imageURL, isPrimary=False):
        if isPrimary:
            cls.clearPrimary(productID)
        image = cls(
            ProductID_id=productID,
            Image_URL=imageURL,
            Is_Primary=1 if isPrimary else 0
        )
        image.save()
        return image

    # --- State Management ---
    def setPrimary(self):
        ProductImage.clearPrimary(self.ProductID_id)
        self.Is_Primary = 1
        self.save(update_fields=['Is_Primary'])

    @classmethod
    def clearPrimary(cls, productID):
        cls.objects.filter(ProductID=productID, Is_Primary=1).update(Is_Primary=0)

    # --- Query ---
    @classmethod
    def getByProduct(cls, productID):
        return cls.objects.filter(ProductID=productID)

    @classmethod
    def getPrimary(cls, productID):
        return cls.objects.filter(ProductID=productID, Is_Primary=1).first()