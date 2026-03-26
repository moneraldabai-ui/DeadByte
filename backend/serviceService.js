/**
 * DeadBYTE - Service Service
 * ==========================
 * Manages Windows services information and grouping.
 * Provides real-time service counts and categorization.
 */

const { exec } = require('child_process');

// Service category patterns
const CATEGORY_PATTERNS = {
  security: [
    /security/i, /defender/i, /firewall/i, /MpsSvc/i, /WinDefend/i,
    /wscsvc/i, /seclogon/i, /cryptsvc/i, /eventlog/i
  ],
  display: [
    /display/i, /graphics/i, /dwm/i, /wudfsvc/i, /tabletinput/i,
    /nvidia/i, /amd/i, /intel.*graphics/i, /fontcache/i
  ],
  background: [
    /update/i, /task/i, /schedule/i, /telemetry/i, /sync/i,
    /indexing/i, /search/i, /backup/i, /onedrive/i, /dropbox/i
  ]
};

/**
 * Get all running Windows services grouped by category
 * @returns {Promise<Object>} Grouped services data
 */
async function getServices() {
  return new Promise((resolve) => {
    const cmd = `powershell -NoProfile -Command "Get-Service | Where-Object {$_.Status -eq 'Running'} | Select-Object Name, DisplayName, Status, StartType | ConvertTo-Json -Depth 2"`;

    exec(cmd, { timeout: 15000, maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        resolve({
          success: false,
          message: error.message,
          data: getEmptyData()
        });
        return;
      }

      try {
        let services = JSON.parse(stdout.trim() || '[]');
        if (!Array.isArray(services)) {
          services = [services];
        }

        const grouped = categorizeServices(services);

        resolve({
          success: true,
          data: grouped
        });
      } catch (parseError) {
        resolve({
          success: false,
          message: 'Failed to parse services data',
          data: getEmptyData()
        });
      }
    });
  });
}

/**
 * Get services for a specific category
 * @param {string} category - Category name: security, display, background, system
 * @returns {Promise<Object>} Services in that category
 */
async function getServicesByCategory(category) {
  const result = await getServices();

  if (!result.success) {
    return result;
  }

  const categoryData = result.data.categories[category];

  if (!categoryData) {
    return {
      success: false,
      message: `Unknown category: ${category}`
    };
  }

  return {
    success: true,
    data: categoryData
  };
}

/**
 * Get service counts summary
 * @returns {Promise<Object>} Service counts by category
 */
async function getServiceCounts() {
  const result = await getServices();

  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      security: result.data.categories.security.count,
      display: result.data.categories.display.count,
      background: result.data.categories.background.count,
      system: result.data.categories.system.count,
      total: result.data.total
    }
  };
}

/**
 * Categorize services into groups
 * @param {Array} services - List of services
 * @returns {Object} Categorized services
 */
function categorizeServices(services) {
  const categories = {
    security: { count: 0, services: [], impact: 'Essential' },
    display: { count: 0, services: [], impact: '+0.3s delay' },
    background: { count: 0, services: [], impact: '+0.8s delay' },
    system: { count: 0, services: [], impact: 'Required' }
  };

  services.forEach(service => {
    const name = service.Name || '';
    const displayName = service.DisplayName || '';
    const combined = `${name} ${displayName}`;

    let assigned = false;

    // Check security
    for (const pattern of CATEGORY_PATTERNS.security) {
      if (pattern.test(combined)) {
        categories.security.count++;
        categories.security.services.push(formatService(service));
        assigned = true;
        break;
      }
    }

    if (!assigned) {
      // Check display
      for (const pattern of CATEGORY_PATTERNS.display) {
        if (pattern.test(combined)) {
          categories.display.count++;
          categories.display.services.push(formatService(service));
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      // Check background
      for (const pattern of CATEGORY_PATTERNS.background) {
        if (pattern.test(combined)) {
          categories.background.count++;
          categories.background.services.push(formatService(service));
          assigned = true;
          break;
        }
      }
    }

    if (!assigned) {
      // Everything else is system
      categories.system.count++;
      categories.system.services.push(formatService(service));
    }
  });

  // Calculate estimated delay for background services
  const bgDelay = Math.round(categories.background.count * 0.07 * 10) / 10;
  categories.background.impact = bgDelay > 0 ? `+${bgDelay}s delay` : 'Minimal';

  const displayDelay = Math.round(categories.display.count * 0.1 * 10) / 10;
  categories.display.impact = displayDelay > 0 ? `+${displayDelay}s delay` : 'Minimal';

  return {
    total: services.length,
    categories: categories
  };
}

/**
 * Format a service for output
 */
function formatService(service) {
  return {
    name: service.Name,
    displayName: service.DisplayName,
    status: service.Status?.Value || service.Status || 'Running',
    startType: service.StartType?.Value || service.StartType || 'Unknown'
  };
}

/**
 * Get empty data structure for error cases
 */
function getEmptyData() {
  return {
    total: 0,
    categories: {
      security: { count: 0, services: [], impact: 'Essential' },
      display: { count: 0, services: [], impact: 'Minimal' },
      background: { count: 0, services: [], impact: 'Minimal' },
      system: { count: 0, services: [], impact: 'Required' }
    }
  };
}

module.exports = {
  getServices,
  getServicesByCategory,
  getServiceCounts
};
