#!/bin/bash

# Test script for Mintay Backend API
# Make sure the server is running on localhost:3000

BASE_URL="http://localhost:3000"

echo "🚀 Testing Mintay Backend API"
echo "================================"

# Test health endpoint
echo "1. Testing health endpoint..."
curl -s "$BASE_URL/health" | jq '.' || echo "Health check failed"
echo -e "\n"

# Test user registration
echo "2. Testing user registration..."
REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123", "password": "testpass123"}')

echo "$REGISTER_RESPONSE" | jq '.' || echo "Registration failed"

# Extract token from registration response
TOKEN=$(echo "$REGISTER_RESPONSE" | jq -r '.token // empty')
echo "Token: $TOKEN"
echo -e "\n"

# Test user login
echo "3. Testing user login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123", "password": "testpass123"}')

echo "$LOGIN_RESPONSE" | jq '.' || echo "Login failed"
echo -e "\n"

# Test saving a collection (requires authentication)
if [ -n "$TOKEN" ]; then
  echo "4. Testing collection save (authenticated)..."
  SAVE_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/collections/test-collection" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "name": "My Test Collection",
      "description": "A test collection for the API",
      "items": [
        {"id": 1, "title": "Item 1", "content": "First item"},
        {"id": 2, "title": "Item 2", "content": "Second item"}
      ]
    }')
  
  echo "$SAVE_RESPONSE" | jq '.' || echo "Collection save failed"
  echo -e "\n"
else
  echo "4. Skipping collection save test (no token)"
  echo -e "\n"
fi

# Test retrieving a collection (no authentication required)
echo "5. Testing collection retrieval..."
GET_RESPONSE=$(curl -s "$BASE_URL/api/collections/test-collection")
echo "$GET_RESPONSE" | jq '.' || echo "Collection retrieval failed"
echo -e "\n"

# Test authentication failure
echo "6. Testing authentication failure..."
AUTH_FAIL_RESPONSE=$(curl -s -X PUT "$BASE_URL/api/collections/test-collection" \
  -H "Authorization: Bearer invalid-token" \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}')

echo "$AUTH_FAIL_RESPONSE" | jq '.' || echo "Auth failure test failed"
echo -e "\n"

# Test duplicate username registration
echo "7. Testing duplicate username registration..."
DUPLICATE_RESPONSE=$(curl -s -X POST "$BASE_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"username": "testuser123", "password": "anotherpass"}')

echo "$DUPLICATE_RESPONSE" | jq '.' || echo "Duplicate username test failed"
echo -e "\n"

echo "✅ API testing complete!"
echo "Check the responses above to verify functionality."
