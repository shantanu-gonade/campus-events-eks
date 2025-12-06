# Local Development Setup Guide

## Overview
This guide helps you run the Campus Events application locally for development and testing.

## Prerequisites
- Node.js 20+
- PostgreSQL 16+
- AWS CLI (for production deployment)
- kubectl (for production deployment)

## Quick Start (3 Options)

### Option 1: Frontend Only (Mock Data)
If you just want to test the UI without backend:

```bash
cd /Users/shantanugonade/Developement/project/applications/frontend
npm run dev
```

**Note:** API calls will fail (404), but you can still see the UI layout and navigation.

### Option 2: Frontend + Backend (Full Stack)

#### Step 1: Start PostgreSQL
Make sure PostgreSQL is running with the campus_events database.

#### Step 2: Initialize Database
```bash
cd /Users/shantanugonade/Developement/project
psql -U postgres -d campus_events < docs/DATABASE_SCHEMA.sql
```

#### Step 3: Start Backend
```bash
cd /Users/shantanugonade/Developement/project
chmod +x scripts/start-backend-local.sh
./scripts/start-backend-local.sh
```

Backend will start on http://localhost:8080

#### Step 4: Start Frontend
```bash
cd /Users/shantanugonade/Developement/project/applications/frontend
npm run dev
```

Frontend will start on http://localhost:5173

### Option 3: Use Deployed Backend
Point your local frontend to the deployed backend on EKS:

1. Get ALB URL from Kubernetes:
```bash
kubectl get ingress campus-events-ingress -n campus-events -o jsonpath='{.status.loadBalancer.ingress[0].hostname}'
```

2. Update `.env.development`:
```
VITE_API_URL=http://<ALB-URL>
VITE_WS_URL=http://<ALB-URL>
```

3. Start frontend:
```bash
npm run dev
```

## Environment Configuration

### Frontend Environment Files

**.env.development** (for local dev with local backend):
```
VITE_API_URL=http://localhost:8080
VITE_WS_URL=http://localhost:8080
VITE_ENV=development
```

**.env.development.remote** (for local dev with deployed backend):
```
VITE_API_URL=http://<ALB-URL>
VITE_WS_URL=http://<ALB-URL>
VITE_ENV=development
```

**.env.production** (for production build):
```
VITE_API_URL=
VITE_WS_URL=
VITE_ENV=production
```

### Backend Environment File

**.env** (create from .env.example):
```
NODE_ENV=development
PORT=8080
DB_HOST=localhost
DB_PORT=5432
DB_NAME=campus_events
DB_USER=postgres
DB_PASSWORD=your_password
DB_SSL=false
CORS_ORIGIN=http://localhost:5173
```

## Testing the Application

### 1. Homepage
- Open http://localhost:5173
- Should see hero section, stats, and featured events
- No console errors

### 2. Events Page
- Click "Browse All Events" or navigate to /events
- Should see list of events (if any exist in database)
- Can filter and search events

### 3. Create Event
- Click "Create Event"
- Fill in the form:
  - Title: "Test Event"
  - Description: "This is a test event"
  - Start Time: Select future date/time
  - End Time: Select future date/time after start
  - Location: "Engineering Building"
  - Category: Select from dropdown
  - Max Attendees: 50
- Click "Create Event"
- Should redirect to event detail page

### 4. Event Details
- Click on any event card
- Should see full event details
- Can click "RSVP Now"
- Fill in RSVP form and submit
- Should see success message

### 5. Admin Dashboard
- Navigate to /admin
- Should see statistics cards
- Should see charts (if data exists)
- No console errors

## Troubleshooting

### Issue: API Returns 404
**Cause:** Backend is not running or VITE_API_URL is wrong

**Solution:**
1. Check backend is running on port 8080
2. Check .env.development has correct URL
3. Restart frontend: Ctrl+C then `npm run dev`

### Issue: Database Connection Error
**Cause:** PostgreSQL not running or wrong credentials

**Solution:**
1. Start PostgreSQL: `pg_ctl start` or `brew services start postgresql`
2. Check .env has correct DB credentials
3. Test connection: `psql -U postgres -d campus_events`

### Issue: WebSocket Connection Errors (Normal)
**Cause:** Backend WebSocket not implemented yet (Day 3 task)

**Solution:** 
- These warnings are normal for Week 5 Day 1-2
- WebSocket will be implemented in Day 3
- App works fine without WebSocket for now

### Issue: Grid Warnings from Material-UI
**Cause:** Using old Grid component

**Solution:** Already fixed - using Grid2 now

### Issue: Empty Events List
**Cause:** No events in database

**Solution:**
1. Create events through UI (Create Event page)
2. Or insert test data:
```sql
INSERT INTO events (title, description, start_time, end_time, location, category, max_attendees, organizer_id)
VALUES 
('Test Event', 'This is a test', NOW() + INTERVAL '1 day', NOW() + INTERVAL '1 day 2 hours', 'Campus Center', 'Academic', 50, 1);
```

## Development Workflow

### Making Changes

1. **Frontend Changes:**
   - Edit files in `applications/frontend/src/`
   - Vite will hot-reload automatically
   - Check browser console for errors

2. **Backend Changes:**
   - Edit files in `applications/events-api/src/`
   - Restart server (Ctrl+C then `npm start`)
   - Check terminal for errors

3. **Testing Changes:**
   - Test in browser at http://localhost:5173
   - Check both browser console and terminal for errors
   - Test all affected functionality

### Before Committing

1. **Build Test:**
```bash
cd applications/frontend
npm run build
```

2. **Check for Errors:**
   - No build errors
   - No TypeScript errors
   - No ESLint warnings (if using)

3. **Test Core Functionality:**
   - Can view events
   - Can create events
   - Can submit RSVP
   - Admin dashboard loads

## Production Deployment

Once local testing is complete:

1. **Build and Deploy:**
```bash
cd /Users/shantanugonade/Developement/project
chmod +x scripts/complete-deployment.sh
./scripts/complete-deployment.sh
```

2. **Update Kubernetes Deployments:**
Use Kubernetes MCP as shown in script output

3. **Verify Production:**
- Get ALB URL
- Test all functionality
- Check pod logs for errors

## Useful Commands

### Frontend
```bash
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build
```

### Backend
```bash
npm start            # Start server
npm run dev          # Start with nodemon (if configured)
npm test             # Run tests (if configured)
```

### Database
```bash
psql -U postgres -d campus_events              # Connect to database
psql -U postgres -d campus_events -f schema.sql  # Run schema
psql -U postgres -d campus_events -c "SELECT * FROM events;"  # Query events
```

### Docker
```bash
docker ps                    # List running containers
docker logs <container-id>   # View container logs
docker exec -it <container-id> sh  # Shell into container
```

### Kubernetes
```bash
kubectl get pods -n campus-events        # List pods
kubectl logs <pod-name> -n campus-events # View pod logs
kubectl describe pod <pod-name> -n campus-events  # Pod details
```

## Next Steps

After completing local development and testing:

1. ✅ Complete Week 5 Day 1-2 (Current)
2. 🚧 Week 5 Day 3: Backend Enhancements
   - WebSocket server implementation
   - UPDATE/DELETE endpoints
   - OpenAPI documentation
3. 🚧 Week 5 Day 4: Innovation Features
   - Grafana dashboards
   - Event recommendations
   - Performance optimizations
4. 🚧 Week 5 Day 5: Documentation & Presentation
   - Architecture diagrams
   - User guides
   - Presentation deck

## Getting Help

- Check browser console for frontend errors
- Check terminal for backend errors
- Review logs in `applications/events-api/logs/`
- Check Kubernetes pod logs for production issues

---

**Happy Coding!** 🚀
