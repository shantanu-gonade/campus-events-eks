import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Create RSVP for an event
export const createRSVP = async (eventId, rsvpData) => {
  try {
    // Backend expects POST to /api/v1/events/:id/rsvp
    const response = await api.post(`${API_ENDPOINTS.EVENTS}/${eventId}/rsvp`, rsvpData);
    return response.data;
  } catch (error) {
    console.error(`Error creating RSVP for event ${eventId}:`, error);
    throw error;
  }
};

// Cancel RSVP
export const cancelRSVP = async (rsvpId) => {
  try {
    const response = await api.delete(API_ENDPOINTS.RSVP_BY_ID(rsvpId));
    return response.data;
  } catch (error) {
    console.error(`Error cancelling RSVP ${rsvpId}:`, error);
    throw error;
  }
};

// Get user's RSVPs
export const getUserRSVPs = async (userId = 'me') => {
  try {
    const response = await api.get(API_ENDPOINTS.USER_RSVPS(userId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching RSVPs for user ${userId}:`, error);
    throw error;
  }
};

// Get RSVPs for a specific event
export const getEventRSVPs = async (eventId) => {
  try {
    const response = await api.get(API_ENDPOINTS.EVENT_RSVPS(eventId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching RSVPs for event ${eventId}:`, error);
    throw error;
  }
};

// Check if user is registered for event
export const isUserRegistered = async (eventId, userEmail) => {
  try {
    const rsvps = await getEventRSVPs(eventId);
    return rsvps.some(rsvp => rsvp.email === userEmail);
  } catch (error) {
    console.error('Error checking registration status:', error);
    return false;
  }
};

// Get RSVP by ID
export const getRSVPById = async (rsvpId) => {
  try {
    const response = await api.get(API_ENDPOINTS.RSVP_BY_ID(rsvpId));
    return response.data;
  } catch (error) {
    console.error(`Error fetching RSVP ${rsvpId}:`, error);
    throw error;
  }
};

export default {
  createRSVP,
  cancelRSVP,
  getUserRSVPs,
  getEventRSVPs,
  isUserRegistered,
  getRSVPById,
};
