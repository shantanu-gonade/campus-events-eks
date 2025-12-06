import { useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Paper,
  Grid,
} from '@mui/material';
import { Add as AddIcon, Event as EventIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import useEventStore from '../store/eventStore';
import EventList from '../components/events/EventList';
import RecommendedEvents from '../components/events/RecommendedEvents';
import LoadingSpinner from '../components/common/LoadingSpinner';

const HomePage = () => {
  const { events, loading, fetchEvents } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Ensure events is an array
  const eventsList = Array.isArray(events) ? events : [];
  
  // Get upcoming events (first 6)
  const upcomingEvents = eventsList.slice(0, 6);

  // Calculate stats safely
  const totalRSVPs = eventsList.reduce((sum, e) => sum + (e.current_attendees || 0), 0);
  const uniqueCategories = new Set(eventsList.map(e => e.category)).size;

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        elevation={0}
        sx={{
          p: 6,
          mb: 6,
          background: 'linear-gradient(135deg, #1976d2 0%, #42a5f5 100%)',
          color: 'white',
          borderRadius: 4,
          textAlign: 'center',
        }}
      >
        <EventIcon sx={{ fontSize: 64, mb: 2 }} />
        <Typography variant="h2" component="h1" gutterBottom fontWeight={700}>
          Campus Events
        </Typography>
        <Typography variant="h5" sx={{ mb: 4, opacity: 0.9 }}>
          Discover and participate in amazing campus events
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            component={Link}
            to="/events"
            variant="contained"
            size="large"
            sx={{ backgroundColor: 'white', color: 'primary.main', '&:hover': { backgroundColor: 'grey.100' } }}
          >
            Browse All Events
          </Button>
          <Button
            component={Link}
            to="/events/create"
            variant="outlined"
            size="large"
            startIcon={<AddIcon />}
            sx={{ borderColor: 'white', color: 'white', '&:hover': { borderColor: 'grey.100', backgroundColor: 'rgba(255,255,255,0.1)' } }}
          >
            Create Event
          </Button>
        </Box>
      </Paper>

      {/* Quick Stats */}
      <Grid container spacing={3} sx={{ mb: 6 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="primary" fontWeight={700}>
              {eventsList.length}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upcoming Events
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="success.main" fontWeight={700}>
              {totalRSVPs}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Total RSVPs
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h3" color="secondary.main" fontWeight={700}>
              {uniqueCategories}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Categories
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Recommended Events */}
      <RecommendedEvents />

      {/* Featured Events */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={600}>
          Featured Events
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Check out these upcoming events happening soon
        </Typography>
        
        {loading ? (
          <LoadingSpinner />
        ) : (
          <EventList events={upcomingEvents} loading={false} />
        )}
      </Box>

      {/* Call to Action */}
      <Paper
        elevation={2}
        sx={{
          p: 4,
          textAlign: 'center',
          background: 'linear-gradient(135deg, #f50057 0%, #ff4081 100%)',
          color: 'white',
        }}
      >
        <Typography variant="h5" gutterBottom fontWeight={600}>
          Have an event to share?
        </Typography>
        <Typography variant="body1" sx={{ mb: 3, opacity: 0.9 }}>
          Create your own event and let others know about it
        </Typography>
        <Button
          component={Link}
          to="/events/create"
          variant="contained"
          size="large"
          startIcon={<AddIcon />}
          sx={{ backgroundColor: 'white', color: 'secondary.main', '&:hover': { backgroundColor: 'grey.100' } }}
        >
          Create Event
        </Button>
      </Paper>
    </Container>
  );
};

export default HomePage;
