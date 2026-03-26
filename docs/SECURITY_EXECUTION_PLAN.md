# Security Module - Functional Architecture & Execution Plan

## Overview

The Security module serves as the **asset protection center** of DeadBYTE, providing comprehensive security auditing to identify sensitive files, exposure risks, stale credentials, and permission issues. It informs users of potential vulnerabilities without causing alarm, offering clear, actionable recommendations.

**Core Philosophy**: Detect thoroughly, communicate calmly, recommend actions, never destroy without consent.

---

## 1. Execution Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        SECURITY PIPELINE                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │   SCAN   │───▶│  ASSESS  │───▶│ PRESENT  │───▶│ RECOMMEND│              │
│  │          │    │          │    │          │    │          │              │
│  │ Discover │    │ Classify │    │ Display  │    │ Guide to │              │
│  │ assets   │    │ & score  │    │ findings │    │ action   │              │
│  └──────────┘    └──────────┘    └──────────┘    └──────────┘              │
│       │               │               │               │                     │
│       ▼               ▼               ▼               ▼                     │
│  Core Scanner    Risk Engine      UI Updates     Action Plans               │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Phase 1: SCAN (Discovery)
- Use Core Scanner to find potentially sensitive files
- Match patterns for credentials, keys, tokens, configs
- Identify files in public/shared locations
- Track file ages and access patterns

### Phase 2: ASSESS (Risk Classification)
- Classify findings by threat category
- Calculate risk scores based on multiple factors
- Identify stale credentials needing rotation
- Analyze file permissions

### Phase 3: PRESENT (Display)
- Update security grade and metrics
- Render findings by category
- Generate insights with context
- Show detailed item information

### Phase 4: RECOMMEND (Action)
- Provide clear, non-destructive recommendations
- Offer safe remediation options
- Support handoff to Clean if applicable
- Enable export for security audits

---

## 2. Security Domains

### 2.1 Domain Definitions

| Domain | Description | Risk Level | Primary Action |
|--------|-------------|------------|----------------|
| **Sensitive Files** | Private keys, tokens, credentials, .env files | High | Move or protect |
| **Exposure Risk** | Sensitive data in public/shared locations | Critical | Relocate immediately |
| **Stale Credentials** | Keys/tokens older than rotation threshold | Medium | Rotate or revoke |
| **Permission Issues** | Overly permissive file access | Medium | Restrict access |

### 2.2 Detection Patterns

```javascript
const SECURITY_PATTERNS = {
  sensitive_files: {
    // Private Keys
    extensions: ['pem', 'key', 'pfx', 'p12', 'jks', 'keystore'],
    filenames: ['id_rsa', 'id_ed25519', 'id_ecdsa', '*.key'],

    // Credentials & Tokens
    patterns: [
      '.env', '.env.*',
      'credentials.json', 'credentials.xml',
      'secrets.json', 'secrets.yaml', 'secrets.yml',
      'config.json', 'config.yaml',  // if contains password/key
      '*password*', '*credential*', '*secret*',
      'token.json', 'auth.json',
      '.npmrc', '.pypirc',  // package manager credentials
      '.docker/config.json',
      'kubeconfig', '.kube/config'
    ],

    // Database files that may contain sensitive data
    databases: ['*.db', '*.sqlite', '*.sqlite3', '*.kdbx', '*.1pif']
  },

  exposure_locations: {
    // High-risk locations (public folders)
    critical: [
      '%PUBLIC%',
      '%USERPROFILE%\\Desktop',  // if shared
      'C:\\Users\\Public',
      '*\\OneDrive\\Public',
      '*\\Dropbox\\Public'
    ],

    // Medium-risk locations (easily accessible)
    elevated: [
      '%USERPROFILE%\\Downloads',
      '%USERPROFILE%\\Documents',
      '*\\OneDrive',
      '*\\Dropbox'
    ]
  },

  stale_thresholds: {
    critical: 365,   // 1 year - definitely needs rotation
    warning: 180,    // 6 months - consider rotation
    info: 90         // 3 months - track for awareness
  }
};
```

---

## 3. UI ↔ Backend Mapping

### 3.1 Scan Mode Selection

| UI Element | Backend Command | Parameters | Response |
|------------|-----------------|------------|----------|
| Quick Audit card | `security_start_audit` | `{ mode: "quick", checks: [...] }` | `{ audit_id, scope_summary }` |
| Full Audit card | `security_start_audit` | `{ mode: "full", checks: [...] }` | `{ audit_id, scope_summary }` |
| Custom Audit card | Opens check selector | N/A | N/A |
| Check toggles | Stored in UI state | N/A | N/A |
| Start Audit button | `security_start_audit` | `{ mode, checks, targets? }` | `{ audit_id }` |

### 3.2 Audit Modes Definition

```javascript
const AUDIT_MODES = {
  quick: {
    checks: ['sensitive_files', 'exposure_risk'],
    targets: ['%USERPROFILE%\\Downloads', '%USERPROFILE%\\Desktop', '%USERPROFILE%\\Documents'],
    depth: 3,
    timeout: 60000  // 1 minute
  },
  full: {
    checks: ['sensitive_files', 'exposure_risk', 'stale_credentials', 'permissions'],
    targets: ['%USERPROFILE%'],
    depth: 10,
    timeout: 300000  // 5 minutes
  },
  custom: {
    checks: [],  // User-selected
    targets: [], // User-selected or default
    depth: 10,
    timeout: 300000
  }
};
```

### 3.3 Progress Updates (Backend → UI)

```javascript
// Backend emits events during audit
event: 'security_progress'
payload: {
  audit_id: string,
  phase: 'scanning' | 'assessing' | 'complete',
  current_check: string,        // Which security check is running
  items_scanned: number,
  findings_count: number,
  percent_complete: number
}

// UI updates
- Progress indicators
- Running finding counts
- Current check name display
```

### 3.4 Dashboard Elements

| UI Element | Data Source | Update Trigger |
|------------|-------------|----------------|
| Security Grade | `calculateGrade(findings)` | On audit complete |
| Files Audited | `audit_result.items_scanned` | On progress |
| Attention Needed | `count(findings where severity >= medium)` | On complete |
| Recommendations | `count(all_recommendations)` | On complete |
| Critical Issues | `count(findings where severity == critical)` | On complete |
| Insights Panel | `generateInsights(findings)` | On complete |

### 3.5 Finding Categories

| UI Element | Backend Command | Parameters | Response |
|------------|-----------------|------------|----------|
| Finding row | Display only | N/A | N/A |
| Review button | Opens detail panel | N/A | N/A |
| Expand/details | `security_get_finding_details` | `{ finding_id }` | `{ items[], recommendations }` |
| Action buttons | See Action Commands | | |

### 3.6 Action Commands

| UI Action | Backend Command | Parameters | Response |
|-----------|-----------------|------------|----------|
| Move file | `security_move_file` | `{ path, destination }` | `{ success, new_path }` |
| Ignore finding | `security_ignore_finding` | `{ finding_id, reason? }` | `{ success }` |
| Rotate credential | External link or guide | N/A | N/A |
| Restrict permissions | `security_set_permissions` | `{ path, permissions }` | `{ success }` |
| Export report | `security_export_report` | `{ format: 'json' | 'pdf' }` | `{ file_path }` |
| Rescan | `security_start_audit` | Same as initial | Same as initial |

---

## 4. Data Structures

### 4.1 Audit Result

```typescript
interface AuditResult {
  audit_id: string;
  mode: 'quick' | 'full' | 'custom';
  checks_performed: string[];
  started_at: DateTime;
  completed_at: DateTime | null;
  status: 'running' | 'completed' | 'cancelled' | 'error';

  // Metrics
  items_scanned: number;

  // Aggregated by domain
  domains: DomainResult[];

  // Overall assessment
  security_grade: SecurityGrade;
  findings_summary: FindingsSummary;

  // Generated insights
  insights: SecurityInsight[];
}

interface DomainResult {
  id: 'sensitive_files' | 'exposure_risk' | 'stale_credentials' | 'permissions';
  name: string;
  icon: string;
  status: 'safe' | 'warning' | 'attention' | 'critical';
  finding_count: number;
  findings: SecurityFinding[];
  recommendations: Recommendation[];
}

interface SecurityFinding {
  id: string;
  domain_id: string;
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';

  // File information
  path: string;
  name: string;
  size_bytes: number;
  created_at: DateTime;
  modified_at: DateTime;

  // Classification
  file_type: string;           // 'SSH Private Key', 'Environment Variables', etc.
  threat_description: string;   // Human-readable explanation

  // Status
  is_ignored: boolean;
  ignored_reason: string | null;

  // Recommended action
  recommendation: Recommendation;
}

interface Recommendation {
  action: 'move' | 'rotate' | 'restrict' | 'review' | 'delete';
  priority: 'immediate' | 'soon' | 'when_convenient';
  title: string;
  description: string;
  auto_fixable: boolean;
}
```

### 4.2 Security Grading

```typescript
interface SecurityGrade {
  letter: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  score: number;  // 0-100
  description: string;
}

const GRADE_THRESHOLDS = {
  'A+': { min: 98, description: 'Excellent security posture' },
  'A':  { min: 93, description: 'Strong security with minimal concerns' },
  'A-': { min: 90, description: 'Very good security' },
  'B+': { min: 87, description: 'Good protection with minor recommendations' },
  'B':  { min: 83, description: 'Good security, some improvements suggested' },
  'B-': { min: 80, description: 'Adequate security with room for improvement' },
  'C+': { min: 77, description: 'Fair security, action recommended' },
  'C':  { min: 73, description: 'Security concerns present' },
  'C-': { min: 70, description: 'Multiple security issues detected' },
  'D':  { min: 60, description: 'Significant security risks found' },
  'F':  { min: 0,  description: 'Critical security issues require immediate attention' }
};

// Scoring algorithm
function calculateSecurityScore(findings: SecurityFinding[]): number {
  let score = 100;

  for (const finding of findings) {
    if (finding.is_ignored) continue;

    switch (finding.severity) {
      case 'critical': score -= 25; break;
      case 'high':     score -= 10; break;
      case 'medium':   score -= 5;  break;
      case 'low':      score -= 2;  break;
      case 'info':     score -= 0;  break;
    }
  }

  return Math.max(0, score);
}
```

### 4.3 File Classification

```typescript
interface FileClassification {
  type: FileSecurityType;
  sensitivity: 'public' | 'internal' | 'confidential' | 'secret';
  risk_factors: RiskFactor[];
}

type FileSecurityType =
  | 'ssh_private_key'
  | 'ssh_public_key'
  | 'ssl_certificate'
  | 'ssl_private_key'
  | 'api_credential'
  | 'environment_variables'
  | 'database_file'
  | 'password_manager'
  | 'config_with_secrets'
  | 'token_file'
  | 'unknown_sensitive';

interface RiskFactor {
  factor: string;
  description: string;
  severity_modifier: number;  // -1 to +1
}

// Example risk factors
const RISK_FACTORS = {
  in_public_folder: {
    factor: 'in_public_folder',
    description: 'File is in a publicly accessible location',
    severity_modifier: +0.5  // Increases severity
  },
  world_readable: {
    factor: 'world_readable',
    description: 'File can be read by any user',
    severity_modifier: +0.3
  },
  stale_90_days: {
    factor: 'stale_90_days',
    description: 'File has not been modified in 90+ days',
    severity_modifier: +0.1
  },
  in_protected_folder: {
    factor: 'in_protected_folder',
    description: 'File is in a properly protected location',
    severity_modifier: -0.2
  },
  encrypted: {
    factor: 'encrypted',
    description: 'File appears to be encrypted',
    severity_modifier: -0.3
  }
};
```

### 4.4 Insights

```typescript
interface SecurityInsight {
  id: string;
  type: 'warning' | 'info' | 'tip';
  icon: string;
  title: string;
  description: string;
  domain_id: string | null;
  priority: number;
}

const INSIGHT_GENERATORS = {
  ssh_key_in_downloads: (findings) => {
    const sshInDownloads = findings.filter(
      f => f.file_type === 'ssh_private_key' &&
           f.path.toLowerCase().includes('downloads')
    );
    if (sshInDownloads.length > 0) {
      return {
        type: 'warning',
        icon: '!',
        title: 'SSH key found in Downloads',
        description: 'Consider moving to a protected location like ~/.ssh'
      };
    }
    return null;
  },

  stale_api_keys: (findings) => {
    const staleKeys = findings.filter(
      f => f.file_type === 'api_credential' &&
           f.risk_factors.some(r => r.factor.startsWith('stale_'))
    );
    if (staleKeys.length > 0) {
      return {
        type: 'info',
        icon: 'i',
        title: `${staleKeys.length} API keys over 90 days old`,
        description: 'Rotation recommended for security hygiene'
      };
    }
    return null;
  },

  no_public_exposure: (findings) => {
    const publicExposure = findings.filter(
      f => f.domain_id === 'exposure_risk' && !f.is_ignored
    );
    if (publicExposure.length === 0) {
      return {
        type: 'tip',
        icon: '✓',
        title: 'No credentials in public folders',
        description: 'Good security practice maintained'
      };
    }
    return null;
  }
};
```

---

## 5. State Machine

```
                                    ┌─────────────────┐
                                    │      IDLE       │
                                    │                 │
                                    │ No active audit │
                                    └────────┬────────┘
                                             │
                              User selects audit mode
                                             │
                                             ▼
                    ┌─────────────────────────────────────────┐
                    │             CONFIGURING                 │
                    │                                         │
                    │ Custom mode: selecting checks           │
                    │ Quick/Full: auto-proceeds               │
                    └──────────────────┬──────────────────────┘
                                       │
                              User confirms / mode selected
                                       │
                                       ▼
         ┌──────────────────────────────────────────────────────────┐
         │                       AUDITING                            │
         │                                                           │
         │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
         │  │  Scanning   │───▶│  Assessing  │───▶│  Grading    │  │
         │  │   files     │    │   risks     │    │  results    │  │
         │  └─────────────┘    └─────────────┘    └─────────────┘  │
         │                                                           │
         │  Progress: ████████████░░░░░░░░ 60%                      │
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
            │ results   │    │ findings  │    │ + error   │
            └─────┬─────┘    └─────┬─────┘    └─────┬─────┘
                  │                │                │
                  └────────────────┼────────────────┘
                                   │
                                   ▼
                        ┌───────────────────┐
                        │    REVIEWING      │
                        │                   │
                        │ User examines     │
                        │ findings, takes   │
                        │ actions           │
                        └─────────┬─────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
              Take Action      Rescan       Export
                    │             │             │
                    ▼             │             ▼
            ┌───────────┐        │      ┌───────────┐
            │ RESOLVING │        │      │ EXPORTING │
            │           │        │      │           │
            │ Move/     │        │      │ Generate  │
            │ Ignore/   │        │      │ report    │
            │ Restrict  │        │      │           │
            └─────┬─────┘        │      └─────┬─────┘
                  │              │            │
                  ▼              ▼            ▼
            ┌──────────────────────────────────────┐
            │           REVIEWING                   │
            │     (updated findings)               │
            └──────────────────────────────────────┘
```

### State Definitions

```typescript
type SecurityState =
  | { state: 'idle' }
  | { state: 'configuring', mode: 'custom', selected_checks: string[] }
  | { state: 'auditing', audit_id: string, progress: AuditProgress }
  | { state: 'cancelled', audit_id: string, partial_result: AuditResult }
  | { state: 'complete', audit_id: string, result: AuditResult }
  | { state: 'error', audit_id: string, error: SecurityError, partial_result?: AuditResult }
  | { state: 'reviewing', audit_id: string, result: AuditResult }
  | { state: 'resolving', action: ResolutionAction }
  | { state: 'exporting', format: 'json' | 'pdf' };

interface AuditProgress {
  phase: 'scanning' | 'assessing' | 'grading';
  current_check: string;
  items_scanned: number;
  findings_count: number;
  percent_complete: number;
}

interface ResolutionAction {
  finding_id: string;
  action_type: 'move' | 'ignore' | 'restrict';
  in_progress: boolean;
}
```

---

## 6. Core Scanner Integration

### 6.1 Scanner Configuration

```rust
impl SecurityScanner {
    /// Build scanner config for Quick Security Audit
    pub fn quick_audit(checks: &[SecurityCheck]) -> ScanConfig {
        let mut builder = ScanConfigBuilder::new();

        // Target common sensitive file locations
        builder = builder
            .target_expanded("%USERPROFILE%\\Downloads")
            .target_expanded("%USERPROFILE%\\Desktop")
            .target_expanded("%USERPROFILE%\\Documents");

        // Add patterns based on selected checks
        if checks.contains(&SecurityCheck::SensitiveFiles) {
            builder = builder
                .include_extensions(&["pem", "key", "pfx", "p12", "jks"])
                .include_pattern("id_rsa*")
                .include_pattern("id_ed25519*")
                .include_pattern(".env*")
                .include_pattern("credentials.*")
                .include_pattern("secrets.*")
                .include_pattern("*password*")
                .include_pattern("*credential*")
                .include_pattern("*secret*");
        }

        builder
            .max_depth(Some(3))
            .include_hidden(true)
            .timeout(Duration::from_secs(60))
            .optimize_for(OptimizationHint::InteractiveMode)
            .build()
            .expect("Valid quick audit config")
    }

    /// Build scanner config for Full Security Audit
    pub fn full_audit(checks: &[SecurityCheck]) -> ScanConfig {
        let mut builder = ScanConfigBuilder::new()
            .target_expanded("%USERPROFILE%");

        // Extensive pattern matching for all check types
        if checks.contains(&SecurityCheck::SensitiveFiles) {
            builder = add_sensitive_file_patterns(builder);
        }

        if checks.contains(&SecurityCheck::ExposureRisk) {
            builder = builder
                .target_expanded("%PUBLIC%")
                .target("C:\\Users\\Public");
        }

        builder
            .max_depth(Some(10))
            .include_hidden(true)
            .skip_directories(&["node_modules", ".git", "venv", "__pycache__"])
            .timeout(Duration::from_secs(300))
            .optimize_for(OptimizationHint::LargeScan)
            .build()
            .expect("Valid full audit config")
    }
}
```

### 6.2 Finding Classification

```rust
/// Classify a scanned item for security relevance
fn classify_finding(item: &ScannedItem) -> Option<SecurityFinding> {
    let file_type = detect_file_type(item);

    if file_type.is_none() {
        return None;  // Not security-relevant
    }

    let file_type = file_type.unwrap();
    let severity = calculate_base_severity(&file_type);
    let risk_factors = collect_risk_factors(item);
    let adjusted_severity = apply_risk_modifiers(severity, &risk_factors);

    Some(SecurityFinding {
        id: generate_id(),
        domain_id: file_type.domain(),
        severity: adjusted_severity,
        path: item.path.clone(),
        name: item.name.clone(),
        size_bytes: item.size_bytes,
        created_at: item.created_at,
        modified_at: item.modified_at,
        file_type: file_type.display_name(),
        threat_description: generate_threat_description(&file_type, &risk_factors),
        is_ignored: false,
        ignored_reason: None,
        recommendation: generate_recommendation(&file_type, &risk_factors),
    })
}

fn detect_file_type(item: &ScannedItem) -> Option<FileSecurityType> {
    let name = item.name.to_lowercase();
    let ext = item.path.extension().and_then(|e| e.to_str());

    // SSH Keys
    if name.starts_with("id_rsa") || name.starts_with("id_ed25519") {
        if name.ends_with(".pub") {
            return Some(FileSecurityType::SshPublicKey);
        }
        return Some(FileSecurityType::SshPrivateKey);
    }

    // SSL/TLS
    match ext {
        Some("pem") | Some("key") => return Some(FileSecurityType::SslPrivateKey),
        Some("pfx") | Some("p12") => return Some(FileSecurityType::SslCertificate),
        _ => {}
    }

    // Environment files
    if name.starts_with(".env") {
        return Some(FileSecurityType::EnvironmentVariables);
    }

    // Credential files
    if name.contains("credential") || name.contains("secret") {
        return Some(FileSecurityType::ApiCredential);
    }

    // Database files
    match ext {
        Some("db") | Some("sqlite") | Some("sqlite3") => {
            return Some(FileSecurityType::DatabaseFile);
        }
        Some("kdbx") | Some("1pif") => {
            return Some(FileSecurityType::PasswordManager);
        }
        _ => {}
    }

    None
}
```

---

## 7. Error Handling

### 7.1 Error Types

| Error Type | Cause | User Message | Recovery |
|------------|-------|--------------|----------|
| `ACCESS_DENIED` | Permission to read file | "Some files couldn't be accessed" | Continue, note in report |
| `MOVE_FAILED` | Cannot move file | "Failed to move file: [reason]" | Keep in place, suggest manual |
| `PERMISSION_CHANGE_FAILED` | Cannot modify permissions | "Cannot modify permissions" | Suggest manual fix |
| `SCAN_TIMEOUT` | Audit taking too long | "Audit timed out" | Show partial results |
| `PATTERN_ERROR` | Invalid pattern config | Internal error | Use defaults |

### 7.2 Graceful Degradation

```javascript
// Security findings are never catastrophic failures
// Always show what we found, acknowledge what we couldn't check

const ERROR_HANDLING = {
  access_denied: {
    action: 'skip',
    log: true,
    show_in_summary: true,
    summary_text: 'Some protected folders could not be scanned'
  },

  move_failed: {
    action: 'notify_user',
    offer_alternatives: ['manual_move', 'ignore_finding'],
    retry_available: true
  },

  timeout: {
    action: 'show_partial',
    message: 'Scan incomplete - showing findings so far',
    offer_rescan: true
  }
};
```

---

## 8. Security to Clean Handoff

### 8.1 When to Offer Clean Handoff

The Security module can hand off to Clean when:
- User wants to delete a stale credential file
- User wants to remove exposed files (after backup)
- Temporary files discovered during security scan

**NOT** for:
- Active credentials (should be rotated, not deleted)
- Important config files (should be moved/protected)

### 8.2 Handoff Protocol

```javascript
// Prepare security finding for Clean handoff
async function prepareSecurityHandoff(findings) {
  // Filter to cleanable items only
  const cleanableFindings = findings.filter(f =>
    f.recommendation.action === 'delete' &&
    !f.file_type.includes('active_credential')
  );

  if (cleanableFindings.length === 0) {
    return { error: 'No items suitable for Clean module' };
  }

  const handoffId = generateId();

  await store.set(`handoff:${handoffId}`, {
    id: handoffId,
    source: 'security',
    timestamp: Date.now(),
    items: cleanableFindings.map(f => ({
      path: f.path,
      size_bytes: f.size_bytes,
      category: 'security_cleanup',
      risk_level: 'high',  // Extra confirmation in Clean
      original_finding: f.id
    })),
    warning: 'These files were identified as security concerns. Ensure you have rotated any credentials before deletion.'
  });

  return { handoff_id: handoffId };
}
```

### 8.3 Clean Module Reception

```javascript
// Clean module receives security handoff with extra warnings
async function receiveSecurityHandoff(handoffId) {
  const handoff = await store.get(`handoff:${handoffId}`);

  return {
    mode: 'security_import',
    scope: [{
      category: 'security_cleanup',
      items: handoff.items,
      warning: handoff.warning,
      requires_confirmation: true  // Extra confirmation step
    }],
    confirmation_message: 'These items were flagged by Security. Confirm credentials have been rotated before proceeding.'
  };
}
```

---

## 9. Keyboard Shortcuts

| Key | Action | State Requirement |
|-----|--------|-------------------|
| `1` | Start Quick Audit | Idle |
| `2` | Start Full Audit | Idle |
| `3` | Start Custom Audit | Idle |
| `Escape` | Cancel Audit / Close panels | Auditing / Panel open |
| `Enter` | Confirm action | Dialog open |
| `E` | Export Report | Reviewing |
| `R` | Rescan | Reviewing |
| `I` | Ignore selected finding | Finding selected |
| `M` | Move selected file | Finding selected |
| `↑/↓` | Navigate findings | Reviewing |

---

## 10. Communication Principles

### 10.1 Tone Guidelines

| Do | Don't |
|----|-------|
| "3 items need attention" | "3 SECURITY THREATS DETECTED!" |
| "SSH key found in Downloads folder" | "CRITICAL: Your SSH key is exposed!" |
| "Consider moving to a protected location" | "You must fix this immediately!" |
| "Rotation recommended" | "Your credentials are compromised!" |

### 10.2 Severity Language

| Severity | Badge Text | Color | Example Message |
|----------|------------|-------|-----------------|
| Critical | Critical | Red | "Credentials in public folder require immediate attention" |
| High | High | Orange | "Private key found in accessible location" |
| Medium | Medium | Yellow | "API key older than recommended rotation period" |
| Low | Low | Blue | "Config file detected - verify no sensitive data" |
| Info | Info | Gray | "Public key found (informational only)" |

### 10.3 Recommendation Language

```javascript
const RECOMMENDATION_TEMPLATES = {
  move: {
    title: 'Move to protected location',
    description: 'Consider relocating this file to a folder with restricted access, such as ~/.ssh for SSH keys.'
  },
  rotate: {
    title: 'Consider credential rotation',
    description: 'This credential has been in use for {age}. Regular rotation improves security posture.'
  },
  restrict: {
    title: 'Restrict file permissions',
    description: 'This file is currently accessible to other users. Consider restricting to owner-only access.'
  },
  review: {
    title: 'Review file contents',
    description: 'This file may contain sensitive data. Verify its contents and location are appropriate.'
  }
};
```

---

## 11. Testing Checklist

### 11.1 Unit Tests

- [ ] File type detection accuracy
- [ ] Severity calculation
- [ ] Risk factor modifiers
- [ ] Security grade calculation
- [ ] Insight generation

### 11.2 Integration Tests

- [ ] Quick audit covers expected locations
- [ ] Full audit handles large directories
- [ ] Custom audit respects check selection
- [ ] Move file operation works correctly
- [ ] Ignore finding persists across sessions
- [ ] Export generates valid report

### 11.3 Edge Cases

- [ ] Encrypted/protected files
- [ ] Very long file paths
- [ ] Files with special characters
- [ ] Locked files
- [ ] Symbolic links to sensitive files
- [ ] Empty directories
- [ ] Network drives

### 11.4 UX Tests

- [ ] Progress updates are smooth
- [ ] Findings are clearly presented
- [ ] Actions complete with feedback
- [ ] Error messages are helpful
- [ ] Grade changes reflect actions

---

## 12. Implementation Priority

### Phase 1: Core Detection
1. File type detection patterns
2. Basic severity classification
3. Core Scanner integration
4. Progress reporting
5. UI integration

### Phase 2: Assessment
1. Risk factor calculation
2. Security grading algorithm
3. Insight generation
4. Recommendation engine

### Phase 3: Actions
1. Move file functionality
2. Ignore finding (with persistence)
3. Export report
4. Permission modification

### Phase 4: Polish
1. Stale credential detection
2. Permission analysis
3. Clean module handoff
4. Accessibility

---

## Document Status

| Section | Status |
|---------|--------|
| Execution Pipeline | ✅ Complete |
| Security Domains | ✅ Complete |
| UI ↔ Backend Mapping | ✅ Complete |
| Data Structures | ✅ Complete |
| State Machine | ✅ Complete |
| Core Scanner Integration | ✅ Complete |
| Error Handling | ✅ Complete |
| Clean Handoff | ✅ Complete |
| Keyboard Shortcuts | ✅ Complete |
| Communication Principles | ✅ Complete |
| Testing Checklist | ✅ Complete |

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Status**: READY FOR APPROVAL
