from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from django.core.exceptions import ValidationError

from .models import Category, Product, ProductImage
from .serializers import (
    CategorySerializer, CategoryCreateSerializer,
    ProductListSerializer, ProductDetailSerializer,
    ProductCreateUpdateSerializer,
    ProductImageSerializer, ProductImageUploadSerializer,
)


def _employee_check(request):
    """Return (employee, error_response). error_response is None if OK."""
    employee_id = request.session.get("employee_id")
    if not employee_id:
        return None, Response({"error": "Authentication required"}, status=401)
    from employees.models import Employee
    try:
        emp = Employee.objects.get(EmployeeID=employee_id, is_active=True)
        return emp, None
    except Employee.DoesNotExist:
        return None, Response({"error": "Employee not found or deactivated"}, status=401)


def _admin_check(request):
    """Return (employee, error_response). Only allows Admin role."""
    emp, err = _employee_check(request)
    if err:
        return None, err
    if emp.role != "Admin":
        return None, Response({"error": "Admin access required"}, status=403)
    return emp, None


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
@permission_classes([AllowAny])
def category_create(request):
    """POST /api/catalog/categories/create/"""
    _, err = _admin_check(request)
    if err:
        return err
    serializer = CategoryCreateSerializer(data=request.data)
    if serializer.is_valid():
        try:
            category = Category.create(categoryName=serializer.validated_data['CategoryName'])
            return Response(CategorySerializer(category).data, status=status.HTTP_201_CREATED)
        except ValidationError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def category_detail(request, categoryID):
    """GET/PUT/DELETE /api/catalog/categories/<id>/"""
    try:
        category = Category.getById(categoryID)
    except Category.DoesNotExist:
        return Response({'error': 'Category not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(CategorySerializer(category).data)

    _, err = _admin_check(request)
    if err:
        return err

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
@permission_classes([AllowAny])
def product_create(request):
    """POST /api/catalog/create/"""
    _, err = _admin_check(request)
    if err:
        return err
    serializer = ProductCreateUpdateSerializer(data=request.data)
    if serializer.is_valid():
        product = Product.create(productData=serializer.validated_data)
        return Response(ProductDetailSerializer(product).data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([AllowAny])
def product_detail(request, productID):
    """GET/PUT/DELETE /api/catalog/<id>/"""
    try:
        product = Product.getById(productID)
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        return Response(ProductDetailSerializer(product).data)

    _, err = _admin_check(request)
    if err:
        return err

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
@permission_classes([AllowAny])
def product_low_stock(request):
    """GET /api/catalog/low-stock/?threshold=5"""
    _, err = _employee_check(request)
    if err:
        return err
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
@permission_classes([AllowAny])
def product_location(request, productID):
    """GET /api/catalog/<id>/location/"""
    try:
        location = Product.getLocation(productID=productID)
        if location is None:
            return Response({'location': None})
        return Response({
            'location_id': location.location_id,
            'warehouse_id': location.warehouse_id,
            'aisle': location.aisle,
            'zone': location.zone,
            'bin': location.bin,
        })
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def product_set_active(request, productID):
    """PATCH /api/catalog/<id>/set-active/"""
    _, err = _admin_check(request)
    if err:
        return err
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
@permission_classes([AllowAny])
def product_update_location(request, productID):
    """PATCH /api/catalog/<id>/update-location/"""
    _, err = _admin_check(request)
    if err:
        return err
    try:
        product = Product.getById(productID)
        locationID = request.data.get('locationID')
        product.updateLocation(locationID=locationID)
        return Response({'success': True})
    except Product.DoesNotExist:
        return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def product_update_category(request, productID):
    """PATCH /api/catalog/<id>/update-category/"""
    _, err = _admin_check(request)
    if err:
        return err
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
@permission_classes([AllowAny])
def image_upload(request, productID):
    """POST /api/catalog/<id>/images/upload/"""
    _, err = _admin_check(request)
    if err:
        return err
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
@permission_classes([AllowAny])
def image_delete(request, imageID):
    """DELETE /api/catalog/images/<imageID>/delete/"""
    _, err = _admin_check(request)
    if err:
        return err
    try:
        image = ProductImage.objects.get(pk=imageID)
        image.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except ProductImage.DoesNotExist:
        return Response({'error': 'Image not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['PATCH'])
@permission_classes([AllowAny])
def image_set_primary(request, imageID):
    """PATCH /api/catalog/images/<imageID>/set-primary/"""
    _, err = _admin_check(request)
    if err:
        return err
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
