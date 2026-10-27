# Personal Budget Tracker

React frontend for the Personal Budget Tracker API.

## Run locally

Use Node.js 20.19+ or 22.12+, then install the locked dependencies and start Vite:

```sh
npm ci
npm run dev
```

By default, Vite proxies `/api` and `/health` to `http://127.0.0.1:8000`. Start the backend on that address, or set `VITE_API_URL` to a different API origin. The backend's interactive API documentation is available at `http://127.0.0.1:8000/docs`.

The client uses the backend's `/api/v1/auth`, `/categories`, `/transactions`, `/budgets`, `/reports`, and `/ml` routes. Wallets are an intentionally local-only feature because the backend does not currently expose wallet endpoints. Wallet details are stored in the browser's local storage; do not enter full bank or card numbers.

## Checks

```sh
npm run lint
npm run build
```
