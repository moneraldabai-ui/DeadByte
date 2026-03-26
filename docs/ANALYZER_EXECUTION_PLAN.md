# Analyzer Module - Functional Architecture & Execution Plan

## Overview

The Analyzer module serves as the **intelligence center** of DeadBYTE, providing comprehensive disk analysis that feeds into the Clean module. It scans, categorizes, and prioritizes files for potential cleanup while giving users deep insights into their storage usage.

**Core Philosophy**: Analyze thoroughly, present clearly, act through Clean.

---

## 1. Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ANALYZER PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  SCAN    │───▶│ PROCESS  │───▶│ PRESENT  │───▶│ HANDOFF  │              │
│  │          │    │          │    │          │    │          │              │
│  │ Discover │    │ Classify │    │ Display  │    │ → Clean  │              │
│  │ files    │    │ & rank   │    │ insights │    │ module   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                     │
│       ▼               ▼               ▼               ▼                     │
│   File I/O       Algorithms       UI Updates      IPC Transfer              │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: SCAN (Discovery)
- Enumerate files in target directories
- Collect metadata (size, dates, attributes)
- Track progress for UI updates
- Handle access denied gracefully

### Phase 2: PROCESS (Classification)
- Categorize files by type and purpose
- Calculate risk scores
- Identify patterns (duplicates, large files, old files)
- Build category aggregates

### Phase 3: PRESENT (Display)
- Update dashboard metrics
- Render disk usage visualization
- Populate category breakdown
- Generate insights

### Phase 4: HANDOFF (Action)
- Transfer selected items to Clean module
- Preserve category and risk metadata
- Maintain selection state

---

## 2. UI ↔ Backend Mapping

### 2.1 Scan Mode Selection

| UI Element | Backend Command | Parameters | Response |
|------------|-----------------|------------|----------|
| Quick Scan card | `analyzer_start_scan` | `{ mode: "quick", targets: [...] }` | `{ scan_id, estimated_items }` |
| Full Scan card | `analyzer_start_scan` | `{ mode: "full", targets: [...] }` | `{ scan_id, estimated_items }` |
| Custom Scan card | Opens target selector | N/A | N/A |
| Target checkboxes | Stored in UI state | N/A | N/A |
| Start Custom Scan | `analyzer_start_scan` | `{ mode: "custom", targets: [...] }` | `{ scan_id, estimated_items }` |

### 2.2 Scan Modes Definition

```javascript
const SCAN_MODES = {
  quick: {
    targets: ['temp', 'browser_cache', 'recycle_bin'],
    depth: 'shallow',        // Only immediate directories
    timeout_per_dir: 5000,   // 5 seconds max per directory
    skip_system: true,
    skip_hidden: true
  },
  full: {
    targets: ['all_user_dirs', 'all_cache', 'all_logs'],
    depth: 'deep',           // Full recursive scan
    timeout_per_dir: 30000,  // 30 seconds max per directory
    skip_system: true,
    skip_hidden: false
  },
  custom: {
    targets: [],             // User-selected
    depth: 'deep',
    timeout_per_dir: 30000,
    skip_system: false,      // User choice
    skip_hidden: false       // User choice
  }
};
```

### 2.3 Progress Updates (Backend → UI)

```javascript
// Backend emits events during scan
event: 'analyzer_progress'
payload: {
  scan_id: string,
  phase: 'scanning' | 'processing' | 'complete',
  current_path: string,        // What's being scanned now
  items_scanned: number,
  items_found: number,
  bytes_analyzed: number,
  percent_complete: number,
  eta_seconds: number | null
}

// UI updates
- Progress ring animation
- Current path display
- Running totals in metrics
- ETA countdown
```

### 2.4 Dashboard Elements

| UI Element | Data Source | Update Trigger |
|------------|-------------|----------------|
| Space Reclaimable | `sum(category.reclaimable_bytes)` | On scan progress |
| Files Analyzed | `scan_result.total_files` | On scan progress |
| Issues Found | `count(items where risk > 'low')` | On processing complete |
| Disk Usage Ring | `{ used, reclaimable, free }` | On scan complete |
| Insights Panel | `analysis.insights[]` | On processing complete |

### 2.5 Category Breakdown

| UI Element | Backend Command | Parameters | Response |
|------------|-----------------|------------|----------|
| Category row | Display only | N/A | N/A |
| Expand/collapse | UI-only toggle | N/A | N/A |
| Category checkbox | Updates selection state | N/A | N/A |
| Item checkbox | Updates selection state | N/A | N/A |
| "View Details" | `analyzer_get_category_items` | `{ category_id, page, limit }` | `{ items[], total, has_more }` |

### 2.6 Actions

| UI Element | Backend Command | Parameters | Response |
|------------|-----------------|------------|----------|
| Send to Clean | `analyzer_prepare_handoff` | `{ selected_items[] }` | `{ handoff_id, item_count }` |
| Export Report | `analyzer_export_report` | `{ format: 'json' | 'csv' }` | `{ file_path }` |
| Rescan | `analyzer_start_scan` | Same as initial | Same as initial |
| Cancel Scan | `analyzer_cancel_scan` | `{ scan_id }` | `{ cancelled: true }` |

---

## 3. Data Structures

### 3.1 Scan Result

```typescript
interface ScanResult {
  scan_id: string;
  mode: 'quick' | 'full' | 'custom';
  started_at: DateTime;
  completed_at: DateTime | null;
  status: 'running' | 'completed' | 'cancelled' | 'error';

  // Aggregates
  total_files: number;
  total_bytes: number;
  reclaimable_bytes: number;

  // Categories
  categories: CategoryResult[];

  // Analysis
  insights: Insight[];
  disk_usage: DiskUsage;
}

interface CategoryResult {
  id: string;
  name: string;
  icon: string;
  item_count: number;
  total_bytes: number;
  reclaimable_bytes: number;
  risk_level: 'low' | 'medium' | 'high';
  items: AnalyzedItem[];  // May be paginated
}

interface AnalyzedItem {
  id: string;
  path: string;
  name: string;
  size_bytes: number;
  created_at: DateTime;
  modified_at: DateTime;
  accessed_at: DateTime;
  category_id: string;
  risk_level: 'low' | 'medium' | 'high';
  risk_reason: string | null;
  is_selected: boolean;  // UI state
}
```

### 3.2 Category Definitions

```javascript
const CATEGORIES = {
  temp_files: {
    id: 'temp_files',
    name: 'Temporary Files',
    icon: 'file-temp',
    description: 'System and application temporary files',
    locations: [
      '%TEMP%',
      '%LOCALAPPDATA%\\Temp',
      'C:\\Windows\\Temp'
    ],
    patterns: ['*.tmp', '~*', '*.temp'],
    default_risk: 'low'
  },

  browser_cache: {
    id: 'browser_cache',
    name: 'Browser Cache',
    icon: 'globe',
    description: 'Cached web content from browsers',
    locations: [
      '%LOCALAPPDATA%\\Google\\Chrome\\User Data\\*\\Cache',
      '%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles\\*\\cache2',
      '%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\*\\Cache'
    ],
    patterns: ['*'],
    default_risk: 'low'
  },

  log_files: {
    id: 'log_files',
    name: 'Log Files',
    icon: 'file-text',
    description: 'Application and system log files',
    locations: [
      '%LOCALAPPDATA%\\**\\*.log',
      'C:\\Windows\\Logs'
    ],
    patterns: ['*.log', '*.log.*'],
    default_risk: 'low'
  },

  old_downloads: {
    id: 'old_downloads',
    name: 'Old Downloads',
    icon: 'download',
    description: 'Downloaded files older than 30 days',
    locations: [
      '%USERPROFILE%\\Downloads'
    ],
    patterns: ['*'],
    age_threshold_days: 30,
    default_risk: 'medium'
  },

  large_files: {
    id: 'large_files',
    name: 'Large Files',
    icon: 'file-plus',
    description: 'Files larger than 100MB',
    locations: ['%USERPROFILE%'],
    patterns: ['*'],
    size_threshold_bytes: 104857600,  // 100MB
    default_risk: 'medium'
  },

  duplicate_files: {
    id: 'duplicate_files',
    name: 'Duplicate Files',
    icon: 'copy',
    description: 'Files with identical content',
    locations: ['%USERPROFILE%'],
    patterns: ['*'],
    requires_hash: true,
    default_risk: 'medium'
  },

  installer_cache: {
    id: 'installer_cache',
    name: 'Installer Cache',
    icon: 'package',
    description: 'Cached installation packages',
    locations: [
      'C:\\Windows\\Installer\\$PatchCache$',
      '%LOCALAPPDATA%\\Package Cache'
    ],
    patterns: ['*.msi', '*.msp', '*.cab'],
    default_risk: 'medium'
  },

  recycle_bin: {
    id: 'recycle_bin',
    name: 'Recycle Bin',
    icon: 'trash-2',
    description: 'Files in the Recycle Bin',
    locations: ['$RECYCLE.BIN'],
    patterns: ['*'],
    default_risk: 'low'
  }
};
```

### 3.3 Disk Usage

```typescript
interface DiskUsage {
  drive: string;           // 'C:'
  total_bytes: number;
  used_bytes: number;
  free_bytes: number;
  reclaimable_bytes: number;

  // For visualization
  used_percent: number;
  reclaimable_percent: number;
  free_percent: number;
}
```

### 3.4 Insights

```typescript
interface Insight {
  id: string;
  type: 'tip' | 'warning' | 'info';
  icon: string;
  title: string;
  description: string;
  category_id: string | null;  // Link to relevant category
  priority: number;            // For sorting
}

// Example insights
const INSIGHT_TEMPLATES = {
  large_temp: {
    type: 'tip',
    icon: 'lightbulb',
    title: 'Large temp folder',
    description: 'Your temp folder has {size} of reclaimable space',
    condition: (cats) => cats.temp_files.total_bytes > 1073741824  // > 1GB
  },
  old_browser_cache: {
    type: 'tip',
    icon: 'clock',
    title: 'Browser cache buildup',
    description: '{count} cached files from over 30 days ago',
    condition: (cats) => cats.browser_cache.old_item_count > 1000
  },
  duplicates_found: {
    type: 'warning',
    icon: 'alert-triangle',
    title: 'Duplicate files detected',
    description: '{count} duplicate files wasting {size}',
    condition: (cats) => cats.duplicate_files.item_count > 0
  }
};
```

---

## 4. State Machine

```
                                    ┌─────────────────┐
                                    │      IDLE       │
                                    │                 │
                                    │ No active scan  │
                                    └────────┬────────┘
                                             │
                              User selects scan mode
                                             │
                                             ▼
                    ┌─────────────────────────────────────────┐
                    │              CONFIGURING                │
                    │                                         │
                    │ Custom mode: selecting targets          │
                    │ Quick/Full: auto-proceeds               │
                    └──────────────────┬──────────────────────┘
                                       │
                              User confirms / mode selected
                                       │
                                       ▼
         ┌──────────────────────────────────────────────────────────┐
         │                       SCANNING                            │
         │                                                           │
         │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
         │  │ Discovering │───▶│  Indexing   │───▶│  Hashing    │  │
         │  │   files     │    │  metadata   │    │ (if needed) │  │
         │  └─────────────┘    └─────────────┘    └─────────────┘  │
         │                                                           │
         │  Progress: ████████░░░░░░░░░░░░░░ 40%                    │
         └───────────────────────────┬──────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
               Cancel clicked    Complete         Error
                    │                │                │
                    ▼                ▼                ▼
            ┌───────────┐    ┌───────────┐    ┌───────────┐
            │ CANCELLED │    │ COMPLETE  │    │  ERROR    │
            │           │    │           │    │           │
            │ Partial   │    │ Full      │    │ Partial   │
            │ results   │    │ results   │    │ + error   │
            └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                                   ▼
                        ┌───────────────────┐
                        │    REVIEWING      │
                        │                   │
                        │ User examines     │
                        │ results, selects  │
                        │ items             │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
               Send to Clean   Rescan       Export
                    │             │             │
                    ▼             │             ▼
            ┌───────────┐        │      ┌───────────┐
            │ HANDOFF   │        │      │ EXPORTING │
            │           │        │      │           │
            │ Transfer  │        │      │ Generate  │
            │ to Clean  │        │      │ report    │
            └─────┬─────┘        │      └─────┬─────┘
                  │              │            │
                  ▼              │            ▼
         Navigate to Clean       │      Save dialog
                  │              │            │
                  ▼              ▼            ▼
            ┌──────────────────────────────────────┐
            │              IDLE                     │
            └──────────────────────────────────────┘
```

### State Definitions

```typescript
type AnalyzerState =
  | { state: 'idle' }
  | { state: 'configuring', mode: 'custom', selected_targets: string[] }
  | { state: 'scanning', scan_id: string, progress: ScanProgress }
  | { state: 'cancelled', scan_id: string, partial_result: ScanResult }
  | { state: 'complete', scan_id: string, result: ScanResult }
  | { state: 'error', scan_id: string, error: AnalyzerError, partial_result?: ScanResult }
  | { state: 'reviewing', scan_id: string, result: ScanResult, selections: Set<string> }
  | { state: 'handoff', handoff_id: string, items: AnalyzedItem[] }
  | { state: 'exporting', format: 'json' | 'csv' };

interface ScanProgress {
  phase: 'discovering' | 'indexing' | 'hashing';
  current_path: string;
  items_scanned: number;
  items_found: number;
  bytes_analyzed: number;
  percent_complete: number;
  eta_seconds: number | null;
}
```

---

## 5. Error Handling

### 5.1 Error Types

| Error Type | Cause | User Message | Recovery |
|------------|-------|--------------|----------|
| `ACCESS_DENIED` | Permission issue | "Some folders couldn't be accessed" | Continue with accessible items |
| `PATH_NOT_FOUND` | Directory missing | "Target directory not found" | Skip and continue |
| `TIMEOUT` | Scan taking too long | "Scan timed out for [path]" | Show partial results |
| `OUT_OF_MEMORY` | Too many files | "Memory limit reached" | Show partial results |
| `DISK_ERROR` | I/O failure | "Disk read error" | Retry or skip |
| `CANCELLED` | User cancelled | "Scan cancelled" | Show partial results |

### 5.2 Graceful Degradation

```javascript
// Backend handles errors gracefully
async function scanDirectory(path, options) {
  try {
    const entries = await fs.readdir(path);
    // ... process entries
  } catch (error) {
    if (error.code === 'EACCES') {
      // Log and continue - don't fail entire scan
      emit('analyzer_warning', {
        type: 'ACCESS_DENIED',
        path: path,
        message: 'Permission denied, skipping'
      });
      return { skipped: true, reason: 'access_denied' };
    }
    throw error;  // Re-throw unexpected errors
  }
}
```

### 5.3 UI Error Display

```javascript
// Errors shown in insights panel
const ERROR_INSIGHTS = {
  access_denied: {
    type: 'warning',
    icon: 'lock',
    title: 'Access restricted',
    description: '{count} folders were skipped due to permissions'
  },
  timeout: {
    type: 'warning',
    icon: 'clock',
    title: 'Scan timeout',
    description: 'Some large directories were skipped'
  }
};
```

---

## 6. Performance Considerations

### 6.1 Scan Optimization

```javascript
const PERFORMANCE_CONFIG = {
  // Batch processing
  batch_size: 1000,              // Process files in batches
  batch_delay_ms: 10,            // Yield to UI between batches

  // Progress updates
  progress_throttle_ms: 100,     // Max update frequency

  // Memory management
  max_items_in_memory: 50000,    // Page to disk beyond this
  hash_chunk_size: 65536,        // 64KB chunks for hashing

  // Timeouts
  dir_timeout_ms: 30000,         // Per-directory timeout
  total_timeout_ms: 600000,      // 10-minute max scan

  // Threading (Rust/Tauri)
  worker_threads: 4,             // Parallel directory scanning
  hash_threads: 2                // Parallel file hashing
};
```

### 6.2 UI Responsiveness

```javascript
// Throttle UI updates during scan
class AnalyzerUI {
  constructor() {
    this.updateThrottle = throttle(this.updateDisplay.bind(this), 100);
  }

  onProgress(event) {
    // Queue update instead of immediate
    this.updateThrottle(event);
  }

  updateDisplay(progress) {
    requestAnimationFrame(() => {
      this.updateProgressRing(progress.percent);
      this.updateMetrics(progress);
      this.updateCurrentPath(progress.current_path);
    });
  }
}
```

### 6.3 Large Result Handling

```javascript
// Paginate category items for large result sets
async function getCategoryItems(categoryId, page = 0, limit = 100) {
  const offset = page * limit;
  return {
    items: await db.query(`
      SELECT * FROM analyzed_items
      WHERE category_id = ?
      ORDER BY size_bytes DESC
      LIMIT ? OFFSET ?
    `, [categoryId, limit, offset]),
    total: await db.count('analyzed_items', { category_id: categoryId }),
    page: page,
    has_more: offset + limit < total
  };
}
```

---

## 7. Clean Module Integration

### 7.1 Handoff Protocol

```javascript
// Analyzer prepares handoff
async function prepareHandoff(selectedItems) {
  const handoffId = generateId();

  // Store selection with metadata
  await store.set(`handoff:${handoffId}`, {
    id: handoffId,
    source: 'analyzer',
    timestamp: Date.now(),
    items: selectedItems.map(item => ({
      path: item.path,
      size_bytes: item.size_bytes,
      category: item.category_id,
      risk_level: item.risk_level
    }))
  });

  return { handoff_id: handoffId, item_count: selectedItems.length };
}

// Clean module receives handoff
async function receiveHandoff(handoffId) {
  const handoff = await store.get(`handoff:${handoffId}`);

  if (!handoff) {
    throw new Error('Handoff expired or not found');
  }

  // Pre-populate Clean module with Analyzer selections
  return {
    mode: 'analyzer_import',
    scope: groupByCategory(handoff.items),
    preview: handoff.items
  };
}
```

### 7.2 Data Mapping

```javascript
// Analyzer category → Clean scope mapping
const CATEGORY_TO_SCOPE = {
  'temp_files': 'temp',
  'browser_cache': 'browser',
  'log_files': 'logs',
  'old_downloads': 'downloads',
  'installer_cache': 'system',
  'recycle_bin': 'recycle'
};

// Risk level preservation
// Analyzer 'high' risk items get extra confirmation in Clean
```

---

## 8. Keyboard Shortcuts

| Key | Action | State Requirement |
|-----|--------|-------------------|
| `1` | Start Quick Scan | Idle |
| `2` | Start Full Scan | Idle |
| `3` | Start Custom Scan | Idle |
| `Escape` | Cancel Scan / Close dialogs | Scanning |
| `Enter` | Confirm action | Any |
| `A` | Select All in category | Reviewing |
| `N` | Select None in category | Reviewing |
| `C` | Send to Clean | Reviewing + has selection |
| `E` | Export Report | Reviewing |
| `R` | Rescan | Reviewing |
| `Space` | Toggle selected item | Reviewing + item focused |

---

## 9. Accessibility

### 9.1 ARIA Attributes

```html
<!-- Progress during scan -->
<div role="progressbar"
     aria-valuenow="40"
     aria-valuemin="0"
     aria-valuemax="100"
     aria-label="Scan progress: 40% complete">
</div>

<!-- Category list -->
<ul role="tree" aria-label="Analysis categories">
  <li role="treeitem" aria-expanded="true" aria-selected="false">
    Temporary Files (1.2 GB)
  </li>
</ul>

<!-- Insights -->
<section aria-live="polite" aria-label="Analysis insights">
  <!-- Dynamic insights announced to screen readers -->
</section>
```

### 9.2 Focus Management

```javascript
// Focus states during scan lifecycle
const FOCUS_STATES = {
  idle: 'scan-mode-quick',        // Default to Quick Scan
  configuring: 'target-first',     // First target checkbox
  scanning: 'cancel-button',       // Cancel is actionable
  complete: 'category-first',      // First category row
  error: 'error-message'           // Error takes focus
};
```

---

## 10. Testing Checklist

### 10.1 Unit Tests

- [ ] Category classification accuracy
- [ ] Size threshold detection
- [ ] Age threshold detection
- [ ] Duplicate detection (hash comparison)
- [ ] Progress calculation
- [ ] Insight generation logic

### 10.2 Integration Tests

- [ ] Quick scan covers expected directories
- [ ] Full scan handles large directory trees
- [ ] Custom scan respects target selection
- [ ] Cancel properly stops scan
- [ ] Handoff to Clean preserves all data
- [ ] Export generates valid JSON/CSV

### 10.3 Edge Cases

- [ ] Empty directories
- [ ] Deeply nested paths (>260 chars on Windows)
- [ ] Symbolic links / junction points
- [ ] Files with special characters in names
- [ ] Very large files (>4GB)
- [ ] Thousands of small files
- [ ] Network drives
- [ ] Removable media

### 10.4 Performance Tests

- [ ] Scan 100,000 files under 60 seconds
- [ ] UI remains responsive during scan
- [ ] Memory stays under 500MB
- [ ] Progress updates are smooth (no jank)

---

## 11. Implementation Priority

### Phase 1: Core Scanning
1. Directory enumeration
2. Basic metadata collection
3. Category classification
4. Progress reporting
5. UI integration

### Phase 2: Analysis
1. Size-based filtering
2. Age-based filtering
3. Duplicate detection
4. Insight generation
5. Dashboard visualization

### Phase 3: Integration
1. Clean module handoff
2. Export functionality
3. Keyboard shortcuts
4. Accessibility

### Phase 4: Polish
1. Performance optimization
2. Error handling refinement
3. Edge case handling
4. Testing

---

## Document Status

| Section | Status |
|---------|--------|
| Execution Pipeline | ✅ Complete |
| UI ↔ Backend Mapping | ✅ Complete |
| Data Structures | ✅ Complete |
| State Machine | ✅ Complete |
| Error Handling | ✅ Complete |
| Performance | ✅ Complete |
| Clean Integration | ✅ Complete |
| Keyboard Shortcuts | ✅ Complete |
| Accessibility | ✅ Complete |
| Testing Checklist | ✅ Complete |

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Status**: APPROVED FOR IMPLEMENTATION
