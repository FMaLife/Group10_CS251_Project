from rest_framework.routers import DefaultRouter
from .views import (
    SupplierViewSet,
    WarehouseViewSet,
    WarehouseLocationViewSet,
    RestockOrderViewSet,
    RestockDetailViewSet,
)

router = DefaultRouter()
router.register(r"suppliers", SupplierViewSet, basename="supplier")
router.register(r"warehouses", WarehouseViewSet, basename="warehouse")
router.register(r"locations", WarehouseLocationViewSet, basename="location")
router.register(r"restocks", RestockOrderViewSet, basename="restock")
router.register(r"restock-details", RestockDetailViewSet, basename="restock-detail")

urlpatterns = router.urls