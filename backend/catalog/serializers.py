from rest_framework import serializers
from .models import Category, Product, ProductImage


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['CategoryID', 'CategoryName']


class CategoryCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ['CategoryName']


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['ImageID', 'ProductID', 'Image_URL', 'Is_Primary']


class ProductImageUploadSerializer(serializers.Serializer):
    imageURL = serializers.CharField(max_length=500)
    isPrimary = serializers.BooleanField(default=False)


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    category_name = serializers.CharField(source='CategoryID.CategoryName', read_only=True)

    class Meta:
        model = Product
        fields = [
            'ProductID', 'ProductName', 'Price', 'StockQuantity',
            'Color', 'Height', 'Width', 'Length',
            'CategoryID', 'category_name', 'location',
            'is_active', 'primary_image'
        ]

    def get_primary_image(self, obj):
        primary = obj.images.filter(Is_Primary=1).first()
        if primary:
            return ProductImageSerializer(primary).data
        return None


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='CategoryID.CategoryName', read_only=True)

    class Meta:
        model = Product
        fields = [
            'ProductID', 'ProductName', 'Price', 'StockQuantity',
            'Color', 'Height', 'Width', 'Length',
            'CategoryID', 'category_name', 'location',
            'is_active', 'images'
        ]


class ProductCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = [
            'ProductName', 'Price', 'StockQuantity',
            'Color', 'Height', 'Width', 'Length',
            'CategoryID', 'location'
        ]