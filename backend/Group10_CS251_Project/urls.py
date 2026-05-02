from django.contrib import admin
from django.urls import path, include, re_path
from django.views.static import serve
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static

FRONTEND_ROOT = settings.BASE_DIR.parent / "frontend"

def debug_session(request):
    return JsonResponse({
        "cookies": dict(request.COOKIES),
        "session_key": request.session.session_key,
        "session_data": dict(request.session),
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path('', include('employee.urls')),
    path("api/accounts/", include("accounts.urls")),
    path("api/customers/", include("customers.urls")),
    path("api/employees/", include("employees.urls")),
    path("api/cart/", include("cart_delivery.urls")),
    path("api/catalog/", include("catalog.urls")),
    path("api/stock/", include("stock.urls")),
    path("api/orders/", include("order_payment.urls")),
    path("api/debug-session/", debug_session),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += [
        re_path(r"^frontend/(?P<path>.*)$", serve, {"document_root": FRONTEND_ROOT}),
    ]
