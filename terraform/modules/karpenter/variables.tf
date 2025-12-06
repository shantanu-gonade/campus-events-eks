variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "oidc_provider_arn" {
  description = "ARN of the OIDC provider for the EKS cluster"
  type        = string
}

variable "oidc_provider" {
  description = "OIDC provider URL without https://"
  type        = string
}

variable "karpenter_namespace" {
  description = "Kubernetes namespace where Karpenter will be installed"
  type        = string
  default     = "karpenter"
}

variable "tags" {
  description = "Additional tags for resources"
  type        = map(string)
  default     = {}
}
