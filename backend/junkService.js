/**
 * DeadBYTE - Junk Scanner Service
 * ================================
 * Scans for temporary files, caches, and other junk that can be safely cleaned.
 * Provides categorized results with size calculations.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

// Junk categories with their scan locations
const JUNK_CATEGORIES = {
  windowsTemp: {
    name: 'Windows Temp Files',
    description: 'Temporary files created by Windows',
    icon: 'temp',
    paths: [
      path.join(os.tmpdir()),
      'C:\\Windows\\Temp'
    ],
    patterns: ['*'],
    safe: true
  },
  userTemp: {
    name: 'User Temp Files',
    description: 'Temporary files in your user profile',
    icon: 'temp',
    paths: [
      path.join(os.homedir(), 'AppData', 'Local', 'Temp')
    ],
    patterns: ['*'],
    safe: true
  },
  browserCache: {
    name: 'Browser Cache',
    description: 'Cached web pages, images, and scripts',
    icon: 'browser',
    paths: [
      // Chrome
      path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Cache'),
      path.join(os.homedir(), 'AppData', 'Local', 'Google', 'Chrome', 'User Data', 'Default', 'Code Cache'),
      // Edge
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Cache'),
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Code Cache'),
      // Firefox
      path.join(os.homedir(), 'AppData', 'Local', 'Mozilla', 'Firefox', 'Profiles')
    ],
    patterns: ['*'],
    safe: true
  },
  thumbnailCache: {
    name: 'Thumbnail Cache',
    description: 'Windows Explorer thumbnail previews',
    icon: 'image',
    paths: [
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer')
    ],
    patterns: ['thumbcache_*.db', 'iconcache_*.db'],
    safe: true
  },
  windowsUpdate: {
    name: 'Windows Update Cache',
    description: 'Downloaded Windows updates (requires admin)',
    icon: 'update',
    paths: [
      'C:\\Windows\\SoftwareDistribution\\Download'
    ],
    patterns: ['*'],
    safe: true,
    requiresAdmin: true
  },
  recycleBin: {
    name: 'Recycle Bin',
    description: 'Deleted files waiting to be permanently removed',
    icon: 'trash',
    paths: [], // Special handling
    patterns: ['*'],
    safe: true,
    special: 'recycleBin'
  },
  logFiles: {
    name: 'Log Files',
    description: 'System and application log files',
    icon: 'log',
    paths: [
      path.join(os.homedir(), 'AppData', 'Local', 'CrashDumps'),
      'C:\\Windows\\Logs',
      'C:\\Windows\\Panther'
    ],
    patterns: ['*.log', '*.dmp', '*.etl'],
    safe: true,
    requiresAdmin: true
  },
  prefetch: {
    name: 'Prefetch Data',
    description: 'Windows prefetch cache for faster app loading',
    icon: 'speed',
    paths: [
      'C:\\Windows\\Prefetch'
    ],
    patterns: ['*.pf'],
    safe: false, // Can slow down first app launches
    requiresAdmin: true
  },
  recentDocs: {
    name: 'Recent Documents',
    description: 'Shortcuts to recently opened files',
    icon: 'recent',
    paths: [
      path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Recent')
    ],
    patterns: ['*.lnk'],
    safe: true
  },
  fontCache: {
    name: 'Font Cache',
    description: 'Windows font cache files',
    icon: 'font',
    paths: [
      path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'FontCache')
    ],
    patterns: ['*.dat', '~FontCache*'],
    safe: true
  },
  installerCache: {
    name: 'Installer Cache',
    description: 'Cached software installers',
    icon: 'installer',
    paths: [
      path.join(os.homedir(), 'AppData', 'Local', 'Package Cache'),
      'C:\\Windows\\Installer\\$PatchCache$'
    ],
    patterns: ['*'],
    safe: false, // May prevent uninstalls
    requiresAdmin: true
  }
};

// Track scan progress
let currentScan = null;

/**
 * Start a full junk scan
 * @param {Object} options - Scan options
 * @returns {Promise<Object>} Scan results
 */
async function scanForJunk(options = {}) {
  const {
    categories = Object.keys(JUNK_CATEGORIES),
    includeUnsafe = false,
    onProgress = null
  } = options;

  currentScan = {
    status: 'running',
    startTime: Date.now(),
    progress: 0,
    currentCategory: null
  };

  const results = {
    categories: {},
    totalSize: 0,
    totalFiles: 0,
    scanTime: 0,
    errors: []
  };

  try {
    const categoriesToScan = categories.filter(cat => {
      const category = JUNK_CATEGORIES[cat];
      if (!category) return false;
      if (!includeUnsafe && !category.safe) return false;
      return true;
    });

    for (let i = 0; i < categoriesToScan.length; i++) {
      const categoryKey = categoriesToScan[i];
      const category = JUNK_CATEGORIES[categoryKey];

      currentScan.currentCategory = category.name;
      currentScan.progress = Math.round((i / categoriesToScan.length) * 100);

      if (onProgress) {
        onProgress({
          category: category.name,
          progress: currentScan.progress
        });
      }

      try {
        let categoryResult;

        if (category.special === 'recycleBin') {
          categoryResult = await scanRecycleBin();
        } else {
          categoryResult = await scanCategory(categoryKey, category);
        }

        results.categories[categoryKey] = {
          ...category,
          ...categoryResult,
          key: categoryKey
        };

        results.totalSize += categoryResult.size;
        results.totalFiles += categoryResult.fileCount;
      } catch (error) {
        results.errors.push({
          category: categoryKey,
          message: error.message
        });
        results.categories[categoryKey] = {
          ...category,
          key: categoryKey,
          size: 0,
          fileCount: 0,
          files: [],
          error: error.message
        };
      }
    }

    results.scanTime = Date.now() - currentScan.startTime;
    currentScan.status = 'completed';
    currentScan.progress = 100;

    return {
      success: true,
      data: results
    };
  } catch (error) {
    currentScan.status = 'error';
    return {
      success: false,
      message: error.message,
      data: results
    };
  }
}

/**
 * Scan a specific category for junk files
 * @param {string} categoryKey - Category key
 * @param {Object} category - Category definition
 * @returns {Promise<Object>} Category scan results
 */
async function scanCategory(categoryKey, category) {
  const result = {
    size: 0,
    fileCount: 0,
    files: []
  };

  for (const basePath of category.paths) {
    try {
      if (!fs.existsSync(basePath)) continue;

      const stats = fs.statSync(basePath);
      if (!stats.isDirectory()) continue;

      // Scan directory recursively
      const files = await scanDirectory(basePath, category.patterns, 3); // Max depth 3

      for (const file of files) {
        result.files.push(file);
        result.size += file.size;
        result.fileCount++;
      }
    } catch (error) {
      // Skip inaccessible directories
      continue;
    }
  }

  // Limit files array to top 100 for performance
  if (result.files.length > 100) {
    result.files = result.files
      .sort((a, b) => b.size - a.size)
      .slice(0, 100);
  }

  return result;
}

/**
 * Scan a directory for files matching patterns
 * @param {string} dirPath - Directory path
 * @param {Array} patterns - File patterns to match
 * @param {number} maxDepth - Maximum recursion depth
 * @returns {Promise<Array>} Array of file objects
 */
async function scanDirectory(dirPath, patterns, maxDepth, currentDepth = 0) {
  const files = [];

  if (currentDepth > maxDepth) return files;

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);

      try {
        if (entry.isDirectory()) {
          // Recurse into subdirectories
          const subFiles = await scanDirectory(fullPath, patterns, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        } else if (entry.isFile()) {
          // Check if file matches patterns
          if (matchesPatterns(entry.name, patterns)) {
            const stats = fs.statSync(fullPath);
            files.push({
              path: fullPath,
              name: entry.name,
              size: stats.size,
              modified: stats.mtime
            });
          }
        }
      } catch (error) {
        // Skip inaccessible files
        continue;
      }
    }
  } catch (error) {
    // Skip inaccessible directories
  }

  return files;
}

/**
 * Check if filename matches any of the patterns
 * @param {string} filename - File name to check
 * @param {Array} patterns - Patterns to match against
 * @returns {boolean} True if matches
 */
function matchesPatterns(filename, patterns) {
  if (patterns.includes('*')) return true;

  for (const pattern of patterns) {
    if (pattern.startsWith('*.')) {
      // Extension match
      const ext = pattern.substring(1);
      if (filename.toLowerCase().endsWith(ext.toLowerCase())) return true;
    } else if (pattern.includes('*')) {
      // Simple glob pattern
      const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$', 'i');
      if (regex.test(filename)) return true;
    } else {
      // Exact match
      if (filename.toLowerCase() === pattern.toLowerCase()) return true;
    }
  }

  return false;
}

/**
 * Scan the Recycle Bin
 * @returns {Promise<Object>} Recycle bin scan results
 */
async function scanRecycleBin() {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "
      $shell = New-Object -ComObject Shell.Application
      $recycleBin = $shell.Namespace(10)
      $items = $recycleBin.Items()
      $totalSize = 0
      $count = 0
      $files = @()

      foreach ($item in $items) {
        $count++
        try {
          $size = $recycleBin.GetDetailsOf($item, 2)
          # Parse size string to bytes
          if ($size -match '([\\d,\\.]+)\\s*(KB|MB|GB|TB|bytes?)') {
            $num = [double]($matches[1] -replace ',', '')
            switch ($matches[2]) {
              'KB' { $num = $num * 1024 }
              'MB' { $num = $num * 1024 * 1024 }
              'GB' { $num = $num * 1024 * 1024 * 1024 }
              'TB' { $num = $num * 1024 * 1024 * 1024 * 1024 }
            }
            $totalSize += $num
          }
          if ($files.Count -lt 50) {
            $files += @{
              Name = $item.Name
              Size = $num
              Path = $item.Path
            }
          }
        } catch {}
      }

      @{
        Count = $count
        TotalSize = $totalSize
        Files = $files
      } | ConvertTo-Json -Depth 3
    "`;

    exec(cmd, { timeout: 30000, maxBuffer: 1024 * 1024 }, (error, stdout) => {
      if (error) {
        resolve({
          size: 0,
          fileCount: 0,
          files: [],
          error: 'Could not access Recycle Bin'
        });
        return;
      }

      try {
        const result = JSON.parse(stdout.trim());
        resolve({
          size: result.TotalSize || 0,
          fileCount: result.Count || 0,
          files: (result.Files || []).map(f => ({
            path: f.Path,
            name: f.Name,
            size: f.Size || 0
          }))
        });
      } catch {
        resolve({
          size: 0,
          fileCount: 0,
          files: []
        });
      }
    });
  });
}

/**
 * Clean junk files for specified categories
 * @param {Array} categories - Array of category keys to clean
 * @param {Object} options - Clean options
 * @returns {Promise<Object>} Clean results
 */
async function cleanJunk(categories, options = {}) {
  const results = {
    cleaned: {},
    totalCleaned: 0,
    totalFreed: 0,
    errors: []
  };

  for (const categoryKey of categories) {
    const category = JUNK_CATEGORIES[categoryKey];
    if (!category) continue;

    try {
      let cleanResult;

      if (category.special === 'recycleBin') {
        cleanResult = await emptyRecycleBin();
      } else {
        cleanResult = await cleanCategory(categoryKey, category);
      }

      results.cleaned[categoryKey] = cleanResult;
      results.totalCleaned += cleanResult.filesDeleted;
      results.totalFreed += cleanResult.spaceFreed;
    } catch (error) {
      results.errors.push({
        category: categoryKey,
        message: error.message
      });
    }
  }

  return {
    success: true,
    data: results
  };
}

/**
 * Clean files in a specific category
 * @param {string} categoryKey - Category key
 * @param {Object} category - Category definition
 * @returns {Promise<Object>} Clean results
 */
async function cleanCategory(categoryKey, category) {
  const result = {
    filesDeleted: 0,
    spaceFreed: 0,
    errors: []
  };

  for (const basePath of category.paths) {
    try {
      if (!fs.existsSync(basePath)) continue;

      const files = await scanDirectory(basePath, category.patterns, 3);

      for (const file of files) {
        try {
          fs.unlinkSync(file.path);
          result.filesDeleted++;
          result.spaceFreed += file.size;
        } catch (error) {
          result.errors.push({
            path: file.path,
            message: error.message
          });
        }
      }
    } catch (error) {
      result.errors.push({
        path: basePath,
        message: error.message
      });
    }
  }

  return result;
}

/**
 * Empty the Recycle Bin
 * @returns {Promise<Object>} Empty result
 */
async function emptyRecycleBin() {
  return new Promise((resolve) => {
    // First get the current size
    scanRecycleBin().then(scanResult => {
      const cmd = `powershell -NoProfile -Command "Clear-RecycleBin -Force -ErrorAction SilentlyContinue"`;

      exec(cmd, { timeout: 60000 }, (error) => {
        if (error) {
          resolve({
            filesDeleted: 0,
            spaceFreed: 0,
            error: 'Failed to empty Recycle Bin'
          });
          return;
        }

        resolve({
          filesDeleted: scanResult.fileCount,
          spaceFreed: scanResult.size
        });
      });
    });
  });
}

/**
 * Get quick junk summary without full scan
 * @returns {Promise<Object>} Quick summary
 */
async function getQuickSummary() {
  const summary = {
    estimatedSize: 0,
    categories: {}
  };

  // Quick size estimates for common locations
  const quickPaths = [
    { key: 'windowsTemp', path: 'C:\\Windows\\Temp' },
    { key: 'userTemp', path: path.join(os.homedir(), 'AppData', 'Local', 'Temp') },
    { key: 'thumbnailCache', path: path.join(os.homedir(), 'AppData', 'Local', 'Microsoft', 'Windows', 'Explorer') }
  ];

  for (const item of quickPaths) {
    try {
      const size = await getDirectorySize(item.path);
      summary.categories[item.key] = size;
      summary.estimatedSize += size;
    } catch {
      summary.categories[item.key] = 0;
    }
  }

  return {
    success: true,
    data: summary
  };
}

/**
 * Get directory size (quick estimate)
 * @param {string} dirPath - Directory path
 * @returns {Promise<number>} Size in bytes
 */
async function getDirectorySize(dirPath) {
  return new Promise((resolve) => {
    if (!fs.existsSync(dirPath)) {
      resolve(0);
      return;
    }

    const cmd = `powershell -NoProfile -Command "(Get-ChildItem -Path '${dirPath.replace(/'/g, "''")}' -Recurse -Force -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum"`;

    exec(cmd, { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve(0);
        return;
      }

      const size = parseInt(stdout.trim()) || 0;
      resolve(size);
    });
  });
}

/**
 * Get current scan status
 * @returns {Object} Scan status
 */
function getScanStatus() {
  return currentScan || { status: 'idle', progress: 0 };
}

/**
 * Get available junk categories
 * @returns {Object} Categories info
 */
function getCategories() {
  const categories = {};

  for (const [key, category] of Object.entries(JUNK_CATEGORIES)) {
    categories[key] = {
      key,
      name: category.name,
      description: category.description,
      icon: category.icon,
      safe: category.safe,
      requiresAdmin: category.requiresAdmin || false
    };
  }

  return {
    success: true,
    data: categories
  };
}

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

module.exports = {
  scanForJunk,
  cleanJunk,
  getQuickSummary,
  getScanStatus,
  getCategories,
  emptyRecycleBin,
  formatBytes
};
