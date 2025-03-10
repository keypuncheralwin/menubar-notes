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

const saveTheme = async (theme) => {
  console.log('Preload: saveTheme called with:', theme);
  try {
    const result = await ipcRenderer.invoke('save-theme', theme);
    console.log('Preload: saveTheme result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in saveTheme:', error);
    throw error;
  }
};

const getTheme = async () => {
  console.log('Preload: getTheme called');
  try {
    const result = await ipcRenderer.invoke('get-theme');
    console.log('Preload: getTheme result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in getTheme:', error);
    throw error;
  }
};

// Add functions for window behavior functionality
// Sticky window
const saveStickyPreference = async (isSticky) => {
  console.log('Preload: saveStickyPreference called with:', isSticky);
  try {
    const result = await ipcRenderer.invoke('save-sticky-preference', isSticky);
    console.log('Preload: saveStickyPreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in saveStickyPreference:', error);
    throw error;
  }
};

const getStickyPreference = async () => {
  console.log('Preload: getStickyPreference called');
  try {
    const result = await ipcRenderer.invoke('get-sticky-preference');
    console.log('Preload: getStickyPreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in getStickyPreference:', error);
    throw error;
  }
};

const setAlwaysOnTop = async (shouldBeOnTop) => {
  console.log('Preload: setAlwaysOnTop called with:', shouldBeOnTop);
  try {
    const result = await ipcRenderer.invoke('set-always-on-top', shouldBeOnTop);
    console.log('Preload: setAlwaysOnTop result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in setAlwaysOnTop:', error);
    throw error;
  }
};

// Draggable window
const saveDraggablePreference = async (isDraggable) => {
  console.log('Preload: saveDraggablePreference called with:', isDraggable);
  try {
    const result = await ipcRenderer.invoke('save-draggable-preference', isDraggable);
    console.log('Preload: saveDraggablePreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in saveDraggablePreference:', error);
    throw error;
  }
};

const getDraggablePreference = async () => {
  console.log('Preload: getDraggablePreference called');
  try {
    const result = await ipcRenderer.invoke('get-draggable-preference');
    console.log('Preload: getDraggablePreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in getDraggablePreference:', error);
    throw error;
  }
};

const setDraggable = async (shouldBeDraggable) => {
  console.log('Preload: setDraggable called with:', shouldBeDraggable);
  try {
    const result = await ipcRenderer.invoke('set-draggable', shouldBeDraggable);
    console.log('Preload: setDraggable result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in setDraggable:', error);
    throw error;
  }
};

// Resizable window
const saveResizablePreference = async (isResizable) => {
  console.log('Preload: saveResizablePreference called with:', isResizable);
  try {
    const result = await ipcRenderer.invoke('save-resizable-preference', isResizable);
    console.log('Preload: saveResizablePreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in saveResizablePreference:', error);
    throw error;
  }
};

const getResizablePreference = async () => {
  console.log('Preload: getResizablePreference called');
  try {
    const result = await ipcRenderer.invoke('get-resizable-preference');
    console.log('Preload: getResizablePreference result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in getResizablePreference:', error);
    throw error;
  }
};

const setResizable = async (shouldBeResizable) => {
  console.log('Preload: setResizable called with:', shouldBeResizable);
  try {
    const result = await ipcRenderer.invoke('set-resizable', shouldBeResizable);
    console.log('Preload: setResizable result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in setResizable:', error);
    throw error;
  }
};

// Add window position reset function
const resetWindowPosition = async () => {
  console.log('Preload: resetWindowPosition called');
  try {
    const result = await ipcRenderer.invoke('reset-window-position');
    console.log('Preload: resetWindowPosition result:', result);
    return result;
  } catch (error) {
    console.error('Preload: Error in resetWindowPosition:', error);
    throw error;
  }
};

const closeWindow = async () => {
  console.log('Preload: closeWindow called');
  try {
    await ipcRenderer.invoke('close-window');
    console.log('Preload: Window close requested');
  } catch (error) {
    console.error('Preload: Error in closeWindow:', error);
  }
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  saveNote,
  loadNote,
  ping: () => ipcRenderer.invoke('ping'),
  saveTheme,
  getTheme,
  // Sticky window
  saveStickyPreference,
  getStickyPreference,
  setAlwaysOnTop,
  // Draggable window
  saveDraggablePreference,
  getDraggablePreference,
  setDraggable,
  // Resizable window
  saveResizablePreference,
  getResizablePreference,
  setResizable,
  // Window management
  closeWindow,
  resetWindowPosition
});

console.log('Preload: electronAPI exposed');