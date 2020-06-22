## Done
--------------
* Show menu from onContextMenu (not onClick). Since Fx v68 behavior of onClick has changed: fireing only for the primary button and not for ANY mouse button
    * https://bugzilla.mozilla.org/show_bug.cgi?id=1379466
    * NOTE: Still checking the button value in onClick to support old versions.
* Remove the 'Options' caption in preferences for Fx v68 and up. Page layout was changed and the caption is redundent.
* fix menu outside view port when right click is near buttom window edge
* remove the 'Open Options Page' from toolbar menu for Fx vXX and up. Mozilla added the 'Manage Extension'  => NO! In v68 the 'Manage Extension' opens the Details tab and not the 'Options'
---

## To-Do
--------------
* handle return Promise from prefs functions
* change preference on click anywhere
* remove the showVersionNotice ???
* preferences dark mode
* duplicate 'manage Extension' / 'Open Option page' in left mouse browserAction button
* Implemented Debouncer to prevent double injectLizardScripts() in sendToggleLizardStateMessage()
* I Fucked Up: I Forgot about showVersionNotice() in version 1.11 (nothing to do, just a note for next version)

## REMEMBER: Update showVersionNotice() For Each New Version!