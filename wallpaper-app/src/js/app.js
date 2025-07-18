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
        if (scrollTop + clientHeight >= scrollHeight - 1000) {
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
      this.searchQuery = query;
      this.currentPage = 1;
      this.wallpapers = [];
      await this.loadPexelsContent();
    }
  }

  async refreshCurrentTab() {
    if (this.currentTab === 'pexels') {
      this.currentPage = 1;
      this.wallpapers = [];
      await this.loadPexelsContent();
    }
  }

  async loadPexelsContent() {
    if (this.isLoading) return;
    
    this.isLoading = true;
    this.showLoading(true);

    try {
      let newContent = [];
      
      if (this.currentFilter.type === 'all' || this.currentFilter.type === 'photos') {
        const photos = await window.electronAPI.getPexelsPhotos(this.searchQuery, this.currentPage);
        newContent = [...newContent, ...photos.photos.map(photo => ({ ...photo, type: 'photo' }))];
      }
      
      if (this.currentFilter.type === 'all' || this.currentFilter.type === 'videos') {
        const videos = await window.electronAPI.getPexelsVideos(this.searchQuery, this.currentPage);
        newContent = [...newContent, ...videos.videos.map(video => ({ ...video, type: 'video' }))];
      }

      // Filter by orientation
      if (this.currentFilter.orientation !== 'all') {
        newContent = newContent.filter(item => {
          if (item.type === 'photo') {
            return item.width > item.height ? 'landscape' : 'portrait';
          }
          return true; // Videos don't have orientation filter for now
        });
      }

      if (this.currentPage === 1) {
        this.wallpapers = newContent;
      } else {
        this.wallpapers = [...this.wallpapers, ...newContent];
      }

      this.renderPexelsGrid();
      this.currentPage++;
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
    }

    this.wallpapers.forEach((item, index) => {
      if (this.currentPage > 1 && index < this.wallpapers.length - 15) {
        return; // Skip already rendered items
      }

      const wallpaperElement = this.createWallpaperElement(item);
      grid.appendChild(wallpaperElement);
    });
  }

  createWallpaperElement(item) {
    const div = document.createElement('div');
    div.className = 'wallpaper-item';
    
    const imageUrl = item.type === 'photo' ? item.src.medium : item.video_files[0].link;
    const thumbnailUrl = item.type === 'photo' ? item.src.small : item.image;
    
    div.innerHTML = `
      <img src="${thumbnailUrl}" alt="${item.alt || 'Wallpaper'}" class="wallpaper-image" loading="lazy">
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
        <div class="wallpaper-photographer">Photo by ${item.photographer || 'Unknown'} on Pexels</div>
        <div class="wallpaper-size">${item.width || ''}x${item.height || ''}</div>
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
      const url = item.type === 'photo' ? item.src.original : item.video_files[0].link;
      const filename = `${item.photographer || 'wallpaper'}_${item.id}.${item.type === 'photo' ? 'jpg' : 'mp4'}`;
      
      const filePath = await window.electronAPI.downloadWallpaper(url, filename);
      
      if (setAsWallpaper) {
        await this.setWallpaper(filePath);
        this.showToast('Wallpaper set successfully');
      } else {
        this.showToast('Wallpaper downloaded successfully');
      }
    } catch (error) {
      this.showToast('Failed to download wallpaper', 'error');
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
    
    title.textContent = item.alt || 'Wallpaper Preview';
    attribution.innerHTML = `Photo by <a href="${item.photographer_url || '#'}" target="_blank">${item.photographer || 'Unknown'}</a> on <a href="https://www.pexels.com" target="_blank">Pexels</a>`;
    
    if (item.type === 'photo') {
      container.innerHTML = `<img src="${item.src.large}" alt="${item.alt || 'Wallpaper'}" class="preview-image">`;
    } else {
      container.innerHTML = `<video src="${item.video_files[0].link}" class="preview-video" controls></video>`;
    }
    
    // Set up action buttons
    document.getElementById('setWallpaperBtn').onclick = () => {
      this.downloadWallpaper(item, true);
      this.closeModal('previewModal');
    };
    
    document.getElementById('downloadBtn').onclick = () => {
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
