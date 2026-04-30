from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/accounts/", include("accounts.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/cart/", include("cart_delivery.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/stock/", include("stock.urls")),
    path("api/orders/", include("order_payment.urls")),
]
