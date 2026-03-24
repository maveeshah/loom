# Loom Core Blueprints

This directory contains **core framework blueprints** — owned by `loom-core` and shared across every project that uses the framework.

## Ownership Rules

| Rule | Detail |
|---|---|
| **Core-owned** | `user.yaml`, `role.yaml` — never modify these in a project repo |
| **Project-owned** | Everything else — lives in your project repo's `blueprints/` dir |
| **Never mix** | Business domain models (Patient, Lead, Invoice) do not belong here |

## Blueprint Paths

Loom resolves blueprints from all paths listed in `LOOM_BLUEPRINT_PATHS` (comma-separated). Example `.env` for a project:

```env
LOOM_BLUEPRINT_PATHS=blueprints,../my-project/blueprints
```

The first path is always the loom-core path. Additional paths are project-specific.

## For Project Developers

When bootstrapping a new project with `loom init`, your project repo gets its own `blueprints/` directory. Put all domain models there — `patient.yaml`, `invoice.yaml`, `lead.yaml`, etc. Never push domain blueprints back into loom-core.

## Reference / Example Blueprints

See [`docs/examples/`](../../docs/examples/) for reference YAML files you can copy into your project as a starting point.
