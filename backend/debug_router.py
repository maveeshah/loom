from fastapi import APIRouter
from execution_mode import assert_personal_mode
from plugin_registry import registry

router = APIRouter(prefix="/debug", tags=["Debug"])

@router.get("/blueprints")
async def get_all_blueprints():
    """Return the raw parsed YAML for all loaded blueprints."""
    assert_personal_mode("Debug endpoints")
    from main import blueprint_registry
    return list(blueprint_registry.values())

@router.get("/hooks")
async def get_registered_hooks():
    """List all registered hook handlers grouped by event (e.g. employee:after_create)."""
    assert_personal_mode("Debug endpoints")
    # Convert Callable lists to just their names for JSON serialization
    return {
        event: [handler.__name__ for handler in handlers]
        for event, handlers in registry.hooks.hooks.items()
    }

@router.get("/plugins")
async def get_loaded_plugins():
    """List all plugins currently loaded by the PluginRegistry."""
    assert_personal_mode("Debug endpoints")
    return list(registry.plugins.keys())
