#!/bin/bash
echo "Registering..."
curl -s -X POST "http://localhost:8010/v1/auth/register?email=test@example.com&password=password123&full_name=TestUser&role_id=1" -H "accept: application/json"

echo -e "\nLogging in..."
TOKEN=$(curl -s -X POST "http://localhost:8010/v1/auth/login" -H "Content-Type: application/x-www-form-urlencoded" -d "username=test@example.com&password=password123" | jq -r .access_token)

echo -e "\nFetching /me with token: $TOKEN..."
curl -v -H "Authorization: Bearer $TOKEN" "http://localhost:8010/v1/auth/me"
