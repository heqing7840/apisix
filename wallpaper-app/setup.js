#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

class WallpaperAppSetup {
  constructor() {
    this.projectRoot = __dirname;
    this.homeDir = os.homedir();
    this.platform = os.platform();
  }

  async run() {
    console.log('🖼️  Wallpaper Manager Setup');
    console.log('==========================\n');

    try {
      await this.checkPrerequisites();
      await this.createDirectories();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.setupPlatformSpecific();
      await this.finalizeSetup();
      
      console.log('\n✅ Setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Get your Pexels API key from: https://www.pexels.com/api/');
      console.log('2. Add it to the .env file');
      console.log('3. Run: npm start');
      
    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
    
    if (majorVersion < 16) {
      throw new Error(`Node.js 16.0.0 or higher is required. Current version: ${nodeVersion}`);
    }
    
    console.log(`✓ Node.js ${nodeVersion} detected`);
    
    // Check npm
    try {
      const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
      console.log(`✓ npm ${npmVersion} detected`);
    } catch (error) {
      throw new Error('npm is not installed or not in PATH');
    }
    
    // Check platform support
    if (!['darwin', 'win32'].includes(this.platform)) {
      console.warn(`⚠️  Platform ${this.platform} is not officially supported. Proceeding anyway...`);
    } else {
      console.log(`✓ Platform ${this.platform} is supported`);
    }
  }

  async createDirectories() {
    console.log('\n📁 Creating application directories...');
    
    const directories = [
      path.join(this.homeDir, 'Wallpapers'),
      path.join(this.homeDir, 'Wallpapers', 'Downloads'),
      path.join(this.homeDir, 'Wallpapers', 'Cache'),
      path.join(this.homeDir, 'Wallpapers', 'Local')
    ];
    
    for (const dir of directories) {
      await fs.ensureDir(dir);
      console.log(`✓ Created: ${dir}`);
    }
  }

  async setupEnvironment() {
    console.log('\n⚙️  Setting up environment...');
    
    const envPath = path.join(this.projectRoot, '.env');
    const envExamplePath = path.join(this.projectRoot, '.env.example');
    
    if (!await fs.pathExists(envPath)) {
      if (await fs.pathExists(envExamplePath)) {
        await fs.copy(envExamplePath, envPath);
        console.log('✓ Created .env file from template');
      } else {
        // Create basic .env file
        const envContent = `# Pexels API Configuration
PEXELS_API_KEY=your_pexels_api_key_here

# Application Environment
NODE_ENV=production

# Download Configuration
DEFAULT_DOWNLOAD_PATH=${path.join(this.homeDir, 'Wallpapers', 'Downloads')}
CACHE_PATH=${path.join(this.homeDir, 'Wallpapers', 'Cache')}
LOCAL_WALLPAPERS_PATH=${path.join(this.homeDir, 'Wallpapers', 'Local')}
`;
        await fs.writeFile(envPath, envContent);
        console.log('✓ Created basic .env file');
      }
    } else {
      console.log('✓ .env file already exists');
    }
  }

  async installDependencies() {
    console.log('\n📦 Installing dependencies...');
    
    try {
      console.log('Installing npm packages...');
      execSync('npm install', { 
        cwd: this.projectRoot, 
        stdio: 'inherit' 
      });
      console.log('✓ Dependencies installed successfully');
    } catch (error) {
      throw new Error('Failed to install dependencies. Please run "npm install" manually.');
    }
  }

  async setupPlatformSpecific() {
    console.log('\n🖥️  Setting up platform-specific features...');
    
    if (this.platform === 'darwin') {
      await this.setupMacOS();
    } else if (this.platform === 'win32') {
      await this.setupWindows();
    }
  }

  async setupMacOS() {
    console.log('Setting up macOS features...');
    
    // Check for required tools
    try {
      execSync('which osascript', { stdio: 'ignore' });
      console.log('✓ AppleScript support available');
    } catch (error) {
      console.warn('⚠️  AppleScript not available - wallpaper setting may not work');
    }
    
    try {
      execSync('which sqlite3', { stdio: 'ignore' });
      console.log('✓ SQLite3 available for desktop database access');
    } catch (error) {
      console.warn('⚠️  SQLite3 not available - fallback wallpaper setting may not work');
    }
  }

  async setupWindows() {
    console.log('Setting up Windows features...');
    
    // Check PowerShell availability
    try {
      execSync('powershell -Command "Get-Host"', { stdio: 'ignore' });
      console.log('✓ PowerShell available for wallpaper setting');
    } catch (error) {
      console.warn('⚠️  PowerShell not available - wallpaper setting may not work');
    }
  }

  async finalizeSetup() {
    console.log('\n🎯 Finalizing setup...');
    
    // Create desktop shortcut (optional)
    if (this.platform === 'win32') {
      // Windows shortcut creation would go here
      console.log('✓ Windows setup completed');
    } else if (this.platform === 'darwin') {
      // macOS app bundle setup would go here
      console.log('✓ macOS setup completed');
    }
    
    // Verify installation
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const mainJsPath = path.join(this.projectRoot, 'main.js');
    
    if (!await fs.pathExists(packageJsonPath)) {
      throw new Error('package.json not found');
    }
    
    if (!await fs.pathExists(mainJsPath)) {
      throw new Error('main.js not found');
    }
    
    console.log('✓ Installation verified');
  }
}

// Run setup if called directly
if (require.main === module) {
  const setup = new WallpaperAppSetup();
  setup.run().catch(error => {
    console.error('Setup failed:', error);
    process.exit(1);
  });
}

module.exports = WallpaperAppSetup;
