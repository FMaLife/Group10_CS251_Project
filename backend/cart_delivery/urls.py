from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CartClearView, CartItemViewSet, CartView, DeliveryViewSet

router = DefaultRouter()
router.register(r"cart/items", CartItemViewSet, basename="cart-items")
router.register(r"deliveries", DeliveryViewSet, basename="deliveries")

urlpatterns = [
    path("cart/", CartView.as_view(), name="cart"),
    path("cart/<int:cart_id>/clear/", CartClearView.as_view(), name="cart-clear"),
    path("", include(router.urls)),
]
