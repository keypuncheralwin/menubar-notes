import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ThemeProvider } from './components/ThemeProvider';
import { ScreenProvider } from './components/ScreenContext';
import { EditorProvider } from './components/EditorContext';

import './styles/base.css';
import './styles/layout.css';
import './styles/utils.css';
import './styles/editor.css';
import './styles/toolbar.css';
import './styles/settings.css';
import './styles/animations.css';
import './styles/screens.css'; // We'll need to add this new CSS file

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ScreenProvider>
        <EditorProvider>
          <App />
        </EditorProvider>
      </ScreenProvider>
    </ThemeProvider>
  </React.StrictMode>
);