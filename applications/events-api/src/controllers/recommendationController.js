// Recommendation Controller
import pool from '../config/database.js'
import logger from '../utils/logger.js'

// Get event recommendations for a user
export const getRecommendations = async (req, res, next) => {
  try {
    const { email } = req.query
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' })
    }

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      // User hasn't registered for any events yet, return popular events
      const popularEvents = await pool.query(`
        SELECT e.*, 
          COUNT(r.id) as rsvp_count,
          ROUND((e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) * 100, 1) as attendance_rate
        FROM events e
        LEFT JOIN rsvps r ON e.id = r.event_id
        WHERE e.start_time > NOW() AND e.status = 'upcoming'
        GROUP BY e.id
        ORDER BY rsvp_count DESC, e.start_time ASC
        LIMIT 5
      `)
      
      return res.json(popularEvents.rows)
    }

    const userId = userResult.rows[0].id

    // Get user's past RSVPs to analyze preferences
    const userRSVPs = await pool.query(`
      SELECT e.category, COUNT(*) as count
      FROM rsvps r
      JOIN events e ON r.event_id = e.id
      WHERE r.user_id = $1
      GROUP BY e.category
      ORDER BY count DESC
    `, [userId])

    // Get user's favorite categories
    const favoriteCategories = userRSVPs.rows.map(row => row.category)

    if (favoriteCategories.length === 0) {
      // User has no RSVP history, return popular events
      const popularEvents = await pool.query(`
        SELECT e.*, 
          COUNT(r.id) as rsvp_count,
          ROUND((e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) * 100, 1) as attendance_rate
        FROM events e
        LEFT JOIN rsvps r ON e.id = r.event_id
        WHERE e.start_time > NOW() AND e.status = 'upcoming'
        GROUP BY e.id
        ORDER BY rsvp_count DESC, e.start_time ASC
        LIMIT 5
      `)
      
      return res.json(popularEvents.rows)
    }

    // Build recommendation query with scoring
    const recommendations = await pool.query(`
      WITH event_scores AS (
        SELECT 
          e.*,
          COUNT(r.id) as rsvp_count,
          ROUND((e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) * 100, 1) as attendance_rate,
          -- Scoring algorithm
          (
            CASE 
              -- Category match score (40%)
              WHEN e.category = ANY($2::text[]) THEN 40
              ELSE 0
            END +
            -- Popularity score (30%) - normalized RSVP count
            LEAST(30, (COUNT(r.id)::float / 10) * 30) +
            -- Recency score (20%) - events starting soon
            CASE 
              WHEN e.start_time < NOW() + INTERVAL '7 days' THEN 20
              WHEN e.start_time < NOW() + INTERVAL '14 days' THEN 15
              WHEN e.start_time < NOW() + INTERVAL '30 days' THEN 10
              ELSE 5
            END +
            -- Capacity score (10%) - events with available space
            CASE 
              WHEN (e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) < 0.5 THEN 10
              WHEN (e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) < 0.8 THEN 7
              WHEN (e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) < 0.95 THEN 4
              ELSE 2
            END
          ) as recommendation_score
        FROM events e
        LEFT JOIN rsvps r ON e.id = r.event_id
        WHERE e.start_time > NOW() 
          AND e.status = 'upcoming'
          AND e.id NOT IN (
            -- Exclude events user has already registered for
            SELECT event_id FROM rsvps WHERE user_id = $1
          )
        GROUP BY e.id
      )
      SELECT *
      FROM event_scores
      ORDER BY recommendation_score DESC, start_time ASC
      LIMIT 5
    `, [userId, favoriteCategories])

    logger.info(`Generated ${recommendations.rows.length} recommendations for user ${email}`)
    res.json(recommendations.rows)
  } catch (error) {
    logger.error('Error generating recommendations:', error)
    next(error)
  }
}

// Get similar events based on an event ID
export const getSimilarEvents = async (req, res, next) => {
  try {
    const { id } = req.params

    // Get the source event
    const sourceEvent = await pool.query(
      'SELECT * FROM events WHERE id = $1',
      [id]
    )

    if (sourceEvent.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const { category, title } = sourceEvent.rows[0]

    // Find similar events
    const similarEvents = await pool.query(`
      SELECT e.*, 
        COUNT(r.id) as rsvp_count,
        ROUND((e.current_attendees::numeric / NULLIF(e.max_attendees::numeric, 1)) * 100, 1) as attendance_rate
      FROM events e
      LEFT JOIN rsvps r ON e.id = r.event_id
      WHERE e.id != $1
        AND e.start_time > NOW()
        AND e.status = 'upcoming'
        AND (
          e.category = $2
          OR e.title ILIKE $3
        )
      GROUP BY e.id
      ORDER BY 
        CASE WHEN e.category = $2 THEN 1 ELSE 2 END,
        rsvp_count DESC,
        e.start_time ASC
      LIMIT 5
    `, [id, category, `%${title.split(' ')[0]}%`])

    logger.info(`Found ${similarEvents.rows.length} similar events for event ${id}`)
    res.json(similarEvents.rows)
  } catch (error) {
    logger.error('Error finding similar events:', error)
    next(error)
  }
}
