from django.shortcuts import render

def product(request):
    return render(request, "employee/product.html")

def supplier(request):
    return render(request, "employee/supplier.html")

def category(request):
    return render(request, "employee/category.html")

def warehouse(request):
    return render(request, "employee/warehouse.html")

def location(request):
    return render(request, "employee/location.html")

def purchase_order(request):
    return render(request, "employee/purchase_order.html")

def sales_order(request):
    return render(request, "employee/sales_order.html")

def employee(request):
    return render(request, "employee/employee.html")

def payment(request):
    return render(request, "employee/payment.html")