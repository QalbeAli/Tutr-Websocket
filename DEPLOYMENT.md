# WebSocket Server Deployment Guide

## Quick Deploy Options

### 1. Railway (Recommended - Easiest)

1. Go to [railway.app](https://railway.app)
2. Connect your GitHub account
3. Create new project from GitHub
4. Select the `websocket-server` folder
5. Add environment variables:
   - `PORT` (Railway sets this automatically)
   - `NODE_ENV=production`
   - `ALLOWED_ORIGINS=https://your-domain.vercel.app`
6. Deploy!

### 2. Render

1. Go to [render.com](https://render.com)
2. Create new Web Service
3. Connect your GitHub repo
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add environment variables
7. Deploy!

### 3. DigitalOcean App Platform

1. Go to [digitalocean.com](https://digitalocean.com)
2. Create new App
3. Connect your GitHub repo
4. Select Node.js environment
5. Set build and run commands
6. Add environment variables
7. Deploy!

## Environment Variables for Production

```env
NODE_ENV=production
ALLOWED_ORIGINS=https://your-domain.vercel.app,https://another-domain.com
```

## After Deployment

1. **Get your WebSocket server URL** (e.g., `wss://your-app.railway.app`)
2. **Update your Next.js app** with the new WebSocket URL:
   ```env
   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app.railway.app
   ```
3. **Deploy your Next.js app** to Vercel
4. **Test the connection** between both services

## Testing Deployment

1. **Health Check:** Visit `https://your-app.railway.app/health`
2. **WebSocket Connection:** Check browser console for connection logs
3. **Real-time Features:** Test notifications and status updates

## Troubleshooting

- **CORS Issues:** Check `ALLOWED_ORIGINS` environment variable
- **Connection Failed:** Verify WebSocket URL in Next.js app
- **Port Issues:** Most platforms set PORT automatically
