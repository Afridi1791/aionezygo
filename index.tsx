import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/App';
import './src/styles/index.css';

// Use default monaco asset handling via Vite bundling to keep COEP intact

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Remove StrictMode to prevent double-rendering issues during scaffolding
root.render(<App />);
