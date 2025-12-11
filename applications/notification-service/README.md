# Campus Events Notification Service

Asynchronous notification service for the Campus Events Management System.

## 🎯 Overview

A Python-based microservice built with FastAPI that handles all notification-related operations including email notifications (AWS SES), SMS notifications (AWS SNS), and scheduled reminder tasks using Celery.

## 🛠️ Technology Stack

- **Framework**: FastAPI 0.115.6
- **Python Version**: 3.12+
- **Task Queue**: Celery 5.4.0
- **Message Broker**: Redis
- **ORM**: SQLAlchemy 2.0.36
- **AWS SDK**: Boto3 1.35.86
- **Email**: AWS SES (Simple Email Service)
- **SMS**: AWS SNS (Simple Notification Service)
- **Database Client**: psycopg2-binary 2.9.10
- **HTTP Client**: httpx 0.28.1
- **Validation**: Pydantic (FastAPI built-in)

## 📁 Project Structure

```
notification-service/
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application entry point
│   ├── config.py            # Configuration management
│   ├── api/                 # API routes
│   │   ├── __init__.py
│   │   ├── notifications.py # Notification endpoints
│   │   └── health.py        # Health check endpoints
│   ├── services/            # Business logic
│   │   ├── __init__.py
│   │   ├── email_service.py      # AWS SES integration
│   │   ├── sms_service.py        # AWS SNS integration
│   │   └── notification_service.py # Notification orchestration
│   ├── tasks/               # Celery tasks
│   │   ├── __init__.py
│   │   ├── celery_app.py    # Celery configuration
│   │   └── notification_tasks.py # Async notification tasks
│   ├── models/              # Database models
│   │   ├── __init__.py
│   │   └── notification.py  # Notification model
│   ├── templates/           # Email/SMS templates
│   │   ├── emails/
│   │   │   ├── event_reminder.html
│   │   │   ├── rsvp_confirmation.html
│   │   │   └── event_update.html
│   │   └── sms/
│   │       ├── event_reminder.txt
│   │       └── rsvp_confirmation.txt
│   └── utils/               # Utility functions
│       ├── __init__.py
│       └── logger.py        # Logging configuration
├── tests/                   # Test files
│   ├── __init__.py
│   ├── test_notifications.py
│   └── test_tasks.py
├── .env.example            # Environment variables template
├── Dockerfile              # Multi-stage Docker build
├── requirements.txt        # Python dependencies
├── pyproject.toml          # Poetry configuration (optional)
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Python 3.12+
- Redis (for Celery broker)
- PostgreSQL 16+ (optional, for notification history)
- AWS Account (for SES/SNS)

### Installation

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Or using Poetry
poetry install
```

### Environment Configuration

Create `.env` file from `.env.example`:

```env
# Application Configuration
APP_NAME=campus-events-notifications
APP_ENV=development
APP_PORT=8082
LOG_LEVEL=INFO

# Database Configuration (optional)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campusevents
DB_USER=dbadmin
DB_PASSWORD=your_secure_password

# Redis Configuration (Celery broker)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0
REDIS_PASSWORD=

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key

# AWS SES Configuration
SES_SENDER_EMAIL=noreply@campus-events.com
SES_SENDER_NAME=Campus Events
SES_CONFIGURATION_SET=campus-events

# AWS SNS Configuration
SNS_SENDER_ID=CampusEvents
SNS_MESSAGE_TYPE=Transactional

# Notification Configuration
ENABLE_EMAIL=true
ENABLE_SMS=false
REMINDER_HOURS_BEFORE=24

# Rate Limiting
MAX_EMAILS_PER_HOUR=100
MAX_SMS_PER_HOUR=50

# Celery Configuration
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
CELERY_TASK_ALWAYS_EAGER=false

# Events API Configuration
EVENTS_API_URL=http://localhost:8080/api/v1
```

### Running Locally

**Terminal 1 - API Server:**
```bash
# Activate virtual environment
source venv/bin/activate

# Start FastAPI server
uvicorn app.main:app --host 0.0.0.0 --port 8082 --reload

# Server will run on http://localhost:8082
# API docs at http://localhost:8082/docs
```

**Terminal 2 - Celery Worker:**
```bash
# Activate virtual environment
source venv/bin/activate

# Start Celery worker
celery -A app.tasks.celery_app worker --loglevel=info

# For Windows:
celery -A app.tasks.celery_app worker --loglevel=info --pool=solo
```

**Terminal 3 - Celery Beat (Scheduler):**
```bash
# Activate virtual environment
source venv/bin/activate

# Start Celery beat (for scheduled tasks)
celery -A app.tasks.celery_app beat --loglevel=info
```

## 📡 API Endpoints

### Health & Monitoring

```
GET  /health              # Health check
GET  /metrics             # Prometheus metrics (optional)
GET  /docs                # Swagger documentation
GET  /redoc               # ReDoc documentation
```

### Notifications

```
POST  /api/v1/notifications/email         # Send email notification
POST  /api/v1/notifications/sms           # Send SMS notification
POST  /api/v1/notifications/event-reminder # Schedule event reminder
POST  /api/v1/notifications/rsvp-confirmation # Send RSVP confirmation
GET   /api/v1/notifications/history       # Get notification history
GET   /api/v1/notifications/stats         # Get notification statistics
```

## 📝 API Examples

### Send Email Notification

```bash
curl -X POST http://localhost:8082/api/v1/notifications/email \
  -H "Content-Type: application/json" \
  -d '{
    "to": "user@example.com",
    "template": "event_reminder",
    "data": {
      "event_title": "Tech Workshop",
      "event_date": "2025-12-20",
      "event_time": "14:00",
      "event_location": "Engineering Building"
    }
  }'
```

### Send SMS Notification

```bash
curl -X POST http://localhost:8082/api/v1/notifications/sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+1234567890",
    "template": "rsvp_confirmation",
    "data": {
      "event_title": "Tech Workshop",
      "rsvp_id": "uuid-here"
    }
  }'
```

### Schedule Event Reminder

```bash
curl -X POST http://localhost:8082/api/v1/notifications/event-reminder \
  -H "Content-Type: application/json" \
  -d '{
    "event_id": "event-uuid",
    "send_at": "2025-12-19T14:00:00Z"
  }'
```

## 🔧 Service Architecture

### Email Service (AWS SES)

```python
# app/services/email_service.py
import boto3
from botocore.exceptions import ClientError
from app.utils.logger import logger

class EmailService:
    def __init__(self):
        self.client = boto3.client(
            'ses',
            region_name=settings.AWS_REGION
        )
        
    async def send_email(
        self, 
        to_email: str,
        subject: str,
        html_body: str,
        text_body: str = None
    ):
        try:
            response = self.client.send_email(
                Source=f"{settings.SES_SENDER_NAME} <{settings.SES_SENDER_EMAIL}>",
                Destination={'ToAddresses': [to_email]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Html': {'Data': html_body},
                        'Text': {'Data': text_body or ''}
                    }
                },
                ConfigurationSetName=settings.SES_CONFIGURATION_SET
            )
            logger.info(f"Email sent to {to_email}, MessageId: {response['MessageId']}")
            return response
        except ClientError as e:
            logger.error(f"Error sending email: {e}")
            raise
```

### SMS Service (AWS SNS)

```python
# app/services/sms_service.py
import boto3
from app.utils.logger import logger

class SMSService:
    def __init__(self):
        self.client = boto3.client(
            'sns',
            region_name=settings.AWS_REGION
        )
        
    async def send_sms(
        self,
        phone_number: str,
        message: str
    ):
        try:
            response = self.client.publish(
                PhoneNumber=phone_number,
                Message=message,
                MessageAttributes={
                    'AWS.SNS.SMS.SenderID': {
                        'DataType': 'String',
                        'StringValue': settings.SNS_SENDER_ID
                    },
                    'AWS.SNS.SMS.SMSType': {
                        'DataType': 'String',
                        'StringValue': settings.SNS_MESSAGE_TYPE
                    }
                }
            )
            logger.info(f"SMS sent to {phone_number}, MessageId: {response['MessageId']}")
            return response
        except ClientError as e:
            logger.error(f"Error sending SMS: {e}")
            raise
```

### Celery Tasks

```python
# app/tasks/notification_tasks.py
from app.tasks.celery_app import celery_app
from app.services.email_service import EmailService
from app.services.sms_service import SMSService

@celery_app.task(name='send_email_task')
def send_email_task(to_email: str, subject: str, html_body: str):
    """Asynchronous email sending task"""
    email_service = EmailService()
    return email_service.send_email(to_email, subject, html_body)

@celery_app.task(name='send_sms_task')
def send_sms_task(phone_number: str, message: str):
    """Asynchronous SMS sending task"""
    sms_service = SMSService()
    return sms_service.send_sms(phone_number, message)

@celery_app.task(name='send_event_reminders')
def send_event_reminders():
    """Periodic task to send event reminders"""
    # Query events happening in next 24 hours
    # Send reminders to all RSVPs
    pass
```

### Celery Configuration

```python
# app/tasks/celery_app.py
from celery import Celery
from app.config import settings

celery_app = Celery(
    'campus-events-notifications',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=300,  # 5 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

# Periodic tasks schedule
celery_app.conf.beat_schedule = {
    'send-event-reminders': {
        'task': 'send_event_reminders',
        'schedule': 3600.0,  # Every hour
    },
}
```

## 📧 Email Templates

### Event Reminder Template

```html
<!-- app/templates/emails/event_reminder.html -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Event Reminder</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
    <h2>Reminder: {{event_title}}</h2>
    <p>This is a reminder that you have registered for:</p>
    
    <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px;">
        <p><strong>Event:</strong> {{event_title}}</p>
        <p><strong>Date:</strong> {{event_date}}</p>
        <p><strong>Time:</strong> {{event_time}}</p>
        <p><strong>Location:</strong> {{event_location}}</p>
    </div>
    
    <p>We look forward to seeing you there!</p>
    
    <p style="margin-top: 30px; font-size: 12px; color: #666;">
        If you need to cancel your RSVP, please visit our website.
    </p>
</body>
</html>
```

## 🐳 Docker

### Build Docker Image

```bash
# Build image
docker build -t campus-events-notifications:latest .

# Run container
docker run -p 8082:8082 \
  -e AWS_ACCESS_KEY_ID=your_key \
  -e AWS_SECRET_ACCESS_KEY=your_secret \
  campus-events-notifications:latest
```

### Multi-stage Dockerfile

```dockerfile
# Stage 1: Base
FROM python:3.12-slim AS base
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# Stage 2: Dependencies
FROM base AS deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Production
FROM base AS production
RUN addgroup --gid 1001 --system python && \
    adduser --no-create-home --shell /bin/false --disabled-password \
    --uid 1001 --system --group python
COPY --from=deps /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages
COPY --from=deps /usr/local/bin /usr/local/bin
COPY --chown=python:python app/ ./app/
USER python
EXPOSE 8082
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s \
  CMD python -c "import requests; requests.get('http://localhost:8082/health')"
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8082"]
```

## 🧪 Testing

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_notifications.py

# Run with verbose output
pytest -v
```

### Test Example

```python
# tests/test_notifications.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_send_email_notification():
    payload = {
        "to": "test@example.com",
        "template": "event_reminder",
        "data": {
            "event_title": "Test Event",
            "event_date": "2025-12-20",
            "event_time": "14:00",
            "event_location": "Test Location"
        }
    }
    response = client.post("/api/v1/notifications/email", json=payload)
    assert response.status_code == 200
    assert "message_id" in response.json()
```

## 🚢 Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: notification-service
  namespace: campus-events
spec:
  replicas: 2
  selector:
    matchLabels:
      app: notification-service
  template:
    metadata:
      labels:
        app: notification-service
    spec:
      containers:
      - name: notification-service
        image: <ecr-repo>/notification-service:latest
        ports:
        - containerPort: 8082
        env:
        - name: AWS_REGION
          value: "us-east-1"
        - name: REDIS_HOST
          value: "redis-service"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: celery-worker
  namespace: campus-events
spec:
  replicas: 2
  selector:
    matchLabels:
      app: celery-worker
  template:
    metadata:
      labels:
        app: celery-worker
    spec:
      containers:
      - name: celery-worker
        image: <ecr-repo>/notification-service:latest
        command: ["celery", "-A", "app.tasks.celery_app", "worker", "--loglevel=info"]
        env:
        - name: CELERY_BROKER_URL
          value: "redis://redis-service:6379/0"
```

## 📊 Monitoring

### Metrics

- Email success/failure rate
- SMS success/failure rate
- Task queue length
- Task processing time
- AWS SES bounce rate
- AWS SNS delivery rate

### Logging

```python
# app/utils/logger.py
import logging
from pythonjsonlogger import jsonlogger

logger = logging.getLogger()
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)
```

## 🔒 AWS IAM Permissions

Required IAM permissions for SES and SNS:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "*"
    }
  ]
}
```

## 🐛 Troubleshooting

### AWS SES Email Not Sending

**Issue**: Emails not delivered

**Solutions**:
1. Verify sender email in AWS SES console
2. Check if account is in sandbox mode (can only send to verified addresses)
3. Request production access for SES
4. Check bounce/complaint rates

### Celery Worker Not Processing Tasks

**Issue**: Tasks stuck in queue

**Solutions**:
```bash
# Check Redis connection
redis-cli ping

# Check Celery worker logs
celery -A app.tasks.celery_app inspect active

# Purge task queue
celery -A app.tasks.celery_app purge
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Celery Documentation](https://docs.celeryproject.org/)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [Redis Documentation](https://redis.io/documentation)

## 🤝 Contributing

1. Follow Python PEP 8 style guide
2. Write comprehensive tests
3. Update API documentation
4. Use type hints
5. Follow async/await patterns

## 📄 License

Part of the Campus Events EKS Project for ENPM818R.

---

**Built with** ❤️ **using Python and FastAPI**
