/**
 * DeadBYTE - Force Delete Service
 * =================================
 * The nuclear option for file deletion.
 * Combines ownership, permissions, process killing, and multiple delete methods.
 */

const fs = require('fs');
const fsPromises = require('fs/promises');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { executePowerShell } = require('./utils/powershell');

// Import other services
const logService = require('./logService');
const { OperationType } = logService;
const fileService = require('./fileService');
const ownershipService = require('./ownershipService');
const permissionService = require('./permissionService');
const processService = require('./processService');

// ============================================
// SECURITY: Symlink and Path Validation
// ============================================

/**
 * Check if a path is a symlink
 * @param {string} filePath - Path to check
 * @returns {boolean} True if symlink
 */
function isSymlink(filePath) {
  try {
    const stats = fs.lstatSync(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Get the real path, resolving symlinks
 * @param {string} filePath - Path to resolve
 * @returns {string|null} Real path or null if resolution fails
 */
function getRealPath(filePath) {
  try {
    return fs.realpathSync(filePath);
  } catch {
    return null;
  }
}

/**
 * Validate a file path for security issues
 * Returns the resolved real path if safe, or an error object
 * @param {string} filePath - Path to validate
 * @returns {{safe: boolean, realPath?: string, error?: string}}
 */
function validatePathSecurity(filePath) {
  // Check for null bytes (path injection)
  if (filePath.includes('\0')) {
    return { safe: false, error: 'Path contains null bytes' };
  }

  // Check for path traversal
  if (filePath.includes('..')) {
    return { safe: false, error: 'Path traversal detected' };
  }

  // Normalize and resolve the path
  const normalizedPath = path.normalize(filePath);

  // Check if the path exists
  if (!fs.existsSync(normalizedPath)) {
    return { safe: true, realPath: normalizedPath }; // Non-existent files are safe to "delete"
  }

  // CRITICAL: Check if it's a symlink and resolve it
  if (isSymlink(normalizedPath)) {
    const realPath = getRealPath(normalizedPath);
    if (!realPath) {
      return { safe: false, error: 'Cannot resolve symlink target' };
    }

    // Check if the REAL target is protected (not the symlink itself)
    if (fileService.isProtectedPath(realPath)) {
      return {
        safe: false,
        error: `Symlink points to protected path: ${realPath}`
      };
    }

    // Also log that we detected a symlink
    logService.logWarning(
      OperationType.FORCE_DELETE,
      `Symlink detected: ${normalizedPath} -> ${realPath}`,
      normalizedPath
    );

    return { safe: true, realPath: normalizedPath, isSymlink: true, target: realPath };
  }

  // For regular files/folders, check protection
  if (fileService.isProtectedPath(normalizedPath)) {
    return { safe: false, error: `Protected system path: ${normalizedPath}` };
  }

  return { safe: true, realPath: normalizedPath };
}

/**
 * Force delete a file or folder using multiple escalating methods
 */
async function forceDelete(filePath, options = {}) {
  const {
    takeOwnership = true,
    killProcesses = true,
    useCmd = true,
    usePowerShell = true,
    recursive = true
  } = options;

  try {
    // SECURITY: Comprehensive path validation including symlink resolution
    const validation = validatePathSecurity(filePath);
    if (!validation.safe) {
      logService.logError(OperationType.FORCE_DELETE, `Blocked: ${validation.error}`, filePath);
      return { success: false, message: validation.error };
    }

    // Use the validated real path
    const safePath = validation.realPath;

    // Check if file exists (might have been deleted between validation and now)
    if (!fs.existsSync(safePath)) {
      return { success: true, message: 'File does not exist (already deleted)', method: 'none' };
    }

    // SECURITY: Double-check protection status after existence check (race condition mitigation)
    // Re-check in case the file was replaced between our check and now
    if (isSymlink(safePath)) {
      const currentTarget = getRealPath(safePath);
      if (currentTarget && fileService.isProtectedPath(currentTarget)) {
        logService.logError(OperationType.FORCE_DELETE, `Blocked: Symlink target changed to protected path`, safePath);
        return { success: false, message: 'Security check failed: symlink target is protected' };
      }
    }

    logService.logInfo(OperationType.FORCE_DELETE, `Starting force delete operation`, safePath);

    const isDirectory = fs.lstatSync(safePath).isDirectory();
    const methods = [];

    // Method 1: Try standard delete first
    const standardResult = await tryStandardDelete(safePath, recursive);
    methods.push({ name: 'standard', success: standardResult.success });
    if (standardResult.success) {
      logService.logSuccess(OperationType.FORCE_DELETE, `Deleted with standard method`, safePath);
      return { success: true, message: 'Deleted successfully', method: 'standard' };
    }

    // Method 2: Kill locking processes
    if (killProcesses && !isDirectory) {
      const processResult = await killLockingProcesses(safePath);
      methods.push({ name: 'kill_processes', success: processResult.killed > 0 });
      if (processResult.killed > 0) {
        await sleep(500);
        const retryResult = await tryStandardDelete(safePath, recursive);
        if (retryResult.success) {
          logService.logSuccess(OperationType.FORCE_DELETE, `Deleted after killing ${processResult.killed} processes`, safePath);
          return { success: true, message: `Deleted after killing ${processResult.killed} locking processes`, method: 'kill_processes' };
        }
      }
    }

    // Method 3: Take ownership and set permissions
    if (takeOwnership) {
      const ownerResult = await ownershipService.takeOwnership(safePath, { recursive });
      methods.push({ name: 'take_ownership', success: ownerResult.success });
      if (ownerResult.success) {
        await permissionService.grantFullControl(safePath);
        const retryResult = await tryStandardDelete(safePath, recursive);
        if (retryResult.success) {
          logService.logSuccess(OperationType.FORCE_DELETE, `Deleted after taking ownership`, safePath);
          return { success: true, message: 'Deleted after taking ownership', method: 'take_ownership' };
        }
      }
    }

    // Method 4: Use CMD del/rmdir
    if (useCmd) {
      const cmdResult = await tryCmdDelete(safePath, isDirectory, recursive);
      methods.push({ name: 'cmd', success: cmdResult.success });
      if (cmdResult.success) {
        logService.logSuccess(OperationType.FORCE_DELETE, `Deleted with CMD`, safePath);
        return { success: true, message: 'Deleted with CMD', method: 'cmd' };
      }
    }

    // Method 5: Use PowerShell Remove-Item -Force
    if (usePowerShell) {
      const psResult = await tryPowerShellDelete(safePath, recursive);
      methods.push({ name: 'powershell', success: psResult.success });
      if (psResult.success) {
        logService.logSuccess(OperationType.FORCE_DELETE, `Deleted with PowerShell`, safePath);
        return { success: true, message: 'Deleted with PowerShell', method: 'powershell' };
      }
    }

    // Method 6: Use robocopy to empty directory
    if (isDirectory) {
      const robocopyResult = await tryRobocopyDelete(safePath);
      methods.push({ name: 'robocopy', success: robocopyResult.success });
      if (robocopyResult.success) {
        logService.logSuccess(OperationType.FORCE_DELETE, `Deleted with robocopy method`, safePath);
        return { success: true, message: 'Deleted with robocopy method', method: 'robocopy' };
      }
    }

    // Method 7: Schedule for deletion on reboot
    const rebootResult = await scheduleDeleteOnReboot(safePath);
    methods.push({ name: 'schedule_reboot', success: rebootResult.success });
    if (rebootResult.success) {
      logService.logWarning(OperationType.FORCE_DELETE, `Scheduled for deletion on next reboot`, safePath);
      return { success: true, message: 'File scheduled for deletion on next reboot', method: 'schedule_reboot', requiresReboot: true };
    }

    // All methods failed
    logService.logError(OperationType.FORCE_DELETE, `All deletion methods failed`, safePath, { methods });
    return { success: false, message: 'All deletion methods failed. File may be in use by a system process or protected.', methods };

  } catch (error) {
    logService.logError(OperationType.FORCE_DELETE, `Force delete error: ${error.message}`, filePath);
    return { success: false, message: `Force delete failed: ${error.message}` };
  }
}

async function tryStandardDelete(filePath, recursive) {
  try {
    const stats = await fsPromises.stat(filePath);
    if (stats.isDirectory()) {
      await fsPromises.rm(filePath, { recursive, force: true, maxRetries: 3 });
    } else {
      await fsPromises.unlink(filePath);
    }
    return { success: !fs.existsSync(filePath) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function killLockingProcesses(filePath) {
  try {
    const lockingResult = await processService.findLockingProcesses(filePath);
    if (!lockingResult.success || !lockingResult.data || lockingResult.data.length === 0) {
      return { killed: 0 };
    }
    let killed = 0;
    for (const proc of lockingResult.data) {
      if (!proc.isProtected) {
        const killResult = await processService.killProcess(proc.pid, { force: true });
        if (killResult.success) killed++;
      }
    }
    return { killed };
  } catch (e) {
    return { killed: 0 };
  }
}

async function tryCmdDelete(filePath, isDirectory, recursive) {
  try {
    let command;
    if (isDirectory) {
      command = recursive ? `rmdir /S /Q "${filePath}"` : `rmdir /Q "${filePath}"`;
    } else {
      command = `del /F /Q "${filePath}"`;
    }
    await execPromise(command, { timeout: 30000 });
    return { success: !fs.existsSync(filePath) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function tryPowerShellDelete(filePath, recursive) {
  try {
    const recursiveFlag = recursive ? '-Recurse' : '';
    const psCommand = `Remove-Item -LiteralPath '${filePath.replace(/'/g, "''")}' -Force ${recursiveFlag} -ErrorAction Stop`;
    await executePowerShell(psCommand, { timeout: 30000 });
    return { success: !fs.existsSync(filePath) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function tryRobocopyDelete(dirPath) {
  try {
    const tempDir = path.join(process.env.TEMP || 'C:\\Temp', `deadbyte_empty_${Date.now()}`);
    await fsPromises.mkdir(tempDir, { recursive: true });
    await execPromise(`robocopy "${tempDir}" "${dirPath}" /MIR /R:1 /W:1`, { timeout: 60000 });
    await execPromise(`rmdir /Q "${dirPath}"`, { timeout: 10000 });
    await fsPromises.rmdir(tempDir).catch(() => {});
    return { success: !fs.existsSync(dirPath) };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

async function scheduleDeleteOnReboot(filePath) {
  try {
    const psCommand = `
      Add-Type @"
        using System;
        using System.Runtime.InteropServices;
        public class FileDeleter {
          [DllImport("kernel32.dll", SetLastError = true, CharSet = CharSet.Unicode)]
          public static extern bool MoveFileEx(string lpExistingFileName, string lpNewFileName, int dwFlags);
          public const int MOVEFILE_DELAY_UNTIL_REBOOT = 0x4;
        }
"@;
      [FileDeleter]::MoveFileEx('${filePath.replace(/'/g, "''")}', $null, [FileDeleter]::MOVEFILE_DELAY_UNTIL_REBOOT)
    `;
    const { stdout } = await executePowerShell(psCommand, { timeout: 10000 });
    return { success: stdout.trim().toLowerCase() === 'true' };
  } catch (e) {
    return { success: false, error: e.message };
  }
}

/**
 * Force delete multiple files
 */
async function forceDeleteMultiple(filePaths, options = {}) {
  const results = [];
  let successCount = 0;
  let failCount = 0;
  let rebootRequired = false;

  for (const filePath of filePaths) {
    if (fileService.isProtectedPath(filePath)) {
      results.push({ path: filePath, success: false, message: 'Protected system path' });
      failCount++;
      continue;
    }
    const result = await forceDelete(filePath, options);
    results.push({ path: filePath, ...result });
    if (result.success) {
      successCount++;
      if (result.requiresReboot) rebootRequired = true;
    } else {
      failCount++;
    }
  }

  return {
    success: failCount === 0,
    results,
    summary: { total: filePaths.length, succeeded: successCount, failed: failCount, rebootRequired }
  };
}

/**
 * Analyze a file to determine the best deletion strategy
 */
async function analyzeForDeletion(filePath) {
  try {
    const analysis = {
      path: filePath,
      exists: fs.existsSync(filePath),
      isProtected: fileService.isProtectedPath(filePath),
      isDirectory: false,
      isLocked: false,
      lockingProcesses: [],
      hasRestrictedPermissions: false,
      currentOwner: null,
      recommendedMethod: 'standard',
      estimatedDifficulty: 'easy'
    };

    if (!analysis.exists) {
      return { success: true, data: { ...analysis, recommendedMethod: 'none', message: 'File does not exist' } };
    }

    if (analysis.isProtected) {
      return { success: true, data: { ...analysis, recommendedMethod: 'blocked', estimatedDifficulty: 'impossible', message: 'Protected system path' } };
    }

    const stats = fs.statSync(filePath);
    analysis.isDirectory = stats.isDirectory();
    analysis.size = stats.size;

    if (!analysis.isDirectory) {
      const lockResult = await processService.findLockingProcesses(filePath);
      if (lockResult.success && lockResult.data.length > 0) {
        analysis.isLocked = true;
        analysis.lockingProcesses = lockResult.data;
        analysis.estimatedDifficulty = 'medium';
        analysis.recommendedMethod = 'kill_processes';
      }
    }

    const permResult = await permissionService.getPermissions(filePath);
    if (permResult.success) {
      const summary = permResult.data.summary;
      if (!summary.canDelete) {
        analysis.hasRestrictedPermissions = true;
        analysis.estimatedDifficulty = 'hard';
        analysis.recommendedMethod = 'take_ownership';
      }
    }

    const ownerResult = await ownershipService.getOwner(filePath);
    if (ownerResult.success) {
      analysis.currentOwner = ownerResult.data.owner;
      if (!ownerResult.data.isCurrentUser) {
        analysis.estimatedDifficulty = 'hard';
        analysis.recommendedMethod = 'take_ownership';
      }
    }

    if (analysis.isLocked && analysis.hasRestrictedPermissions) {
      analysis.estimatedDifficulty = 'very_hard';
      analysis.recommendedMethod = 'full_force';
    }

    return { success: true, data: analysis };

  } catch (error) {
    return { success: false, message: `Analysis failed: ${error.message}` };
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  forceDelete,
  forceDeleteMultiple,
  analyzeForDeletion
};
