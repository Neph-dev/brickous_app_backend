#!/usr/bin/env bash

# Deployment Scheduler Test Script
# This script demonstrates how to use the deployment scheduler API

BASE_URL="http://localhost:3001/api/v1"
AUTH_TOKEN="your-jwt-token-here"

echo "🚀 Testing Deployment Scheduler API"
echo "====================================="

# 1. Schedule a deployment
echo "1. Scheduling a deployment..."
curl -X POST "${BASE_URL}/deployment/schedule" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "propertyId": "6597f1234abcd1234567890a",
    "scheduledDate": "2025-11-13T00:00:00.000Z",
    "deploymentData": {
      "tokenName": "Test Property Token",
      "tokenSymbol": "TPT",
      "totalSupply": 1000000,
      "pricePerToken": 100.50,
      "additionalMetadata": {
        "propertyValue": 5000000,
        "expectedROI": 8.5
      }
    }
  }' | jq '.'

echo -e "\n"

# 2. Get all deployment schedules
echo "2. Getting all deployment schedules..."
curl -X GET "${BASE_URL}/deployment/" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'

echo -e "\n"

# 3. Get deployment schedules for a specific property
echo "3. Getting deployment schedules for specific property..."
curl -X GET "${BASE_URL}/deployment/?propertyId=6597f1234abcd1234567890a" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'

echo -e "\n"

# 4. Manually trigger deployment processing (requires deployment ID)
# Replace DEPLOYMENT_ID with actual deployment ID from step 1
echo "4. Manually triggering deployment processing..."
# curl -X POST "${BASE_URL}/deployment/trigger/DEPLOYMENT_ID" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'

echo -e "\n"

# 5. Process all scheduled deployments for today
echo "5. Processing scheduled deployments for today..."
curl -X POST "${BASE_URL}/deployment/process" \
  -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'

echo -e "\n"

# 6. Cancel a deployment (requires deployment ID)
# Replace DEPLOYMENT_ID with actual deployment ID from step 1
echo "6. Cancelling a deployment..."
# curl -X DELETE "${BASE_URL}/deployment/DEPLOYMENT_ID" \
#   -H "Authorization: Bearer ${AUTH_TOKEN}" | jq '.'

echo "✅ Test script completed!"
echo ""
echo "Note: Replace 'your-jwt-token-here' with a valid JWT token"
echo "Note: Replace property IDs and deployment IDs with actual values"