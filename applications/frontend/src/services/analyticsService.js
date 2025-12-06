import api from './api';
import { API_ENDPOINTS } from '../utils/constants';

// Get overall statistics
export const getStatistics = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.STATISTICS);
    return response.data;
  } catch (error) {
    console.error('Error fetching statistics:', error);
    throw error;
  }
};

// Get category distribution
export const getCategoryDistribution = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.CATEGORIES);
    return response.data;
  } catch (error) {
    console.error('Error fetching category distribution:', error);
    throw error;
  }
};

// Get events trend over time
export const getEventsTrend = async (dateRange = {}) => {
  try {
    const params = new URLSearchParams();
    if (dateRange.startDate) {
      params.append('startDate', dateRange.startDate);
    }
    if (dateRange.endDate) {
      params.append('endDate', dateRange.endDate);
    }
    
    const url = params.toString()
      ? `${API_ENDPOINTS.TRENDS}?${params.toString()}`
      : API_ENDPOINTS.TRENDS;
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching events trend:', error);
    throw error;
  }
};

// Get attendance analytics
export const getAttendanceAnalytics = async () => {
  try {
    const response = await api.get(API_ENDPOINTS.ATTENDANCE);
    return response.data;
  } catch (error) {
    console.error('Error fetching attendance analytics:', error);
    throw error;
  }
};

// Get combined dashboard data
export const getDashboardData = async () => {
  try {
    const [statistics, categories, trends, attendance] = await Promise.all([
      getStatistics(),
      getCategoryDistribution(),
      getEventsTrend(),
      getAttendanceAnalytics(),
    ]);
    
    return {
      statistics,
      categories,
      trends,
      attendance,
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw error;
  }
};

export default {
  getStatistics,
  getCategoryDistribution,
  getEventsTrend,
  getAttendanceAnalytics,
  getDashboardData,
};
