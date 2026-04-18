from rest_framework.routers import DefaultRouter
from .views import SaleOrderViewSet, OrderDetailViewSet, PaymentViewSet

router = DefaultRouter()
router.register(r"saleorders", SaleOrderViewSet, basename="saleorder")
router.register(r"details", OrderDetailViewSet, basename="order-detail")
router.register(r"payments", PaymentViewSet, basename="payment")

urlpatterns = router.urls