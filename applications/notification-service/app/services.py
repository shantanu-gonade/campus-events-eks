import boto3
import logging
from typing import Dict, Any, Optional
from pathlib import Path
from jinja2 import Environment, FileSystemLoader, select_autoescape
from .config import settings

logger = logging.getLogger(__name__)

# Initialize Jinja2 environment
template_dir = Path(__file__).parent / "templates"
jinja_env = Environment(
    loader=FileSystemLoader(template_dir),
    autoescape=select_autoescape(['html', 'xml'])
)


class EmailService:
    def __init__(self):
        self.ses_client = boto3.client('ses', region_name=settings.aws_region)
        self.sender = settings.ses_sender_email
    
    def render_template(
        self,
        template_name: str,
        context: Dict[str, Any]
    ) -> str:
        """Render email template with context"""
        try:
            template = jinja_env.get_template(f"{template_name}.html")
            return template.render(**context)
        except Exception as e:
            logger.error(f"Failed to render template {template_name}: {str(e)}")
            # Fallback to basic template
            return f"<h2>{context.get('subject', 'Notification')}</h2><p>{context.get('message', '')}</p>"
    
    async def send_email(
        self,
        recipient: str,
        subject: str,
        body_html: str = None,
        body_text: str = None,
        template: str = None,
        context: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Send email via AWS SES"""
        try:
            # If template is specified, render it
            if template and context:
                context['recipient'] = recipient
                context['subject'] = subject
                body_html = self.render_template(template, context)
                body_text = body_text or context.get('message', '')
            
            # If no body_html provided, use basic format
            if not body_html:
                body_html = f"<p>{body_text or ''}</p>"
            
            response = self.ses_client.send_email(
                Source=self.sender,
                Destination={'ToAddresses': [recipient]},
                Message={
                    'Subject': {'Data': subject},
                    'Body': {
                        'Html': {'Data': body_html},
                        'Text': {'Data': body_text or subject}
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
    
    async def publish_message(
        self,
        message: str,
        subject: str = None,
        phone_number: str = None,
        message_attributes: Dict[str, Any] = None
    ) -> Dict[str, Any]:
        """Publish message to SNS topic or directly to phone number"""
        try:
            # If phone number is provided, send SMS directly
            if phone_number:
                params = {
                    'PhoneNumber': phone_number,
                    'Message': message
                }
                if message_attributes:
                    params['MessageAttributes'] = message_attributes
            else:
                # Publish to topic
                params = {
                    'TopicArn': self.topic_arn,
                    'Message': message
                }
                if subject:
                    params['Subject'] = subject
                if message_attributes:
                    params['MessageAttributes'] = message_attributes
            
            response = self.sns_client.publish(**params)
            
            logger.info(f"Message published to SNS: {response['MessageId']}")
            return {
                'status': 'published',
                'message_id': response['MessageId']
            }
        except Exception as e:
            logger.error(f"Failed to publish to SNS: {str(e)}")
            raise


class SQSService:
    def __init__(self):
        self.sqs_client = boto3.client('sqs', region_name=settings.aws_region)
        self.queue_url = settings.sqs_queue_url
    
    async def send_message(
        self,
        message_body: str,
        message_attributes: Dict[str, Any] = None,
        delay_seconds: int = 0
    ) -> Dict[str, Any]:
        """Send message to SQS queue"""
        try:
            params = {
                'QueueUrl': self.queue_url,
                'MessageBody': message_body,
                'DelaySeconds': delay_seconds
            }
            
            if message_attributes:
                params['MessageAttributes'] = message_attributes
            
            response = self.sqs_client.send_message(**params)
            
            logger.info(f"Message sent to SQS: {response['MessageId']}")
            return {
                'status': 'queued',
                'message_id': response['MessageId']
            }
        except Exception as e:
            logger.error(f"Failed to send to SQS: {str(e)}")
            raise
    
    async def receive_messages(
        self,
        max_messages: int = 10,
        wait_time_seconds: int = 20
    ) -> list:
        """Receive messages from SQS queue"""
        try:
            response = self.sqs_client.receive_message(
                QueueUrl=self.queue_url,
                MaxNumberOfMessages=max_messages,
                WaitTimeSeconds=wait_time_seconds,
                AttributeNames=['All'],
                MessageAttributeNames=['All']
            )
            
            messages = response.get('Messages', [])
            logger.info(f"Received {len(messages)} messages from SQS")
            return messages
        except Exception as e:
            logger.error(f"Failed to receive from SQS: {str(e)}")
            raise
    
    async def delete_message(self, receipt_handle: str) -> Dict[str, Any]:
        """Delete message from SQS queue"""
        try:
            self.sqs_client.delete_message(
                QueueUrl=self.queue_url,
                ReceiptHandle=receipt_handle
            )
            
            logger.info("Message deleted from SQS")
            return {'status': 'deleted'}
        except Exception as e:
            logger.error(f"Failed to delete from SQS: {str(e)}")
            raise


# Initialize services
email_service = EmailService()
sns_service = SNSService()
sqs_service = SQSService()
