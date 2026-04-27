# loom doctor

Diagnose environment issues and verify setup.

## Usage

```bash
loom doctor
```

No arguments needed — runs a complete system check.

## What It Checks

### System Requirements

- ✅ Python version (3.10+ required)
- ✅ Node.js version (18+ recommended)
- ✅ pip availability
- ✅ PostgreSQL client (optional)
- ✅ Git (optional)
- ✅ Docker (optional)

### Project Configuration

If run inside a Loom project:

- ✅ Detects `.env` and `blueprints/` directory
- ✅ Validates database configuration
- ✅ Checks JWT secret configuration
- ✅ Counts blueprints

## Example Output — All Good

```
🔍 Running Loom environment diagnostics...

Python version: 3.11.4
✅ Python version OK
Node.js: v20.10.0
✅ Node.js version OK
✅ pip found at /usr/bin/pip3
✅ PostgreSQL client (psql) found
✅ Git found
Docker: Docker version 24.0.7

Project Check:
✅ Looks like you're in a Loom project: my-app
✅ Database URL configured
⚠️  Using default JWT secret. Change for production.
Found 2 blueprint(s)
✅ Blueprints directory has content

Summary:
Found 1 warning(s):
  • Using default JWT secret. Change for production.

Environment is functional but has warnings.
```

## Example Output — Issues Found

```
🔍 Running Loom environment diagnostics...

Python version: 3.9.16
LOOM-E001: Python 3.10+ required. Current: 3.9
Node.js: (not found)
⚠️  Node.js not found. Frontend development will not work.
❌ LOOM-E002: pip not found. Install pip to use Loom.

Summary:
❌ Found 2 issue(s) that must be fixed:
  LOOM-E001: Python 3.10+ required. Current: 3.9
  LOOM-E002: pip not found. Install pip to use Loom.

Fix these issues, then run 'loom doctor' again.
See docs/troubleshooting/ for help.
```

## Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| `LOOM-E001` | Python version too old | Install Python 3.10+ |
| `LOOM-E002` | pip not found | Install pip (usually with Python) |

## Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| `0` | All checks passed (or only warnings) |
| `1` | Critical issues found, must fix |

## When to Run

**Run `loom doctor` when:**
- First time installing Loom
- After installing/upgrading Python or Node
- Troubleshooting startup issues
- Setting up a new machine
- CI/CD pipeline health check

## Warnings vs Errors

**Warnings** (can proceed):
- Node.js not found (backend-only dev OK)
- PostgreSQL not found (SQLite works for dev)
- Default JWT secret (change for production)

**Errors** (must fix):
- Python < 3.10
- pip not found

## Related Commands

- [`loom init`](init.md) — Create a project after doctor passes
- [`loom check compat`](check.md) — Verify framework compatibility
- [`loom --version`](version.md) — Check installed version

## Troubleshooting

### "Python version OK" but still fails

Check if the `loom` command is using the right Python:

```bash
which loom
head -1 $(which loom)  # Shows which Python it uses
```

### pip not found but Python works

Your Python might not have pip:

```bash
python3 -m ensurepip --upgrade
python3 -m pip install loom-core
```

### Everything passes but server won't start

Check project-specific issues:

```bash
cd your-project
loom lint blueprints       # Validate YAML
loom check compat          # Framework check
cat .env                   # Verify config
```
