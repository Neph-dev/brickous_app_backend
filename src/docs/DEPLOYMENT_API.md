# Deployment Scheduler API Documentation

The deployment scheduler system allows you to schedule property deployments to the blockchain and automatically process them at midnight every day.

## API Endpoints

### 1. Schedule a Deployment
**POST** `/api/v1/deployment/schedule`

Schedule a property for deployment at a specific date.

**Headers:**
- `Authorization: Bearer <token>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "propertyId": "6597f1234abcd1234567890a",
  "scheduledDate": "2025-11-13T00:00:00.000Z",
  "deploymentData": {
    "tokenName": "Property Token ABC",
    "tokenSymbol": "PTABC",
    "totalSupply": 1000000,
    "pricePerToken": 100.50,
    "additionalMetadata": {
      "propertyValue": 5000000,
      "expectedROI": 8.5
    }
  }
}
```

**Response:**
```json
{
  "status": 201,
  "message": "Deployment scheduled successfully",
  "data": {
    "_id": "6597f1234abcd1234567890b",
    "propertyId": "6597f1234abcd1234567890a",
    "scheduledDate": "2025-11-13T00:00:00.000Z",
    "deploymentData": {
      "tokenName": "Property Token ABC",
      "tokenSymbol": "PTABC",
      "totalSupply": 1000000,
      "pricePerToken": 100.50,
      "additionalMetadata": {
        "propertyValue": 5000000,
        "expectedROI": 8.5
      }
    },
    "status": "scheduled",
    "scheduledBy": "6597f1234abcd1234567890c",
    "createdAt": "2025-11-12T12:46:43.315Z",
    "updatedAt": "2025-11-12T12:46:43.315Z"
  }
}
```

### 2. Manually Trigger Deployment
**POST** `/api/v1/deployment/trigger/:deploymentId`

Manually trigger a scheduled deployment immediately.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "message": "Deployment triggered successfully"
}
```

### 3. Get Deployment Schedules
**GET** `/api/v1/deployment/`

Get all deployment schedules or filter by property ID.

**Query Parameters:**
- `propertyId` (optional): Filter by property ID

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "message": "Deployment schedules retrieved successfully",
  "data": [
    {
      "_id": "6597f1234abcd1234567890b",
      "propertyId": "6597f1234abcd1234567890a",
      "scheduledDate": "2025-11-13T00:00:00.000Z",
      "deploymentData": {...},
      "status": "scheduled",
      "scheduledBy": "6597f1234abcd1234567890c",
      "createdAt": "2025-11-12T12:46:43.315Z",
      "updatedAt": "2025-11-12T12:46:43.315Z"
    }
  ]
}
```

### 4. Get Specific Deployment Schedule
**GET** `/api/v1/deployment/:deploymentId`

Get details of a specific deployment schedule.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "message": "Deployment schedule retrieved successfully",
  "data": {
    "_id": "6597f1234abcd1234567890b",
    "propertyId": "6597f1234abcd1234567890a",
    "scheduledDate": "2025-11-13T00:00:00.000Z",
    "deploymentData": {...},
    "status": "scheduled",
    "scheduledBy": "6597f1234abcd1234567890c",
    "createdAt": "2025-11-12T12:46:43.315Z",
    "updatedAt": "2025-11-12T12:46:43.315Z"
  }
}
```

### 5. Cancel Deployment
**DELETE** `/api/v1/deployment/:deploymentId`

Cancel a scheduled deployment.

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "message": "Deployment cancelled successfully"
}
```

### 6. Process Scheduled Deployments (Admin)
**POST** `/api/v1/deployment/process`

Manually trigger the processing of scheduled deployments for a specific date.

**Query Parameters:**
- `date` (optional): Target date (defaults to current date)

**Headers:**
- `Authorization: Bearer <token>`

**Response:**
```json
{
  "status": 200,
  "message": "Scheduled deployments processed successfully"
}
```

## Deployment Status Flow

1. `scheduled` - Deployment is scheduled and waiting to be processed
2. `processing` - Deployment is currently being processed on the blockchain
3. `deployed` - Deployment completed successfully
4. `failed` - Deployment failed (can be rescheduled)
5. `cancelled` - Deployment was cancelled

## Property Status Changes

When a property is successfully deployed:
- Property `status` changes from `pending` to `deployed`
- Property `contract` field is populated with the blockchain contract address
- Property `deployment.deployedAt` is set to the deployment timestamp
- Property `deployment.deployedBy` is set to `"Automatic"` for scheduler deployments or user ID for manual deployments
- Property `deployment.transactionHash` is populated with the blockchain transaction hash

## Automatic Scheduler

The deployment scheduler runs automatically every day at midnight UTC and processes all scheduled deployments for that date. The scheduler:

1. Finds all deployments with status `scheduled` for the current date
2. Processes each deployment sequentially to avoid overwhelming the blockchain
3. Updates property status and deployment information
4. Logs all deployment activities for monitoring

## Error Handling

The system includes comprehensive error handling:
- Validates that properties exist and are in the correct state
- Prevents duplicate deployments for the same property
- Handles blockchain simulation errors gracefully
- Provides detailed logging for troubleshooting
- Continues processing other deployments if one fails

## Blockchain Simulation

Currently, the system uses a simulated blockchain service that:
- Generates mock contract addresses and transaction hashes
- Simulates realistic deployment delays (2-5 seconds)
- Provides comprehensive logging of deployment activities
- Can be easily replaced with actual blockchain integration when available