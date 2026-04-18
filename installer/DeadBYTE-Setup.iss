; ============================================
; DeadBYTE - Inno Setup Installer Script
; ============================================
; Professional Windows Installer for DeadBYTE
; Created by MONER INTELLIGENCE SYSTEMS
; ============================================

#define MyAppName "DeadBYTE"
#define MyAppVersion "1.0.2"
#define MyAppPublisher "MONER INTELLIGENCE SYSTEMS"
#define MyAppURL "https://github.com/moner-dev/DeadByte"
#define MyAppExeName "DeadBYTE.exe"
#define MyAppCopyright "Copyright 2026 MONER INTELLIGENCE SYSTEMS"

; Source directory - adjust this to where electron-builder outputs the unpacked app
#define SourceDir "..\dist\win-unpacked"

[Setup]
; App Information
AppId={{8A7D5E4F-3B2C-4A1D-9E8F-6C5B4A3D2E1F}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppVerName={#MyAppName} v{#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}/issues
AppUpdatesURL={#MyAppURL}/releases
AppCopyright={#MyAppCopyright}
VersionInfoVersion={#MyAppVersion}
VersionInfoCompany={#MyAppPublisher}
VersionInfoDescription={#MyAppName} - Advanced File Management and System Control
VersionInfoCopyright={#MyAppCopyright}
VersionInfoProductName={#MyAppName}
VersionInfoProductVersion={#MyAppVersion}

; Installation Directories
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes

; Output Settings
OutputDir=output
OutputBaseFilename=DeadBYTE-Setup-v{#MyAppVersion}
SetupIconFile=..\src\assets\skull\skull.ico
UninstallDisplayIcon={app}\{#MyAppExeName}

; Compression - Maximum
Compression=lzma2/ultra64
SolidCompression=yes
LZMAUseSeparateProcess=yes
LZMANumBlockThreads=4

; Architecture
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

; Privileges - Require Admin
PrivilegesRequired=admin
PrivilegesRequiredOverridesAllowed=dialog

; Installer Appearance
WizardStyle=modern
WizardSizePercent=110
WindowVisible=yes
WindowShowCaption=yes
WindowResizable=no

; Misc Settings
AllowNoIcons=no
CloseApplications=yes
RestartApplications=no
ShowLanguageDialog=no
DisableWelcomePage=no
DisableDirPage=no
DisableReadyPage=no
DisableFinishedPage=no

; Uninstaller
UninstallDisplayName={#MyAppName}
CreateUninstallRegKey=yes
Uninstallable=yes

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Messages]
WelcomeLabel1=Welcome to {#MyAppName} Setup
WelcomeLabel2=This will install {#MyAppName} v{#MyAppVersion} on your computer.%n%n{#MyAppName} is a powerful desktop application for file management, system maintenance, and administrative control.%n%nIt is recommended that you close all other applications before continuing.
FinishedHeadingLabel=Completing {#MyAppName} Setup
FinishedLabelNoIcons=Setup has finished installing {#MyAppName} on your computer.
FinishedLabel=Setup has finished installing {#MyAppName} on your computer. The application may be launched by selecting the installed shortcuts.

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: checkedonce
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode
Name: "startupicon"; Description: "Start {#MyAppName} when Windows starts"; GroupDescription: "Windows Startup:"; Flags: unchecked

[Files]
; Main application files from electron-builder output
Source: "{#SourceDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

; Note: The source path assumes electron-builder has already built the app
; Run 'npm run build:dir' first to create the unpacked directory

[Icons]
; Start Menu
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Comment: "Launch {#MyAppName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"; IconFilename: "{app}\{#MyAppExeName}"

; Desktop
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; IconFilename: "{app}\{#MyAppExeName}"; Tasks: desktopicon; Comment: "Launch {#MyAppName}"

; Quick Launch (legacy)
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Registry]
; App Registration
Root: HKLM; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "InstallPath"; ValueData: "{app}"; Flags: uninsdeletekey
Root: HKLM; Subkey: "Software\{#MyAppName}"; ValueType: string; ValueName: "Version"; ValueData: "{#MyAppVersion}"; Flags: uninsdeletekey

; Windows Startup (optional task)
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\{#MyAppExeName}"""; Flags: uninsdeletevalue; Tasks: startupicon

[Run]
; Run after install (optional)
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent runascurrentuser

[UninstallRun]
; Close app before uninstall
Filename: "{sys}\taskkill.exe"; Parameters: "/F /IM {#MyAppExeName}"; Flags: runhidden; RunOnceId: "KillApp"

[UninstallDelete]
; Clean up user data (optional - currently commented out)
; Type: filesandordirs; Name: "{userappdata}\{#MyAppName}"
Type: filesandordirs; Name: "{app}"

[Code]
// ============================================
// Pascal Script Code Section
// ============================================

var
  FinishedInstall: Boolean;

// Check if application is currently running
function IsAppRunning(): Boolean;
var
  ResultCode: Integer;
begin
  Result := False;
  if Exec('tasklist', '/FI "IMAGENAME eq {#MyAppExeName}" /NH', '', SW_HIDE, ewWaitUntilTerminated, ResultCode) then
  begin
    // Check if the process was found
    Result := (ResultCode = 0);
  end;
end;

// Check Windows version (require Windows 10 or later)
function IsWindows10OrLater(): Boolean;
var
  Version: TWindowsVersion;
begin
  GetWindowsVersionEx(Version);
  Result := (Version.Major >= 10);
end;

// Initialize setup - pre-install checks
function InitializeSetup(): Boolean;
var
  ResultCode: Integer;
  UninstallKey: String;
  UninstallString: String;
begin
  Result := True;

  // Check Windows version
  if not IsWindows10OrLater() then
  begin
    MsgBox('{#MyAppName} requires Windows 10 or later.', mbError, MB_OK);
    Result := False;
    Exit;
  end;

  // Check if app is currently running
  if IsAppRunning() then
  begin
    if MsgBox('{#MyAppName} is currently running.' + #13#10 + #13#10 +
              'Would you like to close it and continue with the installation?',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      // Try to close the application
      Exec('taskkill', '/F /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Sleep(1000); // Wait for process to close
    end
    else
    begin
      Result := False;
      Exit;
    end;
  end;

  // Check for existing installation
  UninstallKey := 'Software\Microsoft\Windows\CurrentVersion\Uninstall\{{8A7D5E4F-3B2C-4A1D-9E8F-6C5B4A3D2E1F}_is1';
  if RegQueryStringValue(HKLM, UninstallKey, 'UninstallString', UninstallString) then
  begin
    if MsgBox('A previous version of {#MyAppName} is installed.' + #13#10 + #13#10 +
              'Would you like to uninstall it first?',
              mbConfirmation, MB_YESNO) = IDYES then
    begin
      // Run the uninstaller
      if not Exec(RemoveQuotes(UninstallString), '/SILENT', '', SW_SHOW, ewWaitUntilTerminated, ResultCode) then
      begin
        MsgBox('Failed to run the uninstaller. Please uninstall manually first.', mbError, MB_OK);
        Result := False;
        Exit;
      end;
      Sleep(2000); // Wait for uninstall to complete
    end;
  end;
end;

// Called when setup is done
procedure CurStepChanged(CurStep: TSetupStep);
begin
  if CurStep = ssDone then
  begin
    FinishedInstall := True;
  end;
end;

// Uninstaller initialization
function InitializeUninstall(): Boolean;
var
  ResultCode: Integer;
begin
  Result := True;

  // Check if app is running
  if IsAppRunning() then
  begin
    if MsgBox('{#MyAppName} is currently running.' + #13#10 + #13#10 +
              'The application will be closed to continue uninstallation.',
              mbInformation, MB_OKCANCEL) = IDOK then
    begin
      Exec('taskkill', '/F /IM {#MyAppExeName}', '', SW_HIDE, ewWaitUntilTerminated, ResultCode);
      Sleep(1000);
    end
    else
    begin
      Result := False;
    end;
  end;
end;

// Custom uninstall - ask about user data
procedure CurUninstallStepChanged(CurUninstallStep: TUninstallStep);
var
  UserDataPath: String;
begin
  if CurUninstallStep = usPostUninstall then
  begin
    UserDataPath := ExpandConstant('{userappdata}\{#MyAppName}');
    if DirExists(UserDataPath) then
    begin
      if MsgBox('Do you want to remove {#MyAppName} user data and settings?' + #13#10 + #13#10 +
                'Location: ' + UserDataPath,
                mbConfirmation, MB_YESNO) = IDYES then
      begin
        DelTree(UserDataPath, True, True, True);
      end;
    end;
  end;
end;
