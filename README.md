# DeadBYTE
Advanced File Management and System Control utility for Windows.

## Overview

DeadBYTE is a powerful desktop application built with Electron that provides comprehensive file management, system maintenance, and administrative control capabilities. Designed for power users and system administrators who need deep access to Windows system operations.

## Features

### File Management
- **File Browser** - Navigate and manage files across all drives
- **Force Delete** - Remove stubborn/locked files that standard deletion can't handle
- **Permission Management** - View and modify file/folder permissions
- **Ownership Control** - Take ownership of files and folders

### System Control
- **Process Manager** - View and manage running processes
- **Service Manager** - Control Windows services
- **Startup Manager** - Manage startup programs and entries

### Maintenance
- **Junk Cleaner** - Remove temporary files and system clutter
- **System Maintenance** - Automated maintenance tasks
- **Drive Analysis** - Analyze disk usage and storage

### Administration
- **Admin Elevation** - Runs with administrator privileges for full system access
- **Logging** - Comprehensive operation logging

## Requirements

- Windows 10/11
- Administrator privileges (required for system operations)
- Node.js 18+ (for development)

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd DeadBYTE

# Install dependencies
npm install

# Run the application
npm start
```

## Development

```bash
# Run in development mode with logging
npm run dev

# Build for production
npm run build
```

## Project Structure

```
DeadBYTE/
├── electron.js         # Main Electron process
├── preload.js          # Preload script for IPC
├── package.json        # Project configuration
├── src/
│   ├── index.html      # Main application UI
│   ├── main.js         # Renderer process logic
│   ├── styles/         # CSS stylesheets
│   ├── components/     # UI components
│   ├── assets/         # Icons and images
│   └── animations/     # UI animations
├── backend/
│   ├── fileService.js        # File operations
│   ├── driveService.js       # Drive management
│   ├── processService.js     # Process management
│   ├── permissionService.js  # Permission handling
│   ├── ownershipService.js   # Ownership operations
│   ├── forceDeleteService.js # Force delete functionality
│   ├── startupService.js     # Startup management
│   ├── serviceService.js     # Windows services
│   ├── junkService.js        # Junk file cleaning
│   ├── maintenanceService.js # System maintenance
│   ├── systemService.js      # System information
│   ├── adminService.js       # Admin operations
│   ├── settingsService.js    # App settings
│   └── logService.js         # Logging
├── scripts/            # Build and utility scripts
└── docs/               # Documentation
```

## Tech Stack

- **Electron** - Desktop application framework
- **Node.js** - Backend services and system operations
- **HTML/CSS/JavaScript** - Frontend UI

## License

MIT License

## Author
M. O. N. E. R
