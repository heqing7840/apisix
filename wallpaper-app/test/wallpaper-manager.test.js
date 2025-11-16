const WallpaperManager = require('../src/js/wallpaper-manager');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');

// Mock electron-store
const mockStore = {
  get: jest.fn(),
  set: jest.fn(),
  store: {}
};

describe('WallpaperManager', () => {
  let wallpaperManager;
  let tempDir;

  beforeEach(() => {
    tempDir = path.join(os.tmpdir(), 'wallpaper-test-' + Date.now());
    mockStore.get.mockReturnValue(tempDir);
    wallpaperManager = new WallpaperManager(mockStore);
  });

  afterEach(async () => {
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  });

  describe('Directory Initialization', () => {
    test('should create required directories', async () => {
      await wallpaperManager.initDirectories();
      
      expect(await fs.pathExists(wallpaperManager.downloadDir)).toBe(true);
      expect(await fs.pathExists(wallpaperManager.cacheDir)).toBe(true);
      expect(await fs.pathExists(wallpaperManager.localDir)).toBe(true);
    });
  });

  describe('File Size Formatting', () => {
    test('should format bytes correctly', () => {
      expect(wallpaperManager.formatFileSize(0)).toBe('0 Bytes');
      expect(wallpaperManager.formatFileSize(1024)).toBe('1 KB');
      expect(wallpaperManager.formatFileSize(1048576)).toBe('1 MB');
      expect(wallpaperManager.formatFileSize(1073741824)).toBe('1 GB');
    });
  });

  describe('Cache Management', () => {
    test('should calculate cache size', async () => {
      await wallpaperManager.initDirectories();
      
      // Create a test file
      const testFile = path.join(wallpaperManager.cacheDir, 'test.txt');
      await fs.writeFile(testFile, 'test content');
      
      const size = await wallpaperManager.getCacheSize();
      expect(size).toBeGreaterThan(0);
    });

    test('should clear cache', async () => {
      await wallpaperManager.initDirectories();
      
      // Create test files
      const testFile1 = path.join(wallpaperManager.cacheDir, 'test1.txt');
      const testFile2 = path.join(wallpaperManager.cacheDir, 'test2.txt');
      await fs.writeFile(testFile1, 'test content 1');
      await fs.writeFile(testFile2, 'test content 2');
      
      await wallpaperManager.clearCache();
      
      const files = await fs.readdir(wallpaperManager.cacheDir);
      expect(files.length).toBe(0);
    });
  });

  describe('Local Wallpapers', () => {
    test('should return empty array when no wallpapers exist', async () => {
      await wallpaperManager.initDirectories();
      const wallpapers = await wallpaperManager.getLocalWallpapers();
      expect(wallpapers).toEqual([]);
    });

    test('should save and load wallpaper metadata', async () => {
      await wallpaperManager.initDirectories();
      
      // Manually create metadata
      const metadataPath = path.join(wallpaperManager.localDir, 'metadata.json');
      const testData = {
        wallpapers: [
          {
            id: 'test-1',
            name: 'test.jpg',
            path: '/test/path.jpg',
            type: 'image'
          }
        ]
      };
      
      await fs.writeJson(metadataPath, testData);
      
      const wallpapers = await wallpaperManager.getLocalWallpapers();
      expect(wallpapers).toHaveLength(1);
      expect(wallpapers[0].id).toBe('test-1');
    });
  });

  describe('Rate Limiting', () => {
    test('should initialize with correct rate limit values', () => {
      expect(wallpaperManager.requestsPerHour).toBe(200);
      expect(wallpaperManager.requestsThisHour).toBe(0);
    });
  });
});

// Mock axios for API tests
jest.mock('axios');
const axios = require('axios');

describe('WallpaperManager API Integration', () => {
  let wallpaperManager;

  beforeEach(() => {
    wallpaperManager = new WallpaperManager(mockStore);
    axios.get.mockClear();
  });

  test('should handle API errors gracefully', async () => {
    axios.get.mockRejectedValue(new Error('Network error'));
    
    await expect(wallpaperManager.getPexelsPhotos('test')).rejects.toThrow('Failed to fetch photos from Pexels');
  });
});

// Platform-specific tests
describe('Platform-specific functionality', () => {
  let wallpaperManager;

  beforeEach(() => {
    wallpaperManager = new WallpaperManager(mockStore);
  });

  test('should handle unsupported platforms', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', {
      value: 'linux'
    });

    await expect(wallpaperManager.setWallpaper('/test/path.jpg')).rejects.toThrow('Unsupported platform');

    Object.defineProperty(process, 'platform', {
      value: originalPlatform
    });
  });
});
