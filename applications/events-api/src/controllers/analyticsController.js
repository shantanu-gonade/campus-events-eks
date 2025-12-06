// Analytics Controller
import pool from '../config/database.js'
import logger from '../utils/logger.js'

// Get overall event statistics
export const getEventStatistics = async (req, res, next) => {
  try {
    // Total events
    const totalEventsResult = await pool.query(
      `SELECT COUNT(*) as total FROM events WHERE status != 'cancelled'`
    )
    
    // Upcoming events
    const upcomingEventsResult = await pool.query(
      `SELECT COUNT(*) as total FROM events WHERE start_time > NOW() AND status = 'upcoming'`
    )
    
    // Past events
    const pastEventsResult = await pool.query(
      `SELECT COUNT(*) as total FROM events WHERE end_time < NOW() AND status != 'cancelled'`
    )
    
    // Total RSVPs
    const totalRSVPsResult = await pool.query(
      `SELECT COUNT(*) as total FROM rsvps WHERE status = 'confirmed'`
    )
    
    // Average attendance rate
    const avgAttendanceResult = await pool.query(`
      SELECT 
        ROUND(AVG((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100), 2) as avg_rate
      FROM events 
      WHERE end_time < NOW() AND status != 'cancelled'
    `)
    
    // Unique users who have RSVPed
    const uniqueUsersResult = await pool.query(
      `SELECT COUNT(DISTINCT user_id) as total FROM rsvps WHERE status = 'confirmed'`
    )
    
    // Events by status
    const statusBreakdownResult = await pool.query(`
      SELECT status, COUNT(*) as count
      FROM events
      WHERE status != 'cancelled'
      GROUP BY status
    `)
    
    const statistics = {
      total_events: parseInt(totalEventsResult.rows[0].total),
      upcoming_events: parseInt(upcomingEventsResult.rows[0].total),
      past_events: parseInt(pastEventsResult.rows[0].total),
      total_rsvps: parseInt(totalRSVPsResult.rows[0].total),
      average_attendance_rate: parseFloat(avgAttendanceResult.rows[0].avg_rate) || 0,
      unique_attendees: parseInt(uniqueUsersResult.rows[0].total),
      status_breakdown: statusBreakdownResult.rows
    }
    
    logger.info('Event statistics retrieved')
    res.json(statistics)
  } catch (error) {
    logger.error('Error fetching event statistics:', error)
    next(error)
  }
}

// Get category distribution
export const getCategoryDistribution = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        category,
        COUNT(*) as count,
        ROUND((COUNT(*)::numeric / (SELECT COUNT(*) FROM events WHERE status != 'cancelled')::numeric) * 100, 2) as percentage
      FROM events
      WHERE status != 'cancelled'
      GROUP BY category
      ORDER BY count DESC
    `)
    
    logger.info('Category distribution retrieved')
    res.json(result.rows)
  } catch (error) {
    logger.error('Error fetching category distribution:', error)
    next(error)
  }
}

// Get events trend over time
export const getEventsTrend = async (req, res, next) => {
  try {
    const { months = 6 } = req.query
    
    const result = await pool.query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
        TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month_label,
        COUNT(*) as events_created,
        SUM((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed')) as total_rsvps
      FROM events e
      WHERE created_at >= NOW() - INTERVAL '${parseInt(months)} months'
        AND status != 'cancelled'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `)
    
    logger.info(`Events trend for last ${months} months retrieved`)
    res.json(result.rows)
  } catch (error) {
    logger.error('Error fetching events trend:', error)
    next(error)
  }
}

// Get attendance analytics
export const getAttendanceAnalytics = async (req, res, next) => {
  try {
    // Overall attendance metrics
    const overallResult = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        ROUND(AVG((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100), 2) as avg_attendance_rate,
        MAX((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100) as max_attendance_rate,
        MIN((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100) as min_attendance_rate
      FROM events
      WHERE status != 'cancelled'
    `)
    
    // Attendance by category
    const categoryResult = await pool.query(`
      SELECT 
        category,
        COUNT(*) as event_count,
        ROUND(AVG((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100), 2) as avg_attendance_rate,
        SUM(current_attendees) as total_attendees,
        SUM(max_attendees) as total_capacity
      FROM events
      WHERE status != 'cancelled'
      GROUP BY category
      ORDER BY avg_attendance_rate DESC
    `)
    
    // Most popular events
    const popularResult = await pool.query(`
      SELECT 
        id,
        title,
        category,
        start_time,
        location,
        current_attendees,
        max_attendees,
        ROUND((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100, 2) as attendance_rate
      FROM events
      WHERE status != 'cancelled'
      ORDER BY current_attendees DESC, attendance_rate DESC
      LIMIT 10
    `)
    
    const analytics = {
      overall: overallResult.rows[0],
      by_category: categoryResult.rows,
      most_popular: popularResult.rows
    }
    
    logger.info('Attendance analytics retrieved')
    res.json(analytics)
  } catch (error) {
    logger.error('Error fetching attendance analytics:', error)
    next(error)
  }
}

// Get recent activity feed
export const getRecentActivity = async (req, res, next) => {
  try {
    const { limit = 20 } = req.query
    
    // Combine events and RSVPs into activity feed
    const activities = []
    
    // Recent events created
    const recentEvents = await pool.query(`
      SELECT 
        id,
        title,
        category,
        created_at,
        'event_created' as activity_type
      FROM events
      WHERE status != 'cancelled'
      ORDER BY created_at DESC
      LIMIT $1
    `, [parseInt(limit)])
    
    // Recent RSVPs
    const recentRSVPs = await pool.query(`
      SELECT 
        r.id,
        r.created_at,
        e.title as event_title,
        e.id as event_id,
        u.first_name,
        u.last_name,
        'rsvp_created' as activity_type
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      JOIN users u ON r.user_id = u.id
      WHERE r.status = 'confirmed'
      ORDER BY r.created_at DESC
      LIMIT $1
    `, [parseInt(limit)])
    
    // Merge and sort activities
    const allActivities = [
      ...recentEvents.rows.map(e => ({
        id: e.id,
        type: 'event_created',
        title: `New event created: ${e.title}`,
        category: e.category,
        timestamp: e.created_at,
        metadata: {
          event_id: e.id,
          event_title: e.title
        }
      })),
      ...recentRSVPs.rows.map(r => ({
        id: r.id,
        type: 'rsvp_created',
        title: `${r.first_name} ${r.last_name} registered for ${r.event_title}`,
        timestamp: r.created_at,
        metadata: {
          event_id: r.event_id,
          event_title: r.event_title,
          user_name: `${r.first_name} ${r.last_name}`
        }
      }))
    ]
    
    // Sort by timestamp descending
    allActivities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    
    logger.info(`Recent activity retrieved (${allActivities.length} items)`)
    res.json(allActivities.slice(0, parseInt(limit)))
  } catch (error) {
    logger.error('Error fetching recent activity:', error)
    next(error)
  }
}

// Get event capacity status
export const getCapacityStatus = async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) FILTER (WHERE (current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) >= 0.9) as nearly_full,
        COUNT(*) FILTER (WHERE (current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) >= 1.0) as full,
        COUNT(*) FILTER (WHERE (current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) < 0.5) as low_attendance,
        COUNT(*) as total_upcoming
      FROM events
      WHERE start_time > NOW() AND status = 'upcoming'
    `)
    
    logger.info('Capacity status retrieved')
    res.json(result.rows[0])
  } catch (error) {
    logger.error('Error fetching capacity status:', error)
    next(error)
  }
}

// Get monthly comparison
export const getMonthlyComparison = async (req, res, next) => {
  try {
    const result = await pool.query(`
      WITH monthly_stats AS (
        SELECT 
          TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
          TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month_label,
          COUNT(*) as events_count,
          SUM((SELECT COUNT(*) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed')) as rsvps_count,
          ROUND(AVG((current_attendees::numeric / NULLIF(max_attendees::numeric, 1)) * 100), 2) as avg_attendance
        FROM events e
        WHERE created_at >= NOW() - INTERVAL '6 months'
          AND status != 'cancelled'
        GROUP BY DATE_TRUNC('month', created_at)
        ORDER BY month DESC
      )
      SELECT *,
        LAG(events_count) OVER (ORDER BY month) as prev_events_count,
        LAG(rsvps_count) OVER (ORDER BY month) as prev_rsvps_count
      FROM monthly_stats
      ORDER BY month DESC
      LIMIT 6
    `)
    
    logger.info('Monthly comparison retrieved')
    res.json(result.rows)
  } catch (error) {
    logger.error('Error fetching monthly comparison:', error)
    next(error)
  }
}
