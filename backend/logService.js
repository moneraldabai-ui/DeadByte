/**
 * DeadBYTE - Log Service
 * =======================
 * Centralized logging for all operations.
 * Maintains an in-memory log that can be displayed in the UI.
 */

// In-memory log storage
let operationLogs = [];
const MAX_LOG_ENTRIES = 1000;

// Event emitter for real-time log updates
let logEventCallback = null;

/**
 * Log entry types
 */
const LogType = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
  OPERATION: 'operation'
};

/**
 * Operation types for categorization
 */
const OperationType = {
  SCAN: 'scan',
  DELETE: 'delete',
  FORCE_DELETE: 'force_delete',
  OWNERSHIP: 'ownership',
  PERMISSION: 'permission',
  PROCESS_KILL: 'process_kill',
  SYSTEM: 'system'
};

/**
 * Add a log entry
 * @param {Object} options
 * @param {string} options.type - Log type (info, success, warning, error, operation)
 * @param {string} options.operation - Operation type (scan, delete, etc.)
 * @param {string} options.message - Log message
 * @param {string} [options.path] - File/folder path if applicable
 * @param {Object} [options.details] - Additional details
 * @returns {Object} The created log entry
 */
function addLog({ type, operation, message, path = null, details = null }) {
  const entry = {
    id: generateId(),
    timestamp: new Date().toISOString(),
    type: type || LogType.INFO,
    operation: operation || OperationType.SYSTEM,
    message,
    path,
    details
  };

  // Add to beginning of array (newest first)
  operationLogs.unshift(entry);

  // Trim if exceeds max
  if (operationLogs.length > MAX_LOG_ENTRIES) {
    operationLogs = operationLogs.slice(0, MAX_LOG_ENTRIES);
  }

  // Emit event for real-time updates
  if (logEventCallback) {
    logEventCallback(entry);
  }

  // Also log to console for debugging
  const consoleMethod = type === LogType.ERROR ? console.error :
                        type === LogType.WARNING ? console.warn :
                        console.log;
  consoleMethod(`[${entry.timestamp}] [${type.toUpperCase()}] ${message}`, path ? `Path: ${path}` : '');

  return entry;
}

/**
 * Convenience methods for different log types
 */
function logInfo(operation, message, path = null, details = null) {
  return addLog({ type: LogType.INFO, operation, message, path, details });
}

function logSuccess(operation, message, path = null, details = null) {
  return addLog({ type: LogType.SUCCESS, operation, message, path, details });
}

function logWarning(operation, message, path = null, details = null) {
  return addLog({ type: LogType.WARNING, operation, message, path, details });
}

function logError(operation, message, path = null, details = null) {
  return addLog({ type: LogType.ERROR, operation, message, path, details });
}

function logOperation(operation, message, path = null, details = null) {
  return addLog({ type: LogType.OPERATION, operation, message, path, details });
}

/**
 * Get all logs
 * @param {Object} [options]
 * @param {string} [options.type] - Filter by log type
 * @param {string} [options.operation] - Filter by operation type
 * @param {number} [options.limit] - Limit number of results
 * @returns {{success: boolean, data: Array}}
 */
function getLogs(options = {}) {
  try {
    let logs = [...operationLogs];

    // Filter by type
    if (options.type) {
      logs = logs.filter(log => log.type === options.type);
    }

    // Filter by operation
    if (options.operation) {
      logs = logs.filter(log => log.operation === options.operation);
    }

    // Limit results
    if (options.limit && options.limit > 0) {
      logs = logs.slice(0, options.limit);
    }

    return {
      success: true,
      data: logs
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to get logs: ${error.message}`,
      data: []
    };
  }
}

/**
 * Clear all logs
 * @returns {{success: boolean, message: string}}
 */
function clearLogs() {
  const count = operationLogs.length;
  operationLogs = [];

  logInfo(OperationType.SYSTEM, `Cleared ${count} log entries`);

  return {
    success: true,
    message: `Cleared ${count} log entries`
  };
}

/**
 * Get log statistics
 * @returns {{success: boolean, data: Object}}
 */
function getLogStats() {
  const stats = {
    total: operationLogs.length,
    byType: {},
    byOperation: {}
  };

  operationLogs.forEach(log => {
    // Count by type
    stats.byType[log.type] = (stats.byType[log.type] || 0) + 1;
    // Count by operation
    stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
  });

  return {
    success: true,
    data: stats
  };
}

/**
 * Set callback for real-time log events
 * @param {Function} callback
 */
function setLogEventCallback(callback) {
  logEventCallback = callback;
}

/**
 * Export logs to JSON string
 * @returns {{success: boolean, data: string}}
 */
function exportLogs() {
  try {
    const exportData = {
      exportedAt: new Date().toISOString(),
      totalEntries: operationLogs.length,
      logs: operationLogs
    };

    return {
      success: true,
      data: JSON.stringify(exportData, null, 2)
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to export logs: ${error.message}`
    };
  }
}

/**
 * Generate a unique ID for log entries
 * @returns {string}
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

module.exports = {
  // Log types and operation types
  LogType,
  OperationType,

  // Main logging functions
  addLog,
  logInfo,
  logSuccess,
  logWarning,
  logError,
  logOperation,

  // Log retrieval
  getLogs,
  clearLogs,
  getLogStats,
  exportLogs,

  // Event handling
  setLogEventCallback
};
