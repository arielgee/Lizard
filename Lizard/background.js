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

	// Ordered by file size. The larger one first.
	const INJECTABLE = [
		"SourceBeautifier/SourceBeautifier.js",
		"content.js",
		"common.js",
		"content.css",
		"CssSelectorGenerator/CssSelectorGenerator.js",
		"const ALL_LIZARD_SCRIPTS_INJECTED=true;",
	];

	let m_lizardToggleStateMenuID = -1;
	let m_lastInjectTime = 0;

	let m_lizardDB;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {

		createMenus();

		browser.runtime.onMessage.addListener(onRuntimeMessage);				// Messages handler
		browser.runtime.onInstalled.addListener(onRuntimeInstalled);			// version notice
		browser.browserAction.onClicked.addListener(onBrowserActionClicked);	// send toggle Lizard state message
		browser.menus.onClicked.addListener(onMenusClicked);					// menus
		browser.commands.onCommand.addListener(onCommands);						// keyboard

		browser.tabs.onUpdated.addListener(onTabsUpdated);		// Fx61 => extraParameters; {url:["*://*/*"], properties:["status"]}
		browser.tabs.onAttached.addListener(onTabsAttached);


		m_lizardDB = new LizardDB();
		m_lizardDB.open().then(async () => {
			const rules = [
				[ "www.ynet.co.il/home/0,7340,L-8,00.html", ".ad_anoy" ],
				[ "www.multisend.co.il/site/login", ".fu.bar.id" ],
				[ "www.urlencoder.org/", "div[disabled]" ],
				[ "www.makorrishon.co.il/", "#region" ],
				[ "www.ynet.co.il/home/0,7340,L-8,00.html", ".ad_anoy" ],
				[ "www.multisend.co.il/site/login", ".fu.bar.id" ],
				[ "www.urlencoder.org/", "div[disabled]" ],
				[ "www.makorrishon.co.il/", "#region" ],
				[ "file:///c:/Users/arielg/DevWork/WebExtensions/Lizard/.misc/Example.html", ".\\[object"],

				[ "www.ynet.co.il/home/0,7340,L-8,00.html", ".ad_anoy-PLUS" ],
				[ "www.multisend.co.il/site/login", ".fu.bar.id-PLUS" ],
				[ "www.urlencoder.org", "div[disabled]-PLUS" ],
				[ "www.makorrishon.co.il", "#region-PLUS" ],
			];

			for(let i=0; i<rules.length; i++) {
				await m_lizardDB.setRule(rules[i][0], rules[i][1], { remove: true, color: {frgd: "#ff0000", bkgd: "#00ffff"} });
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeInstalled(details) {

		// VersionNotice

		prefs.getVersionNotice().then((verNotice) => {

			let thisVersion = browser.runtime.getManifest().version;

			if(details.reason === "update" && verNotice === "" && (lzUtil.versionNumericCompare(details.previousVersion, thisVersion) < 0)) {

				// Once a version notice was displayed the pref is set to an empty string.
				// So set the version notice only if the extension was updated
				// AND the previous version notice was displayed
				// AND the new version is bigger then the previous one.
				prefs.setVersionNotice(details.previousVersion);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onBrowserActionClicked(tab) {
		sendToggleLizardStateMessage(tab);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMenusClicked(info, tab) {
		switch (info.menuItemId) {
			case "mnu-reload-lizard-extension":		lzUtil.reloadLizardWebExtension();		break;
			case "mnu-open-options-page":			browser.runtime.openOptionsPage();		break;
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onCommands(command) {

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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsUpdated(tabId, changeInfo, tab) {
		// When selecting an open tab that was not loaded (browser just opened) then changeInfo is {status: "complete", url: "https://*"}
		// but the page is not realy 'complete'. Then the page is loading and when complete then there is not 'url' property. Hence !!!changeInfo.url
		if (!!changeInfo.status && changeInfo.status === "complete" && !!!changeInfo.url) {
			handleTabChangedState(tabId, tab.url);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onTabsAttached(tabId) {
		browser.tabs.get(tabId).then((tab) => {
			handleTabChangedState(tabId, tab.url);
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createMenus() {

		prefs.getMenuItemContext().then((inContext) => {
			prefs.getMenuItemTools().then((inTools) => {

				let menus_contexts = (inContext ? PAGE_CONTEXT : []).concat(inTools ? TOOLS_MENU_CONTEXT : []);

				if(menus_contexts.length > 0) {
					m_lizardToggleStateMenuID = browser.menus.create({
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

		lzUtil.getBrowserVersion().then((version) => {
			if(parseInt(version) < 62) {
				browser.menus.create({
					id: "mnu-open-options-page",
					title: "Open Options Page",
					contexts: ["browser_action"],
				});
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sendToggleLizardStateMessage(tab) {

		if( tab.url === undefined || !(tab.url.match(/^(http|https|file|ftp):\/\//)) ) {
			createLizardNotification("Lizard can't work here.");
			return;
		}

		browser.tabs.sendMessage(tab.id, { message: msgs.MSG_TOGGLE_SESSION_STATE }).then((response) => {

			// In the situation where the scripts were injected but the user lateron browsed to a
			// different page using the same tab, there are *some* cases that the sendMessage() Promise
			// will not reject (fail) but instead will resolve with an undefined response.

			// Assumption: the runtime onMessage Listener is still registered in the tab but the
			// handler function no longer exists in the content so Promise is resolved with "undefined".

			// Throwing an error here will execute the sendMessage()'s reject() function and the
			// injectLizardScripts() function will be executed for the new page.
			if(response === undefined) throw new Error("Receiving end is not responding.");

		}).catch((error) => {

			//console.log("[Lizard]", error);

			// This is UGLY but it works. if the user double clicks (2 very fast clicks) on the lizard button (or the keyboard command) the
			// injectLizardScripts() is called twice and an error is raised due to the redeclaration and onErrorToggleSessionState() is called.
			if ((Date.now() - m_lastInjectTime) > 500) {

				// scripts were not injected

				m_lastInjectTime = Date.now();

				injectLizardScripts(tab).then(() => {
					console.log("[lizard]", "Injection time(millisec):", Date.now()-m_lastInjectTime);
					browser.tabs.sendMessage(tab.id, { message: msgs.MSG_TOGGLE_SESSION_STATE }).catch(onErrorToggleSessionState);
				}, onErrorToggleSessionState);
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onErrorToggleSessionState(err) {
		console.log("[lizard]", "Toggle session state", err);
		createLizardNotification("Failed to inject extension's scripts!\nIs this an 'addons.mozilla.org' or 'testpilot.firefox.com' page?", 7000);
		updateLizardUI("wtf");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function injectLizardScripts(tab) {

		return new Promise((resolve, reject) => {

			// Ordered by file size. The larger one first.
			let injecting0 = browser.tabs.executeScript(tab.id, { runAt: "document_start", file: INJECTABLE[0]});
			let injecting1 = browser.tabs.executeScript(tab.id, { runAt: "document_start", file: INJECTABLE[1]});
			let injecting2 = browser.tabs.executeScript(tab.id, { runAt: "document_start", file: INJECTABLE[2]});
			let injecting3 = browser.tabs.insertCSS(	tab.id, { runAt: "document_start", file: INJECTABLE[3]});
			let injecting4 = browser.tabs.executeScript(tab.id, { runAt: "document_start", file: INJECTABLE[4]});
			let injecting5 = browser.tabs.executeScript(tab.id, { runAt: "document_start", code: INJECTABLE[5]});

			injecting0.then(() => {
				injecting1.then(() => {
					injecting2.then(() => {
						injecting3.then(() => {
							injecting4.then(() => {
								injecting5.then(() => {

									resolve();

								}, err => reject(new Error("Inject code '" + INJECTABLE[5] + "', " + err.message)) );
							}, err => reject(new Error("Inject file '" + INJECTABLE[4] + "', " + err.message)) );
						}, err => reject(new Error("Inject file '" + INJECTABLE[3] + "', " + err.message)) );
					}, err => reject(new Error("Inject file '" + INJECTABLE[2] + "', " + err.message)) );
				}, err => reject(new Error("Inject file '" + INJECTABLE[1] + "', " + err.message)) );
			}, err => reject(new Error("Inject file '" + INJECTABLE[0] + "', " + err.message)) );
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
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

		browser.menus.update(m_lizardToggleStateMenuID, { title: action + " Lizard Session" });	// menu item

		let getting = browser.tabs.query({ active: true, currentWindow: true });
		getting.then((tabs) => {
			let tabId = tabs[0].id;
			browser.browserAction.setTitle({ tabId: tabId, title: title });
			browser.browserAction.setIcon({ tabId: tabId, path: browserActionImagePaths });
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
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

	////////////////////////////////////////////////////////////////////////////////////
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

	////////////////////////////////////////////////////////////////////////////////////
	function handleTabChangedState(tabId, tabUrl) {

		m_lizardDB.getRules(tabUrl.toString()).then((rules) => {

			console.log("[Lizard]", "result", rules);

			for(let i=0, len=rules.length; i<len; i++) {

				let code = "";
				if(rules[i].remove) {
					code = rules[i].cssSelector + " {display: none !important;}";
				}

				browser.tabs.insertCSS(tabId, { runAt: "document_start", code: code });
			}
		} );
	}
})();
