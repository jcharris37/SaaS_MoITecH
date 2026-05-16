from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    advisor_phone = Column(String)
    slug = Column(String, unique=True, index=True)
    logo_url = Column(String, nullable=True)
    theme_color = Column(String, default="#ea580c")
    business_type = Column(String, default="retail")
    business_nit = Column(String, nullable=True)
    business_address = Column(String, nullable=True)
    tax_rate = Column(Float, default=19.0)

    products = relationship("Product", back_populates="tenant")
    bot_rules = relationship("BotRule", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")
    service_providers = relationship("ServiceProvider", back_populates="tenant", cascade="all, delete")
    appointments = relationship("Appointment", back_populates="tenant", cascade="all, delete")
    invoices = relationship("Invoice", back_populates="tenant", cascade="all, delete")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, index=True)
    price = Column(Float)
    stock = Column(Integer, default=0)
    category = Column(String, default="General")
    image_url = Column(String, nullable=True)
    description = Column(Text, nullable=True)

    tenant = relationship("Tenant", back_populates="products")


class BotRule(Base):
    __tablename__ = "bot_rules"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    trigger_keyword = Column(String, index=True)
    response_text = Column(Text)

    tenant = relationship("Tenant", back_populates="bot_rules")


class Client(Base):
    __tablename__ = "clients"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String)
    phone = Column(String)
    total_orders = Column(Integer, default=0)
    status = Column(String, default="Activo")

    tenant = relationship("Tenant", back_populates="clients")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"
    id = Column(Integer, primary_key=True, index=True)
    token = Column(String, unique=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=True)
    expires_at = Column(String)
    revoked = Column(Integer, default=0)

    tenant = relationship("Tenant")


class ServiceProvider(Base):
    __tablename__ = "service_providers"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, index=True)
    profile_image = Column(String, nullable=True)

    tenant = relationship("Tenant", back_populates="service_providers")
    appointments = relationship("Appointment", back_populates="provider")


class Appointment(Base):
    __tablename__ = "appointments"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    provider_id = Column(Integer, ForeignKey("service_providers.id"), nullable=True)
    client_name = Column(String)
    client_phone = Column(String, nullable=True)
    date = Column(String)
    time = Column(String)
    status = Column(String, default="Pendiente")
    service_name = Column(String, nullable=True)
    price = Column(Float, nullable=True, default=0.0)

    tenant = relationship("Tenant", back_populates="appointments")
    provider = relationship("ServiceProvider", back_populates="appointments")


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    invoice_number = Column(String, index=True)
    client_name = Column(String)
    client_phone = Column(String, nullable=True)
    client_email = Column(String, nullable=True)
    subtotal = Column(Float, default=0.0)
    tax_amount = Column(Float, default=0.0)
    total = Column(Float, default=0.0)
    status = Column(String, default="Pendiente")  # Pendiente | Pagada | Anulada
    notes = Column(Text, nullable=True)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    tenant = relationship("Tenant", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete")


class InvoiceItem(Base):
    __tablename__ = "invoice_items"
    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    description = Column(String)
    quantity = Column(Float, default=1.0)
    unit_price = Column(Float, default=0.0)
    subtotal = Column(Float, default=0.0)

    invoice = relationship("Invoice", back_populates="items")