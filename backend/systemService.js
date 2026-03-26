/**
 * DeadBYTE - System Service
 * =========================
 * Provides real-time system metrics including CPU, memory, disk, and network stats.
 * Uses Windows PowerShell and Node.js os module for data collection.
 */

const os = require('os');
const { exec, execSync } = require('child_process');
const path = require('path');

// Cache for expensive operations
let cpuCache = { value: null, timestamp: 0 };
let diskCache = { value: null, timestamp: 0 };
const CACHE_DURATION = 1000; // 1 second cache

/**
 * Get CPU usage percentage
 * @returns {Promise<Object>} CPU usage data
 */
async function getCpuUsage() {
  return new Promise((resolve) => {
    try {
      // Use PowerShell to get CPU usage
      const cmd = `powershell -NoProfile -Command "(Get-Counter '\\Processor(_Total)\\% Processor Time').CounterSamples.CookedValue"`;

      exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          // Fallback: Calculate from os.cpus()
          const cpus = os.cpus();
          let totalIdle = 0;
          let totalTick = 0;

          cpus.forEach(cpu => {
            for (const type in cpu.times) {
              totalTick += cpu.times[type];
            }
            totalIdle += cpu.times.idle;
          });

          const usage = 100 - (totalIdle / totalTick * 100);

          resolve({
            success: true,
            data: {
              usage: Math.round(usage * 10) / 10,
              cores: cpus.length,
              model: cpus[0]?.model || 'Unknown',
              speed: cpus[0]?.speed || 0
            }
          });
          return;
        }

        const usage = parseFloat(stdout.trim()) || 0;
        const cpus = os.cpus();

        resolve({
          success: true,
          data: {
            usage: Math.round(usage * 10) / 10,
            cores: cpus.length,
            model: cpus[0]?.model || 'Unknown',
            speed: cpus[0]?.speed || 0
          }
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
        data: { usage: 0, cores: os.cpus().length, model: 'Unknown', speed: 0 }
      });
    }
  });
}

/**
 * Get memory usage statistics
 * @returns {Object} Memory usage data
 */
function getMemoryUsage() {
  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const usagePercent = (usedMem / totalMem) * 100;

    return {
      success: true,
      data: {
        total: totalMem,
        totalFormatted: formatBytes(totalMem),
        used: usedMem,
        usedFormatted: formatBytes(usedMem),
        free: freeMem,
        freeFormatted: formatBytes(freeMem),
        usage: Math.round(usagePercent * 10) / 10
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: { usage: 0, total: 0, used: 0, free: 0 }
    };
  }
}

/**
 * Get disk usage for all drives
 * @returns {Promise<Object>} Disk usage data
 */
async function getDiskUsage() {
  return new Promise((resolve) => {
    try {
      // Use PowerShell to get disk info
      const cmd = `powershell -NoProfile -Command "Get-WmiObject Win32_LogicalDisk | Where-Object {$_.DriveType -eq 3} | Select-Object DeviceID, Size, FreeSpace, VolumeName | ConvertTo-Json"`;

      exec(cmd, { timeout: 10000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: error.message,
            data: { drives: [], totalUsage: 0 }
          });
          return;
        }

        try {
          let disks = JSON.parse(stdout.trim());
          if (!Array.isArray(disks)) {
            disks = [disks];
          }

          let totalSize = 0;
          let totalUsed = 0;

          const drives = disks.map(disk => {
            const size = parseInt(disk.Size) || 0;
            const free = parseInt(disk.FreeSpace) || 0;
            const used = size - free;
            const usage = size > 0 ? (used / size) * 100 : 0;

            totalSize += size;
            totalUsed += used;

            return {
              letter: disk.DeviceID,
              name: disk.VolumeName || 'Local Disk',
              size: size,
              sizeFormatted: formatBytes(size),
              free: free,
              freeFormatted: formatBytes(free),
              used: used,
              usedFormatted: formatBytes(used),
              usage: Math.round(usage * 10) / 10
            };
          });

          const totalUsage = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;

          resolve({
            success: true,
            data: {
              drives: drives,
              totalSize: totalSize,
              totalSizeFormatted: formatBytes(totalSize),
              totalUsed: totalUsed,
              totalUsedFormatted: formatBytes(totalUsed),
              totalUsage: Math.round(totalUsage * 10) / 10
            }
          });
        } catch (parseError) {
          resolve({
            success: false,
            message: 'Failed to parse disk info',
            data: { drives: [], totalUsage: 0 }
          });
        }
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
        data: { drives: [], totalUsage: 0 }
      });
    }
  });
}

/**
 * Get disk I/O statistics
 * @returns {Promise<Object>} Disk I/O data
 */
async function getDiskIO() {
  return new Promise((resolve) => {
    try {
      const cmd = `powershell -NoProfile -Command "(Get-Counter '\\PhysicalDisk(_Total)\\Disk Bytes/sec').CounterSamples.CookedValue"`;

      exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: true,
            data: { bytesPerSec: 0, bytesPerSecFormatted: '0 B/s', activity: 0 }
          });
          return;
        }

        const bytesPerSec = parseFloat(stdout.trim()) || 0;
        // Estimate activity percentage (assuming max ~500MB/s for modern SSDs)
        const maxBytesPerSec = 500 * 1024 * 1024;
        const activity = Math.min(100, (bytesPerSec / maxBytesPerSec) * 100);

        resolve({
          success: true,
          data: {
            bytesPerSec: bytesPerSec,
            bytesPerSecFormatted: formatBytes(bytesPerSec) + '/s',
            activity: Math.round(activity * 10) / 10
          }
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
        data: { bytesPerSec: 0, activity: 0 }
      });
    }
  });
}

/**
 * Get network statistics
 * @returns {Promise<Object>} Network stats data
 */
async function getNetworkStats() {
  return new Promise((resolve) => {
    try {
      // Get network interfaces
      const interfaces = os.networkInterfaces();
      const activeInterfaces = [];

      for (const [name, addrs] of Object.entries(interfaces)) {
        const ipv4 = addrs.find(a => a.family === 'IPv4' && !a.internal);
        if (ipv4) {
          activeInterfaces.push({
            name: name,
            ip: ipv4.address,
            mac: ipv4.mac
          });
        }
      }

      // Get network throughput using PowerShell
      const cmd = `powershell -NoProfile -Command "Get-Counter '\\Network Interface(*)\\Bytes Total/sec' -ErrorAction SilentlyContinue | Select-Object -ExpandProperty CounterSamples | Where-Object {$_.CookedValue -gt 0} | Measure-Object -Property CookedValue -Sum | Select-Object -ExpandProperty Sum"`;

      exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        let bytesPerSec = 0;
        if (!error && stdout.trim()) {
          bytesPerSec = parseFloat(stdout.trim()) || 0;
        }

        // Estimate activity (assuming max ~1Gbps = 125MB/s)
        const maxBytesPerSec = 125 * 1024 * 1024;
        const activity = Math.min(100, (bytesPerSec / maxBytesPerSec) * 100);

        resolve({
          success: true,
          data: {
            interfaces: activeInterfaces,
            bytesPerSec: bytesPerSec,
            bytesPerSecFormatted: formatBytes(bytesPerSec) + '/s',
            activity: Math.round(activity * 10) / 10
          }
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
        data: { interfaces: [], bytesPerSec: 0, activity: 0 }
      });
    }
  });
}

/**
 * Get system uptime
 * @returns {Object} Uptime data
 */
function getUptime() {
  try {
    const uptimeSeconds = os.uptime();
    return {
      success: true,
      data: {
        seconds: uptimeSeconds,
        formatted: formatUptime(uptimeSeconds)
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message,
      data: { seconds: 0, formatted: '0s' }
    };
  }
}

/**
 * Get system information summary
 * @returns {Object} System info
 */
function getSystemInfo() {
  try {
    return {
      success: true,
      data: {
        platform: os.platform(),
        arch: os.arch(),
        hostname: os.hostname(),
        release: os.release(),
        type: os.type(),
        cpuModel: os.cpus()[0]?.model || 'Unknown',
        cpuCores: os.cpus().length,
        totalMemory: formatBytes(os.totalmem()),
        username: os.userInfo().username
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get all system metrics at once (optimized single call)
 * @returns {Promise<Object>} All metrics
 */
async function getAllMetrics() {
  try {
    const [cpu, disk, diskIO, network] = await Promise.all([
      getCpuUsage(),
      getDiskUsage(),
      getDiskIO(),
      getNetworkStats()
    ]);

    const memory = getMemoryUsage();
    const uptime = getUptime();

    return {
      success: true,
      data: {
        cpu: cpu.data,
        memory: memory.data,
        disk: disk.data,
        diskIO: diskIO.data,
        network: network.data,
        uptime: uptime.data,
        timestamp: Date.now()
      }
    };
  } catch (error) {
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Get boot time analysis (startup programs impact)
 * @returns {Promise<Object>} Boot time data
 */
async function getBootTime() {
  return new Promise((resolve) => {
    try {
      const cmd = `powershell -NoProfile -Command "(Get-CimInstance -ClassName Win32_OperatingSystem).LastBootUpTime"`;

      exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: false,
            message: error.message,
            data: { bootTime: null, uptimeSeconds: os.uptime() }
          });
          return;
        }

        const bootTimeStr = stdout.trim();
        const bootTime = new Date(bootTimeStr);
        const now = new Date();
        const uptimeMs = now - bootTime;

        resolve({
          success: true,
          data: {
            bootTime: bootTime.toISOString(),
            bootTimeFormatted: bootTime.toLocaleString(),
            uptimeSeconds: Math.floor(uptimeMs / 1000),
            uptimeFormatted: formatUptime(Math.floor(uptimeMs / 1000))
          }
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message
      });
    }
  });
}

/**
 * Get running processes count and top consumers
 * @returns {Promise<Object>} Process stats
 */
async function getProcessStats() {
  return new Promise((resolve) => {
    try {
      const cmd = `powershell -NoProfile -Command "Get-Process | Measure-Object | Select-Object -ExpandProperty Count"`;

      exec(cmd, { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          resolve({
            success: true,
            data: { count: 0, topCpu: [], topMemory: [] }
          });
          return;
        }

        const count = parseInt(stdout.trim()) || 0;

        // Get top CPU consumers
        const topCmd = `powershell -NoProfile -Command "Get-Process | Sort-Object CPU -Descending | Select-Object -First 5 Name, @{N='CPU';E={[math]::Round($_.CPU,1)}}, @{N='Memory';E={[math]::Round($_.WorkingSet64/1MB,1)}} | ConvertTo-Json"`;

        exec(topCmd, { timeout: 5000 }, (err2, stdout2) => {
          let topProcesses = [];
          if (!err2 && stdout2.trim()) {
            try {
              topProcesses = JSON.parse(stdout2.trim());
              if (!Array.isArray(topProcesses)) {
                topProcesses = [topProcesses];
              }
            } catch (e) {
              // Ignore parse errors
            }
          }

          resolve({
            success: true,
            data: {
              count: count,
              topProcesses: topProcesses.map(p => ({
                name: p.Name,
                cpu: p.CPU || 0,
                memory: p.Memory || 0
              }))
            }
          });
        });
      });
    } catch (error) {
      resolve({
        success: false,
        message: error.message,
        data: { count: 0, topProcesses: [] }
      });
    }
  });
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

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

/**
 * Format uptime seconds to human readable string
 */
function formatUptime(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0) parts.push(`${minutes}m`);
  if (parts.length === 0) parts.push(`${seconds}s`);

  return parts.join(' ');
}

module.exports = {
  getCpuUsage,
  getMemoryUsage,
  getDiskUsage,
  getDiskIO,
  getNetworkStats,
  getUptime,
  getSystemInfo,
  getAllMetrics,
  getBootTime,
  getProcessStats
};
