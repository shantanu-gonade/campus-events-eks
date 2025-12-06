import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
} from '@mui/material';
import EventForm from '../components/events/EventForm';
import * as eventService from '../services/eventService';
import toast from 'react-hot-toast';

const CreateEventPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Convert Date objects to ISO strings
      const formattedData = {
        ...data,
        start_time: data.start_time instanceof Date ? data.start_time.toISOString() : data.start_time,
        end_time: data.end_time instanceof Date ? data.end_time.toISOString() : data.end_time,
      };
      
      const newEvent = await eventService.createEvent(formattedData);
      toast.success('Event created successfully!');
      navigate(`/events/${newEvent.id}`);
    } catch (err) {
      toast.error(err.response?.data?.error || err.message || 'Failed to create event');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/events');
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={2} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Create New Event
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          Fill in the details below to create a new campus event
        </Typography>

        <EventForm
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          loading={loading}
        />
      </Paper>
    </Container>
  );
};

export default CreateEventPage;
