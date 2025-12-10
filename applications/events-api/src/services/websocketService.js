// WebSocket Service
import { Server } from 'socket.io'
import logger from '../utils/logger.js'

let io

export const initializeWebSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    path: '/socket.io/',
    transports: ['websocket', 'polling']
  })

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.id}`)

    // Handle client disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`WebSocket client disconnected: ${socket.id}, reason: ${reason}`)
    })

    // Handle errors
    socket.on('error', (error) => {
      logger.error(`WebSocket error from ${socket.id}:`, error)
    })

    // Send welcome message
    socket.emit('connected', { 
      message: 'Connected to Campus Events WebSocket server',
      socketId: socket.id,
      timestamp: new Date().toISOString()
    })
  })

  logger.info('WebSocket server initialized successfully')
  return io
}

export const getIO = () => {
  if (!io) {
    throw new Error('WebSocket not initialized. Call initializeWebSocket first.')
  }
  return io
}

// Event emission functions
export const emitEventCreated = (event) => {
  if (io) {
    logger.info(`Emitting event:created for event ${event.id}`)
    io.emit('event:created', {
      type: 'event:created',
      data: event,
      timestamp: new Date().toISOString()
    })
  }
}

export const emitEventUpdated = (event) => {
  if (io) {
    logger.info(`Emitting event:updated for event ${event.id}`)
    io.emit('event:updated', {
      type: 'event:updated',
      data: event,
      timestamp: new Date().toISOString()
    })
  }
}

export const emitEventDeleted = (eventId) => {
  if (io) {
    logger.info(`Emitting event:deleted for event ${eventId}`)
    io.emit('event:deleted', {
      type: 'event:deleted',
      data: { id: eventId },
      timestamp: new Date().toISOString()
    })
  }
}

export const emitRSVPCreated = (rsvp) => {
  if (io) {
    logger.info(`Emitting rsvp:created for RSVP ${rsvp.id}`)
    io.emit('rsvp:created', {
      type: 'rsvp:created',
      data: rsvp,
      timestamp: new Date().toISOString()
    })
  }
}

export const emitRSVPCancelled = (rsvpId, eventId) => {
  if (io) {
    logger.info(`Emitting rsvp:cancelled for RSVP ${rsvpId}`)
    io.emit('rsvp:cancelled', {
      type: 'rsvp:cancelled',
      data: { id: rsvpId, event_id: eventId },
      timestamp: new Date().toISOString()
    })
  }
}

export const emitCapacityWarning = (event) => {
  if (io) {
    logger.info(`Emitting capacity:warning for event ${event.event_id}`)
    io.emit('capacity:warning', {
      type: 'capacity:warning',
      data: event,
      timestamp: new Date().toISOString()
    })
  }
}

export default {
  initializeWebSocket,
  getIO,
  emitEventCreated,
  emitEventUpdated,
  emitEventDeleted,
  emitRSVPCreated,
  emitRSVPCancelled,
  emitCapacityWarning
}
