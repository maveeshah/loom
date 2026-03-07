# Backend Framework Guide

The Loom backend is designed to be configurable and extensible without requiring modifications to the core codebase.

## Framework Configuration

The backend is configured via `settings.py` using Pydantic Settings, pulling from environment variables prefixed with `LOOM_`. 
- **CORS origins**: `LOOM_ALLOWED_ORIGINS`
- **Blueprint Paths**: `LOOM_BLUEPRINT_PATHS` (e.g., `core,tenant_a`). Enables deploying different modules for different tenants.
- **Plugin Paths**: `LOOM_PLUGIN_PATHS`. Location of backend extensions.

The application starts via an app factory (`create_app(settings)`) which ties together models and blueprints dynamically.

## Module Registry & Generic CRUD
Through reflection and blueprint parsing:
- `/v1/modules` exposes UI structures.
- `/v1/app/{model_name}` handles generic Create, Read, Update, Delete.

## Backend Plugins
To add complex logic, write a Backend Plugin instead of mutating generic CRUD routines.

1. **Custom Routers**: Instead of patching `main.py`, create a module (e.g., `plugins/my_integration/router.py`) and declare it in the blueprint's `overrides.backend_router`. The core loads it automatically.
2. **Generic Hooks (Planned)**: Plugins will be able to register lifecycle hooks (e.g., `before_create`, `after_update`) to modify data or emit events without changing the router code.

## Step-by-Step: Adding a custom backend endpoint
1. Create a `plugins/myapp` directory.
2. Write a `router.py` defining an APIRouter.
3. In your `myapp.yaml` blueprint, add:
   ```yaml
   overrides:
     backend_router: plugins.myapp.router
   ```
4. On startup, Loom dynamically attaches your router.
