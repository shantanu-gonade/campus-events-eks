import swaggerJsdoc from 'swagger-jsdoc'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Campus Events Management API',
      version: '2.0.0',
      description: 'API for managing campus events, RSVPs, analytics, and notifications',
      contact: {
        name: 'Campus Events Team',
        email: 'admin@campus.edu'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:8080',
        description: 'Development server'
      },
      {
        url: process.env.API_BASE_URL || 'https://api.campus-events.com',
        description: 'Production server'
      }
    ],
    components: {
      schemas: {
        Event: {
          type: 'object',
          required: ['title', 'description', 'start_time', 'end_time', 'location', 'max_attendees'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Event unique identifier'
            },
            title: {
              type: 'string',
              minLength: 3,
              maxLength: 200,
              description: 'Event title'
            },
            description: {
              type: 'string',
              maxLength: 2000,
              description: 'Event description'
            },
            location: {
              type: 'string',
              maxLength: 200,
              description: 'Event location'
            },
            start_time: {
              type: 'string',
              format: 'date-time',
              description: 'Event start time'
            },
            end_time: {
              type: 'string',
              format: 'date-time',
              description: 'Event end time'
            },
            max_attendees: {
              type: 'integer',
              minimum: 1,
              maximum: 1000,
              description: 'Maximum number of attendees'
            },
            current_attendees: {
              type: 'integer',
              description: 'Current number of registered attendees'
            },
            category: {
              type: 'string',
              enum: ['Workshop', 'Seminar', 'Social', 'Sports', 'Cultural', 'Career', 'Hackathon', 'Conference', 'Club Meeting', 'Other'],
              description: 'Event category'
            },
            status: {
              type: 'string',
              enum: ['upcoming', 'ongoing', 'completed', 'cancelled'],
              description: 'Event status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Event creation timestamp'
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Event last update timestamp'
            }
          }
        },
        RSVP: {
          type: 'object',
          required: ['name', 'email'],
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'RSVP unique identifier'
            },
            event_id: {
              type: 'string',
              format: 'uuid',
              description: 'Associated event ID'
            },
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Attendee name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Attendee email'
            },
            status: {
              type: 'string',
              enum: ['confirmed', 'cancelled', 'waitlisted'],
              description: 'RSVP status'
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'RSVP creation timestamp'
            }
          }
        },
        Analytics: {
          type: 'object',
          properties: {
            total_events: {
              type: 'integer',
              description: 'Total number of events'
            },
            total_attendees: {
              type: 'integer',
              description: 'Total number of attendees across all events'
            },
            upcoming_events: {
              type: 'integer',
              description: 'Number of upcoming events'
            },
            events_by_category: {
              type: 'object',
              description: 'Event count by category'
            },
            average_attendance_rate: {
              type: 'number',
              format: 'float',
              description: 'Average attendance rate percentage'
            }
          }
        },
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message'
            },
            details: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: {
                    type: 'string',
                    description: 'Field name with error'
                  },
                  message: {
                    type: 'string',
                    description: 'Error message for the field'
                  }
                }
              }
            }
          }
        }
      },
      responses: {
        BadRequest: {
          description: 'Bad request - validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        },
        ServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Events',
        description: 'Event management endpoints'
      },
      {
        name: 'RSVPs',
        description: 'RSVP management endpoints'
      },
      {
        name: 'Analytics',
        description: 'Analytics and statistics endpoints'
      },
      {
        name: 'Recommendations',
        description: 'Event recommendation endpoints'
      },
      {
        name: 'Health',
        description: 'Health check endpoints'
      }
    ]
  },
  // Use absolute paths from the config directory
  apis: [
    join(__dirname, '../routes/*.js'),
    join(__dirname, '../controllers/*.js')
  ]
}

const swaggerSpec = swaggerJsdoc(options)

export default swaggerSpec
