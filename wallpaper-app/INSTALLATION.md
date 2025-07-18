# Wallpaper Manager - Installation Guide

This guide will walk you through setting up the Wallpaper Manager application on your system.

## Quick Start

### 1. Prerequisites Check

Before installing, ensure you have:
- **Node.js 16.0.0 or higher** - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Git** (optional, for cloning)

Check your versions:
```bash
node --version  # Should be 16.0.0 or higher
npm --version   # Should be 6.0.0 or higher
```

### 2. Download and Setup

#### Option A: Download ZIP
1. Download the project ZIP file
2. Extract to your desired location
3. Open terminal/command prompt in the extracted folder

#### Option B: Clone with Git
```bash
git clone <repository-url>
cd wallpaper-app
```

### 3. Automatic Setup

Run the setup script:
```bash
npm run setup
```

This will:
- Install all dependencies
- Create necessary directories
- Set up environment files
- Configure platform-specific features

### 4. Get Pexels API Key

1. Visit [Pexels API](https://www.pexels.com/api/)
2. Sign up for a free account
3. Generate your API key
4. Open the `.env` file in the project root
5. Replace `your_pexels_api_key_here` with your actual API key:
   ```
   PEXELS_API_KEY=your_actual_api_key_here
   ```

### 5. Launch the Application

```bash
npm start
```

## Manual Installation

If the automatic setup doesn't work, follow these manual steps:

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Directories

Create these directories in your home folder:
- `~/Wallpapers/Downloads`
- `~/Wallpapers/Cache`
- `~/Wallpapers/Local`

**Windows:**
```cmd
mkdir "%USERPROFILE%\Wallpapers\Downloads"
mkdir "%USERPROFILE%\Wallpapers\Cache"
mkdir "%USERPROFILE%\Wallpapers\Local"
```

**macOS/Linux:**
```bash
mkdir -p ~/Wallpapers/{Downloads,Cache,Local}
```

### 3. Environment Configuration

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env` and add your Pexels API key.

### 4. Platform-Specific Setup

#### macOS
Ensure you have permission to change wallpapers:
1. Go to System Preferences > Security & Privacy
2. Click Privacy tab
3. Select "Accessibility" from the left sidebar
4. Add the Terminal app (or your terminal of choice)

#### Windows
No additional setup required. The app will request permissions as needed.

## Development Setup

For developers who want to modify the application:

### 1. Install Development Dependencies

```bash
npm install --include=dev
```

### 2. Run in Development Mode

```bash
npm run dev
```

This enables:
- Hot reloading
- Developer tools
- Verbose logging

### 3. Run Tests

```bash
npm test
```

### 4. Code Linting

```bash
npm run lint
```

## Building for Distribution

### Build for Current Platform
```bash
npm run build
```

### Build for Specific Platforms
```bash
# macOS
npm run build:mac

# Windows
npm run build:win
```

Built applications will be in the `dist/` folder.

## Troubleshooting

### Common Issues

#### "Node.js version too old"
- Update Node.js to version 16.0.0 or higher
- Use [Node Version Manager (nvm)](https://github.com/nvm-sh/nvm) for easy version management

#### "Permission denied" on macOS
- Grant accessibility permissions to your terminal
- Try running with `sudo` (not recommended for regular use)

#### "API key not working"
- Verify your Pexels API key is correct
- Check for extra spaces or characters
- Ensure the `.env` file is in the project root

#### "Wallpaper not setting"
- **macOS**: Check System Preferences > Security & Privacy > Accessibility
- **Windows**: Run as administrator if needed
- Verify the image file exists and is accessible

#### "Application won't start"
- Check Node.js version: `node --version`
- Reinstall dependencies: `rm -rf node_modules && npm install`
- Check for error messages in the terminal

### Getting Help

1. **Check the logs**: Look for error messages in the terminal
2. **Verify setup**: Run `npm run setup` again
3. **Test installation**: Run `npm test`
4. **Check permissions**: Ensure the app has necessary system permissions

### Log Locations

Application logs are stored in:
- **macOS**: `~/Library/Logs/Wallpaper Manager/`
- **Windows**: `%USERPROFILE%\AppData\Roaming\Wallpaper Manager\logs\`

## Uninstallation

To completely remove the application:

1. **Delete the application folder**
2. **Remove wallpaper directories** (optional):
   ```bash
   rm -rf ~/Wallpapers
   ```
3. **Remove logs** (optional):
   - macOS: `rm -rf ~/Library/Logs/Wallpaper\ Manager/`
   - Windows: Delete `%USERPROFILE%\AppData\Roaming\Wallpaper Manager\`

## System Requirements

### Minimum Requirements
- **OS**: macOS 10.14.4+ or Windows 10+
- **RAM**: 4GB
- **Storage**: 1GB free space
- **Network**: Internet connection for downloading wallpapers

### Recommended Requirements
- **OS**: macOS 11+ or Windows 11+
- **RAM**: 8GB
- **Storage**: 5GB free space (for cache and downloads)
- **Network**: Broadband internet connection

## Security Notes

- The application only accesses Pexels API and local file system
- No personal data is collected or transmitted
- API key is stored locally and encrypted
- All downloads are scanned by your system's security software

## Next Steps

After successful installation:
1. Browse wallpapers in the Pexels tab
2. Upload your own wallpapers in the Local tab
3. Configure auto-change settings
4. Explore keyboard shortcuts
5. Customize download paths in settings

For detailed usage instructions, see the main [README.md](README.md) file.
