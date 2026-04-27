# Understanding Blueprints

Blueprints are the heart of Loom. This guide explains everything about the YAML format that drives your entire application.

## What Is a Blueprint?

A blueprint is a **YAML file** that describes:
- What data you want to store
- How it relates to other data
- How it should appear in the UI
- Who can access it

**One blueprint = One complete feature** (database + API + UI)

## Minimal Blueprint

The simplest possible blueprint:

```yaml
name: Note
slug: note
module: General
```

This gives you:
- Database table `notes` with `id` and `data` columns
- Full CRUD REST API at `/v1/app/note`
- Auto-generated list view, form, and detail page

## Complete Blueprint Structure

```yaml
# ─── Identity ─────────────────────────────────────────────────

name: Employee                    # REQUIRED: Display name (PascalCase)
slug: employee                    # REQUIRED: URL-safe identifier
module: HR                        # REQUIRED: Sidebar group
permission_namespace: employee    # Optional: RBAC prefix (defaults to slug)
table_name: employees             # Optional: Database table name


# ─── UI Configuration ───────────────────────────────────────────

ui:
  show_in_sidebar: true           # Show in navigation? (default: true)
  icon: user                      # Lucide icon name
  default_view: summary           # First tab shown on detail page
  color: blue                     # Sidebar accent color


# ─── Fields ─────────────────────────────────────────────────────

fields:
  # Text field
  - name: first_name
    label: First Name
    type: String
    required: true

  # Number field
  - name: salary
    label: Annual Salary
    type: Float
    default: 0.0

  # Date field
  - name: hire_date
    label: Hire Date
    type: Date
    default: now()                # Special value for current date

  # Dropdown/select
  - name: status
    label: Employment Status
    type: Select
    required: true
    options:
      - Active
      - On Leave
      - Terminated
    default: Active

  # Long text
  - name: notes
    label: Internal Notes
    type: Text
    required: false

  # Boolean toggle
  - name: is_manager
    label: Is Manager
    type: Boolean
    default: false

  # JSON data
  - name: metadata
    label: Extra Data
    type: JSON
    required: false


# ─── Relationships ──────────────────────────────────────────────

associations:
  # Employee belongs to a Department
  - type: belongs_to
    target: Department
    foreign_key: department_id    # Optional, auto-generated

  # Employee has many Documents
  - type: has_many
    target: EmployeeDocument
    foreign_key: employee_id

  # Employee has one User account
  - type: has_one
    target: User
    foreign_key: employee_id


# ─── Record Views ───────────────────────────────────────────────

views:
  # Auto-generated field summary
  - name: Summary
    id: summary
    type: summary

  # Show related records
  - name: Documents
    id: documents
    type: association
    target: EmployeeDocument

  # Threaded comments
  - name: Comments
    id: comments
    type: comments

  # Change history timeline
  - name: Audit Log
    id: history
    type: history

  # Custom React component
  - name: Org Chart
    id: OrgChartView
    type: custom


# ─── Custom Overrides ───────────────────────────────────────────

overrides:
  backend_router: routers/employee_custom.py
  frontend_OrgChartView: pages/custom/OrgChartView.tsx
```

## Field Types Reference

| Type | Storage | UI Widget | Example Values |
|------|---------|-----------|----------------|
| `String` | JSONB text | Text input | `"John Doe"` |
| `Text` | JSONB text | Textarea | `"Long description..."` |
| `Integer` | JSONB number | Number input | `42` |
| `Float` | JSONB number | Decimal input | `99.99` |
| `Boolean` | JSONB boolean | Toggle switch | `true` / `false` |
| `Date` | JSONB string (ISO) | Date picker | `"2026-04-27"` |
| `DateTime` | JSONB string (ISO) | Date-time picker | `"2026-04-27T10:00:00"` |
| `Select` | JSONB string | Dropdown | `"Active"` (from options) |
| `JSON` | JSONB object | JSON editor | `{"key": "value"}` |
| `Email` | JSONB string | Email input | `"user@example.com"` |
| `URL` | JSONB string | URL input | `"https://example.com"` |
| `Password` | JSONB string | Password input | (hashed) |
| `PhoneNumber` | JSONB string | Phone input | `"+1-555-1234"` |

### Field Options

Every field supports these options:

```yaml
fields:
  - name: example
    label: Display Label          # UI label (defaults to name)
    type: String                  # Field type (see table above)
    required: true                # Must have value? (default: false)
    default: "default value"      # Default if not provided
    options:                      # For Select type only
      - Option 1
      - Option 2
    help_text: "Hint for user"    # Shown below field in forms
    placeholder: "Type here..."   # Input placeholder
    read_only: false             # Show in forms but disabled
    hidden: false                # Hide from forms (admin only)
```

## Association Types

### belongs_to

Creates a parent-child relationship. The child stores the parent's ID.

```yaml
# Employee belongs to Department
associations:
  - type: belongs_to
    target: Department
    foreign_key: department_id    # Creates column on employees table
```

**Effect:**
- Adds `department_id` column to `employees` table
- Employee forms show a dropdown of departments
- API accepts `department_id` in POST/PUT

### has_many

Creates a one-to-many relationship. The other model stores this model's ID.

```yaml
# Department has many Employees
associations:
  - type: has_many
    target: Employee
    foreign_key: department_id    # Column on employees table
```

**Effect:**
- Creates relationship without adding columns to this table
- Detail view can show list of related employees
- Auto-validates the association target exists

### has_one

Creates a one-to-one relationship.

```yaml
# Employee has one User account
associations:
  - type: has_one
    target: User
    foreign_key: employee_id      # Column on users table
```

**Effect:**
- Enforces one-to-one constraint
- Form shows link to related record
- Deleting this record can cascade (configurable)

## View Types

Views appear as tabs on the record detail page.

### summary

Auto-generated display of all blueprint fields.

```yaml
views:
  - name: Summary
    id: summary
    type: summary
```

**Renders as:** Key/value cards showing all field values

### association

Table of related records from another blueprint.

```yaml
views:
  - name: Team Members
    id: team_members
    type: association
    target: Employee                # Must match another blueprint's name
    filter: "department_id = {id}"  # Optional: filter related records
```

**Renders as:** Sortable, paginated table of related records

### comments

Built-in threaded discussion.

```yaml
views:
  - name: Comments
    id: comments
    type: comments
```

**Renders as:** Threaded comments with @mentions

### history

Audit trail of all changes.

```yaml
views:
  - name: History
    id: history
    type: history
```

**Renders as:** Timeline showing who changed what and when

### custom

Your own React component.

```yaml
views:
  - name: Analytics Dashboard
    id: AnalyticsDashboard
    type: custom

overrides:
  frontend_AnalyticsDashboard: pages/custom/AnalyticsDashboard.tsx
```

**Props passed to component:**
```typescript
{
  record: Record<string, any>;    // All record data
  blueprintSlug: string;          // "employee"
  recordId: number;               // 42
}
```

## Common Patterns

### Pattern 1: Status Workflow

```yaml
fields:
  - name: status
    type: Select
    required: true
    options:
      - Draft
      - Pending Review
      - Approved
      - Rejected
      - Archived
    default: Draft
```

### Pattern 2: Soft Delete

```yaml
fields:
  - name: deleted_at
    label: Deleted At
    type: DateTime
    required: false
```

Query active records: `GET /v1/app/item?deleted_at=null`

### Pattern 3: Multi-Tenant

```yaml
fields:
  - name: tenant_id
    label: Tenant
    type: Integer
    required: true
```

Loom automatically scopes all queries by `tenant_id` in organization mode.

### Pattern 4: Nested Categories

```yaml
# Category blueprint
associations:
  - type: belongs_to
    target: Category              # Self-referential!
    foreign_key: parent_id

  - type: has_many
    target: Category
    foreign_key: parent_id
```

### Pattern 5: Tags/Labels

```yaml
fields:
  - name: tags
    label: Tags
    type: JSON                  # Store array: ["urgent", "bug"]
```

## Validation Rules

Loom validates blueprints on load:

✅ **Required fields:** `name`, `slug`, `module`  
✅ **Unique slugs:** No duplicates across all blueprints  
✅ **Valid field types:** Must be from the supported list  
✅ **Association targets:** Target blueprint must exist  
✅ **YAML syntax:** Must be valid YAML  

Run `loom lint blueprints` to check your blueprints.

## Best Practices

1. **Use PascalCase for names:** `Employee`, `CompanyDocument`
2. **Use snake_case for slugs:** `employee`, `company_document`
3. **Group by module:** Keep related blueprints in the same module
4. **Add descriptions:** Help teammates understand the blueprint's purpose
5. **Use icons:** Makes the UI more intuitive (see lucide.dev/icons)
6. **Default required fields:** Reduces empty records
7. **Use Select for enums:** Better than free-text for status/priority fields

## Blueprint Locations

```
project/
├── blueprints/              # Your domain models (you edit these)
│   ├── employee.yaml
│   └── task.yaml
├── blueprints_project/      # Alternative location
└── ...
```

Configure paths in `.env`:
```env
LOOM_BLUEPRINT_PATHS=blueprints,blueprints_project
```

## Next Steps

- **[Field Types Deep Dive](../blueprint/fields.md)** — Every type explained
- **[Associations Guide](../blueprint/associations.md)** — Relationship patterns
- **[Custom Views](../frontend/custom-views.md)** — Build your own UI components
