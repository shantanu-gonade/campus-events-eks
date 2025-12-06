import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Chip,
  Button,
  Grid,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn,
  People,
  AccessTime,
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatDateTime, getCapacityPercentage } from '../utils/formatters';
import { getCategoryIcon, getCategoryColor } from '../utils/constants';
import * as eventService from '../services/eventService';
import * as rsvpService from '../services/rsvpService';
import RSVPButton from '../components/rsvp/RSVPButton';
import RSVPForm from '../components/rsvp/RSVPForm';
import toast from 'react-hot-toast';

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [rsvpDialogOpen, setRsvpDialogOpen] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(id);
      setEvent(data);
      setError(null);
    } catch (err) {
      setError(err.message);
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleRSVPSubmit = async (formData) => {
    try {
      setRsvpLoading(true);
      await rsvpService.createRSVP(id, formData);
      toast.success('RSVP submitted successfully!');
      setRsvpDialogOpen(false);
      fetchEvent(); // Refresh event data
    } catch (err) {
      toast.error(err.message || 'Failed to submit RSVP');
    } finally {
      setRsvpLoading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await eventService.deleteEvent(id);
        toast.success('Event deleted successfully');
        navigate('/events');
      } catch (err) {
        toast.error('Failed to delete event');
      }
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error || 'Event not found'}
        </Alert>
        <Button onClick={() => navigate('/events')} sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  const isFull = (event.current_attendees || 0) >= event.max_attendees;
  const capacityPercentage = getCapacityPercentage(event.current_attendees || 0, event.max_attendees);

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4}>
        {/* Left Column - Event Details */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper elevation={2} sx={{ p: 4 }}>
            {/* Category & Actions */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Chip
                label={event.category}
                icon={<span>{getCategoryIcon(event.category)}</span>}
                sx={{
                  backgroundColor: getCategoryColor(event.category),
                  color: 'white',
                  fontWeight: 600,
                }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  startIcon={<EditIcon />}
                  onClick={() => navigate(`/events/${id}/edit`)}
                  size="small"
                >
                  Edit
                </Button>
                <Button
                  startIcon={<DeleteIcon />}
                  color="error"
                  onClick={handleDelete}
                  size="small"
                >
                  Delete
                </Button>
              </Box>
            </Box>

            {/* Title */}
            <Typography variant="h3" gutterBottom fontWeight={700}>
              {event.title}
            </Typography>

            {/* Meta Info */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <EventIcon sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body1">
                  {formatDateTime(event.start_time)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AccessTime sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body1">
                  Ends: {formatDateTime(event.end_time)}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <LocationOn sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body1">{event.location}</Typography>
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <People sx={{ mr: 1.5, color: 'primary.main' }} />
                <Typography variant="body1">
                  {event.current_attendees || 0} / {event.max_attendees} attending ({capacityPercentage}% full)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Description */}
            <Typography variant="h6" gutterBottom fontWeight={600}>
              About This Event
            </Typography>
            <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
              {event.description}
            </Typography>
          </Paper>
        </Grid>

        {/* Right Column - RSVP Section */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper elevation={2} sx={{ p: 3, position: 'sticky', top: 24 }}>
            <Typography variant="h6" gutterBottom fontWeight={600}>
              Register for Event
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              {isFull
                ? 'This event has reached maximum capacity'
                : `${event.max_attendees - (event.current_attendees || 0)} spots remaining`}
            </Typography>

            <RSVPButton
              isRegistered={false} // TODO: Check if user is registered
              isFull={isFull}
              loading={rsvpLoading}
              onClick={() => setRsvpDialogOpen(true)}
            />
          </Paper>
        </Grid>
      </Grid>

      {/* RSVP Dialog */}
      <RSVPForm
        open={rsvpDialogOpen}
        onClose={() => setRsvpDialogOpen(false)}
        onSubmit={handleRSVPSubmit}
        loading={rsvpLoading}
        eventTitle={event.title}
      />
    </Container>
  );
};

export default EventDetailPage;
