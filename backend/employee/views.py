from datetime import date

from django.shortcuts import render, redirect, get_object_or_404
from django.core.paginator import Paginator
from django.http import HttpResponse

from .models import (
    Product, Supplier, Category, Warehouse, Location,
    PurchaseOrder, SalesOrder, Employee, Payment, PurchaseOrderItem
)

from .forms import (
    ProductForm, SupplierForm, CategoryForm,
    WarehouseForm, LocationForm, PurchaseOrderForm, SalesOrderForm, EmployeeForm
)

# =========================
# MAPS
# =========================

# class → string (ส่งไป frontend)
MODEL_TO_NAME = {
    Product: "product",
    Supplier: "supplier",
    Category: "category",
    Warehouse: "warehouse",
    Location: "location",
    PurchaseOrder: "purchase_order",
    SalesOrder: "sales_order",
    Employee: "employee",
    Payment: "payment",
}

# string → class (รับจาก URL)
NAME_TO_MODEL = {
    "product": Product,
    "supplier": Supplier,
    "category": Category,
    "warehouse": Warehouse,
    "location": Location,
    "purchase_order": PurchaseOrder,
    "sales_order": SalesOrder,
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
# TABLE VIEW (REUSABLE)
# =========================

def table_view(request, model, template, title, columns, headers, actions, show_add=True, show_actions=True):
    data = model.objects.all()

    paginator = Paginator(data, 10)
    page_number = request.GET.get("page")
    page_obj = paginator.get_page(page_number)

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
    })

# =========================
# MODULE PAGES
# =========================

def product(request):
    return table_view(
        request,
        Product,
        "employee/product.html",
        "Product",
        ["product_name", "product_id", "company", "warehouse", "category"],
        ["Product Name", "Product ID", "Company Name", "Warehouse Name", "Category"],
        {"edit": True, "delete": True, "detail": True}
    )


def supplier(request):
    return table_view(
        request,
        Supplier,
        "employee/supplier.html",
        "Supplier",
        ["contact_name", "supplier_id", "company", "address", "phone"],
        ["Contact Name", "Supplier ID", "Company Name", "Address", "Phone Number"],
        {"edit": True, "delete": True, "detail": False}
    )


def category(request):
    return table_view(
        request,
        Category,
        "employee/category.html",
        "Category",
        ["name", "id"],
        ["Category Name", "Category ID"],
        {"edit": True, "delete": True, "detail": False}
    )


def warehouse(request):
    return table_view(
        request,
        Warehouse,
        "employee/warehouse.html",
        "Warehouse",
        ["name", "warehouse_id", "phone", "address"],
        ["Warehouse Name", "Warehouse ID", "Phone Number", "Address"],
        {"edit": True, "delete": True, "detail": False}
    )


def location(request):
    return table_view(
        request,
        Location,
        "employee/location.html",
        "Location",
        ["location_id", "warehouse", "zone", "aisle", "bin"],
        ["Location ID", "Warehouse", "Zone", "Aisle", "Bin"],
        {"edit": True, "delete": True, "detail": False}
    )


def purchase_order(request):
    return table_view(
        request,
        PurchaseOrder,
        "employee/purchase_order.html",
        "Purchase Order",
        ["ordered_date", "purchase_order_id", "supplier", "status"],
        ["Ordered Date", "Purchase Order ID", "Supplier", "Status"],
        {"edit": False, "delete": False, "detail": True}
    )


def sales_order(request):
    return table_view(
        request,
        SalesOrder,
        "employee/sales_order.html",
        "Sales Order",
        ["ordered_date", "sales_order_id", "customer", "status"],
        ["Ordered Date", "Sales Order ID", "Customer", "Status"],
        {"edit": True, "delete": False, "detail": True},
        show_add=False
    )


def employee(request):
    return table_view(
        request,
        Employee,
        "employee/employee.html",
        "Employee",
        ["name", "employee_id", "role", "phone"],
        ["Employee Name", "Employee ID", "Role", "Phone Number"],
        {"edit": True, "delete": True, "detail": False},
    )


def payment(request):
    return table_view(
        request,
        Payment,
        "employee/payment.html",
        "Payment",
        ["payment_date", "reference_number", "sales_order", "status"],
        ["Payment Date", "Reference Number", "Sales Order ID", "Status"],
        {"edit": False, "delete": False, "detail": False},
        show_add=False,
        show_actions=False
    )

# =========================
# ACTIONS
# =========================

def edit_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)
    form_class = FORM_MAP.get(model)

    if not model_class or not form_class:
        return HttpResponse("Not found")

    obj = get_object_or_404(model_class, pk=id)

    if request.method == "POST":
        form = form_class(request.POST, request.FILES, instance=obj)
        if form.is_valid():
            form.save()
            return redirect(model)
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

    return render(
        request,
        f"employee/components/forms/{model}_form.html",
        context
    )


def delete_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)

    if not model_class:
        return redirect("product")

    obj = get_object_or_404(model_class, pk=id)

    if request.method == "POST":
        obj.delete()

    return redirect(model)


def detail_item(request, model, id):
    model_class = NAME_TO_MODEL.get(model)

    if not model_class:
        return HttpResponse("Model not found")

    obj = get_object_or_404(model_class, pk=id)

    print("MODEL:", model)
    print("ID:", id)

    return render(request, f"employee/components/details/{model}_details.html", {
        "object": obj
    })

def add_item(request, model):
    form_class = FORM_MAP.get(model)

    if not form_class:
        return HttpResponse("Form not found")

    if request.method == "POST":
        form = form_class(request.POST, request.FILES)

        if form.is_valid():
            obj = form.save(commit=False)
            obj.ordered_date = date.today()
            obj.status = "pending"
            obj.save()

            if model == "purchase_order":
                products = request.POST.getlist("product[]")
                quantities = request.POST.getlist("quantity[]")

                for p, q in zip(products, quantities):
                    if p and q:
                        PurchaseOrderItem.objects.create(
                            purchase_order=obj,
                            product_id=p,
                            quantity=q
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