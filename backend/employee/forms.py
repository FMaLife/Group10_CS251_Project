from django import forms

from catalog.models import Product, Category
from stock.models import Supplier, Warehouse, WarehouseLocation, RestockOrder , RestockDetail
from order_payment.models import SaleOrder
from employees.models import Employee

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            "ProductName", "image", "Width", "Length", "Height",
             "Color", "Price", "StockQuantity", "category", "location", "supplier"
        ]
        widgets = {
            "image": forms.ClearableFileInput(attrs={"class": "hidden"}),
            "Price": forms.NumberInput(attrs={"placeholder": "Enter Price"}),
            "ProductName": forms.TextInput(attrs={"placeholder": " Enter Product name"}),
            "Color": forms.TextInput(attrs={"placeholder": "Enter Color"}),
            "StockQuantity": forms.NumberInput(attrs={"placeholder": "Enter Quantity"}),
            "Width": forms.NumberInput(attrs={"placeholder": "W"}),
            "Length": forms.NumberInput(attrs={"placeholder": "L"}),
            "Height": forms.NumberInput(attrs={"placeholder": "H"}),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['category'].empty_label = "Select Category"
        self.fields['location'].empty_label = "Select location"
        self.fields['supplier'].empty_label = "Select Supplier"

class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ["contact_person", "phone_num", "company_name", "address"]
        labels = {
            "contact_person": "Contact Name",
            "phone_num": "Phone Number",
            "company_name": "Company Name",
            "address": "Address"
        }
        widgets = {
            "contact_person": forms.TextInput(attrs={"placeholder": "Enter Contact Name"}),
            "phone_num": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
            "company_name": forms.TextInput(attrs={"placeholder": "Enter Company Name"}),
            "address": forms.TextInput(attrs={"placeholder": "Enter Address"})
        }

class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ["CategoryName"]
        labels = {"CategoryName": "Catagory Name"}
        widgets = {
            "CategoryName": forms.TextInput(attrs={"placeholder": "Enter Catagory Name"})
        }

class WarehouseForm(forms.ModelForm):
    class Meta:
        model = Warehouse
        fields = ["wname", "wphone", "waddress"]
        labels = {
            "wname": "Warehouse Name",
            "wphone": "Warehouse Contact Number",
            "waddress": "Address"
        }
        widgets = {
            "wname": forms.TextInput(attrs={"placeholder": "Enter Warehouse Name"}),
            "wphone": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
            "waddress": forms.TextInput(attrs={"placeholder": "Enter Address"})
        }

class LocationForm(forms.ModelForm):
    class Meta:
        model = WarehouseLocation
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
        model = RestockOrder
        fields = ["supplier"]
        labels = {
            "supplier": "Supplier",
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['supplier'].empty_label = "Select Supplier"

class SalesOrderForm(forms.ModelForm):
    class Meta:
        model = SaleOrder
        fields = ["order_status"]

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        current = self.instance.order_status if self.instance.pk else None

        if current == "Pending":
            allowed = {"Cancelled"}
        elif current == "Received":
            allowed = {"In transit"}
        else:
            allowed = set()

        self.fields['order_status'].choices = [('', 'Select Status')] + [
            (key, label)
            for key, label in self.fields['order_status'].choices
            if label in allowed
        ]

    def clean_order_status(self):
        new_status = self.cleaned_data.get("order_status")
        current_status = self.instance.order_status if self.instance.pk else None

        # ห้าม cancel order ที่ไม่ใช่ Pending
        if new_status == "Cancelled" and current_status != "Pending":
            raise forms.ValidationError("Can only cancel orders with status Pending.")

        # ห้าม in_transit ถ้ายังไม่ Received
        if new_status == "In transit" and current_status != "Received":
            raise forms.ValidationError("Can only ship orders with status Received.")

        return new_status

class EmployeeForm(forms.ModelForm):
    class Meta:
        model = Employee
        fields = ["EFirstName", "ELastName", "role", "EPhone", "EEmail"]
        labels = {
            "EFirstName": "First Name",
            "ELastName": "Last Name",
            "EPhone": "Phone Number",
            "role": "Role",
            "EEmail": "Email"
        }
        widgets = {
            "EFirstName": forms.TextInput(attrs={"placeholder": "Enter First Name"}),
            "ELastName": forms.TextInput(attrs={"placeholder": "Enter Last Name"}),
            "EPhone": forms.TextInput(attrs={
                "placeholder": "Enter Phone Number",
                "required": True,
                "pattern": r"\d{9,10}",
                "title": "Phone must be 9-10 digits"
            }),
            "EEmail": forms.EmailInput(attrs={
                "placeholder": "Enter Email",
                "required": True,
                "pattern": r"^[\w\.-]+@[\w\.-]+\.\w+$",
                "title": "Enter a valid email (example@mail.com)"
            }),
        }
        
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields['role'].choices = [('', 'Select Role')] + [
            (key, label)
            for key, label in self.fields['role'].choices
            if key
        ]