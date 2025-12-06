import { create } from 'zustand';

const useNotificationStore = create((set) => ({
  // State
  notifications: [],
  
  // Actions
  addNotification: (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date().toISOString(),
      ...notification,
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 50), // Keep last 50
    }));
    
    return id;
  },
  
  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
  
  clearAllNotifications: () => {
    set({ notifications: [] });
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    }));
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    }));
  },
  
  getUnreadCount: () => {
    const { notifications } = useNotificationStore.getState();
    return notifications.filter((n) => !n.read).length;
  },
}));

export default useNotificationStore;
