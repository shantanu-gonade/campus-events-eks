import { useEffect } from 'react';
import useEventStore from '../store/eventStore';

// Hook to fetch and manage events
export const useEvents = (filters = null) => {
  const {
    events,
    loading,
    error,
    fetchEvents,
    setFilters,
  } = useEventStore();

  useEffect(() => {
    if (filters) {
      setFilters(filters);
    }
    fetchEvents();
  }, [filters, fetchEvents, setFilters]);

  return {
    events,
    loading,
    error,
    refetch: fetchEvents,
  };
};

// Hook to fetch a single event
export const useEvent = (id) => {
  const {
    selectedEvent,
    loading,
    error,
    fetchEventById,
  } = useEventStore();

  useEffect(() => {
    if (id) {
      fetchEventById(id);
    }
  }, [id, fetchEventById]);

  return {
    event: selectedEvent,
    loading,
    error,
    refetch: () => fetchEventById(id),
  };
};

// Hook to create event
export const useCreateEvent = () => {
  const { createEvent, loading, error } = useEventStore();

  return {
    createEvent,
    loading,
    error,
  };
};

// Hook to update event
export const useUpdateEvent = () => {
  const { updateEvent, loading, error } = useEventStore();

  return {
    updateEvent,
    loading,
    error,
  };
};

// Hook to delete event
export const useDeleteEvent = () => {
  const { deleteEvent, loading, error } = useEventStore();

  return {
    deleteEvent,
    loading,
    error,
  };
};

export default {
  useEvents,
  useEvent,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
};
