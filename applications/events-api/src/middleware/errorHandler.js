import logger from '../utils/logger.js'

export const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method
  })

  // Default error
  let status = err.status || 500
  let message = err.message || 'Internal server error'

  // Database errors
  if (err.code === '23505') {
    status = 409
    message = 'Resource already exists'
  } else if (err.code === '23503') {
    status = 400
    message = 'Referenced resource does not exist'
  } else if (err.code === '22P02') {
    status = 400
    message = 'Invalid input format'
  }

  res.status(status).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}
