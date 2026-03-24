import os
import glob
import yaml

def generate_crud_test(blueprint_path, tests_dir="tests"):
    with open(blueprint_path, "r") as f:
        bp = yaml.safe_load(f)

    if not bp or not bp.get("name"):
        return

    name = bp["name"]
    slug = bp.get("slug", name.lower().replace(" ", "_"))
    
    test_file_path = os.path.join(tests_dir, f"test_{slug}.py")
    
    # If test already exists, don't overwrite
    if os.path.exists(test_file_path):
        print(f"Test for {slug} already exists. Skipping.")
        return

    # Basic mapping for dummy data
    def get_dummy_data(field):
        f_type = field.get("type", "String")
        if f_type == "String":
            return f'"Test {field["name"].capitalize()}"'
        elif f_type == "Integer":
            return "42"
        elif f_type == "Float":
            return "3.14"
        elif f_type == "Boolean":
            return "True"
        return '""'

    required_fields = [f for f in bp.get("fields", []) if f.get("required", False)]
    
    payload_create = ",\n        ".join([f'"{f["name"]}": {get_dummy_data(f)}' for f in required_fields])
    
    if not payload_create:
        # If no required fields, just send an empty dict or the first field
        fields = bp.get("fields", [])
        if fields:
            payload_create = f'"{fields[0]["name"]}": {get_dummy_data(fields[0])}'
        else:
            payload_create = ""

    test_content = f"""import pytest
from httpx import AsyncClient
from main import app

@pytest.mark.asyncio
async def test_create_{slug}(authorized_client: AsyncClient):
    payload = {{
        {payload_create}
    }}
    response = await authorized_client.post("/v1/app/{slug}", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "id" in data

@pytest.mark.asyncio
async def test_get_{slug}_list(authorized_client: AsyncClient):
    response = await authorized_client.get("/v1/app/{slug}")
    assert response.status_code == 200
    data = response.json()
    assert "data" in data
    assert isinstance(data["data"], list)

@pytest.mark.asyncio
async def test_update_{slug}(authorized_client: AsyncClient):
    # Setup - create first
    payload = {{
        {payload_create}
    }}
    res = await authorized_client.post("/v1/app/{slug}", json=payload)
    record_id = res.json()["id"]

    # Update
    update_payload = {{}}  # Add valid update fields here
    response = await authorized_client.put(f"/v1/app/{slug}/{{record_id}}", json=update_payload)
    assert response.status_code == 200

@pytest.mark.asyncio
async def test_delete_{slug}(authorized_client: AsyncClient):
    # Setup
    payload = {{
        {payload_create}
    }}
    res = await authorized_client.post("/v1/app/{slug}", json=payload)
    record_id = res.json()["id"]

    # Delete
    response = await authorized_client.delete(f"/v1/app/{slug}/{{record_id}}")
    assert response.status_code == 204
"""
    
    os.makedirs(tests_dir, exist_ok=True)
    with open(test_file_path, "w") as f:
        f.write(test_content)
    print(f"✅ Generated tests for {name} -> {test_file_path}")

def generate_all_tests():
    for bp_path in glob.glob("blueprints/*.yaml"):
        generate_crud_test(bp_path)

if __name__ == "__main__":
    generate_all_tests()
