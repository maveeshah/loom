import glob
import yaml
import sys
import asyncio
from database import SessionLocal
import models
from sqlalchemy.future import select
from settings import get_settings

async def check_rbac_drift():
    settings = get_settings()

    # Discover expected permissions from blueprints
    expected_permissions = {"*:*", "admin:user:read", "admin:user:update", "admin:role:read", "admin:role:create", "admin:role:update", "admin:permission:read"}

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

                for action in ["read", "create", "update", "delete", "*"]:
                    expected_permissions.add(f"{namespace}:{action}")

    async with SessionLocal() as db:
        try:
            # Get actual permissions from database
            result = await db.execute(select(models.Permission))
            db_permissions = result.scalars().all()
            actual_permissions = {p.code for p in db_permissions}
        except Exception as e:
            print(f"❌ Failed to fetch permissions from DB (not initialized?): {e}")
            sys.exit(1)

    missing_in_db = expected_permissions - actual_permissions
    extra_in_db = actual_permissions - expected_permissions

    drift_found = False

    if missing_in_db:
        print("⚠️ RBAC DRIFT DETECTED: The following permissions are missing from the database:")
        for code in missing_in_db:
            print(f"  - {code}")
        drift_found = True

    if extra_in_db:
        print("ℹ️ Found extra permissions in database not defined in current blueprints (might be deprecated):")
        for code in extra_in_db:
            print(f"  - {code}")
        # Not marking as failure for extra perms, they might be custom plugins

    if not drift_found:
        print("✅ RBAC is perfectly synced.")
    
    if missing_in_db:
        print("\nFix missing permissions by running: python rbac_setup.py")
        sys.exit(1)

if __name__ == "__main__":
    asyncio.run(check_rbac_drift())
