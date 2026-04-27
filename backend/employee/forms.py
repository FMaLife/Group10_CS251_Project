from django import forms
from .models import *

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = '__all__'


class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = '__all__'


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = '__all__'

class WarehouseForm(forms.ModelForm):
    class Meta:
        model = Warehouse
        fields = '__all__'

class LocationForm(forms.ModelForm):
    class Meta:
        model = Location
        fields = '__all__'


class PurchaseOrderForm(forms.ModelForm):
    class Meta:
        model = PurchaseOrder
        fields = '__all__'

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = '__all__'