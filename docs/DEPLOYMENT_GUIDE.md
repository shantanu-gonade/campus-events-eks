# Campus Events - Complete Deployment Guide

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Infrastructure Deployment](#infrastructure-deployment)
4. [Application Deployment](#application-deployment)
5. [Monitoring Setup](#monitoring-setup)
6. [Verification & Testing](#verification--testing)
7. [Troubleshooting](#troubleshooting)
8. [Maintenance Operations](#maintenance-operations)

---

## 1. Prerequisites

### Required Tools & Versions

| Tool | Minimum Version | Installation |
|------|----------------|--------------|
| **AWS CLI** | 2.15.0 | `brew install awscli` (macOS) |
| **Terraform** | 1.9.0 | `brew install terraform` (macOS) |
| **kubectl** | 1.31.0 | `brew install kubectl` (macOS) |
| **Helm** | 3.14.0 | `brew install helm` (macOS) |
| **Docker** | 24.0.0 | Download from docker.com |
| **Git** | 2.40.0+ | `brew install git` (macOS) |

### AWS Account Setup

**Required Permissions:**
- EC2 (VPC, Security Groups, EKS)
- RDS (PostgreSQL)
- IAM (Roles, Policies)
- ECR (Container Registry)
- ELB (Application Load Balancer)
- CloudWatch (Logs, Metrics)
- KMS (Encryption Keys)
- Secrets Manager

**Configure AWS CLI:**
```bash
# Configure credentials
aws configure

# Verify access
aws sts get-caller-identity

# Expected output:
# {
#     "UserId": "AIDAXXXXXXXXXXXXXXXXX",
#     "Account": "123456789012",
#     "Arn": "arn:aws:iam::123456789012:user/your-user"
# }
```

### Verify Tool Installation

```bash
# Check versions
aws --version        # aws-cli/2.15.0 or higher
terraform version    # Terraform v1.9.0 or higher
kubectl version --client  # v1.31.0 or higher
helm version         # v3.14.0 or higher
docker --version     # Docker version 24.0.0 or higher

# If any tool is missing or wrong version, install/update it
```

---

## 2. Initial Setup

### Clone Repository

```bash
# Clone the repository
git clone <repository-url>
cd campus-events-eks

# Verify project structure
ls -la
# Should see: applications/, terraform/, kubernetes/, scripts/, docs/
```

### Environment Configuration

**Create Terraform Variables:**
```bash
cd terraform/environments/dev

# Create terraform.tfvars (do not commit this file!)
cat > terraform.tfvars <<EOF
# Project Configuration
project_name = "campus-events"
environment  = "dev"
aws_region   = "us-east-1"

# VPC Configuration
vpc_cidr = "10.0.0.0/16"

# EKS Configuration
cluster_version = "1.31"
node_instance_types = ["t3.medium"]
node_desired_size = 2
node_min_size = 2
node_max_size = 10

# RDS Configuration
db_instance_class = "db.t3.micro"
db_allocated_storage = 20
db_engine_version = "16.3"
db_name = "campusevents"
db_username = "dbadmin"
db_password = "YOUR_SECURE_PASSWORD_HERE"  # Change this!

# Tags
tags = {
  Project     = "campus-events"
  Environment = "dev"
  ManagedBy   = "terraform"
  Team        = "platform"
}
EOF

# IMPORTANT: Add to .gitignore
echo "terraform.tfvars" >> ../../../.gitignore
```

### AWS ECR Setup

**Create ECR Repositories:**
```bash
# Create script to setup ECR
cat > setup-ecr.sh <<'EOF'
#!/bin/bash

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Repositories to create
REPOS=(
  "campus-events/frontend"
  "campus-events/events-api"
  "campus-events/notification-service"
)

echo "Setting up ECR repositories in $AWS_REGION..."
echo "AWS Account: $AWS_ACCOUNT_ID"

for repo in "${REPOS[@]}"; do
  echo "Creating repository: $repo"
  aws ecr create-repository \
    --repository-name "$repo" \
    --region "$AWS_REGION" \
    --image-scanning-configuration scanOnPush=true \
    --encryption-configuration encryptionType=AES256 \
    2>/dev/null || echo "Repository $repo already exists"
    
  # Set lifecycle policy to keep only last 10 images
  aws ecr put-lifecycle-policy \
    --repository-name "$repo" \
    --region "$AWS_REGION" \
    --lifecycle-policy-text '{
      "rules": [{
        "rulePriority": 1,
        "description": "Keep last 10 images",
        "selection": {
          "tagStatus": "any",
          "countType": "imageCountMoreThan",
          "countNumber": 10
        },
        "action": {
          "type": "expire"
        }
      }]
    }'
done

echo "ECR setup complete!"
echo ""
echo "Repository URIs:"
for repo in "${REPOS[@]}"; do
  echo "  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$repo"
done
EOF

chmod +x setup-ecr.sh
./setup-ecr.sh
```

---

## 3. Infrastructure Deployment

### Step 1: Initialize Terraform

```bash
cd terraform/environments/dev

# Initialize Terraform
terraform init

# Expected output:
# Terraform has been successfully initialized!
```

### Step 2: Plan Infrastructure

```bash
# Review changes
terraform plan -out=tfplan

# Review the plan carefully:
# - VPC and subnets
# - EKS cluster
# - RDS instance
# - Security groups
# - IAM roles
```

### Step 3: Deploy Infrastructure

```bash
# Apply the plan
terraform apply tfplan

# This will take approximately 15-20 minutes
# Output will include:
# - VPC ID
# - EKS cluster name
# - RDS endpoint
# - Other resource IDs
```

**Save Outputs:**
```bash
# Save Terraform outputs for later use
terraform output -json > outputs.json

# Key outputs:
# - cluster_name
# - cluster_endpoint
# - rds_endpoint
# - vpc_id
```

### Step 4: Configure kubectl

```bash
# Get cluster name from Terraform output
CLUSTER_NAME=$(terraform output -raw cluster_name)
AWS_REGION="us-east-1"

# Update kubeconfig
aws eks update-kubeconfig \
  --name $CLUSTER_NAME \
  --region $AWS_REGION

# Verify connection
kubectl get nodes

# Expected output:
# NAME                         STATUS   ROLES    AGE   VERSION
# ip-10-0-2-147.ec2.internal   Ready    <none>   5m    v1.31.x
# ip-10-0-3-232.ec2.internal   Ready    <none>   5m    v1.31.x
```

---

## 4. Application Deployment

### Step 1: Install AWS Load Balancer Controller

```bash
# Add Helm repo
helm repo add eks https://aws.github.io/eks-charts
helm repo update

# Get cluster details
CLUSTER_NAME=$(terraform output -raw cluster_name)
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
VPC_ID=$(terraform output -raw vpc_id)

# Install AWS Load Balancer Controller
helm install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=$CLUSTER_NAME \
  --set serviceAccount.create=true \
  --set serviceAccount.name=aws-load-balancer-controller \
  --set region=$AWS_REGION \
  --set vpcId=$VPC_ID

# Verify installation
kubectl get deployment -n kube-system aws-load-balancer-controller
kubectl get pods -n kube-system -l app.kubernetes.io/name=aws-load-balancer-controller
```

### Step 2: Install Metrics Server

```bash
# Install Metrics Server for HPA
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml

# Verify
kubectl get deployment metrics-server -n kube-system
```

### Step 3: Install Karpenter (Node Autoscaling)

```bash
# Get Karpenter IAM role ARN
KARPENTER_ROLE_ARN=$(terraform output -raw karpenter_irsa_role_arn)

# Add Helm repo
helm repo add karpenter https://charts.karpenter.sh
helm repo update

# Install Karpenter
helm install karpenter karpenter/karpenter \
  --namespace karpenter \
  --create-namespace \
  --set serviceAccount.annotations."eks\.amazonaws\.com/role-arn"=$KARPENTER_ROLE_ARN \
  --set settings.clusterName=$CLUSTER_NAME \
  --set settings.clusterEndpoint=$(terraform output -raw cluster_endpoint) \
  --set settings.defaultInstanceProfile=KarpenterNodeInstanceProfile-$CLUSTER_NAME \
  --wait

# Apply Karpenter NodePool
kubectl apply -f ../../../kubernetes/karpenter/nodepool.yaml

# Verify
kubectl get pods -n karpenter
kubectl get nodepools
```

### Step 4: Build and Push Docker Images

```bash
cd ../../..  # Back to project root

# Login to ECR
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION="us-east-1"

aws ecr get-login-password --region $AWS_REGION | \
  docker login --username AWS --password-stdin \
  $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Build and push frontend
cd applications/frontend
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/frontend:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/frontend:latest

# Build and push events-api
cd ../events-api
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api:latest

# Build and push notification-service
cd ../notification-service
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/notification-service:latest .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/notification-service:latest

cd ../..
```

### Step 5: Create Kubernetes Secrets

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(cd terraform/environments/dev && terraform output -raw rds_endpoint)

# Create namespace
kubectl create namespace campus-events

# Create database secret
kubectl create secret generic db-credentials \
  --from-literal=DB_HOST=$RDS_ENDPOINT \
  --from-literal=DB_PORT=5432 \
  --from-literal=DB_NAME=campusevents \
  --from-literal=DB_USER=dbadmin \
  --from-literal=DB_PASSWORD='YOUR_SECURE_PASSWORD' \
  --namespace campus-events

# Verify
kubectl get secrets -n campus-events
```

### Step 6: Initialize Database Schema

```bash
# Create a temporary pod to run migrations
kubectl run -it --rm db-init \
  --image=postgres:16 \
  --restart=Never \
  --namespace=campus-events \
  --env="PGPASSWORD=YOUR_SECURE_PASSWORD" \
  -- psql -h $RDS_ENDPOINT -U dbadmin -d campusevents < docs/DATABASE_SCHEMA.sql

# Or connect from local machine if you have PostgreSQL client
PGPASSWORD='YOUR_SECURE_PASSWORD' psql \
  -h $RDS_ENDPOINT \
  -U dbadmin \
  -d campusevents \
  -f docs/DATABASE_SCHEMA.sql
```

### Step 7: Deploy Applications

```bash
# Update image references in Kustomization
cd kubernetes/overlays/dev

# Edit kustomization.yaml with your AWS account ID
export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Deploy using Kustomize
kubectl apply -k .

# Verify deployments
kubectl get deployments -n campus-events
kubectl get pods -n campus-events
kubectl get services -n campus-events

# Expected output:
# NAME                       READY   STATUS    AGE
# dev-events-api            2/2     Running   2m
# dev-notification-service  2/2     Running   2m
# frontend                  2/2     Running   2m
```

### Step 8: Create Ingress

```bash
# Apply ingress configuration
kubectl apply -f kubernetes/ingress/alb-ingress.yaml

# Wait for ALB to be provisioned (5-10 minutes)
kubectl get ingress -n campus-events -w

# Get ALB URL
kubectl get ingress campus-events-ingress -n campus-events \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Save this URL - this is your application endpoint!
```

---

## 5. Monitoring Setup

### Step 1: Install Prometheus Stack

```bash
# Add Helm repo
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Create monitoring namespace
kubectl create namespace monitoring

# Install kube-prometheus-stack
helm install kube-prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set prometheus.prometheusSpec.retention=15d \
  --set prometheus.prometheusSpec.storageSpec.volumeClaimTemplate.spec.resources.requests.storage=50Gi \
  --set grafana.adminPassword='YOUR_GRAFANA_PASSWORD' \
  --wait

# Verify installation
kubectl get pods -n monitoring
```

### Step 2: Configure ServiceMonitors

```bash
# Apply application ServiceMonitors
kubectl apply -f kubernetes/monitoring/servicemonitors/

# Verify Prometheus is scraping targets
kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090

# Open http://localhost:9090/targets in browser
```

### Step 3: Access Grafana

```bash
# Create LoadBalancer service for Grafana
kubectl apply -f kubernetes/monitoring/grafana-lb-service.yaml

# Get Grafana URL
kubectl get svc -n monitoring grafana-external \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'

# Access Grafana
# URL: http://<grafana-lb-url>
# Username: admin
# Password: YOUR_GRAFANA_PASSWORD

# Import dashboards from kubernetes/monitoring/dashboards/
```

---

## 6. Verification & Testing

### Health Checks

```bash
# Get ALB URL
ALB_URL=$(kubectl get ingress campus-events-ingress -n campus-events \
  -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

# Test health endpoints
curl http://$ALB_URL/health
curl http://$ALB_URL/api/v1/health

# Expected response:
# {"status":"healthy","timestamp":"2025-12-10T...","database":"connected"}
```

### Functional Testing

```bash
# Test frontend
curl http://$ALB_URL/

# Test events API - Get events
curl http://$ALB_URL/api/v1/events

# Test events API - Create event
curl -X POST http://$ALB_URL/api/v1/events \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "description": "Testing deployment",
    "start_time": "2025-12-15T14:00:00Z",
    "end_time": "2025-12-15T16:00:00Z",
    "location": "Test Location",
    "category": "Workshop",
    "max_attendees": 50
  }'

# Get event details
EVENT_ID="<id-from-previous-response>"
curl http://$ALB_URL/api/v1/events/$EVENT_ID

# Create RSVP
curl -X POST http://$ALB_URL/api/v1/events/$EVENT_ID/rsvp \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com"
  }'
```

### Monitor Logs

```bash
# View application logs
kubectl logs -n campus-events -l app=events-api --tail=100 -f
kubectl logs -n campus-events -l app=frontend --tail=100 -f
kubectl logs -n campus-events -l app=notification-service --tail=100 -f

# View pod events
kubectl get events -n campus-events --sort-by='.lastTimestamp'
```

### Verify Autoscaling

```bash
# Check HPA status
kubectl get hpa -n campus-events

# Generate load (optional)
# Install hey: brew install hey
hey -z 60s -c 50 http://$ALB_URL/api/v1/events

# Watch HPA scale up
kubectl get hpa -n campus-events -w

# Watch pods scale
kubectl get pods -n campus-events -w
```

---

## 7. Troubleshooting

### Common Issues

#### Issue: Pods Stuck in Pending State

```bash
# Check pod status
kubectl describe pod <pod-name> -n campus-events

# Common causes:
# 1. Insufficient cluster resources
kubectl get nodes
kubectl top nodes

# 2. Image pull errors
kubectl get events -n campus-events | grep -i error

# 3. PVC issues
kubectl get pvc -n campus-events

# Solution: Scale nodes or check Karpenter
kubectl get nodepools
kubectl logs -n karpenter -l app.kubernetes.io/name=karpenter -f
```

#### Issue: ALB Not Creating

```bash
# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller

# Check ingress events
kubectl describe ingress campus-events-ingress -n campus-events

# Common causes:
# 1. IAM permissions missing
# 2. Subnets not tagged correctly
# 3. Security group issues

# Verify subnet tags
aws ec2 describe-subnets --filters "Name=vpc-id,Values=$VPC_ID" \
  --query 'Subnets[*].[SubnetId,Tags]'

# Required tags:
# kubernetes.io/role/elb=1 (public subnets)
# kubernetes.io/cluster/<cluster-name>=owned or shared
```

#### Issue: Database Connection Errors

```bash
# Check database secret
kubectl get secret db-credentials -n campus-events -o yaml

# Test database connectivity from pod
kubectl run -it --rm db-test \
  --image=postgres:16 \
  --restart=Never \
  --namespace=campus-events \
  --env="PGPASSWORD=YOUR_PASSWORD" \
  -- psql -h $RDS_ENDPOINT -U dbadmin -d campusevents -c "SELECT 1;"

# Check RDS security group
# Must allow inbound from EKS worker nodes on port 5432
```

#### Issue: High Pod Memory/CPU Usage

```bash
# Check resource usage
kubectl top pods -n campus-events

# Check resource limits
kubectl get pods -n campus-events -o yaml | grep -A 5 resources

# Adjust resource limits in kubernetes/base/deployments/
# Then reapply:
kubectl apply -k kubernetes/overlays/dev/
```

### Debugging Commands

```bash
# Get all resources in namespace
kubectl get all -n campus-events

# Describe all pods
kubectl describe pods -n campus-events

# Check recent events
kubectl get events -n campus-events --sort-by='.lastTimestamp' | tail -20

# Check pod logs
kubectl logs <pod-name> -n campus-events --previous  # Previous container
kubectl logs <pod-name> -n campus-events -f  # Follow logs

# Execute commands in pod
kubectl exec -it <pod-name> -n campus-events -- /bin/sh

# Check service endpoints
kubectl get endpoints -n campus-events

# Check network policies
kubectl get networkpolicies -n campus-events
kubectl describe networkpolicy <policy-name> -n campus-events
```

---

## 8. Maintenance Operations

### Updating Applications

```bash
# Build new image with version tag
cd applications/events-api
docker build -t $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api:v1.1.0 .
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api:v1.1.0

# Update deployment
kubectl set image deployment/dev-events-api \
  events-api=$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api:v1.1.0 \
  -n campus-events

# Watch rollout
kubectl rollout status deployment/dev-events-api -n campus-events

# Rollback if needed
kubectl rollout undo deployment/dev-events-api -n campus-events
kubectl rollout history deployment/dev-events-api -n campus-events
```

### Scaling

```bash
# Manual scaling (overrides HPA)
kubectl scale deployment dev-events-api --replicas=5 -n campus-events

# Update HPA limits
kubectl edit hpa events-api-hpa -n campus-events

# Scale nodes (will trigger Karpenter)
# Increase pod replicas and Karpenter will add nodes automatically
```

### Backup and Restore

```bash
# RDS Automated Backups (configured in Terraform)
# - Daily automated snapshots
# - 7-day retention
# - Point-in-time recovery available

# Create manual snapshot
aws rds create-db-snapshot \
  --db-instance-identifier campus-events-dev-db \
  --db-snapshot-identifier campus-events-manual-$(date +%Y%m%d)

# List snapshots
aws rds describe-db-snapshots \
  --db-instance-identifier campus-events-dev-db

# Restore from snapshot (requires Terraform update)
# Update terraform/environments/dev/main.tf with snapshot_identifier
# Then run: terraform apply
```

### Monitoring Maintenance

```bash
# Prune old Prometheus data (done automatically with retention policy)

# Update Grafana dashboards
kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80
# Access http://localhost:3000
# Import updated dashboards via UI

# Backup Grafana dashboards
kubectl get configmaps -n monitoring -l app.kubernetes.io/name=grafana -o yaml > grafana-dashboards-backup.yaml
```

### Clean Up (Destroy Environment)

```bash
# WARNING: This will delete all resources!

# Delete Kubernetes resources
kubectl delete namespace campus-events
kubectl delete namespace monitoring
kubectl delete namespace karpenter

# Delete Helm releases
helm uninstall aws-load-balancer-controller -n kube-system
helm uninstall kube-prom-stack -n monitoring
helm uninstall karpenter -n karpenter

# Destroy infrastructure
cd terraform/environments/dev
terraform destroy

# Confirm with: yes

# Delete ECR images (optional)
aws ecr delete-repository --repository-name campus-events/frontend --force
aws ecr delete-repository --repository-name campus-events/events-api --force
aws ecr delete-repository --repository-name campus-events/notification-service --force
```

---

## Next Steps

After successful deployment:

1. **Configure DNS**: Point custom domain to ALB
2. **Setup SSL/TLS**: Use AWS Certificate Manager
3. **Configure Monitoring Alerts**: Setup PagerDuty/Slack integration
4. **Implement Backups**: Regular RDS snapshots and testing
5. **Security Hardening**: Enable WAF, GuardDuty, Security Hub
6. **Documentation**: Update runbooks and on-call procedures

---

## Support

For issues or questions:
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- Review [docs/](docs/) for additional guides
- Check application logs: `kubectl logs -n campus-events <pod-name>`
- Check GitHub Issues

---

**Last Updated**: December 10, 2025  
**Version**: 1.0  
**Status**: Production Ready ✅
