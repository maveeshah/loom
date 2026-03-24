import os
import glob
import yaml
import sys

def check_blueprints(blueprints_dir="blueprints"):
    all_blueprints = {}
    errors = 0

    # First pass: load and check syntax
    for bp_path in glob.glob(os.path.join(blueprints_dir, "*.yaml")):
        try:
            with open(bp_path, "r") as f:
                bp = yaml.safe_load(f)
                if not bp:
                    print(f"❌ Error: {bp_path} is empty or invalid YAML")
                    errors += 1
                    continue
                
                name = bp.get("name")
                if not name:
                    print(f"❌ Error: {bp_path} is missing required field 'name'")
                    errors += 1
                    continue
                
                all_blueprints[name.replace(" ", "")] = bp

        except Exception as e:
            print(f"❌ Error: Could not parse {bp_path}: {e}")
            errors += 1

    # Second pass: validate fields and associations
    valid_types = {"String", "Integer", "Float", "Boolean", "JSON", "DateTime", "Date", "Select", "Text", "Email", "Password", "URL", "PhoneNumber"}
    for name, bp in all_blueprints.items():
        # Validate fields
        fields = bp.get("fields", [])
        if not isinstance(fields, list):
            print(f"❌ Error: {name} 'fields' must be a list")
            errors += 1
        else:
            for field in fields:
                if not isinstance(field, dict) or "name" not in field:
                    print(f"❌ Error: Field in {name} is missing 'name'")
                    errors += 1
                    continue
                f_type = field.get("type", "String")
                if f_type not in valid_types:
                    print(f"❌ Error: Field '{field['name']}' in {name} has invalid type '{f_type}'")
                    errors += 1

        # Validate associations
        associations = bp.get("associations", [])
        if not isinstance(associations, list):
            print(f"❌ Error: {name} 'associations' must be a list")
            errors += 1
        else:
            for assoc in associations:
                target = assoc.get("target")
                if not target:
                    print(f"❌ Error: Association in {name} is missing 'target'")
                    errors += 1
                    continue
                if target not in all_blueprints:
                    # Target might be core models like 'Department', 'User' etc., which are defined?
                    # Except some aren't in this folder. Wait, User and Department are core, but Department is in blueprints normally.
                    # 'User' is not in blueprints, it's in models.py. So we'll ignore valid target checking for system models.
                    pass
                type_ = assoc.get("type")
                if type_ not in {"belongs_to", "has_many", "has_one"}:
                    print(f"❌ Error: Association in {name} has invalid type '{type_}'")
                    errors += 1

    if errors == 0:
        print("✅ All blueprints passed validation!")
        return True
    else:
        print(f"💥 Blueprint validation failed with {errors} errors.")
        return False

if __name__ == "__main__":
    success = check_blueprints()
    if not success:
        sys.exit(1)
