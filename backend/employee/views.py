from django.shortcuts import render

def product(request):
    return render(request, "employee/product.html", {"title": "Product"})

def supplier(request):
    return render(request, "employee/supplier.html", {"title": "Supplier"})

def category(request):
    return render(request, "employee/category.html", {"title": "Category"})

def warehouse(request):
    return render(request, "employee/warehouse.html", {"title": "Warehouse"})

def location(request):
    return render(request, "employee/location.html", {"title": "Location"})

def purchase_order(request):
    return render(request, "employee/purchase_order.html", {"title": "Purchase Order"})

def sales_order(request):
    return render(request, "employee/sales_order.html", {"title": "Sales Order"})

def employee(request):
    return render(request, "employee/employee.html", {"title": "Employee"})

def payment(request):
    return render(request, "employee/payment.html", {"title": "Payment"})