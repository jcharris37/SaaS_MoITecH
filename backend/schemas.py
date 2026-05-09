from pydantic import BaseModel
from typing import List, Optional

class ProductBase(BaseModel):
    name: str
    price: float
    stock: int
    category: Optional[str] = "General"

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

class TenantCreate(BaseModel):
    name: str
    owner_email: str
    password: str
    advisor_phone: str

class TenantOut(BaseModel):
    id: int
    name: str
    owner_email: str
    slug: str
    advisor_phone: Optional[str] = None
    model_config = {"from_attributes": True}
class Token(BaseModel):
    access_token: str
    refresh_token: str     
    token_type: str
    tenant_id: Optional[int] = None
    role: str

class RefreshRequest(BaseModel):     
    refresh_token: str