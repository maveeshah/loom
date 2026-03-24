import argparse
import sys
import os
import subprocess
from pathlib import Path

# Add the parent directory (loom-core root) to sys.path
# This ensures we can import module files like generate_schema and blueprint_linter
# even if installed via editable pip
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR.absolute()))


def init_project(name):
    """Creates a new project scaffold that consumes loom-core"""
    project_dir = Path(name)
    if project_dir.exists():
        print(f"❌ Directory {name} already exists.")
        sys.exit(1)
        
    project_dir.mkdir()
    (project_dir / "blueprints").mkdir()
    (project_dir / "plugins").mkdir()
    (project_dir / "overrides").mkdir()
    
    # Create default settings
    with open(project_dir / ".env", "w") as f:
        f.write("# Loom Project Configuration\n")
        f.write("LOOM_WORKSPACE_TYPE=personal\n")
        f.write("LOOM_BLUEPRINT_PATHS=blueprints\n")
        f.write("LOOM_APP_TITLE=\"My Loom Project\"\n")
        
    with open(project_dir / "requirements.txt", "w") as f:
        f.write("loom-core\n")
        
    # Create an example blueprint
    with open(project_dir / "blueprints" / "example.yaml", "w") as f:
        f.write("name: Example\nslug: example\nmodule: Custom\nfields:\n  - name: title\n    type: String\n")
        
    print(f"✅ Generated new Loom project in ./{name}/")
    print("Next steps:")
    print(f"  cd {name}")
    print("  loom run dev")


def main():
    parser = argparse.ArgumentParser(description="Loom CLI — Framework Management")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # init <name>
    init_parser = subparsers.add_parser("init", help="Bootstrap a new Loom project")
    init_parser.add_argument("name", help="Name of the project directory")

    # add blueprint <name>
    add_parser = subparsers.add_parser("add", help="Add a new component")
    add_parser.add_argument("component", choices=["blueprint"], help="Type of component to add")
    add_parser.add_argument("name", help="Name of the component")

    # generate <schema|migration>
    generate_parser = subparsers.add_parser("generate", help="Generate code or migrations")
    generate_parser.add_argument("target", choices=["schema", "migration"], help="Target to generate")
    generate_parser.add_argument("-m", "--message", help="Migration message (required for migration)")

    # run <dev>
    run_parser = subparsers.add_parser("run", help="Run the application")
    run_parser.add_argument("env", choices=["dev"], help="Environment to run in")

    # lint <blueprints>
    lint_parser = subparsers.add_parser("lint", help="Run linters")
    lint_parser.add_argument("target", choices=["blueprints"], help="What to lint")

    # check <compat>
    check_parser = subparsers.add_parser("check", help="Run system checks")
    check_parser.add_argument("target", choices=["compat"], help="What to check")

    args = parser.parse_args()

    # --- Execute Commands ---
    if args.command == "init":
        init_project(args.name)

    elif args.command == "add" and args.component == "blueprint":
        print(f"🚀 Generating blueprint '{args.name}' via AI...")
        # The agent expects to be run interactively

        # We will wrap it in a subprocess so we don't interfere with its stdin/stdout
        subprocess.run([sys.executable, str(BACKEND_DIR / "agent_blueprint_generator.py")], cwd=os.getcwd())

    elif args.command == "generate":
        if args.target == "schema":
            print("⏳ Generating models from blueprints...")
            import generate_schema
            generate_schema.generate_all_models()
        elif args.target == "migration":
            if not args.message:
                print("❌ --message is required for 'loom generate migration'")
                sys.exit(1)
            # Run the steps equivalent to make_migrations.sh
            import generate_schema
            generate_schema.generate_all_models()
            print("⏳ Running Alembic autogenerate...")
            subprocess.run([sys.executable, "-m", "alembic", "revision", "--autogenerate", "-m", args.message], cwd=str(BACKEND_DIR))
            print("✅ Migration generated. Don't forget to run 'alembic upgrade head'")

    elif args.command == "run" and args.env == "dev":
        from execution_mode import is_org_mode
        if is_org_mode():
            print("⚠️ Running in ORG mode. Hot-reload applies only to Python files, not blueprints.")
        else:
            print("🛠️ Running in PERSONAL dev mode with uvicorn...")
            print("💡 Reminder: To hot-reload blueprint changes, we will pipe through watchfiles in the future.")
        
        # We invoke uvicorn programmatically, passing main:app relative to the backend dir
        subprocess.run([sys.executable, "-m", "uvicorn", "main:app", "--reload", "--port", "8010", "--app-dir", str(BACKEND_DIR)])

    elif args.command == "lint" and args.target == "blueprints":
        from blueprint_linter import check_blueprints
        # In a real project, this would read from the local blueprints/ dir. 
        # For testing within loom-core, we lint the framework blueprints.
        # But we'll try 'blueprints' relative to CWD first.
        local_dir = Path("blueprints")
        check_dir = local_dir if local_dir.exists() else (BACKEND_DIR / "blueprints")
        print(f"🔍 Linting blueprints in {check_dir.absolute()}...")
        success = check_blueprints(str(check_dir))
        sys.exit(0 if success else 1)

    elif args.command == "check" and args.target == "compat":
        from loom import __version__
        print(f"📦 loom-core installed version: {__version__}")
        print("✅ Core is compatible with current environment constraints.")


if __name__ == "__main__":
    main()
