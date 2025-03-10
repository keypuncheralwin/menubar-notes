import React, { useState, useEffect } from 'react';
import { ArrowLeft, Sun, Moon, Lock, Unlock, Move, Maximize, Minimize, CornerRightDown } from 'react-feather';
import { useTheme } from './ThemeProvider';
import ToggleSwitch from './ToggleSwitch';
import { useScreen, SCREENS } from './ScreenContext';

function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { navigateTo } = useScreen();
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
  
  // State to track button fade animations
  const [positionFeedback, setPositionFeedback] = useState(false);
  const [sizeFeedback, setSizeFeedback] = useState(false);
  
  // Handle reset position button with animation feedback
  const handleResetPosition = async () => {
    if (window.electronAPI) {
      try {
        // Provide visual feedback
        setPositionFeedback(true);
        
        // Reset after a short delay
        setTimeout(() => {
          setPositionFeedback(false);
        }, 500);
        
        await window.electronAPI.resetWindowPosition();
      } catch (error) {
        console.error('Error resetting window position:', error);
        setPositionFeedback(false);
      }
    }
  };
  
  // Handle reset size button with animation feedback
  const handleResetSize = async () => {
    if (window.electronAPI) {
      try {
        // Provide visual feedback
        setSizeFeedback(true);
        
        // Reset after a short delay
        setTimeout(() => {
          setSizeFeedback(false);
        }, 500);
        
        await window.electronAPI.resetWindowSize();
      } catch (error) {
        console.error('Error resetting window size:', error);
        setSizeFeedback(false);
      }
    }
  };
  
  return (
    <div className="settings-container fade-in">
      <div className="settings-header">
        <button 
          className="back-button" 
          onClick={() => navigateTo(SCREENS.EDITOR)} 
          title="Back to notes"
        >
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
          
          {/* Reset buttons section - show when either draggable or resizable is enabled */}
          {(isDraggable || isResizable) && (
            <div className="settings-option reset-buttons-container">
              <div className="reset-buttons-row">
                {isDraggable && (
                  <button 
                    onClick={handleResetPosition}
                    className={`reset-button ${positionFeedback ? 'button-feedback' : ''}`}
                    disabled={positionFeedback}
                  >
                    <CornerRightDown size={14} />
                    <span>{positionFeedback ? 'Position reset!' : 'Reset position'}</span>
                  </button>
                )}
                
                {isResizable && (
                  <button 
                    onClick={handleResetSize}
                    className={`reset-button ${sizeFeedback ? 'button-feedback' : ''}`}
                    disabled={sizeFeedback}
                  >
                    <Minimize size={14} />
                    <span>{sizeFeedback ? 'Size reset!' : 'Reset size'}</span>
                  </button>
                )}
              </div>
            </div>
          )}
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