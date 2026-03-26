; DeadBYTE NSIS Include Script
; Custom NSIS configuration for electron-builder

!macro customHeader
  !system "echo 'Building DeadBYTE Installer...'"
!macroend

!macro customInit
  ; Check if app is already running
  FindWindow $0 "" "DeadBYTE"
  StrCmp $0 0 notRunning
    MessageBox MB_OK|MB_ICONEXCLAMATION "DeadBYTE is currently running. Please close it before continuing." /SD IDOK
    Abort
  notRunning:
!macroend

!macro customInstall
  ; Write registry keys for app info
  WriteRegStr HKLM "Software\DeadBYTE" "InstallPath" "$INSTDIR"
  WriteRegStr HKLM "Software\DeadBYTE" "Version" "${VERSION}"

  ; Create registry entry for Windows startup (optional, user must enable)
  ; WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DeadBYTE" "$INSTDIR\DeadBYTE.exe"
!macroend

!macro customUnInstall
  ; Remove registry keys
  DeleteRegKey HKLM "Software\DeadBYTE"
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "DeadBYTE"
!macroend
