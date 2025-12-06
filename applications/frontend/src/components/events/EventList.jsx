import { Grid, Box } from '@mui/material';
import EventCard from './EventCard';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

const EventList = ({ events, loading }) => {
  if (loading) {
    return <LoadingSpinner />;
  }

  if (!events || events.length === 0) {
    return (
      <EmptyState
        message="No events found"
        description="Check back later for upcoming events"
      />
    );
  }

  return (
    <Grid container spacing={3}>
      {events.map((event) => (
        <Grid size={{ xs: 12, sm: 6, md: 4 }} key={event.id}>
          <EventCard event={event} />
        </Grid>
      ))}
    </Grid>
  );
};

export default EventList;
