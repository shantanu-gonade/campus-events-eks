import { useState } from 'react';
import toast from 'react-hot-toast';
import * as rsvpService from '../services/rsvpService';
import useUserStore from '../store/userStore';
import useEventStore from '../store/eventStore';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '../utils/constants';

export const useRSVP = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { addRSVP, removeRSVP, isRegisteredForEvent, getRSVPForEvent } = useUserStore();
  const { updateEventInList } = useEventStore();

  const createRSVP = async (eventId, rsvpData) => {
    setLoading(true);
    setError(null);
    try {
      const newRSVP = await rsvpService.createRSVP(eventId, rsvpData);
      addRSVP(newRSVP);
      toast.success(SUCCESS_MESSAGES.RSVP_CREATED);
      return newRSVP;
    } catch (err) {
      const errorMessage = err.customMessage || ERROR_MESSAGES.GENERIC_ERROR;
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const cancelRSVP = async (rsvpId) => {
    setLoading(true);
    setError(null);
    try {
      await rsvpService.cancelRSVP(rsvpId);
      removeRSVP(rsvpId);
      toast.success(SUCCESS_MESSAGES.RSVP_CANCELLED);
    } catch (err) {
      const errorMessage = err.customMessage || ERROR_MESSAGES.GENERIC_ERROR;
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const checkRegistration = (eventId) => {
    return isRegisteredForEvent(eventId);
  };

  const getUserRSVP = (eventId) => {
    return getRSVPForEvent(eventId);
  };

  return {
    createRSVP,
    cancelRSVP,
    isRegistered: checkRegistration,
    getUserRSVP,
    loading,
    error,
  };
};

export default useRSVP;
