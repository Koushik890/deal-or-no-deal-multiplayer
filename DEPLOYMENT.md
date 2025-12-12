# Deployment (Vercel + Render)

This repo is split into:
- `frontend/` (Next.js) → deploy to **Vercel**
- `backend/` (Express + Socket.io) → deploy to a **persistent Node server** (recommended: **Render Web Service**)

> Vercel serverless is not a good fit for long‑lived Socket.io/WebSocket connections. Keep Socket.io on Render/Fly/Railway/etc.

## 1) Deploy Backend (Render Web Service)

### Create the service
1. In Render, create a **Web Service**
2. Set **Root Directory** to `backend`
3. Set:
   - **Build Command**: `npm ci && npm run build`
   - **Start Command**: `npm start`

### Environment variables
Set:
- `CORS_ORIGINS`: Comma-separated allowed frontend origins (supports `*` wildcards)
  - Example (Vercel prod + custom domain):
    - `CORS_ORIGINS=https://yourapp.vercel.app,https://yourdomain.com`
  - Optional (allow all Vercel preview deploys):
    - `CORS_ORIGINS=https://*.vercel.app,https://yourdomain.com`
- Optional TTLs (see `backend/.env.example`):
  - `ROOM_CLEANUP_INTERVAL_MS`
  - `ROOM_WAITING_TTL_MS`
  - `ROOM_SELECTION_TTL_MS`
  - `ROOM_FINISHED_TTL_MS`

### Verify
After deploy:
- Check health: `GET /health`

## 2) Deploy Frontend (Vercel)

### Project setup
1. Import the repo into Vercel
2. Set **Root Directory** to `frontend`

### Environment variables
Set:
- `NEXT_PUBLIC_SOCKET_URL`: your backend base URL (Render service URL)
  - Example: `https://your-backend.onrender.com`

## 3) Production notes / limitations

Current backend storage is **in-memory**:
- Rooms and the “global leaderboard” reset if the backend restarts
- Horizontal scaling (multiple backend instances) will not share room state

For “real” production (multi-instance + persistence), you’d typically add:
- Redis (Socket.io adapter + shared state) and/or a database
- Auth/session signing (so `playerId` cannot be spoofed)
- Rate limiting and abuse protection for socket events


