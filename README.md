# WebSocket Server

This is the standalone WebSocket server for real-time features in the meeting platform.

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Environment variables:**
   Create a `.env` file with:
   ```env
   PORT=3001
   NODE_ENV=development
   ALLOWED_ORIGINS=https://your-domain.vercel.app
   ```

## Running

- **Development:** `npm run dev`
- **Production:** `npm start`
- **Watch mode:** `npm run dev:watch` (requires nodemon)

## Features

- Real-time notifications
- Session request updates
- Tutor status updates
- User room management
- Health check endpoint
- HTTP notification emission

## API Endpoints

- `GET /health` - Health check
- `POST /emit` - Send notification via HTTP

## Socket Events

- `join` - Join user room
- `create_notification` - Create notification
- `session_request_updated` - Update session request
- `tutor_status_update` - Update tutor status
- `ping/pong` - Heartbeat

## Deployment

This server can be deployed to:

- Railway
- Render
- DigitalOcean
- AWS EC2
- Any Node.js hosting platform

## Connection

The Next.js app connects to this server via the `NEXT_PUBLIC_WEBSOCKET_URL` environment variable.
