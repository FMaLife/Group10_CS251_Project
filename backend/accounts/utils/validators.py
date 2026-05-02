import re

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$")
PHONE_REGEX = re.compile(r"^0[0-9]{8,9}$")


def validate_email(email: str) -> str | None:
    if not email or not EMAIL_REGEX.match(email.strip()):
        return "Invalid email format"
    return None


def validate_phone(phone: str) -> str | None:
    cleaned = re.sub(r"[\s\-]", "", phone.strip())
    if not PHONE_REGEX.match(cleaned):
        return "Phone must be 9-10 digits starting with 0"
    return None


def validate_password(password: str) -> str | None:
    if not password or len(password) < 8:
        return "Password must be at least 8 characters"
    return None


def validate_zipcode(zipcode: str) -> str | None:
    if not re.match(r"^\d{5}$", zipcode.strip()):
        return "ZipCode must be exactly 5 digits"
    return None


def collect_errors(**fields) -> dict:
    return {k: v for k, v in fields.items() if v is not None}