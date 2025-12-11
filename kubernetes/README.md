# Kubernetes Manifests

## 🎯 Overview

This directory contains all Kubernetes manifests for deploying the Campus Events Management System on Amazon EKS. The manifests follow Kubernetes best practices and use Kustomize for environment-specific configurations.

## 🏗️ Architecture

The application runs on EKS with the following components:

- **3 Microservices**: Frontend, Events API, Notification Service
- **2 Replicas**: Each microservice for high availability
- **Horizontal Pod Autoscaling**: CPU/Memory based autoscaling
- **Network Policies**: Pod-to-pod traffic control
- **Ingress Controller**: AWS Load Balancer Controller
- **Monitoring Stack**: Prometheus + Grafana + Alertmanager
- **Node Autoscaling**: Karpenter for efficient node management

## 📁 Directory Structure

```
kubernetes/
├── base/                          # Base Kubernetes manifests
│   ├── namespace.yaml            # Campus-events namespace
│   ├── frontend/                 # Frontend deployment
│   │   ├── deployment.yaml      # Deployment with 2 replicas
│   │   ├── service.yaml         # ClusterIP service
│   │   ├── hpa.yaml             # Horizontal Pod Autoscaler
│   │   └── kustomization.yaml   # Kustomize config
│   ├── events-api/              # Events API deployment
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   ├── configmap.yaml       # Configuration
│   │   └── kustomization.yaml
│   ├── notification-service/    # Notification service deployment
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   ├── hpa.yaml
│   │   └── kustomization.yaml
│   └── secrets/                 # Sealed secrets (encrypted)
│       ├── db-credentials.yaml  # Database credentials
│       └── aws-credentials.yaml # AWS credentials
├── overlays/                     # Environment-specific overrides
│   ├── dev/                     # Development environment
│   │   ├── kustomization.yaml  # Dev-specific patches
│   │   ├── namespace-patch.yaml
│   │   └── resource-limits-patch.yaml
│   ├── staging/                 # Staging environment
│   │   └── kustomization.yaml
│   └── prod/                    # Production environment
│       └── kustomization.yaml
├── ingress/                      # Ingress configuration
│   ├── alb-ingress.yaml        # Application Load Balancer Ingress
│   └── ingress-class.yaml      # IngressClass definition
├── network-policies/            # Network security policies
│   ├── frontend-policy.yaml    # Frontend network policy
│   ├── api-policy.yaml         # API network policy
│   └── notification-policy.yaml # Notification network policy
├── monitoring/                   # Observability stack
│   ├── prometheus/              # Prometheus configuration
│   │   ├── values.yaml         # Helm values
│   │   └── servicemonitor.yaml # Service monitors
│   ├── grafana/                 # Grafana dashboards
│   │   ├── values.yaml
│   │   └── dashboards/
│   └── alertmanager/            # Alert configuration
│       └── values.yaml
├── karpenter/                    # Node autoscaling
│   ├── values.yaml             # Karpenter Helm values
│   ├── nodepool.yaml           # Node pool definition
│   └── ec2nodeclass.yaml       # EC2 node configuration
└── jobs/                         # Kubernetes jobs
    ├── db-migration.yaml       # Database migration job
    └── db-seed.yaml            # Database seeding job
```

## 🚀 Quick Start

### Prerequisites

```bash
# Install kubectl
brew install kubectl  # macOS
# OR
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"

# Install kustomize
brew install kustomize  # macOS

# Install AWS CLI
brew install awscli

# Install Helm
brew install helm
```

### Connect to EKS Cluster

```bash
# Configure kubectl for EKS
aws eks update-kubeconfig \
  --region us-east-1 \
  --name campus-events-dev

# Verify connection
kubectl cluster-info
kubectl get nodes
```

### Deploy Application

```bash
# Deploy to development environment
kubectl apply -k kubernetes/overlays/dev/

# Watch deployment progress
kubectl get pods -n campus-events -w

# Check deployment status
kubectl rollout status deployment/frontend -n campus-events
kubectl rollout status deployment/events-api -n campus-events
kubectl rollout status deployment/notification-service -n campus-events
```

## 📦 Base Manifests

### Frontend Deployment

```yaml
# kubernetes/base/frontend/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: campus-events
  labels:
    app: frontend
    version: v1.0.0
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
        version: v1.0.0
    spec:
      containers:
      - name: frontend
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/frontend:latest
        ports:
        - containerPort: 80
          name: http
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: VITE_API_URL
          value: "http://events-api:8080"
        - name: VITE_ENV
          value: "production"
```

### Events API Deployment

```yaml
# kubernetes/base/events-api/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: events-api
  namespace: campus-events
spec:
  replicas: 2
  selector:
    matchLabels:
      app: events-api
  template:
    metadata:
      labels:
        app: events-api
    spec:
      containers:
      - name: events-api
        image: <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/events-api:latest
        ports:
        - containerPort: 8080
          name: http
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "production"
        - name: DB_HOST
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: host
        - name: DB_PASSWORD
          valueFrom:
            secretKeyRef:
              name: db-credentials
              key: password
```

### Horizontal Pod Autoscaler

```yaml
# kubernetes/base/frontend/hpa.yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: frontend-hpa
  namespace: campus-events
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: frontend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 50
        periodSeconds: 60
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 30
```

## 🌐 Ingress Configuration

### ALB Ingress

```yaml
# kubernetes/ingress/alb-ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: campus-events-ingress
  namespace: campus-events
  annotations:
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}]'
    alb.ingress.kubernetes.io/healthcheck-path: /health
    alb.ingress.kubernetes.io/healthcheck-interval-seconds: '15'
    alb.ingress.kubernetes.io/healthcheck-timeout-seconds: '5'
    alb.ingress.kubernetes.io/healthy-threshold-count: '2'
    alb.ingress.kubernetes.io/unhealthy-threshold-count: '2'
spec:
  ingressClassName: alb
  rules:
  - http:
      paths:
      - path: /api/v1
        pathType: Prefix
        backend:
          service:
            name: events-api
            port:
              number: 8080
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

## 🔒 Network Policies

### Frontend Network Policy

```yaml
# kubernetes/network-policies/frontend-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: frontend-network-policy
  namespace: campus-events
spec:
  podSelector:
    matchLabels:
      app: frontend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
  egress:
  - to:
    - podSelector:
        matchLabels:
          app: events-api
    ports:
    - protocol: TCP
      port: 8080
  - to:
    - namespaceSelector: {}
      podSelector:
        matchLabels:
          k8s-app: kube-dns
    ports:
    - protocol: UDP
      port: 53
```

## 🎛️ Kustomize Configuration

### Base Kustomization

```yaml
# kubernetes/base/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

namespace: campus-events

resources:
- namespace.yaml
- frontend/deployment.yaml
- frontend/service.yaml
- frontend/hpa.yaml
- events-api/deployment.yaml
- events-api/service.yaml
- events-api/hpa.yaml
- events-api/configmap.yaml
- notification-service/deployment.yaml
- notification-service/service.yaml
- notification-service/hpa.yaml

commonLabels:
  app.kubernetes.io/managed-by: kustomize
  app.kubernetes.io/part-of: campus-events

images:
- name: frontend
  newName: <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/frontend
  newTag: latest
- name: events-api
  newName: <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/events-api
  newTag: latest
- name: notification-service
  newName: <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/notification-service
  newTag: latest
```

### Development Overlay

```yaml
# kubernetes/overlays/dev/kustomization.yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization

bases:
- ../../base

namespace: campus-events

nameSuffix: -dev

patchesStrategicMerge:
- resource-limits-patch.yaml

replicas:
- name: frontend
  count: 2
- name: events-api
  count: 2
- name: notification-service
  count: 2

configMapGenerator:
- name: app-config
  literals:
  - ENVIRONMENT=development
  - LOG_LEVEL=debug
```

## 📊 Monitoring Stack

### Prometheus Configuration

```bash
# Install Prometheus using Helm
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update

# Install with custom values
helm install kube-prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --create-namespace \
  --values kubernetes/monitoring/prometheus/values.yaml
```

### ServiceMonitor

```yaml
# kubernetes/monitoring/prometheus/servicemonitor.yaml
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: campus-events-metrics
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: events-api
  endpoints:
  - port: http
    path: /metrics
    interval: 30s
```

## 🚀 Karpenter Configuration

### NodePool

```yaml
# kubernetes/karpenter/nodepool.yaml
apiVersion: karpenter.sh/v1
kind: NodePool
metadata:
  name: default
spec:
  template:
    spec:
      requirements:
      - key: karpenter.sh/capacity-type
        operator: In
        values: ["on-demand"]
      - key: node.kubernetes.io/instance-type
        operator: In
        values: ["t3.medium", "t3.large"]
      nodeClassRef:
        group: karpenter.k8s.aws
        kind: EC2NodeClass
        name: default
  limits:
    cpu: "100"
    memory: 200Gi
  disruption:
    consolidationPolicy: WhenEmpty
    consolidateAfter: 30s
```

## 🔄 Deployment Strategies

### Rolling Update

```yaml
spec:
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
```

### Blue-Green Deployment

```bash
# Deploy new version (green)
kubectl apply -f green-deployment.yaml

# Switch traffic
kubectl patch service frontend -p '{"spec":{"selector":{"version":"v2.0.0"}}}'

# Remove old version (blue)
kubectl delete deployment frontend-v1
```

### Canary Deployment

```bash
# Deploy canary version (10% traffic)
kubectl apply -f canary-deployment.yaml

# Monitor metrics
kubectl top pods -n campus-events

# Promote canary to production
kubectl scale deployment frontend-canary --replicas=10
kubectl scale deployment frontend --replicas=0
```

## 🔍 Debugging

### Pod Troubleshooting

```bash
# Get pod status
kubectl get pods -n campus-events

# Describe pod
kubectl describe pod <pod-name> -n campus-events

# View logs
kubectl logs <pod-name> -n campus-events

# Follow logs
kubectl logs -f <pod-name> -n campus-events

# View previous container logs (if crashed)
kubectl logs <pod-name> -n campus-events --previous

# Execute command in pod
kubectl exec -it <pod-name> -n campus-events -- /bin/sh

# Port forward to pod
kubectl port-forward <pod-name> 8080:8080 -n campus-events
```

### Service Debugging

```bash
# Get services
kubectl get svc -n campus-events

# Describe service
kubectl describe svc events-api -n campus-events

# Test service endpoints
kubectl get endpoints events-api -n campus-events

# Test service from within cluster
kubectl run test-pod --image=busybox -it --rm -- wget -O- http://events-api:8080/health
```

### Ingress Troubleshooting

```bash
# Get ingress
kubectl get ingress -n campus-events

# Describe ingress
kubectl describe ingress campus-events-ingress -n campus-events

# Check ALB controller logs
kubectl logs -n kube-system deployment/aws-load-balancer-controller
```

## 📈 Scaling

### Manual Scaling

```bash
# Scale deployment
kubectl scale deployment frontend --replicas=5 -n campus-events

# Scale with kubectl patch
kubectl patch deployment frontend \
  -n campus-events \
  -p '{"spec":{"replicas":5}}'
```

### Autoscaling

```bash
# Get HPA status
kubectl get hpa -n campus-events

# Describe HPA
kubectl describe hpa frontend-hpa -n campus-events

# Edit HPA
kubectl edit hpa frontend-hpa -n campus-events
```

### Node Scaling

```bash
# Get nodes
kubectl get nodes

# Describe node
kubectl describe node <node-name>

# Cordon node (prevent scheduling)
kubectl cordon <node-name>

# Drain node (evict pods)
kubectl drain <node-name> --ignore-daemonsets --delete-emptydir-data

# Uncordon node
kubectl uncordon <node-name>
```

## 🔒 Security

### Secrets Management

```bash
# Create secret from literal
kubectl create secret generic db-credentials \
  --from-literal=host=db-host \
  --from-literal=password=secure-password \
  -n campus-events

# Create secret from file
kubectl create secret generic tls-cert \
  --from-file=tls.crt=cert.pem \
  --from-file=tls.key=key.pem \
  -n campus-events

# View secret (base64 encoded)
kubectl get secret db-credentials -o yaml -n campus-events

# Decode secret
kubectl get secret db-credentials -o jsonpath='{.data.password}' -n campus-events | base64 --decode
```

### RBAC

```yaml
# Service Account
apiVersion: v1
kind: ServiceAccount
metadata:
  name: events-api-sa
  namespace: campus-events

---
# Role
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: events-api-role
  namespace: campus-events
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list"]

---
# RoleBinding
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: events-api-rolebinding
  namespace: campus-events
subjects:
- kind: ServiceAccount
  name: events-api-sa
roleRef:
  kind: Role
  name: events-api-role
  apiGroup: rbac.authorization.k8s.io
```

## 📊 Resource Quotas

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: compute-quota
  namespace: campus-events
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "5"
    pods: "50"
```

## 🔄 GitOps with ArgoCD

```yaml
# argocd-app.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: campus-events
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/your-org/campus-events
    targetRevision: main
    path: kubernetes/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: campus-events
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
    syncOptions:
    - CreateNamespace=true
```

## 🧪 Testing

### Smoke Tests

```bash
# Test frontend
curl http://<alb-url>/

# Test API health
curl http://<alb-url>/api/v1/health

# Test API endpoint
curl http://<alb-url>/api/v1/events
```

### Load Testing

```bash
# Using Apache Bench
ab -n 1000 -c 10 http://<alb-url>/api/v1/events

# Using k6
k6 run load-test.js
```

## 📚 Best Practices

### Resource Management

✅ **Always set resource requests and limits**
✅ **Use HPA for automatic scaling**
✅ **Implement pod disruption budgets**
✅ **Use readiness and liveness probes**

### Configuration

✅ **Use ConfigMaps for configuration**
✅ **Use Secrets for sensitive data**
✅ **Externalize environment-specific values**
✅ **Version control all manifests**

### Networking

✅ **Implement network policies**
✅ **Use service mesh (optional)**
✅ **Configure ingress properly**
✅ **Use internal services for pod-to-pod**

### Monitoring

✅ **Expose metrics endpoints**
✅ **Create custom dashboards**
✅ **Set up alerts**
✅ **Use distributed tracing**

## 📖 Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Kustomize Guide](https://kustomize.io/)
- [AWS Load Balancer Controller](https://kubernetes-sigs.github.io/aws-load-balancer-controller/)
- [Karpenter Documentation](https://karpenter.sh/)
- [Prometheus Operator](https://prometheus-operator.dev/)

## 🤝 Contributing

1. Follow Kubernetes naming conventions
2. Add resource limits to all deployments
3. Test changes in dev environment first
4. Update documentation for new resources
5. Use Kustomize for environment variations

---

**Kubernetes-Native** | **Cloud-Native Applications** | **AWS EKS**
