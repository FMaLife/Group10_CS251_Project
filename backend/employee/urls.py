from django.urls import path
from . import views


urlpatterns = [
    path('', views.product, name='product'),
    path('product/', views.product, name='product'),

    path('supplier/', views.supplier, name='supplier'),
    path('category/', views.category, name='category'),
    path('warehouse/', views.warehouse, name='warehouse'),
    path('location/', views.location, name='location'),
    path('purchase_order/', views.purchase_order, name='purchase_order'),
    path('sales_order/', views.sales_order, name='sales_order'),
    path('employee/', views.employee, name='employee'),
    path('payment/', views.payment, name='payment'),
]
