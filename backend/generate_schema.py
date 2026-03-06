import yaml
import glob


def generate_all_models():
    blueprint_files = glob.glob("blueprints/*.yaml")

    # Start with the necessary imports for your models
    content = [
        "from sqlalchemy import Column, Integer, String, Boolean, DateTime, func",
        "from datetime import datetime",
        "from database import Base\n\n",
    ]

    for blueprint_path in blueprint_files:
        with open(blueprint_path, "r") as f:
            blueprint = yaml.safe_load(f)

        name = blueprint["name"]
        fields = blueprint["fields"]

        # Build the SQLAlchemy Class
        model_code = f"class {name}(Base):\n"
        model_code += f"    __tablename__ = '{name.lower()}s'\n"
        model_code += "    id = Column(Integer, primary_key=True, index=True)\n"

        for field in fields:
            f_name = field["name"]
            f_type = field["type"]
            f_default = field.get("default")

            # Handle defaults if they exist
            if f_default == "now()":
                f_default = "func.now()"

            f_onupdate = field.get("onupdate")
            if f_onupdate == "now()":
                f_onupdate = "func.now()"

            default_str = f", default={f_default}" if f_default is not None else ""
            onupdate_str = f", onupdate={f_onupdate}" if f_onupdate is not None else ""
            model_code += (
                f"    {f_name} = Column({f_type}{default_str}{onupdate_str})\n"
            )

        content.append(model_code)

    # Overwrite models.py so it's always fresh
    with open("models.py", "w") as f:
        f.write("\n".join(content))

    print(f"🚀 Rebuilt models.py with {len(blueprint_files)} schemas.")


if __name__ == "__main__":
    generate_all_models()
