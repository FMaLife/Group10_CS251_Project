from django.urls import path
from . import views

urlpatterns = [

    # ── Category ──────────────────────────────────────
    path('categories/', views.category_list, name='category-list'),
    path('categories/create/', views.category_create, name='category-create'),
    path('categories/<int:categoryID>/', views.category_detail, name='category-detail'),
    path('categories/<int:categoryID>/products/', views.category_products, name='category-products'),

    # ── Product ───────────────────────────────────────
    path('', views.product_list, name='product-list'),
    path('create/', views.product_create, name='product-create'),
    path('<int:productID>/', views.product_detail, name='product-detail'),
    path('search/', views.product_search, name='product-search'),
    path('low-stock/', views.product_low_stock, name='product-low-stock'),
    path('by-category/<int:categoryID>/', views.product_by_category, name='product-by-category'),
    path('<int:productID>/location/', views.product_location, name='product-location'),
    path('<int:productID>/set-active/', views.product_set_active, name='product-set-active'),
    path('<int:productID>/update-location/', views.product_update_location, name='product-update-location'),
    path('<int:productID>/update-category/', views.product_update_category, name='product-update-category'),

    # ── ProductImage ──────────────────────────────────
    path('<int:productID>/images/', views.image_list_by_product, name='image-list'),
    path('<int:productID>/images/upload/', views.image_upload, name='image-upload'),
    path('<int:productID>/images/primary/', views.image_get_primary, name='image-primary'),
    path('images/<int:imageID>/set-primary/', views.image_set_primary, name='image-set-primary'),
    path('images/<int:imageID>/delete/', views.image_delete, name='image-delete'),
]