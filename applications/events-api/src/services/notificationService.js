import axios from 'axios'
import logger from '../utils/logger.js'

const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://dev-notification-service:8082'

/**
 * Send email notification via notification service
 * @param {string} recipient - Email address
 * @param {string} subject - Email subject
 * @param {string} template - Template name (optional)
 * @param {object} context - Template context/variables
 * @returns {Promise<object>} - Notification response
 */
export const sendEmail = async (recipient, subject, context, template = null) => {
  try {
    const payload = {
      recipient,
      subject,
      context,
      ...(template && { template })
    }

    logger.info(`Sending email notification to ${recipient} via ${NOTIFICATION_SERVICE_URL}`)
    
    const response = await axios.post(
      `${NOTIFICATION_SERVICE_URL}/api/v1/notifications/email`,
      payload,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    )

    logger.info(`Email notification sent successfully to ${recipient}`)
    return response.data
  } catch (error) {
    logger.error(`Failed to send email notification to ${recipient}:`, {
      error: error.message,
      response: error.response?.data,
      status: error.response?.status
    })
    
    // Don't throw error - we don't want email failures to break the RSVP flow
    // Just log it and continue
    return null
  }
}

/**
 * Send RSVP confirmation email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} event - Event details
 * @returns {Promise<object>} - Notification response
 */
export const sendRSVPConfirmation = async (email, name, event) => {
  try {
    const subject = `RSVP Confirmation: ${event.title}`
    const context = {
      name,
      event_title: event.title,
      event_description: event.description,
      event_location: event.location,
      event_start_time: new Date(event.start_time).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      event_end_time: new Date(event.end_time).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      message: `Thank you for registering for "${event.title}"! We're excited to have you join us.

Event Details:
- Location: ${event.location}
- Date: ${new Date(event.start_time).toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}
- Time: ${new Date(event.start_time).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })} - ${new Date(event.end_time).toLocaleString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      })}

Please save this email as your confirmation. If you need to cancel your RSVP, you can do so from the event page.

See you there!
Campus Events Team`
    }

    return await sendEmail(email, subject, context)
  } catch (error) {
    logger.error(`Failed to send RSVP confirmation to ${email}:`, error)
    return null
  }
}

/**
 * Send event reminder email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} event - Event details
 * @returns {Promise<object>} - Notification response
 */
export const sendEventReminder = async (email, name, event) => {
  try {
    const subject = `Reminder: ${event.title} is coming up!`
    const context = {
      name,
      event_title: event.title,
      event_location: event.location,
      event_start_time: new Date(event.start_time).toLocaleString(),
      message: `This is a reminder that "${event.title}" is happening soon!

Event Details:
- Location: ${event.location}
- Time: ${new Date(event.start_time).toLocaleString()}

We look forward to seeing you there!
Campus Events Team`
    }

    return await sendEmail(email, subject, context)
  } catch (error) {
    logger.error(`Failed to send event reminder to ${email}:`, error)
    return null
  }
}

/**
 * Send event cancellation email
 * @param {string} email - Recipient email
 * @param {string} name - Recipient name
 * @param {object} event - Event details
 * @param {string} reason - Cancellation reason (optional)
 * @returns {Promise<object>} - Notification response
 */
export const sendEventCancellation = async (email, name, event, reason = '') => {
  try {
    const subject = `Event Cancelled: ${event.title}`
    const context = {
      name,
      event_title: event.title,
      message: `We regret to inform you that "${event.title}" has been cancelled.${reason ? `\n\nReason: ${reason}` : ''}

We apologize for any inconvenience this may cause.

Campus Events Team`
    }

    return await sendEmail(email, subject, context)
  } catch (error) {
    logger.error(`Failed to send cancellation notice to ${email}:`, error)
    return null
  }
}

export default {
  sendEmail,
  sendRSVPConfirmation,
  sendEventReminder,
  sendEventCancellation
}
