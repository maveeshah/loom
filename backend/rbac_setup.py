import glob
import yaml
from database import SessionLocal
import models
from settings import get_settings


def setup_rbac():
    db = SessionLocal()
    settings = get_settings()

    # 1. Discover permissions from blueprints
    permissions_to_create = [
        {"name": "Super Admin Wildcard", "code": "*:*", "module": "System"},
        {"name": "Read Users", "code": "admin:user:read", "module": "Admin"},
        {"name": "Update Users", "code": "admin:user:update", "module": "Admin"},
        {"name": "Read Roles", "code": "admin:role:read", "module": "Admin"},
        {"name": "Create Roles", "code": "admin:role:create", "module": "Admin"},
        {"name": "Update Roles", "code": "admin:role:update", "module": "Admin"},
        {
            "name": "Read Permissions",
            "code": "admin:permission:read",
            "module": "Admin",
        },
    ]

    for root in settings.blueprint_paths:
        pattern = f"{root.rstrip('/')}" + "/*.yaml"
        for bp_path in glob.glob(pattern):
            with open(bp_path, "r") as f:
                bp = yaml.safe_load(f) or {}
                name = bp.get("name")
                if not name:
                    continue

                slug = (bp.get("slug") or name).lower()
                namespace = (bp.get("permission_namespace") or slug).lower()
                module = bp.get("module", "Other")

                # Default CRUD permissions
                for action in ["read", "create", "update", "delete"]:
                    permissions_to_create.append(
                        {
                            "name": f"{action.capitalize()} {name}",
                            "code": f"{namespace}:{action}",
                            "module": module,
                        }
                    )
                # Module wildcard
                permissions_to_create.append(
                    {
                        "name": f"All access to {name}",
                        "code": f"{namespace}:*",
                        "module": module,
                    }
                )

    # 2. Sync permissions to DB
    print(f"Syncing {len(permissions_to_create)} permissions...")
    for p_data in permissions_to_create:
        perm = (
            db.query(models.Permission)
            .filter(models.Permission.code == p_data["code"])
            .first()
        )
        if not perm:
            perm = models.Permission(**p_data)
            db.add(perm)
        else:
            perm.name = p_data["name"]
            perm.module = p_data["module"]

    db.commit()

    # 3. Create Default Roles
    roles_config = [
        {"name": "Administrator", "perm_codes": ["*:*"]},
        {"name": "Admin", "perm_codes": ["*:*"]},
        {
            "name": "Standard User",
            "perm_codes": [
                "patient:read",
                "encounter:read",
                "document:read",
                "notes:read",
                "humans:read",
                "real life:read",
                "employee:read",
                "department:read",
                "comment:read",
            ],
        },
    ]

    for r_data in roles_config:
        role = db.query(models.Role).filter(models.Role.name == r_data["name"]).first()
        if not role:
            role = models.Role(name=r_data["name"])
            db.add(role)
            db.flush()

        # Sync permissions for role
        perms = (
            db.query(models.Permission)
            .filter(models.Permission.code.in_(r_data["perm_codes"]))
            .all()
        )
        role.permissions = perms
        print(f"Role '{r_data['name']}' setup with {len(perms)} permissions.")

    db.commit()

    # 4. Assign Administrator role to default admin user if exists
    admin_user = (
        db.query(models.User).filter(models.User.email == "admin@loom.com").first()
    )
    if admin_user:
        admin_role = (
            db.query(models.Role).filter(models.Role.name == "Administrator").first()
        )
        admin_user.role = admin_role
        print(f"Assigned 'Administrator' role to {admin_user.email}")
        db.commit()

    db.close()
    print("RBAC Setup Complete.")


if __name__ == "__main__":
    setup_rbac()
