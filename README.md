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
4. The backend automatically manages the database and exposes generic CRUD `/v1/app/my_module`.
4. The frontend renders `/app/my_module` dynamically without writing boilerplate React code.
