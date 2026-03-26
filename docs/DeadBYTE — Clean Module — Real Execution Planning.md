  Clean Module — Real Execution Planning

  Functional Architecture & Implementation Blueprint

  ---
  EXECUTIVE SUMMARY

  The Clean module operates as a three-phase pipeline:

  ┌─────────────────────────────────────────────────────────────────────────────┐
  │                        CLEAN EXECUTION PIPELINE                              │
  ├─────────────────────────────────────────────────────────────────────────────┤
  │                                                                             │
  │   ┌───────────┐      ┌───────────┐      ┌───────────┐      ┌───────────┐  │
  │   │           │      │           │      │           │      │           │  │
  │   │  ANALYZE  │ ───▶ │  SELECT   │ ───▶ │  CONFIRM  │ ───▶ │  EXECUTE  │  │
  │   │           │      │           │      │           │      │           │  │
  │   └───────────┘      └───────────┘      └───────────┘      └───────────┘  │
  │        │                  │                  │                  │          │
  │        ▼                  ▼                  ▼                  ▼          │
  │   Scan system       User reviews       Final warning      Delete files    │
  │   Classify junk     Toggles scope      Show summary       Report results  │
  │   Calculate sizes   Adjust risk        Require action     Log operations  │
  │                                                                             │
  └─────────────────────────────────────────────────────────────────────────────┘

  Each phase is gated — users cannot skip from Analyze to Execute.

  ---
  PHASE 1: ANALYZE

  Purpose

  Scan the system, identify cleanable items, classify by category and risk.

  UI State During Analysis

  ┌─────────────────────────────────────────┐
  │  [●] Analyzing system...                │
  │  ████████████░░░░░░░░  45%              │
  │                                         │
  │  Scanning: C:\Users\*\AppData\Local\... │
  │  Files found: 847                       │
  │  Space identified: 1.2 GB               │
  └─────────────────────────────────────────┘

  Backend Responsibilities
  ┌───────────────────┬──────────────────────────────────────┬───────────────────┐
  │     Function      │             Description              │    Rust Module    │
  ├───────────────────┼──────────────────────────────────────┼───────────────────┤
  │ start_analysis()  │ Begin async scan with mode parameter │ clean::analyzer   │
  ├───────────────────┼──────────────────────────────────────┼───────────────────┤
  │ scan_directory()  │ Recursive file enumeration           │ clean::scanner    │
  ├───────────────────┼──────────────────────────────────────┼───────────────────┤
  │ classify_file()   │ Match against junk rules             │ clean::classifier │
  ├───────────────────┼──────────────────────────────────────┼───────────────────┤
  │ calculate_size()  │ Sum file sizes per category          │ clean::calculator │
  ├───────────────────┼──────────────────────────────────────┼───────────────────┤
  │ stream_progress() │ Emit progress events to UI           │ clean::events     │
  └───────────────────┴──────────────────────────────────────┴───────────────────┘
  Classification Rules (JSON Config)

  {
    "categories": [
      {
        "id": "system_cache",
        "name": "System Cache",
        "risk": "low",
        "paths": [
          "%TEMP%\\*",
          "%WINDIR%\\Temp\\*",
          "%LOCALAPPDATA%\\Temp\\*"
        ],
        "exclude": ["*.log"],
        "min_age_days": 0
      },
      {
        "id": "browser_cache",
        "name": "Browser Cache",
        "risk": "low",
        "paths": [
          "%LOCALAPPDATA%\\Google\\Chrome\\User Data\\*\\Cache\\*",
          "%LOCALAPPDATA%\\Mozilla\\Firefox\\Profiles\\*\\cache2\\*",
          "%LOCALAPPDATA%\\Microsoft\\Edge\\User Data\\*\\Cache\\*"
        ]
      },
      {
        "id": "app_residue",
        "name": "Application Residues",
        "risk": "medium",
        "paths": [
          "%LOCALAPPDATA%\\*\\Cache\\*",
          "%APPDATA%\\*\\Cache\\*"
        ],
        "require_uninstalled": true
      }
    ]
  }

  Analysis Output Structure

  struct AnalysisResult {
      scan_id: String,
      timestamp: DateTime<Utc>,
      mode: CleanMode,
      categories: Vec<CategoryResult>,
      total_size: u64,
      total_files: u32,
      overall_risk: RiskLevel,
      duration_ms: u64,
  }

  struct CategoryResult {
      id: String,
      name: String,
      risk: RiskLevel,
      files: Vec<FileEntry>,
      total_size: u64,
      file_count: u32,
      selected: bool,  // Default based on risk
  }

  struct FileEntry {
      path: PathBuf,
      size: u64,
      modified: DateTime<Utc>,
      risk: RiskLevel,
  }

  Mode-Specific Behavior
  ┌──────────┬──────────────────────┬──────────────────────────┬─────────────┐
  │   Mode   │      Scan Depth      │    Default Selection     │ Time Target │
  ├──────────┼──────────────────────┼──────────────────────────┼─────────────┤
  │ Quick    │ Critical paths only  │ Low risk only            │ < 30 sec    │
  ├──────────┼──────────────────────┼──────────────────────────┼─────────────┤
  │ Smart    │ All known junk paths │ Low + recommended medium │ < 2 min     │
  ├──────────┼──────────────────────┼──────────────────────────┼─────────────┤
  │ Advanced │ Full system + custom │ None (manual)            │ Variable    │
  └──────────┴──────────────────────┴──────────────────────────┴─────────────┘
  ---
  PHASE 2: SELECT

  Purpose

  User reviews analysis results, adjusts scope, understands impact.

  UI → Backend Actions
  ┌──────────────────────────┬─────────────────────────────────────┬──────────────────────┐
  │        UI Action         │            Backend Call             │       Response       │
  ├──────────────────────────┼─────────────────────────────────────┼──────────────────────┤
  │ Toggle category checkbox │ update_selection(category_id, bool) │ Updated totals       │
  ├──────────────────────────┼─────────────────────────────────────┼──────────────────────┤
  │ Expand category          │ get_category_details(category_id)   │ File list with paths │
  ├──────────────────────────┼─────────────────────────────────────┼──────────────────────┤
  │ Change clean mode        │ reanalyze(new_mode)                 │ New AnalysisResult   │
  ├──────────────────────────┼─────────────────────────────────────┼──────────────────────┤
  │ Click "Re-scan"          │ start_analysis(current_mode)        │ Fresh scan           │
  └──────────────────────────┴─────────────────────────────────────┴──────────────────────┘
  Selection State

  struct SelectionState {
      scan_id: String,
      selected_categories: HashSet<String>,
      total_selected_size: u64,
      total_selected_files: u32,
      highest_risk: RiskLevel,
  }

  Risk Aggregation Logic

  If ANY selected category is HIGH risk → overall = HIGH
  Else if ANY selected category is MEDIUM risk → overall = MEDIUM
  Else → overall = LOW

  UI Feedback Based on Selection
  ┌─────────────────────┬──────────────────┬────────────────────────────┐
  │      Condition      │   Button State   │      Visual Indicator      │
  ├─────────────────────┼──────────────────┼────────────────────────────┤
  │ Nothing selected    │ Disabled, grayed │ "Select items to clean"    │
  ├─────────────────────┼──────────────────┼────────────────────────────┤
  │ Low risk only       │ Enabled, normal  │ Green accent               │
  ├─────────────────────┼──────────────────┼────────────────────────────┤
  │ Medium risk present │ Enabled, caution │ Yellow warning icon        │
  ├─────────────────────┼──────────────────┼────────────────────────────┤
  │ High risk present   │ Enabled, alert   │ Red warning, extra confirm │
  └─────────────────────┴──────────────────┴────────────────────────────┘
  ---
  PHASE 3: CONFIRM

  Purpose

  Final gate before irreversible action. User must explicitly acknowledge.

  Confirmation Dialog Structure

  ┌─────────────────────────────────────────────────────────────┐
  │  ⚠️  Confirm Cleaning                                       │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  You are about to permanently delete:                       │
  │                                                             │
  │    • 1,247 files                                            │
  │    • 2.06 GB of data                                        │
  │    • 3 categories                                           │
  │                                                             │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │  ⚠️  This action cannot be undone.                  │   │
  │  │  Files will be permanently removed from your system. │   │
  │  └─────────────────────────────────────────────────────┘   │
  │                                                             │
  │  Risk Level: [LOW]                                          │
  │                                                             │
  │           [ Cancel ]              [ Clean Now ]             │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  High-Risk Confirmation (Extra Gate)

  If overall_risk == HIGH:

  ┌─────────────────────────────────────────────────────────────┐
  │  🔴  HIGH RISK OPERATION                                    │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  Some selected items may affect system stability:           │
  │                                                             │
  │    • Windows Update Cache (2.1 GB)                          │
  │      May prevent rollback to previous Windows version       │
  │                                                             │
  │  Type "CLEAN" to confirm:                                   │
  │  ┌─────────────────────────────────────────────────────┐   │
  │  │                                                     │   │
  │  └─────────────────────────────────────────────────────┘   │
  │                                                             │
  │           [ Cancel ]              [ Proceed ]               │
  │                                    (disabled until typed)   │
  └─────────────────────────────────────────────────────────────┘

  ---
  PHASE 4: EXECUTE

  Purpose

  Perform the actual deletion with progress tracking and error handling.

  Execution Flow

  ┌─────────────────────────────────────────────────────────────┐
  │                    EXECUTION PIPELINE                        │
  ├─────────────────────────────────────────────────────────────┤
  │                                                             │
  │  1. CREATE OPERATION RECORD                                 │
  │     └─▶ Generate unique operation_id                        │
  │     └─▶ Log start time, selected items                      │
  │                                                             │
  │  2. PRE-FLIGHT CHECKS                                       │
  │     └─▶ Verify files still exist                            │
  │     └─▶ Check permissions                                   │
  │     └─▶ Identify locked files                               │
  │                                                             │
  │  3. EXECUTE DELETIONS                                       │
  │     └─▶ Process files in batches                            │
  │     └─▶ Stream progress to UI                               │
  │     └─▶ Handle errors per-file (continue on failure)        │
  │                                                             │
  │  4. GENERATE REPORT                                         │
  │     └─▶ Success count / failure count                       │
  │     └─▶ Space recovered                                     │
  │     └─▶ Failed items with reasons                           │
  │                                                             │
  │  5. PERSIST AUDIT LOG                                       │
  │     └─▶ Write to %APPDATA%/DeadBYTE/audit.log              │
  │     └─▶ Include all deleted paths                           │
  │                                                             │
  └─────────────────────────────────────────────────────────────┘

  Backend Commands

  #[tauri::command]
  async fn execute_clean(
      selection: SelectionState,
      confirmation_token: String,  // Prevents replay
  ) -> Result<CleanResult, CleanError>

  #[tauri::command]
  async fn get_clean_progress(
      operation_id: String
  ) -> Result<CleanProgress, CleanError>

  #[tauri::command]
  async fn cancel_clean(
      operation_id: String
  ) -> Result<(), CleanError>

  Progress Streaming

  struct CleanProgress {
      operation_id: String,
      phase: CleanPhase,  // Preparing | Deleting | Finalizing
      current_file: Option<String>,
      files_processed: u32,
      files_total: u32,
      bytes_freed: u64,
      bytes_total: u64,
      errors: Vec<CleanError>,
      can_cancel: bool,
  }

  Result Structure

  struct CleanResult {
      operation_id: String,
      success: bool,
      files_deleted: u32,
      files_failed: u32,
      bytes_freed: u64,
      duration_ms: u64,
      errors: Vec<FileError>,
      audit_log_path: PathBuf,
  }

  struct FileError {
      path: PathBuf,
      reason: ErrorReason,  // PermissionDenied | InUse | NotFound | IoError
      recoverable: bool,
  }

  ---
  SAFETY MECHANISMS

  1. No Silent Deletion

  Every deletion requires:
  - Explicit user selection (checkbox)
  - Confirmation dialog
  - High-risk items require typed confirmation

  2. Audit Trail

  [2024-01-15 14:32:01] CLEAN_START operation_id=abc123 mode=smart
  [2024-01-15 14:32:01] SELECTED category=system_cache files=847 size=1288490188
  [2024-01-15 14:32:01] SELECTED category=browser_cache files=312 size=566231040
  [2024-01-15 14:32:02] DELETE_START files=1159
  [2024-01-15 14:32:02] DELETED C:\Users\...\Temp\file1.tmp
  [2024-01-15 14:32:02] DELETED C:\Users\...\Temp\file2.tmp
  ...
  [2024-01-15 14:32:45] DELETE_COMPLETE success=1157 failed=2 bytes=1854721228
  [2024-01-15 14:32:45] FAILED C:\Windows\Temp\locked.tmp reason=InUse
  [2024-01-15 14:32:45] CLEAN_END duration_ms=43521

  3. Locked File Handling

  If file is locked:
    1. Log the lock (process name if available)
    2. Skip the file
    3. Continue with remaining files
    4. Report locked files in summary
    5. Offer "Retry Failed" option

  4. Permission Escalation

  If permission denied:
    1. Check if UAC elevation would help
    2. If yes, prompt user for elevation
    3. If declined, skip file and continue
    4. Never auto-elevate without consent

  5. Cancellation Support

  - User can cancel during execution
  - Already-deleted files remain deleted
  - Pending files are skipped
  - Partial result is reported

  ---
  UI ↔ BACKEND MAPPING

  Complete Action Map
  UI Element: Mode Card
  User Action: Click
  IPC Command: set_clean_mode
  Backend Handler: Update mode, optionally re-analyze
  ────────────────────────────────────────
  UI Element: Scope Checkbox
  User Action: Toggle
  IPC Command: toggle_category
  Backend Handler: Update selection state
  ────────────────────────────────────────
  UI Element: "Re-scan" Button
  User Action: Click
  IPC Command: start_analysis
  Backend Handler: Begin fresh scan
  ────────────────────────────────────────
  UI Element: Category Expander
  User Action: Click
  IPC Command: get_category_files
  Backend Handler: Return file list
  ────────────────────────────────────────
  UI Element: "Analyze Again"
  User Action: Click
  IPC Command: start_analysis
  Backend Handler: Re-scan with current mode
  ────────────────────────────────────────
  UI Element: "Clean Selected"
  User Action: Click
  IPC Command: request_confirmation
  Backend Handler: Return confirmation dialog data
  ────────────────────────────────────────
  UI Element: Confirm Dialog "Clean Now"
  User Action: Click
  IPC Command: execute_clean
  Backend Handler: Begin deletion
  ────────────────────────────────────────
  UI Element: Confirm Dialog "Cancel"
  User Action: Click
  IPC Command: (none)
  Backend Handler: Close dialog, return to select
  ────────────────────────────────────────
  UI Element: Progress "Cancel"
  User Action: Click
  IPC Command: cancel_clean
  Backend Handler: Abort operation
  ────────────────────────────────────────
  UI Element: Result "Retry Failed"
  User Action: Click
  IPC Command: retry_failed
  Backend Handler: Re-attempt failed files
  Event Flow (UI Receives)
  ┌───────────────────┬────────────────────────────────────────┬────────────────────────────────────┐
  │       Event       │                Payload                 │            UI Response             │
  ├───────────────────┼────────────────────────────────────────┼────────────────────────────────────┤
  │ analysis_progress │ { percent, current_path, files_found } │ Update progress bar                │
  ├───────────────────┼────────────────────────────────────────┼────────────────────────────────────┤
  │ analysis_complete │ AnalysisResult                         │ Populate scope grid, preview       │
  ├───────────────────┼────────────────────────────────────────┼────────────────────────────────────┤
  │ clean_progress    │ CleanProgress                          │ Update progress, show current file │
  ├───────────────────┼────────────────────────────────────────┼────────────────────────────────────┤
  │ clean_complete    │ CleanResult                            │ Show summary, offer retry          │
  ├───────────────────┼────────────────────────────────────────┼────────────────────────────────────┤
  │ clean_error       │ CleanError                             │ Show error toast, log              │
  └───────────────────┴────────────────────────────────────────┴────────────────────────────────────┘
  ---
  ERROR HANDLING MATRIX
  ┌──────────────────────────┬────────────────┬─────────────────────────────┬───────────────────┐
  │        Error Type        │  User Impact   │         UI Response         │     Recovery      │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ Scan fails to start      │ Cannot analyze │ Error message, retry button │ Retry scan        │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ File access denied       │ File skipped   │ Warning in summary          │ Elevate & retry   │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ File in use              │ File skipped   │ Show locking process        │ Close app & retry │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ Disk full                │ Cannot proceed │ Error, abort                │ Free space, retry │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ Network path unavailable │ Files skipped  │ Warning badge               │ Reconnect, retry  │
  ├──────────────────────────┼────────────────┼─────────────────────────────┼───────────────────┤
  │ Unexpected IO error      │ File skipped   │ Log error, continue         │ Retry individual  │
  └──────────────────────────┴────────────────┴─────────────────────────────┴───────────────────┘
  ---
  STATE DIAGRAM

                      ┌─────────────┐
                      │    IDLE     │
                      └──────┬──────┘
                             │ User clicks mode / starts scan
                             ▼
                      ┌─────────────┐
                ┌─────│  ANALYZING  │─────┐
                │     └──────┬──────┘     │
          Error │            │ Complete   │ Cancel
                ▼            ▼            ▼
          ┌─────────┐  ┌─────────────┐  ┌─────────┐
          │  ERROR  │  │  SELECTING  │  │  IDLE   │
          └────┬────┘  └──────┬──────┘  └─────────┘
               │              │ User clicks "Clean Selected"
          Retry│              ▼
               │       ┌─────────────┐
               └──────▶│ CONFIRMING  │
                       └──────┬──────┘
                              │ User confirms
                              ▼
                       ┌─────────────┐
                 ┌─────│  EXECUTING  │─────┐
                 │     └──────┬──────┘     │
           Error │            │ Complete   │ Cancel
                 ▼            ▼            ▼
           ┌─────────┐  ┌─────────────┐  ┌──────────┐
           │ PARTIAL │  │  COMPLETE   │  │ CANCELED │
           └────┬────┘  └──────┬──────┘  └────┬─────┘
                │              │              │
                └──────────────┴──────────────┘
                               │
                               ▼
                        ┌─────────────┐
                        │    IDLE     │
                        └─────────────┘

  ---
  IMPLEMENTATION SEQUENCE

  When Phase 0 (Tauri) is complete, Clean implementation follows this order:

  Week 1: Scanner Foundation
  ├── Implement directory walker
  ├── Create classification rules loader
  ├── Build file enumeration with size calculation
  └── Unit tests for scanner

  Week 2: Analysis Pipeline
  ├── Implement mode-specific scanning
  ├── Build progress streaming
  ├── Create analysis result aggregation
  └── Wire to UI (analysis display)

  Week 3: Selection & Confirmation
  ├── Implement selection state management
  ├── Build confirmation dialog logic
  ├── Create risk aggregation
  └── Wire to UI (selection controls)

  Week 4: Execution Engine
  ├── Implement deletion with error handling
  ├── Build audit logging
  ├── Create progress streaming
  └── Wire to UI (progress display)

  Week 5: Polish & Safety
  ├── Locked file detection
  ├── Permission escalation flow
  ├── Cancellation support
  ├── End-to-end testing

  ---
  DELIVERABLE SUMMARY

  This plan provides:
  ┌───────────────────────────────────┬───────────────────────────────────┐
  │            Requirement            │             Delivered             │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ Functional execution plan         │ ✅ 4-phase pipeline defined       │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ UI → Backend mapping              │ ✅ Complete action/command table  │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ Safety mechanisms                 │ ✅ 5 safety layers documented     │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ Analyze/Select/Execute separation │ ✅ Clear phase boundaries         │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ Error handling                    │ ✅ Matrix with recovery paths     │
  ├───────────────────────────────────┼───────────────────────────────────┤
  │ State management                  │ ✅ State diagram with transitions │
  └───────────────────────────────────┴───────────────────────────────────┘
  ---
  Clean Module — Real Execution Planning: COMPLETE

  Ready for implementation authorization when Phase 0 (Tauri setup) is approved.

✻ Worked for 1m 36s

> Akkoord

● Clean Module — Real Execution Planning: LOCKED & APPROVED

  ---
  Current Project Status
  ┌─────────────────────────────┬─────────────────────────────────────────┐
  │          Component          │                 Status                  │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ UI/UX Design                │ ✅ Complete                             │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Desktop Architecture        │ ✅ Documented                           │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Technical Architecture      │ ✅ Approved                             │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Implementation Roadmap      │ ✅ Approved                             │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Clean Module UI             │ ✅ Complete                             │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Clean Module Execution Plan │ ✅ Approved                             │
  ├─────────────────────────────┼─────────────────────────────────────────┤
  │ Phase 0 (Tauri Setup)       │ ⏸ Deferred (awaiting Rust               │
  │                             │ installation)                           │
  └─────────────────────────────┴─────────────────────────────────────────┘
  ---
  Ready For

  When you're ready to proceed:

  1. Resume Phase 0 — Install Rust, initialize Tauri, wire UI to native shell
  2. Additional UI Work — Refine other modules (Analyzer, Security, Performance, Maintenance)
  3. Other Direction — As you see fit

  Awaiting your next instruction.

  Todos · ctrl+t to hide todos
  [ ] Define Clean module functional architecture
  [ ] Map UI actions to backend responsibilities
  [ ] Design safety mechanisms (preview, undo, confirm)
  [ ] Define Analyze → Select → Execute pipeline
  [ ] Document error handling and edge cases