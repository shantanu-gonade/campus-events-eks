import express from 'express'
import {
  getEventStatistics,
  getCategoryDistribution,
  getEventsTrend,
  getAttendanceAnalytics,
  getRecentActivity,
  getCapacityStatus,
  getMonthlyComparison
} from '../controllers/analyticsController.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/analytics/statistics:
 *   get:
 *     summary: Get overall event statistics
 *     description: Retrieve comprehensive statistics including total events, attendees, and capacity metrics
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total_events:
 *                   type: integer
 *                   example: 125
 *                 upcoming_events:
 *                   type: integer
 *                   example: 45
 *                 total_attendees:
 *                   type: integer
 *                   example: 3450
 *                 average_attendance_rate:
 *                   type: number
 *                   format: float
 *                   example: 78.5
 *                 total_capacity:
 *                   type: integer
 *                   example: 5000
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/statistics', getEventStatistics)

/**
 * @swagger
 * /api/v1/analytics/categories:
 *   get:
 *     summary: Get event distribution by category
 *     description: Retrieve the number of events in each category
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Category distribution retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: integer
 *               example:
 *                 Workshop: 25
 *                 Seminar: 18
 *                 Social: 32
 *                 Sports: 15
 *                 Cultural: 20
 *                 Career: 8
 *                 Hackathon: 4
 *                 Conference: 3
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/categories', getCategoryDistribution)

/**
 * @swagger
 * /api/v1/analytics/trends:
 *   get:
 *     summary: Get events trend over time
 *     description: Retrieve event creation and attendance trends
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *         description: Time period for trend analysis
 *     responses:
 *       200:
 *         description: Trends retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   date:
 *                     type: string
 *                     format: date
 *                   event_count:
 *                     type: integer
 *                   attendee_count:
 *                     type: integer
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/trends', getEventsTrend)

/**
 * @swagger
 * /api/v1/analytics/attendance:
 *   get:
 *     summary: Get attendance analytics
 *     description: Retrieve detailed attendance metrics and patterns
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Attendance analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 average_attendance_per_event:
 *                   type: number
 *                   format: float
 *                 highest_attended_event:
 *                   type: object
 *                   properties:
 *                     event_id:
 *                       type: string
 *                     title:
 *                       type: string
 *                     attendees:
 *                       type: integer
 *                 attendance_by_category:
 *                   type: object
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/attendance', getAttendanceAnalytics)

/**
 * @swagger
 * /api/v1/analytics/activity:
 *   get:
 *     summary: Get recent activity
 *     description: Retrieve recent event creations and RSVPs
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of recent activities to return
 *     responses:
 *       200:
 *         description: Recent activity retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recent_events:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 recent_rsvps:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/RSVP'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/activity', getRecentActivity)

/**
 * @swagger
 * /api/v1/analytics/capacity:
 *   get:
 *     summary: Get capacity status across events
 *     description: Retrieve capacity utilization metrics for all upcoming events
 *     tags: [Analytics]
 *     responses:
 *       200:
 *         description: Capacity status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 events_near_capacity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       event_id:
 *                         type: string
 *                       title:
 *                         type: string
 *                       capacity_percentage:
 *                         type: number
 *                         format: float
 *                 average_capacity_utilization:
 *                   type: number
 *                   format: float
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/capacity', getCapacityStatus)

/**
 * @swagger
 * /api/v1/analytics/monthly:
 *   get:
 *     summary: Get monthly comparison
 *     description: Compare current month metrics with previous months
 *     tags: [Analytics]
 *     parameters:
 *       - in: query
 *         name: months
 *         schema:
 *           type: integer
 *           default: 6
 *         description: Number of months to compare
 *     responses:
 *       200:
 *         description: Monthly comparison retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   month:
 *                     type: string
 *                   events_created:
 *                     type: integer
 *                   total_attendees:
 *                     type: integer
 *                   average_attendance_rate:
 *                     type: number
 *                     format: float
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/monthly', getMonthlyComparison)

export default router
