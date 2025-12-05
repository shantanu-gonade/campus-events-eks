import boto3
import logging
from typing import Dict, Any
from .config import settings

logger = logging.getLogger(__name__)

class EmailService:
    def __init__(self):
        self.ses_client = boto3.client('ses', region_name=settings.aws_region)
        self.sender = settings.ses_sender_email
    
    async def send_email(
        self,
        recipient: str,
        subject: str,
        body_html: str,
        body_text: str = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES"""
        try:
            response = self.ses_client.send_email(
                Source=self.sender,
                Destination={'ToAddresses': [recipient]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Html': {'Data': body_html},
                        'Text': {'Data': body_text or body_html}
                    }
                }
            )
            
            logger.info(f"Email sent to {recipient}, MessageId: {response['MessageId']}")
            return {
                'status': 'sent',
                'message_id': response['MessageId']
            }
        except Exception as e:
            logger.error(f"Failed to send email to {recipient}: {str(e)}")
            raise

class SNSService:
    def __init__(self):
        self.sns_client = boto3.client('sns', region_name=settings.aws_region)
        self.topic_arn = settings.sns_topic_arn
    
    async def publish_message(self, message: str, subject: str = None) -> Dict[str, Any]:
        """Publish message to SNS topic"""
        try:
            params = {
                'TopicArn': self.topic_arn,
                'Message': message
            }
            if subject:
                params['Subject'] = subject
            
            response = self.sns_client.publish(**params)
            
            logger.info(f"Message published to SNS: {response['MessageId']}")
            return {
                'status': 'published',
                'message_id': response['MessageId']
            }
        except Exception as e:
            logger.error(f"Failed to publish to SNS: {str(e)}")
            raise

# Initialize services
email_service = EmailService()
sns_service = SNSService()
