// Analytics Routes
import express from 'express'
import {
  getEventStatistics,
  getCategoryDistribution,
  getEventsTrend,
  getAttendanceAnalytics,
} from '../controllers/analyticsController.js'

const router = express.Router()

router.get('/statistics', getEventStatistics)
router.get('/categories', getCategoryDistribution)
router.get('/trends', getEventsTrend)
router.get('/attendance', getAttendanceAnalytics)

export default router
