import React, { createContext, useContext, useState } from 'react';

// Create context for screen management
export const ScreenContext = createContext();

// Available screens in the application
export const SCREENS = {
  EDITOR: 'editor',
  SETTINGS: 'settings',
  // Future screens
  // NOTES_LIST: 'notes-list',
  // SIGN_IN: 'sign-in',
};

export const ScreenProvider = ({ children }) => {
  // Current active screen
  const [activeScreen, setActiveScreen] = useState(SCREENS.EDITOR);
  
  // Simple navigation function
  const navigateTo = (screen) => {
    if (screen === activeScreen) return;
    setActiveScreen(screen);
  };
  
  return (
    <ScreenContext.Provider value={{ 
      activeScreen,
      navigateTo,
      SCREENS
    }}>
      {children}
    </ScreenContext.Provider>
  );
};

// Custom hook for easier context usage
export const useScreen = () => useContext(ScreenContext);