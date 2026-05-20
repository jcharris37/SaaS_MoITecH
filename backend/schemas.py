from pydantic import BaseModel, field_validator
from typing import List, Optional
import re

# ─────────────────────────────────────────
# PRODUCTS
# ─────────────────────────────────────────
class ProductBase(BaseModel):
    name: str
    price: float
    stock: int
    category: Optional[str] = "General"
    image_url: Optional[str] = None
    description: Optional[str] = None

class ProductCreate(ProductBase):
    pass

class ProductOut(ProductBase):
    id: int
    model_config = {"from_attributes": True}

# ─────────────────────────────────────────
# BOT RULES
# ─────────────────────────────────────────
class BotRuleBase(BaseModel):
    trigger_keyword: str
    response_text: str

class BotRuleCreate(BotRuleBase):
    pass

class BotRuleOut(BotRuleBase):
    id: int
    model_config = {"from_attributes": True}

# ─────────────────────────────────────────
# CLIENTS
# ─────────────────────────────────────────
class ClientBase(BaseModel):
    name: str
    phone: str
    total_orders: Optional[int] = 0
    status: Optional[str] = "Activo"

class ClientCreate(ClientBase):
    pass

class ClientOut(ClientBase):
    id: int
    model_config = {"from_attributes": True}

# ─────────────────────────────────────────
# DASHBOARD STATS
# ─────────────────────────────────────────
class DashboardStats(BaseModel):
    total_sales: float
    active_clients: int
    total_products: int
    total_messages: int
    paid_invoices: int
    pending_invoices: int
    total_appointments_today: int
    completed_appointments_today: int

# ─────────────────────────────────────────
# CHAT & CHECKOUT
# ─────────────────────────────────────────
class ChatRequest(BaseModel):
    message: str

class CheckoutItem(BaseModel):
    product_id: int
    quantity: int

class CheckoutRequest(BaseModel):
    client_name: str
    client_phone: str
    client_address: Optional[str] = None
    notes: Optional[str] = None
    items: List[CheckoutItem]

class CheckoutResponse(BaseModel):
    message: str
    whatsapp_url: str

# ─────────────────────────────────────────
# AUTH
# ─────────────────────────────────────────
class LoginRequest(BaseModel):
    email:Optional[str]=None
    password: str
    captcha_token: Optional[str] = None

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    tenant_id: Optional[int] = None
    role: str

class RefreshRequest(BaseModel):
    refresh_token: str

class PasswordResetRequest(BaseModel):
    email: str
    new_password: str

    @field_validator("new_password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("La contraseña debe contener al menos una letra")
        if not re.search(r"[0-9]", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v

class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    slug: str
    role: str
    business_type: Optional[str] = "retail"
    logo_url: Optional[str] = None
    theme_color: Optional[str] = "#ea580c"
    business_nit: Optional[str] = None
    business_address: Optional[str] = None
    tax_rate: Optional[float] = 19.0

# ─────────────────────────────────────────
# TENANT
# ─────────────────────────────────────────
class TenantCreate(BaseModel):
    name: str
    owner_email: str
    password: str
    advisor_phone: str
    business_type: str = "retail"
    business_nit: Optional[str] = None
    business_address: Optional[str] = None
    captcha_token: str = ""

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("La contraseña debe tener al menos 8 caracteres")
        if not re.search(r"[A-Za-z]", v):
            raise ValueError("La contraseña debe contener al menos una letra")
        if not re.search(r"[0-9]", v):
            raise ValueError("La contraseña debe contener al menos un número")
        return v

    @field_validator("owner_email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        pattern = r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
        if not re.match(pattern, v):
            raise ValueError("Formato de correo electrónico inválido")
        return v.lower()

class TenantOut(BaseModel):
    id: int
    name: str
    owner_email: str
    slug: str
    advisor_phone: Optional[str] = None
    logo_url: Optional[str] = None
    theme_color: Optional[str] = "#ea580c"
    business_type: Optional[str] = "retail"
    business_nit: Optional[str] = None
    business_address: Optional[str] = None
    tax_rate: Optional[float] = 19.0
    model_config = {"from_attributes": True}

# ─────────────────────────────────────────
# SERVICE PROVIDERS & APPOINTMENTS
# ─────────────────────────────────────────
class ServiceProviderBase(BaseModel):
    name: str
    profile_image: Optional[str] = None

class ServiceProviderCreate(ServiceProviderBase):
    pass

class ServiceProviderOut(ServiceProviderBase):
    id: int
    tenant_id: int
    model_config = {"from_attributes": True}

class AppointmentBase(BaseModel):
    provider_id: Optional[int] = None
    client_name: str
    client_phone: Optional[str] = None
    date: str
    time: str
    service_name: Optional[str] = None
    price: Optional[float] = 0.0

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentOut(AppointmentBase):
    id: int
    tenant_id: int
    status: str
    model_config = {"from_attributes": True}

# ─────────────────────────────────────────
# INVOICES
# ─────────────────────────────────────────
class InvoiceItemCreate(BaseModel):
    description: str
    quantity: float = 1.0
    unit_price: float = 0.0
    subtotal: float = 0.0

class InvoiceItemOut(InvoiceItemCreate):
    id: int
    model_config = {"from_attributes": True}

class InvoiceCreate(BaseModel):
    client_name: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    notes: Optional[str] = None
    items: List[InvoiceItemCreate]

class InvoiceOut(BaseModel):
    id: int
    tenant_id: int
    invoice_number: str
    client_name: str
    client_phone: Optional[str] = None
    client_email: Optional[str] = None
    subtotal: float
    tax_amount: float
    total: float
    status: str
    notes: Optional[str] = None
    created_at: str
    items: List[InvoiceItemOut] = []
    model_config = {"from_attributes": True}

class InvoiceStatusUpdate(BaseModel):
    status: str  

class AppointmentStatusUpdate(BaseModel):
    status: str

class InvoiceStats(BaseModel):
    total_this_month: float
    total_this_year: float
    paid_count: int
    pending_count: int
    total_invoices: int
