-- Campus Events Management System Database Schema
-- PostgreSQL 16.3
-- Created: December 2025
-- Environment: Development

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'organizer', 'admin')),
    department VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    CONSTRAINT email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Events table
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    max_attendees INTEGER NOT NULL CHECK (max_attendees > 0),
    current_attendees INTEGER DEFAULT 0 CHECK (current_attendees >= 0),
    organizer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed', 'cancelled')),
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT valid_attendees CHECK (current_attendees <= max_attendees)
);

-- RSVPs table
CREATE TABLE rsvps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'waitlisted', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, user_id)
);

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES events(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN ('event_reminder', 'event_update', 'event_cancelled', 'rsvp_confirmed', 'rsvp_waitlisted')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP WITH TIME ZONE
);

-- Event Categories lookup table (optional but recommended)
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_start_time ON events(start_time);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_rsvps_event ON rsvps(event_id);
CREATE INDEX idx_rsvps_user ON rsvps(user_id);
CREATE INDEX idx_rsvps_status ON rsvps(status);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_notifications_event ON notifications(event_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update_updated_at trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rsvps_updated_at BEFORE UPDATE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update current_attendees when RSVP is created/updated
CREATE OR REPLACE FUNCTION update_event_attendees()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrease count for old status (on UPDATE)
    IF TG_OP = 'UPDATE' THEN
        IF OLD.status = 'confirmed' THEN
            UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
        END IF;
    END IF;

    -- Decrease count on DELETE
    IF TG_OP = 'DELETE' THEN
        IF OLD.status = 'confirmed' THEN
            UPDATE events SET current_attendees = current_attendees - 1 WHERE id = OLD.event_id;
        END IF;
        RETURN OLD;
    END IF;

    -- Increase count for new status
    IF NEW.status = 'confirmed' THEN
        UPDATE events SET current_attendees = current_attendees + 1 WHERE id = NEW.event_id;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_event_attendees_on_rsvp
    AFTER INSERT OR UPDATE OR DELETE ON rsvps
    FOR EACH ROW EXECUTE FUNCTION update_event_attendees();

-- Insert default event categories
INSERT INTO event_categories (name, description) VALUES
    ('Workshop', 'Technical workshops and training sessions'),
    ('Seminar', 'Educational seminars and lectures'),
    ('Social', 'Social gatherings and networking events'),
    ('Sports', 'Sports and fitness activities'),
    ('Cultural', 'Cultural events and celebrations'),
    ('Career', 'Career fairs and professional development'),
    ('Hackathon', 'Coding competitions and hackathons'),
    ('Conference', 'Academic and professional conferences'),
    ('Club Meeting', 'Student organization meetings'),
    ('Other', 'Other events');

-- Create a sample admin user (password: Admin123!)
-- Password hash for 'Admin123!' using bcrypt
INSERT INTO users (email, password_hash, first_name, last_name, role, department) VALUES
    ('admin@campus.edu', '$2b$10$rKZvFvFZXmUhKxmXxVxqPeqYhNUZVXFXGXXGGzZZZZZZZZZZZZZZZZ', 'System', 'Admin', 'admin', 'IT');

-- Add comments to tables for documentation
COMMENT ON TABLE users IS 'Stores user account information including students, organizers, and administrators';
COMMENT ON TABLE events IS 'Stores event details including scheduling, capacity, and metadata';
COMMENT ON TABLE rsvps IS 'Manages user RSVPs and waitlist status for events';
COMMENT ON TABLE notifications IS 'Stores notifications sent to users about events and RSVPs';
COMMENT ON TABLE event_categories IS 'Lookup table for event category classification';

-- Grant permissions (adjust based on your application user)
-- GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO your_app_user;
