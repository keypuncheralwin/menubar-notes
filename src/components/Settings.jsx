import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Lock, Unlock, Move, Maximize, Minimize, CornerRightDown } from 'react-feather';
import { useTheme } from './ThemeProvider';
import ToggleSwitch from './ToggleSwitch';

function Settings({ onBack }) {
  const { theme, toggleTheme } = useTheme();
  const [isSticky, setIsSticky] = useState(false);
  const [isDraggable, setIsDraggable] = useState(false);
  const [isResizable, setIsResizable] = useState(false);
  
  // Load preferences when component mounts
  useEffect(() => {
    const loadPreferences = async () => {
      if (window.electronAPI) {
        try {
          // Load sticky preference
          const stickyPreference = await window.electronAPI.getStickyPreference();
          setIsSticky(stickyPreference);
          
          // Load draggable preference
          const draggablePreference = await window.electronAPI.getDraggablePreference();
          setIsDraggable(draggablePreference);
          
          // Load resizable preference
          const resizablePreference = await window.electronAPI.getResizablePreference();
          setIsResizable(resizablePreference);
        } catch (error) {
          console.error('Error loading preferences:', error);
        }
      }
    };
    
    loadPreferences();
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
  
  // Handle toggle of draggable window option
  const handleDraggableToggle = async () => {
    const newDraggableState = !isDraggable;
    setIsDraggable(newDraggableState);
    
    if (window.electronAPI) {
      try {
        // Save preference
        await window.electronAPI.saveDraggablePreference(newDraggableState);
        // Apply the setting immediately
        await window.electronAPI.setDraggable(newDraggableState);
      } catch (error) {
        console.error('Error saving draggable preference:', error);
      }
    }
  };
  
  // Handle toggle of resizable window option
  const handleResizableToggle = async () => {
    const newResizableState = !isResizable;
    setIsResizable(newResizableState);
    
    if (window.electronAPI) {
      try {
        // Save preference
        await window.electronAPI.saveResizablePreference(newResizableState);
        // Apply the setting immediately
        await window.electronAPI.setResizable(newResizableState);
      } catch (error) {
        console.error('Error saving resizable preference:', error);
      }
    }
  };
  
  // Handle reset position button
  const handleResetPosition = async () => {
    if (window.electronAPI) {
      try {
        await window.electronAPI.resetWindowPosition();
      } catch (error) {
        console.error('Error resetting window position:', error);
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
        
        {/* Window behavior section with multiple toggles */}
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
          <div className="settings-option draggable-toggle">
            <ToggleSwitch 
              isChecked={isDraggable}
              onToggle={handleDraggableToggle}
              label="Draggable window"
              iconOn={<Move size={14} />}
              iconOff={<Move size={14} />}
            />
          </div>
          <div className="settings-option resizable-toggle">
            <ToggleSwitch 
              isChecked={isResizable}
              onToggle={handleResizableToggle}
              label="Resizable window"
              iconOn={<Maximize size={14} />}
              iconOff={<Minimize size={14} />}
            />
          </div>
          
          {/* Reset window position button - only show if draggable is enabled */}
          {isDraggable && (
            <div className="settings-option reset-position">
              <button 
                onClick={handleResetPosition}
                className="reset-position-button"
              >
                <CornerRightDown size={14} />
                <span>Reset window position</span>
              </button>
            </div>
          )}
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