/**
 * DeadBYTE - Admin Service
 * =========================
 * Handles administrator privilege detection and elevation.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { executePowerShell, executePowerShellJson } = require('./utils/powershell');

// Cache admin status to avoid repeated checks
let cachedAdminStatus = null;
let lastAdminCheck = 0;
const ADMIN_CHECK_CACHE_MS = 5000; // Cache for 5 seconds

/**
 * Check if the application is running with administrator privileges
 * @param {boolean} [forceRefresh=false] - Force a fresh check, bypassing cache
 * @returns {Promise<{success: boolean, isAdmin: boolean, message?: string}>}
 */
async function isRunningAsAdmin(forceRefresh = false) {
  try {
    const now = Date.now();

    // Return cached result if still valid
    if (!forceRefresh && cachedAdminStatus !== null && (now - lastAdminCheck) < ADMIN_CHECK_CACHE_MS) {
      return {
        success: true,
        isAdmin: cachedAdminStatus
      };
    }

    // Method 1: Try 'net session' command (fast and reliable)
    try {
      await execPromise('net session', { timeout: 5000 });
      cachedAdminStatus = true;
      lastAdminCheck = now;
      return {
        success: true,
        isAdmin: true
      };
    } catch (e) {
      // 'net session' fails if not admin
      cachedAdminStatus = false;
      lastAdminCheck = now;
      return {
        success: true,
        isAdmin: false
      };
    }

  } catch (error) {
    return {
      success: false,
      isAdmin: false,
      message: `Failed to check admin status: ${error.message}`
    };
  }
}

/**
 * Check if running as admin (synchronous version for startup)
 * @returns {boolean}
 */
function isRunningAsAdminSync() {
  try {
    const { execSync } = require('child_process');
    execSync('net session', { stdio: 'ignore', timeout: 5000 });
    cachedAdminStatus = true;
    lastAdminCheck = Date.now();
    return true;
  } catch (e) {
    cachedAdminStatus = false;
    lastAdminCheck = Date.now();
    return false;
  }
}

/**
 * Get current user information
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getCurrentUser() {
  try {
    const username = process.env.USERNAME || process.env.USER || 'Unknown';
    const domain = process.env.USERDOMAIN || process.env.COMPUTERNAME || '';

    // Get more details via PowerShell
    const psCommand = `
      $user = [System.Security.Principal.WindowsIdentity]::GetCurrent();
      $principal = New-Object System.Security.Principal.WindowsPrincipal($user);
      $adminRole = [System.Security.Principal.WindowsBuiltInRole]::Administrator;
      [PSCustomObject]@{
        Name = $user.Name;
        IsAdmin = $principal.IsInRole($adminRole);
        AuthType = $user.AuthenticationType;
        IsSystem = $user.IsSystem;
        Groups = ($user.Groups | ForEach-Object { $_.Translate([System.Security.Principal.NTAccount]).Value }) -join ';'
      } | ConvertTo-Json -Compress
    `;

    try {
      const userInfo = await executePowerShellJson(psCommand, { timeout: 10000 });

      return {
        success: true,
        data: {
          username: username,
          domain: domain,
          fullName: userInfo.Name,
          isAdmin: userInfo.IsAdmin,
          authType: userInfo.AuthType,
          isSystem: userInfo.IsSystem,
          groups: userInfo.Groups ? userInfo.Groups.split(';').filter(g => g) : []
        }
      };
    } catch (e) {
      // Fallback to basic info
      return {
        success: true,
        data: {
          username: username,
          domain: domain,
          fullName: `${domain}\\${username}`,
          isAdmin: cachedAdminStatus || false,
          authType: 'Unknown',
          isSystem: false,
          groups: []
        }
      };
    }

  } catch (error) {
    return {
      success: false,
      message: `Failed to get user info: ${error.message}`
    };
  }
}

/**
 * Get system privileges status
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getPrivilegesStatus() {
  try {
    const psCommand = `
      $privileges = whoami /priv /fo csv | ConvertFrom-Csv;
      $privileges | ForEach-Object {
        [PSCustomObject]@{
          Name = $_.'Privilege Name';
          State = $_.State
        }
      } | ConvertTo-Json -Compress
    `;

    const privileges = await executePowerShellJson(psCommand, { timeout: 10000 });
    const privArray = Array.isArray(privileges) ? privileges : [privileges].filter(Boolean);

    // Key privileges we care about
    const keyPrivileges = [
      'SeBackupPrivilege',
      'SeRestorePrivilege',
      'SeTakeOwnershipPrivilege',
      'SeDebugPrivilege',
      'SeSecurityPrivilege'
    ];

    const relevantPrivileges = privArray.filter(p =>
      keyPrivileges.includes(p.Name)
    );

    return {
      success: true,
      data: {
        all: privArray,
        relevant: relevantPrivileges,
        canTakeOwnership: privArray.some(p => p.Name === 'SeTakeOwnershipPrivilege' && p.State === 'Enabled'),
        canBackup: privArray.some(p => p.Name === 'SeBackupPrivilege' && p.State === 'Enabled'),
        canRestore: privArray.some(p => p.Name === 'SeRestorePrivilege' && p.State === 'Enabled'),
        canDebug: privArray.some(p => p.Name === 'SeDebugPrivilege' && p.State === 'Enabled')
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get privileges: ${error.message}`
    };
  }
}

/**
 * Request elevation (shows UAC prompt to restart as admin)
 * Note: This will close the current app and restart with elevation
 * @returns {Promise<{success: boolean, message: string}>}
 */
async function requestElevation() {
  // This would typically use shell.openExternal or spawn with 'runas'
  // For now, we just return instructions since we can't automatically elevate
  return {
    success: false,
    message: 'To run as administrator, please right-click the DeadBYTE shortcut and select "Run as administrator".'
  };
}

/**
 * Check if a specific operation requires admin
 * @param {string} operation - Operation type
 * @returns {{required: boolean, reason: string}}
 */
function doesOperationRequireAdmin(operation) {
  const adminOperations = {
    'force_delete': { required: true, reason: 'Force delete requires administrator privileges to bypass file locks and permissions.' },
    'take_ownership': { required: true, reason: 'Taking ownership requires administrator privileges.' },
    'change_permissions': { required: true, reason: 'Changing file permissions on protected files requires administrator privileges.' },
    'kill_process': { required: true, reason: 'Killing system processes requires administrator privileges.' },
    'scan_system': { required: false, reason: 'Scanning can be done without admin, but some protected files may be inaccessible.' },
    'read_acl': { required: false, reason: 'Reading permissions generally does not require admin.' }
  };

  return adminOperations[operation] || { required: false, reason: 'Unknown operation.' };
}

module.exports = {
  isRunningAsAdmin,
  isRunningAsAdminSync,
  getCurrentUser,
  getPrivilegesStatus,
  requestElevation,
  doesOperationRequireAdmin
};
