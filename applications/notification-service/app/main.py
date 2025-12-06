from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import uuid
import time
from prometheus_client import Counter, Histogram, generate_latest, CONTENT_TYPE_LATEST
from starlette.responses import Response

from .models import NotificationRequest, NotificationResponse, HealthCheck
from .services import email_service, sns_service
from .config import settings

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.log_level.upper()),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title=settings.app_name,
    version="1.0.0",
    description="Notification Service for Campus Events"
)

# Prometheus metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status_code']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

notifications_sent_total = Counter(
    'notifications_sent_total',
    'Total notifications sent',
    ['type', 'status']
)

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    
    response = await call_next(request)
    
    duration = time.time() - start_time
    endpoint = request.url.path
    
    http_requests_total.labels(
        method=request.method,
        endpoint=endpoint,
        status_code=response.status_code
    ).inc()
    
    http_request_duration_seconds.labels(
        method=request.method,
        endpoint=endpoint
    ).observe(duration)
    
    return response

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/metrics")
async def metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)

@app.api_route("/health", methods=["GET", "HEAD"], response_model=HealthCheck)
async def health_check():
    """Health check endpoint"""
    return HealthCheck(
        status="healthy",
        timestamp=datetime.utcnow()
    )

@app.get("/ready", response_model=HealthCheck)
async def readiness_check():
    """Readiness check endpoint"""
    # Could add checks for AWS services connectivity here
    return HealthCheck(
        status="ready",
        timestamp=datetime.utcnow()
    )

@app.post("/api/v1/notifications/email", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def send_email_notification(notification: NotificationRequest):
    """Send email notification"""
    try:
        # Simple template rendering (in production, use Jinja2)
        body_html = f"<h2>{notification.subject}</h2><p>{notification.context.get('message', '')}</p>"
        
        result = await email_service.send_email(
            recipient=notification.recipient,
            subject=notification.subject,
            body_html=body_html
        )
        
        notifications_sent_total.labels(type='email', status='success').inc()
        
        return NotificationResponse(
            id=str(uuid.uuid4()),
            status="sent",
            recipient=notification.recipient,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
        notifications_sent_total.labels(type='email', status='failed').inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )

@app.post("/api/v1/notifications/sms", response_model=NotificationResponse, status_code=status.HTTP_201_CREATED)
async def send_sms_notification(notification: NotificationRequest):
    """Send SMS notification via SNS"""
    try:
        message = notification.context.get('message', '')
        
        result = await sns_service.publish_message(
            message=message,
            subject=notification.subject
        )
        
        notifications_sent_total.labels(type='sms', status='success').inc()
        
        return NotificationResponse(
            id=str(uuid.uuid4()),
            status="sent",
            recipient=notification.recipient,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
        notifications_sent_total.labels(type='sms', status='failed').inc()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send notification: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.port,
        log_level=settings.log_level
    )
