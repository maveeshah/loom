# loom init

Create a new Loom project with the complete directory structure.

## Usage

```bash
loom init <project-name>
```

## Arguments

| Argument | Required | Description |
|----------|----------|-------------|
| `project-name` | Yes | Directory name for the new project |

## Example

```bash
loom init my-crm-app
```

Output:
```
ℹ️  Creating new Loom project: my-crm-app
✅ Generated new Loom project in ./my-crm-app/

Next steps:
  cd my-crm-app
  loom doctor     # Verify setup
  loom run dev    # Start development server
```

## What Gets Created

```
my-crm-app/
├── blueprints/              # Your YAML data models
│   └── example.yaml         # Sample blueprint to get started
├── plugins/                 # Custom backend logic
├── overrides/               # Custom frontend components
├── frontend/                # Frontend customization
│   └── src/
│       └── pages/
│           └── custom/      # Custom React components
├── .env                     # Environment configuration
├── requirements.txt         # Python dependencies
└── README.md                # Project documentation
```

## Files Explained

### `.env`

Default configuration file:

```env
LOOM_WORKSPACE_TYPE=personal      # personal or organization
LOOM_BLUEPRINT_PATHS=blueprints   # Where to find blueprints
LOOM_APP_TITLE="My Loom Project"  # App display name
# LOOM_DATABASE_URL=...          # Database connection (optional)
```

See [Environment Variables](../deployment/environment-variables.md) for all options.

### `blueprints/example.yaml`

Starter blueprint to show the format:

```yaml
name: Example
slug: example
module: Custom
fields:
  - name: title
    type: String
    required: true
```

Replace this with your own blueprints or delete it.

### `requirements.txt`

Lists `loom-core` as the only dependency. Add others as needed:

```
loom-core
requests
celery
```

## Errors

### Directory already exists

```
LOOM-E003: Directory my-crm-app already exists.
```

**Fix:** Choose a different name or delete the existing directory.

## Best Practices

1. **Use lowercase with hyphens** for project names: `my-crm-app`, not `My CRMApp`
2. **Initialize in a parent directory** — don't nest projects
3. **Run `loom doctor` next** — verifies everything is set up correctly
4. **Commit initial structure** — `git init && git add . && git commit -m "Initial commit"`

## Related Commands

- [`loom doctor`](doctor.md) — Check environment after init
- [`loom run dev`](run.md) — Start the development server
- [`loom add blueprint`](add.md) — Add blueprints to your project
