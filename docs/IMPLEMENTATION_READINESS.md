# DeadBYTE Implementation Readiness

## Engineering Foundation & Development Standards

This document establishes the engineering foundation for DeadBYTE implementation. All development must conform to these specifications to ensure consistency, quality, and maintainability.

---

## 1. Rust Workspace Layout

### 1.1 Directory Structure

```
deadbyte/
├── Cargo.toml                    # Workspace root
├── Cargo.lock                    # Locked dependencies
├── .cargo/
│   └── config.toml               # Cargo configuration
├── rust-toolchain.toml           # Rust version pinning
│
├── crates/
│   ├── deadbyte_scanner/         # Core Scanner crate
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs            # Public API
│   │   │   ├── config.rs         # Configuration types
│   │   │   ├── filter.rs         # Filter system
│   │   │   ├── traverse.rs       # Directory traversal
│   │   │   ├── progress.rs       # Progress reporting
│   │   │   ├── error.rs          # Error types
│   │   │   └── tests/
│   │   │       ├── mod.rs
│   │   │       ├── filter_tests.rs
│   │   │       └── traverse_tests.rs
│   │   └── benches/
│   │       └── scan_benchmark.rs
│   │
│   ├── deadbyte_clean/           # Clean module crate
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── scanner.rs        # Clean-specific scanner config
│   │   │   ├── scope.rs          # Cleaning scopes
│   │   │   ├── executor.rs       # Deletion executor
│   │   │   ├── audit.rs          # Audit trail
│   │   │   └── error.rs
│   │   └── tests/
│   │
│   ├── deadbyte_analyzer/        # Analyzer module crate
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── scanner.rs        # Analyzer-specific scanner config
│   │   │   ├── categorize.rs     # File categorization
│   │   │   ├── insights.rs       # Insight generation
│   │   │   └── error.rs
│   │   └── tests/
│   │
│   ├── deadbyte_security/        # Security module crate
│   │   ├── Cargo.toml
│   │   ├── src/
│   │   │   ├── lib.rs
│   │   │   ├── scanner.rs        # Security-specific scanner config
│   │   │   ├── classify.rs       # File classification
│   │   │   ├── grade.rs          # Security grading
│   │   │   ├── recommend.rs      # Recommendation engine
│   │   │   └── error.rs
│   │   └── tests/
│   │
│   └── deadbyte_common/          # Shared utilities
│       ├── Cargo.toml
│       ├── src/
│       │   ├── lib.rs
│       │   ├── paths.rs          # Path utilities, expansion
│       │   ├── format.rs         # Size/date formatting
│       │   ├── id.rs             # ID generation
│       │   └── error.rs          # Common error types
│       └── tests/
│
├── src-tauri/                    # Tauri application
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── src/
│   │   ├── main.rs               # Entry point
│   │   ├── commands/             # Tauri commands (IPC)
│   │   │   ├── mod.rs
│   │   │   ├── scanner.rs
│   │   │   ├── clean.rs
│   │   │   ├── analyzer.rs
│   │   │   └── security.rs
│   │   ├── state.rs              # Application state
│   │   ├── events.rs             # Event definitions
│   │   └── error.rs              # Error handling
│   ├── icons/
│   └── build.rs
│
├── src/                          # Frontend (existing)
│   ├── index.html
│   ├── main.js
│   ├── styles/
│   └── assets/
│
├── tests/                        # Integration tests
│   ├── integration/
│   │   ├── scanner_integration.rs
│   │   ├── clean_integration.rs
│   │   ├── analyzer_integration.rs
│   │   └── security_integration.rs
│   └── fixtures/
│       └── test_files/
│
├── docs/                         # Documentation (existing)
│   ├── CLEAN_EXECUTION_PLAN.md
│   ├── ANALYZER_EXECUTION_PLAN.md
│   ├── SECURITY_EXECUTION_PLAN.md
│   ├── CORE_SCANNER_SPEC.md
│   └── IMPLEMENTATION_READINESS.md
│
└── scripts/
    ├── setup.ps1                 # Windows setup script
    ├── dev.ps1                   # Development helper
    └── release.ps1               # Release build script
```

### 1.2 Workspace Cargo.toml

```toml
[workspace]
resolver = "2"
members = [
    "crates/deadbyte_scanner",
    "crates/deadbyte_clean",
    "crates/deadbyte_analyzer",
    "crates/deadbyte_security",
    "crates/deadbyte_common",
    "src-tauri",
]

[workspace.package]
version = "1.0.0"
authors = ["DeadBYTE Team"]
edition = "2021"
rust-version = "1.75"
license = "MIT"
repository = "https://github.com/example/deadbyte"

[workspace.dependencies]
# Async runtime
tokio = { version = "1.35", features = ["full"] }

# Serialization
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"

# File system
walkdir = "2.4"
glob = "0.3"
ignore = "0.4"

# Error handling
thiserror = "1.0"
anyhow = "1.0"

# Logging
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }

# Time
chrono = { version = "0.4", features = ["serde"] }

# Threading
rayon = "1.8"
crossbeam-channel = "0.5"

# Utilities
uuid = { version = "1.6", features = ["v4"] }
once_cell = "1.19"

# Tauri
tauri = { version = "1.5", features = ["shell-open"] }

# Testing
tempfile = "3.10"
assert_fs = "1.1"
predicates = "3.1"

# Internal crates
deadbyte_scanner = { path = "crates/deadbyte_scanner" }
deadbyte_clean = { path = "crates/deadbyte_clean" }
deadbyte_analyzer = { path = "crates/deadbyte_analyzer" }
deadbyte_security = { path = "crates/deadbyte_security" }
deadbyte_common = { path = "crates/deadbyte_common" }

[workspace.lints.rust]
unsafe_code = "forbid"
missing_docs = "warn"

[workspace.lints.clippy]
all = "warn"
pedantic = "warn"
nursery = "warn"
unwrap_used = "warn"
expect_used = "warn"
panic = "warn"

[profile.dev]
opt-level = 0
debug = true

[profile.release]
opt-level = 3
lto = "thin"
codegen-units = 1
strip = true

[profile.bench]
inherits = "release"
debug = true
```

### 1.3 Crate Dependencies

#### Core Scanner (`deadbyte_scanner/Cargo.toml`)

```toml
[package]
name = "deadbyte_scanner"
version.workspace = true
edition.workspace = true

[dependencies]
tokio.workspace = true
serde.workspace = true
walkdir.workspace = true
glob.workspace = true
ignore.workspace = true
thiserror.workspace = true
tracing.workspace = true
chrono.workspace = true
rayon.workspace = true
crossbeam-channel.workspace = true
uuid.workspace = true

deadbyte_common = { workspace = true }

[dev-dependencies]
tempfile.workspace = true
assert_fs.workspace = true
predicates.workspace = true
tokio = { workspace = true, features = ["test-util"] }

[features]
default = []
# Enable parallel scanning (recommended)
parallel = []
# Enable memory-mapped I/O for large directories
mmap = ["memmap2"]
```

#### Module Crates (example: `deadbyte_clean/Cargo.toml`)

```toml
[package]
name = "deadbyte_clean"
version.workspace = true
edition.workspace = true

[dependencies]
tokio.workspace = true
serde.workspace = true
thiserror.workspace = true
tracing.workspace = true
chrono.workspace = true
uuid.workspace = true

deadbyte_scanner = { workspace = true }
deadbyte_common = { workspace = true }

[dev-dependencies]
tempfile.workspace = true
assert_fs.workspace = true
```

### 1.4 Rust Toolchain

```toml
# rust-toolchain.toml
[toolchain]
channel = "1.75"
components = ["rustfmt", "clippy", "rust-analyzer"]
targets = ["x86_64-pc-windows-msvc"]
```

### 1.5 Feature Flags

| Feature | Crate | Description | Default |
|---------|-------|-------------|---------|
| `parallel` | scanner | Enable parallel directory traversal | Yes |
| `mmap` | scanner | Memory-mapped I/O for large dirs | No |
| `audit-log` | clean | Write deletion audit trail | Yes |
| `hash-detection` | analyzer | Enable duplicate file detection | Yes |
| `permission-check` | security | Enable permission analysis | Yes |

---

## 2. Coding Standards & Conventions

### 2.1 General Rust Style

```rust
// ═══════════════════════════════════════════════════════════════════════════
// FILE HEADER
// ═══════════════════════════════════════════════════════════════════════════

//! Brief description of the module.
//!
//! Detailed explanation if needed.

// ═══════════════════════════════════════════════════════════════════════════
// IMPORTS - Grouped and ordered
// ═══════════════════════════════════════════════════════════════════════════

// Standard library first
use std::collections::HashMap;
use std::path::{Path, PathBuf};

// External crates second
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

// Workspace crates third
use deadbyte_common::format_size;

// Local modules last
use crate::config::ScanConfig;
use crate::error::ScanError;

// ═══════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════════════

/// Maximum number of items to hold in memory before paging.
const MAX_ITEMS_IN_MEMORY: usize = 100_000;

/// Default timeout for directory operations.
const DEFAULT_TIMEOUT_MS: u64 = 30_000;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

/// Represents a discovered file system entry.
///
/// Contains all metadata collected during scanning.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ScannedItem {
    /// Absolute path to the item.
    pub path: PathBuf,

    /// File name (last component of path).
    pub name: String,

    /// Size in bytes.
    pub size_bytes: u64,
}
```

### 2.2 Naming Conventions

| Item | Convention | Example |
|------|------------|---------|
| Crates | `snake_case` | `deadbyte_scanner` |
| Modules | `snake_case` | `file_filter` |
| Types (struct, enum) | `PascalCase` | `ScanConfig` |
| Traits | `PascalCase` | `Filter` |
| Functions | `snake_case` | `start_scan` |
| Constants | `SCREAMING_SNAKE_CASE` | `MAX_DEPTH` |
| Variables | `snake_case` | `file_count` |
| Type parameters | `PascalCase`, single letter or descriptive | `T`, `Item` |
| Lifetimes | `'lowercase` | `'a`, `'input` |

### 2.3 Error Handling

```rust
// ═══════════════════════════════════════════════════════════════════════════
// ERROR DEFINITION - Use thiserror
// ═══════════════════════════════════════════════════════════════════════════

use thiserror::Error;

/// Errors that can occur during scanning.
#[derive(Debug, Error)]
pub enum ScanError {
    /// Configuration is invalid.
    #[error("invalid configuration: {0}")]
    InvalidConfig(String),

    /// Access to path was denied.
    #[error("access denied: {path}")]
    AccessDenied {
        path: PathBuf,
        #[source]
        source: std::io::Error,
    },

    /// Operation timed out.
    #[error("operation timed out after {duration_ms}ms")]
    Timeout { duration_ms: u64 },

    /// Internal error (should not happen).
    #[error("internal error: {0}")]
    Internal(#[from] anyhow::Error),
}

// ═══════════════════════════════════════════════════════════════════════════
// ERROR HANDLING - Patterns
// ═══════════════════════════════════════════════════════════════════════════

// GOOD: Use ? for propagation with context
fn read_metadata(path: &Path) -> Result<Metadata, ScanError> {
    std::fs::metadata(path).map_err(|e| {
        if e.kind() == std::io::ErrorKind::PermissionDenied {
            ScanError::AccessDenied {
                path: path.to_owned(),
                source: e,
            }
        } else {
            ScanError::Internal(e.into())
        }
    })
}

// GOOD: Use Result for fallible operations
fn calculate_score(findings: &[Finding]) -> Result<u32, GradeError> {
    if findings.is_empty() {
        return Err(GradeError::NoFindings);
    }
    // ...
    Ok(score)
}

// BAD: Avoid unwrap() and expect() in library code
fn bad_example(path: &Path) {
    let metadata = std::fs::metadata(path).unwrap();  // ❌ Never do this
    let name = path.file_name().expect("has name");   // ❌ Avoid this too
}

// OK: expect() is acceptable in tests and main()
#[test]
fn test_something() {
    let result = do_thing().expect("should succeed in test");
}
```

### 2.4 Logging Conventions

```rust
use tracing::{debug, error, info, instrument, trace, warn};

// ═══════════════════════════════════════════════════════════════════════════
// LOGGING LEVELS
// ═══════════════════════════════════════════════════════════════════════════

// ERROR: Something failed that shouldn't have
error!(path = %path, "Failed to read directory");

// WARN: Something unexpected but recoverable
warn!(path = %path, "Access denied, skipping directory");

// INFO: High-level progress (user-visible)
info!(items = count, "Scan completed");

// DEBUG: Detailed progress (developer-visible)
debug!(current = %path, "Scanning directory");

// TRACE: Very detailed (performance investigation)
trace!(file = %name, size = bytes, "Processing file");

// ═══════════════════════════════════════════════════════════════════════════
// STRUCTURED LOGGING
// ═══════════════════════════════════════════════════════════════════════════

// Use structured fields, not string interpolation
// GOOD:
info!(
    scan_id = %id,
    items_found = count,
    duration_ms = elapsed,
    "Scan completed"
);

// BAD:
info!("Scan {} completed: {} items in {}ms", id, count, elapsed);

// ═══════════════════════════════════════════════════════════════════════════
// INSTRUMENT ATTRIBUTE
// ═══════════════════════════════════════════════════════════════════════════

// Use #[instrument] for automatic span creation
#[instrument(skip(config), fields(mode = %config.mode))]
pub async fn start_scan(config: ScanConfig) -> Result<ScanResult, ScanError> {
    info!("Starting scan");
    // ... function body
}
```

### 2.5 Documentation Requirements

```rust
// ═══════════════════════════════════════════════════════════════════════════
// DOCUMENTATION STANDARDS
// ═══════════════════════════════════════════════════════════════════════════

/// Brief one-line summary.
///
/// Longer description if needed. Can span multiple paragraphs.
///
/// # Arguments
///
/// * `path` - The directory to scan
/// * `config` - Scanning configuration
///
/// # Returns
///
/// Returns a `ScanResult` containing discovered items.
///
/// # Errors
///
/// Returns `ScanError::AccessDenied` if the path cannot be accessed.
/// Returns `ScanError::Timeout` if the operation exceeds the configured timeout.
///
/// # Panics
///
/// This function does not panic. (Or document when it might)
///
/// # Examples
///
/// ```rust
/// use deadbyte_scanner::{Scanner, ScanConfig};
///
/// let config = ScanConfig::new().target("/path/to/scan");
/// let result = Scanner::new(config).start().await?;
/// ```
pub async fn scan_directory(
    path: impl AsRef<Path>,
    config: &ScanConfig,
) -> Result<ScanResult, ScanError> {
    // ...
}

// ═══════════════════════════════════════════════════════════════════════════
// WHEN TO DOCUMENT
// ═══════════════════════════════════════════════════════════════════════════

// REQUIRED: All public items
pub struct ScanConfig { ... }  // Must have doc comment
pub fn start_scan() { ... }    // Must have doc comment
pub enum ScanError { ... }     // Must have doc comment

// RECOMMENDED: Complex private items
fn complex_algorithm() { ... } // Should have doc comment

// OPTIONAL: Simple private items
fn increment(x: i32) -> i32 { x + 1 }  // Self-explanatory
```

### 2.6 Safety Principles

```rust
// ═══════════════════════════════════════════════════════════════════════════
// SAFETY RULES
// ═══════════════════════════════════════════════════════════════════════════

// 1. NO UNSAFE CODE
// The workspace forbids unsafe code entirely:
// #![forbid(unsafe_code)] is set in Cargo.toml

// 2. VALIDATE ALL USER INPUT
fn process_path(path: &str) -> Result<PathBuf, ValidationError> {
    let path = PathBuf::from(path);

    // Validate the path exists
    if !path.exists() {
        return Err(ValidationError::PathNotFound(path));
    }

    // Validate it's not a system-critical path
    if is_system_critical(&path) {
        return Err(ValidationError::ProtectedPath(path));
    }

    // Canonicalize to prevent path traversal
    let canonical = path.canonicalize()
        .map_err(|e| ValidationError::InvalidPath(e))?;

    Ok(canonical)
}

// 3. NEVER DELETE WITHOUT CONFIRMATION
// All destructive operations require explicit user confirmation
// passed through IPC, not assumed

// 4. AUDIT ALL DESTRUCTIVE ACTIONS
fn delete_file(path: &Path, audit: &mut AuditLog) -> Result<(), CleanError> {
    // Log BEFORE deletion
    audit.record_deletion(path, DeletionState::Pending)?;

    // Perform deletion
    std::fs::remove_file(path)?;

    // Log AFTER deletion
    audit.record_deletion(path, DeletionState::Completed)?;

    Ok(())
}

// 5. HANDLE PERMISSIONS GRACEFULLY
// Never crash on permission errors - skip and continue
match std::fs::read_dir(path) {
    Ok(entries) => process_entries(entries),
    Err(e) if e.kind() == std::io::ErrorKind::PermissionDenied => {
        warn!(path = %path, "Permission denied, skipping");
        Ok(SkipResult::AccessDenied)
    }
    Err(e) => Err(e.into()),
}
```

---

## 3. Build & Test Strategy

### 3.1 Cargo Configuration

```toml
# .cargo/config.toml

[build]
# Use all available cores for compilation
jobs = -1

[target.x86_64-pc-windows-msvc]
# Windows-specific linker flags
rustflags = ["-C", "target-feature=+crt-static"]

[alias]
# Custom aliases for common operations
b = "build"
t = "test"
c = "check"
r = "run"
lint = "clippy --all-targets --all-features -- -D warnings"
fmt-check = "fmt --all -- --check"
doc = "doc --no-deps --document-private-items"

# Full CI check locally
ci = "xtask ci"
```

### 3.2 Test Organization

```
tests/
├── unit/                   # Unit tests (in crate src/)
│   └── (inline with source)
│
├── integration/            # Integration tests
│   ├── mod.rs
│   ├── scanner_integration.rs
│   ├── clean_integration.rs
│   ├── analyzer_integration.rs
│   └── security_integration.rs
│
├── e2e/                    # End-to-end tests
│   ├── mod.rs
│   ├── full_scan_e2e.rs
│   └── clean_workflow_e2e.rs
│
└── fixtures/               # Test data
    ├── test_files/
    │   ├── temp_files/
    │   ├── log_files/
    │   └── sensitive_files/
    └── expected/
        └── scan_results.json
```

### 3.3 Test Patterns

```rust
// ═══════════════════════════════════════════════════════════════════════════
// UNIT TESTS - In src/ next to implementation
// ═══════════════════════════════════════════════════════════════════════════

// src/filter.rs
pub fn matches_glob(pattern: &str, name: &str) -> bool {
    // implementation
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_glob_matches_exact() {
        assert!(matches_glob("*.tmp", "file.tmp"));
    }

    #[test]
    fn test_glob_no_match() {
        assert!(!matches_glob("*.tmp", "file.txt"));
    }

    #[test]
    fn test_glob_wildcard() {
        assert!(matches_glob("cache_*", "cache_12345"));
    }
}

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS - In tests/ directory
// ═══════════════════════════════════════════════════════════════════════════

// tests/integration/scanner_integration.rs
use deadbyte_scanner::{Scanner, ScanConfigBuilder};
use tempfile::TempDir;

#[tokio::test]
async fn test_scan_temp_directory() {
    // Arrange
    let temp = TempDir::new().unwrap();
    create_test_files(&temp);

    // Act
    let config = ScanConfigBuilder::new()
        .target(temp.path())
        .include_pattern("*.tmp")
        .build()
        .unwrap();

    let result = Scanner::new(config).start().await.unwrap();

    // Assert
    assert_eq!(result.items.len(), 3);
    assert!(result.items.iter().all(|i| i.name.ends_with(".tmp")));
}

// ═══════════════════════════════════════════════════════════════════════════
// TEST HELPERS
// ═══════════════════════════════════════════════════════════════════════════

// tests/common/mod.rs
use std::fs;
use std::path::Path;
use tempfile::TempDir;

/// Create a test directory with known file structure.
pub fn create_test_files(dir: &TempDir) {
    fs::write(dir.path().join("file1.tmp"), "temp content").unwrap();
    fs::write(dir.path().join("file2.tmp"), "temp content").unwrap();
    fs::write(dir.path().join("file3.tmp"), "temp content").unwrap();
    fs::write(dir.path().join("keep.txt"), "not temp").unwrap();
}

/// Assert that a scan result contains specific files.
pub fn assert_contains_file(result: &ScanResult, name: &str) {
    assert!(
        result.items.iter().any(|i| i.name == name),
        "Expected result to contain '{}'",
        name
    );
}
```

### 3.4 Linting & Formatting

```toml
# rustfmt.toml
edition = "2021"
max_width = 100
tab_spaces = 4
newline_style = "Auto"
use_small_heuristics = "Default"

# Imports
imports_granularity = "Crate"
group_imports = "StdExternalCrate"
reorder_imports = true

# Other
format_code_in_doc_comments = true
format_macro_matchers = true
format_strings = false
```

```toml
# clippy.toml
# Additional clippy configuration

# Cognitive complexity threshold
cognitive-complexity-threshold = 25

# Maximum lines in a function
too-many-lines-threshold = 100

# Maximum number of arguments
too-many-arguments-threshold = 7
```

### 3.5 Coverage Expectations

| Category | Target | Enforcement |
|----------|--------|-------------|
| Core Scanner | 90% | Required |
| Module Business Logic | 80% | Required |
| Error Paths | 70% | Required |
| Tauri Commands | 60% | Recommended |
| Integration Tests | Coverage by feature | Required |

---

## 4. CI Pipeline Design

### 4.1 Pipeline Overview

```yaml
# .github/workflows/ci.yml

name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  # ═══════════════════════════════════════════════════════════════════════════
  # CHECK - Fast feedback
  # ═══════════════════════════════════════════════════════════════════════════
  check:
    name: Check
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: rustfmt, clippy

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Check formatting
        run: cargo fmt --all -- --check

      - name: Clippy
        run: cargo clippy --all-targets --all-features -- -D warnings

      - name: Check
        run: cargo check --all-targets --all-features

  # ═══════════════════════════════════════════════════════════════════════════
  # TEST - Full test suite
  # ═══════════════════════════════════════════════════════════════════════════
  test:
    name: Test
    needs: check
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Run tests
        run: cargo test --all-features --workspace

      - name: Run integration tests
        run: cargo test --test '*' --all-features

  # ═══════════════════════════════════════════════════════════════════════════
  # BUILD - Full build verification
  # ═══════════════════════════════════════════════════════════════════════════
  build:
    name: Build
    needs: test
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Cache cargo
        uses: Swatinem/rust-cache@v2

      - name: Build release
        run: cargo build --release --all-features

      - name: Upload artifact
        uses: actions/upload-artifact@v4
        with:
          name: deadbyte-windows
          path: target/release/deadbyte.exe

  # ═══════════════════════════════════════════════════════════════════════════
  # DOCS - Documentation build
  # ═══════════════════════════════════════════════════════════════════════════
  docs:
    name: Documentation
    needs: check
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Build docs
        run: cargo doc --no-deps --all-features
        env:
          RUSTDOCFLAGS: -D warnings

  # ═══════════════════════════════════════════════════════════════════════════
  # COVERAGE - Test coverage (optional, weekly)
  # ═══════════════════════════════════════════════════════════════════════════
  coverage:
    name: Coverage
    if: github.event_name == 'push' && github.ref == 'refs/heads/main'
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          components: llvm-tools-preview

      - name: Install cargo-llvm-cov
        uses: taiki-e/install-action@cargo-llvm-cov

      - name: Generate coverage
        run: cargo llvm-cov --all-features --workspace --lcov --output-path lcov.info

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: lcov.info
```

### 4.2 Failure Gates

| Check | Failure Condition | Blocks Merge |
|-------|-------------------|--------------|
| `cargo fmt` | Any formatting issues | Yes |
| `cargo clippy` | Any warnings with `-D warnings` | Yes |
| `cargo check` | Compilation errors | Yes |
| `cargo test` | Any test failures | Yes |
| `cargo doc` | Documentation warnings | Yes |
| Coverage | Drop below 70% | Warning only |

### 4.3 Release Workflow

```yaml
# .github/workflows/release.yml

name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    name: Build and Release
    runs-on: windows-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust
        uses: dtolnay/rust-toolchain@stable

      - name: Install Tauri CLI
        run: cargo install tauri-cli

      - name: Build Tauri app
        run: cargo tauri build

      - name: Create Release
        uses: softprops/action-gh-release@v1
        with:
          files: |
            src-tauri/target/release/bundle/msi/*.msi
            src-tauri/target/release/bundle/nsis/*.exe
          draft: true
          prerelease: ${{ contains(github.ref, 'alpha') || contains(github.ref, 'beta') }}
```

### 4.4 Branch Strategy

```
main                    # Production-ready code
  └── develop           # Integration branch
       ├── feature/*    # Feature development
       ├── fix/*        # Bug fixes
       └── refactor/*   # Code improvements
```

| Branch | CI Runs | Merge Requirements |
|--------|---------|-------------------|
| `main` | Full + Release | PR + All checks pass + 1 approval |
| `develop` | Full | PR + All checks pass |
| `feature/*` | Check + Test | PR to develop |

---

## 5. Phase 0 Execution Guardrails

### 5.1 Phase 0 Checklist

When Rust is installed, execute in this order:

```powershell
# 1. Verify Rust installation
rustc --version
cargo --version

# 2. Install required components
rustup component add rustfmt clippy rust-analyzer

# 3. Create workspace structure
# (Script will be provided)
.\scripts\setup.ps1

# 4. Verify workspace builds
cargo check --workspace

# 5. Run initial tests
cargo test --workspace

# 6. Install Tauri CLI
cargo install tauri-cli

# 7. Verify Tauri setup
cargo tauri info
```

### 5.2 First Implementation Priority

1. **`deadbyte_common`** - Shared utilities (paths, formatting)
2. **`deadbyte_scanner`** - Core Scanner (foundation)
3. **`src-tauri` skeleton** - Basic Tauri app structure
4. **Integration test** - Verify scanner + Tauri communication
5. **Module crates** - Clean, Analyzer, Security (in order)

### 5.3 Development Workflow

```powershell
# Daily development cycle

# 1. Pull latest
git pull origin develop

# 2. Create feature branch
git checkout -b feature/scanner-progress

# 3. Make changes, run checks frequently
cargo check
cargo test --lib
cargo clippy

# 4. Before commit
cargo fmt
cargo test --all
cargo clippy -- -D warnings

# 5. Commit with conventional message
git commit -m "feat(scanner): add progress reporting"

# 6. Push and create PR
git push origin feature/scanner-progress
```

---

## 6. Quick Reference

### 6.1 Common Commands

```powershell
# Build
cargo build                    # Debug build
cargo build --release          # Release build
cargo tauri build              # Build Tauri app

# Test
cargo test                     # Run all tests
cargo test --lib               # Unit tests only
cargo test --test integration  # Integration tests
cargo test -- --nocapture      # Show println! output

# Quality
cargo fmt                      # Format code
cargo clippy                   # Lint code
cargo doc --open               # Build and open docs

# Run
cargo run                      # Run binary
cargo tauri dev                # Run Tauri in dev mode
```

### 6.2 File Templates

New crate `lib.rs`:
```rust
//! Brief description of this crate.
//!
//! Detailed documentation.

#![warn(missing_docs)]
#![warn(clippy::all)]

mod error;
mod config;

pub use error::Error;
pub use config::Config;
```

New module:
```rust
//! Brief description of this module.

use crate::error::Error;

/// Main type for this module.
pub struct Thing {
    // fields
}

impl Thing {
    /// Creates a new `Thing`.
    pub fn new() -> Self {
        Self { }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_thing_creation() {
        let thing = Thing::new();
        // assertions
    }
}
```

---

## Document Status

| Section | Status |
|---------|--------|
| Workspace Layout | ✅ Complete |
| Coding Standards | ✅ Complete |
| Build & Test Strategy | ✅ Complete |
| CI Pipeline Design | ✅ Complete |
| Phase 0 Guardrails | ✅ Complete |

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Status**: READY FOR APPROVAL
