# Blueprint Error Reference

Complete guide to blueprint validation errors and how to fix them.

## Error Code Index

| Code | Error | Severity |
|------|-------|----------|
| LOOM-B000 | YAML syntax error | Error |
| LOOM-B001 | Empty or invalid YAML | Error |
| LOOM-B002 | Missing required field 'name' | Error |
| LOOM-B003 | Missing required field 'slug' | Error |
| LOOM-B004 | Missing required field 'module' | Error |
| LOOM-B005 | Duplicate slug | Warning |
| LOOM-B006 | 'fields' must be a list | Error |
| LOOM-B007 | Field missing 'name' | Error |
| LOOM-B008 | Invalid field type | Error |
| LOOM-B009 | 'associations' must be a list | Error |
| LOOM-B010 | Association missing 'target' | Error |
| LOOM-B011 | Invalid association type | Error |
| LOOM-B012 | Association target not found | Error |
| LOOM-B013 | Select field missing 'options' | Error |

---

## LOOM-B000: YAML Syntax Error

**Message:** `YAML syntax error: <details>`

**Cause:** The YAML file has invalid syntax (indentation errors, invalid characters, unclosed quotes).

**Fix:**

1. Check indentation (use spaces, not tabs)
2. Ensure quotes are balanced
3. Validate with online YAML parser

**Example Error:**
```yaml
# WRONG - Using tabs
fields:
→- name: title  # ← This is a tab, not spaces!

# RIGHT - Using 2 spaces
fields:
  - name: title
```

**Quick Fix:**
```bash
# Install yamllint if needed
pip install yamllint

# Check specific file
yamllint blueprints/my_model.yaml
```

---

## LOOM-B001: Empty or Invalid YAML

**Message:** `Empty or invalid YAML file`

**Cause:** The file is completely empty or contains only whitespace/comments.

**Fix:** Add the required blueprint structure:

```yaml
name: MyModel
slug: my_model
module: General
```

---

## LOOM-B002: Missing Required Field 'name'

**Message:** `Missing required field 'name'`

**Cause:** The blueprint doesn't have a `name` property.

**Fix:** Add the name field:

```yaml
# WRONG
slug: product
module: Inventory

# RIGHT
name: Product
slug: product
module: Inventory
```

**Naming conventions:**
- Use PascalCase: `Product`, `CompanyDocument`, `UserProfile`
- Be descriptive: `Customer` not `Cust`
- Singular names: `Product` not `Products`

---

## LOOM-B003: Missing Required Field 'slug'

**Message:** `Missing required field 'slug'`

**Cause:** The blueprint doesn't have a `slug` property.

**Fix:** Add the slug field:

```yaml
name: Product
slug: product           # ← Add this
module: Inventory
```

**Slug conventions:**
- Use snake_case: `company_document`, `user_profile`
- URL-safe characters only (no spaces)
- Unique across all blueprints
- Used in API URLs: `/v1/app/{slug}`

**Examples:**
| Name | Correct Slug | Wrong Slug |
|------|--------------|------------|
| Product | `product` | `Product`, `products` |
| Company Document | `company_document` | `companyDocument`, `company-doc` |
| User Profile | `user_profile` | `userProfile`, `user profile` |

---

## LOOM-B004: Missing Required Field 'module'

**Message:** `Missing required field 'module'`

**Cause:** The blueprint doesn't have a `module` property.

**Fix:** Add the module field:

```yaml
name: Product
slug: product
module: Inventory      # ← Add this - groups in sidebar
```

**Module conventions:**
- Use PascalCase: `Inventory`, `Customer Management`, `HR`
- Groups related blueprints in the sidebar
- Be consistent: don't use `HR` and `Human Resources`

**Examples:**
- `Core` — System entities (User, Role)
- `Sales` — Deals, Leads, Opportunities
- `Inventory` — Products, Categories, Stock
- `HR` — Employees, Departments, Time Off

---

## LOOM-B005: Duplicate Slug (Warning)

**Message:** `Duplicate slug detected`

**Cause:** Two blueprints have the same slug.

**Fix:** Change one of the slugs:

```yaml
# employee.yaml
name: Employee
slug: employee          # ← This one is fine
module: HR

# staff.yaml
name: Staff Member
slug: employee          # ← WRONG - duplicate!
module: HR

# Fix: Change to:
slug: staff_member
```

---

## LOOM-B006: 'fields' Must Be a List

**Message:** `'fields' must be a list`

**Cause:** The `fields` property is not a YAML list.

**Fix:** Use list syntax with dashes:

```yaml
# WRONG
fields:
  name: title
  type: String

# RIGHT
fields:
  - name: title
    type: String
```

---

## LOOM-B007: Field Missing 'name'

**Message:** `Field missing 'name' property`

**Cause:** A field in the list doesn't have a `name` property.

**Fix:** Add the name to each field:

```yaml
fields:
  - name: title         # ← Must have 'name'
    type: String

  - type: Integer       # ← WRONG - missing 'name'

  - name: description   # ← RIGHT
    type: Text
```

---

## LOOM-B008: Invalid Field Type

**Message:** `Invalid field type`

**Cause:** The `type` property is not a recognized field type.

**Fix:** Use a valid type:

```yaml
# WRONG
fields:
  - name: count
    type: Int          # ← Invalid

# RIGHT
fields:
  - name: count
    type: Integer      # ← Valid
```

**Valid types:**
- `String` — Short text
- `Text` — Long text
- `Integer` — Whole numbers
- `Float` — Decimal numbers
- `Boolean` — True/false
- `Date` — Calendar date
- `DateTime` — Date and time
- `Select` — Dropdown options
- `JSON` — Structured data
- `Email` — Email address
- `URL` — Web address
- `Password` — Hashed password
- `PhoneNumber` — Phone number

---

## LOOM-B009: 'associations' Must Be a List

**Message:** `'associations' must be a list`

**Cause:** The `associations` property is not a YAML list.

**Fix:** Use list syntax:

```yaml
# WRONG
associations:
  type: belongs_to
  target: Company

# RIGHT
associations:
  - type: belongs_to
    target: Company
```

---

## LOOM-B010: Association Missing 'target'

**Message:** `Association missing 'target'`

**Cause:** An association doesn't specify what it relates to.

**Fix:** Add the target blueprint name:

```yaml
associations:
  - type: belongs_to
    target: Company     # ← Add this - must match a blueprint name
```

**Valid targets:**
- Other blueprints in the same project
- Core models: `User`, `Role`, `AuditLog`, `Comment`

---

## LOOM-B011: Invalid Association Type

**Message:** `Invalid association type`

**Cause:** The `type` property is not a valid association type.

**Fix:** Use a valid type:

```yaml
associations:
  - type: many_to_one   # ← WRONG
    target: Company

  - type: belongs_to    # ← RIGHT
    target: Company
```

**Valid types:**
- `belongs_to` — Child belongs to parent (has foreign key)
- `has_many` — Parent has many children
- `has_one` — One-to-one relationship

---

## LOOM-B012: Association Target Not Found

**Message:** `Association target not found`

**Cause:** The association references a blueprint that doesn't exist.

**Fix:**

1. Check the target name matches exactly (case-sensitive)
2. Ensure the target blueprint exists
3. Check if it's a core model

```yaml
# employee.yaml
associations:
  - type: belongs_to
    target: Departmnt   # ← WRONG - typo

  - type: belongs_to
    target: Department  # ← RIGHT - must match exactly
```

**If target is a core model** (`User`, `Role`, `AuditLog`, `Comment`), this error shouldn't appear. If it does, report a bug.

---

## LOOM-B013: Select Field Missing 'options'

**Message:** `Select field missing 'options'`

**Cause:** A `Select` type field doesn't have the required `options` list.

**Fix:** Add options:

```yaml
# WRONG
fields:
  - name: status
    type: Select

# RIGHT
fields:
  - name: status
    type: Select
    options:
      - Active
      - Inactive
      - Pending
    default: Active
```

---

## General Troubleshooting Tips

### Tip 1: Validate YAML First

Before running `loom lint`, check your YAML syntax:

```bash
# Using Python
python3 -c "import yaml; yaml.safe_load(open('blueprints/my_model.yaml'))"

# Using yamllint
yamllint blueprints/my_model.yaml
```

### Tip 2: Start Simple

If you have many errors, start with a minimal blueprint:

```yaml
name: MyModel
slug: my_model
module: General
```

Once that passes, add fields one by one.

### Tip 3: Check Indentation

YAML is whitespace-sensitive. Common mistakes:

```yaml
# WRONG - mixed indentation
fields:
  - name: title
     type: String    # ← Extra space!

# RIGHT - consistent 2 spaces
fields:
  - name: title
    type: String
```

### Tip 4: Run Linter Frequently

Check after each change:

```bash
loom lint blueprints
```

### Tip 5: Use an IDE with YAML Support

VS Code extensions that help:
- YAML (by Red Hat) — Syntax validation
- indent-rainbow — Visualize indentation

---

## Getting More Help

Still stuck?

1. **Read the field type reference:** [docs/blueprint/fields.md](../blueprint/fields.md)
2. **Check the examples:** [docs/examples/](../examples/)
3. **Ask on Discord:** [discord.gg/loom](https://discord.gg/loom)
4. **Open an issue:** Include the full blueprint file and error message
