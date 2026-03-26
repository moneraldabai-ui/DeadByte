/**
 * DeadBYTE - File Service
 * ========================
 * Handles file scanning, listing, and file details.
 * Core service for the Files module.
 */

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { executePowerShell, executePowerShellJson } = require('./utils/powershell');

// Import log service for operation logging
const logService = require('./logService');
const { LogType, OperationType } = logService;

// Protected paths that should never be deleted
const PROTECTED_PATHS = [
  'C:\\Windows',
  'C:\\Windows\\System32',
  'C:\\Windows\\SysWOW64',
  'C:\\Program Files',
  'C:\\Program Files (x86)',
  'C:\\ProgramData',
  'C:\\Users\\Default',
  'C:\\Recovery',
  'C:\\$Recycle.Bin'
];

// Protected file patterns
const PROTECTED_PATTERNS = [
  /^ntoskrnl\.exe$/i,
  /^hal\.dll$/i,
  /^kernel32\.dll$/i,
  /^ntdll\.dll$/i,
  /^csrss\.exe$/i,
  /^smss\.exe$/i,
  /^wininit\.exe$/i,
  /^services\.exe$/i,
  /^lsass\.exe$/i,
  /^svchost\.exe$/i
];

/**
 * Check if a path is protected
 * @param {string} filePath
 * @returns {boolean}
 */
function isProtectedPath(filePath) {
  const normalizedPath = path.normalize(filePath).toLowerCase();

  // Check exact protected paths
  for (const protectedPath of PROTECTED_PATHS) {
    if (normalizedPath === protectedPath.toLowerCase() ||
        normalizedPath.startsWith(protectedPath.toLowerCase() + '\\')) {
      // Allow if it's a subfolder several levels deep (user files in Program Files, etc.)
      const depth = normalizedPath.replace(protectedPath.toLowerCase(), '').split('\\').filter(Boolean).length;
      if (depth < 2 && normalizedPath !== protectedPath.toLowerCase()) {
        continue; // Allow access to files 2+ levels deep
      }
      if (normalizedPath === protectedPath.toLowerCase()) {
        return true;
      }
    }
  }

  // Check protected file patterns
  const fileName = path.basename(filePath);
  for (const pattern of PROTECTED_PATTERNS) {
    if (pattern.test(fileName)) {
      return true;
    }
  }

  return false;
}

// Simple in-memory cache for directory scans (clears after 30 seconds)
const scanCache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCachedScan(dirPath) {
  const cached = scanCache.get(dirPath);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  scanCache.delete(dirPath);
  return null;
}

function setCachedScan(dirPath, data) {
  scanCache.set(dirPath, { data, timestamp: Date.now() });
  // Limit cache size
  if (scanCache.size > 50) {
    const oldest = scanCache.keys().next().value;
    scanCache.delete(oldest);
  }
}

/**
 * Scan a directory and return its contents
 * @param {string} dirPath - Directory path to scan
 * @param {Object} [options] - Scan options
 * @param {boolean} [options.recursive=false] - Scan subdirectories
 * @param {number} [options.maxDepth=1] - Maximum depth for recursive scan
 * @param {boolean} [options.includeHidden=true] - Include hidden files
 * @param {string} [options.filter] - File extension filter (e.g., '.txt')
 * @param {boolean} [options.detectStatus=false] - Detect file access status (SLOW - disabled by default)
 * @param {boolean} [options.getOwners=false] - Fetch owner for each file (SLOW - disabled by default)
 * @param {boolean} [options.useCache=true] - Use cached results if available
 * @param {number} [options.limit=0] - Limit number of items returned (0 = no limit)
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function scanDirectory(dirPath, options = {}) {
  const {
    recursive = false,
    maxDepth = 1,
    includeHidden = true,
    filter = null,
    detectStatus = false,  // CHANGED: default to false for speed
    getOwners = false,
    useCache = true,
    limit = 0
  } = options;

  try {
    // Check cache first (only for non-recursive, standard scans)
    if (useCache && !recursive && !detectStatus && !getOwners) {
      const cached = getCachedScan(dirPath);
      if (cached) {
        logService.logInfo(OperationType.SCAN, `Using cached scan for: ${dirPath}`, dirPath);
        return { success: true, data: cached };
      }
    }

    // Validate path exists
    const stats = await fsPromises.stat(dirPath);
    if (!stats.isDirectory()) {
      return {
        success: false,
        message: `Path is not a directory: ${dirPath}`
      };
    }

    logService.logInfo(OperationType.SCAN, `Scanning directory: ${dirPath}`, dirPath);

    const result = await scanDirectoryRecursive(dirPath, 0, maxDepth, recursive, includeHidden, filter, detectStatus, limit);

    // Optionally fetch owners (slower but more complete)
    if (getOwners) {
      const allItems = [...result.files, ...result.folders];
      // Batch get owners - limit to first 50 items for better performance
      const itemsToProcess = allItems.slice(0, 50);
      // Process in parallel batches of 10 for speed
      for (let i = 0; i < itemsToProcess.length; i += 10) {
        const batch = itemsToProcess.slice(i, i + 10);
        await Promise.all(batch.map(async (item) => {
          item.owner = await getFileOwnerQuick(item.path);
        }));
      }
      // Set remaining as 'Unknown'
      allItems.slice(50).forEach(item => {
        item.owner = 'Unknown';
      });
    }

    logService.logSuccess(OperationType.SCAN, `Scan complete: ${result.files.length} files, ${result.folders.length} folders`, dirPath);

    // Apply limit if specified
    let files = result.files;
    let folders = result.folders;
    let hasMore = false;

    if (limit > 0) {
      const totalItems = folders.length + files.length;
      if (totalItems > limit) {
        hasMore = true;
        // Prioritize folders, then files
        if (folders.length >= limit) {
          folders = folders.slice(0, limit);
          files = [];
        } else {
          files = files.slice(0, limit - folders.length);
        }
      }
    }

    const responseData = {
      path: dirPath,
      files: files,
      folders: folders,
      totalFiles: result.files.length,
      totalFolders: result.folders.length,
      totalSize: result.totalSize,
      scannedAt: new Date().toISOString(),
      hasMore: hasMore,
      displayedCount: files.length + folders.length
    };

    // Cache the result for fast repeat access
    if (useCache && !recursive && !detectStatus && !getOwners) {
      setCachedScan(dirPath, responseData);
    }

    return {
      success: true,
      data: responseData
    };

  } catch (error) {
    logService.logError(OperationType.SCAN, `Scan failed: ${error.message}`, dirPath);
    return {
      success: false,
      message: `Failed to scan directory: ${error.message}`
    };
  }
}

/**
 * Detect file status: LOCKED, RESTRICTED, IN_USE, ACCESSIBLE
 * @param {string} filePath
 * @param {object} stats - fs.Stats object
 * @returns {Promise<{status: string, canRead: boolean, canWrite: boolean, isInUse: boolean}>}
 */
async function detectFileStatus(filePath, stats) {
  const result = {
    status: 'accessible',
    canRead: true,
    canWrite: true,
    isInUse: false
  };

  // Check if it's a protected system file
  if (isProtectedPath(filePath)) {
    result.status = 'locked';
    result.canWrite = false;
    return result;
  }

  // For directories, just check read access
  if (stats.isDirectory()) {
    try {
      await fsPromises.access(filePath, fs.constants.R_OK);
      result.canRead = true;
    } catch {
      result.canRead = false;
      result.status = 'restricted';
    }
    try {
      await fsPromises.access(filePath, fs.constants.W_OK);
      result.canWrite = true;
    } catch {
      result.canWrite = false;
      if (result.status !== 'restricted') result.status = 'restricted';
    }
    return result;
  }

  // For files, check read access
  try {
    await fsPromises.access(filePath, fs.constants.R_OK);
    result.canRead = true;
  } catch {
    result.canRead = false;
    result.status = 'locked';
    return result;
  }

  // Check write access
  try {
    await fsPromises.access(filePath, fs.constants.W_OK);
    result.canWrite = true;
  } catch {
    result.canWrite = false;
    result.status = 'restricted';
  }

  // Check if file is in use by trying to open with exclusive write access
  try {
    const fd = await fsPromises.open(filePath, 'r+');
    await fd.close();
  } catch (e) {
    if (e.code === 'EBUSY') {
      result.isInUse = true;
      result.status = 'in_use';
    } else if (e.code === 'EACCES' || e.code === 'EPERM') {
      if (result.status === 'accessible') {
        result.status = 'restricted';
      }
      result.canWrite = false;
    }
  }

  return result;
}

/**
 * Get file owner quickly (with caching for performance)
 * @param {string} filePath
 * @returns {Promise<string>}
 */
async function getFileOwnerQuick(filePath) {
  try {
    const psCommand = `(Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}').Owner`;
    const { stdout } = await executePowerShell(psCommand, { timeout: 3000 });
    return stdout.trim() || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

/**
 * Recursive directory scanner helper
 * Optimized with parallel processing for speed
 */
async function scanDirectoryRecursive(dirPath, currentDepth, maxDepth, recursive, includeHidden, filter, detectStatus = false, limit = 0) {
  const files = [];
  const folders = [];
  let totalSize = 0;

  try {
    const entries = await fsPromises.readdir(dirPath, { withFileTypes: true });

    // Filter entries first (fast operation)
    const filteredEntries = entries.filter(entry => {
      if (!includeHidden && entry.name.startsWith('.')) return false;
      return true;
    });

    // Process entries in parallel batches for speed
    const BATCH_SIZE = 50;
    for (let i = 0; i < filteredEntries.length; i += BATCH_SIZE) {
      const batch = filteredEntries.slice(i, i + BATCH_SIZE);

      const batchResults = await Promise.all(batch.map(async (entry) => {
        const fullPath = path.join(dirPath, entry.name);

        try {
          const stats = await fsPromises.stat(fullPath);
          const isHidden = entry.name.startsWith('.');

          const item = {
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            isHidden,
            size: stats.size,
            created: stats.birthtime.toISOString(),
            modified: stats.mtime.toISOString(),
            accessed: stats.atime.toISOString(),
            isProtected: isProtectedPath(fullPath),
            // Default status (fast) - can be loaded later if needed
            status: 'accessible',
            canRead: true,
            canWrite: true,
            isInUse: false
          };

          // Only detect status if explicitly requested (slow operation)
          if (detectStatus) {
            const statusInfo = await detectFileStatus(fullPath, stats);
            item.status = statusInfo.status;
            item.canRead = statusInfo.canRead;
            item.canWrite = statusInfo.canWrite;
            item.isInUse = statusInfo.isInUse;
          }

          if (entry.isDirectory()) {
            item.sizeFormatted = '—';
            return { type: 'folder', item };
          } else {
            // Apply filter if specified
            if (filter && !entry.name.toLowerCase().endsWith(filter.toLowerCase())) {
              return null;
            }
            item.extension = path.extname(entry.name).toLowerCase();
            item.sizeFormatted = formatBytes(stats.size);
            return { type: 'file', item, size: stats.size };
          }
        } catch (e) {
          // File not accessible - add it as locked
          return {
            type: entry.isDirectory() ? 'folder' : 'file',
            item: {
              name: entry.name,
              path: fullPath,
              isDirectory: entry.isDirectory(),
              isHidden: entry.name.startsWith('.'),
              size: 0,
              sizeFormatted: '—',
              created: new Date().toISOString(),
              modified: new Date().toISOString(),
              accessed: new Date().toISOString(),
              isProtected: isProtectedPath(fullPath),
              status: 'locked',
              canRead: false,
              canWrite: false,
              isInUse: false,
              extension: path.extname(entry.name).toLowerCase()
            },
            size: 0
          };
        }
      }));

      // Collect results
      for (const result of batchResults) {
        if (!result) continue;
        if (result.type === 'folder') {
          folders.push(result.item);
        } else {
          files.push(result.item);
          totalSize += result.size || 0;
        }
      }

      // Check limit
      if (limit > 0 && (files.length + folders.length) >= limit) {
        break;
      }
    }

    // Handle recursive scanning (only if not limited)
    if (recursive && currentDepth < maxDepth && (limit === 0 || (files.length + folders.length) < limit)) {
      for (const folder of folders) {
        try {
          const subResult = await scanDirectoryRecursive(
            folder.path, currentDepth + 1, maxDepth, recursive, includeHidden, filter, detectStatus, 0
          );
          files.push(...subResult.files);
          folders.push(...subResult.folders);
          totalSize += subResult.totalSize;
        } catch (e) {
          // Skip inaccessible subdirectories
        }
      }
    }

    return { files, folders, totalSize };

  } catch (e) {
    // Directory not accessible
    return { files, folders, totalSize };
  }
}

/**
 * Check if a file is hidden (Windows)
 * @param {string} filePath
 * @returns {Promise<boolean>}
 */
async function isFileHiddenWindows(filePath) {
  try {
    const psCommand = `(Get-Item -LiteralPath '${filePath.replace(/'/g, "''")}' -Force).Attributes -band [System.IO.FileAttributes]::Hidden`;
    const { stdout } = await executePowerShell(psCommand, { timeout: 5000 });
    return stdout.trim().toLowerCase() === 'true' || stdout.trim() === 'Hidden';
  } catch (e) {
    return false;
  }
}

/**
 * Get detailed information about a file or folder
 * @param {string} filePath - Path to file or folder
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getFileDetails(filePath) {
  try {
    const stats = await fsPromises.stat(filePath);
    const isDirectory = stats.isDirectory();

    // Get Windows-specific attributes via PowerShell
    const psCommand = `
      $item = Get-Item -LiteralPath '${filePath.replace(/'/g, "''")}' -Force;
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      [PSCustomObject]@{
        Attributes = $item.Attributes.ToString();
        Owner = $acl.Owner;
        IsReadOnly = $item.IsReadOnly;
        IsSystem = ($item.Attributes -band [System.IO.FileAttributes]::System) -ne 0;
        IsEncrypted = ($item.Attributes -band [System.IO.FileAttributes]::Encrypted) -ne 0;
        IsCompressed = ($item.Attributes -band [System.IO.FileAttributes]::Compressed) -ne 0;
        IsHidden = ($item.Attributes -band [System.IO.FileAttributes]::Hidden) -ne 0
      } | ConvertTo-Json -Compress
    `;

    let windowsDetails = {};
    try {
      windowsDetails = await executePowerShellJson(psCommand, { timeout: 10000 });
    } catch (e) {
      windowsDetails = {
        Attributes: 'Unknown',
        Owner: 'Unknown',
        IsReadOnly: false,
        IsSystem: false,
        IsEncrypted: false,
        IsCompressed: false,
        IsHidden: false
      };
    }

    const details = {
      name: path.basename(filePath),
      path: filePath,
      parentPath: path.dirname(filePath),
      isDirectory,
      isHidden: windowsDetails.IsHidden || false,
      isProtected: isProtectedPath(filePath),

      // Size info
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),

      // Timestamps
      created: stats.birthtime.toISOString(),
      modified: stats.mtime.toISOString(),
      accessed: stats.atime.toISOString(),

      // Windows attributes
      attributes: windowsDetails.Attributes,
      owner: windowsDetails.Owner,
      isReadOnly: windowsDetails.IsReadOnly,
      isSystem: windowsDetails.IsSystem,
      isEncrypted: windowsDetails.IsEncrypted,
      isCompressed: windowsDetails.IsCompressed
    };

    if (!isDirectory) {
      details.extension = path.extname(filePath).toLowerCase();
      details.nameWithoutExtension = path.basename(filePath, details.extension);
    }

    return {
      success: true,
      data: details
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get file details: ${error.message}`
    };
  }
}

/**
 * Check file/folder status (exists, accessible, locked)
 * @param {string} filePath
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getFileStatus(filePath) {
  try {
    const exists = fs.existsSync(filePath);

    if (!exists) {
      return {
        success: true,
        data: {
          exists: false,
          accessible: false,
          locked: false,
          path: filePath
        }
      };
    }

    let accessible = true;
    let locked = false;
    let lockingProcesses = [];

    // Try to open the file to check if it's accessible/locked
    const stats = await fsPromises.stat(filePath);

    if (!stats.isDirectory()) {
      try {
        // Try to open with exclusive access to check if locked
        const fd = await fsPromises.open(filePath, 'r+');
        await fd.close();
      } catch (e) {
        if (e.code === 'EBUSY' || e.code === 'EACCES' || e.code === 'EPERM') {
          locked = true;
        }
        if (e.code === 'EACCES' || e.code === 'EPERM') {
          accessible = false;
        }
      }
    }

    return {
      success: true,
      data: {
        exists: true,
        accessible,
        locked,
        lockingProcesses,
        isDirectory: stats.isDirectory(),
        isProtected: isProtectedPath(filePath),
        path: filePath
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get file status: ${error.message}`
    };
  }
}

/**
 * Delete a file or folder (standard delete, not force)
 * @param {string} filePath
 * @param {Object} [options]
 * @param {boolean} [options.recursive=false] - Delete folders recursively
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function deleteFile(filePath, options = {}) {
  const { recursive = false } = options;

  try {
    // Safety check
    if (isProtectedPath(filePath)) {
      logService.logError(OperationType.DELETE, `Blocked: Cannot delete protected path`, filePath);
      return {
        success: false,
        message: `Cannot delete protected system path: ${filePath}`
      };
    }

    const stats = await fsPromises.stat(filePath);

    if (stats.isDirectory()) {
      if (recursive) {
        await fsPromises.rm(filePath, { recursive: true, force: false });
      } else {
        await fsPromises.rmdir(filePath);
      }
      logService.logSuccess(OperationType.DELETE, `Deleted folder`, filePath);
    } else {
      await fsPromises.unlink(filePath);
      logService.logSuccess(OperationType.DELETE, `Deleted file`, filePath);
    }

    return {
      success: true,
      message: `Successfully deleted: ${filePath}`
    };

  } catch (error) {
    logService.logError(OperationType.DELETE, `Delete failed: ${error.message}`, filePath);
    return {
      success: false,
      message: `Failed to delete: ${error.message}`
    };
  }
}

/**
 * Format bytes to human-readable string
 * @param {number} bytes
 * @returns {string}
 */
function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  scanDirectory,
  getFileDetails,
  getFileStatus,
  deleteFile,
  isProtectedPath
};
