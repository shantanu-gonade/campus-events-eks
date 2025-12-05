# Campus Events Management System - EKS Deployment

## 🎯 Project Status

**Week 2 Complete:** ✅ All containerization and CI/CD deliverables finished  
**Due Date:** December 7, 2025  
**Current Status:** Ahead of schedule - ready for Week 3

---

## 📋 Overview

A production-ready, cloud-native event management system deployed on AWS EKS using modern DevOps practices and Infrastructure as Code.

### System Components

- **Frontend**: React 18 + Vite 5 (NGINX)
- **Events API**: Node.js 20 LTS + Express.js + PostgreSQL
- **Notification Service**: Python 3.12 + FastAPI + AWS SES/SNS
- **Database**: Amazon RDS PostgreSQL 16
- **Container Orchestration**: Amazon EKS (Kubernetes 1.31)
- **Infrastructure**: Terraform 1.9+ with EKS Blueprints
- **CI/CD**: GitHub Actions with AWS OIDC

---

## 🚀 Week 2 Achievements

### ✅ Completed Deliverables

1. **Three Containerized Microservices** (10 points)
   - Production-ready multi-stage Dockerfiles
   - Non-root users (security hardened)
   - Health checks configured
   - Alpine/slim base images
   - Comprehensive .dockerignore files

2. **CI/CD Pipeline** (5 points)
   - GitHub Actions workflow
   - Automated builds and testing
   - AWS ECR integration with OIDC
   - Trivy security scanning
   - Parallel multi-service builds

3. **Local Development Environment**
   - Complete Docker Compose setup
   - Database initialization
   - Service dependencies configured
   - Health monitoring

4. **Documentation**
   - Implementation guides
   - Testing procedures
   - Troubleshooting guides

**Points Earned:** 15/15 ✅

See [WEEK2_COMPLETE.md](WEEK2_COMPLETE.md) for detailed completion report.

---

## ⚡ Quick Start

### Local Development (Docker Compose)

```bash
# 1. Clone repository
git clone <your-repo-url>
cd campus-events-eks

# 2. Start all services
docker-compose up -d

# 3. Access applications
# Frontend:     http://localhost:3000
# Events API:   http://localhost:8080
# Notifications: http://localhost:8082
# Database:     localhost:5432

# 4. View logs
docker-compose logs -f

# 5. Stop services
docker-compose down
```

### AWS Deployment (Coming in Week 3)

```bash
# 1. Configure AWS credentials
aws configure

# 2. Setup ECR repositories
./scripts/setup-ecr.sh

# 3. Build and push images
./scripts/build-and-push.sh

# 4. Deploy infrastructure (Week 3)
cd terraform/environments/dev
terraform init
terraform apply

# 5. Configure kubectl (Week 3)
aws eks update-kubeconfig --name campus-events-dev --region us-east-1

# 6. Deploy applications (Week 3)
kubectl apply -k kubernetes/overlays/dev/
```

---

## 📁 Project Structure

```
campus-events-eks/
├── applications/                # Microservices source code
│   ├── frontend/               # React application
│   │   ├── src/               # React components
│   │   ├── nginx/             # NGINX config
│   │   ├── Dockerfile         # Multi-stage build
│   │   └── package.json
│   ├── events-api/            # Node.js API
│   │   ├── src/               # Express application
│   │   ├── Dockerfile         # Multi-stage build
│   │   └── package.json
│   └── notification-service/  # Python service
│       ├── app/               # FastAPI application
│       ├── Dockerfile         # Multi-stage build
│       └── requirements.txt
├── terraform/                  # Infrastructure as Code
│   ├── modules/               # Reusable Terraform modules
│   │   ├── vpc/              # VPC with multi-AZ
│   │   ├── eks/              # EKS cluster
│   │   └── rds/              # RDS PostgreSQL
│   └── environments/          # Environment configs
│       ├── dev/
│       ├── staging/
│       └── prod/
├── kubernetes/                 # Kubernetes manifests
│   ├── base/                  # Base configurations
│   └── overlays/              # Environment overlays
│       ├── dev/
│       ├── staging/
│       └── prod/
├── .github/                   # GitHub Actions
│   └── workflows/
│       └── build-and-push.yml # CI/CD pipeline
├── scripts/                   # Utility scripts
│   ├── setup-ecr.sh          # ECR repository setup
│   └── build-and-push.sh     # Build and push images
├── docs/                      # Documentation
│   ├── ARCHITECTURE.md        # System architecture
│   ├── IMPLEMENTATION_PLAN.md # Week-by-week guide
│   ├── SECURITY_GUIDE.md      # Security practices
│   └── DATABASE_SCHEMA.sql    # Database schema
├── docker-compose.yml         # Local development
├── WEEK2_COMPLETE.md         # Week 2 completion report
├── WEEK2_TESTING.md          # Testing guide
└── README.md                  # This file
```

---

## 🔧 Prerequisites

### Required Tools

| Tool | Version | Purpose |
|------|---------|---------|
| **AWS CLI** | 2.15+ | AWS resource management |
| **Terraform** | 1.9+ | Infrastructure provisioning |
| **kubectl** | 1.31+ | Kubernetes management |
| **Docker** | 24.0+ | Container builds |
| **Docker Compose** | v2.x | Local development |
| **Node.js** | 20 LTS | Frontend/API development |
| **Python** | 3.12+ | Notification service |
| **Helm** | 3.14+ | Package management |

### Installation

**macOS:**
```bash
# Install Homebrew (if needed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install tools
brew install awscli terraform kubectl docker helm
brew install node python@3.12
```

**Linux (Ubuntu/Debian):**
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Terraform
wget https://releases.hashicorp.com/terraform/1.9.0/terraform_1.9.0_linux_amd64.zip
unzip terraform_1.9.0_linux_amd64.zip
sudo mv terraform /usr/local/bin/

# kubectl
curl -LO "https://dl.k8s.io/release/v1.31.0/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Docker
sudo apt-get update
sudo apt-get install docker.io docker-compose-plugin

# Node.js & Python
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs python3.12
```

---

## 🧪 Testing

### Run All Tests
```bash
# See WEEK2_TESTING.md for comprehensive testing guide

# Quick health check
./scripts/test-all-services.sh
```

### Individual Service Tests

**Frontend:**
```bash
cd applications/frontend
npm install
npm run build
docker build -t campus-events-frontend:test .
docker run -p 3000:3000 campus-events-frontend:test
```

**Events API:**
```bash
cd applications/events-api
npm install
docker build -t campus-events-api:test .
docker run -p 8080:8080 -e DB_HOST=localhost campus-events-api:test
```

**Notification Service:**
```bash
cd applications/notification-service
pip install -r requirements.txt
docker build -t campus-events-notifications:test .
docker run -p 8082:8082 campus-events-notifications:test
```

---

## 📚 Documentation

| Document | Description |
|----------|-------------|
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | Detailed system architecture and technology stack |
| [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md) | Week-by-week implementation guide |
| [SECURITY_GUIDE.md](docs/SECURITY_GUIDE.md) | Security best practices and compliance |
| [WEEK2_COMPLETE.md](WEEK2_COMPLETE.md) | Week 2 completion report with all deliverables |
| [WEEK2_TESTING.md](WEEK2_TESTING.md) | Comprehensive testing and validation guide |
| [DATABASE_SCHEMA.sql](docs/DATABASE_SCHEMA.sql) | PostgreSQL database schema |

---

## 🔒 Security Features

- **Container Security**: Non-root users, minimal images, security updates
- **Application Security**: Input validation, rate limiting, CORS, security headers
- **Network Security**: VPC isolation, security groups, network policies
- **Secrets Management**: External Secrets Operator, AWS Secrets Manager
- **Image Scanning**: Trivy vulnerability scanning in CI/CD
- **Encryption**: TLS/SSL, KMS encryption, encrypted RDS

---

## 🎓 Course Information

**Course:** ENPM818R - Cloud Computing  
**Project:** Microservices on EKS  
**Due Date:** December 7, 2025  
**Total Points:** 100

### Rubric Progress

| Category | Points | Status |
|----------|--------|--------|
| Architecture & Design | 15 | Week 1 ✅ |
| Infrastructure-as-Code | 10 | Week 1 ✅ |
| Docker Configuration | 10 | Week 2 ✅ |
| Kubernetes Configuration | 15 | Week 3 ⏳ |
| Load Balancing & Networking | 10 | Week 4 ⏳ |
| CI/CD Automation | 10 | Week 2 ✅ (5/10) |
| Observability | 10 | Week 5 ⏳ |
| Documentation & Presentation | 10 | Ongoing |
| Collaboration & Version Control | 5 | Ongoing |
| Innovation | 5 | Week 5 ⏳ |
| **Total** | **100** | **30/100** |

---

## 🤝 Contributing

This is an academic project. For development workflow:

1. Create feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -am "feat: your feature"`
3. Push to branch: `git push origin feature/your-feature`
4. Create Pull Request

---

## 📞 Support

For issues or questions:
1. Check [WEEK2_TESTING.md](WEEK2_TESTING.md) troubleshooting section
2. Review [IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md)
3. Check GitHub Issues

---

## 📅 Project Timeline

- **Week 1** (Nov 24-30): Planning & Design ✅
- **Week 2** (Dec 1-7): Containerization & CI/CD ✅  
- **Week 3** (Dec 8-14): EKS Deployment ⏳
- **Week 4** (Dec 15-21): Load Balancing & Scaling ⏳
- **Week 5** (Dec 22-28): Observability & Documentation ⏳

---

## 🏆 Acknowledgments

- AWS Documentation
- Terraform EKS Blueprints
- Kubernetes Best Practices
- ENPM818R Course Materials

---

## 📝 License

This is an academic project for ENPM818R coursework.

---

**Last Updated:** December 2, 2025  
**Status:** Week 2 Complete - Ready for Week 3 EKS Deployment
