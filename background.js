﻿"use strict";

(function () {

	const IS_BUTTON_ON_ADDRESSBAR = false;				// Determine position of lizard button, address bar or toolbar (page action or browser action).

	const BROWSER_ACTION_IMAGE_PATHS = {
		32: "icons/lizard-32.png",
		48: "icons/lizard-48.png"
	};

	const BROWSER_ACTION_GRAY_IMAGE_PATHS = {
		32: "icons/lizard-gray-32.png",
		48: "icons/lizard-gray-48.png"
	};

	const PAGE_ACTION_IMAGE_PATHS = {
		19: "icons/lizard-19.png",
		38: "icons/lizard-38.png"
	};

	const PAGE_ACTION_GRAY_IMAGE_PATHS = {
		19: "icons/lizard-gray-19.png",
		38: "icons/lizard-gray-38.png"
	};

	const WTF_IMAGE_PATH = { 48: "icons/lizard-wtf-48.png" };


	let lizardToggleStateMenuID = -1;

	//////////////////////////////////////////////////////////////////////
	// Lizard button
	if (IS_BUTTON_ON_ADDRESSBAR === true) {

		// Page action button

		browser.tabs.onUpdated.addListener(function (id, changeInfo, tab) {
			browser.pageAction.show(tab.id)
		});

		browser.pageAction.onClicked.addListener((tab) => {
			sendToggleLizardStateMessage(tab.id);
		});
	} else {

		// Toolbar button

		browser.browserAction.onClicked.addListener((tab) => {
			sendToggleLizardStateMessage(tab.id);
		});
	}

	//////////////////////////////////////////////////////////////////////
	// Menus
	lizardToggleStateMenuID = browser.menus.create({
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

			case prefs.MSG_LIZARD_STATE_CHANGED:
				updateLizardUI(message.data.status);
				break;
				//////////////////////////////////////////////////////////////

			case prefs.MSG_LIZARD_DISPLAY_NOTIF:
				createLizardNotification(message.data.message, message.data.timeout);
				break;
				//////////////////////////////////////////////////////////////

			case prefs.MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW:
				let popupURL = browser.extension.getURL("viewSource/viewSource.html");

				browser.windows.create({
					url: popupURL,
					titlePreface: "View " + "aa" + " ", //message.data.type.toUpperCase()
					type: "popup",
					allowScriptsToClose: true,
					height: 350,
					width: 680
				});
				break;
				//////////////////////////////////////////////////////////////
		}
	});

	//////////////////////////////////////////////////////////////////////
	// 
	function updateLizardUI(status) {

		let action = "Start";
		let title = "Lizard [OFF]";
		let browserActionImagePaths = BROWSER_ACTION_GRAY_IMAGE_PATHS;
		let pageActionImagePaths = PAGE_ACTION_GRAY_IMAGE_PATHS;

		if (status === "on") {
			action = "Stop"
			title = "Lizard [ON]";
			browserActionImagePaths = BROWSER_ACTION_IMAGE_PATHS;
			pageActionImagePaths = PAGE_ACTION_IMAGE_PATHS;
		} else if (status !== "off") {
			action = "wtf";
			title = "Lizard - wtf just happened???";
			browserActionImagePaths = pageActionImagePaths = WTF_IMAGE_PATH;
		}

		browser.menus.update(lizardToggleStateMenuID, { title: `${action} Lizard Session` });	// menu item

		let getting = browser.tabs.query({ active: true, currentWindow: true });
		getting.then((tabs) => {
			if (IS_BUTTON_ON_ADDRESSBAR === true) {
				browser.pageAction.setTitle({ tabId: tabs[0].id, title: title });
				browser.pageAction.setIcon({ tabId: tabs[0].id, path: pageActionImagePaths });
			} else {
				browser.browserAction.setTitle({ tabId: tabs[0].id, title: title });
				browser.browserAction.setIcon({ tabId: tabs[0].id, path: browserActionImagePaths });
			}
		});	
	}

	//////////////////////////////////////////////////////////////////////
	// 
	function createLizardNotification(message, timeout) {

		let eventTime = Date.now();
		let notifId = "lizard-notification-" + eventTime;

		browser.notifications.create(notifId, {
			"type": "basic",
			"title": "Lizard - Web Extension",
			"eventTime": eventTime,					// no idea what it's good for
			"message": message
		});
		setTimeout(function () { browser.notifications.clear(notifId); }, timeout);
	}

	//////////////////////////////////////////////////////////////////////
	// 
	function sendToggleLizardStateMessage(tabId) {
		browser.tabs.sendMessage(tabId, { action: prefs.ACTION_MSG_LIZARD_TOGGLE_STATE });
	}

	//////////////////////////////////////////////////////////////////////
	// 
	function reloadLizardWebExtension() {
		browser.runtime.reload();
	}

})();
