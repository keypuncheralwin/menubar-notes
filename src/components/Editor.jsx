import React, { useCallback, useEffect, useRef, useState } from 'react';
import Quill from 'quill';
import 'quill/dist/quill.snow.css';
import { useEditor } from './EditorContext';

function Editor() {
  const { markdown, setMarkdown, setLastSaved, setEditorError, setQuillInstance } = useEditor();

  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const contentRef = useRef(markdown || '');
  const [editorLoaded, setEditorLoaded] = useState(false);
  const debouncedSaveRef = useRef(null);

  // Save content to disk
  const saveContent = useCallback(async (content) => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.saveNote(content);
        if (result) {
          const timeString = new Date().toLocaleTimeString();
          setLastSaved(timeString);
        } else {
          setEditorError('Failed to save note');
        }
      } catch (err) {
        console.error('Error saving content:', err);
        setEditorError(`Error saving note: ${err.message}`);
      }
    }
  }, [setLastSaved, setEditorError]);

  // Debounced save function
  const debouncedSave = useCallback((content) => {
    if (debouncedSaveRef.current) {
      clearTimeout(debouncedSaveRef.current);
    }
    debouncedSaveRef.current = setTimeout(() => {
      saveContent(content);
      debouncedSaveRef.current = null;
    }, 500);
  }, [saveContent]);

  // Ensure the editor has at least 25px top padding
  const enforceMinimumTopPadding = useCallback(() => {
    const editorEl = document.querySelector('.ql-editor');
    if (editorEl) {
      const currentPadding = parseInt(window.getComputedStyle(editorEl).paddingTop) || 0;
      if (currentPadding < 25) {
        editorEl.style.paddingTop = '25px';
      }
    }
  }, []);

  // Ensure the top content is visible (scroll to top if near the start)
  const ensureTopContentVisible = useCallback(() => {
    setTimeout(() => {
      const range = quillRef.current?.getSelection();
      if (range && range.index < 10) {
        const editorEl = document.querySelector('.ql-editor');
        if (editorEl) {
          editorEl.scrollTop = 0;
        }
      }
      enforceMinimumTopPadding();
    }, 10);
  }, [enforceMinimumTopPadding]);

  // Memoized handler for keyboard paste events
  const handleKeyboardPaste = useCallback((e) => {
    setTimeout(() => {
      const quill = quillRef.current;
      if (!quill) return;
      const html = quill.root.innerHTML;
      if (html !== contentRef.current) {
        contentRef.current = html;
        debouncedSave(html);
      }
      ensureTopContentVisible();
    }, 10);
  }, [debouncedSave, ensureTopContentVisible]);

  // Memoized handler for text-change events
  const handleTextChange = useCallback((delta, oldDelta, source) => {
    if (source === 'user') {
      const quill = quillRef.current;
      if (!quill) return;
      const content = quill.root.innerHTML;
      if (content !== contentRef.current) {
        contentRef.current = content;
        debouncedSave(content);
      }
      enforceMinimumTopPadding();
    }
  }, [debouncedSave, enforceMinimumTopPadding]);

  // Memoized handler for blur events
  const handleBlur = useCallback(() => {
    const quill = quillRef.current;
    if (!quill) return;
    const content = quill.root.innerHTML;
    if (content !== markdown) {
      setMarkdown(content);
    }
  }, [markdown, setMarkdown]);

  // Initialize Quill and attach event listeners
  const initializeQuill = useCallback(() => {
    if (!containerRef.current) return;

    // Remove any existing Quill toolbars from previous instances
    const existingToolbars = document.querySelectorAll('.ql-toolbar');
    existingToolbars.forEach(toolbar => toolbar.remove());

    containerRef.current.innerHTML = '';
    const editorDiv = document.createElement('div');
    containerRef.current.appendChild(editorDiv);

    // Define custom toolbar icons
    const icons = Quill.import('ui/icons');
    icons['copy'] = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-copy"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>`;
    icons['paste'] = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-clipboard"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect></svg>`;

    const quill = new Quill(editorDiv, {
      theme: 'snow',
      modules: {
        toolbar: {
          container: [
            ['paste', 'copy', { 'header': [1, 2, 3, false] }, 'bold', 'italic', { 'background': [] }, { 'color': [] }, 'clean', 'code-block', 'underline', { 'list': 'ordered' }, { 'list': 'bullet' }]
          ],
          handlers: {
            'copy': function() {
              const range = quill.getSelection();
              let text = range && range.length > 0 ? quill.getText(range.index, range.length) : quill.getText();
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(text)
                  .then(() => {
                    const copyBtn = document.querySelector('.ql-copy');
                    if (copyBtn) {
                      const originalHTML = copyBtn.innerHTML;
                      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                      setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 1000);
                    }
                  })
                  .catch(() => {
                    alert('Could not copy text. Please use keyboard shortcut (Ctrl/Cmd+C).');
                  });
              } else {
                try {
                  const tempElement = document.createElement('textarea');
                  tempElement.value = text;
                  tempElement.setAttribute('readonly', '');
                  tempElement.style.position = 'absolute';
                  tempElement.style.left = '-9999px';
                  document.body.appendChild(tempElement);
                  tempElement.select();
                  const successful = document.execCommand('copy');
                  document.body.removeChild(tempElement);
                  if (successful) {
                    const copyBtn = document.querySelector('.ql-copy');
                    if (copyBtn) {
                      const originalHTML = copyBtn.innerHTML;
                      copyBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                      setTimeout(() => { copyBtn.innerHTML = originalHTML; }, 1000);
                    }
                  } else {
                    throw new Error('execCommand returned false');
                  }
                } catch (err) {
                  alert('Could not copy text. Please use keyboard shortcut (Ctrl/Cmd+C).');
                }
              }
            },
            'paste': function() {
              quill.focus();
              try {
                if (navigator.clipboard && navigator.clipboard.read) {
                  navigator.clipboard.read().then(async clipboardItems => {
                    let htmlFound = false;
                    for (const item of clipboardItems) {
                      if (item.types.includes('text/html')) {
                        htmlFound = true;
                        const htmlBlob = await item.getType('text/html');
                        const html = await htmlBlob.text();
                        const range = quill.getSelection(true);
                        if (range.length > 0) {
                          quill.deleteText(range.index, range.length);
                        }
                        quill.clipboard.dangerouslyPasteHTML(range.index, html);
                        const newContent = quill.root.innerHTML;
                        contentRef.current = newContent;
                        debouncedSave(newContent);
                        // Show paste success feedback
                        const pasteBtn = document.querySelector('.ql-paste');
                        if (pasteBtn) {
                          const originalHTML = pasteBtn.innerHTML;
                          pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                          setTimeout(() => { pasteBtn.innerHTML = originalHTML; }, 1000);
                        }
                        ensureTopContentVisible();
                        return;
                      }
                    }
                    if (!htmlFound) {
                      fallbackToPlainText();
                    }
                  }).catch(() => { fallbackToPlainText(); });
                } else {
                  fallbackToPlainText();
                }
              } catch (error) {
                fallbackToUserInput();
              }

              function fallbackToPlainText() {
                navigator.clipboard.readText().then(text => {
                  const range = quill.getSelection(true);
                  if (range.length > 0) {
                    quill.deleteText(range.index, range.length);
                  }
                  if (text.trim().startsWith('<') && text.includes('>')) {
                    quill.clipboard.dangerouslyPasteHTML(range.index, text);
                  } else {
                    quill.insertText(range.index, text);
                  }
                  const newContent = quill.root.innerHTML;
                  contentRef.current = newContent;
                  debouncedSave(newContent);
                  const pasteBtn = document.querySelector('.ql-paste');
                  if (pasteBtn) {
                    const originalHTML = pasteBtn.innerHTML;
                    pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#00cc00" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-check"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
                    setTimeout(() => { pasteBtn.innerHTML = originalHTML; }, 1000);
                  }
                  ensureTopContentVisible();
                }).catch(() => { fallbackToUserInput(); });
              }

              function fallbackToUserInput() {
                const pasteBtn = document.querySelector('.ql-paste');
                if (pasteBtn) {
                  const originalHTML = pasteBtn.innerHTML;
                  pasteBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#ff6666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-alert-circle"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
                  setTimeout(() => { pasteBtn.innerHTML = originalHTML; }, 1000);
                }
                alert('Please use keyboard shortcut (Ctrl/Cmd+V) to paste with formatting.');
              }
            }
          }
        },
      },
        placeholder: 'Write your notes here...',
        scrollingContainer: 'html',
      });

      // Attach memoized event listeners
      quill.root.addEventListener('paste', handleKeyboardPaste);
      quill.root.addEventListener('blur', handleBlur);
      quill.on('text-change', handleTextChange);
      enforceMinimumTopPadding();

      if (markdown) {
        quill.clipboard.dangerouslyPasteHTML(markdown);
        contentRef.current = markdown;
      }

      quillRef.current = quill;
      setQuillInstance(quill);
      setEditorLoaded(true);
    }, [
      debouncedSave,
      enforceMinimumTopPadding,
      ensureTopContentVisible,
      handleKeyboardPaste,
      handleBlur,
      handleTextChange,
      markdown,
      setQuillInstance,
    ]);

  // Cleanup event listeners reliably using memoized handlers
  const cleanupQuill = useCallback(() => {
    const quill = quillRef.current;
    if (quill) {
      quill.off('text-change', handleTextChange);
      if (quill.root) {
        quill.root.removeEventListener('paste', handleKeyboardPaste);
        quill.root.removeEventListener('blur', handleBlur);
      }
      quillRef.current = null;
    }
  }, [handleKeyboardPaste, handleBlur, handleTextChange]);

  useEffect(() => {
    if (containerRef.current && !quillRef.current) {
      initializeQuill();
    }
    return () => {
      cleanupQuill();
    };
  }, [initializeQuill, cleanupQuill]);

  useEffect(() => {
    if (quillRef.current && editorLoaded && markdown !== contentRef.current) {
      const selection = quillRef.current.getSelection();
      quillRef.current.clipboard.dangerouslyPasteHTML(markdown);
      contentRef.current = markdown;
      if (selection) {
        const length = quillRef.current.getLength();
        const index = Math.min(selection.index, length - 1);
        setTimeout(() => {
          quillRef.current.setSelection(index, 0);
        }, 1);
      }
    }
  }, [markdown, editorLoaded]);

  return (
    <div className="quill-container">
      {!editorLoaded && <div className="editor-loading">Loading editor...</div>}
      <div className="quill-editor-container" ref={containerRef}></div>
    </div>
  );
}

export default Editor;
