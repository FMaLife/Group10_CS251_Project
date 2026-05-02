from datetime import date

from django.shortcuts import render, redirect, get_object_or_404
from django.core.paginator import Paginator
from django.http import HttpResponse, HttpResponseForbidden, Http404, JsonResponse
from django.utils import timezone
from django.views.decorators.csrf import ensure_csrf_cookie

from accounts.utils.permissions import employee_required
from accounts.utils.auth import hash_password

from catalog.models import Product, Category
from stock.models import Supplier, Warehouse, WarehouseLocation, RestockOrder , RestockDetail
from cart_delivery.models import Delivery
from order_payment.models import SaleOrder, Payment
from employees.models import Employee

from .forms import (
    ProductForm, SupplierForm, CategoryForm,
    WarehouseForm, LocationForm, PurchaseOrderForm, SalesOrderForm, EmployeeForm
)

# =========================
# MAPS
# =========================

MODEL_TO_NAME = {
    Product: "product",
    Supplier: "supplier",
    Category: "category",
    Warehouse: "warehouse",
    WarehouseLocation: "location",
    RestockOrder: "purchase_order",
    SaleOrder: "sales_order",
    Employee: "employee",
    Payment: "payment",
}

NAME_TO_MODEL = {
    "product": Product,
    "supplier": Supplier,
    "category": Category,
    "warehouse": Warehouse,
    "location": WarehouseLocation,
    "purchase_order": RestockOrder,
    "sales_order": SaleOrder,
    "employee": Employee,
    "payment": Payment,
}

FORM_MAP = {
    "product": ProductForm,
    "supplier": SupplierForm,
    "category": CategoryForm,
    "warehouse": WarehouseForm,
    "location": LocationForm,
    "purchase_order": PurchaseOrderForm,
    "sales_order": SalesOrderForm,
    "employee": EmployeeForm,
}

# =========================
# LOGIN
# =========================
@ensure_csrf_cookie
def login_page(request):
    return render(request, "employee/log-in.html")

# =========================
# TABLE VIEW (REUSABLE)
# =========================

def table_view(request, model, template, title, columns, headers, actions, show_add=True, show_actions=True):
    if model is Product:
        data = model.objects.filter(is_active=True)
    else:
        data = model.objects.all()

    paginator = Paginator(data, 10)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

    emp = None
    emp_id = request.session.get("employee_id")

    if emp_id:
        emp = Employee.objects.filter(EmployeeID=emp_id).first()

    return render(request, template, {
        "title": title,
        "model_name": MODEL_TO_NAME[model],
        "page_obj": page_obj,
        "columns": columns,
        "headers": headers,
        "show_add": show_add,
        "show_actions": show_actions,
        "delete_url": "delete_item",
        "actions": actions,
        "display_field": columns[0],
        "employee": emp
    })

# =========================
# MODULE PAGES
# =========================
@employee_required
def product(request):
    return table_view(
        request,
        Product,
        "employee/product.html",
        "Product",
        ["ProductName", "ProductID", "supplier", "location", "category"],
        ["Product Name", "Product ID", "Company Name", "Warehouse Name", "Category"],
        {"edit": True, "delete": True, "detail": True}
    )

@employee_required
def supplier(request):
    return table_view(
        request,
        Supplier,
        "employee/supplier.html",
        "Supplier",
        ["contact_person", "supplier_id", "company_name", "address", "phone_num"],
        ["Contact Name", "Supplier ID", "Company Name", "Address", "Phone Number"],
        {"edit": True, "delete": True, "detail": False}
    )

@employee_required
def category(request):
    return table_view(
        request,
        Category,
        "employee/category.html",
        "Category",
        ["CategoryName", "CategoryID"],
        ["Category Name", "Category ID"],
        {"edit": True, "delete": True, "detail": False}
    )

@employee_required
def warehouse(request):
    return table_view(
        request,
        Warehouse,
        "employee/warehouse.html",
        "Warehouse",
        ["wname", "warehouse_id", "wphone", "waddress"],
        ["Warehouse Name", "Warehouse ID", "Phone Number", "Address"],
        {"edit": True, "delete": True, "detail": False}
    )

@employee_required
def location(request):
    return table_view(
        request,
        WarehouseLocation,
        "employee/location.html",
        "Location",
        ["location_id", "warehouse", "zone", "aisle", "bin"],
        ["Location ID", "Warehouse", "Zone", "Aisle", "Bin"],
        {"edit": True, "delete": True, "detail": False}
    )

@employee_required
def purchase_order(request):
    return table_view(
        request,
        RestockOrder,
        "employee/purchase_order.html",
        "Purchase Order",
        ["restock_date", "restock_id", "supplier", "restock_status"],
        ["Ordered Date", "Purchase Order ID", "Supplier", "Status"],
        {"edit": False, "delete": False, "detail": True, "update_status": True}
    )

@employee_required
def receive_purchase_order(request, id):
    if request.method == "POST":
        order = get_object_or_404(RestockOrder, pk=id)
        if order.restock_status != "Received":
            order.restock_status = "Received"
            order.save()
    return redirect("purchase_order")

@employee_required
def sales_order(request):
    return table_view(
        request,
        SaleOrder,
        "employee/sales_order.html",
        "Sales Order",
        ["order_date", "order_id", "customer", "order_status"],
        ["Ordered Date", "Sales Order ID", "Customer", "Status"],
        {"edit": True, "delete": False, "detail": True},
        show_add=False
    )

@employee_required
def employee(request):
    show_add = True
    show_actions = True

    if request.session.get("role") == "Staff":
        show_add = False
        show_actions = False

    return table_view(
        request,
        Employee,
        "employee/employee.html",
        "Employee",
        ["EFirstName", "ELastName", "EmployeeID", "role", "EPhone", "EEmail"],
        ["First Name", "Last Name", "Employee ID", "Role", "Phone Number", "Email"],
        {"edit": True, "delete": True, "detail": False},
        show_actions=show_actions,
        show_add=show_add
    )

@employee_required
def payment(request):
    return table_view(
        request,
        Payment,
        "employee/payment.html",
        "Payment",
        ["payment_timestamp", "ref_number", "order", "payment_status"],
        ["Payment Date", "Reference Number", "Sales Order ID", "Status"],
        {"edit": False, "delete": False, "detail": False},
        show_add=False,
        show_actions=False
    )

# =========================
# ACTIONS
# =========================
@employee_required
def edit_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)
    form_class = FORM_MAP.get(model)

    if not model_class or not form_class:
        raise Http404()

    obj = get_object_or_404(model_class, pk=id)

    if request.method == "POST":
        form = form_class(request.POST, request.FILES, instance=obj)
        if form.is_valid():
            saved = form.save(commit=False)
            if model == "employee":
                raw_pw = form.cleaned_data.get("EPassword")
                if raw_pw:
                    saved.EPassword = hash_password(raw_pw)
            saved.save()
            if model == "sales_order" and getattr(saved, "order_status", None) in ("In transit", "In_transit"):
                carrier  = form.cleaned_data.get("delivery_name", "")
                tracking = form.cleaned_data.get("tracking_number", "")
                delivery = Delivery.objects.filter(order=saved.order_id).first()
                if delivery:
                    delivery.delivery_name  = carrier
                    delivery.tracking_number = tracking
                    delivery.delivery_date   = date.today()
                    delivery.save()
                else:
                    addr = saved.customer.addresses.first()
                    Delivery.objects.create(
                        order=saved.order_id,
                        address=addr.AddressID if addr else 0,
                        delivery_name=carrier,
                        tracking_number=tracking,
                        delivery_date=date.today(),
                    )
            return redirect(model)
    else:
        if model == "sales_order":
            delivery = Delivery.objects.filter(order=obj.order_id).first()
            initial = {}
            if delivery:
                initial = {
                    "delivery_name": delivery.delivery_name,
                    "tracking_number": delivery.tracking_number,
                }
            form = form_class(instance=obj, initial=initial)
        else:
            form = form_class(instance=obj)

    context = {
        "form": form,
        "model_name": model,
        "is_edit": True,
        "object": obj
    }

    if model == "product":
        context.update({
            "categories": Category.objects.all(),
            "warehouses": Warehouse.objects.all(),
            "suppliers": Supplier.objects.all(),
        })

    if model == "sales_order":
        context["delivery"] = Delivery.objects.filter(order=obj.order_id).first()

    return render(
        request,
        f"employee/components/forms/{model}_form.html",
        context
    )

@employee_required
def delete_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)

    if not model_class:
        return redirect("product")

    obj = get_object_or_404(model_class, pk=id)

    if request.method == "POST":
        if model == "product" and hasattr(obj, "is_active"):
            obj.is_active = False
            obj.save(update_fields=["is_active"])
        else:
            obj.delete()

    return redirect(model)

@employee_required
def detail_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)

    if not model_class:
        return HttpResponse("Model not found")

    obj = get_object_or_404(model_class, pk=id)

    context = {"object": obj}

    if model == "sales_order":
        from cart_delivery.models import Delivery
        context["delivery"] = Delivery.objects.filter(order=obj.order_id).first()

    return render(request, f"employee/components/details/{model}_details.html", context)

@employee_required
def add_item(request, model):
    form_class = FORM_MAP.get(model)

    if not form_class:
        return HttpResponse("Form not found")

    if model == "employee":
        if request.session.get("role") == "Staff":
            return HttpResponseForbidden("Permission denied")

    if request.method == "POST":
        form = form_class(request.POST, request.FILES)

        if form.is_valid():
            obj = form.save(commit=False)
            if model == "employee":
                raw_pw = form.cleaned_data.get("EPassword")
                obj.EPassword = hash_password(raw_pw) if raw_pw else ""
            if model == "purchase_order":
                obj.restock_date = timezone.now()
                obj.restock_status = "Pending"

                obj.employee = Employee.objects.first()
                obj.location = WarehouseLocation.objects.first()

            obj.save()

            products = request.POST.getlist("product[]")
            quantities = request.POST.getlist("StockQuantity[]")

            for p, q in zip(products, quantities):
                if p and q:
                    RestockDetail.objects.create(
                        restock=obj,
                        product_id=p,
                        quantity=int(q)
                    )

            return redirect(model)

    else:
        form = form_class()

    context = {
        "form": form,
        "model_name": model,
        "is_edit": False
    }

    if model == "purchase_order":
        context["products"] = Product.objects.all()

    return render(
        request,
        f"employee/components/forms/{model}_form.html",
        context
    )

def paginate(request, data, per_page=10):
    paginator = Paginator(data, per_page)
    page_number = request.GET.get("page")
    return paginator.get_page(page_number)
