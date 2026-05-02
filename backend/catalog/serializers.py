from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    categoryId   = serializers.IntegerField(source='CategoryID', read_only=True)
    categoryName = serializers.CharField(source='CategoryName', read_only=True)

    class Meta:
        model  = Category
        fields = ['categoryId', 'categoryName']


class CategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Category
        fields = ['CategoryName']


class ProductImageSerializer(serializers.ModelSerializer):
    imageId    = serializers.IntegerField(source='ImageID', read_only=True)
    productId  = serializers.IntegerField(source='ProductID_id', read_only=True)
    imageUrl   = serializers.CharField(source='Image_URL', read_only=True)
    isPrimary  = serializers.IntegerField(source='Is_Primary', read_only=True)

    class Meta:
        model  = ProductImage
        fields = ['imageId', 'productId', 'imageUrl', 'isPrimary']


class ProductImageUploadSerializer(serializers.Serializer):
    imageURL  = serializers.CharField(max_length=500)
    isPrimary = serializers.BooleanField(default=False)


class ProductListSerializer(serializers.ModelSerializer):
    productId    = serializers.IntegerField(source='ProductID',    read_only=True)
    productName  = serializers.CharField(source='ProductName',     read_only=True)
    price        = serializers.DecimalField(source='Price',        max_digits=12, decimal_places=2, read_only=True)
    stockQuantity= serializers.IntegerField(source='StockQuantity',read_only=True)
    color        = serializers.CharField(source='Color',           read_only=True)
    height       = serializers.IntegerField(source='Height',       read_only=True)
    width        = serializers.IntegerField(source='Width',        read_only=True)
    length       = serializers.IntegerField(source='Length',       read_only=True)
    categoryId   = serializers.IntegerField(source='category_id',  read_only=True)
    categoryName = serializers.CharField(source='category.CategoryName', read_only=True)
    primaryImage = serializers.SerializerMethodField()

    class Meta:
        model  = Product
        fields = [
            'productId', 'productName', 'price', 'stockQuantity',
            'color', 'height', 'width', 'length',
            'categoryId', 'categoryName', 'location',
            'is_active', 'primaryImage',
        ]

    def get_primaryImage(self, obj):
        primary = obj.images.filter(Is_Primary=1).first()
        if primary:
            return ProductImageSerializer(primary).data
        first = obj.images.first()
        if first:
            return ProductImageSerializer(first).data
        if obj.image:
            request = self.context.get('request')
            url = request.build_absolute_uri(obj.image.url) if request else obj.image.url
            return {'imageId': None, 'productId': obj.pk, 'imageUrl': url, 'isPrimary': 0}
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    productId    = serializers.IntegerField(source='ProductID',    read_only=True)
    productName  = serializers.CharField(source='ProductName',     read_only=True)
    price        = serializers.DecimalField(source='Price',        max_digits=12, decimal_places=2, read_only=True)
    stockQuantity= serializers.IntegerField(source='StockQuantity',read_only=True)
    color        = serializers.CharField(source='Color',           read_only=True)
    height       = serializers.IntegerField(source='Height',       read_only=True)
    width        = serializers.IntegerField(source='Width',        read_only=True)
    length       = serializers.IntegerField(source='Length',       read_only=True)
    categoryId   = serializers.IntegerField(source='category_id',  read_only=True)
    categoryName = serializers.CharField(source='category.CategoryName', read_only=True)
    images       = ProductImageSerializer(many=True, read_only=True)

    class Meta:
        model  = Product
        fields = [
            'productId', 'productName', 'price', 'stockQuantity',
            'color', 'height', 'width', 'length',
            'categoryId', 'categoryName', 'location',
            'is_active', 'images',
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    categoryId = serializers.IntegerField(source='category_id')

    class Meta:
        model  = Product
        fields = [
            'ProductName', 'Price', 'StockQuantity',
            'Color', 'Height', 'Width', 'Length',
            'categoryId', 'location',
        ]
