# GitHub Actions CI/CD

## 🎯 Overview

This directory contains GitHub Actions workflows for automating the CI/CD pipeline of the Campus Events Management System. The pipelines handle building, testing, scanning, and deploying Docker images to Amazon ECR.

## 🏗️ CI/CD Architecture

```
Git Push → GitHub Actions → Build Images → Security Scan → Push to ECR → Deploy to EKS
```

### Key Features

- **Automated Builds**: Triggered on push to main branch
- **Multi-Service Support**: Builds all three microservices in parallel
- **Security Scanning**: Trivy vulnerability scanning for all images
- **AWS OIDC**: Secure authentication without long-lived credentials
- **ECR Integration**: Automatic push to Amazon Elastic Container Registry
- **Deployment Automation**: Updates Kubernetes manifests with new image tags
- **Matrix Builds**: Parallel execution for faster CI/CD

## 📁 Directory Structure

```
.github/
├── workflows/                      # GitHub Actions workflows
│   ├── build-and-push.yml         # Main CI/CD pipeline
│   ├── deploy-to-eks.yml          # EKS deployment workflow
│   ├── security-scan.yml          # Standalone security scanning
│   ├── lint-and-test.yml          # Code quality checks
│   └── cleanup-old-images.yml     # ECR cleanup workflow
├── actions/                        # Custom composite actions
│   ├── setup-aws/                 # AWS configuration action
│   │   └── action.yml
│   └── build-docker/              # Docker build action
│       └── action.yml
├── scripts/                        # CI/CD helper scripts
│   ├── update-image-tags.sh       # Update Kustomize image tags
│   └── notify-deployment.sh       # Send deployment notifications
└── README.md                       # This file
```

## 🚀 Main Workflow: Build and Push

### Workflow File: `build-and-push.yml`

```yaml
name: Build and Push to ECR

on:
  push:
    branches:
      - main
    paths:
      - 'applications/**'
      - '.github/workflows/build-and-push.yml'
  workflow_dispatch:

env:
  AWS_REGION: us-east-1
  ECR_REGISTRY: <account-id>.dkr.ecr.us-east-1.amazonaws.com

jobs:
  build-and-push:
    name: Build and Push ${{ matrix.service }}
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    strategy:
      matrix:
        service:
          - frontend
          - events-api
          - notification-service
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v2
      
      - name: Extract metadata
        id: meta
        run: |
          echo "sha_short=$(git rev-parse --short HEAD)" >> $GITHUB_OUTPUT
          echo "timestamp=$(date +%s)" >> $GITHUB_OUTPUT
      
      - name: Build Docker image
        working-directory: applications/${{ matrix.service }}
        run: |
          docker build \
            -t ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:${{ steps.meta.outputs.sha_short }} \
            -t ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest \
            .
      
      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest
          format: 'sarif'
          output: 'trivy-results.sarif'
          severity: 'CRITICAL,HIGH'
      
      - name: Upload Trivy results to GitHub Security
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'
      
      - name: Push image to ECR
        run: |
          docker push ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:${{ steps.meta.outputs.sha_short }}
          docker push ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest
      
      - name: Update deployment manifest
        run: |
          cd kubernetes/overlays/dev
          kustomize edit set image ${{ matrix.service }}=${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:${{ steps.meta.outputs.sha_short }}
```

### Workflow Triggers

| Trigger | Condition |
|---------|-----------|
| **Push** | Commits to `main` branch in `applications/` directory |
| **Workflow Dispatch** | Manual trigger from GitHub UI |
| **Pull Request** | Optional - uncomment in workflow file |

## 🔐 AWS OIDC Authentication

### Benefits

- **No Long-lived Credentials**: No AWS access keys stored in GitHub
- **Automatic Rotation**: Temporary credentials expire automatically
- **Audit Trail**: All actions logged in CloudTrail
- **Least Privilege**: Role can be scoped to specific actions

### Setup Steps

1. **Create IAM OIDC Identity Provider**

```bash
aws iam create-open-id-connect-provider \
  --url https://token.actions.githubusercontent.com \
  --client-id-list sts.amazonaws.com \
  --thumbprint-list 6938fd4d98bab03faadb97b34396831e3780aea1
```

2. **Create IAM Role**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::<account-id>:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:<org>/<repo>:ref:refs/heads/main"
        }
      }
    }
  ]
}
```

3. **Attach Policy to Role**

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:GetAuthorizationToken",
        "ecr:BatchCheckLayerAvailability",
        "ecr:GetDownloadUrlForLayer",
        "ecr:BatchGetImage",
        "ecr:PutImage",
        "ecr:InitiateLayerUpload",
        "ecr:UploadLayerPart",
        "ecr:CompleteLayerUpload"
      ],
      "Resource": "*"
    }
  ]
}
```

4. **Add Secret to GitHub**

```bash
# In GitHub repository settings → Secrets → Actions
Name: AWS_ROLE_ARN
Value: arn:aws:iam::<account-id>:role/GitHubActionsECRRole
```

## 🔍 Security Scanning

### Trivy Vulnerability Scanner

Trivy scans Docker images for:
- OS package vulnerabilities
- Application dependency vulnerabilities
- IaC misconfigurations
- Secret detection

**Configuration:**
```yaml
- name: Run Trivy vulnerability scanner
  uses: aquasecurity/trivy-action@master
  with:
    image-ref: ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest
    format: 'table'  # or 'sarif', 'json'
    severity: 'CRITICAL,HIGH,MEDIUM'
    exit-code: '1'  # Fail build on findings
    ignore-unfixed: true  # Ignore unfixed vulnerabilities
```

**Scan Results:**
- Results uploaded to GitHub Security tab
- SARIF format for integration with GitHub Code Scanning
- Notifications sent for critical findings

### Alternative Scanners

```yaml
# Snyk
- name: Run Snyk to check for vulnerabilities
  uses: snyk/actions/docker@master
  with:
    image: ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest
    args: --severity-threshold=high

# Grype
- name: Scan image with Grype
  uses: anchore/scan-action@v3
  with:
    image: ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest
    fail-build: true
    severity-cutoff: high
```

## 📦 Matrix Strategy

Build all services in parallel using matrix strategy:

```yaml
strategy:
  matrix:
    service:
      - frontend
      - events-api
      - notification-service
    include:
      - service: frontend
        dockerfile: Dockerfile
        context: applications/frontend
      - service: events-api
        dockerfile: Dockerfile
        context: applications/events-api
      - service: notification-service
        dockerfile: Dockerfile
        context: applications/notification-service
  
  fail-fast: false  # Continue even if one service fails
```

**Benefits:**
- Parallel execution (3x faster)
- Independent service builds
- Isolated failure handling
- Resource optimization

## 🚀 Deployment Workflow

### Workflow File: `deploy-to-eks.yml`

```yaml
name: Deploy to EKS

on:
  workflow_run:
    workflows: ["Build and Push to ECR"]
    types:
      - completed
    branches:
      - main

jobs:
  deploy:
    name: Deploy to EKS
    runs-on: ubuntu-latest
    if: ${{ github.event.workflow_run.conclusion == 'success' }}
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Update kubeconfig
        run: |
          aws eks update-kubeconfig \
            --region us-east-1 \
            --name campus-events-dev
      
      - name: Deploy to Kubernetes
        run: |
          kubectl apply -k kubernetes/overlays/dev/
      
      - name: Wait for rollout
        run: |
          kubectl rollout status deployment/frontend -n campus-events
          kubectl rollout status deployment/events-api -n campus-events
          kubectl rollout status deployment/notification-service -n campus-events
      
      - name: Verify deployment
        run: |
          kubectl get pods -n campus-events
          kubectl get svc -n campus-events
          kubectl get ingress -n campus-events
```

## 🧪 Testing Workflow

### Workflow File: `lint-and-test.yml`

```yaml
name: Lint and Test

on:
  pull_request:
    branches:
      - main
  push:
    branches:
      - develop

jobs:
  lint-frontend:
    name: Lint Frontend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd applications/frontend
          npm ci
          npm run lint
          npm run format:check
  
  test-api:
    name: Test Events API
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: testpass
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: |
          cd applications/events-api
          npm ci
          npm test
  
  test-notification:
    name: Test Notification Service
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
      - run: |
          cd applications/notification-service
          pip install -r requirements.txt
          pytest
```

## 🧹 Cleanup Workflow

### Workflow File: `cleanup-old-images.yml`

```yaml
name: Cleanup Old ECR Images

on:
  schedule:
    - cron: '0 2 * * 0'  # Weekly on Sunday at 2 AM
  workflow_dispatch:

jobs:
  cleanup:
    name: Cleanup ECR
    runs-on: ubuntu-latest
    permissions:
      id-token: write
      contents: read
    
    steps:
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: ${{ secrets.AWS_ROLE_ARN }}
          aws-region: us-east-1
      
      - name: Delete old images
        run: |
          for service in frontend events-api notification-service; do
            aws ecr describe-images \
              --repository-name campus-events/$service \
              --query 'sort_by(imageDetails,& imagePushedAt)[:-10].imageDigest' \
              --output text | \
            while read digest; do
              aws ecr batch-delete-image \
                --repository-name campus-events/$service \
                --image-ids imageDigest=$digest
            done
          done
```

## 📊 Workflow Monitoring

### GitHub Actions Dashboard

Monitor workflow runs at:
```
https://github.com/<org>/<repo>/actions
```

### Key Metrics

- **Build Time**: ~5-8 minutes (parallel builds)
- **Success Rate**: Track over time
- **Deployment Frequency**: Daily/weekly cadence
- **Mean Time to Recovery (MTTR)**: <30 minutes

### Notifications

```yaml
- name: Notify on failure
  if: failure()
  uses: slackapi/slack-github-action@v1
  with:
    webhook: ${{ secrets.SLACK_WEBHOOK }}
    payload: |
      {
        "text": "Build failed for ${{ matrix.service }}",
        "blocks": [
          {
            "type": "section",
            "text": {
              "type": "mrkdwn",
              "text": "*Build Failed*\nService: ${{ matrix.service }}\nBranch: ${{ github.ref }}\nCommit: ${{ github.sha }}"
            }
          }
        ]
      }
```

## 🔄 Rollback Procedures

### Manual Rollback

```bash
# Rollback to previous revision
kubectl rollout undo deployment/frontend -n campus-events

# Rollback to specific revision
kubectl rollout undo deployment/frontend --to-revision=2 -n campus-events

# Check rollout history
kubectl rollout history deployment/frontend -n campus-events
```

### Automated Rollback

```yaml
- name: Check deployment health
  run: |
    sleep 60  # Wait for deployment to stabilize
    
    # Check pod status
    if ! kubectl get pods -n campus-events | grep -q "Running"; then
      echo "Unhealthy pods detected, rolling back"
      kubectl rollout undo deployment/frontend -n campus-events
      exit 1
    fi
    
    # Check application health
    if ! curl -f http://<alb-url>/health; then
      echo "Health check failed, rolling back"
      kubectl rollout undo deployment/frontend -n campus-events
      exit 1
    fi
```

## 📈 Performance Optimization

### Docker Build Optimization

```yaml
- name: Build with BuildKit
  env:
    DOCKER_BUILDKIT: 1
  run: |
    docker build \
      --cache-from ${{ env.ECR_REGISTRY }}/campus-events/${{ matrix.service }}:latest \
      --build-arg BUILDKIT_INLINE_CACHE=1 \
      .

- name: Use GitHub Actions cache
  uses: docker/build-push-action@v5
  with:
    context: applications/${{ matrix.service }}
    push: true
    cache-from: type=gha
    cache-to: type=gha,mode=max
```

### Parallel Jobs

```yaml
jobs:
  build:
    strategy:
      matrix:
        service: [frontend, events-api, notification-service]
    steps:
      # Build steps
  
  deploy:
    needs: build
    steps:
      # Deploy steps (runs after all builds complete)
```

## 🛡️ Security Best Practices

### Secret Management

```yaml
# ✅ Good - Use GitHub Secrets
- name: Configure AWS
  env:
    AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}

# ❌ Bad - Never hardcode secrets
- name: Configure AWS
  env:
    AWS_ACCESS_KEY_ID: AKIAIOSFODNN7EXAMPLE
```

### Dependency Pinning

```yaml
# ✅ Good - Pin action versions
- uses: actions/checkout@v4.1.1
- uses: aws-actions/configure-aws-credentials@v4.0.1

# ❌ Bad - Using latest or branches
- uses: actions/checkout@main
- uses: aws-actions/configure-aws-credentials@latest
```

### Least Privilege

```json
{
  "permissions": {
    "id-token": "write",    # For OIDC
    "contents": "read",     # For checkout
    "security-events": "write"  # For security scanning
  }
}
```

## 🐛 Troubleshooting

### Common Issues

**Issue: OIDC Authentication Failed**
```
Error: Could not assume role with OIDC
```

**Solution:**
1. Verify trust policy in IAM role
2. Check GitHub repo and branch in trust policy
3. Ensure OIDC provider is created
4. Verify audience setting

**Issue: ECR Push Failed**
```
Error: denied: requested access to the resource is denied
```

**Solution:**
1. Check IAM role has ECR permissions
2. Verify repository exists
3. Check repository permissions
4. Ensure ECR login succeeded

**Issue: Kubernetes Deployment Failed**
```
Error: unable to recognize "manifest.yaml": no matches for kind "Deployment"
```

**Solution:**
1. Verify kubeconfig is correct
2. Check Kubernetes API version compatibility
3. Ensure namespace exists
4. Verify RBAC permissions

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS Actions for GitHub](https://github.com/aws-actions)
- [Docker Build Push Action](https://github.com/docker/build-push-action)
- [Trivy GitHub Action](https://github.com/aquasecurity/trivy-action)
- [Kubernetes GitHub Actions](https://github.com/marketplace?type=actions&query=kubernetes)

## 🤝 Contributing

1. Test workflow changes in a feature branch first
2. Use `act` to test workflows locally
3. Document any new secrets or environment variables
4. Follow GitHub Actions best practices
5. Monitor workflow runs after merging

---

**CI/CD Pipeline** | **GitHub Actions** | **AWS Integration** | **Security First**
