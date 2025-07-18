# Wallpaper Manager

A cross-platform desktop application for managing wallpapers with Pexels API integration. Built with Electron for macOS and Windows compatibility.

## Features

### 🖼️ Pexels Integration
- Browse high-quality nature photography from Pexels
- Search functionality with custom keywords
- Filter by image/video type and orientation
- Automatic attribution display
- Rate limiting compliance (200 requests/hour, 20,000/month)

### 🏠 Local Wallpaper Management
- Upload and manage local images and videos
- Support for JPG, PNG, BMP, GIF (images) and MP4, MOV, AVI, MKV (videos)
- Automatic thumbnail generation
- File size validation (50MB for images, 200MB for videos)

### ⚙️ Wallpaper Setting
- Cross-platform wallpaper setting (macOS and Windows)
- Multi-monitor support
- Video wallpaper support (planned)
- One-click wallpaper application

### 🔄 Auto Wallpaper Change
- Automatic wallpaper rotation
- Configurable intervals (30 min to 24 hours)
- Random selection from Pexels or local collection
- Manual override controls

### 💾 Smart Caching
- Intelligent cache management
- LRU (Least Recently Used) cache cleanup
- Configurable cache size limits
- Manual cache clearing

### 🎨 Modern UI
- Clean, modern interface design
- Dark/light theme support (follows system preference)
- Responsive grid layout
- Infinite scroll loading
- Toast notifications

## Installation

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn package manager

### Setup

1. **Clone or download the project**
   ```bash
   cd wallpaper-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Pexels API**
   - Get your free API key from [Pexels API](https://www.pexels.com/api/)
   - Copy `.env.example` to `.env`
   - Add your API key to the `.env` file:
     ```
     PEXELS_API_KEY=your_actual_api_key_here
     ```

4. **Run the application**
   ```bash
   # Development mode
   npm run dev
   
   # Production mode
   npm start
   ```

### Building for Distribution

```bash
# Build for current platform
npm run build

# Build for macOS
npm run build:mac

# Build for Windows
npm run build:win
```

## Usage

### Getting Started
1. Launch the application
2. Browse wallpapers in the "Pexels" tab
3. Use the search bar to find specific types of wallpapers
4. Hover over any wallpaper to see action buttons:
   - **Preview**: View high-resolution version
   - **Set as Wallpaper**: Download and apply immediately
   - **Download Only**: Save to downloads folder

### Local Wallpapers
1. Switch to the "Local" tab
2. Click "Upload Wallpapers" to add your own images/videos
3. Manage your local collection with preview and delete options

### Settings
- Click the settings icon (⚙️) in the header
- Configure download paths
- Set up automatic wallpaper changes
- Manage cache settings

## Configuration

### Default Paths
- **Downloads**: `~/Wallpapers/Downloads`
- **Cache**: `~/Wallpapers/Cache`
- **Local Wallpapers**: `~/Wallpapers/Local`

### Supported Formats
- **Images**: JPG, JPEG, PNG, BMP, GIF
- **Videos**: MP4, MOV, AVI, MKV

### File Size Limits
- **Images**: 50MB maximum
- **Videos**: 200MB maximum

## API Compliance

This application complies with Pexels API terms:
- Displays proper attribution for all photos and videos
- Respects rate limits (200 requests/hour, 20,000/month)
- Includes "Photos provided by Pexels" attribution
- Links to photographer profiles and Pexels website

## Platform Support

### macOS
- **Minimum Version**: macOS 10.14.4
- **Wallpaper Setting**: Uses AppleScript and system APIs
- **Multi-monitor**: Full support

### Windows
- **Minimum Version**: Windows 10
- **Wallpaper Setting**: Uses PowerShell and Windows APIs
- **Multi-monitor**: Full support

## Development

### Project Structure
```
wallpaper-app/
├── main.js              # Electron main process
├── preload.js           # Secure IPC bridge
├── src/
│   ├── index.html       # Main UI
│   ├── css/
│   │   └── styles.css   # Application styles
│   └── js/
│       ├── app.js       # Frontend application logic
│       └── wallpaper-manager.js # Backend wallpaper management
├── config/
│   └── default.json     # Default configuration
└── package.json         # Dependencies and scripts
```

### Key Technologies
- **Electron**: Cross-platform desktop framework
- **Axios**: HTTP client for API requests
- **Sharp**: Image processing and thumbnail generation
- **electron-store**: Settings persistence
- **fs-extra**: Enhanced file system operations

### Security Features
- Context isolation enabled
- Node integration disabled in renderer
- Secure IPC communication via preload script
- External link handling through system browser

## Troubleshooting

### Common Issues

1. **API Key Not Working**
   - Verify your Pexels API key is correct
   - Check that the `.env` file is in the root directory
   - Ensure no extra spaces in the API key

2. **Wallpaper Not Setting**
   - On macOS: Check System Preferences > Security & Privacy
   - On Windows: Ensure the app has permission to modify system settings

3. **Cache Issues**
   - Use the "Clear Cache" button in settings
   - Manually delete the cache folder if needed

4. **Performance Issues**
   - Reduce cache size in settings
   - Disable video wallpapers if experiencing lag
   - Close other resource-intensive applications

### Logs
Application logs are available in:
- **macOS**: `~/Library/Logs/Wallpaper Manager/`
- **Windows**: `%USERPROFILE%\AppData\Roaming\Wallpaper Manager\logs\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on both macOS and Windows if possible
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Acknowledgments

- [Pexels](https://www.pexels.com) for providing the amazing photography API
- [Electron](https://electronjs.org) for the cross-platform framework
- All the photographers who contribute to Pexels

## Support

For issues and feature requests, please create an issue in the project repository.
