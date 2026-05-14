from pydantic import BaseModel
from typing import List, Optional

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

class BotRuleBase(BaseModel):
    trigger_keyword: str
    response_text: str

class BotRuleCreate(BotRuleBase):
    pass

class BotRuleOut(BotRuleBase):
    id: int
    model_config = {"from_attributes": True}

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

class DashboardStats(BaseModel):
    total_sales: float
    active_clients: int
    total_products: int
    total_messages: int

class ChatRequest(BaseModel):
    message: str

# --- Autenticación ---
class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    tenant_id: Optional[int] = None
    role: str

class UserInfo(BaseModel):
    id: int
    name: str
    email: str
    slug: str
    role: str
    business_type: Optional[str] = "retail"

class TenantCreate(BaseModel):
    name: str
    owner_email: str
    password: str
    advisor_phone: str
    business_type: Optional[str] = "retail"

class TenantOut(BaseModel):
    id: int
    name: str
    owner_email: str
    slug: str
    advisor_phone: Optional[str] = None
    logo_url: Optional[str] = None
    theme_color: Optional[str] = "#ea580c"
    business_type: Optional[str] = "retail"
    model_config = {"from_attributes": True}

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
    provider_id: int
    client_name: str
    client_phone: Optional[str] = None
    date: str
    time: str

class AppointmentCreate(AppointmentBase):
    pass

class AppointmentOut(AppointmentBase):
    id: int
    tenant_id: int
    status: str
    model_config = {"from_attributes": True}
class Token(BaseModel):
    access_token: str
    refresh_token: str     
    token_type: str
    tenant_id: Optional[int] = None
    role: str

class RefreshRequest(BaseModel):     
    refresh_token: str