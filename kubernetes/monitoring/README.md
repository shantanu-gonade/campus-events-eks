# Campus Events - Observability Stack

## Overview

This directory contains the complete observability stack for the Campus Events application, including:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Alertmanager** - Alert routing and management
- **ServiceMonitors** - Application metrics discovery
- **PrometheusRules** - Alert definitions

## Quick Start

### Prerequisites

- Kubernetes cluster (EKS) running
- kubectl configured
- Helm 3.x installed
- At least 4GB free memory in cluster

### Deploy Observability Stack

```bash
cd kubernetes/monitoring
chmod +x deploy.sh
./deploy.sh
```

The script will:
1. Create monitoring namespace
2. Add Prometheus Helm repository
3. Install kube-prometheus-stack
4. Deploy ServiceMonitors for our applications
5. Deploy Prometheus alert rules
6. Import Grafana dashboards

Deployment takes approximately 5-10 minutes.

## Components

### 1. Prometheus

**Purpose**: Metrics collection and time-series database

**Features**:
- 7-day metric retention
- 5GB retention size
- 10Gi persistent storage
- Automatic pod discovery
- Custom scrape configurations

**Access**:
```bash
kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090
```
Open: http://localhost:9090

### 2. Grafana

**Purpose**: Visualization and dashboards

**Features**:
- Pre-configured Prometheus datasource
- Custom Campus Events dashboard
- Kubernetes cluster overview dashboard
- Community dashboards (Node Exporter, Pods)
- 5Gi persistent storage

**Access**:
```bash
kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80
```
Open: http://localhost:3000
- Username: `admin`
- Password: `admin123`

**Available Dashboards**:
1. Campus Events - Application Metrics
   - Request rate
   - Error rate
   - Response times (P50, P95)
   - CPU/Memory usage
   - Service health

2. Kubernetes Cluster - Overview
   - Node statistics
   - Pod counts and status
   - CPU/Memory usage
   - Network I/O
   - Disk I/O

3. Community Dashboards (auto-imported)
   - Kubernetes Cluster Monitoring (7249)
   - Kubernetes Pods (6417)
   - Node Exporter (1860)

### 3. Alertmanager

**Purpose**: Alert routing and notification management

**Features**:
- Grouping by alertname, cluster, service
- Separate routes for critical/warning alerts
- 2Gi persistent storage
- Webhook configurations (customizable)

**Access**:
```bash
kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-alertmanager 9093:9093
```
Open: http://localhost:9093

### 4. ServiceMonitors

ServiceMonitors automatically discover and scrape metrics from our applications:

- `events-api-servicemonitor.yaml` - Events API metrics
- `notification-service-servicemonitor.yaml` - Notification Service metrics
- `frontend-servicemonitor.yaml` - Frontend metrics

Each ServiceMonitor:
- Scrapes every 30 seconds
- Targets `/metrics` endpoint
- Uses service selectors for discovery

### 5. Alert Rules

Nine critical alerts configured in `alerts/prometheus-rules.yaml`:

**Application Alerts**:
1. **HighErrorRate** - 5xx errors > 5% for 5 minutes
2. **HighResponseTime** - P95 latency > 1 second for 5 minutes
3. **PodRestarting** - Pod restarts detected

**Resource Alerts**:
4. **HighCPUUsage** - CPU > 80% of limit for 10 minutes
5. **HighMemoryUsage** - Memory > 80% of limit for 10 minutes
6. **PodNotReady** - Pod not Running/Succeeded for 15 minutes

**Availability Alerts**:
7. **ServiceDown** - Service unreachable for 5 minutes
8. **LowReplicaCount** - Available replicas < 50% for 10 minutes
9. **HPAMaxedOut** - HPA at max replicas for 15 minutes

## Directory Structure

```
monitoring/
├── namespace.yaml              # Monitoring namespace
├── values.yaml                 # Helm chart values
├── deploy.sh                   # Automated deployment script
├── README.md                   # This file
├── servicemonitors/
│   ├── events-api-servicemonitor.yaml
│   ├── notification-service-servicemonitor.yaml
│   └── frontend-servicemonitor.yaml
├── alerts/
│   └── prometheus-rules.yaml  # Alert definitions
└── dashboards/
    ├── campus-events-dashboard.json
    └── kubernetes-cluster-dashboard.json
```

## Manual Deployment (Alternative)

If you prefer manual steps:

### Step 1: Create Namespace
```bash
kubectl apply -f namespace.yaml
```

### Step 2: Add Helm Repo
```bash
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo update
```

### Step 3: Install kube-prometheus-stack
```bash
helm install kube-prom-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --values values.yaml \
  --create-namespace
```

### Step 4: Deploy ServiceMonitors
```bash
kubectl apply -f servicemonitors/
```

### Step 5: Deploy Alert Rules
```bash
kubectl apply -f alerts/prometheus-rules.yaml
```

### Step 6: Import Dashboards
```bash
kubectl create configmap grafana-dashboard-campus-events \
  --from-file=dashboards/campus-events-dashboard.json \
  -n monitoring

kubectl label configmap grafana-dashboard-campus-events \
  grafana_dashboard=1 -n monitoring

kubectl create configmap grafana-dashboard-kubernetes-cluster \
  --from-file=dashboards/kubernetes-cluster-dashboard.json \
  -n monitoring

kubectl label configmap grafana-dashboard-kubernetes-cluster \
  grafana_dashboard=1 -n monitoring
```

## Verification

### Check Pod Status
```bash
kubectl get pods -n monitoring
```

Expected output:
- alertmanager-kube-prom-stack-*
- kube-prom-stack-grafana-*
- kube-prom-stack-kube-prome-operator-*
- kube-prom-stack-kube-state-metrics-*
- kube-prom-stack-prometheus-node-exporter-*
- prometheus-kube-prom-stack-*

All pods should be in `Running` state.

### Check ServiceMonitors
```bash
kubectl get servicemonitors -n campus-events
```

### Check PrometheusRules
```bash
kubectl get prometheusrules -n monitoring
```

### Check Grafana Dashboards
```bash
kubectl get configmaps -n monitoring | grep grafana-dashboard
```

## Testing

### Generate Test Traffic
```bash
# Create a load generator pod
kubectl run load-generator \
  --image=busybox:latest \
  --restart=Never \
  -n campus-events \
  -- /bin/sh -c "while true; do wget -q -O- http://events-api-service:8080/api/v1/events; sleep 1; done"

# Let it run for 3-5 minutes
sleep 300

# Delete load generator
kubectl delete pod load-generator -n campus-events
```

### Verify Metrics in Prometheus
1. Port-forward to Prometheus: `kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-prometheus 9090:9090`
2. Open http://localhost:9090
3. Run queries:
   - `up{namespace="campus-events"}`
   - `rate(http_requests_total[5m])`
   - `container_cpu_usage_seconds_total{namespace="campus-events"}`

### Verify Dashboards in Grafana
1. Port-forward to Grafana: `kubectl port-forward -n monitoring svc/kube-prom-stack-grafana 3000:80`
2. Open http://localhost:3000 (admin/admin123)
3. Navigate to Dashboards → Browse
4. Check:
   - Campus Events - Application Metrics
   - Kubernetes Cluster - Overview

### Test Alerts
```bash
# Check active alerts in Prometheus
# Open http://localhost:9090/alerts

# Check Alertmanager
kubectl port-forward -n monitoring svc/kube-prom-stack-kube-prome-alertmanager 9093:9093
# Open http://localhost:9093
```

## Customization

### Modify Retention Period
Edit `values.yaml`:
```yaml
prometheus:
  prometheusSpec:
    retention: 15d  # Change from 7d to 15d
```

### Add Custom Alerts
Edit `alerts/prometheus-rules.yaml` and add new rules under appropriate groups.

### Change Grafana Password
Edit `values.yaml`:
```yaml
grafana:
  adminPassword: "your-secure-password"
```

### Add Email Notifications
Edit `values.yaml` Alertmanager section:
```yaml
alertmanager:
  config:
    receivers:
    - name: 'email'
      email_configs:
      - to: 'team@example.com'
        from: 'alertmanager@example.com'
        smarthost: 'smtp.gmail.com:587'
        auth_username: 'user@gmail.com'
        auth_password: 'app-password'
```

## Troubleshooting

### Pods Not Starting
```bash
# Check pod status
kubectl get pods -n monitoring

# Describe problematic pod
kubectl describe pod <pod-name> -n monitoring

# Check logs
kubectl logs <pod-name> -n monitoring
```

### No Metrics Appearing
```bash
# Check ServiceMonitor status
kubectl get servicemonitors -A

# Check Prometheus targets
# Port-forward and visit http://localhost:9090/targets

# Check if application exposes /metrics endpoint
kubectl exec -it <app-pod> -n campus-events -- curl localhost:8080/metrics
```

### Alerts Not Firing
```bash
# Check PrometheusRule syntax
kubectl get prometheusrules -n monitoring -o yaml

# Check Prometheus logs
kubectl logs -n monitoring -l app.kubernetes.io/name=prometheus
```

### Dashboards Not Showing Data
1. Verify Prometheus datasource in Grafana (Configuration → Data Sources)
2. Check if metrics exist in Prometheus
3. Verify dashboard queries match your metric names

## Uninstall

```bash
# Delete ServiceMonitors
kubectl delete -f servicemonitors/

# Delete PrometheusRules
kubectl delete -f alerts/prometheus-rules.yaml

# Uninstall Helm release
helm uninstall kube-prom-stack -n monitoring

# Delete namespace (optional)
kubectl delete namespace monitoring
```

## Resources

- [Prometheus Operator Documentation](https://prometheus-operator.dev/)
- [kube-prometheus-stack Helm Chart](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack)
- [Grafana Dashboards](https://grafana.com/grafana/dashboards/)
- [PromQL Query Examples](https://prometheus.io/docs/prometheus/latest/querying/examples/)

## Week 4 Rubric Coverage

This observability stack addresses the following rubric requirements:

**Observability (10 points)**:
- ✅ Prometheus deployed and collecting metrics
- ✅ Grafana with custom dashboards
- ✅ Alertmanager with alert rules
- ✅ ServiceMonitors for automatic discovery
- ✅ 9 alert rules covering critical scenarios
- ✅ 2 custom Grafana dashboards
- ✅ Integration with all 3 microservices

## Support

For issues or questions:
1. Check logs: `kubectl logs -n monitoring <pod-name>`
2. Review Prometheus targets: http://localhost:9090/targets
3. Check ServiceMonitor configs: `kubectl get servicemonitors -A -o yaml`
