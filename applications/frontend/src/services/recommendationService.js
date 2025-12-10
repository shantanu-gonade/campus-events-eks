import api from './api';

const recommendationService = {
  // Get personalized recommendations for a user
  getRecommendations: async (email) => {
    try {
      const response = await api.get(`/v1/recommendations?email=${encodeURIComponent(email)}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      throw error;
    }
  },

  // Get similar events based on an event ID
  getSimilarEvents: async (eventId) => {
    try {
      const response = await api.get(`/v1/events/${eventId}/similar`);
      return response.data;
    } catch (error) {
      console.error('Error fetching similar events:', error);
      throw error;
    }
  },
};

export default recommendationService;
