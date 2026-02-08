# Heatstrike

An interactive stock options heatmap. Visualize volume, open interest, price, spread, and greeks for any ticker.

## What It Does

Displays a 2D heatmap of options chain data — strikes on one axis, expiration dates on the other, color intensity driven by a user-selected metric. Users pick a ticker, toggle calls/puts, and choose from 10+ metrics (e.g. volume, open interest, price, spread, delta, gamma, theta, vega, rho, phi). Clicking a cell links out to the corresponding Nasdaq options contract page.

## Architecture

**Frontend** — React 19 + TypeScript SPA built with Vite. Uses [TanStack Router](https://tanstack.com/router) for deep linking, [@visx](https://airbnb.io/visx/) for the heatmap visualization, [shadcn/ui](https://ui.shadcn.com/) for UI primitives, Tailwind CSS for styling, and [TanStack Query](https://tanstack.com/query/latest) for data fetching. The API client is auto-generated with [HeyAPI](https://heyapi.dev/) from the backend's OpenAPI spec. Hosted on GitHub Pages.

**Backend** — [Hono](https://hono.dev/) app running on AWS Lambda behind API Gateway. Fetches options and quote data from the [Tradier API](https://tradier.com/), caches responses in DynamoDB. A scheduled Lambda refreshes the valid ticker list daily from [OCC](https://www.theocc.com/) and stores it in S3. Infrastructure is managed with [Serverless Framework](https://www.serverless.com/).

## Running Locally

```sh
# Frontend
cd frontend && npm install && npm run dev

# Backend
cd backend && npm install && npx serverless offline
```

The backend requires AWS credentials and a Tradier API key configured in SSM Parameter Store.
