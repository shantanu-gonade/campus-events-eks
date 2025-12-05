import Joi from 'joi'

export const eventSchema = Joi.object({
  title: Joi.string().min(3).max(200).required().trim(),
  description: Joi.string().max(2000).required().trim(),
  startDateTime: Joi.date().iso().min('now').required(),
  endDateTime: Joi.date().iso().greater(Joi.ref('startDateTime')).required(),
  location: Joi.string().max(200).required().trim(),
  capacity: Joi.number().integer().min(1).max(1000).required()
})

export const rsvpSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().trim(),
  email: Joi.string().email().required().trim().lowercase()
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

      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      })
    }

    req.body = value
    next()
  }
}
