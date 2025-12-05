# Scripts Directory

This directory contains automation scripts for the Campus Events Management System project.

---

## 📋 Available Scripts

### 1. setup-ecr.sh

**Purpose:** Create and configure ECR repositories for all microservices.

**Features:**
- Creates ECR repositories with security best practices
- Enables image scanning on push
- Configures AES256 encryption
- Sets lifecycle policy (keeps last 10 images)
- Idempotent (safe to run multiple times)

**Usage:**
```bash
# Make executable (first time only)
chmod +x scripts/setup-ecr.sh

# Run script
./scripts/setup-ecr.sh

# Or with custom region
AWS_REGION=us-west-2 ./scripts/setup-ecr.sh
```

**Requirements:**
- AWS CLI configured with credentials
- IAM permissions for ECR operations

---

### 2. build-and-push.sh

**Purpose:** Build Docker images locally and push to ECR.

**Features:**
- Builds all three microservices
- Tags images with custom tag and 'latest'
- Logs in to ECR automatically
- Pushes images to correct repositories

**Usage:**
```bash
# Make executable (first time only)
chmod +x scripts/build-and-push.sh

# Build and push with 'latest' tag
./scripts/build-and-push.sh

# Build and push with custom tag
./scripts/build-and-push.sh v1.0.0

# With custom region
AWS_REGION=us-west-2 ./scripts/build-and-push.sh v1.0.0
```

**Requirements:**
- Docker installed and running
- AWS CLI configured with credentials
- ECR repositories already created (run setup-ecr.sh first)

---

## 🚀 Quick Start

**First time setup:**
```bash
# 1. Make scripts executable
chmod +x scripts/*.sh

# 2. Create ECR repositories
./scripts/setup-ecr.sh

# 3. Build and push images
./scripts/build-and-push.sh
```

**Subsequent builds:**
```bash
# Build and push all services
./scripts/build-and-push.sh

# Or with version tag
./scripts/build-and-push.sh v1.1.0
```

---

## 🔐 Required AWS Permissions

The scripts require the following AWS IAM permissions:

**For setup-ecr.sh:**
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "ecr:CreateRepository",
        "ecr:DescribeRepositories",
        "ecr:PutLifecyclePolicy",
        "ecr:PutImageScanningConfiguration"
      ],
      "Resource": "*"
    }
  ]
}
```

**For build-and-push.sh:**
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

---

## 🏗️ GitHub Actions Integration

These scripts are complementary to the GitHub Actions CI/CD pipeline (`.github/workflows/build-and-push.yml`).

**When to use scripts vs GitHub Actions:**

**Use scripts when:**
- Testing locally before committing
- Quick manual builds and deployments
- Setting up ECR for the first time
- Debugging build issues

**Use GitHub Actions when:**
- Pushing to main/develop branches
- Creating pull requests
- Automated CI/CD workflows
- Team collaboration

---

## 📝 Environment Variables

Both scripts support these environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| AWS_REGION | us-east-1 | AWS region for ECR |
| AWS_ACCOUNT_ID | Auto-detected | AWS account ID (usually auto-detected) |

**Example:**
```bash
AWS_REGION=us-west-2 ./scripts/build-and-push.sh v2.0.0
```

---

## 🐛 Troubleshooting

### Error: "Unable to locate credentials"
**Solution:** Configure AWS CLI credentials
```bash
aws configure
```

### Error: "Cannot connect to Docker daemon"
**Solution:** Start Docker Desktop or Docker daemon
```bash
# macOS/Windows: Start Docker Desktop
# Linux:
sudo systemctl start docker
```

### Error: "Repository does not exist"
**Solution:** Run setup-ecr.sh first
```bash
./scripts/setup-ecr.sh
```

### Error: "Permission denied"
**Solution:** Make script executable
```bash
chmod +x scripts/*.sh
```

---

## 📚 Additional Resources

- [ECR User Guide](https://docs.aws.amazon.com/ecr/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

*Last updated: December 2, 2025*
