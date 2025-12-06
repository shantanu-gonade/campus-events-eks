import { Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import Layout from './components/layout/Layout';
import HomePage from './pages/HomePage';
import EventsPage from './pages/EventsPage';
import EventDetailPage from './pages/EventDetailPage';
import CreateEventPage from './pages/CreateEventPage';
import AdminDashboard from './pages/AdminDashboard';
import NotFoundPage from './pages/NotFoundPage';
import { useWebSocket } from './hooks/useWebSocket';
import useEventStore from './store/eventStore';
import toast from 'react-hot-toast';

function App() {
  const { subscribeToAll } = useWebSocket();
  const { addEvent, updateEventInList, removeEvent } = useEventStore();

  useEffect(() => {
    // Subscribe to WebSocket events for real-time updates
    const unsubscribe = subscribeToAll({
      onEventCreated: (event) => {
        addEvent(event);
        toast.success(`New event created: ${event.title}`, {
          duration: 4000,
          icon: '🎉',
        });
      },
      onEventUpdated: (event) => {
        updateEventInList(event);
        toast.success(`Event updated: ${event.title}`, {
          duration: 3000,
          icon: '✏️',
        });
      },
      onEventDeleted: ({ id }) => {
        removeEvent(id);
        toast.success('Event deleted', {
          duration: 3000,
          icon: '🗑️',
        });
      },
      onRSVPCreated: (rsvp) => {
        toast.success('New RSVP registered!', {
          duration: 3000,
          icon: '👥',
        });
      },
      onCapacityWarning: (event) => {
        toast.error(`${event.title} is 90% full!`, {
          duration: 5000,
          icon: '⚠️',
        });
      },
    });

    return unsubscribe;
  }, [subscribeToAll, addEvent, updateEventInList, removeEvent]);

  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="events" element={<EventsPage />} />
        <Route path="events/:id" element={<EventDetailPage />} />
        <Route path="events/create" element={<CreateEventPage />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
}

export default App;
