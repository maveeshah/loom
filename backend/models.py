from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    DateTime,
    Date,
    Float,
    JSON,
    func,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_url = Column(String)
    uploaded_at = Column(DateTime, default=func.now())
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient")


class Note(Base):
    __tablename__ = "notes"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    is_done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())


class Humans(Base):
    __tablename__ = "humans"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    email = Column(String)
    phone = Column(String)
    address = Column(String)
    city = Column(String)
    state = Column(String)
    zip = Column(String)
    country = Column(String)


class AuditLog(Base):
    __tablename__ = "auditlogs"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    action = Column(String)
    changes = Column(String)
    actor = Column(String, default="System User")
    timestamp = Column(DateTime, default=func.now())


from sqlalchemy import Table

# Association table for roles and permissions
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)  # human readable
    code = Column(String, unique=True, index=True)  # e.g., 'patient:read'
    module = Column(String, index=True)  # grouping


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    permissions = relationship(
        "Permission", secondary=role_permissions, backref="roles"
    )


class Encounter(Base):
    __tablename__ = "encounters"
    id = Column(Integer, primary_key=True, index=True)
    encounter_date = Column(DateTime, default=func.now())
    type = Column(String)
    status = Column(String, default="Scheduled")
    patient_id = Column(Integer, ForeignKey("patients.id"))
    patient = relationship("Patient")


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String)
    full_name = Column(String)
    hashed_password = Column(String)
    format = Column(String, default="standard")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role")


class Patient(Base):
    __tablename__ = "patients"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    age = Column(Integer)
    is_active = Column(Boolean, default=True)
    encounters = relationship("Encounter")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    content = Column(String)
    author = Column(String, default="System User")
    created_at = Column(DateTime, default=func.now())


class Projects(Base):
    __tablename__ = "projects"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    status = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float)
    team_members = Column(JSON)
    tasks = Column(JSON)


class Invoice(Base):
    __tablename__ = "invoices"
    id = Column(Integer, primary_key=True, index=True)
    amount = Column(Float)
    status = Column(String, default="Draft")
