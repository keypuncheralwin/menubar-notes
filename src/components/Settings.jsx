import React, { useEffect } from 'react';
import { ArrowLeft } from 'react-feather';

function Settings({ onBack }) {
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
        {/* Settings options will go here */}
        <div className="settings-section">
          <h3>Appearance</h3>
          <div className="settings-option">
            <label>
              <input type="checkbox" /> Dark mode
            </label>
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