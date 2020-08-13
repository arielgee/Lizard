## Done
--------------
* Show menu from onContextMenu (not onClick). Since Fx v68 behavior of onClick has changed: fireing only for the primary button and not for ANY mouse button
	* https://bugzilla.mozilla.org/show_bug.cgi?id=1379466
	* NOTE: Still checking the button value in onClick to support old versions.
* Remove the 'Options' caption in preferences for Fx v68 and up. Page layout was changed and the caption is redundent.
* fix menu outside view port when right click is near buttom window edge
* remove the 'Open Options Page' from toolbar menu for Fx vXX and up. Mozilla added the 'Manage Extension'  => NO! In v68 the 'Manage Extension' opens the Details tab and not the 'Options'
* change preference on click anywhere
* preferences dark mode
* lizard box not visible in https://docs.tibco.com/...      => FRAMES!!!
* staring session in tab then browsing to anther address and a new session will not start		=> fixed
* duplicate 'manage Extension' / 'Open Option page' in left mouse browserAction button		=> 'Open Option page' only if browser version is below v62
* the view-CSS-selector is not acting like the view-source. Shows only in-page and not affected by new-window or new-tab		=> leave it like that
* manifest.json; Rename `applications` to `browser_specific_settings` https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json
* the onRuntimeMessage in background.js and in content.js are not the same. consider moving BROWSER_MESSAGE() to common.js for both 'runtime.onMessage'
* remove rule from Db if action was undo
* check what webNavigation permission gives
* rename 'handleWebNavigationOnCommittedListener' to handleRememberPageAlterationsFromPreferences
* check if undo /deleteRule works
* switching to 'Example.html' tab (not selected) after Fx load I get 'Uncaught (in promise) Error: Missing host permission for the tab'. Am i injecting or something into the tab too soon?
* in common.js replace the two apply filter functions with a single one (_applyFilter())
* all indexedDB actions will be done in background by background
* try to hide the element without indexedDB. to compare and see how fast is the indexedDB queries
---

## REMEMBER: Update showVersionNotice() For Each New Version!

## To-Do
--------------
* indexedDB
	* v59 - not working
	* v68 - working
* create a managment page for rules
* the rememberPageAlterations preference will indicate that the feature is available to sertine Fx version (and will be disabled if not)
* when using element.children there is no need to check for: nodeType === Node.ELEMENT_NODE. there are ALL elements. (seee: _deWidthify)
* externilize the CssSelectorGenerator options?
* use webNavigation in sage-like ?
* if url has additinal parameters (#striped)
* in content use member variable for CssSelectorGenerator() to save the repeting 'new'
* change communication method between content and background:https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#Communicating_with_background_scripts
* what is the point of the empty object in this: 'Object.assign({},...'
* work in private browsing ? private browsing in min AND amx version ?
* min version in manifest is v56. I'm using v59. I created VScroll buttons for view-source in window but it HAS VScroll? will it have them in v56?
* "remember" the changes!!!
* handle return Promise from prefs functions
* remove the showVersionNotice ???
* Implemented Debouncer to prevent double injectLizardScripts() in sendToggleLizardStateMessage()
* I Fucked Up: I Forgot about showVersionNotice() in version 1.11 (nothing to do, just a note for next version)
