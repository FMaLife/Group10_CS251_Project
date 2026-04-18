from django.contrib import admin
from .models import SaleOrder, OrderDetail, Payment

admin.site.register(SaleOrder)
admin.site.register(OrderDetail)
admin.site.register(Payment)