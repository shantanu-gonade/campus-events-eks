variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "sender_email" {
  description = "Email address to verify in SES for sending notifications"
  type        = string
}

variable "subscription_email" {
  description = "Email address for SNS subscription (optional)"
  type        = string
  default     = ""
}

variable "enable_email_subscription" {
  description = "Enable email subscription to SNS topic"
  type        = bool
  default     = false
}

variable "namespace" {
  description = "Kubernetes namespace for the notification service"
  type        = string
  default     = "campus-events"
}

variable "oidc_provider_arn" {
  description = "ARN of the OIDC provider for IRSA"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
