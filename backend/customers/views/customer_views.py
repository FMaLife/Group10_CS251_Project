import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from customers.models import Customer
from accounts.utils.auth import hash_password, verify_password
from accounts.utils.permissions import customer_required
from accounts.utils.validators import validate_phone, validate_password, collect_errors


def _serialize(c: Customer) -> dict:
    return {
        "customerID":  c.CustomerID,
        "firstName":   c.FirstName,
        "lastName":    c.LastName,
        "email":       c.Email,
        "phoneNumber": c.PhoneNumber,
    }


def _parse(request):
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON"}, status=400)


@require_http_methods(["GET"])
@customer_required
def get_profile(request):
    return JsonResponse(_serialize(request.customer))


@require_http_methods(["PUT"])
@customer_required
def update_profile(request):
    body, err = _parse(request)
    if err:
        return err

    c = request.customer
    if body.get("firstName", "").strip():
        c.FirstName = body["firstName"].strip()
    if body.get("lastName", "").strip():
        c.LastName = body["lastName"].strip()

    phones = body.get("phoneNumber")
    if phones is not None:
        if isinstance(phones, str):
            phones = [phones]
        errors = collect_errors(
            **{f"phone[{i}]": validate_phone(p) for i, p in enumerate(phones)}
        )
        if errors:
            return JsonResponse({"errors": errors}, status=400)
        c.PhoneNumber = phones

    c.save()
    return JsonResponse({"message": "Profile updated", "customer": _serialize(c)})


@require_http_methods(["PUT"])
@customer_required
def change_password(request):
    body, err = _parse(request)
    if err:
        return err

    old_pass = body.get("oldPassword", "")
    new_pass = body.get("newPassword", "")

    if not old_pass or not new_pass:
        return JsonResponse(
            {"error": "oldPassword and newPassword are required"}, status=400
        )

    fmt_err = validate_password(new_pass)
    if fmt_err:
        return JsonResponse({"error": fmt_err}, status=400)

    if old_pass == new_pass:
        return JsonResponse(
            {"error": "New password must differ from current password"}, status=400
        )

    if not verify_password(old_pass, request.customer.Password):
        return JsonResponse({"error": "Current password is incorrect"}, status=400)

    request.customer.Password = hash_password(new_pass)
    request.customer.save()
    return JsonResponse({"message": "Password changed successfully"})


@require_http_methods(["DELETE"])
@customer_required
def deactivate(request):
    request.customer.is_active = False
    request.customer.save()
    request.session.flush()
    return JsonResponse({"message": "Account deactivated"})


@require_http_methods(["GET"])
@customer_required
def get_orders(request):
    try:
        from django.apps import apps
        SaleOrder = apps.get_model("order_payment", "SaleOrder")
    except LookupError:
        return JsonResponse({"error": "Order module not available yet"}, status=503)

    orders = SaleOrder.objects.filter(
        CustomerID=request.customer.CustomerID
    ).order_by("-OrderDate")

    return JsonResponse({"orders": [
        {
            "orderID":     o.OrderID,
            "orderDate":   o.OrderDate.isoformat(),
            "orderStatus": o.OrderStatus,
            "totalAmount": str(o.TotalAmount),
        }
        for o in orders
    ]})