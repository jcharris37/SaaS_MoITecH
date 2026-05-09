from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Tenant(Base):
    __tablename__ = "tenants"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    owner_email = Column(String, unique=True, index=True)
    hashed_password = Column(String) # NUEVO: Para el login
    advisor_phone = Column(String) 
    slug = Column(String, unique=True, index=True)
    
    products = relationship("Product", back_populates="tenant")
    bot_rules = relationship("BotRule", back_populates="tenant")
    clients = relationship("Client", back_populates="tenant")

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"))
    name = Column(String, index=True)
    price = Column(Float)
    stock = Column(Integer, default=0)
    category = Column(String, default="General")
    
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
    expires_at = Column(String)   # ISO string, fácil de comparar
    revoked = Column(Integer, default=0)  # 0 = válido, 1 = revocado

    tenant = relationship("Tenant")