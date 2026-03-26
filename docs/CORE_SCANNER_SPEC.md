# DeadBYTE Core Scanner — Specification & Architecture

## Overview

The Core Scanner is the **foundational file system traversal engine** for DeadBYTE. It provides a unified, high-performance, module-agnostic API for discovering, filtering, and collecting file metadata across the system.

**Design Principle**: One scanner, many consumers. Modules add domain logic; they never re-implement traversal.

---

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         CORE SCANNER CRATE                                  │
│                        deadbyte_scanner                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   ┌─────────────┐    │
│  │   Config    │   │  Traversal  │   │   Filter    │   │   Output    │    │
│  │   Builder   │──▶│   Engine    │──▶│   Chain     │──▶│   Stream    │    │
│  └─────────────┘   └─────────────┘   └─────────────┘   └─────────────┘    │
│                           │                                   │             │
│                           ▼                                   ▼             │
│                    ┌─────────────┐                    ┌─────────────┐      │
│                    │  Progress   │                    │   Result    │      │
│                    │  Reporter   │                    │  Collector  │      │
│                    └─────────────┘                    └─────────────┘      │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                    │                                           │
        ┌───────────┴───────────┐               ┌───────────────┴───────────┐
        ▼                       ▼               ▼               ▼           ▼
   ┌─────────┐            ┌─────────┐     ┌─────────┐    ┌──────────┐ ┌──────────┐
   │ Progress│            │  Error  │     │  Clean  │    │ Analyzer │ │ Security │
   │ Events  │            │ Events  │     │ Module  │    │  Module  │ │  Module  │
   └─────────┘            └─────────┘     └─────────┘    └──────────┘ └──────────┘
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| **Config Builder** | Constructs scan configuration with targets, filters, options |
| **Traversal Engine** | Walks directory trees, respects depth limits, handles symlinks |
| **Filter Chain** | Applies predicates to include/exclude items |
| **Output Stream** | Yields matching items to consumers |
| **Progress Reporter** | Emits progress events at throttled intervals |
| **Result Collector** | Aggregates statistics and final results |

---

## 2. Public API Design

### 2.1 Core Types

```rust
// ═══════════════════════════════════════════════════════════════════════════
// CORE SCANNER TYPES
// ═══════════════════════════════════════════════════════════════════════════

/// Unique identifier for a scan operation
pub type ScanId = String;

/// A discovered file system entry with metadata
#[derive(Debug, Clone)]
pub struct ScannedItem {
    /// Absolute path to the item
    pub path: PathBuf,

    /// File name (last component of path)
    pub name: String,

    /// Whether this is a file or directory
    pub item_type: ItemType,

    /// Size in bytes (0 for directories unless calculated)
    pub size_bytes: u64,

    /// Creation timestamp
    pub created_at: Option<SystemTime>,

    /// Last modification timestamp
    pub modified_at: Option<SystemTime>,

    /// Last access timestamp
    pub accessed_at: Option<SystemTime>,

    /// File system attributes
    pub attributes: ItemAttributes,

    /// Depth relative to scan root
    pub depth: u32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ItemType {
    File,
    Directory,
    Symlink,
    Other,
}

#[derive(Debug, Clone, Default)]
pub struct ItemAttributes {
    pub readonly: bool,
    pub hidden: bool,
    pub system: bool,
    pub archive: bool,
    pub compressed: bool,
    pub encrypted: bool,
}

/// Result of a completed scan
#[derive(Debug, Clone)]
pub struct ScanResult {
    pub scan_id: ScanId,
    pub status: ScanStatus,
    pub started_at: SystemTime,
    pub completed_at: SystemTime,
    pub duration_ms: u64,

    /// Items that matched all filters
    pub items: Vec<ScannedItem>,

    /// Aggregate statistics
    pub stats: ScanStats,

    /// Errors encountered (scan continued despite these)
    pub errors: Vec<ScanError>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanStatus {
    Completed,
    Cancelled,
    TimedOut,
    Error,
}

#[derive(Debug, Clone, Default)]
pub struct ScanStats {
    pub directories_visited: u64,
    pub files_scanned: u64,
    pub files_matched: u64,
    pub bytes_scanned: u64,
    pub bytes_matched: u64,
    pub items_skipped: u64,
    pub errors_encountered: u64,
}
```

### 2.2 Configuration API

```rust
// ═══════════════════════════════════════════════════════════════════════════
// SCAN CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/// Builder for scan configuration
pub struct ScanConfigBuilder {
    targets: Vec<PathBuf>,
    filters: Vec<Box<dyn Filter>>,
    options: ScanOptions,
}

impl ScanConfigBuilder {
    /// Create a new configuration builder
    pub fn new() -> Self;

    // ─────────────────────────────────────────────────────────────────────
    // TARGET SPECIFICATION
    // ─────────────────────────────────────────────────────────────────────

    /// Add a single target path
    pub fn target(self, path: impl AsRef<Path>) -> Self;

    /// Add multiple target paths
    pub fn targets(self, paths: impl IntoIterator<Item = impl AsRef<Path>>) -> Self;

    /// Add a target using environment variable expansion
    /// e.g., "%TEMP%" expands to actual temp directory
    pub fn target_expanded(self, path: &str) -> Self;

    // ─────────────────────────────────────────────────────────────────────
    // FILTER CHAIN
    // ─────────────────────────────────────────────────────────────────────

    /// Include only files matching glob pattern
    /// e.g., "*.tmp", "*.log", "cache_*"
    pub fn include_pattern(self, pattern: &str) -> Self;

    /// Exclude files matching glob pattern
    pub fn exclude_pattern(self, pattern: &str) -> Self;

    /// Include only files with specific extensions
    pub fn include_extensions(self, extensions: &[&str]) -> Self;

    /// Exclude specific extensions
    pub fn exclude_extensions(self, extensions: &[&str]) -> Self;

    /// Filter by minimum file size
    pub fn min_size(self, bytes: u64) -> Self;

    /// Filter by maximum file size
    pub fn max_size(self, bytes: u64) -> Self;

    /// Include files older than duration
    pub fn older_than(self, duration: Duration) -> Self;

    /// Include files newer than duration
    pub fn newer_than(self, duration: Duration) -> Self;

    /// Include files not accessed since duration
    pub fn not_accessed_since(self, duration: Duration) -> Self;

    /// Add custom filter predicate
    pub fn filter(self, filter: impl Filter + 'static) -> Self;

    // ─────────────────────────────────────────────────────────────────────
    // TRAVERSAL OPTIONS
    // ─────────────────────────────────────────────────────────────────────

    /// Maximum directory depth (0 = target only, None = unlimited)
    pub fn max_depth(self, depth: Option<u32>) -> Self;

    /// Follow symbolic links (default: false)
    pub fn follow_symlinks(self, follow: bool) -> Self;

    /// Include hidden files/directories (default: false)
    pub fn include_hidden(self, include: bool) -> Self;

    /// Include system files/directories (default: false)
    pub fn include_system(self, include: bool) -> Self;

    /// Skip directories matching patterns
    pub fn skip_directories(self, patterns: &[&str]) -> Self;

    // ─────────────────────────────────────────────────────────────────────
    // PERFORMANCE OPTIONS
    // ─────────────────────────────────────────────────────────────────────

    /// Number of parallel worker threads (default: CPU cores)
    pub fn parallelism(self, threads: usize) -> Self;

    /// Batch size for progress updates (default: 1000)
    pub fn batch_size(self, size: usize) -> Self;

    /// Maximum items to return (default: unlimited)
    pub fn limit(self, max_items: usize) -> Self;

    /// Timeout for entire scan operation
    pub fn timeout(self, duration: Duration) -> Self;

    /// Timeout per directory (default: 30s)
    pub fn directory_timeout(self, duration: Duration) -> Self;

    // ─────────────────────────────────────────────────────────────────────
    // BUILD
    // ─────────────────────────────────────────────────────────────────────

    /// Build the final configuration
    pub fn build(self) -> Result<ScanConfig, ConfigError>;
}

/// Immutable scan configuration
#[derive(Debug, Clone)]
pub struct ScanConfig {
    pub targets: Vec<PathBuf>,
    pub filters: FilterChain,
    pub options: ScanOptions,
}

#[derive(Debug, Clone)]
pub struct ScanOptions {
    pub max_depth: Option<u32>,
    pub follow_symlinks: bool,
    pub include_hidden: bool,
    pub include_system: bool,
    pub skip_directories: Vec<String>,
    pub parallelism: usize,
    pub batch_size: usize,
    pub limit: Option<usize>,
    pub timeout: Option<Duration>,
    pub directory_timeout: Duration,
}

impl Default for ScanOptions {
    fn default() -> Self {
        Self {
            max_depth: None,
            follow_symlinks: false,
            include_hidden: false,
            include_system: false,
            skip_directories: vec![],
            parallelism: num_cpus::get(),
            batch_size: 1000,
            limit: None,
            timeout: None,
            directory_timeout: Duration::from_secs(30),
        }
    }
}
```

### 2.3 Filter Trait

```rust
// ═══════════════════════════════════════════════════════════════════════════
// FILTER SYSTEM
// ═══════════════════════════════════════════════════════════════════════════

/// Trait for implementing custom filters
pub trait Filter: Send + Sync {
    /// Returns true if the item should be included
    fn matches(&self, item: &ScannedItem) -> bool;

    /// Human-readable description of this filter
    fn description(&self) -> &str;
}

/// Chain of filters (all must pass for inclusion)
#[derive(Debug, Clone)]
pub struct FilterChain {
    filters: Vec<Arc<dyn Filter>>,
}

impl FilterChain {
    pub fn new() -> Self;
    pub fn add(&mut self, filter: impl Filter + 'static);
    pub fn matches(&self, item: &ScannedItem) -> bool;
}

// ─────────────────────────────────────────────────────────────────────────
// BUILT-IN FILTERS
// ─────────────────────────────────────────────────────────────────────────

/// Filter by glob pattern
pub struct GlobFilter {
    pattern: Pattern,
    include: bool,  // true = include matches, false = exclude matches
}

/// Filter by file extension
pub struct ExtensionFilter {
    extensions: HashSet<String>,
    include: bool,
}

/// Filter by file size range
pub struct SizeFilter {
    min_bytes: Option<u64>,
    max_bytes: Option<u64>,
}

/// Filter by age (based on modified time)
pub struct AgeFilter {
    older_than: Option<Duration>,
    newer_than: Option<Duration>,
}

/// Filter by last access time
pub struct AccessFilter {
    not_accessed_since: Duration,
}

/// Filter by file attributes
pub struct AttributeFilter {
    require_hidden: Option<bool>,
    require_system: Option<bool>,
    require_readonly: Option<bool>,
}

/// Composite filter (AND/OR logic)
pub struct CompositeFilter {
    filters: Vec<Box<dyn Filter>>,
    logic: CompositeLogic,
}

pub enum CompositeLogic {
    And,  // All filters must match
    Or,   // Any filter must match
}
```

### 2.4 Scanner Interface

```rust
// ═══════════════════════════════════════════════════════════════════════════
// SCANNER INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/// The main scanner interface
pub struct Scanner {
    config: ScanConfig,
    state: Arc<Mutex<ScanState>>,
    cancel_token: CancellationToken,
}

impl Scanner {
    /// Create a new scanner with the given configuration
    pub fn new(config: ScanConfig) -> Self;

    /// Start the scan and return a handle
    pub fn start(&self) -> ScanHandle;

    /// Get the scan ID
    pub fn scan_id(&self) -> &ScanId;

    /// Check if the scan is still running
    pub fn is_running(&self) -> bool;

    /// Request cancellation of the scan
    pub fn cancel(&self);
}

/// Handle for interacting with a running scan
pub struct ScanHandle {
    scan_id: ScanId,
    receiver: Receiver<ScanEvent>,
    result_future: JoinHandle<ScanResult>,
}

impl ScanHandle {
    /// Get the scan ID
    pub fn scan_id(&self) -> &ScanId;

    /// Receive the next event (non-blocking)
    pub fn try_recv(&self) -> Option<ScanEvent>;

    /// Receive the next event (blocking)
    pub fn recv(&self) -> Option<ScanEvent>;

    /// Wait for scan completion and get result
    pub async fn await_result(self) -> ScanResult;

    /// Subscribe to events with a callback
    pub fn on_event<F>(&self, callback: F)
    where
        F: Fn(ScanEvent) + Send + 'static;
}
```

---

## 3. Event & Callback Contracts

### 3.1 Event Types

```rust
// ═══════════════════════════════════════════════════════════════════════════
// SCAN EVENTS
// ═══════════════════════════════════════════════════════════════════════════

/// Events emitted during scan operation
#[derive(Debug, Clone)]
pub enum ScanEvent {
    /// Scan has started
    Started {
        scan_id: ScanId,
        config_summary: String,
        estimated_scope: Option<u64>,  // Estimated total items if known
    },

    /// Progress update (throttled)
    Progress(ProgressEvent),

    /// A matching item was found
    ItemFound(ScannedItem),

    /// A batch of items was found
    BatchFound(Vec<ScannedItem>),

    /// Entered a new directory
    DirectoryEntered {
        path: PathBuf,
        depth: u32,
    },

    /// Finished processing a directory
    DirectoryCompleted {
        path: PathBuf,
        items_found: u64,
        bytes_found: u64,
    },

    /// Non-fatal error encountered
    Warning(ScanWarning),

    /// Scan was cancelled by request
    Cancelled {
        scan_id: ScanId,
        partial_stats: ScanStats,
    },

    /// Scan completed successfully
    Completed {
        scan_id: ScanId,
        stats: ScanStats,
        duration_ms: u64,
    },

    /// Scan failed with error
    Failed {
        scan_id: ScanId,
        error: ScanError,
        partial_stats: Option<ScanStats>,
    },
}

/// Progress event with scan metrics
#[derive(Debug, Clone)]
pub struct ProgressEvent {
    pub scan_id: ScanId,
    pub phase: ScanPhase,

    /// Current path being processed
    pub current_path: Option<PathBuf>,

    /// Items processed so far
    pub items_scanned: u64,

    /// Items matching filters
    pub items_matched: u64,

    /// Bytes processed
    pub bytes_scanned: u64,

    /// Bytes in matched items
    pub bytes_matched: u64,

    /// Estimated completion percentage (0-100)
    pub percent_complete: Option<f32>,

    /// Estimated time remaining in seconds
    pub eta_seconds: Option<u64>,

    /// Current scan rate (items per second)
    pub items_per_second: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanPhase {
    Initializing,
    Enumerating,
    Filtering,
    Finalizing,
}

/// Non-fatal warning during scan
#[derive(Debug, Clone)]
pub struct ScanWarning {
    pub path: PathBuf,
    pub warning_type: WarningType,
    pub message: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum WarningType {
    AccessDenied,
    PathTooLong,
    SymlinkLoop,
    DirectoryTimeout,
    MetadataUnavailable,
    EncodingError,
}
```

### 3.2 Callback Interface

```rust
// ═══════════════════════════════════════════════════════════════════════════
// CALLBACK INTERFACE
// ═══════════════════════════════════════════════════════════════════════════

/// Callback-based scanner for UI integration
pub struct CallbackScanner {
    scanner: Scanner,
    callbacks: ScanCallbacks,
}

/// Callbacks for scan events
pub struct ScanCallbacks {
    /// Called when scan starts
    pub on_start: Option<Box<dyn Fn(ScanId, String) + Send>>,

    /// Called on progress updates (throttled)
    pub on_progress: Option<Box<dyn Fn(ProgressEvent) + Send>>,

    /// Called when item is found (batched)
    pub on_items: Option<Box<dyn Fn(Vec<ScannedItem>) + Send>>,

    /// Called on warnings
    pub on_warning: Option<Box<dyn Fn(ScanWarning) + Send>>,

    /// Called on completion
    pub on_complete: Option<Box<dyn Fn(ScanResult) + Send>>,

    /// Called on cancellation
    pub on_cancel: Option<Box<dyn Fn(ScanStats) + Send>>,

    /// Called on error
    pub on_error: Option<Box<dyn Fn(ScanError) + Send>>,
}

impl ScanCallbacks {
    pub fn new() -> Self;

    pub fn on_start<F>(mut self, f: F) -> Self
    where F: Fn(ScanId, String) + Send + 'static;

    pub fn on_progress<F>(mut self, f: F) -> Self
    where F: Fn(ProgressEvent) + Send + 'static;

    pub fn on_items<F>(mut self, f: F) -> Self
    where F: Fn(Vec<ScannedItem>) + Send + 'static;

    pub fn on_warning<F>(mut self, f: F) -> Self
    where F: Fn(ScanWarning) + Send + 'static;

    pub fn on_complete<F>(mut self, f: F) -> Self
    where F: Fn(ScanResult) + Send + 'static;

    pub fn on_cancel<F>(mut self, f: F) -> Self
    where F: Fn(ScanStats) + Send + 'static;

    pub fn on_error<F>(mut self, f: F) -> Self
    where F: Fn(ScanError) + Send + 'static;
}
```

### 3.3 Event Throttling

```rust
// ═══════════════════════════════════════════════════════════════════════════
// EVENT THROTTLING
// ═══════════════════════════════════════════════════════════════════════════

/// Configuration for event throttling
#[derive(Debug, Clone)]
pub struct ThrottleConfig {
    /// Minimum interval between progress events
    pub progress_interval: Duration,

    /// Batch size for item events
    pub item_batch_size: usize,

    /// Maximum pending events before dropping old ones
    pub max_queue_size: usize,
}

impl Default for ThrottleConfig {
    fn default() -> Self {
        Self {
            progress_interval: Duration::from_millis(100),
            item_batch_size: 100,
            max_queue_size: 1000,
        }
    }
}
```

---

## 4. Error Taxonomy

### 4.1 Error Types

```rust
// ═══════════════════════════════════════════════════════════════════════════
// ERROR TYPES
// ═══════════════════════════════════════════════════════════════════════════

/// Errors that can occur during scanning
#[derive(Debug, Clone)]
pub struct ScanError {
    pub error_type: ScanErrorType,
    pub path: Option<PathBuf>,
    pub message: String,
    pub recoverable: bool,
    pub source: Option<String>,  // Underlying OS error
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ScanErrorType {
    // ─────────────────────────────────────────────────────────────────────
    // Configuration Errors (prevent scan from starting)
    // ─────────────────────────────────────────────────────────────────────

    /// Invalid target path specified
    InvalidTarget,

    /// Invalid filter pattern
    InvalidPattern,

    /// Configuration validation failed
    InvalidConfig,

    // ─────────────────────────────────────────────────────────────────────
    // Access Errors (recoverable, scan continues)
    // ─────────────────────────────────────────────────────────────────────

    /// Permission denied accessing path
    AccessDenied,

    /// Path does not exist
    PathNotFound,

    /// Path is not accessible (network, removable media)
    PathUnavailable,

    // ─────────────────────────────────────────────────────────────────────
    // Traversal Errors (recoverable, scan continues)
    // ─────────────────────────────────────────────────────────────────────

    /// Path exceeds maximum length
    PathTooLong,

    /// Symbolic link creates a loop
    SymlinkLoop,

    /// Directory read timed out
    DirectoryTimeout,

    /// Too many items in directory
    DirectoryTooLarge,

    // ─────────────────────────────────────────────────────────────────────
    // Metadata Errors (recoverable, item skipped)
    // ─────────────────────────────────────────────────────────────────────

    /// Could not read file metadata
    MetadataError,

    /// Invalid filename encoding
    EncodingError,

    // ─────────────────────────────────────────────────────────────────────
    // System Errors (may be fatal)
    // ─────────────────────────────────────────────────────────────────────

    /// Out of memory
    OutOfMemory,

    /// Disk I/O error
    IoError,

    /// Scan operation timed out
    Timeout,

    /// Thread/task panicked
    InternalError,

    // ─────────────────────────────────────────────────────────────────────
    // Cancellation (expected, not an error)
    // ─────────────────────────────────────────────────────────────────────

    /// Scan was cancelled by user
    Cancelled,
}

impl ScanError {
    /// Create a new recoverable error
    pub fn recoverable(error_type: ScanErrorType, path: PathBuf, message: &str) -> Self;

    /// Create a new fatal error
    pub fn fatal(error_type: ScanErrorType, message: &str) -> Self;

    /// Check if scan should continue after this error
    pub fn should_continue(&self) -> bool {
        self.recoverable
    }

    /// Get user-friendly error message
    pub fn user_message(&self) -> String;
}

/// Configuration validation errors
#[derive(Debug, Clone)]
pub enum ConfigError {
    NoTargets,
    InvalidTarget(String),
    InvalidPattern(String),
    InvalidOption(String),
    ConflictingOptions(String, String),
}
```

### 4.2 Error Handling Strategy

```rust
// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING STRATEGY
// ═══════════════════════════════════════════════════════════════════════════

/// How to handle errors during scanning
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ErrorStrategy {
    /// Stop scan on first error
    StopOnError,

    /// Skip problematic items, continue scanning (default)
    SkipAndContinue,

    /// Retry failed operations once before skipping
    RetryOnce,

    /// Collect all errors, report at end
    CollectErrors,
}

impl Default for ErrorStrategy {
    fn default() -> Self {
        Self::SkipAndContinue
    }
}

// Error accumulator for CollectErrors strategy
pub struct ErrorAccumulator {
    errors: Vec<ScanError>,
    warnings: Vec<ScanWarning>,
    max_errors: usize,
}

impl ErrorAccumulator {
    pub fn new(max_errors: usize) -> Self;
    pub fn add_error(&mut self, error: ScanError) -> bool;  // Returns false if max reached
    pub fn add_warning(&mut self, warning: ScanWarning);
    pub fn error_count(&self) -> usize;
    pub fn has_fatal(&self) -> bool;
    pub fn into_results(self) -> (Vec<ScanError>, Vec<ScanWarning>);
}
```

---

## 5. Performance Constraints

### 5.1 Performance Configuration

```rust
// ═══════════════════════════════════════════════════════════════════════════
// PERFORMANCE CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════

/// Performance tuning options
#[derive(Debug, Clone)]
pub struct PerformanceConfig {
    // ─────────────────────────────────────────────────────────────────────
    // Threading
    // ─────────────────────────────────────────────────────────────────────

    /// Number of worker threads for directory traversal
    /// Default: number of CPU cores
    pub worker_threads: usize,

    /// Use thread pool or spawn new threads
    pub use_thread_pool: bool,

    // ─────────────────────────────────────────────────────────────────────
    // Batching
    // ─────────────────────────────────────────────────────────────────────

    /// Items to process before yielding to other tasks
    pub batch_size: usize,

    /// Yield duration between batches
    pub batch_yield: Duration,

    /// Items to accumulate before emitting ItemFound event
    pub event_batch_size: usize,

    // ─────────────────────────────────────────────────────────────────────
    // Memory
    // ─────────────────────────────────────────────────────────────────────

    /// Maximum items to hold in memory
    pub max_items_in_memory: usize,

    /// Enable memory-mapped I/O for large directories
    pub use_mmap: bool,

    /// Preallocate result vector capacity
    pub preallocate_results: Option<usize>,

    // ─────────────────────────────────────────────────────────────────────
    // I/O
    // ─────────────────────────────────────────────────────────────────────

    /// Buffer size for directory reads
    pub read_buffer_size: usize,

    /// Enable filesystem caching hints
    pub use_cache_hints: bool,

    // ─────────────────────────────────────────────────────────────────────
    // Timeouts
    // ─────────────────────────────────────────────────────────────────────

    /// Timeout for reading a single directory
    pub directory_timeout: Duration,

    /// Timeout for reading file metadata
    pub metadata_timeout: Duration,

    /// Total scan timeout
    pub total_timeout: Option<Duration>,
}

impl Default for PerformanceConfig {
    fn default() -> Self {
        Self {
            worker_threads: num_cpus::get().min(8),
            use_thread_pool: true,
            batch_size: 1000,
            batch_yield: Duration::from_millis(1),
            event_batch_size: 100,
            max_items_in_memory: 100_000,
            use_mmap: false,
            preallocate_results: None,
            read_buffer_size: 64 * 1024,  // 64KB
            use_cache_hints: true,
            directory_timeout: Duration::from_secs(30),
            metadata_timeout: Duration::from_secs(5),
            total_timeout: None,
        }
    }
}
```

### 5.2 Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| **Throughput** | 50,000 items/sec | On SSD, simple filters |
| **Latency to first result** | < 100ms | From scan start |
| **Memory baseline** | < 50MB | Empty scan |
| **Memory per 100K items** | < 200MB | With full metadata |
| **UI update latency** | < 16ms | Progress events don't block |
| **Cancellation response** | < 100ms | From cancel request |

### 5.3 Optimization Strategies

```rust
// ═══════════════════════════════════════════════════════════════════════════
// OPTIMIZATION STRATEGIES
// ═══════════════════════════════════════════════════════════════════════════

/// Optimization hints based on scan characteristics
pub enum OptimizationHint {
    /// Small number of files expected
    SmallScan,

    /// Large number of files expected
    LargeScan,

    /// Prioritize low memory usage
    LowMemory,

    /// Prioritize speed over memory
    HighSpeed,

    /// Network or slow storage
    SlowStorage,

    /// Real-time UI updates needed
    InteractiveMode,

    /// Background scan, minimal resource usage
    BackgroundMode,
}

impl ScanConfigBuilder {
    /// Apply optimization hint
    pub fn optimize_for(self, hint: OptimizationHint) -> Self {
        match hint {
            OptimizationHint::SmallScan => {
                self.batch_size(100)
                    .parallelism(2)
            }
            OptimizationHint::LargeScan => {
                self.batch_size(5000)
                    .parallelism(num_cpus::get())
            }
            OptimizationHint::LowMemory => {
                self.batch_size(500)
                    .limit(50000)
            }
            OptimizationHint::HighSpeed => {
                self.batch_size(10000)
                    .parallelism(num_cpus::get() * 2)
            }
            OptimizationHint::SlowStorage => {
                self.directory_timeout(Duration::from_secs(60))
                    .parallelism(2)
            }
            OptimizationHint::InteractiveMode => {
                self.batch_size(100)
                    // Faster progress updates
            }
            OptimizationHint::BackgroundMode => {
                self.batch_size(5000)
                    .parallelism(2)
                    // Lower priority
            }
        }
    }
}
```

---

## 6. Module Usage Examples

### 6.1 Clean Module Usage

```rust
// ═══════════════════════════════════════════════════════════════════════════
// CLEAN MODULE - Scanner Integration
// ═══════════════════════════════════════════════════════════════════════════

use deadbyte_scanner::*;

/// Clean module's scanner wrapper
pub struct CleanScanner {
    mode: CleanMode,
    scope: Vec<CleanScope>,
}

impl CleanScanner {
    /// Build scanner config for Quick Clean
    pub fn quick_clean() -> ScanConfig {
        ScanConfigBuilder::new()
            .target_expanded("%TEMP%")
            .target_expanded("%LOCALAPPDATA%\\Temp")
            .include_pattern("*.tmp")
            .include_pattern("*.temp")
            .include_pattern("~*")
            .include_extensions(&["log", "bak", "old"])
            .exclude_pattern("*.dll")
            .exclude_pattern("*.exe")
            .max_depth(Some(5))
            .include_hidden(false)
            .include_system(false)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid quick clean config")
    }

    /// Build scanner config for Smart Clean
    pub fn smart_clean() -> ScanConfig {
        ScanConfigBuilder::new()
            // Temp files
            .target_expanded("%TEMP%")
            .target_expanded("%LOCALAPPDATA%\\Temp")
            // Browser caches
            .target_expanded("%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache")
            .target_expanded("%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles")
            .target_expanded("%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\Default\\Cache")
            // Patterns
            .include_pattern("*.tmp")
            .include_pattern("*.log")
            .include_pattern("cache*")
            .include_pattern("Cache*")
            // Age filter - only old files
            .older_than(Duration::from_secs(7 * 24 * 60 * 60))  // 7 days
            .max_depth(Some(10))
            .include_hidden(true)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid smart clean config")
    }

    /// Build scanner config based on user-selected scopes
    pub fn advanced_clean(scopes: &[CleanScope]) -> ScanConfig {
        let mut builder = ScanConfigBuilder::new();

        for scope in scopes {
            builder = match scope {
                CleanScope::Temp => builder
                    .target_expanded("%TEMP%")
                    .target_expanded("%LOCALAPPDATA%\\Temp")
                    .include_pattern("*.tmp"),

                CleanScope::Browser => builder
                    .target_expanded("%LOCALAPPDATA%\\Google\\Chrome\\User Data\\*\\Cache")
                    .target_expanded("%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles\\*\\cache2")
                    .target_expanded("%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\*\\Cache"),

                CleanScope::Logs => builder
                    .target_expanded("%LOCALAPPDATA%")
                    .include_pattern("*.log")
                    .include_pattern("*.log.*"),

                CleanScope::Downloads => builder
                    .target_expanded("%USERPROFILE%\\Downloads")
                    .older_than(Duration::from_secs(30 * 24 * 60 * 60)),  // 30 days

                CleanScope::Recycle => builder
                    .target("C:\\$RECYCLE.BIN"),

                CleanScope::System => builder
                    .target("C:\\Windows\\Temp")
                    .target_expanded("%LOCALAPPDATA%\\Package Cache")
                    .include_system(true),
            };
        }

        builder
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid advanced clean config")
    }

    /// Execute scan with Clean-specific callbacks
    pub async fn scan_for_clean(
        config: ScanConfig,
        on_progress: impl Fn(ProgressEvent) + Send + 'static,
        on_complete: impl Fn(Vec<CleanableItem>) + Send + 'static,
    ) {
        let scanner = Scanner::new(config);
        let handle = scanner.start();

        // Convert scanner items to Clean module's domain type
        let mut items = Vec::new();

        while let Some(event) = handle.recv() {
            match event {
                ScanEvent::Progress(p) => on_progress(p),
                ScanEvent::BatchFound(batch) => {
                    for item in batch {
                        items.push(CleanableItem::from_scanned(item));
                    }
                }
                ScanEvent::Completed { .. } => {
                    on_complete(items);
                    break;
                }
                _ => {}
            }
        }
    }
}

/// Clean module's domain type
pub struct CleanableItem {
    pub path: PathBuf,
    pub name: String,
    pub size: u64,
    pub category: CleanCategory,
    pub risk: RiskLevel,
    pub selected: bool,
}

impl CleanableItem {
    fn from_scanned(item: ScannedItem) -> Self {
        Self {
            path: item.path.clone(),
            name: item.name,
            size: item.size_bytes,
            category: categorize_for_clean(&item),
            risk: assess_risk_for_clean(&item),
            selected: false,
        }
    }
}
```

### 6.2 Analyzer Module Usage

```rust
// ═══════════════════════════════════════════════════════════════════════════
// ANALYZER MODULE - Scanner Integration
// ═══════════════════════════════════════════════════════════════════════════

use deadbyte_scanner::*;

/// Analyzer module's scanner wrapper
pub struct AnalyzerScanner;

impl AnalyzerScanner {
    /// Build scanner config for Quick Analysis
    pub fn quick_analysis() -> ScanConfig {
        ScanConfigBuilder::new()
            // Focus on obvious cleanup targets
            .target_expanded("%TEMP%")
            .target_expanded("%LOCALAPPDATA%\\Temp")
            .target("C:\\$RECYCLE.BIN")
            // Browser caches (common, safe to identify)
            .target_expanded("%LOCALAPPDATA%\\Google\\Chrome\\User Data\\Default\\Cache")
            .target_expanded("%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles")
            // No filters - collect everything for analysis
            .max_depth(Some(3))
            .include_hidden(true)
            .timeout(Duration::from_secs(60))
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid quick analysis config")
    }

    /// Build scanner config for Full Analysis
    pub fn full_analysis() -> ScanConfig {
        ScanConfigBuilder::new()
            // All user directories
            .target_expanded("%USERPROFILE%")
            // System temp
            .target("C:\\Windows\\Temp")
            // Skip known system directories
            .skip_directories(&[
                "Windows\\System32",
                "Windows\\WinSxS",
                "Program Files",
                "Program Files (x86)",
            ])
            // Collect everything
            .include_hidden(true)
            .timeout(Duration::from_secs(600))  // 10 minutes max
            .optimize_for(OptimizationHint::LargeScan)
            .build()
            .expect("Valid full analysis config")
    }

    /// Build scanner config for Custom Analysis
    pub fn custom_analysis(targets: Vec<PathBuf>, options: AnalysisOptions) -> ScanConfig {
        let mut builder = ScanConfigBuilder::new();

        for target in targets {
            builder = builder.target(target);
        }

        builder
            .include_hidden(options.include_hidden)
            .include_system(options.include_system)
            .max_depth(options.max_depth)
            .timeout(options.timeout)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid custom analysis config")
    }

    /// Execute analysis with real-time categorization
    pub async fn analyze(
        config: ScanConfig,
        on_progress: impl Fn(AnalysisProgress) + Send + 'static,
        on_complete: impl Fn(AnalysisResult) + Send + 'static,
    ) {
        let scanner = Scanner::new(config);
        let handle = scanner.start();

        // Category accumulators
        let mut categories: HashMap<String, CategoryStats> = HashMap::new();
        let mut total_bytes: u64 = 0;
        let mut total_items: u64 = 0;

        while let Some(event) = handle.recv() {
            match event {
                ScanEvent::Progress(p) => {
                    on_progress(AnalysisProgress {
                        percent: p.percent_complete,
                        current_path: p.current_path,
                        items_analyzed: total_items,
                        bytes_analyzed: total_bytes,
                    });
                }
                ScanEvent::BatchFound(batch) => {
                    for item in batch {
                        let category_id = categorize_item(&item);

                        let stats = categories
                            .entry(category_id)
                            .or_insert_with(CategoryStats::default);

                        stats.item_count += 1;
                        stats.total_bytes += item.size_bytes;
                        stats.items.push(item);

                        total_items += 1;
                        total_bytes += item.size_bytes;
                    }
                }
                ScanEvent::Completed { stats, .. } => {
                    on_complete(AnalysisResult {
                        categories,
                        total_bytes,
                        total_items,
                        scan_stats: stats,
                        insights: generate_insights(&categories),
                    });
                    break;
                }
                _ => {}
            }
        }
    }
}

fn categorize_item(item: &ScannedItem) -> String {
    // Categorization logic based on path and extension
    let ext = item.path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    let path_str = item.path.to_string_lossy().to_lowercase();

    if path_str.contains("temp") {
        "temp_files".to_string()
    } else if path_str.contains("cache") {
        "browser_cache".to_string()
    } else if ext == "log" {
        "log_files".to_string()
    } else if path_str.contains("downloads") {
        "old_downloads".to_string()
    } else if path_str.contains("$recycle") {
        "recycle_bin".to_string()
    } else if item.size_bytes > 100 * 1024 * 1024 {
        "large_files".to_string()
    } else {
        "other".to_string()
    }
}
```

### 6.3 Security Module Usage

```rust
// ═══════════════════════════════════════════════════════════════════════════
// SECURITY MODULE - Scanner Integration
// ═══════════════════════════════════════════════════════════════════════════

use deadbyte_scanner::*;

/// Security module's scanner wrapper
pub struct SecurityScanner;

impl SecurityScanner {
    /// Build scanner config for finding potentially sensitive files
    pub fn sensitive_file_scan() -> ScanConfig {
        ScanConfigBuilder::new()
            .target_expanded("%USERPROFILE%")
            // Look for potentially sensitive file types
            .include_extensions(&[
                // Credentials
                "pem", "key", "pfx", "p12", "jks",
                // Config files that might contain secrets
                "env", "cfg", "conf", "ini",
                // Database files
                "db", "sqlite", "sqlite3",
                // Password managers
                "kdbx", "1pif",
            ])
            // Also match specific filenames
            .include_pattern("*password*")
            .include_pattern("*credential*")
            .include_pattern("*secret*")
            .include_pattern(".env*")
            .include_pattern("id_rsa*")
            .include_pattern("*.pem")
            .max_depth(Some(10))
            .include_hidden(true)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid security scan config")
    }

    /// Build scanner config for finding exposed/unprotected files
    pub fn exposure_scan() -> ScanConfig {
        ScanConfigBuilder::new()
            .target_expanded("%USERPROFILE%\\Documents")
            .target_expanded("%USERPROFILE%\\Desktop")
            .target_expanded("%USERPROFILE%\\Downloads")
            // Custom filter for checking file permissions
            .filter(UnprotectedFileFilter::new())
            .include_hidden(false)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid exposure scan config")
    }

    /// Build scanner config for finding old/stale credentials
    pub fn stale_credential_scan() -> ScanConfig {
        ScanConfigBuilder::new()
            .target_expanded("%USERPROFILE%")
            .include_extensions(&["pem", "key", "pfx"])
            // Only old files
            .older_than(Duration::from_secs(365 * 24 * 60 * 60))  // 1 year
            .include_hidden(true)
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid stale credential scan config")
    }

    /// Execute security scan with threat assessment
    pub async fn scan_for_threats(
        config: ScanConfig,
        on_progress: impl Fn(ProgressEvent) + Send + 'static,
        on_complete: impl Fn(SecurityReport) + Send + 'static,
    ) {
        let scanner = Scanner::new(config);
        let handle = scanner.start();

        let mut threats: Vec<ThreatItem> = Vec::new();

        while let Some(event) = handle.recv() {
            match event {
                ScanEvent::Progress(p) => on_progress(p),
                ScanEvent::BatchFound(batch) => {
                    for item in batch {
                        if let Some(threat) = assess_threat(&item) {
                            threats.push(threat);
                        }
                    }
                }
                ScanEvent::Completed { stats, .. } => {
                    on_complete(SecurityReport {
                        threats,
                        scan_stats: stats,
                        risk_summary: calculate_risk_summary(&threats),
                    });
                    break;
                }
                _ => {}
            }
        }
    }
}

/// Custom filter for security module
struct UnprotectedFileFilter;

impl UnprotectedFileFilter {
    fn new() -> Self { Self }
}

impl Filter for UnprotectedFileFilter {
    fn matches(&self, item: &ScannedItem) -> bool {
        // Check if file is world-readable or in a shared location
        // Platform-specific implementation
        !item.attributes.readonly &&
        item.path.to_string_lossy().contains("Public")
    }

    fn description(&self) -> &str {
        "Files in public/shared locations without protection"
    }
}

fn assess_threat(item: &ScannedItem) -> Option<ThreatItem> {
    let threat_level = match item.path.extension().and_then(|e| e.to_str()) {
        Some("pem") | Some("key") => ThreatLevel::High,
        Some("env") if item.name.starts_with('.') => ThreatLevel::High,
        Some("db") | Some("sqlite") => ThreatLevel::Medium,
        Some("cfg") | Some("conf") => ThreatLevel::Low,
        _ => return None,
    };

    Some(ThreatItem {
        path: item.path.clone(),
        name: item.name.clone(),
        threat_level,
        threat_type: classify_threat_type(item),
        recommendation: generate_recommendation(item, threat_level),
    })
}
```

---

## 7. Tauri IPC Integration

### 7.1 Command Definitions

```rust
// ═══════════════════════════════════════════════════════════════════════════
// TAURI IPC COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

use tauri::{command, State, Window};
use deadbyte_scanner::*;

/// State held by Tauri
pub struct ScannerState {
    active_scans: Mutex<HashMap<ScanId, ScanHandle>>,
}

#[command]
pub async fn scanner_start(
    state: State<'_, ScannerState>,
    window: Window,
    config: ScanConfigDto,
) -> Result<ScanId, String> {
    let scan_config = config.into_scan_config()?;
    let scanner = Scanner::new(scan_config);
    let scan_id = scanner.scan_id().clone();
    let handle = scanner.start();

    // Store handle for cancellation
    state.active_scans.lock().unwrap().insert(scan_id.clone(), handle);

    // Spawn event forwarder
    let window_clone = window.clone();
    let scan_id_clone = scan_id.clone();

    tauri::async_runtime::spawn(async move {
        let handle = state.active_scans.lock().unwrap().get(&scan_id_clone).cloned();

        if let Some(handle) = handle {
            while let Some(event) = handle.recv() {
                let event_dto = ScanEventDto::from(event);
                window_clone.emit("scanner:event", &event_dto).ok();

                if matches!(event, ScanEvent::Completed { .. } | ScanEvent::Cancelled { .. } | ScanEvent::Failed { .. }) {
                    break;
                }
            }
        }

        // Cleanup
        state.active_scans.lock().unwrap().remove(&scan_id_clone);
    });

    Ok(scan_id)
}

#[command]
pub async fn scanner_cancel(
    state: State<'_, ScannerState>,
    scan_id: ScanId,
) -> Result<bool, String> {
    if let Some(handle) = state.active_scans.lock().unwrap().get(&scan_id) {
        handle.cancel();
        Ok(true)
    } else {
        Ok(false)
    }
}

#[command]
pub fn scanner_get_presets() -> Vec<ScanPresetDto> {
    vec![
        ScanPresetDto {
            id: "quick_clean".to_string(),
            name: "Quick Clean".to_string(),
            description: "Temp files and browser cache".to_string(),
            estimated_duration: "30 seconds".to_string(),
        },
        ScanPresetDto {
            id: "full_analysis".to_string(),
            name: "Full Analysis".to_string(),
            description: "Complete disk analysis".to_string(),
            estimated_duration: "5-10 minutes".to_string(),
        },
        // ... more presets
    ]
}
```

### 7.2 Frontend Integration

```javascript
// ═══════════════════════════════════════════════════════════════════════════
// FRONTEND SCANNER API
// ═══════════════════════════════════════════════════════════════════════════

import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

class ScannerAPI {
  constructor() {
    this.activeScans = new Map();
    this.setupEventListener();
  }

  setupEventListener() {
    listen('scanner:event', (event) => {
      const { scan_id, ...data } = event.payload;
      const callbacks = this.activeScans.get(scan_id);

      if (callbacks) {
        this.dispatchEvent(callbacks, data);
      }
    });
  }

  dispatchEvent(callbacks, event) {
    switch (event.type) {
      case 'progress':
        callbacks.onProgress?.(event.data);
        break;
      case 'items_found':
        callbacks.onItems?.(event.data);
        break;
      case 'warning':
        callbacks.onWarning?.(event.data);
        break;
      case 'completed':
        callbacks.onComplete?.(event.data);
        this.activeScans.delete(event.scan_id);
        break;
      case 'cancelled':
        callbacks.onCancel?.(event.data);
        this.activeScans.delete(event.scan_id);
        break;
      case 'failed':
        callbacks.onError?.(event.data);
        this.activeScans.delete(event.scan_id);
        break;
    }
  }

  async startScan(config, callbacks) {
    const scanId = await invoke('scanner_start', { config });
    this.activeScans.set(scanId, callbacks);
    return scanId;
  }

  async cancelScan(scanId) {
    return await invoke('scanner_cancel', { scanId });
  }

  async getPresets() {
    return await invoke('scanner_get_presets');
  }
}

// Module-specific wrappers
class CleanScannerAPI extends ScannerAPI {
  async quickClean(callbacks) {
    return this.startScan({ preset: 'quick_clean' }, callbacks);
  }

  async smartClean(callbacks) {
    return this.startScan({ preset: 'smart_clean' }, callbacks);
  }

  async advancedClean(scopes, callbacks) {
    return this.startScan({
      preset: 'advanced_clean',
      scopes
    }, callbacks);
  }
}

class AnalyzerScannerAPI extends ScannerAPI {
  async quickAnalysis(callbacks) {
    return this.startScan({ preset: 'quick_analysis' }, callbacks);
  }

  async fullAnalysis(callbacks) {
    return this.startScan({ preset: 'full_analysis' }, callbacks);
  }

  async customAnalysis(targets, options, callbacks) {
    return this.startScan({
      preset: 'custom_analysis',
      targets,
      options
    }, callbacks);
  }
}

export { ScannerAPI, CleanScannerAPI, AnalyzerScannerAPI };
```

---

## 8. Testing Strategy

### 8.1 Unit Tests

```rust
// ═══════════════════════════════════════════════════════════════════════════
// UNIT TEST EXAMPLES
// ═══════════════════════════════════════════════════════════════════════════

#[cfg(test)]
mod tests {
    use super::*;
    use tempfile::TempDir;

    #[test]
    fn test_glob_filter() {
        let filter = GlobFilter::include("*.tmp");

        let item = ScannedItem {
            path: PathBuf::from("/test/file.tmp"),
            name: "file.tmp".to_string(),
            ..Default::default()
        };

        assert!(filter.matches(&item));

        let item2 = ScannedItem {
            path: PathBuf::from("/test/file.txt"),
            name: "file.txt".to_string(),
            ..Default::default()
        };

        assert!(!filter.matches(&item2));
    }

    #[test]
    fn test_size_filter() {
        let filter = SizeFilter::new()
            .min_bytes(1024)
            .max_bytes(1024 * 1024);

        // Too small
        assert!(!filter.matches(&item_with_size(512)));

        // In range
        assert!(filter.matches(&item_with_size(50_000)));

        // Too large
        assert!(!filter.matches(&item_with_size(2_000_000)));
    }

    #[test]
    fn test_age_filter() {
        let filter = AgeFilter::older_than(Duration::from_secs(86400));

        let old_item = ScannedItem {
            modified_at: Some(SystemTime::now() - Duration::from_secs(172800)),
            ..Default::default()
        };

        let new_item = ScannedItem {
            modified_at: Some(SystemTime::now() - Duration::from_secs(3600)),
            ..Default::default()
        };

        assert!(filter.matches(&old_item));
        assert!(!filter.matches(&new_item));
    }

    #[test]
    fn test_filter_chain() {
        let chain = FilterChain::new()
            .add(GlobFilter::include("*.log"))
            .add(SizeFilter::min_bytes(1024));

        // Matches pattern but too small
        let small_log = ScannedItem {
            name: "test.log".to_string(),
            size_bytes: 100,
            ..Default::default()
        };
        assert!(!chain.matches(&small_log));

        // Matches both
        let big_log = ScannedItem {
            name: "test.log".to_string(),
            size_bytes: 10_000,
            ..Default::default()
        };
        assert!(chain.matches(&big_log));
    }

    #[tokio::test]
    async fn test_basic_scan() {
        let temp_dir = TempDir::new().unwrap();

        // Create test files
        std::fs::write(temp_dir.path().join("file1.tmp"), "content1").unwrap();
        std::fs::write(temp_dir.path().join("file2.tmp"), "content2").unwrap();
        std::fs::write(temp_dir.path().join("file3.txt"), "content3").unwrap();

        let config = ScanConfigBuilder::new()
            .target(temp_dir.path())
            .include_pattern("*.tmp")
            .build()
            .unwrap();

        let scanner = Scanner::new(config);
        let result = scanner.start().await_result().await;

        assert_eq!(result.status, ScanStatus::Completed);
        assert_eq!(result.items.len(), 2);
        assert!(result.items.iter().all(|i| i.name.ends_with(".tmp")));
    }

    #[tokio::test]
    async fn test_scan_cancellation() {
        let config = ScanConfigBuilder::new()
            .target("C:\\")  // Large directory
            .build()
            .unwrap();

        let scanner = Scanner::new(config);
        let handle = scanner.start();

        // Cancel after brief delay
        tokio::time::sleep(Duration::from_millis(100)).await;
        scanner.cancel();

        let result = handle.await_result().await;
        assert_eq!(result.status, ScanStatus::Cancelled);
    }
}
```

### 8.2 Integration Tests

```rust
#[cfg(test)]
mod integration_tests {
    use super::*;

    #[tokio::test]
    async fn test_temp_directory_scan() {
        let config = ScanConfigBuilder::new()
            .target_expanded("%TEMP%")
            .max_depth(Some(2))
            .timeout(Duration::from_secs(10))
            .build()
            .unwrap();

        let scanner = Scanner::new(config);
        let result = scanner.start().await_result().await;

        assert_eq!(result.status, ScanStatus::Completed);
        assert!(result.stats.files_scanned > 0);
    }

    #[tokio::test]
    async fn test_progress_events() {
        let config = ScanConfigBuilder::new()
            .target_expanded("%TEMP%")
            .build()
            .unwrap();

        let scanner = Scanner::new(config);
        let handle = scanner.start();

        let mut progress_count = 0;

        while let Some(event) = handle.recv() {
            if matches!(event, ScanEvent::Progress(_)) {
                progress_count += 1;
            }
            if matches!(event, ScanEvent::Completed { .. }) {
                break;
            }
        }

        assert!(progress_count > 0, "Should receive progress events");
    }

    #[tokio::test]
    async fn test_error_recovery() {
        let config = ScanConfigBuilder::new()
            .target("C:\\Windows\\System32")  // Has protected files
            .target_expanded("%TEMP%")
            .include_hidden(true)
            .include_system(true)
            .build()
            .unwrap();

        let scanner = Scanner::new(config);
        let result = scanner.start().await_result().await;

        // Should complete despite access denied errors
        assert_eq!(result.status, ScanStatus::Completed);
        assert!(result.errors.len() > 0, "Should have some access denied errors");
        assert!(result.items.len() > 0, "Should still find some items");
    }
}
```

---

## 9. Documentation Summary

### Quick Reference

| Use Case | API Call |
|----------|----------|
| Simple temp file scan | `ScanConfigBuilder::new().target_expanded("%TEMP%").build()` |
| Large files only | `ScanConfigBuilder::new().min_size(100_000_000).build()` |
| Old files cleanup | `ScanConfigBuilder::new().older_than(days(30)).build()` |
| Specific extensions | `ScanConfigBuilder::new().include_extensions(&["log", "tmp"]).build()` |
| Cancel running scan | `scanner.cancel()` |
| Listen for progress | `handle.on_event(\|e\| match e { Progress(p) => ... })` |

### Performance Quick Reference

| Scenario | Recommended Settings |
|----------|---------------------|
| Interactive UI | `optimize_for(InteractiveMode)` - fast updates, smaller batches |
| Background task | `optimize_for(BackgroundMode)` - fewer updates, larger batches |
| Network drive | `optimize_for(SlowStorage)` - longer timeouts, less parallelism |
| 1M+ files | `optimize_for(LargeScan)` - max parallelism, large batches |

---

## Document Status

| Section | Status |
|---------|--------|
| Architecture Overview | ✅ Complete |
| Public API Design | ✅ Complete |
| Configuration API | ✅ Complete |
| Filter System | ✅ Complete |
| Event Contracts | ✅ Complete |
| Error Taxonomy | ✅ Complete |
| Performance Config | ✅ Complete |
| Clean Module Usage | ✅ Complete |
| Analyzer Module Usage | ✅ Complete |
| Security Module Usage | ✅ Complete |
| Tauri Integration | ✅ Complete |
| Testing Strategy | ✅ Complete |

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Status**: READY FOR APPROVAL
