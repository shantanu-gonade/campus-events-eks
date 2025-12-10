import { Paper, Typography, Box, List, ListItem, ListItemText, Chip } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PersonAdd as PersonAddIcon,
  PersonRemove as PersonRemoveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';

const RecentActivity = ({ activities = [] }) => {
  // Get icon based on activity type
  const getActivityIcon = (type) => {
    switch (type) {
      case 'event:created':
        return <AddIcon color="success" />;
      case 'event:updated':
        return <EditIcon color="info" />;
      case 'event:deleted':
        return <DeleteIcon color="error" />;
      case 'rsvp:created':
        return <PersonAddIcon color="primary" />;
      case 'rsvp:cancelled':
        return <PersonRemoveIcon color="warning" />;
      case 'capacity:warning':
        return <WarningIcon color="warning" />;
      default:
        return null;
    }
  };

  // Get color based on activity type
  const getActivityColor = (type) => {
    switch (type) {
      case 'event:created':
        return 'success';
      case 'event:updated':
        return 'info';
      case 'event:deleted':
        return 'error';
      case 'rsvp:created':
        return 'primary';
      case 'rsvp:cancelled':
        return 'warning';
      case 'capacity:warning':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Format activity message
  const formatActivityMessage = (activity) => {
    switch (activity.type) {
      case 'event:created':
        return `New event created: ${activity.event_title}`;
      case 'event:updated':
        return `Event updated: ${activity.event_title}`;
      case 'event:deleted':
        return `Event deleted: ${activity.event_title}`;
      case 'rsvp:created':
        return `New RSVP for: ${activity.event_title}`;
      case 'rsvp:cancelled':
        return `RSVP cancelled for: ${activity.event_title}`;
      case 'capacity:warning':
        return `Event ${activity.event_title} is 90% full!`;
      default:
        return activity.message || 'Activity occurred';
    }
  };

  return (
    <Paper sx={{ p: 3, height: '100%' }}>
      <Typography variant="h6" gutterBottom fontWeight={600}>
        Recent Activity
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Latest updates and changes
      </Typography>

      {activities.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No recent activity to display
          </Typography>
        </Box>
      ) : (
        <List sx={{ maxHeight: 400, overflow: 'auto' }}>
          {activities.map((activity, index) => (
            <ListItem
              key={activity.id || index}
              sx={{
                borderLeft: 3,
                borderColor: `${getActivityColor(activity.type)}.main`,
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                '&:hover': {
                  bgcolor: 'action.hover',
                },
              }}
            >
              <Box sx={{ mr: 2 }}>
                {getActivityIcon(activity.type)}
              </Box>
              <ListItemText
                primary={formatActivityMessage(activity)}
                secondary={
                  activity.timestamp
                    ? formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })
                    : 'Just now'
                }
                primaryTypographyProps={{
                  variant: 'body2',
                  fontWeight: 500,
                }}
                secondaryTypographyProps={{
                  variant: 'caption',
                }}
              />
              <Chip
                label={activity.type?.split(':')[0] || 'event'}
                size="small"
                color={getActivityColor(activity.type)}
                variant="outlined"
              />
            </ListItem>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default RecentActivity;
