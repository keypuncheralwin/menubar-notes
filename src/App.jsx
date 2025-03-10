import React, { useEffect, useState } from 'react';
import Editor from './components/Editor';
import Settings from './components/Settings';
import { Trash2, Settings as SettingsIcon } from 'react-feather'; 
import { useScreen, SCREENS } from './components/ScreenContext';
import { useEditor } from './components/EditorContext';

function App() {
  const { activeScreen, navigateTo } = useScreen();
  const { 
    markdown, 
    editorError, 
    lastSaved, 
    handleClearEditor, 
    loadNotes, 
    setEditorError,
    isEditorEmpty,
    quillInstance,
  } = useEditor();
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load saved notes when the app starts
    const initializeApp = async () => {
      await loadNotes();
      setIsLoading(false);
    };
    
    initializeApp();
  }, [loadNotes]);

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
  const hasContent = quillInstance && !isEditorEmpty(quillInstance.getText());

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
      
      {/* Simplified screen container */}
      <div className="screens-container">
        {/* Editor Screen - now simpler */}
        <div 
          className={`screen ${activeScreen === SCREENS.EDITOR ? 'active' : ''}`}
          id="editor-screen"
        >
          <div className="editor-container">
            <Editor />
          </div>
        </div>
        
        {/* Settings Screen - now simpler */}
        <div 
          className={`screen ${activeScreen === SCREENS.SETTINGS ? 'active' : ''}`}
          id="settings-screen"
        >
          <Settings />
        </div>
      </div>
      
      <div className="app-footer">
        <div className="footer-actions">
          {/* Show clear button if there's content and in editor screen */}
          {activeScreen === SCREENS.EDITOR && hasContent && (
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
            {activeScreen === SCREENS.EDITOR && lastSaved && `Last saved: ${lastSaved}`}
          </div>
          
          {/* Settings/Back button */}
          <button 
            className="settings-button" 
            onClick={() => navigateTo(activeScreen === SCREENS.SETTINGS ? SCREENS.EDITOR : SCREENS.SETTINGS)}
            title={activeScreen === SCREENS.SETTINGS ? "Back to notes" : "Settings"}
          >
            <SettingsIcon size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;