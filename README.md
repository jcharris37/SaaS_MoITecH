# 🚀 MoITecH (Moihub) — Plataforma SaaS Multi-tenant

MoITecH es una plataforma SaaS diseñada para que diversos tipos de negocios (tiendas retail, restaurantes, centros de salud, spas, centros educativos, servicios técnicos, etc.) registren su marca, obtengan una tienda virtual (Storefront) pública autogestionable y controlen sus operaciones diarias desde un panel administrativo.

---

## 🏗️ Arquitectura de la Aplicación

La plataforma se compone de dos partes:

1. **Frontend (Vite + React + TypeScript)**:
   - Panel administrativo para gestionar productos, clientes, citas, facturación y reglas de chatbot.
   - Vista de Storefront pública que adapta su interfaz, hero section y flujo según el tipo de negocio seleccionado.
   - Animaciones fluidas con **Framer Motion** y gráficos dinámicos con **Recharts**.
   - Estilizado moderno con **Bootstrap** y CSS personalizado.

2. **Backend (FastAPI + SQLAlchemy)**:
   - API REST robusta que maneja autenticación JWT segura (tokens de acceso y tokens de refresco).
   - Control de límite de peticiones (**slowapi**) para prevenir abusos en rutas críticas.
   - Aislamiento multi-tenant a nivel de consultas a la base de datos basándose en el tenant extraído del token JWT.

---

## ⚙️ Configuración del Proyecto (.env)

Crea un archivo `.env` en la raíz del proyecto. Puedes tomar como guía el archivo `.env.example`:

```env
# JWT & Seguridad
SECRET_KEY=tu_clave_secreta_aqui_para_firmar_los_tokens
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Base de Datos (SQLite para desarrollo local o PostgreSQL/MySQL para producción)
DATABASE_URL=sqlite:///./backend/moitech.db

# Super Admin (Credenciales globales para el administrador del SaaS)
ADMIN_EMAIL=admin@moihub.com
ADMIN_PASSWORD=tu_contraseña_secreta

# Dirección de la API
VITE_API_URL=http://localhost:8000
```

---

## 🛠️ Cómo Iniciar en Desarrollo Local

### Opción Rápida (Ambos servicios a la vez)
Puedes levantar el backend y el frontend de forma simultánea ejecutando un único comando desde la raíz del proyecto:

```bash
# 1. Instala las dependencias del frontend
npm install

# 2. Prepara el entorno virtual del backend e instala sus requisitos
cd backend
python -m venv venv
source venv/bin/activate  # En Windows usa: venv\Scripts\activate
pip install -r requirements.txt
cd ..

# 3. Inicia ambos servidores juntos
npm run dev:all
```
> El frontend estará disponible en `http://localhost:5173` y la API del backend en `http://localhost:8000`.

---

### Opción Detallada (Servicios por separado)

#### **Frontend**
```bash
npm install
npm run dev
```

#### **Backend**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # O venv\Scripts\activate en Windows
pip install -r requirements.txt
python main.py
```

---

## 🐳 Ejecución con Docker

Si prefieres usar contenedores, el proyecto incluye un archivo `docker-compose.yml` configurado para compilar y ejecutar todo el entorno:

```bash
docker-compose up --build -d
```

- **Frontend Web:** Accesible en `http://localhost:8080`
- **Backend API:** Accesible en `http://localhost:8000`

---

## 📂 Estructura del Código

```text
├── backend/
│   ├── main.py          # Endpoints de FastAPI, CORS, limites y lógica principal.
│   ├── models.py        # Modelos relacionales de SQLAlchemy (Tenants, Products, Appointments, Invoices...).
│   ├── schemas.py       # Esquemas Pydantic para validación y serialización de datos.
│   ├── database.py      # Inicialización del motor y sesión de base de datos.
│   ├── auth.py          # Lógica de hashing de contraseñas y firma de tokens JWT.
│   └── static/          # Directorio local para almacenamiento de logos e imágenes de productos.
├── src/
│   ├── components/      # Componentes visuales reutilizables (Sidebar, widgets de chat, loaders).
│   ├── pages/           # Vistas (Dashboard, Storefront, Citas, Facturación, Clientes, Login...).
│   ├── services/        # Cliente HTTP centralizado (Axios) para peticiones a la API.
│   ├── App.tsx          # Enrutamiento principal de la aplicación.
│   └── index.css        # Configuración global del diseño y variables CSS.
```

---

## 💡 Funcionalidades Clave

* **Storefront Inteligente:** Adapta la experiencia del usuario final al tipo de negocio. Si es de servicios (médicos, estéticos, técnicos), activa el módulo de agendamiento y reserva de citas con validación de horarios ocupados en tiempo real. Si es un comercio (retail, restaurante), activa el catálogo interactivo con carrito de compras y confirmación directa por WhatsApp.
* **Facturación con PDF:** Generación automática de comprobantes de pago en PDF utilizando `jspdf`, calculando subtotal, IVA e importes finales.
* **Asistente de Respuestas Automáticas:** Permite a los dueños de negocios programar palabras clave para simular respuestas automáticas (tipo bot/IVR) que guían a sus usuarios.
