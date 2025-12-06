// Recommendation Routes
import express from 'express'
import {
  getRecommendations,
  getSimilarEvents,
} from '../controllers/recommendationController.js'

const router = express.Router()

/**
 * @swagger
 * /api/v1/recommendations:
 *   get:
 *     summary: Get personalized event recommendations
 *     description: Get event recommendations based on user's past RSVPs and preferences
 *     tags: [Recommendations]
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *         description: User's email address
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of recommendations to return
 *     responses:
 *       200:
 *         description: Recommendations retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 recommendations:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Event'
 *                 reason:
 *                   type: string
 *                   description: Explanation for the recommendations
 *                   example: "Based on your interest in Workshop and Seminar events"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/recommendations', getRecommendations)

/**
 * @swagger
 * /api/v1/events/{id}/similar:
 *   get:
 *     summary: Get similar events
 *     description: Get events similar to a specific event based on category, location, and time
 *     tags: [Recommendations]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Event ID to find similar events for
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 5
 *         description: Number of similar events to return
 *     responses:
 *       200:
 *         description: Similar events retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/ServerError'
 */
router.get('/events/:id/similar', getSimilarEvents)

export default router
