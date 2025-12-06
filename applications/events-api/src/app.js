// Load environment variables FIRST before any other imports
import dotenv from 'dotenv'
dotenv.config()

// Now import everything else
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import promClient from 'prom-client'
import eventRoutes from './routes/events.js'
import analyticsRoutes from './routes/analytics.js'
import { errorHandler } from './middleware/errorHandler.js'
import logger from './utils/logger.js'
import { createServer } from 'http'
import { Server } from 'socket.io'

const app = express()
const httpServer = createServer(app)
const PORT = process.env.PORT || 8080

// Socket.IO setup - handle multiple origins
const socketAllowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['*']

const io = new Server(httpServer, {
  cors: {
    origin: socketAllowedOrigins,
    credentials: true
  }
})

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`WebSocket client connected: ${socket.id}`)
  
  socket.on('disconnect', () => {
    logger.info(`WebSocket client disconnected: ${socket.id}`)
  })
})

// Export io for use in controllers
export { io }

// Trust proxy configuration (only enable in production behind ALB)
const trustProxy = process.env.TRUST_PROXY === 'true' || process.env.NODE_ENV === 'production'
app.set('trust proxy', trustProxy)

// Prometheus metrics setup
const register = new promClient.Registry()
promClient.collectDefaultMetrics({ register })

// Custom metrics
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5]
})

const httpRequestTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code']
})

register.registerMetric(httpRequestDuration)
register.registerMetric(httpRequestTotal)

// Metrics middleware
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000
    const route = req.route ? req.route.path : req.path
    
    httpRequestDuration.labels(req.method, route, res.statusCode).observe(duration)
    httpRequestTotal.labels(req.method, route, res.statusCode).inc()
  })
  
  next()
})

// Security middleware
app.use(helmet())

// CORS configuration - handle multiple origins properly
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['*']

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true)
    
    // Allow all if * specified
    if (allowedOrigins.includes('*')) return callback(null, true)
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes default
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // limit each IP
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting in development if trust proxy is false
  skip: (req) => {
    if (process.env.NODE_ENV === 'development' && !trustProxy) {
      return false // Still apply rate limit in dev for testing
    }
    return false
  }
})
app.use('/api/', limiter)

// Logging
app.use(morgan('combined'))

// Body parsing
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Metrics endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType)
  res.end(await register.metrics())
})

// Health check - handle both root and /api prefix
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() })
})

app.get('/ready', async (req, res) => {
  try {
    const { default: pool } = await import('./config/database.js')
    await pool.query('SELECT 1')
    res.json({ status: 'ready', timestamp: new Date().toISOString() })
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message })
  }
})

app.get('/api/ready', async (req, res) => {
  try {
    const { default: pool } = await import('./config/database.js')
    await pool.query('SELECT 1')
    res.json({ status: 'ready', timestamp: new Date().toISOString() })
  } catch (error) {
    res.status(503).json({ status: 'not ready', error: error.message })
  }
})

// Routes - handle both with and without /api prefix
app.use('/v1/events', eventRoutes)
app.use('/api/v1/events', eventRoutes)

// Analytics routes
app.use('/v1/analytics', analyticsRoutes)
app.use('/api/v1/analytics', analyticsRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use(errorHandler)

// Start server
httpServer.listen(PORT, '0.0.0.0', () => {
  logger.info(`Events API listening on port ${PORT}`)
  logger.info(`WebSocket server ready on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})
