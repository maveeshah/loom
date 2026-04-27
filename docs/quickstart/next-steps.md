# Next Steps

You've got Loom installed and your first project running. Here's where to go next.

## Learning Path

### 1. Master Blueprints (Day 1-2)

Blueprints are the foundation. Learn to model any data structure:

- **[Blueprint Reference](../blueprint/fields.md)** — All field types with examples
- **[Associations](../blueprint/associations.md)** — Relationships between entities
- **[Views & UI](../blueprint/views.md)** — Customize how records appear

**Practice exercise:** Model a CRM with:
- Companies (with industry, size, status)
- Contacts (linked to companies)
- Deals (with stages, values, close dates)
- Activities (calls, emails, meetings)

### 2. Extend with Plugins (Day 3-4)

Add custom logic without touching core code:

- **[Backend Plugins](../backend/plugins.md)** — Custom API endpoints, business logic
- **[Lifecycle Hooks](../backend/lifecycle-hooks.md)** — Run code on create/update/delete
- **[Custom Views](../frontend/custom-views.md)** — Build specialized UI

**Practice exercise:** Create a plugin that:
- Sends Slack notification when deal status changes to "Won"
- Calculates and stores commission on deal creation
- Adds a "Revenue Dashboard" custom view

### 3. Secure Your App (Day 5)

Set up proper access control:

- **[Authentication](../backend/authentication.md)** — JWT, sessions, password policies
- **[Permissions](../backend/permissions.md)** — RBAC, roles, creating custom permissions
- **[Execution Modes](../backend/execution-modes.md)** — Personal vs Organization mode

**Practice exercise:**
- Create "Sales Rep" role (can view own deals, contacts)
- Create "Sales Manager" role (can view all team deals)
- Create "Admin" role (full access)

### 4. Deploy to Production (Week 2)

Get your app online:

- **[Docker Deployment](../deployment/docker.md)** — Production-ready containers
- **[Environment Variables](../deployment/environment-variables.md)** — All config options
- **[Database Setup](../deployment/database.md)** — PostgreSQL in production
- **[Security Checklist](../deployment/security.md)** — Production hardening

**Deployment options:**
- **Easiest:** Railway, Render, or Fly.io (one-click deploy)
- **More control:** AWS, GCP, DigitalOcean with Docker Compose
- **Enterprise:** Kubernetes with Helm charts

## Common Use Cases

### Use Case: Internal Admin Panel

Replace spreadsheets and manual processes:

1. Model your data (employees, inventory, orders)
2. Add approval workflows with lifecycle hooks
3. Create dashboards for executives
4. Set up automated reports (email weekly summaries)

**Time to MVP:** 2-3 days

### Use Case: SaaS Backend

Build the backend for your SaaS product:

1. Define core entities (users, subscriptions, api_keys)
2. Add webhooks for external integrations
3. Implement multi-tenancy with `tenant_id` fields
4. Build custom billing plugin

**Time to MVP:** 1-2 weeks

### Use Case: Prototype/MVP

Validate an idea quickly:

1. Sketch your data model in blueprints
2. Seed with sample data
3. Deploy to staging
4. Show potential customers

**Time to MVP:** 1 day

## Advanced Topics

Once you're comfortable with the basics:

### Custom API Endpoints

Sometimes you need endpoints beyond CRUD:

```python
# plugins/analytics/plugin.py
from fastapi import APIRouter
from plugin_registry import PluginManifest, registry

manifest = PluginManifest(name="analytics")
router = APIRouter(prefix="/analytics")

@router.get("/revenue-by-month")
async def revenue_by_month():
    # Custom SQL, aggregations, etc.
    return {"january": 50000, "february": 75000}

manifest.router = router
```

### Database Optimization

For large datasets:

- Add database indexes on frequently queried fields
- Use materialized views for complex reports
- Implement caching with Redis
- Add database connection pooling

### Frontend Customization

Build completely custom interfaces:

```tsx
// pages/custom/KanbanBoard.tsx
export default function KanbanBoard({ record, blueprintSlug }) {
  // Fetch tasks for this project
  // Render drag-and-drop kanban board
  // Call API on card moves
}
```

## Resources

### Documentation
- **[Complete Blueprint Reference](../blueprint/fields.md)** — Every field type
- **[API Reference](../backend/api-endpoints.md)** — All endpoints, parameters
- **[Troubleshooting](../troubleshooting/faq.md)** — Common issues solved

### Community
- **Discord:** [Join the Loom community](https://discord.gg/loom)
- **GitHub Discussions:** [Ask questions, share projects](https://github.com/your-org/loom/discussions)
- **Twitter/X:** [@loomframework](https://twitter.com/loomframework)

### Examples
- **[Simple CRM](../../examples/simple-crm/)** — Full CRM with custom dashboard
- **[Task Manager](../../examples/task-manager/)** — Trello-like board
- **[E-commerce](../../examples/e-commerce/)** — Products, orders, inventory

## Tips for Success

1. **Start simple** — Begin with minimal blueprints, add complexity later
2. **Use the generated UI first** — Don't build custom views until you need them
3. **Leverage associations** — They're powerful for linking data
4. **Test locally** — Use `loom run dev` for rapid iteration
5. **Read the logs** — Backend and frontend logs show detailed errors
6. **Ask for help** — Community is friendly and responsive

## Getting Help

Stuck? Here's how to get unstuck:

1. **Check the troubleshooting guide:** `docs/troubleshooting/`
2. **Run diagnostics:** `loom doctor`
3. **Search GitHub issues:** Someone may have had the same problem
4. **Ask on Discord:** Real-time help from the community
5. **Open an issue:** If it's a bug, we want to know

## Roadmap

What's coming to Loom:

- **File uploads** — Attach files to any record (S3-compatible)
- **Advanced filtering** — Query with operators (`>`, `<`, `LIKE`, `IN`)
- **WebSockets** — Real-time updates
- **Mobile app** — React Native companion
- **GraphQL** — Alternative to REST API

Follow [GitHub releases](https://github.com/your-org/loom/releases) for updates.

---

**Ready to build?** Start with the [Blueprint Reference](../blueprint/fields.md) to learn all the field types you can use.
