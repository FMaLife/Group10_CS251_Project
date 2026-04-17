import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import IntegrityError

from employees.models import Employee
from accounts.utils.auth import hash_password
from accounts.utils.permissions import employee_required, admin_required
from accounts.utils.validators import validate_email, validate_password, collect_errors


def _serialize(e: Employee) -> dict:
    return {
        "employeeID": e.EmployeeID,
        "firstName":  e.EFirstName,
        "lastName":   e.ELastName,
        "role":       e.role,
        "phone":      e.EPhone,
        "email":      e.EEmail,
        "isActive":   e.is_active,
    }


def _parse(request):
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON"}, status=400)


@require_http_methods(["GET"])
@employee_required
def get_profile(request):
    return JsonResponse({"employee": _serialize(request.employee)})


@require_http_methods(["GET"])
@admin_required
def list_employees(request):
    qs     = Employee.objects.all()
    role   = request.GET.get("role", "").strip()
    active = request.GET.get("active", "").strip().lower()
    if role in ("Admin", "Staff"):
        qs = qs.filter(role=role)
    if active == "true":
        qs = qs.filter(is_active=True)
    elif active == "false":
        qs = qs.filter(is_active=False)
    return JsonResponse({"employees": [_serialize(e) for e in qs.order_by("EmployeeID")]})


@require_http_methods(["GET"])
@employee_required
def get_employee(request, employee_id):
    is_self = request.employee.EmployeeID == employee_id
    if not is_self and request.employee.role != "Admin":
        return JsonResponse(
            {"error": "Admin access required to view other employees"}, status=403
        )
    try:
        emp = Employee.objects.get(EmployeeID=employee_id)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)
    return JsonResponse({"employee": _serialize(emp)})


@require_http_methods(["POST"])
@admin_required
def create_employee(request):
    body, err = _parse(request)
    if err:
        return err

    first_name = body.get("firstName", "").strip()
    last_name  = body.get("lastName",  "").strip()
    email      = body.get("email",     "").strip().lower()
    password   = body.get("password",  "")
    phone      = body.get("phone",     "").strip()
    role       = body.get("role",      "Staff")

    if not first_name or not last_name or not phone:
        return JsonResponse(
            {"error": "firstName, lastName, phone are required"}, status=400
        )
    if role not in ("Admin", "Staff"):
        return JsonResponse({"error": "role must be Admin or Staff"}, status=400)

    errors = collect_errors(
        email=validate_email(email),
        password=validate_password(password),
    )
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    try:
        emp = Employee.objects.create(
            EFirstName=first_name, ELastName=last_name,
            EEmail=email, EPassword=hash_password(password),
            EPhone=phone, role=role,
        )
    except IntegrityError:
        return JsonResponse({"error": "Email already registered"}, status=409)

    return JsonResponse(
        {"message": "Employee created", "employee": _serialize(emp)}, status=201
    )


@require_http_methods(["PUT"])
@admin_required
def update_role(request, employee_id):
    body, err = _parse(request)
    if err:
        return err

    role = body.get("role", "")
    if role not in ("Admin", "Staff"):
        return JsonResponse({"error": "role must be Admin or Staff"}, status=400)

    try:
        emp = Employee.objects.get(EmployeeID=employee_id, is_active=True)
    except Employee.DoesNotExist:
        return JsonResponse({"error": "Employee not found"}, status=404)

    emp.role = role
    emp.save()
    return JsonResponse({"message": "Role updated", "employee": _serialize(emp)})


@require_http_methods(["GET"])
@employee_required
def get_pending_orders(request):
    try:
        from django.apps import apps
        SaleOrder = apps.get_model("order_payment", "SaleOrder")
    except LookupError:
        return JsonResponse({"error": "Order module not available yet"}, status=503)

    orders = SaleOrder.objects.filter(OrderStatus="Pending").order_by("OrderDate")
    return JsonResponse({"orders": [
        {
            "orderID":     o.OrderID,
            "customerID":  o.CustomerID_id,
            "orderDate":   o.OrderDate.isoformat(),
            "totalAmount": str(o.TotalAmount),
            "orderStatus": o.OrderStatus,
        }
        for o in orders
    ]})


@require_http_methods(["GET"])
@employee_required
def get_all_orders(request):
    try:
        from django.apps import apps
        SaleOrder = apps.get_model("order_payment", "SaleOrder")
    except LookupError:
        return JsonResponse({"error": "Order module not available yet"}, status=503)

    qs        = SaleOrder.objects.all()
    status    = request.GET.get("status")
    date_from = request.GET.get("dateFrom")
    date_to   = request.GET.get("dateTo")

    if status:
        valid = ("Pending", "Received", "In transit", "Complete", "Cancelled")
        if status not in valid:
            return JsonResponse(
                {"error": f"status must be one of: {', '.join(valid)}"}, status=400
            )
        qs = qs.filter(OrderStatus=status)
    if date_from:
        qs = qs.filter(OrderDate__date__gte=date_from)
    if date_to:
        qs = qs.filter(OrderDate__date__lte=date_to)

    return JsonResponse({"orders": [
        {
            "orderID":     o.OrderID,
            "customerID":  o.CustomerID_id,
            "ownerID":     o.OwnerID_id,
            "orderDate":   o.OrderDate.isoformat(),
            "orderStatus": o.OrderStatus,
            "totalAmount": str(o.TotalAmount),
        }
        for o in qs.order_by("-OrderDate")
    ]})