import React, { createContext, useContext, useState, useCallback, useRef } from 'react';

// Create context for editor state management
export const EditorContext = createContext();

export const EditorProvider = ({ children }) => {
  const [markdown, setMarkdown] = useState('');
  const [editorError, setEditorError] = useState(null);
  const [lastSaved, setLastSaved] = useState(null);
  
  // Ref to track if editor has been initialized
  const editorInitialized = useRef(false);
  
  // Quill instance reference
  const quillInstanceRef = useRef(null);

  // Function to clear the editor content
  const handleClearEditor = useCallback(async () => {
    const confirmClear = window.confirm('Are you sure you want to clear this note?');
    
    if (confirmClear) {
      console.log('EditorContext: Clearing editor content');
      setMarkdown('');
      
      if (window.electronAPI) {
        try {
          console.log('EditorContext: Saving empty note');
          const result = await window.electronAPI.saveNote('');
          
          if (result) {
            const timeString = new Date().toLocaleTimeString();
            setLastSaved(timeString);
            console.log('EditorContext: Empty note saved at', timeString);
          } else {
            setEditorError('Failed to clear note');
          }
        } catch (err) {
          console.error('EditorContext: Error saving empty note:', err);
          setEditorError(`Error clearing note: ${err.message}`);
        }
      }
    }
  }, []);
  
  // Function to load saved notes
  const loadNotes = useCallback(async () => {
    try {
      console.log('EditorContext: Attempting to load notes');
      if (window.electronAPI) {
        const savedNotes = await window.electronAPI.loadNote();
        console.log('EditorContext: Notes loaded from storage:', savedNotes ? `Content found (${savedNotes.length} chars)` : 'No content');
        
        if (savedNotes) {
          setMarkdown(savedNotes);
          setLastSaved(new Date().toLocaleTimeString());
        }
        return true;
      } else {
        console.warn('EditorContext: electronAPI not available, cannot load notes');
        setEditorError('electron API not available - notes cannot be saved');
        return false;
      }
    } catch (err) {
      console.error('EditorContext: Error loading notes:', err);
      setEditorError(`Error loading notes: ${err.message}`);
      return false;
    }
  }, []);

  // Provide a way to set the Quill instance reference
  const setQuillInstance = useCallback((instance) => {
    quillInstanceRef.current = instance;
    editorInitialized.current = true;
  }, []);

  // Helper to check if the editor content is empty
  const isEditorEmpty = useCallback((content) => {
    if (!content) return true;
    const trimmed = content.trim();
    return (
      trimmed === '' || 
      trimmed === '<p><br></p>' || 
      trimmed === '<p></p>' ||
      trimmed === '<br>' ||
      trimmed === '<p><br/></p>'
    );
  }, []);

  return (
    <EditorContext.Provider value={{
      markdown,
      setMarkdown,
      editorError,
      lastSaved,
      setLastSaved,
      editorInitialized: editorInitialized.current,
      quillInstance: quillInstanceRef.current,
      setQuillInstance,
      handleClearEditor,
      loadNotes,
      setEditorError,
      isEditorEmpty,
    }}>
      {children}
    </EditorContext.Provider>
  );
};

// Custom hook for easier context usage
export const useEditor = () => useContext(EditorContext);
