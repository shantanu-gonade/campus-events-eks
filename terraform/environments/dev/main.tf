terraform {
  required_version = ">= 1.9.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Using local backend for development speed
  # For production, uncomment S3 backend below:
  # backend "s3" {
  #   bucket = "campus-events-terraform-state"
  #   key    = "dev/terraform.tfstate"
  #   region = "us-east-1"
  #   encrypt = true
  # }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "campus-events"
      Environment = "dev"
      ManagedBy   = "terraform"
      Team        = "platform"
    }
  }
}

locals {
  cluster_name = "campus-events-dev"
  oidc_provider = replace(module.eks.cluster_oidc_issuer_url, "https://", "")
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# VPC Module
module "vpc" {
  source = "../../modules/vpc"

  vpc_name     = "campus-events-dev-vpc"
  vpc_cidr     = "10.0.0.0/16"
  region       = var.region
  environment  = "dev"
  cluster_name = local.cluster_name

  tags = {
    Project = "campus-events"
  }
}

# EKS Module
module "eks" {
  source = "../../modules/eks"

  cluster_name    = local.cluster_name
  cluster_version = "1.31"

  vpc_id             = module.vpc.vpc_id
  private_subnet_ids = module.vpc.private_subnet_ids

  node_instance_types      = ["t3.medium"]
  node_group_min_size      = 2
  node_group_max_size      = 4
  node_group_desired_size  = 2

  environment = "dev"

  tags = {
    Project = "campus-events"
  }
}

# RDS Module
module "rds" {
  source = "../../modules/rds"

  identifier = "${local.cluster_name}-db"

  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnet_ids

  allowed_security_groups = [module.eks.node_security_group_id]

  engine_version     = "16.3"
  instance_class     = "db.t3.micro"
  allocated_storage  = 20
  storage_type       = "gp3"

  database_name   = "campusevents"
  master_username = "dbadmin"
  master_password = var.db_password # Define this in terraform.tfvars

  backup_retention_period = 7
  skip_final_snapshot     = true # Set to false in production

  multi_az            = false # Set to true in production
  deletion_protection = false # Set to true in production

  monitoring_interval            = 60
  performance_insights_enabled   = true
  performance_insights_retention_period = 7

  environment = "dev"

  tags = {
    Project = "campus-events"
  }
}

# Karpenter Module
module "karpenter" {
  source = "../../modules/karpenter"

  cluster_name       = local.cluster_name
  region             = var.region
  oidc_provider_arn  = module.eks.oidc_provider_arn
  oidc_provider      = local.oidc_provider
  karpenter_namespace = "karpenter"

  tags = {
    Project = "campus-events"
  }
}

# GitHub OIDC Module for GitHub Actions
module "github_oidc" {
  source = "../../modules/github-oidc"

  github_org  = var.github_org
  github_repo = var.github_repo
  role_name   = "GitHubActionsRole"

  # ECR repository ARNs - update after ECR repos are created
  ecr_repository_arns = [
    "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/campus-events/frontend",
    "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/campus-events/events-api",
    "arn:aws:ecr:${var.region}:${data.aws_caller_identity.current.account_id}:repository/campus-events/notification-service"
  ]

  tags = {
    Project = "campus-events"
  }
}
