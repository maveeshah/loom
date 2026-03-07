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
        "from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, JSON, func, ForeignKey",
        "from sqlalchemy.orm import relationship",
        "from datetime import datetime",
        "from database import Base\n\n",
    ]

    # SECOND PASS: Generate Code
    for blueprint in blueprints:
        name = blueprint["name"]
        class_name = name.replace(" ", "")
        table_name = class_to_table[class_name]

        fields = blueprint.get("fields", [])
        associations = blueprint.get("associations", [])

        # Build the SQLAlchemy Class
        model_code = f"class {class_name}(Base):\n"
        model_code += f"    __tablename__ = '{table_name}'\n"
        model_code += "    id = Column(Integer, primary_key=True, index=True)\n"

        # Collect foreign keys to avoid duplicate column definitions
        fks = [
            assoc.get("foreign_key")
            for assoc in associations
            if assoc.get("type") == "belongs_to" and assoc.get("foreign_key")
        ]

        # Generate fields
        for field in fields:
            f_name = field["name"]
            if f_name in fks:
                continue

            f_type = field["type"]

            # Auto-map relationships to JSON arrays for prototyping
            if f_type in ["ManyToMany", "OneToMany", "ManyToOne", "OneToOne"]:
                f_type = "JSON"
            f_default = field.get("default")

            # Handle defaults if they exist
            if f_default == "now()":
                f_default = "func.now()"
            elif f_type == "String" and f_default is not None:
                # Wrap string defaults in quotes to avoid NameError in models.py
                f_default = f"'{f_default}'"

            f_onupdate = field.get("onupdate")
            if f_onupdate == "now()":
                f_onupdate = "func.now()"

            default_str = f", default={f_default}" if f_default is not None else ""
            onupdate_str = f", onupdate={f_onupdate}" if f_onupdate is not None else ""
            model_code += (
                f"    {f_name} = Column({f_type}{default_str}{onupdate_str})\n"
            )

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

    # Overwrite models.py so it's always fresh
    with open("models.py", "w") as f:
        f.write("\n".join(content))

    print(f"🚀 Rebuilt models.py with {len(blueprints)} schemas.")


if __name__ == "__main__":
    generate_all_models()
