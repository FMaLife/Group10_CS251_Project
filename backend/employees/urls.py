from django.urls import path
from .views import (
    get_profile, list_employees, get_employee,
    create_employee, update_role,
    get_pending_orders, get_all_orders,
)

urlpatterns = [
    path("profile",                  get_profile,        name="employee-profile"),
    path("",                         list_employees,     name="employee-list"),
    path("<int:employee_id>/",       get_employee,       name="employee-detail"),
    path("create",                   create_employee,    name="employee-create"),
    path("<int:employee_id>/role",   update_role,        name="employee-role"),
    path("orders/pending",           get_pending_orders, name="employee-orders-pending"),
    path("orders",                   get_all_orders,     name="employee-orders-all"),
]