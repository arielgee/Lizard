"use strict";

console.log("[lizard] -- background.js --");


let g_lizardTaggleStateMenuID = -1;

browser.browserAction.setBadgeBackgroundColor({ color: [50, 205, 50, 128] });		// LimeGreen; fix color

//////////////////////////////////////////////////////////////////////
// Toolbar button
browser.browserAction.onClicked.addListener((tab) => {
	sendToggleLizardStateMessage(tab.id);
});

//////////////////////////////////////////////////////////////////////
// Menus
g_lizardTaggleStateMenuID = browser.menus.create({
	id: "mnu-toggle-lizard-state",
	title: "Start Lizard Session",
	command: "_execute_browser_action",
	contexts: ["tools_menu", "page", "link", "image", "selection", "video", "frame"]
});

browser.menus.create({
	id: "mnu-reload-lizard-extension",
	title: "Reload Lizard Extension",
	contexts: ["browser_action"]
});

browser.menus.onClicked.addListener(function (info, tab) {
	if (info.menuItemId == "mnu-reload-lizard-extension") {
		reloadLizardWebExtension();
	}
});

//////////////////////////////////////////////////////////////////////
// firefox commands (keyboard)
browser.commands.onCommand.addListener(function (command) {

	if (command == "kb-toggle-lizard-state") {
		browser.tabs.query({ currentWindow: true, active: true })
			.then((tabs) => { sendToggleLizardStateMessage(tabs[0].id); });
	} else if (command == "kb-reload-lizard-extension") {
		reloadLizardWebExtension();
	}
});

//////////////////////////////////////////////////////////////////////
// Handle messages from content script
browser.runtime.onMessage.addListener((message) => {

	switch (message.type) {

		case MSG_LIZARD_STATE_CHANGED: {

			let badge = "";
			let action = "Start";

			if (message.data.status === "on") {
				badge = "✓";					// Dingbat - checkmark / String.fromCharCode(10697)
				action = "Stop"
			} else if (message.data.status !== "off") {
				badge = action = "wtf";
			}

			browser.browserAction.setBadgeText({ text: badge });									// toolbar button
			browser.menus.update(g_lizardTaggleStateMenuID, { title: `${action} Lizard Session` });	// menu item
		}
			break;
			//////////////////////////////////////////////////////////////
	}
});

//////////////////////////////////////////////////////////////////////
// 
function sendToggleLizardStateMessage(tabId) {
	browser.tabs.sendMessage(tabId, { action: ACTION_MSG_LIZARD_TOGGLE_STATE });
}

//////////////////////////////////////////////////////////////////////
// 
function reloadLizardWebExtension() {
	browser.runtime.reload();
}