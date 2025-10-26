
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// This function call will register the service worker.
// The PWA plugin for Vite handles the creation of the service worker file.
registerSW({ 
  immediate: true,
  onRegistered(r) {
    console.log('SW registered: ', r);
  },
  onRegisterError(error) {
    console.log('SW registration error', error);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
