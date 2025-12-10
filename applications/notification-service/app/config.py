import os
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Application
    app_name: str = "Notification Service"
    port: int = 8082
    log_level: str = "info"
    
    # AWS
    aws_region: str = "us-east-1"
    sns_topic_arn: str = ""
    ses_sender_email: str = "shangonade@gmail.com"
    sqs_queue_url: str = ""
    
    class Config:
        # env_file is optional - environment variables are provided via Kubernetes ConfigMap/Secret in production
        env_file = ".env"
        env_file_encoding = 'utf-8'
        # Don't fail if .env file is missing (important for containerized deployments)
        env_ignore_empty = True
        case_sensitive = False

settings = Settings()
