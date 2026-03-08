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
        admin_user = (
            db.query(models.User).filter(models.User.email == "admin@loom.com").first()
        )
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

        # 4. Create Demo Patient, Encounter, and Documents
        patient = db.query(models.Patient).first()
        if not patient:
            patient = models.Patient(
                first_name="Jane",
                last_name="Doe",
                age=45,
                is_active=True
            )
            db.add(patient)
            db.commit()
            db.refresh(patient)
            print(f"Created Patient: {patient.first_name} {patient.last_name}")

            # Create an Encounter associated with the patient
            encounter = models.Encounter(
                type="Follow-up",
                status="Completed",
                patient_id=patient.id
            )
            db.add(encounter)
            db.commit()
            print("Created Encounter for Patient.")

            # Create a Document associated with the patient
            document = models.Document(
                title="Lab Results",
                file_url="https://example.com/labs.pdf",
                patient_id=patient.id
            )
            db.add(document)
            db.commit()
            print("Created Document for Patient.")

            # Create an AuditLog to showcase the History Tab
            audit_log = models.AuditLog(
                model_name="Patient",
                record_id=patient.id,
                action="Updated",
                changes={"age": {"old": 44, "new": 45}},
                actor="System Administrator",
            )
            db.add(audit_log)
            db.commit()
            print("Created Audit Log for Patient.")

            # Create a Comment to showcase the Comments Tab
            comment = models.Comment(
                model_name="Patient",
                record_id=patient.id,
                content="Patient reported feeling much better after the new medication regimen.",
                author="System Administrator",
            )
            db.add(comment)
            db.commit()
            print("Created Comment for Patient.")

        # 5. Create other generic records
        invoice = db.query(models.Invoice).first()
        if not invoice:
            invoice = models.Invoice(amount=150.00, status="Paid")
            db.add(invoice)
            db.commit()
            print("Created Demo Invoice.")

        project = db.query(models.Projects).first()
        if not project:
            project = models.Projects(
                name="Loom Platform Rollout",
                description="Deployment of the internal framework to all departments.",
                status="In Progress",
                budget=50000.00
            )
            db.add(project)
            db.commit()
            print("Created Demo Project.")

    except Exception as e:
        print(f"Error seeding data: {e}")
    finally:
        db.close()


if __name__ == "__main__":
    seed_data()
