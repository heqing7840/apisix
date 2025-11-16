const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');
const { promisify } = require('util');
const sharp = require('sharp');
const crypto = require('crypto');

const execAsync = promisify(exec);

class WallpaperManager {
  constructor(store) {
    this.store = store;
    this.apiKey = process.env.PEXELS_API_KEY || 'YOUR_PEXELS_API_KEY_HERE';
    this.baseUrl = 'https://api.pexels.com/v1';
    this.videosUrl = 'https://api.pexels.com/videos';
    
    // Initialize directories
    this.initDirectories();
    
    // Rate limiting
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.requestsPerHour = 200;
    this.requestsThisHour = 0;
    this.hourStartTime = Date.now();
  }

  async initDirectories() {
    const homeDir = os.homedir();
    this.downloadDir = this.store.get('downloadPath') || path.join(homeDir, 'Wallpapers', 'Downloads');
    this.cacheDir = path.join(homeDir, 'Wallpapers', 'Cache');
    this.localDir = path.join(homeDir, 'Wallpapers', 'Local');
    
    await fs.ensureDir(this.downloadDir);
    await fs.ensureDir(this.cacheDir);
    await fs.ensureDir(this.localDir);
  }

  // Rate limiting helper
  async makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({ url, options, resolve, reject });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    // Reset hourly counter if needed
    const now = Date.now();
    if (now - this.hourStartTime > 3600000) { // 1 hour
      this.requestsThisHour = 0;
      this.hourStartTime = now;
    }

    // Check rate limit
    if (this.requestsThisHour >= this.requestsPerHour) {
      const waitTime = 3600000 - (now - this.hourStartTime);
      console.log(`Rate limit reached. Waiting ${waitTime}ms`);
      setTimeout(() => {
        this.isProcessingQueue = false;
        this.processQueue();
      }, waitTime);
      return;
    }

    const { url, options, resolve, reject } = this.requestQueue.shift();

    try {
      const response = await axios.get(url, {
        headers: {
          'Authorization': this.apiKey,
          'User-Agent': 'Wallpaper Manager App'
        },
        ...options
      });
      
      this.requestsThisHour++;
      resolve(response.data);
    } catch (error) {
      reject(error);
    }

    // Process next request after a small delay
    setTimeout(() => {
      this.isProcessingQueue = false;
      this.processQueue();
    }, 100);
  }

  async getPexelsPhotos(query = 'nature photography', page = 1, perPage = 30, orientation = 'landscape') {
    try {
      let url = `${this.baseUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

      // Add orientation filter if specified
      if (orientation && orientation !== 'all') {
        url += `&orientation=${orientation}`;
      }

      console.log('Fetching photos from:', url);
      return await this.makeRequest(url);
    } catch (error) {
      console.error('Error fetching Pexels photos:', error);
      throw new Error('Failed to fetch photos from Pexels');
    }
  }

  async getPexelsVideos(query = 'nature', page = 1, perPage = 30, orientation = 'landscape') {
    try {
      let url = `${this.videosUrl}/search?query=${encodeURIComponent(query)}&page=${page}&per_page=${perPage}`;

      // Add orientation filter if specified
      if (orientation && orientation !== 'all') {
        url += `&orientation=${orientation}`;
      }

      console.log('Fetching videos from:', url);
      return await this.makeRequest(url);
    } catch (error) {
      console.error('Error fetching Pexels videos:', error);
      throw new Error('Failed to fetch videos from Pexels');
    }
  }

  async downloadWallpaper(url, filename) {
    try {
      const filePath = path.join(this.downloadDir, filename);
      
      // Check if file already exists
      if (await fs.pathExists(filePath)) {
        return filePath;
      }

      const response = await axios({
        method: 'GET',
        url: url,
        responseType: 'stream'
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve, reject) => {
        writer.on('finish', () => resolve(filePath));
        writer.on('error', reject);
      });
    } catch (error) {
      console.error('Error downloading wallpaper:', error);
      throw new Error('Failed to download wallpaper');
    }
  }

  async setWallpaper(imagePath) {
    try {
      if (process.platform === 'darwin') {
        await this.setMacOSWallpaper(imagePath);
      } else if (process.platform === 'win32') {
        await this.setWindowsWallpaper(imagePath);
      } else {
        throw new Error('Unsupported platform');
      }
    } catch (error) {
      console.error('Error setting wallpaper:', error);
      throw new Error('Failed to set wallpaper');
    }
  }

  async setMacOSWallpaper(imagePath) {
    try {
      // Use osascript to set wallpaper
      const script = `tell application "Finder" to set desktop picture to POSIX file "${imagePath}"`;
      await execAsync(`osascript -e '${script}'`);
    } catch (error) {
      // Fallback to using sqlite to modify the desktop database
      try {
        const dbPath = path.join(os.homedir(), 'Library/Application Support/Dock/desktoppicture.db');
        await execAsync(`sqlite3 "${dbPath}" "UPDATE data SET value = '${imagePath}' WHERE rowid = 1;"`);
        await execAsync('killall Dock');
      } catch (fallbackError) {
        throw new Error('Failed to set wallpaper on macOS');
      }
    }
  }

  async setWindowsWallpaper(imagePath) {
    try {
      // Use PowerShell to set wallpaper
      const script = `
        Add-Type -TypeDefinition "
        using System;
        using System.Runtime.InteropServices;
        public class Wallpaper {
          [DllImport(\\"user32.dll\\", CharSet = CharSet.Auto)]
          public static extern int SystemParametersInfo(int uAction, int uParam, string lpvParam, int fuWinIni);
        }
        "
        [Wallpaper]::SystemParametersInfo(20, 0, "${imagePath.replace(/\\/g, '\\\\')}", 3)
      `;
      
      await execAsync(`powershell -Command "${script}"`);
    } catch (error) {
      throw new Error('Failed to set wallpaper on Windows');
    }
  }

  async uploadLocalWallpapers(filePaths) {
    const uploadedWallpapers = [];

    for (const filePath of filePaths) {
      try {
        const stats = await fs.stat(filePath);
        const filename = path.basename(filePath);
        const ext = path.extname(filename).toLowerCase();
        
        // Validate file type and size
        const isImage = ['.jpg', '.jpeg', '.png', '.bmp', '.gif'].includes(ext);
        const isVideo = ['.mp4', '.mov', '.avi', '.mkv'].includes(ext);
        
        if (!isImage && !isVideo) {
          console.warn(`Skipping unsupported file: ${filename}`);
          continue;
        }

        // Check file size limits
        const maxImageSize = 50 * 1024 * 1024; // 50MB
        const maxVideoSize = 200 * 1024 * 1024; // 200MB
        
        if ((isImage && stats.size > maxImageSize) || (isVideo && stats.size > maxVideoSize)) {
          console.warn(`Skipping file too large: ${filename}`);
          continue;
        }

        // Generate unique ID and copy file
        const id = crypto.randomUUID();
        const newFilename = `${id}${ext}`;
        const newPath = path.join(this.localDir, newFilename);
        
        await fs.copy(filePath, newPath);

        // Generate thumbnail for images
        let thumbnailPath = null;
        if (isImage) {
          thumbnailPath = await this.generateThumbnail(newPath, id);
        }

        const wallpaper = {
          id,
          name: filename,
          path: newPath,
          thumbnailPath: thumbnailPath || newPath,
          type: isImage ? 'image' : 'video',
          size: this.formatFileSize(stats.size),
          uploadedAt: new Date().toISOString()
        };

        uploadedWallpapers.push(wallpaper);
      } catch (error) {
        console.error(`Error uploading ${filePath}:`, error);
      }
    }

    // Save metadata
    await this.saveLocalWallpapersMetadata();
    
    return uploadedWallpapers;
  }

  async generateThumbnail(imagePath, id) {
    try {
      const thumbnailPath = path.join(this.cacheDir, `thumb_${id}.jpg`);
      
      await sharp(imagePath)
        .resize(280, 200, {
          fit: 'cover',
          position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
        
      return thumbnailPath;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return null;
    }
  }

  async getLocalWallpapers() {
    try {
      const metadataPath = path.join(this.localDir, 'metadata.json');
      
      if (await fs.pathExists(metadataPath)) {
        const metadata = await fs.readJson(metadataPath);
        return metadata.wallpapers || [];
      }
      
      return [];
    } catch (error) {
      console.error('Error loading local wallpapers:', error);
      return [];
    }
  }

  async saveLocalWallpapersMetadata() {
    try {
      const metadataPath = path.join(this.localDir, 'metadata.json');
      const wallpapers = await this.getLocalWallpapers();
      
      await fs.writeJson(metadataPath, { wallpapers }, { spaces: 2 });
    } catch (error) {
      console.error('Error saving local wallpapers metadata:', error);
    }
  }

  async deleteLocalWallpaper(wallpaperId) {
    try {
      const wallpapers = await this.getLocalWallpapers();
      const wallpaper = wallpapers.find(w => w.id === wallpaperId);
      
      if (!wallpaper) {
        throw new Error('Wallpaper not found');
      }

      // Delete files
      await fs.remove(wallpaper.path);
      if (wallpaper.thumbnailPath && wallpaper.thumbnailPath !== wallpaper.path) {
        await fs.remove(wallpaper.thumbnailPath);
      }

      // Update metadata
      const updatedWallpapers = wallpapers.filter(w => w.id !== wallpaperId);
      const metadataPath = path.join(this.localDir, 'metadata.json');
      await fs.writeJson(metadataPath, { wallpapers: updatedWallpapers }, { spaces: 2 });

      return true;
    } catch (error) {
      console.error('Error deleting local wallpaper:', error);
      throw new Error('Failed to delete wallpaper');
    }
  }

  async clearCache() {
    try {
      await fs.emptyDir(this.cacheDir);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      throw new Error('Failed to clear cache');
    }
  }

  async getCacheSize() {
    try {
      const files = await fs.readdir(this.cacheDir);
      let totalSize = 0;

      for (const file of files) {
        const filePath = path.join(this.cacheDir, file);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }

      return totalSize;
    } catch (error) {
      console.error('Error calculating cache size:', error);
      return 0;
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

module.exports = WallpaperManager;
