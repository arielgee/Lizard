"use strict";

(function () {

	const BROWSER_ACTION_IMAGE_PATHS = {
		32: "icons/lizard-32.png",
		48: "icons/lizard-48.png",
	};

	const BROWSER_ACTION_GRAY_IMAGE_PATHS = {
		32: "icons/lizard-gray-32.png",
		48: "icons/lizard-gray-48.png",
	};

	const WTF_IMAGE_PATH = { 48: "icons/lizard-wtf-48.png" };

	const VIEW_SOURCE_PAGE = "viewSource/viewSource.html";

	const DEF_NOTIFICATION_TIMEOUT = 4300;

	const PAGE_CONTEXT = ["audio", "editable", "image", "link", "page", "password", "selection", "video"];
	const TOOLS_MENU_CONTEXT = ["tools_menu"];

	let lizardToggleStateMenuID = -1;

	let lastInjectTime = 0;

	//////////////////////////////////////////////////////////////////////
	// Lizard version update
	browser.runtime.onInstalled.addListener((details) => {

		let thisVersion = browser.runtime.getManifest().version;

		prefs.getVersionNotice().then((verNotice) => {
			if(details.reason === "update" && verNotice === "" && (lzUtil.versionNumericCompare(details.previousVersion, thisVersion) < 0)) {

				// Once a version notice was displayed the pref is set to an empty string.
				// So set the version notice only if the extension was updated
				// AND the previous version notice was displayed
				// AND the new version is bigger then the previous one.
				prefs.setVersionNotice(details.previousVersion);
			}
		});
	});

	//////////////////////////////////////////////////////////////////////
	// Lizard toolbar button
	browser.browserAction.onClicked.addListener((tab) => {
		sendToggleLizardStateMessage(tab);
	});

	//////////////////////////////////////////////////////////////////////
	// Menus
	prefs.getMenuItemContext().then((inContext) => {
		prefs.getMenuItemTools().then((inTools) => {

			let menus_contexts = (inContext ? PAGE_CONTEXT : []).concat(inTools ? TOOLS_MENU_CONTEXT : []);

			if(menus_contexts.length > 0) {
				lizardToggleStateMenuID = browser.menus.create({
					id: "mnu-toggle-lizard-state",
					title: "Start Lizard Session",
					command: "_execute_browser_action",
					contexts: menus_contexts,
				});
			}
		});
	});

	browser.menus.create({
		id: "mnu-reload-lizard-extension",
		title: "Reload Lizard Extension",
		contexts: ["browser_action"],
	});

	browser.menus.create({
		id: "mnu-open-options-page",
		title: "Open Options Page",
		contexts: ["browser_action"],
	});

	browser.menus.onClicked.addListener(function (info, tab) {
		switch (info.menuItemId) {
			case "mnu-reload-lizard-extension":		lzUtil.reloadLizardWebExtension();		break;
			case "mnu-open-options-page":			browser.runtime.openOptionsPage();		break;
		}
	});

	//////////////////////////////////////////////////////////////////////
	// firefox commands (keyboard)
	browser.commands.onCommand.addListener(function (command) {

		switch (command) {

			case "kb-toggle-lizard-state":
				browser.tabs.query({ currentWindow: true, active: true }).then((tabs) => {
					sendToggleLizardStateMessage(tabs[0]);
				});
				break;
				//////////////////////////////////////////////////////////////

			case "kb-reload-lizard-extension":
				lzUtil.reloadLizardWebExtension();
				break;
				//////////////////////////////////////////////////////////////

		}
	});

	//////////////////////////////////////////////////////////////////////
	// Handle messages from content script
	browser.runtime.onMessage.addListener((message) => {

		switch (message.type) {

			case msgs.MSG_SESSION_STATE_CHANGED:
				updateLizardUI(message.data.status);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.MSG_DISPLAY_NOTIFICATION:
				createLizardNotification(message.data.message, message.data.timeout);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.MSG_OPEN_VIEW_SOURCE_WINDOW:
				openViewSourcePage(message.data.type, message.data.id, true);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.MSG_OPEN_VIEW_SOURCE_TAB:
				openViewSourcePage(message.data.type, message.data.id, false);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.MSG_OPEN_OPTIONS_PAGE:
				browser.runtime.openOptionsPage();
				break;
				//////////////////////////////////////////////////////////////

		}
	});

	//////////////////////////////////////////////////////////////////////
	//
	function sendToggleLizardStateMessage(tab) {

		if( tab.url === undefined || !(tab.url.match(/^(http|https|file|ftp):\/\//)) ) {
			createLizardNotification("Lizard can't work here.");
			return;
		}

		browser.tabs.sendMessage(tab.id, { message: msgs.MSG_TOGGLE_SESSION_STATE }).catch(() => {

			// This is UGLY but it works. if the user double clicks (2 very fast clicks) on the lizard button (or the keyboard command) the
			// injectLizardScripts() is called twice and an error is raised due to the redeclaration and onErrorToggleSessionState() is called.
			if ((Date.now() - lastInjectTime) > 500) {

				// scripts were not injected

				lastInjectTime = Date.now();

				injectLizardScripts(tab).then(() => {
					console.log("[lizard]", "Injection time(millisec):", Date.now()-lastInjectTime);
					browser.tabs.sendMessage(tab.id, { message: msgs.MSG_TOGGLE_SESSION_STATE }).catch(onErrorToggleSessionState);
				}, onErrorToggleSessionState);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onErrorToggleSessionState(err) {
		console.log("[lizard]", "Toggle session state", err);
		createLizardNotification("Failed to inject extension's scripts!\nIs this an 'addons.mozilla.org' or 'testpilot.firefox.com' page?", 7000);
		updateLizardUI("wtf");
	}

	//////////////////////////////////////////////////////////////////////
	//
	function injectLizardScripts(tab) {

		return new Promise((resolve, reject) => {

			let runAt = "document_start";

			// Ordered by file size. The larger one first.
			let injecting1 = browser.tabs.executeScript(tab.id, { file: "SourceBeautifier/SourceBeautifier.js", runAt: runAt });
			let injecting2 = browser.tabs.executeScript(tab.id, { file: "content.js", runAt: runAt });
			let injecting3 = browser.tabs.executeScript(tab.id, { file: "common.js", runAt: runAt });
			let injecting4 = browser.tabs.insertCSS(tab.id, { file: "content.css", runAt: runAt });
			let injecting5 = browser.tabs.executeScript(tab.id, { file: "CssSelectorGenerator/CssSelectorGenerator.js", runAt: runAt });
			let injecting6 = browser.tabs.executeScript(tab.id, { code: "const ALL_LIZARD_SCRIPTS_INJECTED=true;", runAt: runAt });

			injecting1.then(() => {
				injecting2.then(() => {
					injecting3.then(() => {
						injecting4.then(() => {
							injecting5.then(() => {
								injecting6.then(() => {

									resolve();

								}, (err) => { reject(new Error("Inject code 'const ALL_LIZARD_SCRIPTS_INJECTED=true;', " + err.message)); });
							}, (err) => { reject(new Error("Inject file 'CssSelectorGenerator.js', " + err.message)); });
						}, (err) => { reject(new Error("Inject file 'content.css', " + err.message)); });
					}, (err) => { reject(new Error("Inject file 'common.js', " + err.message)); });
				}, (err) => { reject(new Error("Inject file 'content.js', " + err.message)); });
			}, (err) => { reject(new Error("Inject file 'SourceBeautifier.js', " + err.message)); });
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function updateLizardUI(status) {

		let action = "Start";
		let title = "Lizard [OFF]";
		let browserActionImagePaths = BROWSER_ACTION_GRAY_IMAGE_PATHS;

		if (status === "on") {
			action = "Stop"
			title = "Lizard [ON]";
			browserActionImagePaths = BROWSER_ACTION_IMAGE_PATHS;
		} else if (status !== "off") {
			action = "wtf";
			title = "WTF Just Happened?!\n\nCtrl+Shift+Down to reload Lizard.";
			browserActionImagePaths = WTF_IMAGE_PATH;
		}

		browser.menus.update(lizardToggleStateMenuID, { title: action + " Lizard Session" });	// menu item

		let getting = browser.tabs.query({ active: true, currentWindow: true });
		getting.then((tabs) => {
			let tabId = tabs[0].id;
			browser.browserAction.setTitle({ tabId: tabId, title: title });
			browser.browserAction.setIcon({ tabId: tabId, path: browserActionImagePaths });
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function createLizardNotification(message, timeout = DEF_NOTIFICATION_TIMEOUT) { // ES6: default parameter value part of JS

		let notifId = "lizard-" + window.btoa(message);

		// prevent displaying the same notification again and again
		browser.notifications.clear(notifId);

		browser.notifications.create(notifId, {
			"type": "basic",
			"title": "Lizard - Web Extension",
			"eventTime": Date.now(),					// no idea what it's good for
			"message": message,
		});
		setTimeout(function () { browser.notifications.clear(notifId); }, timeout);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function openViewSourcePage(type, id, newWindow) {

		let viewSourceURL = browser.extension.getURL(VIEW_SOURCE_PAGE) + "?id=" + id;

		if (newWindow) {
			browser.windows.create({
				url: viewSourceURL,
				type: "popup",
				allowScriptsToClose: true,
				height: 350,
				width: 700,
			});
		} else {

			let getting = browser.tabs.query({ active: true, currentWindow: true });
			getting.then((tabs) => {
				browser.tabs.create({
					url: viewSourceURL,
					index: (tabs[0].index)+1,
				});
			});
		}
	}

})();
