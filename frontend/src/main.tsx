import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { client } from '@/lib/api/generated/client.gen';
import { routeTree } from './routeTree.gen';
import './index.css';

// Create the router instance
const router = createRouter({
  routeTree,
  basepath: '/heatstrike/',
});

// Register the router for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

// Configure API client once before the app renders
client.setConfig({ baseUrl: import.meta.env.VITE_API_URL });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
