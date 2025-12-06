import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Get all upcoming events
export const getAllEvents = async (filters = {}) => {
  try {
    const params = new URLSearchParams();
    
    if (filters.category && filters.category !== 'All') {
      params.append('category', filters.category);
    }
    if (filters.startDate) {
      params.append('startDate', filters.startDate);
    }
    if (filters.endDate) {
      params.append('endDate', filters.endDate);
    }
    if (filters.search) {
      params.append('search', filters.search);
    }
    
    const url = params.toString() 
      ? `${API_ENDPOINTS.EVENTS}?${params.toString()}` 
      : API_ENDPOINTS.EVENTS;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching events:', error);
    throw error;
  }
};

// Get event by ID
export const getEventById = async (id) => {
  try {
    const response = await api.get(API_ENDPOINTS.EVENT_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error fetching event ${id}:`, error);
    throw error;
  }
};

// Create new event
export const createEvent = async (eventData) => {
  try {
    const response = await api.post(API_ENDPOINTS.EVENTS, eventData);
    return response.data;
  } catch (error) {
    console.error('Error creating event:', error);
    throw error;
  }
};

// Update existing event
export const updateEvent = async (id, eventData) => {
  try {
    const response = await api.put(API_ENDPOINTS.EVENT_BY_ID(id), eventData);
    return response.data;
  } catch (error) {
    console.error(`Error updating event ${id}:`, error);
    throw error;
  }
};

// Delete event
export const deleteEvent = async (id) => {
  try {
    const response = await api.delete(API_ENDPOINTS.EVENT_BY_ID(id));
    return response.data;
  } catch (error) {
    console.error(`Error deleting event ${id}:`, error);
    throw error;
  }
};

// Get past events
export const getPastEvents = async () => {
  try {
    const response = await api.get(`${API_ENDPOINTS.EVENTS}/past`);
    return response.data;
  } catch (error) {
    console.error('Error fetching past events:', error);
    throw error;
  }
};

// Search events
export const searchEvents = async (query) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.EVENTS}/search?q=${encodeURIComponent(query)}`);
    return response.data;
  } catch (error) {
    console.error('Error searching events:', error);
    throw error;
  }
};

// Get events by category
export const getEventsByCategory = async (category) => {
  try {
    const response = await api.get(`${API_ENDPOINTS.EVENTS}?category=${category}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching events for category ${category}:`, error);
    throw error;
  }
};

export default {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getPastEvents,
  searchEvents,
  getEventsByCategory,
};
