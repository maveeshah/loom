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
    Table,
)
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


# Association table for Many-to-Many relationship between Role and Permission
role_permissions = Table(
    "role_permissions",
    Base.metadata,
    Column("role_id", Integer, ForeignKey("roles.id"), primary_key=True),
    Column("permission_id", Integer, ForeignKey("permissions.id"), primary_key=True),
)


class Permission(Base):
    __tablename__ = "permissions"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, unique=True, index=True)
    module = Column(String, index=True)


class Role(Base):
    __tablename__ = "roles"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    permissions = relationship("Permission", secondary=role_permissions)


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    full_name = Column(String)
    hashed_password = Column(String)
    format = Column(String, default="standard")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    role_id = Column(Integer, ForeignKey("roles.id"))
    role = relationship("Role")


class AuditLog(Base):
    __tablename__ = "auditlogs"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    action = Column(String)
    changes = Column(JSON)
    actor = Column(String, default="System User")
    timestamp = Column(DateTime, default=func.now())


class Employee(Base):
    __tablename__ = "employees"
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    title = Column(String)
    is_active = Column(Boolean, default=True)
    department_id = Column(Integer, ForeignKey("departments.id"))
    department = relationship("Department", back_populates="employees")
    companydocuments = relationship("CompanyDocument")


class CompanyDocument(Base):
    __tablename__ = "company_documents"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_url = Column(String)
    classification = Column(String, default="Confidential")
    employee_id = Column(Integer, ForeignKey("employees.id"))
    employee = relationship("Employee")


class Comment(Base):
    __tablename__ = "comments"
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    content = Column(String)
    author = Column(String, default="System User")
    created_at = Column(DateTime, default=func.now())


class Department(Base):
    __tablename__ = "departments"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    budget = Column(Float)
    is_active = Column(Boolean, default=True)
    employees = relationship("Employee", back_populates="department")
