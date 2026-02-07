import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { client } from '@/lib/api/generated/client.gen';
import './index.css';
import App from './App.tsx';

// Configure API client once before the app renders
client.setConfig({ baseUrl: import.meta.env.VITE_API_URL });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
