const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs-extra');
const Store = require('electron-store');
const WallpaperManager = require('./src/js/wallpaper-manager');

// Initialize store for settings
const store = new Store();
let mainWindow;
let wallpaperManager;

// Security: Enable context isolation and disable node integration
const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default',
    show: false
  });

  // Load the app
  mainWindow.loadFile('src/index.html');

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Initialize wallpaper manager
  wallpaperManager = new WallpaperManager(store);
};

// App event handlers
app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC handlers for secure communication
ipcMain.handle('get-settings', () => {
  return store.store;
});

ipcMain.handle('set-setting', (event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle('get-pexels-photos', async (event, query, page = 1, perPage = 30, orientation = 'landscape') => {
  try {
    return await wallpaperManager.getPexelsPhotos(query, page, perPage, orientation);
  } catch (error) {
    console.error('Error fetching Pexels photos:', error);
    throw error;
  }
});

ipcMain.handle('get-pexels-videos', async (event, query, page = 1, perPage = 30, orientation = 'landscape') => {
  try {
    return await wallpaperManager.getPexelsVideos(query, page, perPage, orientation);
  } catch (error) {
    console.error('Error fetching Pexels videos:', error);
    throw error;
  }
});

ipcMain.handle('download-wallpaper', async (event, url, filename) => {
  try {
    return await wallpaperManager.downloadWallpaper(url, filename);
  } catch (error) {
    console.error('Error downloading wallpaper:', error);
    throw error;
  }
});

ipcMain.handle('set-wallpaper', async (event, imagePath) => {
  try {
    return await wallpaperManager.setWallpaper(imagePath);
  } catch (error) {
    console.error('Error setting wallpaper:', error);
    throw error;
  }
});

ipcMain.handle('upload-local-wallpaper', async (event) => {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'bmp', 'gif'] },
        { name: 'Videos', extensions: ['mp4', 'mov', 'avi', 'mkv'] }
      ]
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return await wallpaperManager.uploadLocalWallpapers(result.filePaths);
    }
    return null;
  } catch (error) {
    console.error('Error uploading local wallpaper:', error);
    throw error;
  }
});

ipcMain.handle('get-local-wallpapers', async () => {
  try {
    return await wallpaperManager.getLocalWallpapers();
  } catch (error) {
    console.error('Error getting local wallpapers:', error);
    throw error;
  }
});

ipcMain.handle('delete-local-wallpaper', async (event, wallpaperId) => {
  try {
    return await wallpaperManager.deleteLocalWallpaper(wallpaperId);
  } catch (error) {
    console.error('Error deleting local wallpaper:', error);
    throw error;
  }
});

ipcMain.handle('clear-cache', async () => {
  try {
    return await wallpaperManager.clearCache();
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
});

ipcMain.handle('get-cache-size', async () => {
  try {
    return await wallpaperManager.getCacheSize();
  } catch (error) {
    console.error('Error getting cache size:', error);
    throw error;
  }
});

ipcMain.handle('open-external-link', async (event, url) => {
  await shell.openExternal(url);
});

// Handle app protocol for deep linking (future feature)
app.setAsDefaultProtocolClient('wallpaper-manager');

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});
