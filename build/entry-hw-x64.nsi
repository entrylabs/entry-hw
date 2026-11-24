; example1.nsi
;
; This script is perhaps one of the simplest NSIs you can make. All of the
; optional settings are left to their default settings. The installer simply
; prompts the user asking them where to install, and drops a copy of example1.nsi
; there.
;
; 64bit(x64) 설치 파일 스크립트. electron-builder --win --x64 결과(dist\win-unpacked)를 묶는다.
; 32bit 설치 파일은 entry-hw.nsi 로 만든다. 설치 경로·레지스트리 위치를 32bit 와 같게 두어
; 32bit <-> 64bit 사이 업그레이드 설치(이전 버전 삭제 후 재설치)가 그대로 동작한다.
; 버전을 올릴 때는 entry-hw.nsi 와 이 파일의 PRODUCT_VERSION 을 함께 바꾼다.

!include MUI2.nsh
!include x64.nsh


; MUI Settings / Icons
!define MUI_ICON "icon.ico"
!define MUI_UNICON "icon.ico"
!define PRODUCT_NAME "Entry_HW"
!define PROTOCOL_NAME "entryhw"
!define APP_NAME "Entry_HW.exe"
!define PRODUCT_VERSION "1.9.79"
!define PRODUCT_PUBLISHER "EntryLabs"
!define PRODUCT_WEB_SITE "https://www.playentry.org/"

; MUI Settings / Header
;!define MUI_HEADERIMAGE
;!define MUI_HEADERIMAGE_RIGHT
;!define MUI_HEADERIMAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Header\orange-r-nsis.bmp"
;!define MUI_HEADERIMAGE_UNBITMAP "${NSISDIR}\Contrib\Graphics\Header\orange-uninstall-r-nsis.bmp"

; MUI Settings / Wizard
;!define MUI_WELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\orange-nsis.bmp"
;!define MUI_UNWELCOMEFINISHPAGE_BITMAP "${NSISDIR}\Contrib\Graphics\Wizard\orange-uninstall-nsis.bmp"

;--------------------------------

; The name of the installer
Name "$(TEXT_ENTRY)"

; The file to write
OutFile "${PRODUCT_NAME}_${PRODUCT_VERSION}_Setup_x64.exe"

; The default installation directory
InstallDir "C:\${PRODUCT_NAME}"

; Registry key to check for directory (so if you install again, it will
; overwrite the old one automatically)
InstallDirRegKey HKLM "Software\${PRODUCT_NAME}" "Install_Dir"

; Request application privileges for Windows Vista
RequestExecutionLevel admin


;--------------------------------

; Pages

!insertmacro MUI_PAGE_COMPONENTS
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN
!define MUI_FINISHPAGE_RUN_FUNCTION "LaunchLink"

!insertmacro MUI_PAGE_FINISH
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES
;--------------------------------

; 다국어 설정
!insertmacro MUI_LANGUAGE "Korean" ;first language is the default language

LangString TEXT_ENTRY ${LANG_KOREAN} "엔트리 하드웨어"
LangString TEXT_ENTRY_DELETE ${LANG_KOREAN} "엔트리 하드웨어 제거"
LangString TEXT_ENTRY_TITLE ${LANG_KOREAN} "엔트리 하드웨어 (필수)"
LangString TEXT_START_MENU_TITLE ${LANG_KOREAN} "시작메뉴에 바로가기"
LangString TEXT_DESKTOP_TITLE ${LANG_KOREAN} "바탕화면에 바로가기"
LangString DESC_ENTRY ${LANG_KOREAN} "엔트리 하드웨어"
LangString START_ENTRY ${LANG_KOREAN} "엔트리 하드웨어 시작하기"
LangString DESC_START_MENU ${LANG_KOREAN} "시작메뉴에 바로가기 아이콘이 생성됩니다."
LangString DESC_DESKTOP ${LANG_KOREAN} "바탕화면에 바로가기 아이콘이 생성됩니다."
LangString SETUP_UNINSTALL_MSG ${LANG_KOREAN} "엔트리 하드웨어가 이미 설치되어 있습니다. $\n$\r'확인' 버튼을 누르면 이전 버전을 삭제 후 재설치하고 '취소' 버튼을 누르면 업그레이드를 취소합니다."
LangString SETUP_REQUIRE_64BIT_MSG ${LANG_KOREAN} "64비트 Windows에서만 설치할 수 있습니다. $\n32비트 Windows에서는 32bit 설치 파일을 사용해 주세요."


!insertmacro MUI_LANGUAGE "English"

LangString TEXT_ENTRY ${LANG_ENGLISH} "Entry HW"
LangString TEXT_ENTRY_DELETE ${LANG_ENGLISH} "Entry HW Uninstall"
LangString TEXT_ENTRY_TITLE ${LANG_ENGLISH} "Entry HW (required)"
LangString TEXT_START_MENU_TITLE ${LANG_ENGLISH} "Start menu shortcut"
LangString TEXT_DESKTOP_TITLE ${LANG_ENGLISH} "Desktop shortcut"
LangString DESC_ENTRY ${LANG_ENGLISH} "Entry HW Program"
LangString START_ENTRY ${LANG_ENGLISH} "Start Entry HW Program"
LangString DESC_START_MENU ${LANG_ENGLISH} "Create shortcut on start menu"
LangString DESC_DESKTOP ${LANG_ENGLISH} "Create shortcut on desktop"
LangString SETUP_UNINSTALL_MSG ${LANG_ENGLISH} "Entry_HW is already installed. $\n$\nClick 'OK' to remove the previous version or 'Cancel' to cancel this upgrade."
LangString SETUP_REQUIRE_64BIT_MSG ${LANG_ENGLISH} "This installer requires 64-bit Windows. $\nPlease use the 32-bit installer on 32-bit Windows."


; The stuff to install
Section $(TEXT_ENTRY_TITLE) SectionEntry
  SectionIn RO

  ; Set output path to the installation directory.
  ;SetOutPath $INSTDIR

  ; Delete roaming/entry_hw for initialize update check logic
  RMDir /r "$PROFILE\AppData\Roaming\entry_hw"

  ; Put file there
  SetOutPath "$INSTDIR\locales"
  File "..\dist\win-unpacked\locales\*.*"

  SetOutPath "$INSTDIR\resources"
  File /r "..\dist\win-unpacked\resources\*.*"

  SetOutPath "$INSTDIR"
  File "..\dist\win-unpacked\*.*"
  File "icon.ico"

  WriteRegStr HKCR "${PROTOCOL_NAME}" "URL Protocol" ""
  WriteRegStr HKCR "${PROTOCOL_NAME}\DefaultIcon" "" "$INSTDIR\icon.ico"
  WriteRegStr HKCR "${PROTOCOL_NAME}\Shell\Open" "" "&Open"
  WriteRegStr HKCR "${PROTOCOL_NAME}\Shell\Open\Command" "" '"$INSTDIR\${PRODUCT_NAME}.exe" "%1"'

  ; Write the installation path into the registry
  WriteRegStr HKLM "SOFTWARE\${PRODUCT_NAME}" "Install_Dir" "$INSTDIR"

  ; Write the uninstall keys for Windows
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayName" "$(TEXT_ENTRY)"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayVersion" "${PRODUCT_VERSION}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "Publisher" "${PRODUCT_PUBLISHER}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "URLInfoAbout" "${PRODUCT_WEB_SITE}"
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "UninstallString" '"$INSTDIR\$(TEXT_ENTRY_DELETE).exe"'
  WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "DisplayIcon" '"$INSTDIR\icon.ico"'
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoModify" 1
  WriteRegDWORD HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" "NoRepair" 1
  WriteUninstaller "\$(TEXT_ENTRY_DELETE).exe"

SectionEnd

; Optional section (can be disabled by the user)
Section $(TEXT_START_MENU_TITLE) SectionStartMenu

  SetShellVarContext all
  CreateDirectory "$SMPROGRAMS\EntryLabs\${PRODUCT_NAME}"
  CreateShortCut "$SMPROGRAMS\EntryLabs\${PRODUCT_NAME}\$(TEXT_ENTRY_DELETE).lnk" "$INSTDIR\$(TEXT_ENTRY_DELETE).exe" "" "$INSTDIR\$(TEXT_ENTRY_DELETE).exe" 0
  CreateShortCut "$SMPROGRAMS\EntryLabs\${PRODUCT_NAME}\$(TEXT_ENTRY).lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\icon.ico" 0

SectionEnd

;--------------------------------

; Optional section (can be disabled by the user)
Section $(TEXT_DESKTOP_TITLE) SectionDesktop

	SetShellVarContext all
    CreateShortCut "$DESKTOP\$(TEXT_ENTRY).lnk" "$INSTDIR\${PRODUCT_NAME}.exe" "" "$INSTDIR\icon.ico" 0

SectionEnd

!insertmacro MUI_FUNCTION_DESCRIPTION_BEGIN
	!insertmacro MUI_DESCRIPTION_TEXT ${SectionEntry} $(DESC_ENTRY)
    !insertmacro MUI_DESCRIPTION_TEXT ${SectionStartMenu} $(DESC_START_MENU)
    !insertmacro MUI_DESCRIPTION_TEXT ${SectionDesktop} $(DESC_DESKTOP)
!insertmacro MUI_FUNCTION_DESCRIPTION_END

;--------------------------------

; Uninstaller

Section "Uninstall"
  SetShellVarContext all
  ; Remove registry keys
  DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
  DeleteRegKey HKLM "SOFTWARE\${PRODUCT_NAME}"
  DeleteRegKey HKCR "${PRODUCT_NAME}"
  DeleteRegKey HKCR "${PROTOCOL_NAME}"

  ; Remove files and uninstaller
  Delete $INSTDIR\*

  ; Remove shortcuts, if any
  Delete "$SMPROGRAMS\EntryLabs\${PRODUCT_NAME}\*.*"

  Delete "$DESKTOP\$(TEXT_ENTRY).lnk"

  ; Remove directories used
  RMDir "$SMPROGRAMS\EntryLabs\${PRODUCT_NAME}"
  RMDir /r "$INSTDIR"

  ; Remove roaming/entry_hw directory for next version's localStorage
  RMDir /r "$PROFILE\AppData\Roaming\entry_hw"
SectionEnd

Function LaunchLink
  Exec "${APP_NAME}"
FunctionEnd

Function .onInit
  ${IfNot} ${RunningX64}
    MessageBox MB_OK|MB_ICONSTOP $(SETUP_REQUIRE_64BIT_MSG)
    Abort
  ${EndIf}

  FindProcDLL::FindProc "${APP_NAME}"
  StrCmp $R0 1 mfound notRunning
  mfound:
	KillProcDLL::KillProc "${APP_NAME}"
  notRunning:

  ReadRegStr $R0 HKLM \
  "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}" \
  "UninstallString"
  StrCmp $R0 "" done

  ReadRegStr $R1 HKLM "SOFTWARE\${PRODUCT_NAME}" "Install_Dir"
  StrCmp $R1 "" done

  MessageBox MB_OKCANCEL|MB_ICONEXCLAMATION \
  $(SETUP_UNINSTALL_MSG) \
  IDOK uninst
  Abort

  ;Run the uninstaller
  uninst:
    ClearErrors
    ;ExecWait '$R0 _?=$INSTDIR'
    ExecWait '$R0 _?=$R1'

    ;IfErrors no_remove_uninstaller done
    ;no_remove_uninstaller:
    IfErrors 0 +2
	  Goto no_remove_uninstaller
	  RMDir /r /REBOOTOK $R1
	  Goto done

  no_remove_uninstaller:
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${PRODUCT_NAME}"
    DeleteRegKey HKLM "SOFTWARE\${PRODUCT_NAME}"
    DeleteRegKey HKCR "${PRODUCT_NAME}"
    DeleteRegKey HKCR "${PROTOCOL_NAME}"

  done:

FunctionEnd
