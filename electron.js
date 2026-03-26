/**
 * DeadBYTE - Electron Main Process
 * =================================
 * Main process entry point for the Electron application.
 * Handles window creation, IPC communication, and backend services.
 */

const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

// Disable sandbox to prevent crashes when running as Administrator
app.commandLine.appendSwitch('no-sandbox');

// Import backend services
const driveService = require('./backend/driveService');
const fileService = require('./backend/fileService');
const permissionService = require('./backend/permissionService');
const processService = require('./backend/processService');
const ownershipService = require('./backend/ownershipService');
const forceDeleteService = require('./backend/forceDeleteService');
const logService = require('./backend/logService');
const adminService = require('./backend/adminService');
const settingsService = require('./backend/settingsService');
const systemService = require('./backend/systemService');
const startupService = require('./backend/startupService');
const junkService = require('./backend/junkService');
const maintenanceService = require('./backend/maintenanceService');
const serviceService = require('./backend/serviceService');

// Keep a global reference of the window object
let mainWindow = null;

// ============================================
// DEBUG MODE
// ============================================
const DEBUG_MODE = false;
const log = (...args) => DEBUG_MODE && console.log('[Main]', ...args);

// Cached admin status (checked async after window shows)
let cachedAdminStatus = null;

// Check if running as administrator (Windows) - ASYNC version
async function checkAdminStatusAsync() {
  if (cachedAdminStatus !== null) return cachedAdminStatus;
  if (process.platform !== 'win32') {
    cachedAdminStatus = false;
    return false;
  }

  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execPromise = util.promisify(exec);
    await execPromise('net session', { timeout: 2000 });
    cachedAdminStatus = true;
    return true;
  } catch (e) {
    cachedAdminStatus = false;
    return false;
  }
}

// Create the main application window
function createWindow() {
  // Don't block on admin check - do it async after window shows

  // Get the correct app path
  const appPath = app.getAppPath();
  log('App path:', appPath);
  log('__dirname:', __dirname);

  mainWindow = new BrowserWindow({
    width: 1400,
    height: 940,
    minWidth: 1410,
    minHeight: 940,
    frame: false, // Frameless window for custom titlebar
    backgroundColor: '#000000',
    icon: path.join(appPath, 'src', 'assets', 'skull', 'skull.ico'),
    webPreferences: {
      preload: path.join(appPath, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Required for some system operations
      webSecurity: true,
      devTools: false
    },
    show: true // Show immediately for debugging
  });

  // Load the main HTML file
  const htmlPath = path.join(appPath, 'src', 'index.html');
  log('Loading HTML from:', htmlPath);

  // Check if file exists
  if (fs.existsSync(htmlPath)) {
    log('HTML file exists!');
  } else {
    console.error('HTML file NOT FOUND at:', htmlPath);
  }

  mainWindow.loadFile(htmlPath).then(() => {
    log('HTML loaded successfully');
  }).catch((err) => {
    console.error('Failed to load HTML:', err);
  });

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    log('Window ready to show');
    mainWindow.show();
    mainWindow.focus();

    // Check admin status ASYNC - don't block window display
    checkAdminStatusAsync().then(isAdmin => {
      mainWindow.webContents.send('sys:adminStatus', { isAdmin });
    });

    // Start drive monitoring for hot plug detection
    startDriveMonitoring();
  });

  // Log any page errors
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('Page failed to load:', errorCode, errorDescription);
  });

  mainWindow.webContents.on('crashed', () => {
    console.error('Renderer process crashed');
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    stopDriveMonitoring();
    mainWindow = null;
  });

  // Prevent navigation to external URLs
  mainWindow.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('file://')) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });
}

// ============================================
// DRIVE MONITORING - Hot Plug Detection
// ============================================

let driveMonitorInterval = null;
let previousDriveList = [];

// Start monitoring for drive changes
function startDriveMonitoring() {
  if (driveMonitorInterval) return; // Already running

  log('Starting drive monitoring...');

  // Get initial drive list
  driveService.getAllDrives().then(result => {
    if (result.success && result.data) {
      previousDriveList = result.data.map(d => d.letter);
      log('Initial drives:', previousDriveList);
    }
  });

  // Poll every 2 seconds
  driveMonitorInterval = setInterval(async () => {
    try {
      const result = await driveService.getAllDrives();
      if (!result.success || !result.data) return;

      const currentDrives = result.data;
      const currentLetters = currentDrives.map(d => d.letter);

      // Check for new drives
      const addedDrives = currentDrives.filter(d => !previousDriveList.includes(d.letter));

      // Check for removed drives
      const removedLetters = previousDriveList.filter(letter => !currentLetters.includes(letter));

      // Emit events if changes detected
      if (addedDrives.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
        addedDrives.forEach(drive => {
          log('Drive added:', drive.letter);
          mainWindow.webContents.send('drives:added', drive);
        });
      }

      if (removedLetters.length > 0 && mainWindow && !mainWindow.isDestroyed()) {
        removedLetters.forEach(letter => {
          log('Drive removed:', letter);
          mainWindow.webContents.send('drives:removed', letter);
        });
      }

      // Send full update if any changes occurred (for space updates too)
      if ((addedDrives.length > 0 || removedLetters.length > 0) && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('drives:updated', currentDrives);
      }

      // Update previous list
      previousDriveList = currentLetters;

    } catch (error) {
      // Silently ignore polling errors
    }
  }, 2000);
}

// Stop drive monitoring
function stopDriveMonitoring() {
  if (driveMonitorInterval) {
    clearInterval(driveMonitorInterval);
    driveMonitorInterval = null;
    log('Drive monitoring stopped');
  }
}

// ============================================
// IPC HANDLERS - Window Controls
// ============================================

ipcMain.on('window:minimize', () => {
  if (mainWindow) mainWindow.minimize();
});

ipcMain.on('window:maximize', () => {
  if (mainWindow) {
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow.maximize();
    }
  }
});

ipcMain.on('window:close', () => {
  if (mainWindow) mainWindow.close();
});

ipcMain.handle('window:isMaximized', () => {
  return mainWindow ? mainWindow.isMaximized() : false;
});

// Open URL in external browser
ipcMain.handle('shell:openExternal', async (event, url) => {
  if (url && (url.startsWith('https://') || url.startsWith('http://') || url.startsWith('mailto:'))) {
    await shell.openExternal(url);
    return { success: true };
  }
  return { success: false, message: 'Invalid URL' };
});

// ============================================
// IPC HANDLERS - Dialog
// ============================================

ipcMain.handle('dialog:openFolder', async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory'],
    title: 'Select Folder to Scan'
  });

  return result;
});

ipcMain.handle('dialog:openFile', async () => {
  if (!mainWindow) return { canceled: true };

  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    title: 'Select Files'
  });

  return result;
});

// ============================================
// IPC HANDLERS - System Info
// ============================================

ipcMain.handle('sys:isAdmin', async () => {
  return await adminService.isRunningAsAdmin();
});

ipcMain.handle('sys:platform', () => {
  return process.platform;
});

// ============================================
// IPC HANDLERS - Drive Service
// ============================================

ipcMain.handle('drives:get', async () => {
  return await driveService.getAllDrives();
});

ipcMain.handle('drives:info', async (event, driveLetter) => {
  return await driveService.getDriveInfo(driveLetter);
});

ipcMain.handle('drives:refresh', async () => {
  return await driveService.refreshDrives();
});

// ============================================
// IPC HANDLERS - File Service
// ============================================

ipcMain.handle('files:scan', async (event, dirPath, options) => {
  return await fileService.scanDirectory(dirPath, options);
});

ipcMain.handle('files:details', async (event, filePath) => {
  return await fileService.getFileDetails(filePath);
});

ipcMain.handle('files:status', async (event, filePath) => {
  return await fileService.getFileStatus(filePath);
});

ipcMain.handle('files:delete', async (event, filePath, options) => {
  return await fileService.deleteFile(filePath, options);
});

ipcMain.handle('files:save', async (event, filename, content, options = {}) => {
  try {
    const filters = options.html
      ? [{ name: 'HTML Files', extensions: ['html'] }, { name: 'All Files', extensions: ['*'] }]
      : [{ name: 'Text Files', extensions: ['txt'] }, { name: 'All Files', extensions: ['*'] }];

    const result = await dialog.showSaveDialog(mainWindow, {
      title: 'Save Report',
      defaultPath: filename,
      filters
    });

    if (result.canceled || !result.filePath) {
      return { success: false, canceled: true };
    }

    fs.writeFileSync(result.filePath, content, 'utf8');
    return { success: true, path: result.filePath };
  } catch (error) {
    return { success: false, message: error.message };
  }
});

// ============================================
// IPC HANDLERS - Permission Service
// ============================================

ipcMain.handle('perms:get', async (event, filePath) => {
  return await permissionService.getPermissions(filePath);
});

ipcMain.handle('perms:set', async (event, filePath, options) => {
  return await permissionService.setPermissions(filePath, options);
});

ipcMain.handle('perms:remove', async (event, filePath, identity) => {
  return await permissionService.removePermission(filePath, identity);
});

ipcMain.handle('perms:reset', async (event, filePath) => {
  return await permissionService.resetPermissions(filePath);
});

ipcMain.handle('perms:grantFull', async (event, filePath) => {
  return await permissionService.grantFullControl(filePath);
});

// ============================================
// IPC HANDLERS - Process Service
// ============================================

ipcMain.handle('proc:locking', async (event, filePath) => {
  return await processService.findLockingProcesses(filePath);
});

ipcMain.handle('proc:kill', async (event, pid, options) => {
  return await processService.killProcess(pid, options);
});

ipcMain.handle('proc:killMultiple', async (event, pids, options) => {
  return await processService.killProcesses(pids, options);
});

ipcMain.handle('proc:info', async (event, pid) => {
  return await processService.getProcessInfo(pid);
});

ipcMain.handle('proc:list', async (event, options) => {
  return await processService.listProcesses(options);
});

ipcMain.handle('proc:killAll', async (event, filePath, options) => {
  return await processService.killAllForFile(filePath, options);
});

ipcMain.handle('file:checkLock', async (event, filePath) => {
  return await processService.checkFileLock(filePath);
});

// ============================================
// IPC HANDLERS - Ownership Service
// ============================================

ipcMain.handle('owner:get', async (event, filePath) => {
  return await ownershipService.getOwner(filePath);
});

ipcMain.handle('owner:take', async (event, filePath, options) => {
  return await ownershipService.takeOwnership(filePath, options);
});

ipcMain.handle('owner:set', async (event, filePath, newOwner) => {
  return await ownershipService.setOwner(filePath, newOwner);
});

ipcMain.handle('owner:reset', async (event, filePath, options) => {
  return await ownershipService.resetOwnership(filePath, options);
});

ipcMain.handle('owner:options', async () => {
  return await ownershipService.getOwnerOptions();
});

// ============================================
// IPC HANDLERS - Force Delete Service
// ============================================

ipcMain.handle('file:force-delete', async (event, filePath, options) => {
  return await forceDeleteService.forceDelete(filePath, options);
});

ipcMain.handle('file:force-delete-multiple', async (event, filePaths, options) => {
  return await forceDeleteService.forceDeleteMultiple(filePaths, options);
});

ipcMain.handle('file:analyze', async (event, filePath) => {
  return await forceDeleteService.analyzeForDeletion(filePath);
});

// ============================================
// IPC HANDLERS - Log Service
// ============================================

ipcMain.handle('logs:get', async (event, options) => {
  return logService.getLogs(options);
});

ipcMain.handle('logs:clear', async () => {
  return logService.clearLogs();
});

ipcMain.handle('logs:stats', async () => {
  return logService.getLogStats();
});

ipcMain.handle('logs:export', async () => {
  return logService.exportLogs();
});

// ============================================
// IPC HANDLERS - Admin Service
// ============================================

ipcMain.handle('admin:check', async (event, forceRefresh) => {
  return await adminService.isRunningAsAdmin(forceRefresh);
});

ipcMain.handle('admin:user', async () => {
  return await adminService.getCurrentUser();
});

ipcMain.handle('admin:privileges', async () => {
  return await adminService.getPrivilegesStatus();
});

ipcMain.handle('admin:requiresAdmin', async (event, operation) => {
  return adminService.doesOperationRequireAdmin(operation);
});

// ============================================
// IPC HANDLERS - Update Checker
// ============================================

// Track active download for cancellation
let activeDownload = null;

ipcMain.handle('updates:check', async () => {
  const https = require('https');
  const currentVersion = require('./package.json').version;

  const GITHUB_API_URL = 'https://api.github.com/repos/moneraldabai-ui/DeadByte/releases/latest';
  const TIMEOUT_MS = 10000;

  return new Promise((resolve) => {
    const request = https.get(GITHUB_API_URL, {
      headers: {
        'User-Agent': 'DeadBYTE-App',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: TIMEOUT_MS
    }, (response) => {
      let data = '';

      // Handle redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        resolve({ success: false, error: 'REDIRECT', message: 'API redirect detected' });
        return;
      }

      // Handle rate limiting
      if (response.statusCode === 403) {
        resolve({ success: false, error: 'RATE_LIMITED', message: 'GitHub API rate limit exceeded. Please try again later.' });
        return;
      }

      // Handle not found (no releases)
      if (response.statusCode === 404) {
        resolve({ success: false, error: 'NO_RELEASES', message: 'No releases found on GitHub.' });
        return;
      }

      // Handle other errors
      if (response.statusCode !== 200) {
        resolve({ success: false, error: 'UNKNOWN', message: `GitHub API returned status ${response.statusCode}` });
        return;
      }

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          const latestVersion = (release.tag_name || '').replace(/^v/, '');
          const releaseUrl = release.html_url || '';
          const releaseNotes = release.body || 'No release notes available.';
          const publishedAt = release.published_at ? new Date(release.published_at).toLocaleDateString() : '';

          // Extract Windows installer from assets (prefer installer over portable)
          const windowsAsset = release.assets?.find(a =>
            (a.name.endsWith('.exe') && a.name.includes('win-x64')) || a.name.endsWith('.msi')
          ) || release.assets?.find(a => a.name.endsWith('.exe'));

          // Compare versions
          const isUpToDate = compareVersions(currentVersion, latestVersion) >= 0;

          resolve({
            success: true,
            currentVersion,
            latestVersion,
            isUpToDate,
            releaseUrl,
            releaseNotes,
            publishedAt,
            downloadUrl: windowsAsset?.browser_download_url || null,
            downloadSize: windowsAsset?.size || 0,
            fileName: windowsAsset?.name || null
          });
        } catch (parseError) {
          resolve({ success: false, error: 'UNKNOWN', message: 'Failed to parse GitHub response' });
        }
      });
    });

    request.on('error', (error) => {
      if (error.code === 'ENOTFOUND' || error.code === 'EAI_AGAIN') {
        resolve({ success: false, error: 'NO_INTERNET', message: 'No internet connection. Please check your network and try again.' });
      } else if (error.code === 'ETIMEDOUT' || error.code === 'ESOCKETTIMEDOUT') {
        resolve({ success: false, error: 'TIMEOUT', message: 'Request timed out. Please try again.' });
      } else {
        resolve({ success: false, error: 'UNKNOWN', message: `Network error: ${error.message}` });
      }
    });

    request.on('timeout', () => {
      request.destroy();
      resolve({ success: false, error: 'TIMEOUT', message: 'Request timed out. Please try again.' });
    });
  });
});

// Download update installer with progress tracking
ipcMain.handle('updates:download', async (event, url, fileName) => {
  const https = require('https');
  const http = require('http');
  const os = require('os');

  if (!url || !fileName) {
    return { success: false, error: 'INVALID_PARAMS', message: 'Missing download URL or filename' };
  }

  const tempDir = os.tmpdir();
  const filePath = path.join(tempDir, fileName);

  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;

    const downloadFile = (downloadUrl) => {
      const request = protocol.get(downloadUrl, {
        headers: {
          'User-Agent': 'DeadBYTE-App'
        },
        timeout: 600000 // 10 minutes timeout for large files
      }, (response) => {
        // Handle redirects (GitHub uses these for asset downloads)
        if (response.statusCode === 301 || response.statusCode === 302) {
          const redirectUrl = response.headers.location;
          if (redirectUrl) {
            downloadFile(redirectUrl);
            return;
          }
        }

        if (response.statusCode !== 200) {
          resolve({ success: false, error: 'DOWNLOAD_FAILED', message: `Server returned ${response.statusCode}` });
          return;
        }

        const totalSize = parseInt(response.headers['content-length'], 10) || 0;
        let downloadedSize = 0;

        // Create write stream
        const writeStream = fs.createWriteStream(filePath);

        // Store for cancellation
        activeDownload = { request, writeStream, filePath };

        response.on('data', (chunk) => {
          downloadedSize += chunk.length;
          writeStream.write(chunk);

          // Send progress to renderer
          if (mainWindow && !mainWindow.isDestroyed()) {
            const progress = totalSize > 0 ? Math.round((downloadedSize / totalSize) * 100) : 0;
            mainWindow.webContents.send('updates:downloadProgress', {
              downloaded: downloadedSize,
              total: totalSize,
              progress
            });
          }
        });

        response.on('end', () => {
          writeStream.end();
          activeDownload = null;
          resolve({
            success: true,
            filePath,
            fileName,
            size: downloadedSize
          });
        });

        response.on('error', (err) => {
          writeStream.end();
          activeDownload = null;
          // Clean up partial download
          try { fs.unlinkSync(filePath); } catch (e) {}
          resolve({ success: false, error: 'DOWNLOAD_FAILED', message: err.message });
        });
      });

      request.on('error', (err) => {
        activeDownload = null;
        resolve({ success: false, error: 'DOWNLOAD_FAILED', message: err.message });
      });

      request.on('timeout', () => {
        request.destroy();
        activeDownload = null;
        resolve({ success: false, error: 'TIMEOUT', message: 'Download timed out' });
      });

      // Set socket timeout to 10 minutes (for slow connections)
      request.setTimeout(600000);
    };

    downloadFile(url);
  });
});

// Cancel active download
ipcMain.handle('updates:cancelDownload', async () => {
  if (activeDownload) {
    try {
      activeDownload.request.destroy();
      activeDownload.writeStream.end();
      // Clean up partial file
      try { fs.unlinkSync(activeDownload.filePath); } catch (e) {}
      activeDownload = null;
      return { success: true, message: 'Download cancelled' };
    } catch (err) {
      return { success: false, message: err.message };
    }
  }
  return { success: false, message: 'No active download' };
});

// Install downloaded update
ipcMain.handle('updates:install', async (event, filePath) => {
  if (!filePath || !fs.existsSync(filePath)) {
    return { success: false, error: 'FILE_NOT_FOUND', message: 'Installer file not found' };
  }

  try {
    // Execute the installer
    const { exec } = require('child_process');
    exec(`"${filePath}"`, (error) => {
      if (error) {
        log('Installer launch error:', error);
      }
    });

    // Quit the app to allow installation
    setTimeout(() => {
      app.quit();
    }, 500);

    return { success: true };
  } catch (err) {
    return { success: false, error: 'INSTALL_FAILED', message: err.message };
  }
});

// Compare semantic versions: returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal
function compareVersions(v1, v2) {
  const parts1 = v1.split('.').map(Number);
  const parts2 = v2.split('.').map(Number);

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0;
    const p2 = parts2[i] || 0;
    if (p1 > p2) return 1;
    if (p1 < p2) return -1;
  }
  return 0;
}

// Auto-check for updates on startup
async function checkForUpdatesOnStartup() {
  try {
    // Get settings to check if auto-update is enabled
    const settings = settingsService.getAll();
    if (!settings.data?.general?.checkUpdatesAutomatically) {
      return;
    }

    const https = require('https');
    const currentVersion = require('./package.json').version;
    const GITHUB_API_URL = 'https://api.github.com/repos/moneraldabai-ui/DeadByte/releases/latest';

    const request = https.get(GITHUB_API_URL, {
      headers: {
        'User-Agent': 'DeadBYTE-App',
        'Accept': 'application/vnd.github.v3+json'
      },
      timeout: 10000
    }, (response) => {
      if (response.statusCode !== 200) return;

      let data = '';
      response.on('data', chunk => data += chunk);
      response.on('end', () => {
        try {
          const release = JSON.parse(data);
          const latestVersion = (release.tag_name || '').replace(/^v/, '');

          // Check if update is available
          if (compareVersions(currentVersion, latestVersion) < 0) {
            // Extract Windows installer from assets (prefer installer over portable)
            const windowsAsset = release.assets?.find(a =>
              (a.name.endsWith('.exe') && a.name.includes('win-x64')) || a.name.endsWith('.msi')
            ) || release.assets?.find(a => a.name.endsWith('.exe'));

            // Send update available event to renderer
            if (mainWindow && !mainWindow.isDestroyed()) {
              mainWindow.webContents.send('updates:available', {
                currentVersion,
                latestVersion,
                releaseUrl: release.html_url || '',
                releaseNotes: release.body || 'No release notes available.',
                publishedAt: release.published_at ? new Date(release.published_at).toLocaleDateString() : '',
                downloadUrl: windowsAsset?.browser_download_url || null,
                downloadSize: windowsAsset?.size || 0,
                fileName: windowsAsset?.name || null
              });
            }
          }
        } catch (e) {
          // Silently ignore parse errors
        }
      });
    });

    request.on('error', () => {
      // Silently ignore network errors
    });
  } catch (err) {
    // Silently ignore errors
  }
}

// ============================================
// IPC HANDLERS - Settings Service
// ============================================

ipcMain.handle('settings:getAll', async () => {
  return settingsService.getAll();
});

ipcMain.handle('settings:get', async (event, keyPath) => {
  return settingsService.get(keyPath);
});

ipcMain.handle('settings:set', async (event, keyPath, value) => {
  const result = settingsService.set(keyPath, value);
  // Notify renderer of settings change
  if (result.success && mainWindow) {
    mainWindow.webContents.send('settings:changed', { keyPath, value });
  }
  return result;
});

ipcMain.handle('settings:setMultiple', async (event, settings) => {
  const result = settingsService.setMultiple(settings);
  if (result.success && mainWindow) {
    mainWindow.webContents.send('settings:changed', { multiple: true, settings });
  }
  return result;
});

ipcMain.handle('settings:resetAll', async () => {
  const result = settingsService.resetAll();
  if (result.success && mainWindow) {
    mainWindow.webContents.send('settings:reset', { all: true });
  }
  return result;
});

ipcMain.handle('settings:resetCategory', async (event, category) => {
  const result = settingsService.resetCategory(category);
  if (result.success && mainWindow) {
    mainWindow.webContents.send('settings:reset', { category });
  }
  return result;
});

ipcMain.handle('settings:addExclusion', async (event, pathToAdd) => {
  return settingsService.addExclusionPath(pathToAdd);
});

ipcMain.handle('settings:removeExclusion', async (event, pathToRemove) => {
  return settingsService.removeExclusionPath(pathToRemove);
});

ipcMain.handle('settings:export', async (event, exportPath) => {
  return settingsService.exportSettings(exportPath);
});

ipcMain.handle('settings:import', async (event, importPath) => {
  const result = settingsService.importSettings(importPath);
  if (result.success && mainWindow) {
    mainWindow.webContents.send('settings:reset', { all: true });
  }
  return result;
});

ipcMain.handle('settings:getPath', async () => {
  return settingsService.getSettingsPath();
});

// ============================================
// IPC HANDLERS - System Service
// ============================================

ipcMain.handle('system:getCpu', async () => {
  return await systemService.getCpuUsage();
});

ipcMain.handle('system:getMemory', async () => {
  return systemService.getMemoryUsage();
});

ipcMain.handle('system:getDiskUsage', async () => {
  return await systemService.getDiskUsage();
});

ipcMain.handle('system:getDiskIO', async () => {
  return await systemService.getDiskIO();
});

ipcMain.handle('system:getNetwork', async () => {
  return await systemService.getNetworkStats();
});

ipcMain.handle('system:getUptime', async () => {
  return systemService.getUptime();
});

ipcMain.handle('system:getInfo', async () => {
  return systemService.getSystemInfo();
});

ipcMain.handle('system:getAllMetrics', async () => {
  return await systemService.getAllMetrics();
});

ipcMain.handle('system:getBootTime', async () => {
  return await systemService.getBootTime();
});

ipcMain.handle('system:getProcessStats', async () => {
  return await systemService.getProcessStats();
});

// ============================================
// IPC HANDLERS - Startup Service
// ============================================

ipcMain.handle('startup:getAll', async () => {
  return await startupService.getStartupPrograms();
});

ipcMain.handle('startup:enable', async (event, itemId, item) => {
  return await startupService.enableStartupItem(itemId, item);
});

ipcMain.handle('startup:disable', async (event, itemId, item) => {
  return await startupService.disableStartupItem(itemId, item);
});

ipcMain.handle('startup:delete', async (event, itemId, item) => {
  return await startupService.deleteStartupItem(itemId, item);
});

ipcMain.handle('startup:add', async (event, name, command, scope) => {
  return await startupService.addStartupItem(name, command, scope);
});

ipcMain.handle('startup:getImpact', async () => {
  return await startupService.getStartupImpact();
});

// ============================================
// IPC HANDLERS - Windows Services
// ============================================

ipcMain.handle('services:getAll', async () => {
  return await serviceService.getServices();
});

ipcMain.handle('services:getByCategory', async (event, category) => {
  return await serviceService.getServicesByCategory(category);
});

ipcMain.handle('services:getCounts', async () => {
  return await serviceService.getServiceCounts();
});

// ============================================
// IPC HANDLERS - Junk Service
// ============================================

ipcMain.handle('junk:scan', async (event, options) => {
  return await junkService.scanForJunk(options);
});

ipcMain.handle('junk:clean', async (event, categories, options) => {
  return await junkService.cleanJunk(categories, options);
});

ipcMain.handle('junk:quickSummary', async () => {
  return await junkService.getQuickSummary();
});

ipcMain.handle('junk:status', async () => {
  return junkService.getScanStatus();
});

ipcMain.handle('junk:categories', async () => {
  return junkService.getCategories();
});

ipcMain.handle('junk:emptyRecycleBin', async () => {
  return await junkService.emptyRecycleBin();
});

// ============================================
// IPC HANDLERS - Maintenance Service
// ============================================

ipcMain.handle('maint:healthCheck', async (event, options) => {
  return await maintenanceService.runHealthCheck(options);
});

ipcMain.handle('maint:quickSummary', async () => {
  return await maintenanceService.getQuickSummary();
});

ipcMain.handle('maint:scanRegistry', async (event, mode) => {
  return await maintenanceService.scanRegistry(mode);
});

ipcMain.handle('maint:cleanRegistry', async (event, issueIds) => {
  return await maintenanceService.cleanRegistry(issueIds);
});

ipcMain.handle('maint:diskHealth', async () => {
  return await maintenanceService.checkDiskHealth();
});

ipcMain.handle('maint:runSFC', async () => {
  return await maintenanceService.runSFC();
});

ipcMain.handle('maint:runDISM', async () => {
  return await maintenanceService.runDISM();
});

ipcMain.handle('maint:runCHKDSK', async (event, drive) => {
  return await maintenanceService.runCHKDSK(drive);
});

ipcMain.handle('maint:resetWindowsUpdate', async () => {
  return await maintenanceService.resetWindowsUpdate();
});

ipcMain.handle('maint:status', async () => {
  return maintenanceService.getScanStatus();
});

// ============================================
// STREAMING REPAIR TOOLS (Non-blocking with live output)
// ============================================

const { spawn } = require('child_process');

// Track running tool process
let runningToolProcess = null;

ipcMain.handle('maint:runToolStreaming', async (event, toolName) => {
  // Prevent running multiple tools at once
  if (runningToolProcess) {
    return { success: false, message: 'Another tool is already running' };
  }

  const toolConfigs = {
    sfc: {
      cmd: 'cmd.exe',
      args: ['/c', 'sfc', '/scannow'],
      name: 'System File Checker'
    },
    dism: {
      cmd: 'cmd.exe',
      args: ['/c', 'DISM', '/Online', '/Cleanup-Image', '/RestoreHealth'],
      name: 'DISM Repair'
    },
    chkdsk: {
      cmd: 'cmd.exe',
      args: ['/c', 'echo', 'Y', '|', 'chkdsk', 'C:', '/F'],
      name: 'Check Disk'
    }
  };

  const config = toolConfigs[toolName];
  if (!config) {
    return { success: false, message: 'Unknown tool' };
  }

  return new Promise((resolve) => {
    try {
      runningToolProcess = spawn(config.cmd, config.args, {
        windowsHide: true,
        stdio: ['pipe', 'pipe', 'pipe']
      });

      // Send start event
      mainWindow?.webContents.send('tool:output', {
        type: 'start',
        tool: config.name,
        message: `Starting ${config.name}...`
      });

      runningToolProcess.stdout.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            mainWindow?.webContents.send('tool:output', {
              type: 'stdout',
              line: line.trim()
            });
          }
        });
      });

      runningToolProcess.stderr.on('data', (data) => {
        const lines = data.toString().split('\n');
        lines.forEach(line => {
          if (line.trim()) {
            mainWindow?.webContents.send('tool:output', {
              type: 'stderr',
              line: line.trim()
            });
          }
        });
      });

      runningToolProcess.on('close', (code) => {
        runningToolProcess = null;
        const success = code === 0;

        mainWindow?.webContents.send('tool:complete', {
          tool: config.name,
          success,
          code,
          message: success ? `${config.name} completed successfully` : `${config.name} finished with code ${code}`
        });

        resolve({ success, code });
      });

      runningToolProcess.on('error', (error) => {
        runningToolProcess = null;

        mainWindow?.webContents.send('tool:complete', {
          tool: config.name,
          success: false,
          error: error.message,
          message: `Failed to run ${config.name}: ${error.message}`
        });

        resolve({ success: false, error: error.message });
      });

    } catch (error) {
      runningToolProcess = null;
      resolve({ success: false, error: error.message });
    }
  });
});

// Streaming Windows Update Reset (runs multiple commands sequentially)
ipcMain.handle('maint:resetWindowsUpdateStreaming', async () => {
  if (runningToolProcess) {
    return { success: false, message: 'Another tool is already running' };
  }

  const commands = [
    { cmd: 'net stop wuauserv /y', desc: 'Stop Windows Update service' },
    { cmd: 'net stop cryptSvc /y', desc: 'Stop Cryptographic service' },
    { cmd: 'net stop bits /y', desc: 'Stop BITS service' },
    { cmd: 'net stop msiserver /y', desc: 'Stop Windows Installer' },
    { cmd: 'takeown /f "C:\\Windows\\SoftwareDistribution" /r /d y', desc: 'Take ownership of SoftwareDistribution' },
    { cmd: 'icacls "C:\\Windows\\SoftwareDistribution" /grant administrators:F /t /q', desc: 'Grant permissions' },
    { cmd: 'rd /s /q "C:\\Windows\\SoftwareDistribution"', desc: 'Delete SoftwareDistribution' },
    { cmd: 'mkdir "C:\\Windows\\SoftwareDistribution"', desc: 'Recreate SoftwareDistribution' },
    { cmd: 'takeown /f "C:\\Windows\\System32\\catroot2" /r /d y', desc: 'Take ownership of catroot2' },
    { cmd: 'icacls "C:\\Windows\\System32\\catroot2" /grant administrators:F /t /q', desc: 'Grant permissions' },
    { cmd: 'rd /s /q "C:\\Windows\\System32\\catroot2"', desc: 'Delete catroot2' },
    { cmd: 'mkdir "C:\\Windows\\System32\\catroot2"', desc: 'Recreate catroot2' },
    { cmd: 'netsh winsock reset', desc: 'Reset Winsock' },
    { cmd: 'netsh winhttp reset proxy', desc: 'Reset proxy settings' },
    { cmd: 'net start wuauserv', desc: 'Start Windows Update service' },
    { cmd: 'net start cryptSvc', desc: 'Start Cryptographic service' },
    { cmd: 'net start bits', desc: 'Start BITS service' },
    { cmd: 'net start msiserver', desc: 'Start Windows Installer' }
  ];

  mainWindow?.webContents.send('tool:output', {
    type: 'start',
    tool: 'Windows Update Reset',
    message: 'Starting Windows Update Reset...'
  });

  let successCount = 0;
  let totalCount = commands.length;

  for (const { cmd, desc } of commands) {
    mainWindow?.webContents.send('tool:output', {
      type: 'command',
      line: desc
    });

    try {
      await new Promise((resolve, reject) => {
        const proc = spawn('cmd.exe', ['/c', cmd], { windowsHide: true });

        proc.stdout.on('data', (data) => {
          const lines = data.toString().split('\n').filter(l => l.trim());
          lines.forEach(line => {
            mainWindow?.webContents.send('tool:output', { type: 'stdout', line: line.trim() });
          });
        });

        proc.stderr.on('data', (data) => {
          const lines = data.toString().split('\n').filter(l => l.trim());
          lines.forEach(line => {
            mainWindow?.webContents.send('tool:output', { type: 'stderr', line: line.trim() });
          });
        });

        proc.on('close', (code) => {
          if (code === 0) {
            successCount++;
            mainWindow?.webContents.send('tool:output', { type: 'success', line: `✓ ${desc}` });
          } else {
            mainWindow?.webContents.send('tool:output', { type: 'error', line: `✗ ${desc} (code ${code})` });
          }
          resolve();
        });

        proc.on('error', (err) => {
          mainWindow?.webContents.send('tool:output', { type: 'error', line: `✗ ${desc}: ${err.message}` });
          resolve();
        });
      });
    } catch (e) {
      mainWindow?.webContents.send('tool:output', { type: 'error', line: `✗ ${desc}: ${e.message}` });
    }
  }

  const success = successCount >= totalCount * 0.5;
  mainWindow?.webContents.send('tool:complete', {
    tool: 'Windows Update Reset',
    success,
    message: success
      ? `Reset completed: ${successCount}/${totalCount} operations successful`
      : `Partial reset: ${successCount}/${totalCount} operations completed`
  });

  return { success, successCount, totalCount };
});

// Cancel running tool
ipcMain.handle('maint:cancelTool', async () => {
  if (runningToolProcess) {
    runningToolProcess.kill();
    runningToolProcess = null;
    return { success: true, message: 'Tool cancelled' };
  }
  return { success: false, message: 'No tool running' };
});

// ============================================
// APP LIFECYCLE
// ============================================

// This method will be called when Electron has finished initialization
app.whenReady().then(() => {
  createWindow();

  // On macOS, re-create window when dock icon is clicked
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });

  // Auto-check for updates after 5-second delay (non-blocking)
  setTimeout(() => {
    checkForUpdatesOnStartup();
  }, 5000);
});

// Quit when all windows are closed (except on macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Handle uncaught exceptions in main process
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception in Main Process:', error);
  // Don't crash - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection in Main Process:', reason);
  // Don't crash - log and continue
});

log('DeadBYTE Main Process Started');
