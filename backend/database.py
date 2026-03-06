import os
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# 1. Get the URL from Docker environment variables
# Note: 'db' is the name of the service in your docker-compose.yml
DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://mavee:password123@db:5432/viemed"
)

# 2. The Engine is the actual connection to the DB
engine = create_engine(DATABASE_URL)

# 3. SessionLocal is a factory for database sessions
# We set expire_on_commit=False so we can access objects after a commit
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# 4. The Base class that all your "DocTypes" (Models) will inherit from
Base = declarative_base()


# 5. Dependency: This is how FastAPI routes will get a DB connection
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # CRITICAL: This closes the connection after the request is done
