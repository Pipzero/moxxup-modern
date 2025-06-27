import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // ← this line must match your file and export
import ProductCreator from './components/ProductCreator';
import './App.scss'; // or SCSS if you prefer
import ErrorBoundary from './ErrorBoundary';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ProductCreator />
    </ErrorBoundary>
  </React.StrictMode>
);
