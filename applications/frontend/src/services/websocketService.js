import { io } from 'socket.io-client';
import { WS_EVENTS } from '../utils/constants';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.listeners = new Map();
    this.connectionAttempts = 0;
    this.maxAttempts = 3;
  }

  // Initialize WebSocket connection
  connect(url) {
    // Don't try to connect if we've failed too many times
    if (this.connectionAttempts >= this.maxAttempts) {
      console.log('[WebSocket] Max connection attempts reached, skipping');
      return null;
    }

    if (this.socket?.connected) {
      console.log('[WebSocket] Already connected');
      return this.socket;
    }

    // Use environment variable or fallback to window location
    const wsUrl = url || import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || window.location.origin;
    
    console.log('[WebSocket] Attempting to connect to:', wsUrl);
    this.connectionAttempts++;

    try {
      this.socket = io(wsUrl, {
        transports: ['websocket', 'polling'],
        reconnection: false, // Disable auto-reconnection to prevent spam
        timeout: 5000, // Shorter timeout
      });

      this.setupEventListeners();
      return this.socket;
    } catch (error) {
      console.warn('[WebSocket] Connection failed:', error.message);
      return null;
    }
  }

  // Setup default event listeners
  setupEventListeners() {
    this.socket.on(WS_EVENTS.CONNECT, () => {
      console.log('[WebSocket] Connected successfully');
      this.connected = true;
      this.connectionAttempts = 0; // Reset on successful connection
      this.emit('connection', { connected: true });
    });

    this.socket.on(WS_EVENTS.DISCONNECT, (reason) => {
      console.log('[WebSocket] Disconnected:', reason);
      this.connected = false;
      this.emit('connection', { connected: false });
    });

    this.socket.on('connect_error', (error) => {
      console.warn('[WebSocket] Connection error (this is normal if backend is not running)');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.warn('[WebSocket] Error:', error.message);
    });

    // Setup event-specific listeners
    this.socket.on(WS_EVENTS.EVENT_CREATED, (data) => {
      console.log('[WebSocket] Event created:', data);
      this.emit(WS_EVENTS.EVENT_CREATED, data);
    });

    this.socket.on(WS_EVENTS.EVENT_UPDATED, (data) => {
      console.log('[WebSocket] Event updated:', data);
      this.emit(WS_EVENTS.EVENT_UPDATED, data);
    });

    this.socket.on(WS_EVENTS.EVENT_DELETED, (data) => {
      console.log('[WebSocket] Event deleted:', data);
      this.emit(WS_EVENTS.EVENT_DELETED, data);
    });

    this.socket.on(WS_EVENTS.RSVP_CREATED, (data) => {
      console.log('[WebSocket] RSVP created:', data);
      this.emit(WS_EVENTS.RSVP_CREATED, data);
    });

    this.socket.on(WS_EVENTS.RSVP_CANCELLED, (data) => {
      console.log('[WebSocket] RSVP cancelled:', data);
      this.emit(WS_EVENTS.RSVP_CANCELLED, data);
    });

    this.socket.on(WS_EVENTS.CAPACITY_WARNING, (data) => {
      console.log('[WebSocket] Capacity warning:', data);
      this.emit(WS_EVENTS.CAPACITY_WARNING, data);
    });
  }

  // Subscribe to events
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  // Unsubscribe from events
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  // Emit event to local listeners
  emit(event, data) {
    if (!this.listeners.has(event)) return;
    
    this.listeners.get(event).forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[WebSocket] Error in listener for ${event}:`, error);
      }
    });
  }

  // Send message to server
  send(event, data) {
    if (!this.socket || !this.connected) {
      console.warn('[WebSocket] Not connected, cannot send message');
      return;
    }
    this.socket.emit(event, data);
  }

  // Disconnect
  disconnect() {
    if (this.socket) {
      console.log('[WebSocket] Disconnecting...');
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }

  // Get connection status
  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

// Create singleton instance
const websocketService = new WebSocketService();

export default websocketService;
