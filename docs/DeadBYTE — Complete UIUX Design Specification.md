 DeadBYTE — Complete UI/UX Design Specification

  Design Philosophy

  "Digital Necromancy for System Control"

  DeadBYTE isn't a utility—it's a visual experience. Every pixel serves the illusion that you've
  summoned something powerful, something that exists between your system and the void. The skull
  isn't decoration; it's the soul of the application.

  ---
  Part 1: The Skull — Central Visual System

  1.1 Skull Anatomy & Construction

                           SKULL CONSTRUCTION GUIDE
      ═══════════════════════════════════════════════════════════════

                                ┌─────────┐
                             ╭──┤ CRANIUM ├──╮
                            ╱   └────┬────┘   ╲
                           ╱        │          ╲
                      ┌───────┐    │     ┌───────┐
                      │ LEFT  │    │     │ RIGHT │
                      │  EYE  │    │     │  EYE  │
                      │SOCKET │    │     │SOCKET │
                      └───┬───┘    │     └───┬───┘
                          │        │         │
                          └────┬───┴───┬─────┘
                               │ NASAL │
                               │CAVITY │
                               └───┬───┘
                                   │
                           ┌───────┴───────┐
                           │   UPPER JAW   │
                           │ ▼ ▼ ▼ ▼ ▼ ▼ ▼ │  ← Upper teeth (7-8)
                           └───────────────┘
                           ┌───────────────┐
                           │ ▲ ▲ ▲ ▲ ▲ ▲ ▲ │  ← Lower teeth (7-8)
                           │   LOWER JAW   │
                           │  (MANDIBLE)   │
                           └───────────────┘
                                  │
                           ╭──────┴──────╮
                          ╱               ╲
                     BONE LEFT         BONE RIGHT
                     (Crossed)         (Crossed)

      ═══════════════════════════════════════════════════════════════

  1.2 Skull Visual Specifications

      ┌─────────────────────────────────────────────────────────────┐
      │                    SKULL LAYER STRUCTURE                    │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │   LAYER 5 (TOP)     Post-processing effects                │
      │                     • Bloom / glow spread                   │
      │                     • Scanline overlay                      │
      │                     • Chromatic aberration (subtle)         │
      │                                                             │
      │   LAYER 4           Dynamic light sources                   │
      │                     • Eye glow emissions                    │
      │                     • Pulse rings                           │
      │                     • Flash effects                         │
      │                                                             │
      │   LAYER 3           Skull primary mesh                      │
      │                     • White fill (#FFFFFF)                  │
      │                     • Edge highlighting                     │
      │                     • Shadow zones (10-15% opacity black)   │
      │                                                             │
      │   LAYER 2           Crossbones                              │
      │                     • Behind skull                          │
      │                     • Independent rotation                  │
      │                     • Same white color                      │
      │                                                             │
      │   LAYER 1 (BOTTOM)  Background effects                      │
      │                     • Radial gradient                       │
      │                     • Particle field                        │
      │                     • Grid lines (optional)                 │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  1.3 Skull Dimensions & Positioning

      ┌─────────────────────────────────────────────────────────────┐
      │                                                             │
      │                    APPLICATION WINDOW                       │
      │         ┌─────────────────────────────────────┐             │
      │         │                                     │             │
      │         │      ┌───────────────────┐          │             │
      │         │      │                   │          │             │
      │         │      │                   │          │             │
      │         │      │      SKULL        │  ←─── 40-50% of        │
      │         │      │      ZONE         │        content area    │
      │         │      │                   │        height          │
      │         │      │                   │                        │
      │         │      └───────────────────┘                        │
      │         │              ↑                                    │
      │         │         Centered                                  │
      │         │         horizontally                              │
      │         │                                                   │
      │         │      ┌───────────────────┐                        │
      │         │      │   STATUS TEXT     │                        │
      │         │      │   ACTION BUTTONS  │                        │
      │         │      └───────────────────┘                        │
      │         │                                                   │
      │         └─────────────────────────────────────┘             │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

      Skull Size:
      • Minimum: 200 × 200 px
      • Recommended: 300 × 300 px
      • Maximum: 400 × 400 px (scales with window)

      Crossbones extend 20-30% beyond skull width on each side

  ---
  Part 2: Skull Animation States

  2.1 State Machine Diagram

      ┌─────────────────────────────────────────────────────────────┐
      │                 SKULL STATE MACHINE                         │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │                        ┌──────────┐                         │
      │            ┌──────────▶│   IDLE   │◀──────────┐            │
      │            │           └────┬─────┘           │            │
      │            │                │                  │            │
      │       [complete]       [action]           [timeout]        │
      │            │                │                  │            │
      │            │                ▼                  │            │
      │     ┌──────┴─────┐    ┌──────────┐    ┌──────┴─────┐      │
      │     │  SUCCESS   │    │ WORKING  │    │   ALERT    │      │
      │     │            │    │          │    │            │      │
      │     └────────────┘    └────┬─────┘    └────────────┘      │
      │                            │                               │
      │                   ┌────────┼────────┐                      │
      │                   │        │        │                      │
      │                   ▼        ▼        ▼                      │
      │            ┌─────────┐ ┌──────┐ ┌─────────┐               │
      │            │SCANNING │ │DELETE│ │CLEANING │               │
      │            └─────────┘ └──────┘ └─────────┘               │
      │                   │        │        │                      │
      │                   └────────┼────────┘                      │
      │                            │                               │
      │                   [error]  │  [success]                    │
      │                      │     │     │                         │
      │                      ▼     │     ▼                         │
      │               ┌──────────┐ │ ┌──────────┐                  │
      │               │  ERROR   │ │ │ SUCCESS  │                  │
      │               └──────────┘ │ └──────────┘                  │
      │                            │                               │
      │                            ▼                               │
      │                     [return to IDLE]                       │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  2.2 Detailed Animation Specifications

  IDLE STATE

      ┌─────────────────────────────────────────────────────────────┐
      │  STATE: IDLE                                                │
      │  Duration: Infinite loop                                    │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  BREATHING MOTION                                           │
      │  ─────────────────                                          │
      │  • Skull scale oscillates: 1.0 → 1.02 → 1.0                │
      │  • Duration: 4 seconds per cycle                            │
      │  • Easing: ease-in-out-sine                                │
      │                                                             │
      │  Keyframes:                                                 │
      │    0%   → scale(1.00)  opacity(1.0)                        │
      │    50%  → scale(1.02)  opacity(1.0)                        │
      │    100% → scale(1.00)  opacity(1.0)                        │
      │                                                             │
      │  EYE GLOW                                                   │
      │  ────────                                                   │
      │  • Base intensity: 40%                                      │
      │  • Pulse: 40% → 60% → 40%                                  │
      │  • Duration: 3 seconds (offset from breathing)              │
      │  • Color: #FFFFFF with 20px blur radius                    │
      │                                                             │
      │  CROSSBONES                                                 │
      │  ──────────                                                 │
      │  • Slow rotation: 0° → 5° → 0° → -5° → 0°                  │
      │  • Duration: 8 seconds full cycle                          │
      │  • Easing: ease-in-out-quad                                │
      │                                                             │
      │  AMBIENT PARTICLES                                          │
      │  ─────────────────                                          │
      │  • 10-15 small white dots                                  │
      │  • Float upward slowly                                      │
      │  • Fade in at bottom, fade out at top                      │
      │  • Speed: 20-40px per second                               │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  SCANNING STATE

      ┌─────────────────────────────────────────────────────────────┐
      │  STATE: SCANNING                                            │
      │  Duration: Until scan complete                              │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  EYE BEHAVIOR                                               │
      │  ────────────                                               │
      │  • Glow intensifies: 60% → 100%                            │
      │  • Rapid pulse: 0.5 second cycle                           │
      │  • Add concentric rings expanding from eyes                │
      │                                                             │
      │  Ring animation:                                            │
      │    ╭───╮                                                    │
      │   ╱ ╭─╮ ╲    Rings expand outward from eye center          │
      │  │ ╱   ╲ │   3 rings, staggered 0.3s apart                 │
      │  │ │ ◉ │ │   Each ring: scale 0 → 3, opacity 1 → 0        │
      │   ╲ ╰─╯ ╱    Duration: 1.5 seconds                         │
      │    ╰───╯                                                    │
      │                                                             │
      │  CROSSBONES                                                 │
      │  ──────────                                                 │
      │  • Continuous rotation: 360° per 4 seconds                 │
      │  • Direction: clockwise                                     │
      │                                                             │
      │  SCAN LINE EFFECT                                           │
      │  ─────────────────                                          │
      │  • Horizontal white line sweeps top to bottom              │
      │  • Line height: 2px                                        │
      │  • Glow spread: 10px                                       │
      │  • Speed: 2 seconds per sweep                              │
      │  • Opacity: 80%                                            │
      │                                                             │
      │     ════════════════════════════  ← scan line              │
      │         ┌─────────────┐                                     │
      │         │      💀      │                                    │
      │         └─────────────┘                                     │
      │                                                             │
      │  DATA STREAM PARTICLES                                      │
      │  ─────────────────────                                      │
      │  • Small rectangles (2×6 px) flow toward skull             │
      │  • Originate from screen edges                             │
      │  • 30-50 particles active                                  │
      │  • Speed: 100-200px per second                             │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  DELETING STATE

      ┌─────────────────────────────────────────────────────────────┐
      │  STATE: DELETING                                            │
      │  Duration: Per-file, with micro-animations                  │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  JAW ANIMATION (Critical Feature)                           │
      │  ─────────────────────────────────                          │
      │                                                             │
      │  Open position:         Closed position:                    │
      │       ▼ ▼ ▼ ▼                ▼ ▼ ▼ ▼                       │
      │    ┌─────────┐            ┌─────────┐                       │
      │    │         │            │▲ ▲ ▲ ▲ ▲│  ← teeth mesh        │
      │    │         │  10px gap  └─────────┘                       │
      │    │         │                                              │
      │    │▲ ▲ ▲ ▲ ▲│                                              │
      │    └─────────┘                                              │
      │                                                             │
      │  Animation:                                                 │
      │    • Jaw opens 10px, closes sharply                        │
      │    • Duration: 0.3s open, 0.1s close (snap)                │
      │    • Repeat per deleted item                                │
      │    • Easing: ease-out for open, ease-in for close          │
      │                                                             │
      │  TEETH GRINDING (Bulk delete)                               │
      │  ─────────────────────────────                              │
      │    • Horizontal jaw oscillation: -3px → +3px               │
      │    • Duration: 0.2s per cycle                              │
      │    • Creates "chewing" effect                               │
      │                                                             │
      │  FLASH EFFECT                                               │
      │  ────────────                                               │
      │    • Brief white flash on each deletion                    │
      │    • Overlay opacity: 0 → 30% → 0                          │
      │    • Duration: 0.15 seconds                                │
      │                                                             │
      │  PARTICLE BURST                                             │
      │  ──────────────                                             │
      │    • On each delete: 5-8 particles explode from mouth      │
      │    • Direction: downward cone (60° spread)                 │
      │    • Particles are small file icons or squares             │
      │    • Fade to nothing over 0.5 seconds                      │
      │                                                             │
      │         💀                                                  │
      │        /│\                                                  │
      │       / │ \    ← particle burst direction                  │
      │      ▪  ▪  ▪                                                │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ERROR STATE

      ┌─────────────────────────────────────────────────────────────┐
      │  STATE: ERROR                                               │
      │  Duration: 2-3 seconds, then return to idle                 │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  GLITCH EFFECT                                              │
      │  ────────────                                               │
      │                                                             │
      │  Frame 1:        Frame 2:        Frame 3:                   │
      │    ┌────┐         ┌────┐          ┌────┐                    │
      │    │ 💀 │    →    │💀  │    →     │  💀│                    │
      │    └────┘         └────┘          └────┘                    │
      │                                                             │
      │  • Horizontal displacement: random -10px to +10px          │
      │  • Duration: 0.05s per frame                               │
      │  • 5-10 rapid frames                                       │
      │  • RGB split effect (optional): offset R/G/B channels      │
      │                                                             │
      │  COLOR SHIFT                                                │
      │  ───────────                                                │
      │  • Momentary red tint on skull edges                       │
      │  • Color: #FF3333 at 30% opacity                           │
      │  • Fade back to white over 1 second                        │
      │                                                             │
      │  EYE FLICKER                                                │
      │  ───────────                                                │
      │  • Rapid on/off: 100% → 0% → 100%                          │
      │  • 3-4 flickers over 0.5 seconds                           │
      │                                                             │
      │  SHAKE                                                      │
      │  ─────                                                      │
      │  • Whole skull shakes                                      │
      │  • Amplitude: 5px                                          │
      │  • Frequency: 30Hz                                         │
      │  • Duration: 0.3 seconds                                   │
      │  • Decay: amplitude reduces over time                      │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  SUCCESS STATE

      ┌─────────────────────────────────────────────────────────────┐
      │  STATE: SUCCESS                                             │
      │  Duration: 2 seconds, then return to idle                   │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  SATISFIED EXPRESSION                                       │
      │  ────────────────────                                       │
      │                                                             │
      │  Normal:              Success:                              │
      │    ◉    ◉               ◠    ◠    ← eyes "close" happily   │
      │      ▽                    ▽                                 │
      │   ▼▼▼▼▼▼▼             ▼▼▼▼▼▼▼                              │
      │   ▲▲▲▲▲▲▲             ╲▲▲▲▲▲╱    ← slight smile curve      │
      │                                                             │
      │  • Eye shape changes to "happy" arcs                       │
      │  • Jaw has slight upward curve                             │
      │  • Duration: hold for 1.5 seconds                          │
      │                                                             │
      │  GLOW BURST                                                 │
      │  ──────────                                                 │
      │  • Expanding ring of light from skull center               │
      │  • Color: pure white                                       │
      │  • Scale: 1 → 3                                            │
      │  • Opacity: 60% → 0%                                       │
      │  • Duration: 0.8 seconds                                   │
      │                                                             │
      │       ╭─────────╮                                           │
      │      ╱  ╭───╮    ╲                                          │
      │     │  ╱ 💀  ╲    │    ← expanding glow ring               │
      │      ╲  ╰───╯    ╱                                          │
      │       ╰─────────╯                                           │
      │                                                             │
      │  CROSSBONES                                                 │
      │  ──────────                                                 │
      │  • Brief scale up: 1.0 → 1.1 → 1.0                         │
      │  • "Proud" pose                                            │
      │  • Duration: 0.5 seconds                                   │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 3: Application Layout Architecture

  3.1 Main Window Structure

      ┌─────────────────────────────────────────────────────────────────────────┐
      │ ─ □ ×  │                    DeadBYTE                                    │
      ├────────┴────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  ┌─────────┐  ┌───────────────────────────────────────────────────────┐│
      │  │         │  │                                                       ││
      │  │   N     │  │                                                       ││
      │  │   A     │  │                                                       ││
      │  │   V     │  │                    MAIN CONTENT                       ││
      │  │         │  │                       AREA                            ││
      │  │   B     │  │                                                       ││
      │  │   A     │  │              (Skull + Module Content)                 ││
      │  │   R     │  │                                                       ││
      │  │         │  │                                                       ││
      │  │  72px   │  │                                                       ││
      │  │  width  │  │                                                       ││
      │  │         │  │                                                       ││
      │  ├─────────┤  │                                                       ││
      │  │SETTINGS │  │                                                       ││
      │  │  ICON   │  │                                                       ││
      │  └─────────┘  └───────────────────────────────────────────────────────┘│
      │                                                                         │
      │  ┌─────────────────────────────────────────────────────────────────────┐│
      │  │                         STATUS BAR                                  ││
      │  │   System Status: Healthy  │  Last Scan: 2 hours ago  │  v1.0.0     ││
      │  └─────────────────────────────────────────────────────────────────────┘│
      └─────────────────────────────────────────────────────────────────────────┘

      Dimensions:
      • Minimum window: 1024 × 768 px
      • Recommended: 1280 × 800 px
      • Nav bar: 72px fixed width
      • Status bar: 32px fixed height
      • Title bar: 40px (custom styled)

  3.2 Navigation Bar Detail

      ┌─────────────────────────────────────────────────────────────┐
      │               NAVIGATION BAR SPECIFICATION                  │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │     ┌──────────┐                                            │
      │     │          │                                            │
      │     │    💀    │  ← Mini skull logo (32×32)                │
      │     │          │    Click → return to home                 │
      │     │          │                                            │
      │     └──────────┘                                            │
      │     ════════════  ← Divider line                           │
      │     ┌──────────┐                                            │
      │     │   ⚡     │  ← Force Delete icon                      │
      │     │  Delete  │    Hover: glow effect                     │
      │     └──────────┘    Active: white background               │
      │     ┌──────────┐                                            │
      │     │   🔍     │  ← Analyzer icon                          │
      │     │ Analyzer │                                            │
      │     └──────────┘                                            │
      │     ┌──────────┐                                            │
      │     │   🛡️     │  ← Security icon                          │
      │     │ Security │                                            │
      │     └──────────┘                                            │
      │     ┌──────────┐                                            │
      │     │   🚀     │  ← Performance icon                       │
      │     │ Optimize │                                            │
      │     └──────────┘                                            │
      │     ┌──────────┐                                            │
      │     │   🔧     │  ← Maintenance icon                       │
      │     │  Maint.  │                                            │
      │     └──────────┘                                            │
      │     ════════════                                            │
      │          ↓                                                  │
      │     [Spacer grows]                                          │
      │          ↓                                                  │
      │     ┌──────────┐                                            │
      │     │   ⚙️     │  ← Settings (bottom-anchored)             │
      │     └──────────┘                                            │
      │                                                             │
      │  HOVER STATE:                                               │
      │  • Icon glows white                                         │
      │  • Tooltip appears to the right                             │
      │  • Background: rgba(255,255,255,0.05)                      │
      │                                                             │
      │  ACTIVE STATE:                                              │
      │  • Left border: 3px solid white                            │
      │  • Background: rgba(255,255,255,0.1)                       │
      │  • Icon: full brightness                                   │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  3.3 Custom Title Bar

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                         TITLE BAR DESIGN                                │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐  │
      │  │ 💀 DeadBYTE                                          ─  □  ×     │  │
      │  └───────────────────────────────────────────────────────────────────┘  │
      │                                                                         │
      │  Layout:                                                                │
      │  ├─ 12px padding ─┤                                                    │
      │  │                │                                                    │
      │  [Icon 20×20] [Title Text]           [Minimize] [Maximize] [Close]     │
      │                                                                         │
      │  Colors:                                                                │
      │  • Background: #0D0D0D (slightly lighter than main)                    │
      │  • Title text: #FFFFFF at 90% opacity                                  │
      │  • Font: system font, 13px, weight 500                                 │
      │                                                                         │
      │  Window Controls:                                                       │
      │  ┌─────┬─────┬─────┐                                                   │
      │  │  ─  │  □  │  ×  │                                                   │
      │  └─────┴─────┴─────┘                                                   │
      │    46px  46px  46px                                                    │
      │                                                                         │
      │  Hover states:                                                          │
      │  • Minimize: background #333333                                        │
      │  • Maximize: background #333333                                        │
      │  • Close: background #E81123 (Windows red)                             │
      │                                                                         │
      │  Draggable area: entire title bar except controls                      │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  ---
  Part 4: Home Screen Design

  4.1 Home Screen Layout

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                           HOME SCREEN                                   │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │      ┌─────────────────────────────────────────────────────────────┐   │
      │      │                                                             │   │
      │      │                                                             │   │
      │      │                    ╭─────────────────╮                      │   │
      │      │                   ╱                   ╲                     │   │
      │      │                  ╱   ◉           ◉    ╲                    │   │
      │      │                 │          ▽           │                    │   │
      │      │            ═════│     ▼▼▼▼▼▼▼▼▼▼      │═════               │   │
      │      │           ╱     │     ▲▲▲▲▲▲▲▲▲▲      │     ╲              │   │
      │      │          ╱       ╲                   ╱       ╲             │   │
      │      │         ══════════ ╲               ╱ ══════════            │   │
      │      │                     ╰─────────────╯                        │   │
      │      │                                                             │   │
      │      │                       SKULL ZONE                            │   │
      │      │                   (animated, reactive)                      │   │
      │      │                                                             │   │
      │      └─────────────────────────────────────────────────────────────┘   │
      │                                                                         │
      │      ┌─────────────────────────────────────────────────────────────┐   │
      │      │                                                             │   │
      │      │                 SYSTEM HEALTHY                              │   │
      │      │            Last optimized: 2 days ago                       │   │
      │      │                                                             │   │
      │      └─────────────────────────────────────────────────────────────┘   │
      │                                                                         │
      │      ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐         │
      │      │   QUICK   │ │   QUICK   │ │   QUICK   │ │   FULL    │         │
      │      │   SCAN    │ │   CLEAN   │ │  OPTIMIZE │ │   SCAN    │         │
      │      └───────────┘ └───────────┘ └───────────┘ └───────────┘         │
      │                                                                         │
      │      ┌─────────────────────────────────────────────────────────────┐   │
      │      │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐       │   │
      │      │  │ 2.3 GB  │  │ 0       │  │ 98%     │  │ Good    │       │   │
      │      │  │ Junk    │  │ Threats │  │ Health  │  │ Startup │       │   │
      │      │  └─────────┘  └─────────┘  └─────────┘  └─────────┘       │   │
      │      │                  QUICK STATS                               │   │
      │      └─────────────────────────────────────────────────────────────┘   │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  4.2 Quick Action Buttons

      ┌─────────────────────────────────────────────────────────────┐
      │               QUICK ACTION BUTTON DESIGN                    │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  NORMAL STATE:                                              │
      │  ┌─────────────────────────────┐                           │
      │  │                             │                           │
      │  │      ⚡                     │  Background: #1A1A1A      │
      │  │                             │  Border: 1px #333333      │
      │  │    QUICK SCAN               │  Icon: 24×24, white       │
      │  │                             │  Text: 14px, white 80%    │
      │  │                             │                           │
      │  └─────────────────────────────┘                           │
      │   Size: 140×80 px                                          │
      │   Border-radius: 8px                                       │
      │                                                             │
      │  HOVER STATE:                                               │
      │  ┌─────────────────────────────┐                           │
      │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Background: #252525      │
      │  │░░░░░░⚡░░░░░░░░░░░░░░░░░░░░░│  Border: 1px #FFFFFF 30%  │
      │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Glow: 0 0 20px white 10% │
      │  │░░░░QUICK SCAN░░░░░░░░░░░░░░░│  Transform: scale(1.02)   │
      │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│  Transition: 0.2s ease    │
      │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│                           │
      │  └─────────────────────────────┘                           │
      │                                                             │
      │  ACTIVE/PRESSED STATE:                                      │
      │  ┌─────────────────────────────┐                           │
      │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  Background: #333333      │
      │  │▓▓▓▓▓▓⚡▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│  Transform: scale(0.98)   │
      │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                           │
      │  │▓▓▓▓QUICK SCAN▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                           │
      │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                           │
      │  │▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓│                           │
      │  └─────────────────────────────┘                           │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 5: Module-Specific UI Designs

  5.1 Force Delete Module

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                      FORCE DELETE MODULE                                │
      │                    Visual Theme: AGGRESSIVE                             │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  Color Accent: #FF3366 (Danger Red)                                    │
      │  Skull Behavior: Teeth clenched, intense eye glow                      │
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │  ┌─────────────────────────────────────────────────────────────┐ │ │
      │  │  │ 📁 DROP FILES OR FOLDERS HERE                               │ │ │
      │  │  │                                                             │ │ │
      │  │  │              ┌─────────────────┐                            │ │ │
      │  │  │              │                 │                            │ │ │
      │  │  │              │   + + + + + +   │  Drop zone                 │ │ │
      │  │  │              │   + + 💀 + +   │  Dashed border              │ │ │
      │  │  │              │   + + + + + +   │  Animated dash             │ │ │
      │  │  │              │                 │                            │ │ │
      │  │  │              └─────────────────┘                            │ │ │
      │  │  │                                                             │ │ │
      │  │  │  Or click to browse                                         │ │ │
      │  │  └─────────────────────────────────────────────────────────────┘ │ │
      │  │                                                                   │ │
      │  │  LOCKED FILES DETECTED:                                          │ │
      │  │  ┌─────────────────────────────────────────────────────────────┐ │ │
      │  │  │ ⚠️ C:\Windows\Temp\locked_file.tmp                          │ │ │
      │  │  │   Locked by: explorer.exe (PID: 1234)                       │ │ │
      │  │  │   [UNLOCK] [FORCE DELETE] [SKIP]                            │ │ │
      │  │  ├─────────────────────────────────────────────────────────────┤ │ │
      │  │  │ 🔒 D:\Data\corrupted_folder                                  │ │ │
      │  │  │   Status: Permission denied                                  │ │ │
      │  │  │   [TAKE OWNERSHIP] [FORCE DELETE] [SKIP]                    │ │ │
      │  │  └─────────────────────────────────────────────────────────────┘ │ │
      │  │                                                                   │ │
      │  │  ┌──────────────────────────────────────────────────────────┐    │ │
      │  │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    │ │
      │  │  │          ⚠️  OBLITERATE ALL  ⚠️                         │    │ │
      │  │  │░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░│    │ │
      │  │  └──────────────────────────────────────────────────────────┘    │ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      │  WARNING MODAL (on confirm):                                            │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │                    ⚠️ PERMANENT DELETION                         │ │
      │  │                                                                   │ │
      │  │     This action CANNOT be undone.                                │ │
      │  │     Files will be permanently destroyed.                         │ │
      │  │                                                                   │ │
      │  │     Items to delete: 2                                           │ │
      │  │     Total size: 1.2 GB                                           │ │
      │  │                                                                   │ │
      │  │     Type "DELETE" to confirm:                                    │ │
      │  │     ┌─────────────────────────────────┐                          │ │
      │  │     │                                 │                          │ │
      │  │     └─────────────────────────────────┘                          │ │
      │  │                                                                   │ │
      │  │          [CANCEL]              [EXECUTE]                         │ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  5.2 Analyzer Module

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                       ANALYZER MODULE                                   │
      │                    Visual Theme: ANALYTICAL                             │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  Color Accent: #00AAFF (Electric Blue)                                 │
      │  Skull Behavior: Scanning eyes, data particles flowing                  │
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │  SCAN RESULTS                        SPACE ANALYSIS               │ │
      │  │  ┌────────────────────────┐         ┌────────────────────────┐   │ │
      │  │  │                        │         │                        │   │ │
      │  │  │   ████████░░░░  65%   │         │    ┌────────────┐      │   │ │
      │  │  │   Scanning...          │         │   ╱ ████ 40%   ╲     │   │ │
      │  │  │                        │         │  │  ░░░░ 25%    │     │   │ │
      │  │  │   Files: 12,453        │         │  │  ▓▓▓▓ 20%    │     │   │ │
      │  │  │   Found: 2.3 GB        │         │   ╲ ▒▒▒▒ 15%   ╱     │   │ │
      │  │  │                        │         │    └────────────┘      │   │ │
      │  │  └────────────────────────┘         │                        │   │ │
      │  │                                      │   ■ System Cache       │   │ │
      │  │  CATEGORIES                          │   ■ App Temp           │   │ │
      │  │  ┌────────────────────────────────┐ │   ■ Browser            │   │ │
      │  │  │ ☑️ System Cache         1.2 GB │ │   ■ Logs               │   │ │
      │  │  │ ☑️ Temporary Files      540 MB │ └────────────────────────┘   │ │
      │  │  │ ☑️ Browser Cache        320 MB │                              │ │
      │  │  │ ☑️ Old Downloads        180 MB │                              │ │
      │  │  │ ⚠️ Application Logs      45 MB │  ← Warning: may be useful   │ │
      │  │  │ ☐ Windows Update Cache  890 MB │  ← Unchecked: large         │ │
      │  │  └────────────────────────────────┘                              │ │
      │  │                                                                   │ │
      │  │  DETAILS VIEW                                                     │ │
      │  │  ┌─────────────────────────────────────────────────────────────┐ │ │
      │  │  │ Path                        │ Size    │ Age    │ Status    │ │ │
      │  │  ├─────────────────────────────┼─────────┼────────┼───────────┤ │ │
      │  │  │ C:\Users\...\Temp\cache_001 │ 125 MB  │ 45 d   │ ● Safe    │ │ │
      │  │  │ C:\Windows\Prefetch\*.pf    │ 89 MB   │ 30 d   │ ● Safe    │ │ │
      │  │  │ C:\Users\...\AppData\Local  │ 234 MB  │ 120 d  │ ○ Review  │ │ │
      │  │  └─────────────────────────────────────────────────────────────┘ │ │
      │  │                                                                   │ │
      │  │  ┌──────────────────┐  ┌──────────────────┐                      │ │
      │  │  │   CLEAN SAFE     │  │   CLEAN ALL      │                      │ │
      │  │  │     1.8 GB       │  │     2.3 GB       │                      │ │
      │  │  └──────────────────┘  └──────────────────┘                      │ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  5.3 Security Module

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                       SECURITY MODULE                                   │
      │                    Visual Theme: DEFENSIVE                              │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  Color Accent: #00FF88 (Cyber Green) / #FF3366 (Threat Red)            │
      │  Skull Behavior: Alert stance, shield-like posture                      │
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │       ┌─────────────────────────────────────────────────┐        │ │
      │  │       │                                                 │        │ │
      │  │       │                    💀                           │        │ │
      │  │       │                  ╱    ╲                         │        │ │
      │  │       │                ═══════════                       │        │ │
      │  │       │                                                 │        │ │
      │  │       │              SYSTEM PROTECTED                   │        │ │
      │  │       │           ─────────────────────                 │        │ │
      │  │       │                                                 │        │ │
      │  │       │    ╭────────────────────────────────────╮      │        │ │
      │  │       │    │████████████████████████████████████│      │        │ │
      │  │       │    │          SCANNING: 67%             │      │        │ │
      │  │       │    │████████████████████░░░░░░░░░░░░░░░░│      │        │ │
      │  │       │    ╰────────────────────────────────────╯      │        │ │
      │  │       │                                                 │        │ │
      │  │       │    Files scanned: 45,231 / 67,892              │        │ │
      │  │       │    Threats found: 0                             │        │ │
      │  │       │                                                 │        │ │
      │  │       └─────────────────────────────────────────────────┘        │ │
      │  │                                                                   │ │
      │  │  SCAN OPTIONS                                                     │ │
      │  │  ┌────────────────┐ ┌────────────────┐ ┌────────────────┐        │ │
      │  │  │  ⚡ QUICK      │ │  🔍 STANDARD   │ │  🔬 DEEP       │        │ │
      │  │  │    SCAN        │ │     SCAN       │ │    SCAN        │        │ │
      │  │  │                │ │                │ │                │        │ │
      │  │  │  ~2 minutes    │ │  ~10 minutes   │ │  ~30 minutes   │        │ │
      │  │  │  Critical only │ │  All user dirs │ │  Full system   │        │ │
      │  │  └────────────────┘ └────────────────┘ └────────────────┘        │ │
      │  │                                                                   │ │
      │  │  THREAT LOG                                                       │ │
      │  │  ┌─────────────────────────────────────────────────────────────┐ │ │
      │  │  │ ✓ 2024-01-15 14:32 - Full scan completed - No threats      │ │ │
      │  │  │ ✓ 2024-01-14 09:15 - Quick scan completed - No threats     │ │ │
      │  │  │ ⚠ 2024-01-10 16:45 - 1 PUP detected - Quarantined          │ │ │
      │  │  └─────────────────────────────────────────────────────────────┘ │ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      │  THREAT DETECTED VIEW (when threats found):                            │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │       💀  ← Red glow, aggressive posture                         │ │
      │  │                                                                   │ │
      │  │        ⚠️ THREATS DETECTED: 3                                    │ │
      │  │                                                                   │ │
      │  │  ┌─────────────────────────────────────────────────────────────┐ │ │
      │  │  │ 🔴 HIGH   Trojan.GenericKD    C:\Users\...\suspicious.exe  │ │ │
      │  │  │           [QUARANTINE] [DELETE] [IGNORE]                    │ │ │
      │  │  ├─────────────────────────────────────────────────────────────┤ │ │
      │  │  │ 🟡 MED    PUP.Optional.Bundle  C:\Program Files\...         │ │ │
      │  │  │           [QUARANTINE] [DELETE] [IGNORE]                    │ │ │
      │  │  └─────────────────────────────────────────────────────────────┘ │ │
      │  │                                                                   │ │
      │  │        [QUARANTINE ALL]        [FIX ALL THREATS]                 │ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  5.4 Performance Module

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                      PERFORMANCE MODULE                                 │
      │                    Visual Theme: SPEED / FLOW                           │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  Color Accent: #FFD700 (Gold) / #00FF88 (Green)                        │
      │  Skull Behavior: Streamlined, speed lines, energetic                    │
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │   SYSTEM PERFORMANCE SCORE                                        │ │
      │  │   ┌─────────────────────────────────────────────────────────────┐│ │
      │  │   │                                                             ││ │
      │  │   │              ╭───────────────────╮                          ││ │
      │  │   │            ╱                       ╲                        ││ │
      │  │   │           │     ┌─────────┐        │                        ││ │
      │  │   │           │     │   87    │        │   Score out of 100    ││ │
      │  │   │           │     │  /100   │        │                        ││ │
      │  │   │           │     └─────────┘        │                        ││ │
      │  │   │            ╲      GOOD            ╱                         ││ │
      │  │   │              ╰───────────────────╯                          ││ │
      │  │   │                      │                                      ││ │
      │  │   │         ─────────────┼─────────────                         ││ │
      │  │   │        0            50            100                       ││ │
      │  │   │                                                             ││ │
      │  │   └─────────────────────────────────────────────────────────────┘│ │
      │  │                                                                   │ │
      │  │   METRICS                                                         │ │
      │  │   ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────┐│ │
      │  │   │     CPU      │ │    Memory    │ │     Disk     │ │  Startup ││ │
      │  │   │              │ │              │ │              │ │          ││ │
      │  │   │   ████████░  │ │   ██████░░░  │ │   ████░░░░░  │ │  █████░░ ││ │
      │  │   │     78%      │ │     62%      │ │     45%      │ │   5.2s   ││ │
      │  │   │    Good      │ │    Good      │ │   Excellent  │ │   Fair   ││ │
      │  │   └──────────────┘ └──────────────┘ └──────────────┘ └──────────┘│ │
      │  │                                                                   │ │
      │  │   STARTUP PROGRAMS                                                │ │
      │  │   ┌─────────────────────────────────────────────────────────────┐│ │
      │  │   │ Program              │ Impact  │ Status  │ Action          ││ │
      │  │   ├──────────────────────┼─────────┼─────────┼─────────────────┤│ │
      │  │   │ Discord              │ 🔴 High │ Enabled │ [Disable]       ││ │
      │  │   │ Spotify              │ 🟡 Med  │ Enabled │ [Disable]       ││ │
      │  │   │ Windows Security     │ 🟢 Low  │ Enabled │ [Protected]     ││ │
      │  │   │ Adobe Updater        │ 🔴 High │ Enabled │ [Disable]       ││ │
      │  │   └─────────────────────────────────────────────────────────────┘│ │
      │  │                                                                   │ │
      │  │   ┌─────────────────────────────────────────────────────────────┐│ │
      │  │   │              🚀 OPTIMIZE NOW                                ││ │
      │  │   │         Apply recommended optimizations                     ││ │
      │  │   └─────────────────────────────────────────────────────────────┘│ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  5.5 Maintenance Module

      ┌─────────────────────────────────────────────────────────────────────────┐
      │                      MAINTENANCE MODULE                                 │
      │                    Visual Theme: STABILITY / REPAIR                     │
      ├─────────────────────────────────────────────────────────────────────────┤
      │                                                                         │
      │  Color Accent: #9966FF (Purple) / #00AAFF (Blue)                       │
      │  Skull Behavior: Calm, methodical, tool-holding pose                    │
      │                                                                         │
      │  ┌───────────────────────────────────────────────────────────────────┐ │
      │  │                                                                   │ │
      │  │   MAINTENANCE CENTER                                              │ │
      │  │                                                                   │ │
      │  │   ┌─────────────────────────────────────────────────────────────┐│ │
      │  │   │                    SYSTEM HEALTH                            ││ │
      │  │   │                                                             ││ │
      │  │   │    Registry    Disk Health    Services    System Files     ││ │
      │  │   │       ✓            ✓             ⚠              ✓          ││ │
      │  │   │      Good        Good       2 Issues        Good           ││ │
      │  │   │                                                             ││ │
      │  │   └─────────────────────────────────────────────────────────────┘│ │
      │  │                                                                   │ │
      │  │   MAINTENANCE TOOLS                                               │ │
      │  │   ┌────────────────────────┐  ┌────────────────────────┐        │ │
      │  │   │    🗄️ REGISTRY        │  │    💾 DISK             │        │ │
      │  │   │       CLEANER          │  │       HEALTH           │        │ │
      │  │   │                        │  │                        │        │ │
      │  │   │  Find and fix invalid  │  │  Check disk for errors │        │ │
      │  │   │  registry entries      │  │  and bad sectors       │        │ │
      │  │   │                        │  │                        │        │ │
      │  │   │      [SCAN]            │  │      [CHECK]           │        │ │
      │  │   └────────────────────────┘  └────────────────────────┘        │ │
      │  │   ┌────────────────────────┐  ┌────────────────────────┐        │ │
      │  │   │    ⚙️ SERVICES        │  │    🔧 SYSTEM           │        │ │
      │  │   │       MANAGER          │  │       REPAIR           │        │ │
      │  │   │                        │  │                        │        │ │
      │  │   │  Manage Windows        │  │  Run SFC and DISM      │        │ │
      │  │   │  services              │  │  to repair system      │        │ │
      │  │   │                        │  │                        │        │ │
      │  │   │      [MANAGE]          │  │      [REPAIR]          │        │ │
      │  │   └────────────────────────┘  └────────────────────────┘        │ │
      │  │                                                                   │ │
      │  │   REGISTRY SCAN RESULTS (when active)                            │ │
      │  │   ┌─────────────────────────────────────────────────────────────┐│ │
      │  │   │ Found 47 issues                                             ││ │
      │  │   │                                                             ││ │
      │  │   │ ├─ Invalid file extensions (12)                             ││ │
      │  │   │ ├─ Obsolete software entries (23)                           ││ │
      │  │   │ ├─ Invalid paths (8)                                        ││ │
      │  │   │ └─ Orphaned entries (4)                                     ││ │
      │  │   │                                                             ││ │
      │  │   │  ☑️ Create backup before cleaning                           ││ │
      │  │   │                                                             ││ │
      │  │   │           [CLEAN SELECTED]    [CLEAN ALL]                   ││ │
      │  │   └─────────────────────────────────────────────────────────────┘│ │
      │  │                                                                   │ │
      │  └───────────────────────────────────────────────────────────────────┘ │
      │                                                                         │
      └─────────────────────────────────────────────────────────────────────────┘

  ---
  Part 6: Component Design System

  6.1 Color Palette

      ┌─────────────────────────────────────────────────────────────┐
      │                    COLOR SYSTEM                             │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  PRIMARY COLORS                                             │
      │  ═══════════════                                            │
      │                                                             │
      │  ██████  #FFFFFF   White           Primary / Skull          │
      │  ██████  #F5F5F5   Off-White       Text primary             │
      │  ██████  #B0B0B0   Gray            Text secondary           │
      │  ██████  #666666   Dark Gray       Disabled text            │
      │                                                             │
      │  BACKGROUND COLORS                                          │
      │  ═════════════════                                          │
      │                                                             │
      │  ██████  #000000   Pure Black      Main background          │
      │  ██████  #0A0A0A   Near Black      Panel background         │
      │  ██████  #121212   Charcoal        Card background          │
      │  ██████  #1A1A1A   Dark Gray       Elevated surfaces        │
      │  ██████  #252525   Medium Gray     Hover states             │
      │  ██████  #333333   Light Gray      Active states            │
      │                                                             │
      │  ACCENT COLORS (Module-specific)                            │
      │  ═══════════════════════════════                            │
      │                                                             │
      │  ██████  #FF3366   Danger Red      Force Delete             │
      │  ██████  #00AAFF   Electric Blue   Analyzer                 │
      │  ██████  #00FF88   Cyber Green     Security (safe)          │
      │  ██████  #FFD700   Gold            Performance              │
      │  ██████  #9966FF   Purple          Maintenance              │
      │                                                             │
      │  STATUS COLORS                                              │
      │  ═════════════                                              │
      │                                                             │
      │  ██████  #00FF88   Success Green                            │
      │  ██████  #FFAA00   Warning Orange                           │
      │  ██████  #FF3366   Error Red                                │
      │  ██████  #00AAFF   Info Blue                                │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  6.2 Typography

      ┌─────────────────────────────────────────────────────────────┐
      │                    TYPOGRAPHY                               │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  PRIMARY FONT: Inter (or system UI font)                    │
      │  MONOSPACE: JetBrains Mono (for technical data)             │
      │                                                             │
      │  SCALE                                                      │
      │  ═════                                                      │
      │                                                             │
      │  Display     48px / 56px line    Weight 700                 │
      │  ──────────────────────────────────────────                 │
      │  DEADBYTE                                                   │
      │                                                             │
      │  H1          32px / 40px line    Weight 600                 │
      │  ──────────────────────────────────────────                 │
      │  Section Title                                              │
      │                                                             │
      │  H2          24px / 32px line    Weight 600                 │
      │  ──────────────────────────────────────────                 │
      │  Subsection Title                                           │
      │                                                             │
      │  H3          18px / 24px line    Weight 500                 │
      │  ──────────────────────────────────────────                 │
      │  Card Title                                                 │
      │                                                             │
      │  Body        14px / 20px line    Weight 400                 │
      │  ──────────────────────────────────────────                 │
      │  Regular paragraph text for descriptions                    │
      │                                                             │
      │  Small       12px / 16px line    Weight 400                 │
      │  ──────────────────────────────────────────                 │
      │  Captions, labels, metadata                                 │
      │                                                             │
      │  Mono        13px / 18px line    Weight 400                 │
      │  ──────────────────────────────────────────                 │
      │  C:\Users\path\to\file.txt                                  │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  6.3 Spacing System

      ┌─────────────────────────────────────────────────────────────┐
      │                    SPACING SCALE                            │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  Base unit: 4px                                             │
      │                                                             │
      │  ─┬─   4px    xs      Tight spacing, inline elements        │
      │   │                                                         │
      │  ──┬──  8px   sm      Icon gaps, tight padding              │
      │    │                                                        │
      │  ───┬───  12px  md    Standard padding                      │
      │     │                                                       │
      │  ────┬────  16px  lg  Card padding, gaps                    │
      │      │                                                      │
      │  ─────┬─────  24px  xl  Section spacing                     │
      │       │                                                     │
      │  ──────┬──────  32px  2xl  Major section gaps               │
      │        │                                                    │
      │  ───────┬───────  48px  3xl  Page-level spacing             │
      │         │                                                   │
      │                                                             │
      │  BORDER RADIUS                                              │
      │  ═════════════                                              │
      │                                                             │
      │  ╭──╮   4px    Small (buttons, inputs)                      │
      │  ╭────╮  8px   Medium (cards, panels)                       │
      │  ╭──────╮  12px  Large (modals, dialogs)                    │
      │  (   )   50%   Full (circular elements)                     │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  6.4 Effect Library

      ┌─────────────────────────────────────────────────────────────┐
      │                    EFFECTS & SHADOWS                        │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  GLOW EFFECTS                                               │
      │  ════════════                                               │
      │                                                             │
      │  Subtle Glow:                                               │
      │    box-shadow: 0 0 10px rgba(255, 255, 255, 0.1)           │
      │                                                             │
      │  Medium Glow:                                               │
      │    box-shadow: 0 0 20px rgba(255, 255, 255, 0.2)           │
      │                                                             │
      │  Intense Glow:                                              │
      │    box-shadow: 0 0 30px rgba(255, 255, 255, 0.4),          │
      │                0 0 60px rgba(255, 255, 255, 0.2)           │
      │                                                             │
      │  Colored Glow (per module):                                 │
      │    box-shadow: 0 0 20px rgba([accent], 0.3)                │
      │                                                             │
      │  ELEVATION SHADOWS                                          │
      │  ═════════════════                                          │
      │                                                             │
      │  Level 1 (cards):                                           │
      │    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5)                │
      │                                                             │
      │  Level 2 (dropdowns):                                       │
      │    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.6)                │
      │                                                             │
      │  Level 3 (modals):                                          │
      │    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.8)               │
      │                                                             │
      │  OVERLAY EFFECTS                                            │
      │  ═══════════════                                            │
      │                                                             │
      │  Scanline overlay:                                          │
      │    background: repeating-linear-gradient(                   │
      │      0deg,                                                  │
      │      transparent,                                           │
      │      transparent 2px,                                       │
      │      rgba(255,255,255,0.03) 2px,                           │
      │      rgba(255,255,255,0.03) 4px                            │
      │    );                                                       │
      │    pointer-events: none;                                    │
      │    animation: scanline-move 8s linear infinite;            │
      │                                                             │
      │  Noise texture (subtle):                                    │
      │    background-image: url('noise.png');                     │
      │    opacity: 0.03;                                          │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 7: Interaction Patterns

  7.1 Micro-Animations

      ┌─────────────────────────────────────────────────────────────┐
      │                 MICRO-ANIMATIONS                            │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  BUTTON HOVER                                               │
      │  ────────────                                               │
      │  • Scale: 1.0 → 1.02                                       │
      │  • Background brightness: +10%                              │
      │  • Glow appears                                             │
      │  • Duration: 0.2s ease-out                                 │
      │                                                             │
      │  BUTTON CLICK                                               │
      │  ────────────                                               │
      │  • Scale: 1.02 → 0.98 → 1.0                                │
      │  • Flash effect (white overlay 10%)                        │
      │  • Duration: 0.15s                                         │
      │                                                             │
      │  LIST ITEM HOVER                                            │
      │  ───────────────                                            │
      │  • Background slide-in from left                           │
      │  • Left border appears (3px accent color)                  │
      │  • Duration: 0.2s ease-out                                 │
      │                                                             │
      │  CHECKBOX TOGGLE                                            │
      │  ───────────────                                            │
      │  • Scale bounce: 1.0 → 1.2 → 1.0                           │
      │  • Check mark draws in (stroke animation)                  │
      │  • Duration: 0.3s                                          │
      │                                                             │
      │  PROGRESS BAR                                               │
      │  ────────────                                               │
      │  • Fill animation with ease-out                            │
      │  • Glow pulse on the leading edge                          │
      │  • Optional: particles trail behind                        │
      │                                                             │
      │  CARD ENTRY                                                 │
      │  ──────────                                                 │
      │  • Fade in + slide up (20px)                               │
      │  • Staggered: each card 50ms delay                         │
      │  • Duration: 0.3s ease-out                                 │
      │                                                             │
      │  NAV ITEM SELECTION                                         │
      │  ──────────────────                                         │
      │  • Glow burst on click                                     │
      │  • Icon pulses once                                        │
      │  • Active indicator slides in                              │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  7.2 Page Transitions

      ┌─────────────────────────────────────────────────────────────┐
      │                  PAGE TRANSITIONS                           │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  MODULE SWITCH                                              │
      │  ═════════════                                              │
      │                                                             │
      │  Frame 1         Frame 2         Frame 3                    │
      │  ┌──────┐       ┌──────┐        ┌──────┐                   │
      │  │ OLD  │  →    │░░░░░░│   →    │ NEW  │                   │
      │  │CONTENT│       │░░░░░░│        │CONTENT│                  │
      │  └──────┘       └──────┘        └──────┘                   │
      │   opacity:1     opacity:0       opacity:1                  │
      │   scale:1       scale:0.95      scale:1                    │
      │                                                             │
      │  Duration: 0.3s total                                       │
      │  Easing: ease-in-out                                       │
      │                                                             │
      │  SKULL MORPHING (between states)                            │
      │  ═══════════════════════════════                            │
      │                                                             │
      │  • Skull smoothly transitions between emotion states       │
      │  • No hard cuts - all changes animate                      │
      │  • Duration: 0.5s for state changes                        │
      │  • Eye glow crossfades                                     │
      │  • Jaw position interpolates                               │
      │                                                             │
      │  MODAL OPEN                                                 │
      │  ══════════                                                 │
      │                                                             │
      │  • Backdrop fades in (0.2s)                                │
      │  • Modal scales from 0.9 → 1.0                             │
      │  • Modal fades in simultaneously                           │
      │  • Duration: 0.25s ease-out                                │
      │                                                             │
      │  MODAL CLOSE                                                │
      │  ═══════════                                                │
      │                                                             │
      │  • Modal scales 1.0 → 0.95                                 │
      │  • Opacity fades to 0                                      │
      │  • Backdrop fades out                                      │
      │  • Duration: 0.2s ease-in                                  │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 8: Responsive Behavior

      ┌─────────────────────────────────────────────────────────────┐
      │              WINDOW SIZE ADAPTATIONS                        │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  MINIMUM (1024 × 768)                                       │
      │  ════════════════════                                       │
      │  • Skull size: 200×200 px                                  │
      │  • Nav bar: icons only (collapse labels)                   │
      │  • Single column layouts                                   │
      │  • Compact spacing                                         │
      │                                                             │
      │  STANDARD (1280 × 800)                                      │
      │  ═════════════════════                                      │
      │  • Skull size: 280×280 px                                  │
      │  • Nav bar: icons + labels                                 │
      │  • Two column layouts where appropriate                    │
      │  • Normal spacing                                          │
      │                                                             │
      │  LARGE (1920 × 1080+)                                       │
      │  ════════════════════                                       │
      │  • Skull size: 350×350 px (max)                            │
      │  • Expanded layouts                                        │
      │  • More data visible                                       │
      │  • Generous spacing                                        │
      │                                                             │
      │  SCALING RULES                                              │
      │  ═════════════                                              │
      │                                                             │
      │  1. Skull never clips - always fully visible               │
      │  2. Nav bar width is fixed (72px)                          │
      │  3. Content area is fluid                                  │
      │  4. Minimum touch targets: 44×44 px                        │
      │  5. Text never scales below 12px                           │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 9: Asset Requirements

  9.1 Skull Asset Specifications

      ┌─────────────────────────────────────────────────────────────┐
      │                 SKULL ASSET CREATION                        │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  OPTION A: Vector/SVG Approach                              │
      │  ═════════════════════════════                              │
      │                                                             │
      │  • Create skull as layered SVG                             │
      │  • Separate paths for:                                     │
      │    - Cranium                                               │
      │    - Left eye socket                                       │
      │    - Right eye socket                                      │
      │    - Nasal cavity                                          │
      │    - Upper jaw (with individual teeth)                     │
      │    - Lower jaw (with individual teeth)                     │
      │    - Left crossbone                                        │
      │    - Right crossbone                                       │
      │  • Export at 512×512 px base size                          │
      │  • Use CSS/JS to animate transforms                        │
      │                                                             │
      │  OPTION B: 3D Model Approach                                │
      │  ═══════════════════════════                                │
      │                                                             │
      │  • Create low-poly skull model                             │
      │  • Format: GLTF/GLB                                        │
      │  • Rigged with bones for:                                  │
      │    - Jaw open/close                                        │
      │    - Jaw horizontal slide                                  │
      │    - Eye socket glow intensity                             │
      │  • Render with Three.js / WebGPU                           │
      │  • White material, unlit shader                            │
      │  • Add glow via post-processing                            │
      │                                                             │
      │  RECOMMENDED: Option A for simplicity + performance         │
      │  Option B if budget/time allows for richer animation       │
      │                                                             │
      │  CROSSBONES                                                 │
      │  ══════════                                                 │
      │  • Simple elongated bone shape                             │
      │  • Rounded ends (knobs)                                    │
      │  • Positioned behind skull, crossing in X pattern          │
      │  • Separate element for independent animation              │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  9.2 Icon Set

      ┌─────────────────────────────────────────────────────────────┐
      │                    ICON REQUIREMENTS                        │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  STYLE: Line icons, 2px stroke, rounded caps               │
      │  SIZE: 24×24 px (design at 48×48, export both)             │
      │  COLOR: Single color (white), colorable via CSS            │
      │                                                             │
      │  NAVIGATION ICONS                                           │
      │  ┌────┬──────────────────────────────────────────┐         │
      │  │ ⚡ │ Force Delete   Lightning bolt / trash    │         │
      │  │ 🔍 │ Analyzer       Magnifying glass + chart  │         │
      │  │ 🛡️ │ Security       Shield                    │         │
      │  │ 🚀 │ Performance    Rocket / speedometer      │         │
      │  │ 🔧 │ Maintenance    Wrench / toolbox          │         │
      │  │ ⚙️ │ Settings       Gear                      │         │
      │  └────┴──────────────────────────────────────────┘         │
      │                                                             │
      │  ACTION ICONS                                               │
      │  ┌────┬──────────────────────────────────────────┐         │
      │  │ ▶️ │ Start / Play                             │         │
      │  │ ⏹️ │ Stop                                     │         │
      │  │ ✓  │ Checkmark / Success                      │         │
      │  │ ✕  │ Close / Error                            │         │
      │  │ ⚠️ │ Warning                                  │         │
      │  │ 🗑️ │ Delete                                   │         │
      │  │ 📁 │ Folder                                   │         │
      │  │ 📄 │ File                                     │         │
      │  └────┴──────────────────────────────────────────┘         │
      │                                                             │
      │  STATUS INDICATORS                                          │
      │  • Circular dots: 8×8 px                                   │
      │  • Colors: Green (good), Yellow (warning), Red (bad)       │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Part 10: Implementation Checklist

      ┌─────────────────────────────────────────────────────────────┐
      │            UI IMPLEMENTATION CHECKLIST                      │
      ├─────────────────────────────────────────────────────────────┤
      │                                                             │
      │  PHASE 1: Foundation                                        │
      │  ════════════════════                                       │
      │  □ Set up project with Tauri + Vite + Solid.js/Svelte      │
      │  □ Configure custom window (frameless, custom title bar)   │
      │  □ Implement color system as CSS variables                 │
      │  □ Set up typography scale                                 │
      │  □ Create spacing utility classes                          │
      │                                                             │
      │  PHASE 2: Layout                                            │
      │  ═══════════════                                            │
      │  □ Build main window layout (nav + content)                │
      │  □ Create custom title bar with window controls            │
      │  □ Build navigation sidebar                                │
      │  □ Implement status bar                                    │
      │  □ Set up routing between modules                          │
      │                                                             │
      │  PHASE 3: Skull System                                      │
      │  ════════════════════                                       │
      │  □ Create/obtain skull SVG or 3D model                     │
      │  □ Implement skull state machine                           │
      │  □ Build IDLE animation                                    │
      │  □ Build SCANNING animation                                │
      │  □ Build DELETING animation (jaw)                          │
      │  □ Build ERROR animation (glitch)                          │
      │  □ Build SUCCESS animation                                 │
      │  □ Add particle systems                                    │
      │  □ Add glow effects                                        │
      │                                                             │
      │  PHASE 4: Components                                        │
      │  ═══════════════════                                        │
      │  □ Build Button component (all states)                     │
      │  □ Build Card component                                    │
      │  □ Build ProgressBar component                             │
      │  □ Build Checkbox component                                │
      │  □ Build List/Table component                              │
      │  □ Build Modal/Dialog component                            │
      │  □ Build Input/TextField component                         │
      │  □ Build Dropdown component                                │
      │                                                             │
      │  PHASE 5: Module UIs                                        │
      │  ═════════════════                                          │
      │  □ Build Home screen                                       │
      │  □ Build Force Delete module UI                            │
      │  □ Build Analyzer module UI                                │
      │  □ Build Security module UI                                │
      │  □ Build Performance module UI                             │
      │  □ Build Maintenance module UI                             │
      │  □ Build Settings screen                                   │
      │                                                             │
      │  PHASE 6: Polish                                            │
      │  ═══════════════                                            │
      │  □ Add micro-animations                                    │
      │  □ Add page transitions                                    │
      │  □ Add loading states                                      │
      │  □ Add empty states                                        │
      │  □ Add error states                                        │
      │  □ Test all responsive breakpoints                         │
      │  □ Performance optimization                                │
      │                                                             │
      └─────────────────────────────────────────────────────────────┘

  ---
  Summary

  This design specification provides:

  1. Complete skull animation system with 5+ distinct states
  2. Full application layout with navigation, content areas, and status bar
  3. 5 module-specific UI designs each with unique visual identity
  4. Comprehensive design system (colors, typography, spacing, effects)
  5. Detailed interaction patterns and micro-animations
  6. Asset requirements and implementation checklist

  The visual identity is centered on the white skull and crossbones against a dark/black
  background, with the skull serving as a reactive, emotional centerpiece that responds to every
  system action.

  ---
  Ready to proceed to technical architecture and implementation when you approve this UI
  direction. Should I refine any specific section, or shall we move forward?