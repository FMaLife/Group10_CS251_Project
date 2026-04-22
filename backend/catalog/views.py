from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, IsAdminUser, AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer, CategoryCreateSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer, ProductImageUploadSerializer,
)


# ═══════════════════════════════════════════
# CATEGORY
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def category_list(request):
    """GET /api/catalog/categories/"""
    categories = Category.getAll()
    serializer = CategorySerializer(categories, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def category_create(request):
    """POST /api/catalog/categories/create/"""
    serializer = CategoryCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            category = Category.create(categoryName=serializer.validated_data['CategoryName'])
            return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def category_detail(request, categoryID):
    """GET/PUT/DELETE /api/catalog/categories/<id>/"""
    try:
        category = Category.getById(categoryID)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CategorySerializer(category).data)

    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = CategoryCreateSerializer(data=request.data)
        if serializer.is_valid():
            category.update(categoryName=serializer.validated_data['CategoryName'])
            return Response(CategorySerializer(category).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        try:
            category.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([AllowAny])
def category_products(request, categoryID):
    """GET /api/catalog/categories/<id>/products/"""
    page = request.query_params.get('page')
    products = Category.getProductsByCategory(categoryID=categoryID, page=page)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


# ═══════════════════════════════════════════
# PRODUCT
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def product_list(request):
    """GET /api/catalog/?page=1&pageSize=10"""
    page = request.query_params.get('page')
    pageSize = int(request.query_params.get('pageSize', 10))
    products = Product.getAll(page=page, pageSize=pageSize)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def product_create(request):
    """POST /api/catalog/create/"""
    serializer = ProductCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        product = Product.create(productData=serializer.validated_data)
        return Response(ProductDetailSerializer(product).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def product_detail(request, productID):
    """GET/PUT/DELETE /api/catalog/<id>/"""
    try:
        product = Product.getById(productID)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductDetailSerializer(product).data)

    if not request.user.is_staff:
        return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = ProductCreateUpdateSerializer(data=request.data, partial=True)
        if serializer.is_valid():
            product.update(productData=serializer.validated_data)
            return Response(ProductDetailSerializer(product).data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    if request.method == 'DELETE':
        product.setActiveStatus(False)
        return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_search(request):
    """GET /api/catalog/search/?keyword=sofa"""
    keyword = request.query_params.get('keyword', '')
    if not keyword:
        return Response({'error': 'keyword is required'}, status=status.HTTP_400_BAD_REQUEST)
    products = Product.search(keyword=keyword)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def product_low_stock(request):
    """GET /api/catalog/low-stock/?threshold=5"""
    threshold = int(request.query_params.get('threshold', 5))
    products = Product.getLowStock(threshold=threshold)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([AllowAny])
def product_by_category(request, categoryID):
    """GET /api/catalog/by-category/<categoryID>/"""
    products = Product.getByCategory(categoryID=categoryID)
    serializer = ProductListSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def product_location(request, productID):
    """GET /api/catalog/<id>/location/"""
    try:
        location = Product.getLocation(productID=productID)
        if location is None:
            return Response({'location': None})
        return Response({
            'LocationID': location.LocationID,
            'WarehouseID': location.WarehouseID_id,
            'Aisle': location.Aisle,
            'Zone': location.Zone,
            'Bin': location.Bin,
        })
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def product_set_active(request, productID):
    """PATCH /api/catalog/<id>/set-active/"""
    try:
        product = Product.getById(productID)
        is_active = request.data.get('is_active')
        if is_active is None:
            return Response({'error': 'is_active is required'}, status=status.HTTP_400_BAD_REQUEST)
        product.setActiveStatus(is_active=bool(is_active))
        return Response({'success': True, 'is_active': product.is_active})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def product_update_location(request, productID):
    """PATCH /api/catalog/<id>/update-location/"""
    try:
        product = Product.getById(productID)
        locationID = request.data.get('locationID')
        product.updateLocation(locationID=locationID)
        return Response({'success': True})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def product_update_category(request, productID):
    """PATCH /api/catalog/<id>/update-category/"""
    try:
        product = Product.getById(productID)
        categoryID = request.data.get('categoryID')
        product.updateCategory(categoryID=categoryID)
        return Response({'success': True})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


# ═══════════════════════════════════════════
# PRODUCT IMAGE
# ═══════════════════════════════════════════

@api_view(['GET'])
@permission_classes([AllowAny])
def image_list_by_product(request, productID):
    """GET /api/catalog/<id>/images/"""
    images = ProductImage.getByProduct(productID=productID)
    serializer = ProductImageSerializer(images, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def image_upload(request, productID):
    """POST /api/catalog/<id>/images/upload/"""
    serializer = ProductImageUploadSerializer(data=request.data)
    if serializer.is_valid():
        image = ProductImage.upload(
            productID=productID,
            imageURL=serializer.validated_data['imageURL'],
            isPrimary=serializer.validated_data.get('isPrimary', False)
        )
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def image_delete(request, imageID):
    """DELETE /api/catalog/images/<imageID>/delete/"""
    try:
        image = ProductImage.objects.get(pk=imageID)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def image_set_primary(request, imageID):
    """PATCH /api/catalog/images/<imageID>/set-primary/"""
    try:
        image = ProductImage.objects.get(pk=imageID)
        image.setPrimary()
        return Response({'success': True, 'primary_imageID': image.ImageID})
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([AllowAny])
def image_get_primary(request, productID):
    """GET /api/catalog/<id>/images/primary/"""
    image = ProductImage.getPrimary(productID=productID)
    if image is None:
        return Response({'primary_image': None})
    return Response(ProductImageSerializer(image).data)