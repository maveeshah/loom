# loom run

Start the Loom development server.

## Usage

```bash
loom run dev
```

## Description

Starts both backend and frontend development servers:

- **Backend:** http://localhost:8010
  - API endpoints
  - Swagger docs at `/docs`
  - Hot-reload on Python file changes

- **Frontend:** http://localhost:3010
  - React application
  - Hot-reload on file changes

## Prerequisites

Before running, ensure:
1. Database is set up (`alembic upgrade head`)
2. Blueprints are valid (`loom lint blueprints`)
3. Environment is configured (`.env` file exists)

## Examples

### Basic usage

```bash
loom run dev
```

Output:
```
🛠️ Running in PERSONAL dev mode with uvicorn...
💡 Reminder: To hot-reload blueprint changes, we will pipe through watchfiles in the future.
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8010 (Press CTRL+C to quit)
```

### Organization mode

```bash
# Set in .env first
LOOM_WORKSPACE_TYPE=organization

loom run dev
```

Output:
```
⚠️ Running in ORG mode. Hot-reload applies only to Python files, not blueprints.
```

## What Happens

1. **Environment check** — Verifies `.env` and database connection
2. **Blueprint loading** — Parses all blueprints in `LOOM_BLUEPRINT_PATHS`
3. **Model generation** — Creates SQLAlchemy models from blueprints
4. **API generation** — Creates FastAPI routes for each blueprint
5. **Server start** — Launches uvicorn with auto-reload

## Default Credentials

After first setup (from `seed_db.py`):

| Field | Value |
|-------|-------|
| Email | `admin@loom.com` |
| Password | `admin123` |

**⚠️ Change this password immediately in production!**

## Accessing the App

Once running, open:

- **Web UI:** http://localhost:3010
- **API Docs:** http://localhost:8010/docs
- **Health Check:** http://localhost:8010/health

## Common Issues

### Port already in use

```
Error: [Errno 48] Address already in use
```

**Fix:** Kill existing process or use different port:

```bash
# Find and kill process on port 8010
lsof -ti:8010 | xargs kill -9

# Or change port in .env
LOOM_API_PORT=8020
```

### Database not initialized

```
sqlalchemy.exc.OperationalError: (psycopg2.OperationalError) connection refused
```

**Fix:**

```bash
cd backend
alembic upgrade head    # Run migrations
python3 seed_db.py      # Seed default data
```

### Blueprint errors

```
LOOM-B002: Missing required field 'name'
```

**Fix:**

```bash
loom lint blueprints    # Check for errors
# Fix errors in blueprint files
loom generate schema    # Regenerate models
```

### Module not found errors

```
ModuleNotFoundError: No module named 'loom'
```

**Fix:** Install in editable mode:

```bash
cd loom-core/backend
pip install -e .
```

## Hot Reload

### What Reloads Automatically

✅ Python code changes (backend)  
✅ Frontend code changes (React components)  
✅ Static files

### What Requires Restart

❌ Blueprint YAML changes (for now)  
❌ Database schema changes  
❌ `.env` file changes

**Workaround for blueprints:**

```bash
# 1. Make blueprint changes
vim blueprints/my_model.yaml

# 2. Regenerate and restart
loom generate schema
# Then Ctrl+C and run `loom run dev` again
```

## Stopping the Server

Press `Ctrl+C` to gracefully shut down.

The server will:
1. Stop accepting new requests
2. Finish processing current requests
3. Close database connections
4. Exit

## Development Mode Features

In development (`LOOM_WORKSPACE_TYPE=personal`):

- **Auto-reload:** Server restarts on Python file changes
- **Detailed errors:** Full stack traces in API responses
- **Debug endpoints:** Additional diagnostic endpoints available
- **Relaxed security:** CORS allows all origins

## Production Mode

For production deployment, use:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

See [Docker Deployment](../deployment/docker.md).

## Environment Variables

These affect `loom run dev`:

| Variable | Default | Description |
|----------|---------|-------------|
| `LOOM_WORKSPACE_TYPE` | `personal` | `personal` or `organization` |
| `LOOM_DATABASE_URL` | `sqlite:///./loom.db` | Database connection |
| `LOOM_JWT_SECRET` | `your-secret-key` | JWT signing key |
| `LOOM_ALLOWED_ORIGINS` | `["*"]` | CORS origins |

See [Environment Variables](../deployment/environment-variables.md) for all options.

## Related Commands

- [`loom doctor`](doctor.md) — Check environment before running
- [`loom lint`](lint.md) — Validate blueprints
- [`loom generate`](generate.md) — Generate models

## Tips

1. **Run doctor first** — `loom doctor` catches setup issues early
2. **Check logs** — Both backend and frontend show detailed error logs
3. **Use tmux/screen** — Keep server running in a separate session
4. **Monitor memory** — Hot reload can increase memory usage over time
