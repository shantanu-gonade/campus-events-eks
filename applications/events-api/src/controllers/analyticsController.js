// Analytics Controller
import pool from '../config/database.js'
import logger from '../config/logger.js'

// Get Event Statistics
export const getEventStatistics = async (req, res, next) => {
  try {
    // Get total events
    const totalEvents = await pool.query('SELECT COUNT(*) FROM events')
    
    // Get upcoming events
    const upcomingEvents = await pool.query(
      'SELECT COUNT(*) FROM events WHERE start_time > NOW()'
    )
    
    // Get past events
    const pastEvents = await pool.query(
      'SELECT COUNT(*) FROM events WHERE end_time < NOW()'
    )
    
    // Get total RSVPs
    const totalRsvps = await pool.query('SELECT COUNT(*) FROM rsvps')
    
    // Get average attendance rate
    const attendanceRate = await pool.query(`
      SELECT AVG((current_attendees::float / max_attendees::float) * 100) as avg_rate
      FROM events
      WHERE max_attendees > 0
    `)
    
    // Get active events (currently ongoing)
    const activeEvents = await pool.query(
      'SELECT COUNT(*) FROM events WHERE start_time <= NOW() AND end_time >= NOW()'
    )

    const statistics = {
      total_events: parseInt(totalEvents.rows[0].count),
      upcoming_events: parseInt(upcomingEvents.rows[0].count),
      past_events: parseInt(pastEvents.rows[0].count),
      total_rsvps: parseInt(totalRsvps.rows[0].count),
      average_attendance_rate: parseFloat(attendanceRate.rows[0].avg_rate || 0).toFixed(1),
      active_events: parseInt(activeEvents.rows[0].count),
    }

    logger.info('Event statistics retrieved')
    res.json(statistics)
  } catch (error) {
    next(error)
  }
}

// Get Category Distribution
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND(CAST((COUNT(*)::float / NULLIF((SELECT COUNT(*) FROM events)::float, 0)) * 100 AS numeric), 1) as percentage
      FROM events
      GROUP BY category
      ORDER BY count DESC
    `)

    logger.info('Category distribution retrieved')
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Get Events Trend (time series)
export const getEventsTrend = async (req, res, next) => {
  try {
    const { months = 6 } = req.query

    const result = await pool.query(`
      WITH monthly_events AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month_date,
          COUNT(*) as event_count
        FROM events
        WHERE created_at >= NOW() - INTERVAL '${parseInt(months)} months'
        GROUP BY DATE_TRUNC('month', created_at)
      ),
      monthly_rsvps AS (
        SELECT 
          DATE_TRUNC('month', created_at) as month_date,
          COUNT(*) as rsvp_count
        FROM rsvps
        WHERE created_at >= NOW() - INTERVAL '${parseInt(months)} months'
        GROUP BY DATE_TRUNC('month', created_at)
      )
      SELECT 
        TO_CHAR(me.month_date, 'Mon YYYY') as month,
        TO_CHAR(me.month_date, 'YYYY-MM') as month_key,
        COALESCE(me.event_count, 0) as event_count,
        COALESCE(mr.rsvp_count, 0) as rsvp_count
      FROM monthly_events me
      LEFT JOIN monthly_rsvps mr ON me.month_date = mr.month_date
      ORDER BY me.month_date DESC
    `)

    logger.info('Events trend retrieved')
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

// Get Attendance Analytics
export const getAttendanceAnalytics = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        AVG((current_attendees::float / NULLIF(max_attendees::float, 0)) * 100) as average_rate,
        MIN((current_attendees::float / NULLIF(max_attendees::float, 0)) * 100) as min_rate,
        MAX((current_attendees::float / NULLIF(max_attendees::float, 0)) * 100) as max_rate,
        COUNT(*) as total_events,
        SUM(CASE WHEN (current_attendees::float / NULLIF(max_attendees::float, 0)) >= 0.9 THEN 1 ELSE 0 END) as near_capacity_events
      FROM events
      WHERE max_attendees > 0
    `)

    const topEvents = await pool.query(`
      SELECT 
        id,
        title,
        current_attendees,
        max_attendees,
        ROUND(CAST((current_attendees::float / NULLIF(max_attendees::float, 0)) * 100 AS numeric), 1) as attendance_rate
      FROM events
      WHERE max_attendees > 0
      ORDER BY attendance_rate DESC
      LIMIT 10
    `)

    const analytics = {
      overall: result.rows[0],
      top_events: topEvents.rows,
    }

    logger.info('Attendance analytics retrieved')
    res.json(analytics)
  } catch (error) {
    next(error)
  }
}
