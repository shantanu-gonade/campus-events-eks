# Campus Events Frontend

React-based web application for the Campus Events Management System.

## 🎯 Overview

A modern, responsive single-page application (SPA) built with React 18, Vite 5, and Material-UI. Provides an intuitive interface for students and administrators to discover, create, and manage campus events.

## 🛠️ Technology Stack

- **Framework**: React 18.3.1
- **Build Tool**: Vite 5.4.11 (faster than Create React App)
- **UI Library**: Material-UI (MUI) 6.2.0
- **Routing**: React Router 7.1.1
- **HTTP Client**: Axios 1.7.9
- **WebSocket**: Socket.IO Client 4.8.1
- **State Management**: Zustand 5.0.2
- **Data Fetching**: React Query 5.64.0
- **Charts**: Chart.js 4.4.7 + react-chartjs-2
- **Date Handling**: date-fns 4.1.0
- **Form Validation**: Native HTML5 + custom validation

## 📁 Project Structure

```
frontend/
├── public/                    # Static assets
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/           # Reusable UI components
│   │   ├── common/          # Generic components (Button, Card, etc.)
│   │   ├── events/          # Event-specific components
│   │   ├── layout/          # Layout components (Header, Footer)
│   │   └── analytics/       # Analytics visualizations
│   ├── pages/               # Route-based pages
│   │   ├── Home.jsx        # Landing page
│   │   ├── Events.jsx      # Event listing
│   │   ├── EventDetail.jsx # Single event view
│   │   ├── CreateEvent.jsx # Event creation form
│   │   └── Admin.jsx       # Admin dashboard
│   ├── services/            # API integration
│   │   ├── api.js          # Axios configuration
│   │   ├── eventService.js # Event API calls
│   │   └── websocket.js    # Socket.IO connection
│   ├── hooks/               # Custom React hooks
│   │   ├── useEvents.js
│   │   ├── useAuth.js
│   │   └── useWebSocket.js
│   ├── store/               # State management (Zustand)
│   │   ├── authStore.js
│   │   └── eventStore.js
│   ├── theme/               # MUI theme configuration
│   │   └── theme.js
│   ├── utils/               # Utility functions
│   │   ├── dateUtils.js
│   │   └── validation.js
│   ├── App.jsx             # Main app component
│   ├── main.jsx            # Entry point
│   └── index.css           # Global styles
├── nginx/                   # NGINX configuration for production
│   └── nginx.conf
├── .env.development         # Development environment variables
├── .env.production          # Production environment variables
├── Dockerfile              # Multi-stage Docker build
├── package.json            # Dependencies
├── vite.config.js          # Vite configuration
└── README.md               # This file
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20.x LTS
- npm 10.x or yarn 1.22.x

### Installation

```bash
# Install dependencies
npm install

# Or using yarn
yarn install
```

### Environment Configuration

**Development (.env.development):**
```env
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
VITE_ENV=development
```

**Production (.env.production):**
```env
VITE_API_URL=
VITE_WS_URL=
VITE_ENV=production
```

### Development Server

```bash
# Start development server
npm run dev

# Server will run on http://localhost:5173
# Hot module replacement (HMR) enabled
```

### Building for Production

```bash
# Build optimized production bundle
npm run build

# Output directory: dist/
# Bundle size: ~200-300 KB (gzipped)

# Preview production build locally
npm run preview
```

## 🔧 Key Features

### 1. Event Discovery
- **Browse Events**: Paginated list with filtering and search
- **Search**: Real-time search by title, description, location
- **Filter**: By category, date range, availability
- **Sort**: By date, popularity, capacity

### 2. Event Details
- **Comprehensive Info**: Title, description, date/time, location, category
- **RSVP Management**: Real-time capacity tracking
- **Visual Indicators**: Status badges, capacity progress bars
- **Social Sharing**: Share event details

### 3. Event Creation
- **Guided Form**: Step-by-step event creation
- **Validation**: Client-side validation with helpful error messages
- **Date/Time Picker**: Material-UI date picker
- **Category Selection**: Dropdown with predefined categories
- **Image Upload**: Optional event image (future feature)

### 4. Admin Dashboard
- **Statistics Cards**: Total events, RSVPs, attendance rate
- **Charts**: 
  - Event creation trend (line chart)
  - Category distribution (pie chart)
  - Attendance analytics (bar chart)
- **Quick Actions**: Create event, view reports

### 5. Real-time Updates
- **WebSocket Connection**: Live event updates
- **Event Notifications**: New events, updates, cancellations
- **RSVP Notifications**: Real-time RSVP confirmations
- **Capacity Warnings**: When events approach capacity

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Breakpoints**:
  - xs: 0-600px (mobile)
  - sm: 600-900px (tablet)
  - md: 900-1200px (small desktop)
  - lg: 1200-1536px (desktop)
  - xl: 1536px+ (large desktop)
- **Touch Optimized**: Large buttons, easy navigation

## 🎨 Theming

**Material-UI Theme Customization:**
```javascript
// src/theme/theme.js
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',  // Blue
    },
    secondary: {
      main: '#dc004e',  // Pink
    },
    success: {
      main: '#4caf50',  // Green
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
  },
  components: {
    // Component-specific overrides
  },
});
```

## 🔌 API Integration

### Events API

```javascript
// src/services/eventService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export const eventService = {
  // Get all events
  getAllEvents: () => axios.get(`${API_URL}/api/v1/events`),
  
  // Get single event
  getEvent: (id) => axios.get(`${API_URL}/api/v1/events/${id}`),
  
  // Create event
  createEvent: (data) => axios.post(`${API_URL}/api/v1/events`, data),
  
  // Update event
  updateEvent: (id, data) => axios.put(`${API_URL}/api/v1/events/${id}`, data),
  
  // Delete event
  deleteEvent: (id) => axios.delete(`${API_URL}/api/v1/events/${id}`),
  
  // Create RSVP
  createRSVP: (eventId, data) => 
    axios.post(`${API_URL}/api/v1/events/${eventId}/rsvp`, data),
  
  // Get analytics
  getAnalytics: () => axios.get(`${API_URL}/api/v1/analytics/statistics`),
};
```

### WebSocket Connection

```javascript
// src/services/websocket.js
import io from 'socket.io-client';

const WS_URL = import.meta.env.VITE_WS_URL;

export const connectWebSocket = () => {
  const socket = io(WS_URL);
  
  socket.on('connect', () => {
    console.log('WebSocket connected');
  });
  
  socket.on('event:created', (data) => {
    // Handle new event
  });
  
  socket.on('event:updated', (data) => {
    // Handle event update
  });
  
  return socket;
};
```

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests in watch mode
npm test -- --watch

# Generate coverage report
npm test -- --coverage
```

## 🐳 Docker

### Build Docker Image

```bash
# Build image
docker build -t campus-events-frontend:latest .

# Run container
docker run -p 80:80 campus-events-frontend:latest

# Access at http://localhost
```

### Multi-stage Dockerfile

```dockerfile
# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Stage 2: Production
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🔒 Security

- **HTTPS Only**: Force HTTPS in production
- **CORS**: Configured in backend
- **XSS Protection**: React's built-in protection
- **Input Sanitization**: Client-side validation
- **Content Security Policy**: Set via NGINX headers
- **No Sensitive Data**: API keys in environment variables only

## 📊 Performance

- **Bundle Size**: ~200-300 KB (gzipped)
- **Lighthouse Score**: 90+ (Performance, Accessibility, Best Practices, SEO)
- **Lazy Loading**: Route-based code splitting
- **Tree Shaking**: Vite automatically removes unused code
- **Asset Optimization**: Images optimized, fonts subset

## 🔧 Development Tips

### Hot Module Replacement (HMR)

Vite provides instant HMR. Changes reflect immediately without full page reload.

### ESLint & Prettier

```bash
# Lint code
npm run lint

# Format code
npm run format
```

### Debugging

```javascript
// Enable React DevTools
// Install React Developer Tools browser extension

// Console logging
console.log('Debug info:', data);

// React Query DevTools (included in dev mode)
// Bottom-left corner of the app
```

## 🚢 Deployment

### Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: campus-events
spec:
  replicas: 2
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
      - name: frontend
        image: <ecr-repo>/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
```

### CI/CD Pipeline

GitHub Actions automatically builds and deploys on push to `main` branch.

## 📝 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `http://localhost:8080` |
| `VITE_WS_URL` | WebSocket URL | `http://localhost:8080` |
| `VITE_ENV` | Environment | `development` or `production` |

## 🐛 Troubleshooting

### Issue: API Calls Failing

**Cause**: Backend not running or CORS issues

**Solution**:
```bash
# Check backend is running
curl http://localhost:8080/health

# Check VITE_API_URL in .env.development
echo $VITE_API_URL

# Restart dev server
npm run dev
```

### Issue: WebSocket Connection Errors

**Cause**: WebSocket server not configured

**Solution**: WebSocket errors are normal until backend WebSocket is implemented. App works without it.

### Issue: Build Errors

**Cause**: Dependencies out of sync

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf node_modules/.vite
npm run dev
```

## 📚 Additional Resources

- [React Documentation](https://react.dev/)
- [Vite Guide](https://vitejs.dev/guide/)
- [Material-UI](https://mui.com/)
- [React Router](https://reactrouter.com/)
- [Socket.IO Client](https://socket.io/docs/v4/client-api/)

## 🤝 Contributing

1. Follow React best practices
2. Use functional components and hooks
3. Write prop-types or TypeScript (future)
4. Test components before committing
5. Follow existing code style

## 📄 License

Part of the Campus Events EKS Project for ENPM818R.

---

**Built with** ❤️ **using React and Vite**
