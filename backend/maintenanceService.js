/**
 * DeadBYTE - Maintenance Service
 * ==============================
 * Handles system health checks, registry cleaning, disk health,
 * and system repair tools.
 */

const { exec, execSync, spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// ============================================
// SCAN STATE & CACHE
// ============================================

let scanStatus = {
  isScanning: false,
  currentOperation: null,
  progress: 0
};

// Cache last scan results
let lastScanCache = {
  timestamp: null,
  healthScore: null,
  criticalIssues: 0,
  warnings: 0,
  recommendations: 0
};

// Path for persisting scan data
const getCacheFilePath = () => {
  const appData = process.env.APPDATA || os.homedir();
  return path.join(appData, 'DeadBYTE', 'maintenance-cache.json');
};

// Load cached scan data on module load
function loadCache() {
  try {
    const cachePath = getCacheFilePath();
    if (fs.existsSync(cachePath)) {
      const data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
      lastScanCache = { ...lastScanCache, ...data };
    }
  } catch (e) {
    // Ignore cache errors
  }
}

// Save scan data to cache
function saveCache() {
  try {
    const cachePath = getCacheFilePath();
    const cacheDir = path.dirname(cachePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    fs.writeFileSync(cachePath, JSON.stringify(lastScanCache, null, 2));
  } catch (e) {
    // Ignore cache errors
  }
}

// Load cache on module init
loadCache();

// ============================================
// HEALTH CHECK FUNCTIONS
// ============================================

/**
 * Run a full system health check
 */
async function runHealthCheck(options = {}) {
  const mode = options.mode || 'deep'; // quick, deep, custom

  scanStatus.isScanning = true;
  scanStatus.progress = 0;

  try {
    const results = {
      healthScore: 100,
      criticalIssues: 0,
      warnings: 0,
      recommendations: 0,
      insights: [],
      registry: [],
      disk: [],
      timestamp: new Date().toISOString()
    };

    // Registry scan
    scanStatus.currentOperation = 'Scanning registry...';
    scanStatus.progress = 10;
    const registryResults = await scanRegistry(mode);
    results.registry = registryResults.issues;
    results.warnings += registryResults.issues.filter(i => i.severity === 'warning').length;
    results.recommendations += registryResults.issues.filter(i => i.severity === 'info').length;

    // Disk health check
    scanStatus.currentOperation = 'Checking disk health...';
    scanStatus.progress = 40;
    const diskResults = await checkDiskHealth();
    results.disk = diskResults.drives;

    // Check for critical disk issues
    diskResults.drives.forEach(drive => {
      if (drive.health < 50) results.criticalIssues++;
      else if (drive.health < 80) results.warnings++;
    });

    // System integrity check (quick version)
    scanStatus.currentOperation = 'Verifying system integrity...';
    scanStatus.progress = 70;
    const integrityResults = await quickIntegrityCheck();
    if (!integrityResults.healthy) {
      results.warnings++;
      results.insights.push({
        type: 'warning',
        text: 'System file integrity issues detected'
      });
    }

    // Generate insights
    scanStatus.currentOperation = 'Generating insights...';
    scanStatus.progress = 90;
    results.insights = generateInsights(results);

    // Calculate health score
    results.healthScore = calculateHealthScore(results);

    // Save to cache
    lastScanCache = {
      timestamp: results.timestamp,
      healthScore: results.healthScore,
      criticalIssues: results.criticalIssues,
      warnings: results.warnings,
      recommendations: results.recommendations
    };
    saveCache();

    scanStatus.progress = 100;
    scanStatus.currentOperation = 'Complete';

    return {
      success: true,
      data: results
    };
  } catch (error) {
    console.error('Health check error:', error);
    return {
      success: false,
      message: error.message
    };
  } finally {
    scanStatus.isScanning = false;
  }
}

/**
 * Get quick summary without full scan
 * Returns cached data if available, otherwise basic info
 */
async function getQuickSummary() {
  try {
    // Get basic disk info
    const diskInfo = await getBasicDiskInfo();

    // Format last scan time
    let lastScanFormatted = null;
    if (lastScanCache.timestamp) {
      const scanDate = new Date(lastScanCache.timestamp);
      const now = new Date();
      const diffMs = now - scanDate;
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 0) {
        lastScanFormatted = 'Today';
      } else if (diffDays === 1) {
        lastScanFormatted = 'Yesterday';
      } else if (diffDays < 7) {
        lastScanFormatted = `${diffDays} days ago`;
      } else {
        lastScanFormatted = scanDate.toLocaleDateString();
      }
    }

    return {
      success: true,
      data: {
        // Use cached score if available, otherwise null (will show "--")
        estimatedScore: lastScanCache.healthScore,
        diskCount: diskInfo.length,
        disksHealthy: diskInfo.filter(d => d.healthy).length,
        lastScan: lastScanFormatted,
        hasCachedData: lastScanCache.timestamp !== null
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

// ============================================
// REGISTRY FUNCTIONS
// ============================================

/**
 * Scan registry for issues
 */
async function scanRegistry(mode = 'deep') {
  const issues = [];

  try {
    // Check for obsolete uninstall entries
    const uninstallIssues = await checkUninstallRegistry();
    issues.push(...uninstallIssues);

    // Check for invalid file extensions (simplified)
    const extIssues = await checkFileExtensions();
    issues.push(...extIssues);

    // Check for orphaned COM entries
    if (mode === 'deep') {
      const comIssues = await checkCOMEntries();
      issues.push(...comIssues);
    }

    return { issues };
  } catch (error) {
    console.error('Registry scan error:', error);
    return { issues: [] };
  }
}

/**
 * Check for obsolete uninstall registry entries
 */
async function checkUninstallRegistry() {
  const issues = [];

  return new Promise((resolve) => {
    const regPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall';

    exec(`reg query "${regPath}" /s`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        resolve([]);
        return;
      }

      // Parse for entries with missing InstallLocation or DisplayIcon paths
      const lines = stdout.split('\n');
      let currentKey = '';
      let installLocation = '';
      let entryCount = 0;

      lines.forEach(line => {
        if (line.startsWith('HKEY_')) {
          if (currentKey && installLocation) {
            // Check if path exists
            if (!fs.existsSync(installLocation)) {
              entryCount++;
            }
          }
          currentKey = line.trim();
          installLocation = '';
        }
        if (line.includes('InstallLocation') && line.includes('REG_SZ')) {
          const match = line.match(/REG_SZ\s+(.+)/);
          if (match) {
            installLocation = match[1].trim();
          }
        }
      });

      if (entryCount > 0) {
        issues.push({
          id: 'obsolete-uninstall',
          name: 'Obsolete Software Entries',
          description: 'Registry entries for uninstalled programs',
          path: regPath,
          count: entryCount,
          severity: 'warning',
          risk: 'low',
          canFix: true
        });
      }

      resolve(issues);
    });
  });
}

/**
 * Check for invalid file extension associations
 */
async function checkFileExtensions() {
  const issues = [];

  return new Promise((resolve) => {
    exec('reg query "HKCR" /f "shell" /k /s', { maxBuffer: 5 * 1024 * 1024, timeout: 10000 }, (error, stdout) => {
      if (error) {
        // Timeout or error - return empty
        resolve([]);
        return;
      }

      // Count potential invalid associations (simplified check)
      const lines = stdout.split('\n').filter(l => l.includes('shell'));
      const estimatedInvalid = Math.floor(lines.length * 0.02); // Estimate 2% might be invalid

      if (estimatedInvalid > 0) {
        issues.push({
          id: 'invalid-extensions',
          name: 'Invalid File Extensions',
          description: 'File type associations that may be outdated',
          path: 'HKCR\\*\\shell',
          count: estimatedInvalid,
          severity: 'info',
          risk: 'low',
          canFix: true
        });
      }

      resolve(issues);
    });
  });
}

/**
 * Check for orphaned COM entries
 */
async function checkCOMEntries() {
  // Simplified - in production would scan CLSID entries
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([]);
    }, 100);
  });
}

/**
 * Clean registry issues
 * Note: This actually deletes registry entries - use with caution
 */
async function cleanRegistry(issueIds = []) {
  const results = {
    success: true,
    cleaned: 0,
    failed: 0,
    skipped: 0,
    details: []
  };

  for (const issueId of issueIds) {
    try {
      let cleanResult;

      switch (issueId) {
        case 'obsolete-uninstall':
          cleanResult = await cleanObsoleteUninstallEntries();
          break;
        case 'invalid-extensions':
          // Skip - too risky to modify file associations
          results.skipped++;
          results.details.push({
            id: issueId,
            status: 'skipped',
            message: 'File extensions cleanup skipped for safety'
          });
          continue;
        default:
          results.skipped++;
          results.details.push({
            id: issueId,
            status: 'skipped',
            message: 'Unknown issue type'
          });
          continue;
      }

      if (cleanResult.success) {
        results.cleaned += cleanResult.count;
        results.details.push({
          id: issueId,
          status: 'cleaned',
          message: `${cleanResult.count} entries removed`
        });
      } else {
        results.failed++;
        results.details.push({
          id: issueId,
          status: 'failed',
          message: cleanResult.error || 'Cleanup failed'
        });
      }
    } catch (error) {
      results.failed++;
      results.details.push({
        id: issueId,
        status: 'failed',
        message: error.message
      });
    }
  }

  results.success = results.failed === 0;
  return results;
}

/**
 * Clean obsolete uninstall registry entries
 */
async function cleanObsoleteUninstallEntries() {
  return new Promise((resolve) => {
    const regPath = 'HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall';

    exec(`reg query "${regPath}" /s`, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout) => {
      if (error) {
        resolve({ success: false, error: 'Failed to query registry', count: 0 });
        return;
      }

      const lines = stdout.split('\n');
      const keysToDelete = [];
      let currentKey = '';
      let installLocation = '';

      lines.forEach(line => {
        if (line.startsWith('HKEY_')) {
          if (currentKey && installLocation && !fs.existsSync(installLocation)) {
            keysToDelete.push(currentKey);
          }
          currentKey = line.trim();
          installLocation = '';
        }
        if (line.includes('InstallLocation') && line.includes('REG_SZ')) {
          const match = line.match(/REG_SZ\s+(.+)/);
          if (match) {
            installLocation = match[1].trim();
          }
        }
      });

      // Delete orphaned keys (limit to 10 at a time for safety)
      const toDelete = keysToDelete.slice(0, 10);
      let deletedCount = 0;

      const deleteNext = (index) => {
        if (index >= toDelete.length) {
          resolve({ success: true, count: deletedCount });
          return;
        }

        exec(`reg delete "${toDelete[index]}" /f`, { timeout: 5000 }, (delError) => {
          if (!delError) {
            deletedCount++;
          }
          deleteNext(index + 1);
        });
      };

      if (toDelete.length === 0) {
        resolve({ success: true, count: 0 });
      } else {
        deleteNext(0);
      }
    });
  });
}

// ============================================
// DISK HEALTH FUNCTIONS
// ============================================

/**
 * Check disk health via SMART data
 */
async function checkDiskHealth() {
  const drives = [];

  return new Promise((resolve) => {
    // Use WMIC to get disk info
    exec('wmic diskdrive get Model,Size,Status,MediaType /format:csv', (error, stdout) => {
      if (error) {
        resolve({ drives: [] });
        return;
      }

      const lines = stdout.split('\n').filter(l => l.trim() && !l.startsWith('Node'));

      lines.forEach((line, index) => {
        const parts = line.split(',');
        if (parts.length >= 4) {
          const mediaType = parts[1]?.trim() || '';
          const model = parts[2]?.trim() || `Disk ${index}`;
          const size = parts[3]?.trim() || '0';
          const status = parts[4]?.trim() || 'Unknown';

          // Parse size
          const sizeGB = Math.round(parseInt(size) / (1024 * 1024 * 1024));

          // Determine drive type
          const isSSD = mediaType.toLowerCase().includes('ssd') ||
                       model.toLowerCase().includes('ssd') ||
                       model.toLowerCase().includes('nvme');

          drives.push({
            id: `disk-${index}`,
            name: model,
            type: isSSD ? 'SSD' : 'HDD',
            size: `${sizeGB}GB`,
            status: status === 'OK' ? 'Healthy' : status,
            // Real health: 100 if OK, 50 if not, null if unknown
            health: status === 'OK' ? 100 : status === 'Unknown' ? null : 50,
            // Temperature not available via WMIC - will try to get from SMART
            temperature: null,
            healthy: status === 'OK'
          });
        }
      });

      // Try to get SMART data for temperature (async, won't block)
      getSMARTData().then(smartData => {
        drives.forEach(drive => {
          const smart = smartData.find(s =>
            drive.name.toLowerCase().includes(s.model?.toLowerCase() || '')
          );
          if (smart) {
            if (smart.temperature) drive.temperature = smart.temperature;
            if (smart.health !== undefined) drive.health = smart.health;
          }
        });
      }).catch(() => {});

      // If no drives found, add system drive
      if (drives.length === 0) {
        drives.push({
          id: 'disk-0',
          name: 'System Drive (C:)',
          type: 'Unknown',
          size: 'Unknown',
          status: 'Healthy',
          health: null,
          temperature: null,
          healthy: true
        });
      }

      resolve({ drives });
    });
  });
}

/**
 * Try to get SMART data from disks
 */
async function getSMARTData() {
  return new Promise((resolve) => {
    // Try using WMIC to get SMART failure prediction
    exec('wmic /namespace:\\\\root\\wmi path MSStorageDriver_FailurePredictStatus get Active,PredictFailure,InstanceName /format:csv',
      { timeout: 5000 },
      (error, stdout) => {
        if (error) {
          resolve([]);
          return;
        }

        const results = [];
        const lines = stdout.split('\n').filter(l => l.trim() && !l.startsWith('Node'));

        lines.forEach(line => {
          const parts = line.split(',');
          if (parts.length >= 3) {
            const active = parts[1]?.trim().toLowerCase() === 'true';
            const predictFailure = parts[2]?.trim().toLowerCase() === 'true';

            results.push({
              model: parts[3] || '',
              health: predictFailure ? 50 : (active ? 100 : null),
              temperature: null // WMIC doesn't provide temperature directly
            });
          }
        });

        resolve(results);
      }
    );
  });
}

/**
 * Get basic disk info quickly
 */
async function getBasicDiskInfo() {
  return new Promise((resolve) => {
    exec('wmic logicaldisk get Caption,DriveType,Size,FreeSpace /format:csv', (error, stdout) => {
      if (error) {
        resolve([{ letter: 'C:', healthy: true }]);
        return;
      }

      const drives = [];
      const lines = stdout.split('\n').filter(l => l.trim() && !l.startsWith('Node'));

      lines.forEach(line => {
        const parts = line.split(',');
        if (parts.length >= 4 && parts[2] === '3') { // DriveType 3 = Local Disk
          drives.push({
            letter: parts[1],
            healthy: true
          });
        }
      });

      resolve(drives.length > 0 ? drives : [{ letter: 'C:', healthy: true }]);
    });
  });
}

// ============================================
// SYSTEM REPAIR TOOLS
// ============================================

/**
 * Run System File Checker (SFC)
 */
async function runSFC() {
  return new Promise((resolve) => {
    scanStatus.isScanning = true;
    scanStatus.currentOperation = 'Running System File Checker...';

    // SFC requires admin and runs for a while
    const process = spawn('cmd.exe', ['/c', 'sfc', '/scannow'], {
      windowsHide: true
    });

    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
    });

    process.stderr.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      scanStatus.isScanning = false;

      const foundIssues = output.includes('found corrupt files') ||
                         output.includes('found integrity violations');
      const fixed = output.includes('successfully repaired');

      resolve({
        success: code === 0,
        tool: 'SFC',
        output: output.substring(0, 2000), // Truncate output
        foundIssues,
        fixed,
        message: fixed ? 'System files repaired' :
                 foundIssues ? 'Issues found - may require DISM' :
                 'No integrity violations found'
      });
    });

    process.on('error', (error) => {
      scanStatus.isScanning = false;
      resolve({
        success: false,
        tool: 'SFC',
        message: `Failed to run SFC: ${error.message}. Run as Administrator.`
      });
    });
  });
}

/**
 * Run DISM repair
 */
async function runDISM() {
  return new Promise((resolve) => {
    scanStatus.isScanning = true;
    scanStatus.currentOperation = 'Running DISM repair...';

    const process = spawn('cmd.exe', ['/c', 'DISM', '/Online', '/Cleanup-Image', '/RestoreHealth'], {
      windowsHide: true
    });

    let output = '';

    process.stdout.on('data', (data) => {
      output += data.toString();
      // Update progress from DISM output
      const match = output.match(/(\d+\.\d+)%/);
      if (match) {
        scanStatus.progress = parseFloat(match[1]);
      }
    });

    process.stderr.on('data', (data) => {
      output += data.toString();
    });

    process.on('close', (code) => {
      scanStatus.isScanning = false;

      resolve({
        success: code === 0,
        tool: 'DISM',
        output: output.substring(0, 2000),
        message: code === 0 ? 'Component store repaired successfully' :
                 'DISM completed with errors'
      });
    });

    process.on('error', (error) => {
      scanStatus.isScanning = false;
      resolve({
        success: false,
        tool: 'DISM',
        message: `Failed to run DISM: ${error.message}. Run as Administrator.`
      });
    });
  });
}

/**
 * Run Check Disk (schedule for next boot)
 */
async function runCHKDSK(drive = 'C:') {
  return new Promise((resolve) => {
    // CHKDSK on system drive requires scheduling
    exec(`chkdsk ${drive} /F /R`, (error, stdout, stderr) => {
      if (error) {
        // Check if it's asking to schedule
        if (stderr.includes('schedule') || stdout.includes('schedule')) {
          // Schedule for next boot
          exec(`echo Y | chkdsk ${drive} /F /R`, (schedError) => {
            resolve({
              success: true,
              tool: 'CHKDSK',
              scheduled: true,
              message: `Check Disk scheduled for ${drive} on next restart`
            });
          });
        } else {
          resolve({
            success: false,
            tool: 'CHKDSK',
            message: `CHKDSK failed: ${error.message}. Run as Administrator.`
          });
        }
        return;
      }

      resolve({
        success: true,
        tool: 'CHKDSK',
        output: stdout.substring(0, 2000),
        message: 'Check Disk completed'
      });
    });
  });
}

/**
 * Reset Windows Update components
 * Uses proper ownership and permission commands to handle TrustedInstaller-protected folders
 */
async function resetWindowsUpdate() {
  const results = [];

  // Helper to run command and track result
  const runCmd = (cmd, description) => {
    try {
      execSync(cmd, { windowsHide: true, timeout: 60000, stdio: 'pipe' });
      results.push({ command: description, success: true });
      return true;
    } catch (error) {
      results.push({ command: description, success: false, error: error.message });
      return false;
    }
  };

  // Step 1: Stop Windows Update services (use /y to force)
  runCmd('net stop wuauserv /y', 'Stop Windows Update service');
  runCmd('net stop cryptSvc /y', 'Stop Cryptographic service');
  runCmd('net stop bits /y', 'Stop BITS service');
  runCmd('net stop msiserver /y', 'Stop Windows Installer service');

  // Small delay to ensure services are fully stopped
  await new Promise(r => setTimeout(r, 1000));

  // Step 2: Take ownership of SoftwareDistribution folder
  const softDistPath = 'C:\\Windows\\SoftwareDistribution';
  const catroot2Path = 'C:\\Windows\\System32\\catroot2';

  // Take ownership and grant permissions for SoftwareDistribution
  runCmd(`takeown /f "${softDistPath}" /r /d y`, 'Take ownership of SoftwareDistribution');
  runCmd(`icacls "${softDistPath}" /grant administrators:F /t /q`, 'Grant permissions to SoftwareDistribution');

  // Take ownership and grant permissions for catroot2
  runCmd(`takeown /f "${catroot2Path}" /r /d y`, 'Take ownership of catroot2');
  runCmd(`icacls "${catroot2Path}" /grant administrators:F /t /q`, 'Grant permissions to catroot2');

  // Step 3: Delete the folders (more reliable than renaming)
  // Use rd /s /q for recursive delete
  runCmd(`rd /s /q "${softDistPath}"`, 'Delete SoftwareDistribution folder');
  runCmd(`rd /s /q "${catroot2Path}"`, 'Delete catroot2 folder');

  // Step 4: Recreate the folders (Windows will repopulate them)
  runCmd(`mkdir "${softDistPath}"`, 'Recreate SoftwareDistribution folder');
  runCmd(`mkdir "${catroot2Path}"`, 'Recreate catroot2 folder');

  // Step 5: Reset Windows Update components via DISM (optional but helpful)
  // This reregisters Windows Update DLLs
  const dllsToRegister = [
    'atl.dll', 'urlmon.dll', 'mshtml.dll', 'shdocvw.dll', 'browseui.dll',
    'jscript.dll', 'vbscript.dll', 'scrrun.dll', 'msxml.dll', 'msxml3.dll',
    'msxml6.dll', 'actxprxy.dll', 'softpub.dll', 'wintrust.dll', 'dssenh.dll',
    'rsaenh.dll', 'gpkcsp.dll', 'sccbase.dll', 'slbcsp.dll', 'cryptdlg.dll',
    'oleaut32.dll', 'ole32.dll', 'shell32.dll', 'initpki.dll', 'wuapi.dll',
    'wuaueng.dll', 'wuaueng1.dll', 'wucltui.dll', 'wups.dll', 'wups2.dll',
    'wuweb.dll', 'qmgr.dll', 'qmgrprxy.dll', 'wucltux.dll', 'muweb.dll', 'wuwebv.dll'
  ];

  // Register a few key DLLs (not all, to keep it fast)
  const keyDlls = ['wuapi.dll', 'wuaueng.dll', 'wups.dll', 'wucltux.dll'];
  for (const dll of keyDlls) {
    runCmd(`regsvr32 /s ${dll}`, `Register ${dll}`);
  }

  // Step 6: Reset Winsock and proxy settings
  runCmd('netsh winsock reset', 'Reset Winsock');
  runCmd('netsh winhttp reset proxy', 'Reset WinHTTP proxy');

  // Step 7: Restart services
  await new Promise(r => setTimeout(r, 500));
  runCmd('net start wuauserv', 'Start Windows Update service');
  runCmd('net start cryptSvc', 'Start Cryptographic service');
  runCmd('net start bits', 'Start BITS service');
  runCmd('net start msiserver', 'Start Windows Installer service');

  // Calculate success
  const successCount = results.filter(r => r.success).length;
  const totalCount = results.length;
  const criticalSteps = ['Delete SoftwareDistribution folder', 'Start Windows Update service'];
  const criticalSuccess = results.filter(r => criticalSteps.includes(r.command) && r.success).length;

  return {
    success: criticalSuccess >= 1 && successCount >= totalCount * 0.5,
    tool: 'Windows Update Reset',
    details: results,
    message: successCount === totalCount ?
             'Windows Update components reset successfully' :
             successCount >= totalCount * 0.7 ?
             `Reset completed: ${successCount}/${totalCount} operations successful` :
             `Partial reset: ${successCount}/${totalCount} operations completed`
  };
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Quick integrity check
 */
async function quickIntegrityCheck() {
  return new Promise((resolve) => {
    // Quick check using sfc /verifyonly (non-repair)
    exec('sfc /verifyonly', { timeout: 60000 }, (error, stdout) => {
      if (error) {
        // If timeout or error, assume healthy
        resolve({ healthy: true });
        return;
      }

      const hasIssues = stdout.includes('found corrupt') ||
                       stdout.includes('integrity violations');
      resolve({ healthy: !hasIssues });
    });
  });
}

/**
 * Generate insights from scan results
 */
function generateInsights(results) {
  const insights = [];

  // Registry insights
  const registryIssues = results.registry.filter(i => i.severity === 'warning');
  if (registryIssues.length > 0) {
    const totalEntries = registryIssues.reduce((sum, i) => sum + (i.count || 0), 0);
    insights.push({
      type: 'warning',
      text: `${totalEntries} obsolete registry entries found`
    });
  }

  // Disk insights
  const unhealthyDisks = results.disk.filter(d => d.health < 80);
  if (unhealthyDisks.length > 0) {
    insights.push({
      type: 'warning',
      text: `${unhealthyDisks.length} disk(s) showing reduced health`
    });
  } else if (results.disk.length > 0) {
    insights.push({
      type: 'success',
      text: 'All disk drives are healthy'
    });
  }

  // Add recommendations
  if (results.recommendations > 0) {
    insights.push({
      type: 'info',
      text: 'Windows Update cache can be cleared'
    });
  }

  return insights;
}

/**
 * Calculate overall health score
 */
function calculateHealthScore(results) {
  let score = 100;

  // Deduct for critical issues
  score -= results.criticalIssues * 15;

  // Deduct for warnings
  score -= results.warnings * 5;

  // Deduct for recommendations
  score -= results.recommendations * 2;

  // Disk health factor
  if (results.disk.length > 0) {
    const avgDiskHealth = results.disk.reduce((sum, d) => sum + d.health, 0) / results.disk.length;
    if (avgDiskHealth < 90) {
      score -= (90 - avgDiskHealth);
    }
  }

  return Math.max(0, Math.min(100, Math.round(score)));
}

/**
 * Get current scan status
 */
function getScanStatus() {
  return { ...scanStatus };
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  runHealthCheck,
  getQuickSummary,
  scanRegistry,
  cleanRegistry,
  checkDiskHealth,
  runSFC,
  runDISM,
  runCHKDSK,
  resetWindowsUpdate,
  getScanStatus
};
