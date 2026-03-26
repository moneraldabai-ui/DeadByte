/**
 * DeadBYTE - Process Service
 * ===========================
 * Handles process detection and termination for file unlocking.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { executePowerShell, executePowerShellJson } = require('./utils/powershell');

// Import log service
const logService = require('./logService');
const { OperationType } = logService;

// Critical system processes that should NEVER be killed
const CRITICAL_SYSTEM_PROCESSES = [
  'system', 'registry', 'smss', 'csrss', 'wininit', 'services',
  'lsass', 'winlogon', 'memory compression', 'system idle process',
  'secure system', 'ntoskrnl', 'idle'
];

// Processes that can be killed but should show a warning
const WARNING_PROCESSES = [
  'svchost', 'dwm', 'explorer', 'searchindexer', 'spoolsv',
  'wuauserv', 'audiodg', 'fontdrvhost'
];

// All protected processes (critical + warning)
const PROTECTED_PROCESSES = [...CRITICAL_SYSTEM_PROCESSES, ...WARNING_PROCESSES];

/**
 * Check if a process is a critical system process (should NEVER be killed)
 */
function isCriticalSystemProcess(processName) {
  const name = processName.toLowerCase().replace('.exe', '');
  return CRITICAL_SYSTEM_PROCESSES.includes(name);
}

/**
 * Check if a process shows a warning (can be killed but risky)
 */
function isWarningProcess(processName) {
  const name = processName.toLowerCase().replace('.exe', '');
  return WARNING_PROCESSES.includes(name);
}

/**
 * Check if a process is protected (either critical or warning)
 */
function isProtectedProcess(processName) {
  const name = processName.toLowerCase().replace('.exe', '');
  return PROTECTED_PROCESSES.includes(name);
}

/**
 * Determine if it's safe to kill a process
 */
function isKillSafe(processName) {
  return !isCriticalSystemProcess(processName);
}

/**
 * Find processes that are locking a specific file
 * Uses Windows RestartManager API for accurate lock detection
 */
async function findLockingProcesses(filePath) {
  try {
    logService.logInfo(OperationType.PROCESS_KILL, `Searching for processes locking file`, filePath);

    // Use RestartManager API - the most reliable method for finding file locks
    const psCommand = `
      $filePath = '${filePath.replace(/'/g, "''")}';

      # Add RestartManager interop
      Add-Type -TypeDefinition @'
      using System;
      using System.Runtime.InteropServices;
      using System.Collections.Generic;
      using System.Diagnostics;

      public class RestartManager {
        [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
        static extern int RmStartSession(out uint pSessionHandle, int dwSessionFlags, string strSessionKey);

        [DllImport("rstrtmgr.dll")]
        static extern int RmEndSession(uint pSessionHandle);

        [DllImport("rstrtmgr.dll", CharSet = CharSet.Unicode)]
        static extern int RmRegisterResources(uint pSessionHandle, uint nFiles, string[] rgsFilenames, uint nApplications, [In] RM_UNIQUE_PROCESS[] rgApplications, uint nServices, string[] rgsServiceNames);

        [DllImport("rstrtmgr.dll")]
        static extern int RmGetList(uint dwSessionHandle, out uint pnProcInfoNeeded, ref uint pnProcInfo, [In, Out] RM_PROCESS_INFO[] rgAffectedApps, ref uint lpdwRebootReasons);

        [StructLayout(LayoutKind.Sequential)]
        public struct RM_UNIQUE_PROCESS {
          public int dwProcessId;
          public System.Runtime.InteropServices.ComTypes.FILETIME ProcessStartTime;
        }

        [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Unicode)]
        public struct RM_PROCESS_INFO {
          public RM_UNIQUE_PROCESS Process;
          [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 256)]
          public string strAppName;
          [MarshalAs(UnmanagedType.ByValTStr, SizeConst = 64)]
          public string strServiceShortName;
          public int ApplicationType;
          public uint AppStatus;
          public uint TSSessionId;
          [MarshalAs(UnmanagedType.Bool)]
          public bool bRestartable;
        }

        public static List<int> GetLockingProcessIds(string path) {
          var result = new List<int>();
          uint handle;
          string key = Guid.NewGuid().ToString();
          int res = RmStartSession(out handle, 0, key);
          if (res != 0) return result;
          try {
            string[] files = { path };
            res = RmRegisterResources(handle, (uint)files.Length, files, 0, null, 0, null);
            if (res != 0) return result;
            uint needed = 0, count = 0, reasons = 0;
            res = RmGetList(handle, out needed, ref count, null, ref reasons);
            if (res == 234 && needed > 0) {
              var info = new RM_PROCESS_INFO[needed];
              count = needed;
              res = RmGetList(handle, out needed, ref count, info, ref reasons);
              if (res == 0) {
                for (int i = 0; i < count; i++) {
                  result.Add(info[i].Process.dwProcessId);
                }
              }
            }
          } finally {
            RmEndSession(handle);
          }
          return result;
        }
      }
'@ -ErrorAction SilentlyContinue;

      $results = @();

      # Method 1: Use RestartManager API
      try {
        $lockingPids = [RestartManager]::GetLockingProcessIds($filePath);
        foreach ($pid in $lockingPids) {
          try {
            $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue;
            if ($proc) {
              $results += [PSCustomObject]@{
                ProcessId = $proc.Id;
                ProcessName = $proc.ProcessName;
                MainWindowTitle = $proc.MainWindowTitle;
                Path = $proc.Path;
                WorkingSet = $proc.WorkingSet64;
                Source = 'RestartManager'
              };
            }
          } catch {}
        }
      } catch {}

      # Method 2: Fallback - check via handle.exe if available
      if ($results.Count -eq 0) {
        $handleExe = "$env:LOCALAPPDATA\\Microsoft\\WindowsApps\\handle64.exe";
        if (-not (Test-Path $handleExe)) {
          $handleExe = "C:\\Sysinternals\\handle64.exe";
        }
        if (-not (Test-Path $handleExe)) {
          $handleExe = "handle64.exe";
        }
        try {
          $output = & $handleExe -accepteula -nobanner $filePath 2>$null;
          if ($output) {
            foreach ($line in $output) {
              if ($line -match '^([\\w.-]+)\\s+pid:\\s*(\\d+)') {
                $procName = $matches[1];
                $pid = [int]$matches[2];
                try {
                  $proc = Get-Process -Id $pid -ErrorAction SilentlyContinue;
                  if ($proc) {
                    $results += [PSCustomObject]@{
                      ProcessId = $proc.Id;
                      ProcessName = $proc.ProcessName;
                      MainWindowTitle = $proc.MainWindowTitle;
                      Path = $proc.Path;
                      WorkingSet = $proc.WorkingSet64;
                      Source = 'Handle'
                    };
                  }
                } catch {}
              }
            }
          }
        } catch {}
      }

      # Method 3: Fallback - check if file is locked by trying to open it exclusively
      if ($results.Count -eq 0) {
        try {
          $fs = [System.IO.File]::Open($filePath, 'Open', 'ReadWrite', 'None');
          $fs.Close();
          # File is not locked
        } catch {
          # File is locked - check common processes that might have it open
          $fileName = [System.IO.Path]::GetFileName($filePath);
          $ext = [System.IO.Path]::GetExtension($filePath).ToLower();

          # Get processes that might be using this file based on extension
          $candidates = @();
          switch -Wildcard ($ext) {
            '*.doc*' { $candidates = Get-Process -Name 'WINWORD' -ErrorAction SilentlyContinue }
            '*.xls*' { $candidates = Get-Process -Name 'EXCEL' -ErrorAction SilentlyContinue }
            '*.ppt*' { $candidates = Get-Process -Name 'POWERPNT' -ErrorAction SilentlyContinue }
            '*.pdf' { $candidates = Get-Process -Name 'Acrobat*','AcroRd*','FoxitReader' -ErrorAction SilentlyContinue }
            '*.db*' { $candidates = Get-Process | Where-Object { $_.Modules.FileName -like '*sqlite*' } -ErrorAction SilentlyContinue }
            default {
              # Check modules for any matches
              Get-Process | ForEach-Object {
                try {
                  if ($_.Modules | Where-Object { $_.FileName -like "*$fileName*" }) {
                    $candidates += $_;
                  }
                } catch {}
              }
            }
          }

          foreach ($proc in $candidates) {
            if ($proc) {
              $results += [PSCustomObject]@{
                ProcessId = $proc.Id;
                ProcessName = $proc.ProcessName;
                MainWindowTitle = $proc.MainWindowTitle;
                Path = $proc.Path;
                WorkingSet = $proc.WorkingSet64;
                Source = 'Heuristic'
              };
            }
          }
        }
      }

      # Remove duplicates
      $results = $results | Sort-Object ProcessId -Unique;

      if ($results.Count -gt 0) {
        $results | ConvertTo-Json -Compress
      } else {
        '[]'
      }
    `;

    let processes = [];
    try {
      const result = await executePowerShellJson(psCommand, { timeout: 45000 });
      processes = Array.isArray(result) ? result : (result ? [result] : []);
    } catch (e) {
      logService.logError(OperationType.PROCESS_KILL, `PowerShell error: ${e.message}`, filePath);
      processes = [];
    }

    const uniqueProcesses = processes.filter(p => p).map(p => {
      const processName = p.ProcessName || 'Unknown';
      const memoryBytes = p.WorkingSet || 0;
      return {
        processName: processName + '.exe',
        name: processName, // Legacy field
        pid: p.ProcessId,
        title: p.MainWindowTitle || '',
        path: p.Path || '',
        memoryUsage: memoryBytes,
        memoryUsageMB: Math.round(memoryBytes / (1024 * 1024) * 10) / 10,
        isCriticalSystemProcess: isCriticalSystemProcess(processName),
        isKillSafe: isKillSafe(processName),
        isWarning: isWarningProcess(processName),
        isProtected: isProtectedProcess(processName),
        description: p.MainWindowTitle || getProcessDescription(processName),
        source: p.Source || 'unknown'
      };
    });

    logService.logInfo(OperationType.PROCESS_KILL, `Found ${uniqueProcesses.length} processes locking file`, filePath);

    return { success: true, data: uniqueProcesses };

  } catch (error) {
    logService.logError(OperationType.PROCESS_KILL, `Failed to find locking processes: ${error.message}`, filePath);
    return { success: false, message: `Failed to find locking processes: ${error.message}`, data: [] };
  }
}

/**
 * Kill a process by PID
 */
async function killProcess(pid, options = {}) {
  const { force = false } = options;

  try {
    // Get process info first
    const processInfo = await getProcessInfo(pid);

    if (!processInfo.success) {
      return { success: false, message: `Process ${pid} not found` };
    }

    // Check if protected
    if (isProtectedProcess(processInfo.data.name)) {
      logService.logError(OperationType.PROCESS_KILL, `Blocked: Cannot kill protected system process: ${processInfo.data.name}`, null, { pid });
      return { success: false, message: `Cannot kill protected system process: ${processInfo.data.name} (PID: ${pid})` };
    }

    logService.logInfo(OperationType.PROCESS_KILL, `Attempting to kill process: ${processInfo.data.name}`, null, { pid });

    // Kill the process
    const forceFlag = force ? '/F' : '';
    await execPromise(`taskkill /PID ${pid} ${forceFlag}`, { timeout: 10000 });

    logService.logSuccess(OperationType.PROCESS_KILL, `Killed process: ${processInfo.data.name} (PID: ${pid})`, null, { pid });

    return { success: true, message: `Successfully terminated ${processInfo.data.name} (PID: ${pid})` };

  } catch (error) {
    logService.logError(OperationType.PROCESS_KILL, `Failed to kill process: ${error.message}`, null, { pid });
    return { success: false, message: `Failed to kill process ${pid}: ${error.message}` };
  }
}

/**
 * Kill multiple processes
 */
async function killProcesses(pids, options = {}) {
  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const pid of pids) {
    const result = await killProcess(pid, options);
    results.push({ pid, ...result });
    if (result.success) successCount++;
    else failCount++;
  }

  return {
    success: failCount === 0,
    results,
    message: `Killed ${successCount} of ${pids.length} processes`
  };
}

/**
 * Get information about a specific process
 */
async function getProcessInfo(pid) {
  try {
    const psCommand = `
      $proc = Get-Process -Id ${pid} -ErrorAction SilentlyContinue;
      if ($proc) {
        [PSCustomObject]@{
          Id = $proc.Id;
          Name = $proc.ProcessName;
          Path = $proc.Path;
          MainWindowTitle = $proc.MainWindowTitle;
          WorkingSet = $proc.WorkingSet64;
          CPU = $proc.CPU;
          Responding = $proc.Responding
        } | ConvertTo-Json -Compress
      } else {
        'NOT_FOUND'
      }
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 10000 });

    if (stdout.includes('NOT_FOUND')) {
      return { success: false, message: `Process ${pid} not found` };
    }

    const procInfo = JSON.parse(stdout);

    return {
      success: true,
      data: {
        pid: procInfo.Id,
        name: procInfo.Name,
        path: procInfo.Path || '',
        title: procInfo.MainWindowTitle || '',
        memoryUsage: procInfo.WorkingSet || 0,
        cpuTime: procInfo.CPU || 0,
        isResponding: procInfo.Responding,
        isProtected: isProtectedProcess(procInfo.Name)
      }
    };

  } catch (error) {
    return { success: false, message: `Failed to get process info: ${error.message}` };
  }
}

/**
 * List all running processes
 */
async function listProcesses(options = {}) {
  const { filter = '', limit = 100 } = options;

  try {
    const psCommand = `
      Get-Process | Select-Object -First ${limit} | ForEach-Object {
        [PSCustomObject]@{
          Id = $_.Id;
          Name = $_.ProcessName;
          WorkingSet = $_.WorkingSet64;
          CPU = $_.CPU;
          Path = $_.Path
        }
      } | ConvertTo-Json -Compress
    `;

    let processes = await executePowerShellJson(psCommand, { timeout: 15000 });
    if (!Array.isArray(processes)) processes = [processes].filter(Boolean);

    // Apply filter
    if (filter) {
      processes = processes.filter(p => p.Name && p.Name.toLowerCase().includes(filter.toLowerCase()));
    }

    return {
      success: true,
      data: processes.map(p => ({
        pid: p.Id,
        name: p.Name,
        memoryUsage: p.WorkingSet || 0,
        cpuTime: p.CPU || 0,
        path: p.Path || '',
        isProtected: isProtectedProcess(p.Name)
      }))
    };

  } catch (error) {
    return { success: false, message: `Failed to list processes: ${error.message}`, data: [] };
  }
}

/**
 * Get a friendly description for common processes
 */
function getProcessDescription(processName) {
  const descriptions = {
    'chrome': 'Google Chrome Browser',
    'firefox': 'Mozilla Firefox Browser',
    'msedge': 'Microsoft Edge Browser',
    'explorer': 'Windows Explorer',
    'notepad': 'Notepad Text Editor',
    'notepad++': 'Notepad++ Editor',
    'code': 'Visual Studio Code',
    'winword': 'Microsoft Word',
    'excel': 'Microsoft Excel',
    'powerpnt': 'Microsoft PowerPoint',
    'outlook': 'Microsoft Outlook',
    'teams': 'Microsoft Teams',
    'discord': 'Discord',
    'slack': 'Slack',
    'spotify': 'Spotify',
    'vlc': 'VLC Media Player',
    'acrobat': 'Adobe Acrobat',
    'acrord32': 'Adobe Acrobat Reader',
    'photoshop': 'Adobe Photoshop',
    'node': 'Node.js Runtime',
    'python': 'Python Runtime',
    'java': 'Java Runtime',
    'cmd': 'Command Prompt',
    'powershell': 'PowerShell',
    'windowsterminal': 'Windows Terminal',
    'svchost': 'Windows Service Host',
    'dwm': 'Desktop Window Manager',
    'searchindexer': 'Windows Search Indexer',
    'onedrive': 'Microsoft OneDrive',
    'dropbox': 'Dropbox',
    'steam': 'Steam Client',
    'epicgameslauncher': 'Epic Games Launcher'
  };

  const name = processName.toLowerCase().replace('.exe', '');
  return descriptions[name] || '';
}

/**
 * Kill all processes locking a specific file and verify unlock
 */
async function killAllForFile(filePath, options = {}) {
  const { force = true } = options;

  try {
    logService.logInfo(OperationType.PROCESS_KILL, `Kill all processes for file`, filePath);

    // Step 1: Find all locking processes
    const lockResult = await findLockingProcesses(filePath);

    if (!lockResult.success) {
      return {
        success: false,
        message: lockResult.message || 'Failed to find locking processes',
        killed: 0,
        skipped: 0,
        fileStillLocked: true,
        remainingLockers: []
      };
    }

    const processes = lockResult.data || [];

    if (processes.length === 0) {
      return {
        success: true,
        message: 'No processes were locking this file',
        killed: 0,
        skipped: 0,
        fileStillLocked: false,
        remainingLockers: []
      };
    }

    // Step 2: Kill all safe-to-kill processes
    let killed = 0;
    let skipped = 0;
    const killResults = [];

    for (const proc of processes) {
      if (!proc.isKillSafe) {
        skipped++;
        killResults.push({
          pid: proc.pid,
          name: proc.processName,
          success: false,
          reason: 'Critical system process - cannot be killed'
        });
        continue;
      }

      const killResult = await killProcess(proc.pid, { force });
      killResults.push({
        pid: proc.pid,
        name: proc.processName,
        success: killResult.success,
        reason: killResult.message
      });

      if (killResult.success) {
        killed++;
      }
    }

    // Step 3: Wait for processes to fully terminate
    await sleep(500);

    // Step 4: Re-check if file is still locked
    const recheckResult = await findLockingProcesses(filePath);
    const remainingLockers = recheckResult.success ? (recheckResult.data || []) : [];
    const fileStillLocked = remainingLockers.length > 0;

    const message = fileStillLocked
      ? `Killed ${killed} process(es), but file is still locked by ${remainingLockers.length} process(es)`
      : `Successfully killed ${killed} process(es). File is now unlocked.`;

    logService.logInfo(OperationType.PROCESS_KILL, message, filePath);

    return {
      success: !fileStillLocked,
      message,
      killed,
      skipped,
      killResults,
      fileStillLocked,
      remainingLockers
    };

  } catch (error) {
    logService.logError(OperationType.PROCESS_KILL, `Kill all failed: ${error.message}`, filePath);
    return {
      success: false,
      message: `Failed to kill processes: ${error.message}`,
      killed: 0,
      skipped: 0,
      fileStillLocked: true,
      remainingLockers: []
    };
  }
}

/**
 * Check if a file is locked and return lock status with lockers
 */
async function checkFileLock(filePath) {
  const fs = require('fs');
  const fsPromises = require('fs/promises');

  try {
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return {
        success: true,
        data: {
          exists: false,
          isLocked: false,
          lockType: null,
          lockers: [],
          canRead: false,
          canWrite: false
        }
      };
    }

    let canRead = true;
    let canWrite = true;
    let isLocked = false;
    let lockType = null;

    // Check read access
    try {
      await fsPromises.access(filePath, fs.constants.R_OK);
    } catch {
      canRead = false;
      isLocked = true;
      lockType = 'system';
    }

    // Check write access
    try {
      await fsPromises.access(filePath, fs.constants.W_OK);
    } catch {
      canWrite = false;
    }

    // Try to open file to detect if in use
    try {
      const fd = await fsPromises.open(filePath, 'r+');
      await fd.close();
    } catch (e) {
      if (e.code === 'EBUSY') {
        isLocked = true;
        lockType = 'process';
      } else if (e.code === 'EACCES' || e.code === 'EPERM') {
        isLocked = true;
        lockType = lockType || 'permission';
      }
    }

    // Find locking processes
    let lockers = [];
    if (isLocked && lockType === 'process') {
      const lockResult = await findLockingProcesses(filePath);
      if (lockResult.success) {
        lockers = lockResult.data || [];
      }
    }

    // Determine final lock type
    if (lockers.length > 0) {
      lockType = 'process';
    } else if (isLocked && !canRead) {
      lockType = 'system';
    } else if (isLocked) {
      lockType = 'kernel';
    }

    return {
      success: true,
      data: {
        exists: true,
        isLocked,
        lockType,
        lockers,
        canRead,
        canWrite,
        status: isLocked ? (lockType === 'process' ? 'in_use' : 'locked') : 'accessible'
      }
    };

  } catch (error) {
    return {
      success: false,
      message: `Failed to check file lock: ${error.message}`
    };
  }
}

/**
 * Helper: sleep for ms milliseconds
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  findLockingProcesses,
  killProcess,
  killProcesses,
  killAllForFile,
  getProcessInfo,
  listProcesses,
  checkFileLock,
  isProtectedProcess,
  isCriticalSystemProcess,
  isKillSafe
};
