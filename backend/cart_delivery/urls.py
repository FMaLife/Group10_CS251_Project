"""
URL routes for cart_delivery — mounted under /api/cart/ in the project urls.

Resulting endpoints:
  GET    /api/cart/?customer=<id>             get/auto-create customer's cart
  DELETE /api/cart/<cart_id>/clear/           empty the cart

  GET    /api/cart/items/                     list items (filter ?cart=<id>)
  POST   /api/cart/items/                     add item
  GET    /api/cart/items/<id>/                detail
  PATCH  /api/cart/items/<id>/                update
  DELETE /api/cart/items/<id>/                remove

  GET    /api/cart/deliveries/                list deliveries
  POST   /api/cart/deliveries/                create delivery
  GET    /api/cart/deliveries/<id>/           detail
  PATCH  /api/cart/deliveries/<id>/status/    update status (employee)
  GET    /api/cart/deliveries/by-order/<id>/  track by order id
"""
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from .views import CartClearView, CartItemViewSet, CartView, DeliveryViewSet

router = DefaultRouter()
router.register(r"items", CartItemViewSet, basename="cart-items")
router.register(r"deliveries", DeliveryViewSet, basename="deliveries")

urlpatterns = [
    path("", CartView.as_view(), name="cart"),
    path("<int:cart_id>/clear/", CartClearView.as_view(), name="cart-clear"),
    path("", include(router.urls)),
]
