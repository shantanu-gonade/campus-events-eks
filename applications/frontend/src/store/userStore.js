import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as rsvpService from '../services/rsvpService';

const useUserStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      myRSVPs: [],
      myEvents: [],
      loading: false,
      error: null,
      
      // Actions
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setMyRSVPs: (rsvps) => set({ myRSVPs: rsvps }),
      
      setMyEvents: (events) => set({ myEvents: events }),
      
      setLoading: (loading) => set({ loading }),
      
      setError: (error) => set({ error }),
      
      // Login (placeholder for future auth)
      login: async (credentials) => {
        set({ loading: true, error: null });
        try {
          // TODO: Implement actual auth when backend supports it
          // For now, mock user login
          const mockUser = {
            id: 'user-1',
            email: credentials.email,
            name: credentials.name || 'Guest User',
            role: 'user',
          };
          set({ 
            user: mockUser, 
            isAuthenticated: true, 
            loading: false 
          });
          return mockUser;
        } catch (error) {
          set({ 
            error: error.customMessage || 'Login failed', 
            loading: false 
          });
          throw error;
        }
      },
      
      // Logout
      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false,
          myRSVPs: [],
          myEvents: [],
        });
        localStorage.removeItem('campus_events_auth_token');
      },
      
      // Fetch user's RSVPs
      fetchMyRSVPs: async () => {
        set({ loading: true, error: null });
        try {
          const rsvps = await rsvpService.getUserRSVPs();
          set({ myRSVPs: rsvps, loading: false });
          return rsvps;
        } catch (error) {
          set({ 
            error: error.customMessage || 'Failed to fetch RSVPs', 
            loading: false 
          });
          throw error;
        }
      },
      
      // Add RSVP to user's list
      addRSVP: (rsvp) => set((state) => ({
        myRSVPs: [...state.myRSVPs, rsvp],
      })),
      
      // Remove RSVP from user's list
      removeRSVP: (rsvpId) => set((state) => ({
        myRSVPs: state.myRSVPs.filter((rsvp) => rsvp.id !== rsvpId),
      })),
      
      // Check if user is registered for event
      isRegisteredForEvent: (eventId) => {
        const { myRSVPs } = get();
        return myRSVPs.some((rsvp) => rsvp.event_id === eventId);
      },
      
      // Get RSVP for specific event
      getRSVPForEvent: (eventId) => {
        const { myRSVPs } = get();
        return myRSVPs.find((rsvp) => rsvp.event_id === eventId);
      },
    }),
    {
      name: 'campus-events-user', // localStorage key
      partialize: (state) => ({ 
        user: state.user, 
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

export default useUserStore;
