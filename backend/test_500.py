import asyncio
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

endpoints = [
    "/v1/app/user",
    "/v1/app/role",
    "/v1/app/department",
    "/v1/auth/me"
]

for ep in endpoints:
    print(f"Testing {ep}...")
    try:
        response = client.get(ep)
        print(f"Status: {response.status_code}")
        if response.status_code == 500:
            print(f"500 Body: {response.text}")
    except Exception as e:
        print(f"CRASH on {ep}: {e}")

