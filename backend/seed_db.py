import asyncio
from sqlalchemy.future import select
from database import SessionLocal
import models
from auth_utils import get_password_hash


async def seed_data():
    async with SessionLocal() as db:
        try:
            # 1. Create Admin Role
            result = await db.execute(select(models.Role).filter(models.Role.name == "Admin"))
            admin_role = result.scalars().first()
            if not admin_role:
                admin_role = models.Role(name="Admin")
                db.add(admin_role)
                await db.commit()
                await db.refresh(admin_role)
                print("Created Admin role.")

            # 2. Create Default Admin User
            result = await db.execute(select(models.User).filter(models.User.email == "admin@loom.com"))
            admin_user = result.scalars().first()
            if not admin_user:
                admin_user = models.User(
                    email="admin@loom.com",
                    full_name="System Administrator",
                    hashed_password=get_password_hash("admin123"),
                    role_id=admin_role.id,
                    is_active=True,
                )
                db.add(admin_user)
                await db.commit()
                print("Created Admin user: admin@loom.com / admin123")
            else:
                print("Admin user already exists.")

            # 3. Create a Standard User Role (Restricted Access)
            result = await db.execute(select(models.Role).filter(models.Role.name == "Standard User"))
            user_role = result.scalars().first()
            if not user_role:
                user_role = models.Role(name="Standard User")
                db.add(user_role)
                await db.commit()
                await db.refresh(user_role)
                print("Created Standard User role.")

            # 4. Create Standard User
            result = await db.execute(select(models.User).filter(models.User.email == "test@example.com"))
            standard_user = result.scalars().first()
            if not standard_user:
                standard_user = models.User(
                    email="test@example.com",
                    full_name="Jane Smith",
                    hashed_password=get_password_hash("password123"),
                    role_id=user_role.id,
                    is_active=True,
                )
                db.add(standard_user)
                await db.commit()
                print("Created Standard user: test@example.com / password123")

        except Exception as e:
            import traceback

            traceback.print_exc()
            print(f"Error seeding data: {e}")


if __name__ == "__main__":
    asyncio.run(seed_data())
