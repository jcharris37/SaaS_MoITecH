from fastapi import FastAPI, Request, Depends, HTTPException, File, UploadFile
from fastapi.staticfiles import StaticFiles
import shutil
import sqlalchemy
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
from typing import List
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv

env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '.env'))
load_dotenv(env_path)

load_dotenv(env_path)

def run_migration(query: str):
    try:
        with engine.begin() as conn:
            conn.execute(sqlalchemy.text(query))
    except Exception:
        pass

run_migration("ALTER TABLE tenants ADD COLUMN logo_url VARCHAR")
run_migration("ALTER TABLE tenants ADD COLUMN theme_color VARCHAR DEFAULT '#ea580c'")
run_migration("ALTER TABLE tenants ADD COLUMN business_type VARCHAR DEFAULT 'retail'")
run_migration("ALTER TABLE tenants ADD COLUMN business_nit VARCHAR")
run_migration("ALTER TABLE tenants ADD COLUMN business_address VARCHAR")
run_migration("ALTER TABLE tenants ADD COLUMN tax_rate FLOAT DEFAULT 19.0")
run_migration("ALTER TABLE products ADD COLUMN image_url VARCHAR")
run_migration("ALTER TABLE products ADD COLUMN description TEXT")

os.makedirs("static/uploads", exist_ok=True)

app = FastAPI(title="Moihub Storefront & Admin API")
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.on_event("startup")
def startup_event():
    # Solo intentamos crear las tablas básicas. Si faltan columnas, 
    # daremos un mensaje pero no bloquearemos el inicio del servidor.
    try:
        models.Base.metadata.create_all(bind=engine)
    except Exception as e:
        print(f"Error en base de datos: {e}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
	    "http://163.192.2.96",

    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_current_user(request: Request):
    auth_header = request.headers.get("Authorization")

    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="No autenticado")

    token = auth_header.split(" ")[1]

    try:
        payload = jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])

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
    is_admin = req.password == os.getenv("ADMIN_PASSWORD") and req.email in [os.getenv("ADMIN_EMAIL"), ""]
    if not is_admin and not req.captcha_token:
        raise HTTPException(status_code=400, detail="Por favor, completa el captcha")


    if is_admin:
        access_token = auth.create_access_token(
            data={"sub": "admin", "role": "superadmin", "tenant_id": 0}
        )
        refresh_token = auth.create_refresh_token(                    # ← NUEVO
            data={"sub": "admin", "role": "superadmin", "tenant_id": 0}
        )
        # Guardar refresh token en BD
        expires = datetime.utcnow() + timedelta(days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)))
        db.add(models.RefreshToken(
            token=refresh_token,
            tenant_id=None,
            expires_at=expires.isoformat(),
            revoked=0
        ))
        db.commit()

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,                           
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
        data={"sub": tenant.owner_email, "role": "tenant", "tenant_id": tenant.id}
    )
    refresh_token = auth.create_refresh_token(                        # ← NUEVO
        data={"sub": tenant.owner_email, "role": "tenant", "tenant_id": tenant.id}
    )

    # Guardar refresh token en BD                                     # ← NUEVO
    expires = datetime.utcnow() + timedelta(days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)))
    db.add(models.RefreshToken(
        token=refresh_token,
        tenant_id=tenant.id,
        expires_at=expires.isoformat(),
        revoked=0
    ))
    db.commit()

    return {
        "access_token": access_token,
        "refresh_token": refresh_token,                               # ← NUEVO
        "token_type": "bearer",
        "tenant_id": tenant.id,
        "role": "tenant"
    }

@app.post("/api/reset-password")
def reset_password(req: schemas.PasswordResetRequest, db: Session = Depends(get_db)):
    # Simulación MVP: actualizar contraseña directamente si el usuario existe
    tenant = db.query(models.Tenant).filter(models.Tenant.owner_email == req.email).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
        
    tenant.hashed_password = auth.get_password_hash(req.new_password)
    db.commit()
    
    return {"message": "Contraseña actualizada correctamente"}

@app.get("/api/me", response_model=schemas.UserInfo)
def read_users_me(user=Depends(get_current_user), db: Session = Depends(get_db)):

    if user["role"] == "superadmin":
        return {
            "id": 0,
            "name": "Super Admin",
            "email": "admin@moihub.com",
            "slug": "admin",
            "role": "superadmin",
            "business_type": "retail"
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
        "role": "tenant",
        "business_type": tenant.business_type
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

    # Validar teléfono duplicado
    phone_exists = db.query(models.Tenant).filter(
        models.Tenant.advisor_phone == tenant.advisor_phone
    ).first()
    if phone_exists:
        raise HTTPException(status_code=400, detail="Este número de teléfono ya está registrado con otro negocio")

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
        slug=slug,
        business_type=tenant.business_type
    )

    db.add(new_tenant)
    db.commit()
    db.refresh(new_tenant)

    # Seed default bot rule based on business type
    appointments_types = ["appointments", "health", "services"]
    if tenant.business_type in appointments_types:
        default_response = "Hola. Selecciona una opción:\n1. Agendar Cita\n2. Hablar con asesor"
    elif tenant.business_type == "restaurant":
        default_response = "Hola. Selecciona una opción:\n1. Ver Menú\n2. Hablar con asesor"
    elif tenant.business_type == "education":
        default_response = "Hola. Selecciona una opción:\n1. Ver Cursos\n2. Hablar con asesor"
    else:
        default_response = "Hola. Selecciona una opción:\n1. Ver Catálogo\n2. Hablar con asesor"
    
    db.add(models.BotRule(tenant_id=new_tenant.id, trigger_keyword="default", response_text=default_response))
    db.add(models.BotRule(tenant_id=new_tenant.id, trigger_keyword="2", response_text="__REDIRECT_WHATSAPP__"))
    if tenant.business_type in appointments_types:
        db.add(models.BotRule(tenant_id=new_tenant.id, trigger_keyword="1", response_text="Puedes agendar tu cita ingresando al enlace de nuestra web."))
    else:
        db.add(models.BotRule(tenant_id=new_tenant.id, trigger_keyword="1", response_text="Visita nuestro catálogo en la web."))
    db.commit()

    return {"message": "Negocio registrado exitosamente", "slug": slug}

# ==========================================
# 👑 ADMIN
# ==========================================
@app.get("/api/tenants", response_model=List[schemas.TenantOut])
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
    db.query(models.RefreshToken).filter(models.RefreshToken.tenant_id == tenant_id).delete()
    db.delete(tenant)
    db.commit()

    return {"status": "ok"}


# ==========================================
# 🌍 PUBLIC STORE
# ==========================================
@app.get("/api/store/{slug}/info")
def get_store_info(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
    return {
        "name": tenant.name,
        "slug": tenant.slug,
        "logo_url": tenant.logo_url,
        "theme_color": tenant.theme_color,
        "business_type": tenant.business_type,
        "advisor_phone": tenant.advisor_phone
    }

@app.get("/api/store/{slug}/products", response_model=List[schemas.ProductOut])
def get_store_products(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        return []
    return tenant.products

@app.post("/api/store/{slug}/chat")
def store_chat(slug: str, req: schemas.ChatRequest, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tienda no encontrada")
        
    user_msg = req.message.strip().lower()
    
    # 1. Buscar regla exacta
    rule = db.query(models.BotRule).filter(
        models.BotRule.tenant_id == tenant.id,
        models.BotRule.trigger_keyword == user_msg
    ).first()
    
    # 2. Si no hay regla exacta, buscar el mensaje de bienvenida (default)
    if not rule:
        default_rule = db.query(models.BotRule).filter(
            models.BotRule.tenant_id == tenant.id,
            models.BotRule.trigger_keyword == "default"
        ).first()
        
        reply_text = default_rule.response_text if default_rule else "Hola. Escribe una opción válida del menú o inténtalo de nuevo."
        return {"reply": reply_text, "action": "text"}
        
    # 3. Si hay regla, procesarla
    if rule.response_text == "__REDIRECT_WHATSAPP__":
        return {
            "reply": "Conectando con nuestro asesor...", 
            "action": "redirect_whatsapp", 
            "phone": tenant.advisor_phone or ""
        }
        
    return {"reply": rule.response_text, "action": "text"}

# ==========================================
# 🔐 PRIVATE (MULTI-TENANT SEGURO)
# ==========================================

# CONFIGURACIÓN
@app.put("/api/settings")
def update_settings(req: dict, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    if "theme_color" in req:
        tenant.theme_color = req["theme_color"]
    if "logo_url" in req:
        tenant.logo_url = req["logo_url"]
        
    db.commit()
    return {"message": "Ajustes actualizados"}

@app.post("/api/upload")
async def upload_image(file: UploadFile = File(...)):
    # Guardar localmente
    file_location = f"static/uploads/{file.filename}"
    with open(file_location, "wb+") as file_object:
        shutil.copyfileobj(file.file, file_object)
    
    # Podríamos usar variables de entorno para el dominio base, por ahora ruta relativa o absoluta local
    # Para Vite, es mejor retornar la URL relativa al servidor
    # El frontend luego antepone la VITE_API_URL
    return {"url": f"/{file_location}"}

# CITAS Y PERSONAL
@app.get("/api/providers", response_model=List[schemas.ServiceProviderOut])
def get_providers(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.ServiceProvider).filter(models.ServiceProvider.tenant_id == tenant_id).all()

@app.post("/api/providers", response_model=schemas.ServiceProviderOut)
def create_provider(provider: schemas.ServiceProviderCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    new_prov = models.ServiceProvider(tenant_id=tenant_id, name=provider.name, profile_image=provider.profile_image)
    db.add(new_prov)
    db.commit()
    db.refresh(new_prov)
    return new_prov

@app.get("/api/appointments", response_model=List[schemas.AppointmentOut])
def get_appointments(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.Appointment).filter(models.Appointment.tenant_id == tenant_id).all()

# PUBLIC ENDPOINTS FOR APPOINTMENTS (used by Storefront)
@app.get("/api/store/{slug}/providers", response_model=List[schemas.ServiceProviderOut])
def get_store_providers(slug: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        return []
    return db.query(models.ServiceProvider).filter(models.ServiceProvider.tenant_id == tenant.id).all()

@app.get("/api/store/{slug}/providers/{provider_id}/busy-times")
def get_busy_times(slug: str, provider_id: int, date: str, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
    
    appointments = db.query(models.Appointment).filter(
        models.Appointment.tenant_id == tenant.id,
        models.Appointment.provider_id == provider_id,
        models.Appointment.date == date
    ).all()
    
    return [appt.time for appt in appointments]

@app.post("/api/store/{slug}/appointments", response_model=schemas.AppointmentOut)
def book_appointment(slug: str, appt: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    tenant = db.query(models.Tenant).filter(models.Tenant.slug == slug).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Negocio no encontrado")
        
    # Evitar doble agenda
    existing = db.query(models.Appointment).filter(
        models.Appointment.tenant_id == tenant.id,
        models.Appointment.provider_id == appt.provider_id,
        models.Appointment.date == appt.date,
        models.Appointment.time == appt.time
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Esta hora ya está ocupada por otra reserva.")
        
    new_appt = models.Appointment(
        tenant_id=tenant.id,
        provider_id=appt.provider_id,
        client_name=appt.client_name,
        client_phone=appt.client_phone,
        date=appt.date,
        time=appt.time
    )
    db.add(new_appt)
    db.commit()
    db.refresh(new_appt)
    return new_appt

# PRODUCTOS
@app.get("/api/products", response_model=List[schemas.ProductOut])
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
        category=product.category,
        image_url=product.image_url,
        description=product.description
    )

    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.put("/api/products/{product_id}", response_model=schemas.ProductOut)
def update_product(product_id: int, product: schemas.ProductCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)

    prod = db.query(models.Product).filter(
        models.Product.id == product_id,
        models.Product.tenant_id == tenant_id
    ).first()

    if not prod:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    prod.name = product.name
    prod.price = product.price
    prod.stock = product.stock
    prod.category = product.category
    prod.description = product.description
    if product.image_url is not None:
        prod.image_url = product.image_url

    db.commit()
    db.refresh(prod)
    return prod

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
@app.get("/api/clients", response_model=List[schemas.ClientOut])
def get_clients(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.Client).filter(models.Client.tenant_id == tenant_id).all()

# REGLAS DEL BOT (IVR)
@app.get("/api/rules", response_model=List[schemas.BotRuleOut])
def get_rules(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.BotRule).filter(models.BotRule.tenant_id == tenant_id).all()

@app.post("/api/rules", response_model=schemas.BotRuleOut)
def create_rule(rule: schemas.BotRuleCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    
    # Si la keyword es "default", sobrescribimos la anterior en vez de crear muchas
    if rule.trigger_keyword.strip().lower() == "default":
        existing = db.query(models.BotRule).filter(
            models.BotRule.tenant_id == tenant_id,
            models.BotRule.trigger_keyword == "default"
        ).first()
        if existing:
            existing.response_text = rule.response_text
            db.commit()
            db.refresh(existing)
            return existing
            
    new_rule = models.BotRule(
        tenant_id=tenant_id,
        trigger_keyword=rule.trigger_keyword.strip().lower(),
        response_text=rule.response_text
    )
    db.add(new_rule)
    db.commit()
    db.refresh(new_rule)
    return new_rule

@app.delete("/api/rules/{rule_id}")
def delete_rule(rule_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    rule = db.query(models.BotRule).filter(models.BotRule.id == rule_id, models.BotRule.tenant_id == tenant_id).first()
    if not rule:
        raise HTTPException(status_code=404, detail="Regla no encontrada")
    db.delete(rule)
    db.commit()
    return {"status": "ok"}

# STATS
@app.get("/api/stats", response_model=schemas.DashboardStats)
def get_stats(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)

    prods = db.query(models.Product).filter(models.Product.tenant_id == tenant_id).count()
    clients = db.query(models.Client).filter(models.Client.tenant_id == tenant_id).count()

    paid_count = db.query(models.Invoice).filter(
        models.Invoice.tenant_id == tenant_id,
        models.Invoice.status == "Pagada"
    ).count()
    pending_count = db.query(models.Invoice).filter(
        models.Invoice.tenant_id == tenant_id,
        models.Invoice.status == "Pendiente"
    ).count()
    
    total_sales = db.query(sqlalchemy.func.sum(models.Invoice.total)).filter(
        models.Invoice.tenant_id == tenant_id,
        models.Invoice.status == "Pagada"
    ).scalar() or 0.0

    today_str = datetime.now().strftime("%Y-%m-%d")
    total_appts = db.query(models.Appointment).filter(
        models.Appointment.tenant_id == tenant_id,
        models.Appointment.date == today_str
    ).count()
    completed_appts = db.query(models.Appointment).filter(
        models.Appointment.tenant_id == tenant_id,
        models.Appointment.date == today_str,
        models.Appointment.status == "Completada"
    ).count()

    return schemas.DashboardStats(
        total_sales=total_sales,
        active_clients=clients,
        total_products=prods,
        total_messages=0,
        paid_invoices=paid_count,
        pending_invoices=pending_count,
        total_appointments_today=total_appts,
        completed_appointments_today=completed_appts
    )

# ==========================================
# 🔄 REFRESH & LOGOUT
# ==========================================
@app.post("/api/refresh", response_model=schemas.Token)
def refresh_token(req: schemas.RefreshRequest, db: Session = Depends(get_db)):
    try:
        payload = auth.decode_refresh_token(req.refresh_token)
    except JWTError:
        raise HTTPException(status_code=403, detail="Refresh token inválido o expirado")

    stored = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == req.refresh_token,
        models.RefreshToken.revoked == 0
    ).first()

    if not stored:
        raise HTTPException(status_code=403, detail="Refresh token revocado")

    # Revocar el viejo
    stored.revoked = 1
    db.commit()

    # Generar nuevos tokens
    new_payload = {"sub": payload["sub"], "role": payload["role"], "tenant_id": payload["tenant_id"]}
    new_access  = auth.create_access_token(new_payload)
    new_refresh = auth.create_refresh_token(new_payload)

    expires = datetime.utcnow() + timedelta(days=int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7)))
    db.add(models.RefreshToken(
        token=new_refresh,
        tenant_id=payload["tenant_id"] if payload["tenant_id"] != 0 else None,
        expires_at=expires.isoformat(),
        revoked=0
    ))
    db.commit()

    return {
        "access_token": new_access,
        "refresh_token": new_refresh,
        "token_type": "bearer",
        "tenant_id": payload["tenant_id"],
        "role": payload["role"],
    }


@app.post("/api/logout")
def logout(req: schemas.RefreshRequest, db: Session = Depends(get_db)):
    stored = db.query(models.RefreshToken).filter(
        models.RefreshToken.token == req.refresh_token
    ).first()
    if stored:
        stored.revoked = 1
        db.commit()
    return {"message": "Sesión cerrada correctamente"}

# ==========================================
# 🧾 INVOICES
# ==========================================
@app.get("/api/invoices", response_model=List[schemas.InvoiceOut])
def get_invoices(user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    return db.query(models.Invoice).filter(models.Invoice.tenant_id == tenant_id).order_by(models.Invoice.created_at.desc()).all()

@app.post("/api/invoices", response_model=schemas.InvoiceOut)
def create_invoice(data: schemas.InvoiceCreate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    
    tenant = db.query(models.Tenant).filter(models.Tenant.id == tenant_id).first()
    tax_rate = tenant.tax_rate if (tenant and tenant.tax_rate is not None) else 19.0
    
    subtotal = sum(i.quantity * i.unit_price for i in data.items)
    tax_amount = subtotal * (tax_rate / 100.0)
    total = subtotal + tax_amount
    
    count = db.query(models.Invoice).filter(models.Invoice.tenant_id == tenant_id).count()
    invoice = models.Invoice(
        tenant_id=tenant_id,
        invoice_number=f"FAC-{count+1:04d}",
        client_name=data.client_name,
        client_phone=data.client_phone,
        client_email=data.client_email,
        subtotal=subtotal,
        tax_amount=tax_amount,
        total=total,
        status="Pendiente",
        notes=data.notes
    )
    db.add(invoice)
    db.flush()
    for item in data.items:
        db.add(models.InvoiceItem(
            invoice_id=invoice.id,
            description=item.description,
            quantity=item.quantity,
            unit_price=item.unit_price,
            subtotal=item.quantity * item.unit_price
        ))
    db.commit()
    db.refresh(invoice)
    return invoice

@app.put("/api/invoices/{invoice_id}/status")
@app.patch("/api/invoices/{invoice_id}/status")
def update_invoice_status(invoice_id: int, data: schemas.InvoiceStatusUpdate, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id, models.Invoice.tenant_id == tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    inv.status = data.status
    db.commit()
    return {"ok": True}

@app.delete("/api/invoices/{invoice_id}")
def delete_invoice(invoice_id: int, user=Depends(get_current_user), db: Session = Depends(get_db)):
    tenant_id = get_tenant_id(user)
    inv = db.query(models.Invoice).filter(models.Invoice.id == invoice_id, models.Invoice.tenant_id == tenant_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    db.delete(inv)
    db.commit()
    return {"ok": True}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
