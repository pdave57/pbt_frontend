# Personal Budget Tracker

React frontend for the Personal Budget Tracker API.

## Run locally

Use Node.js 20.19+ or 22.12+, then install the locked dependencies and start Vite:

```sh
npm ci
npm run dev
```

The checked-in `.env` sets `VITE_API_URL` to `https://personal-budget-tracker-jkjq.onrender.com`. During development, Vite proxies `/api` and `/health` through that URL so the browser does not need cross-origin access. Set `VITE_API_URL` to a different API origin when using another backend. The backend's interactive API documentation is available at `https://personal-budget-tracker-jkjq.onrender.com/docs`.

Production frontend deployments call `VITE_API_URL` directly, so the backend must allow the frontend's origin in its CORS configuration.

The client uses the backend's `/api/v1/auth`, `/categories`, `/transactions`, `/budgets`, `/reports`, and `/ml` routes. Wallets are an intentionally local-only feature because the backend does not currently expose wallet endpoints. Wallet details are stored in the browser's local storage; do not enter full bank or card numbers.

## Checks

```sh
npm run lint
npm run build
```
