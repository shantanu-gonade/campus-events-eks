import * as yup from 'yup';
import { VALIDATION_LIMITS } from './constants';

// Event creation/update validation schema - Must match backend validation
export const eventSchema = yup.object({
  title: yup
    .string()
    .required('Event title is required')
    .min(VALIDATION_LIMITS.EVENT_TITLE_MIN, `Title must be at least ${VALIDATION_LIMITS.EVENT_TITLE_MIN} characters`)
    .max(VALIDATION_LIMITS.EVENT_TITLE_MAX, `Title must be less than ${VALIDATION_LIMITS.EVENT_TITLE_MAX} characters`)
    .trim(),
  
  description: yup
    .string()
    .required('Event description is required')
    .min(VALIDATION_LIMITS.EVENT_DESC_MIN, `Description must be at least ${VALIDATION_LIMITS.EVENT_DESC_MIN} characters`)
    .max(VALIDATION_LIMITS.EVENT_DESC_MAX, `Description must be less than ${VALIDATION_LIMITS.EVENT_DESC_MAX} characters`)
    .trim(),
  
  start_time: yup
    .date()
    .required('Start time is required')
    .min(new Date(), 'Start time must be in the future')
    .typeError('Please enter a valid date'),
  
  end_time: yup
    .date()
    .required('End time is required')
    .min(yup.ref('start_time'), 'End time must be after start time')
    .typeError('Please enter a valid date'),
  
  location: yup
    .string()
    .required('Event location is required')
    .max(VALIDATION_LIMITS.EVENT_LOCATION_MAX, `Location must be less than ${VALIDATION_LIMITS.EVENT_LOCATION_MAX} characters`)
    .trim(),
  
  category: yup
    .string()
    .required('Event category is required')
    .oneOf(
      ['Workshop', 'Seminar', 'Social', 'Sports', 'Cultural', 'Career', 'Hackathon', 'Conference', 'Club Meeting', 'Other'],
      'Invalid category selected'
    ),
  
  max_attendees: yup
    .number()
    .required('Maximum attendees is required')
    .min(VALIDATION_LIMITS.EVENT_CAPACITY_MIN, `Capacity must be at least ${VALIDATION_LIMITS.EVENT_CAPACITY_MIN}`)
    .max(VALIDATION_LIMITS.EVENT_CAPACITY_MAX, `Capacity must be less than ${VALIDATION_LIMITS.EVENT_CAPACITY_MAX}`)
    .integer('Capacity must be a whole number')
    .typeError('Please enter a valid number'),
});

// RSVP validation schema
export const rsvpSchema = yup.object({
  name: yup
    .string()
    .required('Name is required')
    .max(VALIDATION_LIMITS.RSVP_NAME_MAX, `Name must be less than ${VALIDATION_LIMITS.RSVP_NAME_MAX} characters`)
    .trim(),
  
  email: yup
    .string()
    .required('Email is required')
    .email('Please enter a valid email address')
    .max(VALIDATION_LIMITS.RSVP_EMAIL_MAX, `Email must be less than ${VALIDATION_LIMITS.RSVP_EMAIL_MAX} characters`)
    .trim()
    .lowercase(),
  
  phone: yup
    .string()
    .optional()
    .matches(/^[0-9+\-\s()]*$/, 'Please enter a valid phone number')
    .max(20, 'Phone number must be less than 20 characters')
    .trim(),
  
  notes: yup
    .string()
    .optional()
    .max(500, 'Notes must be less than 500 characters')
    .trim(),
});

// Search/filter validation
export const searchSchema = yup.object({
  query: yup
    .string()
    .optional()
    .max(100, 'Search query must be less than 100 characters')
    .trim(),
  
  category: yup
    .string()
    .optional()
    .oneOf(
      ['All', 'Workshop', 'Seminar', 'Social', 'Sports', 'Cultural', 'Career', 'Hackathon', 'Conference', 'Club Meeting', 'Other'],
      'Invalid category selected'
    ),
  
  startDate: yup
    .date()
    .optional()
    .typeError('Please enter a valid date'),
  
  endDate: yup
    .date()
    .optional()
    .min(yup.ref('startDate'), 'End date must be after start date')
    .typeError('Please enter a valid date'),
});

// Email validation helper
export const isValidEmail = (email) => {
  return yup.string().email().isValidSync(email);
};

// Date validation helper
export const isValidDate = (date) => {
  return yup.date().isValidSync(date);
};

// Check if date is in future
export const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

// Check if date is in past
export const isPastDate = (date) => {
  return new Date(date) < new Date();
};

// Validate phone number format
export const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]*$/;
  return phoneRegex.test(phone);
};

export default {
  eventSchema,
  rsvpSchema,
  searchSchema,
  isValidEmail,
  isValidDate,
  isFutureDate,
  isPastDate,
  isValidPhone,
};
