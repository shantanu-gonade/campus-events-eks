import { useState, useEffect } from 'react';
import * as analyticsService from '../services/analyticsService';

export const useAnalytics = () => {
  const [statistics, setStatistics] = useState(null);
  const [categories, setCategories] = useState([]);
  const [trends, setTrends] = useState([]);
  const [attendance, setAttendance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await analyticsService.getDashboardData();
      setStatistics(data.statistics);
      setCategories(data.categories);
      setTrends(data.trends);
      setAttendance(data.attendance);
    } catch (err) {
      setError(err.customMessage || 'Failed to load analytics');
      console.error('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const data = await analyticsService.getStatistics();
      setStatistics(data);
      return data;
    } catch (err) {
      console.error('Statistics error:', err);
      throw err;
    }
  };

  const fetchCategories = async () => {
    try {
      const data = await analyticsService.getCategoryDistribution();
      setCategories(data);
      return data;
    } catch (err) {
      console.error('Categories error:', err);
      throw err;
    }
  };

  const fetchTrends = async (dateRange) => {
    try {
      const data = await analyticsService.getEventsTrend(dateRange);
      setTrends(data);
      return data;
    } catch (err) {
      console.error('Trends error:', err);
      throw err;
    }
  };

  const fetchAttendance = async () => {
    try {
      const data = await analyticsService.getAttendanceAnalytics();
      setAttendance(data);
      return data;
    } catch (err) {
      console.error('Attendance error:', err);
      throw err;
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return {
    statistics,
    categories,
    trends,
    attendance,
    loading,
    error,
    refetch: fetchAllData,
    fetchStatistics,
    fetchCategories,
    fetchTrends,
    fetchAttendance,
  };
};

export default useAnalytics;
