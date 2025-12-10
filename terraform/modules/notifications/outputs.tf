output "ses_email_identity" {
  description = "SES email identity"
  value       = aws_ses_email_identity.sender_email.email
}

output "ses_configuration_set_name" {
  description = "Name of the SES configuration set"
  value       = aws_ses_configuration_set.notifications.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic"
  value       = aws_sns_topic.notifications.arn
}

output "sqs_queue_url" {
  description = "URL of the SQS queue"
  value       = aws_sqs_queue.notifications_queue.url
}

output "sqs_queue_arn" {
  description = "ARN of the SQS queue"
  value       = aws_sqs_queue.notifications_queue.arn
}

output "sqs_dlq_arn" {
  description = "ARN of the SQS dead letter queue"
  value       = aws_sqs_queue.notifications_dlq.arn
}

output "iam_role_arn" {
  description = "ARN of the IAM role for notification service"
  value       = module.notification_service_irsa.iam_role_arn
}

output "service_account_name" {
  description = "Name of the service account"
  value       = "notification-service"
}

output "service_account_namespace" {
  description = "Namespace of the service account"
  value       = var.namespace
}
