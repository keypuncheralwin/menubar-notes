import React, { useState, useEffect, useCallback, useRef } from 'react';
import Editor from './components/Editor';
import Settings from './components/Settings';
import { Trash2, Settings as SettingsIcon } from 'react-feather'; 

function App() {
  const [markdown, setMarkdown] = useState('');
  const [editorError, setEditorError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editorKey, setEditorKey] = useState(Date.now());
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Refs to track current state for transitions
  const currentViewRef = useRef('editor');

  useEffect(() => {
    // Load saved notes when the app starts
    const loadNotes = async () => {
      try {
        console.log('App: Attempting to load notes');
        if (window.electronAPI) {
          const savedNotes = await window.electronAPI.loadNote();
          console.log('App: Notes loaded from storage:', savedNotes ? `Content found (${savedNotes.length} chars)` : 'No content');
          if (savedNotes) {
            setMarkdown(savedNotes);
          }
        } else {
          console.warn('App: electronAPI not available, cannot load notes');
          setEditorError('electron API not available - notes cannot be saved');
        }
      } catch (err) {
        console.error('App: Error loading notes:', err);
        setEditorError(`Error loading notes: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadNotes();
  }, []);

  // Handle keyboard shortcuts (Escape to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (window.electronAPI && window.electronAPI.closeWindow) {
          window.electronAPI.closeWindow();
        }
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleMarkdownChange = useCallback(async (content) => {
    console.log('App: handleMarkdownChange called with content length:', content?.length || 0);
    setMarkdown(content);
    
    // Save notes when content changes
    if (window.electronAPI) {
      try {
        console.log('App: Calling saveNote...');
        const result = await window.electronAPI.saveNote(content);
        console.log('App: saveNote result:', result);
        
        if (result) {
          setLastSaved(new Date().toLocaleTimeString());
          console.log('App: Note saved successfully at', new Date().toLocaleTimeString());
        } else {
          setEditorError('Failed to save note');
        }
      } catch (err) {
        console.error('App: Error saving note:', err);
        setEditorError(`Error saving note: ${err.message}`);
      }
    } else {
      console.warn('App: electronAPI not available, cannot save notes');
    }
  }, []);

  // Function to clear the editor content
  const handleClearEditor = useCallback(async () => {
    // Confirm before clearing
    const confirmClear = window.confirm('Are you sure you want to clear this note?');
    
    if (confirmClear) {
      console.log('App: Clearing editor content');
      setMarkdown('');
      
      // Save the empty content
      if (window.electronAPI) {
        try {
          const result = await window.electronAPI.saveNote('');
          if (result) {
            setLastSaved(new Date().toLocaleTimeString());
            console.log('App: Empty note saved at', new Date().toLocaleTimeString());
          }
        } catch (err) {
          console.error('App: Error saving empty note:', err);
          setEditorError(`Error clearing note: ${err.message}`);
        }
      }
    }
  }, []);

  // Toggle settings view with smooth transition
  const toggleSettings = useCallback((show) => {
    // If show is undefined, toggle based on current state
    const newShow = show === undefined ? !showSettings : show;
    
    // Set transitioning state for animation
    setIsTransitioning(true);
    
    // Update the view after a short delay to allow animation
    setTimeout(() => {
      if (newShow === false && showSettings === true) {
        // We're going back to the editor view, force a remount
        setEditorKey(Date.now());
        currentViewRef.current = 'editor';
      } else {
        currentViewRef.current = 'settings';
      }
      setShowSettings(newShow);
      
      // Reset transitioning state
      setIsTransitioning(false);
    }, 10); // Short delay to allow CSS transitions to take effect
  }, [showSettings]);

  // Show loading screen while notes are being loaded
  if (isLoading) {
    return (
      <div className="app">
        <div className="titlebar">
          <div className="drag-region">Menu Bar Notes</div>
        </div>
        <div className="editor-loading-container">
          <div className="editor-loading">Loading notes</div>
        </div>
      </div>
    );
  }

  // Check if there's content in the editor
  const hasContent = !isEditorEmpty(markdown);

  return (
    <div className="app">
      <div className="titlebar">
        <div className="drag-region">Menu Bar Notes</div>
      </div>
      
      {editorError && (
        <div className="error-banner">
          {editorError}
          <button onClick={() => setEditorError(null)}>✕</button>
        </div>
      )}
      
      {showSettings ? (
        <Settings 
          onBack={() => toggleSettings(false)} 
          className="fade-in" 
        />
      ) : (
        <div className="editor-container fade-in">
          <Editor 
            key={editorKey}
            markdown={markdown} 
            onChange={handleMarkdownChange}
          />
        </div>
      )}
      
      <div className="app-footer">
        <div className="footer-actions">
          {/* Show clear button if there's content and not in settings */}
          {!showSettings && hasContent && (
            <button 
              className="clear-button" 
              onClick={handleClearEditor}
              title="Clear all content"
            >
              <Trash2 size={14} />
            </button>
          )}
          
          {/* Last saved information */}
          <div style={{ 
            flexGrow: 1, 
            fontSize: '11px', 
            color: '#999',
            textAlign: 'center'
          }}>
            {!showSettings && lastSaved && `Last saved: ${lastSaved}`}
          </div>
          
          {/* Settings button */}
          <button 
            className="settings-button" 
            onClick={() => toggleSettings()}
            title={showSettings ? "Back to notes" : "Settings"}
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;

const isEditorEmpty = (content) => {
  if (!content) return true;
  
  const trimmed = content.trim();
  
  // Check for common Quill "empty" patterns
  return (
    trimmed === '' || 
    trimmed === '<p><br></p>' || 
    trimmed === '<p></p>' ||
    trimmed === '<br>' ||
    trimmed === '<p><br/></p>'
  );
};