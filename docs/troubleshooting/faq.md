# Frequently Asked Questions (FAQ)

Quick answers to common questions about Loom.

## General Questions

### What is Loom?

Loom is a blueprint-driven full-stack framework. You define your data models in YAML, and Loom generates the database schema, REST API, and web UI automatically.

### Who is Loom for?

- **Small dev teams** building internal tools, admin panels, CRUD apps
- **Startups** prototyping MVPs quickly
- **Developers** who want to skip boilerplate and focus on business logic

### What can I build with Loom?

- Internal admin dashboards
- CRM systems
- Inventory management
- Project management tools
- SaaS backends
- Content management systems
- Any app that's 80% CRUD operations

### What tech stack does Loom use?

**Backend:** Python, FastAPI, SQLAlchemy, Pydantic, PostgreSQL  
**Frontend:** React, TypeScript, Vite, TailwindCSS  
**Auth:** JWT tokens  
**Migrations:** Alembic

### Is Loom production-ready?

Loom is in **beta**. It's suitable for:
- ✅ Internal tools and admin panels
- ✅ MVPs and prototypes
- ✅ Low-risk production apps

Use with caution for:
- ⚠️ High-security financial applications
- ⚠️ Mission-critical systems without backup plans

## Installation & Setup

### Q: Do I need both Python and Node.js?

**A:** Yes. Python runs the backend API, Node.js builds the frontend.

If you only need the backend:
```bash
loom init my-api
cd my-api/backend
pip install -r requirements.txt
uvicorn main:app --reload
```

### Q: Can I use SQLite instead of PostgreSQL?

**A:** Yes for development, but PostgreSQL is required for production features like JSONB storage and associations.

```env
LOOM_DATABASE_URL=sqlite:///./dev.db
```

### Q: Do I need Docker?

**A:** No, but it's recommended for production deployment. Loom works fine with local Python/Node installs.

### Q: What if `loom` command is not found?

**A:** The CLI isn't in your PATH. Solutions:

```bash
# Option 1: Add to PATH
export PATH="$HOME/.local/bin:$PATH"

# Option 2: Use Python module
python3 -m loom.cli --help

# Option 3: Reinstall with user flag
pip3 install --user --force-reinstall loom-core
```

## Blueprints

### Q: Do I need to restart the server after editing blueprints?

**A:** Currently yes. Hot-reload for blueprints is on the roadmap. For now:

```bash
loom generate schema    # Regenerate models
# Then restart server
```

### Q: Can I add fields without a migration?

**A:** Yes! Fields are stored in JSONB, so adding/modifying fields doesn't need database migrations. Only associations (foreign keys) require migrations.

### Q: How do I validate my blueprints?

**A:**
```bash
loom lint blueprints
```

### Q: Can blueprints reference each other?

**A:** Yes, use associations:

```yaml
associations:
  - type: belongs_to
    target: Company   # References Company blueprint
```

### Q: What's the difference between `blueprints/` and `blueprints_project/`?

**A:**
- `blueprints/` — Framework core blueprints (User, Role)
- `blueprints_project/` — Your domain blueprints (Invoice, Customer, etc.)

Keep your blueprints in `blueprints_project/` to avoid conflicts with framework updates.

### Q: Can I have multiple blueprint directories?

**A:** Yes, configure in `.env`:

```env
LOOM_BLUEPRINT_PATHS=blueprints,blueprints_project,../shared/blueprints
```

## Database

### Q: Where are migrations stored?

**A:** `backend/migrations/versions/`. Never edit these files by hand.

### Q: How do I add a new blueprint?

**A:**
```bash
# 1. Create blueprint file
vim blueprints/my_model.yaml

# 2. Generate migration
loom generate migration -m "Add MyModel"

# 3. Apply migration
cd backend
alembic upgrade head
```

### Q: Can I add custom SQL?

**A:** Yes, but prefer lifecycle hooks. If you must:

```python
# plugins/custom_sql/plugin.py
from sqlalchemy import text

@manifest.on_startup
def setup():
    # Run custom SQL
    pass
```

### Q: How do I backup my database?

**A:** Standard PostgreSQL tools:

```bash
# Backup
pg_dump -U loom_user loom_db > backup.sql

# Restore
psql -U loom_user loom_db < backup.sql
```

## API & Backend

### Q: How do I add custom API endpoints?

**A:** Create a plugin:

```python
# plugins/my_api/plugin.py
from fastapi import APIRouter
from plugin_registry import PluginManifest

manifest = PluginManifest(name="my_api")
router = APIRouter(prefix="/my-api")

@router.get("/custom")
def custom_endpoint():
    return {"message": "Hello"}

manifest.router = router
```

### Q: How do I authenticate API requests?

**A:** Include JWT token in header:

```bash
curl http://localhost:8010/v1/app/employee \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Q: Where do I get a JWT token?

**A:** Login endpoint:

```bash
curl -X POST http://localhost:8010/v1/auth/login \
  -d "username=admin@loom.com&password=admin123"
# Returns: {"access_token": "eyJ..."}
```

### Q: How do I filter list results?

**A:** Query parameters:

```bash
# Filter by field
GET /v1/app/employee?department_id=5

# Pagination
GET /v1/app/employee?limit=10&offset=20

# Combine
GET /v1/app/employee?department_id=5&status=Active&limit=10
```

### Q: Can I add custom validation?

**A:** Yes, use lifecycle hooks:

```python
@registry.hooks.register("Employee", "before_create")
def validate_employee(data, user, db):
    if data.get("salary", 0) < 0:
        raise ValueError("Salary cannot be negative")
```

## Frontend

### Q: How do I customize the UI?

**A:** Create custom views:

```yaml
views:
  - name: My Dashboard
    id: MyDashboard
    type: custom

overrides:
  frontend_MyDashboard: pages/custom/MyDashboard.tsx
```

### Q: Can I use a different frontend framework?

**A:** Loom generates a REST API, so you can use any frontend. The generated React UI is optional.

### Q: How do I change the theme?

**A:** Edit `frontend/src/components/ThemeConfig.tsx`:

```typescript
export const theme = {
  primaryColor: '#1890ff',
  // ... customize
}
```

### Q: Can I remove the generated UI entirely?

**A:** Yes, just build your own frontend against the API. The generated UI is for rapid prototyping.

## Authentication & Security

### Q: How do I change the JWT secret?

**A:** Edit `.env`:

```env
LOOM_JWT_SECRET=your-64-char-random-secret-here
```

Generate one:
```bash
openssl rand -hex 32
```

### Q: How do I create custom roles?

**A:** Via admin UI at `/admin/roles` or API:

```bash
curl -X POST http://localhost:8010/v1/admin/roles \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Manager", "permission_ids": [1, 2, 3]}'
```

### Q: What's the difference between personal and organization mode?

**A:**
- **Personal** (`LOOM_WORKSPACE_TYPE=personal`): Single user, relaxed permissions, SQLite allowed
- **Organization** (`LOOM_WORKSPACE_TYPE=organization`): Multi-user, strict RBAC, audit logging, PostgreSQL required

### Q: How do I enable row-level security?

**A:** Add `tenant_id` field:

```yaml
fields:
  - name: tenant_id
    type: Integer
    required: true
```

Loom automatically scopes queries by `tenant_id` in organization mode.

## Deployment

### Q: How do I deploy to production?

**A:** See [Deployment Guide](../deployment/docker.md). Quick steps:

```bash
# 1. Configure production settings
cp .env.example .env
# Edit .env with production values

# 2. Deploy with Docker
docker-compose -f docker-compose.prod.yml up -d
```

### Q: What are the required environment variables?

**A:**

**Critical:**
- `LOOM_JWT_SECRET` — Generate with `openssl rand -hex 32`
- `LOOM_DATABASE_URL` — PostgreSQL connection string

**Important:**
- `LOOM_WORKSPACE_TYPE=organization` for production
- `LOOM_ALLOWED_ORIGINS` — Your domain, not `*`

### Q: How do I enable HTTPS?

**A:** Use a reverse proxy (nginx, traefik, caddy):

```nginx
server {
    listen 443 ssl;
    server_name myapp.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://localhost:3010;
    }
}
```

Or use a platform like Railway/Render that handles HTTPS automatically.

### Q: How do I monitor the app in production?

**A:** Health check endpoints:

```bash
curl http://localhost:8000/health      # Overall health
curl http://localhost:8000/health/live  # Liveness
curl http://localhost:8000/health/ready # Readiness
```

## Troubleshooting

### Q: Server won't start

**A:** Check:
1. Database connection string is correct
2. Ports 8010 and 3010 are available
3. `loom doctor` for environment issues
4. Logs for specific errors

### Q: Blueprint changes not reflecting

**A:**
1. Run `loom lint blueprints` to validate YAML
2. Run `loom generate schema`
3. Restart the server
4. Clear browser cache (if UI issues)

### Q: Getting "Permission Denied" errors

**A:** Check:
1. User's role has required permissions
2. In organization mode, you need explicit permissions
3. Try with superadmin account first

### Q: Database migration failed

**A:**
1. Check migration file in `migrations/versions/`
2. Ensure database is running: `loom doctor`
3. Rollback if needed: `alembic downgrade -1`
4. Fix issue, regenerate: `loom generate migration -m "Fix"`

## Contributing

### Q: Can I contribute to Loom?

**A:** Yes! See `CONTRIBUTING.md` (coming soon) or join Discord.

### Q: How do I report a bug?

**A:**
1. Search existing GitHub issues
2. Create new issue with:
   - Loom version (`loom --version`)
   - Steps to reproduce
   - Expected vs actual behavior
   - Error messages/logs

### Q: Is there a roadmap?

**A:** See [GitHub milestones](https://github.com/your-org/loom/milestones). Key upcoming features:
- File uploads
- Advanced filtering
- WebSocket support
- Mobile app template

## Still Have Questions?

- **Discord:** [Join the community](https://discord.gg/loom)
- **GitHub Discussions:** [Ask here](https://github.com/your-org/loom/discussions)
- **GitHub Issues:** [Report bugs](https://github.com/your-org/loom/issues)
- **Documentation:** [Full docs](../README.md)
