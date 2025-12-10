import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Button,
  TextField,
  MenuItem,
  Grid,
  CircularProgress,
  Alert,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { ArrowBack, Save } from '@mui/icons-material';
import { eventSchema } from '../utils/validators';
import { CATEGORIES } from '../utils/constants';
import * as eventService from '../services/eventService';
import toast from 'react-hot-toast';

const EditEventPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: {
      title: '',
      description: '',
      start_time: '',
      end_time: '',
      location: '',
      category: 'Other',
      max_attendees: 50,
    },
  });

  useEffect(() => {
    fetchEvent();
  }, [id]);

  const fetchEvent = async () => {
    try {
      setLoading(true);
      const data = await eventService.getEventById(id);
      
      // Format dates for datetime-local input
      const formatDateForInput = (dateString) => {
        const date = new Date(dateString);
        return date.toISOString().slice(0, 16);
      };

      reset({
        title: data.title,
        description: data.description,
        start_time: formatDateForInput(data.start_time),
        end_time: formatDateForInput(data.end_time),
        location: data.location,
        category: data.category || 'Other',
        max_attendees: data.max_attendees,
      });
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load event');
      toast.error('Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      
      // Convert datetime-local format to ISO
      const formattedData = {
        ...data,
        start_time: new Date(data.start_time).toISOString(),
        end_time: new Date(data.end_time).toISOString(),
      };

      await eventService.updateEvent(id, formattedData);
      toast.success('Event updated successfully!');
      navigate(`/events/${id}`);
    } catch (err) {
      toast.error(err.message || 'Failed to update event');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          {error}
        </Alert>
        <Button onClick={() => navigate('/events')} sx={{ mt: 2 }}>
          Back to Events
        </Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/events/${id}`)}
          sx={{ mb: 2 }}
        >
          Back to Event
        </Button>
        <Typography variant="h4" fontWeight={700}>
          Edit Event
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: 4 }}>
        <Box component="form" onSubmit={handleSubmit(onSubmit)}>
          <Grid container spacing={3}>
            {/* Title */}
            <Grid item xs={12}>
              <Controller
                name="title"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Event Title"
                    fullWidth
                    required
                    error={!!errors.title}
                    helperText={errors.title?.message}
                  />
                )}
              />
            </Grid>

            {/* Description */}
            <Grid item xs={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    required
                    multiline
                    rows={6}
                    error={!!errors.description}
                    helperText={errors.description?.message}
                  />
                )}
              />
            </Grid>

            {/* Category */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Category"
                    fullWidth
                    select
                    required
                    error={!!errors.category}
                    helperText={errors.category?.message}
                  >
                    {CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {category}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Grid>

            {/* Max Attendees */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="max_attendees"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Maximum Attendees"
                    type="number"
                    fullWidth
                    required
                    inputProps={{ min: 1, max: 1000 }}
                    error={!!errors.max_attendees}
                    helperText={errors.max_attendees?.message}
                  />
                )}
              />
            </Grid>

            {/* Start Time */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="start_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Start Date & Time"
                    type="datetime-local"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.start_time}
                    helperText={errors.start_time?.message}
                  />
                )}
              />
            </Grid>

            {/* End Time */}
            <Grid item xs={12} sm={6}>
              <Controller
                name="end_time"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="End Date & Time"
                    type="datetime-local"
                    fullWidth
                    required
                    InputLabelProps={{ shrink: true }}
                    error={!!errors.end_time}
                    helperText={errors.end_time?.message}
                  />
                )}
              />
            </Grid>

            {/* Location */}
            <Grid item xs={12}>
              <Controller
                name="location"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Location"
                    fullWidth
                    required
                    error={!!errors.location}
                    helperText={errors.location?.message}
                  />
                )}
              />
            </Grid>

            {/* Submit Button */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/events/${id}`)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  startIcon={<Save />}
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : 'Save Changes'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Container>
  );
};

export default EditEventPage;
