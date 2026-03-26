/**
 * DeadBYTE - Permission Service
 * ==============================
 * Handles Windows ACL (Access Control List) operations.
 * Gets and sets file/folder permissions using PowerShell.
 */

const { executePowerShell, executePowerShellJson } = require('./utils/powershell');

// Import log service
const logService = require('./logService');
const { LogType, OperationType } = logService;

/**
 * Get permissions (ACL) for a file or folder
 * @param {string} filePath - Path to file or folder
 * @returns {Promise<{success: boolean, data?: Object, message?: string}>}
 */
async function getPermissions(filePath) {
  try {
    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      $accessRules = $acl.Access | ForEach-Object {
        [PSCustomObject]@{
          Identity = $_.IdentityReference.Value;
          AccessType = $_.AccessControlType.ToString();
          Rights = $_.FileSystemRights.ToString();
          IsInherited = $_.IsInherited;
          InheritanceFlags = $_.InheritanceFlags.ToString();
          PropagationFlags = $_.PropagationFlags.ToString()
        }
      };
      [PSCustomObject]@{
        Owner = $acl.Owner;
        Group = $acl.Group;
        Path = $acl.Path;
        AreAccessRulesProtected = $acl.AreAccessRulesProtected;
        AccessRules = $accessRules
      } | ConvertTo-Json -Depth 3 -Compress
    `;

    const aclData = await executePowerShellJson(psCommand, { timeout: 15000 });

    // Format access rules for easier consumption
    const accessRules = aclData.AccessRules || [];
    const formattedRules = (Array.isArray(accessRules) ? accessRules : [accessRules]).filter(Boolean).map(rule => ({
      identity: rule.Identity,
      accessType: rule.AccessType,
      rights: parseFileSystemRights(rule.Rights),
      rightsRaw: rule.Rights,
      isInherited: rule.IsInherited,
      inheritanceFlags: rule.InheritanceFlags,
      propagationFlags: rule.PropagationFlags
    }));

    logService.logInfo(OperationType.PERMISSION, `Retrieved permissions`, filePath);

    return {
      success: true,
      data: {
        path: filePath,
        owner: aclData.Owner,
        group: aclData.Group,
        isProtected: aclData.AreAccessRulesProtected,
        accessRules: formattedRules,
        summary: generatePermissionSummary(formattedRules)
      }
    };

  } catch (error) {
    logService.logError(OperationType.PERMISSION, `Failed to get permissions: ${error.message}`, filePath);
    return {
      success: false,
      message: `Failed to get permissions: ${error.message}`
    };
  }
}

/**
 * Parse FileSystemRights enum to readable permissions
 */
function parseFileSystemRights(rights) {
  const rightsMap = {
    'FullControl': 'Full Control',
    'Modify': 'Modify',
    'ReadAndExecute': 'Read & Execute',
    'Read': 'Read',
    'Write': 'Write',
    'Delete': 'Delete',
    'ReadPermissions': 'Read Permissions',
    'ChangePermissions': 'Change Permissions',
    'TakeOwnership': 'Take Ownership',
    'Synchronize': 'Synchronize'
  };

  return rights.split(',').map(r => {
    const trimmed = r.trim();
    return rightsMap[trimmed] || trimmed;
  });
}

/**
 * Generate a human-readable permission summary
 */
function generatePermissionSummary(accessRules) {
  const summary = {
    hasFullControl: false,
    canRead: false,
    canWrite: false,
    canDelete: false,
    canExecute: false,
    primaryUsers: []
  };

  for (const rule of accessRules) {
    if (rule.accessType === 'Allow') {
      const rights = rule.rightsRaw.toLowerCase();
      if (rights.includes('fullcontrol')) {
        summary.hasFullControl = true;
        summary.canRead = true;
        summary.canWrite = true;
        summary.canDelete = true;
        summary.canExecute = true;
      }
      if (rights.includes('read')) summary.canRead = true;
      if (rights.includes('write') || rights.includes('modify')) summary.canWrite = true;
      if (rights.includes('delete')) summary.canDelete = true;
      if (rights.includes('execute') || rights.includes('readandexecute')) summary.canExecute = true;

      if (rights.includes('fullcontrol') || rights.includes('modify')) {
        if (!summary.primaryUsers.includes(rule.identity)) {
          summary.primaryUsers.push(rule.identity);
        }
      }
    }
  }

  return summary;
}

/**
 * Set permissions on a file or folder
 */
async function setPermissions(filePath, options) {
  const { identity, rights, accessType = 'Allow', inherit = true } = options;

  if (!identity || !rights) {
    return { success: false, message: 'Identity and rights are required' };
  }

  try {
    const inheritFlags = inherit ? 'ContainerInherit, ObjectInherit' : 'None';

    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      $identity = '${identity.replace(/'/g, "''")}';
      $rights = [System.Security.AccessControl.FileSystemRights]'${rights}';
      $inheritFlags = [System.Security.AccessControl.InheritanceFlags]'${inheritFlags}';
      $propFlags = [System.Security.AccessControl.PropagationFlags]'None';
      $accessType = [System.Security.AccessControl.AccessControlType]'${accessType}';
      $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, $rights, $inheritFlags, $propFlags, $accessType);
      $acl.SetAccessRule($rule);
      Set-Acl -LiteralPath '${filePath.replace(/'/g, "''")}' -AclObject $acl;
      Write-Output 'SUCCESS'
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 15000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.PERMISSION, `Set permissions: ${identity} -> ${rights}`, filePath);
      return { success: true, message: `Successfully set ${rights} permissions for ${identity}` };
    } else {
      throw new Error('Failed to set permissions');
    }

  } catch (error) {
    logService.logError(OperationType.PERMISSION, `Failed to set permissions: ${error.message}`, filePath);
    return { success: false, message: `Failed to set permissions: ${error.message}` };
  }
}

/**
 * Remove a permission rule
 */
async function removePermission(filePath, identity) {
  try {
    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      $identity = '${identity.replace(/'/g, "''")}';
      $rulesToRemove = $acl.Access | Where-Object { $_.IdentityReference.Value -eq $identity };
      foreach ($rule in $rulesToRemove) { $acl.RemoveAccessRule($rule) | Out-Null };
      Set-Acl -LiteralPath '${filePath.replace(/'/g, "''")}' -AclObject $acl;
      Write-Output 'SUCCESS'
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 15000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.PERMISSION, `Removed permissions for: ${identity}`, filePath);
      return { success: true, message: `Successfully removed permissions for ${identity}` };
    } else {
      throw new Error('Failed to remove permissions');
    }

  } catch (error) {
    logService.logError(OperationType.PERMISSION, `Failed to remove permissions: ${error.message}`, filePath);
    return { success: false, message: `Failed to remove permissions: ${error.message}` };
  }
}

/**
 * Reset permissions to inherited defaults
 */
async function resetPermissions(filePath) {
  try {
    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      $acl.SetAccessRuleProtection($false, $false);
      $acl.Access | Where-Object { -not $_.IsInherited } | ForEach-Object { $acl.RemoveAccessRule($_) | Out-Null };
      Set-Acl -LiteralPath '${filePath.replace(/'/g, "''")}' -AclObject $acl;
      Write-Output 'SUCCESS'
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 15000 });

    if (stdout.includes('SUCCESS')) {
      logService.logSuccess(OperationType.PERMISSION, `Reset permissions to inherited defaults`, filePath);
      return { success: true, message: 'Successfully reset permissions to inherited defaults' };
    } else {
      throw new Error('Failed to reset permissions');
    }

  } catch (error) {
    logService.logError(OperationType.PERMISSION, `Failed to reset permissions: ${error.message}`, filePath);
    return { success: false, message: `Failed to reset permissions: ${error.message}` };
  }
}

/**
 * Grant full control to current user
 */
async function grantFullControl(filePath) {
  try {
    const psCommand = `
      $acl = Get-Acl -LiteralPath '${filePath.replace(/'/g, "''")}';
      $identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name;
      $rights = [System.Security.AccessControl.FileSystemRights]'FullControl';
      $inheritFlags = [System.Security.AccessControl.InheritanceFlags]'ContainerInherit, ObjectInherit';
      $propFlags = [System.Security.AccessControl.PropagationFlags]'None';
      $accessType = [System.Security.AccessControl.AccessControlType]'Allow';
      $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($identity, $rights, $inheritFlags, $propFlags, $accessType);
      $acl.SetAccessRule($rule);
      Set-Acl -LiteralPath '${filePath.replace(/'/g, "''")}' -AclObject $acl;
      Write-Output "SUCCESS:$identity"
    `;

    const { stdout } = await executePowerShell(psCommand, { timeout: 15000 });

    if (stdout.includes('SUCCESS')) {
      const identity = stdout.split(':')[1]?.trim() || 'current user';
      logService.logSuccess(OperationType.PERMISSION, `Granted Full Control to ${identity}`, filePath);
      return { success: true, message: `Successfully granted Full Control to ${identity}` };
    } else {
      throw new Error('Failed to grant full control');
    }

  } catch (error) {
    logService.logError(OperationType.PERMISSION, `Failed to grant full control: ${error.message}`, filePath);
    return { success: false, message: `Failed to grant full control: ${error.message}` };
  }
}

module.exports = {
  getPermissions,
  setPermissions,
  removePermission,
  resetPermissions,
  grantFullControl
};
