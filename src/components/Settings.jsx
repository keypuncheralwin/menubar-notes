import React, { useEffect } from 'react';
import { ArrowLeft, Sun, Moon } from 'react-feather';
import { useTheme } from './ThemeProvider';

function Settings({ onBack }) {
  const { theme, toggleTheme } = useTheme();
  
  return (
    <div className="settings-container fade-in">
      <div className="settings-header">
        <button className="back-button" onClick={onBack} title="Back to notes">
          <ArrowLeft size={18} />
          <span>Back</span>
        </button>
        <div className="settings-title">Settings</div>
      </div>
      
      <div className="settings-content">
        {/* Appearance section with theme toggle */}
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-option theme-toggle">
            <div className="toggle-label-container">
              <span className="toggle-text">Dark mode</span>
              
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={theme === 'dark'}
                  onChange={toggleTheme}
                />
                <span className="slider round">
                  <span className="toggle-icon dark">
                    <Moon size={14} />
                  </span>
                  <span className="toggle-icon light">
                    <Sun size={14} />
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>Editor</h3>
          <div className="settings-option">
            <label>
              <input type="checkbox" defaultChecked /> Auto-save
            </label>
          </div>
          <div className="settings-option">
            <label>Font size:</label>
            <select defaultValue="medium">
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
        </div>
        
        <div className="settings-section">
          <h3>About</h3>
          <p>Menu Bar Notes v1.0.0</p>
          <p>A simple, fast note-taking app that lives in your menu bar</p>
        </div>
      </div>
    </div>
  );
}

export default Settings;