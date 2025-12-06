import { Box, Typography, Button } from '@mui/material';
import SentimentDissatisfiedIcon from '@mui/icons-material/SentimentDissatisfied';

const EmptyState = ({ 
  title = 'No items found', 
  description = '',
  icon: Icon = SentimentDissatisfiedIcon,
  actionLabel,
  onAction 
}) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      minHeight="300px"
      padding={4}
      textAlign="center"
    >
      <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
      <Typography variant="h6" gutterBottom color="text.primary">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" color="text.secondary" mb={3}>
          {description}
        </Typography>
      )}
      {actionLabel && onAction && (
        <Button variant="contained" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Box>
  );
};

export default EmptyState;
