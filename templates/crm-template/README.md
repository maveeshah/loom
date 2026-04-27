# CRM Template

A complete Customer Relationship Management system built with Loom.

## Features

- **Companies** — Track organizations and their details
- **Contacts** — People associated with companies
- **Deals** — Sales opportunities with stages and values
- **Activities** — Calls, emails, meetings, and tasks
- **Dashboard** — Revenue metrics and pipeline visualization

## Quick Start

```bash
# 1. Install Loom
pip install loom-core

# 2. Initialize from this template
loom init my-crm --template crm

# 3. Or manually copy these blueprints
cp -r blueprints/ my-crm/blueprints/

# 4. Set up and run
cd my-crm
loom generate migration -m "Initial CRM setup"
cd backend && alembic upgrade head && cd ..
loom run dev
```

## Data Model

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Companies  │◄──────│  Contacts   │       │   Deals     │
├─────────────┤       ├─────────────┤       ├─────────────┤
│ name        │       │ first_name  │       │ title       │
│ industry    │       │ last_name   │       │ value       │
│ size        │       │ email       │       │ stage       │
│ website     │       │ phone       │       │ close_date  │
│ status      │       │ job_title   │       │ probability │
└─────────────┘       └─────────────┘       └─────────────┘
        │
        │               ┌─────────────┐
        └──────────────►│ Activities  │
                        ├─────────────┤
                        │ type        │
                        │ subject     │
                        │ date        │
                        │ outcome     │
                        └─────────────┘
```

## Blueprints

### Company

```yaml
name: Company
slug: company
module: CRM
ui:
  show_in_sidebar: true
  icon: building
  default_view: summary

fields:
  - name: name
    label: Company Name
    type: String
    required: true

  - name: industry
    label: Industry
    type: Select
    options:
      - Technology
      - Healthcare
      - Finance
      - Manufacturing
      - Retail
      - Education
      - Other

  - name: size
    label: Company Size
    type: Select
    options:
      - 1-10 employees
      - 11-50 employees
      - 51-200 employees
      - 201-500 employees
      - 500+ employees

  - name: website
    label: Website
    type: URL

  - name: phone
    label: Phone
    type: PhoneNumber

  - name: address
    label: Address
    type: Text

  - name: status
    label: Status
    type: Select
    required: true
    options:
      - Prospect
      - Customer
      - Partner
      - Lost
      - Archived
    default: Prospect

associations:
  - type: has_many
    target: Contact
    foreign_key: company_id

  - type: has_many
    target: Deal
    foreign_key: company_id

  - type: has_many
    target: Activity
    foreign_key: company_id

views:
  - name: Summary
    id: summary
    type: summary

  - name: Contacts
    id: contacts
    type: association
    target: Contact

  - name: Deals
    id: deals
    type: association
    target: Deal

  - name: Activities
    id: activities
    type: association
    target: Activity

  - name: Comments
    id: comments
    type: comments

  - name: History
    id: history
    type: history
```

### Contact

```yaml
name: Contact
slug: contact
module: CRM
ui:
  show_in_sidebar: true
  icon: user
  default_view: summary

fields:
  - name: first_name
    label: First Name
    type: String
    required: true

  - name: last_name
    label: Last Name
    type: String
    required: true

  - name: email
    label: Email
    type: Email
    required: true

  - name: phone
    label: Phone
    type: PhoneNumber

  - name: job_title
    label: Job Title
    type: String

  - name: department
    label: Department
    type: String

  - name: status
    label: Status
    type: Select
    options:
      - Active
      - Inactive
      - Do Not Contact
    default: Active

  - name: notes
    label: Notes
    type: Text

associations:
  - type: belongs_to
    target: Company
    foreign_key: company_id

  - type: has_many
    target: Activity
    foreign_key: contact_id

views:
  - name: Summary
    id: summary
    type: summary

  - name: Activities
    id: activities
    type: association
    target: Activity

  - name: Comments
    id: comments
    type: comments

  - name: History
    id: history
    type: history
```

### Deal

```yaml
name: Deal
slug: deal
module: CRM
ui:
  show_in_sidebar: true
  icon: dollar-sign
  default_view: summary

fields:
  - name: title
    label: Deal Title
    type: String
    required: true

  - name: value
    label: Deal Value ($)
    type: Float
    default: 0.0

  - name: currency
    label: Currency
    type: Select
    options:
      - USD
      - EUR
      - GBP
    default: USD

  - name: stage
    label: Stage
    type: Select
    required: true
    options:
      - Lead
      - Qualified
      - Proposal
      - Negotiation
      - Closed Won
      - Closed Lost
    default: Lead

  - name: probability
    label: Probability (%)
    type: Integer
    default: 10

  - name: expected_close_date
    label: Expected Close Date
    type: Date

  - name: actual_close_date
    label: Actual Close Date
    type: Date

  - name: source
    label: Lead Source
    type: Select
    options:
      - Website
      - Referral
      - Cold Call
      - Trade Show
      - Social Media
      - Email Campaign
      - Other

  - name: description
    label: Description
    type: Text

associations:
  - type: belongs_to
    target: Company
    foreign_key: company_id

  - type: belongs_to
    target: Contact
    foreign_key: primary_contact_id

  - type: has_many
    target: Activity
    foreign_key: deal_id

views:
  - name: Summary
    id: summary
    type: summary

  - name: Activities
    id: activities
    type: association
    target: Activity

  - name: Comments
    id: comments
    type: comments

  - name: History
    id: history
    type: history

  - name: Dashboard
    id: DealDashboard
    type: custom

overrides:
  frontend_DealDashboard: pages/custom/DealDashboard.tsx
```

### Activity

```yaml
name: Activity
slug: activity
module: CRM
ui:
  show_in_sidebar: true
  icon: calendar
  default_view: summary

fields:
  - name: type
    label: Activity Type
    type: Select
    required: true
    options:
      - Call
      - Email
      - Meeting
      - Task
      - Note
      - Other

  - name: subject
    label: Subject
    type: String
    required: true

  - name: date
    label: Date & Time
    type: DateTime
    default: now()

  - name: duration_minutes
    label: Duration (minutes)
    type: Integer

  - name: outcome
    label: Outcome
    type: Select
    options:
      - Completed
      - No Answer
      - Left Message
      - Scheduled Follow-up
      - Cancelled
      - In Progress

  - name: notes
    label: Notes
    type: Text

  - name: is_completed
    label: Completed
    type: Boolean
    default: false

associations:
  - type: belongs_to
    target: Company
    foreign_key: company_id

  - type: belongs_to
    target: Contact
    foreign_key: contact_id

  - type: belongs_to
    target: Deal
    foreign_key: deal_id

views:
  - name: Summary
    id: summary
    type: summary

  - name: Comments
    id: comments
    type: comments

  - name: History
    id: history
    type: history
```

## Custom Dashboard (Optional)

Create `frontend/src/pages/custom/DealDashboard.tsx`:

```tsx
import { useState, useEffect } from 'react';
import { Card, Statistic, Row, Col } from 'antd';

interface Props {
  record: Record<string, any>;
  blueprintSlug: string;
  recordId: number;
}

export default function DealDashboard({ record }: Props) {
  const [stats, setStats] = useState({
    totalValue: record?.value || 0,
    probability: record?.probability || 0,
    expectedValue: 0
  });

  useEffect(() => {
    setStats(prev => ({
      ...prev,
      expectedValue: (prev.totalValue * prev.probability) / 100
    }));
  }, [record]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Deal Analytics</h2>
      <Row gutter={16}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Deal Value"
              value={stats.totalValue}
              prefix="$"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Win Probability"
              value={stats.probability}
              suffix="%"
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Expected Value"
              value={stats.expectedValue.toFixed(2)}
              prefix="$"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
```

## Sample Data

Seed your database with sample data:

```bash
cd backend
python3 seed_crm.py
```

Or use the API:

```bash
# Create a company
curl -X POST http://localhost:8010/v1/app/company \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name": "Acme Corp", "industry": "Technology", "status": "Customer"}'

# Create a contact
curl -X POST http://localhost:8010/v1/app/contact \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"first_name": "John", "last_name": "Doe", "email": "john@acme.com", "company_id": 1}'

# Create a deal
curl -X POST http://localhost:8010/v1/app/deal \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"title": "Q2 Software License", "value": 50000, "stage": "Proposal", "company_id": 1}'
```

## Sales Pipeline Report

Query deals by stage:

```bash
# Get all deals in Proposal stage
curl http://localhost:8010/v1/app/deal?stage=Proposal \
  -H "Authorization: Bearer $TOKEN"

# Get total pipeline value
curl http://localhost:8010/v1/app/deal?stage=Lead,Qualified,Proposal,Negotiation \
  -H "Authorization: Bearer $TOKEN"
```

## Customization Ideas

1. **Email Integration** — Plugin to sync with Gmail/Outlook
2. **Calendar Sync** — Add activities to Google Calendar
3. **Slack Notifications** — Alert on deal stage changes
4. **Commission Calculator** — Custom field for sales rep commission
5. **Forecasting** — ML model for deal win probability

## Next Steps

1. **Deploy to production** — See [deployment guide](../docs/deployment/docker.md)
2. **Add custom plugins** — [Plugin documentation](../docs/backend/plugins.md)
3. **Customize the UI** — [Frontend guide](../docs/frontend/custom-views.md)
4. **Set up team permissions** — [RBAC guide](../docs/backend/permissions.md)

## Support

- **Documentation:** [docs.loom-framework.dev](https://docs.loom-framework.dev)
- **Discord:** [discord.gg/loom](https://discord.gg/loom)
- **Issues:** [github.com/your-org/loom/issues](https://github.com/your-org/loom/issues)
