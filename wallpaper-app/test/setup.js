// Jest setup file for global test configuration

// Mock electron modules
jest.mock('electron', () => ({
  app: {
    whenReady: jest.fn(() => Promise.resolve()),
    on: jest.fn(),
    quit: jest.fn()
  },
  BrowserWindow: jest.fn(() => ({
    loadFile: jest.fn(),
    on: jest.fn(),
    once: jest.fn(),
    show: jest.fn()
  })),
  ipcMain: {
    handle: jest.fn(),
    on: jest.fn()
  },
  dialog: {
    showOpenDialog: jest.fn()
  },
  shell: {
    openExternal: jest.fn()
  }
}));

// Mock electron-store
jest.mock('electron-store', () => {
  return jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    set: jest.fn(),
    store: {}
  }));
});

// Mock sharp for image processing
jest.mock('sharp', () => {
  const mockSharp = jest.fn(() => ({
    resize: jest.fn().mockReturnThis(),
    jpeg: jest.fn().mockReturnThis(),
    toFile: jest.fn().mockResolvedValue()
  }));
  return mockSharp;
});

// Set up environment variables for testing
process.env.NODE_ENV = 'test';
process.env.PEXELS_API_KEY = 'test-api-key';

// Global test utilities
global.testUtils = {
  createMockWallpaper: (overrides = {}) => ({
    id: 'test-id',
    photographer: 'Test Photographer',
    photographer_url: 'https://test.com',
    src: {
      small: 'https://test.com/small.jpg',
      medium: 'https://test.com/medium.jpg',
      large: 'https://test.com/large.jpg',
      original: 'https://test.com/original.jpg'
    },
    width: 1920,
    height: 1080,
    alt: 'Test wallpaper',
    ...overrides
  }),
  
  createMockVideo: (overrides = {}) => ({
    id: 'test-video-id',
    photographer: 'Test Videographer',
    photographer_url: 'https://test.com',
    video_files: [
      {
        id: 'test-file-id',
        quality: 'hd',
        file_type: 'video/mp4',
        width: 1920,
        height: 1080,
        link: 'https://test.com/video.mp4'
      }
    ],
    image: 'https://test.com/video-thumb.jpg',
    ...overrides
  })
};

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeEach(() => {
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
  }
});

afterEach(() => {
  if (!process.env.VERBOSE_TESTS) {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
  }
});
