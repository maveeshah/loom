import os
import glob
import yaml
import sys
from pathlib import Path

# Error codes for blueprint validation
class BlueprintErrors:
    EMPTY_YAML = ("LOOM-B001", "Empty or invalid YAML file")
    MISSING_NAME = ("LOOM-B002", "Missing required field 'name'")
    MISSING_SLUG = ("LOOM-B003", "Missing required field 'slug'")
    MISSING_MODULE = ("LOOM-B004", "Missing required field 'module'")
    DUPLICATE_SLUG = ("LOOM-B005", "Duplicate slug detected")
    FIELDS_NOT_LIST = ("LOOM-B006", "'fields' must be a list")
    FIELD_MISSING_NAME = ("LOOM-B007", "Field missing 'name' property")
    INVALID_FIELD_TYPE = ("LOOM-B008", "Invalid field type")
    ASSOCIATIONS_NOT_LIST = ("LOOM-B009", "'associations' must be a list")
    ASSOC_MISSING_TARGET = ("LOOM-B010", "Association missing 'target'")
    INVALID_ASSOC_TYPE = ("LOOM-B011", "Invalid association type")
    INVALID_ASSOC_TARGET = ("LOOM-B012", "Association target not found")
    SELECT_MISSING_OPTIONS = ("LOOM-B013", "Select field missing 'options'")
    INVALID_DEFAULT_TYPE = ("LOOM-B014", "Default value doesn't match field type")

# Valid field types
VALID_FIELD_TYPES = {
    "String", "Integer", "Float", "Boolean", "JSON", 
    "DateTime", "Date", "Select", "Text", "Email", 
    "Password", "URL", "PhoneNumber"
}

# Valid association types
VALID_ASSOC_TYPES = {"belongs_to", "has_many", "has_one"}

# Core models that are always available (don't need blueprint)
CORE_MODELS = {"User", "Role", "AuditLog", "Comment"}

def format_error(code, message, file=None, context=None):
    """Format error message with code and optional context"""
    file_str = f" in {file}" if file else ""
    context_str = f" ({context})" if context else ""
    return f"❌ {code}: {message}{file_str}{context_str}"


def format_warning(message, file=None, suggestion=None):
    """Format warning with optional file and suggestion"""
    file_str = f" in {file}" if file else ""
    suggestion_str = f"\n   💡 {suggestion}" if suggestion else ""
    return f"⚠️  {message}{file_str}{suggestion_str}"


def check_blueprints(blueprints_dir="blueprints"):
    all_blueprints = {}
    all_slugs = {}  # Track slugs to detect duplicates
    errors = 0
    warnings = 0

    print(f"🔍 Scanning blueprints in: {blueprints_dir}")
    
    blueprint_files = glob.glob(os.path.join(blueprints_dir, "*.yaml")) + \
                       glob.glob(os.path.join(blueprints_dir, "*.yml"))
    
    if not blueprint_files:
        print(f"⚠️  No blueprint files found in {blueprints_dir}")
        return True
    
    print(f"Found {len(blueprint_files)} blueprint file(s)\n")

    # First pass: load and check basic structure
    for bp_path in blueprint_files:
        bp_filename = os.path.basename(bp_path)
        
        try:
            with open(bp_path, "r") as f:
                bp = yaml.safe_load(f)
                
                if not bp:
                    print(format_error(*BlueprintErrors.EMPTY_YAML, file=bp_filename))
                    errors += 1
                    continue
                
                # Check required fields
                name = bp.get("name")
                if not name:
                    print(format_error(*BlueprintErrors.MISSING_NAME, file=bp_filename))
                    errors += 1
                    continue
                
                slug = bp.get("slug")
                if not slug:
                    print(format_error(*BlueprintErrors.MISSING_SLUG, file=bp_filename,
                                      context=f"Blueprint: {name}"))
                    errors += 1
                    continue
                
                # Warn if slug doesn't follow convention
                if slug != slug.lower().replace(" ", "_"):
                    warnings += 1
                    print(format_warning(
                        f"Slug '{slug}' should be snake_case",
                        file=bp_filename,
                        suggestion=f"Consider using: {slug.lower().replace(' ', '_')}"
                    ))
                
                # Check for duplicate slugs
                if slug in all_slugs:
                    warnings += 1
                    print(format_warning(
                        f"Duplicate slug '{slug}'",
                        file=bp_filename,
                        suggestion=f"Also defined in: {all_slugs[slug]}"
                    ))
                else:
                    all_slugs[slug] = bp_filename
                
                module = bp.get("module")
                if not module:
                    print(format_error(*BlueprintErrors.MISSING_MODULE, file=bp_filename,
                                      context=f"Blueprint: {name}"))
                    errors += 1
                    continue
                
                # Store for second pass
                all_blueprints[name] = {
                    "data": bp,
                    "file": bp_filename,
                    "slug": slug
                }

        except yaml.YAMLError as e:
            print(format_error("LOOM-B000", f"YAML syntax error: {e}", file=bp_filename))
            errors += 1
        except Exception as e:
            print(format_error("LOOM-B000", f"Could not parse: {e}", file=bp_filename))
            errors += 1

    # Second pass: validate fields and associations
    for name, bp_info in all_blueprints.items():
        bp = bp_info["data"]
        bp_file = bp_info["file"]
        
        # Validate fields
        fields = bp.get("fields", [])
        if fields:  # Fields are optional
            if not isinstance(fields, list):
                print(format_error(*BlueprintErrors.FIELDS_NOT_LIST, file=bp_file,
                                  context=f"Blueprint: {name}"))
                errors += 1
            else:
                for idx, field in enumerate(fields):
                    if not isinstance(field, dict):
                        print(format_error(*BlueprintErrors.FIELD_MISSING_NAME, file=bp_file,
                                          context=f"Field #{idx} in {name}"))
                        errors += 1
                        continue
                    
                    field_name = field.get("name")
                    if not field_name:
                        print(format_error(*BlueprintErrors.FIELD_MISSING_NAME, file=bp_file,
                                          context=f"Field #{idx} in {name}"))
                        errors += 1
                        continue
                    
                    f_type = field.get("type", "String")
                    if f_type not in VALID_FIELD_TYPES:
                        print(format_error(*BlueprintErrors.INVALID_FIELD_TYPE, file=bp_file,
                                          context=f"Field '{field_name}' type '{f_type}' in {name}"))
                        print(f"   💡 Valid types: {', '.join(sorted(VALID_FIELD_TYPES))}")
                        errors += 1
                        continue
                    
                    # Check Select fields have options
                    if f_type == "Select":
                        options = field.get("options")
                        if not options or not isinstance(options, list):
                            print(format_error(*BlueprintErrors.SELECT_MISSING_OPTIONS, file=bp_file,
                                              context=f"Field '{field_name}' in {name}"))
                            errors += 1
                    
                    # Check for common field name typos
                    if field_name == "id":
                        warnings += 1
                        print(format_warning(
                            "Field named 'id' will be ignored (Loom adds id automatically)",
                            file=bp_file,
                            suggestion="Remove this field or rename it"
                        ))

        # Validate associations
        associations = bp.get("associations", [])
        if associations:  # Associations are optional
            if not isinstance(associations, list):
                print(format_error(*BlueprintErrors.ASSOCIATIONS_NOT_LIST, file=bp_file,
                                  context=f"Blueprint: {name}"))
                errors += 1
            else:
                for idx, assoc in enumerate(associations):
                    if not isinstance(assoc, dict):
                        print(format_error(*BlueprintErrors.ASSOC_MISSING_TARGET, file=bp_file,
                                          context=f"Association #{idx} in {name}"))
                        errors += 1
                        continue
                    
                    target = assoc.get("target")
                    if not target:
                        print(format_error(*BlueprintErrors.ASSOC_MISSING_TARGET, file=bp_file,
                                          context=f"Association #{idx} in {name}"))
                        errors += 1
                        continue
                    
                    # Check if target exists (in blueprints or core models)
                    if target not in all_blueprints and target not in CORE_MODELS:
                        print(format_error(*BlueprintErrors.INVALID_ASSOC_TARGET, file=bp_file,
                                          context=f"Association target '{target}' in {name}"))
                        print(f"   💡 Available blueprints: {', '.join(all_blueprints.keys())}")
                        print(f"   💡 Core models: {', '.join(CORE_MODELS)}")
                        errors += 1
                    
                    assoc_type = assoc.get("type")
                    if not assoc_type:
                        print(format_error(*BlueprintErrors.INVALID_ASSOC_TYPE, file=bp_file,
                                          context=f"Association in {name} missing 'type'"))
                        errors += 1
                    elif assoc_type not in VALID_ASSOC_TYPES:
                        print(format_error(*BlueprintErrors.INVALID_ASSOC_TYPE, file=bp_file,
                                          context=f"Type '{assoc_type}' in {name}"))
                        print(f"   💡 Valid types: {', '.join(VALID_ASSOC_TYPES)}")
                        errors += 1

    # Summary
    print()
    if errors == 0 and warnings == 0:
        print(f"✅ All {len(all_blueprints)} blueprint(s) passed validation!")
        return True
    elif errors == 0:
        print(f"⚠️  {len(all_blueprints)} blueprint(s) passed with {warnings} warning(s)")
        return True
    else:
        print(f"💥 Blueprint validation failed with {errors} error(s) and {warnings} warning(s)")
        print(f"\n   📚 See docs/troubleshooting/blueprint-errors.md for help")
        return False

if __name__ == "__main__":
    success = check_blueprints()
    if not success:
        sys.exit(1)
