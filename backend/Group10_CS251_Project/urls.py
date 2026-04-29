from django.contrib import admin
from django.urls import path, include

from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path("admin/", admin.site.urls),
    # path("api/catalog/", include("catalog.urls")),
    # path("api/cart/", include("cart_delivery.urls")),
    # path("api/orders/", include("order_payment.urls")),
    # path("api/stock/", include("stock.urls")),
    # path("api/accounts/", include("accounts.urls")),
    path('', include('employee.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
