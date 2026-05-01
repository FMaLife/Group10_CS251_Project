from django.core.management.base import BaseCommand
from employee.models import *
import random
from datetime import date, timedelta


class Command(BaseCommand):
    help = 'Seed full database'

    def handle(self, *args, **kwargs):

        # -----------------------
        # CLEAR OLD DATA (optional)
        # -----------------------
        Payment.objects.all().delete()
        SalesOrder.objects.all().delete()
        PurchaseOrder.objects.all().delete()
        Product.objects.all().delete()
        Supplier.objects.all().delete()
        Location.objects.all().delete()
        Warehouse.objects.all().delete()
        Category.objects.all().delete()
        Employee.objects.all().delete()

        # -----------------------
        # CATEGORY
        # -----------------------
        categories = []
        for i in range(5):
            cat = Category.objects.create(name=f"Category {i+1}")
            categories.append(cat)

        # -----------------------
        # WAREHOUSE
        # -----------------------
        warehouses = []
        for i in range(3):
            wh = Warehouse.objects.create(
                name=f"Warehouse {i+1}",
                warehouse_id=f"WH{i+1:03}",
                phone=f"09000000{i}",
                address="Bangkok"
            )
            warehouses.append(wh)

        # -----------------------
        # LOCATION
        # -----------------------
        # locations = []
        # for i in range(10):
        #     loc = Location.objects.create(
        #         location_id=f"LOC{i+1:03}",
        #         warehouse=random.choice(warehouses),
        #         zone=chr(65 + i % 3),
        #         aisle=str(i % 5),
        #         bin=str(i)
        #     )
        #     locations.append(loc)

        # -----------------------
        # SUPPLIER
        # -----------------------
        suppliers = []
        for i in range(5):
            sup = Supplier.objects.create(
                contact_name=f"Supplier {i+1}",
                supplier_id=f"SUP{i+1:03}",
                company=f"Company {i+1}",
                address="Bangkok",
                phone=f"08111111{i}"
            )
            suppliers.append(sup)

        # -----------------------
        # PRODUCT
        # -----------------------
        products = []
        for i in range(510):
            prod = Product.objects.create(
                product_name=f"Product {i+1}",
                product_id=f"P{i+1:03}",
                company="BrandX",
                warehouse=random.choice(warehouses),
                category=random.choice(categories)
            )
            products.append(prod)

        # -----------------------
        # EMPLOYEE
        # -----------------------
        employees = []
        roles = ["Manager", "Staff", "Admin"]

        for i in range(5):
            emp = Employee.objects.create(
                name=f"Employee {i+1}",
                employee_id=f"EMP{i+1:03}",
                role=random.choice(roles),
                phone=f"08999999{i}"
            )
            employees.append(emp)

        # -----------------------
        # PURCHASE ORDER
        # -----------------------
        purchase_orders = []
        for i in range(5):
            po = PurchaseOrder.objects.create(
                purchase_order_id=f"PO{i+1:03}",
                ordered_date=date.today() - timedelta(days=i),
                supplier=random.choice(suppliers),
                status=random.choice(["Pending", "Completed"])
            )
            purchase_orders.append(po)

        # -----------------------
        # SALES ORDER
        # -----------------------
        sales_orders = []
        for i in range(5):
            so = SalesOrder.objects.create(
                sales_order_id=f"SO{i+1:03}",
                ordered_date=date.today() - timedelta(days=i),
                customer=f"Customer {i+1}",
                status=random.choice(["Pending", "Completed"])
            )
            sales_orders.append(so)

        # -----------------------
        # PAYMENT
        # -----------------------
        for i in range(565):
            Payment.objects.create(
                reference_number=f"PAY{i+1:03}",
                payment_date=date.today() - timedelta(days=i),
                sales_order=random.choice(sales_orders),
                status=random.choice(["Paid", "Unpaid"])
            )

        self.stdout.write(self.style.SUCCESS('🔥 Full seed completed!'))