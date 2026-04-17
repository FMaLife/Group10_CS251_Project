"""
permissions.py — decorators ใช้ Django auth
ไม่เขียน session เอง ใช้ request.user จาก Django แทน
"""
from functools import wraps
from django.http import JsonResponse


def _err(msg, status):
    return JsonResponse({"error": msg}, status=status)


def customer_required(view_func):
    """
    ต้อง login และต้องเป็น Customer
    ใส่ request.customer ให้อัตโนมัติ
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _err("Authentication required", 401)
        if not hasattr(request.user, "customer"):
            return _err("Customer account required", 403)
        request.customer = request.user.customer
        return view_func(request, *args, **kwargs)
    return wrapper


def employee_required(view_func):
    """
    ต้อง login และต้องเป็น Employee (Admin หรือ Staff)
    ใส่ request.employee ให้อัตโนมัติ
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _err("Authentication required", 401)
        if not hasattr(request.user, "employee"):
            return _err("Employee account required", 403)
        request.employee = request.user.employee
        return view_func(request, *args, **kwargs)
    return wrapper


def admin_required(view_func):
    """
    ต้อง login และต้องเป็น Employee ที่มี role=Admin
    ใส่ request.employee ให้อัตโนมัติ
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return _err("Authentication required", 401)
        if not hasattr(request.user, "employee"):
            return _err("Employee account required", 403)
        if request.user.employee.role != "Admin":
            return _err("Admin access required", 403)
        request.employee = request.user.employee
        return view_func(request, *args, **kwargs)
    return wrapper