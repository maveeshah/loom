import yaml
import glob


def generate_all_models():
    blueprint_files = glob.glob("blueprints/*.yaml")

    # Start with the necessary imports for your models
    content = [
        "from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, JSON, func, ForeignKey",
        "from sqlalchemy.orm import relationship",
        "from datetime import datetime",
        "from database import Base\n\n",
    ]

    for blueprint_path in blueprint_files:
        with open(blueprint_path, "r") as f:
            blueprint = yaml.safe_load(f)

        name = blueprint["name"]
        fields = blueprint.get("fields", [])
        associations = blueprint.get("associations", [])

        # Build the SQLAlchemy Class
        model_code = f"class {name}(Base):\n"
        model_code += f"    __tablename__ = '{name.lower()}s'\n"
        model_code += "    id = Column(Integer, primary_key=True, index=True)\n"

        # Generate fields
        for field in fields:
            f_name = field["name"]
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

            if assoc_type == "belongs_to":
                # If this model belongs to another, it needs a foreign key pointing to the target
                model_code += f"    {fk_name} = Column(Integer, ForeignKey('{target.lower()}s.id'))\n"
                # And a relationship
                # e.g., patient = relationship("Patient", back_populates="encounters")
                rel_name = target.lower()
                model_code += f"    {rel_name} = relationship('{target}')\n"

            elif assoc_type == "has_many":
                # If this model has many of another, the other model holds the foreign key
                # We just define the relationship here
                # e.g., encounters = relationship("Encounter")
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

    print(f"🚀 Rebuilt models.py with {len(blueprint_files)} schemas.")


if __name__ == "__main__":
    generate_all_models()
