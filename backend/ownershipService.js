/**
 * DeadBYTE - Ownership Service
 * =============================
 * Handles file/folder ownership operations.
 */

const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const { executePowerShell, executePowerShellJson } = require('./utils/powershell');

// Import log service
const logService = require('./logService');
const { OperationType } = logService;

/**
 * Get the current owner of a file or folder
 */
async function getOwner(filePath) {
  try {
    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      [PSCustomObject]@{
        Owner = $acl.Owner;
        Group = $acl.Group;
        Path = '${filePath.replace(/'/g, "''")}'
      } | ConvertTo-Json -Compress
    `;

    const ownerInfo = await executePowerShellJson(psCommand, { timeout: 10000 });
    const isCurrentUser = await checkIsCurrentUser(ownerInfo.Owner);

    return {
      success: true,
      data: {
        owner: ownerInfo.Owner,
        group: ownerInfo.Group,
        path: ownerInfo.Path,
        isCurrentUser
      }
    };

  } catch (error) {
    logService.logError(OperationType.OWNERSHIP, `Failed to get owner: ${error.message}`, filePath);
    return { success: false, message: `Failed to get owner: ${error.message}` };
  }
}

/**
 * Check if an owner string matches the current user
 */
async function checkIsCurrentUser(owner) {
  try {
    const { stdout } = await executePowerShell(`[System.Security.Principal.WindowsIdentity]::GetCurrent().Name`, { timeout: 5000 });
    return stdout.trim().toLowerCase() === owner.toLowerCase();
  } catch (e) {
    return false;
  }
}

/**
 * Take ownership of a file or folder
 */
async function takeOwnership(filePath, options = {}) {
  const { recursive = false } = options;

  try {
    logService.logInfo(OperationType.OWNERSHIP, `Taking ownership${recursive ? ' (recursive)' : ''}`, filePath);

    // Method 1: Use takeown command (built into Windows)
    const recursiveFlag = recursive ? '/R /D Y' : '';
    try {
      const { stdout } = await execPromise(`takeown /F "${filePath}" ${recursiveFlag}`, { timeout: 60000 });

      if (stdout.toLowerCase().includes('success')) {
        logService.logSuccess(OperationType.OWNERSHIP, `Took ownership successfully`, filePath);
        await grantAccessAfterOwnership(filePath, recursive);
        return { success: true, message: `Successfully took ownership of: ${filePath}` };
      }
    } catch (e) {
      // Fallback to PowerShell
    }

    // Method 2: PowerShell method
    const psCommand = `
      $path = '${filePath.replace(/'/g, "''")}';
      $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent();
      $currentUserAccount = New-Object System.Security.Principal.NTAccount($currentUser.Name);
      try {
        $acl = Get-Acl -LiteralPath $path;
        $acl.SetOwner($currentUserAccount);
        Set-Acl -LiteralPath $path -AclObject $acl;
        Write-Output 'SUCCESS'
      } catch {
        Write-Output "FAILED:$($_.Exception.Message)"
      }
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 60000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.OWNERSHIP, `Took ownership via PowerShell`, filePath);
      await grantAccessAfterOwnership(filePath, recursive);
      return { success: true, message: `Successfully took ownership of: ${filePath}` };
    } else {
      throw new Error(stdout.replace('FAILED:', ''));
    }

  } catch (error) {
    logService.logError(OperationType.OWNERSHIP, `Failed to take ownership: ${error.message}`, filePath);
    return { success: false, message: `Failed to take ownership: ${error.message}` };
  }
}

/**
 * Grant full control access after taking ownership
 */
async function grantAccessAfterOwnership(filePath, recursive) {
  try {
    const recursiveFlag = recursive ? '/T' : '';
    await execPromise(`icacls "${filePath}" /grant "%USERNAME%":F ${recursiveFlag}`, { timeout: 60000 });
  } catch (e) {
    // Non-critical
  }
}

/**
 * Set owner of a file or folder to a specific user/group
 */
async function setOwner(filePath, newOwner) {
  try {
    logService.logInfo(OperationType.OWNERSHIP, `Setting owner to: ${newOwner}`, filePath);

    const psCommand = `
      $path = '${filePath.replace(/'/g, "''")}';
      $newOwner = '${newOwner.replace(/'/g, "''")}';
      $acl = Get-Acl -LiteralPath $path;
      $account = New-Object System.Security.Principal.NTAccount($newOwner);
      $acl.SetOwner($account);
      Set-Acl -LiteralPath $path -AclObject $acl;
      Write-Output 'SUCCESS'
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 15000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.OWNERSHIP, `Set owner to: ${newOwner}`, filePath);
      return { success: true, message: `Successfully set owner to: ${newOwner}` };
    } else {
      throw new Error('Failed to set owner');
    }

  } catch (error) {
    logService.logError(OperationType.OWNERSHIP, `Failed to set owner: ${error.message}`, filePath);
    return { success: false, message: `Failed to set owner: ${error.message}` };
  }
}

/**
 * Reset ownership to BUILTIN\Administrators
 */
async function resetOwnership(filePath, options = {}) {
  const { recursive = false } = options;

  try {
    logService.logInfo(OperationType.OWNERSHIP, `Resetting ownership to Administrators`, filePath);

    const psCommand = `
      $path = '${filePath.replace(/'/g, "''")}';
      $adminAccount = New-Object System.Security.Principal.NTAccount('BUILTIN', 'Administrators');
      try {
        $acl = Get-Acl -LiteralPath $path;
        $acl.SetOwner($adminAccount);
        Set-Acl -LiteralPath $path -AclObject $acl;
        Write-Output 'SUCCESS'
      } catch {
        Write-Output "FAILED:$($_.Exception.Message)"
      }
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 60000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.OWNERSHIP, `Reset ownership to Administrators`, filePath);
      return { success: true, message: 'Successfully reset ownership to BUILTIN\\Administrators' };
    } else {
      throw new Error(stdout.replace('FAILED:', ''));
    }

  } catch (error) {
    logService.logError(OperationType.OWNERSHIP, `Failed to reset ownership: ${error.message}`, filePath);
    return { success: false, message: `Failed to reset ownership: ${error.message}` };
  }
}

/**
 * Get list of common owner options for UI
 */
async function getOwnerOptions() {
  try {
    const psCommand = `
      $options = @();
      $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name;
      $options += [PSCustomObject]@{ Name = $currentUser; Description = 'Current User' };
      $options += [PSCustomObject]@{ Name = 'BUILTIN\\Administrators'; Description = 'Administrators Group' };
      $options += [PSCustomObject]@{ Name = 'NT AUTHORITY\\SYSTEM'; Description = 'Local System' };
      $options += [PSCustomObject]@{ Name = 'BUILTIN\\Users'; Description = 'Users Group' };
      $options | ConvertTo-Json -Compress
    `;

    const options = await executePowerShellJson(psCommand, { timeout: 10000 });
    return { success: true, data: Array.isArray(options) ? options : [options] };

  } catch (error) {
    return {
      success: true,
      data: [
        { Name: 'BUILTIN\\Administrators', Description: 'Administrators Group' },
        { Name: 'NT AUTHORITY\\SYSTEM', Description: 'Local System' },
        { Name: 'BUILTIN\\Users', Description: 'Users Group' }
      ]
    };
  }
}

module.exports = {
  getOwner,
  takeOwnership,
  setOwner,
  resetOwnership,
  getOwnerOptions
};
