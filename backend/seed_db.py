from database import SessionLocal
import models
from auth_utils import get_password_hash


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
        admin_user = db.query(models.User).filter(models.User.email == "admin@loom.com").first()
        if not admin_user:
            admin_user = models.User(
                email="admin@loom.com",
                full_name="System Administrator",
                hashed_password=get_password_hash("admin123"),
                role_id=admin_role.id,
                is_active=True,
            )
            db.add(admin_user)
            db.commit()
            print("Created Admin user: admin@loom.com / admin123")
        else:
            print("Admin user already exists.")

        # 3. Create a Standard User Role (Restricted Access)
        user_role = db.query(models.Role).filter(models.Role.name == "Standard User").first()
        if not user_role:
            user_role = models.Role(
                name="Standard User",
                permissions=[
                    # User CAN read and edit departments and employees
                    "department:read",
                    "department:write",
                    "employee:read",
                    "employee:write",
                    "comment:read",
                    "comment:write",
                    "auditlog:read",
                    # User CANNOT read or write restricted_document (Company Document)
                ],
            )
            db.add(user_role)
            db.commit()
            db.refresh(user_role)
            print("Created Standard User role (no document access).")

        # 4. Create Standard User
        standard_user = db.query(models.User).filter(models.User.email == "user@loom.com").first()
        if not standard_user:
            standard_user = models.User(
                email="user@loom.com",
                full_name="Jane Smith",
                hashed_password=get_password_hash("user123"),
                role_id=user_role.id,
                is_active=True,
            )
            db.add(standard_user)
            db.commit()
            print("Created Standard user: user@loom.com / user123")

        # 5. Create Demo Department (Showcase Custom Dashboard)
        department = db.query(models.Department).first()
        if not department:
            department = models.Department(
                name="Engineering",
                budget=1500000.00,
                is_active=True
            )
            db.add(department)
            db.commit()
            db.refresh(department)
            print(f"Created Department: {department.name}")

            # Create Employees (Showcase Searchable List and Forms)
            emp1 = models.Employee(
                first_name="Alice",
                last_name="Johnson",
                title="Senior Software Engineer",
                department_id=department.id,
                is_active=True
            )
            emp2 = models.Employee(
                first_name="Bob",
                last_name="Williams",
                title="Product Manager",
                department_id=department.id,
                is_active=True
            )
            db.add_all([emp1, emp2])
            db.commit()
            db.refresh(emp1)
            print("Created Employees for Department.")

            # Create a Restricted Company Document (Showcase Role Management and Linking)
            doc = models.CompanyDocument(
                title="Performance Review 2024",
                file_url="https://intranet.loom.com/docs/pr-2024.pdf",
                classification="Highly Confidential",
                employee_id=emp1.id
            )
            db.add(doc)
            db.commit()
            print("Created Restricted Company Document linked to Employee.")

            # Create an AuditLog to showcase the History Tab and JSON logs
            import json
            audit_log = models.AuditLog(
                model_name="Employee",
                record_id=emp1.id,
                action="Updated",
                # Note: SQLite JSON columns often still require a JSON string dump in SQLAlchemy
                # depending on the dialect config, so we dump it to be safe for local SQLite testing
                changes=json.dumps({"title": {"old": "Software Engineer", "new": "Senior Software Engineer"}}),
                actor="System Administrator",
            )
            db.add(audit_log)
            db.commit()
            print("Created Audit Log for Employee.")

            # Create a Comment to showcase the Comments Tab
            comment = models.Comment(
                model_name="Department",
                record_id=department.id,
                content="Notice the custom React component above! This is injected by the plugin system.",
                author="System Administrator",
            )
            db.add(comment)
            db.commit()
            print("Created Comment for Department.")

    except Exception as e:
        import traceback
        traceback.print_exc()
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
