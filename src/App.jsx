import React, { useState, useEffect, useCallback } from 'react';
import Editor from './components/Editor';
import { Trash2 } from 'react-feather'; 

function App() {
  const [markdown, setMarkdown] = useState('');
  const [editorError, setEditorError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSaved, setLastSaved] = useState(null);

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
      
      <div className="editor-container">
        <Editor 
          markdown={markdown} 
          onChange={handleMarkdownChange}
        />
      </div>
      
      <div className="app-footer">
        <div className="footer-actions">
          {/* Show clear button if there's content */}
          {hasContent && (
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
            {lastSaved && `Last saved: ${lastSaved}`}
          </div>
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