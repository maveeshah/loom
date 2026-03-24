import asyncio
from watchfiles import awatch
from pathlib import Path
from execution_mode import is_org_mode
import generate_schema
# We use a deferred import for load_blueprint_registry to avoid circular imports.

async def watch_blueprints(paths: list[str]):
    """Watch blueprint directories for changes and trigger schema auto-reload."""
    if is_org_mode():
        return

    print(f"👀 Watching for blueprint changes in: {', '.join(paths)}")
    
    # Resolve all path strings to actual directories to watch
    watch_dirs = []
    for p in paths:
        d = Path(p).resolve()
        if not d.exists():
            try:
                d.mkdir(parents=True, exist_ok=True)
            except Exception:
                continue
        watch_dirs.append(str(d))

    if not watch_dirs:
        print("⚠️ No valid blueprint directories found to watch.")
        return

    from main import load_blueprint_registry
    from settings import get_settings

    try:
        async for changes in awatch(*watch_dirs):
            print("\n🔄 Blueprint change detected. Regenerating schemas...")
            try:
                generate_schema.generate_all_models()
                # Reload the registry so new changes are available in the API routes immediately
                load_blueprint_registry(get_settings())
                print("✅ Schemas regenerated. API responses updated.")
            except Exception as e:
                print(f"❌ Error reloading blueprints: {e}")
    except asyncio.CancelledError:
        pass
