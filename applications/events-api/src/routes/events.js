import express from 'express'
import { getAllEvents, getEventById, createEvent, createRSVP } from '../controllers/eventController.js'
import { validate, eventSchema, rsvpSchema } from '../middleware/validator.js'

const router = express.Router()

router.get('/', getAllEvents)
router.get('/:id', getEventById)
router.post('/', validate(eventSchema), createEvent)
router.post('/:id/rsvp', validate(rsvpSchema), createRSVP)

export default router
