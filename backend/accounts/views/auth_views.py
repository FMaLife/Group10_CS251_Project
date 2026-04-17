"""
accounts/views/auth_views.py
register / login / logout — ทั้ง Customer และ Employee
ใช้ Django authenticate() + login() + logout()
"""
import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.contrib.auth import authenticate, login, logout, get_user_model
from django.db import transaction

from accounts.utils.validators import (
    validate_email, validate_phone, validate_password, collect_errors,
)
from accounts.utils.permissions import customer_required, employee_required

User = get_user_model()


def _parse(request):
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON"}, status=400)


# Customer register / login / logout

@require_http_methods(["POST"])
def customer_register(request):
    body, err = _parse(request)
    if err:
        return err

    from customers.models import Customer

    first_name = body.get("firstName", "").strip()
    last_name  = body.get("lastName",  "").strip()
    email      = body.get("email",     "").strip().lower()
    password   = body.get("password",  "")
    phones     = body.get("phoneNumber", [])

    if not first_name:
        return JsonResponse({"error": "firstName is required"}, status=400)
    if not last_name:
        return JsonResponse({"error": "lastName is required"}, status=400)
    if not phones:
        return JsonResponse({"error": "phoneNumber is required"}, status=400)
    if isinstance(phones, str):
        phones = [phones]

    errors = collect_errors(
        email=validate_email(email),
        password=validate_password(password),
        **{f"phone[{i}]": validate_phone(p) for i, p in enumerate(phones)},
    )
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    if User.objects.filter(email=email).exists():
        return JsonResponse({"error": "Email already registered"}, status=409)

    # สร้าง User + Customer ใน transaction เดียว
    with transaction.atomic():
        user = User.objects.create_user(
            username=email,  # ใช้ email เป็น username
            email=email,
            password=password,
        )
        customer = Customer.objects.create(
            user=user,
            FirstName=first_name,
            LastName=last_name,
            PhoneNumber=phones,
        )

    login(request, user)

    return JsonResponse({
        "message": "Registered successfully",
        "customer": {
            "customerID": customer.CustomerID,
            "firstName":  customer.FirstName,
            "lastName":   customer.LastName,
            "email":      user.email,
            "phoneNumber": customer.PhoneNumber,
        },
    }, json_dumps_params={'ensure_ascii': False}, status=201)


@require_http_methods(["POST"])
def customer_login(request):
    body, err = _parse(request)
    if err:
        return err

    email    = body.get("email",    "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    user = authenticate(request, email=email, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not user.is_active:
        return JsonResponse({"error": "Account is deactivated"}, status=401)

    if not hasattr(user, "customer"):
        return JsonResponse({"error": "Not a customer account"}, status=403)

    login(request, user)
    customer = user.customer

    return JsonResponse({
        "message": "Login successful",
        "customer": {
            "customerID":  customer.CustomerID,
            "firstName":   customer.FirstName,
            "lastName":    customer.LastName,
            "email":       user.email,
            "phoneNumber": customer.PhoneNumber,
        },
    })


@require_http_methods(["POST"])
@customer_required
def customer_logout(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})


# Employee login / logout

@require_http_methods(["POST"])
def employee_login(request):
    body, err = _parse(request)
    if err:
        return err

    email    = body.get("email",    "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    user = authenticate(request, email=email, password=password)
    if user is None:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not user.is_active:
        return JsonResponse({"error": "Account is deactivated"}, status=401)

    if not hasattr(user, "employee"):
        return JsonResponse({"error": "Not an employee account"}, status=403)

    login(request, user)
    emp = user.employee

    return JsonResponse({
        "message": "Login successful",
        "employee": {
            "employeeID": emp.EmployeeID,
            "firstName":  emp.EFirstName,
            "lastName":   emp.ELastName,
            "role":       emp.role,
            "email":      user.email,
        },
    })


@require_http_methods(["POST"])
@employee_required
def employee_logout(request):
    logout(request)
    return JsonResponse({"message": "Logged out successfully"})