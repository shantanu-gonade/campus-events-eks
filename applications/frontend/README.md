# Campus Events Frontend

React-based frontend application for the Campus Events Management System.

## Technology Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Axios** - HTTP client
- **React Router DOM** - Client-side routing

## Project Structure

```
frontend/
├── src/
│   ├── main.jsx          # Application entry point
│   ├── App.jsx           # Main component
│   ├── App.css           # Component styles
│   └── index.css         # Global styles
├── nginx/
│   └── nginx.conf        # Production nginx configuration
├── public/               # Static assets
├── index.html            # HTML template
├── vite.config.js        # Vite configuration
├── Dockerfile            # Multi-stage Docker build
├── .dockerignore         # Docker ignore rules
└── package.json          # Dependencies and scripts
```

## Development

### Prerequisites

- Node.js 20.x
- npm 10.x

### Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Environment Variables

Create `.env.local` for local development:

```env
VITE_API_URL=http://localhost:8080
```

## Docker

### Build Image

```bash
# Build the Docker image
docker build -t campus-events-frontend:latest .

# Build with specific tag
docker build -t <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/frontend:v1.0.0 .
```

### Run Container

```bash
# Run locally
docker run -p 3000:3000 campus-events-frontend:latest

# Run with environment variables
docker run -p 3000:3000 \
  -e VITE_API_URL=http://events-api:8080 \
  campus-events-frontend:latest
```

### Docker Image Features

- **Multi-stage build**: Separate build and runtime stages
- **Minimal size**: Using Node Alpine and Nginx Alpine
- **Non-root user**: Runs as `appuser` (UID 1001)
- **Health checks**: Built-in health endpoint at `/health`
- **Security headers**: Configured in nginx
- **Gzip compression**: Enabled for static assets
- **Caching**: Optimized for static assets

## Docker Image Details

### Build Stage
- Base: `node:20-alpine`
- Installs production dependencies only
- Builds optimized production bundle

### Production Stage
- Base: `nginx:alpine`
- Serves static files via nginx
- Runs on port 3000
- Non-root user for security
- Health check every 30 seconds

### Security Features

1. **Non-root execution**: Container runs as `appuser`
2. **Minimal base images**: Alpine Linux for smaller attack surface
3. **Security headers**: X-Frame-Options, X-Content-Type-Options, etc.
4. **No unnecessary packages**: Production-only dependencies
5. **Read-only filesystem**: Static files only

## Testing

### Local Testing

```bash
# Test development build
npm run dev

# Open http://localhost:3000
```

### Docker Testing

```bash
# Build and run
docker build -t test-frontend .
docker run -p 3000:3000 test-frontend

# Check health
curl http://localhost:3000/health
```

### Integration Testing

Requires the Events API running:

```bash
# Start Events API
cd ../events-api
npm start

# Start Frontend
npm run dev
```

## Deployment

### Push to ECR

```bash
# Authenticate to ECR
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Tag image
docker tag campus-events-frontend:latest \
  <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/frontend:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/campus-events/frontend:latest
```

### Deploy to Kubernetes

```bash
# Apply Kubernetes manifests
kubectl apply -f ../../kubernetes/base/frontend/

# Check deployment
kubectl get pods -l app=frontend
kubectl logs -l app=frontend
```

## Features

- Event listing display
- Real-time API connectivity status
- Responsive design for mobile/desktop
- Error handling and retry logic
- Loading states
- Clean, modern UI

## API Integration

The frontend connects to the Events API at:
- Development: `http://localhost:8080`
- Production: Set via `VITE_API_URL` environment variable

### API Endpoints Used

- `GET /api/events` - Fetch all events

## Performance

- Optimized production build with Vite
- Gzip compression enabled
- Static asset caching (1 year)
- Lazy loading support (ready for code splitting)
- Minimal JavaScript bundle size

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Container won't start
```bash
# Check logs
docker logs <container-id>

# Check health
docker inspect <container-id> | grep Health
```

### Cannot connect to API
1. Verify API is running
2. Check VITE_API_URL environment variable
3. Check CORS configuration in API
4. Verify network connectivity

### Build failures
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear build cache
rm -rf dist
npm run build
```

## License

MIT

## Project Info

- **Course**: ENPM818R - Cloud Computing
- **Project**: Campus Events Management System
- **Focus**: Kubernetes-based microservices deployment on AWS EKS
