# Installation Guide

Get Loom installed and running in under 5 minutes.

## Prerequisites

Before installing Loom, ensure you have:

| Tool | Version | Verify Command |
|------|---------|----------------|
| Python | 3.10+ | `python3 --version` |
| Node.js | 18+ | `node --version` |
| PostgreSQL | 14+ (optional for quickstart) | `psql --version` |
| Git | Any | `git --version` |

## Quick Install (Recommended)

### Step 1: Install Loom Core

```bash
pip install loom-core
```

This installs the `loom` CLI globally.

**Verify installation:**
```bash
loom --version
# Expected output: loom-core 0.1.0b1
```

### Step 2: Create Your First Project

```bash
loom init my-first-app
cd my-first-app
```

This creates a new project with:
- `blueprints/` directory for your data models
- `plugins/` directory for custom logic
- `.env` file with default configuration
- `requirements.txt` with `loom-core` dependency

### Step 3: Run the Development Server

```bash
loom run dev
```

This starts:
- Backend API at http://localhost:8010
- Frontend UI at http://localhost:3010
- Auto-reload on code changes

**Default credentials:**
- Email: `admin@loom.com`
- Password: `admin123`

Visit http://localhost:3010 and log in to see your app running!

---

## OS-Specific Instructions

### macOS

**Using Homebrew:**
```bash
# Install prerequisites
brew install python@3.11 node postgresql@14 git

# Start PostgreSQL
brew services start postgresql@14

# Install Loom
pip3 install loom-core
```

**Common issues:**
- If `pip` is not found, use `pip3` instead
- If PostgreSQL fails to start, ensure no other PostgreSQL instance is running

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install prerequisites
sudo apt install python3.11 python3-pip nodejs npm postgresql git

# Start PostgreSQL
sudo systemctl start postgresql

# Install Loom
pip3 install loom-core
```

**Common issues:**
- Add `~/.local/bin` to PATH: `export PATH="$HOME/.local/bin:$PATH"`
- If pip install fails, try with `--user` flag: `pip3 install --user loom-core`

### Windows (WSL2 Recommended)

Loom works best on Windows via WSL2 (Windows Subsystem for Linux).

**Install WSL2:**
```powershell
# Run in PowerShell as Administrator
wsl --install
```

**Then follow the Linux instructions above** inside your WSL2 Ubuntu terminal.

**Alternative: Native Windows (Not Recommended)**
- Install Python 3.10+ from python.org
- Install Node.js 18+ from nodejs.org
- Install PostgreSQL 14+ from postgresql.org
- Use `pip` (not pip3) to install: `pip install loom-core`

---

## Using Docker (No Local Install)

If you prefer not to install Python/Node locally:

```bash
# Clone the Loom repository
git clone https://github.com/your-org/loom.git
cd loom

# Copy environment file
cp .env.example .env

# Start everything with Docker Compose
docker-compose up -d
```

Services will be available at:
- Frontend: http://localhost:3010
- Backend API: http://localhost:8010
- API Docs: http://localhost:8010/docs

---

## Troubleshooting Installation

### "command not found: loom"

**Cause:** The `loom` CLI is not in your PATH.

**Fix:**
```bash
# Find where pip installed it
which python3
# Then add the bin directory to PATH
export PATH="$HOME/.local/bin:$PATH"

# Or reinstall with user flag
pip3 install --user --force-reinstall loom-core
```

### "Permission denied" during pip install

**Fix:**
```bash
pip3 install --user loom-core
```

Never use `sudo pip install`.

### PostgreSQL connection errors

**Quick fix for development:**
Edit `.env` in your project:
```env
LOOM_DATABASE_URL=sqlite:///./loom_dev.db
```

**For production, use PostgreSQL:**
```bash
# Create database and user
sudo -u postgres psql -c "CREATE USER loom_user WITH PASSWORD 'your_password';"
sudo -u postgres psql -c "CREATE DATABASE loom_db OWNER loom_user;"
```

Then set in `.env`:
```env
LOOM_DATABASE_URL=postgresql://loom_user:your_password@localhost:5432/loom_db
```

### Port already in use

If ports 8010 or 3010 are taken:

```bash
# Backend on different port
loom run dev --port 8020

# Frontend: edit .env in frontend/ directory
# VITE_PORT=3020
```

---

## Next Steps

1. **[Create Your First Blueprint](first-project.md)** — Define your data model
2. **[Understanding Blueprints](understanding-blueprints.md)** — Learn the YAML format
3. **[CLI Reference](../cli/init.md)** — Explore all CLI commands

## Getting Help

- **Discord Community:** [Join here](https://discord.gg/loom)
- **GitHub Issues:** https://github.com/your-org/loom/issues
- **Run diagnostics:** `loom doctor` (checks your environment)
