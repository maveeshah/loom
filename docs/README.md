# Loom Framework Documentation

Complete documentation for building applications with Loom.

## Quick Start (5 Minutes)

New to Loom? Start here:

1. **[Installation](quickstart/installation.md)** — Install Loom and prerequisites
2. **[Your First Project](quickstart/first-project.md)** — Build a task manager in 10 minutes
3. **[Understanding Blueprints](quickstart/understanding-blueprints.md)** — Learn the YAML format
4. **[Next Steps](quickstart/next-steps.md)** — Where to go from here

## Documentation Sections

### Getting Started

| Guide | What You'll Learn |
|-------|-------------------|
| [Installation](quickstart/installation.md) | Python, Node.js, database setup |
| [First Project](quickstart/first-project.md) | Create your first app |
| [Understanding Blueprints](quickstart/understanding-blueprints.md) | YAML structure and concepts |
| [Next Steps](quickstart/next-steps.md) | Learning path and resources |

### Blueprint Reference

Blueprints are the heart of Loom. Everything you can define:

| Topic | Description |
|-------|-------------|
| [Field Types](blueprint/fields.md) | All 13 field types with examples |
| [Associations](blueprint/associations.md) | Relationships between entities |
| [Views](blueprint/views.md) | Record display tabs |
| [UI Options](blueprint/ui-options.md) | Sidebar, icons, defaults |
| [Overrides](blueprint/overrides.md) | Custom components |
| [Examples](blueprint/examples.md) | Complete blueprint examples |

### Backend Framework

| Topic | Description |
|-------|-------------|
| [Database](backend/database.md) | Migrations, JSONB storage |
| [API Endpoints](backend/api-endpoints.md) | All endpoints and parameters |
| [Authentication](backend/authentication.md) | JWT, login flow, tokens |
| [Permissions](backend/permissions.md) | RBAC, roles, access control |
| [Lifecycle Hooks](backend/lifecycle-hooks.md) | before_create, after_update |
| [Audit Logging](backend/audit-logging.md) | Change tracking |
| [Plugins](backend/plugins.md) | Custom business logic |
| [Execution Modes](backend/execution-modes.md) | Personal vs Organization |

### Frontend Framework

| Topic | Description |
|-------|-------------|
| [Routing](frontend/routing.md) | URL patterns and navigation |
| [Components](frontend/components.md) | Available UI components |
| [Custom Views](frontend/custom-views.md) | Building specialized UI |
| [Auth Context](frontend/auth-context.md) | Managing authentication state |
| [API Client](frontend/api-client.md) | Making backend calls |

### CLI Reference

Every `loom` command explained:

| Command | Purpose |
|---------|---------|
| [`loom init`](cli/init.md) | Create a new project |
| [`loom doctor`](cli/doctor.md) | Check environment |
| [`loom run dev`](cli/run.md) | Start development server |
| [`loom generate`](cli/generate.md) | Create schema and migrations |
| [`loom add`](cli/add.md) | Add blueprints and components |
| [`loom lint`](cli/lint.md) | Validate blueprints |
| [`loom check`](cli/check.md) | System checks |

### Deployment & Operations

| Topic | Description |
|-------|-------------|
| [Docker](deployment/docker.md) | Production deployment |
| [Environment Variables](deployment/environment-variables.md) | All config options |
| [Database](deployment/database.md) | Postgres, backups, migrations |
| [Security](deployment/security.md) | Hardening checklist |
| [Monitoring](deployment/monitoring.md) | Health checks, logging |

### Troubleshooting

| Topic | Common Issues |
|-------|---------------|
| [Blueprint Errors](troubleshooting/blueprint-errors.md) | Error codes and fixes |
| [Database Issues](troubleshooting/database-issues.md) | Connections, migrations |
| [Permission Denied](troubleshooting/permission-denied.md) | RBAC problems |
| [Frontend Issues](troubleshooting/frontend-issues.md) | CORS, build errors |
| [FAQ](troubleshooting/faq.md) | 20+ common questions |

### Architecture

Understanding how Loom works:

| Topic | Description |
|-------|-------------|
| [Overview](architecture/overview.md) | How pieces fit together |
| [Data Flow](architecture/data-flow.md) | Blueprint → API → UI |
| [Plugin System](architecture/plugin-system.md) | Extension architecture |
| [Code Generation](architecture/code-generation.md) | How models are built |

## Templates & Examples

Ready-to-use starting points:

| Template | Description |
|----------|-------------|
| [CRM Template](../templates/crm-template/) | Complete sales CRM |
| Inventory Template (coming soon) | Product management |
| SaaS Template (coming soon) | Multi-tenant SaaS |

Example projects:

| Example | Features |
|---------|----------|
| Simple CRM (coming soon) | Full CRM with dashboard |
| Task Manager (coming soon) | Trello-like board |
| E-commerce (coming soon) | Products, orders, payments |

## Reference

- **[Developer Guide](developer-guide.md)** — Complete framework reference (single page)
- **[Architecture](architecture.md)** — System design
- **[Backend Framework](backend-framework.md)** — Backend details
- **[Frontend Framework](frontend-framework.md)** — Frontend details

## Getting Help

- **Discord:** [discord.gg/loom](https://discord.gg/loom) — Real-time chat
- **GitHub Issues:** [github.com/your-org/loom/issues](https://github.com/your-org/loom/issues) — Bug reports
- **GitHub Discussions:** [github.com/your-org/loom/discussions](https://github.com/your-org/loom/discussions) — Q&A

## Contributing

Want to improve Loom?

1. **Documentation** — Fix typos, add examples
2. **Templates** — Share your project as a template
3. **Code** — Submit PRs for bugs and features

See `CONTRIBUTING.md` for guidelines.

## Version

This documentation is for **Loom Core v0.1.0b1**.

- [Changelog](../backend/CHANGELOG.md)
- [Roadmap](https://github.com/your-org/loom/milestones)
