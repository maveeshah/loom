# Architecture

Loom is an internal, configuration-driven web framework composed of a FastAPI backend and a React (Vite + TypeScript) frontend. The framework is designed around a clear separation between **Core** (the generic parts of the framework), **Plugins** (extensions providing custom UI or backend functionality), and **Product Code** (app-specific blueprints and logic).

## Data Flow: Blueprint → API → UI

1. **Blueprints**: Everything starts with YAML blueprints. These define modules, fields, associations, permissions, and available UI views.
2. **API**: The backend parses blueprints on startup or demand. The module registry exposes blueprints at `/v1/modules` and generic CRUD is automatically available at `/v1/app/{model_name}`.
3. **UI**: The frontend fetches module configurations from `/v1/modules`. The `DynamicRoute` and `Layout` components render sidebars, list views, and record views entirely based on blueprint rules.

## Conceptual Framework Boundaries

### 1. Core
Code that is completely decoupled from any single product or tenant.
- **Backend Core** (`backend/core/` and internal modules like `main.py`, `settings.py`, `database.py`): Contains the app factory, generic CRUD engine, blueprint loader, schema generator, audit subsystem, and auth handling.
- **Frontend Core** (`frontend/src/framework/`): The `DynamicRoute` component, internal routing layout, API client (`api.ts`), AuthContext, frontend generic views (like `RecordForm`, `Dashboard`, `RecordView`), and theme config.

### 2. Plugins
Code that extends the framework in a reusable way.
- **Backend Plugins** (`backend/plugins/` or registered Python packages): Routers, automated background jobs, or custom event handlers (e.g., `before_create` hooks).
- **Frontend Plugins** (`frontend/src/plugins/`): Custom widgets, specialized pages, or domain-specific tabs (e.g., a custom `PatientAnalytics` tab). 

### 3. Product / Tenant Code
Instances where the framework is deployed to solve specific problems.
- **Blueprints** (`backend/blueprints/*`): Domain-specific schemas. Core blueprints represent system models (e.g., User, Role). Tenant blueprints represent product needs (e.g., Invoice, Appointment).
- Multiple blueprint roots can be configured to compose the final deployed product.
