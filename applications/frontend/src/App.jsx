import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

// Use relative path so it works through the ALB
// When accessed via ALB, /api routes to the backend service
const API_URL = import.meta.env.VITE_API_URL || ''

function App() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/v1/events`)
      setEvents(response.data)
      setError(null)
    } catch (err) {
      setError('Failed to load events. API may not be running.')
      console.error('Error fetching events:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>Campus Events Management</h1>
        <p>Kubernetes-based Microservices Platform</p>
      </header>

      <main className="container">
        <section className="events-section">
          <h2>Upcoming Events</h2>
          
          {loading && <p className="loading">Loading events...</p>}
          
          {error && (
            <div className="error-message">
              <p>{error}</p>
              <button onClick={fetchEvents}>Retry</button>
            </div>
          )}

          {!loading && !error && events.length === 0 && (
            <p className="no-events">No events found. Create your first event!</p>
          )}

          {!loading && !error && events.length > 0 && (
            <div className="events-grid">
              {events.map((event) => (
                <div key={event.id} className="event-card">
                  <h3>{event.title}</h3>
                  <p className="event-date">
                    📅 {new Date(event.start_time).toLocaleString()}
                  </p>
                  <p className="event-description">{event.description}</p>
                  <p className="event-location">📍 {event.location}</p>
                  <p className="event-capacity">
                    👥 {event.current_attendees}/{event.max_attendees} attendees
                  </p>
                  <p className="event-category">🏷️ {event.category}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="info-section">
          <h3>System Status</h3>
          <div className="status-card">
            <p>✅ Frontend: Running</p>
            <p>{error ? '❌' : '✅'} Backend API: {error ? 'Disconnected' : 'Connected'}</p>
            <p>🚀 Deployed on: AWS EKS</p>
          </div>
        </section>
      </main>

      <footer>
        <p>ENPM818R - Cloud Computing Project</p>
        <p>Container-based deployment with Docker & Kubernetes</p>
      </footer>
    </div>
  )
}

export default App
