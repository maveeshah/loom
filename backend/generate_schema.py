import yaml
import glob

from settings import get_settings


def generate_all_models():
    settings = get_settings()
    blueprint_files: list[str] = []

    # Support multiple blueprint roots (core + plugins/tenants)
    for root in settings.blueprint_paths:
        pattern = f"{root.rstrip('/')}" + "/*.yaml"
        blueprint_files.extend(glob.glob(pattern))

    blueprints = []
    for blueprint_path in blueprint_files:
        with open(blueprint_path, "r") as f:
            blueprints.append(yaml.safe_load(f))

    # FIRST PASS: Map Class Names to Table Names
    class_to_table = {}
    for bp in blueprints:
        name = bp["name"]
        class_name = name.replace(" ", "")
        slug = bp.get("slug", name.lower().replace(" ", "_"))

        explicit_table_name = bp.get("table_name")
        if explicit_table_name:
            table_name = explicit_table_name
        else:
            table_name = slug if slug.endswith("s") else slug + "s"

        class_to_table[class_name] = table_name

    # Start with the necessary imports for your models
    content = [
        "from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, func, ForeignKey, Table",
        "from sqlalchemy.dialects.postgresql import JSONB",
        "from sqlalchemy.orm import relationship",
        "from datetime import datetime",
        "from database import Base\n\n",
        "role_permissions = Table(",
        "    'role_permissions', Base.metadata,",
        "    Column('role_id', Integer, ForeignKey('roles.id'), primary_key=True),",
        "    Column('permission_id', Integer, ForeignKey('permissions.id'), primary_key=True)",
        ")\n\n",
        "class Permission(Base):",
        "    __tablename__ = 'permissions'",
        "    id = Column(Integer, primary_key=True, index=True)",
        "    name = Column(String, unique=True, index=True)",
        "    code = Column(String, unique=True, index=True)",
        "    module = Column(String, index=True)\n\n",
        "class Role(Base):",
        "    __tablename__ = 'roles'",
        "    id = Column(Integer, primary_key=True, index=True)",
        "    name = Column(String, unique=True, index=True)",
        "    permissions = relationship('Permission', secondary=role_permissions)\n\n",
        "class User(Base):",
        "    __tablename__ = 'users'",
        "    id = Column(Integer, primary_key=True, index=True)",
        "    email = Column(String, index=True)",
        "    full_name = Column(String)",
        "    hashed_password = Column(String)",
        "    format = Column(String, default='standard')",
        "    is_active = Column(Boolean, default=True)",
        "    created_at = Column(DateTime, default=func.now())",
        "    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())",
        "    role_id = Column(Integer, ForeignKey('roles.id'))",
        "    role = relationship('Role')\n\n",
        "class SystemSetting(Base):",
        "    __tablename__ = 'system_settings'",
        "    key = Column(String, primary_key=True, index=True)",
        "    value = Column(String)",
        "    group = Column(String)",
        "    description = Column(String)",
        "    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())\n\n",
        "class AuditLog(Base):",
        "    __tablename__ = 'auditlogs'",
        "    id = Column(Integer, primary_key=True, index=True)",
        "    model_name = Column(String)",
        "    record_id = Column(Integer)",
        "    action = Column(String)",
        "    changes = Column(JSONB)",
        "    actor = Column(String, default='System User')",
        "    timestamp = Column(DateTime, default=func.now())\n\n",
        "class Comment(Base):",
        "    __tablename__ = 'comments'",
        "    id = Column(Integer, primary_key=True, index=True)",
        "    model_name = Column(String)",
        "    record_id = Column(Integer)",
        "    content = Column(String)",
        "    author = Column(String, default='System User')",
        "    created_at = Column(DateTime, default=func.now())\n\n",
    ]

    # SECOND PASS: Generate Code
    for blueprint in blueprints:
        name = blueprint["name"]
        class_name = name.replace(" ", "")

        # Skip models that are hardcoded as core framework models above.
        # These must NEVER be redefined by blueprints — they are loom-core owned.
        CORE_MODELS = {"Role", "User", "Permission", "SystemSetting", "AuditLog", "Comment"}
        if class_name in CORE_MODELS:
            continue

        table_name = class_to_table[class_name]

        associations = blueprint.get("associations", [])

        # Build the SQLAlchemy Class
        model_code = f"class {class_name}(Base):\n"
        model_code += f"    __tablename__ = '{table_name}'\n"
        model_code += "    id = Column(Integer, primary_key=True, index=True)\n"

        # Add core tracking columns and the JSONB column for custom fields
        model_code += "    created_at = Column(DateTime, default=func.now())\n"
        model_code += "    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())\n"
        model_code += "    data = Column(JSONB, default=dict)\n"

        # Generate associations (Foreign Keys and Relationships)
        for assoc in associations:
            assoc_type = assoc.get("type")
            target = assoc.get("target")
            fk_name = assoc.get("foreign_key")

            target_table = class_to_table.get(target, target.lower() + "s")

            if assoc_type == "belongs_to":
                if not fk_name:
                    fk_name = f"{target.lower()}_id"
                model_code += f"    {fk_name} = Column(Integer, ForeignKey('{target_table}.id'))\n"

                rel_name = (
                    fk_name.replace("_id", "")
                    if fk_name.endswith("_id")
                    else target.lower()
                )
                model_code += f"    {rel_name} = relationship('{target}')\n"

            elif assoc_type == "has_many":
                rel_name = target.lower() + "s"
                model_code += f"    {rel_name} = relationship('{target}')\n"

            elif assoc_type == "has_one":
                rel_name = target.lower()
                model_code += (
                    f"    {rel_name} = relationship('{target}', uselist=False)\n"
                )

        content.append(model_code)

    code_str = "\n".join(content)
    
    # Validate the generated code
    try:
        compile(code_str, "models_generated", "exec")
    except SyntaxError as e:
        print("❌ CRITICAL ERROR: Generated Python code contains syntax errors!")
        print(f"   Details: {e}")
        import traceback
        traceback.print_exc()
        return

    # Overwrite models.py so it's always fresh
    with open("models.py", "w") as f:
        f.write(code_str)

    print(f"🚀 Rebuilt models.py with {len(blueprints)} schemas.")


if __name__ == "__main__":
    generate_all_models()
