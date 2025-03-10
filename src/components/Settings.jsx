import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Lock, Unlock } from 'react-feather';
import { useTheme } from './ThemeProvider';
import ToggleSwitch from './ToggleSwitch';

function Settings({ onBack }) {
  const { theme, toggleTheme } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  
  // Load sticky preference when component mounts
  useEffect(() => {
    const loadStickyPreference = async () => {
      if (window.electronAPI) {
        try {
          const stickyPreference = await window.electronAPI.getStickyPreference();
          setIsSticky(stickyPreference);
        } catch (error) {
          console.error('Error loading sticky preference:', error);
        }
      }
    };
    
    loadStickyPreference();
  }, []);
  
  // Handle toggle of sticky window option
  const handleStickyToggle = async () => {
    const newStickyState = !isSticky;
    setIsSticky(newStickyState);
    
    if (window.electronAPI) {
      try {
        // Save preference
        await window.electronAPI.saveStickyPreference(newStickyState);
        // Apply the setting immediately
        await window.electronAPI.setAlwaysOnTop(newStickyState);
      } catch (error) {
        console.error('Error saving sticky preference:', error);
      }
    }
  };
  
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
            <ToggleSwitch 
              isChecked={theme === 'dark'}
              onToggle={toggleTheme}
              label="Dark mode"
              iconOn={<Moon size={14} />}
              iconOff={<Sun size={14} />}
            />
          </div>
        </div>
        
        {/* Window behavior section with sticky toggle */}
        <div className="settings-section">
          <h3>Window Behavior</h3>
          <div className="settings-option sticky-toggle">
            <ToggleSwitch 
              isChecked={isSticky}
              onToggle={handleStickyToggle}
              label="Sticky window (always on top)"
              iconOn={<Lock size={14} />}
              iconOff={<Unlock size={14} />}
            />
          </div>
        </div>
        
        {/* Editor section */}
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