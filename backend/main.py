from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from sqlalchemy.orm import Session
from database import engine, Base, get_db
import models
import schemas
import random
import auth
from jose import jwt, JWTError

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Moihub Storefront & Admin API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# RUTAS DE AUTENTICACIÓN (LOGIN)
# ==========================================
@app.post("/api/login", response_model=schemas.Token)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):
    # 1. Check SuperAdmin estático
    if req.email == "admin@moihub.com" and req.password == "admin123":
        access_token = auth.create_access_token(data={"sub": "admin", "role": "superadmin", "tenant_id": 0})
        return {"access_token": access_token, "token_type": "bearer", "tenant_id": 0, "role": "superadmin"}
    
    # 2. Check Tenant en Base de Datos
    tenant = db.query(models.Tenant).filter(models.Tenant.owner_email == req.email).first()
    if not tenant or not auth.verify_password(req.password, tenant.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
        
    access_token = auth.create_access_token(data={"sub": tenant.owner_email, "role": "tenant", "tenant_id": tenant.id})
    return {"access_token": access_token, "token_type": "bearer", "tenant_id": tenant.id, "role": "tenant"}

@app.get("/api/me", response_model=schemas.UserInfo)
def read_users_me(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")
        
    token = auth_header.split(" ")[1]
    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        role = payload.get("role")
        
        if role == "superadmin":
            return {"id": 0, "name": "Super Admin", "email": "admin@moihub.com", "slug": "admin", "role": "superadmin"}
            
        tenant_id = payload.get("tenant_id")
        tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
        if not tenant:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
            
        return {"id": tenant.id, "name": tenant.name, "email": tenant.owner_email, "slug": tenant.slug, "role": "tenant"}
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

import re
def generate_slug(name: str) -> str:
    # Convertir a minúsculas, reemplazar espacios por guiones y quitar no-alfanuméricos
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')
    return slug

@app.post("/api/register")
def register_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db)):
    # Check si el email ya existe
    existing = db.query(models.Tenant).filter(models.Tenant.owner_email == tenant.owner_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")
    
    # Generar Slug único
    base_slug = generate_slug(tenant.name)
    slug = base_slug
    counter = 1
    while db.query(models.Tenant).filter(models.Tenant.slug == slug).first():
        slug = f"{base_slug}-{counter}"
        counter += 1

    hashed_pw = auth.get_password_hash(tenant.password)
    new_tenant = models.Tenant(
        name=tenant.name,
        owner_email=tenant.owner_email,
        hashed_password=hashed_pw,
        advisor_phone=tenant.advisor_phone,
        slug=slug
    )
    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)
    return {"message": "Negocio registrado exitosamente", "slug": slug}

# ==========================================
# RUTAS SUPER ADMIN
# ==========================================
@app.get("/api/tenants", response_model=list[schemas.TenantOut])
def get_all_tenants(db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()

# ==========================================
# RUTAS PÚBLICAS PARA EL STOREFRONT
# ==========================================
@app.get("/api/store/{slug}/products", response_model=list[schemas.ProductOut])
def get_store_products(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        return []
    return tenant.products

@app.post("/api/store/{slug}/chat")
async def chat_with_store_bot(slug: str, chat_req: schemas.ChatRequest, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        return {"reply": "Negocio no encontrado."}
    
    user_message = chat_req.message.lower().strip()
    rules = db.query(models.BotRule).filter(models.BotRule.tenant_id == tenant.id).all()
    
    for rule in rules:
        if rule.trigger_keyword.lower() in user_message:
            return {"reply": rule.response_text}
            
    return {"reply": "Lo siento, no entiendo. Escribe palabras clave como 'precio', 'ubicación' o 'horario'."}

# ==========================================
# RUTAS INTERNAS (DASHBOARD)
# Asumimos tenant_id = 1 fijo por ahora para demostración
# ==========================================

# Reglas (Chat Bot)
@app.post("/api/rules/{tenant_id}", response_model=schemas.BotRuleOut)
def create_rule(tenant_id: int, rule: schemas.BotRuleCreate, db: Session = Depends(get_db)):
    new_rule = models.BotRule(tenant_id=tenant_id, trigger_keyword=rule.trigger_keyword, response_text=rule.response_text)
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@app.get("/api/rules/{tenant_id}", response_model=list[schemas.BotRuleOut])
def get_rules(tenant_id: int, db: Session = Depends(get_db)):
    return db.query(models.BotRule).filter(models.BotRule.tenant_id == tenant_id).all()

@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: int, db: Session = Depends(get_db)):
    rule = db.query(models.BotRule).filter(models.BotRule.id == rule_id).first()
    if rule:
        db.delete(rule)
        db.commit()
    return {"status": "ok"}

# Productos
@app.post("/api/products/{tenant_id}", response_model=schemas.ProductOut)
def create_product(tenant_id: int, product: schemas.ProductCreate, db: Session = Depends(get_db)):
    new_product = models.Product(
        tenant_id=tenant_id, 
        name=product.name, 
        price=product.price, 
        stock=product.stock,
        category=product.category
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/api/products/{tenant_id}", response_model=list[schemas.ProductOut])
def get_products(tenant_id: int, db: Session = Depends(get_db)):
    return db.query(models.Product).filter(models.Product.tenant_id == tenant_id).all()

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    prod = db.query(models.Product).filter(models.Product.id == product_id).first()
    if prod:
        db.delete(prod)
        db.commit()
    return {"status": "ok"}

# Clientes
@app.post("/api/clients/{tenant_id}", response_model=schemas.ClientOut)
def create_client(tenant_id: int, client: schemas.ClientCreate, db: Session = Depends(get_db)):
    new_client = models.Client(
        tenant_id=tenant_id,
        name=client.name,
        phone=client.phone,
        total_orders=client.total_orders,
        status=client.status
    )
    db.add(new_client)
    db.commit()
    db.refresh(new_client)
    return new_client

@app.get("/api/clients/{tenant_id}", response_model=list[schemas.ClientOut])
def get_clients(tenant_id: int, db: Session = Depends(get_db)):
    return db.query(models.Client).filter(models.Client.tenant_id == tenant_id).all()

@app.delete("/api/clients/{client_id}")
def delete_client(client_id: int, db: Session = Depends(get_db)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if client:
        db.delete(client)
        db.commit()
    return {"status": "ok"}

# Estadísticas del Dashboard
@app.get("/api/stats/{tenant_id}", response_model=schemas.DashboardStats)
def get_stats(tenant_id: int, db: Session = Depends(get_db)):
    # Calculos reales de la base de datos
    prods = db.query(models.Product).filter(models.Product.tenant_id == tenant_id).count()
    clients = db.query(models.Client).filter(models.Client.tenant_id == tenant_id).count()
    
    return schemas.DashboardStats(
        total_sales=1250.0 + (clients * 10), # Dato semi-real para demo
        active_clients=clients,
        total_products=prods,
        total_messages=random.randint(50, 200) # Dato simulado
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)