# Test Drive System - AWS Migration Guide

## Overview
This guide provides a step-by-step migration path from the current in-memory implementation to a production-ready AWS deployment.

---

## Architecture Diagram

```
┌─────────────┐
│   Buyer UI  │
│  (Next.js)  │
└──────┬──────┘
       │
       ↓ HTTPS
┌──────────────────────────────────────────┐
│   API Gateway (REST API)                  │
│   /test-drives/*                          │
│   - Authorization: JWT/Cognito           │
│   - Rate limiting: 100 req/min           │
│   - CORS: Configured domains             │
└──────┬───────────────────────────────────┘
       │
       ↓ Lambda Proxy
┌──────────────────────────────────────────┐
│   Lambda Functions (Node.js 20.x)        │
│   - createTestDriveRequest               │
│   - getTestDriveRequests                 │
│   - approveTestDriveRequest              │
│   - proposeReschedule                    │
│   - declineRequest                       │
│   - cancelRequest                        │
│   - markCompleted                        │
│   - markNoShow                           │
└──────┬───────────────────────────────────┘
       │
       ↓ AWS SDK
┌──────────────────────────────────────────┐
│   DynamoDB                               │
│   Table: TestDriveRequests               │
│   - PK: id                               │
│   - SK: createdAt                        │
│   - GSI1: buyerId-createdAt              │
│   - GSI2: dealerId-createdAt             │
│   - GSI3: listingId-status               │
└──────────────────────────────────────────┘

┌──────────────────────────────────────────┐
│   EventBridge Rules                       │
│   - Rule: 24h-reminder                   │
│   - Rule: 2h-reminder                    │
│   - Schedule: cron(0 * * * ? *)          │
└──────┬───────────────────────────────────┘
       │
       ↓ Trigger
┌──────────────────────────────────────────┐
│   Lambda: SendReminders                  │
│   - Query confirmed appointments         │
│   - Check time until appointment         │
│   - Send notification if in window       │
└──────┬───────────────────────────────────┘
       │
       ↓ Publish
┌──────────────────────────────────────────┐
│   SNS Topic: TestDriveNotifications      │
│   - Email subscription (SES)             │
│   - WebSocket subscription (optional)    │
└──────────────────────────────────────────┘
```

---

## Phase 1: Database Migration (Week 1)

### Step 1.1: Create DynamoDB Table

```typescript
// Infrastructure as Code (CDK/Terraform)
const testDriveTable = new dynamodb.Table(this, 'TestDriveRequests', {
  tableName: 'TestDriveRequests',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  pointInTimeRecovery: true,
  
  // Global Secondary Indexes
  globalSecondaryIndexes: [
    {
      indexName: 'BuyerIndex',
      partitionKey: { name: 'buyerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    },
    {
      indexName: 'DealerIndex',
      partitionKey: { name: 'dealerId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'createdAt', type: dynamodb.AttributeType.STRING },
    },
    {
      indexName: 'ListingIndex',
      partitionKey: { name: 'listingId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'status', type: dynamodb.AttributeType.STRING },
    },
  ],
});
```

### Step 1.2: Create DynamoDB Service Layer

```typescript
// src/lib/api/test-drives-dynamodb.ts
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand, GetCommand, QueryCommand, UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { TestDriveRequest, TestDriveStatus } from '@/types';

const client = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.TEST_DRIVE_TABLE_NAME || 'TestDriveRequests';

export const testDriveServiceDynamo = {
  async createRequest(request: Omit<TestDriveRequest, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'version'>): Promise<TestDriveRequest> {
    const newRequest: TestDriveRequest = {
      ...request,
      id: `td-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    };

    await docClient.send(new PutCommand({
      TableName: TABLE_NAME,
      Item: newRequest,
    }));

    return newRequest;
  },

  async getByBuyerId(buyerId: string): Promise<TestDriveRequest[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'BuyerIndex',
      KeyConditionExpression: 'buyerId = :buyerId',
      ExpressionAttributeValues: {
        ':buyerId': buyerId,
      },
      ScanIndexForward: false, // Newest first
    }));

    return result.Items as TestDriveRequest[];
  },

  async getByDealerId(dealerId: string): Promise<TestDriveRequest[]> {
    const result = await docClient.send(new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: 'DealerIndex',
      KeyConditionExpression: 'dealerId = :dealerId',
      ExpressionAttributeValues: {
        ':dealerId': dealerId,
      },
      ScanIndexForward: false,
    }));

    return result.Items as TestDriveRequest[];
  },

  async getById(id: string): Promise<TestDriveRequest | null> {
    const result = await docClient.send(new GetCommand({
      TableName: TABLE_NAME,
      Key: { id },
    }));

    return result.Item as TestDriveRequest || null;
  },

  async approveRequest(
    requestId: string,
    dealerId: string,
    confirmedAt: string,
    assignedSalesperson?: TestDriveRequest['assignedSalesperson'],
    dealerResponse?: string
  ): Promise<{ success: boolean; request?: TestDriveRequest; error?: string }> {
    const request = await this.getById(requestId);
    
    if (!request) {
      return { success: false, error: 'Request not found' };
    }

    if (request.dealerId !== dealerId) {
      return { success: false, error: 'Unauthorized' };
    }

    if (!isValidTransition(request.status, 'confirmed')) {
      return { success: false, error: `Cannot approve from ${request.status} state` };
    }

    // Optimistic locking with version check
    await docClient.send(new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { id: requestId },
      UpdateExpression: 'SET #status = :status, confirmedAt = :confirmedAt, assignedSalesperson = :salesperson, dealerResponse = :response, updatedAt = :updatedAt, #version = #version + :inc',
      ConditionExpression: '#version = :currentVersion',
      ExpressionAttributeNames: {
        '#status': 'status',
        '#version': 'version',
      },
      ExpressionAttributeValues: {
        ':status': 'confirmed',
        ':confirmedAt': confirmedAt,
        ':salesperson': assignedSalesperson || null,
        ':response': dealerResponse || null,
        ':updatedAt': new Date().toISOString(),
        ':currentVersion': request.version,
        ':inc': 1,
      },
    }));

    const updatedRequest = await this.getById(requestId);
    return { success: true, request: updatedRequest || undefined };
  },

  // ... other methods follow same pattern
};
```

### Step 1.3: Environment Variables

```bash
# .env.production
AWS_REGION=us-east-1
TEST_DRIVE_TABLE_NAME=TestDriveRequests
AWS_ACCESS_KEY_ID=<from-secrets-manager>
AWS_SECRET_ACCESS_KEY=<from-secrets-manager>
```

---

## Phase 2: Lambda API (Week 2)

### Step 2.1: Create Lambda Function

```typescript
// lambda/test-drives/create.ts
import { APIGatewayProxyHandler } from 'aws-lambda';
import { testDriveServiceDynamo } from './services/test-drives-dynamodb';
import { verifyJWT } from './utils/auth';

export const handler: APIGatewayProxyHandler = async (event) => {
  try {
    // Verify authentication
    const user = await verifyJWT(event.headers.Authorization);
    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      };
    }

    // Parse request body
    const body = JSON.parse(event.body || '{}');

    // Validate required fields
    if (!body.vehicleId || !body.dealerId || !body.requestedWindowStart) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' }),
      };
    }

    // Create request
    const request = await testDriveServiceDynamo.createRequest({
      vehicleId: body.vehicleId,
      listingId: body.listingId,
      buyerId: user.id,
      buyerName: user.name,
      buyerEmail: user.email,
      buyerPhone: body.buyerPhone,
      dealerId: body.dealerId,
      dealerName: body.dealerName,
      requestedWindowStart: body.requestedWindowStart,
      requestedWindowEnd: body.requestedWindowEnd,
      requestedDate: body.requestedDate,
      requestedTime: body.requestedTime,
      buyerMessage: body.buyerMessage,
      conversationId: body.conversationId,
    });

    return {
      statusCode: 201,
      body: JSON.stringify({ success: true, request }),
    };
  } catch (error) {
    console.error('Error creating test drive request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};
```

### Step 2.2: API Gateway Configuration

```yaml
# serverless.yml or AWS SAM template
functions:
  createTestDrive:
    handler: lambda/test-drives/create.handler
    events:
      - http:
          path: /test-drives
          method: POST
          cors: true
          authorizer:
            name: JWTAuthorizer
            type: JWT
            identitySource: $request.header.Authorization

  getTestDrives:
    handler: lambda/test-drives/list.handler
    events:
      - http:
          path: /test-drives
          method: GET
          cors: true
          authorizer: JWTAuthorizer

  approveTestDrive:
    handler: lambda/test-drives/approve.handler
    events:
      - http:
          path: /test-drives/{id}/approve
          method: PATCH
          cors: true
          authorizer: JWTAuthorizer
```

---

## Phase 3: Notification System (Week 3)

### Step 3.1: SNS Topic & SES Configuration

```typescript
// Infrastructure
const notificationTopic = new sns.Topic(this, 'TestDriveNotifications', {
  displayName: 'Test Drive Notifications',
});

// Email subscription
notificationTopic.addSubscription(new subscriptions.EmailSubscription('notifications@example.com'));

// SES email templates
const emailTemplate = new ses.CfnTemplate(this, 'TestDriveConfirmation', {
  template: {
    templateName: 'TestDriveConfirmation',
    subjectPart: 'Your test drive is confirmed',
    htmlPart: `
      <h1>Test Drive Confirmed</h1>
      <p>Hi {{buyerName}},</p>
      <p>Your test drive for the {{vehicleName}} has been confirmed for:</p>
      <ul>
        <li>Date: {{confirmedDate}}</li>
        <li>Time: {{confirmedTime}}</li>
        <li>Location: {{dealerLocation}}</li>
      </ul>
      <p>{{dealerResponse}}</p>
    `,
  },
});
```

### Step 3.2: Reminder Lambda

```typescript
// lambda/reminders/send.ts
import { EventBridgeHandler } from 'aws-lambda';
import { testDriveServiceDynamo } from '../services/test-drives-dynamodb';
import { SESClient, SendTemplatedEmailCommand } from '@aws-sdk/client-ses';

const sesClient = new SESClient({ region: process.env.AWS_REGION });

export const handler: EventBridgeHandler<'Scheduled Event', any, void> = async (event) => {
  console.log('Running reminder check:', event);

  // Get all confirmed appointments
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const in2Hours = new Date(now.getTime() + 2 * 60 * 60 * 1000);

  // Query for confirmed appointments
  // (Implementation depends on GSI structure)
  const confirmedRequests = []; // TODO: Query DynamoDB

  for (const request of confirmedRequests) {
    const confirmedTime = new Date(request.confirmedAt);

    // Send 24h reminder
    if (confirmedTime >= in24Hours && confirmedTime < new Date(in24Hours.getTime() + 60 * 60 * 1000)) {
      await sendReminder(request, '24 hours');
    }

    // Send 2h reminder
    if (confirmedTime >= in2Hours && confirmedTime < new Date(in2Hours.getTime() + 60 * 60 * 1000)) {
      await sendReminder(request, '2 hours');
    }
  }
};

async function sendReminder(request: any, timeframe: string) {
  await sesClient.send(new SendTemplatedEmailCommand({
    Source: 'noreply@example.com',
    Destination: {
      ToAddresses: [request.buyerEmail],
    },
    Template: 'TestDriveReminder',
    TemplateData: JSON.stringify({
      buyerName: request.buyerName,
      vehicleName: `${request.vehicleYear} ${request.vehicleMake} ${request.vehicleModel}`,
      confirmedDate: new Date(request.confirmedAt).toLocaleDateString(),
      confirmedTime: new Date(request.confirmedAt).toLocaleTimeString(),
      timeframe,
    }),
  }));
}
```

### Step 3.3: EventBridge Rules

```typescript
// Infrastructure
new events.Rule(this, 'SendReminders', {
  schedule: events.Schedule.cron({ minute: '0', hour: '*' }), // Every hour
  targets: [new targets.LambdaFunction(reminderFunction)],
});
```

---

## Phase 4: Real-Time Updates (Week 4)

### Step 4.1: WebSocket API

```typescript
// lambda/websocket/connect.ts
export const handler: APIGatewayProxyWebSocketEventHandler = async (event) => {
  // Store connectionId in DynamoDB
  const connectionId = event.requestContext.connectionId;
  const userId = event.queryStringParameters?.userId;
  
  await docClient.send(new PutCommand({
    TableName: 'WebSocketConnections',
    Item: {
      connectionId,
      userId,
      connectedAt: new Date().toISOString(),
    },
  }));

  return { statusCode: 200, body: 'Connected' };
};

// lambda/websocket/disconnect.ts
export const handler: APIGatewayProxyWebSocketEventHandler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  
  await docClient.send(new DeleteCommand({
    TableName: 'WebSocketConnections',
    Key: { connectionId },
  }));

  return { statusCode: 200, body: 'Disconnected' };
};

// Broadcast status change
async function broadcastStatusChange(request: TestDriveRequest) {
  const connections = await getUserConnections(request.buyerId);
  
  const apiGateway = new ApiGatewayManagementApiClient({
    endpoint: process.env.WEBSOCKET_ENDPOINT,
  });

  for (const connection of connections) {
    await apiGateway.send(new PostToConnectionCommand({
      ConnectionId: connection.connectionId,
      Data: JSON.stringify({
        type: 'TEST_DRIVE_UPDATE',
        data: request,
      }),
    }));
  }
}
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Create DynamoDB table in staging
- [ ] Deploy Lambda functions to staging
- [ ] Configure API Gateway routes
- [ ] Set up SNS topic and SES templates
- [ ] Create EventBridge rules
- [ ] Configure IAM roles and policies
- [ ] Set environment variables in Lambda

### Testing
- [ ] Run integration tests in staging
- [ ] Test all API endpoints with Postman
- [ ] Verify email notifications work
- [ ] Test reminder system (use past dates)
- [ ] Load test API with 1000 req/min
- [ ] Verify DynamoDB indexes perform well
- [ ] Test WebSocket connections (if implemented)

### Production Deployment
- [ ] Create production DynamoDB table
- [ ] Deploy Lambda functions to production
- [ ] Configure production API Gateway
- [ ] Update frontend API endpoints
- [ ] Monitor CloudWatch logs
- [ ] Set up CloudWatch alarms
- [ ] Enable X-Ray tracing
- [ ] Configure auto-scaling (if needed)

### Post-Deployment
- [ ] Verify first test drive request works
- [ ] Monitor error rates in CloudWatch
- [ ] Check email delivery rates in SES
- [ ] Verify reminder Lambda runs hourly
- [ ] Test rollback procedure
- [ ] Update documentation
- [ ] Train support team

---

## Monitoring & Alerts

### CloudWatch Alarms

```typescript
// Error rate alarm
new cloudwatch.Alarm(this, 'TestDriveErrorRate', {
  metric: lambdaFunction.metricErrors(),
  threshold: 5,
  evaluationPeriods: 2,
  alarmDescription: 'Test drive function error rate too high',
});

// Latency alarm
new cloudwatch.Alarm(this, 'TestDriveLatency', {
  metric: lambdaFunction.metricDuration(),
  threshold: 3000, // 3 seconds
  evaluationPeriods: 2,
  alarmDescription: 'Test drive function latency too high',
});

// DynamoDB throttle alarm
new cloudwatch.Alarm(this, 'DynamoDBThrottle', {
  metric: table.metricSystemErrorsForOperations({
    operations: [dynamodb.Operation.PUT_ITEM, dynamodb.Operation.QUERY],
  }),
  threshold: 10,
  evaluationPeriods: 1,
});
```

---

## Cost Estimation

### Monthly AWS Costs (Estimated)

**DynamoDB:**
- On-demand pricing
- 10,000 requests/month: ~$1.25
- Storage (10GB): ~$2.50
- **Total: ~$4/month**

**Lambda:**
- 100,000 invocations/month
- 512MB memory, 500ms avg duration
- **Total: ~$1/month** (within free tier)

**API Gateway:**
- 100,000 API calls/month
- **Total: ~$0.35/month** (within free tier)

**SNS/SES:**
- 10,000 emails/month
- **Total: ~$1/month**

**CloudWatch:**
- Logs and metrics
- **Total: ~$5/month**

**Grand Total: ~$12-15/month**

(This will scale with usage but remains cost-effective)

---

## Security Checklist

- [ ] Enable DynamoDB encryption at rest
- [ ] Enable DynamoDB point-in-time recovery
- [ ] Use IAM roles with least privilege
- [ ] Enable API Gateway throttling
- [ ] Configure CORS properly
- [ ] Use JWT/Cognito for authentication
- [ ] Validate all inputs in Lambda
- [ ] Sanitize user-generated content
- [ ] Enable CloudTrail logging
- [ ] Configure VPC for Lambda (optional)
- [ ] Use Secrets Manager for credentials
- [ ] Enable X-Ray for tracing
- [ ] Set up WAF rules (optional)

---

## Rollback Plan

### If Issues Arise:

1. **Immediate:** Revert frontend API endpoints to old service
2. **Quick:** Disable new Lambda functions via API Gateway
3. **Data:** Export DynamoDB data, import back to in-memory if needed
4. **Monitor:** Watch CloudWatch for errors during rollback

### Migration Strategy:

**Parallel Run (Recommended):**
1. Deploy AWS infrastructure
2. Write to both old and new systems
3. Read from old system initially
4. Verify data consistency
5. Switch reads to new system
6. Monitor for 1 week
7. Deprecate old system

---

## Success Criteria

- [ ] 99.9% API availability
- [ ] < 500ms avg API latency
- [ ] 100% email delivery rate
- [ ] Zero data loss during migration
- [ ] All state transitions working correctly
- [ ] Reminders sent on schedule
- [ ] Zero duplicate requests created
- [ ] Zero double-bookings occurred
- [ ] CloudWatch alarms configured
- [ ] Documentation updated

---

## Timeline Summary

- **Week 1:** Database migration + testing
- **Week 2:** Lambda API + integration
- **Week 3:** Notifications + reminders
- **Week 4:** Real-time updates + polish
- **Week 5:** Production deployment + monitoring

**Total:** 5 weeks for complete AWS migration
