from django import template

register = template.Library()

@register.filter
def attr(obj, attr_name):
    display_method = f"get_{attr_name}_display"
    
    if hasattr(obj, display_method):
        return getattr(obj, display_method)()

    return getattr(obj, attr_name, "")