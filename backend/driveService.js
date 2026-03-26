/**
 * DeadBYTE - Drive Service
 * =========================
 * Detects all drives on the system and returns detailed information.
 * Uses PowerShell for Windows drive detection.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Get all drives with detailed information
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
async function getAllDrives() {
  try {
    // PowerShell command with semicolons for single-line execution
    const psCommand = `
      Get-WmiObject -Class Win32_LogicalDisk | ForEach-Object {
        $drive = $_;
        $health = 'healthy';
        $percentUsed = 0;
        if ($drive.Size -gt 0) {
          $percentUsed = [math]::Round((($drive.Size - $drive.FreeSpace) / $drive.Size) * 100, 1);
          if ($percentUsed -ge 90) { $health = 'critical' }
          elseif ($percentUsed -ge 75) { $health = 'warning' }
        };
        [PSCustomObject]@{
          letter = $drive.DeviceID -replace ':', '';
          label = if ($drive.VolumeName) { $drive.VolumeName } else { 'Local Disk' };
          fileSystem = $drive.FileSystem;
          driveType = $drive.DriveType;
          totalSize = $drive.Size;
          freeSpace = $drive.FreeSpace;
          usedSpace = $drive.Size - $drive.FreeSpace;
          percentUsed = $percentUsed;
          isSystemDrive = ($drive.DeviceID -eq $env:SystemDrive);
          isRemovable = ($drive.DriveType -eq 2);
          health = $health
        }
      } | ConvertTo-Json -Compress
    `;

    // Encode as Base64 to avoid escaping issues
    const encodedCommand = Buffer.from(psCommand, 'utf16le').toString('base64');

    const { stdout, stderr } = await execPromise(
      `powershell -NoProfile -NonInteractive -EncodedCommand ${encodedCommand}`,
      { maxBuffer: 1024 * 1024 }
    );

    if (stderr && !stdout) {
      return {
        success: false,
        message: `PowerShell error: ${stderr}`
      };
    }

    let drives = JSON.parse(stdout || '[]');

    // Ensure it's always an array (single drive returns object)
    if (!Array.isArray(drives)) {
      drives = [drives];
    }

    // Filter out null/empty drives and format the data
    const formattedDrives = drives
      .filter(d => d && d.letter && d.totalSize > 0)
      .map(d => ({
        letter: d.letter,
        label: d.label || 'Local Disk',
        fileSystem: d.fileSystem || 'Unknown',
        driveType: getDriveTypeName(d.driveType),
        totalSize: d.totalSize || 0,
        freeSpace: d.freeSpace || 0,
        usedSpace: d.usedSpace || 0,
        percentUsed: d.percentUsed || 0,
        isSystemDrive: d.isSystemDrive || false,
        isRemovable: d.isRemovable || false,
        health: d.health || 'healthy',
        // Formatted strings for UI
        totalSizeFormatted: formatBytes(d.totalSize),
        freeSpaceFormatted: formatBytes(d.freeSpace),
        usedSpaceFormatted: formatBytes(d.usedSpace)
      }));

    return {
      success: true,
      data: formattedDrives
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get drives: ${error.message}`
    };
  }
}

/**
 * Get information for a specific drive
 * @param {string} driveLetter - Drive letter (e.g., 'C')
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getDriveInfo(driveLetter) {
  try {
    const result = await getAllDrives();

    if (!result.success) {
      return result;
    }

    const drive = result.data.find(d =>
      d.letter.toUpperCase() === driveLetter.toUpperCase()
    );

    if (!drive) {
      return {
        success: false,
        message: `Drive ${driveLetter}: not found`
      };
    }

    return {
      success: true,
      data: drive
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to get drive info: ${error.message}`
    };
  }
}

/**
 * Refresh drive list (same as getAllDrives but named for clarity)
 * @returns {Promise<{success: boolean, data?: Array, message?: string}>}
 */
async function refreshDrives() {
  return getAllDrives();
}

/**
 * Convert drive type number to readable name
 * @param {number} driveType
 * @returns {string}
 */
function getDriveTypeName(driveType) {
  const types = {
    0: 'Unknown',
    1: 'No Root Directory',
    2: 'Removable',
    3: 'Local Disk',
    4: 'Network',
    5: 'CD-ROM',
    6: 'RAM Disk'
  };
  return types[driveType] || 'Unknown';
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
  getAllDrives,
  getDriveInfo,
  refreshDrives
};
