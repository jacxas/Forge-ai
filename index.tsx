import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

console.log("Forge AI: Iniciando aplicación...");

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("Forge AI: No se encontró el elemento #root");
} else {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}