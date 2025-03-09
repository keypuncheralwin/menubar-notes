import React, { useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';

// Keep a global reference to track if we've created an editor
// This helps prevent duplication even with multiple mounts
let globalQuillInstance = null;

function Editor({ markdown, onChange }) {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const contentRef = useRef(markdown || '');
  const onChangeRef = useRef(onChange);
  const [editorLoaded, setEditorLoaded] = useState(false);

  // Update the onChangeRef when the onChange prop changes
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize Quill - with extra safeguards against duplication
  useEffect(() => {
    console.log('Editor: Initialization effect running');
    
    // Skip if we already have a Quill instance attached to this component
    if (quillRef.current) {
      console.log('Editor: Quill instance already exists for this component, skipping');
      return;
    }
    
    // If there's a global instance already, attach to it instead of creating a new one
    if (globalQuillInstance && containerRef.current) {
      console.log('Editor: Reusing existing global Quill instance');
      quillRef.current = globalQuillInstance;
      setEditorLoaded(true);
      return;
    }

    // Function to create a new Quill instance with proper cleanup
    const initializeQuill = () => {
      // Ensure container is ready
      if (!containerRef.current) {
        console.log('Editor: Container not ready, cannot initialize');
        return;
      }
      
      // Remove any existing Quill instances completely
      const existingToolbars = document.querySelectorAll('.ql-toolbar');
      if (existingToolbars.length > 0) {
        console.log(`Editor: Found ${existingToolbars.length} existing toolbars, removing them`);
        existingToolbars.forEach(toolbar => toolbar.remove());
      }
      
      // Reset the container by clearing its contents
      containerRef.current.innerHTML = '';
      
      // Create a clean editor div inside our container
      const editorDiv = document.createElement('div');
      containerRef.current.appendChild(editorDiv);
      
      console.log('Editor: Creating new Quill instance');
      
      // Define custom icons for the toolbar
      const icons = Quill.import('ui/icons');
      
      // Add custom icons for copy and paste
      icons['copy'] = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
      icons['paste'] = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clipboard"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;
      
      // Create Quill instance on the fresh div
      const quill = new Quill(editorDiv, {
        theme: 'snow',
        modules: {
          toolbar: {
            container: [
              [{ 'header': [1, 2, 3, false] }],
              ['bold', 'italic'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['blockquote', 'code-block'],
              ['link', 'copy', 'paste']
            ],
            handlers: {
              'copy': function() {
                const range = quill.getSelection();
                let text;
                
                if (range && range.length > 0) {
                  // If there's a selection, get the selected text
                  text = quill.getText(range.index, range.length);
                } else {
                  // If no selection, copy the entire content
                  text = quill.getText();
                }
                
                // Use the modern Clipboard API if available
                if (navigator.clipboard && navigator.clipboard.writeText) {
                  navigator.clipboard.writeText(text)
                    .then(() => {
                      console.log('Content copied to clipboard');
                      
                      // Show visual feedback
                      const copyBtn = document.querySelector('.ql-copy');
                      if (copyBtn) {
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                        setTimeout(() => {
                          copyBtn.innerHTML = originalHTML;
                        }, 1000);
                      }
                    })
                    .catch(err => {
                      console.error('Error copying to clipboard:', err);
                      
                      // Fallback for browsers that deny clipboard permission
                      alert('Could not copy text. Please use keyboard shortcut (Ctrl/Cmd+C).');
                    });
                } else {
                  // Fallback for older browsers (should be rare in modern environments)
                  try {
                    // Create a temporary element for copying
                    const tempElement = document.createElement('textarea');
                    tempElement.value = text;
                    tempElement.setAttribute('readonly', '');
                    tempElement.style.position = 'absolute';
                    tempElement.style.left = '-9999px';
                    document.body.appendChild(tempElement);
                    
                    // Select and copy
                    tempElement.select();
                    const successful = document.execCommand('copy');
                    document.body.removeChild(tempElement);
                    
                    if (successful) {
                      console.log('Content copied using fallback method');
                      
                      // Show visual feedback
                      const copyBtn = document.querySelector('.ql-copy');
                      if (copyBtn) {
                        const originalHTML = copyBtn.innerHTML;
                        copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                        setTimeout(() => {
                          copyBtn.innerHTML = originalHTML;
                        }, 1000);
                      }
                    } else {
                      throw new Error('execCommand returned false');
                    }
                  } catch (err) {
                    console.error('Fallback copy method failed:', err);
                    alert('Could not copy text. Please use keyboard shortcut (Ctrl/Cmd+C).');
                  }
                }
              },
              'paste': function() {
                // Focus the editor
                quill.focus();
                
                try {
                  // Check if we can access the clipboard with formatting
                  if (navigator.clipboard && navigator.clipboard.read) {
                    // Try to get clipboard items which might have HTML content
                    navigator.clipboard.read()
                      .then(async clipboardItems => {
                        for (const item of clipboardItems) {
                          // Check if HTML format is available
                          if (item.types.includes('text/html')) {
                            const htmlBlob = await item.getType('text/html');
                            const html = await htmlBlob.text();
                            
                            // Get the current selection
                            const range = quill.getSelection(true);
                            
                            // If there's a selection, delete it first
                            if (range.length > 0) {
                              quill.deleteText(range.index, range.length);
                            }
                            
                            // Insert the HTML at the cursor position using Quill's clipboard
                            quill.clipboard.dangerouslyPasteHTML(range.index, html);
                            
                            contentRef.current = quill.root.innerHTML;
                            onChangeRef.current(quill.root.innerHTML);
                            // Provide success feedback
                            showPasteSuccess();
                            
                            // Handle scroll position for paste at beginning
                            ensureTopContentVisible();
                            
                            return; // Exit if we successfully pasted HTML
                          }
                        }
                        
                        // If we get here, we didn't find HTML format, try plain text
                        throw new Error('No HTML content found in clipboard');
                      })
                      .catch(err => {
                        console.error('Could not paste formatted content:', err);
                        
                        // Fall back to plain text
                        fallbackToPlainText();
                      });
                  } else {
                    // Browser doesn't support clipboard.read(), use plain text fallback
                    fallbackToPlainText();
                  }
                } catch (error) {
                  console.error('Paste failed:', error);
                  fallbackToUserInput();
                }
                
                // Function to fall back to plain text pasting
                function fallbackToPlainText() {
                  navigator.clipboard.readText()
                    .then(text => {
                      const range = quill.getSelection(true);
                      
                      if (range.length > 0) {
                        quill.deleteText(range.index, range.length);
                      }
                      
                      // Try to detect if this might be HTML
                      if (text.trim().startsWith('<') && text.includes('>')) {
                        // This might be HTML, try to paste it as HTML
                        quill.clipboard.dangerouslyPasteHTML(range.index, text);
                      } else {
                        // Just insert as plain text
                        quill.insertText(range.index, text);
                      }
                      
                      // Save the content
                      contentRef.current = quill.root.innerHTML;
                      onChangeRef.current(quill.root.innerHTML);
                      
                      showPasteSuccess();
                      
                      // Handle scroll position for paste at beginning
                      ensureTopContentVisible();
                    })
                    .catch(err => {
                      console.error('Plain text paste failed:', err);
                      fallbackToUserInput();
                    });
                }
                
                // Function to fall back to user input
                function fallbackToUserInput() {
                  // Show failure feedback
                  const pasteBtn = document.querySelector('.ql-paste');
                  if (pasteBtn) {
                    const originalHTML = pasteBtn.innerHTML;
                    pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff6666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                    setTimeout(() => {
                      pasteBtn.innerHTML = originalHTML;
                    }, 1000);
                  }
                  
                  // Ask user to use keyboard shortcut
                  alert('Please use keyboard shortcut (Ctrl/Cmd+V) to paste with formatting.');
                }
                
                // Function to show success feedback
                function showPasteSuccess() {
                  const pasteBtn = document.querySelector('.ql-paste');
                  if (pasteBtn) {
                    const originalHTML = pasteBtn.innerHTML;
                    pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => {
                      pasteBtn.innerHTML = originalHTML;
                    }, 1000);
                  }
                }
              }
            }
          }
        },
        placeholder: 'Write your notes here...',
        scrollingContainer: 'html', // This can help with scroll handling
      });
      
      // Function to ensure top content is visible
      function ensureTopContentVisible() {
        setTimeout(() => {
          // Get cursor position
          const range = quill.getSelection();
          
          // If the cursor is near the top (first few characters),
          // ensure we're scrolled to the top
          if (range && range.index < 10) {
            const editor = document.querySelector('.ql-editor');
            if (editor) {
              editor.scrollTop = 0;
            }
          }
          
          // Force editor to show enough top padding
          enforceMinimumTopPadding();
        }, 10);
      }
      
      // Function to ensure there's always enough top padding
      function enforceMinimumTopPadding() {
        const editor = document.querySelector('.ql-editor');
        if (editor) {
          const currentPadding = parseInt(window.getComputedStyle(editor).paddingTop) || 0;
          
          // Ensure there's at least 25px of top padding
          if (currentPadding < 25) {
            editor.style.paddingTop = '25px';
          }
        }
      }
      
      // Handle keyboard paste events
      const handleKeyboardPaste = function(e) {
        // We don't need to prevent default - let Quill handle the paste
        // But after the paste, we need to:
        
        // 1. Update our content reference
        setTimeout(() => {
          const html = quill.root.innerHTML;
          if (html !== contentRef.current) {
            contentRef.current = html;
            onChangeRef.current(html);
          }
          
          // 2. Make sure content doesn't overlap with toolbar
          ensureTopContentVisible();
        }, 10);
      };
      
      // Add a native paste event listener
      quill.root.addEventListener('paste', handleKeyboardPaste);
      
      // Set initial content if provided
      if (markdown) {
        console.log('Editor: Setting initial content');
        quill.clipboard.dangerouslyPasteHTML(markdown);
        contentRef.current = markdown;
      }
      
      // Define text change handler
      const handleTextChange = function(delta, oldDelta, source) {
        if (source === 'user') {
          const html = quill.root.innerHTML;
          
          // Only update if content actually changed
          if (html !== contentRef.current) {
            contentRef.current = html;
            onChangeRef.current(html);
          }
          
          // Ensure top padding is maintained
          enforceMinimumTopPadding();
        }
      };
      
      // Register handler
      quill.on('text-change', handleTextChange);
      quill.textChangeHandler = handleTextChange;
      
      // Add additional CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = `
        /* Ensure minimum top padding on editor */
        .ql-editor {
          min-height: 200px !important;
          padding-top: 25px !important;
          overflow-y: auto !important;
        }
        
        /* Toolbar - keep visible and stable */
        .ql-toolbar.ql-snow {
          background-color: var(--toolbar-bg) !important;
          position: sticky !important;
          top: 0 !important;
          z-index: 10 !important;
        }
      `;
      document.head.appendChild(styleElement);
      
      // Run initialization functions
      enforceMinimumTopPadding();
      
      // Set references
      quillRef.current = quill;
      globalQuillInstance = quill;
      setEditorLoaded(true);
      
      console.log('Editor: Quill initialization complete');
      
      // Store cleanup functions
      quill.pasteCleanup = () => {
        quill.root.removeEventListener('paste', handleKeyboardPaste);
      };
    };
    
    // Initialize with a small delay to ensure React rendering is complete
    const timerId = setTimeout(initializeQuill, 50);
    
    // Cleanup function
    return () => {
      clearTimeout(timerId);
      
      if (quillRef.current) {
        // Clean up event listeners
        if (quillRef.current.pasteCleanup) {
          quillRef.current.pasteCleanup();
        }
        
        // Only do full cleanup if this component created the instance
        if (quillRef.current === globalQuillInstance) {
          console.log('Editor: Performing full cleanup of Quill instance');
          
          if (quillRef.current.textChangeHandler) {
            quillRef.current.off('text-change', quillRef.current.textChangeHandler);
          }
          
          // Don't set global to null here, another instance might still need it
          quillRef.current = null;
        } else {
          // Just detach from instance created by another component
          quillRef.current = null;
        }
      }
    };
  }, []); // Empty dependency array - only run once at mount

  // Update external content if it changes
  useEffect(() => {
    if (quillRef.current && editorLoaded && markdown !== contentRef.current) {
      console.log('Editor: External content update detected');
      quillRef.current.clipboard.dangerouslyPasteHTML(markdown);
      contentRef.current = markdown;
    }
  }, [markdown, editorLoaded]);

  return (
    <div className="quill-container">
      {!editorLoaded && (
        <div className="editor-loading">Loading editor...</div>
      )}
      
      <div className="quill-editor-container" ref={containerRef}></div>
    </div>
  );
}

export default Editor;