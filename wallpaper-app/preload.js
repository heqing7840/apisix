const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  setSetting: (key, value) => ipcRenderer.invoke('set-setting', key, value),

  // Pexels API
  getPexelsPhotos: (query, page, perPage, orientation) => ipcRenderer.invoke('get-pexels-photos', query, page, perPage, orientation),
  getPexelsVideos: (query, page, perPage, orientation) => ipcRenderer.invoke('get-pexels-videos', query, page, perPage, orientation),

  // Wallpaper management
  downloadWallpaper: (url, filename) => ipcRenderer.invoke('download-wallpaper', url, filename),
  setWallpaper: (imagePath) => ipcRenderer.invoke('set-wallpaper', imagePath),

  // Local wallpapers
  uploadLocalWallpaper: () => ipcRenderer.invoke('upload-local-wallpaper'),
  getLocalWallpapers: () => ipcRenderer.invoke('get-local-wallpapers'),
  deleteLocalWallpaper: (wallpaperId) => ipcRenderer.invoke('delete-local-wallpaper', wallpaperId),

  // Cache management
  clearCache: () => ipcRenderer.invoke('clear-cache'),
  getCacheSize: () => ipcRenderer.invoke('get-cache-size'),

  // External links
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),

  // Platform detection
  platform: process.platform,

  // Version info
  versions: {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron
  }
});

// Expose a limited API for theme detection
contextBridge.exposeInMainWorld('themeAPI', {
  getSystemTheme: () => {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  },
  onThemeChange: (callback) => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', (e) => {
      callback(e.matches ? 'dark' : 'light');
    });
    return () => mediaQuery.removeEventListener('change', callback);
  }
});

// Expose console methods for debugging (development only)
if (process.env.NODE_ENV === 'development') {
  contextBridge.exposeInMainWorld('devAPI', {
    log: (...args) => console.log(...args),
    error: (...args) => console.error(...args),
    warn: (...args) => console.warn(...args)
  });
}
