from django import forms
from .models import *

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            "product_name", "image", "width", "length", "height",
            "category", "color", "warehouse", "price", "supplier", "quantity"
        ]
        widgets = {
            "image": forms.ClearableFileInput(attrs={"class": "hidden"}),
            "price": forms.NumberInput(attrs={"placeholder": "Enter Price"}),
            "product_name": forms.TextInput(attrs={"placeholder": " Enter Product name"}),
            "color": forms.TextInput(attrs={"placeholder": "Enter Color"}),
            "quantity": forms.NumberInput(attrs={"placeholder": "Enter Quantity"}),
            "width": forms.NumberInput(attrs={"placeholder": "W"}),
            "length": forms.NumberInput(attrs={"placeholder": "L"}),
            "height": forms.NumberInput(attrs={"placeholder": "H"}),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['category'].empty_label = "Select Category"
        self.fields['warehouse'].empty_label = "Select Warehouse"
        self.fields['supplier'].empty_label = "Select Supplier"

class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ["contact_name", "phone", "company", "address"]
        labels = {
            "contact_name": "Contact Name",
            "phone": "Phone Number",
            "company": "Company Name",
            "address": "Address"
        }
        widgets = {
            "contact_name": forms.TextInput(attrs={"placeholder": "Enter Contact Name"}),
            "phone": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
            "company": forms.TextInput(attrs={"placeholder": "Enter Company Name"}),
            "address": forms.TextInput(attrs={"placeholder": "Enter Address"})
        }

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ["name"]
        labels = {"name": "Catagory Name"}
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Enter Catagory Name"})
        }

class WarehouseForm(forms.ModelForm):
    class Meta:
        model = Warehouse
        fields = ["name", "phone", "address"]
        labels = {
            "name": "Warehouse Name",
            "phone": "Warehouse Contact Number",
            "address": "Address"
        }
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Enter Warehouse Name"}),
            "phone": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
            "address": forms.TextInput(attrs={"placeholder": "Enter Address"})
        }

class LocationForm(forms.ModelForm):
    class Meta:
        model = Location
        fields = ["warehouse", "zone", "aisle", "bin"]
        widgets = {
            "zone": forms.TextInput(attrs={"placeholder": "Enter Zone"}),
            "aisle": forms.TextInput(attrs={"placeholder": " Enter Aisle"}),
            "bin": forms.TextInput(attrs={"placeholder": " Enter Bin"})
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['warehouse'].empty_label = "Select Warehouse"

class PurchaseOrderForm(forms.ModelForm):
    class Meta:
        model = PurchaseOrder
        fields = ["supplier"]
        labels = {
            "supplier": "Supplier",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['supplier'].empty_label = "Select Supplier"

class SalesOrderForm(forms.ModelForm):
    class Meta:
        model = SalesOrder
        fields = ["status"]
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['status'].choices = [('', 'Select Status')] + [
            (key, label)
            for key, label in self.fields['status'].choices
            if key
        ]

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ["name", "role", "phone"]
        labels = {
            "name": "Full Name",
            "phone": "Phone Number",
            "role": "Role"
        }
        widgets = {
            "name": forms.TextInput(attrs={"placeholder": "Enter Full Name","autocomplete": "name"}),
            "phone": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['role'].choices = [('', 'Select Role')] + [
            (key, label)
            for key, label in self.fields['role'].choices
            if key
        ]