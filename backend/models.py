from sqlalchemy import Column, Integer, String, Boolean, DateTime, Date, Float, JSON, func, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class Document(Base):
    __tablename__ = 'documents'
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)
    title = Column(String)
    file_url = Column(String)
    uploaded_at = Column(DateTime, default=func.now())
    patient_id = Column(Integer, ForeignKey('patients.id'))
    patient = relationship('Patient')

class Note(Base):
    __tablename__ = 'notes'
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String)
    content = Column(String)
    is_done = Column(Boolean, default=False)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Humans(Base):
    __tablename__ = 'humanss'
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
    __tablename__ = 'auditlogs'
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    action = Column(String)
    changes = Column(String)
    actor = Column(String, default='System User')
    timestamp = Column(DateTime, default=func.now())

class Encounter(Base):
    __tablename__ = 'encounters'
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer)
    encounter_date = Column(DateTime, default=func.now())
    type = Column(String)
    status = Column(String, default='Scheduled')
    patient_id = Column(Integer, ForeignKey('patients.id'))
    patient = relationship('Patient')

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String)
    full_name = Column(String)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Patient(Base):
    __tablename__ = 'patients'
    id = Column(Integer, primary_key=True, index=True)
    first_name = Column(String)
    last_name = Column(String)
    age = Column(Integer)
    is_active = Column(Boolean, default=True)
    encounters = relationship('Encounter')

class Comment(Base):
    __tablename__ = 'comments'
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String)
    record_id = Column(Integer)
    content = Column(String)
    author = Column(String, default='System User')
    created_at = Column(DateTime, default=func.now())

class Projects(Base):
    __tablename__ = 'projectss'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String)
    description = Column(String)
    status = Column(String)
    start_date = Column(Date)
    end_date = Column(Date)
    budget = Column(Float)
    team_members = Column(JSON)
    tasks = Column(JSON)
