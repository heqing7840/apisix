// Main application logic
class WallpaperApp {
  constructor() {
    this.currentTab = 'pexels';
    this.currentPage = 1;
    this.isLoading = false;
    this.searchQuery = 'nature photography';
    this.currentFilter = { type: 'all', orientation: 'landscape' };
    this.wallpapers = [];
    this.localWallpapers = [];
    this.favorites = [];
    this.settings = {};
    this.renderedCount = 0;

    this.init();
  }

  async init() {
    await this.loadSettings();
    this.setupEventListeners();
    this.setupTheme();
    await this.loadInitialContent();
  }

  async loadSettings() {
    try {
      this.settings = await window.electronAPI.getSettings();
      this.applySettings();
    } catch (error) {
      console.error('Failed to load settings:', error);
      this.showToast('Failed to load settings', 'error');
    }
  }

  applySettings() {
    // Apply download path
    const downloadPathInput = document.getElementById('downloadPath');
    if (downloadPathInput) {
      downloadPathInput.value = this.settings.downloadPath || '~/Wallpapers/Downloads';
    }

    // Apply auto change settings
    const autoChangeCheckbox = document.getElementById('autoChange');
    const changeIntervalSelect = document.getElementById('changeInterval');
    
    if (autoChangeCheckbox) {
      autoChangeCheckbox.checked = this.settings.autoChange || false;
    }
    
    if (changeIntervalSelect) {
      changeIntervalSelect.value = this.settings.changeInterval || '60';
    }
  }

  setupEventListeners() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Search functionality
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    searchBtn.addEventListener('click', () => this.performSearch());
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // Filters
    document.getElementById('typeFilter').addEventListener('change', (e) => {
      this.currentFilter.type = e.target.value;
      this.refreshCurrentTab();
    });

    document.getElementById('orientationFilter').addEventListener('change', (e) => {
      this.currentFilter.orientation = e.target.value;
      this.refreshCurrentTab();
    });

    // Modal controls
    document.getElementById('settingsBtn').addEventListener('click', () => {
      this.openSettingsModal();
    });

    document.getElementById('closeSettings').addEventListener('click', () => {
      this.closeModal('settingsModal');
    });

    document.getElementById('closePreview').addEventListener('click', () => {
      this.closeModal('previewModal');
    });

    // Upload button
    document.getElementById('uploadBtn').addEventListener('click', () => {
      this.uploadLocalWallpapers();
    });

    // Settings actions
    document.getElementById('clearCacheBtn').addEventListener('click', () => {
      this.clearCache();
    });

    // External links
    document.getElementById('pexelsLink').addEventListener('click', (e) => {
      e.preventDefault();
      window.electronAPI.openExternalLink('https://www.pexels.com');
    });

    // Infinite scroll
    window.addEventListener('scroll', () => {
      if (this.currentTab === 'pexels' && !this.isLoading) {
        const { scrollTop, scrollHeight, clientHeight } = document.documentElement;
        // Trigger loading when user is 500px from bottom
        if (scrollTop + clientHeight >= scrollHeight - 500) {
          console.log('Triggering infinite scroll load...');
          this.loadMorePexelsContent();
        }
      }
    });

    // Modal backdrop clicks
    document.querySelectorAll('.modal').forEach(modal => {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) {
          this.closeModal(modal.id);
        }
      });
    });
  }

  setupTheme() {
    // Apply system theme
    const theme = window.themeAPI.getSystemTheme();
    document.body.setAttribute('data-theme', theme);

    // Listen for theme changes
    window.themeAPI.onThemeChange((newTheme) => {
      document.body.setAttribute('data-theme', newTheme);
    });
  }

  async loadInitialContent() {
    await this.loadPexelsContent();
    await this.loadLocalWallpapers();
    await this.updateCacheSize();
  }

  switchTab(tabName) {
    // Update active tab
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.remove('active');
    });
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

    // Update active content
    document.querySelectorAll('.tab-content').forEach(content => {
      content.classList.remove('active');
    });
    document.getElementById(`${tabName}Tab`).classList.add('active');

    this.currentTab = tabName;

    // Load content if needed
    if (tabName === 'local' && this.localWallpapers.length === 0) {
      this.loadLocalWallpapers();
    } else if (tabName === 'favorites') {
      this.loadFavorites();
    }
  }

  async performSearch() {
    const searchInput = document.getElementById('searchInput');
    const query = searchInput.value.trim();

    if (query) {
      console.log('Performing search for:', query);
      this.searchQuery = query;
      this.currentPage = 1;
      this.wallpapers = [];
      this.renderedCount = 0;
      await this.loadPexelsContent();
    } else {
      // If empty search, use default query
      this.searchQuery = 'nature photography';
      this.currentPage = 1;
      this.wallpapers = [];
      this.renderedCount = 0;
      await this.loadPexelsContent();
    }
  }

  async refreshCurrentTab() {
    if (this.currentTab === 'pexels') {
      this.currentPage = 1;
      this.wallpapers = [];
      this.renderedCount = 0;
      await this.loadPexelsContent();
    }
  }

  async loadPexelsContent() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoading(true);

    try {
      let newContent = [];

      // Load photos if requested
      if (this.currentFilter.type === 'all' || this.currentFilter.type === 'photos') {
        try {
          const photos = await window.electronAPI.getPexelsPhotos(
            this.searchQuery,
            this.currentPage,
            30, // Increased from 15 to 30
            this.currentFilter.orientation
          );

          if (photos && photos.photos && photos.photos.length > 0) {
            newContent = [...newContent, ...photos.photos.map(photo => ({ ...photo, type: 'photo' }))];
            console.log(`Loaded ${photos.photos.length} photos for page ${this.currentPage}`);
          }
        } catch (error) {
          console.error('Error loading photos:', error);
        }
      }

      // Load videos if requested
      if (this.currentFilter.type === 'all' || this.currentFilter.type === 'videos') {
        try {
          const videos = await window.electronAPI.getPexelsVideos(
            this.searchQuery,
            this.currentPage,
            30, // Increased from 15 to 30
            this.currentFilter.orientation
          );

          if (videos && videos.videos && videos.videos.length > 0) {
            newContent = [...newContent, ...videos.videos.map(video => ({ ...video, type: 'video' }))];
            console.log(`Loaded ${videos.videos.length} videos for page ${this.currentPage}`);
          }
        } catch (error) {
          console.error('Error loading videos:', error);
        }
      }

      // Update wallpapers array
      if (this.currentPage === 1) {
        this.wallpapers = newContent;
      } else {
        this.wallpapers = [...this.wallpapers, ...newContent];
      }

      console.log(`Total wallpapers after page ${this.currentPage}: ${this.wallpapers.length}`);

      this.renderPexelsGrid();

      // Only increment page if we got content
      if (newContent.length > 0) {
        this.currentPage++;
      }

      // Show message if no content found
      if (newContent.length === 0 && this.currentPage === 1) {
        this.showToast('No wallpapers found for this search', 'warning');
      }

    } catch (error) {
      console.error('Failed to load Pexels content:', error);
      this.showToast('Failed to load wallpapers', 'error');
    } finally {
      this.isLoading = false;
      this.showLoading(false);
    }
  }

  async loadMorePexelsContent() {
    await this.loadPexelsContent();
  }

  renderPexelsGrid() {
    const grid = document.getElementById('pexelsGrid');

    if (this.currentPage === 1) {
      grid.innerHTML = '';
      this.renderedCount = 0;
    }

    // Only render new items that haven't been rendered yet
    const startIndex = this.renderedCount || 0;
    const newItems = this.wallpapers.slice(startIndex);

    console.log(`Rendering ${newItems.length} new items (${startIndex} to ${this.wallpapers.length})`);

    newItems.forEach((item) => {
      const wallpaperElement = this.createWallpaperElement(item);
      grid.appendChild(wallpaperElement);
    });

    this.renderedCount = this.wallpapers.length;

    // Show empty state if no wallpapers
    if (this.wallpapers.length === 0 && this.currentPage === 1) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 40px;">
          <p>No wallpapers found. Try a different search term or check your internet connection.</p>
        </div>
      `;
    }
  }

  createWallpaperElement(item) {
    const div = document.createElement('div');
    div.className = 'wallpaper-item';

    // Handle different content types
    let thumbnailUrl, dimensions, contentType;

    if (item.type === 'photo') {
      thumbnailUrl = item.src?.small || item.src?.medium || '';
      dimensions = `${item.width || ''}x${item.height || ''}`;
      contentType = 'Photo';
    } else if (item.type === 'video') {
      thumbnailUrl = item.image || '';
      // Get dimensions from the first video file
      const videoFile = item.video_files?.[0];
      dimensions = videoFile ? `${videoFile.width || ''}x${videoFile.height || ''}` : '';
      contentType = 'Video';
    } else {
      thumbnailUrl = '';
      dimensions = '';
      contentType = 'Media';
    }

    // Add video indicator for videos
    const videoIndicator = item.type === 'video' ? `
      <div class="video-indicator">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="white" style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.5); border-radius: 4px; padding: 4px;">
          <polygon points="5,3 19,12 5,21"></polygon>
        </svg>
      </div>
    ` : '';

    div.innerHTML = `
      <div class="wallpaper-image-container" style="position: relative;">
        <img src="${thumbnailUrl}" alt="${item.alt || 'Wallpaper'}" class="wallpaper-image" loading="lazy" onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjgwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDI4MCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyODAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjJGMkY3Ii8+Cjx0ZXh0IHg9IjE0MCIgeT0iMTAwIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOEU4RTkzIiBmb250LXNpemU9IjE0Ij5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pgo8L3N2Zz4K'">
        ${videoIndicator}
      </div>
      <div class="wallpaper-overlay">
        <div class="wallpaper-actions">
          <button class="primary-btn preview-btn" data-id="${item.id}" data-type="${item.type}">Preview</button>
          <button class="secondary-btn download-btn" data-id="${item.id}" data-type="${item.type}">Download</button>
          <button class="icon-btn favorite-btn" data-id="${item.id}" data-type="${item.type}" title="Add to Favorites">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"></polygon>
            </svg>
          </button>
        </div>
      </div>
      <div class="wallpaper-info">
        <div class="wallpaper-photographer">${contentType} by ${item.photographer || 'Unknown'} on Pexels</div>
        <div class="wallpaper-size">${dimensions}</div>
      </div>
    `;

    // Add event listeners
    div.querySelector('.preview-btn').addEventListener('click', () => {
      this.openPreviewModal(item);
    });

    div.querySelector('.download-btn').addEventListener('click', () => {
      this.downloadWallpaper(item, false);
    });

    div.querySelector('.favorite-btn').addEventListener('click', () => {
      this.toggleFavorite(item);
    });

    return div;
  }

  async loadLocalWallpapers() {
    try {
      this.localWallpapers = await window.electronAPI.getLocalWallpapers();
      this.renderLocalGrid();
    } catch (error) {
      console.error('Failed to load local wallpapers:', error);
      this.showToast('Failed to load local wallpapers', 'error');
    }
  }

  renderLocalGrid() {
    const grid = document.getElementById('localGrid');
    grid.innerHTML = '';

    if (this.localWallpapers.length === 0) {
      grid.innerHTML = `
        <div class="empty-state">
          <p>No local wallpapers found. Upload some to get started!</p>
        </div>
      `;
      return;
    }

    this.localWallpapers.forEach(wallpaper => {
      const wallpaperElement = this.createLocalWallpaperElement(wallpaper);
      grid.appendChild(wallpaperElement);
    });
  }

  createLocalWallpaperElement(wallpaper) {
    const div = document.createElement('div');
    div.className = 'wallpaper-item';
    
    div.innerHTML = `
      <img src="${wallpaper.thumbnailPath}" alt="${wallpaper.name}" class="wallpaper-image">
      <div class="wallpaper-overlay">
        <div class="wallpaper-actions">
          <button class="primary-btn set-wallpaper-btn" data-path="${wallpaper.path}">Set as Wallpaper</button>
          <button class="secondary-btn delete-btn" data-id="${wallpaper.id}">Delete</button>
        </div>
      </div>
      <div class="wallpaper-info">
        <div class="wallpaper-photographer">${wallpaper.name}</div>
        <div class="wallpaper-size">${wallpaper.size}</div>
      </div>
    `;

    // Add event listeners
    div.querySelector('.set-wallpaper-btn').addEventListener('click', () => {
      this.setWallpaper(wallpaper.path);
    });

    div.querySelector('.delete-btn').addEventListener('click', () => {
      this.deleteLocalWallpaper(wallpaper.id);
    });

    return div;
  }

  showLoading(show) {
    const indicator = document.getElementById('loadingIndicator');
    indicator.style.display = show ? 'flex' : 'none';
  }

  showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    
    container.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
  }

  closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
  }

  async openSettingsModal() {
    await this.updateCacheSize();
    this.openModal('settingsModal');
  }

  async updateCacheSize() {
    try {
      const size = await window.electronAPI.getCacheSize();
      document.getElementById('cacheSize').textContent = this.formatFileSize(size);
    } catch (error) {
      document.getElementById('cacheSize').textContent = 'Unknown';
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  async clearCache() {
    try {
      await window.electronAPI.clearCache();
      await this.updateCacheSize();
      this.showToast('Cache cleared successfully');
    } catch (error) {
      this.showToast('Failed to clear cache', 'error');
    }
  }

  async uploadLocalWallpapers() {
    try {
      const result = await window.electronAPI.uploadLocalWallpaper();
      if (result) {
        await this.loadLocalWallpapers();
        this.showToast(`Uploaded ${result.length} wallpaper(s) successfully`);
      }
    } catch (error) {
      this.showToast('Failed to upload wallpapers', 'error');
    }
  }

  async deleteLocalWallpaper(wallpaperId) {
    try {
      await window.electronAPI.deleteLocalWallpaper(wallpaperId);
      await this.loadLocalWallpapers();
      this.showToast('Wallpaper deleted successfully');
    } catch (error) {
      this.showToast('Failed to delete wallpaper', 'error');
    }
  }

  async downloadWallpaper(item, setAsWallpaper = false) {
    try {
      let url, filename, extension;

      if (item.type === 'photo') {
        url = item.src?.original || item.src?.large || item.src?.medium;
        extension = 'jpg';
      } else if (item.type === 'video') {
        // Find the highest quality video file
        const videoFiles = item.video_files || [];
        const bestVideo = videoFiles.find(v => v.quality === 'hd') ||
                         videoFiles.find(v => v.quality === 'sd') ||
                         videoFiles[0];

        if (!bestVideo) {
          throw new Error('No video file available');
        }

        url = bestVideo.link;
        extension = bestVideo.file_type?.includes('mp4') ? 'mp4' : 'mov';
      } else {
        throw new Error('Unknown media type');
      }

      if (!url) {
        throw new Error('No download URL available');
      }

      filename = `${(item.photographer || 'wallpaper').replace(/[^a-zA-Z0-9]/g, '_')}_${item.id}.${extension}`;

      console.log(`Downloading ${item.type}: ${url}`);
      const filePath = await window.electronAPI.downloadWallpaper(url, filename);

      if (setAsWallpaper && item.type === 'photo') {
        // Only set photos as wallpaper for now
        await this.setWallpaper(filePath);
        this.showToast('Wallpaper set successfully');
      } else {
        this.showToast(`${item.type === 'photo' ? 'Image' : 'Video'} downloaded successfully`);
      }
    } catch (error) {
      console.error('Download error:', error);
      this.showToast(`Failed to download ${item.type || 'media'}`, 'error');
    }
  }

  async setWallpaper(imagePath) {
    try {
      await window.electronAPI.setWallpaper(imagePath);
      this.showToast('Wallpaper set successfully');
    } catch (error) {
      this.showToast('Failed to set wallpaper', 'error');
    }
  }

  openPreviewModal(item) {
    const modal = document.getElementById('previewModal');
    const container = document.getElementById('previewContainer');
    const title = document.getElementById('previewTitle');
    const attribution = document.getElementById('previewAttribution');

    const contentType = item.type === 'photo' ? 'Photo' : 'Video';
    title.textContent = item.alt || `${contentType} Preview`;
    attribution.innerHTML = `${contentType} by <a href="${item.photographer_url || '#'}" target="_blank">${item.photographer || 'Unknown'}</a> on <a href="https://www.pexels.com" target="_blank">Pexels</a>`;

    if (item.type === 'photo') {
      const imageUrl = item.src?.large || item.src?.medium || item.src?.small;
      container.innerHTML = `<img src="${imageUrl}" alt="${item.alt || 'Wallpaper'}" class="preview-image" style="max-width: 100%; max-height: 60vh; object-fit: contain;">`;
    } else if (item.type === 'video') {
      const videoFiles = item.video_files || [];
      const bestVideo = videoFiles.find(v => v.quality === 'hd') ||
                       videoFiles.find(v => v.quality === 'sd') ||
                       videoFiles[0];

      if (bestVideo) {
        container.innerHTML = `
          <video class="preview-video" controls style="max-width: 100%; max-height: 60vh;">
            <source src="${bestVideo.link}" type="${bestVideo.file_type || 'video/mp4'}">
            Your browser does not support the video tag.
          </video>
        `;
      } else {
        container.innerHTML = `<p>Video preview not available</p>`;
      }
    }

    // Set up action buttons
    const setWallpaperBtn = document.getElementById('setWallpaperBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // Only show "Set as Wallpaper" for photos
    if (item.type === 'video') {
      setWallpaperBtn.style.display = 'none';
    } else {
      setWallpaperBtn.style.display = 'inline-flex';
    }

    setWallpaperBtn.onclick = () => {
      this.downloadWallpaper(item, true);
      this.closeModal('previewModal');
    };

    downloadBtn.onclick = () => {
      this.downloadWallpaper(item, false);
      this.closeModal('previewModal');
    };

    this.openModal('previewModal');
  }

  toggleFavorite(item) {
    // TODO: Implement favorites functionality
    this.showToast('Favorites feature coming soon!');
  }

  loadFavorites() {
    // TODO: Implement favorites loading
    const grid = document.getElementById('favoritesGrid');
    grid.innerHTML = `
      <div class="empty-state">
        <p>Favorites feature coming soon!</p>
      </div>
    `;
  }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new WallpaperApp();
});
