import React, { createContext, useState, useEffect, useContext } from 'react';

// Create context for theme management
export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  // Initialize theme state, defaulting to dark
  const [theme, setTheme] = useState('dark');
  
  // Load theme preference from electron-store when component mounts
  useEffect(() => {
    const loadThemePreference = async () => {
      if (window.electronAPI) {
        try {
          const savedTheme = await window.electronAPI.getTheme();
          if (savedTheme) {
            setTheme(savedTheme);
            applyTheme(savedTheme);
          } else {
            // If no saved theme, default to dark
            setTheme('dark');
            applyTheme('dark');
          }
        } catch (error) {
          console.error('Error loading theme preference:', error);
          // Default to dark on error
          setTheme('dark');
          applyTheme('dark');
        }
      } else {
        // If electronAPI is not available, default to dark
        setTheme('dark');
        applyTheme('dark');
      }
    };
    
    loadThemePreference();
  }, []);
  
  // Function to toggle theme
  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme);
    
    // Save preference to electron-store
    if (window.electronAPI) {
      try {
        await window.electronAPI.saveTheme(newTheme);
      } catch (error) {
        console.error('Error saving theme preference:', error);
      }
    }
  };
  
  // Function to apply theme to document
  const applyTheme = (themeValue) => {
    if (themeValue === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  };
  
  // Return context provider with theme state and toggle function
  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook for easier theme access
export const useTheme = () => useContext(ThemeContext);