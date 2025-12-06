import { useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
} from '@mui/material';
import {
  Event as EventIcon,
  People,
  TrendingUp,
  CheckCircle,
} from '@mui/icons-material';
import useAnalyticsStore from '../store/analyticsStore';
import StatCard from '../components/dashboard/StatCard';
import EventsChart from '../components/dashboard/EventsChart';
import CategoryChart from '../components/dashboard/CategoryChart';
import LoadingSpinner from '../components/common/LoadingSpinner';

const AdminDashboard = () => {
  const { statistics, categories, trends, loading, fetchAnalytics } = useAnalyticsStore();

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (loading && !statistics) {
    return (
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <LoadingSpinner />
      </Container>
    );
  }

  // Prepare chart data with safe defaults
  const trendsData = Array.isArray(trends) 
    ? trends.map(t => ({
        month: t.month || 'N/A',
        events: parseInt(t.event_count) || 0,
        rsvps: parseInt(t.rsvp_count) || 0,
      }))
    : [];

  const categoryData = Array.isArray(categories)
    ? categories.map(c => ({
        category: c.category || 'Unknown',
        count: parseInt(c.count) || 0,
        name: c.category || 'Unknown',
      }))
    : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h3" gutterBottom fontWeight={700}>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Overview of campus events and analytics
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Events"
            value={statistics?.total_events || 0}
            subtitle={`${statistics?.upcoming_events || 0} upcoming`}
            icon={<EventIcon fontSize="large" />}
            color="primary"
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total RSVPs"
            value={statistics?.total_rsvps || 0}
            subtitle="All time registrations"
            icon={<People fontSize="large" />}
            color="success"
            trend="up"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Avg Attendance"
            value={`${statistics?.average_attendance_rate || 0}%`}
            subtitle="Capacity utilization"
            icon={<TrendingUp fontSize="large" />}
            color="info"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Active Events"
            value={statistics?.active_events || 0}
            subtitle="Currently ongoing"
            icon={<CheckCircle fontSize="large" />}
            color="secondary"
          />
        </Grid>
      </Grid>

      {/* Charts */}
      {(trendsData.length > 0 || categoryData.length > 0) ? (
        <Grid container spacing={3}>
          {/* Events Trend Chart */}
          {trendsData.length > 0 && (
            <Grid size={{ xs: 12, md: 8 }}>
              <EventsChart data={trendsData} />
            </Grid>
          )}

          {/* Category Distribution */}
          {categoryData.length > 0 && (
            <Grid size={{ xs: 12, md: 4 }}>
              <CategoryChart data={categoryData} />
            </Grid>
          )}
        </Grid>
      ) : (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="text.secondary">
            No data available yet. Create some events to see analytics!
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default AdminDashboard;
