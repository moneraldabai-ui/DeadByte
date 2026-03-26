# Building DeadBYTE

This guide explains how to build and package DeadBYTE for distribution.

## Prerequisites

Before building, ensure you have the following installed:

### Required
- **Node.js** (v18 or later) - [Download](https://nodejs.org)
- **npm** (comes with Node.js)

### Optional (for Inno Setup installer)
- **Inno Setup 6** - [Download](https://jrsoftware.org/isdl.php)

## Quick Build

The easiest way to build everything:

```bash
# Windows
build-installer.bat
```

This script will:
1. Install dependencies if needed
2. Build the Electron app
3. Create NSIS installer (via electron-builder)
4. Create Inno Setup installer (if Inno Setup is installed)
5. Open the output folder

## Manual Build Steps

### Step 1: Install Dependencies

```bash
npm install
```

### Step 2: Build Options

#### Option A: Build All (NSIS + Portable)
```bash
npm run build
```

Output: `dist/DeadBYTE-1.0.0-win-x64.exe` (NSIS installer)
Output: `dist/DeadBYTE-1.0.0-Portable.exe` (Portable)

#### Option B: Build NSIS Installer Only
```bash
npm run build:nsis
```

#### Option C: Build Portable Only
```bash
npm run build:portable
```

#### Option D: Build Unpacked (for Inno Setup)
```bash
npm run build:dir
```

Output: `dist/win-unpacked/` (unpacked application)

### Step 3: Create Inno Setup Installer (Optional)

After running `npm run build:dir`:

1. Open Inno Setup 6
2. Open `installer/DeadBYTE-Setup.iss`
3. Press Ctrl+F9 or Build > Compile
4. Output: `installer/output/DeadBYTE-Setup-v1.0.0.exe`

Or via command line:
```bash
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer\DeadBYTE-Setup.iss
```

## Output Files

After building, you'll find:

| File | Location | Description |
|------|----------|-------------|
| `DeadBYTE-1.0.0-win-x64.exe` | `dist/` | NSIS Installer (electron-builder) |
| `DeadBYTE-1.0.0-Portable.exe` | `dist/` | Portable Version |
| `DeadBYTE-Setup-v1.0.0.exe` | `installer/output/` | Inno Setup Installer |
| `win-unpacked/` | `dist/` | Unpacked application |

## Installer Features

### NSIS Installer (electron-builder)
- One-click or custom installation
- Desktop and Start Menu shortcuts
- Uninstaller included
- Admin elevation required

### Inno Setup Installer
- Professional wizard interface
- License agreement page
- Custom installation directory
- Component selection
- Desktop shortcut option
- Windows startup option
- Previous version detection
- Clean uninstaller
- User data cleanup option

## Testing the Installer

1. Run the installer on a clean Windows 10/11 machine (or VM)
2. Verify the installation completes without errors
3. Check that shortcuts are created:
   - Desktop shortcut
   - Start Menu entry
4. Launch the application and verify it works
5. Check Add/Remove Programs shows DeadBYTE
6. Test the uninstaller:
   - Run uninstaller from Add/Remove Programs
   - Verify all files are removed
   - Verify shortcuts are removed

## Troubleshooting

### Build fails with "electron-builder not found"
```bash
npm install electron-builder --save-dev
```

### NSIS error during build
Ensure the icon file exists at `src/assets/skull/skull.ico`

### Inno Setup compilation fails
- Ensure `npm run build:dir` completed successfully
- Check that `dist/win-unpacked/` exists
- Verify paths in the .iss file match your structure

### App doesn't start after install
- Check Windows Event Viewer for errors
- Ensure you have admin rights
- Try running as administrator

## Version Updates

When releasing a new version:

1. Update version in `package.json`
2. Update version in `installer/DeadBYTE-Setup.iss` (line 10)
3. Rebuild with `build-installer.bat`

## Code Signing (Optional)

For production releases, consider code signing:

1. Obtain a code signing certificate
2. Add to `package.json`:
```json
"win": {
  "certificateFile": "path/to/cert.pfx",
  "certificatePassword": "password"
}
```

Or use environment variables:
- `CSC_LINK` - Certificate file path
- `CSC_KEY_PASSWORD` - Certificate password

## Support

- Issues: https://github.com/moneraldabai-ui/DeadByte/issues
- Releases: https://github.com/moneraldabai-ui/DeadByte/releases
