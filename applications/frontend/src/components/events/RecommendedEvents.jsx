import { useEffect, useState } from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { AutoAwesome as RecommendIcon } from '@mui/icons-material';
import recommendationService from '../../services/recommendationService';
import EventCard from '../events/EventCard';
import LoadingSpinner from '../common/LoadingSpinner';

const RecommendedEvents = ({ userEmail = null }) => {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRecommendations = async () => {
      // Default email for demo (when no user is logged in)
      const email = userEmail || 'demo@campus.edu';
      
      try {
        setLoading(true);
        setError(null);
        const data = await recommendationService.getRecommendations(email);
        setRecommendations(data);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Failed to load recommendations');
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, [userEmail]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <LoadingSpinner />
      </Box>
    );
  }

  if (error || recommendations.length === 0) {
    return null; // Don't show anything if there's an error or no recommendations
  }

  return (
    <Box sx={{ mb: 6 }}>
      <Paper
        sx={{
          p: 3,
          mb: 3,
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <RecommendIcon sx={{ fontSize: 32 }} />
          <Typography variant="h5" fontWeight={700}>
            Recommended For You
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
          Events we think you'll love based on your interests
        </Typography>
      </Paper>

      <Grid container spacing={3}>
        {recommendations.slice(0, 3).map((event) => (
          <Grid item xs={12} sm={6} md={4} key={event.id}>
            <EventCard event={event} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default RecommendedEvents;
