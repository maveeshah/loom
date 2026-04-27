# Blueprint Field Types Reference

Complete reference for all field types available in Loom blueprints.

## Overview

Fields define the data structure of your entities. Loom automatically generates:
- Database storage (JSONB column)
- API validation (Pydantic models)
- Form inputs (React components)
- Type coercion and defaults

## Field Structure

Every field follows this structure:

```yaml
fields:
  - name: field_name           # REQUIRED: snake_case identifier
    label: Display Label       # UI label (defaults to name)
    type: String              # REQUIRED: field type (see below)
    required: true            # Must have value? (default: false)
    default: "default value"   # Value if none provided
    options: [...]            # For Select type only
    help_text: "Hint"         # Shown below input
    placeholder: "Type..."   # Input placeholder
    read_only: false         # Show but don't allow edit
    hidden: false            # Hide from forms (admin only)
```

## String

Short text input for names, titles, codes, identifiers.

```yaml
fields:
  - name: first_name
    label: First Name
    type: String
    required: true
    default: ""
    placeholder: "Enter your first name"
```

**Storage:** JSONB text  
**UI:** Single-line text input  
**Validation:** Any string, max length 10,000 chars  
**API:** `"John Doe"`

## Text

Long text input for descriptions, notes, content.

```yaml
fields:
  - name: description
    label: Description
    type: Text
    help_text: "Describe the project in detail"
```

**Storage:** JSONB text  
**UI:** Multi-line textarea  
**Validation:** Any string, max 1MB  
**API:** `"Long description with\\nline breaks"`

## Integer

Whole numbers for counts, quantities, IDs.

```yaml
fields:
  - name: quantity
    label: Quantity
    type: Integer
    required: true
    default: 1
```

**Storage:** JSONB number  
**UI:** Number input with stepper  
**Validation:** Must be whole number  
**API:** `42`

**Example use cases:**
- Item count in inventory
- Age in years
- Priority score

## Float

Decimal numbers for currency, measurements, percentages.

```yaml
fields:
  - name: price
    label: Price ($)
    type: Float
    required: true
    default: 0.0
```

**Storage:** JSONB number  
**UI:** Decimal input  
**Validation:** Must be numeric  
**API:** `99.99`

**Example use cases:**
- Product prices
- Temperature readings
- Completion percentage

## Boolean

True/false toggle for flags, settings, status.

```yaml
fields:
  - name: is_active
    label: Active
    type: Boolean
    default: true

  - name: is_featured
    label: Featured Item
    type: Boolean
    default: false
```

**Storage:** JSONB boolean  
**UI:** Toggle switch or checkbox  
**Validation:** `true` or `false`  
**API:** `true`

## Date

Calendar date without time for birthdays, deadlines, anniversaries.

```yaml
fields:
  - name: birth_date
    label: Birth Date
    type: Date

  - name: due_date
    label: Project Due Date
    type: Date
    required: true
```

**Storage:** ISO 8601 date string (`YYYY-MM-DD`)  
**UI:** Date picker calendar  
**Validation:** Valid date string  
**API:** `"2026-04-27"`

**Special default:**
```yaml
default: now()    # Sets to current date on creation
```

## DateTime

Date and time for timestamps, events, appointments.

```yaml
fields:
  - name: scheduled_at
    label: Scheduled At
    type: DateTime
    required: true

  - name: created_at
    label: Created At
    type: DateTime
    default: now()
```

**Storage:** ISO 8601 datetime string  
**UI:** Date-time picker  
**Validation:** Valid ISO datetime  
**API:** `"2026-04-27T14:30:00"`

**Special default:**
```yaml
default: now()    # Sets to current datetime on creation
```

## Select

Dropdown for enums, categories, status values.

```yaml
fields:
  - name: status
    label: Status
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

**Storage:** JSONB text (selected option)  
**UI:** Dropdown select  
**Validation:** Must be one of options  
**API:** `"Approved"`

**Best practices:**
- Keep options in logical order
- Use clear, consistent naming
- Consider adding a color indicator (UI enhancement)

## JSON

Arbitrary structured data for flexible storage.

```yaml
fields:
  - name: metadata
    label: Metadata
    type: JSON
    required: false
    default: {}
```

**Storage:** JSONB object/array  
**UI:** JSON editor with syntax highlighting  
**Validation:** Valid JSON  
**API:** `{"key": "value", "nested": {"data": true}}`

**Example use cases:**
- Configuration settings
- Product specifications
- API response caching
- Feature flags

## Email

Email address with validation.

```yaml
fields:
  - name: email
    label: Email Address
    type: Email
    required: true
    placeholder: "user@example.com"
```

**Storage:** JSONB text  
**UI:** Email input with validation  
**Validation:** Must match email format (RFC 5322)  
**API:** `"user@example.com"`

## URL

Web address with validation.

```yaml
fields:
  - name: website
    label: Website
    type: URL
    placeholder: "https://example.com"

  - name: profile_image
    label: Profile Image URL
    type: URL
```

**Storage:** JSONB text  
**UI:** URL input with validation  
**Validation:** Must be valid URL with protocol  
**API:** `"https://example.com/image.jpg"`

## Password

Secure password field (always hashed).

```yaml
fields:
  - name: password
    label: Password
    type: Password
    required: true
```

**Storage:** JSONB text (bcrypt hash)  
**UI:** Masked password input  
**Validation:** Min 8 chars recommended  
**API:** Never returned in API responses  

**Security notes:**
- Always hashed with bcrypt
- Never logged or displayed
- Not included in API GET responses

## PhoneNumber

Phone number with formatting.

```yaml
fields:
  - name: phone
    label: Phone Number
    type: PhoneNumber
    placeholder: "+1-555-123-4567"
```

**Storage:** JSONB text  
**UI:** Phone input with formatting  
**Validation:** E.164 format recommended  
**API:** `"+15551234567"`

## Common Field Patterns

### Status Workflow Field

Standard status progression:

```yaml
fields:
  - name: status
    label: Status
    type: Select
    required: true
    options:
      - Draft           # Initial state
      - Pending Review  # Submitted
      - In Progress     # Approved & working
      - Completed       # Done
      - Archived        # Historical
    default: Draft
```

### Priority Field

```yaml
fields:
  - name: priority
    label: Priority
    type: Select
    options:
      - Critical
      - High
      - Medium
      - Low
    default: Medium
```

### Soft Delete

```yaml
fields:
  - name: deleted_at
    label: Deleted At
    type: DateTime
    required: false
```

Query active records: `GET /v1/app/item?deleted_at=null`

### Money/Currency

```yaml
fields:
  - name: amount
    label: Amount
    type: Float
    required: true
    default: 0.0

  - name: currency
    label: Currency
    type: Select
    options:
      - USD
      - EUR
      - GBP
    default: USD
```

### Address Block

```yaml
fields:
  - name: address_line1
    label: Address Line 1
    type: String

  - name: address_line2
    label: Address Line 2
    type: String

  - name: city
    label: City
    type: String

  - name: state
    label: State/Province
    type: String

  - name: postal_code
    label: Postal Code
    type: String

  - name: country
    label: Country
    type: Select
    options:
      - United States
      - Canada
      - United Kingdom
      - Germany
      - France
      - Australia
      - Japan
```

### Person Name

```yaml
fields:
  - name: first_name
    label: First Name
    type: String
    required: true

  - name: last_name
    label: Last Name
    type: String
    required: true

  - name: full_name
    label: Full Name
    type: String
    # Can be computed by a lifecycle hook
```

## Field Validation

Loom automatically validates fields on API requests:

### Required Validation

```yaml
required: true    # Field must be present and non-empty
```

Empty values that fail `required: true`:
- `""` (empty string)
- `null`
- `[]` (empty array for JSON)
- `0` (for numbers, this IS valid)
- `false` (for booleans, this IS valid)

### Type Validation

```yaml
type: Integer     # Only accepts whole numbers
```

Invalid values return HTTP 422 with error:
```json
{
  "detail": [
    {
      "loc": ["body", "quantity"],
      "msg": "value is not a valid integer",
      "type": "type_error.integer"
    }
  ]
}
```

### Default Values

```yaml
default: "value"     # Used when field omitted from request
```

Defaults are applied server-side on:
- POST (create) - if field not provided
- PUT (update) - if field not provided

Defaults are NOT applied if field is explicitly set to `null`.

## Field Combinations

### Read-Only Display

Show value but don't allow editing:

```yaml
fields:
  - name: calculated_score
    label: Score
    type: Float
    read_only: true
    # Value set by lifecycle hook
```

### Hidden Admin Field

Only visible to superadmins:

```yaml
fields:
  - name: internal_notes
    label: Internal Notes
    type: Text
    hidden: true
```

### Computed Field Pattern

Store computation result:

```yaml
fields:
  - name: subtotal
    label: Subtotal
    type: Float
    default: 0.0

  - name: tax_rate
    label: Tax Rate
    type: Float
    default: 0.08

  - name: total
    label: Total
    type: Float
    read_only: true
    # Computed by after_update hook: subtotal * (1 + tax_rate)
```

## API Examples

### Create with All Field Types

```bash
curl -X POST http://localhost:8010/v1/app/product \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Widget Pro",
    "description": "A premium widget for professionals",
    "price": 99.99,
    "quantity": 100,
    "is_active": true,
    "category": "Electronics",
    "release_date": "2026-05-01",
    "created_at": "2026-04-27T10:00:00",
    "specs": {"color": "blue", "weight": "1.5kg"},
    "manufacturer_email": "support@widgets.com",
    "website": "https://widgets.com/pro"
  }'
```

### Response

```json
{
  "id": 42,
  "name": "Widget Pro",
  "description": "A premium widget for professionals",
  "price": 99.99,
  "quantity": 100,
  "is_active": true,
  "category": "Electronics",
  "release_date": "2026-05-01",
  "created_at": "2026-04-27T10:00:00",
  "specs": {"color": "blue", "weight": "1.5kg"},
  "manufacturer_email": "support@widgets.com",
  "website": "https://widgets.com/pro"
}
```

## Troubleshooting

### Field Not Appearing in API

Check:
1. Blueprint YAML is valid (run `loom lint blueprints`)
2. Schema regenerated (`loom generate schema`)
3. Server restarted

### Validation Errors

Common issues:
- `type: Select` without `options` array
- `type: Integer` with decimal default value
- `type: JSON` with invalid default (must be valid JSON)
- `required: true` with `default: null` (conflict)

### Field Changes Not Reflecting

Fields are stored in JSONB, so no migration needed. But you must:
1. Regenerate schema: `loom generate schema`
2. Restart dev server (for now, hot-reload coming)

## Next Steps

- **[Associations](associations.md)** — Link entities together
- **[Views](views.md)** — Customize record display
- **[Lifecycle Hooks](../backend/lifecycle-hooks.md)** — Compute field values automatically
