import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';

import './styles/base.css';
import './styles/layout.css';
import './styles/utils.css';
import './styles/editor.css';
import './styles/toolbar.css';
import './styles/settings.css';
import './styles/animations.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </React.StrictMode>
);