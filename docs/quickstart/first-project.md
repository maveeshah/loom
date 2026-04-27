# Your First Loom Project

Build a complete task management app in 10 minutes.

## What We'll Build

A simple task manager with:
- **Projects** — Group tasks into projects
- **Tasks** — Assign tasks with priority and status
- **Team members** — Track who owns what

## Step 1: Initialize the Project

```bash
loom init task-manager
cd task-manager
```

## Step 2: Create the Project Blueprint

Create `blueprints/project.yaml`:

```yaml
name: Project
slug: project
module: Task Management
description: "A container for related tasks"

ui:
  show_in_sidebar: true
  icon: folder
  default_view: summary

fields:
  - name: name
    label: Project Name
    type: String
    required: true

  - name: description
    label: Description
    type: Text

  - name: status
    label: Status
    type: Select
    required: true
    options:
      - Active
      - On Hold
      - Completed
      - Archived
    default: Active

  - name: due_date
    label: Due Date
    type: Date

  - name: priority
    label: Priority
    type: Select
    options:
      - Low
      - Medium
      - High
      - Critical
    default: Medium

views:
  - name: Summary
    id: summary
    type: summary

  - name: Tasks
    id: tasks
    type: association
    target: Task

  - name: Comments
    id: comments
    type: comments

  - name: History
    id: history
    type: history
```

## Step 3: Create the Task Blueprint

Create `blueprints/task.yaml`:

```yaml
name: Task
slug: task
module: Task Management
description: "Individual tasks within projects"

ui:
  show_in_sidebar: true
  icon: check-square
  default_view: summary

fields:
  - name: title
    label: Task Title
    type: String
    required: true

  - name: description
    label: Description
    type: Text

  - name: status
    label: Status
    type: Select
    required: true
    options:
      - Todo
      - In Progress
      - In Review
      - Done
    default: Todo

  - name: priority
    label: Priority
    type: Select
    options:
      - Low
      - Medium
      - High
      - Urgent
    default: Medium

  - name: due_date
    label: Due Date
    type: Date

  - name: estimated_hours
    label: Estimated Hours
    type: Float

  - name: actual_hours
    label: Actual Hours
    type: Float

associations:
  - type: belongs_to
    target: Project
    foreign_key: project_id

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

## Step 4: Generate Database Schema

```bash
loom generate schema
```

This reads your blueprints and generates:
- `models.py` — SQLAlchemy models
- Database tables (via Alembic migrations)

## Step 5: Create and Apply Migrations

```bash
loom generate migration -m "Add Project and Task models"
```

You should see output like:
```
⏳ Generating models from blueprints...
⏳ Running Alembic autogenerate...
✅ Migration generated. Don't forget to run 'alembic upgrade head'
```

Now apply the migration:
```bash
cd backend  # If not already in backend directory
alembic upgrade head
python3 rbac_setup.py  # Sync permissions
```

## Step 6: Start the App

```bash
loom run dev
```

## Step 7: Explore Your App

Open http://localhost:3010 and log in with:
- Email: `admin@loom.com`
- Password: `admin123`

You'll see in the sidebar:
- **Projects** — Click to see list view
- **Tasks** — Associated with projects

### Try These Actions:

1. **Create a Project:**
   - Click "Projects" → "New Project"
   - Enter name: "Website Redesign"
   - Set status: "Active"
   - Click Save

2. **Create a Task:**
   - Go to "Tasks" → "New Task"
   - Title: "Design homepage mockup"
   - Select the project you just created
   - Set priority: "High"
   - Save

3. **View Relationships:**
   - Open the Project record
   - Click the "Tasks" tab to see associated tasks
   - Add comments in the "Comments" tab

## What Just Happened?

Without writing any code, you got:

✅ **Database tables** — PostgreSQL tables for Projects and Tasks  
✅ **REST API** — Full CRUD endpoints at `/v1/app/project` and `/v1/app/task`  
✅ **Auto-generated UI** — List views, forms, detail pages with tabs  
✅ **Validation** — Required fields, type checking on all API calls  
✅ **Audit logging** — Every change tracked automatically  
✅ **RBAC permissions** — Role-based access ready for your team  
✅ **Comments system** — Built-in threaded discussions  

## Understanding the Structure

```
task-manager/
├── blueprints/
│   ├── project.yaml    ← You wrote this
│   └── task.yaml       ← You wrote this
├── plugins/            ← For custom logic (empty for now)
├── .env                ← Your configuration
└── requirements.txt    ← loom-core dependency
```

That's it! No backend code, no frontend code, no SQL migrations to write by hand.

## Next Steps

1. **[Add Custom Logic](../backend/plugins.md)** — Write a plugin to send email when tasks are assigned
2. **[Customize the UI](../frontend/custom-views.md)** — Add a Gantt chart view
3. **[Deploy to Production](../deployment/docker.md)** — Get it online

## Common Questions

**Q: Can I add more fields later?**  
A: Yes! Edit the YAML and run `loom generate schema`. Fields are stored in JSONB, so no migrations needed for field changes.

**Q: What about complex business logic?**  
A: Use [lifecycle hooks](../backend/lifecycle-hooks.md) or [custom plugins](../backend/plugins.md).

**Q: Can I customize the UI beyond the generated views?**  
A: Absolutely! Create [custom React components](../frontend/custom-views.md).
