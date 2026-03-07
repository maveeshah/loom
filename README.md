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

### Running the Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8010
```

### Running the Frontend
```bash
cd frontend
yarn install
yarn dev
```

### Adding Your First Module

1. Create `backend/blueprints/my_module.yaml`.
2. Define the schema according to the [Blueprints Reference](docs/blueprints.md).
3. The backend automatically manages the database and exposes generic CRUD `/v1/app/my_module`.
4. The frontend renders `/app/my_module` dynamically without writing boilerplate React code.
