import { useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';
import websocketService from '../services/websocketService';
import useEventStore from '../store/eventStore';
import useNotificationStore from '../store/notificationStore';
import { WS_EVENTS } from '../utils/constants';

export const useWebSocket = () => {
  const isInitialized = useRef(false);
  const { addEvent, updateEventInList, removeEvent } = useEventStore();
  const { addNotification } = useNotificationStore();

  // Initialize WebSocket connection
  useEffect(() => {
    if (isInitialized.current) return;
    
    websocketService.connect();
    isInitialized.current = true;

    return () => {
      websocketService.disconnect();
      isInitialized.current = false;
    };
  }, []);

  // Subscribe to event created
  const onEventCreated = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.EVENT_CREATED, (event) => {
      addEvent(event);
      addNotification({
        type: 'info',
        title: 'New Event',
        message: `New event "${event.title}" has been created!`,
        read: false,
      });
      toast.success(`New event: ${event.title}`, { duration: 4000 });
      callback?.(event);
    });
    return unsubscribe;
  }, [addEvent, addNotification]);

  // Subscribe to event updated
  const onEventUpdated = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.EVENT_UPDATED, (event) => {
      updateEventInList(event);
      addNotification({
        type: 'info',
        title: 'Event Updated',
        message: `Event "${event.title}" has been updated`,
        read: false,
      });
      toast.info(`Event updated: ${event.title}`);
      callback?.(event);
    });
    return unsubscribe;
  }, [updateEventInList, addNotification]);

  // Subscribe to event deleted
  const onEventDeleted = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.EVENT_DELETED, (data) => {
      removeEvent(data.id);
      addNotification({
        type: 'warning',
        title: 'Event Deleted',
        message: 'An event has been deleted',
        read: false,
      });
      toast.warning('An event has been deleted');
      callback?.(data);
    });
    return unsubscribe;
  }, [removeEvent, addNotification]);

  // Subscribe to RSVP created
  const onRSVPCreated = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.RSVP_CREATED, (rsvp) => {
      addNotification({
        type: 'success',
        title: 'New RSVP',
        message: `New registration for event`,
        read: false,
      });
      callback?.(rsvp);
    });
    return unsubscribe;
  }, [addNotification]);

  // Subscribe to RSVP cancelled
  const onRSVPCancelled = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.RSVP_CANCELLED, (data) => {
      addNotification({
        type: 'info',
        title: 'RSVP Cancelled',
        message: 'An RSVP has been cancelled',
        read: false,
      });
      callback?.(data);
    });
    return unsubscribe;
  }, [addNotification]);

  // Subscribe to capacity warning
  const onCapacityWarning = useCallback((callback) => {
    const unsubscribe = websocketService.on(WS_EVENTS.CAPACITY_WARNING, (event) => {
      addNotification({
        type: 'warning',
        title: 'Capacity Warning',
        message: `Event "${event.title}" is ${Math.round((event.current_attendees / event.max_attendees) * 100)}% full!`,
        read: false,
      });
      toast.error(`Hurry! Event "${event.title}" is almost full!`, { 
        duration: 6000,
        icon: '⚠️',
      });
      callback?.(event);
    });
    return unsubscribe;
  }, [addNotification]);

  // Subscribe to all events at once
  const subscribeToAll = useCallback((callbacks = {}) => {
    const unsubscribes = [];

    if (callbacks.onEventCreated) {
      unsubscribes.push(onEventCreated(callbacks.onEventCreated));
    }
    if (callbacks.onEventUpdated) {
      unsubscribes.push(onEventUpdated(callbacks.onEventUpdated));
    }
    if (callbacks.onEventDeleted) {
      unsubscribes.push(onEventDeleted(callbacks.onEventDeleted));
    }
    if (callbacks.onRSVPCreated) {
      unsubscribes.push(onRSVPCreated(callbacks.onRSVPCreated));
    }
    if (callbacks.onRSVPCancelled) {
      unsubscribes.push(onRSVPCancelled(callbacks.onRSVPCancelled));
    }
    if (callbacks.onCapacityWarning) {
      unsubscribes.push(onCapacityWarning(callbacks.onCapacityWarning));
    }

    // Return cleanup function
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }, [onEventCreated, onEventUpdated, onEventDeleted, onRSVPCreated, onRSVPCancelled, onCapacityWarning]);

  return {
    isConnected: websocketService.isConnected(),
    onEventCreated,
    onEventUpdated,
    onEventDeleted,
    onRSVPCreated,
    onRSVPCancelled,
    onCapacityWarning,
    subscribeToAll,
  };
};

export default useWebSocket;
