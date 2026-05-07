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
import re

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Moihub Storefront & Admin API")

# 🔐 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 🔐 AUTH HELPERS
# ==========================================
def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

        # 🔥 VALIDACIÓN FUERTE
        if "role" not in payload:
            raise HTTPException(status_code=401, detail="Token inválido")

        return payload

    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")


def get_tenant_id(user: dict):
    tenant_id = user.get("tenant_id")

    if tenant_id is None:
        raise HTTPException(status_code=403, detail="Tenant no válido")

    return tenant_id


def require_admin(user=Depends(get_current_user)):
    if user.get("role") != "superadmin":
        raise HTTPException(status_code=403, detail="No autorizado")
    return user

# ==========================================
# 🔑 AUTH
# ==========================================
@app.post("/api/login", response_model=schemas.Token)
def login(req: schemas.LoginRequest, db: Session = Depends(get_db)):

    if req.email == "admin@moihub.com" and req.password == "admin123":
        access_token = auth.create_access_token(
            data={"sub": "admin", "role": "superadmin", "tenant_id": 0}
        )
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "tenant_id": 0,
            "role": "superadmin"
        }

    tenant = db.query(models.Tenant).filter(
        models.Tenant.owner_email == req.email
    ).first()

    if not tenant or not auth.verify_password(req.password, tenant.hashed_password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")

    access_token = auth.create_access_token(
        data={
            "sub": tenant.owner_email,
            "role": "tenant",
            "tenant_id": tenant.id
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "tenant_id": tenant.id,
        "role": "tenant"
    }

@app.get("/api/me", response_model=schemas.UserInfo)
def read_users_me(user=Depends(get_current_user), db: Session = Depends(get_db)):

    if user["role"] == "superadmin":
        return {
            "id": 0,
            "name": "Super Admin",
            "email": "admin@moihub.com",
            "slug": "admin",
            "role": "superadmin"
        }

    tenant_id = get_tenant_id(user)

    tenant = db.query(models.Tenant).filter(
        models.Tenant.id == tenant_id
    ).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return {
        "id": tenant.id,
        "name": tenant.name,
        "email": tenant.owner_email,
        "slug": tenant.slug,
        "role": "tenant"
    }

# ==========================================
# 🏪 REGISTER
# ==========================================
def generate_slug(name: str) -> str:
    slug = name.lower()
    slug = re.sub(r'[^a-z0-9\s-]', '', slug)
    slug = re.sub(r'[\s-]+', '-', slug).strip('-')
    return slug

@app.post("/api/register")
def register_tenant(tenant: schemas.TenantCreate, db: Session = Depends(get_db)):

    existing = db.query(models.Tenant).filter(
        models.Tenant.owner_email == tenant.owner_email
    ).first()

    if existing:
        raise HTTPException(status_code=400, detail="El correo ya está registrado")

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
# 👑 ADMIN
# ==========================================
@app.get("/api/tenants", response_model=list[schemas.TenantOut])
def get_all_tenants(admin=Depends(require_admin), db: Session = Depends(get_db)):
    return db.query(models.Tenant).all()

# ==========================================
# 🗑️ DELETE TENANT (ADMIN)
# ==========================================
@app.delete("/api/tenants/{tenant_id}")
def delete_tenant(
    tenant_id: int,
    admin=Depends(require_admin),
    db: Session = Depends(get_db)
):
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()

    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")

    db.delete(tenant)
    db.commit()

    return {"status": "ok"}


# ==========================================
# 🌍 PUBLIC STORE
# ==========================================
@app.get("/api/store/{slug}/products", response_model=list[schemas.ProductOut])
def get_store_products(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        return []
    return tenant.products

# ==========================================
# 🔐 PRIVATE (MULTI-TENANT SEGURO)
# ==========================================

# PRODUCTOS
@app.get("/api/products", response_model=list[schemas.ProductOut])
def get_products(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.Product).filter(models.Product.tenant_id == tenant_id).all()

@app.post("/api/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)

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

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)

    prod = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.tenant_id == tenant_id
    ).first()

    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    db.delete(prod)
    db.commit()
    return {"status": "ok"}

# CLIENTES
@app.get("/api/clients", response_model=list[schemas.ClientOut])
def get_clients(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.Client).filter(models.Client.tenant_id == tenant_id).all()

# STATS
@app.get("/api/stats", response_model=schemas.DashboardStats)
def get_stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)

    prods = db.query(models.Product).filter(models.Product.tenant_id == tenant_id).count()
    clients = db.query(models.Client).filter(models.Client.tenant_id == tenant_id).count()

    return schemas.DashboardStats(
        total_sales=1250.0 + (clients * 10),
        active_clients=clients,
        total_products=prods,
        total_messages=random.randint(50, 200)
    )

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)