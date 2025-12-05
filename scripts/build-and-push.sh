#!/bin/bash
# Build and push Docker images to ECR
# Usage: ./scripts/build-and-push.sh [IMAGE_TAG]

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
ECR_REGISTRY="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"
IMAGE_TAG=${1:-latest}

echo "=================================================="
echo "Building and Pushing Docker Images"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "ECR Registry: $ECR_REGISTRY"
echo "Image Tag: $IMAGE_TAG"
echo "=================================================="

# Login to ECR
echo ""
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$ECR_REGISTRY"
echo "✅ Logged in to ECR"

# Build and push frontend
echo ""
echo "Building frontend..."
cd applications/frontend
docker build -t "$ECR_REGISTRY/campus-events/frontend:$IMAGE_TAG" .
docker tag "$ECR_REGISTRY/campus-events/frontend:$IMAGE_TAG" "$ECR_REGISTRY/campus-events/frontend:latest"
echo "✅ Frontend built"

echo "Pushing frontend..."
docker push "$ECR_REGISTRY/campus-events/frontend:$IMAGE_TAG"
docker push "$ECR_REGISTRY/campus-events/frontend:latest"
echo "✅ Frontend pushed"
cd ../..

# Build and push events-api
echo ""
echo "Building events-api..."
cd applications/events-api
docker build -t "$ECR_REGISTRY/campus-events/events-api:$IMAGE_TAG" .
docker tag "$ECR_REGISTRY/campus-events/events-api:$IMAGE_TAG" "$ECR_REGISTRY/campus-events/events-api:latest"
echo "✅ Events API built"

echo "Pushing events-api..."
docker push "$ECR_REGISTRY/campus-events/events-api:$IMAGE_TAG"
docker push "$ECR_REGISTRY/campus-events/events-api:latest"
echo "✅ Events API pushed"
cd ../..

# Build and push notification-service
echo ""
echo "Building notification-service..."
cd applications/notification-service
docker build -t "$ECR_REGISTRY/campus-events/notification-service:$IMAGE_TAG" .
docker tag "$ECR_REGISTRY/campus-events/notification-service:$IMAGE_TAG" "$ECR_REGISTRY/campus-events/notification-service:latest"
echo "✅ Notification Service built"

echo "Pushing notification-service..."
docker push "$ECR_REGISTRY/campus-events/notification-service:$IMAGE_TAG"
docker push "$ECR_REGISTRY/campus-events/notification-service:latest"
echo "✅ Notification Service pushed"
cd ../..

echo ""
echo "=================================================="
echo "✅ All Images Built and Pushed Successfully!"
echo "=================================================="
echo ""
echo "Images:"
echo "  $ECR_REGISTRY/campus-events/frontend:$IMAGE_TAG"
echo "  $ECR_REGISTRY/campus-events/events-api:$IMAGE_TAG"
echo "  $ECR_REGISTRY/campus-events/notification-service:$IMAGE_TAG"
echo ""
