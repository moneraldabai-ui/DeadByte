/**
 * DeadBYTE Main Application Script
 * =================================
 * Main renderer process script for the DeadBYTE Electron application.
 *
 * Architecture:
 * - Icons: Centralized SVG icon definitions
 * - Debug: Conditional logging system (DEBUG_MODE)
 * - Controllers: UI components (Skull, Navigation, TitleBar, etc.)
 * - Managers: Feature modules (Settings, Startup, Junk, Security, Maintenance)
 * - Dashboard: Home page statistics and actions
 * - File Operations: Browser, permissions, force delete
 * - Utilities: Shared functions (formatBytes, escapeHtml)
 *
 * All classes are instantiated in the DOMContentLoaded handler
 * and exposed via window.DeadBYTE for cross-component access.
 */

// ============================================
// CENTRALIZED ICON SYSTEM
// ============================================

const Icons = {
  // Status icons
  success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>`,

  error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="15" y1="9" x2="9" y2="15"/>
    <line x1="9" y1="9" x2="15" y2="15"/>
  </svg>`,

  warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,

  // Action icons
  refresh: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="1 4 1 10 7 10"/>
    <path d="M3.51 15a9 9 0 102.13-9.36L1 10"/>
  </svg>`,

  delete: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/>
  </svg>`,

  close: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>`,

  check: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polyline points="20 6 9 17 4 12"/>
  </svg>`,

  // File/folder icons
  folder: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
  </svg>`,

  file: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/>
    <polyline points="13 2 13 9 20 9"/>
  </svg>`,

  // Security icons
  shield: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>`,

  shieldCheck: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <path d="M9 12l2 2 4-4"/>
  </svg>`,

  key: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>
  </svg>`,

  lock: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0110 0v4"/>
  </svg>`,

  // System icons
  settings: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/>
  </svg>`,

  database: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <ellipse cx="12" cy="5" rx="9" ry="3"/>
    <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
    <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
  </svg>`,

  hardDrive: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <line x1="22" y1="12" x2="2" y2="12"/>
    <path d="M5.45 5.11L2 12v6a2 2 0 002 2h16a2 2 0 002-2v-6l-3.45-6.89A2 2 0 0016.76 4H7.24a2 2 0 00-1.79 1.11z"/>
    <line x1="6" y1="16" x2="6.01" y2="16"/>
    <line x1="10" y1="16" x2="10.01" y2="16"/>
  </svg>`,

  cpu: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2"/>
    <rect x="9" y="9" width="6" height="6"/>
    <line x1="9" y1="1" x2="9" y2="4"/>
    <line x1="15" y1="1" x2="15" y2="4"/>
    <line x1="9" y1="20" x2="9" y2="23"/>
    <line x1="15" y1="20" x2="15" y2="23"/>
    <line x1="20" y1="9" x2="23" y2="9"/>
    <line x1="20" y1="14" x2="23" y2="14"/>
    <line x1="1" y1="9" x2="4" y2="9"/>
    <line x1="1" y1="14" x2="4" y2="14"/>
  </svg>`,

  // Misc icons
  clock: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>`,

  eye: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>`,

  globe: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/>
  </svg>`,

  zap: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>`,

  tool: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
  </svg>`,

  // Get icon by name with optional size
  get(name, size = null) {
    const icon = this[name];
    if (!icon) return '';
    if (!size) return icon;
    return icon.replace(/width="\d+"/, `width="${size}"`).replace(/height="\d+"/, `height="${size}"`);
  }
};

// ============================================
// DEBUG MODE CONFIGURATION
// ============================================

const DEBUG_MODE = false; // Set to true to enable console logging

const Debug = {
  log(...args) {
    if (DEBUG_MODE) console.log('[DeadBYTE]', ...args);
  },
  warn(...args) {
    if (DEBUG_MODE) console.warn('[DeadBYTE]', ...args);
  },
  error(...args) {
    // Always log errors
    console.error('[DeadBYTE]', ...args);
  },
  group(label) {
    if (DEBUG_MODE) console.group(label);
  },
  groupEnd() {
    if (DEBUG_MODE) console.groupEnd();
  }
};

// ============================================
// SKULL ANIMATION CONTROLLER
// ============================================

class SkullController {
  constructor() {
    this.wrapper = document.querySelector('.skull-wrapper');
    this.svgObject = document.getElementById('skull-object');
    this.svgDoc = null;
    this.currentState = 'idle';
    this.animationFrameId = null;

    // Wait for SVG to load
    if (this.svgObject) {
      this.svgObject.addEventListener('load', () => this.initSVG());
    }
  }

  initSVG() {
    try {
      this.svgDoc = this.svgObject.contentDocument;
      if (this.svgDoc) {
        this.setupAnimations();
        this.setState('idle');
      }
    } catch (e) {
      console.warn('Could not access SVG document:', e);
    }
  }

  setupAnimations() {
    // Get SVG elements
    this.elements = {
      skullMain: this.svgDoc?.getElementById('skull-main'),
      leftEye: this.svgDoc?.getElementById('left-eye'),
      rightEye: this.svgDoc?.getElementById('right-eye'),
      leftEyeGlow: this.svgDoc?.getElementById('left-eye-glow'),
      rightEyeGlow: this.svgDoc?.getElementById('right-eye-glow'),
      lowerJaw: this.svgDoc?.getElementById('lower-jaw'),
      crossboneLeft: this.svgDoc?.getElementById('crossbone-left'),
      crossboneRight: this.svgDoc?.getElementById('crossbone-right'),
    };
  }

  setState(state) {
    if (this.wrapper) {
      this.wrapper.dataset.state = state;
    }
    this.currentState = state;

    // Apply state-specific animations
    switch (state) {
      case 'idle':
        this.animateIdle();
        break;
      case 'scanning':
        this.animateScanning();
        break;
      case 'deleting':
        this.animateDeleting();
        break;
      case 'error':
        this.animateError();
        break;
      case 'success':
        this.animateSuccess();
        break;
    }
  }

  animateIdle() {
    // CSS handles idle animations via data-state attribute
    this.stopCustomAnimations();
  }

  animateScanning() {
    // Enhanced scanning animation
    if (!this.elements) return;
    if (this.elements.crossboneLeft) {
      this.elements.crossboneLeft.style.animation = 'bones-rotate-scanning 4s linear infinite';
    }
    if (this.elements.crossboneRight) {
      this.elements.crossboneRight.style.animation = 'bones-rotate-scanning 4s linear infinite reverse';
    }
  }

  animateDeleting() {
    // Jaw chomp animation
    if (!this.elements) return;
    let jawOpen = false;
    const jawInterval = setInterval(() => {
      if (this.currentState !== 'deleting') {
        clearInterval(jawInterval);
        return;
      }
      if (this.elements?.lowerJaw) {
        jawOpen = !jawOpen;
        this.elements.lowerJaw.style.transform = jawOpen ? 'translateY(8px)' : 'translateY(0)';
      }
    }, 300);
  }

  animateError() {
    // Shake animation - CSS handles this
    setTimeout(() => {
      if (this.currentState === 'error') {
        this.setState('idle');
      }
    }, 2000);
  }

  animateSuccess() {
    // Return to idle after success animation
    setTimeout(() => {
      if (this.currentState === 'success') {
        this.setState('idle');
      }
    }, 2000);
  }

  stopCustomAnimations() {
    if (!this.elements) return; // Guard against elements not yet initialized
    if (this.elements.crossboneLeft) {
      this.elements.crossboneLeft.style.animation = '';
    }
    if (this.elements.crossboneRight) {
      this.elements.crossboneRight.style.animation = '';
    }
    if (this.elements.lowerJaw) {
      this.elements.lowerJaw.style.transform = '';
    }
  }
}


// ============================================
// NAVIGATION CONTROLLER
// ============================================

class NavigationController {
  constructor(skullController) {
    this.skullController = skullController;
    this.navItems = document.querySelectorAll('.nav-item');
    this.modulePages = document.querySelectorAll('.module-page');
    this.mainContent = document.querySelector('.main-content');
    this.currentModule = 'home';

    this.init();
  }

  init() {
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const module = item.dataset.module;
        if (module) {
          this.navigateTo(module);
        }
      });
    });

    // Handle browser back/forward
    window.addEventListener('popstate', (e) => {
      if (e.state && e.state.module) {
        this.navigateTo(e.state.module, false);
      }
    });

    // Check initial hash
    const hash = window.location.hash.replace('#', '') || 'home';
    this.navigateTo(hash, false);
  }

  navigateTo(module, pushState = true) {
    // Update nav items
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.module === module);
    });

    // Update module pages
    this.modulePages.forEach(page => {
      const pageModule = page.id.replace('page-', '');
      page.classList.toggle('active', pageModule === module);
    });

    // Update main content data attribute for theming
    if (this.mainContent) {
      this.mainContent.dataset.module = module;
    }

    // Update skull state based on module
    this.updateSkullForModule(module);

    // Update URL
    if (pushState) {
      window.history.pushState({ module }, '', `#${module}`);
    }

    this.currentModule = module;
  }

  updateSkullForModule(module) {
    // Different skull behaviors per module
    switch (module) {
      case 'home':
        this.skullController?.setState('idle');
        break;
      case 'delete':
        // Skull ready to bite
        this.skullController?.setState('idle');
        break;
      case 'analyzer':
      case 'security':
        // Scanning state
        this.skullController?.setState('idle');
        break;
      case 'performance':
      case 'maintenance':
        this.skullController?.setState('idle');
        break;
      case 'files':
        // Files module - ready state
        this.skullController?.setState('idle');
        // Expand the files submenu
        const expandable = document.getElementById('nav-files-expandable');
        if (expandable) {
          expandable.classList.add('expanded');
        }
        break;
      default:
        this.skullController?.setState('idle');
    }
  }
}


// ============================================
// TITLE BAR CONTROLLER (For Tauri)
// ============================================

class TitleBarController {
  constructor() {
    this.minimizeBtn = document.getElementById('btn-minimize');
    this.maximizeBtn = document.getElementById('btn-maximize');
    this.closeBtn = document.getElementById('btn-close');
    this.titleBar = document.querySelector('.title-bar');

    this.init();
  }

  init() {
    // Connect to Electron window controls via preload API
    this.minimizeBtn?.addEventListener('click', () => {
      if (window.deadbyte?.window) {
        window.deadbyte.window.minimize();
      } else {
        Debug.log('Minimize clicked (Electron not available)');
      }
    });

    this.maximizeBtn?.addEventListener('click', async () => {
      if (window.deadbyte?.window) {
        window.deadbyte.window.maximize();
        // Update button icon based on maximized state
        const isMaximized = await window.deadbyte.window.isMaximized();
        this.updateMaximizeIcon(isMaximized);
      } else {
        Debug.log('Maximize clicked (Electron not available)');
      }
    });

    this.closeBtn?.addEventListener('click', () => {
      if (window.deadbyte?.window) {
        window.deadbyte.window.close();
      } else {
        Debug.log('Close clicked (Electron not available)');
      }
    });

    // Make title bar draggable for window movement
    if (this.titleBar) {
      this.titleBar.style.webkitAppRegion = 'drag';
      // Buttons should not be draggable
      this.titleBar.querySelectorAll('button').forEach(btn => {
        btn.style.webkitAppRegion = 'no-drag';
      });
    }
  }

  updateMaximizeIcon(isMaximized) {
    if (!this.maximizeBtn) return;
    const svg = this.maximizeBtn.querySelector('svg');
    if (!svg) return;

    if (isMaximized) {
      // Restore icon (two overlapping rectangles)
      svg.innerHTML = `
        <rect x="3" y="4" width="6" height="6" rx="1" fill="none"/>
        <rect x="5" y="2" width="6" height="6" rx="1" fill="none"/>
      `;
    } else {
      // Maximize icon (single rectangle)
      svg.innerHTML = `
        <rect x="2" y="2" width="8" height="8" rx="1"/>
      `;
    }
  }
}


// ============================================
// TYPEWRITER TITLE ANIMATION
// ============================================

class TypewriterTitleController {
  constructor() {
    this.titleElement = document.getElementById('app-title');
    this.contentElement = this.titleElement?.querySelector('.typewriter-content');
    this.cursorElement = this.titleElement?.querySelector('.typewriter-cursor');
    this.fullText = 'DeadBYTE';
    this.typingSpeed = 80;
    this.repeatInterval = 30000;
    this.currentIndex = 0;
    this.isTyping = false;

    if (this.contentElement && this.cursorElement) {
      this.init();
    }
  }

  init() {
    // Start the typewriter effect
    this.startTypewriter();

    // Repeat every 30 seconds
    setInterval(() => {
      this.startTypewriter();
    }, this.repeatInterval);
  }

  startTypewriter() {
    if (this.isTyping) return;
    this.isTyping = true;
    this.currentIndex = 0;
    this.contentElement.innerHTML = '';
    this.cursorElement.classList.remove('hidden');

    this.typeNextChar();
  }

  typeNextChar() {
    if (this.currentIndex < this.fullText.length) {
      this.renderText(this.fullText.substring(0, this.currentIndex + 1));
      this.currentIndex++;
      setTimeout(() => this.typeNextChar(), this.typingSpeed);
    } else {
      // Typing complete - blink cursor 3 more times then hide
      this.blinkAndHideCursor();
    }
  }

  renderText(text) {
    // Split into "Dead" (white) and "BYTE" (cyan with glow)
    let html = '';
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      if (i < 4) {
        // "Dead" part - white
        html += `<span style="color: #ffffff">${char}</span>`;
      } else {
        // "BYTE" part - cyan with glow class
        html += `<span class="typewriter-byte">${char}</span>`;
      }
    }
    this.contentElement.innerHTML = html;
  }

  blinkAndHideCursor() {
    let blinkCount = 0;
    const blinkInterval = setInterval(() => {
      blinkCount++;
      if (blinkCount >= 6) { // 3 full blinks (on/off = 2 states per blink)
        clearInterval(blinkInterval);
        this.cursorElement.classList.add('hidden');
        this.isTyping = false;
      }
    }, 300);
  }
}


// ============================================
// BUTTON INTERACTIONS
// ============================================

class ButtonController {
  constructor(skullController) {
    this.skullController = skullController;
    this.init();
  }

  init() {
    // Quick action buttons on home page
    const quickScanBtn = document.querySelector('[data-action="quick-scan"]');
    const quickCleanBtn = document.querySelector('[data-action="quick-clean"]');

    // Demo: Add click handlers for buttons
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        // Prevent double-click
        if (btn.classList.contains('loading')) return;

        // Add ripple effect
        this.addRipple(btn, e);
      });
    });

    // Interactive cards
    document.querySelectorAll('.card-interactive').forEach(card => {
      card.addEventListener('click', () => {
        // Demo: trigger scanning animation
        if (this.skullController) {
          this.skullController.setState('scanning');
          setTimeout(() => {
            this.skullController.setState('success');
          }, 3000);
        }
      });
    });
  }

  addRipple(element, event) {
    const ripple = document.createElement('span');
    const rect = element.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    ripple.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      left: ${x}px;
      top: ${y}px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      transform: scale(0);
      animation: ripple 0.6s ease-out;
      pointer-events: none;
    `;

    element.style.position = 'relative';
    element.style.overflow = 'hidden';
    element.appendChild(ripple);

    setTimeout(() => ripple.remove(), 600);
  }
}


// ============================================
// PROGRESS ANIMATIONS
// ============================================

class ProgressController {
  constructor() {
    this.progressBars = document.querySelectorAll('.progress-bar');
    this.init();
  }

  init() {
    // Animate progress bars on page load
    this.progressBars.forEach(bar => {
      const width = bar.style.width;
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.width = width;
      }, 100);
    });
  }

  updateProgress(element, value) {
    if (element) {
      element.style.width = `${value}%`;
    }
  }
}


// ============================================
// MODAL CONTROLLER
// ============================================

class ModalController {
  constructor() {
    this.overlays = document.querySelectorAll('.modal-overlay');
    this.dynamicOverlay = null;
    this.init();
  }

  init() {
    this.overlays.forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.close(overlay);
        }
      });

      const closeBtn = overlay.querySelector('.modal-close');
      closeBtn?.addEventListener('click', () => this.close(overlay));
    });
  }

  open(modalId) {
    const overlay = document.getElementById(modalId);
    if (overlay) {
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
  }

  close(overlay) {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // Dynamic modal support - creates modal from content
  show({ content, size = 'md', closable = true }) {
    // Remove existing dynamic modal IMMEDIATELY (not animated)
    if (this.dynamicOverlay) {
      this.dynamicOverlay.remove();
      this.dynamicOverlay = null;
    }

    // Create overlay
    this.dynamicOverlay = document.createElement('div');
    this.dynamicOverlay.className = 'modal-overlay dynamic-modal open';
    this.dynamicOverlay.innerHTML = `
      <div class="modal modal-${size}">
        ${closable ? `
          <button class="modal-close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        ` : ''}
        <div class="modal-content">
          ${content}
        </div>
      </div>
    `;

    document.body.appendChild(this.dynamicOverlay);
    document.body.style.overflow = 'hidden';

    // Bind close events
    if (closable) {
      this.dynamicOverlay.addEventListener('click', (e) => {
        if (e.target === this.dynamicOverlay) {
          this.hide();
        }
      });
      this.dynamicOverlay.querySelector('.modal-close')?.addEventListener('click', () => this.hide());
    }
  }

  hide() {
    if (this.dynamicOverlay) {
      this.dynamicOverlay.classList.remove('open');
      setTimeout(() => {
        this.dynamicOverlay?.remove();
        this.dynamicOverlay = null;
      }, 200);
      document.body.style.overflow = '';
    }
  }
}


// ============================================
// KEYBOARD SHORTCUTS
// ============================================

class KeyboardController {
  constructor(navController) {
    this.navController = navController;
    this.init();
  }

  init() {
    document.addEventListener('keydown', (e) => {
      // Alt + number for quick navigation
      if (e.altKey && !e.ctrlKey && !e.shiftKey) {
        switch (e.key) {
          case '1':
            this.navController.navigateTo('home');
            break;
          case '2':
            this.navController.navigateTo('clean');
            break;
          case '3':
            this.navController.navigateTo('analyzer');
            break;
          case '4':
            this.navController.navigateTo('security');
            break;
          case '5':
            this.navController.navigateTo('performance');
            break;
          case '6':
            this.navController.navigateTo('maintenance');
            break;
          case '7':
            this.navController.navigateTo('files');
            break;
          case '0':
            this.navController.navigateTo('settings');
            break;
        }
      }

      // Escape to close modals
      if (e.key === 'Escape') {
        document.querySelectorAll('.modal-overlay.open').forEach(overlay => {
          overlay.classList.remove('open');
        });
      }
    });
  }
}


// ============================================
// PARTICLE SYSTEM (Ambient Effects)
// ============================================

class ParticleSystem {
  constructor() {
    this.container = document.querySelector('.skull-container');
    this.particles = [];
    this.maxParticles = 15;
    this.isActive = true;

    if (this.container) {
      this.init();
    }
  }

  init() {
    // Create particle container
    this.particleContainer = document.createElement('div');
    this.particleContainer.className = 'particle-container';
    this.particleContainer.style.cssText = `
      position: absolute;
      inset: 0;
      pointer-events: none;
      overflow: hidden;
    `;
    this.container.appendChild(this.particleContainer);

    // Start particle generation
    this.generateParticles();
  }

  generateParticles() {
    if (!this.isActive) return;

    if (this.particles.length < this.maxParticles) {
      this.createParticle();
    }

    setTimeout(() => this.generateParticles(), 500 + Math.random() * 1000);
  }

  createParticle() {
    const particle = document.createElement('div');
    const size = 2 + Math.random() * 3;
    const startX = Math.random() * 100;
    const duration = 4 + Math.random() * 4;
    const delay = Math.random() * 2;

    particle.style.cssText = `
      position: absolute;
      width: ${size}px;
      height: ${size}px;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 50%;
      left: ${startX}%;
      bottom: -10px;
      opacity: 0;
      animation: particle-float ${duration}s ease-out ${delay}s forwards;
      --float-offset: ${(Math.random() - 0.5) * 50}px;
    `;

    this.particleContainer.appendChild(particle);
    this.particles.push(particle);

    // Remove particle after animation
    setTimeout(() => {
      particle.remove();
      this.particles = this.particles.filter(p => p !== particle);
    }, (duration + delay) * 1000);
  }

  stop() {
    this.isActive = false;
  }

  start() {
    this.isActive = true;
    this.generateParticles();
  }
}


// ============================================
// GIF DISPLAY CONTROLLER
// ============================================

class GifDisplayController {
  constructor() {
    this.container = document.getElementById('gif-display');
    this.images = document.querySelectorAll('.gif-image');
    this.indicators = document.querySelectorAll('.gif-indicator');
    this.currentIndex = 1;
    this.isTransitioning = false;

    if (this.container) {
      this.init();
    }
  }

  init() {
    // Bind indicator clicks
    this.indicators.forEach(indicator => {
      indicator.addEventListener('click', (e) => {
        const target = parseInt(e.currentTarget.dataset.target, 10);
        if (target && target !== this.currentIndex) {
          this.switchTo(target);
        }
      });
    });

    // Keyboard navigation (1-4 keys when focused)
    this.container.addEventListener('keydown', (e) => {
      const key = parseInt(e.key, 10);
      if (key >= 1 && key <= 4 && key !== this.currentIndex) {
        this.switchTo(key);
      }
    });

    // Make container focusable for keyboard nav
    this.container.setAttribute('tabindex', '0');
  }

  switchTo(index) {
    if (this.isTransitioning || index === this.currentIndex) return;

    this.isTransitioning = true;

    // Find current and target elements
    const currentImage = document.querySelector(`.gif-image[data-index="${this.currentIndex}"]`);
    const targetImage = document.querySelector(`.gif-image[data-index="${index}"]`);
    const currentIndicator = document.querySelector(`.gif-indicator[data-target="${this.currentIndex}"]`);
    const targetIndicator = document.querySelector(`.gif-indicator[data-target="${index}"]`);

    // Add fading-out class for smooth exit
    if (currentImage) {
      currentImage.classList.add('fading-out');
    }

    // Update indicators immediately
    if (currentIndicator) {
      currentIndicator.classList.remove('active');
    }
    if (targetIndicator) {
      targetIndicator.classList.add('active');
    }

    // After a brief delay, swap the active states
    setTimeout(() => {
      if (currentImage) {
        currentImage.classList.remove('active', 'fading-out');
      }
      if (targetImage) {
        targetImage.classList.add('active');
      }

      this.currentIndex = index;
      this.isTransitioning = false;
    }, 250); // Half of the CSS transition duration for smooth crossfade
  }

  // Programmatic access
  next() {
    const nextIndex = this.currentIndex >= 4 ? 1 : this.currentIndex + 1;
    this.switchTo(nextIndex);
  }

  prev() {
    const prevIndex = this.currentIndex <= 1 ? 4 : this.currentIndex - 1;
    this.switchTo(prevIndex);
  }

  getCurrentIndex() {
    return this.currentIndex;
  }
}


// ============================================
// CSS ANIMATION INJECTION
// ============================================

function injectAnimations() {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes ripple {
      to {
        transform: scale(4);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}


// ============================================
// SETTINGS MANAGER
// ============================================

class SettingsManager {
  constructor() {
    this.settings = null;
    this.isLoading = false;
    this.changeListeners = [];

    // Mapping of UI element selectors to settings paths
    this.settingsMap = {
      // General
      'general.startWithWindows': '#settings-general .settings-row:nth-child(1) input',
      'general.minimizeToTray': '#settings-general .settings-row:nth-child(2) input',
      'general.checkUpdatesAutomatically': '#settings-general .settings-row:nth-child(3) input',

      // Scanning
      'scanning.defaultScanMode': '#settings-scanning .settings-card:first-child .settings-select',
      'scanning.autoScanOnStartup': '#settings-scanning .settings-row:nth-child(2) input',
      'scanning.realTimeMonitoring': '#settings-scanning .settings-row:nth-child(3) input',

      // Appearance
      'appearance.scanlineEffect': '#settings-appearance .settings-row:nth-child(2) input',
      'appearance.vignetteEffect': '#settings-appearance .settings-row:nth-child(3) input',
      'appearance.skullAnimations': '#settings-appearance .settings-row:nth-child(4) input',
      'appearance.reducedMotion': '#settings-appearance .settings-row:nth-child(5) input',

      // Notifications
      'notifications.enabled': '#settings-notifications .settings-row:nth-child(1) input',
      'notifications.scanComplete': '#settings-notifications .settings-row:nth-child(2) input',
      'notifications.securityAlerts': '#settings-notifications .settings-row:nth-child(3) input',
      'notifications.lowDiskSpace': '#settings-notifications .settings-row:nth-child(4) input',
      'notifications.updateNotifications': '#settings-notifications .settings-row:nth-child(5) input',
      'notifications.soundEffects': '#settings-notifications .settings-row:nth-child(6) input',

      // Privacy
      'privacy.auditLogging': '#settings-privacy .settings-card:first-child .settings-row:nth-child(1) input',
      'privacy.logRetentionDays': '#settings-privacy .settings-card:first-child .settings-row:nth-child(2) select',
      'privacy.anonymousUsageStats': '#settings-privacy .settings-card:first-child .settings-row:nth-child(3) input',

      // Advanced
      'advanced.debugMode': '#settings-advanced .settings-card:first-child .settings-row:nth-child(1) input',
      'advanced.developerTools': '#settings-advanced .settings-card:first-child .settings-row:nth-child(2) input',
      'advanced.hardwareAcceleration': '#settings-advanced .settings-card:first-child .settings-row:nth-child(3) input',
      'advanced.safeDeleteMode': '#settings-advanced .settings-card:first-child .settings-row:nth-child(4) input'
    };

    this.init();
  }

  async init() {
    // Wait for the API to be available
    if (!window.deadbyte?.settings) {
      console.warn('Settings API not available, will retry...');
      setTimeout(() => this.init(), 100);
      return;
    }

    await this.loadSettings();
    this.bindUIElements();
    this.initThemeSelector();
    this.initExclusionPaths();
    this.initActionButtons();
    this.listenForChanges();
  }

  async loadSettings() {
    this.isLoading = true;
    try {
      const result = await window.deadbyte.settings.getAll();
      if (result.success) {
        this.settings = result.data;
        this.applySettingsToUI();
        this.applyVisualSettings();
        Debug.log('Settings loaded:', this.settings);
      } else {
        console.error('Failed to load settings:', result.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
    this.isLoading = false;
  }

  applySettingsToUI() {
    if (!this.settings) return;

    // Apply toggle and select values
    for (const [path, selector] of Object.entries(this.settingsMap)) {
      const element = document.querySelector(selector);
      if (!element) continue;

      const value = this.getNestedValue(this.settings, path);
      if (value === undefined) continue;

      if (element.type === 'checkbox') {
        element.checked = value;
      } else if (element.tagName === 'SELECT') {
        element.value = value;
      }
    }

    // Apply theme
    this.applyTheme(this.settings.appearance?.theme || 'dark');
  }

  applyVisualSettings() {
    if (!this.settings?.appearance) return;

    // Scanline effect
    const scanlineOverlay = document.querySelector('.scanline-overlay');
    if (scanlineOverlay) {
      scanlineOverlay.style.display = this.settings.appearance.scanlineEffect ? '' : 'none';
    }

    // Vignette effect
    const vignetteOverlay = document.querySelector('.vignette-overlay');
    if (vignetteOverlay) {
      vignetteOverlay.style.display = this.settings.appearance.vignetteEffect ? '' : 'none';
    }

    // Reduced motion
    document.body.classList.toggle('reduced-motion', this.settings.appearance.reducedMotion);

    // Skull animations
    const skullWrapper = document.querySelector('.skull-wrapper');
    if (skullWrapper) {
      skullWrapper.classList.toggle('animations-disabled', !this.settings.appearance.skullAnimations);
    }
  }

  bindUIElements() {
    // Bind all toggles and selects to save on change
    for (const [path, selector] of Object.entries(this.settingsMap)) {
      const element = document.querySelector(selector);
      if (!element) continue;

      element.addEventListener('change', async (e) => {
        if (this.isLoading) return;

        const value = element.type === 'checkbox' ? element.checked : element.value;
        await this.saveSetting(path, value);

        // Apply visual changes immediately for appearance settings
        if (path.startsWith('appearance.')) {
          this.applyVisualSettings();
        }
      });
    }
  }

  initThemeSelector() {
    // Dark theme only - always apply dark mode
    this.applyTheme();
  }

  applyTheme() {
    const html = document.documentElement;
    html.classList.remove('theme-light');
    html.classList.add('theme-dark');
    html.dataset.theme = 'dark';
  }

  initExclusionPaths() {
    // Add path button
    const addBtn = document.querySelector('.settings-card-header .btn-ghost');
    if (addBtn && addBtn.textContent.includes('Add Path')) {
      addBtn.addEventListener('click', () => this.addExclusionPath());
    }

    // Remove path buttons
    document.querySelectorAll('.exclusion-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const item = e.target.closest('.exclusion-item');
        const path = item?.querySelector('.exclusion-path')?.textContent;
        if (path) {
          this.removeExclusionPath(path);
        }
      });
    });

    // Render initial exclusion paths
    this.renderExclusionPaths();
  }

  async addExclusionPath() {
    if (!window.deadbyte?.dialog) return;

    try {
      const result = await window.deadbyte.dialog.openFolder();
      if (!result.canceled && result.filePaths?.[0]) {
        const pathToAdd = result.filePaths[0];
        const addResult = await window.deadbyte.settings.addExclusion(pathToAdd);
        if (addResult.success) {
          await this.loadSettings();
          this.renderExclusionPaths();
        }
      }
    } catch (error) {
      console.error('Error adding exclusion path:', error);
    }
  }

  async removeExclusionPath(pathToRemove) {
    try {
      const result = await window.deadbyte.settings.removeExclusion(pathToRemove);
      if (result.success) {
        await this.loadSettings();
        this.renderExclusionPaths();
      }
    } catch (error) {
      console.error('Error removing exclusion path:', error);
    }
  }

  renderExclusionPaths() {
    const container = document.querySelector('.exclusion-list');
    if (!container) return;

    const paths = this.settings?.scanning?.exclusionPaths || [];
    container.innerHTML = '';

    paths.forEach(path => {
      const item = document.createElement('div');
      item.className = 'exclusion-item';
      item.innerHTML = `
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
        </svg>
        <span class="exclusion-path">${escapeHtml(path)}</span>
        <button class="exclusion-remove">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;

      const removeBtn = item.querySelector('.exclusion-remove');
      removeBtn.addEventListener('click', () => this.removeExclusionPath(path));

      container.appendChild(item);
    });

    // Show empty state if no paths
    if (paths.length === 0) {
      container.innerHTML = '<div class="exclusion-empty">No exclusion paths configured</div>';
    }
  }

  initActionButtons() {
    // Reset All Settings button
    const resetAllBtn = document.querySelector('.settings-card-danger .btn-ghost:not(.btn-danger)');
    if (resetAllBtn && resetAllBtn.textContent.includes('Reset All Settings')) {
      resetAllBtn.addEventListener('click', () => this.resetAllSettings());
    }

    // Clear All Data button
    const clearDataBtn = document.querySelector('.settings-card-danger .btn-danger');
    if (clearDataBtn && clearDataBtn.textContent.includes('Clear All Data')) {
      clearDataBtn.addEventListener('click', () => this.clearAllData());
    }

    // Export Logs button
    const exportLogsBtn = document.querySelector('.settings-actions-row .btn-ghost');
    if (exportLogsBtn && exportLogsBtn.textContent.includes('Export Logs')) {
      exportLogsBtn.addEventListener('click', () => this.exportLogs());
    }

    // Clear All Logs button
    const clearLogsBtn = document.querySelector('#settings-privacy .btn-danger');
    if (clearLogsBtn && clearLogsBtn.textContent.includes('Clear All Logs')) {
      clearLogsBtn.addEventListener('click', () => this.clearAllLogs());
    }
  }

  async resetAllSettings() {
    if (!confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }

    try {
      const result = await window.deadbyte.settings.resetAll();
      if (result.success) {
        await this.loadSettings();
        Debug.log('All settings reset to defaults');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
    }
  }

  async clearAllData() {
    if (!confirm('Are you sure you want to clear all application data? This will reset settings and clear all logs. This cannot be undone.')) {
      return;
    }

    try {
      // Reset settings
      await window.deadbyte.settings.resetAll();

      // Clear logs
      if (window.deadbyte?.logs) {
        await window.deadbyte.logs.clear();
      }

      await this.loadSettings();
      Debug.log('All data cleared');
    } catch (error) {
      console.error('Error clearing data:', error);
    }
  }

  async exportLogs() {
    if (!window.deadbyte?.logs) return;

    try {
      const result = await window.deadbyte.logs.export();
      if (result.success) {
        Debug.log('Logs exported');
      }
    } catch (error) {
      console.error('Error exporting logs:', error);
    }
  }

  async clearAllLogs() {
    if (!confirm('Are you sure you want to clear all logs? This cannot be undone.')) {
      return;
    }

    if (!window.deadbyte?.logs) return;

    try {
      await window.deadbyte.logs.clear();
      Debug.log('All logs cleared');
    } catch (error) {
      console.error('Error clearing logs:', error);
    }
  }

  async saveSetting(path, value) {
    try {
      const result = await window.deadbyte.settings.set(path, value);
      if (result.success) {
        // Update local cache
        this.setNestedValue(this.settings, path, value);
        this.notifyListeners(path, value);
        Debug.log(`Setting saved: ${path} = ${value}`);
      } else {
        console.error('Failed to save setting:', result.message);
      }
    } catch (error) {
      console.error('Error saving setting:', error);
    }
  }

  listenForChanges() {
    // Listen for settings changes from other windows/processes
    if (window.deadbyte?.settings?.onChange) {
      window.deadbyte.settings.onChange((data) => {
        if (data.multiple) {
          // Multiple settings changed
          this.loadSettings();
        } else {
          // Single setting changed
          this.setNestedValue(this.settings, data.keyPath, data.value);
          this.applySettingsToUI();
          this.applyVisualSettings();
        }
      });
    }

    if (window.deadbyte?.settings?.onReset) {
      window.deadbyte.settings.onReset(() => {
        this.loadSettings();
      });
    }
  }

  // Subscribe to settings changes
  onChange(callback) {
    this.changeListeners.push(callback);
  }

  notifyListeners(path, value) {
    this.changeListeners.forEach(cb => cb(path, value));
  }

  // Utility: Get nested object value by path
  getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Utility: Set nested object value by path
  setNestedValue(obj, path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    const target = keys.reduce((current, key) => {
      if (!current[key]) current[key] = {};
      return current[key];
    }, obj);
    target[lastKey] = value;
  }

  // Get current settings
  getSettings() {
    return this.settings;
  }

  // Get a specific setting
  getSetting(path) {
    return this.getNestedValue(this.settings, path);
  }
}


// ============================================
// SYSTEM MONITOR
// ============================================

class SystemMonitor {
  constructor() {
    this.isRunning = false;
    this.updateInterval = null;
    this.metrics = null;
    this.listeners = [];

    // Circumference for the small metric rings (r=20, C=2*pi*20=125.7)
    this.smallCircumference = 125.7;
    // Circumference for the large score ring (r=54, C=2*pi*54=339.3)
    this.largeCircumference = 339.3;

    // Track previous score for count-up animation
    this.previousScore = null;
    this.scoreAnimationId = null;

    this.init();
  }

  async init() {
    // Wait for API to be available
    if (!window.deadbyte?.metrics) {
      console.warn('Metrics API not available, will retry...');
      setTimeout(() => this.init(), 100);
      return;
    }

    // Initial fetch
    await this.fetchMetrics();

    // Start periodic updates
    this.start();

    Debug.log('SystemMonitor initialized');
  }

  start(intervalMs = 2000) {
    if (this.isRunning) return;

    this.isRunning = true;
    this.updateInterval = setInterval(() => this.fetchMetrics(), intervalMs);
    Debug.log('SystemMonitor started');
  }

  stop() {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    Debug.log('SystemMonitor stopped');
  }

  async fetchMetrics() {
    try {
      const result = await window.deadbyte.metrics.getAll();
      if (result.success && result.data) {
        this.metrics = result.data;
        this.updateUI();
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }

  updateUI() {
    if (!this.metrics) return;

    // Update Home page stats
    this.updateHomeStats();

    // Update Performance page
    this.updatePerformanceStats();
  }

  updateHomeStats() {
    const { cpu, memory, disk, uptime } = this.metrics;

    // Calculate health score based on resource usage
    const cpuScore = 100 - (cpu?.usage || 0);
    const memScore = 100 - (memory?.usage || 0);
    const diskScore = 100 - (disk?.totalUsage || 0);
    const healthScore = Math.round((cpuScore + memScore + diskScore) / 3);

    // Update health stat
    const healthEl = document.getElementById('home-stat-health');
    const healthBar = document.getElementById('home-stat-health-bar');
    if (healthEl) {
      healthEl.textContent = `${healthScore}%`;
    }
    if (healthBar) {
      healthBar.style.width = `${healthScore}%`;
    }

    // Update uptime stat
    const uptimeEl = document.getElementById('home-stat-uptime');
    const uptimeBar = document.getElementById('home-stat-uptime-bar');
    if (uptimeEl && uptime) {
      uptimeEl.textContent = uptime.formatted || '—';
    }
    if (uptimeBar) {
      // Cap uptime bar at a reasonable percentage (days to percentage)
      const uptimeDays = (uptime?.seconds || 0) / 86400;
      const uptimePercent = Math.min(100, uptimeDays * 10); // 10 days = 100%
      uptimeBar.style.width = `${uptimePercent}%`;
    }
  }

  updatePerformanceStats() {
    const { cpu, memory, disk, diskIO, network } = this.metrics;

    // Update CPU
    this.updateMetricRing('cpu', cpu?.usage || 0, `${cpu?.cores || 0} cores`);

    // Update Memory
    const memDetail = `${memory?.usedFormatted || '—'} / ${memory?.totalFormatted || '—'}`;
    this.updateMetricRing('memory', memory?.usage || 0, memDetail);

    // Update Disk I/O
    this.updateMetricRing('disk', diskIO?.activity || 0, diskIO?.bytesPerSecFormatted || '0 B/s');

    // Update Network
    this.updateMetricRing('network', network?.activity || 0, network?.bytesPerSecFormatted || '0 B/s');

    // Update overall performance score
    this.updatePerformanceScore();
  }

  updateMetricRing(metric, value, detail) {
    const ringEl = document.getElementById(`perf-${metric}-ring`);
    const valueEl = document.getElementById(`perf-${metric}-value`);
    const detailEl = document.getElementById(`perf-${metric}-detail`);

    if (valueEl) {
      valueEl.textContent = `${Math.round(value)}%`;
    }

    if (detailEl) {
      detailEl.textContent = detail;
    }

    if (ringEl) {
      // SVG circle animation for small rings (r=20, C=125.7)
      const offset = this.smallCircumference - (value / 100) * this.smallCircumference;
      ringEl.style.strokeDashoffset = offset;

      // Update color based on value
      let color = 'var(--color-success)';
      if (value > 70) color = 'var(--color-warning)';
      if (value > 90) color = 'var(--color-error)';
      ringEl.style.stroke = color;
    }
  }

  updatePerformanceScore() {
    const { cpu, memory, disk } = this.metrics;

    // Calculate performance score (inverse of usage)
    const cpuScore = 100 - (cpu?.usage || 0);
    const memScore = 100 - (memory?.usage || 0);
    const diskScore = 100 - (disk?.totalUsage || 0);

    // Weighted average (CPU and memory are more important)
    const perfScore = Math.round((cpuScore * 0.4) + (memScore * 0.4) + (diskScore * 0.2));

    // Update score value with count-up animation
    const scoreValueEl = document.getElementById('perf-score-value');
    if (scoreValueEl) {
      this.animateScoreCountUp(scoreValueEl, perfScore);
    }

    // Update score ring
    const scoreRingEl = document.getElementById('perf-score-ring-progress');
    if (scoreRingEl) {
      const offset = this.largeCircumference - (perfScore / 100) * this.largeCircumference;
      scoreRingEl.style.strokeDashoffset = offset;
    }

    // Update status text
    const statusTextEl = document.getElementById('perf-status-text');
    const statusHintEl = document.getElementById('perf-status-hint');
    if (statusTextEl) {
      let statusText = 'Excellent Performance';
      if (perfScore < 90) statusText = 'Good Performance';
      if (perfScore < 70) statusText = 'Fair Performance';
      if (perfScore < 50) statusText = 'Poor Performance';
      statusTextEl.textContent = statusText;
    }
    if (statusHintEl) {
      const suggestions = [];
      if (cpu?.usage > 70) suggestions.push('High CPU usage');
      if (memory?.usage > 80) suggestions.push('High memory usage');
      if (disk?.totalUsage > 85) suggestions.push('Low disk space');

      if (suggestions.length > 0) {
        statusHintEl.textContent = suggestions.join(', ');
      } else {
        statusHintEl.textContent = 'System running smoothly';
      }
    }
  }

  animateScoreCountUp(element, targetScore) {
    // Cancel any existing animation
    if (this.scoreAnimationId) {
      cancelAnimationFrame(this.scoreAnimationId);
      this.scoreAnimationId = null;
    }

    // Get starting value (previous score or 0 for first run)
    const startScore = this.previousScore !== null ? this.previousScore : 0;

    // Skip animation if no change
    if (startScore === targetScore) {
      element.textContent = targetScore;
      return;
    }

    const duration = 800; // 800ms animation
    const startTime = performance.now();
    const scoreDiff = targetScore - startScore;

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic for smooth deceleration
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(startScore + (scoreDiff * easeOut));
      element.textContent = currentValue;

      if (progress < 1) {
        this.scoreAnimationId = requestAnimationFrame(animate);
      } else {
        // Ensure final value is exact
        element.textContent = targetScore;
        this.previousScore = targetScore;
        this.scoreAnimationId = null;
      }
    };

    this.scoreAnimationId = requestAnimationFrame(animate);
  }

  // Subscribe to metric updates
  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    this.listeners.forEach(cb => cb(this.metrics));
  }

  // Get current metrics
  getMetrics() {
    return this.metrics;
  }

  // Get specific metric
  getCpu() {
    return this.metrics?.cpu;
  }

  getMemory() {
    return this.metrics?.memory;
  }

  getDisk() {
    return this.metrics?.disk;
  }

  getNetwork() {
    return this.metrics?.network;
  }
}


// ============================================
// SERVICES MANAGER
// ============================================

class ServicesManager {
  constructor() {
    this.data = null;
    this.isLoading = false;
    this.init();
  }

  async init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Cache DOM elements
    this.backgroundCountEl = document.getElementById('svc-background-count');
    this.backgroundImpactEl = document.getElementById('svc-background-impact');
    this.securityCountEl = document.getElementById('svc-security-count');
    this.securityImpactEl = document.getElementById('svc-security-impact');
    this.displayCountEl = document.getElementById('svc-display-count');
    this.displayImpactEl = document.getElementById('svc-display-impact');
    this.systemCountEl = document.getElementById('svc-system-count');
    this.systemImpactEl = document.getElementById('svc-system-impact');
    this.servicesGrid = document.getElementById('services-grid');

    // Filter elements
    this.filterBtn = document.getElementById('btn-services-filter');
    this.filterMenu = document.getElementById('services-filter-menu');

    // Setup filter button toggle
    if (this.filterBtn && this.filterMenu) {
      this.filterBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.filterMenu.classList.toggle('hidden');
      });

      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!this.filterMenu.contains(e.target) && e.target !== this.filterBtn) {
          this.filterMenu.classList.add('hidden');
        }
      });

      // Handle filter checkboxes
      this.filterMenu.querySelectorAll('input[data-filter]').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
          const category = e.target.dataset.filter;
          this.toggleCategoryVisibility(category, e.target.checked);
        });
      });
    }

    // Initial load
    this.loadServices();
  }

  toggleCategoryVisibility(category, visible) {
    const categoryEl = this.servicesGrid?.querySelector(`[data-category="${category}"]`);
    if (categoryEl) {
      categoryEl.style.display = visible ? '' : 'none';
    }
  }

  async loadServices() {
    if (this.isLoading || !window.deadbyte?.services) {
      // If API not available, show placeholder
      this.showLoadingState();
      return;
    }

    this.isLoading = true;

    try {
      const result = await window.deadbyte.services.getAll();

      if (result.success) {
        this.data = result.data;
        this.updateUI();
      } else {
        this.showErrorState(result.message);
      }
    } catch (error) {
      console.error('Failed to load services:', error);
      this.showErrorState(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  showLoadingState() {
    const loadingText = '— running';
    if (this.backgroundCountEl) this.backgroundCountEl.textContent = loadingText;
    if (this.securityCountEl) this.securityCountEl.textContent = loadingText;
    if (this.displayCountEl) this.displayCountEl.textContent = loadingText;
    if (this.systemCountEl) this.systemCountEl.textContent = loadingText;
  }

  showErrorState(message) {
    const errorText = 'Error';
    if (this.backgroundCountEl) this.backgroundCountEl.textContent = errorText;
    if (this.securityCountEl) this.securityCountEl.textContent = errorText;
    if (this.displayCountEl) this.displayCountEl.textContent = errorText;
    if (this.systemCountEl) this.systemCountEl.textContent = errorText;

    // Show toast if available
    if (message?.includes('Access') || message?.includes('admin')) {
      window.DeadBYTE?.toast?.warning('Limited Access', 'Run as Administrator for full service data');
    }
  }

  updateUI() {
    if (!this.data?.categories) return;

    const cats = this.data.categories;

    // Background services
    if (this.backgroundCountEl && cats.background) {
      this.backgroundCountEl.textContent = `${cats.background.count} running`;
    }
    if (this.backgroundImpactEl && cats.background) {
      this.backgroundImpactEl.textContent = cats.background.impact;
    }

    // Security services
    if (this.securityCountEl && cats.security) {
      this.securityCountEl.textContent = `${cats.security.count} running`;
    }
    if (this.securityImpactEl && cats.security) {
      this.securityImpactEl.textContent = cats.security.impact;
    }

    // Display services
    if (this.displayCountEl && cats.display) {
      this.displayCountEl.textContent = `${cats.display.count} running`;
    }
    if (this.displayImpactEl && cats.display) {
      this.displayImpactEl.textContent = cats.display.impact;
    }

    // System services
    if (this.systemCountEl && cats.system) {
      this.systemCountEl.textContent = `${cats.system.count} running`;
    }
    if (this.systemImpactEl && cats.system) {
      this.systemImpactEl.textContent = cats.system.impact;
    }
  }

  // Refresh services data
  async refresh() {
    await this.loadServices();
  }
}


// ============================================
// STARTUP MANAGER
// ============================================

class StartupManager {
  constructor() {
    this.items = [];
    this.itemsMap = new Map();
    this.selectedItems = new Set();
    this.isLoading = false;
    this.init();
  }

  async init() {
    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Cache DOM elements
    this.listContainer = document.getElementById('startup-list');
    this.bootTimeValue = document.getElementById('startup-boot-time');
    this.highCountEl = document.getElementById('startup-high-count');
    this.mediumCountEl = document.getElementById('startup-medium-count');
    this.lowCountEl = document.getElementById('startup-low-count');
    this.refreshBtn = document.querySelector('.performance-startup .btn-ghost');

    // Action bar elements
    this.selectedCountEl = document.getElementById('startup-selected-count');
    this.potentialSavingsEl = document.getElementById('startup-potential-savings');
    this.rescanBtn = document.getElementById('btn-startup-rescan');
    this.optimizeBtn = document.getElementById('btn-optimize-selected');

    // Bind refresh button (in startup list header)
    if (this.refreshBtn) {
      this.refreshBtn.addEventListener('click', () => this.loadStartupPrograms());
    }

    // Bind rescan button (in action bar)
    if (this.rescanBtn) {
      this.rescanBtn.addEventListener('click', () => this.handleRescan());
    }

    // Bind optimize selected button
    if (this.optimizeBtn) {
      this.optimizeBtn.addEventListener('click', () => this.handleOptimizeSelected());
    }

    // Initial load
    this.loadStartupPrograms();
  }

  async loadStartupPrograms() {
    if (this.isLoading || !window.deadbyte?.startup) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const [programsResult, impactResult] = await Promise.all([
        window.deadbyte.startup.getAll(),
        window.deadbyte.startup.getImpact()
      ]);

      if (programsResult.success) {
        this.items = programsResult.data.items || [];
        this.itemsMap.clear();
        this.items.forEach(item => this.itemsMap.set(item.id, item));
        this.renderStartupList();
      }

      if (impactResult.success) {
        this.updateImpactSummary(impactResult.data);
      }
    } catch (error) {
      console.error('Failed to load startup programs:', error);
      this.showErrorState();
    } finally {
      this.isLoading = false;
    }
  }

  showLoadingState() {
    if (this.listContainer) {
      this.listContainer.innerHTML = `
        <div class="startup-loading">
          <div class="spinner"></div>
          <span>Loading startup programs...</span>
        </div>
      `;
    }
  }

  showErrorState() {
    if (this.listContainer) {
      this.listContainer.innerHTML = `
        <div class="startup-error">
          <span>Failed to load startup programs</span>
          <button class="btn-ghost" onclick="window.DeadBYTE?.startupManager?.loadStartupPrograms()">Retry</button>
        </div>
      `;
    }
  }

  renderStartupList() {
    if (!this.listContainer) return;

    if (this.items.length === 0) {
      this.listContainer.innerHTML = `
        <div class="startup-empty">
          <span>No startup programs found</span>
        </div>
      `;
      return;
    }

    // Group items by impact
    const highImpact = this.items.filter(i => i.impact === 'high');
    const mediumImpact = this.items.filter(i => i.impact === 'medium');
    const lowImpact = this.items.filter(i => i.impact === 'low');

    let html = '';

    // Render high impact items first
    highImpact.forEach(item => {
      html += this.renderStartupRow(item);
    });

    // Then medium
    mediumImpact.forEach(item => {
      html += this.renderStartupRow(item);
    });

    // Then low
    lowImpact.forEach(item => {
      html += this.renderStartupRow(item);
    });

    this.listContainer.innerHTML = html;

    // Bind toggle events
    this.bindToggleEvents();
  }

  renderStartupRow(item) {
    const impactClass = `startup-row-${item.impact}`;
    const riskClass = `risk-${item.impact}`;
    const riskLabel = item.impact.charAt(0).toUpperCase() + item.impact.slice(1);
    const impactColors = {
      high: 'var(--color-error)',
      medium: 'var(--color-warning)',
      low: 'var(--color-success)'
    };
    const impactPercent = item.impact === 'high' ? '85%' : item.impact === 'medium' ? '50%' : '20%';
    const impactTime = item.impact === 'high' ? '+1.5s' : item.impact === 'medium' ? '+0.5s' : '+0.1s';

    // Get appropriate icon based on program name
    const icon = this.getIconForProgram(item.name);

    return `
      <div class="startup-row ${impactClass}" data-startup-id="${item.id}">
        <label class="startup-select">
          <input type="checkbox" ${this.selectedItems.has(item.id) ? 'checked' : ''}>
          <span class="startup-checkbox"></span>
        </label>
        <div class="startup-icon" style="--startup-color: ${impactColors[item.impact]};">
          ${icon}
        </div>
        <div class="startup-info">
          <span class="startup-name">${escapeHtml(item.name)}</span>
          <span class="startup-detail">${escapeHtml(item.publisher || 'Unknown')} - ${item.type === 'registry' ? 'Registry' : 'Startup Folder'}</span>
        </div>
        <div class="startup-impact">
          <span class="startup-impact-bar" style="--impact: ${impactPercent};"></span>
          <span class="startup-impact-label">${impactTime}</span>
        </div>
        <span class="startup-risk ${riskClass}">${riskLabel}</span>
        <div class="startup-toggle">
          <label class="toggle-switch ${item.type === 'folder' ? 'toggle-disabled' : ''}">
            <input type="checkbox"
                   ${item.enabled ? 'checked' : ''}
                   ${item.type === 'folder' ? 'disabled' : ''}
                   data-startup-toggle="${item.id}">
            <span class="toggle-slider"></span>
          </label>
        </div>
      </div>
    `;
  }

  getIconForProgram(name) {
    const nameLower = name.toLowerCase();

    // Match common programs to icons
    if (nameLower.includes('discord')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    }
    if (nameLower.includes('steam') || nameLower.includes('game')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>';
    }
    if (nameLower.includes('spotify') || nameLower.includes('music')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M8 15s1.5-2 4-2 4 2 4 2"/><path d="M7 11s2-2.5 5-2.5 5 2.5 5 2.5"/></svg>';
    }
    if (nameLower.includes('nvidia') || nameLower.includes('amd') || nameLower.includes('radeon')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/></svg>';
    }
    if (nameLower.includes('adobe') || nameLower.includes('creative')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>';
    }
    if (nameLower.includes('teams') || nameLower.includes('slack') || nameLower.includes('zoom')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>';
    }
    if (nameLower.includes('security') || nameLower.includes('defender') || nameLower.includes('antivirus')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>';
    }
    if (nameLower.includes('dropbox') || nameLower.includes('onedrive') || nameLower.includes('drive') || nameLower.includes('cloud')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 10h-1.26A8 8 0 109 20h9a5 5 0 000-10z"/></svg>';
    }
    if (nameLower.includes('update')) {
      return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>';
    }

    // Default icon
    return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>';
  }

  bindToggleEvents() {
    const toggles = this.listContainer?.querySelectorAll('[data-startup-toggle]');
    toggles?.forEach(toggle => {
      toggle.addEventListener('change', async (e) => {
        const itemId = e.target.dataset.startupToggle;
        const item = this.itemsMap.get(itemId);
        if (!item) return;

        const enabled = e.target.checked;
        const row = e.target.closest('.startup-row');

        // Add loading state
        row?.classList.add('startup-row-loading');

        try {
          let result;
          if (enabled) {
            result = await window.deadbyte.startup.enable(itemId, item);
          } else {
            result = await window.deadbyte.startup.disable(itemId, item);
          }

          if (!result.success) {
            // Revert toggle
            e.target.checked = !enabled;
            console.error('Failed to toggle startup item:', result.message);
          } else {
            // Update local state
            item.enabled = enabled;
          }
        } catch (error) {
          // Revert toggle
          e.target.checked = !enabled;
          console.error('Error toggling startup item:', error);
        } finally {
          row?.classList.remove('startup-row-loading');
        }
      });
    });

    // Bind select checkboxes
    const selects = this.listContainer?.querySelectorAll('.startup-select input');
    selects?.forEach(select => {
      select.addEventListener('change', (e) => {
        const row = e.target.closest('.startup-row');
        const itemId = row?.dataset.startupId;
        if (itemId) {
          if (e.target.checked) {
            this.selectedItems.add(itemId);
          } else {
            this.selectedItems.delete(itemId);
          }
          // Update selection UI
          this.updateSelectionUI();
        }
      });
    });
  }

  updateImpactSummary(impact) {
    // Update boot time estimate
    if (this.bootTimeValue) {
      this.bootTimeValue.textContent = impact.estimatedBootDelay || '—';
    }

    // Update counts
    if (this.highCountEl) {
      this.highCountEl.textContent = impact.breakdown?.high?.length || 0;
    }
    if (this.mediumCountEl) {
      this.mediumCountEl.textContent = impact.breakdown?.medium?.length || 0;
    }
    if (this.lowCountEl) {
      this.lowCountEl.textContent = impact.breakdown?.low?.length || 0;
    }
  }

  // Get count of enabled programs
  getEnabledCount() {
    return this.items.filter(i => i.enabled).length;
  }

  // Get selected items for batch operations
  getSelectedItems() {
    return Array.from(this.selectedItems).map(id => this.itemsMap.get(id)).filter(Boolean);
  }

  // Update selection count and potential savings UI
  updateSelectionUI() {
    const selectedItems = this.getSelectedItems();
    const count = selectedItems.length;

    // Update count
    if (this.selectedCountEl) {
      this.selectedCountEl.textContent = count;
    }

    // Calculate potential savings based on impact
    const savings = this.calculatePotentialSavings(selectedItems);
    if (this.potentialSavingsEl) {
      this.potentialSavingsEl.textContent = savings;
    }
  }

  // Calculate potential boot time savings from selected items
  calculatePotentialSavings(items) {
    let totalSeconds = 0;

    items.forEach(item => {
      // Only count enabled items (disabling them would save time)
      if (item.enabled) {
        switch (item.impact) {
          case 'high':
            totalSeconds += 2.5;
            break;
          case 'medium':
            totalSeconds += 1.5;
            break;
          case 'low':
            totalSeconds += 0.5;
            break;
        }
      }
    });

    // Format as "Xs" or "Xm Ys"
    if (totalSeconds >= 60) {
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = Math.round(totalSeconds % 60);
      return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
    }
    return `${totalSeconds.toFixed(1)}s`;
  }

  // Handle Rescan button click
  async handleRescan() {
    if (this.isLoading || !this.rescanBtn) return;

    // Show loading state on button
    const btnText = this.rescanBtn.querySelector('.btn-text');
    const originalText = btnText?.textContent || 'Rescan';
    if (btnText) btnText.textContent = 'Scanning...';
    this.rescanBtn.disabled = true;
    this.rescanBtn.classList.add('btn-loading');

    try {
      // Clear selections
      this.selectedItems.clear();
      this.updateSelectionUI();

      // Reload startup programs
      await this.loadStartupPrograms();

      window.DeadBYTE?.toast?.success('Rescan Complete', 'Startup programs refreshed');
    } catch (error) {
      console.error('Rescan failed:', error);
      window.DeadBYTE?.toast?.error('Rescan Failed', error.message);
    } finally {
      // Restore button state
      if (btnText) btnText.textContent = originalText;
      this.rescanBtn.disabled = false;
      this.rescanBtn.classList.remove('btn-loading');
    }
  }

  // Handle Optimize Selected button click
  async handleOptimizeSelected() {
    const selectedItems = this.getSelectedItems();

    // Check if any items selected
    if (selectedItems.length === 0) {
      window.DeadBYTE?.toast?.warning('No Selection', 'Select at least one program to optimize');
      return;
    }

    // Filter to only enabled items (can't disable already disabled items)
    const itemsToDisable = selectedItems.filter(item => item.enabled && item.type !== 'folder');

    if (itemsToDisable.length === 0) {
      window.DeadBYTE?.toast?.info('Nothing to Optimize', 'Selected programs are already disabled or cannot be modified');
      return;
    }

    // Show loading state on button
    const btnText = this.optimizeBtn?.querySelector('.btn-text');
    const btnIcon = this.optimizeBtn?.querySelector('.btn-icon');
    const originalText = btnText?.textContent || 'Optimize Selected';

    if (btnText) btnText.textContent = 'Optimizing...';
    if (btnIcon) btnIcon.style.display = 'none';
    this.optimizeBtn.disabled = true;
    this.optimizeBtn.classList.add('btn-loading');

    // Add spinner
    const spinner = document.createElement('div');
    spinner.className = 'spinner spinner-sm';
    this.optimizeBtn.insertBefore(spinner, btnText);

    let successCount = 0;
    let failCount = 0;
    const totalSavings = this.calculatePotentialSavings(itemsToDisable);

    try {
      // Disable items one by one
      for (const item of itemsToDisable) {
        try {
          const result = await window.deadbyte.startup.disable(item.id, item);
          if (result.success) {
            successCount++;
            item.enabled = false;
          } else {
            failCount++;
            console.warn(`Failed to disable ${item.name}:`, result.message);
          }
        } catch (error) {
          failCount++;
          console.error(`Error disabling ${item.name}:`, error);
        }
      }

      // Refresh the list
      await this.loadStartupPrograms();

      // Clear selections
      this.selectedItems.clear();
      this.updateSelectionUI();

      // Show result toast
      if (failCount === 0) {
        window.DeadBYTE?.toast?.success(
          'Optimization Complete',
          `${successCount} programs disabled — boot time improved by ${totalSavings}`
        );
      } else {
        window.DeadBYTE?.toast?.warning(
          'Partial Optimization',
          `${successCount} disabled, ${failCount} failed`
        );
      }
    } catch (error) {
      console.error('Optimization failed:', error);
      window.DeadBYTE?.toast?.error('Optimization Failed', error.message);
    } finally {
      // Restore button state
      spinner.remove();
      if (btnText) btnText.textContent = originalText;
      if (btnIcon) btnIcon.style.display = '';
      this.optimizeBtn.disabled = false;
      this.optimizeBtn.classList.remove('btn-loading');
    }
  }
}


// ============================================
// PERFORMANCE OPTIMIZER
// ============================================

class PerformanceOptimizer {
  constructor() {
    this.isOptimizing = false;
    this.currentMode = null;
    this.init();
  }

  init() {
    // Listen for mode changes on performance page
    document.addEventListener('modeChanged', (e) => {
      if (e.detail.module === 'performance') {
        this.handleModeSelection(e.detail.mode);
      }
    });
  }

  async handleModeSelection(mode) {
    if (this.isOptimizing) {
      window.DeadBYTE?.toast?.warning('Busy', 'An optimization is already running');
      return;
    }

    // Custom mode just enables selection, no automatic action
    if (mode === 'custom') {
      window.DeadBYTE?.toast?.info('Custom Mode', 'Select specific programs to optimize, then click Optimize Selected');
      return;
    }

    // Get data for confirmation dialog
    const impactData = await this.getOptimizationPreview(mode);

    if (impactData.programCount === 0 && impactData.junkSize === 0) {
      window.DeadBYTE?.toast?.info('Already Optimized', 'No optimizations needed for this mode');
      return;
    }

    // Show confirmation dialog
    this.showConfirmationDialog(mode, impactData);
  }

  async getOptimizationPreview(mode) {
    const data = {
      programCount: 0,
      programNames: [],
      junkSize: 0,
      junkSizeFormatted: '0 B'
    };

    try {
      // Get startup programs to disable
      const startupResult = await window.deadbyte?.startup?.getImpact();
      if (startupResult?.success) {
        const breakdown = startupResult.data.breakdown;
        if (mode === 'quick') {
          data.programCount = breakdown.high?.length || 0;
          data.programNames = breakdown.high?.slice(0, 5) || [];
        } else if (mode === 'full') {
          data.programCount = (breakdown.high?.length || 0) + (breakdown.medium?.length || 0);
          data.programNames = [...(breakdown.high || []), ...(breakdown.medium || [])].slice(0, 5);
        }
      }

      // Get junk file size
      const junkResult = await window.deadbyte?.junk?.quickSummary();
      if (junkResult?.success) {
        data.junkSize = junkResult.data.totalSize || 0;
        data.junkSizeFormatted = formatBytes(data.junkSize);
      }
    } catch (error) {
      console.error('Error getting optimization preview:', error);
    }

    return data;
  }

  showConfirmationDialog(mode, impactData) {
    const modeLabel = mode === 'quick' ? 'Quick Tune' : 'Full Optimize';
    const impactLevel = mode === 'quick' ? 'high-impact' : 'high and medium-impact';

    let message = '';
    if (impactData.programCount > 0) {
      message += `<p>Disable <strong>${impactData.programCount}</strong> ${impactLevel} startup programs</p>`;
    }
    if (impactData.junkSize > 0 && mode === 'full') {
      message += `<p>Clean <strong>${impactData.junkSizeFormatted}</strong> of junk files</p>`;
    }

    if (!message) {
      message = '<p>Run system optimization</p>';
    }

    this.modal = window.DeadBYTE?.modal;
    if (!this.modal) {
      // Fallback: just run directly
      this.runOptimization(mode, impactData);
      return;
    }

    // Create confirmation modal content
    const content = `
      <div class="confirm-dialog" id="optimization-dialog">
        <h3>${modeLabel} Optimization</h3>
        <div class="confirm-details">
          ${message}
        </div>
        <p class="confirm-warning">This will improve your system's boot time and performance.</p>
        <div class="confirm-actions">
          <button class="btn-ghost" data-action="cancel">Cancel</button>
          <button class="btn-performance" data-action="confirm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
            </svg>
            Confirm
          </button>
        </div>
      </div>
    `;

    this.modal.show({
      content: content,
      size: 'sm',
      closable: true
    });

    // Store impactData for progress display
    this.impactData = impactData;

    // Bind actions
    const cancelBtn = document.querySelector('.confirm-dialog [data-action="cancel"]');
    const confirmBtn = document.querySelector('.confirm-dialog [data-action="confirm"]');

    cancelBtn?.addEventListener('click', () => this.modal.hide());
    confirmBtn?.addEventListener('click', () => {
      this.showProgressView(mode, modeLabel);
      this.runOptimization(mode, impactData);
    });
  }

  showProgressView(mode, modeLabel) {
    const dialog = document.getElementById('optimization-dialog');
    if (!dialog) return;

    const totalSteps = mode === 'full' ? 2 : 1;
    const steps = mode === 'full'
      ? ['Disabling startup programs...', 'Cleaning junk files...']
      : ['Disabling startup programs...'];

    dialog.innerHTML = `
      <div class="optimize-progress">
        <h3>Optimizing...</h3>
        <div class="progress-status" id="optimize-status">${steps[0]}</div>
        <div class="progress-bar-container">
          <div class="progress-bar-fill" id="optimize-progress-bar" style="width: 0%"></div>
        </div>
        <div class="progress-step-indicator">
          <span id="optimize-step">Step 1</span> of ${totalSteps}
        </div>
      </div>
    `;
  }

  updateProgress(step, totalSteps, statusText, progressPercent) {
    const statusEl = document.getElementById('optimize-status');
    const progressBar = document.getElementById('optimize-progress-bar');
    const stepEl = document.getElementById('optimize-step');

    if (statusEl) statusEl.textContent = statusText;
    if (progressBar) progressBar.style.width = `${progressPercent}%`;
    if (stepEl) stepEl.textContent = `Step ${step}`;
  }

  showProgressComplete(successMsg) {
    const dialog = document.getElementById('optimization-dialog');
    if (!dialog) return;

    dialog.innerHTML = `
      <div class="optimize-progress optimize-complete">
        <div class="complete-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 12 11.5 14.5 15 9"/>
          </svg>
        </div>
        <h3>Optimization Complete</h3>
        <p class="complete-message">${successMsg}</p>
        <button class="btn-performance" data-action="done">Done</button>
      </div>
    `;

    document.querySelector('[data-action="done"]')?.addEventListener('click', () => {
      this.modal?.hide();
    });
  }

  async runOptimization(mode, impactData) {
    if (this.isOptimizing) return;

    this.isOptimizing = true;
    this.currentMode = mode;

    // Disable mode cards during optimization
    this.setModeCardsLocked(true);

    const modeLabel = mode === 'quick' ? 'Quick Tune' : 'Full Optimize';
    const totalSteps = mode === 'full' ? 2 : 1;

    let disabledCount = 0;
    let cleanedSize = 0;

    try {
      // Step 1: Disable startup programs
      this.updateProgress(1, totalSteps, 'Disabling startup programs...', 10);
      disabledCount = await this.disableStartupPrograms(mode);
      this.updateProgress(1, totalSteps, `Disabled ${disabledCount} programs`, mode === 'full' ? 50 : 90);

      // Step 2: Clean junk (only for full mode)
      if (mode === 'full') {
        this.updateProgress(2, totalSteps, 'Scanning for junk files...', 60);
        cleanedSize = await this.cleanJunkFiles();
        this.updateProgress(2, totalSteps, `Cleaned ${formatBytes(cleanedSize)}`, 90);
      }

      // Refresh startup list
      this.updateProgress(totalSteps, totalSteps, 'Finalizing...', 95);
      const startupManager = window.DeadBYTE?.startupManager;
      if (startupManager) {
        await startupManager.loadStartupPrograms();
      }

      // Build success message
      let successMsg = `${disabledCount} startup programs disabled`;
      if (cleanedSize > 0) {
        successMsg += `, ${formatBytes(cleanedSize)} cleaned`;
      }

      // Show completion in modal
      this.updateProgress(totalSteps, totalSteps, 'Complete!', 100);
      await new Promise(r => setTimeout(r, 300)); // Brief pause to show 100%
      this.showProgressComplete(successMsg);

    } catch (error) {
      console.error('Optimization failed:', error);
      window.DeadBYTE?.toast?.error('Optimization Failed', error.message);
      this.modal?.hide();
    } finally {
      this.isOptimizing = false;
      this.currentMode = null;
      this.setModeCardsLocked(false);
    }
  }

  async disableStartupPrograms(mode) {
    let disabledCount = 0;

    try {
      const result = await window.deadbyte?.startup?.getAll();
      if (!result?.success) return 0;

      const items = result.data.items || [];

      // Filter by impact based on mode
      const toDisable = items.filter(item => {
        if (!item.enabled || item.type === 'folder') return false;
        if (mode === 'quick') {
          return item.impact === 'high';
        } else {
          return item.impact === 'high' || item.impact === 'medium';
        }
      });

      // Disable each item
      for (const item of toDisable) {
        try {
          const disableResult = await window.deadbyte.startup.disable(item.id, item);
          if (disableResult.success) {
            disabledCount++;
          }
        } catch (e) {
          console.warn(`Failed to disable ${item.name}:`, e);
        }
      }
    } catch (error) {
      console.error('Error disabling startup programs:', error);
    }

    return disabledCount;
  }

  async cleanJunkFiles() {
    let cleanedSize = 0;

    try {
      // Quick scan first
      const scanResult = await window.deadbyte?.junk?.scan({ mode: 'quick' });
      if (!scanResult?.success) return 0;

      // Clean all safe categories
      const cleanResult = await window.deadbyte?.junk?.clean(['temp', 'browser', 'logs'], { safe: true });
      if (cleanResult?.success) {
        cleanedSize = cleanResult.data?.cleanedSize || 0;
      }
    } catch (error) {
      console.error('Error cleaning junk:', error);
    }

    return cleanedSize;
  }

  setModeCardsLocked(locked) {
    const cards = document.querySelectorAll('.perf-mode-card');
    cards.forEach(card => {
      if (locked) {
        card.classList.add('mode-card-locked');
        card.style.pointerEvents = 'none';
        card.style.opacity = '0.6';
      } else {
        card.classList.remove('mode-card-locked');
        card.style.pointerEvents = '';
        card.style.opacity = '';
      }
    });

    // Add pulsing animation to active card if locked
    if (locked) {
      const activeCard = document.querySelector('.perf-mode-card.active');
      activeCard?.classList.add('mode-card-optimizing');
    } else {
      document.querySelector('.mode-card-optimizing')?.classList.remove('mode-card-optimizing');
    }
  }
}


// ============================================
// JUNK SCANNER
// ============================================

class JunkScanner {
  constructor() {
    this.categories = {};
    this.scanResults = null;
    this.isScanning = false;
    this.selectedCategories = new Set();
    // Animation tracking
    this.previousTotalSize = 0;
    this.sizeAnimationId = null;
    this.init();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Cache DOM elements
    this.categoriesContainer = document.getElementById('junk-categories');
    this.totalSizeEl = document.getElementById('junk-total-size');
    this.totalFilesEl = document.getElementById('junk-total-files');
    this.scanBtn = document.getElementById('junk-scan-btn');
    this.cleanBtn = document.getElementById('junk-clean-btn');
    this.progressBar = document.getElementById('junk-progress-bar');
    this.progressText = document.getElementById('junk-progress-text');
    this.resultsContainer = document.getElementById('junk-results');

    // New elements for dynamic stats
    this.categoriesCountEl = document.getElementById('junk-categories-count');
    // New stat card elements
    this.progressFillEl = document.getElementById('junk-progress-fill');
    this.systemDataSizeEl = document.getElementById('system-data-size');
    this.legendSizeEl = document.getElementById('junk-legend-size');
    this.scanDurationEl = document.getElementById('junk-scan-duration');
    this.insightsListEl = document.getElementById('junk-insights-list');
    this.selectAllSafeBtn = document.getElementById('junk-select-all-safe');
    this.deselectAllBtn = document.getElementById('junk-deselect-all');
    this.exportBtn = document.getElementById('junk-export-btn');

    // Scan mode and custom path
    this.scanMode = 'full';
    this.customPath = null;
    this.scanStartTime = null;

    // Bind scan button
    if (this.scanBtn) {
      this.scanBtn.addEventListener('click', () => this.startScan());
    }

    // Bind clean button
    if (this.cleanBtn) {
      this.cleanBtn.addEventListener('click', () => this.cleanSelected());
    }

    // Bind Select All Safe button
    if (this.selectAllSafeBtn) {
      this.selectAllSafeBtn.addEventListener('click', () => this.selectAllSafe());
    }

    // Bind Deselect All button
    if (this.deselectAllBtn) {
      this.deselectAllBtn.addEventListener('click', () => this.deselectAll());
    }

    // Bind Export Report button
    if (this.exportBtn) {
      this.exportBtn.addEventListener('click', () => this.exportReport());
    }

    // Bind scan mode cards
    this.bindScanModeCards();

    // Load categories and quick summary
    this.loadCategories();
    this.loadQuickSummary();
  }

  bindScanModeCards() {
    const modeCards = document.querySelectorAll('.scan-mode-card');
    modeCards.forEach(card => {
      card.addEventListener('click', async () => {
        // Remove active from all
        modeCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const mode = card.dataset.mode;
        this.scanMode = mode;

        // If custom mode, open folder picker
        if (mode === 'custom') {
          await this.selectCustomFolder();
        } else {
          this.customPath = null;
        }
      });
    });
  }

  async selectCustomFolder() {
    if (!window.deadbyte?.files?.selectFolder) {
      window.DeadBYTE?.toast?.error('Error', 'Folder selection not available');
      return;
    }

    try {
      const result = await window.deadbyte.files.selectFolder();
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        this.customPath = result.filePaths[0];
        window.DeadBYTE?.toast?.info('Custom Scan', `Selected: ${this.customPath}`);
      } else {
        // Reset to full scan if cancelled
        this.scanMode = 'full';
        this.customPath = null;
        const fullCard = document.querySelector('.scan-mode-card[data-mode="full"]');
        const customCard = document.querySelector('.scan-mode-card[data-mode="custom"]');
        fullCard?.classList.add('active');
        customCard?.classList.remove('active');
      }
    } catch (error) {
      console.error('Folder selection failed:', error);
      window.DeadBYTE?.toast?.error('Error', 'Failed to select folder');
    }
  }

  selectAllSafe() {
    const checkboxes = this.categoriesContainer?.querySelectorAll('[data-junk-category]');
    checkboxes?.forEach(checkbox => {
      const categoryKey = checkbox.dataset.junkCategory;
      const category = this.categories[categoryKey];
      if (category && category.safe) {
        checkbox.checked = true;
        this.selectedCategories.add(categoryKey);
        checkbox.closest('.category-row')?.classList.add('category-row-selected');
      }
    });
    this.updateCleanButton();
    this.updateSelectedSummary();
  }

  deselectAll() {
    const checkboxes = this.categoriesContainer?.querySelectorAll('[data-junk-category]');
    checkboxes?.forEach(checkbox => {
      checkbox.checked = false;
      checkbox.closest('.category-row')?.classList.remove('category-row-selected');
    });
    this.selectedCategories.clear();
    this.updateCleanButton();
    this.updateSelectedSummary();
  }

  async exportReport() {
    if (!this.scanResults) {
      window.DeadBYTE?.toast?.warning('No Data', 'Run a scan first to generate a report');
      return;
    }

    try {
      const report = this.generateHtmlReport();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const filename = `DeadBYTE-JunkReport-${timestamp}.html`;

      // Use IPC save dialog - only show success if file was actually saved
      if (window.deadbyte?.files?.saveFile) {
        const result = await window.deadbyte.files.saveFile(filename, report, { html: true });

        if (result.success) {
          window.DeadBYTE?.toast?.success('Report Exported', `Saved to ${result.path}`);
        } else if (result.canceled) {
          // User canceled - show nothing
          return;
        } else {
          // Write failed
          window.DeadBYTE?.toast?.error('Export Failed', result.message || 'Could not save file');
        }
      } else {
        window.DeadBYTE?.toast?.error('Export Failed', 'Save dialog not available');
      }
    } catch (error) {
      console.error('Export failed:', error);
      window.DeadBYTE?.toast?.error('Export Failed', error.message);
    }
  }

  generateHtmlReport() {
    const data = this.scanResults;
    const insights = this.generateInsights();
    const scanDate = new Date().toLocaleString();
    const scanMode = this.scanMode.charAt(0).toUpperCase() + this.scanMode.slice(1);

    let categoriesHtml = '';
    for (const [key, category] of Object.entries(data.categories)) {
      const categoryInfo = this.categories[key];
      const name = categoryInfo?.name || key;
      const safeClass = categoryInfo?.safe ? 'safe' : 'unsafe';
      categoriesHtml += `
        <div class="category-card">
          <div class="category-name">${escapeHtml(name)}</div>
          <div class="category-stats">
            <span class="stat"><strong>${category.fileCount.toLocaleString()}</strong> files</span>
            <span class="stat"><strong>${formatBytes(category.size)}</strong></span>
            <span class="stat ${safeClass}">${categoryInfo?.safe ? 'Safe to delete' : 'Review before delete'}</span>
          </div>
        </div>`;
    }

    let insightsHtml = insights.map(i =>
      `<li class="insight-${i.type || 'info'}">${escapeHtml(i.text)}</li>`
    ).join('');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>DeadBYTE Junk Scan Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0a0a0a;
      color: #e0e0e0;
      padding: 40px;
      line-height: 1.6;
    }
    .container { max-width: 800px; margin: 0 auto; }
    .header {
      text-align: center;
      padding: 30px 0;
      border-bottom: 1px solid #2a2a2a;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .logo span { color: #00d4ff; }
    .subtitle { color: #888; font-size: 14px; }
    .meta {
      display: flex;
      gap: 30px;
      justify-content: center;
      margin-top: 20px;
      font-size: 13px;
      color: #888;
    }
    .section {
      background: #111;
      border: 1px solid #222;
      border-radius: 8px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 20px;
      color: #fff;
      border-bottom: 1px solid #2a2a2a;
      padding-bottom: 10px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }
    .summary-item {
      text-align: center;
      padding: 20px;
      background: #1a1a1a;
      border-radius: 6px;
    }
    .summary-value {
      font-size: 28px;
      font-weight: 700;
      color: #00d4ff;
    }
    .summary-label {
      font-size: 12px;
      color: #888;
      margin-top: 5px;
    }
    .category-card {
      padding: 16px;
      background: #1a1a1a;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .category-name {
      font-weight: 600;
      margin-bottom: 8px;
    }
    .category-stats {
      display: flex;
      gap: 20px;
      font-size: 13px;
      color: #888;
    }
    .stat.safe { color: #4ade80; }
    .stat.unsafe { color: #f59e0b; }
    .insights-list {
      list-style: none;
    }
    .insights-list li {
      padding: 12px 16px;
      background: #1a1a1a;
      border-radius: 6px;
      margin-bottom: 8px;
      border-left: 3px solid #00d4ff;
    }
    .insights-list li.insight-warning { border-left-color: #f59e0b; }
    .insights-list li.insight-error { border-left-color: #ef4444; }
    .footer {
      text-align: center;
      padding: 30px 0;
      color: #555;
      font-size: 12px;
      border-top: 1px solid #2a2a2a;
      margin-top: 30px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Dead<span>BYTE</span></div>
      <div class="subtitle">Junk Scan Report</div>
      <div class="meta">
        <span>Date: ${escapeHtml(scanDate)}</span>
        <span>Mode: ${escapeHtml(scanMode)}</span>
        ${this.customPath ? `<span>Path: ${escapeHtml(this.customPath)}</span>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Summary</div>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-value">${formatBytes(data.totalSize)}</div>
          <div class="summary-label">Recoverable Space</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${data.totalFiles.toLocaleString()}</div>
          <div class="summary-label">Junk Files</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${Object.keys(data.categories).length}</div>
          <div class="summary-label">Categories</div>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Category Breakdown</div>
      ${categoriesHtml}
    </div>

    ${insights.length > 0 ? `
    <div class="section">
      <div class="section-title">Insights</div>
      <ul class="insights-list">
        ${insightsHtml}
      </ul>
    </div>
    ` : ''}

    <div class="footer">
      Generated by DeadBYTE v1.0.0
    </div>
  </div>
</body>
</html>`;
  }

  generateReport() {
    const data = this.scanResults;
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '                    DEADBYTE JUNK SCAN REPORT',
      '═══════════════════════════════════════════════════════════',
      '',
      `Scan Date: ${new Date().toLocaleString()}`,
      `Scan Mode: ${this.scanMode.charAt(0).toUpperCase() + this.scanMode.slice(1)}`,
      this.customPath ? `Custom Path: ${this.customPath}` : '',
      '',
      '───────────────────────────────────────────────────────────',
      '                        SUMMARY',
      '───────────────────────────────────────────────────────────',
      '',
      `Total Recoverable Space: ${formatBytes(data.totalSize)}`,
      `Total Junk Files: ${data.totalFiles.toLocaleString()}`,
      `Categories Scanned: ${Object.keys(data.categories).length}`,
      '',
      '───────────────────────────────────────────────────────────',
      '                    CATEGORY BREAKDOWN',
      '───────────────────────────────────────────────────────────',
      ''
    ];

    for (const [key, category] of Object.entries(data.categories)) {
      const categoryInfo = this.categories[key];
      const name = categoryInfo?.name || key;
      lines.push(`[${name}]`);
      lines.push(`  Files: ${category.fileCount.toLocaleString()}`);
      lines.push(`  Size: ${formatBytes(category.size)}`);
      lines.push(`  Safe to Delete: ${categoryInfo?.safe ? 'Yes' : 'No'}`);
      lines.push('');
    }

    lines.push('───────────────────────────────────────────────────────────');
    lines.push('                      INSIGHTS');
    lines.push('───────────────────────────────────────────────────────────');
    lines.push('');

    const insights = this.generateInsights();
    insights.forEach(insight => {
      lines.push(`• ${insight.text}`);
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');
    lines.push('              Generated by DeadBYTE v1.0.0');
    lines.push('═══════════════════════════════════════════════════════════');

    return lines.filter(l => l !== undefined).join('\n');
  }

  generateInsights() {
    const insights = [];
    const data = this.scanResults;

    if (!data) return insights;

    // Large junk detected
    if (data.totalSize > 1024 * 1024 * 1024) {
      insights.push({
        type: 'warning',
        text: `${formatBytes(data.totalSize)} of junk files detected - cleaning recommended`
      });
    }

    // Category-specific insights
    for (const [key, category] of Object.entries(data.categories)) {
      const categoryInfo = this.categories[key];

      if (key === 'browser' && category.size > 500 * 1024 * 1024) {
        insights.push({
          type: 'warning',
          text: `Browser cache is ${formatBytes(category.size)} - consider clearing for better performance`
        });
      }

      if (key === 'temp' && category.size > 200 * 1024 * 1024) {
        insights.push({
          type: 'info',
          text: `${formatBytes(category.size)} of temporary files can be safely removed`
        });
      }

      if (key === 'update' && category.size > 1024 * 1024 * 1024) {
        insights.push({
          type: 'info',
          text: `${formatBytes(category.size)} of Windows Update files can be cleaned`
        });
      }

      if (key === 'log' && category.fileCount > 100) {
        insights.push({
          type: 'tip',
          text: `${category.fileCount} log files found - cleaning improves disk performance`
        });
      }

      if (key === 'trash' && category.size > 100 * 1024 * 1024) {
        insights.push({
          type: 'warning',
          text: `Recycle Bin contains ${formatBytes(category.size)} - consider emptying`
        });
      }
    }

    // General tips
    if (data.totalFiles > 1000) {
      insights.push({
        type: 'tip',
        text: 'Regular cleaning can improve system startup time'
      });
    }

    if (insights.length === 0) {
      insights.push({
        type: 'tip',
        text: 'Your system is relatively clean - good job!'
      });
    }

    return insights;
  }

  updateInsightsPanel() {
    if (!this.insightsListEl) return;

    const insights = this.generateInsights();

    const typeClasses = {
      warning: 'insight-item-warning',
      info: 'insight-item-info',
      tip: 'insight-item-tip'
    };

    const typeIcons = {
      warning: '!',
      info: 'i',
      tip: '★'
    };

    this.insightsListEl.innerHTML = insights.map(insight => `
      <div class="insight-item ${typeClasses[insight.type] || 'insight-item-info'}">
        <span class="insight-icon">${typeIcons[insight.type] || 'i'}</span>
        <span class="insight-text">${escapeHtml(insight.text)}</span>
      </div>
    `).join('');
  }

  async loadCategories() {
    if (!window.deadbyte?.junk) return;

    try {
      const result = await window.deadbyte.junk.categories();
      if (result.success) {
        this.categories = result.data;
        this.renderCategories();
      }
    } catch (error) {
      console.error('Failed to load junk categories:', error);
    }
  }

  async loadQuickSummary() {
    if (!window.deadbyte?.junk) return;

    try {
      const result = await window.deadbyte.junk.quickSummary();
      if (result.success) {
        this.updateSummary(result.data.estimatedSize, 0, true);
      }
    } catch (error) {
      console.error('Failed to load quick summary:', error);
    }
  }

  renderCategories() {
    if (!this.categoriesContainer) return;

    const safeCategories = Object.values(this.categories).filter(c => c.safe);

    let html = '';
    for (const category of safeCategories) {
      const icon = this.getCategoryIcon(category.icon);
      const iconColor = this.getCategoryColor(category.icon);
      html += `
        <div class="category-row category-row-selected" data-category="${category.key}">
          <label class="category-select">
            <input type="checkbox" checked data-junk-category="${category.key}">
            <span class="category-checkbox"></span>
          </label>
          <div class="category-icon" style="--category-color: ${iconColor};">
            ${icon}
          </div>
          <div class="category-info">
            <div class="category-name">${escapeHtml(category.name)}</div>
            <div class="category-detail">${escapeHtml(category.description)}</div>
          </div>
          <div class="category-stats">
            <span class="category-files" id="junk-files-${category.key}">—</span>
            <span class="category-size" id="junk-size-${category.key}">—</span>
          </div>
          <div class="category-risk risk-low">Safe</div>
        </div>
      `;
    }

    this.categoriesContainer.innerHTML = html;

    // Bind category checkboxes
    this.bindCategoryCheckboxes();

    // Select all by default
    Object.keys(this.categories).forEach(key => {
      if (this.categories[key].safe) {
        this.selectedCategories.add(key);
      }
    });

    // Update selected count
    this.updateSelectedSummary();
  }

  getCategoryColor(iconName) {
    const colors = {
      temp: 'var(--color-warning)',
      browser: '#4285F4',
      image: 'var(--color-accent-analyzer)',
      update: '#0078D4',
      trash: '#EF4444',
      log: '#6B7280',
      speed: 'var(--color-accent-performance)',
      recent: 'var(--color-text-secondary)',
      font: '#8B5CF6',
      installer: '#10B981'
    };
    return colors[iconName] || 'var(--color-accent-analyzer)';
  }

  getCategoryIcon(iconName) {
    const icons = {
      temp: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z"/></svg>',
      browser: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/><line x1="21.17" y1="8" x2="12" y2="8"/><line x1="3.95" y1="6.06" x2="8.54" y2="14"/><line x1="10.88" y1="21.94" x2="15.46" y2="14"/></svg>',
      image: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>',
      update: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 00-9-9 9.75 9.75 0 00-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 009 9 9.75 9.75 0 006.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>',
      trash: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
      log: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
      speed: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0016.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 002 8.5c0 2.3 1.5 4.05 3 5.5l7 7z"/></svg>',
      recent: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
      font: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>',
      installer: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
    };
    return icons[iconName] || icons.temp;
  }

  bindCategoryCheckboxes() {
    const checkboxes = this.categoriesContainer?.querySelectorAll('[data-junk-category]');
    checkboxes?.forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const categoryKey = e.target.dataset.junkCategory;
        const row = e.target.closest('.category-row');

        if (e.target.checked) {
          this.selectedCategories.add(categoryKey);
          row?.classList.add('category-row-selected');
        } else {
          this.selectedCategories.delete(categoryKey);
          row?.classList.remove('category-row-selected');
        }

        this.updateCleanButton();
        this.updateSelectedSummary();
      });
    });
  }

  updateSelectedSummary() {
    const countEl = document.getElementById('junk-selected-count');
    const sizeEl = document.getElementById('junk-selected-size');

    if (countEl) {
      countEl.textContent = this.selectedCategories.size;
    }

    if (sizeEl && this.scanResults) {
      let selectedSize = 0;
      for (const key of this.selectedCategories) {
        if (this.scanResults.categories[key]) {
          selectedSize += this.scanResults.categories[key].size;
        }
      }
      sizeEl.textContent = formatBytes(selectedSize);
    }
  }

  async startScan() {
    if (this.isScanning || !window.deadbyte?.junk) return;

    // Check if custom mode but no path selected
    if (this.scanMode === 'custom' && !this.customPath) {
      await this.selectCustomFolder();
      if (!this.customPath) return;
    }

    this.isScanning = true;
    this.scanStartTime = Date.now();
    this.showScanningState();

    try {
      window.DeadBYTE?.skull?.setState('scanning');

      const scanOptions = {
        categories: Array.from(this.selectedCategories),
        includeUnsafe: false,
        mode: this.scanMode
      };

      // Add custom path if in custom mode
      if (this.scanMode === 'custom' && this.customPath) {
        scanOptions.customPath = this.customPath;
      }

      const result = await window.deadbyte.junk.scan(scanOptions);

      if (result.success) {
        this.scanResults = result.data;
        this.updateSummary(result.data.totalSize, result.data.totalFiles);
        this.updateCategorySizes(result.data.categories);
        this.updateScanStats();
        this.updateInsightsPanel();
        window.DeadBYTE?.skull?.setState('success');
      } else {
        console.error('Scan failed:', result.message);
        window.DeadBYTE?.skull?.setState('error');
      }
    } catch (error) {
      console.error('Scan error:', error);
      window.DeadBYTE?.skull?.setState('error');
    } finally {
      this.isScanning = false;
      this.hideScanningState();
    }
  }

  updateScanStats() {
    // Update categories count
    if (this.categoriesCountEl && this.scanResults) {
      const categoryCount = Object.keys(this.scanResults.categories).length;
      this.categoriesCountEl.textContent = categoryCount.toString();
    }

    // Update scan duration
    if (this.scanDurationEl && this.scanStartTime) {
      const durationMs = Date.now() - this.scanStartTime;
      this.scanDurationEl.textContent = this.formatDuration(durationMs);
    }
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${seconds}s`;
  }

  async cleanSelected() {
    if (this.isScanning || !window.deadbyte?.junk) return;
    if (this.selectedCategories.size === 0) return;

    this.isScanning = true;
    this.showCleaningState();

    try {
      window.DeadBYTE?.skull?.setState('deleting');

      const result = await window.deadbyte.junk.clean(
        Array.from(this.selectedCategories)
      );

      if (result.success) {
        const freedSpace = formatBytes(result.data.totalFreed);
        window.DeadBYTE?.skull?.setState('success');
        window.DeadBYTE?.toast?.success(
          'Cleanup Complete',
          `Cleaned ${result.data.totalCleaned} files, freed ${freedSpace}`
        );

        // Re-scan to update sizes
        await this.startScan();
      } else {
        window.DeadBYTE?.skull?.setState('error');
        window.DeadBYTE?.toast?.error('Cleanup Failed', result.message || 'Failed to clean files');
      }
    } catch (error) {
      console.error('Clean error:', error);
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Error', `Cleanup failed: ${error.message}`);
    } finally {
      this.isScanning = false;
      this.hideCleaningState();
    }
  }

  showScanningState() {
    if (this.scanBtn) {
      this.scanBtn.classList.add('loading');
      this.scanBtn.disabled = true;
    }
    if (this.cleanBtn) {
      this.cleanBtn.disabled = true;
    }
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
      this.progressBar.parentElement?.classList.remove('hidden');
    }
    if (this.progressText) {
      this.progressText.textContent = 'Scanning...';
    }
  }

  hideScanningState() {
    if (this.scanBtn) {
      this.scanBtn.classList.remove('loading');
      this.scanBtn.disabled = false;
    }
    if (this.cleanBtn) {
      this.cleanBtn.disabled = false;
    }
    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }
    if (this.progressText) {
      this.progressText.textContent = 'Scan complete';
    }
    this.updateCleanButton();
  }

  showCleaningState() {
    if (this.cleanBtn) {
      this.cleanBtn.classList.add('loading');
      this.cleanBtn.disabled = true;
    }
    if (this.scanBtn) {
      this.scanBtn.disabled = true;
    }
    if (this.progressText) {
      this.progressText.textContent = 'Cleaning...';
    }
  }

  hideCleaningState() {
    if (this.cleanBtn) {
      this.cleanBtn.classList.remove('loading');
      this.cleanBtn.disabled = false;
    }
    if (this.scanBtn) {
      this.scanBtn.disabled = false;
    }
  }

  updateSummary(totalSize, totalFiles, isEstimate = false) {
    if (this.totalSizeEl) {
      if (isEstimate) {
        this.totalSizeEl.textContent = `~${formatBytes(totalSize)}`;
      } else {
        // Animate count-up for the main value
        this.animateSizeCountUp(totalSize);
      }
    }
    if (this.totalFilesEl) {
      this.totalFilesEl.textContent = isEstimate ? '—' : totalFiles.toLocaleString();
    }

    // Update progress bar
    this.updateRecoverableProgress(totalSize, isEstimate);

    // Update legend junk size
    if (this.legendSizeEl) {
      this.legendSizeEl.textContent = isEstimate ? '—' : formatBytes(totalSize);
    }
  }

  animateSizeCountUp(targetSize) {
    // Cancel any existing animation
    if (this.sizeAnimationId) {
      cancelAnimationFrame(this.sizeAnimationId);
      this.sizeAnimationId = null;
    }

    const startSize = this.previousTotalSize;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentSize = startSize + (targetSize - startSize) * easeOut;
      this.totalSizeEl.textContent = formatBytes(Math.round(currentSize));

      if (progress < 1) {
        this.sizeAnimationId = requestAnimationFrame(animate);
      } else {
        this.totalSizeEl.textContent = formatBytes(targetSize);
        this.previousTotalSize = targetSize;
        this.sizeAnimationId = null;
      }
    };

    this.sizeAnimationId = requestAnimationFrame(animate);
  }

  async updateRecoverableProgress(junkSize, isEstimate = false) {
    // Get disk usage to calculate percentage
    let totalDiskSize = 500 * 1024 * 1024 * 1024; // Default 500GB fallback
    let usedDiskSize = 0;

    try {
      const diskUsage = await window.deadbyte?.metrics?.getDiskUsage();
      if (diskUsage?.success && diskUsage.data?.length > 0) {
        // Use the first/main drive (usually C:)
        const mainDrive = diskUsage.data[0];
        totalDiskSize = mainDrive.total || totalDiskSize;
        usedDiskSize = mainDrive.used || 0;
      }
    } catch (e) {
      console.warn('Could not get disk usage:', e);
    }

    // Update system data size
    if (this.systemDataSizeEl) {
      this.systemDataSizeEl.textContent = isEstimate ? '—' : formatBytes(usedDiskSize - junkSize);
    }

    // Calculate junk as percentage of total disk
    const percentage = totalDiskSize > 0 ? (junkSize / totalDiskSize) * 100 : 0;
    const clampedPercent = Math.min(Math.max(percentage, 0), 100);

    // Update progress bar
    if (this.progressFillEl) {
      if (isEstimate || junkSize === 0) {
        this.progressFillEl.classList.add('no-data');
        this.progressFillEl.style.width = '0%';
      } else {
        this.progressFillEl.classList.remove('no-data');
        // Use a minimum visible width for small percentages
        const displayPercent = clampedPercent < 1 && clampedPercent > 0 ? 1 : clampedPercent;
        this.progressFillEl.style.width = `${displayPercent}%`;
      }
    }
  }

  updateCategorySizes(categories) {
    for (const [key, category] of Object.entries(categories)) {
      const sizeEl = document.getElementById(`junk-size-${key}`);
      const filesEl = document.getElementById(`junk-files-${key}`);

      if (sizeEl) {
        sizeEl.textContent = formatBytes(category.size);
        if (category.size > 0) {
          sizeEl.classList.add('has-junk');
        } else {
          sizeEl.classList.remove('has-junk');
        }
      }

      if (filesEl) {
        filesEl.textContent = `${category.fileCount.toLocaleString()} files`;
      }
    }

    // Update files analyzed (we'll estimate this as total files scanned)
    const filesAnalyzedEl = document.getElementById('junk-files-analyzed');
    if (filesAnalyzedEl && this.scanResults) {
      filesAnalyzedEl.textContent = this.scanResults.totalFiles.toLocaleString();
    }

    // Update selected summary
    this.updateSelectedSummary();
  }

  updateCleanButton() {
    if (this.cleanBtn) {
      this.cleanBtn.disabled = this.selectedCategories.size === 0 || this.isScanning;
    }
  }

  showSuccessMessage(message) {
    // Could integrate with a toast/notification system
    Debug.log('Junk Cleaner:', message);
  }

  // Get scan results
  getResults() {
    return this.scanResults;
  }

  // Get selected categories
  getSelectedCategories() {
    return Array.from(this.selectedCategories);
  }
}


// ============================================
// MAINTENANCE TOOLS
// ============================================

class MaintenanceTools {
  constructor() {
    this.scanResults = null;
    this.registryIssues = [];
    this.diskHealth = [];
    this.isScanning = false;
    this.selectedMode = 'deep';
    this.selectedIssues = new Set();
    // Animation tracking
    this.previousHealthScore = 0;
    this.scoreAnimationId = null;
    // Terminal tracking
    this.terminalStartTime = null;
    this.terminalElapsedInterval = null;
    this.init();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Cache DOM elements
    this.modeCards = document.querySelectorAll('.maint-mode-card');
    this.healthScoreEl = document.getElementById('maint-health-score');
    this.healthRingEl = document.getElementById('maint-health-ring');
    this.criticalCountEl = document.getElementById('maint-critical-count');
    this.warningsCountEl = document.getElementById('maint-warnings-count');
    this.recsCountEl = document.getElementById('maint-recs-count');
    this.lastScanEl = document.getElementById('maint-last-scan');
    this.insightsContainer = document.getElementById('maint-insights');
    this.registryContainer = document.getElementById('maint-registry-list');
    this.diskContainer = document.getElementById('maint-disk-list');
    this.statusChipEl = document.querySelector('.status-chip-maintenance');

    // Progress elements
    this.progressContainer = document.getElementById('maint-progress-container');
    this.progressBar = document.getElementById('maint-progress-bar');
    this.progressText = document.getElementById('maint-progress-text');

    // Action elements
    this.selectedCountEl = document.getElementById('maint-selected-count');
    this.selectedEntriesEl = document.getElementById('maint-selected-entries');
    this.fixBtn = document.getElementById('maint-fix-btn');
    this.rescanBtn = document.getElementById('maint-rescan-btn');

    // Tool buttons
    this.sfcBtn = document.getElementById('maint-sfc-btn');
    this.dismBtn = document.getElementById('maint-dism-btn');
    this.chkdskBtn = document.getElementById('maint-chkdsk-btn');
    this.resetUpdateBtn = document.getElementById('maint-reset-update-btn');
    this.registryRescanBtn = document.getElementById('maint-registry-rescan-btn');

    // Terminal elements
    this.terminalContainer = document.getElementById('repair-terminal-container');
    this.terminalOutput = document.getElementById('repair-terminal-output');
    this.terminalTitle = document.getElementById('repair-terminal-title');
    this.terminalElapsed = document.getElementById('repair-terminal-elapsed');
    this.terminalStatus = document.getElementById('repair-terminal-status');
    this.terminalCopyBtn = document.getElementById('repair-terminal-copy');
    this.terminalCloseBtn = document.getElementById('repair-terminal-close');

    // Bind terminal controls
    this.terminalCopyBtn?.addEventListener('click', () => this.copyTerminalOutput());
    this.terminalCloseBtn?.addEventListener('click', () => this.hideTerminal());

    // Bind mode cards
    this.modeCards.forEach(card => {
      card.addEventListener('click', () => this.selectMode(card.dataset.mode));
    });

    // Bind action buttons
    if (this.rescanBtn) {
      this.rescanBtn.addEventListener('click', () => this.runHealthCheck());
    }
    if (this.fixBtn) {
      this.fixBtn.addEventListener('click', () => this.fixSelectedIssues());
    }

    // Bind tool buttons
    if (this.sfcBtn) {
      this.sfcBtn.addEventListener('click', () => this.runTool('sfc'));
    }
    if (this.dismBtn) {
      this.dismBtn.addEventListener('click', () => this.runTool('dism'));
    }
    if (this.chkdskBtn) {
      this.chkdskBtn.addEventListener('click', () => this.runTool('chkdsk'));
    }
    if (this.resetUpdateBtn) {
      this.resetUpdateBtn.addEventListener('click', () => this.runTool('resetUpdate'));
    }
    if (this.registryRescanBtn) {
      this.registryRescanBtn.addEventListener('click', () => this.rescanRegistry());
    }

    // Load quick summary on init
    this.loadQuickSummary();
  }

  selectMode(mode) {
    this.selectedMode = mode;
    this.modeCards.forEach(card => {
      card.classList.toggle('active', card.dataset.mode === mode);
    });
  }

  async rescanRegistry() {
    if (this.isScanning || !window.deadbyte?.maintenance) return;

    this.isScanning = true;

    // Show loading state on registry section
    if (this.registryRescanBtn) {
      this.registryRescanBtn.disabled = true;
      this.registryRescanBtn.classList.add('loading');
    }

    try {
      window.DeadBYTE?.skull?.setState('scanning');

      const result = await window.deadbyte.maintenance.scanRegistry(this.selectedMode);

      if (result.issues) {
        this.registryIssues = result.issues;
        this.selectedIssues.clear();
        this.renderRegistry();
        this.updateSelectedCount();
        window.DeadBYTE?.skull?.setState('success');
        window.DeadBYTE?.toast?.success('Registry Scan', `Found ${result.issues.length} issue categories`);
      }
    } catch (error) {
      console.error('Registry scan error:', error);
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Scan Failed', error.message);
    } finally {
      this.isScanning = false;
      if (this.registryRescanBtn) {
        this.registryRescanBtn.disabled = false;
        this.registryRescanBtn.classList.remove('loading');
      }
    }
  }

  async loadQuickSummary() {
    if (!window.deadbyte?.maintenance) return;

    try {
      const result = await window.deadbyte.maintenance.quickSummary();
      if (result.success) {
        this.updateQuickSummary(result.data);
      }
    } catch (error) {
      console.error('Failed to load maintenance summary:', error);
    }
  }

  updateQuickSummary(summary) {
    // Update health score
    if (this.healthScoreEl) {
      if (summary.estimatedScore !== null && summary.estimatedScore !== undefined) {
        this.healthScoreEl.textContent = summary.hasCachedData ? summary.estimatedScore : `~${summary.estimatedScore}`;
      } else {
        this.healthScoreEl.textContent = '--';
      }
    }

    // Update last scan time
    if (this.lastScanEl) {
      this.lastScanEl.textContent = summary.lastScan || 'Never';
    }

    // Update status hint based on cached data
    const statusHintEl = document.getElementById('maint-status-hint');
    if (statusHintEl) {
      if (summary.hasCachedData) {
        statusHintEl.textContent = 'Last result shown. Click "Rescan All" for fresh data.';
      } else {
        statusHintEl.textContent = 'Click "Rescan All" to check system health';
      }
    }
  }

  async runHealthCheck() {
    if (this.isScanning || !window.deadbyte?.maintenance) return;

    this.isScanning = true;
    this.showScanningState();

    // Start progress polling
    this.startProgressPolling();

    try {
      window.DeadBYTE?.skull?.setState('scanning');

      const result = await window.deadbyte.maintenance.healthCheck({
        mode: this.selectedMode
      });

      if (result.success) {
        this.scanResults = result.data;
        this.registryIssues = result.data.registry || [];
        this.diskHealth = result.data.disk || [];
        this.updateUI();
        window.DeadBYTE?.skull?.setState('success');
        window.DeadBYTE?.toast?.success('Health Check', 'System scan completed');
      } else {
        console.error('Health check failed:', result.message);
        window.DeadBYTE?.skull?.setState('error');
        window.DeadBYTE?.toast?.error('Scan Failed', result.message);
      }
    } catch (error) {
      console.error('Health check error:', error);
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Error', error.message);
    } finally {
      this.isScanning = false;
      this.stopProgressPolling();
      this.hideScanningState();
    }
  }

  startProgressPolling() {
    this.progressPollInterval = setInterval(async () => {
      try {
        const status = await window.deadbyte?.maintenance?.status();
        if (status?.isScanning) {
          this.updateProgressBar(status.progress, status.currentOperation);
        }
      } catch (e) {
        // Ignore polling errors
      }
    }, 200);
  }

  stopProgressPolling() {
    if (this.progressPollInterval) {
      clearInterval(this.progressPollInterval);
      this.progressPollInterval = null;
    }
  }

  updateProgressBar(progress, operation) {
    if (this.progressBar) {
      this.progressBar.style.width = `${progress}%`;
    }
    if (this.progressText && operation) {
      this.progressText.textContent = operation;
    }
  }

  showScanningState() {
    if (this.progressContainer) {
      this.progressContainer.classList.remove('hidden');
    }
    if (this.progressBar) {
      this.progressBar.style.width = '0%';
    }
    if (this.progressText) {
      this.progressText.textContent = 'Initializing...';
    }
    if (this.rescanBtn) {
      this.rescanBtn.disabled = true;
      this.rescanBtn.classList.add('loading');
    }
  }

  hideScanningState() {
    if (this.progressBar) {
      this.progressBar.style.width = '100%';
    }
    if (this.progressText) {
      this.progressText.textContent = 'Scan complete';
    }
    // Brief delay to show 100% before hiding
    setTimeout(() => {
      if (this.progressContainer && !this.isScanning) {
        this.progressContainer.classList.add('hidden');
      }
    }, 1500);
    if (this.rescanBtn) {
      this.rescanBtn.disabled = false;
      this.rescanBtn.classList.remove('loading');
    }
  }

  updateUI() {
    if (!this.scanResults) return;

    // Update health score
    this.updateHealthScore(this.scanResults.healthScore);

    // Update metrics
    this.updateMetrics();

    // Update insights
    this.renderInsights();

    // Update registry list
    this.renderRegistry();

    // Update disk health
    this.renderDiskHealth();

    // Update status chip
    this.updateStatusChip();
  }

  updateHealthScore(score) {
    // Animate the score count-up
    if (this.healthScoreEl) {
      this.animateScoreCountUp(score);
    }

    // Animate the ring
    if (this.healthRingEl) {
      const circumference = 339.3;
      const targetOffset = circumference - (score / 100) * circumference;

      // Animate ring fill
      this.healthRingEl.style.transition = 'stroke-dashoffset 0.8s ease-out, stroke 0.3s ease';
      this.healthRingEl.style.strokeDashoffset = targetOffset;

      // Update color based on score
      let color = 'var(--color-success)';
      if (score < 70) color = 'var(--color-warning)';
      if (score < 50) color = 'var(--color-error)';
      this.healthRingEl.style.stroke = color;
    }
  }

  animateScoreCountUp(targetScore) {
    // Cancel any existing animation
    if (this.scoreAnimationId) {
      cancelAnimationFrame(this.scoreAnimationId);
      this.scoreAnimationId = null;
    }

    const startScore = this.previousHealthScore;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentValue = Math.round(startScore + (targetScore - startScore) * easeOut);
      this.healthScoreEl.textContent = currentValue;

      if (progress < 1) {
        this.scoreAnimationId = requestAnimationFrame(animate);
      } else {
        this.healthScoreEl.textContent = targetScore;
        this.previousHealthScore = targetScore;
        this.scoreAnimationId = null;
      }
    };

    this.scoreAnimationId = requestAnimationFrame(animate);
  }

  updateMetrics() {
    if (this.criticalCountEl) {
      this.criticalCountEl.textContent = this.scanResults.criticalIssues || 0;
    }
    if (this.warningsCountEl) {
      this.warningsCountEl.textContent = this.scanResults.warnings || 0;
    }
    if (this.recsCountEl) {
      this.recsCountEl.textContent = this.scanResults.recommendations || 0;
    }
    if (this.lastScanEl) {
      this.lastScanEl.textContent = 'Just now';
    }
  }

  renderInsights() {
    if (!this.insightsContainer || !this.scanResults.insights) return;

    const insights = this.scanResults.insights;
    if (insights.length === 0) {
      this.insightsContainer.innerHTML = `
        <div class="maint-insight maint-insight-success">
          <span class="maint-insight-icon">&#x2713;</span>
          <span class="maint-insight-text">System is in excellent health</span>
        </div>
      `;
      return;
    }

    this.insightsContainer.innerHTML = insights.map(insight => `
      <div class="maint-insight maint-insight-${insight.type}">
        <span class="maint-insight-icon">${this.getInsightIcon(insight.type)}</span>
        <span class="maint-insight-text">${escapeHtml(insight.text)}</span>
      </div>
    `).join('');
  }

  getInsightIcon(type) {
    switch (type) {
      case 'success': return '&#x2713;';
      case 'warning': return '!';
      case 'info': return 'i';
      default: return '&bull;';
    }
  }

  renderRegistry() {
    if (!this.registryContainer) return;

    if (this.registryIssues.length === 0) {
      this.registryContainer.innerHTML = `
        <div class="registry-row registry-row-safe">
          <div class="registry-icon registry-icon-safe">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="registry-info">
            <span class="registry-name">Registry is Clean</span>
            <span class="registry-detail">No issues found</span>
          </div>
          <span class="registry-risk risk-low">Healthy</span>
        </div>
      `;
      return;
    }

    this.registryContainer.innerHTML = this.registryIssues.map(issue => `
      <div class="registry-row registry-row-${issue.severity}" data-issue-id="${issue.id}">
        <label class="registry-select">
          <input type="checkbox" ${issue.canFix ? '' : 'disabled'} onchange="window.DeadBYTE?.maintenanceTools?.toggleIssue('${issue.id}')">
          <span class="registry-checkbox"></span>
        </label>
        <div class="registry-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7"/>
            <ellipse cx="12" cy="7" rx="8" ry="4"/>
          </svg>
        </div>
        <div class="registry-info">
          <span class="registry-name">${escapeHtml(issue.name)}</span>
          <span class="registry-detail">${escapeHtml(issue.path)}</span>
        </div>
        <span class="registry-count">${issue.count} entries</span>
        <span class="registry-risk risk-${issue.risk}">${issue.risk === 'low' ? 'Low Risk' : issue.risk === 'medium' ? 'Medium' : 'High'}</span>
      </div>
    `).join('');

    this.updateSelectedCount();
  }

  renderDiskHealth() {
    if (!this.diskContainer) return;

    if (this.diskHealth.length === 0) {
      this.diskContainer.innerHTML = `
        <div class="disk-row disk-row-healthy">
          <div class="disk-status-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="disk-info">
            <span class="disk-name">No disk information available</span>
            <span class="disk-detail">Run a health check to scan disks</span>
          </div>
        </div>
      `;
      return;
    }

    this.diskContainer.innerHTML = this.diskHealth.map(disk => `
      <div class="disk-row disk-row-${disk.healthy ? 'healthy' : 'warning'}">
        <div class="disk-status-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-${disk.healthy ? 'success' : 'warning'})" stroke-width="2">
            ${disk.healthy ?
              '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>' :
              '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>'
            }
          </svg>
        </div>
        <div class="disk-info">
          <span class="disk-name">${escapeHtml(disk.name)}</span>
          <span class="disk-detail">${disk.type} - ${disk.size}</span>
        </div>
        <div class="disk-stats">
          <div class="disk-stat">
            <span class="disk-stat-value">${disk.temperature !== null ? disk.temperature + '°C' : '—'}</span>
            <span class="disk-stat-label">Temp</span>
          </div>
          <div class="disk-stat">
            <span class="disk-stat-value">${disk.health !== null ? disk.health + '%' : '—'}</span>
            <span class="disk-stat-label">Health</span>
          </div>
        </div>
        <span class="disk-status">${escapeHtml(disk.status)}</span>
      </div>
    `).join('');
  }

  updateStatusChip() {
    if (!this.statusChipEl || !this.scanResults) return;

    const score = this.scanResults.healthScore;
    let statusText = 'System Healthy';
    let statusClass = '';

    if (score < 50) {
      statusText = 'Needs Attention';
      statusClass = 'status-error';
    } else if (score < 70) {
      statusText = 'Minor Issues';
      statusClass = 'status-warning';
    }

    this.statusChipEl.className = `status-chip status-chip-maintenance ${statusClass}`;
    const textEl = this.statusChipEl.querySelector(':not(.status-chip-dot)');
    if (textEl) {
      textEl.textContent = statusText;
    }
  }

  toggleIssue(issueId) {
    if (this.selectedIssues.has(issueId)) {
      this.selectedIssues.delete(issueId);
    } else {
      this.selectedIssues.add(issueId);
    }
    this.updateSelectedCount();
  }

  updateSelectedCount() {
    const count = this.selectedIssues.size;
    const totalEntries = this.registryIssues
      .filter(i => this.selectedIssues.has(i.id))
      .reduce((sum, i) => sum + (i.count || 0), 0);

    if (this.selectedCountEl) {
      this.selectedCountEl.textContent = count;
    }
    if (this.selectedEntriesEl) {
      this.selectedEntriesEl.textContent = totalEntries;
    }
    if (this.fixBtn) {
      this.fixBtn.disabled = count === 0;
    }
  }

  async fixSelectedIssues() {
    if (this.selectedIssues.size === 0 || !window.deadbyte?.maintenance) return;

    // Calculate total entries to clean
    const totalEntries = this.registryIssues
      .filter(i => this.selectedIssues.has(i.id))
      .reduce((sum, i) => sum + (i.count || 0), 0);

    // Show confirmation dialog
    this.showConfirmDialog({
      title: 'Clean Registry Issues',
      message: `This will remove <strong>${totalEntries}</strong> registry entries from ${this.selectedIssues.size} issue categories.`,
      warning: 'Registry changes cannot be undone. Only continue if you understand the risks.',
      confirmText: 'Clean Registry',
      onConfirm: () => this.executeRegistryClean()
    });
  }

  async executeRegistryClean() {
    try {
      window.DeadBYTE?.skull?.setState('scanning');
      this.fixBtn.disabled = true;
      this.fixBtn.classList.add('loading');

      const result = await window.deadbyte.maintenance.cleanRegistry(
        Array.from(this.selectedIssues)
      );

      if (result.success) {
        // Remove fixed issues from list
        this.registryIssues = this.registryIssues.filter(
          i => !this.selectedIssues.has(i.id) || result.details.find(d => d.id === i.id)?.status !== 'cleaned'
        );
        this.selectedIssues.clear();
        this.renderRegistry();
        window.DeadBYTE?.skull?.setState('success');
        window.DeadBYTE?.toast?.success('Registry Cleaned', `${result.cleaned} entries removed`);
      } else {
        window.DeadBYTE?.skull?.setState('error');
        window.DeadBYTE?.toast?.error('Cleanup Failed', 'Some entries could not be removed');
      }
    } catch (error) {
      console.error('Failed to fix issues:', error);
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Error', error.message);
    } finally {
      this.fixBtn.disabled = false;
      this.fixBtn.classList.remove('loading');
    }
  }

  async runTool(tool) {
    if (!window.deadbyte?.maintenance) return;

    // Check admin status first
    const isAdmin = await window.deadbyte?.admin?.check();
    if (!isAdmin) {
      window.DeadBYTE?.toast?.warning('Admin Required', 'This tool requires administrator privileges. Please restart as Admin.');
      return;
    }

    // Tool configurations with icons
    const toolConfigs = {
      sfc: {
        name: 'System File Checker',
        subtitle: 'Scan and repair protected system files',
        message: 'This tool will scan all protected Windows system files and replace corrupted files with a cached copy.',
        warning: 'This may take 15-30 minutes. Do not close the application.',
        confirmText: 'Run SFC',
        icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/>
        </svg>`
      },
      dism: {
        name: 'DISM Repair',
        subtitle: 'Repair Windows component store',
        message: 'This tool will scan and restore the health of the Windows image using Windows Update.',
        warning: 'This may take 30+ minutes and requires an internet connection.',
        confirmText: 'Run DISM',
        icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <ellipse cx="12" cy="5" rx="9" ry="3"/>
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
        </svg>`
      },
      chkdsk: {
        name: 'Check Disk',
        subtitle: 'Scan for file system errors',
        message: 'This tool will scan drive C: for file system errors and attempt to fix any problems found.',
        warning: 'The system drive cannot be checked while in use. A restart will be scheduled.',
        confirmText: 'Schedule CHKDSK',
        icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="2" y="4" width="20" height="16" rx="2"/>
          <path d="M6 8h.01M6 12h.01M6 16h.01"/>
          <path d="M10 8h8M10 12h8M10 16h8"/>
        </svg>`
      },
      resetUpdate: {
        name: 'Reset Windows Update',
        subtitle: 'Clear update cache and components',
        message: 'This tool will stop Windows Update services, clear the download cache, and restart the services.',
        warning: 'Windows Update may be temporarily unavailable until services restart.',
        confirmText: 'Reset Update',
        icon: `<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <polyline points="1 4 1 10 7 10"/>
          <polyline points="23 20 23 14 17 14"/>
          <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/>
        </svg>`
      }
    };

    const config = toolConfigs[tool];

    this.showConfirmDialog({
      title: config.name,
      subtitle: config.subtitle,
      message: config.message,
      warning: config.warning,
      confirmText: config.confirmText,
      icon: config.icon,
      onConfirm: () => this.executeTool(tool)
    });
  }

  async executeTool(tool) {
    const toolNames = {
      sfc: 'System File Checker',
      dism: 'DISM Repair',
      chkdsk: 'Check Disk',
      resetUpdate: 'Windows Update Reset'
    };

    const toolCommands = {
      sfc: 'sfc /scannow',
      dism: 'DISM /Online /Cleanup-Image /RestoreHealth',
      chkdsk: 'chkdsk C: /F /R',
      resetUpdate: 'Resetting Windows Update components...'
    };

    // Disable ALL repair tool buttons during execution
    this.disableAllToolButtons(true);

    // Show terminal and prepare for output
    this.showTerminal(toolNames[tool]);
    this.terminalLog(`Starting ${toolNames[tool]}...`, 'info');
    this.terminalLog(`Command: ${toolCommands[tool]}`, 'command');
    this.terminalLog('', 'output');
    this.setTerminalStatus('running', 'Running...');

    window.DeadBYTE?.skull?.setState('scanning');

    // Remove any existing listeners
    window.deadbyte?.maintenance?.removeToolListeners?.();

    // Set up streaming event listeners
    window.deadbyte.maintenance.onToolOutput((data) => {
      if (data.line) {
        // Determine line type for styling
        let lineType = 'output';
        const lineLower = data.line.toLowerCase();
        if (lineLower.includes('error') || lineLower.includes('failed') || lineLower.includes('✗')) {
          lineType = 'error';
        } else if (lineLower.includes('success') || lineLower.includes('completed') || lineLower.includes('✓')) {
          lineType = 'success';
        } else if (lineLower.includes('warning') || lineLower.includes('scheduled')) {
          lineType = 'warning';
        } else if (data.type === 'stderr') {
          lineType = 'error';
        }
        this.terminalLog(data.line, lineType);
      }
    });

    window.deadbyte.maintenance.onToolComplete((data) => {
      // Remove listeners after completion
      window.deadbyte?.maintenance?.removeToolListeners?.();

      this.terminalLog('', 'output');

      if (data.success) {
        this.terminalLog('═'.repeat(50), 'success');
        this.terminalLog(`✓ ${toolNames[tool]} completed successfully`, 'success');
        if (data.message) {
          this.terminalLog(data.message, 'info');
        }
        if (data.scheduled) {
          this.terminalLog('Note: Operation scheduled for next system restart', 'warning');
        }
        this.setTerminalStatus('success', 'Completed Successfully');
        window.DeadBYTE?.skull?.setState('success');
        window.DeadBYTE?.toast?.success(toolNames[tool], data.message || 'Operation completed successfully');
      } else {
        this.terminalLog('═'.repeat(50), 'fail');
        this.terminalLog(`✗ ${toolNames[tool]} failed`, 'fail');
        if (data.message) {
          this.terminalLog(data.message, 'error');
        }
        this.setTerminalStatus('error', 'Failed');
        window.DeadBYTE?.skull?.setState('error');
        window.DeadBYTE?.toast?.error(toolNames[tool], data.message || 'Operation failed');
      }

      // Re-enable all tool buttons
      this.stopTerminalTimer();
      this.disableAllToolButtons(false);
    });

    // Start the streaming execution
    try {
      if (tool === 'resetUpdate') {
        await window.deadbyte.maintenance.resetWindowsUpdateStreaming();
      } else {
        await window.deadbyte.maintenance.runToolStreaming(tool);
      }
    } catch (error) {
      console.error(`${tool} error:`, error);

      // Remove listeners on error
      window.deadbyte?.maintenance?.removeToolListeners?.();

      this.terminalLog('', 'output');
      this.terminalLog('═'.repeat(50), 'fail');
      this.terminalLog(`✗ Error: ${error.message}`, 'error');
      this.setTerminalStatus('error', 'Error');
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Error', `Failed to run ${tool}: ${error.message}`);

      this.stopTerminalTimer();
      this.disableAllToolButtons(false);
    }
  }

  // Helper method to disable/enable all repair tool buttons
  disableAllToolButtons(disabled) {
    const buttons = [this.sfcBtn, this.dismBtn, this.chkdskBtn, this.resetUpdateBtn];
    buttons.forEach(btn => {
      if (btn) {
        btn.disabled = disabled;
        if (disabled) {
          btn.classList.add('loading');
        } else {
          btn.classList.remove('loading');
        }
      }
    });
  }

  // Terminal control methods
  showTerminal(title) {
    if (!this.terminalContainer) return;

    // Clear previous output
    if (this.terminalOutput) {
      this.terminalOutput.innerHTML = '';
    }

    // Set title
    if (this.terminalTitle) {
      this.terminalTitle.textContent = title || 'Command Output';
    }

    // Show container
    this.terminalContainer.classList.remove('hidden');

    // Start elapsed timer
    this.terminalStartTime = Date.now();
    this.updateTerminalElapsed();
    this.terminalElapsedInterval = setInterval(() => this.updateTerminalElapsed(), 1000);

    // Scroll terminal into view
    this.terminalContainer.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  hideTerminal() {
    if (!this.terminalContainer) return;
    this.terminalContainer.classList.add('hidden');
    this.stopTerminalTimer();
  }

  stopTerminalTimer() {
    if (this.terminalElapsedInterval) {
      clearInterval(this.terminalElapsedInterval);
      this.terminalElapsedInterval = null;
    }
  }

  updateTerminalElapsed() {
    if (!this.terminalElapsed || !this.terminalStartTime) return;

    const elapsed = Math.floor((Date.now() - this.terminalStartTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    this.terminalElapsed.textContent = `${minutes}:${seconds}`;
  }

  terminalLog(message, type = 'output') {
    if (!this.terminalOutput) return;

    const line = document.createElement('div');
    line.className = `terminal-line terminal-${type}`;
    line.textContent = message;
    this.terminalOutput.appendChild(line);

    // Auto-scroll to bottom
    this.terminalOutput.scrollTop = this.terminalOutput.scrollHeight;
  }

  setTerminalStatus(status, text) {
    if (!this.terminalStatus) return;

    const indicator = this.terminalStatus.querySelector('.status-indicator');
    const textEl = this.terminalStatus.querySelector('.status-text');

    if (indicator) {
      indicator.className = `status-indicator status-${status}`;
    }
    if (textEl) {
      textEl.textContent = text;
    }
  }

  copyTerminalOutput() {
    if (!this.terminalOutput) return;

    const lines = this.terminalOutput.querySelectorAll('.terminal-line');
    const text = Array.from(lines).map(l => l.textContent).join('\n');

    navigator.clipboard.writeText(text).then(() => {
      window.DeadBYTE?.toast?.success('Copied', 'Terminal output copied to clipboard');
    }).catch(err => {
      console.error('Failed to copy:', err);
      window.DeadBYTE?.toast?.error('Copy Failed', 'Could not copy to clipboard');
    });
  }

  showConfirmDialog({ title, subtitle, message, warning, confirmText, icon, onConfirm }) {
    const modal = window.DeadBYTE?.modal;
    if (!modal) {
      // Fallback: run directly
      onConfirm();
      return;
    }

    const content = `
      <div class="repair-confirm-dialog">
        <button class="repair-dialog-close" data-action="cancel">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
        <div class="repair-dialog-header">
          <div class="repair-dialog-icon">
            ${icon || ''}
          </div>
          <h3 class="repair-dialog-title">${escapeHtml(title)}</h3>
          ${subtitle ? `<p class="repair-dialog-subtitle">${escapeHtml(subtitle)}</p>` : ''}
        </div>
        <div class="repair-dialog-body">
          <p class="repair-dialog-message">${escapeHtml(message)}</p>
          <div class="repair-dialog-warning">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span>${escapeHtml(warning)}</span>
          </div>
        </div>
        <div class="repair-dialog-actions">
          <button class="repair-btn-cancel" data-action="cancel">Cancel</button>
          <button class="repair-btn-confirm" data-action="confirm">${escapeHtml(confirmText)}</button>
        </div>
      </div>
    `;

    modal.show({ content, size: 'repair', closable: false });

    // Bind button actions
    const cancelBtns = document.querySelectorAll('.repair-confirm-dialog [data-action="cancel"]');
    cancelBtns.forEach(btn => btn.addEventListener('click', () => modal.hide()));

    document.querySelector('.repair-confirm-dialog [data-action="confirm"]')?.addEventListener('click', () => {
      modal.hide();

      // Scroll to terminal first, then execute after scroll completes
      const terminalContainer = document.getElementById('repair-terminal-container');
      if (terminalContainer) {
        terminalContainer.classList.remove('hidden');
        terminalContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
        // Wait 400ms for scroll animation, then execute
        setTimeout(() => onConfirm(), 400);
      } else {
        onConfirm();
      }
    });

    // Backdrop click closes dialog
    if (modal.dynamicOverlay) {
      modal.dynamicOverlay.addEventListener('click', (e) => {
        if (e.target === modal.dynamicOverlay) {
          modal.hide();
        }
      });
    }

    // Escape key closes dialog
    const escHandler = (e) => {
      if (e.key === 'Escape') {
        modal.hide();
        document.removeEventListener('keydown', escHandler);
      }
    };
    document.addEventListener('keydown', escHandler);
  }

  // Get scan results
  getResults() {
    return this.scanResults;
  }
}


// ============================================
// HOME DASHBOARD
// ============================================

class HomeDashboard {
  constructor() {
    this.stats = {
      junk: null,
      threats: null,
      health: null,
      uptime: null
    };
    this.lastScanTime = null;
    this.isScanning = false;
    this.uptimeInterval = null; // Store interval for cleanup
    this.init();
  }

  async init() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      this.setup();
    }
  }

  setup() {
    // Cache DOM elements
    this.statusTextEl = document.getElementById('home-status-text');
    this.lastScanEl = document.getElementById('home-last-scan');

    // Stats elements
    this.junkStatEl = document.getElementById('home-stat-junk');
    this.junkBarEl = document.getElementById('home-stat-junk-bar');
    this.threatsStatEl = document.getElementById('home-stat-threats');
    this.threatsBarEl = document.getElementById('home-stat-threats-bar');
    this.healthStatEl = document.getElementById('home-stat-health');
    this.healthBarEl = document.getElementById('home-stat-health-bar');
    this.uptimeStatEl = document.getElementById('home-stat-uptime');
    this.uptimeBarEl = document.getElementById('home-stat-uptime-bar');

    // Action buttons
    this.quickScanBtn = document.getElementById('home-action-quickscan');
    this.cleanBtn = document.getElementById('home-action-clean');
    this.optimizeBtn = document.getElementById('home-action-optimize');
    this.fullScanBtn = document.getElementById('home-action-fullscan');

    // Bind action buttons
    this.bindActionButtons();

    // Load initial data
    this.loadDashboardData();

    // Refresh data periodically (store interval ID for cleanup)
    this.uptimeInterval = setInterval(() => this.refreshUptime(), 60000); // Every minute
  }

  /**
   * Cleanup method to prevent memory leaks
   * Call this when the dashboard is no longer needed
   */
  destroy() {
    if (this.uptimeInterval) {
      clearInterval(this.uptimeInterval);
      this.uptimeInterval = null;
    }
  }

  bindActionButtons() {
    if (this.quickScanBtn) {
      this.quickScanBtn.addEventListener('click', () => this.runQuickScan());
    }
    if (this.cleanBtn) {
      this.cleanBtn.addEventListener('click', () => this.navigateTo('analyzer'));
    }
    if (this.optimizeBtn) {
      this.optimizeBtn.addEventListener('click', () => this.navigateTo('performance'));
    }
    if (this.fullScanBtn) {
      this.fullScanBtn.addEventListener('click', () => this.runFullScan());
    }
  }

  navigateTo(module) {
    // Use the nav controller to navigate
    const navItem = document.querySelector(`.nav-item[data-module="${module}"]`);
    if (navItem) {
      navItem.click();
    }
  }

  async loadDashboardData() {
    // Load all dashboard data in parallel
    await Promise.all([
      this.loadJunkSummary(),
      this.loadSecuritySummary(),
      this.loadHealthSummary(),
      this.loadUptime()
    ]);
  }

  async loadJunkSummary() {
    if (!window.deadbyte?.junk) return;

    try {
      const result = await window.deadbyte.junk.quickSummary();
      if (result.success && result.data) {
        this.stats.junk = result.data.estimatedSize || 0;
        this.updateJunkStat();
      }
    } catch (error) {
      console.error('Failed to load junk summary:', error);
    }
  }

  async loadSecuritySummary() {
    if (!window.deadbyte?.security) return;

    try {
      const result = await window.deadbyte.security.quickSummary();
      if (result.success && result.data) {
        this.stats.threats = result.data.estimatedRisks || 0;
        this.updateThreatsStat();
      }
    } catch (error) {
      console.error('Failed to load security summary:', error);
    }
  }

  async loadHealthSummary() {
    if (!window.deadbyte?.maintenance) return;

    try {
      const result = await window.deadbyte.maintenance.quickSummary();
      if (result.success && result.data) {
        this.stats.health = result.data.estimatedScore || 0;
        this.updateHealthStat();
      }
    } catch (error) {
      console.error('Failed to load health summary:', error);
    }
  }

  async loadUptime() {
    if (!window.deadbyte?.metrics) return;

    try {
      const result = await window.deadbyte.metrics.getUptime();
      if (result.success && result.data) {
        this.stats.uptime = result.data.seconds;
        this.updateUptimeStat();
      }
    } catch (error) {
      console.error('Failed to load uptime:', error);
    }
  }

  async refreshUptime() {
    await this.loadUptime();
  }

  animateStatUpdate(element) {
    if (!element) return;
    element.classList.remove('updated');
    // Trigger reflow
    void element.offsetWidth;
    element.classList.add('updated');
  }

  updateJunkStat() {
    if (!this.junkStatEl) return;

    const size = this.stats.junk;
    if (size === null) {
      this.junkStatEl.textContent = '—';
      return;
    }

    // Format size
    this.junkStatEl.textContent = formatBytes(size);
    this.animateStatUpdate(this.junkStatEl);

    // Update bar (max 5GB = 100%)
    if (this.junkBarEl) {
      const percent = Math.min(100, (size / (5 * 1024 * 1024 * 1024)) * 100);
      this.junkBarEl.style.width = `${percent}%`;
    }
  }

  updateThreatsStat() {
    if (!this.threatsStatEl) return;

    const threats = this.stats.threats;
    if (threats === null) {
      this.threatsStatEl.textContent = '—';
      return;
    }

    this.threatsStatEl.textContent = threats;
    this.animateStatUpdate(this.threatsStatEl);

    // Update color based on threat count
    if (threats === 0) {
      this.threatsStatEl.style.color = 'var(--color-success)';
    } else if (threats < 5) {
      this.threatsStatEl.style.color = 'var(--color-warning)';
    } else {
      this.threatsStatEl.style.color = 'var(--color-error)';
    }

    // Update bar
    if (this.threatsBarEl) {
      const percent = Math.min(100, threats * 10);
      this.threatsBarEl.style.width = `${percent}%`;
      this.threatsBarEl.style.background = threats === 0 ? 'var(--color-success)' :
                                           threats < 5 ? 'var(--color-warning)' : 'var(--color-error)';
    }
  }

  updateHealthStat() {
    if (!this.healthStatEl) return;

    const health = this.stats.health;
    if (health === null) {
      this.healthStatEl.textContent = '—';
      return;
    }

    this.healthStatEl.textContent = `${health}%`;
    this.animateStatUpdate(this.healthStatEl);

    // Update color based on health
    if (health >= 80) {
      this.healthStatEl.style.color = 'var(--color-success)';
    } else if (health >= 60) {
      this.healthStatEl.style.color = 'var(--color-warning)';
    } else {
      this.healthStatEl.style.color = 'var(--color-error)';
    }

    // Update bar
    if (this.healthBarEl) {
      this.healthBarEl.style.width = `${health}%`;
      this.healthBarEl.style.background = health >= 80 ? 'var(--color-success)' :
                                          health >= 60 ? 'var(--color-warning)' : 'var(--color-error)';
    }
  }

  updateUptimeStat() {
    if (!this.uptimeStatEl) return;

    const uptime = this.stats.uptime;
    if (uptime === null) {
      this.uptimeStatEl.textContent = '—';
      return;
    }

    // Format uptime (expecting seconds)
    const newValue = this.formatUptime(uptime);
    if (this.uptimeStatEl.textContent !== newValue) {
      this.uptimeStatEl.textContent = newValue;
      this.animateStatUpdate(this.uptimeStatEl);
    }

    // Update bar (max 7 days = 100%)
    if (this.uptimeBarEl) {
      const maxUptime = 7 * 24 * 60 * 60; // 7 days in seconds
      const percent = Math.min(100, (uptime / maxUptime) * 100);
      this.uptimeBarEl.style.width = `${percent}%`;
    }
  }

  updateStatus(status, lastScan = null) {
    if (this.statusTextEl) {
      this.statusTextEl.textContent = status;
    }
    if (this.lastScanEl && lastScan) {
      this.lastScanEl.textContent = lastScan;
    }
  }

  async runQuickScan() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.updateStatus('SCANNING...', 'Quick scan in progress');
    window.DeadBYTE?.skull?.setState('scanning');

    try {
      // Run junk quick summary
      await this.loadJunkSummary();

      // Run security quick summary
      await this.loadSecuritySummary();

      // Update status based on results
      this.updateStatusBasedOnResults();
      this.lastScanTime = new Date();
      window.DeadBYTE?.skull?.setState('success');
      window.DeadBYTE?.toast?.success('Quick Scan Complete', 'System check finished successfully');
    } catch (error) {
      console.error('Quick scan error:', error);
      this.updateStatus('SCAN FAILED', 'Error during scan');
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Scan Failed', 'An error occurred during the quick scan');
    } finally {
      this.isScanning = false;
    }
  }

  async runFullScan() {
    if (this.isScanning) return;

    this.isScanning = true;
    this.updateStatus('DEEP SCANNING...', 'Full system analysis in progress');
    window.DeadBYTE?.skull?.setState('scanning');
    window.DeadBYTE?.toast?.info('Deep Scan Started', 'This may take a few minutes...');

    try {
      // Run full scans in parallel
      const [junkResult, securityResult, healthResult] = await Promise.all([
        window.deadbyte?.junk?.scan({ quick: false }),
        window.deadbyte?.security?.scan({ scanDepth: 'deep' }),
        window.deadbyte?.maintenance?.healthCheck({ mode: 'deep' })
      ]);

      // Update stats from full scan results
      if (junkResult?.success && junkResult.data) {
        this.stats.junk = junkResult.data.totalSize || 0;
        this.updateJunkStat();
      }

      if (securityResult?.success && securityResult.data) {
        this.stats.threats = securityResult.data.findings?.length || 0;
        this.updateThreatsStat();
      }

      if (healthResult?.success && healthResult.data) {
        this.stats.health = healthResult.data.healthScore || 0;
        this.updateHealthStat();
      }

      this.updateStatusBasedOnResults();
      this.lastScanTime = new Date();
      window.DeadBYTE?.skull?.setState('success');

      // Show result summary toast
      const threats = this.stats.threats || 0;
      const health = this.stats.health || 100;
      if (threats === 0 && health >= 80) {
        window.DeadBYTE?.toast?.success('System Healthy', 'No issues detected during deep scan');
      } else if (threats > 0 || health < 70) {
        window.DeadBYTE?.toast?.warning('Issues Found', `${threats} potential risks detected, health: ${health}%`);
      } else {
        window.DeadBYTE?.toast?.success('Scan Complete', 'Deep analysis finished');
      }
    } catch (error) {
      console.error('Full scan error:', error);
      this.updateStatus('SCAN FAILED', 'Error during deep scan');
      window.DeadBYTE?.skull?.setState('error');
      window.DeadBYTE?.toast?.error('Deep Scan Failed', 'An error occurred during the full scan');
    } finally {
      this.isScanning = false;
    }
  }

  updateStatusBasedOnResults() {
    const threats = this.stats.threats || 0;
    const health = this.stats.health || 100;

    let status = 'SYSTEM PROTECTED';
    let hint = `Last scan: just now`;

    if (threats > 5 || health < 50) {
      status = 'ATTENTION NEEDED';
    } else if (threats > 0 || health < 70) {
      status = 'MINOR ISSUES';
    }

    this.updateStatus(status, hint);
  }

  formatUptime(seconds) {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  }

  // Refresh all dashboard data
  async refresh() {
    await this.loadDashboardData();
  }
}


// ============================================
// TOAST NOTIFICATION SYSTEM
// ============================================

class ToastManager {
  constructor() {
    this.container = null;
    this.currentToast = null;
    this.lastMessage = null;
    this.lastMessageTime = 0;
    this.dismissTimeout = null;
    this.init();
  }

  init() {
    // Check for existing container first (prevent duplicates)
    let existing = document.getElementById('toast-container');
    if (existing) {
      this.container = existing;
      return;
    }

    // Create single toast container
    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    this.container.id = 'toast-container';
    document.body.appendChild(this.container);
  }

  /**
   * Show a toast notification (single toast at a time, with deduplication)
   * @param {Object} options - Toast options
   * @param {string} options.title - Toast title
   * @param {string} options.message - Toast message
   * @param {string} options.type - Toast type: 'success', 'error', 'warning', 'info'
   * @param {number} options.duration - Duration in ms (default 3000, 0 = persistent)
   */
  show({ title, message, type = 'info', duration = 3000 }) {
    // Rule 2: Deduplicate identical messages within 2 seconds
    const messageKey = `${type}:${title}:${message}`;
    const now = Date.now();
    if (this.lastMessage === messageKey && (now - this.lastMessageTime) < 2000) {
      return null; // Ignore duplicate
    }
    this.lastMessage = messageKey;
    this.lastMessageTime = now;

    // Rule 1: Dismiss any existing toast before showing new one
    if (this.currentToast) {
      this.dismissImmediate(this.currentToast);
    }

    // Clear any pending dismiss timeout
    if (this.dismissTimeout) {
      clearTimeout(this.dismissTimeout);
      this.dismissTimeout = null;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icon = this.getIcon(type);

    toast.innerHTML = `
      <div class="toast-icon">
        ${icon}
      </div>
      <div class="toast-content">
        ${title ? `<div class="toast-title">${escapeHtml(title)}</div>` : ''}
        ${message ? `<div class="toast-message">${escapeHtml(message)}</div>` : ''}
      </div>
      <button class="toast-close" aria-label="Close">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    `;

    // Bind close button
    const closeBtn = toast.querySelector('.toast-close');
    closeBtn.addEventListener('click', () => this.dismiss(toast));

    // Add to container
    this.container.appendChild(toast);
    this.currentToast = toast;

    // Rule 3: Auto dismiss after 3 seconds with fade-out
    if (duration > 0) {
      this.dismissTimeout = setTimeout(() => this.dismiss(toast), duration);
    }

    return toast;
  }

  // Immediate dismiss without animation (for replacing toasts)
  dismissImmediate(toast) {
    if (!toast || !this.container.contains(toast)) return;
    this.container.removeChild(toast);
    if (this.currentToast === toast) {
      this.currentToast = null;
    }
  }

  dismiss(toast) {
    if (!toast || !this.container.contains(toast)) return;

    // Add fade-out animation class
    toast.classList.add('toast-exiting');

    setTimeout(() => {
      if (this.container.contains(toast)) {
        this.container.removeChild(toast);
        if (this.currentToast === toast) {
          this.currentToast = null;
        }
      }
    }, 300);
  }

  dismissAll() {
    if (this.currentToast) {
      this.dismiss(this.currentToast);
    }
  }

  getIcon(type) {
    const icons = {
      success: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>`,
      error: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/>
        <line x1="9" y1="9" x2="15" y2="15"/>
      </svg>`,
      warning: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
        <line x1="12" y1="9" x2="12" y2="13"/>
        <line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>`,
      info: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="16" x2="12" y2="12"/>
        <line x1="12" y1="8" x2="12.01" y2="8"/>
      </svg>`
    };
    return icons[type] || icons.info;
  }

  // Convenience methods
  success(title, message, duration) {
    return this.show({ title, message, type: 'success', duration });
  }

  error(title, message, duration) {
    return this.show({ title, message, type: 'error', duration });
  }

  warning(title, message, duration) {
    return this.show({ title, message, type: 'warning', duration });
  }

  info(title, message, duration) {
    return this.show({ title, message, type: 'info', duration });
  }
}


// ============================================
// SETTINGS CONTROLLER (Navigation Only)
// ============================================

class SettingsController {
  constructor() {
    this.navItems = document.querySelectorAll('.settings-nav-item');
    this.sections = document.querySelectorAll('.settings-section');
    this.currentSection = 'general';
    this.isCheckingUpdates = false;

    // Download state management
    this.downloadState = 'idle'; // idle, downloading, complete, error
    this.updateInfo = null;
    this.downloadedFilePath = null;

    if (this.navItems.length > 0) {
      this.init();
    }
  }

  init() {
    this.navItems.forEach(item => {
      item.addEventListener('click', () => {
        const section = item.dataset.section;
        if (section) {
          this.navigateTo(section);
        }
      });
    });

    // Initialize update check button
    this.initUpdateChecker();

    // Sync with any pending update info from auto-check
    this.syncPendingUpdateInfo();
  }

  navigateTo(section) {
    // Update nav items
    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.section === section);
    });

    // Update sections
    this.sections.forEach(sec => {
      const secId = sec.id.replace('settings-', '');
      sec.classList.toggle('active', secId === section);
    });

    this.currentSection = section;
  }

  // Initialize update checker functionality
  initUpdateChecker() {
    // Find the Check for Updates button in the About page
    const updateButtons = document.querySelectorAll('.about-action-btn');
    const checkUpdateBtn = Array.from(updateButtons).find(btn =>
      btn.textContent.includes('Check for Updates')
    );

    if (checkUpdateBtn) {
      checkUpdateBtn.addEventListener('click', () => this.checkForUpdates(checkUpdateBtn));
    }

    // Modal controls
    const closeBtn = document.getElementById('update-modal-close');
    const laterBtn = document.getElementById('update-later-btn');
    const downloadBtn = document.getElementById('update-download-btn');
    const modalOverlay = document.getElementById('modal-update-available');

    if (closeBtn) closeBtn.addEventListener('click', () => this.closeUpdateModal());
    if (laterBtn) laterBtn.addEventListener('click', () => this.closeUpdateModal());
    if (downloadBtn) downloadBtn.addEventListener('click', () => this.startDownload());

    // Cancel download button
    const cancelBtn = document.getElementById('update-cancel-btn');
    if (cancelBtn) cancelBtn.addEventListener('click', () => this.cancelDownload());

    // Install buttons
    const installBtn = document.getElementById('update-install-btn');
    const installLaterBtn = document.getElementById('update-install-later-btn');
    if (installBtn) installBtn.addEventListener('click', () => this.installUpdate());
    if (installLaterBtn) installLaterBtn.addEventListener('click', () => this.closeUpdateModal());

    // Error state buttons
    const errorCloseBtn = document.getElementById('update-error-close-btn');
    const retryBtn = document.getElementById('update-retry-btn');
    if (errorCloseBtn) errorCloseBtn.addEventListener('click', () => this.closeUpdateModal());
    if (retryBtn) retryBtn.addEventListener('click', () => this.startDownload());

    // Close on overlay click
    if (modalOverlay) {
      modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) this.closeUpdateModal();
      });
    }

    // Listen for download progress
    if (window.deadbyte?.updates?.onDownloadProgress) {
      window.deadbyte.updates.onDownloadProgress((data) => {
        this.updateDownloadProgress(data);
      });
    }

    // View on GitHub button
    const githubBtn = document.getElementById('btn-view-github');
    if (githubBtn) {
      githubBtn.addEventListener('click', () => {
        window.deadbyte?.shell?.openExternal('https://github.com/moner-dev/DeadByte');
      });
    }

    // Contact Support button
    const supportBtn = document.getElementById('btn-contact-support');
    if (supportBtn) {
      supportBtn.addEventListener('click', () => {
        window.deadbyte?.shell?.openExternal('mailto:moner.intelligence@gmail.com?subject=DeadBYTE Support');
      });
    }
  }

  // Sync with global pending update info (from auto-update toast)
  syncPendingUpdateInfo() {
    if (pendingUpdateInfo && !this.updateInfo) {
      this.updateInfo = pendingUpdateInfo;
      this.releaseUrl = pendingUpdateInfo.releaseUrl;
    }
  }

  // Check for updates
  async checkForUpdates(button) {
    if (this.isCheckingUpdates || !window.deadbyte?.updates) return;
    this.isCheckingUpdates = true;

    // Store original button content
    const originalContent = button.innerHTML;

    // Show loading state
    button.disabled = true;
    button.innerHTML = `
      <span class="btn-spinner"></span>
      <span>Checking...</span>
    `;

    try {
      const result = await window.deadbyte.updates.checkForUpdates();

      if (!result.success) {
        // Handle errors
        this.handleUpdateError(result.error, result.message);
        button.innerHTML = originalContent;
        button.disabled = false;
        this.isCheckingUpdates = false;
        return;
      }

      if (result.isUpToDate) {
        // Show success state on button
        button.innerHTML = `
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <span>You're up to date!</span>
        `;
        button.classList.add('update-btn-success');

        // Show toast
        window.DeadBYTE?.toast?.success('Up to Date', `DeadBYTE v${result.currentVersion} is the latest version`);

        // Reset button after 3 seconds
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.classList.remove('update-btn-success');
          button.disabled = false;
          this.isCheckingUpdates = false;
        }, 3000);
      } else {
        // Update available - show modal
        this.showUpdateModal(result);
        button.innerHTML = originalContent;
        button.disabled = false;
        this.isCheckingUpdates = false;
      }
    } catch (error) {
      console.error('Update check failed:', error);
      this.handleUpdateError('UNKNOWN', 'An unexpected error occurred');
      button.innerHTML = originalContent;
      button.disabled = false;
      this.isCheckingUpdates = false;
    }
  }

  // Handle update errors
  handleUpdateError(errorCode, message) {
    const messages = {
      'NO_INTERNET': 'No internet connection. Please check your network and try again.',
      'RATE_LIMITED': 'Too many requests. Please try again in a few minutes.',
      'NO_RELEASES': 'No releases found on GitHub.',
      'TIMEOUT': 'Request timed out. Please try again.',
      'UNKNOWN': message || 'Could not check for updates. Please try again.'
    };

    const errorMessage = messages[errorCode] || messages['UNKNOWN'];
    window.DeadBYTE?.toast?.error('Update Check Failed', errorMessage);
  }

  // Show update available modal
  showUpdateModal(updateInfo) {
    const modal = document.getElementById('modal-update-available');
    if (!modal) return;

    // Store update info
    this.updateInfo = updateInfo;
    this.releaseUrl = updateInfo.releaseUrl;

    // Reset to info state
    this.setModalState('info');

    // Populate modal content
    document.getElementById('update-current-version').textContent = `v${updateInfo.currentVersion}`;
    document.getElementById('update-latest-version').textContent = `v${updateInfo.latestVersion}`;
    document.getElementById('update-release-date').textContent = updateInfo.publishedAt || 'Unknown';

    // Format release notes
    const notesEl = document.getElementById('update-release-notes');
    if (notesEl) {
      // Convert markdown-style formatting to basic HTML
      let notes = updateInfo.releaseNotes || 'No release notes available.';
      notes = notes
        .replace(/^### (.+)$/gm, '<h5>$1</h5>')
        .replace(/^## (.+)$/gm, '<h4>$1</h4>')
        .replace(/^# (.+)$/gm, '<h3>$1</h3>')
        .replace(/^\* (.+)$/gm, '<li>$1</li>')
        .replace(/^- (.+)$/gm, '<li>$1</li>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/`(.+?)`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/\n/g, '<br>');

      // Wrap list items in ul
      if (notes.includes('<li>')) {
        notes = notes.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
      }

      notesEl.innerHTML = `<p>${notes}</p>`;
    }

    // Show modal
    modal.classList.add('open');
  }

  // Close update modal
  closeUpdateModal() {
    const modal = document.getElementById('modal-update-available');
    if (modal) {
      modal.classList.remove('open');
    }

    // Reset state when closing (if not downloading)
    if (this.downloadState !== 'downloading') {
      this.setModalState('info');
    }
  }

  // Set modal state (info, downloading, ready, error)
  setModalState(state) {
    this.downloadState = state;

    // Update footer button visibility
    const footerInfo = document.getElementById('update-footer-info');
    const footerDownloading = document.getElementById('update-footer-downloading');
    const footerReady = document.getElementById('update-footer-ready');
    const footerError = document.getElementById('update-footer-error');
    const downloadSection = document.getElementById('update-download-section');

    // Hide all footer sections
    footerInfo?.classList.add('hidden');
    footerDownloading?.classList.add('hidden');
    footerReady?.classList.add('hidden');
    footerError?.classList.add('hidden');
    downloadSection?.classList.add('hidden');
    downloadSection?.classList.remove('complete', 'error');

    // Show appropriate section
    switch (state) {
      case 'info':
        footerInfo?.classList.remove('hidden');
        break;
      case 'downloading':
        footerDownloading?.classList.remove('hidden');
        downloadSection?.classList.remove('hidden');
        break;
      case 'ready':
        footerReady?.classList.remove('hidden');
        downloadSection?.classList.remove('hidden');
        downloadSection?.classList.add('complete');
        break;
      case 'error':
        footerError?.classList.remove('hidden');
        downloadSection?.classList.remove('hidden');
        downloadSection?.classList.add('error');
        break;
    }
  }

  // Start downloading the update
  async startDownload() {
    // Sync with global pending update info if needed
    this.syncPendingUpdateInfo();

    if (!this.updateInfo?.downloadUrl) {
      // Fallback to opening browser if no direct download URL
      const releaseUrl = this.releaseUrl || pendingUpdateInfo?.releaseUrl;
      if (releaseUrl) {
        window.deadbyte.shell.openExternal(releaseUrl);
        this.closeUpdateModal();
        window.DeadBYTE?.toast?.info('Opening Browser', 'Download page opened in your default browser');
      }
      return;
    }

    this.setModalState('downloading');

    // Reset progress UI
    this.updateDownloadProgress({ progress: 0, downloaded: 0, total: this.updateInfo.downloadSize });
    document.getElementById('update-download-status').textContent = 'Starting download...';

    try {
      const result = await window.deadbyte.updates.download(
        this.updateInfo.downloadUrl,
        this.updateInfo.fileName
      );

      if (result.success) {
        this.downloadedFilePath = result.filePath;
        this.setModalState('ready');
        document.getElementById('update-download-status').textContent = 'Download complete!';
        document.getElementById('update-download-percent').textContent = '100%';
        document.getElementById('update-progress-fill').style.width = '100%';
        window.DeadBYTE?.toast?.success('Download Complete', 'Update is ready to install');
      } else {
        this.setModalState('error');
        document.getElementById('update-download-status').textContent = result.message || 'Download failed';
        window.DeadBYTE?.toast?.error('Download Failed', result.message || 'Could not download update');
      }
    } catch (err) {
      this.setModalState('error');
      document.getElementById('update-download-status').textContent = 'Download failed';
      window.DeadBYTE?.toast?.error('Download Failed', err.message || 'An error occurred');
    }
  }

  // Cancel ongoing download
  async cancelDownload() {
    try {
      await window.deadbyte.updates.cancelDownload();
      this.setModalState('info');
      window.DeadBYTE?.toast?.info('Download Cancelled', 'Update download was cancelled');
    } catch (err) {
      console.error('Failed to cancel download:', err);
    }
  }

  // Update download progress UI
  updateDownloadProgress(data) {
    const { progress, downloaded, total } = data;

    const progressFill = document.getElementById('update-progress-fill');
    const percentText = document.getElementById('update-download-percent');
    const sizeText = document.getElementById('update-download-size');
    const statusText = document.getElementById('update-download-status');

    if (progressFill) progressFill.style.width = `${progress}%`;
    if (percentText) percentText.textContent = `${progress}%`;

    if (sizeText) {
      const downloadedMB = (downloaded / (1024 * 1024)).toFixed(1);
      const totalMB = (total / (1024 * 1024)).toFixed(1);
      sizeText.textContent = `${downloadedMB} MB / ${totalMB} MB`;
    }

    if (statusText && progress > 0 && progress < 100) {
      statusText.textContent = 'Downloading...';
    }
  }

  // Install the downloaded update
  async installUpdate() {
    if (!this.downloadedFilePath) {
      window.DeadBYTE?.toast?.error('Install Failed', 'No downloaded file found');
      return;
    }

    try {
      const installBtn = document.getElementById('update-install-btn');
      if (installBtn) {
        installBtn.disabled = true;
        installBtn.innerHTML = `
          <span class="btn-spinner"></span>
          <span>Installing...</span>
        `;
      }

      const result = await window.deadbyte.updates.install(this.downloadedFilePath);

      if (!result.success) {
        if (installBtn) {
          installBtn.disabled = false;
          installBtn.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
              <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/>
              <path d="M12 6v6l4 2"/>
            </svg>
            Install Now
          `;
        }
        window.DeadBYTE?.toast?.error('Install Failed', result.message || 'Could not start installer');
      }
      // If successful, the app will quit to allow installation
    } catch (err) {
      window.DeadBYTE?.toast?.error('Install Failed', err.message || 'An error occurred');
    }
  }

  // Legacy method - now redirects to startDownload
  downloadUpdate() {
    this.startDownload();
  }
}


// ============================================
// MODE CARD CONTROLLER
// ============================================

class ModeCardController {
  constructor() {
    this.init();
  }

  init() {
    // Performance mode cards
    this.initModeCards('.perf-mode-card', 'performance');

    // Maintenance mode cards
    this.initModeCards('.maint-mode-card', 'maintenance');

    // Clean mode cards (existing)
    this.initModeCards('.mode-card[data-mode]', 'clean');

    // Scan mode cards (analyzer)
    this.initModeCards('.scan-mode-card', 'analyzer');

    // Security mode cards
    this.initModeCards('.security-mode-card', 'security');
  }

  initModeCards(selector, module) {
    const cards = document.querySelectorAll(selector);
    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Remove active from siblings
        cards.forEach(c => c.classList.remove('active'));
        // Add active to clicked card
        card.classList.add('active');

        // Emit custom event for other controllers to listen
        const event = new CustomEvent('modeChanged', {
          detail: {
            module: module,
            mode: card.dataset.mode
          }
        });
        document.dispatchEvent(event);
      });
    });
  }
}


// ============================================
// TOGGLE SWITCH CONTROLLER
// ============================================

class ToggleSwitchController {
  constructor() {
    this.init();
  }

  init() {
    // Startup program toggles
    document.querySelectorAll('.startup-toggle .toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        const row = e.target.closest('.startup-row');
        if (row) {
          row.classList.toggle('startup-disabled', !e.target.checked);
        }
      });
    });

    // Settings toggles
    document.querySelectorAll('.settings-row .toggle-switch input').forEach(toggle => {
      toggle.addEventListener('change', (e) => {
        // Emit event for settings changes
        const row = e.target.closest('.settings-row');
        const title = row?.querySelector('.settings-row-title')?.textContent;
        const event = new CustomEvent('settingChanged', {
          detail: {
            setting: title,
            value: e.target.checked
          }
        });
        document.dispatchEvent(event);
      });
    });
  }
}


// ============================================
// FILES MODULE CONTROLLER
// ============================================

class FilesModuleController {
  constructor() {
    this.selectedFiles = new Set();
    this.selectedFilePaths = new Map(); // Map fileId to full path
    this.currentDrive = 'C';
    this.currentPath = 'C:\\';
    this.detailsPanel = document.getElementById('details-panel');
    this.fileTableBody = document.getElementById('file-table-body');
    this.contextMenu = document.getElementById('context-menu');
    this.selectAllCheckbox = document.getElementById('select-all-files');
    this.isScanning = false;

    this.init();
  }

  init() {
    this.initDriveSelector();
    this.initFileTable();
    this.initBreadcrumbNav();
    this.initContextMenu();
    this.initDetailsPanel();
    this.initModals();
    this.initStatusBar();
    this.initToolbar();
    this.initSearchFilter();

    // Load real drives on init if API is available
    this.loadDrives();

    // Setup drive hot-plug detection listeners
    this.initDriveMonitoring();
  }

  // Initialize drive hot-plug monitoring
  initDriveMonitoring() {
    if (!window.deadbyte?.drives) return;

    // Listen for new drives
    window.deadbyte.drives.onDriveAdded((drive) => {
      this.handleDriveAdded(drive);
    });

    // Listen for removed drives
    window.deadbyte.drives.onDriveRemoved((letter) => {
      this.handleDriveRemoved(letter);
    });

    // Listen for drive list updates (space changes)
    window.deadbyte.drives.onDrivesUpdated((drives) => {
      this.handleDrivesUpdated(drives);
    });
  }

  // Handle new drive connected
  handleDriveAdded(drive) {
    const container = document.querySelector('.drive-selector');
    if (!container) return;

    // Create new drive card
    const card = this.createDriveCard(drive, false);
    card.classList.add('drive-card-entering');

    // Append to container
    container.appendChild(card);

    // Trigger animation after DOM insertion
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        card.classList.remove('drive-card-entering');
        card.classList.add('drive-card-highlight');

        // Remove highlight after 1 second
        setTimeout(() => {
          card.classList.remove('drive-card-highlight');
        }, 1000);
      });
    });

    // Update scroll indicator
    this.setupDriveScrollIndicator(container);

    // Show toast notification
    const label = drive.label || 'Removable Disk';
    window.DeadBYTE?.toast?.success('Drive Connected', `${drive.letter}:\\ ${label}`);
  }

  // Handle drive disconnected
  handleDriveRemoved(letter) {
    const container = document.querySelector('.drive-selector');
    if (!container) return;

    const card = container.querySelector(`.drive-card[data-drive="${letter}"]`);
    if (!card) return;

    const wasActive = card.classList.contains('active');

    // Animate out
    card.classList.add('drive-card-leaving');

    // Remove after animation
    setTimeout(() => {
      card.remove();

      // If this was the active drive, switch to C:\
      if (wasActive) {
        const cDrive = container.querySelector('.drive-card[data-drive="C"]');
        if (cDrive) {
          cDrive.classList.add('active');
          this.currentDrive = 'C';
          this.currentPath = 'C:\\';
          this.updateCurrentDriveDisplay();
          this.clearFileTable();
          this.showStatusMessage('Drive disconnected — switched to C:\\', 'info');
        }
      }

      // Update scroll indicator
      this.setupDriveScrollIndicator(container);
    }, 300);

    // Show toast notification
    window.DeadBYTE?.toast?.info('Drive Disconnected', `${letter}:\\ removed`);
  }

  // Handle drive list updates (for space changes)
  handleDrivesUpdated(drives) {
    // Update space info on existing cards without re-rendering
    const container = document.querySelector('.drive-selector');
    if (!container) return;

    drives.forEach(drive => {
      const card = container.querySelector(`.drive-card[data-drive="${drive.letter}"]`);
      if (!card) return;

      // Update progress bar
      const barFill = card.querySelector('.drive-bar-fill');
      if (barFill) {
        barFill.style.width = `${drive.percentUsed}%`;
      }

      // Update stats
      const usedEl = card.querySelector('.drive-used');
      const freeEl = card.querySelector('.drive-free');
      if (usedEl) usedEl.textContent = `${formatBytes(drive.usedSpace)} used`;
      if (freeEl) freeEl.textContent = `${drive.freeSpaceFormatted || formatBytes(drive.freeSpace)} free`;

      // Update health indicator
      const healthClass = drive.health === 'critical' ? 'drive-health-critical' :
                          drive.health === 'warning' ? 'drive-health-warning' : 'drive-health-good';
      const healthEl = card.querySelector('.drive-health');
      if (healthEl) {
        healthEl.className = `drive-health ${healthClass}`;
        healthEl.title = `${Math.round(drive.percentUsed)}% used`;
      }
    });
  }

  // Create a drive card element (extracted for reuse)
  createDriveCard(drive, isActive = false) {
    const card = document.createElement('div');
    card.className = `drive-card ${isActive ? 'active' : ''}`;
    card.dataset.drive = drive.letter;
    card.dataset.usage = drive.health === 'critical' ? 'critical' :
                         drive.health === 'warning' ? 'high' : 'normal';

    const healthClass = drive.health === 'critical' ? 'drive-health-critical' :
                        drive.health === 'warning' ? 'drive-health-warning' : 'drive-health-good';

    const healthIcon = drive.health === 'critical' || drive.health === 'warning'
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
           <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <polyline points="20 6 9 17 4 12"/>
         </svg>`;

    const driveIcon = drive.isRemovable
      ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <rect x="4" y="4" width="16" height="16" rx="2"/>
           <path d="M9 9h6v6H9z"/>
           <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>
         </svg>`
      : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
           <rect x="2" y="4" width="20" height="16" rx="2"/>
           <path d="M6 8h.01M6 12h.01M6 16h.01"/>
           <path d="M10 8h8M10 12h8M10 16h8"/>
         </svg>`;

    const usedSize = formatBytes(drive.usedSpace);
    const freeSize = drive.freeSpaceFormatted || formatBytes(drive.freeSpace);

    card.innerHTML = `
      <div class="drive-card-icon ${drive.isRemovable ? 'drive-card-icon-external' : ''}">
        ${driveIcon}
      </div>
      <div class="drive-card-content">
        <div class="drive-card-header">
          <span class="drive-letter">${drive.letter}:</span>
          <span class="drive-label">${drive.label || 'Local Disk'}</span>
          <span class="drive-health ${healthClass}" title="${Math.round(drive.percentUsed)}% used">
            ${healthIcon}
          </span>
        </div>
        <div class="drive-card-bar">
          <div class="drive-bar-fill" style="width: ${drive.percentUsed}%"></div>
        </div>
        <div class="drive-card-stats">
          <span class="drive-used">${usedSize} used</span>
          <span class="drive-free">${freeSize} free</span>
        </div>
      </div>
    `;

    // Add click handler
    card.addEventListener('click', () => {
      const container = document.querySelector('.drive-selector');
      container?.querySelectorAll('.drive-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      this.currentDrive = drive.letter;
      this.currentPath = `${drive.letter}:\\`;
      this.updateCurrentDriveDisplay();
      this.scanCurrentDirectory();
    });

    return card;
  }

  // Load real drives from backend
  async loadDrives() {
    Debug.log('Loading drives...');

    if (!window.deadbyte?.drives) {
      console.warn('Drive API not available (not in Electron) - keeping mock data');
      return;
    }

    // Clear mock data from table immediately
    this.clearFileTable();

    try {
      Debug.log('Calling window.deadbyte.drives.getAll()...');
      const result = await window.deadbyte.drives.getAll();
      Debug.log('Drive result:', result);

      if (result.success && result.data && result.data.length > 0) {
        Debug.log(`Found ${result.data.length} drives:`, result.data.map(d => d.letter).join(', '));
        this.renderDriveCards(result.data);
        // Auto-scan the first drive
        await this.scanCurrentDirectory();
      } else {
        console.error('Failed to load drives:', result.message || 'No drives returned');
      }
    } catch (error) {
      console.error('Error loading drives:', error);
    }
  }

  // Clear the file table (remove mock data)
  clearFileTable() {
    if (this.fileTableBody) {
      this.fileTableBody.innerHTML = '';
    }
    this.selectedFiles.clear();
    this.selectedFilePaths.clear();
    this.updateFileCount(0, 0);
    this.updateSelectedCount();
  }

  // Render drive cards from real data
  renderDriveCards(drives) {
    const container = document.querySelector('.drive-selector');
    if (!container) return;

    // Clear existing cards
    container.innerHTML = '';

    drives.forEach((drive, index) => {
      const card = document.createElement('div');
      card.className = `drive-card ${index === 0 ? 'active' : ''}`;
      card.dataset.drive = drive.letter;
      card.dataset.usage = drive.health === 'critical' ? 'critical' :
                           drive.health === 'warning' ? 'high' : 'normal';

      // Determine health class and icon
      const healthClass = drive.health === 'critical' ? 'drive-health-critical' :
                          drive.health === 'warning' ? 'drive-health-warning' : 'drive-health-good';

      const healthIcon = drive.health === 'critical' || drive.health === 'warning'
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
             <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
             <polyline points="20 6 9 17 4 12"/>
           </svg>`;

      // Different icon for removable vs local drives
      const driveIcon = drive.isRemovable
        ? `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="4" y="4" width="16" height="16" rx="2"/>
             <path d="M9 9h6v6H9z"/>
             <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/>
           </svg>`
        : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
             <rect x="2" y="4" width="20" height="16" rx="2"/>
             <path d="M6 8h.01M6 12h.01M6 16h.01"/>
             <path d="M10 8h8M10 12h8M10 16h8"/>
           </svg>`;

      const usedSize = formatBytes(drive.usedSpace);
      const freeSize = drive.freeSpaceFormatted || formatBytes(drive.freeSpace);

      card.innerHTML = `
        <div class="drive-card-icon ${drive.isRemovable ? 'drive-card-icon-external' : ''}">
          ${driveIcon}
        </div>
        <div class="drive-card-content">
          <div class="drive-card-header">
            <span class="drive-letter">${drive.letter}:</span>
            <span class="drive-label">${drive.label || 'Local Disk'}</span>
            <span class="drive-health ${healthClass}" title="${Math.round(drive.percentUsed)}% used">
              ${healthIcon}
            </span>
          </div>
          <div class="drive-card-bar">
            <div class="drive-bar-fill" style="width: ${drive.percentUsed}%"></div>
          </div>
          <div class="drive-card-stats">
            <span class="drive-used">${usedSize} used</span>
            <span class="drive-free">${freeSize} free</span>
          </div>
        </div>
      `;

      card.addEventListener('click', () => {
        container.querySelectorAll('.drive-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.currentDrive = drive.letter;
        this.currentPath = `${drive.letter}:\\`;
        this.updateCurrentDriveDisplay();
        // Auto-scan the selected drive
        this.scanCurrentDirectory();
      });

      container.appendChild(card);
    });

    // Set initial drive
    if (drives.length > 0) {
      this.currentDrive = drives[0].letter;
      this.currentPath = `${drives[0].letter}:\\`;
      this.updateCurrentDriveDisplay();
    }

    // Setup scroll indicator for drive selector
    this.setupDriveScrollIndicator(container);
  }

  // Setup scroll indicator for drive cards
  setupDriveScrollIndicator(container) {
    if (!container) return;

    const checkOverflow = () => {
      const hasOverflow = container.scrollWidth > container.clientWidth;
      container.classList.toggle('has-overflow', hasOverflow);

      // Check if scrolled to end
      const scrolledEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 5;
      container.classList.toggle('scrolled-end', scrolledEnd);
    };

    // Check on load
    checkOverflow();

    // Check on scroll
    container.addEventListener('scroll', checkOverflow, { passive: true });

    // Check on resize
    window.addEventListener('resize', checkOverflow, { passive: true });
  }

  // Toolbar button handling
  initToolbar() {
    const toolbar = document.querySelector('.files-action-toolbar');
    if (!toolbar) return;

    toolbar.querySelectorAll('.toolbar-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        this.handleToolbarAction(action);
      });
    });
  }

  async handleToolbarAction(action) {
    switch (action) {
      case 'scan':
        await this.openFolderAndScan();
        break;
      case 'ownership':
        if (this.selectedFiles.size > 0) {
          await this.takeOwnershipOfSelected();
        } else {
          this.showStatusMessage('Select a file first', 'error');
        }
        break;
      case 'forcedelete':
        if (this.selectedFiles.size > 0) {
          this.openModal('modal-force-delete');
        } else {
          this.showStatusMessage('Select a file first', 'error');
        }
        break;
      case 'permissions':
        if (this.selectedFiles.size > 0) {
          this.openModal('modal-permission-editor');
        } else {
          this.showStatusMessage('Select a file first', 'error');
        }
        break;
      case 'unlock':
        if (this.selectedFiles.size > 0) {
          this.openModal('modal-process-locker');
        } else {
          this.showStatusMessage('Select a file first', 'error');
        }
        break;
      case 'logs':
        await this.showLogs();
        break;
    }
  }

  // Show status message in the status bar
  showStatusMessage(message, type = 'info') {
    const statusBar = document.querySelector('.files-status-bar');
    if (!statusBar) return;

    // Create or find status message element
    let msgEl = statusBar.querySelector('.status-message');
    if (!msgEl) {
      msgEl = document.createElement('span');
      msgEl.className = 'status-message';
      statusBar.insertBefore(msgEl, statusBar.firstChild);
    }

    msgEl.textContent = message;
    msgEl.className = `status-message status-${type}`;
    msgEl.style.display = 'inline';

    // Auto-hide after 3 seconds
    setTimeout(() => {
      msgEl.style.display = 'none';
    }, 3000);
  }

  // Open folder picker dialog and scan selected folder
  async openFolderAndScan() {
    if (!window.deadbyte?.dialog) {
      console.warn('Dialog API not available');
      // Fallback to scanning current path
      await this.scanCurrentDirectory();
      return;
    }

    try {
      const result = await window.deadbyte.dialog.openFolder();
      if (!result.canceled && result.filePaths && result.filePaths.length > 0) {
        this.currentPath = result.filePaths[0];
        this.updateCurrentDriveDisplay();
        await this.scanCurrentDirectory();
      }
    } catch (error) {
      console.error('Error opening folder dialog:', error);
      this.showStatusMessage('Failed to open folder picker', 'error');
    }
  }

  // Scan the current directory using the real backend
  async scanCurrentDirectory() {
    if (!window.deadbyte?.files || this.isScanning) return;

    this.isScanning = true;
    const scanBtn = document.querySelector('[data-action="scan"]');
    if (scanBtn) scanBtn.classList.add('loading');

    // MEMORY LEAK FIX: Clear selections before scanning new directory
    this.selectedFiles.clear();
    this.selectedFilePaths.clear();
    if (this.selectAllCheckbox) {
      this.selectAllCheckbox.checked = false;
      this.selectAllCheckbox.indeterminate = false;
    }

    // Update skull state if available
    window.DeadBYTE?.skull?.setState('scanning');

    try {
      // FAST SCAN: Don't fetch owners or check status initially
      // These are loaded in background after render for visible items only
      const result = await window.deadbyte.files.scan(this.currentPath, {
        recursive: false,
        includeHidden: true,
        detectStatus: false,  // Skip status checks for speed
        getOwners: false,     // Skip owner lookups for speed
        useCache: true,       // Use cached results if available
        limit: 200            // Limit initial load for very large folders
      });

      if (result.success && result.data) {
        this.renderFileTable(result.data.files, result.data.folders);
        this.updateFileCount(result.data.totalFiles, result.data.totalFolders);
        window.DeadBYTE?.skull?.setState('success');
      } else {
        console.error('Scan failed:', result.message);
        window.DeadBYTE?.skull?.setState('error');
      }
    } catch (error) {
      console.error('Scan error:', error);
      window.DeadBYTE?.skull?.setState('error');
    } finally {
      this.isScanning = false;
      if (scanBtn) scanBtn.classList.remove('loading');
    }
  }

  // Get file icon based on extension
  getFileIcon(item) {
    if (item.isDirectory) {
      return `<svg class="file-type-icon file-type-folder" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
      </svg>`;
    }

    const ext = (item.extension || item.name?.split('.').pop() || '').toLowerCase();
    const extWithDot = ext.startsWith('.') ? ext : '.' + ext;

    // Icon definitions
    const icons = {
      folder: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>',
      exe: '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 9h6v6H9z"/>',
      dll: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/>',
      system: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>',
      doc: '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
      image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
      archive: '<path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/><line x1="12" y1="11" x2="12" y2="17"/><line x1="9" y1="14" x2="15" y2="14"/>',
      code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
      audio: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
      video: '<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',
      config: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>',
      data: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',
      generic: '<path d="M13 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V9z"/><polyline points="13 2 13 9 20 9"/>'
    };

    const iconMap = {
      // Executables & System
      '.exe': { class: 'file-type-exe', icon: icons.exe },
      '.msi': { class: 'file-type-exe', icon: icons.exe },
      '.dll': { class: 'file-type-dll', icon: icons.dll },
      '.sys': { class: 'file-type-system', icon: icons.system },
      '.drv': { class: 'file-type-system', icon: icons.system },
      '.bat': { class: 'file-type-exe', icon: icons.exe },
      '.cmd': { class: 'file-type-exe', icon: icons.exe },
      '.ps1': { class: 'file-type-code', icon: icons.code },
      '.vbs': { class: 'file-type-code', icon: icons.code },

      // Documents
      '.txt': { class: 'file-type-text', icon: icons.doc },
      '.md': { class: 'file-type-text', icon: icons.doc },
      '.rtf': { class: 'file-type-text', icon: icons.doc },
      '.pdf': { class: 'file-type-pdf', icon: icons.doc },
      '.doc': { class: 'file-type-doc', icon: icons.doc },
      '.docx': { class: 'file-type-doc', icon: icons.doc },
      '.xls': { class: 'file-type-doc', icon: icons.data },
      '.xlsx': { class: 'file-type-doc', icon: icons.data },
      '.ppt': { class: 'file-type-doc', icon: icons.doc },
      '.pptx': { class: 'file-type-doc', icon: icons.doc },
      '.odt': { class: 'file-type-doc', icon: icons.doc },
      '.ods': { class: 'file-type-doc', icon: icons.data },

      // Images
      '.jpg': { class: 'file-type-image', icon: icons.image },
      '.jpeg': { class: 'file-type-image', icon: icons.image },
      '.png': { class: 'file-type-image', icon: icons.image },
      '.gif': { class: 'file-type-image', icon: icons.image },
      '.bmp': { class: 'file-type-image', icon: icons.image },
      '.svg': { class: 'file-type-image', icon: icons.image },
      '.webp': { class: 'file-type-image', icon: icons.image },
      '.ico': { class: 'file-type-image', icon: icons.image },
      '.tiff': { class: 'file-type-image', icon: icons.image },
      '.psd': { class: 'file-type-image', icon: icons.image },

      // Archives
      '.zip': { class: 'file-type-archive', icon: icons.archive },
      '.rar': { class: 'file-type-archive', icon: icons.archive },
      '.7z': { class: 'file-type-archive', icon: icons.archive },
      '.tar': { class: 'file-type-archive', icon: icons.archive },
      '.gz': { class: 'file-type-archive', icon: icons.archive },
      '.bz2': { class: 'file-type-archive', icon: icons.archive },
      '.xz': { class: 'file-type-archive', icon: icons.archive },
      '.cab': { class: 'file-type-archive', icon: icons.archive },
      '.iso': { class: 'file-type-archive', icon: icons.archive },

      // Code
      '.js': { class: 'file-type-code', icon: icons.code },
      '.ts': { class: 'file-type-code', icon: icons.code },
      '.jsx': { class: 'file-type-code', icon: icons.code },
      '.tsx': { class: 'file-type-code', icon: icons.code },
      '.html': { class: 'file-type-code', icon: icons.code },
      '.htm': { class: 'file-type-code', icon: icons.code },
      '.css': { class: 'file-type-code', icon: icons.code },
      '.scss': { class: 'file-type-code', icon: icons.code },
      '.less': { class: 'file-type-code', icon: icons.code },
      '.json': { class: 'file-type-code', icon: icons.code },
      '.xml': { class: 'file-type-code', icon: icons.code },
      '.yaml': { class: 'file-type-config', icon: icons.config },
      '.yml': { class: 'file-type-config', icon: icons.config },
      '.py': { class: 'file-type-code', icon: icons.code },
      '.java': { class: 'file-type-code', icon: icons.code },
      '.c': { class: 'file-type-code', icon: icons.code },
      '.cpp': { class: 'file-type-code', icon: icons.code },
      '.h': { class: 'file-type-code', icon: icons.code },
      '.cs': { class: 'file-type-code', icon: icons.code },
      '.go': { class: 'file-type-code', icon: icons.code },
      '.rs': { class: 'file-type-code', icon: icons.code },
      '.php': { class: 'file-type-code', icon: icons.code },
      '.rb': { class: 'file-type-code', icon: icons.code },
      '.swift': { class: 'file-type-code', icon: icons.code },
      '.kt': { class: 'file-type-code', icon: icons.code },
      '.sql': { class: 'file-type-data', icon: icons.data },
      '.sh': { class: 'file-type-code', icon: icons.code },

      // Audio
      '.mp3': { class: 'file-type-audio', icon: icons.audio },
      '.wav': { class: 'file-type-audio', icon: icons.audio },
      '.flac': { class: 'file-type-audio', icon: icons.audio },
      '.aac': { class: 'file-type-audio', icon: icons.audio },
      '.ogg': { class: 'file-type-audio', icon: icons.audio },
      '.wma': { class: 'file-type-audio', icon: icons.audio },
      '.m4a': { class: 'file-type-audio', icon: icons.audio },

      // Video
      '.mp4': { class: 'file-type-video', icon: icons.video },
      '.avi': { class: 'file-type-video', icon: icons.video },
      '.mkv': { class: 'file-type-video', icon: icons.video },
      '.mov': { class: 'file-type-video', icon: icons.video },
      '.wmv': { class: 'file-type-video', icon: icons.video },
      '.flv': { class: 'file-type-video', icon: icons.video },
      '.webm': { class: 'file-type-video', icon: icons.video },
      '.m4v': { class: 'file-type-video', icon: icons.video },

      // Config & Data
      '.ini': { class: 'file-type-config', icon: icons.config },
      '.cfg': { class: 'file-type-config', icon: icons.config },
      '.conf': { class: 'file-type-config', icon: icons.config },
      '.config': { class: 'file-type-config', icon: icons.config },
      '.env': { class: 'file-type-config', icon: icons.config },
      '.reg': { class: 'file-type-config', icon: icons.config },
      '.log': { class: 'file-type-log', icon: icons.doc },
      '.db': { class: 'file-type-data', icon: icons.data },
      '.sqlite': { class: 'file-type-data', icon: icons.data },
      '.csv': { class: 'file-type-data', icon: icons.data },

      // Fonts
      '.ttf': { class: 'file-type-generic', icon: icons.generic },
      '.otf': { class: 'file-type-generic', icon: icons.generic },
      '.woff': { class: 'file-type-generic', icon: icons.generic },
      '.woff2': { class: 'file-type-generic', icon: icons.generic },

      // Shortcuts & Links
      '.lnk': { class: 'file-type-exe', icon: icons.exe },
      '.url': { class: 'file-type-generic', icon: icons.generic },
    };

    const config = iconMap[extWithDot] || { class: 'file-type-generic', icon: icons.generic };

    return `<svg class="file-type-icon ${config.class}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      ${config.icon}
    </svg>`;
  }

  // Get status badge HTML
  getStatusBadge(item) {
    const status = item.status || 'accessible';
    const statusConfig = {
      'locked': { class: 'status-locked', text: 'LOCKED', icon: '🔒' },
      'restricted': { class: 'status-restricted', text: 'RESTRICTED', icon: '⚠️' },
      'in_use': { class: 'status-in-use', text: 'IN USE', icon: '🔄' },
      'accessible': { class: 'status-accessible', text: '', icon: '' }
    };

    const config = statusConfig[status] || statusConfig['accessible'];
    if (!config.text) return '';

    return `<span class="file-status-badge ${config.class}" title="${config.text}">${config.icon}</span>`;
  }

  // Render scanned files to the table
  renderFileTable(files, folders) {
    if (!this.fileTableBody) return;

    this.fileTableBody.innerHTML = '';
    this.selectedFiles.clear();
    this.selectedFilePaths.clear();

    // Combine folders and files, folders first
    const allItems = [...folders, ...files];

    allItems.forEach((item, index) => {
      const row = document.createElement('tr');
      const fileId = `file-${index}`;
      row.dataset.fileId = fileId;
      row.dataset.status = item.status || 'accessible';
      row.dataset.isDirectory = item.isDirectory ? 'true' : 'false';

      // Store item data for later operations
      this.selectedFilePaths.set(fileId, item.path);

      // Store full item data on the row for details panel
      row._fileData = item;

      const fileIcon = this.getFileIcon(item);
      const statusBadge = this.getStatusBadge(item);
      const modifiedDate = item.modified ? new Date(item.modified).toLocaleDateString() : '—';
      const status = item.status || 'accessible';
      const statusClass = `file-status-${status}`;
      const statusText = status.toUpperCase().replace('_', ' ');

      row.innerHTML = `
        <td class="col-checkbox"><input type="checkbox" class="file-checkbox"></td>
        <td class="col-name">
          <div class="file-name-cell">
            ${fileIcon}
            <span class="file-name">${escapeHtml(item.name)}</span>
          </div>
        </td>
        <td class="col-path"><code class="file-path">${escapeHtml(item.path)}</code></td>
        <td class="col-size"><span class="file-size">${item.sizeFormatted || '—'}</span></td>
        <td class="col-status"><span class="file-status ${statusClass}">${statusBadge ? statusText : ''}</span></td>
        <td class="col-owner"><span class="file-owner">${item.owner || '—'}</span></td>
        <td class="col-modified"><span class="file-modified">${modifiedDate}</span></td>
      `;

      this.fileTableBody.appendChild(row);
    });

    // Update counts
    this.updateFileCount(files.length, folders.length);
  }

  updateFileCount(files, folders) {
    const totalEl = document.getElementById('files-count-total');
    const visibleEl = document.getElementById('files-count-visible');
    const total = files + folders;
    if (totalEl) totalEl.textContent = total;
    if (visibleEl) visibleEl.textContent = total;

    // Also update any summary text
    const summaryEl = document.querySelector('.files-summary');
    if (summaryEl) {
      summaryEl.textContent = `${folders} folders, ${files} files`;
    }
  }

  // Update the current path display and render breadcrumbs
  updateCurrentDriveDisplay() {
    const display = document.getElementById('current-drive');
    if (display) {
      // Show shortened path if too long
      let displayPath = this.currentPath;
      if (displayPath.length > 50) {
        displayPath = displayPath.substring(0, 20) + '...' + displayPath.substring(displayPath.length - 27);
      }
      display.textContent = displayPath;
      display.title = this.currentPath; // Full path in tooltip
    }

    // Render breadcrumb navigation
    this.renderBreadcrumbs();

    // Update back button state
    const backBtn = document.getElementById('btn-go-back');
    if (backBtn) {
      // Disable if at root of a drive (e.g., "C:\")
      const isAtRoot = /^[A-Z]:\\?$/i.test(this.currentPath);
      backBtn.disabled = isAtRoot;
    }

    // Update status bar with current path
    const statusPathEl = document.getElementById('status-current-path');
    if (statusPathEl) {
      statusPathEl.textContent = this.currentPath;
    }
  }

  // Render breadcrumb navigation segments
  renderBreadcrumbs() {
    const breadcrumbPath = document.getElementById('breadcrumb-path');
    if (!breadcrumbPath || !this.currentPath) return;

    breadcrumbPath.innerHTML = '';

    // Parse the path into segments
    const pathParts = this.currentPath.split('\\').filter(p => p);
    let cumulativePath = '';

    pathParts.forEach((part, index) => {
      // Build cumulative path
      if (index === 0) {
        // Drive letter
        cumulativePath = part + '\\';
      } else {
        cumulativePath += part + '\\';
      }

      // Create segment element
      const segment = document.createElement('span');
      segment.className = 'breadcrumb-segment';
      segment.textContent = part;
      segment.dataset.path = cumulativePath.replace(/\\$/, ''); // Remove trailing slash for navigation

      // Mark last segment as active
      if (index === pathParts.length - 1) {
        segment.classList.add('active');
      } else {
        // Add click handler for non-active segments
        segment.addEventListener('click', () => {
          this.navigateToFolder(segment.dataset.path);
        });
      }

      breadcrumbPath.appendChild(segment);

      // Add separator except for last segment
      if (index < pathParts.length - 1) {
        const separator = document.createElement('span');
        separator.className = 'breadcrumb-separator';
        separator.textContent = '>';
        breadcrumbPath.appendChild(separator);
      }
    });
  }

  // Navigate into a folder
  async navigateToFolder(folderPath) {
    if (!folderPath) return;

    this.currentPath = folderPath;
    this.updateCurrentDriveDisplay();
    await this.scanCurrentDirectory();

    // Show status message
    this.showStatusMessage(`Navigated to: ${folderPath}`, 'info');
  }

  // Go back (up) one level
  async goBack() {
    if (!this.currentPath) return;

    // Get parent path
    const parentPath = this.currentPath.replace(/\\[^\\]+\\?$/, '');

    // Don't go above the drive root
    if (parentPath && parentPath.length >= 2) {
      // Ensure we have at least "C:" or "C:\"
      const finalPath = parentPath.endsWith(':') ? parentPath + '\\' : parentPath;
      await this.navigateToFolder(finalPath);
    }
  }

  // Initialize breadcrumb navigation controls
  initBreadcrumbNav() {
    // Back button
    const backBtn = document.getElementById('btn-go-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => this.goBack());
    }

    // Edit path button - toggle input mode
    const editBtn = document.getElementById('breadcrumb-edit-btn');
    const inputWrapper = document.getElementById('breadcrumb-input-wrapper');
    const pathDisplay = document.getElementById('breadcrumb-path');
    const pathInput = document.getElementById('breadcrumb-input');
    const goBtn = document.getElementById('breadcrumb-go-btn');

    if (editBtn && inputWrapper && pathDisplay && pathInput) {
      editBtn.addEventListener('click', () => {
        const isEditing = !inputWrapper.classList.contains('hidden');
        if (isEditing) {
          // Switch back to breadcrumb display
          inputWrapper.classList.add('hidden');
          pathDisplay.classList.remove('hidden');
        } else {
          // Switch to edit mode
          inputWrapper.classList.remove('hidden');
          pathDisplay.classList.add('hidden');
          pathInput.value = this.currentPath;
          pathInput.focus();
          pathInput.select();
        }
      });

      // Go button - navigate to entered path
      if (goBtn) {
        goBtn.addEventListener('click', () => {
          const newPath = pathInput.value.trim();
          if (newPath) {
            this.navigateToFolder(newPath);
            inputWrapper.classList.add('hidden');
            pathDisplay.classList.remove('hidden');
          }
        });
      }

      // Enter key in input
      pathInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          const newPath = pathInput.value.trim();
          if (newPath) {
            this.navigateToFolder(newPath);
            inputWrapper.classList.add('hidden');
            pathDisplay.classList.remove('hidden');
          }
        } else if (e.key === 'Escape') {
          inputWrapper.classList.add('hidden');
          pathDisplay.classList.remove('hidden');
        }
      });
    }
  }

  // Take ownership of selected files (multi-select)
  async takeOwnershipOfSelected() {
    if (!window.deadbyte?.ownership) {
      this.showStatusMessage('Ownership API not available', 'error');
      return;
    }

    const filesToProcess = [];
    for (const [fileId, filePath] of this.selectedFilePaths) {
      if (this.selectedFiles.has(fileId)) {
        filesToProcess.push({ fileId, filePath });
      }
    }

    if (filesToProcess.length === 0) {
      this.showStatusMessage('No files selected', 'error');
      return;
    }

    this.showStatusMessage(`Taking ownership of ${filesToProcess.length} file(s)...`, 'info');

    let successCount = 0;
    let failCount = 0;

    for (const { fileId, filePath } of filesToProcess) {
      try {
        const result = await window.deadbyte.ownership.take(filePath);
        if (result.success) {
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to take ownership of ${filePath}:`, result.message);
        }
      } catch (error) {
        failCount++;
        console.error(`Error taking ownership of ${filePath}:`, error);
      }
    }

    // Show result
    if (failCount === 0) {
      this.showStatusMessage(`Ownership taken for ${successCount} file(s)`, 'success');
    } else if (successCount === 0) {
      this.showStatusMessage(`Failed to take ownership of all ${failCount} file(s)`, 'error');
    } else {
      this.showStatusMessage(`Ownership: ${successCount} succeeded, ${failCount} failed`, 'warning');
    }

    // Refresh details panel if a file is selected
    if (this.currentSelectedFile?.row) {
      await this.showDetailsForRow(this.currentSelectedFile.row);
    }
  }

  // Show logs (could open a modal or panel)
  async showLogs() {
    // Create or show logs modal
    let logsModal = document.getElementById('modal-logs');

    if (!logsModal) {
      // Create the modal if it doesn't exist
      logsModal = document.createElement('div');
      logsModal.id = 'modal-logs';
      logsModal.className = 'modal-overlay';
      logsModal.innerHTML = `
        <div class="modal-content modal-logs">
          <button class="modal-close" aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
          <h3 class="modal-title">Operation Logs</h3>
          <div id="logs-container" class="logs-container">
            <div class="logs-loading">Loading logs...</div>
          </div>
          <div class="modal-actions">
            <button class="btn btn-ghost" id="btn-clear-logs">Clear All</button>
            <button class="btn btn-primary" id="btn-close-logs">Close</button>
          </div>
        </div>
      `;
      document.body.appendChild(logsModal);

      // Add event listeners
      logsModal.querySelector('.modal-close')?.addEventListener('click', () => {
        logsModal.classList.remove('open');
      });
      logsModal.querySelector('#btn-close-logs')?.addEventListener('click', () => {
        logsModal.classList.remove('open');
      });
      logsModal.querySelector('#btn-clear-logs')?.addEventListener('click', async () => {
        await this.clearLogs();
      });
      logsModal.addEventListener('click', (e) => {
        if (e.target === logsModal) {
          logsModal.classList.remove('open');
        }
      });
    }

    logsModal.classList.add('open');
    await this.loadLogsContent();
  }

  async loadLogsContent() {
    const container = document.getElementById('logs-container');
    if (!container) return;

    if (!window.deadbyte?.logs) {
      container.innerHTML = '<div class="logs-error">Logs API not available</div>';
      return;
    }

    try {
      const result = await window.deadbyte.logs.get({ limit: 100 });

      if (result.success && result.data && result.data.length > 0) {
        container.innerHTML = '';

        // Sort by timestamp descending (newest first)
        const logs = result.data.sort((a, b) =>
          new Date(b.timestamp) - new Date(a.timestamp)
        );

        logs.forEach(log => {
          try {
            // Validate log entry is a proper object with expected fields
            if (!log || typeof log !== 'object') return;
            if (typeof log.message === 'string' && log.message.length > 1000) return; // Skip corrupted entries
            if (typeof log.path === 'string' && log.path.length > 500) return; // Skip corrupted paths
            // Skip if message looks like base64 or binary data
            if (log.message && /^[A-Za-z0-9+/=]{100,}$/.test(log.message)) return;

            const logEntry = document.createElement('div');
            const logType = log.type || 'info';
            const operationType = log.operation || 'system';
            logEntry.className = `log-entry log-type-${logType} log-op-${operationType}`;

            const timestamp = this.formatLogTimestamp(log.timestamp);
            const badge = this.getOperationBadge(operationType);

            logEntry.innerHTML = `
              <div class="log-header">
                ${badge}
                <span class="log-timestamp">${timestamp}</span>
              </div>
              <div class="log-message">${escapeHtml(log.message || 'No details')}</div>
              ${log.path ? `<div class="log-path">${escapeHtml(log.path)}</div>` : ''}
            `;
            container.appendChild(logEntry);
          } catch (e) {
            // Skip invalid log entries silently
          }
        });

        // If no valid entries were rendered
        if (container.children.length === 0) {
          container.innerHTML = this.getEmptyLogsHtml();
        }
      } else {
        container.innerHTML = this.getEmptyLogsHtml();
      }
    } catch (error) {
      container.innerHTML = `<div class="logs-error">Error loading logs: ${error.message}</div>`;
    }
  }

  formatLogTimestamp(timestamp) {
    try {
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Unknown time';
      return date.toLocaleString('en-US', {
        month: 'short', day: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit'
      });
    } catch {
      return 'Unknown time';
    }
  }

  getOperationBadge(operation) {
    const badges = {
      scan: { label: 'SCAN', class: 'badge-scan' },
      delete: { label: 'DELETE', class: 'badge-delete' },
      force_delete: { label: 'DELETE', class: 'badge-delete' },
      ownership: { label: 'OWNERSHIP', class: 'badge-ownership' },
      permission: { label: 'PERMISSION', class: 'badge-permission' },
      process_kill: { label: 'PROCESS', class: 'badge-process' },
      system: { label: 'SYSTEM', class: 'badge-system' }
    };
    const badge = badges[operation] || badges.system;
    return `<span class="log-badge ${badge.class}">${badge.label}</span>`;
  }

  getEmptyLogsHtml() {
    return `
      <div class="logs-empty">
        <svg class="logs-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
        </svg>
        <span>No operations logged yet</span>
      </div>
    `;
  }

  async clearLogs() {
    if (!window.deadbyte?.logs) return;

    try {
      await window.deadbyte.logs.clear();
      await this.loadLogsContent();
      this.showStatusMessage('Logs cleared', 'success');
    } catch (error) {
      this.showStatusMessage('Failed to clear logs', 'error');
    }
  }

  // Search and filter functionality
  initSearchFilter() {
    const searchInput = document.getElementById('files-search-input');
    const clearBtn = document.getElementById('search-clear-btn');
    const filterBtns = document.querySelectorAll('.filter-btn');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.filterFiles(e.target.value, this.currentFilter);
        if (clearBtn) {
          clearBtn.classList.toggle('hidden', e.target.value.length === 0);
        }
      });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          this.filterFiles('', this.currentFilter);
          clearBtn.classList.add('hidden');
        }
      });
    }

    this.currentFilter = 'all';
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.currentFilter = btn.dataset.filter;
        const searchValue = searchInput?.value || '';
        this.filterFiles(searchValue, this.currentFilter);
      });
    });
  }

  filterFiles(searchTerm, statusFilter) {
    const rows = this.fileTableBody?.querySelectorAll('tr');
    if (!rows) return;

    let visibleCount = 0;
    const searchLower = searchTerm.toLowerCase();

    rows.forEach(row => {
      const fileName = row.querySelector('.file-name')?.textContent?.toLowerCase() || '';
      const fileId = row.dataset.fileId;
      const filePath = (this.selectedFilePaths.get(fileId) || '').toLowerCase();
      const status = row.dataset.status || 'accessible';

      // Search matches file name or path
      const matchesSearch = searchTerm === '' ||
        fileName.includes(searchLower) ||
        filePath.includes(searchLower);

      // Filter matches status
      let matchesFilter = false;
      switch (statusFilter) {
        case 'all':
          matchesFilter = true;
          break;
        case 'locked':
          matchesFilter = status === 'locked' || status === 'in_use';
          break;
        case 'restricted':
          matchesFilter = status === 'restricted';
          break;
        case 'accessible':
          matchesFilter = status === 'accessible';
          break;
        default:
          matchesFilter = status === statusFilter;
      }

      const isVisible = matchesSearch && matchesFilter;
      row.style.display = isVisible ? '' : 'none';
      if (isVisible) visibleCount++;
    });

    // Update count display
    const visibleEl = document.getElementById('files-count-visible');
    const totalEl = document.getElementById('files-count-total');
    if (visibleEl) visibleEl.textContent = visibleCount;

    // Show "X of Y" format
    const total = rows.length;
    if (totalEl && visibleCount !== total) {
      // The badge could show "visible of total"
    }
  }

  // Drive selector functionality
  initDriveSelector() {
    const driveCards = document.querySelectorAll('.drive-card');
    driveCards.forEach(card => {
      card.addEventListener('click', async () => {
        driveCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const driveLetter = card.dataset.drive;
        this.currentDrive = driveLetter;

        // Navigate to the drive root and scan it
        const drivePath = driveLetter.endsWith(':') ? driveLetter + '\\' : driveLetter + ':\\';
        await this.navigateToFolder(drivePath);
      });
    });
  }

  // File table functionality
  initFileTable() {
    if (!this.fileTableBody) return;

    // Row click for selection
    this.fileTableBody.addEventListener('click', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const checkbox = row.querySelector('.file-checkbox');
      const isCheckboxClick = e.target.classList.contains('file-checkbox');

      if (e.shiftKey && this.lastSelectedRow) {
        // Shift+click for range selection
        this.selectRange(this.lastSelectedRow, row);
      } else if (e.ctrlKey || e.metaKey) {
        // Ctrl+click for individual toggle
        this.toggleRowSelection(row);
      } else if (!isCheckboxClick) {
        // Regular click - select single row and show details
        this.selectSingleRow(row);
      }

      if (isCheckboxClick) {
        this.toggleRowSelection(row);
      }

      this.lastSelectedRow = row;
      this.updateSelectedCount();
    });

    // Double-click to navigate into folders
    this.fileTableBody.addEventListener('dblclick', (e) => {
      const row = e.target.closest('tr');
      if (!row) return;

      const isDirectory = row.dataset.isDirectory === 'true';
      if (isDirectory) {
        const fileId = row.dataset.fileId;
        const filePath = this.selectedFilePaths.get(fileId);
        if (filePath) {
          this.navigateToFolder(filePath);
        }
      }
    });

    // Select all checkbox
    if (this.selectAllCheckbox) {
      this.selectAllCheckbox.addEventListener('change', (e) => {
        const rows = this.fileTableBody.querySelectorAll('tr');
        rows.forEach(row => {
          const checkbox = row.querySelector('.file-checkbox');
          if (checkbox) {
            checkbox.checked = e.target.checked;
            row.classList.toggle('selected', e.target.checked);
            if (e.target.checked) {
              this.selectedFiles.add(row.dataset.fileId);
            } else {
              this.selectedFiles.delete(row.dataset.fileId);
            }
          }
        });
        this.updateSelectedCount();
      });
    }
  }

  selectSingleRow(row) {
    // Deselect all other rows
    const allRows = this.fileTableBody.querySelectorAll('tr');
    allRows.forEach(r => {
      r.classList.remove('selected');
      const cb = r.querySelector('.file-checkbox');
      if (cb) cb.checked = false;
    });
    this.selectedFiles.clear();

    // Select clicked row
    row.classList.add('selected');
    const checkbox = row.querySelector('.file-checkbox');
    if (checkbox) checkbox.checked = true;
    this.selectedFiles.add(row.dataset.fileId);

    // Show details panel
    this.showDetailsForRow(row);
  }

  toggleRowSelection(row) {
    const isSelected = row.classList.toggle('selected');
    const checkbox = row.querySelector('.file-checkbox');
    if (checkbox) checkbox.checked = isSelected;

    if (isSelected) {
      this.selectedFiles.add(row.dataset.fileId);
      this.showDetailsForRow(row);
    } else {
      this.selectedFiles.delete(row.dataset.fileId);
      if (this.selectedFiles.size === 0) {
        this.hideDetailsPanel();
      }
    }
  }

  selectRange(startRow, endRow) {
    const rows = Array.from(this.fileTableBody.querySelectorAll('tr'));
    const startIndex = rows.indexOf(startRow);
    const endIndex = rows.indexOf(endRow);
    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];

    for (let i = from; i <= to; i++) {
      const row = rows[i];
      row.classList.add('selected');
      const checkbox = row.querySelector('.file-checkbox');
      if (checkbox) checkbox.checked = true;
      this.selectedFiles.add(row.dataset.fileId);
    }
  }

  updateSelectedCount() {
    const countEl = document.getElementById('selected-count');
    if (countEl) {
      countEl.textContent = this.selectedFiles.size;
    }

    // Also update the status bar selected count
    const statusSelectedEl = document.getElementById('status-selected-count');
    if (statusSelectedEl) {
      statusSelectedEl.textContent = this.selectedFiles.size;
    }
  }

  // Details panel functionality
  initDetailsPanel() {
    // Copy path button with feedback
    const copyBtn = this.detailsPanel?.querySelector('.details-copy-btn');
    copyBtn?.addEventListener('click', async () => {
      const path = document.getElementById('details-file-path')?.textContent;
      if (path) {
        try {
          await navigator.clipboard.writeText(path);
          this.showStatusMessage('Path copied to clipboard', 'success');
          // Visual feedback on button
          copyBtn.textContent = '✓';
          setTimeout(() => {
            copyBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>';
          }, 1500);
        } catch {
          this.showStatusMessage('Failed to copy path', 'error');
        }
      }
    });

    // Force Delete button
    document.getElementById('btn-force-delete')?.addEventListener('click', () => {
      if (!this.currentSelectedFile?.path) {
        this.showStatusMessage('Select a file first', 'error');
        return;
      }
      this.openModal('modal-force-delete');
    });

    // Take Ownership button
    document.getElementById('btn-take-ownership')?.addEventListener('click', async () => {
      if (!this.currentSelectedFile?.path) {
        this.showStatusMessage('Select a file first', 'error');
        return;
      }
      await this.takeOwnershipOfFile(this.currentSelectedFile.path);
    });

    // Fix Permissions button
    document.getElementById('btn-fix-permissions')?.addEventListener('click', () => {
      if (!this.currentSelectedFile?.path) {
        this.showStatusMessage('Select a file first', 'error');
        return;
      }
      this.openModal('modal-permission-editor');
    });

    // Unlock File button
    document.getElementById('btn-unlock-file')?.addEventListener('click', () => {
      if (!this.currentSelectedFile?.path) {
        this.showStatusMessage('Select a file first', 'error');
        return;
      }
      this.openModal('modal-process-locker');
    });

    // Kill Process button in lock section
    document.getElementById('btn-kill-process')?.addEventListener('click', async () => {
      if (!this.currentSelectedFile?.lockingProcess) {
        this.showStatusMessage('No locking process found', 'error');
        return;
      }
      await this.killLockingProcess(this.currentSelectedFile.lockingProcess.pid);
    });
  }

  // Take ownership of a single file
  async takeOwnershipOfFile(filePath) {
    if (!window.deadbyte?.ownership) {
      this.showStatusMessage('Ownership API not available', 'error');
      return;
    }

    try {
      this.showStatusMessage('Taking ownership...', 'info');
      const result = await window.deadbyte.ownership.take(filePath, { recursive: false });

      if (result.success) {
        this.showStatusMessage('Ownership taken successfully', 'success');
        // Refresh details panel
        if (this.currentSelectedFile?.row) {
          await this.showDetailsForRow(this.currentSelectedFile.row);
        }
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }
  }

  // Kill a process by PID
  async killLockingProcess(pid) {
    if (!window.deadbyte?.process) {
      this.showStatusMessage('Process API not available', 'error');
      return;
    }

    try {
      this.showStatusMessage('Terminating process...', 'info');
      const result = await window.deadbyte.process.kill(pid, { force: true });

      if (result.success) {
        this.showStatusMessage('Process terminated successfully', 'success');
        this.hideLockSection();

        // Update row status
        if (this.currentSelectedFile?.row) {
          this.currentSelectedFile.row.dataset.status = 'accessible';
          this.currentSelectedFile.lockingProcess = null;
          // Refresh details
          await this.showDetailsForRow(this.currentSelectedFile.row);
        }
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }
  }

  async showDetailsForRow(row) {
    if (!this.detailsPanel) return;

    // Hide empty state, show content
    const emptyState = document.getElementById('details-empty-state');
    const detailsContent = document.getElementById('details-content');

    if (emptyState) emptyState.classList.add('hidden');
    if (detailsContent) detailsContent.classList.remove('hidden');

    // Get file data from row
    const fileId = row.dataset.fileId;
    const filePath = this.selectedFilePaths.get(fileId) || '';
    const fileData = row._fileData || {};

    // Store currently selected file for actions
    this.currentSelectedFile = {
      id: fileId,
      path: filePath,
      data: fileData,
      row: row
    };

    // Basic info from stored data
    const fileName = fileData.name || row.querySelector('.file-name')?.textContent || '—';
    const fileSize = fileData.sizeFormatted || row.querySelector('.file-size')?.textContent || '—';
    const fileModified = fileData.modified ? new Date(fileData.modified).toLocaleString() : '—';

    // Update panel elements
    const fileNameEl = document.getElementById('details-file-name');
    const filePathEl = document.getElementById('details-file-path');
    const ownerEl = document.getElementById('details-owner');
    const sizeEl = document.getElementById('details-size');
    const modifiedEl = document.getElementById('details-modified');
    const statusEl = document.getElementById('details-status');
    const createdEl = document.getElementById('details-created');

    if (fileNameEl) fileNameEl.textContent = fileName;
    if (filePathEl) filePathEl.textContent = filePath;
    if (sizeEl) sizeEl.textContent = fileSize;
    if (modifiedEl) modifiedEl.textContent = fileModified;
    if (createdEl && fileData.created) createdEl.textContent = new Date(fileData.created).toLocaleString();

    // Update file icon in details panel
    const iconContainer = document.getElementById('details-file-icon');
    if (iconContainer) {
      iconContainer.innerHTML = this.getFileIcon(fileData);
    }

    // Update status badge
    if (statusEl) {
      const status = fileData.status || 'accessible';
      const statusLabels = {
        'locked': 'LOCKED',
        'restricted': 'RESTRICTED',
        'in_use': 'IN USE',
        'accessible': 'ACCESSIBLE'
      };
      statusEl.textContent = statusLabels[status] || 'ACCESSIBLE';
      statusEl.className = `details-status status-${status}`;
    }

    // Fetch detailed info from backend
    if (window.deadbyte?.files && filePath) {
      try {
        const detailsResult = await window.deadbyte.files.getDetails(filePath);
        if (detailsResult.success && detailsResult.data) {
          const details = detailsResult.data;
          if (ownerEl) ownerEl.textContent = details.owner || '—';
          if (sizeEl) sizeEl.textContent = details.sizeFormatted || '—';
          if (modifiedEl) modifiedEl.textContent = new Date(details.modified).toLocaleString();
          if (createdEl) createdEl.textContent = new Date(details.created).toLocaleString();

          // Store for actions
          this.currentSelectedFile.details = details;
        }

        // Load permissions
        await this.loadFilePermissions(filePath);

        // Check for locking processes
        await this.checkLockingProcesses(filePath, row);

      } catch (error) {
        console.warn('Could not fetch file details:', error);
        if (ownerEl) ownerEl.textContent = '—';
      }
    } else {
      if (ownerEl) ownerEl.textContent = fileData.owner || '—';
      this.hideLockSection();
    }

    // Enable action buttons
    this.enableActionButtons(true);
  }

  // Load and display file permissions
  async loadFilePermissions(filePath) {
    const permGrid = document.getElementById('details-permissions-grid');
    if (!permGrid || !window.deadbyte?.permissions) return;

    try {
      const result = await window.deadbyte.permissions.get(filePath);
      if (result.success && result.data) {
        const rules = result.data.accessRules || [];

        // Initialize permission states for each category
        const perms = {
          owner: { r: false, w: false, x: false },
          group: { r: false, w: false, x: false },
          others: { r: false, w: false, x: false },
          system: { r: false, w: false, x: false }
        };

        // Map ACL rules to permission categories
        rules.forEach(rule => {
          if (rule.accessType !== 'Allow') return;

          const identity = rule.identity.toLowerCase();
          const rights = rule.rights || [];

          // Determine which category this rule applies to
          let category = null;
          if (identity.includes('system') || identity.includes('nt authority\\system')) {
            category = 'system';
          } else if (identity.includes('administrators') || identity.includes('builtin\\administrators')) {
            category = 'owner'; // Treat Administrators as owner for display
          } else if (identity.includes('users') || identity.includes('builtin\\users') || identity.includes('authenticated users')) {
            category = 'group';
          } else if (identity.includes('everyone') || identity.includes('world')) {
            category = 'others';
          } else if (identity === result.data.owner?.toLowerCase() || identity.includes('owner')) {
            category = 'owner';
          }

          if (!category) return;

          // Check for various permission types
          const hasRead = rights.some(r => ['Read', 'ReadAndExecute', 'FullControl', 'Modify', 'ReadData', 'ListDirectory'].includes(r));
          const hasWrite = rights.some(r => ['Write', 'FullControl', 'Modify', 'WriteData', 'AppendData', 'CreateFiles', 'CreateDirectories'].includes(r));
          const hasExecute = rights.some(r => ['ReadAndExecute', 'FullControl', 'Modify', 'ExecuteFile'].includes(r));

          if (hasRead) perms[category].r = true;
          if (hasWrite) perms[category].w = true;
          if (hasExecute) perms[category].x = true;
        });

        // Update all permission indicators
        Object.keys(perms).forEach(cat => {
          Object.keys(perms[cat]).forEach(perm => {
            const el = permGrid.querySelector(`[data-perm="${cat}-${perm}"]`);
            if (el) this.setPermissionIndicator(el, perms[cat][perm]);
          });
        });

        // Store permissions for editing
        this.currentSelectedFile.permissions = result.data;
      }
    } catch (error) {
      console.warn('Could not load permissions:', error);
    }
  }

  setPermissionIndicator(el, allowed) {
    if (allowed) {
      el.classList.remove('perm-denied');
      el.classList.add('perm-allowed');
      el.textContent = '✓';
    } else {
      el.classList.remove('perm-allowed');
      el.classList.add('perm-denied');
      el.textContent = '✗';
    }
  }

  // Check for locking processes
  async checkLockingProcesses(filePath, row) {
    const lockSection = document.getElementById('details-lock-section');
    if (!lockSection || !window.deadbyte?.process) {
      this.hideLockSection();
      return;
    }

    try {
      const lockResult = await window.deadbyte.process.getLocking(filePath);
      if (lockResult.success && lockResult.data && lockResult.data.length > 0) {
        lockSection.style.display = 'block';
        lockSection.classList.remove('hidden');

        const processNameEl = document.getElementById('lock-process-name');
        const processPidEl = document.getElementById('lock-process-pid');
        const proc = lockResult.data[0];

        if (processNameEl) processNameEl.textContent = proc.name;
        if (processPidEl) processPidEl.textContent = `PID ${proc.pid}`;

        // Store process info
        this.currentSelectedFile.lockingProcess = proc;
        row.dataset.lockedBy = proc.name;
        row.dataset.pid = proc.pid;

        // Update row status if it was accessible
        if (row.dataset.status === 'accessible') {
          row.dataset.status = 'in_use';
        }
      } else {
        this.hideLockSection();
      }
    } catch (error) {
      console.warn('Could not check locking processes:', error);
      this.hideLockSection();
    }
  }

  hideLockSection() {
    const lockSection = document.getElementById('details-lock-section');
    if (lockSection) {
      lockSection.style.display = 'none';
      lockSection.classList.add('hidden');
    }
  }

  enableActionButtons(enabled) {
    const buttons = [
      'btn-force-delete',
      'btn-take-ownership',
      'btn-fix-permissions',
      'btn-unlock-file'
    ];

    buttons.forEach(id => {
      const btn = document.getElementById(id);
      if (btn) {
        btn.disabled = !enabled;
        btn.classList.toggle('disabled', !enabled);
      }
    });
  }

  hideDetailsPanel() {
    // Show empty state, hide content
    const emptyState = document.getElementById('details-empty-state');
    const detailsContent = document.getElementById('details-content');

    if (emptyState) emptyState.classList.remove('hidden');
    if (detailsContent) detailsContent.classList.add('hidden');
  }

  // Context menu functionality
  initContextMenu() {
    if (!this.contextMenu || !this.fileTableBody) return;

    // Show context menu on right-click
    this.fileTableBody.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const row = e.target.closest('tr');
      if (!row) return;

      // Select the row
      if (!row.classList.contains('selected')) {
        this.selectSingleRow(row);
      }

      // Position and show menu
      this.contextMenu.style.left = `${e.clientX}px`;
      this.contextMenu.style.top = `${e.clientY}px`;
      this.contextMenu.classList.add('open');
    });

    // Hide context menu on click outside
    document.addEventListener('click', () => {
      this.contextMenu.classList.remove('open');
    });

    // Hide on escape
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.contextMenu.classList.remove('open');
      }
    });

    // Context menu actions
    this.contextMenu.querySelectorAll('.context-menu-item').forEach(item => {
      item.addEventListener('click', () => {
        const action = item.dataset.action;
        this.handleContextAction(action);
        this.contextMenu.classList.remove('open');
      });
    });
  }

  async handleContextAction(action) {
    if (!this.currentSelectedFile?.path) {
      this.showStatusMessage('No file selected', 'error');
      return;
    }

    switch (action) {
      case 'ownership':
        await this.takeOwnershipOfFile(this.currentSelectedFile.path);
        break;
      case 'permissions':
        this.openModal('modal-permission-editor');
        break;
      case 'forcedelete':
        this.openModal('modal-force-delete');
        break;
      case 'findprocess':
        this.openModal('modal-process-locker');
        break;
      case 'copypath':
        try {
          await navigator.clipboard.writeText(this.currentSelectedFile.path);
          this.showStatusMessage('Path copied to clipboard', 'success');
        } catch {
          this.showStatusMessage('Failed to copy path', 'error');
        }
        break;
      case 'refresh':
        await this.showDetailsForRow(this.currentSelectedFile.row);
        this.showStatusMessage('File details refreshed', 'success');
        break;
    }
  }

  // Modal functionality
  initModals() {
    // Force delete modal
    this.initForceDeleteModal();

    // Permission editor modal
    document.getElementById('btn-cancel-permissions')?.addEventListener('click', () => {
      this.closeModal('modal-permission-editor');
    });
    document.getElementById('btn-save-permissions')?.addEventListener('click', async () => {
      await this.savePermissionChanges();
    });
    document.getElementById('btn-reset-permissions')?.addEventListener('click', async () => {
      await this.resetPermissions();
    });
    // Quick action buttons
    document.getElementById('btn-grant-full-control')?.addEventListener('click', async () => {
      await this.grantFullControl();
    });
    document.getElementById('btn-make-readable')?.addEventListener('click', async () => {
      await this.makeFileReadable();
    });

    // Process locker modal
    document.getElementById('btn-cancel-process')?.addEventListener('click', () => {
      this.closeModal('modal-process-locker');
    });
    document.getElementById('btn-kill-all-unlock')?.addEventListener('click', async () => {
      await this.killAllLockingProcesses();
      // Note: Modal auto-closes after success via recheckAndShowUnlockStatus()
    });
  }

  // Kill all locking processes for the current file with progress
  async killAllLockingProcesses() {
    if (!this.currentSelectedFile?.path || !window.deadbyte?.process) {
      this.showStatusMessage('Process API not available', 'error');
      return;
    }

    const killAllBtn = document.getElementById('btn-kill-all-unlock');
    const processList = document.getElementById('locker-process-list');

    try {
      // Use stored processes or fetch fresh
      let processes = this.currentLockingProcesses;
      if (!processes || processes.length === 0) {
        const result = await window.deadbyte.process.getLocking(this.currentSelectedFile.path);
        if (!result.success || !result.data || result.data.length === 0) {
          this.showStatusMessage('No processes to kill', 'info');
          return;
        }
        processes = result.data;
      }

      // Filter to killable processes
      const killableProcesses = processes.filter(proc => proc.isKillSafe !== false);

      if (killableProcesses.length === 0) {
        this.showStatusMessage('All locking processes are protected system processes', 'error');
        return;
      }

      // Disable button and show progress
      if (killAllBtn) {
        killAllBtn.disabled = true;
      }

      // Kill processes sequentially with progress
      let killed = 0;
      let failed = 0;

      for (let i = 0; i < killableProcesses.length; i++) {
        const proc = killableProcesses[i];
        const progress = `Killing process ${i + 1} of ${killableProcesses.length}...`;

        // Update button text
        if (killAllBtn) {
          killAllBtn.textContent = progress;
        }
        this.showStatusMessage(progress, 'info');

        // Update UI to show which process is being killed
        const processItem = processList?.querySelector(`[data-pid="${proc.pid}"]`);
        if (processItem) {
          processItem.classList.add('process-killing');
          const killBtn = processItem.querySelector('.process-kill-btn');
          if (killBtn) {
            killBtn.disabled = true;
            killBtn.textContent = 'Killing...';
          }
        }

        // Kill the process
        const result = await window.deadbyte.process.kill(proc.pid, { force: true });

        if (result.success) {
          killed++;
          // Mark as killed in UI
          if (processItem) {
            processItem.classList.remove('process-killing');
            processItem.classList.add('process-killed');
          }
        } else {
          failed++;
          if (processItem) {
            processItem.classList.remove('process-killing');
            processItem.classList.add('process-kill-failed');
            const killBtn = processItem.querySelector('.process-kill-btn');
            if (killBtn) {
              killBtn.textContent = 'Failed';
            }
          }
        }

        // Small delay between kills
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Show completion status
      const message = failed === 0
        ? `Successfully terminated ${killed} process(es)`
        : `Terminated ${killed} process(es), ${failed} failed`;

      this.showStatusMessage(message, failed === 0 ? 'success' : 'error');

      // Wait for processes to fully terminate
      await new Promise(resolve => setTimeout(resolve, 500));

      // Re-check file lock status
      await this.recheckAndShowUnlockStatus();

    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
      if (killAllBtn) {
        killAllBtn.disabled = false;
        killAllBtn.textContent = 'Kill All & Unlock';
      }
    }
  }

  initForceDeleteModal() {
    const confirmBtn = document.getElementById('btn-confirm-delete');
    const cancelBtn = document.getElementById('btn-cancel-delete');

    cancelBtn?.addEventListener('click', () => {
      this.closeModal('modal-force-delete');
    });

    confirmBtn?.addEventListener('click', async () => {
      if (!confirmBtn.disabled) {
        await this.executeForceDelete();
      }
    });
  }

  // Populate force delete modal with file info
  populateForceDeleteModal() {
    // Get selected files to delete
    const filesToDelete = [];
    const fileDataList = [];

    for (const [fileId, filePath] of this.selectedFilePaths) {
      if (this.selectedFiles.has(fileId)) {
        filesToDelete.push(filePath);
        // Get the row data for this file
        const row = this.fileTableBody?.querySelector(`tr[data-file-id="${fileId}"]`);
        if (row && row._fileData) {
          fileDataList.push(row._fileData);
        } else {
          // Fallback - create minimal data from path
          const fileName = filePath.split('\\').pop();
          fileDataList.push({ name: fileName, path: filePath, sizeFormatted: '—' });
        }
      }
    }

    if (filesToDelete.length === 0) return;

    // Update modal file summary section with the first (or only) selected file
    const filenameEl = document.getElementById('modal-delete-filename');
    const pathEl = document.getElementById('modal-delete-path');
    const sizeEl = document.getElementById('modal-delete-size');

    if (filesToDelete.length === 1) {
      // Single file - show its details
      const fileData = fileDataList[0];
      if (filenameEl) filenameEl.textContent = fileData.name || filesToDelete[0].split('\\').pop();
      if (pathEl) pathEl.textContent = fileData.path || filesToDelete[0];
      if (sizeEl) sizeEl.textContent = fileData.sizeFormatted || '—';
    } else {
      // Multiple files
      if (filenameEl) filenameEl.textContent = `${filesToDelete.length} files selected`;
      if (pathEl) pathEl.textContent = this.currentPath || 'Multiple locations';
      // Calculate total size if available
      let totalSize = 0;
      let hasSize = false;
      fileDataList.forEach(f => {
        if (f.size && typeof f.size === 'number') {
          totalSize += f.size;
          hasSize = true;
        }
      });
      if (sizeEl) sizeEl.textContent = hasSize ? this.formatFileSize(totalSize) : '—';
    }

    // Also update file list if that element exists
    const fileListEl = document.getElementById('delete-file-list');
    const fileCountEl = document.getElementById('delete-file-count');

    if (fileCountEl) {
      fileCountEl.textContent = filesToDelete.length;
    }

    if (fileListEl) {
      fileListEl.innerHTML = '';
      const displayFiles = filesToDelete.slice(0, 5);
      displayFiles.forEach(filePath => {
        const li = document.createElement('li');
        li.className = 'delete-file-item';
        const fileName = filePath.split('\\').pop();
        li.innerHTML = `
          <span class="delete-file-icon">📄</span>
          <span class="delete-file-path">${escapeHtml(fileName)}</span>
        `;
        fileListEl.appendChild(li);
      });

      if (filesToDelete.length > 5) {
        const li = document.createElement('li');
        li.className = 'delete-file-more';
        li.textContent = `... and ${filesToDelete.length - 5} more files`;
        fileListEl.appendChild(li);
      }
    }
  }

  // Helper to format file size
  formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Execute force delete on selected files
  async executeForceDelete() {
    if (!window.deadbyte?.forceDelete) {
      this.showStatusMessage('Force delete API not available', 'error');
      this.closeModal('modal-force-delete');
      return;
    }

    const filesToDelete = [];
    const fileIds = [];
    for (const [fileId, filePath] of this.selectedFilePaths) {
      if (this.selectedFiles.has(fileId)) {
        filesToDelete.push(filePath);
        fileIds.push(fileId);
      }
    }

    if (filesToDelete.length === 0) {
      this.closeModal('modal-force-delete');
      return;
    }

    // Update skull state
    window.DeadBYTE?.skull?.setState('deleting');
    this.showStatusMessage(`Deleting ${filesToDelete.length} file(s)...`, 'info');

    try {
      let result;
      if (filesToDelete.length === 1) {
        result = await window.deadbyte.forceDelete.execute(filesToDelete[0]);
      } else {
        result = await window.deadbyte.forceDelete.executeMultiple(filesToDelete);
      }

      if (result.success) {
        window.DeadBYTE?.skull?.setState('success');
        this.showStatusMessage(`Successfully deleted ${filesToDelete.length} file(s)`, 'success');

        // Remove deleted rows from table
        fileIds.forEach(fileId => {
          const row = this.fileTableBody?.querySelector(`tr[data-file-id="${fileId}"]`);
          if (row) {
            row.remove();
          }
          this.selectedFiles.delete(fileId);
          this.selectedFilePaths.delete(fileId);
        });

        // Update counts
        this.updateSelectedCount();
        this.hideDetailsPanel();
        this.currentSelectedFile = null;

        // Update file count
        const remainingRows = this.fileTableBody?.querySelectorAll('tr').length || 0;
        const totalEl = document.getElementById('files-count-total');
        const visibleEl = document.getElementById('files-count-visible');
        if (totalEl) totalEl.textContent = remainingRows;
        if (visibleEl) visibleEl.textContent = remainingRows;

        if (result.requiresReboot) {
          this.showStatusMessage('File will be deleted on next reboot', 'info');
        }
      } else {
        window.DeadBYTE?.skull?.setState('error');
        this.showStatusMessage(`Delete failed: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Force delete error:', error);
      window.DeadBYTE?.skull?.setState('error');
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }

    this.closeModal('modal-force-delete');
  }

  openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;

    modal.classList.add('open');

    // Special handling for different modals
    if (modalId === 'modal-force-delete') {
      this.populateForceDeleteModal();
      this.startDeleteCountdown();
    } else if (modalId === 'modal-permission-editor') {
      this.populatePermissionEditor();
    } else if (modalId === 'modal-process-locker') {
      this.populateProcessLocker();
    }
  }

  closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
      modal.classList.remove('open');
    }
  }

  // Populate permission editor modal with real ACL data
  async populatePermissionEditor() {
    if (!this.currentSelectedFile?.path) return;

    const filePath = this.currentSelectedFile.path;
    const pathEl = document.getElementById('permission-editor-path');
    const tbody = document.getElementById('permission-editor-tbody');

    if (pathEl) {
      pathEl.textContent = filePath;
    }

    if (!tbody) return;

    // Show loading state
    tbody.innerHTML = '<tr><td colspan="4" class="perm-loading">Loading permissions...</td></tr>';

    if (!window.deadbyte?.permissions) {
      tbody.innerHTML = '<tr><td colspan="4" class="perm-error">Permissions API not available</td></tr>';
      return;
    }

    try {
      const result = await window.deadbyte.permissions.get(filePath);

      if (result.success && result.data) {
        tbody.innerHTML = '';

        const rules = result.data.accessRules || [];

        if (rules.length === 0) {
          tbody.innerHTML = '<tr><td colspan="4" class="perm-empty">No explicit permissions found</td></tr>';
        } else {
          rules.forEach(rule => {
            const row = document.createElement('tr');
            row.className = rule.isInherited ? 'perm-row-inherited' : 'perm-row-explicit';

            // Format rights for display
            const rightsDisplay = this.formatPermissionRights(rule.rights);
            const typeClass = rule.accessType === 'Allow' ? 'perm-type-allow' : 'perm-type-deny';

            row.innerHTML = `
              <td class="perm-identity">${escapeHtml(this.shortenIdentity(rule.identity))}</td>
              <td class="perm-type ${typeClass}">${rule.accessType}</td>
              <td class="perm-rights">${rightsDisplay}</td>
              <td class="perm-inherited">${rule.isInherited ? '<span class="inherited-badge">Inherited</span>' : '<span class="explicit-badge">Explicit</span>'}</td>
            `;
            tbody.appendChild(row);
          });
        }

        // Store for reference
        this.currentPermissions = result.data;

        // Update summary if available
        if (result.data.summary) {
          this.updatePermissionSummary(result.data.summary);
        }
      } else {
        tbody.innerHTML = `<tr><td colspan="4" class="perm-error">Failed to load: ${result.message || 'Unknown error'}</td></tr>`;
      }
    } catch (error) {
      console.error('Failed to load permissions:', error);
      tbody.innerHTML = `<tr><td colspan="4" class="perm-error">Error: ${error.message}</td></tr>`;
    }
  }

  // Format permission rights for display
  formatPermissionRights(rights) {
    if (!rights || rights.length === 0) return '—';

    // Check for full control
    if (rights.includes('FullControl')) {
      return '<span class="right-full">Full Control</span>';
    }

    // Map rights to shorter display names
    const shortNames = {
      'ReadAndExecute': 'R+X',
      'Read': 'R',
      'Write': 'W',
      'Modify': 'M',
      'Delete': 'D',
      'ReadPermissions': 'RP',
      'ChangePermissions': 'CP',
      'TakeOwnership': 'TO',
      'Synchronize': 'Sync',
      'CreateFiles': 'CF',
      'CreateDirectories': 'CD',
      'ListDirectory': 'LD',
      'ReadData': 'RD',
      'WriteData': 'WD',
      'AppendData': 'AD',
      'ExecuteFile': 'X'
    };

    const displayRights = rights.map(r => shortNames[r] || r).join(', ');
    return displayRights;
  }

  // Shorten identity names for display
  shortenIdentity(identity) {
    if (!identity) return 'Unknown';

    // Remove common prefixes
    return identity
      .replace(/^BUILTIN\\/i, '')
      .replace(/^NT AUTHORITY\\/i, '')
      .replace(/^NT SERVICE\\/i, 'SVC\\')
      .replace(/^[A-Z]+-[A-Z0-9]+\\/i, '') // Remove DOMAIN-COMPUTERNAME prefix
      .replace(/APPLICATION PACKAGE AUTHORITY\\/i, 'APP\\');
  }

  // Update permission summary display
  updatePermissionSummary(summary) {
    // Could add a summary section showing canRead, canWrite, canDelete, canExecute
  }

  // Grant full control to current user
  async grantFullControl() {
    if (!this.currentSelectedFile?.path || !window.deadbyte?.permissions) {
      this.showStatusMessage('Cannot modify permissions', 'error');
      return;
    }

    try {
      this.showStatusMessage('Granting full control...', 'info');
      const result = await window.deadbyte.permissions.grantFull(this.currentSelectedFile.path);

      if (result.success) {
        this.showStatusMessage('Full control granted', 'success');
        // Refresh the permission list
        await this.populatePermissionEditor();
        // Refresh details panel
        if (this.currentSelectedFile.row) {
          await this.showDetailsForRow(this.currentSelectedFile.row);
        }
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }
  }

  // Make file readable by current user
  async makeFileReadable() {
    if (!this.currentSelectedFile?.path || !window.deadbyte?.permissions) {
      this.showStatusMessage('Cannot modify permissions', 'error');
      return;
    }

    try {
      this.showStatusMessage('Setting read permissions...', 'info');
      const result = await window.deadbyte.permissions.set(this.currentSelectedFile.path, {
        identity: 'Everyone',
        rights: ['Read', 'ReadAndExecute'],
        accessType: 'Allow'
      });

      if (result.success) {
        this.showStatusMessage('Read permissions granted', 'success');
        await this.populatePermissionEditor();
        if (this.currentSelectedFile.row) {
          await this.showDetailsForRow(this.currentSelectedFile.row);
        }
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }
  }

  // Save permission changes (applies full control for now)
  async savePermissionChanges() {
    await this.grantFullControl();
    this.closeModal('modal-permission-editor');
  }

  // Reset permissions to default (inherited)
  async resetPermissions() {
    if (!this.currentSelectedFile?.path || !window.deadbyte?.permissions) {
      this.showStatusMessage('Cannot reset permissions', 'error');
      return;
    }

    try {
      this.showStatusMessage('Resetting permissions...', 'info');
      const result = await window.deadbyte.permissions.reset(this.currentSelectedFile.path);

      if (result.success) {
        this.showStatusMessage('Permissions reset to inherited defaults', 'success');
        // Refresh the permission list
        await this.populatePermissionEditor();
        // Refresh details panel
        if (this.currentSelectedFile.row) {
          await this.showDetailsForRow(this.currentSelectedFile.row);
        }
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
    }

    this.closeModal('modal-permission-editor');
  }

  // Populate process locker modal
  async populateProcessLocker() {
    if (!this.currentSelectedFile?.path) return;

    const filePath = this.currentSelectedFile.path;
    const fileNameEl = document.getElementById('locker-filename');
    const processList = document.getElementById('locker-process-list');
    const killAllBtn = document.getElementById('btn-kill-all-unlock');
    const warningSection = document.querySelector('.process-warning');

    if (fileNameEl) {
      fileNameEl.textContent = filePath;
    }

    if (!processList || !window.deadbyte?.process) return;

    // Show loading state with spinner
    processList.innerHTML = `
      <div class="process-loading">
        <div class="process-loading-spinner"></div>
        <span>Scanning for locking processes...</span>
      </div>
    `;
    this.showStatusMessage('Scanning for locking processes...', 'info');

    // Disable kill all button during scan
    if (killAllBtn) {
      killAllBtn.disabled = true;
      killAllBtn.textContent = 'Scanning...';
    }

    try {
      const result = await window.deadbyte.process.getLocking(filePath);

      processList.innerHTML = '';

      if (result.success && result.data && result.data.length > 0) {
        const processes = result.data;
        const safeToKillCount = processes.filter(p => p.isKillSafe !== false).length;

        this.showStatusMessage(`Found ${processes.length} process(es) locking ${this.currentSelectedFile.data?.name || 'file'}`, 'info');

        // Store processes for kill all operation
        this.currentLockingProcesses = processes;

        processes.forEach(proc => {
          const memoryMB = proc.memoryUsageMB || (proc.memoryUsage ? Math.round(proc.memoryUsage / (1024 * 1024) * 10) / 10 : 0);
          const processName = proc.processName || (proc.name + '.exe');
          const isCritical = proc.isCriticalSystemProcess === true;
          const canKill = proc.isKillSafe !== false;
          const showWarning = proc.isWarning === true || proc.isProtected === true;
          const description = proc.description || '';

          const item = document.createElement('div');
          item.className = `process-item ${isCritical ? 'process-critical' : ''} ${showWarning ? 'process-warning-item' : ''}`;
          item.dataset.pid = proc.pid;

          item.innerHTML = `
            <div class="process-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"/>
                <line x1="8" y1="21" x2="16" y2="21"/>
                <line x1="12" y1="17" x2="12" y2="21"/>
              </svg>
            </div>
            <div class="process-details">
              <div class="process-name-row">
                <span class="process-name">${escapeHtml(processName)}</span>
                ${isCritical ? '<span class="process-badge process-badge-critical">SYSTEM CRITICAL</span>' : ''}
                ${showWarning && !isCritical ? '<span class="process-badge process-badge-warning">CAUTION</span>' : ''}
              </div>
              <div class="process-meta">
                <span class="process-pid-badge">PID ${proc.pid}</span>
                ${memoryMB > 0 ? `<span class="process-memory">${memoryMB} MB</span>` : ''}
                ${description ? `<span class="process-desc">${escapeHtml(description)}</span>` : ''}
              </div>
            </div>
            <button class="process-kill-btn ${isCritical ? 'process-kill-disabled' : ''}"
                    data-pid="${proc.pid}"
                    ${!canKill ? 'disabled' : ''}
                    title="${isCritical ? 'Cannot kill: System critical process' : (showWarning ? 'Warning: Killing may cause data loss' : 'Terminate this process')}">
              ${isCritical ? 'Protected' : 'Kill Process'}
            </button>
          `;
          processList.appendChild(item);
        });

        // Add click handlers for kill buttons
        processList.querySelectorAll('.process-kill-btn:not([disabled])').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const pid = parseInt(e.target.dataset.pid, 10);
            const processItem = e.target.closest('.process-item');
            e.target.disabled = true;
            e.target.textContent = 'Killing...';

            const killResult = await this.killSingleProcess(pid);

            if (killResult) {
              // Remove from DOM with animation
              if (processItem) {
                processItem.classList.add('process-killed');
                setTimeout(() => processItem.remove(), 300);
              }

              // Re-check if file is now unlocked
              await this.recheckAndShowUnlockStatus();
            } else {
              e.target.disabled = false;
              e.target.textContent = 'Kill Process';
            }
          });
        });

        // Enable/update kill all button
        if (killAllBtn) {
          if (safeToKillCount > 0) {
            killAllBtn.disabled = false;
            killAllBtn.textContent = `Kill All & Unlock (${safeToKillCount})`;
          } else {
            killAllBtn.disabled = true;
            killAllBtn.textContent = 'All Protected';
          }
        }

        // Show warning if any risky processes
        if (warningSection) {
          warningSection.style.display = processes.some(p => p.isWarning || !p.isKillSafe) ? 'flex' : 'none';
        }

      } else {
        // No processes found - check if file is still locked by system
        const lockCheck = window.deadbyte?.fileLock ? await window.deadbyte.fileLock.check(filePath) : null;
        const isKernelLocked = lockCheck?.data?.isLocked && lockCheck?.data?.lockType === 'kernel';

        if (isKernelLocked) {
          processList.innerHTML = `
            <div class="no-processes-message kernel-locked">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <span class="kernel-locked-title">System Kernel Lock</span>
              <span class="kernel-locked-desc">This file is locked by the system kernel. No user process can be terminated to release this lock.</span>
              <span class="kernel-locked-hint">Try "Force Delete with Take Ownership" to bypass this lock.</span>
            </div>
          `;
          this.showStatusMessage('File is locked by system kernel', 'error');
        } else {
          processList.innerHTML = `
            <div class="no-processes-message file-accessible">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
                <circle cx="12" cy="12" r="10"/>
                <path d="M9 12l2 2 4-4"/>
              </svg>
              <span class="accessible-title">File is Accessible</span>
              <span class="accessible-desc">This file is not currently locked by any running process.</span>
            </div>
          `;
          this.showStatusMessage('File is not locked by any process', 'success');
        }

        // Disable kill all button
        if (killAllBtn) {
          killAllBtn.disabled = true;
          killAllBtn.textContent = 'No Processes';
        }

        // Hide warning
        if (warningSection) {
          warningSection.style.display = 'none';
        }
      }
    } catch (error) {
      console.error('Failed to get locking processes:', error);
      processList.innerHTML = `
        <div class="locker-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="24" height="24">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span>Failed to detect locking processes: ${error.message}</span>
        </div>
      `;
      this.showStatusMessage('Failed to scan for processes', 'error');

      if (killAllBtn) {
        killAllBtn.disabled = true;
        killAllBtn.textContent = 'Error';
      }
    }
  }

  // Kill a single process and handle result
  async killSingleProcess(pid) {
    if (!window.deadbyte?.process) {
      this.showStatusMessage('Process API not available', 'error');
      return false;
    }

    try {
      this.showStatusMessage('Terminating process...', 'info');
      const result = await window.deadbyte.process.kill(pid, { force: true });

      if (result.success) {
        this.showStatusMessage(`Process ${pid} terminated successfully`, 'success');
        return true;
      } else {
        this.showStatusMessage(`Failed: ${result.message}`, 'error');
        return false;
      }
    } catch (error) {
      this.showStatusMessage(`Error: ${error.message}`, 'error');
      return false;
    }
  }

  // Re-check file lock status and show unlock success if applicable
  async recheckAndShowUnlockStatus() {
    if (!this.currentSelectedFile?.path) return;

    const processList = document.getElementById('locker-process-list');

    // Show checking status
    if (processList) {
      const checkingDiv = document.createElement('div');
      checkingDiv.className = 'process-rechecking';
      checkingDiv.innerHTML = `
        <div class="process-loading-spinner"></div>
        <span>Re-checking file lock status...</span>
      `;
      processList.insertBefore(checkingDiv, processList.firstChild);
    }

    // Wait a moment for process to fully terminate
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const result = await window.deadbyte.process.getLocking(this.currentSelectedFile.path);

      // Remove checking div
      const checkingDiv = processList?.querySelector('.process-rechecking');
      if (checkingDiv) checkingDiv.remove();

      if (!result.success || !result.data || result.data.length === 0) {
        // File is now unlocked - show success banner
        this.showUnlockSuccessBanner();

        // Update table row status
        this.updateFileStatusInTable('accessible');

        // Hide lock section in details panel
        this.hideLockSection();

        // Auto-close modal after 2 seconds
        setTimeout(() => {
          this.closeModal('modal-process-locker');
        }, 2000);
      } else {
        // Still has locking processes - update the list
        this.currentLockingProcesses = result.data;
      }
    } catch (error) {
      console.error('Failed to recheck file status:', error);
      const checkingDiv = processList?.querySelector('.process-rechecking');
      if (checkingDiv) checkingDiv.remove();
    }
  }

  // Show unlock success banner in modal
  showUnlockSuccessBanner() {
    const processList = document.getElementById('locker-process-list');
    if (!processList) return;

    processList.innerHTML = `
      <div class="unlock-success-banner">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="48" height="48">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        <span class="unlock-success-title">File Unlocked!</span>
        <span class="unlock-success-desc">The file is now unlocked and ready for operations.</span>
      </div>
    `;

    const fileName = this.currentSelectedFile?.data?.name || 'File';
    this.showStatusMessage(`${fileName} is now unlocked`, 'success');

    // Update kill all button
    const killAllBtn = document.getElementById('btn-kill-all-unlock');
    if (killAllBtn) {
      killAllBtn.disabled = true;
      killAllBtn.textContent = 'Unlocked!';
      killAllBtn.classList.add('btn-success');
    }

    // Hide warning
    const warningSection = document.querySelector('.process-warning');
    if (warningSection) {
      warningSection.style.display = 'none';
    }
  }

  // Update file status in the table row
  updateFileStatusInTable(newStatus) {
    if (!this.currentSelectedFile?.row) return;

    const row = this.currentSelectedFile.row;
    row.dataset.status = newStatus;

    // Update status cell - try both possible selectors
    const statusCell = row.querySelector('.col-status .file-status') || row.querySelector('.col-status .status-badge');
    if (statusCell) {
      const statusLabels = {
        'locked': 'LOCKED',
        'restricted': 'RESTRICTED',
        'in_use': 'IN USE',
        'accessible': 'ACCESSIBLE'
      };
      statusCell.className = `file-status file-status-${newStatus}`;
      statusCell.textContent = statusLabels[newStatus] || 'ACCESSIBLE';
    }

    // Update stored file data
    if (row._fileData) {
      row._fileData.status = newStatus;
    }
    this.currentSelectedFile.lockingProcess = null;

    // Update details panel status
    const detailsStatus = document.getElementById('details-status');
    if (detailsStatus) {
      detailsStatus.className = `details-status status-${newStatus}`;
      detailsStatus.textContent = newStatus === 'accessible' ? 'ACCESSIBLE' : newStatus.toUpperCase().replace('_', ' ');
    }
  }

  // Re-check file status after killing processes (legacy - calls new method)
  async recheckFileStatus() {
    // Call the new unified method
    await this.recheckAndShowUnlockStatus();
  }

  startDeleteCountdown() {
    const btn = document.getElementById('btn-confirm-delete');
    if (!btn) return;

    // Clear any existing countdown interval
    if (this.deleteCountdownInterval) {
      clearInterval(this.deleteCountdownInterval);
    }

    btn.disabled = true;
    btn.classList.remove('ready');
    let count = 3;

    // Set initial text immediately
    btn.textContent = `Wait (${count})...`;

    this.deleteCountdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        btn.textContent = `Wait (${count})...`;
      } else {
        clearInterval(this.deleteCountdownInterval);
        this.deleteCountdownInterval = null;
        btn.textContent = 'FORCE DELETE';
        btn.disabled = false;
        btn.classList.add('ready');
      }
    }, 1000);
  }

  // Status bar clock
  initStatusBar() {
    // Start clock
    this.updateClock();
    setInterval(() => this.updateClock(), 1000);

    // Initial status bar update
    this.updateStatusBar();
  }

  updateClock() {
    const clockEl = document.getElementById('status-clock');
    if (clockEl) {
      const now = new Date();
      clockEl.textContent = now.toLocaleTimeString('en-US', { hour12: false });
    }
  }

  updateStatusBar() {
    // Update selected count
    const selectedCountEl = document.getElementById('selected-count');
    if (selectedCountEl) {
      selectedCountEl.textContent = this.selectedFiles.size;
    }

    // Update current drive display
    const driveEl = document.getElementById('status-current-drive');
    if (driveEl) {
      driveEl.textContent = this.currentDrive ? `${this.currentDrive}:` : '—';
    }

    // Update admin status
    this.updateAdminStatus();
  }

  async updateAdminStatus() {
    const adminEl = document.getElementById('status-admin');
    const adminDot = document.querySelector('.status-admin-dot');

    if (!adminEl) return;

    if (window.deadbyte?.system) {
      try {
        const isAdmin = await window.deadbyte.system.isAdmin();
        adminEl.textContent = isAdmin ? 'Admin' : 'User';
        if (adminDot) {
          adminDot.style.background = isAdmin
            ? 'var(--color-status-accessible)'
            : 'var(--color-status-restricted)';
          adminDot.style.boxShadow = isAdmin
            ? '0 0 8px var(--color-status-accessible)'
            : '0 0 8px var(--color-status-restricted)';
        }
      } catch {
        adminEl.textContent = 'Unknown';
      }
    }
  }

  /**
   * Cleanup method to prevent memory leaks
   * Call this when the files module is no longer needed
   */
  destroy() {
    // Clear all stored data
    this.selectedFiles.clear();
    this.selectedFilePaths.clear();

    // Remove context menu from DOM if it exists
    if (this.contextMenu) {
      this.contextMenu.style.display = 'none';
    }

    // Clear DOM references
    this.detailsPanel = null;
    this.fileTableBody = null;
    this.contextMenu = null;
    this.selectAllCheckbox = null;
  }
}


// ============================================
// SPLASH SCREEN CONTROLLER
// ============================================

class SplashScreenController {
  constructor() {
    this.splash = document.getElementById('splash-screen');
    this.skipBtn = document.getElementById('splash-skip');
    this.app = document.getElementById('app');
    this.duration = 2500;
    this.isHiding = false;

    this.init();
  }

  init() {
    // Hard failsafe: force-hide splash after 4 seconds no matter what
    window.setTimeout(() => {
      this.forceHide();
    }, 4000);

    if (!this.splash) {
      console.warn('Splash screen element not found');
      return;
    }

    // Skip button
    if (this.skipBtn) {
      this.skipBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // Auto-hide after duration
    setTimeout(() => {
      this.hide();
    }, this.duration);
  }

  hide() {
    if (this.isHiding || !this.splash) return;
    this.isHiding = true;

    // Step 1: Start opacity transition
    this.splash.style.opacity = '0';
    this.splash.style.pointerEvents = 'none';

    // Step 2: After transition completes (500ms), set display none and remove
    setTimeout(() => {
      if (this.splash) {
        this.splash.style.display = 'none';
        // Remove from DOM completely
        try {
          this.splash.remove();
        } catch (e) {
          // Fallback: just hide it
          this.splash.style.visibility = 'hidden';
        }
      }
    }, 500);
  }

  // Emergency fallback if anything fails
  forceHide() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.opacity = '0';
      splash.style.display = 'none';
      splash.style.visibility = 'hidden';
      splash.style.pointerEvents = 'none';
      try {
        splash.remove();
      } catch (e) {
        // Element might already be removed
      }
    }
  }
}


// ============================================
// ADMIN STATUS CONTROLLER
// ============================================

class AdminStatusController {
  constructor() {
    this.banner = document.getElementById('admin-warning-banner');
    this.dismissBtn = document.getElementById('admin-warning-dismiss');
    this.isAdmin = false;

    this.init();
  }

  async init() {
    // Check if running in Electron with our API
    if (window.deadbyte?.system) {
      try {
        this.isAdmin = await window.deadbyte.system.isAdmin();
        Debug.log('Running as Administrator:', this.isAdmin);

        if (!this.isAdmin) {
          this.showWarning();
        }

        // Listen for admin status updates from main process
        window.deadbyte.system.onAdminStatus((data) => {
          this.isAdmin = data.isAdmin;
          if (!this.isAdmin) {
            this.showWarning();
          } else {
            this.hideWarning();
          }
        });
      } catch (e) {
        console.warn('Could not check admin status:', e);
      }
    } else {
      // Not running in Electron - show info in console
      Debug.log('Not running in Electron environment. Admin status check skipped.');
    }

    // Dismiss button
    this.dismissBtn?.addEventListener('click', () => {
      this.hideWarning();
    });
  }

  showWarning() {
    if (this.banner) {
      this.banner.classList.remove('hidden');
    }
  }

  hideWarning() {
    if (this.banner) {
      this.banner.classList.add('hidden');
    }
  }

  getAdminStatus() {
    return this.isAdmin;
  }
}


// ============================================
// AUTO-UPDATE LISTENER (Standalone Function)
// ============================================

// Store update info globally for modal access
let pendingUpdateInfo = null;

/**
 * Initialize the auto-update available listener
 * This must be called early, before the 5-second auto-check fires from main process
 */
function initAutoUpdateListener(toastManager) {
  if (!window.deadbyte?.updates?.onUpdateAvailable) return;

  window.deadbyte.updates.onUpdateAvailable((updateInfo) => {
    pendingUpdateInfo = updateInfo;
    showAutoUpdateToast(updateInfo, toastManager);
  });
}

/**
 * Show update available toast notification
 */
function showAutoUpdateToast(updateInfo, toastManager) {
  // Create toast container if needed
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container';
    document.body.appendChild(toastContainer);
  }

  const toast = document.createElement('div');
  toast.className = 'toast toast-update';
  toast.innerHTML = `
    <div class="toast-icon">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
    </div>
    <div class="toast-content">
      <div class="toast-title">Update Available</div>
      <div class="toast-message">DeadBYTE v${updateInfo.latestVersion} is ready to download</div>
      <button class="toast-action" data-action="view-update">
        View Update
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <polyline points="9 18 15 12 9 6"/>
        </svg>
      </button>
    </div>
    <button class="toast-close">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  // Handle view update click
  const viewBtn = toast.querySelector('[data-action="view-update"]');
  if (viewBtn) {
    viewBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openUpdateModal(updateInfo);
      toast.classList.add('toast-exiting');
      setTimeout(() => toast.remove(), 300);
    });
  }

  // Handle close click
  const closeBtn = toast.querySelector('.toast-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toast.classList.add('toast-exiting');
      setTimeout(() => toast.remove(), 300);
    });
  }

  toastContainer.appendChild(toast);

  // Auto-remove after 15 seconds
  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('toast-exiting');
      setTimeout(() => toast.remove(), 300);
    }
  }, 15000);
}

/**
 * Open update modal with the given update info
 */
function openUpdateModal(updateInfo) {
  const modal = document.getElementById('modal-update-available');
  if (!modal) return;

  // Store for SettingsController to access
  pendingUpdateInfo = updateInfo;

  // Populate modal content
  const currentVersionEl = document.getElementById('update-current-version');
  const latestVersionEl = document.getElementById('update-latest-version');
  const releaseDateEl = document.getElementById('update-release-date');
  const notesEl = document.getElementById('update-release-notes');

  if (currentVersionEl) currentVersionEl.textContent = `v${updateInfo.currentVersion}`;
  if (latestVersionEl) latestVersionEl.textContent = `v${updateInfo.latestVersion}`;
  if (releaseDateEl) releaseDateEl.textContent = updateInfo.publishedAt || 'Unknown';

  if (notesEl) {
    // Convert markdown-style formatting to basic HTML
    let notes = updateInfo.releaseNotes || 'No release notes available.';
    notes = notes
      .replace(/^### (.+)$/gm, '<h5>$1</h5>')
      .replace(/^## (.+)$/gm, '<h4>$1</h4>')
      .replace(/^# (.+)$/gm, '<h3>$1</h3>')
      .replace(/^\* (.+)$/gm, '<li>$1</li>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');

    // Wrap list items in ul
    if (notes.includes('<li>')) {
      notes = notes.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');
    }

    notesEl.innerHTML = `<p>${notes}</p>`;
  }

  // Reset modal to info state
  resetUpdateModalState();

  // Show modal
  modal.classList.add('open');

  // Ensure SettingsController has access to this update info when it initializes
  if (window.DeadBYTE?.settings) {
    window.DeadBYTE.settings.updateInfo = updateInfo;
    window.DeadBYTE.settings.releaseUrl = updateInfo.releaseUrl;
  }
}

/**
 * Reset update modal to info state
 */
function resetUpdateModalState() {
  const footerInfo = document.getElementById('update-footer-info');
  const footerDownloading = document.getElementById('update-footer-downloading');
  const footerReady = document.getElementById('update-footer-ready');
  const footerError = document.getElementById('update-footer-error');
  const downloadSection = document.getElementById('update-download-section');

  footerInfo?.classList.remove('hidden');
  footerDownloading?.classList.add('hidden');
  footerReady?.classList.add('hidden');
  footerError?.classList.add('hidden');
  downloadSection?.classList.add('hidden');
  downloadSection?.classList.remove('complete', 'error');
}

// ============================================
// APPLICATION INITIALIZATION
// ============================================

// Lazy-loaded controller instances (initialized on first module visit)
const LazyControllers = {
  _instances: {},
  _initialized: new Set(),

  // Get or create a controller instance
  get(name, ControllerClass) {
    if (!this._instances[name]) {
      Debug.log(`Lazy-initializing: ${name}`);
      this._instances[name] = new ControllerClass();
      this._initialized.add(name);
    }
    return this._instances[name];
  },

  // Check if controller is initialized
  isInitialized(name) {
    return this._initialized.has(name);
  }
};

document.addEventListener('DOMContentLoaded', () => {
  Debug.log('DeadBYTE Initializing...');

  // Inject additional animations
  injectAnimations();

  // ==========================================
  // ESSENTIAL CONTROLLERS (initialize immediately)
  // These are needed for basic app functionality
  // ==========================================
  const skullController = new SkullController();
  const navController = new NavigationController(skullController);
  const titleBarController = new TitleBarController();
  const typewriterTitleController = new TypewriterTitleController();
  const buttonController = new ButtonController(skullController);
  const modalController = new ModalController();
  const keyboardController = new KeyboardController(navController);
  const toastManager = new ToastManager();
  const splashController = new SplashScreenController();
  const adminStatusController = new AdminStatusController();
  const modeCardController = new ModeCardController();
  const toggleSwitchController = new ToggleSwitchController();

  // ==========================================
  // HOME PAGE CONTROLLERS (initialize immediately)
  // Home is the default page, needs to be ready
  // ==========================================
  const homeDashboard = new HomeDashboard();

  // ==========================================
  // AUTO-UPDATE LISTENER (initialize immediately)
  // Must be ready before the 5-second auto-check fires
  // ==========================================
  initAutoUpdateListener(toastManager);

  // ==========================================
  // DEFERRED CONTROLLERS (lazy-init on module visit)
  // These are only initialized when their page is accessed
  // ==========================================

  // Listen for module changes to lazy-init controllers
  const initModuleControllers = (moduleName) => {
    switch (moduleName) {
      case 'files':
        LazyControllers.get('filesModuleController', FilesModuleController);
        break;
      case 'performance':
        LazyControllers.get('systemMonitor', SystemMonitor);
        LazyControllers.get('startupManager', StartupManager);
        LazyControllers.get('servicesManager', ServicesManager);
        LazyControllers.get('performanceOptimizer', PerformanceOptimizer);
        break;
      case 'analyzer':
        LazyControllers.get('junkScanner', JunkScanner);
        break;
      case 'maintenance':
        LazyControllers.get('maintenanceTools', MaintenanceTools);
        break;
      case 'settings':
        LazyControllers.get('settingsController', SettingsController);
        LazyControllers.get('settingsManager', SettingsManager);
        break;
    }
  };

  // Track current module for cleanup
  let currentModule = null;

  // Hook into navigation to lazy-init modules and cleanup on leave
  const originalNavigateTo = navController.navigateTo?.bind(navController);
  if (originalNavigateTo) {
    navController.navigateTo = (moduleName) => {
      // Cleanup previous module
      if (currentModule === 'performance' && moduleName !== 'performance') {
        // Stop SystemMonitor when leaving performance page
        const monitor = LazyControllers._instances['systemMonitor'];
        if (monitor) {
          monitor.stop();
          Debug.log('SystemMonitor stopped (left performance page)');
        }
      }

      // Initialize new module
      initModuleControllers(moduleName);

      // Start SystemMonitor when entering performance page
      if (moduleName === 'performance') {
        const monitor = LazyControllers._instances['systemMonitor'];
        if (monitor && !monitor.isRunning) {
          monitor.start();
          Debug.log('SystemMonitor started (entered performance page)');
        }
      }

      currentModule = moduleName;
      return originalNavigateTo(moduleName);
    };
  }

  // Also listen for hash changes
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.replace('#', '');
    if (hash) initModuleControllers(hash);
  });

  // Check initial hash
  const initialHash = window.location.hash.replace('#', '');
  if (initialHash) {
    initModuleControllers(initialHash);
  }

  // Expose to window for debugging (with lazy getters)
  window.DeadBYTE = {
    skull: skullController,
    nav: navController,
    modal: modalController,
    homeDashboard: homeDashboard,
    toast: toastManager,
    modes: modeCardController,
    splash: splashController,
    admin: adminStatusController,
    // Lazy getters for deferred controllers
    get systemMonitor() { return LazyControllers.get('systemMonitor', SystemMonitor); },
    get startupManager() { return LazyControllers.get('startupManager', StartupManager); },
    get servicesManager() { return LazyControllers.get('servicesManager', ServicesManager); },
    get junkScanner() { return LazyControllers.get('junkScanner', JunkScanner); },
    get maintenanceTools() { return LazyControllers.get('maintenanceTools', MaintenanceTools); },
    get files() { return LazyControllers.get('filesModuleController', FilesModuleController); },
    get settings() { return LazyControllers.get('settingsController', SettingsController); },
    get settingsManager() { return LazyControllers.get('settingsManager', SettingsManager); },
  };

  Debug.log('DeadBYTE Ready.');
});


// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format bytes to human readable string
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text || '';
  return div.innerHTML;
}

// ============================================
// STANDALONE SPLASH FAILSAFE
// This runs independently of everything else
// ============================================
(function() {
  'use strict';

  function killSplash() {
    var splash = document.getElementById('splash-screen');
    if (splash) {
      splash.style.cssText = 'display:none!important;opacity:0!important;visibility:hidden!important;pointer-events:none!important;';
      if (splash.parentNode) {
        splash.parentNode.removeChild(splash);
      }
    }
  }

  // Failsafe 1: After 3 seconds
  setTimeout(killSplash, 3000);

  // Failsafe 2: After 4 seconds (backup)
  setTimeout(killSplash, 4000);

  // Failsafe 3: On any click after 1 second
  setTimeout(function() {
    document.addEventListener('click', killSplash, { once: true });
  }, 1000);

  // Skip button direct handler
  document.addEventListener('DOMContentLoaded', function() {
    var skipBtn = document.getElementById('splash-skip');
    if (skipBtn) {
      skipBtn.onclick = function(e) {
        e.preventDefault();
        e.stopPropagation();
        killSplash();
        return false;
      };
    }
  });
})();
