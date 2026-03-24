from typing import List, Callable, Dict, Optional
from fastapi import APIRouter
import importlib


import inspect

class HookRegistry:
    def __init__(self):
        # Hooks stored as { "model_name:action": [handler1, handler2] }
        # Actions: before_create, after_create, before_update, after_update, before_delete, after_delete
        self.hooks: Dict[str, List[Callable]] = {}

    def register(self, model_name: str, action: str, handler: Callable):
        key = f"{model_name.lower()}:{action.lower()}"
        if key not in self.hooks:
            self.hooks[key] = []
        self.hooks[key].append(handler)

    async def execute(self, model_name: str, action: str, *args, **kwargs):
        key = f"{model_name.lower()}:{action.lower()}"
        for handler in self.hooks.get(key, []):
            try:
                if inspect.iscoroutinefunction(handler):
                    await handler(*args, **kwargs)
                else:
                    handler(*args, **kwargs)
            except Exception as e:
                # Decide if hooks should fail the original request or just log
                print(f"Error in hook {key}: {e}")
                raise e


class PluginManifest:
    def __init__(self, name: str, router: Optional[APIRouter] = None):
        self.name = name
        self.router = router
        self.startup_tasks: List[Callable] = []
        self.shutdown_tasks: List[Callable] = []

    def on_startup(self, func: Callable):
        self.startup_tasks.append(func)
        return func


class PluginRegistry:
    def __init__(self):
        self.plugins: Dict[str, PluginManifest] = {}
        self.hooks = HookRegistry()

    def register_plugin(self, manifest: PluginManifest):
        self.plugins[manifest.name] = manifest
        print(f"Registered plugin: {manifest.name}")

    def discover_plugins(self, plugin_paths: List[str]):
        """
        Dynamically load plugins from configured paths.
        Currently simple: looks for `plugins.<name>.plugin.manifest`
        """
        import os

        for path in plugin_paths:
            if not os.path.exists(path):
                continue

            for item in os.listdir(path):
                full_path = os.path.join(path, item)
                if os.path.isdir(full_path) and not item.startswith("__"):
                    try:
                        # Convert path to module. e.g., plugins/billing -> plugins.billing.plugin
                        mod_name = path.replace("/", ".").strip(".")
                        if not mod_name:
                            mod_name = item
                        else:
                            mod_name = f"{mod_name}.{item}.plugin"

                        mod = importlib.import_module(mod_name)
                        if hasattr(mod, "manifest"):
                            self.register_plugin(mod.manifest)
                    except ModuleNotFoundError:
                        pass
                    except Exception as e:
                        print(f"Failed to load plugin {item}: {e}")


# Global registry instance
registry = PluginRegistry()
