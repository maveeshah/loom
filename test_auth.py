import urllib.request
import urllib.parse
import json
import sys

base_url = "http://localhost:8010/v1/auth"

# Step 1: Login to get token using the user created earlier
data = urllib.parse.urlencode({"username": "test@example.com", "password": "password123"}).encode("utf-8")
req = urllib.request.Request(f"{base_url}/login", data=data)
try:
    with urllib.request.urlopen(req) as response:
        res = json.loads(response.read().decode())
        token = res["access_token"]
        print("Logged in successfully. Token acquired.")
except urllib.error.HTTPError as e:
    print(f"Login failed: {e.read().decode()}")
    sys.exit(1)

# Step 2: Fetch /me
req = urllib.request.Request(f"{base_url}/me")
req.add_header("Authorization", f"Bearer {token}")
try:
    with urllib.request.urlopen(req) as response:
        print("Response from /me:")
        print(json.dumps(json.loads(response.read().decode()), indent=2))
        print("SUCCESS")
except urllib.error.HTTPError as e:
    print(f"Failed to fetch /me: {e.code} {e.read().decode()}")
    sys.exit(1)
