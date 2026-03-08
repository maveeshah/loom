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

## Quickstart

### Running with Docker

The entire platform is containerized using Docker. Ensure you have [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/) installed.

#### 1. Build and Start Services
```bash
docker-compose up --build
```

This command will:
- Spin up a **PostgreSQL** database (port `5433`).
- Start the **FastAPI** backend (port `8010`).
- Start the **React** (Vite) frontend (port `3010`).

#### 2. Accessing the Platform
- **Frontend**: [http://localhost:3010](http://localhost:3010)
- **Backend API Docs**: [http://localhost:8010/docs](http://localhost:8010/docs)

### Common Commands

- **Stop Services**: `docker-compose down`
- **View Logs**: `docker-compose logs -f`
- **Restart a specific service**: `docker-compose restart backend`
- **Run migrations manually**: `docker-compose exec backend alembic upgrade head`

### Database Migrations

Because the framework dynamically generates SQLAlchemy models from YAML blueprints, you **must not** rely on automatic schema updates in production.

To create database migrations after modifying a YAML blueprint:
1. Run `./make_migrations.sh` locally. This script regenerates `models.py` and runs `alembic revision --autogenerate`.
2. Review the generated Alembic migration file under `backend/migrations/versions/`.
3. Commit the new migration to source control.
4. When `docker-compose up` is run, the backend container will automatically execute `alembic upgrade head`.

### Adding Your First Module

1. Create `backend/blueprints/my_module.yaml`.
2. Define the schema according to the [Blueprints Reference](docs/blueprints.md).
3. Run `./make_migrations.sh` to update models and generate a database migration.
4. The backend automatically manages the database and exposes generic CRUD `/v1/app/my_module` with dynamic Pydantic payload validation and automatic OpenAPI Swagger documentation.
5. The frontend renders `/app/my_module` dynamically without writing boilerplate React code, complete with pagination, search, and lazy-loaded plugins.

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
