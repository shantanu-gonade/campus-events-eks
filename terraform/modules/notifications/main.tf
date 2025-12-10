# Terraform module for AWS SES and SNS for notification service
# Cluster: campus-events-dev
# AWS Account: 842819994894

# SES Email Identity Verification
resource "aws_ses_email_identity" "sender_email" {
  email = var.sender_email
}

# SES Configuration Set
resource "aws_ses_configuration_set" "notifications" {
  name = "${var.cluster_name}-notifications"

  reputation_metrics_enabled = true
  sending_enabled            = true
}

# SNS Topic for Notifications
resource "aws_sns_topic" "notifications" {
  name              = "${var.cluster_name}-notifications"
  display_name      = "Campus Events Notifications"
  fifo_topic        = false
  
  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-notifications"
    }
  )
}

# SNS Topic Subscription for Email (optional - for testing)
resource "aws_sns_topic_subscription" "email_subscription" {
  count     = var.enable_email_subscription ? 1 : 0
  topic_arn = aws_sns_topic.notifications.arn
  protocol  = "email"
  endpoint  = var.subscription_email
}

# SQS Queue for Notification Processing
resource "aws_sqs_queue" "notifications_queue" {
  name                       = "${var.cluster_name}-notifications-queue"
  delay_seconds              = 0
  max_message_size           = 262144
  message_retention_seconds  = 1209600  # 14 days
  receive_wait_time_seconds  = 20       # Long polling
  visibility_timeout_seconds = 300

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-notifications-queue"
    }
  )
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "notifications_dlq" {
  name                       = "${var.cluster_name}-notifications-dlq"
  message_retention_seconds  = 1209600  # 14 days

  tags = merge(
    var.tags,
    {
      Name = "${var.cluster_name}-notifications-dlq"
    }
  )
}

# Configure DLQ for main queue
resource "aws_sqs_queue_redrive_policy" "notifications_queue" {
  queue_url = aws_sqs_queue.notifications_queue.id

  redrive_policy = jsonencode({
    deadLetterTargetArn = aws_sqs_queue.notifications_dlq.arn
    maxReceiveCount     = 3
  })
}

# IAM Policy for Notification Service
resource "aws_iam_policy" "notification_service_policy" {
  name        = "${var.cluster_name}-notification-service-policy"
  description = "IAM policy for notification service to access SES, SNS, and SQS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ses:SendEmail",
          "ses:SendRawEmail",
          "ses:SendTemplatedEmail"
        ]
        Resource = "*"
        Condition = {
          StringLike = {
            "ses:FromAddress" = var.sender_email
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.notifications.arn
      },
      {
        Effect = "Allow"
        Action = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes",
          "sqs:ChangeMessageVisibility"
        ]
        Resource = [
          aws_sqs_queue.notifications_queue.arn,
          aws_sqs_queue.notifications_dlq.arn
        ]
      }
    ]
  })

  tags = var.tags
}

# IAM Role for Service Account (IRSA)
module "notification_service_irsa" {
  source  = "terraform-aws-modules/iam/aws//modules/iam-role-for-service-accounts-eks"
  version = "~> 5.0"

  role_name = "${var.cluster_name}-notification-service"

  role_policy_arns = {
    policy = aws_iam_policy.notification_service_policy.arn
  }

  oidc_providers = {
    main = {
      provider_arn               = var.oidc_provider_arn
      namespace_service_accounts = ["${var.namespace}:notification-service"]
    }
  }

  tags = var.tags
}

# CloudWatch Log Group for SES
resource "aws_cloudwatch_log_group" "ses_events" {
  name              = "/aws/ses/${var.cluster_name}"
  retention_in_days = 7

  tags = var.tags
}

# SES Event Destination for CloudWatch
resource "aws_ses_event_destination" "cloudwatch" {
  name                   = "cloudwatch-destination"
  configuration_set_name = aws_ses_configuration_set.notifications.name
  enabled                = true
  matching_types         = ["send", "reject", "bounce", "complaint", "delivery"]

  cloudwatch_destination {
    default_value  = "default"
    dimension_name = "ses:configuration-set"
    value_source   = "messageTag"
  }
}
