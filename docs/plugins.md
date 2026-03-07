# Plugins Overview

The framework provides an explicit extension model to prevent complex integrations from polluting the generic internal logic.

## The Problem Solved
Without a plugin system, any domain-specific requirement (e.g., "Add an analytics tab to the Invoice page", or "Sync Patient creations to a third-party EHR service") requires branching the core React codebase or modifying the global FastAPI endpoints. This leads to an unmaintainable tangled monolith. 

## Plugins in Loom

Plugins are separate modules or directories that hook into defined framework events or paths. They are conceptually split into backend and frontend code.

### 1. Frontend Plugins

**Where:** Registered via `pluginRegistry.registerView(...)`. Code lives in `frontend/src/plugins/*`.
**Usage:** Overriding specific UI areas like list tables, forms, forms fields, or detail tabs.
**Mapping:** A blueprint declares an intent to use an override component via matching View `id`s.

### 2. Backend Plugins

**Where:** Configured via `plugin_paths` in `settings.py`. Code lives in `backend/plugins/*`.
**Usage:** 
- Adding custom REST API routes (e.g., `backend_router`).
- Hooking into CRUD lifecycle events (e.g., `before_create`, `after_update`).
- Spawning background queue listeners.

## Best Practices

- **Never modify generic files for a single tenant/feature.** Look to use the plugin registry on frontend or the router override mechanism on the backend.
- **Maintain backward compatibility.** Ensure your plugins degrade gracefully if data models update.
- **Separate Domains:** Group related plugins logically. A "Billing" plugin should host both the frontend billing UI extensions and the backend invoice Sync logic under its own structure.
