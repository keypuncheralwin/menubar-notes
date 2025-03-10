const { app, BrowserWindow, Menu, Tray, ipcMain, screen } = require('electron');
const path = require('path');
const Store = require('electron-store');
const isDev = process.env.ELECTRON_DEV === '1' || !app.isPackaged;

console.log('Main process starting');

// Initialize the store for saving notes
const store = new Store({
  name: 'menubar-notes',
  clearInvalidConfig: true, // Prevents errors with invalid configs
  defaults: {
    notes: '',
    theme: 'dark',
    stickyWindow: false,
    draggableWindow: false,
    resizableWindow: false,
    windowPosition: null
  }
});

console.log('Store initialized, path:', store.path);

let tray = null;
let window = null;

function createWindow() {
  console.log('Creating window');
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;
  
  // Create the browser window.
  window = new BrowserWindow({
    width: 440,
    height: 540,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: true,
    transparent: true,
    skipTaskbar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  
  // Fix template literal syntax with backticks
  const indexHtml = isDev
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../dist/index.html')}`;
  
  console.log(`Loading URL: ${indexHtml} (isDev: ${isDev})`);
  window.loadURL(indexHtml);
  
  // Open DevTools in development mode
  if (isDev) {
    window.webContents.openDevTools({ mode: 'detach' });
  }

  // Apply window behavior settings
  // Sticky window (always on top)
  const isSticky = store.get('stickyWindow', false);
  if (isSticky) {
    window.setAlwaysOnTop(true, 'floating');
    console.log('Window set to always-on-top based on saved preference');
  }
  
  // Draggable window
  const isDraggable = store.get('draggableWindow', false);
  if (isDraggable) {
    window.setMovable(true);
    console.log('Window set to draggable based on saved preference');
  } else {
    window.setMovable(false);
    console.log('Window set to non-draggable based on saved preference');
  }
  
  // Resizable window
  const isResizable = store.get('resizableWindow', false);
  if (isResizable) {
    window.setResizable(true);
    console.log('Window set to resizable based on saved preference');
  } else {
    window.setResizable(false);
    console.log('Window set to non-resizable based on saved preference');
  }

  // Listen for window position changes when dragged
  window.on('moved', () => {
    if (store.get('draggableWindow', false)) {
      const position = window.getPosition();
      store.set('windowPosition', position);
      console.log('Window position saved:', position);
    }
  });

  // Hide the window when it loses focus with animation - only if not in sticky mode
  window.on('blur', () => {
    // Check if sticky mode is enabled
    const isSticky = store.get('stickyWindow', false);
    
    // Only hide if the window is visible and not in sticky mode
    if (window.isVisible() && !isSticky) {
      hideWindowWithAnimation();
    }
  });
  
  window.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });
}

const toggleWindow = () => {
  if (window.isVisible()) {
    hideWindowWithAnimation();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  // Check if we have a saved position and if draggable is enabled
  const savedPosition = store.get('windowPosition');
  const isDraggable = store.get('draggableWindow', false);
  
  if (savedPosition && isDraggable) {
    // Position window at the saved position
    console.log('Using saved position:', savedPosition);
    
    // Set opacity to 0 before showing
    window.setOpacity(0);
    
    // Position and show window
    window.setPosition(savedPosition[0], savedPosition[1], false);
    window.show();
    window.focus();
    
    // Fade in animation
    fadeWindowIn();
  } else {
    // Default positioning logic - position window below the tray icon
    const trayBounds = tray.getBounds();
    const windowBounds = window.getBounds();
    
    // Get display where tray icon is located
    const displayForTray = screen.getDisplayMatching(trayBounds);
    
    // Position centered underneath the tray icon
    let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
    let y = Math.round(trayBounds.y + trayBounds.height);
    
    // Make sure window is not positioned outside the screen where the tray is
    if (x < displayForTray.bounds.x) x = displayForTray.bounds.x;
    if (y < displayForTray.bounds.y) y = displayForTray.bounds.y;
    if (x + windowBounds.width > displayForTray.bounds.x + displayForTray.bounds.width) {
      x = displayForTray.bounds.x + displayForTray.bounds.width - windowBounds.width;
    }
    
    // Set opacity to 0 before showing
    window.setOpacity(0);
    
    // Position and show window
    window.setPosition(x, y, false);
    window.show();
    window.focus();
    
    // Fade in animation
    fadeWindowIn();
  }
};

const hideWindowWithAnimation = () => {
  // Fade out and then hide
  fadeWindowOut().then(() => {
    window.hide();
    // Reset opacity for next time
    window.setOpacity(1);
  });
};

// Fade in animation function
const fadeWindowIn = () => {
  let opacity = 0;
  const targetOpacity = 1;
  const step = 0.1;
  const interval = 16; // ~60fps
  
  const fadeIn = setInterval(() => {
    if (opacity >= targetOpacity) {
      clearInterval(fadeIn);
      window.setOpacity(targetOpacity);
    } else {
      opacity += step;
      window.setOpacity(opacity);
    }
  }, interval);
};

// Fade out animation function
const fadeWindowOut = () => {
  return new Promise((resolve) => {
    let opacity = 1;
    const targetOpacity = 0;
    const step = 0.1;
    const interval = 16; // ~60fps
    
    const fadeOut = setInterval(() => {
      if (opacity <= targetOpacity) {
        clearInterval(fadeOut);
        window.setOpacity(targetOpacity);
        resolve();
      } else {
        opacity -= step;
        window.setOpacity(opacity);
      }
    }, interval);
  });
};

// Set up IPC handlers
console.log('Setting up IPC handlers');

// Basic ping/pong to test IPC communication
ipcMain.handle('ping', () => {
  console.log('Ping received');
  return 'pong';
});

// Handle IPC events for saving and loading notes
ipcMain.handle('save-note', (event, noteContent) => {
  console.log('Main: save-note event received, content length:', noteContent?.length || 0);
  try {
    store.set('notes', noteContent);
    console.log('Main: Note saved successfully to', store.path);
    // Verify the save worked by immediately reading it back
    const saved = store.get('notes');
    console.log('Main: Verified saved content length:', saved?.length || 0);
    return true;
  } catch (error) {
    console.error('Main: Error saving note:', error);
    return false;
  }
});

ipcMain.handle('load-note', () => {
  console.log('Main: load-note event received');
  try {
    const notes = store.get('notes');
    console.log('Main: Loaded notes, content length:', notes?.length || 0);
    return notes;
  } catch (error) {
    console.error('Main: Error loading notes:', error);
    return '';
  }
});

ipcMain.handle('save-theme', (event, theme) => {
  console.log('Main: save-theme event received:', theme);
  try {
    store.set('theme', theme);
    console.log('Main: Theme preference saved successfully to', store.path);
    return true;
  } catch (error) {
    console.error('Main: Error saving theme preference:', error);
    return false;
  }
});

ipcMain.handle('get-theme', () => {
  console.log('Main: get-theme event received');
  try {
    const theme = store.get('theme', 'dark'); // Default to dark if not set
    console.log('Main: Loaded theme preference:', theme);
    return theme;
  } catch (error) {
    console.error('Main: Error loading theme preference:', error);
    return 'dark'; // Default to dark on error
  }
});

// Add handlers for window behavior preferences
// Sticky window
ipcMain.handle('save-sticky-preference', (event, isSticky) => {
  console.log('Main: save-sticky-preference event received:', isSticky);
  try {
    store.set('stickyWindow', isSticky);
    console.log('Main: Sticky window preference saved successfully to', store.path);
    return true;
  } catch (error) {
    console.error('Main: Error saving sticky window preference:', error);
    return false;
  }
});

ipcMain.handle('get-sticky-preference', () => {
  console.log('Main: get-sticky-preference event received');
  try {
    const isSticky = store.get('stickyWindow', false); // Default to false if not set
    console.log('Main: Loaded sticky window preference:', isSticky);
    return isSticky;
  } catch (error) {
    console.error('Main: Error loading sticky window preference:', error);
    return false; // Default to false on error
  }
});

ipcMain.handle('set-always-on-top', (event, shouldBeOnTop) => {
  console.log('Main: set-always-on-top event received:', shouldBeOnTop);
  try {
    if (window) {
      window.setAlwaysOnTop(shouldBeOnTop, 'floating');
      console.log('Main: Window always-on-top set to:', shouldBeOnTop);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Main: Error setting window always-on-top:', error);
    return false;
  }
});

// Draggable window
ipcMain.handle('save-draggable-preference', (event, isDraggable) => {
  console.log('Main: save-draggable-preference event received:', isDraggable);
  try {
    store.set('draggableWindow', isDraggable);
    console.log('Main: Draggable window preference saved successfully to', store.path);
    return true;
  } catch (error) {
    console.error('Main: Error saving draggable window preference:', error);
    return false;
  }
});

ipcMain.handle('get-draggable-preference', () => {
  console.log('Main: get-draggable-preference event received');
  try {
    const isDraggable = store.get('draggableWindow', false); // Default to false if not set
    console.log('Main: Loaded draggable window preference:', isDraggable);
    return isDraggable;
  } catch (error) {
    console.error('Main: Error loading draggable window preference:', error);
    return false; // Default to false on error
  }
});

ipcMain.handle('set-draggable', (event, shouldBeDraggable) => {
  console.log('Main: set-draggable event received:', shouldBeDraggable);
  try {
    if (window) {
      window.setMovable(shouldBeDraggable);
      console.log('Main: Window draggable set to:', shouldBeDraggable);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Main: Error setting window draggable:', error);
    return false;
  }
});

// Resizable window
ipcMain.handle('save-resizable-preference', (event, isResizable) => {
  console.log('Main: save-resizable-preference event received:', isResizable);
  try {
    store.set('resizableWindow', isResizable);
    console.log('Main: Resizable window preference saved successfully to', store.path);
    return true;
  } catch (error) {
    console.error('Main: Error saving resizable window preference:', error);
    return false;
  }
});

ipcMain.handle('get-resizable-preference', () => {
  console.log('Main: get-resizable-preference event received');
  try {
    const isResizable = store.get('resizableWindow', false); // Default to false if not set
    console.log('Main: Loaded resizable window preference:', isResizable);
    return isResizable;
  } catch (error) {
    console.error('Main: Error loading resizable window preference:', error);
    return false; // Default to false on error
  }
});

ipcMain.handle('set-resizable', (event, shouldBeResizable) => {
  console.log('Main: set-resizable event received:', shouldBeResizable);
  try {
    if (window) {
      window.setResizable(shouldBeResizable);
      console.log('Main: Window resizable set to:', shouldBeResizable);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Main: Error setting window resizable:', error);
    return false;
  }
});

// Add handler for resetting window position
ipcMain.handle('reset-window-position', () => {
  console.log('Main: reset-window-position event received');
  try {
    // Clear saved position
    store.delete('windowPosition');
    console.log('Main: Window position reset');
    
    // If window is visible, reposition it immediately
    if (window && window.isVisible()) {
      const trayBounds = tray.getBounds();
      const windowBounds = window.getBounds();
      
      // Get display where tray icon is located
      const displayForTray = screen.getDisplayMatching(trayBounds);
      
      // Position centered underneath the tray icon
      let x = Math.round(trayBounds.x + (trayBounds.width / 2) - (windowBounds.width / 2));
      let y = Math.round(trayBounds.y + trayBounds.height);
      
      // Make sure window is not positioned outside the screen
      if (x < displayForTray.bounds.x) x = displayForTray.bounds.x;
      if (y < displayForTray.bounds.y) y = displayForTray.bounds.y;
      if (x + windowBounds.width > displayForTray.bounds.x + displayForTray.bounds.width) {
        x = displayForTray.bounds.x + displayForTray.bounds.width - windowBounds.width;
      }
      
      window.setPosition(x, y, false);
    }
    
    return true;
  } catch (error) {
    console.error('Main: Error resetting window position:', error);
    return false;
  }
});

// Add handler for window close
ipcMain.handle('close-window', () => {
  if (window && window.isVisible()) {
    hideWindowWithAnimation();
  }
  return true;
});

app.whenReady().then(() => {
  console.log('App ready, initializing...');
  createWindow();
  
  // For smoother visual experience
  window.once('ready-to-show', () => {
    window.setOpacity(0);
  });
  
  if (process.platform === 'darwin') {
    app.setActivationPolicy('accessory');
  }
  // Create tray icon
  const iconPath = path.join(__dirname, '../src/assets/icon.png');
  console.log('Creating tray with icon path:', iconPath);
  try {
    tray = new Tray(iconPath);
    tray.setToolTip('Menu Bar Notes');
    
    // Create context menu for tray (will only be shown on right-click)
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Quit', click: () => app.quit() }
    ]);
    
    // Set click behavior based on platform
    if (process.platform === 'darwin') {
      // On macOS, show window on left click, context menu on right click
      tray.on('click', () => {
        toggleWindow();
      });
      
      tray.on('right-click', () => {
        tray.popUpContextMenu(contextMenu);
      });
    } else {
      // On Windows/Linux, show window on left click, context menu on right click (default behavior)
      tray.on('click', () => {
        toggleWindow();
      });
    }
  } catch (error) {
    console.error('Error creating tray:', error);
  }
  
  console.log('App initialization complete');
});

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Log any uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
});