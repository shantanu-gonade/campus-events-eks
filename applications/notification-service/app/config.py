import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Application
    app_name: str = "Notification Service"
    port: int = 8082
    log_level: str = "info"
    
    # AWS
    aws_region: str = os.getenv("AWS_REGION", "us-east-1")
    sns_topic_arn: str = os.getenv("SNS_TOPIC_ARN", "")
    ses_sender_email: str = os.getenv("SES_SENDER_EMAIL", "shangonade@gmail.com")
    sqs_queue_url: str = os.getenv("SQS_QUEUE_URL", "")
    
    class Config:
        env_file = ".env"

settings = Settings()
