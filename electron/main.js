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
    notes: ''
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
    width: 400,
    height: 500,
    show: false,
    frame: false,
    fullscreenable: false,
    resizable: false,
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

  // Hide the window when it loses focus
  window.on('blur', () => {
    window.hide();
  });
  
  window.webContents.on('did-finish-load', () => {
    console.log('Window finished loading');
  });
}

const toggleWindow = () => {
  if (window.isVisible()) {
    window.hide();
  } else {
    showWindow();
  }
};

const showWindow = () => {
  // Position window directly below the tray icon
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
  
  window.setPosition(x, y, false);
  window.show();
  window.focus();
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

app.whenReady().then(() => {
  console.log('App ready, initializing...');
  createWindow();
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