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

4. **Test the API connection (optional)**
   ```bash
   npm run test-api
   ```

5. **Run the application**
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

1. **Limited Wallpapers Showing / Only 2 Pages**
   - **Solution**: This was fixed in the latest update. Each page now loads 30 items instead of 15
   - **Test**: Run `npm run test-api` to verify your API connection
   - **Check**: Make sure you're using the latest version of the app

2. **Filtering Not Working**
   - **Solution**: Orientation and type filters have been fixed
   - **Note**: Filters now properly apply to both photos and videos
   - **Try**: Switch between "All Types", "Photos", and "Videos" in the filter dropdown

3. **Video Features Not Working**
   - **Solution**: Video support has been enhanced with proper thumbnails and previews
   - **Features**: Videos now show a play icon overlay and can be previewed in the modal
   - **Note**: Video wallpaper setting is not yet supported (photos only)

4. **API Key Not Working**
   - **Test**: Run `npm run test-api` to verify your API key
   - **Check**: Verify your Pexels API key is correct in the `.env` file
   - **Ensure**: No extra spaces or quotes around the API key
   - **Rate Limits**: Free accounts have 200 requests/hour limit

5. **No Wallpapers Loading**
   - **Check Internet**: Ensure you have a stable internet connection
   - **API Status**: Visit https://www.pexels.com/api/ to check if the service is down
   - **Console**: Open Developer Tools (F12) and check for error messages
   - **Test**: Try different search terms like "mountain", "forest", "ocean"

6. **Wallpaper Not Setting**
   - **macOS**: Check System Preferences > Security & Privacy > Accessibility
   - **Windows**: Run the app as administrator if needed
   - **File Path**: Ensure the downloaded image file exists and is accessible

7. **Infinite Scroll Not Working**
   - **Solution**: Scroll threshold has been reduced from 1000px to 500px
   - **Try**: Scroll closer to the bottom of the page
   - **Check**: Look for the loading indicator at the bottom

8. **Cache Issues**
   - **Clear Cache**: Use the "Clear Cache" button in settings
   - **Manual**: Delete the `~/Wallpapers/Cache` folder manually if needed
   - **Size**: Check cache size in settings (default limit: 500MB)

9. **Performance Issues**
   - **Cache**: Reduce cache size in settings
   - **Videos**: Disable video loading if experiencing lag
   - **Memory**: Close other resource-intensive applications
   - **Hardware**: Ensure your system meets minimum requirements

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
