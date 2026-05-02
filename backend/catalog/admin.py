from django.contrib import admin
from .models import Category, Product, ProductImage


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['ProductID', 'ProductName', 'Price', 'StockQuantity', 'category', 'is_active']
    list_filter = ['category', 'is_active']
    search_fields = ['ProductName']


admin.site.register(Category)
admin.site.register(ProductImage)
