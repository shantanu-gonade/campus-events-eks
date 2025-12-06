import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Event as EventIcon,
  LocationOn,
  People,
} from '@mui/icons-material';
import { Link } from 'react-router-dom';
import { formatDateTime, getCapacityPercentage, getCapacityColor } from '../../utils/formatters';
import { getCategoryIcon, getCategoryColor } from '../../utils/constants';

const EventCard = ({ event }) => {
  const capacityPercentage = getCapacityPercentage(
    event.current_attendees || 0,
    event.max_attendees
  );
  const capacityColor = getCapacityColor(capacityPercentage);

  return (
    <Card
      elevation={2}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 6,
        },
      }}
    >
      {/* Image placeholder */}
      <Box
        sx={{
          height: 180,
          background: `linear-gradient(135deg, ${getCategoryColor(event.category)} 0%, ${getCategoryColor(event.category)}dd 100%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Box sx={{ color: 'white', fontSize: 64 }}>
          {getCategoryIcon(event.category)}
        </Box>
      </Box>

      <CardContent sx={{ flexGrow: 1 }}>
        {/* Category chip */}
        <Chip
          label={event.category}
          size="small"
          sx={{
            mb: 1,
            backgroundColor: getCategoryColor(event.category),
            color: 'white',
          }}
        />

        {/* Title */}
        <Typography variant="h6" component="h2" gutterBottom noWrap>
          {event.title}
        </Typography>

        {/* Date and time */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <EventIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {formatDateTime(event.start_time)}
          </Typography>
        </Box>

        {/* Location */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <LocationOn fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary" noWrap>
            {event.location}
          </Typography>
        </Box>

        {/* Capacity */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
          <People fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
          <Typography variant="body2" color="text.secondary">
            {event.current_attendees || 0} / {event.max_attendees} attending
          </Typography>
        </Box>

        {/* Progress bar */}
        <LinearProgress
          variant="determinate"
          value={capacityPercentage}
          sx={{
            height: 8,
            borderRadius: 4,
            backgroundColor: 'grey.200',
            '& .MuiLinearProgress-bar': {
              backgroundColor: capacityColor,
            },
          }}
        />
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5 }}>
          {capacityPercentage}% full
        </Typography>
      </CardContent>

      <CardActions sx={{ p: 2, pt: 0 }}>
        <Button
          component={Link}
          to={`/events/${event.id}`}
          variant="contained"
          fullWidth
          size="medium"
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default EventCard;
