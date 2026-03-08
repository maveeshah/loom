from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, JSON, func, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String)
    full_name = Column(String)
    hashed_password = Column(String)
    format = Column(String, default='standard')
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
    role_id = Column(Integer, ForeignKey('roles.id'))
    role = relationship('Role')

class AuditLog(Base):
    __tablename__ = 'auditlogs'
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    action = Column(String)
    changes = Column(String)
    actor = Column(String, default='System User')
    timestamp = Column(DateTime, default=func.now())

class Employee(Base):
    __tablename__ = 'employees'
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    title = Column(String)
    is_active = Column(Boolean, default=True)
    department_id = Column(Integer, ForeignKey('departments.id'))
    department = relationship('Department')
    companydocuments = relationship('CompanyDocument')

class CompanyDocument(Base):
    __tablename__ = 'company_documents'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    file_url = Column(String)
    classification = Column(String, default='Confidential')
    employee_id = Column(Integer, ForeignKey('employees.id'))
    employee = relationship('Employee')

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    content = Column(String)
    author = Column(String, default='System User')
    created_at = Column(DateTime, default=func.now())

class Department(Base):
    __tablename__ = 'departments'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    budget = Column(Float)
    is_active = Column(Boolean, default=True)
    employees = relationship('Employee')

class Role(Base):
    __tablename__ = 'roles'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    permissions = Column(JSON, default=[])
