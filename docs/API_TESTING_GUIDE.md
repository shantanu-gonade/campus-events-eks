# Testing Quick Reference

## Base URLs

```bash
# Get ALB URL
ALB_URL=$(kubectl get ingress campus-events-ingress -n campus-events -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# API Base
API_BASE="http://$ALB_URL/api/v1"
```

---

## Event Endpoints

### 1. Get All Upcoming Events
```bash
curl "$API_BASE/events"
```

### 2. Search Events
```bash
curl "$API_BASE/events/search?q=workshop"
curl "$API_BASE/events/search?q=tech&category=Workshop"
```

### 3. Get Past Events
```bash
curl "$API_BASE/events/past"
```

### 4. Get Single Event
```bash
EVENT_ID="your-event-id"
curl "$API_BASE/events/$EVENT_ID"
```

### 5. Create Event
```bash
curl -X POST "$API_BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Workshop",
    "description": "A test workshop event",
    "start_time": "2025-12-15T14:00:00Z",
    "end_time": "2025-12-15T16:00:00Z",
    "location": "Engineering Building Room 201",
    "max_attendees": 50,
    "category": "Workshop"
  }'
```

### 6. Update Event
```bash
EVENT_ID="your-event-id"
curl -X PUT "$API_BASE/events/$EVENT_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Workshop Title",
    "max_attendees": 75
  }'
```

### 7. Delete Event
```bash
EVENT_ID="your-event-id"
curl -X DELETE "$API_BASE/events/$EVENT_ID"
```

---

## RSVP Endpoints

### 1. Create RSVP
```bash
EVENT_ID="your-event-id"
curl -X POST "$API_BASE/events/$EVENT_ID/rsvp" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john.doe@example.com"
  }'
```

### 2. Get Event RSVPs
```bash
EVENT_ID="your-event-id"
curl "$API_BASE/events/$EVENT_ID/rsvps"
```

### 3. Get User RSVPs
```bash
curl "$API_BASE/events/users/rsvps?email=john.doe@example.com"
```

### 4. Cancel RSVP
```bash
RSVP_ID="your-rsvp-id"
curl -X DELETE "$API_BASE/events/rsvps/$RSVP_ID"
```

---

## Analytics Endpoints

### 1. Get Statistics
```bash
curl "$API_BASE/analytics/statistics"
```

**Expected Response:**
```json
{
  "total_events": 25,
  "upcoming_events": 15,
  "past_events": 10,
  "total_rsvps": 342,
  "average_attendance_rate": "68.5",
  "active_events": 2
}
```

### 2. Get Category Distribution
```bash
curl "$API_BASE/analytics/categories"
```

**Expected Response:**
```json
[
  {
    "category": "Workshop",
    "count": "10",
    "percentage": "40.0"
  },
  {
    "category": "Seminar",
    "count": "8",
    "percentage": "32.0"
  }
]
```

### 3. Get Events Trend
```bash
# Last 6 months (default)
curl "$API_BASE/analytics/trends"

# Custom months
curl "$API_BASE/analytics/trends?months=12"
```

**Expected Response:**
```json
[
  {
    "month": "Dec 2025",
    "month_key": "2025-12",
    "event_count": 8,
    "rsvp_count": 67
  },
  {
    "month": "Nov 2025",
    "month_key": "2025-11",
    "event_count": 12,
    "rsvp_count": 103
  }
]
```

### 4. Get Attendance Analytics
```bash
curl "$API_BASE/analytics/attendance"
```

**Expected Response:**
```json
{
  "overall": {
    "average_rate": "65.3",
    "min_rate": "20.0",
    "max_rate": "100.0",
    "total_events": "25",
    "near_capacity_events": "3"
  },
  "top_events": [
    {
      "id": "uuid",
      "title": "Annual Tech Conference",
      "current_attendees": 150,
      "max_attendees": 150,
      "attendance_rate": "100.0"
    }
  ]
}
```

---

## Health & Monitoring

### 1. Health Check
```bash
curl "$API_BASE/../health"
```

### 2. Readiness Check
```bash
curl "$API_BASE/../ready"
```

### 3. Prometheus Metrics
```bash
curl "$API_BASE/../metrics"
```

### 4. API Documentation
```bash
# Open in browser
echo "http://$ALB_URL/api-docs"
```

---

## WebSocket Testing

### JavaScript Client (Browser Console)

```javascript
// Connect to WebSocket
const socket = io('http://<ALB_URL>');

// Listen for events
socket.on('connect', () => {
  console.log('Connected to WebSocket');
});

socket.on('event:created', (data) => {
  console.log('New event created:', data);
});

socket.on('event:updated', (data) => {
  console.log('Event updated:', data);
});

socket.on('event:deleted', (data) => {
  console.log('Event deleted:', data);
});

socket.on('rsvp:created', (data) => {
  console.log('New RSVP:', data);
});

socket.on('rsvp:cancelled', (data) => {
  console.log('RSVP cancelled:', data);
});

socket.on('capacity:warning', (data) => {
  console.log('Capacity warning:', data);
});

socket.on('disconnect', () => {
  console.log('Disconnected from WebSocket');
});
```

### Node.js Client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://<ALB_URL>');

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('event:created', (data) => {
  console.log('Event Created:', data.title);
});

// Add other listeners...
```

---

## Complete Testing Script

```bash
#!/bin/bash

# Get ALB URL
ALB_URL=$(kubectl get ingress campus-events-ingress -n campus-events -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
API_BASE="http://$ALB_URL/api/v1"

echo "Testing Campus Events API v2.0"
echo "ALB URL: $ALB_URL"
echo ""

# Test 1: Health Check
echo "1. Testing Health Check..."
curl -s "$ALB_URL/health" | jq .
echo ""

# Test 2: Get Events
echo "2. Getting All Events..."
curl -s "$API_BASE/events" | jq 'length'
echo ""

# Test 3: Create Event
echo "3. Creating Test Event..."
EVENT_RESPONSE=$(curl -s -X POST "$API_BASE/events" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "API Test Event",
    "description": "Testing the new API endpoints",
    "start_time": "2025-12-20T14:00:00Z",
    "end_time": "2025-12-20T16:00:00Z",
    "location": "Test Location",
    "max_attendees": 30,
    "category": "Workshop"
  }')
  
EVENT_ID=$(echo $EVENT_RESPONSE | jq -r '.id')
echo "Created Event ID: $EVENT_ID"
echo ""

# Test 4: Get Single Event
echo "4. Getting Single Event..."
curl -s "$API_BASE/events/$EVENT_ID" | jq '.title'
echo ""

# Test 5: Update Event
echo "5. Updating Event..."
curl -s -X PUT "$API_BASE/events/$EVENT_ID" \
  -H "Content-Type: application/json" \
  -d '{"title": "Updated API Test Event"}' | jq '.title'
echo ""

# Test 6: Create RSVP
echo "6. Creating RSVP..."
RSVP_RESPONSE=$(curl -s -X POST "$API_BASE/events/$EVENT_ID/rsvp" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }')
  
RSVP_ID=$(echo $RSVP_RESPONSE | jq -r '.id')
echo "Created RSVP ID: $RSVP_ID"
echo ""

# Test 7: Get Event RSVPs
echo "7. Getting Event RSVPs..."
curl -s "$API_BASE/events/$EVENT_ID/rsvps" | jq 'length'
echo ""

# Test 8: Get User RSVPs
echo "8. Getting User RSVPs..."
curl -s "$API_BASE/events/users/rsvps?email=test@example.com" | jq 'length'
echo ""

# Test 9: Search Events
echo "9. Searching Events..."
curl -s "$API_BASE/events/search?q=test" | jq 'length'
echo ""

# Test 10: Get Statistics
echo "10. Getting Statistics..."
curl -s "$API_BASE/analytics/statistics" | jq '.'
echo ""

# Test 11: Get Categories
echo "11. Getting Category Distribution..."
curl -s "$API_BASE/analytics/categories" | jq '.'
echo ""

# Test 12: Get Trends
echo "12. Getting Events Trend..."
curl -s "$API_BASE/analytics/trends" | jq 'length'
echo ""

# Test 13: Get Attendance
echo "13. Getting Attendance Analytics..."
curl -s "$API_BASE/analytics/attendance" | jq '.overall'
echo ""

# Test 14: Cancel RSVP
echo "14. Cancelling RSVP..."
curl -s -X DELETE "$API_BASE/events/rsvps/$RSVP_ID" | jq '.message'
echo ""

# Test 15: Delete Event
echo "15. Deleting Event..."
curl -s -X DELETE "$API_BASE/events/$EVENT_ID" | jq '.message'
echo ""

echo "✅ All API tests complete!"
echo ""
echo "Visit API Documentation: http://$ALB_URL/api-docs"
```

**Save and run:**
```bash
chmod +x test-api.sh
./test-api.sh
```

---

## Expected Status Codes

| Endpoint | Method | Success Code | Error Codes |
|----------|--------|--------------|-------------|
| GET /events | GET | 200 | 500 |
| GET /events/:id | GET | 200 | 404, 500 |
| POST /events | POST | 201 | 400, 500 |
| PUT /events/:id | PUT | 200 | 400, 404, 500 |
| DELETE /events/:id | DELETE | 200 | 404, 500 |
| POST /events/:id/rsvp | POST | 201 | 400, 404, 500 |
| GET /events/:id/rsvps | GET | 200 | 404, 500 |
| DELETE /events/rsvps/:id | DELETE | 200 | 404, 500 |
| GET /analytics/* | GET | 200 | 500 |

---

## Common Issues & Solutions

### Issue: Cannot connect to API
```bash
# Check pods are running
kubectl get pods -n campus-events

# Check ingress
kubectl get ingress -n campus-events

# Check service
kubectl get svc -n campus-events
```

### Issue: 404 Not Found
- Verify endpoint URL is correct
- Check route is registered in app.js
- Verify both /v1 and /api/v1 prefixes work

### Issue: Validation Error
- Check request body format
- Verify all required fields present
- Check data types match schema

### Issue: Database Error
```bash
# Check database connectivity
kubectl exec -n campus-events deployment/dev-events-api -- node -e "
const pool = require('./src/config/database.js').default;
pool.query('SELECT 1').then(() => console.log('DB OK')).catch(console.error);
"
```

### Issue: WebSocket not connecting
- Verify CORS_ORIGIN environment variable
- Check ALB security group allows WebSocket traffic
- Verify Socket.IO client version matches server

---

## Performance Testing

### Using Apache Bench
```bash
# Test GET endpoint
ab -n 1000 -c 10 "$API_BASE/events"

# Test POST endpoint
ab -n 100 -c 5 -p event.json -T application/json "$API_BASE/events"
```

### Using k6
```javascript
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '30s',
};

export default function() {
  let res = http.get('http://<ALB_URL>/api/v1/events');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 200ms': (r) => r.timings.duration < 200,
  });
}
```

---

**Last Updated:** December 2025  
**For:** Week 5 Day 3-4 Backend Implementation
