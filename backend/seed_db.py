from sqlalchemy.orm import Session
from database import SessionLocal
import models
from auth_utils import get_password_hash
import json


def seed_data():
    db = SessionLocal()
    try:
        # 1. Create Admin Role
        admin_role = db.query(models.Role).filter(models.Role.name == "Admin").first()
        if not admin_role:
            admin_role = models.Role(
                name="Admin",
                permissions=["*:*"],  # Wildcard for all permissions
            )
            db.add(admin_role)
            db.commit()
            db.refresh(admin_role)
            print("Created Admin role.")

        # 2. Create Default Admin User
        admin_user = (
            db.query(models.User)
            .filter(models.User.email == "admin@viemed.com")
            .first()
        )
        if not admin_user:
            admin_user = models.User(
                email="admin@viemed.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role_id=admin_role.id,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("Created Admin user: admin@viemed.com / admin123")
        else:
            print("Admin user already exists.")

        # 3. Create a Demo Doctor Role
        doctor_role = db.query(models.Role).filter(models.Role.name == "Doctor").first()
        if not doctor_role:
            doctor_role = models.Role(
                name="Doctor",
                permissions=[
                    "patient:read",
                    "patient:write",
                    "encounter:read",
                    "encounter:write",
                    "comment:read",
                    "comment:write",
                    "auditlog:read",
                ],
            )
            db.add(doctor_role)
            db.commit()
            print("Created Doctor role.")

    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
