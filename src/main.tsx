import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { bootSettings } from './ui/store';
import './ui/theme.css';
import './ui/app.css';

bootSettings();

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('missing #root element');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
