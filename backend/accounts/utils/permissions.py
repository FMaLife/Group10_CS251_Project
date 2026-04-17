"""
permissions.py — session decorators
import models จาก customers และ employees app
"""
from functools import wraps
from django.http import JsonResponse


def _error(msg: str, status: int) -> JsonResponse:
    return JsonResponse({"error": msg}, status=status)


def customer_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        customer_id = request.session.get("customer_id")
        if not customer_id:
            return _error("Authentication required", 401)
        from customers.models import Customer
        try:
            request.customer = Customer.objects.get(
                CustomerID=customer_id, is_active=True
            )
        except Customer.DoesNotExist:
            request.session.flush()
            return _error("Customer not found or account deactivated", 401)
        return view_func(request, *args, **kwargs)
    return wrapper


def employee_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        employee_id = request.session.get("employee_id")
        if not employee_id:
            return _error("Authentication required", 401)
        from employees.models import Employee
        try:
            request.employee = Employee.objects.get(
                EmployeeID=employee_id, is_active=True
            )
        except Employee.DoesNotExist:
            request.session.flush()
            return _error("Employee not found or account deactivated", 401)
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        employee_id = request.session.get("employee_id")
        if not employee_id:
            return _error("Authentication required", 401)
        from employees.models import Employee
        try:
            emp = Employee.objects.get(EmployeeID=employee_id, is_active=True)
        except Employee.DoesNotExist:
            request.session.flush()
            return _error("Employee not found or account deactivated", 401)
        if emp.role != "Admin":
            return _error("Admin access required", 403)
        request.employee = emp
        return view_func(request, *args, **kwargs)
    return wrapper