from django.urls import path
from .views.customer_views import (
    get_profile, update_profile, change_password, deactivate,
)
from .views.address_views import (
    list_addresses, get_address, add_address,
    update_address, delete_address, set_default_address,
)

urlpatterns = [
    path("profile",                            get_profile,         name="customer-profile"),
    path("profile/update",                     update_profile,      name="customer-update-profile"),
    path("change-password",                    change_password,     name="customer-change-password"),
    path("deactivate",                         deactivate,          name="customer-deactivate"),
    path("addresses",                          list_addresses,      name="address-list"),
    path("addresses/add",                      add_address,         name="address-add"),
    path("addresses/<int:address_id>",         get_address,         name="address-detail"),
    path("addresses/<int:address_id>/update",  update_address,      name="address-update"),
    path("addresses/<int:address_id>/delete",  delete_address,      name="address-delete"),
    path("addresses/<int:address_id>/default", set_default_address, name="address-default"),
]