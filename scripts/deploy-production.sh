#!/bin/bash
# ============================================================================
# PRODUCTION DEPLOYMENT SCRIPT - Week 5 Complete (FIXED)
# ============================================================================
# This script builds, pushes, and deploys the updated application to EKS
# with all Week 5 fixes for database, analytics, and frontend
# ============================================================================

set -e

echo "🚀 Production Deployment - Week 5 Complete"
echo "==========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
AWS_REGION="us-east-1"
AWS_ACCOUNT_ID="842819994894"
ECR_REGISTRY="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"
PROJECT_NAME="campus-events"
VERSION="v3.1"

# Image names
FRONTEND_IMAGE="${ECR_REGISTRY}/${PROJECT_NAME}/frontend:${VERSION}"
BACKEND_IMAGE="${ECR_REGISTRY}/${PROJECT_NAME}/events-api:${VERSION}"
NOTIFICATION_IMAGE="${ECR_REGISTRY}/${PROJECT_NAME}/notification-service:${VERSION}"

PROJECT_ROOT="/Users/shantanugonade/Developement/project"

echo "Configuration:"
echo "  Region: $AWS_REGION"
echo "  Account: $AWS_ACCOUNT_ID"
echo "  Version: $VERSION"
echo ""

# Step 1: Connect to EKS cluster first to check resources
echo "Step 1: Connecting to EKS cluster..."
aws eks update-kubeconfig --region $AWS_REGION --name campus-events-dev

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Connected to EKS cluster${NC}"
else
    echo -e "${RED}❌ Failed to connect to EKS cluster${NC}"
    exit 1
fi
echo ""

# Step 2: Check existing deployments
echo "Step 2: Checking existing deployments..."
echo "Current deployments in campus-events namespace:"
kubectl get deployments -n campus-events

echo ""
echo "Available namespaces:"
kubectl get namespaces | grep campus

echo ""
read -p "Continue with deployment? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 1
fi
echo ""

# Step 3: Login to ECR
echo "Step 3: Logging into ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ ECR login successful${NC}"
else
    echo -e "${RED}❌ ECR login failed${NC}"
    exit 1
fi
echo ""

# Step 4: Build Frontend
echo "Step 4: Building Frontend..."
cd "$PROJECT_ROOT/applications/frontend"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
fi

# Build production bundle
echo "Building production bundle..."
npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build successful${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Build Docker image
echo "Building frontend Docker image..."
docker build -t $FRONTEND_IMAGE .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend image built${NC}"
else
    echo -e "${RED}❌ Frontend image build failed${NC}"
    exit 1
fi
echo ""

# Step 5: Build Backend (Events API)
echo "Step 5: Building Backend (Events API)..."
cd "$PROJECT_ROOT/applications/events-api"

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing backend dependencies..."
    npm install
fi

# Build Docker image
echo "Building backend Docker image..."
docker build -t $BACKEND_IMAGE .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend image built${NC}"
else
    echo -e "${RED}❌ Backend image build failed${NC}"
    exit 1
fi
echo ""

# Step 6: Build Notification Service
echo "Step 6: Building Notification Service..."
cd "$PROJECT_ROOT/applications/notification-service"

# Build Docker image
echo "Building notification service Docker image..."
docker build -t $NOTIFICATION_IMAGE .

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Notification service image built${NC}"
else
    echo -e "${RED}❌ Notification service image build failed${NC}"
    exit 1
fi
echo ""

# Step 7: Push Images to ECR
echo "Step 7: Pushing images to ECR..."

echo "Pushing frontend..."
docker push $FRONTEND_IMAGE
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend pushed${NC}"
else
    echo -e "${RED}❌ Frontend push failed${NC}"
    exit 1
fi

echo "Pushing backend..."
docker push $BACKEND_IMAGE
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Backend pushed${NC}"
else
    echo -e "${RED}❌ Backend push failed${NC}"
    exit 1
fi

echo "Pushing notification service..."
docker push $NOTIFICATION_IMAGE
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Notification service pushed${NC}"
else
    echo -e "${RED}❌ Notification service push failed${NC}"
    exit 1
fi
echo ""

# Step 8: Detect actual deployment names
echo "Step 8: Detecting deployment names..."

# Try to find deployments
FRONTEND_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i frontend | head -1)
BACKEND_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i "api\|backend" | head -1)
NOTIFICATION_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i notification | head -1)

echo "Found deployments:"
echo "  Frontend: $FRONTEND_DEPLOY"
echo "  Backend: $BACKEND_DEPLOY"
echo "  Notification: $NOTIFICATION_DEPLOY"
echo ""

if [ -z "$FRONTEND_DEPLOY" ] || [ -z "$BACKEND_DEPLOY" ] || [ -z "$NOTIFICATION_DEPLOY" ]; then
    echo -e "${YELLOW}⚠️  Some deployments not found. Trying to apply manifests...${NC}"
    
    # Try applying kustomize
    if [ -d "$PROJECT_ROOT/kubernetes/overlays/dev" ]; then
        echo "Applying Kustomize manifests..."
        kubectl apply -k "$PROJECT_ROOT/kubernetes/overlays/dev"
    else
        echo -e "${RED}❌ No deployment manifests found${NC}"
        exit 1
    fi
    
    # Wait for deployments to be created
    echo "Waiting for deployments to be created..."
    sleep 10
    
    # Retry detection
    FRONTEND_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i frontend | head -1)
    BACKEND_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i "api\|backend" | head -1)
    NOTIFICATION_DEPLOY=$(kubectl get deployment -n campus-events -o name | grep -i notification | head -1)
fi

# Step 9: Update Deployments
echo "Step 9: Updating Kubernetes deployments..."

if [ ! -z "$FRONTEND_DEPLOY" ]; then
    echo "Updating frontend deployment..."
    FRONTEND_NAME=$(echo $FRONTEND_DEPLOY | cut -d'/' -f2)
    kubectl set image deployment/$FRONTEND_NAME frontend=$FRONTEND_IMAGE -n campus-events
    echo -e "${GREEN}✅ Frontend updated${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend deployment not found${NC}"
fi

if [ ! -z "$BACKEND_DEPLOY" ]; then
    echo "Updating backend deployment..."
    BACKEND_NAME=$(echo $BACKEND_DEPLOY | cut -d'/' -f2)
    # Get container name from deployment
    BACKEND_CONTAINER=$(kubectl get deployment/$BACKEND_NAME -n campus-events -o jsonpath='{.spec.template.spec.containers[0].name}')
    kubectl set image deployment/$BACKEND_NAME $BACKEND_CONTAINER=$BACKEND_IMAGE -n campus-events
    echo -e "${GREEN}✅ Backend updated${NC}"
else
    echo -e "${YELLOW}⚠️  Backend deployment not found${NC}"
fi

if [ ! -z "$NOTIFICATION_DEPLOY" ]; then
    echo "Updating notification service deployment..."
    NOTIFICATION_NAME=$(echo $NOTIFICATION_DEPLOY | cut -d'/' -f2)
    # Get container name from deployment
    NOTIFICATION_CONTAINER=$(kubectl get deployment/$NOTIFICATION_NAME -n campus-events -o jsonpath='{.spec.template.spec.containers[0].name}')
    kubectl set image deployment/$NOTIFICATION_NAME $NOTIFICATION_CONTAINER=$NOTIFICATION_IMAGE -n campus-events
    echo -e "${GREEN}✅ Notification service updated${NC}"
else
    echo -e "${YELLOW}⚠️  Notification deployment not found${NC}"
fi

echo ""

# Step 10: Wait for rollout to complete
echo "Step 10: Waiting for rollout to complete..."

if [ ! -z "$FRONTEND_NAME" ]; then
    echo "Waiting for frontend..."
    kubectl rollout status deployment/$FRONTEND_NAME -n campus-events --timeout=5m || echo "Frontend rollout timeout"
fi

if [ ! -z "$BACKEND_NAME" ]; then
    echo "Waiting for backend..."
    kubectl rollout status deployment/$BACKEND_NAME -n campus-events --timeout=5m || echo "Backend rollout timeout"
fi

if [ ! -z "$NOTIFICATION_NAME" ]; then
    echo "Waiting for notification service..."
    kubectl rollout status deployment/$NOTIFICATION_NAME -n campus-events --timeout=5m || echo "Notification rollout timeout"
fi

echo ""

# Step 11: Verify deployment
echo "Step 11: Verifying deployment..."

echo "Pod status:"
kubectl get pods -n campus-events

echo ""
echo "Service status:"
kubectl get svc -n campus-events

echo ""
echo "Ingress status:"
kubectl get ingress -n campus-events

echo ""

# Step 12: Get Application URL
echo "Step 12: Application URL..."
INGRESS_URL=$(kubectl get ingress -n campus-events -o jsonpath='{.items[0].status.loadBalancer.ingress[0].hostname}' 2>/dev/null || echo "Pending...")

if [ "$INGRESS_URL" != "Pending..." ] && [ ! -z "$INGRESS_URL" ]; then
    echo -e "${GREEN}✅ Application URL: http://${INGRESS_URL}${NC}"
else
    echo -e "${YELLOW}⏳ Ingress URL pending... Check status with:${NC}"
    echo "   kubectl get ingress -n campus-events"
fi
echo ""

# Summary
echo "================================================"
echo -e "${GREEN}✅ DEPLOYMENT COMPLETE!${NC}"
echo "================================================"
echo ""
echo "Images Deployed:"
echo "  Frontend:     $FRONTEND_IMAGE"
echo "  Backend:      $BACKEND_IMAGE"
echo "  Notification: $NOTIFICATION_IMAGE"
echo ""
echo "Verification Commands:"
echo "  kubectl get pods -n campus-events"
echo "  kubectl logs -f deployment/$BACKEND_NAME -n campus-events"
echo "  kubectl logs -f deployment/$FRONTEND_NAME -n campus-events"
echo ""
echo "Access Application:"
if [ "$INGRESS_URL" != "Pending..." ] && [ ! -z "$INGRESS_URL" ]; then
    echo "  http://${INGRESS_URL}"
else
    echo "  kubectl get ingress -n campus-events"
fi
echo ""
