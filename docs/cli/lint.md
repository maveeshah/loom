# loom lint

Validate blueprint files for errors.

## Usage

```bash
loom lint blueprints
```

## Description

Checks all blueprint YAML files for:
- ✅ Valid YAML syntax
- ✅ Required fields (`name`, `slug`, `module`)
- ✅ Valid field types
- ✅ Valid association types
- ✅ Existing association targets
- ✅ Select fields have options
- ⚠️ Warnings for common issues

## Example Output

### All Good

```bash
loom lint blueprints
```

Output:
```
🔍 Scanning blueprints in: blueprints
Found 3 blueprint file(s)

✅ All 3 blueprint(s) passed validation!
```

### With Errors

```bash
loom lint blueprints
```

Output:
```
🔍 Scanning blueprints in: blueprints
Found 3 blueprint file(s)

❌ LOOM-B002: Missing required field 'name' in contact.yaml
❌ LOOM-B008: Invalid field type (Field 'age' type 'Int' in Contact) in contact.yaml
   💡 Valid types: Boolean, Date, DateTime, Email, Float, Integer, JSON, Password, PhoneNumber, Select, String, Text, URL
❌ LOOM-B012: Association target not found (Association target 'Categor' in Product) in product.yaml
   💡 Available blueprints: Company, Contact, Product
   💡 Core models: User, Role, AuditLog, Comment

💥 Blueprint validation failed with 3 error(s) and 0 warning(s)

   📚 See docs/troubleshooting/blueprint-errors.md for help
```

### With Warnings Only

```
🔍 Scanning blueprints in: blueprints
Found 3 blueprint file(s)

⚠️  Slug 'CompanyData' should be snake_case in company.yaml
   💡 Consider using: company_data

⚠️  3 blueprint(s) passed with 1 warning(s)
```

## Error Codes

| Code | Meaning | Severity |
|------|---------|----------|
| LOOM-B000 | YAML syntax error | Error |
| LOOM-B001 | Empty YAML file | Error |
| LOOM-B002 | Missing `name` field | Error |
| LOOM-B003 | Missing `slug` field | Error |
| LOOM-B004 | Missing `module` field | Error |
| LOOM-B005 | Duplicate slug | Warning |
| LOOM-B006 | `fields` not a list | Error |
| LOOM-B007 | Field missing `name` | Error |
| LOOM-B008 | Invalid field type | Error |
| LOOM-B009 | `associations` not a list | Error |
| LOOM-B010 | Association missing `target` | Error |
| LOOM-B011 | Invalid association type | Error |
| LOOM-B012 | Association target not found | Error |
| LOOM-B013 | Select missing `options` | Error |

See [Blueprint Error Reference](../troubleshooting/blueprint-errors.md) for detailed fixes.

## Exit Codes

| Exit Code | Meaning |
|-----------|---------|
| `0` | Success (or warnings only) |
| `1` | Errors found |

Use in CI/CD:

```bash
loom lint blueprints || exit 1
```

## Which Directory Is Checked?

The linter checks in this order:

1. `./blueprints/` (current directory) — if exists
2. Framework blueprints — fallback

Override with full path:

```bash
loom lint blueprints /path/to/blueprints
```

## Pre-Commit Hook

Automatically validate before commits:

```bash
#!/bin/sh
# .git/hooks/pre-commit

echo "Running blueprint linter..."

if ! loom lint blueprints; then
    echo "❌ Blueprint validation failed. Fix errors before committing."
    exit 1
fi

echo "✅ Blueprints validated"
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

## CI/CD Integration

GitHub Actions example:

```yaml
# .github/workflows/validate.yml
name: Validate Blueprints

on: [push, pull_request]

jobs:
  lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install Loom
        run: pip install loom-core
      
      - name: Lint Blueprints
        run: loom lint blueprints
```

## Common Issues

### "No blueprint files found"

```
⚠️  No blueprint files found in blueprints
```

**Cause:** Running from wrong directory or no `.yaml` files.

**Fix:**
```bash
# Check current directory
pwd

# List blueprint files
ls blueprints/*.yaml

# Run from project root
cd /path/to/project
loom lint blueprints
```

### YAML Syntax Errors

```
❌ LOOM-B000: YAML syntax error: while scanning a quoted scalar
```

**Fix:**
1. Use a YAML validator
2. Check for:
   - Mixed tabs and spaces
   - Unclosed quotes
   - Wrong indentation

```bash
# Validate with Python
python3 -c "import yaml; yaml.safe_load(open('blueprints/my.yaml'))"
```

### Association Target Not Found

```
❌ LOOM-B012: Association target not found
```

**Fix:**
1. Check the target name matches exactly (case-sensitive)
2. Ensure the blueprint file exists
3. Check for typos

```yaml
# WRONG
target: companys    # Typo

# RIGHT
target: Company    # Must match blueprint 'name' field
```

## Tips

1. **Run frequently** — Check after every blueprint change
2. **Fix errors immediately** — Don't let them accumulate
3. **Use descriptive names** — Makes errors easier to find
4. **Commit working state** — Don't commit broken blueprints

## Related Commands

- [`loom generate`](generate.md) — Generate after linting passes
- [`loom init`](init.md) — Create project structure

## See Also

- [Blueprint Error Reference](../troubleshooting/blueprint-errors.md)
- [Field Types Reference](../blueprint/fields.md)
- [Understanding Blueprints](../quickstart/understanding-blueprints.md)
