import pool from '../config/database.js'
import logger from '../utils/logger.js'

export const getAllEvents = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, 
        COUNT(r.id) as rsvp_count 
       FROM events e 
       LEFT JOIN rsvps r ON e.id = r.event_id 
       WHERE e.start_time >= NOW()
       GROUP BY e.id 
       ORDER BY e.start_time ASC`
    )
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

export const getEventById = async (req, res, next) => {
  try {
    const { id } = req.params
    
    const result = await pool.query(
      `SELECT e.*, 
        COUNT(r.id) as rsvp_count 
       FROM events e 
       LEFT JOIN rsvps r ON e.id = r.event_id 
       WHERE e.id = $1 
       GROUP BY e.id`,
      [id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export const createEvent = async (req, res, next) => {
  try {
    const { title, description, start_time, end_time, location, max_attendees, category } = req.body
    
    // Get the demo organizer (MVP - no auth yet)
    const organizer = await pool.query(
      `SELECT id FROM users WHERE role IN ('organizer', 'admin') ORDER BY created_at LIMIT 1`
    )
    
    if (organizer.rows.length === 0) {
      return res.status(500).json({ error: 'No organizer found. Please run database setup.' })
    }
    
    const result = await pool.query(
      `INSERT INTO events (title, description, start_time, end_time, location, max_attendees, organizer_id, category) 
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) 
       RETURNING *`,
      [title, description, start_time, end_time, location, max_attendees, organizer.rows[0].id, category || 'Other']
    )
    
    logger.info('Event created:', result.rows[0].id)
    res.status(201).json(result.rows[0])
  } catch (error) {
    logger.error('Error creating event:', error)
    next(error)
  }
}

export const createRSVP = async (req, res, next) => {
  try {
    const { id: eventId } = req.params
    const { name, email } = req.body
    
    // Check event exists and capacity
    const eventCheck = await pool.query(
      `SELECT e.max_attendees, e.current_attendees 
       FROM events e 
       WHERE e.id = $1`,
      [eventId]
    )
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    const { max_attendees, current_attendees } = eventCheck.rows[0]
    if (current_attendees >= max_attendees) {
      return res.status(400).json({ error: 'Event is at full capacity' })
    }
    
    // Get or create user for this email (simplified for MVP)
    let user = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )
    
    let userId
    if (user.rows.length === 0) {
      // Create a temporary user account
      const newUser = await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role) 
         VALUES ($1, $2, $3, $4, $5) 
         RETURNING id`,
        [email, 'temp_hash', name.split(' ')[0] || 'Guest', name.split(' ')[1] || 'User', 'student']
      )
      userId = newUser.rows[0].id
    } else {
      userId = user.rows[0].id
    }
    
    // Check for duplicate RSVP
    const duplicateCheck = await pool.query(
      'SELECT id FROM rsvps WHERE event_id = $1 AND user_id = $2',
      [eventId, userId]
    )
    
    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'Already registered for this event' })
    }
    
    // Create RSVP
    const result = await pool.query(
      `INSERT INTO rsvps (event_id, user_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [eventId, userId]
    )
    
    logger.info('RSVP created:', result.rows[0].id)
    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}
