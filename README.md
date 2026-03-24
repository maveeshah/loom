# Loom Internal Framework

Welcome to the Loom Platform documentation. Loom is an internal, configuration-driven web framework built for structured data management. It consists of a **FastAPI** backend and a **React** (Vite + TypeScript) frontend.

The core philosophy of Loom is **Blueprint-driven Development**: Instead of writing boilerplate CRUD code for every new entity, developers define the entity structure in YAML blueprints. The backend automatically generates REST APIs and database integrations, while the frontend dynamically renders tables, forms, and views based on those definitions.

## Architecture & Concepts

Loom is explicitly designed with a clear separation of concerns, ensuring internal teams can safely build on top of its core.
- **Core**: Stable, reusable backend generic CRUD, auth, and frontend layouts.
- **Plugins**: Explicit, well-documented backend and frontend extension points.
- **Product/Tenant**: Concrete applications defined by blueprints and custom plugins.

Please refer to the following guides for detailed information:
- [Architecture & Boundaries](docs/architecture.md)
- [Blueprints Reference](docs/blueprints.md)
- [Backend Framework Guide](docs/backend-framework.md)
- [Frontend Framework Guide](docs/frontend-framework.md)
- [Plugins Overview](docs/plugins.md)

## Quickstart (Framework Mode)

Loom v0.1.0b1+ is distributed as a python package (`loom-core`) rather than a monolithic repository. You install the core framework, then initialize your own separate project repositories that consume it.

### 1. Install Loom Core

Clone this repository and install it locally in editable mode (until it is published to PyPI):

```bash
git clone https://github.com/your-org/loom-core.git
cd loom-core/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

This installs the `loom` CLI globally into your virtual environment.

### 2. Scaffold a New Project

Navigate outside of the `loom-core` directory and create your own project:

```bash
cd ../
loom init my-crm-app
cd my-crm-app
```

The CLI creates a structure containing `blueprints/`, `plugins/`, and an `.env` file configured for local (`personal`) development.

### 3. Add Blueprints and Run

```bash
# Start the interactive AI blueprint generator
loom add blueprint Patient

# Generate your database schema and Alembic migrations
loom generate migration -m "Add Patient table"

# Start the dev server with hot-reload enabled
loom run dev
```

The backend API will be available at [http://localhost:8010/docs](http://localhost:8010/docs).

> **Note**: For production ("organization" mode) with strict RBAC, Postgres, and Docker Compose deployments, see the [Setup Guide](docs/setup-guide.md).

## Out of the Box Functionality

By simply writing a YAML blueprint, Loom provides the following enterprise-grade features for free:

### Backend
*   **Generic REST APIs**: Fully functional `GET`, `POST`, `PUT`, and `DELETE` endpoints.
*   **Dynamic Validation**: Pydantic models are generated on-the-fly from your YAML file, ensuring all API payloads are strictly validated against your defined schema types and required fields.
*   **Auto-generated Swagger Docs**: Because of the dynamic Pydantic models, FastAPI automatically generates accurate OpenAPI documentation for every single generic endpoint at `/docs`.
*   **Row-Level Security (Data Scoping)**: Built-in multi-tenancy support. If a model has a `tenant_id` column, the generic endpoints automatically scope all queries to the requesting user's tenant (unless they are a Superadmin).
*   **Scalable Querying**: List endpoints (`GET /app/{module}`) support `limit` and `offset` pagination, and strict column-level filtering (preventing malicious relational table-scans).
*   **Rich Audit Logging**: Every `POST`, `PUT`, and `DELETE` automatically records the actor and the exact `changes` diff in a specialized JSON column, enabling powerful historical queries.
*   **Lifecycle Hooks**: Register Python functions to run `before_create`, `after_update`, etc., without ever modifying the core framework routers.

### Frontend
*   **Dynamic Routing & Navigation**: The Vite app reads the blueprint registry and builds the sidebar and routing automatically.
*   **Auto-generated Data Tables**: Generic `ModuleListView` provides sortable, searchable, and paginated data tables based on blueprint fields.
*   **Multi-Tab Record Views**: The `RecordView` dynamically composes "Overview" summaries alongside Association tables (e.g., showing a Patient's Encounters), Comments threads, and interactive Audit Trail timelines.
*   **Lazy Loaded Plugins**: Custom UI tabs and widgets (like an advanced analytics dashboard) are code-split and loaded via `React.lazy()` only when a user navigates to them, keeping the initial bundle size incredibly small.
