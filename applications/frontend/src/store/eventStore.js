import { create } from 'zustand';
import * as eventService from '../services/eventService';

const useEventStore = create((set, get) => ({
  // State
  events: [],
  selectedEvent: null,
  loading: false,
  error: null,
  filters: {
    category: 'All',
    search: '',
    startDate: null,
    endDate: null,
  },
  
  // Actions
  setEvents: (events) => set({ events }),
  
  setSelectedEvent: (event) => set({ selectedEvent: event }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  setFilters: (filters) => set((state) => ({
    filters: { ...state.filters, ...filters },
  })),
  
  clearFilters: () => set({
    filters: {
      category: 'All',
      search: '',
      startDate: null,
      endDate: null,
    },
  }),
  
  // Fetch all events
  fetchEvents: async () => {
    set({ loading: true, error: null });
    try {
      const filters = get().filters;
      const events = await eventService.getAllEvents(filters);
      set({ events, loading: false });
      return events;
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to fetch events', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch single event
  fetchEventById: async (id) => {
    set({ loading: true, error: null });
    try {
      const event = await eventService.getEventById(id);
      set({ selectedEvent: event, loading: false });
      return event;
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to fetch event', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Create event
  createEvent: async (eventData) => {
    set({ loading: true, error: null });
    try {
      const newEvent = await eventService.createEvent(eventData);
      set((state) => ({ 
        events: [newEvent, ...state.events],
        loading: false 
      }));
      return newEvent;
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to create event', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Update event
  updateEvent: async (id, eventData) => {
    set({ loading: true, error: null });
    try {
      const updatedEvent = await eventService.updateEvent(id, eventData);
      set((state) => ({
        events: state.events.map((event) =>
          event.id === id ? updatedEvent : event
        ),
        selectedEvent: state.selectedEvent?.id === id ? updatedEvent : state.selectedEvent,
        loading: false,
      }));
      return updatedEvent;
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to update event', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Delete event
  deleteEvent: async (id) => {
    set({ loading: true, error: null });
    try {
      await eventService.deleteEvent(id);
      set((state) => ({
        events: state.events.filter((event) => event.id !== id),
        selectedEvent: state.selectedEvent?.id === id ? null : state.selectedEvent,
        loading: false,
      }));
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to delete event', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Search events
  searchEvents: async (query) => {
    set({ loading: true, error: null });
    try {
      const events = await eventService.searchEvents(query);
      set({ events, loading: false });
      return events;
    } catch (error) {
      set({ 
        error: error.customMessage || 'Failed to search events', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Add event (from WebSocket)
  addEvent: (event) => set((state) => ({
    events: [event, ...state.events],
  })),
  
  // Update event in list (from WebSocket)
  updateEventInList: (updatedEvent) => set((state) => ({
    events: state.events.map((event) =>
      event.id === updatedEvent.id ? updatedEvent : event
    ),
    selectedEvent: state.selectedEvent?.id === updatedEvent.id ? updatedEvent : state.selectedEvent,
  })),
  
  // Remove event from list (from WebSocket)
  removeEvent: (eventId) => set((state) => ({
    events: state.events.filter((event) => event.id !== eventId),
    selectedEvent: state.selectedEvent?.id === eventId ? null : state.selectedEvent,
  })),
}));

export default useEventStore;
