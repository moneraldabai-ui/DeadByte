/**
 * DeadBYTE - Settings Service
 * ===========================
 * Handles application settings persistence using electron-store.
 * Provides get/set operations for all user preferences.
 */

const path = require('path');
const fs = require('fs');
const { app } = require('electron');

// Settings file path
const SETTINGS_FILE = path.join(app.getPath('userData'), 'deadbyte-settings.json');

// Default settings
const DEFAULT_SETTINGS = {
  // General
  general: {
    startWithWindows: false,
    minimizeToTray: true,
    checkUpdatesAutomatically: true
  },

  // Scanning
  scanning: {
    defaultScanMode: 'smart',
    autoScanOnStartup: false,
    realTimeMonitoring: true,
    exclusionPaths: []
  },

  // Appearance
  appearance: {
    theme: 'dark',
    scanlineEffect: true,
    vignetteEffect: true,
    skullAnimations: true,
    reducedMotion: false
  },

  // Notifications
  notifications: {
    enabled: true,
    scanComplete: true,
    securityAlerts: true,
    lowDiskSpace: true,
    updateNotifications: true,
    soundEffects: false
  },

  // Privacy
  privacy: {
    auditLogging: true,
    logRetentionDays: 30,
    anonymousUsageStats: false
  },

  // Advanced
  advanced: {
    debugMode: false,
    developerTools: false,
    hardwareAcceleration: true,
    safeDeleteMode: true
  }
};

// In-memory cache
let settingsCache = null;

/**
 * Load settings from disk
 * @returns {Object} Settings object
 */
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE)) {
      const data = fs.readFileSync(SETTINGS_FILE, 'utf8');
      const parsed = JSON.parse(data);
      // Merge with defaults to ensure all keys exist
      settingsCache = deepMerge(DEFAULT_SETTINGS, parsed);
    } else {
      settingsCache = { ...DEFAULT_SETTINGS };
      saveSettings(settingsCache);
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    settingsCache = { ...DEFAULT_SETTINGS };
  }
  return settingsCache;
}

/**
 * Save settings to disk
 * @param {Object} settings - Settings object to save
 * @returns {Object} Result object
 */
function saveSettings(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), 'utf8');
    settingsCache = settings;
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, message: error.message };
  }
}

/**
 * Get all settings
 * @returns {Object} All settings
 */
function getAll() {
  if (!settingsCache) {
    loadSettings();
  }
  return {
    success: true,
    data: settingsCache
  };
}

/**
 * Get a specific setting by path (e.g., 'appearance.theme')
 * @param {string} keyPath - Dot-separated path to the setting
 * @returns {Object} Result with the setting value
 */
function get(keyPath) {
  if (!settingsCache) {
    loadSettings();
  }

  try {
    const keys = keyPath.split('.');
    let value = settingsCache;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return { success: false, message: `Setting not found: ${keyPath}` };
      }
    }

    return { success: true, data: value };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Set a specific setting by path
 * @param {string} keyPath - Dot-separated path to the setting
 * @param {*} value - Value to set
 * @returns {Object} Result object
 */
function set(keyPath, value) {
  if (!settingsCache) {
    loadSettings();
  }

  try {
    const keys = keyPath.split('.');
    let target = settingsCache;

    // Navigate to the parent of the target key
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in target)) {
        target[key] = {};
      }
      target = target[key];
    }

    // Set the value
    const finalKey = keys[keys.length - 1];
    target[finalKey] = value;

    // Save to disk
    return saveSettings(settingsCache);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Set multiple settings at once
 * @param {Object} settings - Object with key paths and values
 * @returns {Object} Result object
 */
function setMultiple(settings) {
  if (!settingsCache) {
    loadSettings();
  }

  try {
    for (const [keyPath, value] of Object.entries(settings)) {
      const keys = keyPath.split('.');
      let target = settingsCache;

      for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (!(key in target)) {
          target[key] = {};
        }
        target = target[key];
      }

      target[keys[keys.length - 1]] = value;
    }

    return saveSettings(settingsCache);
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Reset all settings to defaults
 * @returns {Object} Result object
 */
function resetAll() {
  settingsCache = { ...DEFAULT_SETTINGS };
  return saveSettings(settingsCache);
}

/**
 * Reset a specific category to defaults
 * @param {string} category - Category name (general, scanning, appearance, etc.)
 * @returns {Object} Result object
 */
function resetCategory(category) {
  if (!settingsCache) {
    loadSettings();
  }

  if (DEFAULT_SETTINGS[category]) {
    settingsCache[category] = { ...DEFAULT_SETTINGS[category] };
    return saveSettings(settingsCache);
  }

  return { success: false, message: `Unknown category: ${category}` };
}

/**
 * Add an exclusion path
 * @param {string} pathToAdd - Path to exclude from scans
 * @returns {Object} Result object
 */
function addExclusionPath(pathToAdd) {
  if (!settingsCache) {
    loadSettings();
  }

  const exclusions = settingsCache.scanning.exclusionPaths || [];
  if (!exclusions.includes(pathToAdd)) {
    exclusions.push(pathToAdd);
    settingsCache.scanning.exclusionPaths = exclusions;
    return saveSettings(settingsCache);
  }

  return { success: true, message: 'Path already exists' };
}

/**
 * Remove an exclusion path
 * @param {string} pathToRemove - Path to remove from exclusions
 * @returns {Object} Result object
 */
function removeExclusionPath(pathToRemove) {
  if (!settingsCache) {
    loadSettings();
  }

  const exclusions = settingsCache.scanning.exclusionPaths || [];
  const index = exclusions.indexOf(pathToRemove);

  if (index > -1) {
    exclusions.splice(index, 1);
    settingsCache.scanning.exclusionPaths = exclusions;
    return saveSettings(settingsCache);
  }

  return { success: false, message: 'Path not found' };
}

/**
 * Export settings to a file
 * @param {string} exportPath - Path to export to
 * @returns {Object} Result object
 */
function exportSettings(exportPath) {
  if (!settingsCache) {
    loadSettings();
  }

  try {
    const exportData = {
      version: '1.0.0',
      exportDate: new Date().toISOString(),
      settings: settingsCache
    };
    fs.writeFileSync(exportPath, JSON.stringify(exportData, null, 2), 'utf8');
    return { success: true, path: exportPath };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Import settings from a file
 * @param {string} importPath - Path to import from
 * @returns {Object} Result object
 */
function importSettings(importPath) {
  try {
    const data = fs.readFileSync(importPath, 'utf8');
    const imported = JSON.parse(data);

    if (imported.settings) {
      settingsCache = deepMerge(DEFAULT_SETTINGS, imported.settings);
      return saveSettings(settingsCache);
    }

    return { success: false, message: 'Invalid settings file format' };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Get the settings file path
 * @returns {Object} Result with path
 */
function getSettingsPath() {
  return { success: true, path: SETTINGS_FILE };
}

/**
 * Deep merge two objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      result[key] = deepMerge(result[key] || {}, source[key]);
    } else {
      result[key] = source[key];
    }
  }

  return result;
}

// Initialize settings on module load
loadSettings();

module.exports = {
  getAll,
  get,
  set,
  setMultiple,
  resetAll,
  resetCategory,
  addExclusionPath,
  removeExclusionPath,
  exportSettings,
  importSettings,
  getSettingsPath,
  DEFAULT_SETTINGS
};
