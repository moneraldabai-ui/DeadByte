/**
 * DeadBYTE - PowerShell Utility
 * ==============================
 * Helper functions for executing PowerShell commands safely.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

/**
 * Execute a PowerShell command using Base64 encoding to avoid escaping issues
 * @param {string} command - PowerShell command to execute
 * @param {Object} [options] - Execution options
 * @param {number} [options.timeout=30000] - Timeout in milliseconds
 * @param {number} [options.maxBuffer=1024*1024] - Max buffer size
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function executePowerShell(command, options = {}) {
  const { timeout = 30000, maxBuffer = 1024 * 1024 } = options;

  // Encode command as Base64 (UTF-16LE for PowerShell)
  const encodedCommand = Buffer.from(command, 'utf16le').toString('base64');

  return execPromise(
    `powershell -NoProfile -NonInteractive -EncodedCommand ${encodedCommand}`,
    { timeout, maxBuffer }
  );
}

/**
 * Execute a PowerShell command and parse JSON output
 * @param {string} command - PowerShell command that outputs JSON
 * @param {Object} [options] - Execution options
 * @returns {Promise<any>} Parsed JSON result
 */
async function executePowerShellJson(command, options = {}) {
  const { stdout } = await executePowerShell(command, options);
  return JSON.parse(stdout || 'null');
}

module.exports = {
  executePowerShell,
  executePowerShellJson
};
