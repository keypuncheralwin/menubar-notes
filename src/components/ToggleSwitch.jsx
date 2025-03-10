import React from 'react';

/**
 * Reusable Toggle Switch Component
 * 
 * @param {Object} props
 * @param {boolean} props.isChecked - Current state of the toggle
 * @param {function} props.onToggle - Function to call when toggle is changed
 * @param {string} props.label - Label text for the toggle
 * @param {React.ReactNode} props.iconOn - Icon to show when toggle is on (optional)
 * @param {React.ReactNode} props.iconOff - Icon to show when toggle is off (optional)
 */
const ToggleSwitch = ({ isChecked, onToggle, label, iconOn, iconOff }) => {
  return (
    <div className="toggle-label-container">
      <span className="toggle-text">{label}</span>
      
      <label className="switch">
        <input 
          type="checkbox" 
          checked={isChecked}
          onChange={onToggle}
        />
        <span className="slider round">
          {iconOn && (
            <span className="toggle-icon dark">
              {iconOn}
            </span>
          )}
          {iconOff && (
            <span className="toggle-icon light">
              {iconOff}
            </span>
          )}
        </span>
      </label>
    </div>
  );
};

export default ToggleSwitch;