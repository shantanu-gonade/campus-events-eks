# Campus Events Management System - EKS Deployment

## Overview
A cloud-native event management system deployed on AWS EKS using Infrastructure as Code.

## Architecture
- **Frontend**: React application
- **Events API**: Node.js REST API
- **Notification Service**: Python microservice
- **Database**: Amazon RDS PostgreSQL
- **Container Orchestration**: Amazon EKS (Kubernetes 1.31)
- **Infrastructure**: Terraform

## Prerequisites
- AWS Account with appropriate permissions
- AWS CLI v2.15+
- Terraform 1.9+
- kubectl 1.31+
- Docker Desktop 24.0+
- helm 3.14+
- Node.js 20 LTS
- Python 3.12+

## Quick Start
```bash
# 1. Clone repository
git clone <your-repo-url>
cd campus-events-eks

# 2. Configure AWS credentials
aws configure

# 3. Deploy infrastructure
cd terraform/environments/dev
terraform init
terraform apply

# 4. Configure kubectl
aws eks update-kubeconfig --name campus-events-dev --region us-east-1

# 5. Deploy applications
cd ../../../kubernetes
kubectl apply -k overlays/dev/
```

## Project Structure
- `/terraform` - Infrastructure as Code
- `/kubernetes` - Kubernetes manifests
- `/applications` - Application source code
- `/docs` - Documentation
- `/.github` - CI/CD workflows

## Team
- [Your Name] - Project Lead
- [Member 2] - Infrastructure Engineer
- [Member 3] - Backend Developer

## License
MIT - Academic Project for ENPM818R