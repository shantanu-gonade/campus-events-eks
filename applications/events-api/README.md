# Campus Events API

RESTful API backend service for the Campus Events Management System.

## 🎯 Overview

A production-ready Node.js/Express API service that handles all business logic for event management, RSVP tracking, and analytics. Built with scalability, observability, and security in mind.

## 🛠️ Technology Stack

- **Runtime**: Node.js 20 LTS
- **Framework**: Express.js 4.21.2
- **Database**: PostgreSQL 16.3 (via AWS RDS)
- **Database Client**: pg 8.13.1
- **WebSocket**: Socket.IO 4.8.1
- **Logging**: Winston 3.17.0
- **Validation**: Joi 17.13.3
- **Metrics**: prom-client 15.1.3 (Prometheus)
- **API Docs**: Swagger/OpenAPI
- **Security**: Helmet, CORS, rate-limiting
- **Testing**: Jest + Supertest (optional)

## 📁 Project Structure

```
events-api/
├── src/
│   ├── config/              # Configuration files
│   │   ├── database.js     # PostgreSQL connection pool
│   │   ├── logger.js       # Winston logger setup
│   │   └── prometheus.js   # Metrics configuration
│   ├── controllers/         # Route handlers
│   │   ├── eventController.js      # Event CRUD operations
│   │   ├── rsvpController.js       # RSVP management
│   │   └── analyticsController.js  # Analytics & statistics
│   ├── middleware/          # Express middleware
│   │   ├── auth.js         # Authentication (future)
│   │   ├── errorHandler.js # Global error handling
│   │   ├── logger.js       # Request logging
│   │   ├── validation.js   # Request validation
│   │   └── metrics.js      # Prometheus metrics
│   ├── models/              # Data models (if using ORM)
│   │   ├── Event.js
│   │   ├── RSVP.js
│   │   └── User.js
│   ├── routes/              # API routes
│   │   ├── events.js       # /api/v1/events
│   │   ├── rsvp.js         # /api/v1/events/:id/rsvp
│   │   └── analytics.js    # /api/v1/analytics
│   ├── services/            # Business logic
│   │   ├── eventService.js
│   │   ├── rsvpService.js
│   │   ├── analyticsService.js
│   │   └── notificationService.js
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js
│   │   ├── validation.js
│   │   └── errors.js       # Custom error classes
│   ├── app.js              # Express app setup
│   └── server.js           # Server entry point
├── tests/                   # Test files
│   ├── integration/
│   └── unit/
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage Docker build
├── package.json            # Dependencies
├── jsconfig.json           # JavaScript configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- PostgreSQL 16.x
- npm 10.x or yarn 1.22.x

### Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

### Environment Configuration

Create `.env` file from `.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusevents
DB_USER=dbadmin
DB_PASSWORD=your_secure_password
DB_SSL=false
DB_MAX_CONNECTIONS=20

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Logging
LOG_LEVEL=info
LOG_DIR=logs

# WebSocket (optional)
WS_PORT=8080

# AWS Configuration (for notifications)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Database Setup

```bash
# Initialize database schema
psql -h localhost -U dbadmin -d campusevents < ../../docs/DATABASE_SCHEMA.sql

# Or using a connection string
psql "postgresql://dbadmin:password@localhost:5432/campusevents" < ../../docs/DATABASE_SCHEMA.sql
```

### Development Server

```bash
# Start development server with hot reload
npm run dev

# Or start production server
npm start

# Server will run on http://localhost:8080
```

## 📡 API Endpoints

### Health & Monitoring

```
GET  /health              # Health check
GET  /ready               # Readiness probe
GET  /metrics             # Prometheus metrics
GET  /api-docs            # Swagger documentation
```

### Events

```
GET    /api/v1/events                  # Get all upcoming events
GET    /api/v1/events/:id              # Get single event
GET    /api/v1/events/search?q=query   # Search events
GET    /api/v1/events/past             # Get past events
POST   /api/v1/events                  # Create event
PUT    /api/v1/events/:id              # Update event
DELETE /api/v1/events/:id              # Delete event
```

### RSVPs

```
POST   /api/v1/events/:id/rsvp         # Create RSVP
GET    /api/v1/events/:id/rsvps        # Get event RSVPs
GET    /api/v1/events/users/rsvps      # Get user RSVPs (by email)
DELETE /api/v1/events/rsvps/:id        # Cancel RSVP
```

### Analytics

```
GET  /api/v1/analytics/statistics      # General statistics
GET  /api/v1/analytics/categories      # Category distribution
GET  /api/v1/analytics/trends          # Event trends (6 months)
GET  /api/v1/analytics/attendance      # Attendance analytics
```

## 📝 API Examples

### Create Event

```bash
curl -X POST http://localhost:8080/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Tech Workshop",
    "description": "Learn about cloud computing",
    "start_time": "2025-12-20T14:00:00Z",
    "end_time": "2025-12-20T16:00:00Z",
    "location": "Engineering Building Room 201",
    "category": "Workshop",
    "max_attendees": 50
  }'
```

### Get All Events

```bash
curl http://localhost:8080/api/v1/events
```

### Create RSVP

```bash
curl -X POST http://localhost:8080/api/v1/events/{event-id}/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'
```

### Get Analytics

```bash
curl http://localhost:8080/api/v1/analytics/statistics
```

## 🔍 Request Validation

Using Joi for request validation:

```javascript
// src/middleware/validation.js
const Joi = require('joi');

const eventSchema = Joi.object({
  title: Joi.string().required().min(3).max(255),
  description: Joi.string().required().min(10),
  start_time: Joi.date().iso().required(),
  end_time: Joi.date().iso().min(Joi.ref('start_time')).required(),
  location: Joi.string().required().min(3).max(255),
  category: Joi.string().required().valid(
    'Workshop', 'Seminar', 'Social', 'Sports', 
    'Cultural', 'Career', 'Hackathon', 'Conference'
  ),
  max_attendees: Joi.number().integer().min(1).required(),
});
```

## 🔌 Database Operations

### Query Example

```javascript
// src/services/eventService.js
const pool = require('../config/database');

class EventService {
  async getAllEvents() {
    const query = `
      SELECT * FROM events 
      WHERE start_time >= NOW() 
      ORDER BY start_time ASC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
  
  async createEvent(eventData) {
    const query = `
      INSERT INTO events (
        title, description, start_time, end_time, 
        location, category, max_attendees
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const values = [
      eventData.title,
      eventData.description,
      eventData.start_time,
      eventData.end_time,
      eventData.location,
      eventData.category,
      eventData.max_attendees,
    ];
    const result = await pool.query(query, values);
    return result.rows[0];
  }
}
```

## 📊 Logging

Winston logger with multiple transports:

```javascript
// src/config/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ],
});
```

## 📈 Prometheus Metrics

Custom metrics exposed at `/metrics`:

```javascript
// src/config/prometheus.js
const promClient = require('prom-client');

// Default metrics (CPU, memory, etc.)
promClient.collectDefaultMetrics();

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
});

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
});

const activeConnections = new promClient.Gauge({
  name: 'websocket_connections_active',
  help: 'Number of active WebSocket connections',
});
```

## 🌐 WebSocket Support

Real-time updates using Socket.IO:

```javascript
// src/app.js
const socketIO = require('socket.io');

function setupWebSocket(server) {
  const io = socketIO(server, {
    cors: {
      origin: process.env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
    },
  });
  
  io.on('connection', (socket) => {
    logger.info('Client connected:', socket.id);
    
    socket.on('disconnect', () => {
      logger.info('Client disconnected:', socket.id);
    });
  });
  
  // Broadcast events
  io.emit('event:created', eventData);
  io.emit('event:updated', eventData);
  io.emit('rsvp:created', rsvpData);
  
  return io;
}
```

## 🔒 Security

### Implemented Security Measures

1. **Helmet**: Security headers
```javascript
const helmet = require('helmet');
app.use(helmet());
```

2. **CORS**: Cross-origin resource sharing
```javascript
const cors = require('cors');
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true,
}));
```

3. **Rate Limiting**: Prevent abuse
```javascript
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
});
app.use('/api/', limiter);
```

4. **Input Validation**: Joi schemas
5. **SQL Injection Prevention**: Parameterized queries
6. **Error Handling**: No sensitive info in responses

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run integration tests only
npm run test:integration

# Run unit tests only
npm run test:unit
```

### Test Example

```javascript
// tests/integration/events.test.js
const request = require('supertest');
const app = require('../../src/app');

describe('Events API', () => {
  it('should get all events', async () => {
    const response = await request(app)
      .get('/api/v1/events')
      .expect(200);
      
    expect(Array.isArray(response.body)).toBe(true);
  });
  
  it('should create an event', async () => {
    const eventData = {
      title: 'Test Event',
      description: 'Test description',
      start_time: '2025-12-20T14:00:00Z',
      end_time: '2025-12-20T16:00:00Z',
      location: 'Test Location',
      category: 'Workshop',
      max_attendees: 50,
    };
    
    const response = await request(app)
      .post('/api/v1/events')
      .send(eventData)
      .expect(201);
      
    expect(response.body).toHaveProperty('id');
    expect(response.body.title).toBe(eventData.title);
  });
});
```

## 🐳 Docker

### Build Docker Image

```bash
# Build image
docker build -t campus-events-api:latest .

# Run container
docker run -p 8080:8080 \
  -e DB_HOST=your-db-host \
  -e DB_PASSWORD=your-password \
  campus-events-api:latest
```

### Multi-stage Dockerfile

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Stage 3: Production
FROM node:20-alpine
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
WORKDIR /app
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/src ./src
COPY --from=builder --chown=nodejs:nodejs /app/package*.json ./
USER nodejs
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD node -e "require('http').get('http://localhost:8080/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"
CMD ["node", "src/server.js"]
```

## 📊 Performance

- **Response Time**: < 100ms (p95)
- **Throughput**: 1000+ requests/second
- **Connection Pool**: 20 PostgreSQL connections
- **Memory Usage**: ~150-200 MB per pod
- **CPU Usage**: 100-200m under normal load

## 🚢 Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: events-api
  namespace: campus-events
spec:
  replicas: 2
  selector:
    matchLabels:
      app: events-api
  template:
    metadata:
      labels:
        app: events-api
    spec:
      containers:
      - name: events-api
        image: <ecr-repo>/events-api:latest
        ports:
        - containerPort: 8080
        env:
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_HOST
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: DB_PASSWORD
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Test connection
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "SELECT 1;"

# Check logs
npm run dev

# Check environment variables
node -e "console.log(require('./src/config/database'))"
```

### High Memory Usage

```bash
# Check connection pool size
# Reduce DB_MAX_CONNECTIONS in .env

# Monitor memory
node --inspect src/server.js
# Open chrome://inspect
```

### Performance Issues

```bash
# Enable query logging
# Add to .env:
DB_LOG_QUERIES=true

# Check slow queries
# Review logs/combined.log
```

## 📚 Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Winston Logger](https://github.com/winstonjs/winston)
- [Prometheus Client](https://github.com/siimon/prom-client)

## 🤝 Contributing

1. Follow Node.js best practices
2. Write comprehensive tests
3. Update API documentation
4. Use async/await (no callbacks)
5. Follow existing code style

## 📄 License

Part of the Campus Events EKS Project for ENPM818R.

---

**Built with** ❤️ **using Node.js and Express**
