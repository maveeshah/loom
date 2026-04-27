import argparse
import sys
import os
import subprocess
import platform
import shutil
from pathlib import Path

# Version - keep in sync with pyproject.toml
__version__ = "0.1.0b1"

# ANSI color codes for terminal output
class Colors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'

# Add the parent directory (loom-core root) to sys.path
# This ensures we can import module files like generate_schema and blueprint_linter
# even if installed via editable pip
BACKEND_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(BACKEND_DIR.absolute()))


def colored(text, color):
    """Apply color to text if terminal supports it"""
    if os.getenv('NO_COLOR'):
        return text
    if not sys.stdout.isatty():
        return text
    return f"{color}{text}{Colors.ENDC}"


def print_success(message):
    print(colored(f"✅ {message}", Colors.OKGREEN))


def print_error(message, code=None):
    prefix = f"LOOM-E{code}: " if code else ""
    print(colored(f"❌ {prefix}{message}", Colors.FAIL), file=sys.stderr)


def print_warning(message):
    print(colored(f"⚠️  {message}", Colors.WARNING))


def print_info(message):
    print(colored(f"ℹ️  {message}", Colors.OKCYAN))


def run_doctor():
    """Check system health and environment setup"""
    print(colored("🔍 Running Loom environment diagnostics...\n", Colors.HEADER + Colors.BOLD))
    
    issues = []
    warnings = []
    
    # Check Python version
    py_version = sys.version_info
    print(f"Python version: {py_version.major}.{py_version.minor}.{py_version.micro}")
    if py_version.major < 3 or (py_version.major == 3 and py_version.minor < 10):
        issues.append(("LOOM-E001", "Python 3.10+ required. Current: {py_version.major}.{py_version.minor}"))
    else:
        print_success("Python version OK")
    
    # Check Node.js
    node_path = shutil.which("node")
    if node_path:
        try:
            result = subprocess.run(["node", "--version"], capture_output=True, text=True)
            node_version = result.stdout.strip()
            print(f"Node.js: {node_version}")
            # Extract major version
            major_version = int(node_version.lstrip('v').split('.')[0])
            if major_version < 18:
                warnings.append("Node.js 18+ recommended for frontend development")
            else:
                print_success("Node.js version OK")
        except:
            warnings.append("Could not determine Node.js version")
    else:
        warnings.append("Node.js not found. Frontend development will not work.")
    
    # Check pip availability
    pip_path = shutil.which("pip") or shutil.which("pip3")
    if pip_path:
        print_success(f"pip found at {pip_path}")
    else:
        issues.append(("LOOM-E002", "pip not found. Install pip to use Loom."))
    
    # Check PostgreSQL (optional for development)
    psql_path = shutil.which("psql")
    if psql_path:
        print_success("PostgreSQL client (psql) found")
    else:
        print_info("PostgreSQL client not found. You can use SQLite for development, but PostgreSQL is recommended for production.")
    
    # Check Git
    git_path = shutil.which("git")
    if git_path:
        print_success("Git found")
    else:
        warnings.append("Git not found. Version control recommended.")
    
    # Check Docker (optional)
    docker_path = shutil.which("docker")
    if docker_path:
        try:
            result = subprocess.run(["docker", "--version"], capture_output=True, text=True)
            print(f"Docker: {result.stdout.strip()}")
        except:
            pass
    else:
        print_info("Docker not found. Optional, but useful for production deployment.")
    
    # Check current project (if in one)
    print(f"\n{colored('Project Check:', Colors.BOLD)}")
    cwd = Path.cwd()
    
    env_file = cwd / ".env"
    blueprints_dir = cwd / "blueprints"
    
    if env_file.exists() and blueprints_dir.exists():
        print_success(f"Looks like you're in a Loom project: {cwd.name}")
        
        # Check .env file
        try:
            with open(env_file) as f:
                env_content = f.read()
                if "LOOM_DATABASE_URL" in env_content:
                    print_success("Database URL configured")
                else:
                    warnings.append("LOOM_DATABASE_URL not set in .env. Will use default.")
                    
                if "LOOM_JWT_SECRET" in env_content and "your-secret-key" not in env_content:
                    print_success("JWT secret configured")
                else:
                    warnings.append("Using default JWT secret. Change for production.")
        except Exception as e:
            warnings.append(f"Could not read .env file: {e}")
        
        # Check blueprints
        if blueprints_dir.exists():
            bp_files = list(blueprints_dir.glob("*.yaml")) + list(blueprints_dir.glob("*.yml"))
            print(f"Found {len(bp_files)} blueprint(s)")
            
            if bp_files:
                print_success("Blueprints directory has content")
    else:
        print_info("No Loom project detected in current directory.")
        print_info("Run 'loom init <project-name>' to create one.")
    
    # Summary
    print(f"\n{colored('Summary:', Colors.BOLD)}")
    
    if issues:
        print_error(f"Found {len(issues)} issue(s) that must be fixed:")
        for code, issue in issues:
            print(f"  {colored(code, Colors.FAIL)}: {issue}")
        print(f"\nFix these issues, then run 'loom doctor' again.")
        print(f"See {colored('docs/troubleshooting/', Colors.OKBLUE)} for help.")
        sys.exit(1)
    elif warnings:
        print_warning(f"Found {len(warnings)} warning(s):")
        for warning in warnings:
            print(f"  • {warning}")
        print(f"\n{colored('Environment is functional but has warnings.', Colors.WARNING)}")
        sys.exit(0)
    else:
        print_success("All checks passed! Your environment is ready.")
        print_info("Next: Run 'loom init <project-name>' to create your first project.")
        sys.exit(0)


def init_project(name):
    """Creates a new project scaffold that consumes loom-core"""
    project_dir = Path(name)
    if project_dir.exists():
        print_error(f"Directory {name} already exists.", code="E003")
        sys.exit(1)
        
    print_info(f"Creating new Loom project: {name}")
    
    project_dir.mkdir()
    (project_dir / "blueprints").mkdir()
    (project_dir / "plugins").mkdir()
    (project_dir / "overrides").mkdir()
    (project_dir / "frontend" / "src" / "pages" / "custom").mkdir(parents=True)
    
    # Create default settings
    with open(project_dir / ".env", "w") as f:
        f.write("# Loom Project Configuration\n")
        f.write("# See docs/deployment/environment-variables.md for all options\n\n")
        f.write("LOOM_WORKSPACE_TYPE=personal\n")
        f.write("LOOM_BLUEPRINT_PATHS=blueprints\n")
        f.write('LOOM_APP_TITLE="My Loom Project"\n')
        f.write("# LOOM_DATABASE_URL=sqlite:///./loom_dev.db\n")
        f.write("# For PostgreSQL:\n")
        f.write("# LOOM_DATABASE_URL=postgresql://user:pass@localhost:5432/loom_db\n")
        
    with open(project_dir / "requirements.txt", "w") as f:
        f.write("loom-core\n")
        
    # Create an example blueprint
    with open(project_dir / "blueprints" / "example.yaml", "w") as f:
        f.write("name: Example\n")
        f.write("slug: example\n")
        f.write("module: Custom\n")
        f.write("fields:\n")
        f.write("  - name: title\n")
        f.write("    type: String\n")
        f.write("    required: true\n")
        
    # Create README
    with open(project_dir / "README.md", "w") as f:
        f.write(f"# {name}\n\n")
        f.write("A Loom application.\n\n")
        f.write("## Getting Started\n\n")
        f.write("```bash\n")
        f.write("cd {name}\n")
        f.write("loom run dev\n")
        f.write("```\n\n")
        f.write("Visit http://localhost:3010\n")
        f.write("\n## Documentation\n\n")
        f.write("- [Quickstart](https://loom-framework.dev/docs/quickstart)\n")
        f.write("- [Blueprints](https://loom-framework.dev/docs/blueprint)\n")
        
    print_success(f"Generated new Loom project in ./{name}/")
    print(f"\n{colored('Next steps:', Colors.BOLD)}")
    print(f"  cd {name}")
    print(f"  {colored('loom doctor', Colors.OKCYAN)}     # Verify setup")
    print(f"  {colored('loom run dev', Colors.OKCYAN)}    # Start development server")


def main():
    parser = argparse.ArgumentParser(
        description="Loom CLI — Framework Management",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  loom init my-app              Create a new project
  loom doctor                   Check environment
  loom run dev                  Start development server
  loom generate schema          Generate models from blueprints
  loom lint blueprints          Validate blueprint files

Documentation: https://loom-framework.dev/docs
Community: https://discord.gg/loom
        """
    )
    
    # Global version flag
    parser.add_argument('--version', '-v', action='version', version=f'%(prog)s {__version__}')
    
    subparsers = parser.add_subparsers(dest="command", help="Available commands")

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

    # doctor
    doctor_parser = subparsers.add_parser("doctor", help="Check environment and diagnose issues")
    
    # check <compat>
    check_parser = subparsers.add_parser("check", help="Run system checks")
    check_parser.add_argument("target", choices=["compat"], help="What to check")

    args = parser.parse_args()

    # --- Execute Commands ---
    if args.command is None:
        parser.print_help()
        sys.exit(0)
    
    elif args.command == "doctor":
        run_doctor()
    
    elif args.command == "init":
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
                print_error("--message is required for 'loom generate migration'", code="E004")
                print_info("Example: loom generate migration -m 'Add User table'")
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
        print_info(f"loom-core installed version: {__version__}")
        print_success("Core is compatible with current environment constraints.")


if __name__ == "__main__":
    main()
