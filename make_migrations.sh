#!/bin/bash
# make_migrations.sh
# Run this locally to update the SQLAlchemy models and generate a new Alembic migration.

echo "Generating models.py from blueprints..."
cd backend
python3 generate_schema.py

echo "Generating Alembic migration..."
alembic revision --autogenerate -m "auto-generated from blueprint updates"

echo "Migrations successfully generated! You can now commit the new migration file to git."
