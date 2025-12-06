import { create } from 'zustand';
import * as analyticsService from '../services/analyticsService';

const useAnalyticsStore = create((set) => ({
  // State
  statistics: null,
  categories: [],
  trends: [],
  attendance: null,
  loading: false,
  error: null,
  
  // Actions
  setStatistics: (statistics) => set({ statistics }),
  
  setCategories: (categories) => set({ categories }),
  
  setTrends: (trends) => set({ trends }),
  
  setAttendance: (attendance) => set({ attendance }),
  
  setLoading: (loading) => set({ loading }),
  
  setError: (error) => set({ error }),
  
  // Fetch all analytics data
  fetchAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const [stats, cats, trnds, attn] = await Promise.all([
        analyticsService.getStatistics(),
        analyticsService.getCategoryDistribution(),
        analyticsService.getEventsTrend(),
        analyticsService.getAttendanceAnalytics(),
      ]);
      
      set({ 
        statistics: stats,
        categories: cats,
        trends: trnds,
        attendance: attn,
        loading: false 
      });
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch analytics', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch statistics only
  fetchStatistics: async () => {
    set({ loading: true, error: null });
    try {
      const stats = await analyticsService.getStatistics();
      set({ statistics: stats, loading: false });
      return stats;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch statistics', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch categories only
  fetchCategories: async () => {
    set({ loading: true, error: null });
    try {
      const cats = await analyticsService.getCategoryDistribution();
      set({ categories: cats, loading: false });
      return cats;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch categories', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch trends only
  fetchTrends: async (months = 6) => {
    set({ loading: true, error: null });
    try {
      const trnds = await analyticsService.getEventsTrend(months);
      set({ trends: trnds, loading: false });
      return trnds;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch trends', 
        loading: false 
      });
      throw error;
    }
  },
  
  // Fetch attendance only
  fetchAttendance: async () => {
    set({ loading: true, error: null });
    try {
      const attn = await analyticsService.getAttendanceAnalytics();
      set({ attendance: attn, loading: false });
      return attn;
    } catch (error) {
      set({ 
        error: error.message || 'Failed to fetch attendance', 
        loading: false 
      });
      throw error;
    }
  },
}));

export default useAnalyticsStore;
