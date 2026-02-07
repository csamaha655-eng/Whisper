# Whisper Server

Multiplayer backend server for Neon Whisper game.

## Environment Variables

- `PORT` - Server port (default: 3001)
- `CLIENT_URL` - Frontend URL for CORS (default: *)
- `NODE_ENV` - Environment (production/development)

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm install
npm run build
npm start
```

## Railway Deployment

The server is configured to work with Railway out of the box:
- Binds to `0.0.0.0` for Railway's networking
- Uses `PORT` environment variable from Railway
- Supports WebSocket connections
- CORS configured via `CLIENT_URL` environment variable
