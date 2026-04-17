import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.db import transaction

from customers.models import CustomerAddress
from accounts.utils.permissions import customer_required
from accounts.utils.validators import validate_zipcode, collect_errors

_FIELD_MAP = {
    "addressType": "AddressType",
    "houseNo":     "HouseNo",
    "street":      "Street",
    "subDistrict": "SubDistrict",
    "district":    "District",
    "province":    "Province",
    "zipCode":     "ZipCode",
}


def _serialize(a: CustomerAddress) -> dict:
    return {
        "addressID":   a.AddressID,
        "addressType": a.AddressType,
        "houseNo":     a.HouseNo,
        "street":      a.Street,
        "subDistrict": a.SubDistrict,
        "district":    a.District,
        "province":    a.Province,
        "zipCode":     a.ZipCode,
        "isDefault":   a.is_default,
    }


def _parse(request):
    try:
        return json.loads(request.body), None
    except json.JSONDecodeError:
        return None, JsonResponse({"error": "Invalid JSON"}, status=400)


def _validate_owner(address_id: int, customer_id: int) -> bool:
    return CustomerAddress.objects.filter(
        AddressID=address_id, CustomerID=customer_id
    ).exists()


@require_http_methods(["GET"])
@customer_required
def list_addresses(request):
    addresses = CustomerAddress.objects.filter(
        CustomerID=request.customer
    ).order_by("-is_default", "AddressID")
    return JsonResponse({"addresses": [_serialize(a) for a in addresses]})


@require_http_methods(["GET"])
@customer_required
def get_address(request, address_id):
    if not _validate_owner(address_id, request.customer.CustomerID):
        return JsonResponse({"error": "Address not found"}, status=404)
    addr = CustomerAddress.objects.get(AddressID=address_id)
    return JsonResponse(_serialize(addr))


@require_http_methods(["POST"])
@customer_required
def add_address(request):
    body, err = _parse(request)
    if err:
        return err

    missing = [k for k in _FIELD_MAP if not body.get(k, "").strip()]
    if missing:
        return JsonResponse(
            {"error": f"Missing fields: {', '.join(missing)}"}, status=400
        )

    errors = collect_errors(zipCode=validate_zipcode(body["zipCode"]))
    if errors:
        return JsonResponse({"errors": errors}, status=400)

    addr = CustomerAddress.objects.create(
        CustomerID=request.customer,
        **{model_field: body[json_key].strip()
           for json_key, model_field in _FIELD_MAP.items()},
    )
    return JsonResponse(
        {"message": "Address added", "address": _serialize(addr)}, status=201
    )


@require_http_methods(["PUT"])
@customer_required
def update_address(request, address_id):
    if not _validate_owner(address_id, request.customer.CustomerID):
        return JsonResponse({"error": "Address not found"}, status=404)

    body, err = _parse(request)
    if err:
        return err

    if "zipCode" in body:
        zip_err = validate_zipcode(body.get("zipCode", ""))
        if zip_err:
            return JsonResponse({"errors": {"zipCode": zip_err}}, status=400)

    addr = CustomerAddress.objects.get(AddressID=address_id)
    for json_key, model_field in _FIELD_MAP.items():
        if json_key in body and body[json_key].strip():
            setattr(addr, model_field, body[json_key].strip())
    addr.save()

    return JsonResponse({"message": "Address updated", "address": _serialize(addr)})


@require_http_methods(["DELETE"])
@customer_required
def delete_address(request, address_id):
    if not _validate_owner(address_id, request.customer.CustomerID):
        return JsonResponse({"error": "Address not found"}, status=404)

    try:
        from django.apps import apps
        Delivery = apps.get_model("order_payment", "Delivery")
        if Delivery.objects.filter(AddressID=address_id).exists():
            return JsonResponse(
                {"error": "Cannot delete address linked to an existing delivery"},
                status=409,
            )
    except LookupError:
        pass

    CustomerAddress.objects.filter(AddressID=address_id).delete()
    return JsonResponse({"message": "Address deleted"})


@require_http_methods(["PUT"])
@customer_required
def set_default_address(request, address_id):
    if not _validate_owner(address_id, request.customer.CustomerID):
        return JsonResponse({"error": "Address not found"}, status=404)

    with transaction.atomic():
        CustomerAddress.objects.filter(
            CustomerID=request.customer, is_default=True
        ).update(is_default=False)
        CustomerAddress.objects.filter(AddressID=address_id).update(is_default=True)

    addr = CustomerAddress.objects.get(AddressID=address_id)
    return JsonResponse(
        {"message": "Default address updated", "address": _serialize(addr)}
    )