# Loom Platform Documentation

Welcome to the Loom Platform documentation. This document outlines the architecture, core capabilities, and developer guidelines for the platform.

## 1. Overview
The Loom platform is a metadata-driven, dynamic Web Application built for structured data management, primarily focused on clinical and generic data models. It consists of a **FastAPI** backend and a **React** (Vite + TypeScript) frontend. 

The core philosophy of the framework is **Blueprint-driven Development**: Instead of writing boilerplate CRUD (Create, Read, Update, Delete) code for every new entity, developers define the entity structure in YAML blueprints. The backend automatically generates REST APIs and database integrations, while the frontend dynamically renders tables, forms, and views based on those definitions.

## 2. Architecture Stack
- **Backend**: Python 3, FastAPI, SQLAlchemy (ORM), Alembic (Migrations).
- **Frontend**: React 18, TypeScript, Vite, React Router, Tailwind CSS (Styling).
- **Authentication**: JWT (JSON Web Tokens) with Role-Based Access Control (RBAC).

## 3. Core Concepts

### Blueprints (`backend/blueprints/*.yaml`)
Blueprints are the source of truth for the application's data models and UI structure. A YAML blueprint defines:
- **Module Info**: Name, category (e.g., Clinical), and description.
- **UI Settings**: Icon, default view, and sidebar visibility.
- **Fields**: Database columns, types (String, Integer, Boolean, JSON, etc.), and constraints (required, default).
- **Associations**: Relationships to other modules (e.g., `Patient` has_many `Encounter`).
- **Views**: The configuration of tabs/pages for record viewing (Summary, Associations, Comments, History, Custom).
- **Overrides**: Pointers to custom React components or backend routers when standard logic is insufficient.

### Dynamic Backend Routing
The backend (`main.py`) exposes a set of universal endpoints:
- `GET /v1/modules`: Returns all available modules and their UI metadata based on the YAML blueprints and the user's permissions.
- `/v1/app/{model_name}`: Handles standard GET, POST, PUT, DELETE operations generically using SQLAlchemy reflection.
- **Overrides**: Custom logic can be injected. If a blueprint specifies a `backend_router` override, the system dynamically loads the custom FastAPI router.

### Dynamic Frontend Routing
The frontend routes all record workflows through `DynamicRoute.tsx`:
- `/app/:module` maps to a dynamic `ModuleListView` (Data table).
- `/app/:module/new` maps to a `RecordForm` (Data creation).
- `/app/:module/:id` maps to a `RecordView` (Data details).
- **Custom React Views**: Via Vite's `import.meta.glob`, the framework can lazy-load completely custom React pages (e.g., `PatientAnalytics.tsx`) injecting them seamlessly into the generated UI.

## 4. Security & Permissions
Authentication is handled via JWT. The `AuthContext` on the frontend manages the user session.
Each user belongs to a `Role` with defined JSON permissions (e.g., `patient:read`, `patient:write`, `*:*` for superadmin).
Backend routes enforce permissions via the `check_permissions` utility before executing standard database operations.

## 5. Developer Guide: Adding a New Feature

### Step 1: Create a Blueprint
Create a new YAML file in `backend/blueprints/` (e.g., `invoice.yaml`):
```yaml
name: Invoice
module: Billing
ui:
  show_in_sidebar: true
  icon: "file-text"
fields:
  - name: amount
    type: Float
  - name: status
    type: String
    default: "Draft"
```

### Step 2: Update the ORM Model
Add the corresponding SQLAlchemy class to `backend/models.py`:
```python
class Invoice(Base):
    __tablename__ = 'invoices'
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    status = Column(String, default="Draft")
```

### Step 3: Run Migrations (if applicable)
Use Alembic to generate and apply database schemas.

### Step 4: Add Custom Logic (Optional)
**Frontend Custom View**: 
Create `frontend/src/pages/custom/InvoiceView.tsx` and map it in the blueprint under `overrides`.
**Backend Custom Logic**: 
Create `backend/routers/invoice.py` to add domain-specific API logic beyond the standard CRUD endpoints and map it within the blueprint.

## 6. Built-in Modules
- **Clinical**: Patient, Encounter, Document, History.
- **System**: Role, User, AuditLog, Comment, Notes, Projects, Humans.

## Conclusion
The Loom framework enables rapid application development by eliminating low-value boilerplate. Developers only need to write code when implementing complex, domain-specific business logic or unique user interfaces.
