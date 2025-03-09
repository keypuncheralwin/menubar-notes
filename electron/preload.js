const { contextBridge, ipcRenderer } = require('electron');

// Add console logs for debugging IPC communication
console.log('Preload script is running');

// Create debug versions of our API functions
const saveNote = async (content) => {
  console.log('Preload: saveNote called with content length:', content?.length || 0);
  try {
    const result = await ipcRenderer.invoke('save-note', content);
    console.log('Preload: saveNote result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in saveNote:', error);
    throw error;
  }
};

const loadNote = async () => {
  console.log('Preload: loadNote called');
  try {
    const result = await ipcRenderer.invoke('load-note');
    console.log('Preload: loadNote result received, content length:', result?.length || 0);
    return result;
  } catch (error) {
    console.error('Preload: Error in loadNote:', error);
    throw error;
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  saveNote,
  loadNote,
  // Add a ping function to test basic IPC communication
  ping: () => ipcRenderer.invoke('ping')
});

console.log('Preload: electronAPI exposed');