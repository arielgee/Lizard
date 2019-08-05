Done
--------------
* Show menu from onContextMenu (not onClick). Since Fx v68 behavior of onClick has changed: fireing only for the primary button and not for ANY mouse button
    * https://bugzilla.mozilla.org/show_bug.cgi?id=1379466
    * NOTE: Still checking the button value in onClick to support old versions.


To-Do
--------------
* handle new preferences layout for new Fx version - remove 'Options' caption and first seperator line
* fix menu outside view port when right click is near buttom window edge
