import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError

from accounts.utils.auth import hash_password, verify_password
from accounts.utils.permissions import customer_required, employee_required
from accounts.utils.validators import (
    validate_email, validate_phone, validate_password, collect_errors,
)


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

    try:
        customer = Customer.objects.create(
            FirstName=first_name, LastName=last_name,
            Email=email, Password=hash_password(password),
            PhoneNumber=phones,
        )
    except IntegrityError:
        return JsonResponse({"error": "Email already registered"}, status=409)

    request.session.cycle_key()
    request.session["customer_id"] = customer.CustomerID
    request.session["user_type"]   = "customer"

    return JsonResponse({
        "message": "Registered successfully",
        "customer": {
            "customerID": customer.CustomerID, "firstName": customer.FirstName,
            "lastName": customer.LastName, "email": customer.Email,
        },
    }, status=201)


@require_http_methods(["POST"])
def customer_login(request):
    body, err = _parse(request)
    if err:
        return err

    from customers.models import Customer

    email    = body.get("email",    "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    try:
        customer = Customer.objects.get(Email=email)
    except Customer.DoesNotExist:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not customer.is_active:
        return JsonResponse({"error": "Account is deactivated"}, status=401)
    if not verify_password(password, customer.Password):
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    request.session.cycle_key()
    request.session["customer_id"] = customer.CustomerID
    request.session["user_type"]   = "customer"

    return JsonResponse({
        "message": "Login successful",
        "customer": {
            "customerID": customer.CustomerID, "firstName": customer.FirstName,
            "lastName": customer.LastName, "email": customer.Email,
        },
    })


@require_http_methods(["POST"])
@customer_required
def customer_logout(request):
    request.session.flush()
    return JsonResponse({"message": "Logged out successfully"})


# Employee

@require_http_methods(["POST"])
def employee_login(request):
    body, err = _parse(request)
    if err:
        return err

    from employees.models import Employee

    email    = body.get("email",    "").strip().lower()
    password = body.get("password", "")

    if not email or not password:
        return JsonResponse({"error": "Email and password are required"}, status=400)

    try:
        emp = Employee.objects.get(EEmail=email)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    if not emp.is_active:
        return JsonResponse({"error": "Account is deactivated"}, status=401)
    if not verify_password(password, emp.EPassword):
        return JsonResponse({"error": "Invalid email or password"}, status=401)

    request.session.cycle_key()
    request.session["employee_id"] = emp.EmployeeID
    request.session["user_type"]   = "employee"
    request.session["role"]        = emp.role

    return JsonResponse({
        "message": "Login successful",
        "employee": {
            "employeeID": emp.EmployeeID, "firstName": emp.EFirstName,
            "lastName": emp.ELastName, "role": emp.role, "email": emp.EEmail,
        },
    })


@require_http_methods(["POST"])
@employee_required
def employee_logout(request):
    request.session.flush()
    return JsonResponse({"message": "Logged out successfully"})