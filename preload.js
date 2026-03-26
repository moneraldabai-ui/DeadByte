/**
 * DeadBYTE - Preload Script
 * ==========================
 * Exposes safe APIs to the renderer process via contextBridge.
 * This is the secure bridge between Node.js and the browser context.
 */

const { contextBridge, ipcRenderer } = require('electron');

// ============================================
// DEBUG MODE
// ============================================
const DEBUG_MODE = false;
const log = (...args) => DEBUG_MODE && console.log('[Preload]', ...args);

// ============================================
// EXPOSED API - window.deadbyte
// ============================================

contextBridge.exposeInMainWorld('deadbyte', {
  // ==========================================
  // Window Controls
  // ==========================================
  window: {
    minimize: () => ipcRenderer.send('window:minimize'),
    maximize: () => ipcRenderer.send('window:maximize'),
    close: () => ipcRenderer.send('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },

  // ==========================================
  // Shell Operations
  // ==========================================
  shell: {
    openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url)
  },

  // ==========================================
  // Dialog Operations
  // ==========================================
  dialog: {
    openFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    openFile: () => ipcRenderer.invoke('dialog:openFile')
  },

  // ==========================================
  // System Information
  // ==========================================
  system: {
    isAdmin: () => ipcRenderer.invoke('sys:isAdmin'),
    platform: () => ipcRenderer.invoke('sys:platform'),
    onAdminStatus: (callback) => {
      ipcRenderer.on('sys:adminStatus', (event, data) => callback(data));
    }
  },

  // ==========================================
  // Drive Operations
  // ==========================================
  drives: {
    // Get all drives with detailed info
    getAll: () => ipcRenderer.invoke('drives:get'),
    // Get info for a specific drive
    getInfo: (driveLetter) => ipcRenderer.invoke('drives:info', driveLetter),
    // Refresh drive list
    refresh: () => ipcRenderer.invoke('drives:refresh'),
    // Listen for new drive connected
    onDriveAdded: (callback) => {
      ipcRenderer.on('drives:added', (event, drive) => callback(drive));
    },
    // Listen for drive disconnected
    onDriveRemoved: (callback) => {
      ipcRenderer.on('drives:removed', (event, letter) => callback(letter));
    },
    // Listen for drive list updates
    onDrivesUpdated: (callback) => {
      ipcRenderer.on('drives:updated', (event, drives) => callback(drives));
    },
    // Remove drive event listeners
    removeListeners: () => {
      ipcRenderer.removeAllListeners('drives:added');
      ipcRenderer.removeAllListeners('drives:removed');
      ipcRenderer.removeAllListeners('drives:updated');
    }
  },

  // ==========================================
  // File Operations
  // ==========================================
  files: {
    // Scan a folder and return file list with status
    scan: (folderPath, options = {}) => ipcRenderer.invoke('files:scan', folderPath, options),
    // Get detailed info for a specific file
    getDetails: (filePath) => ipcRenderer.invoke('files:details', filePath),
    // Get file status (locked, restricted, accessible, in-use)
    getStatus: (filePath) => ipcRenderer.invoke('files:status', filePath),
    // Delete a file (standard delete, not force)
    delete: (filePath, options = {}) => ipcRenderer.invoke('files:delete', filePath, options),
    // Open folder picker dialog
    selectFolder: () => ipcRenderer.invoke('dialog:openFolder'),
    // Save file dialog
    saveFile: (filename, content, options = {}) => ipcRenderer.invoke('files:save', filename, content, options)
  },

  // ==========================================
  // Permission Operations
  // ==========================================
  permissions: {
    // Get ACL for a file/folder
    get: (filePath) => ipcRenderer.invoke('perms:get', filePath),
    // Set permissions on a file/folder
    set: (filePath, options) => ipcRenderer.invoke('perms:set', filePath, options),
    // Remove permission for a specific identity
    remove: (filePath, identity) => ipcRenderer.invoke('perms:remove', filePath, identity),
    // Reset permissions to inherited defaults
    reset: (filePath) => ipcRenderer.invoke('perms:reset', filePath),
    // Grant full control to current user
    grantFull: (filePath) => ipcRenderer.invoke('perms:grantFull', filePath)
  },

  // ==========================================
  // Ownership Operations
  // ==========================================
  ownership: {
    // Get current owner
    get: (filePath) => ipcRenderer.invoke('owner:get', filePath),
    // Take ownership of a file/folder
    take: (filePath, options = {}) => ipcRenderer.invoke('owner:take', filePath, options),
    // Set owner to specific identity
    set: (filePath, newOwner) => ipcRenderer.invoke('owner:set', filePath, newOwner),
    // Reset ownership to Administrators
    reset: (filePath, options = {}) => ipcRenderer.invoke('owner:reset', filePath, options),
    // Get common owner options for UI
    getOptions: () => ipcRenderer.invoke('owner:options')
  },

  // ==========================================
  // Process Operations
  // ==========================================
  process: {
    // Get processes locking a file
    getLocking: (filePath) => ipcRenderer.invoke('proc:locking', filePath),
    // Kill a process by PID
    kill: (pid, options = {}) => ipcRenderer.invoke('proc:kill', pid, options),
    // Kill multiple processes
    killMultiple: (pids, options = {}) => ipcRenderer.invoke('proc:killMultiple', pids, options),
    // Kill all processes locking a file and verify unlock
    killAllForFile: (filePath, options = {}) => ipcRenderer.invoke('proc:killAll', filePath, options),
    // Get info about a specific process
    getInfo: (pid) => ipcRenderer.invoke('proc:info', pid),
    // List all running processes
    list: (options = {}) => ipcRenderer.invoke('proc:list', options)
  },

  // ==========================================
  // File Lock Operations
  // ==========================================
  fileLock: {
    // Check if a file is locked and get lockers
    check: (filePath) => ipcRenderer.invoke('file:checkLock', filePath)
  },

  // ==========================================
  // Force Delete Operations
  // ==========================================
  forceDelete: {
    // Force delete a file (with all escalating methods)
    execute: (filePath, options = {}) => ipcRenderer.invoke('file:force-delete', filePath, options),
    // Force delete multiple files
    executeMultiple: (filePaths, options = {}) => ipcRenderer.invoke('file:force-delete-multiple', filePaths, options),
    // Analyze a file to determine best deletion strategy
    analyze: (filePath) => ipcRenderer.invoke('file:analyze', filePath)
  },

  // ==========================================
  // Log Operations
  // ==========================================
  logs: {
    // Get all operation logs (with optional filters)
    get: (options = {}) => ipcRenderer.invoke('logs:get', options),
    // Clear all logs
    clear: () => ipcRenderer.invoke('logs:clear'),
    // Get log statistics
    getStats: () => ipcRenderer.invoke('logs:stats'),
    // Export logs as JSON
    export: () => ipcRenderer.invoke('logs:export'),
    // Subscribe to new log entries
    onEntry: (callback) => {
      ipcRenderer.on('logs:entry', (event, entry) => callback(entry));
    }
  },

  // ==========================================
  // Admin Operations
  // ==========================================
  admin: {
    // Check if running as admin
    check: (forceRefresh = false) => ipcRenderer.invoke('admin:check', forceRefresh),
    // Get current user info
    getUser: () => ipcRenderer.invoke('admin:user'),
    // Get system privileges status
    getPrivileges: () => ipcRenderer.invoke('admin:privileges'),
    // Check if operation requires admin
    requiresAdmin: (operation) => ipcRenderer.invoke('admin:requiresAdmin', operation)
  },

  // ==========================================
  // Update Checker Operations
  // ==========================================
  updates: {
    // Check for updates from GitHub
    checkForUpdates: () => ipcRenderer.invoke('updates:check'),
    // Download update installer
    download: (url, fileName) => ipcRenderer.invoke('updates:download', url, fileName),
    // Install downloaded update
    install: (filePath) => ipcRenderer.invoke('updates:install', filePath),
    // Cancel ongoing download
    cancelDownload: () => ipcRenderer.invoke('updates:cancelDownload'),
    // Listen for download progress
    onDownloadProgress: (callback) => {
      ipcRenderer.on('updates:downloadProgress', (event, data) => callback(data));
    },
    // Listen for update available (auto-check)
    onUpdateAvailable: (callback) => {
      ipcRenderer.on('updates:available', (event, data) => callback(data));
    },
    // Remove download progress listener
    removeDownloadListener: () => {
      ipcRenderer.removeAllListeners('updates:downloadProgress');
    },
    // Remove update available listener
    removeUpdateListener: () => {
      ipcRenderer.removeAllListeners('updates:available');
    }
  },

  // ==========================================
  // Settings Operations
  // ==========================================
  settings: {
    // Get all settings
    getAll: () => ipcRenderer.invoke('settings:getAll'),
    // Get a specific setting by path (e.g., 'appearance.theme')
    get: (keyPath) => ipcRenderer.invoke('settings:get', keyPath),
    // Set a specific setting
    set: (keyPath, value) => ipcRenderer.invoke('settings:set', keyPath, value),
    // Set multiple settings at once
    setMultiple: (settings) => ipcRenderer.invoke('settings:setMultiple', settings),
    // Reset all settings to defaults
    resetAll: () => ipcRenderer.invoke('settings:resetAll'),
    // Reset a specific category
    resetCategory: (category) => ipcRenderer.invoke('settings:resetCategory', category),
    // Add an exclusion path
    addExclusion: (pathToAdd) => ipcRenderer.invoke('settings:addExclusion', pathToAdd),
    // Remove an exclusion path
    removeExclusion: (pathToRemove) => ipcRenderer.invoke('settings:removeExclusion', pathToRemove),
    // Export settings to file
    export: (exportPath) => ipcRenderer.invoke('settings:export', exportPath),
    // Import settings from file
    import: (importPath) => ipcRenderer.invoke('settings:import', importPath),
    // Get the settings file path
    getPath: () => ipcRenderer.invoke('settings:getPath'),
    // Listen for settings changes
    onChange: (callback) => {
      ipcRenderer.on('settings:changed', (event, data) => callback(data));
    },
    // Listen for settings reset
    onReset: (callback) => {
      ipcRenderer.on('settings:reset', (event, data) => callback(data));
    }
  },

  // ==========================================
  // System Metrics Operations
  // ==========================================
  metrics: {
    // Get CPU usage
    getCpu: () => ipcRenderer.invoke('system:getCpu'),
    // Get memory usage
    getMemory: () => ipcRenderer.invoke('system:getMemory'),
    // Get disk usage for all drives
    getDiskUsage: () => ipcRenderer.invoke('system:getDiskUsage'),
    // Get disk I/O statistics
    getDiskIO: () => ipcRenderer.invoke('system:getDiskIO'),
    // Get network statistics
    getNetwork: () => ipcRenderer.invoke('system:getNetwork'),
    // Get system uptime
    getUptime: () => ipcRenderer.invoke('system:getUptime'),
    // Get system information
    getInfo: () => ipcRenderer.invoke('system:getInfo'),
    // Get all metrics at once (optimized)
    getAll: () => ipcRenderer.invoke('system:getAllMetrics'),
    // Get boot time information
    getBootTime: () => ipcRenderer.invoke('system:getBootTime'),
    // Get process statistics
    getProcessStats: () => ipcRenderer.invoke('system:getProcessStats')
  },

  // ==========================================
  // Startup Programs Operations
  // ==========================================
  startup: {
    // Get all startup programs
    getAll: () => ipcRenderer.invoke('startup:getAll'),
    // Enable a startup program
    enable: (itemId, item) => ipcRenderer.invoke('startup:enable', itemId, item),
    // Disable a startup program
    disable: (itemId, item) => ipcRenderer.invoke('startup:disable', itemId, item),
    // Delete a startup program entry
    delete: (itemId, item) => ipcRenderer.invoke('startup:delete', itemId, item),
    // Add a new startup program
    add: (name, command, scope) => ipcRenderer.invoke('startup:add', name, command, scope),
    // Get startup impact analysis
    getImpact: () => ipcRenderer.invoke('startup:getImpact')
  },

  // ==========================================
  // Windows Services Operations
  // ==========================================
  services: {
    // Get all running services grouped by category
    getAll: () => ipcRenderer.invoke('services:getAll'),
    // Get services for a specific category
    getByCategory: (category) => ipcRenderer.invoke('services:getByCategory', category),
    // Get service counts summary
    getCounts: () => ipcRenderer.invoke('services:getCounts')
  },

  // ==========================================
  // Junk Scanner Operations
  // ==========================================
  junk: {
    // Scan for junk files
    scan: (options) => ipcRenderer.invoke('junk:scan', options),
    // Clean junk files for specified categories
    clean: (categories, options) => ipcRenderer.invoke('junk:clean', categories, options),
    // Get quick summary without full scan
    quickSummary: () => ipcRenderer.invoke('junk:quickSummary'),
    // Get current scan status
    status: () => ipcRenderer.invoke('junk:status'),
    // Get available junk categories
    categories: () => ipcRenderer.invoke('junk:categories'),
    // Empty the Recycle Bin
    emptyRecycleBin: () => ipcRenderer.invoke('junk:emptyRecycleBin')
  },

  // ==========================================
  // Maintenance Operations
  // ==========================================
  maintenance: {
    // Run full health check
    healthCheck: (options) => ipcRenderer.invoke('maint:healthCheck', options),
    // Get quick summary without full scan
    quickSummary: () => ipcRenderer.invoke('maint:quickSummary'),
    // Scan registry for issues
    scanRegistry: (mode) => ipcRenderer.invoke('maint:scanRegistry', mode),
    // Clean registry issues
    cleanRegistry: (issueIds) => ipcRenderer.invoke('maint:cleanRegistry', issueIds),
    // Check disk health
    diskHealth: () => ipcRenderer.invoke('maint:diskHealth'),
    // Run System File Checker
    runSFC: () => ipcRenderer.invoke('maint:runSFC'),
    // Run DISM repair
    runDISM: () => ipcRenderer.invoke('maint:runDISM'),
    // Run Check Disk
    runCHKDSK: (drive) => ipcRenderer.invoke('maint:runCHKDSK', drive),
    // Reset Windows Update components
    resetWindowsUpdate: () => ipcRenderer.invoke('maint:resetWindowsUpdate'),
    // Get current scan status
    status: () => ipcRenderer.invoke('maint:status'),
    // Streaming versions (non-blocking with live output)
    runToolStreaming: (toolName) => ipcRenderer.invoke('maint:runToolStreaming', toolName),
    resetWindowsUpdateStreaming: () => ipcRenderer.invoke('maint:resetWindowsUpdateStreaming'),
    cancelTool: () => ipcRenderer.invoke('maint:cancelTool'),
    // Event listeners for streaming output
    onToolOutput: (callback) => {
      ipcRenderer.on('tool:output', (event, data) => callback(data));
    },
    onToolComplete: (callback) => {
      ipcRenderer.on('tool:complete', (event, data) => callback(data));
    },
    // Remove event listeners
    removeToolListeners: () => {
      ipcRenderer.removeAllListeners('tool:output');
      ipcRenderer.removeAllListeners('tool:complete');
    }
  },

  // ==========================================
  // Event Subscriptions
  // ==========================================
  on: (channel, callback) => {
    // Whitelist of allowed channels for security
    const allowedChannels = [
      'sys:adminStatus',
      'logs:entry',
      'scan:progress',
      'operation:progress',
      'operation:complete',
      'operation:error',
      'settings:changed',
      'settings:reset'
    ];

    if (allowedChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => callback(...args));
    } else {
      console.warn(`Channel "${channel}" is not in the allowed list`);
    }
  },

  // Remove event listener
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },

  // Remove all listeners for a channel
  offAll: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  }
});

// ============================================
// INITIALIZATION
// ============================================

// Log when preload is ready
log('DeadBYTE Preload Script Loaded');
log('API exposed as window.deadbyte');

// Notify renderer that preload is ready
window.addEventListener('DOMContentLoaded', () => {
  // The renderer can now safely access window.deadbyte
  log('DOM Content Loaded - DeadBYTE API Ready');
});
