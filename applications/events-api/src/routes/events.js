import express from 'express'
import { 
  getAllEvents, 
  getEventById, 
  getPastEvents,
  searchEvents,
  createEvent, 
  updateEvent,
  deleteEvent,
  createRSVP,
  getEventRSVPs,
  cancelRSVP,
  getUserRSVPs
} from '../controllers/eventController.js'
import { validate, eventSchema, eventUpdateSchema, rsvpSchema } from '../middleware/validator.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/events:
 *   get:
 *     summary: Get all upcoming events
 *     description: Retrieve a list of all upcoming events with optional filtering by category and status
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [Workshop, Seminar, Social, Sports, Cultural, Career, Hackathon, Conference, Club Meeting, Other]
 *         description: Filter events by category
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [upcoming, ongoing, completed, cancelled]
 *         description: Filter events by status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: List of events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/', getAllEvents)

/**
 * @swagger
 * /api/v1/events/past:
 *   get:
 *     summary: Get past events
 *     description: Retrieve a list of all completed events
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Maximum number of events to return
 *     responses:
 *       200:
 *         description: List of past events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/past', getPastEvents)

/**
 * @swagger
 * /api/v1/events/search:
 *   get:
 *     summary: Search events
 *     description: Search events by title, description, or location
 *     tags: [Events]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Search query string
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/search', searchEvents)

/**
 * @swagger
 * /api/v1/events/{id}:
 *   get:
 *     summary: Get event by ID
 *     description: Retrieve detailed information about a specific event
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id', getEventById)

/**
 * @swagger
 * /api/v1/events:
 *   post:
 *     summary: Create a new event
 *     description: Create a new campus event with all required details
 *     tags: [Events]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - start_time
 *               - end_time
 *               - location
 *               - max_attendees
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *                 example: "Tech Conference 2025"
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: "Annual technology conference featuring industry leaders"
 *               start_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-03-15T09:00:00Z"
 *               end_time:
 *                 type: string
 *                 format: date-time
 *                 example: "2025-03-15T17:00:00Z"
 *               location:
 *                 type: string
 *                 maxLength: 200
 *                 example: "Main Auditorium, Building A"
 *               max_attendees:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 example: 200
 *               category:
 *                 type: string
 *                 enum: [Workshop, Seminar, Social, Sports, Cultural, Career, Hackathon, Conference, Club Meeting, Other]
 *                 example: "Conference"
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/', validate(eventSchema), createEvent)

/**
 * @swagger
 * /api/v1/events/{id}:
 *   put:
 *     summary: Update an event
 *     description: Update an existing event with new details
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               start_time:
 *                 type: string
 *                 format: date-time
 *               end_time:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *                 maxLength: 200
 *               max_attendees:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *               category:
 *                 type: string
 *                 enum: [Workshop, Seminar, Social, Sports, Cultural, Career, Hackathon, Conference, Club Meeting, Other]
 *               status:
 *                 type: string
 *                 enum: [upcoming, ongoing, completed, cancelled]
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.put('/:id', validate(eventUpdateSchema), updateEvent)

/**
 * @swagger
 * /api/v1/events/{id}:
 *   delete:
 *     summary: Delete an event
 *     description: Delete an existing event (only if no RSVPs exist)
 *     tags: [Events]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Event deleted successfully"
 *       400:
 *         description: Cannot delete event with existing RSVPs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/:id', deleteEvent)

/**
 * @swagger
 * /api/v1/events/{id}/rsvp:
 *   post:
 *     summary: Create RSVP for an event
 *     description: Register attendance for an event
 *     tags: [RSVPs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john.doe@example.com"
 *     responses:
 *       201:
 *         description: RSVP created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RSVP'
 *       400:
 *         description: Event is full or RSVP already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.post('/:id/rsvp', validate(rsvpSchema), createRSVP)

/**
 * @swagger
 * /api/v1/events/{id}/rsvps:
 *   get:
 *     summary: Get all RSVPs for an event
 *     description: Retrieve list of all attendees registered for a specific event
 *     tags: [RSVPs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID
 *     responses:
 *       200:
 *         description: List of RSVPs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RSVP'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/:id/rsvps', getEventRSVPs)

/**
 * @swagger
 * /api/v1/events/rsvps/{id}:
 *   delete:
 *     summary: Cancel an RSVP
 *     description: Cancel a user's registration for an event
 *     tags: [RSVPs]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: RSVP ID
 *     responses:
 *       200:
 *         description: RSVP cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "RSVP cancelled successfully"
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.delete('/rsvps/:id', cancelRSVP)

/**
 * @swagger
 * /api/v1/events/users/rsvps:
 *   get:
 *     summary: Get user's RSVPs
 *     description: Retrieve all RSVPs for a specific user by email
 *     tags: [RSVPs]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *     responses:
 *       200:
 *         description: List of user's RSVPs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RSVP'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/users/rsvps', getUserRSVPs)

export default router
