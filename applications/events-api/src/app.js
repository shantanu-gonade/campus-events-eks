import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import rateLimit from 'express-rate-limit'
import dotenv from 'dotenv'
import promClient from 'prom-client'
import eventRoutes from './routes/events.js'
import { errorHandler } from './middleware/errorHandler.js'
import logger from './utils/logger.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 8080

// Trust proxy for ALB
app.set('trust proxy', true)

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
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
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

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use(errorHandler)

// Start server
app.listen(PORT, '0.0.0.0', () => {
  logger.info(`Events API listening on port ${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully')
  process.exit(0)
})
