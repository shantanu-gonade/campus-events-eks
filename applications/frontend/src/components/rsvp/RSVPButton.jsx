import { Button, CircularProgress } from '@mui/material';
import { Check as CheckIcon } from '@mui/icons-material';

const RSVPButton = ({
  isRegistered,
  isFull,
  loading,
  onClick,
}) => {
  if (isRegistered) {
    return (
      <Button
        variant="contained"
        color="success"
        fullWidth
        disabled
        startIcon={<CheckIcon />}
      >
        Registered
      </Button>
    );
  }

  if (isFull) {
    return (
      <Button variant="contained" fullWidth disabled>
        Event Full
      </Button>
    );
  }

  return (
    <Button
      variant="contained"
      color="primary"
      fullWidth
      onClick={onClick}
      disabled={loading}
      startIcon={loading && <CircularProgress size={20} color="inherit" />}
    >
      {loading ? 'Processing...' : 'RSVP Now'}
    </Button>
  );
};

export default RSVPButton;
