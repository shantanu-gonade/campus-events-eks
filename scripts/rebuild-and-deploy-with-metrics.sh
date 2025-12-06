#!/bin/bash
set -e

echo "=========================================="
echo "Rebuilding Docker Images with Metrics"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="842819994894"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
PROJECT_NAME="campus-events"

echo "Configuration:"
echo "  AWS Region: $AWS_REGION"
echo "  AWS Account: $AWS_ACCOUNT_ID"
echo "  ECR Registry: $ECR_REGISTRY"
echo ""

# Step 1: Login to ECR
echo "Step 1: Logging in to ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY
echo -e "${GREEN}✓${NC} Logged in to ECR"
echo ""

# Step 2: Build Events API
echo "Step 2: Building Events API image..."
cd applications/events-api
docker build --platform linux/amd64 -t ${ECR_REGISTRY}/${PROJECT_NAME}/events-api:latest .
docker tag ${ECR_REGISTRY}/${PROJECT_NAME}/events-api:latest ${ECR_REGISTRY}/${PROJECT_NAME}/events-api:$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✓${NC} Events API image built"
cd ../..
echo ""

# Step 3: Build Notification Service
echo "Step 3: Building Notification Service image..."
cd applications/notification-service
docker build --platform linux/amd64 -t ${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:latest .
docker tag ${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:latest ${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✓${NC} Notification Service image built"
cd ../..
echo ""

# Step 4: Build Frontend
echo "Step 4: Building Frontend image..."
cd applications/frontend
docker build --platform linux/amd64 -t ${ECR_REGISTRY}/${PROJECT_NAME}/frontend:latest .
docker tag ${ECR_REGISTRY}/${PROJECT_NAME}/frontend:latest ${ECR_REGISTRY}/${PROJECT_NAME}/frontend:$(date +%Y%m%d-%H%M%S)
echo -e "${GREEN}✓${NC} Frontend image built"
cd ../..
echo ""

# Step 5: Push Events API
echo "Step 5: Pushing Events API image to ECR..."
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/events-api:latest
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/events-api:$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo -e "${GREEN}✓${NC} Events API image pushed"
echo ""

# Step 6: Push Notification Service
echo "Step 6: Pushing Notification Service image to ECR..."
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:latest
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo -e "${GREEN}✓${NC} Notification Service image pushed"
echo ""

# Step 7: Push Frontend
echo "Step 7: Pushing Frontend image to ECR..."
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/frontend:latest
docker push ${ECR_REGISTRY}/${PROJECT_NAME}/frontend:$(date +%Y%m%d-%H%M%S) 2>/dev/null || true
echo -e "${GREEN}✓${NC} Frontend image pushed"
echo ""

# Step 8: Restart deployments to pull new images
echo "Step 8: Restarting deployments to use new images..."
kubectl rollout restart deployment/dev-events-api -n campus-events --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
kubectl rollout restart deployment/dev-notification-service -n campus-events --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
kubectl rollout restart deployment/frontend -n campus-events --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
echo -e "${GREEN}✓${NC} Deployments restarted"
echo ""

# Step 9: Wait for rollout to complete
echo "Step 9: Waiting for deployments to roll out..."
echo "  Waiting for Events API..."
kubectl rollout status deployment/dev-events-api -n campus-events --timeout=5m --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
echo "  Waiting for Notification Service..."
kubectl rollout status deployment/dev-notification-service -n campus-events --timeout=5m --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
echo "  Waiting for Frontend..."
kubectl rollout status deployment/frontend -n campus-events --timeout=5m --context=arn:aws:eks:us-east-1:842819994894:cluster/campus-events-dev
echo -e "${GREEN}✓${NC} All deployments rolled out successfully"
echo ""

# Step 10: Wait for Prometheus to scrape
echo "Step 10: Waiting for Prometheus to discover new metrics (60 seconds)..."
sleep 60
echo -e "${GREEN}✓${NC} Wait complete"
echo ""

echo "=========================================="
echo "✅ Images Rebuilt and Deployed!"
echo "=========================================="
echo ""
echo "Verification:"
echo "1. Check Prometheus targets:"
echo "   kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090"
echo "   Visit: http://localhost:9090/targets"
echo ""
echo "2. Check metrics endpoints directly:"
echo "   kubectl run test --image=curlimages/curl --rm -it --restart=Never -n campus-events \\"
echo "     -- curl http://events-api-service:8080/metrics"
echo ""
echo "3. Check pod logs for metrics initialization:"
echo "   kubectl logs -n campus-events -l app=events-api --tail=20"
echo ""
