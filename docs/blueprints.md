# Blueprints Reference

Blueprints are YAML files that define the source of truth for modules, schemas, permissions, and UI mapping. They eliminate the need to write repetitive CRUD boilerplate.

## Blueprint Schema

A blueprint has several key top-level keys.

### 1. Identity & Permissions
- `name`: Human-readable name (e.g., "Patient File").
- `slug`: Stable identifier (e.g., `patient_file`) used in API requests and URLs.
- `module`: Category or grouping name used in the sidebar.
- `permission_namespace`: String used for RBAC checks (e.g., `patient`). Actions evaluate as `patient:read`, `patient:write`.
- `table_name`: (Optional) Explicit DB table name, overrides auto-pluralization.

### 2. UI Configuration (`ui`)
Options determining visual presentation.
- `show_in_sidebar`: boolean
- `icon`: Icon name for the sidebar navigation.
- `default_view`: Default list view behavior.

### 3. Features (`features`)
Built-in framework capabilities that can be toggled on.
- `comments`: Enables the commenting subsystem tab.
- `history`: Enables audit log history visibility in the UI.

### 4. Fields (`fields`)
Defines the database schema and default form fields.
- `name`: Database column name.
- `type`: Data type (e.g., `String`, `Integer`, `Float`, `Boolean`, `DateTime`, `JSON`).
- `default`: Default value (e.g., `now()` translates to `func.now()`).
- `onupdate`: Value on update.

### 5. Associations (`associations`)
Defines relationships for the ORM (`has_many`, `belongs_to`, `has_one`).
- `target`: The class name of the related module.
- `type`: Association type.
- `foreign_key`: Explicitly specify the FK column. *Best practice: Always provide explicit FKs instead of relying on conventions.*

### 6. Views (`views`)
Defines the layout of tabs for frontend Record Views.
- Each item must have an `id` or `name` (e.g., `id: summary`, `id: timeline`).
- Types include `summary`, `association`, `comments`, `history`, `custom`.
- External overrides reference these stable `id`s.

### 7. Overrides (`overrides`)
Hooks where the blueprint points to custom Plugin code.
- `backend_router`: Python module dot path to a custom FastAPI router (e.g., `plugins.billing.router`).
- `frontend_view`: Mapping string corresponding to a Frontend Plugin Registry key.
