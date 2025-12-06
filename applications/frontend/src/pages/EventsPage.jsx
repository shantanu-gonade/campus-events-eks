import { useEffect } from 'react';
import {
  Container,
  Typography,
  Button,
  Box,
  Fab,
} from '@mui/material';
import { Add as AddIcon } from '@mui/icons-material';
import { Link } from 'react-router-dom';
import useEventStore from '../store/eventStore';
import EventList from '../components/events/EventList';

const EventsPage = () => {
  const { events, loading, fetchEvents } = useEventStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Ensure events is an array
  const eventsList = Array.isArray(events) ? events : [];

  return (
    <Container maxWidth="lg">
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
        <div>
          <Typography variant="h3" gutterBottom fontWeight={700}>
            All Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Browse and register for upcoming campus events
          </Typography>
        </div>
        <Button
          component={Link}
          to="/events/create"
          variant="contained"
          startIcon={<AddIcon />}
          size="large"
          sx={{ display: { xs: 'none', md: 'flex' } }}
        >
          Create Event
        </Button>
      </Box>

      <EventList events={eventsList} loading={loading} />

      {/* Floating Action Button for Mobile */}
      <Fab
        component={Link}
        to="/events/create"
        color="primary"
        aria-label="create event"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
          display: { md: 'none' },
        }}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
};

export default EventsPage;
