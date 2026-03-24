from pydantic import BaseModel, create_model
from typing import Any, Optional, Dict
from datetime import datetime

def create_pydantic_model_from_blueprint(
    blueprint: dict, is_update: bool = False
) -> type[BaseModel]:
    """
    Dynamically generate a Pydantic model for validation and OpenAPI docs based on a YAML blueprint.
    If `is_update` is True, all fields become optional (like a PATCH operation).
    """
    model_name = blueprint.get("name", "UnknownModel").replace(" ", "")
    fields = blueprint.get("fields", [])

    # Map blueprint types to Python types
    type_mapping = {
        "String": str,
        "Integer": int,
        "Float": float,
        "Boolean": bool,
        "JSON": Dict[str, Any],
        "DateTime": datetime,
        "Date": datetime,  # Simple approximation for date
    }

    model_fields = {}

    # Always allow an ID in update payloads just in case, though it's typically in the URL
    if is_update:
        model_fields["id"] = (Optional[int], None)

    for field in fields:
        f_name = field["name"]
        f_type_str = field.get("type", "String")
        py_type = type_mapping.get(f_type_str, Any)

        is_required = field.get("required", False)

        if is_update:
            # Everything is optional in a PUT/PATCH unless specifically needed
            model_fields[f_name] = (Optional[py_type], None)
        else:
            if is_required:
                model_fields[f_name] = (py_type, ...)
            else:
                default_val = field.get("default", None)
                if default_val == "now()":
                    default_val = None  # We let the DB handle it
                model_fields[f_name] = (Optional[py_type], default_val)

    # Add foreign keys dynamically
    for assoc in blueprint.get("associations", []):
        if assoc.get("type") == "belongs_to":
            fk_name = assoc.get("foreign_key", f"{assoc.get('target', '').lower()}_id")
            if is_update:
                model_fields[fk_name] = (Optional[int], None)
            else:
                model_fields[fk_name] = (Optional[int], None)

    suffix = "Update" if is_update else "Create"
    return create_model(f"{model_name}{suffix}", **model_fields)
