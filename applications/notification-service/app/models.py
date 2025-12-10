from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

class NotificationRequest(BaseModel):
    recipient: EmailStr
    subject: str
    template: Optional[str] = None  # Make template optional
    context: Dict[str, Any]
    
class NotificationResponse(BaseModel):
    id: str
    status: str
    recipient: str
    timestamp: datetime
    
class HealthCheck(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"
