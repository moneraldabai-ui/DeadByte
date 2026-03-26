● DeadBYTE — Desktop Architecture Confirmation

  Step 2: Complete Desktop Architecture

  ---
  1. Tauri Project Structure

  H:\Overige\SC\DeadBYTE\
  │
  ├── src-tauri/                          # RUST BACKEND (Native Core)
  │   │
  │   ├── Cargo.toml                      # Rust dependencies
  │   ├── Cargo.lock                      # Locked versions
  │   ├── tauri.conf.json                 # Tauri configuration
  │   ├── build.rs                        # Build script
  │   │
  │   ├── src/
  │   │   ├── main.rs                     # Application entry point
  │   │   ├── lib.rs                      # Library exports
  │   │   │
  │   │   ├── commands/                   # IPC Command Handlers
  │   │   │   ├── mod.rs
  │   │   │   ├── delete.rs               # Force delete commands
  │   │   │   ├── analyze.rs              # Junk analyzer commands
  │   │   │   ├── security.rs             # Security scan commands
  │   │   │   ├── optimize.rs             # Performance commands
  │   │   │   └── maintenance.rs          # System maintenance commands
  │   │   │
  │   │   ├── engine/                     # Core Business Logic
  │   │   │   ├── mod.rs
  │   │   │   ├── force_delete/
  │   │   │   │   ├── mod.rs
  │   │   │   │   ├── lock_detector.rs    # Detect file locks
  │   │   │   │   ├── handle_resolver.rs  # Resolve locking processes
  │   │   │   │   ├── permission.rs       # Ownership/ACL manipulation
  │   │   │   │   └── executor.rs         # Delete execution
  │   │   │   │
  │   │   │   ├── analyzer/
  │   │   │   │   ├── mod.rs
  │   │   │   │   ├── scanner.rs          # File system scanner
  │   │   │   │   ├── classifier.rs       # Junk classification
  │   │   │   │   └── profiles.rs         # App-specific profiles
  │   │   │   │
  │   │   │   ├── security/
  │   │   │   │   ├── mod.rs
  │   │   │   │   ├── scanner.rs          # Threat scanner
  │   │   │   │   ├── signatures.rs       # Signature database
  │   │   │   │   └── quarantine.rs       # Quarantine management
  │   │   │   │
  │   │   │   └── optimizer/
  │   │   │       ├── mod.rs
  │   │   │       ├── startup.rs          # Startup manager
  │   │   │       ├── services.rs         # Service analyzer
  │   │   │       └── registry.rs         # Registry cleaner
  │   │   │
  │   │   ├── services/                   # Shared System Services
  │   │   │   ├── mod.rs
  │   │   │   ├── filesystem.rs           # Safe file operations
  │   │   │   ├── process.rs              # Process management
  │   │   │   ├── registry.rs             # Windows registry access
  │   │   │   ├── privileges.rs           # Privilege elevation
  │   │   │   └── logging.rs              # Operation logging
  │   │   │
  │   │   ├── models/                     # Data Structures
  │   │   │   ├── mod.rs
  │   │   │   ├── file_info.rs
  │   │   │   ├── scan_result.rs
  │   │   │   ├── threat.rs
  │   │   │   └── system_info.rs
  │   │   │
  │   │   └── utils/
  │   │       ├── mod.rs
  │   │       ├── win32.rs                # Windows API helpers
  │   │       └── errors.rs               # Error types
  │   │
  │   ├── icons/                          # Application icons
  │   │   ├── icon.ico                    # Windows icon
  │   │   ├── icon.png                    # PNG variants
  │   │   ├── 32x32.png
  │   │   ├── 128x128.png
  │   │   └── 256x256.png
  │   │
  │   └── resources/                      # Bundled resources
  │       ├── signatures.db               # Threat signatures
  │       └── profiles.json               # App cleaning profiles
  │
  ├── src/                                # FRONTEND (WebView UI)
  │   │
  │   ├── index.html                      # Main HTML shell
  │   ├── main.ts                         # TypeScript entry
  │   │
  │   ├── styles/
  │   │   ├── variables.css
  │   │   ├── global.css
  │   │   ├── animations.css
  │   │   ├── components.css
  │   │   └── layout.css
  │   │
  │   ├── scripts/
  │   │   ├── app.ts                      # Application controller
  │   │   ├── navigation.ts               # Page routing
  │   │   ├── skull.ts                    # Visual animations
  │   │   └── api.ts                      # Tauri command wrapper
  │   │
  │   ├── components/                     # UI Components (if using framework)
  │   │   └── ...
  │   │
  │   └── assets/
  │       ├── skull/
  │       │   └── skull.svg
  │       ├── icons/
  │       └── fonts/
  │
  ├── package.json                        # Node dependencies (build tools)
  ├── tsconfig.json                       # TypeScript config
  ├── vite.config.ts                      # Vite bundler config
  │
  └── dist/                               # Built frontend (generated)
      └── ...

  ---
  2. Rust ↔ UI Communication Model

  2.1 Architecture Overview

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                           DEADBYTE APPLICATION                          │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │   ┌─────────────────────────────────────────────────────────────────┐   │
  │   │                         UI LAYER (WebView)                      │   │
  │   │                                                                 │   │
  │   │   ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │   │
  │   │   │   HTML/CSS   │  │  TypeScript  │  │   Tauri API Bridge   │ │   │
  │   │   │   Rendering  │  │   Logic      │  │   @tauri-apps/api    │ │   │
  │   │   └──────────────┘  └──────────────┘  └──────────┬───────────┘ │   │
  │   │                                                   │             │   │
  │   └───────────────────────────────────────────────────┼─────────────┘   │
  │                                                       │                 │
  │                              ┌────────────────────────┴──────────┐      │
  │                              │           IPC CHANNEL             │      │
  │                              │     (Secure Message Passing)      │      │
  │                              │                                   │      │
  │                              │  • JSON serialization             │      │
  │                              │  • Type-safe commands             │      │
  │                              │  • Async response handling        │      │
  │                              │  • Event streaming                │      │
  │                              └────────────────────────┬──────────┘      │
  │                                                       │                 │
  │   ┌───────────────────────────────────────────────────┼─────────────┐   │
  │   │                      RUST BACKEND                 │             │   │
  │   │                                                   ▼             │   │
  │   │   ┌──────────────────────────────────────────────────────────┐ │   │
  │   │   │                  COMMAND HANDLERS                        │ │   │
  │   │   │  #[tauri::command]                                       │ │   │
  │   │   │  async fn force_delete(path: String) -> Result<...>      │ │   │
  │   │   └──────────────────────────────────────────────────────────┘ │   │
  │   │                              │                                  │   │
  │   │                              ▼                                  │   │
  │   │   ┌──────────────────────────────────────────────────────────┐ │   │
  │   │   │                    ENGINE MODULES                        │ │   │
  │   │   │  • Force Delete Engine                                   │ │   │
  │   │   │  • Analyzer Engine                                       │ │   │
  │   │   │  • Security Scanner                                      │ │   │
  │   │   │  • Optimizer Engine                                      │ │   │
  │   │   └──────────────────────────────────────────────────────────┘ │   │
  │   │                              │                                  │   │
  │   │                              ▼                                  │   │
  │   │   ┌──────────────────────────────────────────────────────────┐ │   │
  │   │   │                   SYSTEM SERVICES                        │ │   │
  │   │   │  • Windows API (windows-rs)                              │ │   │
  │   │   │  • File System Operations                                │ │   │
  │   │   │  • Registry Access                                       │ │   │
  │   │   │  • Process Management                                    │ │   │
  │   │   │  • Privilege Elevation                                   │ │   │
  │   │   └──────────────────────────────────────────────────────────┘ │   │
  │   │                                                                 │   │
  │   └─────────────────────────────────────────────────────────────────┘   │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  2.2 Command Flow (Example: Force Delete)

  USER ACTION                          UI LAYER                         RUST BACKEND
  ───────────────────────────────────────────────────────────────────────────────────

  1. Click "Delete"
          │
          ▼
     ┌─────────────┐
     │   Button    │
     │   Click     │
     └──────┬──────┘
            │
            ▼
     ┌─────────────────┐
     │  Update UI to   │
     │  "Deleting..."  │
     │  Skull: bite    │
     └────────┬────────┘
              │
              ▼
     ┌─────────────────────────────┐
     │  invoke('force_delete', {  │
     │    path: 'C:\\...',        │
     │    options: {...}          │
     │  })                        │
     └─────────────┬───────────────┘
                   │                          ┌──────────────────────────────┐
                   │ ─────── IPC ───────────▶ │  #[tauri::command]           │
                   │                          │  async fn force_delete(      │
                   │                          │    path: String,             │
                   │                          │    options: DeleteOptions    │
                   │                          │  ) -> Result<DeleteResult>   │
                   │                          └──────────────┬───────────────┘
                   │                                         │
                   │                                         ▼
                   │                          ┌──────────────────────────────┐
                   │                          │  1. Check permissions        │
                   │                          │  2. Detect locks             │
                   │                          │  3. Resolve handles          │
                   │                          │  4. Take ownership           │
                   │                          │  5. Execute delete           │
                   │                          │  6. Verify deletion          │
                   │                          └──────────────┬───────────────┘
                   │                                         │
                   │                                         ▼
                   │                          ┌──────────────────────────────┐
                   │ ◀─────── IPC ─────────── │  Return Result {            │
                   │                          │    success: true,           │
                   │                          │    message: "Deleted",      │
                   │                          │    bytes_freed: 1024000     │
                   │                          │  }                          │
                   │                          └──────────────────────────────┘
                   │
                   ▼
     ┌─────────────────────────────┐
     │  .then((result) => {       │
     │    updateUI(result);       │
     │    skull.setState('success')│
     │  })                        │
     └─────────────────────────────┘

  2.3 Event Streaming (For Progress Updates)

  // Rust side - emit events during long operations
  #[tauri::command]
  async fn scan_system(window: tauri::Window) -> Result<ScanResult, Error> {
      for (index, file) in files.iter().enumerate() {
          // Emit progress event to UI
          window.emit("scan-progress", ScanProgress {
              current: index,
              total: files.len(),
              current_file: file.path.clone(),
          })?;

          // Process file...
      }
      Ok(result)
  }

  // UI side - listen for events
  import { listen } from '@tauri-apps/api/event';

  listen('scan-progress', (event) => {
      const progress = event.payload;
      updateProgressBar(progress.current / progress.total);
      updateCurrentFile(progress.current_file);
      skull.setState('scanning');
  });

  2.4 Command Categories
  ┌──────────────┬──────────────────────────────────────────────────────────┬───────────┐
  │   Category   │                         Commands                         │ Direction │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Force Delete │ force_delete, detect_locks, take_ownership, kill_handle  │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Analyzer     │ scan_junk, classify_files, get_size, clean_category      │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Security     │ quick_scan, full_scan, quarantine, restore               │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Performance  │ get_startup_items, disable_startup, analyze_services     │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Maintenance  │ scan_registry, clean_registry, check_disk, repair_system │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ System       │ get_system_info, request_admin, check_privileges         │ UI → Rust │
  ├──────────────┼──────────────────────────────────────────────────────────┼───────────┤
  │ Events       │ scan-progress, delete-progress, threat-found             │ Rust → UI │
  └──────────────┴──────────────────────────────────────────────────────────┴───────────┘
  ---
  3. Build, Packaging & Installer Pipeline

  3.1 Build Process

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                          BUILD PIPELINE                                 │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │   SOURCE CODE                                                           │
  │   ┌────────────────────┐      ┌────────────────────┐                   │
  │   │    src/ (UI)       │      │  src-tauri/ (Rust) │                   │
  │   │  • TypeScript      │      │  • Rust source     │                   │
  │   │  • CSS             │      │  • Cargo.toml      │                   │
  │   │  • HTML            │      │                    │                   │
  │   └─────────┬──────────┘      └─────────┬──────────┘                   │
  │             │                           │                               │
  │             ▼                           ▼                               │
  │   ┌────────────────────┐      ┌────────────────────┐                   │
  │   │   Vite Bundler     │      │   Cargo Build      │                   │
  │   │                    │      │                    │                   │
  │   │  • Bundle JS/TS    │      │  • Compile Rust    │                   │
  │   │  • Minify CSS      │      │  • Link Windows    │                   │
  │   │  • Optimize        │      │    libraries       │                   │
  │   └─────────┬──────────┘      └─────────┬──────────┘                   │
  │             │                           │                               │
  │             ▼                           ▼                               │
  │   ┌────────────────────┐      ┌────────────────────┐                   │
  │   │   dist/ folder     │      │  target/release/   │                   │
  │   │                    │      │  deadbyte.exe      │                   │
  │   │  • index.html      │      │                    │                   │
  │   │  • main.js         │      │  (Native binary)   │                   │
  │   │  • style.css       │      │                    │                   │
  │   └─────────┬──────────┘      └─────────┬──────────┘                   │
  │             │                           │                               │
  │             └───────────┬───────────────┘                               │
  │                         │                                               │
  │                         ▼                                               │
  │             ┌────────────────────────────┐                             │
  │             │     TAURI BUNDLER          │                             │
  │             │                            │                             │
  │             │  • Embed UI into binary    │                             │
  │             │  • Bundle resources        │                             │
  │             │  • Sign executable         │                             │
  │             │  • Create installer        │                             │
  │             └─────────────┬──────────────┘                             │
  │                           │                                             │
  │                           ▼                                             │
  │   ┌─────────────────────────────────────────────────────────────────┐  │
  │   │                      OUTPUT ARTIFACTS                           │  │
  │   │                                                                 │  │
  │   │  target/release/bundle/                                         │  │
  │   │  ├── msi/                                                       │  │
  │   │  │   └── DeadBYTE_1.0.0_x64.msi        ← Windows Installer      │  │
  │   │  ├── nsis/                                                      │  │
  │   │  │   └── DeadBYTE_1.0.0_x64-setup.exe  ← NSIS Installer         │  │
  │   │  └── deadbyte.exe                       ← Portable executable   │  │
  │   │                                                                 │  │
  │   └─────────────────────────────────────────────────────────────────┘  │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  3.2 Build Commands

  # Development (hot reload)
  npm run tauri dev

  # Production build
  npm run tauri build

  # Build with specific target
  npm run tauri build -- --target x86_64-pc-windows-msvc

  3.3 Installer Configuration

  // tauri.conf.json (key sections)
  {
    "build": {
      "distDir": "../dist",
      "devPath": "http://localhost:5173"
    },
    "package": {
      "productName": "DeadBYTE",
      "version": "1.0.0"
    },
    "tauri": {
      "bundle": {
        "active": true,
        "identifier": "com.deadbyte.app",
        "icon": [
          "icons/32x32.png",
          "icons/128x128.png",
          "icons/icon.ico"
        ],
        "targets": ["msi", "nsis"],
        "windows": {
          "certificateThumbprint": null,
          "digestAlgorithm": "sha256",
          "wix": {
            "language": "en-US",
            "upgradeCode": "UNIQUE-GUID-HERE"
          },
          "nsis": {
            "installerIcon": "icons/icon.ico",
            "headerImage": "icons/header.bmp",
            "sidebarImage": "icons/sidebar.bmp",
            "license": "LICENSE.txt",
            "shortcutName": "DeadBYTE"
          }
        }
      },
      "windows": [
        {
          "title": "DeadBYTE",
          "width": 1280,
          "height": 800,
          "minWidth": 1024,
          "minHeight": 768,
          "resizable": true,
          "fullscreen": false,
          "decorations": false,
          "transparent": false
        }
      ],
      "security": {
        "csp": "default-src 'self'; style-src 'self' 'unsafe-inline'"
      }
    }
  }

  3.4 Installer Features
  ┌──────────────────────────┬───────────────┬────────────────┐
  │         Feature          │ MSI Installer │ NSIS Installer │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Install to Program Files │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Start Menu shortcuts     │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Desktop shortcut         │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Uninstaller entry        │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Custom install path      │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Admin elevation          │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Silent install           │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ Upgrade detection        │ ✓             │ ✓              │
  ├──────────────────────────┼───────────────┼────────────────┤
  │ File associations        │ ✓             │ ✓              │
  └──────────────────────────┴───────────────┴────────────────┘
  ---
  4. Desktop-Specific Constraints (Lock Early)

  4.1 Window Behavior

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     WINDOW CONFIGURATION                                │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  CONSTRAINT                        │  DECISION                          │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Window chrome                     │  CUSTOM (frameless)                │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Minimum size                      │  1024 × 768 px                     │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Default size                      │  1280 × 800 px                     │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Resizable                         │  YES                               │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Multiple instances                │  NO (single instance only)         │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  System tray                       │  YES (minimize to tray)            │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Close behavior                    │  Minimize to tray (configurable)   │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Always on top                     │  NO (optional in settings)         │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  4.2 Privilege Model

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      PRIVILEGE ARCHITECTURE                             │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  NORMAL LAUNCH (User privileges)                                        │
  │  ├── UI rendering                                                       │
  │  ├── Configuration management                                           │
  │  ├── Scan user directories                                              │
  │  ├── Clean user temp files                                              │
  │  └── View system information                                            │
  │                                                                         │
  │  ELEVATED OPERATIONS (Request admin when needed)                        │
  │  ├── Force delete system files                                          │
  │  ├── Modify system registry                                             │
  │  ├── Kill system processes                                              │
  │  ├── Modify startup items                                               │
  │  ├── Windows Update cache cleanup                                       │
  │  └── System file repair (SFC/DISM)                                      │
  │                                                                         │
  │  IMPLEMENTATION:                                                        │
  │  • App launches with normal privileges                                  │
  │  • Elevated operations spawn a separate admin process                   │
  │  • UAC prompt appears only when admin action is required                │
  │  • Admin operations are logged                                          │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  4.3 File System Constraints

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     FILE SYSTEM BOUNDARIES                              │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  PROTECTED PATHS (Hardcoded — Never touch without multi-confirm)        │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • C:\Windows\System32\                                                 │
  │  • C:\Windows\WinSxS\                                                   │
  │  • C:\Windows\Boot\                                                     │
  │  • C:\$Recycle.Bin\                                                     │
  │  • Boot configuration (BCD)                                             │
  │  • Registry hives (SYSTEM, SAM, SECURITY)                               │
  │                                                                         │
  │  SAFE ZONES (Can clean freely)                                          │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • %TEMP%                                                               │
  │  • %LOCALAPPDATA%\Temp                                                  │
  │  • Browser caches (known locations)                                     │
  │  • Windows\Temp (with caution)                                          │
  │  • Windows\Prefetch (optional)                                          │
  │                                                                         │
  │  APPLICATION DATA                                                       │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • Config:      %APPDATA%\DeadBYTE\config.json                         │
  │  • Logs:        %APPDATA%\DeadBYTE\logs\                               │
  │  • Quarantine:  %APPDATA%\DeadBYTE\quarantine\                         │
  │  • Database:    %APPDATA%\DeadBYTE\data.db                             │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  4.4 Security Constraints

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                      SECURITY REQUIREMENTS                              │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  CODE SIGNING                                                           │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • Production builds MUST be signed with EV certificate                 │
  │  • Required for Windows SmartScreen trust                               │
  │  • Prevents "Unknown publisher" warnings                                │
  │                                                                         │
  │  UPDATE MECHANISM                                                       │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • Tauri built-in updater with signature verification                   │
  │  • HTTPS-only update channel                                            │
  │  • Rollback capability                                                  │
  │                                                                         │
  │  IPC SECURITY                                                           │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • CSP enforced (no external scripts)                                   │
  │  • Command allowlist (only registered commands callable)                │
  │  • Path validation in Rust (prevent path traversal)                     │
  │                                                                         │
  │  LOGGING & AUDIT                                                        │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • All destructive operations logged                                    │
  │  • Timestamp, path, result, user                                        │
  │  • Logs stored locally, user-accessible                                 │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  4.5 Performance Constraints

  ┌─────────────────────────────────────────────────────────────────────────┐
  │                     PERFORMANCE TARGETS                                 │
  ├─────────────────────────────────────────────────────────────────────────┤
  │                                                                         │
  │  METRIC                            │  TARGET                            │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Cold startup time                 │  < 2 seconds                       │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Memory usage (idle)               │  < 100 MB                          │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Memory usage (scanning)           │  < 300 MB                          │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  UI frame rate                     │  60 FPS (animations)               │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Installer size                    │  < 20 MB                           │
  │  ──────────────────────────────────┼────────────────────────────────── │
  │  Installed size                    │  < 50 MB                           │
  │                                                                         │
  │  STRATEGIES                                                             │
  │  ────────────────────────────────────────────────────────────────────── │
  │  • Rust backend: zero-cost abstractions, no GC                          │
  │  • File scanning: parallel with rayon                                   │
  │  • Large operations: chunked with progress events                       │
  │  • UI: GPU-accelerated via WebView                                      │
  │  • Assets: compressed, lazy-loaded where possible                       │
  │                                                                         │
  └─────────────────────────────────────────────────────────────────────────┘

  ---
  5. Key Dependencies

  5.1 Rust (Backend)

  # Cargo.toml - Key dependencies
  [dependencies]
  tauri = { version = "1.5", features = ["shell-open", "dialog", "notification"] }
  serde = { version = "1.0", features = ["derive"] }
  serde_json = "1.0"
  tokio = { version = "1.0", features = ["full"] }

  # Windows-specific
  windows = { version = "0.52", features = [
      "Win32_Foundation",
      "Win32_Storage_FileSystem",
      "Win32_System_Threading",
      "Win32_Security",
      "Win32_System_Registry",
      "Win32_System_ProcessStatus"
  ]}

  # Utilities
  walkdir = "2.4"           # Directory traversal
  rayon = "1.8"             # Parallel processing
  chrono = "0.4"            # Date/time
  thiserror = "1.0"         # Error handling
  tracing = "0.1"           # Logging

  5.2 Frontend (UI)

  // package.json - Key dependencies
  {
    "dependencies": {
      "@tauri-apps/api": "^1.5.0"
    },
    "devDependencies": {
      "@tauri-apps/cli": "^1.5.0",
      "typescript": "^5.0.0",
      "vite": "^5.0.0"
    }
  }

  ---
  6. Summary of Locked Decisions
  ┌──────────────────┬─────────────────────┬────────────────────────────────────────┐
  │     Category     │      Decision       │               Rationale                │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Framework        │ Tauri 1.5+          │ Rust safety, small binary, native feel │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ UI Rendering     │ System WebView      │ No bundled Chromium, smaller size      │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Backend Language │ Rust                │ Memory safety for admin operations     │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Window Chrome    │ Custom (frameless)  │ Design requirement                     │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Installer        │ NSIS + MSI          │ Industry standard, enterprise support  │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Privileges       │ On-demand elevation │ Better UX, security principle          │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Single Instance  │ Enforced            │ Prevent conflicts                      │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ System Tray      │ Supported           │ User expectation                       │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Updates          │ Tauri built-in      │ Signed, secure                         │
  ├──────────────────┼─────────────────────┼────────────────────────────────────────┤
  │ Minimum Windows  │ Windows 10+         │ WebView2 requirement                   │
  └──────────────────┴─────────────────────┴────────────────────────────────────────┘
  ---
  Architecture confirmed. Ready for Step 3 (High-Level Technical Architecture) when authorized.