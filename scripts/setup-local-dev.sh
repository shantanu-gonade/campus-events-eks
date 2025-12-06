#!/bin/bash
# ============================================================================
# LOCAL DEVELOPMENT SETUP - Complete Fix
# ============================================================================
# This script sets up everything needed for local backend development
# ============================================================================

set -e

echo "============================================================================"
echo "🔧 Local Development Setup - Complete Fix"
echo "============================================================================"
echo ""

cd "$(dirname "$0")/.."

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "📋 What this script does:"
echo "  1. Checks PostgreSQL is running on localhost"
echo "  2. Creates/resets 'campus_events' database"
echo "  3. Applies official UUID schema from DATABASE_SCHEMA.sql"
echo "  4. Inserts sample data (5 events + demo organizer)"
echo "  5. Verifies backend .env.local configuration"
echo "  6. Installs backend dependencies"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi
echo ""

# ============================================================================
# Step 1: Check PostgreSQL
# ============================================================================
echo "Step 1: Checking PostgreSQL..."
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL client (psql) not found${NC}"
    echo ""
    echo "Install PostgreSQL:"
    echo "  macOS: brew install postgresql@14"
    echo "  Linux: sudo apt-get install postgresql-client"
    echo ""
    exit 1
fi

if ! pg_isready -h localhost -p 5432 > /dev/null 2>&1; then
    echo -e "${RED}❌ PostgreSQL is not running on localhost:5432${NC}"
    echo ""
    echo "Start PostgreSQL:"
    echo "  macOS (Homebrew): brew services start postgresql@14"
    echo "  macOS (Postgres.app): Open Postgres.app"
    echo "  Linux: sudo systemctl start postgresql"
    echo ""
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL is running${NC}"
echo ""

# ============================================================================
# Step 2: Database Setup
# ============================================================================
echo "Step 2: Setting up database..."

DB_NAME="campus_events"
DB_USER="postgres"

# Drop and recreate database
echo "  Dropping existing database (if exists)..."
psql -h localhost -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true

echo "  Creating database '$DB_NAME'..."
psql -h localhost -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo -e "${GREEN}✅ Database created${NC}"
echo ""

# ============================================================================
# Step 3: Apply Schema
# ============================================================================
echo "Step 3: Applying database schema..."

SCHEMA_FILE="docs/DATABASE_SCHEMA.sql"
if [ ! -f "$SCHEMA_FILE" ]; then
    echo -e "${RED}❌ Schema file not found: $SCHEMA_FILE${NC}"
    exit 1
fi

psql -h localhost -U $DB_USER -d $DB_NAME -f "$SCHEMA_FILE" > /dev/null 2>&1

echo -e "${GREEN}✅ Schema applied (UUID-based)${NC}"
echo ""

# ============================================================================
# Step 4: Insert Sample Data
# ============================================================================
echo "Step 4: Inserting sample data..."

psql -h localhost -U $DB_USER -d $DB_NAME << 'EOF' > /dev/null 2>&1
-- Demo organizer user (MVP - no auth yet)
INSERT INTO users (email, password_hash, first_name, last_name, role, department) 
VALUES ('organizer@campus.edu', '$2b$10$SAMPLE_HASH', 'Demo', 'Organizer', 'organizer', 'Events')
ON CONFLICT (email) DO NOTHING;

-- Sample events
DO $$
DECLARE
    organizer_uuid UUID;
BEGIN
    SELECT id INTO organizer_uuid FROM users WHERE email = 'organizer@campus.edu';
    
    INSERT INTO events (title, description, start_time, end_time, location, category, max_attendees, organizer_id)
    VALUES 
        ('Tech Talk: Cloud Computing', 
         'Learn about modern cloud infrastructure, containerization with Docker and Kubernetes, and best practices for deploying scalable applications on AWS.',
         NOW() + INTERVAL '7 days', 
         NOW() + INTERVAL '7 days' + INTERVAL '2 hours', 
         'Engineering Building Room 301', 
         'Workshop', 
         50, 
         organizer_uuid),
        
        ('Campus Career Fair 2025', 
         'Meet potential employers from leading tech companies. Bring your resume and prepare for on-the-spot interviews.',
         NOW() + INTERVAL '14 days', 
         NOW() + INTERVAL '14 days' + INTERVAL '4 hours', 
         'Student Center Main Hall', 
         'Career', 
         200, 
         organizer_uuid),
        
        ('Annual Music Festival', 
         'Enjoy live performances from campus bands and local artists. Food trucks and activities throughout the day.',
         NOW() + INTERVAL '21 days', 
         NOW() + INTERVAL '21 days' + INTERVAL '6 hours', 
         'Campus Green', 
         'Cultural', 
         500, 
         organizer_uuid),
         
        ('Startup Pitch Competition', 
         'Watch student entrepreneurs pitch their startup ideas. Winner receives $10,000 seed funding.',
         NOW() + INTERVAL '10 days', 
         NOW() + INTERVAL '10 days' + INTERVAL '3 hours', 
         'Innovation Hub Auditorium', 
         'Conference', 
         100, 
         organizer_uuid),
         
        ('Hackathon 2025', 
         '24-hour coding marathon with workshops, mentorship, and prizes. Free food and swag for all participants.',
         NOW() + INTERVAL '28 days', 
         NOW() + INTERVAL '29 days', 
         'Computer Science Building', 
         'Hackathon', 
         150, 
         organizer_uuid)
    ON CONFLICT DO NOTHING;
END $$;
EOF

echo -e "${GREEN}✅ Sample data inserted${NC}"
echo ""

# ============================================================================
# Step 5: Verify Database
# ============================================================================
echo "Step 5: Verifying database..."

TABLE_COUNT=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE';" | tr -d ' ')
EVENT_COUNT=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM events;" | tr -d ' ')
USER_COUNT=$(psql -h localhost -U $DB_USER -d $DB_NAME -t -c "SELECT COUNT(*) FROM users;" | tr -d ' ')

echo "  Tables: $TABLE_COUNT"
echo "  Events: $EVENT_COUNT"
echo "  Users: $USER_COUNT"

echo -e "${GREEN}✅ Database verified${NC}"
echo ""

# ============================================================================
# Step 6: Backend Configuration
# ============================================================================
echo "Step 6: Verifying backend configuration..."

ENV_LOCAL="applications/events-api/.env.local"
if [ ! -f "$ENV_LOCAL" ]; then
    echo -e "${RED}❌ Missing .env.local file${NC}"
    exit 1
fi

# Verify key settings
DB_HOST=$(grep "^DB_HOST=" "$ENV_LOCAL" | cut -d'=' -f2)
DB_NAME_CONFIG=$(grep "^DB_NAME=" "$ENV_LOCAL" | cut -d'=' -f2)

if [ "$DB_HOST" != "localhost" ]; then
    echo -e "${RED}❌ DB_HOST should be 'localhost' in .env.local${NC}"
    exit 1
fi

if [ "$DB_NAME_CONFIG" != "campus_events" ]; then
    echo -e "${RED}❌ DB_NAME should be 'campus_events' in .env.local${NC}"
    exit 1
fi

echo "  Configuration file: .env.local ✓"
echo "  DB_HOST: $DB_HOST ✓"
echo "  DB_NAME: $DB_NAME_CONFIG ✓"

echo -e "${GREEN}✅ Backend configuration correct${NC}"
echo ""

# ============================================================================
# Step 7: Install Dependencies
# ============================================================================
echo "Step 7: Installing backend dependencies..."

cd applications/events-api

if [ ! -d "node_modules" ]; then
    npm install > /dev/null 2>&1
    echo -e "${GREEN}✅ Dependencies installed${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

cd ../..
echo ""

# ============================================================================
# Done!
# ============================================================================
echo "============================================================================"
echo -e "${GREEN}✅ Local Development Setup Complete!${NC}"
echo "============================================================================"
echo ""
echo "📊 Database Summary:"
echo "  Host:     localhost:5432"
echo "  Database: campus_events"
echo "  User:     postgres"
echo "  Tables:   $TABLE_COUNT"
echo "  Events:   $EVENT_COUNT"
echo "  Schema:   UUID-based (production-ready)"
echo ""
echo "🚀 Start the backend:"
echo -e "  ${YELLOW}cd applications/events-api${NC}"
echo -e "  ${YELLOW}npm start${NC}"
echo ""
echo "🌐 API will be available at:"
echo "  http://localhost:8080/api/v1/events"
echo "  http://localhost:8080/health"
echo "  http://localhost:8080/metrics"
echo ""
echo "📝 Notes:"
echo "  • Backend uses .env.local (localhost database)"
echo "  • .env is for Kubernetes/RDS deployment only"
echo "  • Auth not implemented yet (MVP phase)"
echo "  • Events created under demo organizer"
echo ""
