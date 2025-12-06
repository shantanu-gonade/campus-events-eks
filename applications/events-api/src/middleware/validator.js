import Joi from 'joi'

// Allow events starting within the last hour (for timezone/clock differences)
const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

export const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().trim(),
  description: Joi.string().max(2000).required().trim(),
  start_time: Joi.date().iso().min(oneHourAgo).required().messages({
    'date.min': 'Start time must not be more than 1 hour in the past'
  }),
  end_time: Joi.date().iso().greater(Joi.ref('start_time')).required().messages({
    'date.greater': 'End time must be after start time'
  }),
  location: Joi.string().max(200).required().trim(),
  category: Joi.string().valid('Workshop', 'Seminar', 'Social', 'Sports', 'Cultural', 'Career', 'Hackathon', 'Conference', 'Club Meeting', 'Other').optional().default('Other'),
  max_attendees: Joi.number().integer().min(1).max(1000).required()
})

export const eventUpdateSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional().trim(),
  description: Joi.string().max(2000).optional().trim(),
  start_time: Joi.date().iso().min(oneHourAgo).optional().messages({
    'date.min': 'Start time must not be more than 1 hour in the past'
  }),
  end_time: Joi.date().iso().greater(Joi.ref('start_time')).optional().messages({
    'date.greater': 'End time must be after start time'
  }),
  location: Joi.string().max(200).optional().trim(),
  category: Joi.string().valid('Workshop', 'Seminar', 'Social', 'Sports', 'Cultural', 'Career', 'Hackathon', 'Conference', 'Club Meeting', 'Other').optional(),
  status: Joi.string().valid('upcoming', 'ongoing', 'completed', 'cancelled').optional(),
  max_attendees: Joi.number().integer().min(1).max(1000).optional()
}).min(1) // At least one field must be provided

export const rsvpSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim().lowercase(),
  phone: Joi.string().optional().trim().allow(''),
  notes: Joi.string().max(500).optional().trim().allow('')
})

export const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    })

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))

      console.log('Validation Errors:', JSON.stringify(errors, null, 2))

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      })
    }

    req.body = value
    next()
  }
}
