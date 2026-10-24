; NSIS Installer script for Luminary
; Custom installation steps

!macro customInstall
  ; Create data directory for SQLite database
  CreateDirectory "$LOCALAPPDATA\Luminary"
  CreateDirectory "$LOCALAPPDATA\Luminary\data"
  CreateDirectory "$LOCALAPPDATA\Luminary\media"
  CreateDirectory "$LOCALAPPDATA\Luminary\backups"
!macroend

!macro customUnInstall
  ; Optional: Remove data directory on uninstall
  ; MessageBox MB_YESNO "Remove all Luminary data?" IDNO skipRemove
  ; RMDir /r "$LOCALAPPDATA\Luminary"
  ; skipRemove:
!macroend
