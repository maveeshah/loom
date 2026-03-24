# Loom Core Setup & Installation Guide

This guide covers how to set up Loom on a fresh machine as a developer building a project *on top of* `loom-core`.

---

## Prerequisites

Before starting, ensure your machine has the following tools installed:
- **Python 3.10+**
- **Docker & Docker Compose** (for production mode / Postgres)
- **Git**
- **Node.js 18+** & **npm/yarn** (if building custom frontend views)

---

## 1. Installing `loom-core`

Currently, `loom-core` is distributed via source, not yet published to PyPI. To consume it, you must clone the framework repository and install it as an editable package.

```bash
# Clone the framework
git clone https://github.com/your-org/loom-core.git
cd loom-core/backend

# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install the framework in editable mode
pip install -e .

# Confirm the CLI is active
loom check compat
```

---

## 2. Bootstrapping Your Project

You do not build your application inside the `loom-core` repository. Instead, treat it like Django or FastAPI.

Navigate to your general workspace directory (e.g., `~/Projects/`) and run:

```bash
loom init my-medical-app
cd my-medical-app
```

This creates the fundamental file structure:
```text
my-medical-app/
├── blueprints/       # Your domain YAML files (e.g. patient.yaml)
├── plugins/          # Your custom python backend plugins
├── overrides/        # For hardcoding specific FastAPI router overrides
├── .env              # Your configuration
└── requirements.txt  # Pins the loom-core dependency
```

---

## 3. Development Workflow

Your `my-medical-app/.env` is pre-configured for **Personal Mode**:
`LOOM_WORKSPACE_TYPE=personal`

In this mode:
- SQLite is supported, removing the need for a Docker database during rapid prototyping.
- Strict RBAC is disabled for easy iteration.
- Blueprint hot-reload is enabled (the server resets schemas when YAMLs change).
- The `/debug` endpoints are exposed.

### Adding a Blueprint
```bash
# Opens an interactive wizard to generate the YAML
loom add blueprint patient
```

### Running the Environment
```bash
# Starts the backend, dynamically mounting your blueprints
loom run dev
```

Visit the API auto-docs at `http://localhost:8010/docs`. Wait for the "✅ Schemas regenerated" terminal message whenever you save a YAML file.

---

## 4. Production / Organization Mode

When deploying, or if you need to test strict Audit and RBAC behaviours, you must switch to Organization Mode.

1. **Update Config**: In your project's `.env`, change `LOOM_WORKSPACE_TYPE=organization`
2. **Setup Database**: Organization mode completely blocks SQLite. You must provide a valid PostgreSQL connection via `LOOM_DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5433/dbname`.
3. **Generate Migrations**: In your project directory:
   ```bash
   loom generate migration -m "Initial schema"
   alembic upgrade head
   ```
4. **Deploy**: The `loom run dev` command is disabled for organisation mode (to prevent watchfiles). Instead, run:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

*(Note that `main:app` is transparently passed from the globally installed `loom-core` dependency, but executes within the context of your project's `LOOM_BLUEPRINT_PATHS`)*
