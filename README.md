# Medi-Queue

Medi-Queue is a doctor-patient queue and consultation platform with a Node/Express backend and a Vite/React frontend.

## Deploying on Render

This repository can be deployed as a single backend web service that also serves the built frontend.

Recommended setup for a single Render service:

1. Point the Render service root directory to `Backend`.
2. Use `npm i` as the build command.
3. Use `npm start` as the start command.
4. Set these environment variables in Render:
   - `MONGO_URL`
   - `JWT_SECRET`
   - `IMAGEKIT_PUBLIC_KEY`
   - `IMAGEKIT_PRIVATE_KEY`
   - `IMAGEKIT_URL_ENDPOINT`
   - `SUPPORT_EMAIL`
   - `SUPPORT_APP_PASSWORD`
   - `FRONTEND_URL` for a single frontend origin, or `FRONTEND_URLS` for multiple origins

The backend serves the Vite production build from `Frontend/dist` when it exists, and falls back to `Backend/public` if needed.

## Local Development

Backend:

```bash
cd Backend
npm install
npm run dev
```

Frontend:

```bash
cd Frontend
npm install
npm run dev
```

## Security Notes

- Keep `Backend/.env` out of git.
- Use `Backend/.env.example` as the shared template.
- Rotate any secrets that were previously committed or shared.
