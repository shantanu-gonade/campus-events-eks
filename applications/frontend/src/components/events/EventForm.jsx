import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  Typography,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { eventSchema } from '../../utils/validators';
import { EVENT_CATEGORIES } from '../../utils/constants';

const EventForm = ({ initialData, onSubmit, onCancel, loading }) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(eventSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      start_time: new Date(),
      end_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours later
      location: '',
      category: 'Workshop', // Default to Workshop instead of empty string
      max_attendees: 50,
    },
  });

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
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
                rows={4}
                error={!!errors.description}
                helperText={errors.description?.message}
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
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  {...field}
                  label="Start Date & Time"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.start_time,
                      helperText: errors.start_time?.message,
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        {/* End Time */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="end_time"
            control={control}
            render={({ field }) => (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DateTimePicker
                  {...field}
                  label="End Date & Time"
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      error: !!errors.end_time,
                      helperText: errors.end_time?.message,
                    },
                  }}
                />
              </LocalizationProvider>
            )}
          />
        </Grid>

        {/* Location */}
        <Grid item xs={12} sm={6}>
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

        {/* Category */}
        <Grid item xs={12} sm={6}>
          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Category"
                fullWidth
                required
                error={!!errors.category}
                helperText={errors.category?.message}
              >
                {EVENT_CATEGORIES.map((category) => (
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
                type="number"
                label="Maximum Attendees"
                fullWidth
                required
                inputProps={{ min: 1, max: 500 }}
                error={!!errors.max_attendees}
                helperText={errors.max_attendees?.message}
              />
            )}
          />
        </Grid>

        {/* Buttons */}
        <Grid item xs={12}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            <Button onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? 'Saving...' : initialData ? 'Update Event' : 'Create Event'}
            </Button>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
};

export default EventForm;
