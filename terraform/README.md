# Terraform Infrastructure as Code

## 🎯 Overview

This directory contains all Terraform configurations for provisioning and managing the AWS infrastructure for the Campus Events Management System. The infrastructure follows AWS Well-Architected Framework principles and implements Infrastructure as Code (IaC) best practices.

## 🏗️ Architecture

The infrastructure is deployed across multiple availability zones (AZs) for high availability and includes:

- **VPC**: Custom VPC with public and private subnets across 2 AZs
- **EKS Cluster**: Managed Kubernetes cluster (v1.31)
- **RDS Database**: PostgreSQL 16.3 with Multi-AZ capability
- **Security Groups**: Layered security with least privilege access
- **IAM Roles**: Service-specific roles for EKS, nodes, and applications
- **Load Balancers**: Application Load Balancer for external access

## 📁 Directory Structure

```
terraform/
├── modules/                    # Reusable Terraform modules
│   ├── vpc/                   # VPC and networking
│   │   ├── main.tf           # VPC, subnets, route tables
│   │   ├── variables.tf      # Input variables
│   │   ├── outputs.tf        # Output values
│   │   └── README.md         # Module documentation
│   ├── eks/                   # EKS cluster configuration
│   │   ├── main.tf           # EKS cluster, node groups
│   │   ├── variables.tf      # Input variables
│   │   ├── outputs.tf        # Output values
│   │   └── README.md         # Module documentation
│   ├── rds/                   # RDS PostgreSQL database
│   │   ├── main.tf           # RDS instance, subnet group
│   │   ├── variables.tf      # Input variables
│   │   ├── outputs.tf        # Output values
│   │   └── README.md         # Module documentation
│   └── security-groups/       # Security group definitions
│       ├── main.tf           # Security groups and rules
│       ├── variables.tf      # Input variables
│       ├── outputs.tf        # Output values
│       └── README.md         # Module documentation
└── environments/              # Environment-specific configurations
    ├── dev/                  # Development environment
    │   ├── main.tf          # Root module for dev
    │   ├── variables.tf     # Dev-specific variables
    │   ├── terraform.tfvars # Dev variable values
    │   ├── backend.tf       # S3 backend configuration
    │   ├── providers.tf     # AWS provider configuration
    │   └── outputs.tf       # Environment outputs
    ├── staging/              # Staging environment (template)
    │   └── ...
    └── prod/                 # Production environment (template)
        └── ...
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install Terraform (1.9.0 or higher)
brew install terraform  # macOS
# OR
wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip

# Verify installation
terraform version

# Install AWS CLI and configure credentials
aws configure

# Verify AWS access
aws sts get-caller-identity
```

### Initial Setup

```bash
# 1. Navigate to environment directory
cd terraform/environments/dev

# 2. Initialize Terraform (downloads providers and modules)
terraform init

# 3. Review planned changes
terraform plan

# 4. Apply configuration (create infrastructure)
terraform apply

# Type 'yes' when prompted
```

### State Management

This project uses **S3 backend** for remote state storage:

```hcl
# backend.tf
terraform {
  backend "s3" {
    bucket         = "campus-events-terraform-state"
    key            = "dev/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-state-lock"
  }
}
```

**Benefits:**
- Centralized state storage
- State locking (prevents concurrent modifications)
- Version history
- Team collaboration support

## 🔧 Module Details

### VPC Module

Creates a secure, multi-AZ networking foundation:

**Resources:**
- 1 VPC (10.0.0.0/16)
- 2 Public subnets (10.0.1.0/24, 10.0.2.0/24)
- 2 Private subnets for applications (10.0.11.0/24, 10.0.12.0/24)
- 2 Private subnets for databases (10.0.21.0/24, 10.0.22.0/24)
- Internet Gateway
- 2 NAT Gateways (one per AZ)
- Route tables and associations
- VPC Flow Logs (optional)

**Usage:**
```hcl
module "vpc" {
  source = "../../modules/vpc"
  
  vpc_name             = "campus-events-vpc"
  vpc_cidr             = "10.0.0.0/16"
  availability_zones   = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24"]
  private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24"]
  database_subnet_cidrs = ["10.0.21.0/24", "10.0.22.0/24"]
  
  enable_nat_gateway   = true
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  
  tags = {
    Environment = "dev"
    Project     = "campus-events"
  }
}
```

### EKS Module

Deploys a production-ready Kubernetes cluster:

**Resources:**
- EKS Cluster (Kubernetes 1.31)
- Managed Node Group (t3.medium instances)
- Cluster IAM Role
- Node IAM Role with required policies
- OIDC Identity Provider
- Cluster add-ons (VPC CNI, kube-proxy, CoreDNS)
- Security groups for cluster and nodes

**Key Features:**
- Managed control plane (AWS handles updates)
- Auto-scaling node groups (2-10 nodes)
- IRSA (IAM Roles for Service Accounts)
- Cluster encryption
- CloudWatch logging
- Private API endpoint option

**Usage:**
```hcl
module "eks" {
  source = "../../modules/eks"
  
  cluster_name    = "campus-events-dev"
  cluster_version = "1.31"
  
  vpc_id          = module.vpc.vpc_id
  subnet_ids      = module.vpc.private_subnet_ids
  
  node_group_name          = "campus-events-nodes"
  node_instance_types      = ["t3.medium"]
  node_desired_size        = 2
  node_min_size            = 2
  node_max_size            = 10
  node_disk_size           = 30
  
  enable_irsa              = true
  cluster_endpoint_private = false
  cluster_endpoint_public  = true
  
  tags = {
    Environment = "dev"
  }
}
```

### RDS Module

Provisions a managed PostgreSQL database:

**Resources:**
- RDS PostgreSQL 16.3 instance
- DB Subnet Group (isolated private subnets)
- DB Parameter Group
- DB Option Group
- Security Group
- Enhanced monitoring role
- Automated backups

**Key Features:**
- Multi-AZ deployment (prod)
- Automated backups (7-day retention)
- Encryption at rest (KMS)
- Point-in-time recovery
- Performance Insights
- Enhanced monitoring

**Usage:**
```hcl
module "rds" {
  source = "../../modules/rds"
  
  identifier     = "campus-events-dev-db"
  engine_version = "16.3"
  instance_class = "db.t3.micro"  # db.t3.medium for prod
  
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = true
  
  database_name = "campusevents"
  username      = "dbadmin"
  port          = 5432
  
  vpc_id                 = module.vpc.vpc_id
  subnet_ids             = module.vpc.database_subnet_ids
  vpc_security_group_ids = [module.security_groups.rds_sg_id]
  
  multi_az               = false  # true for prod
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  enabled_cloudwatch_logs_exports = ["postgresql", "upgrade"]
  performance_insights_enabled    = true
  monitoring_interval             = 60
  
  deletion_protection = false  # true for prod
  skip_final_snapshot = true   # false for prod
  
  tags = {
    Environment = "dev"
  }
}
```

## 🔐 Security Best Practices

### 1. Network Security

```hcl
# Private subnets for applications (no direct internet access)
# NAT Gateways for outbound traffic
# Network ACLs for subnet-level filtering
# Security Groups for instance-level filtering
```

### 2. IAM Least Privilege

```hcl
# Separate IAM roles for:
# - EKS cluster
# - EKS nodes
# - Application services (via IRSA)
# - RDS enhanced monitoring

# No IAM users with access keys
# Use IAM roles and OIDC for CI/CD
```

### 3. Encryption

```hcl
# Data at rest:
# - EKS cluster secrets (encrypted in etcd)
# - RDS database (KMS encryption)
# - EBS volumes (encrypted)
# - S3 state bucket (encrypted)

# Data in transit:
# - TLS for RDS connections
# - TLS for ALB listeners
# - TLS for EKS API server
```

### 4. Secrets Management

```bash
# NEVER commit:
# - terraform.tfvars with sensitive data
# - .env files
# - AWS credentials

# Use:
# - AWS Secrets Manager
# - AWS Systems Manager Parameter Store
# - Kubernetes Secrets (with encryption)
# - External Secrets Operator
```

## 📊 Resource Tagging Strategy

All resources are tagged consistently:

```hcl
tags = {
  Environment = "dev"              # dev, staging, prod
  Project     = "campus-events"
  ManagedBy   = "terraform"
  Owner       = "platform-team"
  CostCenter  = "engineering"
  Application = "campus-events-platform"
}
```

**Benefits:**
- Cost tracking and allocation
- Resource organization
- Access control
- Automation targeting

## 🔄 Workflow

### Making Changes

```bash
# 1. Create feature branch
git checkout -b feature/add-cache

# 2. Make changes to Terraform files
vim environments/dev/main.tf

# 3. Format code
terraform fmt -recursive

# 4. Validate syntax
terraform validate

# 5. Review plan
terraform plan -out=tfplan

# 6. Apply changes
terraform apply tfplan

# 7. Commit and push
git add .
git commit -m "feat: add ElastiCache for session storage"
git push origin feature/add-cache
```

### Destroying Infrastructure

```bash
# ⚠️ WARNING: This will DELETE all resources

# Review what will be destroyed
terraform plan -destroy

# Destroy infrastructure
terraform destroy

# Type 'yes' when prompted
# Type the environment name for additional confirmation
```

### State Operations

```bash
# List resources in state
terraform state list

# Show resource details
terraform state show module.eks.aws_eks_cluster.this

# Move resource in state
terraform state mv module.vpc.aws_vpc.this module.networking.aws_vpc.main

# Import existing resource
terraform import module.rds.aws_db_instance.this campus-events-dev-db

# Refresh state
terraform refresh
```

## 🧪 Testing

### Validate Configuration

```bash
# Syntax validation
terraform validate

# Format check
terraform fmt -check -recursive

# Security scanning with tfsec
tfsec .

# Cost estimation with Infracost
infracost breakdown --path .
```

### Testing in Isolation

```bash
# Test single module
cd modules/vpc
terraform init
terraform plan -var-file=test.tfvars
```

## 📈 Cost Optimization

### Development Environment (~$183/month)

| Resource | Monthly Cost |
|----------|--------------|
| EKS Cluster | $73 |
| EC2 Instances (2x t3.medium) | $60 |
| RDS (db.t3.micro) | $15 |
| ALB | $25 |
| NAT Gateways | $65 |
| Data Transfer | $10 |
| **Total** | **~$183** |

### Cost Saving Tips

```hcl
# 1. Use spot instances for non-production
node_group_capacity_type = "SPOT"

# 2. Schedule shutdown for dev environments
# Use AWS Instance Scheduler

# 3. Right-size instances
# Monitor usage and adjust

# 4. Use single NAT Gateway in dev
# (Not recommended for prod)

# 5. Enable S3 lifecycle policies
# for logs and backups
```

## 🚀 Advanced Features

### Multi-Environment Setup

```bash
terraform/
└── environments/
    ├── dev/
    │   └── terraform.tfvars      # Small instances, single AZ
    ├── staging/
    │   └── terraform.tfvars      # Medium instances, multi-AZ
    └── prod/
        └── terraform.tfvars      # Large instances, multi-AZ, HA
```

### Remote Module Sources

```hcl
# Use versioned modules
module "vpc" {
  source  = "terraform-aws-modules/vpc/aws"
  version = "5.1.0"
  
  # ... configuration
}

# Use Git tags
module "eks" {
  source = "git::https://github.com/terraform-aws-modules/terraform-aws-eks.git?ref=v19.0.0"
}
```

### Workspaces

```bash
# Create workspace
terraform workspace new staging

# List workspaces
terraform workspace list

# Switch workspace
terraform workspace select prod

# Show current workspace
terraform workspace show
```

## 📚 Terraform Best Practices

### 1. Code Organization

✅ **Do:**
- Separate modules from environments
- One resource per file (optional)
- Use meaningful resource names
- Group related resources

❌ **Don't:**
- Create monolithic main.tf files
- Hardcode values
- Duplicate code across environments

### 2. Variables and Outputs

```hcl
# Input variables
variable "cluster_name" {
  description = "Name of the EKS cluster"
  type        = string
  
  validation {
    condition     = length(var.cluster_name) <= 40
    error_message = "Cluster name must be 40 characters or less."
  }
}

# Output values
output "eks_cluster_endpoint" {
  description = "Endpoint for EKS cluster API"
  value       = module.eks.cluster_endpoint
  sensitive   = false
}
```

### 3. State Locking

```hcl
# Always use state locking for team environments
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "terraform-state-lock"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  
  attribute {
    name = "LockID"
    type = "S"
  }
}
```

### 4. Version Constraints

```hcl
terraform {
  required_version = ">= 1.9.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**Issue: State Lock Error**
```bash
Error: Error acquiring the state lock
```

**Solution:**
```bash
# Force unlock (use with caution)
terraform force-unlock LOCK_ID

# Check DynamoDB for stuck locks
aws dynamodb scan --table-name terraform-state-lock
```

**Issue: Resource Already Exists**
```bash
Error: resource already exists
```

**Solution:**
```bash
# Import existing resource
terraform import module.eks.aws_eks_cluster.this campus-events-dev

# Or remove from state
terraform state rm module.eks.aws_eks_cluster.this
```

**Issue: Terraform Version Mismatch**
```bash
Error: This configuration requires Terraform version >= 1.9.0
```

**Solution:**
```bash
# Update Terraform
brew upgrade terraform

# Or use tfenv for version management
tfenv install 1.9.0
tfenv use 1.9.0
```

## 📖 Additional Resources

- [Terraform Documentation](https://www.terraform.io/docs)
- [AWS Provider Documentation](https://registry.terraform.io/providers/hashicorp/aws/latest/docs)
- [Terraform Best Practices](https://www.terraform.io/docs/cloud/guides/recommended-practices/index.html)
- [AWS EKS Best Practices](https://aws.github.io/aws-eks-best-practices/)
- [Terraform AWS Modules](https://github.com/terraform-aws-modules)

## 🤝 Contributing

1. Follow Terraform style guide
2. Run `terraform fmt` before committing
3. Add documentation for new modules
4. Test changes in dev environment first
5. Create detailed pull request descriptions

## 📝 Changelog

See [CHANGELOG.md](../CHANGELOG.md) for version history and updates.

---

**Infrastructure as Code** | **Built with Terraform** | **AWS Well-Architected**
