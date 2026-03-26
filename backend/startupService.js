/**
 * DeadBYTE - Startup Service
 * ==========================
 * Manages Windows startup programs through registry and startup folders.
 * Allows reading, enabling, and disabling startup entries.
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Registry paths for startup programs
const REGISTRY_PATHS = {
  currentUser: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
  currentUserOnce: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
  localMachine: 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run',
  localMachineOnce: 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\RunOnce',
  // Disabled entries are stored here
  currentUserDisabled: 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run',
  localMachineDisabled: 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
};

// Startup folders
const STARTUP_FOLDERS = {
  currentUser: path.join(os.homedir(), 'AppData', 'Roaming', 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup'),
  allUsers: 'C:\\ProgramData\\Microsoft\\Windows\\Start Menu\\Programs\\Startup'
};

// Known high-impact programs (for impact estimation)
const HIGH_IMPACT_PATTERNS = [
  /adobe/i, /java/i, /oracle/i, /dropbox/i, /onedrive/i, /google.*drive/i,
  /steam/i, /epic.*games/i, /discord/i, /spotify/i, /teams/i, /slack/i,
  /skype/i, /zoom/i, /nvidia/i, /amd.*radeon/i, /razer/i, /corsair/i,
  /logitech/i, /itunes/i, /creative.*cloud/i
];

const MEDIUM_IMPACT_PATTERNS = [
  /update/i, /helper/i, /agent/i, /service/i, /tray/i, /monitor/i,
  /sync/i, /backup/i, /cloud/i
];

// ============================================
// SECURITY: Input Validation & Sanitization
// ============================================

/**
 * Validate a registry name to prevent command injection
 * Only allows alphanumeric, spaces, dots, dashes, underscores, and parentheses
 * @param {string} name - The registry name to validate
 * @returns {boolean} True if valid
 */
function isValidRegistryName(name) {
  if (!name || typeof name !== 'string') return false;
  // Max length check
  if (name.length > 260) return false;
  // Only allow safe characters for registry names
  // Alphanumeric, space, dot, dash, underscore, parentheses, and common symbols
  const safePattern = /^[a-zA-Z0-9\s\.\-_\(\)\[\]]+$/;
  return safePattern.test(name);
}

/**
 * Validate a file path to prevent path traversal and injection
 * @param {string} filePath - The path to validate
 * @returns {boolean} True if valid
 */
function isValidPath(filePath) {
  if (!filePath || typeof filePath !== 'string') return false;
  // Check for path traversal attempts
  if (filePath.includes('..')) return false;
  // Check for null bytes
  if (filePath.includes('\0')) return false;
  // Check for PowerShell escape sequences
  if (filePath.includes('`')) return false;
  return true;
}

/**
 * Execute PowerShell command safely using Base64 encoding
 * This prevents any command injection via quote escaping
 * @param {string} psScript - The PowerShell script to execute
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
function executePowerShellSafe(psScript, timeout = 10000) {
  return new Promise((resolve, reject) => {
    // Encode the script as Base64 to prevent any injection
    const encoded = Buffer.from(psScript, 'utf16le').toString('base64');
    const cmd = `powershell -NoProfile -NonInteractive -EncodedCommand ${encoded}`;

    exec(cmd, { timeout }, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
      }
    });
  });
}

/**
 * Get all startup programs from registry and startup folders
 * @returns {Promise<Object>} Startup programs data
 */
async function getStartupPrograms() {
  try {
    const [registryItems, folderItems] = await Promise.all([
      getRegistryStartupItems(),
      getFolderStartupItems()
    ]);

    const allItems = [...registryItems, ...folderItems];

    // Sort by name
    allItems.sort((a, b) => a.name.localeCompare(b.name));

    return {
      success: true,
      data: {
        items: allItems,
        count: allItems.length,
        enabledCount: allItems.filter(i => i.enabled).length,
        disabledCount: allItems.filter(i => !i.enabled).length,
        highImpactCount: allItems.filter(i => i.impact === 'high').length
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: { items: [], count: 0 }
    };
  }
}

/**
 * Get startup items from Windows registry
 * @returns {Promise<Array>} Registry startup items
 */
async function getRegistryStartupItems() {
  return new Promise((resolve) => {
    const items = [];

    // PowerShell command to get all startup registry entries
    const cmd = `powershell -NoProfile -Command "
      $results = @()

      # Current User Run
      try {
        $cuRun = Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue
        if ($cuRun) {
          $cuRun.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object {
            $results += @{
              Name = $_.Name
              Command = $_.Value
              Location = 'HKCU_Run'
              Scope = 'CurrentUser'
            }
          }
        }
      } catch {}

      # Local Machine Run (requires admin for write, but can read)
      try {
        $lmRun = Get-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run' -ErrorAction SilentlyContinue
        if ($lmRun) {
          $lmRun.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object {
            $results += @{
              Name = $_.Name
              Command = $_.Value
              Location = 'HKLM_Run'
              Scope = 'AllUsers'
            }
          }
        }
      } catch {}

      $results | ConvertTo-Json -Depth 3
    "`;

    exec(cmd, { timeout: 15000, maxBuffer: 1024 * 1024 }, async (error, stdout, stderr) => {
      if (error) {
        resolve([]);
        return;
      }

      try {
        let entries = JSON.parse(stdout.trim() || '[]');
        if (!Array.isArray(entries)) {
          entries = [entries];
        }

        // Get disabled status for each entry
        const disabledStatus = await getDisabledStatus();

        for (const entry of entries) {
          if (entry && entry.Name) {
            const isDisabled = disabledStatus.includes(entry.Name);
            const exePath = extractExePath(entry.Command);

            items.push({
              id: `reg_${entry.Location}_${entry.Name}`.replace(/[^a-zA-Z0-9_]/g, '_'),
              name: entry.Name,
              command: entry.Command,
              exePath: exePath,
              location: entry.Location,
              scope: entry.Scope,
              type: 'registry',
              enabled: !isDisabled,
              impact: estimateImpact(entry.Name, entry.Command),
              publisher: await getFilePublisher(exePath)
            });
          }
        }

        resolve(items);
      } catch (parseError) {
        resolve([]);
      }
    });
  });
}

/**
 * Get startup items from startup folders
 * @returns {Promise<Array>} Folder startup items
 */
async function getFolderStartupItems() {
  const items = [];

  for (const [scope, folderPath] of Object.entries(STARTUP_FOLDERS)) {
    try {
      if (!fs.existsSync(folderPath)) continue;

      const files = fs.readdirSync(folderPath);

      for (const file of files) {
        // Skip desktop.ini and hidden files
        if (file === 'desktop.ini' || file.startsWith('.')) continue;

        const fullPath = path.join(folderPath, file);
        const stats = fs.statSync(fullPath);

        if (stats.isFile()) {
          const ext = path.extname(file).toLowerCase();
          const name = path.basename(file, ext);

          // Handle shortcuts (.lnk files)
          let targetPath = fullPath;
          if (ext === '.lnk') {
            targetPath = await resolveShortcut(fullPath) || fullPath;
          }

          items.push({
            id: `folder_${scope}_${name}`.replace(/[^a-zA-Z0-9_]/g, '_'),
            name: name,
            command: targetPath,
            exePath: targetPath,
            location: folderPath,
            scope: scope === 'currentUser' ? 'CurrentUser' : 'AllUsers',
            type: 'folder',
            enabled: true, // Folder items are always enabled if present
            impact: estimateImpact(name, targetPath),
            publisher: await getFilePublisher(targetPath),
            fileName: file
          });
        }
      }
    } catch (error) {
      // Ignore folder read errors
    }
  }

  return items;
}

/**
 * Get list of disabled startup programs from registry
 * @returns {Promise<Array>} List of disabled program names
 */
async function getDisabledStatus() {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "
      $disabled = @()

      try {
        $cuDisabled = Get-ItemProperty -Path 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' -ErrorAction SilentlyContinue
        if ($cuDisabled) {
          $cuDisabled.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object {
            # Check if first bytes indicate disabled (starts with 03 or higher)
            $bytes = [System.BitConverter]::ToString($_.Value)
            if ($bytes -and ($bytes.StartsWith('03') -or $bytes.StartsWith('07'))) {
              $disabled += $_.Name
            }
          }
        }
      } catch {}

      try {
        $lmDisabled = Get-ItemProperty -Path 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run' -ErrorAction SilentlyContinue
        if ($lmDisabled) {
          $lmDisabled.PSObject.Properties | Where-Object { $_.Name -notlike 'PS*' } | ForEach-Object {
            $bytes = [System.BitConverter]::ToString($_.Value)
            if ($bytes -and ($bytes.StartsWith('03') -or $bytes.StartsWith('07'))) {
              $disabled += $_.Name
            }
          }
        }
      } catch {}

      $disabled | ConvertTo-Json
    "`;

    exec(cmd, { timeout: 10000 }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      try {
        let disabled = JSON.parse(stdout.trim() || '[]');
        if (!Array.isArray(disabled)) {
          disabled = [disabled];
        }
        resolve(disabled.filter(Boolean));
      } catch {
        resolve([]);
      }
    });
  });
}

/**
 * Enable a startup program
 * @param {string} itemId - The startup item ID
 * @param {Object} item - The full item object (needed for registry path info)
 * @returns {Promise<Object>} Result
 */
async function enableStartupItem(itemId, item) {
  if (!item) {
    return { success: false, message: 'Item not found' };
  }

  if (item.type === 'folder') {
    // Folder items can't be disabled through this method
    return { success: true, message: 'Folder startup items are always enabled' };
  }

  // SECURITY: Validate the item name to prevent command injection
  if (!isValidRegistryName(item.name)) {
    return { success: false, message: 'Invalid startup item name' };
  }

  // For registry items, we need to update StartupApproved
  const approvedPath = item.location.startsWith('HKCU')
    ? 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
    : 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run';

  // SECURITY: Use parameterized PowerShell script with Base64 encoding
  const psScript = `
    $regPath = '${approvedPath}'
    $itemName = '${item.name}'
    try {
      $enabledValue = [byte[]](0x02, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
      Set-ItemProperty -Path $regPath -Name $itemName -Value $enabledValue -Type Binary -ErrorAction Stop
      Write-Output 'SUCCESS'
    } catch {
      Write-Output ('ERROR: ' + $_.Exception.Message)
    }
  `;

  try {
    const { stdout } = await executePowerShellSafe(psScript, 10000);
    if (stdout.includes('ERROR')) {
      return {
        success: false,
        message: stdout.replace('ERROR: ', '') || 'Failed to enable startup item'
      };
    }
    return { success: true, message: `Enabled ${item.name}` };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to enable startup item' };
  }
}

/**
 * Disable a startup program
 * @param {string} itemId - The startup item ID
 * @param {Object} item - The full item object
 * @returns {Promise<Object>} Result
 */
async function disableStartupItem(itemId, item) {
  if (!item) {
    return { success: false, message: 'Item not found' };
  }

  if (item.type === 'folder') {
    // For folder items, we would need to move the file - not implementing for safety
    return {
      success: false,
      message: 'Startup folder items cannot be disabled through this interface. Remove the shortcut manually.'
    };
  }

  // SECURITY: Validate the item name to prevent command injection
  if (!isValidRegistryName(item.name)) {
    return { success: false, message: 'Invalid startup item name' };
  }

  const approvedPath = item.location.startsWith('HKCU')
    ? 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run'
    : 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Explorer\\StartupApproved\\Run';

  // SECURITY: Use parameterized PowerShell script with Base64 encoding
  const psScript = `
    $regPath = '${approvedPath}'
    $itemName = '${item.name}'
    try {
      $disabledValue = [byte[]](0x03, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00)
      Set-ItemProperty -Path $regPath -Name $itemName -Value $disabledValue -Type Binary -ErrorAction Stop
      Write-Output 'SUCCESS'
    } catch {
      Write-Output ('ERROR: ' + $_.Exception.Message)
    }
  `;

  try {
    const { stdout } = await executePowerShellSafe(psScript, 10000);
    if (stdout.includes('ERROR')) {
      return {
        success: false,
        message: stdout.replace('ERROR: ', '') || 'Failed to disable startup item'
      };
    }
    return { success: true, message: `Disabled ${item.name}` };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to disable startup item' };
  }
}

/**
 * Delete a startup program entry completely
 * @param {string} itemId - The startup item ID
 * @param {Object} item - The full item object
 * @returns {Promise<Object>} Result
 */
async function deleteStartupItem(itemId, item) {
  if (!item) {
    return { success: false, message: 'Item not found' };
  }

  if (item.type === 'folder') {
    // SECURITY: Validate file path before deletion
    if (!item.fileName || !isValidPath(item.fileName)) {
      return { success: false, message: 'Invalid file name' };
    }

    // Delete the file from startup folder
    try {
      const filePath = path.join(item.location, item.fileName);
      // SECURITY: Resolve to absolute path and verify it's within startup folder
      const resolvedPath = path.resolve(filePath);
      const startupFolder = path.resolve(item.location);

      if (!resolvedPath.startsWith(startupFolder)) {
        return { success: false, message: 'Path traversal detected' };
      }

      if (fs.existsSync(resolvedPath)) {
        fs.unlinkSync(resolvedPath);
        return { success: true, message: `Removed ${item.name} from startup folder` };
      } else {
        return { success: false, message: 'File not found' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // SECURITY: Validate the item name to prevent command injection
  if (!isValidRegistryName(item.name)) {
    return { success: false, message: 'Invalid startup item name' };
  }

  // For registry items, remove from Run key
  const runPath = item.location === 'HKCU_Run'
    ? 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    : 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

  // SECURITY: Use parameterized PowerShell script with Base64 encoding
  const psScript = `
    $regPath = '${runPath}'
    $itemName = '${item.name}'
    try {
      Remove-ItemProperty -Path $regPath -Name $itemName -ErrorAction Stop
      Write-Output 'SUCCESS'
    } catch {
      Write-Output ('ERROR: ' + $_.Exception.Message)
    }
  `;

  try {
    const { stdout } = await executePowerShellSafe(psScript, 10000);
    if (stdout.includes('ERROR')) {
      return {
        success: false,
        message: stdout.replace('ERROR: ', '') || 'Failed to delete startup item'
      };
    }
    return { success: true, message: `Deleted ${item.name} from startup` };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to delete startup item' };
  }
}

/**
 * Add a new startup program
 * @param {string} name - Display name for the startup entry
 * @param {string} command - Full command to execute
 * @param {string} scope - 'CurrentUser' or 'AllUsers'
 * @returns {Promise<Object>} Result
 */
async function addStartupItem(name, command, scope = 'CurrentUser') {
  // SECURITY: Validate the name to prevent command injection
  if (!isValidRegistryName(name)) {
    return { success: false, message: 'Invalid startup item name. Use only letters, numbers, spaces, and basic punctuation.' };
  }

  // SECURITY: Validate the command path
  if (!command || typeof command !== 'string' || command.length > 2048) {
    return { success: false, message: 'Invalid command' };
  }

  // SECURITY: Check for dangerous patterns in command
  if (!isValidPath(command)) {
    return { success: false, message: 'Invalid characters in command path' };
  }

  const runPath = scope === 'CurrentUser'
    ? 'HKCU:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run'
    : 'HKLM:\\Software\\Microsoft\\Windows\\CurrentVersion\\Run';

  // SECURITY: Use parameterized PowerShell script with Base64 encoding
  // We escape single quotes in the command for PowerShell string safety
  const escapedCommand = command.replace(/'/g, "''");
  const psScript = `
    $regPath = '${runPath}'
    $itemName = '${name}'
    $itemValue = '${escapedCommand}'
    try {
      Set-ItemProperty -Path $regPath -Name $itemName -Value $itemValue -ErrorAction Stop
      Write-Output 'SUCCESS'
    } catch {
      Write-Output ('ERROR: ' + $_.Exception.Message)
    }
  `;

  try {
    const { stdout } = await executePowerShellSafe(psScript, 10000);
    if (stdout.includes('ERROR')) {
      return {
        success: false,
        message: stdout.replace('ERROR: ', '') || 'Failed to add startup item'
      };
    }
    return { success: true, message: `Added ${name} to startup` };
  } catch (error) {
    return { success: false, message: error.message || 'Failed to add startup item' };
  }
}

/**
 * Get startup impact analysis
 * @returns {Promise<Object>} Impact analysis
 */
async function getStartupImpact() {
  const programs = await getStartupPrograms();

  if (!programs.success) {
    return programs;
  }

  const items = programs.data.items;
  const enabledItems = items.filter(i => i.enabled);

  // Calculate impact scores
  let totalImpact = 0;
  const impactBreakdown = {
    high: enabledItems.filter(i => i.impact === 'high'),
    medium: enabledItems.filter(i => i.impact === 'medium'),
    low: enabledItems.filter(i => i.impact === 'low')
  };

  // Score: high=3, medium=2, low=1
  totalImpact += impactBreakdown.high.length * 3;
  totalImpact += impactBreakdown.medium.length * 2;
  totalImpact += impactBreakdown.low.length * 1;

  // Max reasonable score (10 high impact programs)
  const maxScore = 30;
  const impactPercent = Math.min(100, (totalImpact / maxScore) * 100);

  // Estimate boot time impact (rough estimate: 0.5-3 seconds per program)
  const estimatedBootDelay =
    (impactBreakdown.high.length * 2.5) +
    (impactBreakdown.medium.length * 1.5) +
    (impactBreakdown.low.length * 0.5);

  return {
    success: true,
    data: {
      totalItems: items.length,
      enabledItems: enabledItems.length,
      disabledItems: items.length - enabledItems.length,
      impactScore: Math.round(impactPercent),
      impactLevel: impactPercent > 70 ? 'high' : impactPercent > 40 ? 'medium' : 'low',
      estimatedBootDelay: `${Math.round(estimatedBootDelay)}s`,
      breakdown: {
        high: impactBreakdown.high.map(i => i.name),
        medium: impactBreakdown.medium.map(i => i.name),
        low: impactBreakdown.low.map(i => i.name)
      },
      recommendations: generateRecommendations(impactBreakdown)
    }
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract executable path from command string
 */
function extractExePath(command) {
  if (!command) return '';

  // Handle quoted paths
  const quotedMatch = command.match(/^"([^"]+)"/);
  if (quotedMatch) return quotedMatch[1];

  // Handle unquoted paths (take up to first space or end)
  const parts = command.split(' ');
  return parts[0] || command;
}

/**
 * Estimate startup impact based on name and command
 */
function estimateImpact(name, command) {
  const combined = `${name} ${command}`.toLowerCase();

  // Check high impact patterns
  for (const pattern of HIGH_IMPACT_PATTERNS) {
    if (pattern.test(combined)) return 'high';
  }

  // Check medium impact patterns
  for (const pattern of MEDIUM_IMPACT_PATTERNS) {
    if (pattern.test(combined)) return 'medium';
  }

  return 'low';
}

/**
 * Get file publisher/company name
 */
async function getFilePublisher(exePath) {
  return new Promise((resolve) => {
    if (!exePath || !fs.existsSync(exePath)) {
      resolve('Unknown');
      return;
    }

    const cmd = `powershell -NoProfile -Command "(Get-ItemProperty '${exePath.replace(/'/g, "''")}').VersionInfo.CompanyName"`;

    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      const publisher = stdout?.trim() || 'Unknown';
      resolve(publisher);
    });
  });
}

/**
 * Resolve Windows shortcut (.lnk) to target path
 */
async function resolveShortcut(lnkPath) {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "(New-Object -ComObject WScript.Shell).CreateShortcut('${lnkPath.replace(/'/g, "''")}').TargetPath"`;

    exec(cmd, { timeout: 5000 }, (error, stdout) => {
      resolve(stdout?.trim() || null);
    });
  });
}

/**
 * Generate recommendations based on startup impact
 */
function generateRecommendations(breakdown) {
  const recommendations = [];

  if (breakdown.high.length > 3) {
    recommendations.push({
      type: 'warning',
      message: `You have ${breakdown.high.length} high-impact startup programs. Consider disabling unused ones to improve boot time.`
    });
  }

  // Check for common culprits
  const knownHeavy = ['Discord', 'Spotify', 'Steam', 'Epic Games', 'Adobe', 'Dropbox'];
  const heavyFound = breakdown.high.filter(item =>
    knownHeavy.some(k => item.name.toLowerCase().includes(k.toLowerCase()))
  );

  if (heavyFound.length > 0) {
    recommendations.push({
      type: 'suggestion',
      message: `Programs like ${heavyFound.slice(0, 3).map(i => i.name).join(', ')} can be started manually when needed instead of at boot.`
    });
  }

  if (breakdown.high.length + breakdown.medium.length > 10) {
    recommendations.push({
      type: 'info',
      message: 'Having many startup programs can significantly slow down your computer\'s boot time.'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'success',
      message: 'Your startup configuration looks good! Boot time impact is minimal.'
    });
  }

  return recommendations;
}

module.exports = {
  getStartupPrograms,
  enableStartupItem,
  disableStartupItem,
  deleteStartupItem,
  addStartupItem,
  getStartupImpact
};
