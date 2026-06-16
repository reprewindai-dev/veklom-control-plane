# Standalone Frontend Deployment

This repository (`veklom-control-plane`) is now configured to be deployed as a **Standalone Next.js App** (Decoupled architecture).

## Coolify Setup
To deploy this on Coolify:
1. Create a new application pointing to the `veklom-control-plane` repository.
2. Select **Nixpacks** or **Docker** buildpack (Nixpacks will auto-detect Next.js).
3. Set the domain to your desired frontend URL (e.g. `veklom.com`).

## Environment Variables
You MUST provide the `NEXT_PUBLIC_API_BASE_URL` in Coolify so the frontend knows how to talk to the decoupled Python backend.

```env
# The absolute URL of the Python backend
NEXT_PUBLIC_API_BASE_URL=https://api.veklom.com
```

## Internal API Proxies
To avoid CORS issues, `next.config.mjs` is configured to rewrite `/api/*` to `https://api.veklom.com/api/*`. This means the client-side code can simply `fetch('/api/v1/auth/me')` and Next.js will proxy it to the backend securely.
