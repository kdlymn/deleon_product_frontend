# Product Management - React frontend

Login -> Product list -> Add / Edit / Delete -> Logout. Talks only to the LavaLust API (never to the database).

## Run locally
```
npm install
cp .env.example .env     # set VITE_API_URL to your API (local or Render)
npm run dev              # http://localhost:5173
```
If the API runs locally, set `ALLOWED_ORIGIN=http://localhost:5173` in the API `.env`.

## Deploy (Render Static Site)
- Build command: `npm install && npm run build`
- Publish directory: `dist`
- Environment variable: `VITE_API_URL=https://<your-api>.onrender.com`
Then put the static site's URL in the API's `ALLOWED_ORIGIN`.

## How auth works
`api.js` stores the access + refresh tokens, adds `Authorization: Bearer ...` to each request, and when the 15-minute
access token expires it calls `/api/refresh` once and retries automatically.
