from django.urls import path
from .views.auth_views import (
    customer_register, customer_login, customer_logout,
    employee_login, employee_logout,
)

urlpatterns = [
    path("customer/register", customer_register, name="customer-register"),
    path("customer/login",    customer_login,    name="customer-login"),
    path("customer/logout",   customer_logout,   name="customer-logout"),
    path("employee/login",    employee_login,    name="employee-login"),
    path("employee/logout",   employee_logout,   name="employee-logout"),
]