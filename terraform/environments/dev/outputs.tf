# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

# EKS Outputs
output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = module.eks.cluster_id
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = module.eks.cluster_endpoint
}

output "eks_cluster_security_group_id" {
  description = "Security group ID attached to the EKS cluster"
  value       = module.eks.cluster_security_group_id
}

output "eks_cluster_certificate_authority_data" {
  description = "Base64 encoded certificate data required to communicate with the cluster"
  value       = module.eks.cluster_certificate_authority_data
  sensitive   = true
}

output "eks_cluster_oidc_issuer_url" {
  description = "The URL on the EKS cluster OIDC Issuer"
  value       = module.eks.cluster_oidc_issuer_url
}

output "eks_oidc_provider_arn" {
  description = "ARN of the OIDC Provider for EKS"
  value       = module.eks.oidc_provider_arn
}

# RDS Outputs
output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = module.rds.db_instance_endpoint
}

output "rds_address" {
  description = "RDS instance address"
  value       = module.rds.db_instance_address
}

output "rds_port" {
  description = "RDS instance port"
  value       = module.rds.db_instance_port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = module.rds.db_instance_name
}

output "rds_security_group_id" {
  description = "Security group ID for RDS"
  value       = module.rds.db_security_group_id
}

# Connection Information
output "configure_kubectl" {
  description = "Configure kubectl command"
  value       = "aws eks update-kubeconfig --region ${var.region} --name ${local.cluster_name}"
}

# GitHub OIDC Outputs
output "github_actions_role_arn" {
  description = "ARN of the IAM role for GitHub Actions"
  value       = module.github_oidc.role_arn
}

output "github_actions_role_name" {
  description = "Name of the IAM role for GitHub Actions"
  value       = module.github_oidc.role_name
}

output "github_oidc_provider_arn" {
  description = "ARN of the GitHub OIDC provider"
  value       = module.github_oidc.oidc_provider_arn
}

# Karpenter Outputs
output "karpenter_controller_role_arn" {
  description = "ARN of the Karpenter controller IAM role"
  value       = module.karpenter.controller_role_arn
}

output "karpenter_node_role_arn" {
  description = "ARN of the Karpenter node IAM role"
  value       = module.karpenter.node_role_arn
}

output "karpenter_node_instance_profile_name" {
  description = "Name of the Karpenter node instance profile"
  value       = module.karpenter.node_instance_profile_name
}

output "karpenter_sqs_queue_name" {
  description = "Name of the SQS queue for Karpenter interruption handling"
  value       = module.karpenter.sqs_queue_name
}
