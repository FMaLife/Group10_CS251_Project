from django.urls import path
from . import views
from accounts.views.auth_views import employee_login, employee_logout


urlpatterns = [
    path("", views.login_page, name="home"),
    path("login/", employee_login),
    path("logout/", employee_logout),

    path('product/', views.product, name='product'),    
    path('supplier/', views.supplier, name='supplier'),
    path('category/', views.category, name='category'),
    path('warehouse/', views.warehouse, name='warehouse'),
    path('location/', views.location, name='location'),
    path('purchase_order/', views.purchase_order, name='purchase_order'),
    path('sales_order/', views.sales_order, name='sales_order'),
    path('employee/', views.employee, name='employee'),
    path('payment/', views.payment, name='payment'),

    path("delete/<str:model>/<int:id>/", views.delete_item, name="delete_item"),
    path("edit/<str:model>/<int:id>/", views.edit_item, name="edit_item"),
    path("detail/<str:model>/<int:id>/", views.detail_item, name="detail_item"),
    path("add/<str:model>/", views.add_item, name="add_item"),
    ]
