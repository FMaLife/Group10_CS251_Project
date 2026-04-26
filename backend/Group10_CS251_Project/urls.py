from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    # NOTE: apps อื่นๆ ของเพื่อนใน team จะ uncomment ตอน merge
    # path("api/catalog/", include("catalog.urls")),
    # path("api/orders/", include("order_payment.urls")),
    # path("api/stock/", include("stock.urls")),
    # path("api/accounts/", include("accounts.urls")),
    path("api/cart/", include("cart_delivery.urls")),
]
