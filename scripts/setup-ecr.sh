#!/bin/bash
# Setup ECR repositories for Campus Events project
# This script creates all required ECR repositories with security best practices

set -e

AWS_REGION=${AWS_REGION:-us-east-1}
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=================================================="
echo "Setting up ECR Repositories"
echo "AWS Account: $AWS_ACCOUNT_ID"
echo "AWS Region: $AWS_REGION"
echo "=================================================="

# Function to create ECR repository
create_repository() {
    local repo_name=$1
    
    echo ""
    echo "Creating repository: $repo_name"
    
    # Check if repository already exists
    if aws ecr describe-repositories --repository-names "$repo_name" --region "$AWS_REGION" 2>/dev/null; then
        echo "✅ Repository $repo_name already exists"
    else
        # Create repository with security settings
        aws ecr create-repository \
            --repository-name "$repo_name" \
            --image-scanning-configuration scanOnPush=true \
            --encryption-configuration encryptionType=AES256 \
            --region "$AWS_REGION"
        
        echo "✅ Created repository: $repo_name"
    fi
    
    # Set lifecycle policy to keep last 10 images
    aws ecr put-lifecycle-policy \
        --repository-name "$repo_name" \
        --lifecycle-policy-text '{
            "rules": [
                {
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
                }
            ]
        }' \
        --region "$AWS_REGION" > /dev/null
    
    echo "✅ Lifecycle policy applied to $repo_name"
}

# Create repositories for all services
create_repository "campus-events/frontend"
create_repository "campus-events/events-api"
create_repository "campus-events/notification-service"

echo ""
echo "=================================================="
echo "✅ ECR Setup Complete!"
echo "=================================================="
echo ""
echo "Repository URLs:"
echo "  Frontend: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/frontend"
echo "  Events API: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/events-api"
echo "  Notification Service: $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/campus-events/notification-service"
echo ""
echo "Next steps:"
echo "  1. Run ./scripts/build-and-push.sh to build and push images"
echo "  2. Configure GitHub Actions secrets (AWS_ACCOUNT_ID)"
echo ""
