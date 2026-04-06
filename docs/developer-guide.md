# Loom Developer Guide

> Complete reference for the Loom blueprint-driven internal framework.
> Written for developers picking this up fresh — zero assumptions.

---

## Table of Contents

1. [What Is Loom?](#1-what-is-loom)
2. [Prerequisites](#2-prerequisites)
3. [Getting Started — Local Setup](#3-getting-started--local-setup)
4. [Getting Started — Docker](#4-getting-started--docker)
5. [Project Structure](#5-project-structure)
6. [The Blueprint YAML Reference](#6-the-blueprint-yaml-reference)
7. [Backend Framework Guide](#7-backend-framework-guide)
8. [RBAC & Permissions](#8-rbac--permissions)
9. [Frontend Framework Guide](#9-frontend-framework-guide)
10. [Plugin System](#10-plugin-system)
11. [Database Migrations Workflow](#11-database-migrations-workflow)
12. [Agentic Developer Tools](#12-agentic-developer-tools)
13. [Settings & Configuration](#13-settings--configuration)
14. [Security Guide](#14-security-guide)
15. [Troubleshooting & FAQ](#15-troubleshooting--faq)

---

## 1. What Is Loom?

Loom is a **blueprint-driven full-stack framework**. You declare what data looks like in YAML — Loom generates the database tables, REST API, validation, RBAC, audit trail, and frontend UI automatically.

> **Framework model**: Loom is not a hosted platform. Each project clones and runs its own Loom instance. Think Django or FastAPI — a powerful core you own and extend, not a SaaS you subscribe to.

One YAML file gives you:
- A PostgreSQL database table (via SQLAlchemy + Alembic)
- Full REST API: `GET`, `POST`, `PUT`, `DELETE`
- Auto Pydantic request validation
- Auto-generated Swagger/OpenAPI docs at `/docs`
- Role-Based Access Control (RBAC) permissions
- Audit trail (who changed what, when)
- A fully rendered frontend: list views, forms, record detail tabs, comments, history

**Core Architecture Layers:**

```
┌────────────────────────────────────────┐
│              YAML Blueprints           │  ← you write this (project-owned)
├────────────────────────────────────────┤
│       Blueprint Engine  (main.py)      │  ← loom-core parses at startup
├──────────────────┬─────────────────────┤
│  FastAPI Backend │   React Frontend    │  ← auto-generated from blueprints
├──────────────────┼─────────────────────┤
│  Core Plugins    │  Project Plugins    │  ← core: auth/rbac/audit; yours: domain logic
└──────────────────┴─────────────────────┘
```

**Tech stack:**
- **Backend**: Python 3.10+, FastAPI, SQLAlchemy (async), Alembic, Pydantic v2
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Database**: PostgreSQL (required in both personal and organization modes)
- **Auth**: JWT Bearer tokens (HS256)

---

## 2. Prerequisites

| Tool | Version | Install |
|------|---------|---------|
| Python | 3.10+ | [python.org](https://python.org) |
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Docker + Compose | Latest | [docs.docker.com](https://docs.docker.com/get-docker/) |
| Git | Any | — |

Verify:
```bash
python3 --version   # Python 3.10+
node --version      # v18+
docker --version    # Docker 24+
```

---

## 3. Getting Started — Local Setup

### Step 1: Clone and enter the project

```bash
git clone <repo-url>
cd viemed
```

### Step 2: Python virtual environment

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Step 3: Set up the database

```bash
# From the /viemed root:
./make_migrations.sh

# Then apply migrations:
cd backend
alembic upgrade head
```

### Step 4: Seed roles and permissions

```bash
python3 rbac_setup.py
python3 seed_db.py     # Loads sample data (optional)
```

### Step 5: Start the backend

```bash
uvicorn main:app --reload --port 8010
```

Visit [http://localhost:8010/docs](http://localhost:8010/docs) for the interactive Swagger UI.

### Step 6: Start the frontend

```bash
cd ../frontend
npm install
npm run dev
```

Visit [http://localhost:3010](http://localhost:3010)

**Default credentials** (after seeding):
- Email: `admin@loom.com`
- Password: `admin123`

---

## 4. Getting Started — Docker

```bash
docker-compose up --build
```

This starts:
- **PostgreSQL** on port `5433`
- **FastAPI backend** on port `8010`
- **React frontend** on port `3010`

The backend container auto-runs `alembic upgrade head`, `rbac_setup.py`, and `seed_db.py` on first boot.

**Common Docker commands:**
```bash
docker-compose down                          # Stop all services
docker-compose logs -f backend               # Stream backend logs
docker-compose restart backend               # Hot-restart backend
docker-compose exec backend bash             # Shell into backend
docker-compose exec backend alembic upgrade head  # Run pending migrations
```

---

## 5. Project Structure

```
viemed/
├── backend/
│   ├── blueprints/             ← Core blueprints (loom-owned: User, Role — do not modify)
│   │   └── README.md           ← Blueprint ownership rules
│   ├── blueprints_project/     ← Your project-specific domain blueprints (YAML)
│   ├── plugins/                ← Backend plugins (Python)
│   ├── routers/                ← Custom backend router overrides
│   ├── migrations/
│   │   └── versions/           ← Auto-generated Alembic migration scripts
│   ├── tests/                  ← Pytest test files
│   │
│   ├── main.py                 ← App factory + blueprint router engine
│   ├── models.py               ← AUTO-GENERATED — never edit by hand
│   ├── generate_schema.py      ← Regenerates models.py from blueprints
│   ├── execution_mode.py       ← Personal vs. organization mode branching
│   ├── schema_factory.py       ← Dynamic Pydantic model builder
│   ├── audit_logger.py         ← Audit trail helper
│   ├── database.py             ← SQLAlchemy async engine + session
│   ├── auth_router.py          ← Login, register, /me endpoints
│   ├── auth_utils.py           ← JWT, bcrypt, RBAC check helpers
│   ├── admin_router.py         ← User/Role management endpoints
│   ├── settings_router.py      ← System settings key/value store
│   ├── plugin_registry.py      ← Hook + plugin discovery engine
│   ├── rbac_setup.py           ← Seeds roles and permissions to DB
│   ├── rbac_drift.py           ← Detects RBAC drift from blueprints
│   ├── blueprint_linter.py     ← Pre-commit YAML validation
│   ├── agent_test_generator.py ← Auto-generates pytest test suites
│   ├── agent_blueprint_generator.py ← LLM-to-YAML blueprint CLI
│   ├── seed_db.py              ← Seeds sample data
│   ├── settings.py             ← App config (Pydantic BaseSettings)
│   ├── alembic.ini
│   └── requirements.txt
│
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.tsx         ← Home dashboard
│       │   ├── DynamicRoute.tsx      ← Routes all /app/:module URLs
│       │   ├── ModuleListView.tsx    ← Generic paginated list table
│       │   ├── RecordView.tsx        ← Generic record detail + tabs
│       │   ├── RecordForm.tsx        ← Generic create/edit form
│       │   ├── Login.tsx
│       │   ├── AdminDashboard.tsx
│       │   ├── UserManagement.tsx
│       │   ├── RoleManagement.tsx
│       │   ├── SystemSettings.tsx
│       │   └── custom/              ← Your custom UI components go here
│       ├── components/
│       │   ├── Layout.tsx            ← App shell, sidebar, topbar
│       │   └── ThemeConfig.tsx
│       ├── framework/
│       │   ├── pluginRegistry.ts    ← Frontend plugin registry
│       │   └── config.ts
│       ├── context/
│       │   └── AuthContext.tsx      ← Global auth state
│       └── api.ts                   ← Typed API client functions
│
├── docs/
│   ├── examples/               ← Reference blueprints to copy into your project
│   └── ...                     ← Documentation
├── docker-compose.yml
├── make_migrations.sh
└── README.md
```

> **Golden Rule**: Never hand-edit `models.py`. It is always regenerated from blueprints by `generate_schema.py`.
> **Framework Rule**: Domain blueprints (Patient, Invoice, Lead, etc.) live in `blueprints_project/` — never in `blueprints/`.

---

## 6. The Blueprint YAML Reference

A blueprint is a YAML file placed inside `backend/blueprints_project/` (your domain models) or `backend/blueprints/` (loom-core only). It is the **single source of truth** for an entity.

> **Ownership rule**: Only `user.yaml` and `role.yaml` live in `blueprints/`. All your domain models (`patient.yaml`, `invoice.yaml`, etc.) go in `blueprints_project/`. See [`blueprints/README.md`](file:///home/mavee/viemed/backend/blueprints/README.md) for full rules.

### Minimal Blueprint

```yaml
name: Patient
slug: patient
module: Clinical
```

That's it. This gives you full CRUD endpoints and a working frontend UI immediately.

---

### Full Blueprint Anatomy

```yaml
# ─── Identity ───────────────────────────────────────────────────

name: Employee           # REQUIRED. Human-readable name. PascalCase.
slug: employee           # URL-safe key. Used in API routes: /v1/app/employee
module: Organization     # Groups this entity under a sidebar section header
description: "..."       # Short description for admin panels
permission_namespace: employee  # RBAC prefix. Generates "employee:read" etc.
table_name: employees    # Optional. Defaults to slug + "s"


# ─── UI Options ─────────────────────────────────────────────────

ui:
  show_in_sidebar: true   # Show in left navigation
  icon: user              # Lucide icon name (see lucide.dev/icons)
  default_view: summary   # Which view ID opens first on record detail


# ─── Fields ─────────────────────────────────────────────────────

fields:
  - name: first_name       # REQUIRED. Snake_case key
    label: First Name      # Display label in forms and tables
    type: String           # Data type (see Type Reference below)
    required: true         # Whether POST must include this field
    default: "N/A"         # Default value if omitted
    options:               # Only for type: Select
      - Active
      - Inactive


# ─── Associations ────────────────────────────────────────────────

associations:
  - type: belongs_to         # belongs_to | has_many | has_one
    target: Department       # Other blueprint's `name` (PascalCase)
    foreign_key: department_id  # Optional, defaults to "{target_lower}_id"

  - type: has_many
    target: CompanyDocument
    foreign_key: employee_id


# ─── Views ───────────────────────────────────────────────────────

views:
  - name: Summary            # Tab label in the frontend
    id: summary              # Unique ID — used for routing and plugin registration
    type: summary            # View type (see View Types below)

  - name: Documents
    id: documents
    type: association
    target: CompanyDocument  # Required for type: association

  - name: Comments
    id: comments
    type: comments           # Built-in threaded comments

  - name: Audit Trail
    id: history
    type: history            # Built-in field change history

  - name: Analytics
    id: DepartmentDashboard  # Must match the key in overrides
    type: custom             # Renders a custom lazy-loaded React component


# ─── Overrides ───────────────────────────────────────────────────

overrides:
  backend_router: routers/mycustom.py            # Replace generic API
  frontend_DepartmentDashboard: pages/custom/DepartmentDashboard.tsx
```

---

### Field Type Reference

| Type | Python Type | Notes |
|------|-------------|-------|
| `String` | `str` | Text, names, codes |
| `Integer` | `int` | Whole numbers |
| `Float` | `float` | Decimals, currency |
| `Boolean` | `bool` | True/False toggles |
| `DateTime` | `datetime` | Date + time. Supports `default: now()` |
| `Date` | `datetime` | Date only (stored as DateTime) |
| `JSON` | `dict` | Arbitrary JSON objects |
| `Select` | `str` | Dropdown — must also set `options: [...]` |
| `Text` | `str` | Long text / textarea |
| `Email` | `str` | Email string |
| `Password` | `str` | Password input (masked in forms) |
| `URL` | `str` | URL string |
| `PhoneNumber` | `str` | Phone number string |

> **JSONB Storage**: All blueprint `fields` are stored inside a PostgreSQL `JSONB data` column. This means adding a new field to a blueprint never requires a DB column migration — only `associations` (which create FK columns) do.

---

### Association Types

| Type | What It Creates |
|------|----------------|
| `belongs_to` | FK column (`department_id`) + `relationship()` on this model |
| `has_many` | `relationship()` backref only (FK lives on the other model) |
| `has_one` | `relationship(uselist=False)` |

---

### View Types

| Type | What It Renders |
|------|----------------|
| `summary` | Auto key/value card grid of all blueprint fields |
| `association` | Scrollable table of related records from another model |
| `comments` | Threaded discussion tied to this record |
| `history` | Timeline of all field changes from the AuditLog |
| `custom` | Your own React component, code-split and lazy-loaded |

---

## 7. Backend Framework Guide

### Generic REST Endpoints

For every blueprint, Loom automatically creates:

```
POST   /v1/app/{slug}             Create a record          → 201
PUT    /v1/app/{slug}/{id}        Update a record          → 200
GET    /v1/app/{slug}             List records (paginated) → 200
GET    /v1/app/{slug}/{id}        Get a single record      → 200
DELETE /v1/app/{slug}/{id}        Delete a record          → 204
```

All endpoints require:  
```
Authorization: Bearer <jwt_token>
```

**List endpoint query parameters:**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `limit` | 50 | Max records (capped at 100) |
| `offset` | 0 | Pagination offset |
| `{column}` | — | Exact-match filter on any real table column |

```
GET /v1/app/employee?limit=10&offset=20&department_id=5
```

---

### Response Format for List Endpoints

```json
{
  "data": [...],
  "total": 142,
  "limit": 10,
  "offset": 20
}
```

---

### Row-Level Security

If a model has a `tenant_id` column, all queries are automatically scoped to `model.tenant_id == current_user.tenant_id`. No code required.

---

### Audit Logging

Every `POST`, `PUT`, and `DELETE` writes an `AuditLog` entry automatically:

```json
{
  "model_name": "Employee",
  "record_id": 42,
  "action": "Updated",
  "actor": "Jane Doe",
  "timestamp": "2026-03-22T14:00:00",
  "changes": {
    "first_name": {"old": "Jane", "new": "Janet"}
  }
}
```

Controlled by env var: `LOOM_ENABLE_AUDIT=true/false`

The `Comment` and `AuditLog` models are excluded from audit logging to prevent recursion.

---

### Lifecycle Hooks

Hooks let you run custom code on CRUD events **without modifying the core framework**. Register them inside a plugin.

**Available hook actions:**

| Action | Arguments passed to handler |
|--------|----------------------------|
| `before_create` | `data_dict, current_user, db` |
| `after_create` | `instance, current_user, db` |
| `before_update` | `instance, data_dict, current_user, db` |
| `after_update` | `instance, changes, current_user, db` |
| `before_delete` | `instance, current_user, db` |
| `after_delete` | `old_data, current_user, db` |

**Registering a hook** (inside a plugin):

```python
from plugin_registry import registry

# Both sync and async handlers are supported
async def on_employee_created(instance, current_user, db):
    print(f"New employee: {instance.data.get('first_name')}")

registry.hooks.register("Employee", "after_create", on_employee_created)
```

---

### Custom Backend Router Overrides

To replace the generic API for a blueprint with your own FastAPI router:

**`backend/routers/patient.py`:**
```python
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database import get_db

router = APIRouter(prefix="/v1/app/patient")

@router.get("")
async def list_patients(db: AsyncSession = Depends(get_db)):
    # Your custom logic here
    return [{"id": 1, "name": "John Doe"}]
```

**In your blueprint YAML:**
```yaml
overrides:
  backend_router: routers/patient.py
```

This replaces the generic list GET endpoint for that module. Other methods (POST, PUT, DELETE) still use the generic engine unless you also define them.

---

### Authentication Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `POST` | `/v1/auth/login` | No | Returns JWT token |
| `POST` | `/v1/auth/register` | No | Creates user with Standard User role |
| `GET` | `/v1/auth/me` | Yes | Current user + permissions |
| `PUT` | `/v1/auth/me` | Yes | Update own name or password |

**Login:**
```bash
curl -X POST http://localhost:8010/v1/auth/login \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "username=admin@loom.com&password=admin123"
# Returns: {"access_token": "eyJ...", "token_type": "bearer"}
```

---

### Admin Endpoints

All require `*:*` or the specific `admin:*` permission.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/admin/users` | List all users |
| `PUT` | `/v1/admin/users/{id}` | Update role, active status, email, password |
| `GET` | `/v1/admin/roles` | List all roles with permissions |
| `POST` | `/v1/admin/roles` | Create a new role |
| `PUT` | `/v1/admin/roles/{id}` | Update role and its permissions |
| `GET` | `/v1/admin/permissions` | List all available permissions |

---

### System Settings Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v1/settings` | Get all key/value system settings |
| `PUT` | `/v1/settings/{key}` | Create or update a setting |

Settings are stored in the `system_settings` table for runtime configuration:
```bash
curl -X PUT http://localhost:8010/v1/settings/maintenance_mode \
  -H "Authorization: Bearer $TOKEN" \
  -d "value=true"
```

---

## 8. RBAC & Permissions

### Permission Code Format

```
{namespace}:{action}
```

For every blueprint, Loom auto-generates:
- `employee:read`
- `employee:create`
- `employee:update`
- `employee:delete`
- `employee:*` (module wildcard)

System-level permissions:
- `*:*` — full superadmin access (bypasses all checks)
- `admin:user:read`, `admin:role:create`, etc.

---

### Roles

A Role is a collection of permissions. Each user is assigned one role.

Default roles seeded by `rbac_setup.py`:

| Role | Permissions |
|------|-------------|
| `Administrator` | `*:*` |
| `Admin` | `*:*` |
| `Standard User` | Read-only on select modules |

---

### Creating Custom Roles

Via the admin UI at `/admin/roles`, or via API:

```bash
# 1. Get permission IDs
curl -H "Authorization: Bearer $TOKEN" http://localhost:8010/v1/admin/permissions

# 2. Create role
curl -X POST http://localhost:8010/v1/admin/roles \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "HR Manager", "permission_ids": [1, 2, 5, 9]}'
```

---

### Using `check_permissions` in Code

```python
from auth_utils import check_permissions

# Raises HTTP 403 if the user lacks the permission
check_permissions(current_user, "employee:create")
```

---

## 9. Frontend Framework Guide

### Routing

The frontend has a handful of static admin routes and one dynamic catch-all:

```
/login                  → Login page
/                       → Dashboard
/profile                → Profile settings
/app/:module            → ModuleListView (list table)
/app/:module/new        → RecordForm (create)
/app/:module/:id        → RecordView (detail + tabs)
/app/:module/:id/edit   → RecordForm (edit)
/admin/dashboard        → Admin dashboard
/admin/users            → User management
/admin/roles            → Role management
/admin/settings         → System settings
```

When a user navigates to `/app/employee`, the frontend:
1. Calls `GET /v1/app/modules/employee` to fetch the blueprint
2. Renders column headers from `blueprint.fields`
3. Renders tabs from `blueprint.views`
4. Applies icons and defaults from `blueprint.ui`

The frontend **never hardcodes entity names** — everything comes from the API.

---

### Sidebar and Navigation

Built dynamically from `GET /v1/app/modules`. Items with `ui.show_in_sidebar: true` appear grouped under their `module` section header.

```yaml
module: Organization
ui:
  show_in_sidebar: true
  icon: user               # From lucide.dev/icons (kebab-case)
```

---

### Dynamic Record Views (Tabs)

Each entry in `blueprint.views` becomes a tab in the record detail page:

| `type` | Rendered As |
|--------|------------|
| `summary` | Auto key/value cards of all fields |
| `association` | Table of related records |
| `comments` | Threaded discussion |
| `history` | Audit log timeline |
| `custom` | Your lazy-loaded React component |

---

### Adding a Custom Frontend View

**Step 1:** Create your React component at `frontend/src/pages/custom/MyDashboard.tsx`:

```tsx
interface Props {
  record: Record<string, any>;
  blueprintSlug: string;
  recordId: number;
}

export default function MyDashboard({ record }: Props) {
  return (
    <div>
      <h2>Analytics for {record?.name}</h2>
      {/* Add charts, KPIs, anything you like */}
    </div>
  );
}
```

**Step 2:** Reference it in your blueprint:

```yaml
views:
  - name: Analytics
    id: MyDashboard    # Must match your filename (without .tsx)
    type: custom

overrides:
  frontend_MyDashboard: pages/custom/MyDashboard.tsx
```

The `pluginRegistry.ts` auto-discovers all files in `pages/custom/` via Vite's `import.meta.glob` and code-splits them with `React.lazy()`. Your component is only loaded when the user clicks that tab.

---

## 10. Plugin System

### Backend Plugins

Plugins live at `backend/plugins/{plugin-name}/plugin.py` and are **auto-discovered at startup** from the directories in `LOOM_PLUGIN_PATHS`.

**Directory structure:**
```
backend/plugins/
└── billing/
    ├── __init__.py
    └── plugin.py       ← must export a `manifest` object
```

**`plugin.py` full template:**
```python
from fastapi import APIRouter
from plugin_registry import PluginManifest, registry

manifest = PluginManifest(name="billing")

# ─── Custom Routes ───────────────────────────────────────────────
router = APIRouter(prefix="/billing")

@router.get("/stats")
def get_stats():
    return {"invoices": 42, "paid": 30}

manifest.router = router

# ─── Lifecycle Hooks ─────────────────────────────────────────────
registry.hooks.register("Invoice", "after_create", on_invoice_created)

async def on_invoice_created(instance, current_user, db):
    """Called after every Invoice is created."""
    print(f"Invoice {instance.id} created by {current_user.full_name}")

# ─── Startup Task ────────────────────────────────────────────────
@manifest.on_startup
def setup():
    print("Billing plugin is running!")
```

The manifest's router is automatically mounted under the main `core_router` at startup.

---

### Frontend Plugins

Frontend plugins are React components in `frontend/src/pages/custom/`. The `pluginRegistry.ts` file auto-registers them:

- Discovers all `*.tsx` files in that directory using `import.meta.glob`
- Registers each under the ID matching its filename
- Wraps each in `React.lazy()` for automatic code splitting
- Associates them with blueprints via the `type: custom` + `overrides.frontend_{id}` keys

**Your component receives these props:**
```typescript
{
  record: Record<string, any>;   // The current record's flattened data
  blueprintSlug: string;         // e.g., "department"
  recordId: number;
}
```

---

### Execution Mode

Loom supports two execution modes controlled by env var:

```env
LOOM_WORKSPACE_TYPE=personal      # Default: fast iteration, debug panel enabled
LOOM_WORKSPACE_TYPE=organization  # Strict RBAC, audit enforced, debug panel disabled, Postgres required
```

Check mode in code using `execution_mode.py`:

```python
from execution_mode import is_org_mode, get_mode_config

if is_org_mode():
    # strict behaviour
else:
    # personal / dev mode
```

---

### Project Blueprints

`backend/blueprints_project/` holds your domain-specific entities, separate from loom-core blueprints. Both directories are loaded from `settings.blueprint_paths`.

Add more blueprint directories:
```env
LOOM_BLUEPRINT_PATHS=blueprints,blueprints_project,../my-other-module/blueprints
```

Blueprint ownership rules:
- `blueprints/` — loom-core owned (User, Role). **Never modify**.
- `blueprints_project/` — your domain models. Modify freely.
- `docs/examples/` — reference blueprints. Copy and customise into your project.

---

## 11. Database Migrations Workflow

> **Never edit `models.py` by hand.** It is always regenerated.

### Adding a New Blueprint

```bash
# 1. Create your blueprint
vim backend/blueprints/appointment.yaml

# 2. Rebuild models.py and generate migration (from project root)
./make_migrations.sh

# 3. Review the generated migration
ls backend/migrations/versions/

# 4. Apply the migration
cd backend
alembic upgrade head

# 5. Sync new permissions to the database
python3 rbac_setup.py

# 6. Verify no drift
python3 rbac_drift.py
```

### Adding Fields to an Existing Blueprint

Fields live in JSONB — no migration needed. Just update the YAML and redeploy.

### Adding an Association to an Existing Blueprint

Associations create real FK columns, so a migration IS required. Follow the same workflow above.

### Rollback a Migration

```bash
alembic downgrade -1    # Roll back one step
alembic downgrade base  # Roll all the way back
```

### Inspect Migration State

```bash
alembic history --verbose  # See all migrations
alembic current            # See applied revision
```

---

## 12. Agentic Developer Tools

### Blueprint Linter (`blueprint_linter.py`)

Automatically runs on every `git commit` via `.git/hooks/pre-commit`. Also run manually:

```bash
python3 backend/blueprint_linter.py
```

Catches:
- Missing `name` field
- Invalid `type` values
- Malformed associations (missing `target` or invalid `type`)
- Empty / unparseable YAML

---

### RBAC Drift Detector (`rbac_drift.py`)

Compares blueprint-derived permissions against your database. Run this after adding any blueprint.

```bash
python3 backend/rbac_drift.py
```

Sample output:
```
⚠️ RBAC DRIFT DETECTED: The following permissions are missing from the database:
  - appointment:read
  - appointment:create

Fix by running: python rbac_setup.py
```

---

### Auto Test Generator (`agent_test_generator.py`)

Reads all blueprints and generates a complete `pytest` file per entity.

```bash
cd backend
python3 agent_test_generator.py
```

Output: `tests/test_employee.py`, `tests/test_department.py`, etc.

Each generated test file covers:
- `POST /v1/app/{slug}` → 201 with `id` in response
- `GET /v1/app/{slug}` → 200 with `data` list
- `PUT /v1/app/{slug}/{id}` → 200
- `DELETE /v1/app/{slug}/{id}` → 204

> Tests require an `authorized_client` fixture in `tests/conftest.py`.

---

### Natural Language Blueprint Generator (`agent_blueprint_generator.py`)

Generates a starter blueprint YAML from a plain English prompt.

```bash
cd backend

# Preview without saving
python3 agent_blueprint_generator.py "Track patient appointments with a doctor" --dry-run

# Save to blueprints/
python3 agent_blueprint_generator.py "CRM lead tracker with priority and status"
```

Wire in your LLM provider (Gemini, OpenAI, etc.) to make it fully autonomous. The file contains clear comments showing exactly where to inject the API call.

---

## 13. Settings & Configuration

All settings can be set via environment variables (prefixed `LOOM_`) or a `.env` file in `backend/`.

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOM_APP_TITLE` | `Loom API` | API title shown in Swagger |
| `LOOM_DATABASE_URL` | `postgresql://...` | Database connection string |
| `LOOM_JWT_SECRET` | `your-secret-key` | JWT signing secret. **Change in production!** |
| `LOOM_ALLOWED_ORIGINS` | `["*"]` | CORS origins. **Restrict in production!** |
| `LOOM_BLUEPRINT_PATHS` | `["blueprints"]` | Blueprint directories to load |
| `LOOM_PLUGIN_PATHS` | `["plugins"]` | Plugin directories to discover |
| `LOOM_API_PREFIX` | `/v1` | URL prefix for all API routes |
| `LOOM_ENABLE_COMMENTS` | `true` | Toggle the comments system globally |
| `LOOM_ENABLE_AUDIT` | `true` | Toggle audit logging globally |

**Production `.env`:**
```env
LOOM_DATABASE_URL=postgresql://user:pass@db:5432/loom
LOOM_JWT_SECRET=your-64-char-random-secret
LOOM_ALLOWED_ORIGINS=https://app.mycompany.com
LOOM_BLUEPRINT_PATHS=blueprints,blueprints_tenant
LOOM_ENABLE_AUDIT=true
```

> The backend auto-rewrites `postgresql://` → `postgresql+asyncpg://` for async drivers.

---

## 14. Security Guide

### Authentication
- Passwords are hashed with **bcrypt** (salted)
- JWTs are signed with HS256. Use a long (32+ character) secret
- Tokens expire after **24 hours** by default

### Authorization
- Every protected endpoint calls `check_permissions(user, "namespace:action")`
- Permission codes are checked against a **precomputed set** (O(1)) built at login — no repeated DB hits
- `*:*` superadmin bypasses all permission checks
- Row-Level Security automatically scopes multi-tenant data

### Registration
- `/v1/auth/register` automatically assigns the `Standard User` role
- Users **cannot** choose their own role at registration
- To promote a user: use `/v1/admin/users/{id}` with admin credentials

### Production Checklist

Before going live:

- [ ] Set `LOOM_JWT_SECRET` (run `openssl rand -hex 32` to generate one)
- [ ] Set `LOOM_ALLOWED_ORIGINS` to your exact frontend domain
- [ ] Set `LOOM_DATABASE_URL` to your PostgreSQL connection
- [ ] Consider restricting or removing `/v1/auth/register` if not public-facing
- [ ] Run `python3 rbac_drift.py` to confirm permissions are fully synced
- [ ] Run the blueprint linter: `python3 backend/blueprint_linter.py`

---

## 15. Troubleshooting & FAQ

**`models.py` is showing old/missing fields**  
Run `./make_migrations.sh` from the project root to rebuild it from blueprints.

---

**`alembic upgrade head` fails with "target database is not up to date"**  
Your DB state is dirty. Reset with:
```bash
alembic stamp head   # Mark current as baseline
alembic upgrade head
```

---

**I added a blueprint but the API returns 404**  
- Check that the URL slug matches the `slug:` field in your YAML
- Confirm you ran `./make_migrations.sh` + `alembic upgrade head` after adding it

---

**The frontend sidebar doesn't show my new module**  
- Confirm `ui.show_in_sidebar: true` in the YAML
- Confirm the user has `{slug}:read` permission — run `python3 rbac_drift.py`

---

**My lifecycle hook is not firing**  
- Confirm the plugin's `manifest` object is exported at module level
- The `model_name` in `registry.hooks.register()` must match the blueprint's `name` (case-insensitive)
- Confirm the plugin directory is listed in `LOOM_PLUGIN_PATHS`

---



**Blueprint linter rejects my `Select` field**  
The `options` key is required when using `type: Select`:
```yaml
- name: status
  type: Select
  options: [Active, Inactive, Pending]
```

---

**How do I add a new field without a migration?**  
Just add it to `fields:` in the YAML and redeploy. All business fields live in the JSONB `data` column — no column migration ever needed for fields. Migrations are only triggered by new `associations` (FK columns).

---

**How do I filter by a JSONB field in a list query?**  
The generic list endpoint only supports filtering on real table columns. For JSONB filtering, write a custom router override:
```python
# routers/patient.py
@router.get("")
async def list_patients(status: str = None, db: AsyncSession = Depends(get_db)):
    query = select(Patient)
    if status:
        query = query.filter(Patient.data["status"].astext == status)
    result = await db.execute(query)
    return {"data": [model_to_dict(r) for r in result.scalars().all()]}
```

---

**Where do I find valid icon names?**  
Browse [lucide.dev/icons](https://lucide.dev/icons) — use the kebab-case name in your YAML (e.g., `file-text`, `user`, `box`).

---

**How do I share utility code between multiple plugins?**  
Create a `backend/shared/` directory and import from it directly in your plugin — e.g., `from shared.mailer import send_email`.
