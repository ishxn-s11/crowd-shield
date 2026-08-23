const { app, BrowserWindow, ipcMain, dialog, desktopCapturer, Notification, systemPreferences, shell } = require('electron');
const path = require('path');
const Store = require('electron-store');

const store = new Store();
let mainWindow;

// Permission defaults
const DEFAULT_PERMISSIONS = {
  camera: false,
  microphone: false,
  notifications: true,
  location: false,
  screenCapture: false,
};

function getPermissions() {
  return store.get('permissions', DEFAULT_PERMISSIONS);
}

function setPermission(key, value) {
  const perms = getPermissions();
  perms[key] = value;
  store.set('permissions', perms);
  return perms;
}

// Create main window
function createWindow() {
  // titleBarStyle 'hidden' + titleBarOverlay only works on Windows 11.
  // On Windows 10 / Linux / macOS it crashes. Use frameless only on Win11.
  const isWin11 = process.platform === 'win32' && require('os').release().startsWith('10.0.2');
  const windowOptions = {
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'CrowdShield',
    backgroundColor: '#0a0a0f',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
  };
  // Only use hidden title bar on Windows 11 where it's supported
  if (isWin11) {
    windowOptions.titleBarStyle = 'hidden';
    windowOptions.titleBarOverlay = { color: '#0a0a0f', symbolColor: '#B5AC8A', height: 36 };
  } else {
    windowOptions.frame = true;
  }
  // Set icon if it exists (gracefully handle missing icon)
  const iconPath = path.join(__dirname, '..', 'build', 'icon.png');
  try { require('fs').accessSync(iconPath); windowOptions.icon = iconPath; } catch {}
  mainWindow = new BrowserWindow(windowOptions);

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    // Check permissions on first launch
    const perms = getPermissions();
    if (!store.get('permissionsInitialized')) {
      requestAllPermissions();
      store.set('permissionsInitialized', true);
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Permission request dialog
async function requestPermission(type) {
  // If no window, just store default
  if (!mainWindow) {
    setPermission(type, false);
    return false;
  }
  const labels = {
    camera: { title: 'Camera Access', message: 'CrowdShield needs camera access for real-time crowd detection from your device camera.' },
    microphone: { title: 'Microphone Access', message: 'CrowdShield needs microphone access for ambient noise level monitoring during crowd events.' },
    notifications: { title: 'Notification Access', message: 'CrowdShield needs notification access to send critical crowd safety alerts and emergency warnings.' },
    location: { title: 'Location Access', message: 'CrowdShield needs location access to show nearby safe routes and venue navigation during emergencies.' },
    screenCapture: { title: 'Screen Capture', message: 'CrowdShield needs screen capture access to monitor CCTV feeds from your screen.' },
  };

  const label = labels[type] || { title: type, message: `CrowdShield needs ${type} access.` };

  const result = await dialog.showMessageBox(mainWindow, {
    type: 'question',
    buttons: ['Allow', 'Deny', 'Open Settings'],
    defaultId: 0,
    cancelId: 1,
    title: `CrowdShield — ${label.title}`,
    message: label.title,
    detail: label.message,
  });

  const granted = result.response === 0;
  setPermission(type, granted);

  if (result.response === 2) {
    shell.openExternal('ms-settings:privacy-' + type);
  }

  return granted;
}

async function requestAllPermissions() {
  const types = ['camera', 'microphone', 'notifications', 'location'];
  for (const type of types) {
    await requestPermission(type);
  }
}

// IPC handlers
ipcMain.handle('get-permissions', () => getPermissions());
ipcMain.handle('set-permission', (_, type, value) => setPermission(type, value));
ipcMain.handle('request-permission', (_, type) => requestPermission(type));
ipcMain.handle('request-all-permissions', () => requestAllPermissions());
ipcMain.handle('get-sources', async () => {
  const sources = await desktopCapturer.getSources({
    types: ['window', 'screen'],
    thumbnailSize: { width: 320, height: 180 },
  });
  return sources.map(s => ({ id: s.id, name: s.name, thumbnailDataURL: s.thumbnail.toDataURL() }));
});
ipcMain.handle('check-notification-support', () => {
  return Notification.isSupported();
});
ipcMain.handle('send-notification', (_, title, body) => {
  if (Notification.isSupported()) {
    new Notification({ title, body, urgency: 'critical' }).show();
  }
});

// App lifecycle
app.whenReady().then(() => {
  try {
    createWindow();
  } catch (err) {
    console.error('Failed to create window:', err);
    // Retry with minimal options
    mainWindow = new BrowserWindow({
      width: 1200, height: 800,
      backgroundColor: '#0a0a0f',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
