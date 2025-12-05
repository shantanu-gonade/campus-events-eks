from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime
import logging
import uuid

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

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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
        
        return NotificationResponse(
            id=str(uuid.uuid4()),
            status="sent",
            recipient=notification.recipient,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Failed to send email: {str(e)}")
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
        
        return NotificationResponse(
            id=str(uuid.uuid4()),
            status="sent",
            recipient=notification.recipient,
            timestamp=datetime.utcnow()
        )
    except Exception as e:
        logger.error(f"Failed to send SMS: {str(e)}")
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
