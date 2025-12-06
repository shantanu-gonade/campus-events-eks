import pool from '../config/database.js'
import logger from '../utils/logger.js'
import { io } from '../app.js'

export const getAllEvents = async (req, res, next) => {
  try {
    const { category, search } = req.query
    
    let query = `
      SELECT e.*, 
        COUNT(r.id) as rsvp_count 
      FROM events e 
      LEFT JOIN rsvps r ON e.id = r.event_id 
      WHERE e.start_time >= NOW() AND e.status != 'cancelled'`
    
    const queryParams = []
    let paramCount = 1
    
    if (category) {
      query += ` AND e.category = $${paramCount}`
      queryParams.push(category)
      paramCount++
    }
    
    if (search) {
      query += ` AND (e.title ILIKE $${paramCount} OR e.description ILIKE $${paramCount} OR e.location ILIKE $${paramCount})`
      queryParams.push(`%${search}%`)
      paramCount++
    }
    
    query += ' GROUP BY e.id ORDER BY e.start_time ASC'
    
    const result = await pool.query(query, queryParams)
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

export const getPastEvents = async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT e.*, 
        COUNT(r.id) as rsvp_count 
       FROM events e 
       LEFT JOIN rsvps r ON e.id = r.event_id 
       WHERE e.end_time < NOW()
       GROUP BY e.id 
       ORDER BY e.end_time DESC`
    )
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

export const searchEvents = async (req, res, next) => {
  try {
    const { q, category } = req.query
    
    if (!q) {
      return res.status(400).json({ error: 'Search query (q) is required' })
    }
    
    let query = `
      SELECT e.*, 
        COUNT(r.id) as rsvp_count 
      FROM events e 
      LEFT JOIN rsvps r ON e.id = r.event_id 
      WHERE (e.title ILIKE $1 OR e.description ILIKE $1 OR e.location ILIKE $1)
    `
    
    const queryParams = [`%${q}%`]
    
    if (category) {
      query += ' AND e.category = $2'
      queryParams.push(category)
    }
    
    query += ' GROUP BY e.id ORDER BY e.start_time ASC'
    
    const result = await pool.query(query, queryParams)
    res.json(result.rows)
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
    
    // Emit WebSocket event
    io.emit('event:created', result.rows[0])
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    logger.error('Error creating event:', error)
    next(error)
  }
}

export const updateEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const { title, description, start_time, end_time, location, max_attendees, category, status } = req.body
    
    // Check if event exists
    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [id])
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 1
    
    if (title !== undefined) {
      updates.push(`title = $${paramCount}`)
      values.push(title)
      paramCount++
    }
    if (description !== undefined) {
      updates.push(`description = $${paramCount}`)
      values.push(description)
      paramCount++
    }
    if (start_time !== undefined) {
      updates.push(`start_time = $${paramCount}`)
      values.push(start_time)
      paramCount++
    }
    if (end_time !== undefined) {
      updates.push(`end_time = $${paramCount}`)
      values.push(end_time)
      paramCount++
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount}`)
      values.push(location)
      paramCount++
    }
    if (max_attendees !== undefined) {
      updates.push(`max_attendees = $${paramCount}`)
      values.push(max_attendees)
      paramCount++
    }
    if (category !== undefined) {
      updates.push(`category = $${paramCount}`)
      values.push(category)
      paramCount++
    }
    if (status !== undefined) {
      updates.push(`status = $${paramCount}`)
      values.push(status)
      paramCount++
    }
    
    values.push(id)
    
    const result = await pool.query(
      `UPDATE events SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING *`,
      values
    )
    
    logger.info('Event updated:', id)
    
    // Emit WebSocket event
    io.emit('event:updated', result.rows[0])
    
    res.json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    
    // Check if event exists
    const eventCheck = await pool.query('SELECT * FROM events WHERE id = $1', [id])
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    // Soft delete by setting status to cancelled
    await pool.query(
      `UPDATE events SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
      [id]
    )
    
    logger.info('Event deleted:', id)
    
    // Emit WebSocket event
    io.emit('event:deleted', { id })
    
    res.json({ message: 'Event deleted successfully' })
  } catch (error) {
    next(error)
  }
}

export const createRSVP = async (req, res, next) => {
  try {
    const { id: eventId } = req.params
    const { name, email } = req.body
    
    // Check event exists and capacity
    const eventCheck = await pool.query(
      `SELECT e.id, e.max_attendees, e.current_attendees, e.title
       FROM events e 
       WHERE e.id = $1`,
      [eventId]
    )
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' })
    }
    
    const { max_attendees, current_attendees, title } = eventCheck.rows[0]
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
    
    // Emit WebSocket event
    io.emit('rsvp:created', {
      ...result.rows[0],
      event_id: eventId,
      event_title: title
    })
    
    // Check if capacity warning needed (90% full)
    const newAttendees = current_attendees + 1
    if (newAttendees / max_attendees >= 0.9) {
      io.emit('capacity:warning', {
        event_id: eventId,
        event_title: title,
        current_attendees: newAttendees,
        max_attendees
      })
    }
    
    res.status(201).json(result.rows[0])
  } catch (error) {
    next(error)
  }
}

export const getEventRSVPs = async (req, res, next) => {
  try {
    const { id: eventId } = req.params
    
    const result = await pool.query(
      `SELECT r.*, u.email, u.first_name, u.last_name
       FROM rsvps r
       JOIN users u ON r.user_id = u.id
       WHERE r.event_id = $1 AND r.status = 'confirmed'
       ORDER BY r.created_at DESC`,
      [eventId]
    )
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}

export const cancelRSVP = async (req, res, next) => {
  try {
    const { id: rsvpId } = req.params
    
    // Get RSVP details
    const rsvpCheck = await pool.query(
      'SELECT * FROM rsvps WHERE id = $1',
      [rsvpId]
    )
    
    if (rsvpCheck.rows.length === 0) {
      return res.status(404).json({ error: 'RSVP not found' })
    }
    
    const eventId = rsvpCheck.rows[0].event_id
    
    // Delete RSVP
    await pool.query('DELETE FROM rsvps WHERE id = $1', [rsvpId])
    
    logger.info('RSVP cancelled:', rsvpId)
    
    // Emit WebSocket event
    io.emit('rsvp:cancelled', { id: rsvpId, event_id: eventId })
    
    res.json({ message: 'RSVP cancelled successfully' })
  } catch (error) {
    next(error)
  }
}

export const getUserRSVPs = async (req, res, next) => {
  try {
    const { email } = req.query
    
    if (!email) {
      return res.status(400).json({ error: 'Email parameter is required' })
    }
    
    const result = await pool.query(
      `SELECT r.*, e.title, e.description, e.start_time, e.end_time, e.location, e.category
       FROM rsvps r
       JOIN events e ON r.event_id = e.id
       JOIN users u ON r.user_id = u.id
       WHERE u.email = $1 AND r.status = 'confirmed'
       ORDER BY e.start_time ASC`,
      [email]
    )
    
    res.json(result.rows)
  } catch (error) {
    next(error)
  }
}
