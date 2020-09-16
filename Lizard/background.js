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

	const DEF_NOTIFICATION_TIMEOUT = 4300;

	const PAGE_CONTEXT = ["audio", "editable", "image", "link", "page", "password", "selection", "video"];
	const TOOLS_MENU_CONTEXT = ["tools_menu"];

	const INJECTABLE = [
		{ isScript: true,	details: { runAt: "document_start", file: "SourceBeautifier/SourceBeautifier.js" } },
		{ isScript: true,	details: { runAt: "document_start", file: "CssSelectorGenerator/CssSelectorGenerator.js" } },
		{ isScript: true,	details: { runAt: "document_start", file: "common.js" } },
		{ isScript: false,	details: { runAt: "document_start", file: "content.css" } },
		{ isScript: true,	details: { runAt: "document_start", file: "content.js" } },
		{ isScript: true,	details: { runAt: "document_start", code: "const ALL_LIZARD_SCRIPTS_INJECTED=true;" } },
	];

	const WEB_NAV_FILTER = {
		url: [
			{ schemes: ["https", "http", "file", "ftp"] }
		]
	};

	const WEB_NAV_USER_TRANSITION_TYPES = [ "link", "typed", "reload", "generated", "form_submit", "manual_subframe" ];

	let m_lizardToggleStateMenuID = -1;
	let m_lastInjectTime = 0;

	let m_webNavJumpToElement = {
		windowId: -1,
		tabId: -1,
		cssSelector: "",
		tabIdReusedElementHighlight: -1,
	};

	let m_webNavReloadWithoutAlterations = {
		windowId: -1,
		tabId: -1,
	}
	let m_lizardDB = null;

	let m_rememberPageAlterationsMenusCreated = false;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	async function initialization() {

		createMenus();

		browser.runtime.onMessage.addListener(onRuntimeMessage);							// Messages handler
		browser.runtime.onInstalled.addListener(onRuntimeInstalled);						// version notice
		browser.browserAction.onClicked.addListener(onBrowserActionClicked);				// send toggle Lizard state message
		browser.menus.onClicked.addListener(onMenusClicked);								// menus
		browser.commands.onCommand.addListener(onCommands);									// keyboard

		await lzUtil.unsupportedExtensionFeatures();
		handleRememberPageAlterationsFromPreference();										// apply rules
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onRuntimeMessage(message) {

		switch (message.id) {

			case msgs.ID_SESSION_STATE_CHANGED:
				updateLizardUI(message.data.status);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_DISPLAY_NOTIFICATION:
				createLizardNotification(message.data.message, message.data.timeout);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_OPEN_VIEW_SOURCE_WINDOW:
				openViewSourcePage(message.data.id, true);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_OPEN_VIEW_SOURCE_TAB:
				openViewSourcePage(message.data.id, false);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_OPEN_OPTIONS_PAGE:
				browser.runtime.openOptionsPage();
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_TOGGLE_REMEMBER_PAGE_ALTERATIONS:
				handleRememberPageAlterationsFromPreference();
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_SAVE_ACTIONS_AS_RULES:
				saveActionsAsRules(message.data.url, message.data.rules);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_UNSET_RULE_DETAIL:
				m_lizardDB.unsetRuleDetail(message.data.url, message.data.cssSelector, message.data.detail);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_UPDATE_RULE_STATS:
				m_lizardDB.updateRuleStats(message.data.url, message.data.cssSelector);
				break;
				//////////////////////////////////////////////////////////////

			case msgs.ID_JUMP_TO_ELEMENT:
				jumpToElement(message.data.url, message.data.cssSelector, message.data.newTab, message.data.newWin);
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
			case "mnu-reload-page-wo-alterations":	reloadPageWithoutAlterations();			break;
			case "mnu-reload-lizard-extension":		lzUtil.reloadLizardWebExtension();		break;
			case "mnu-open-lizard-options":			browser.runtime.openOptionsPage();		break;
			case "mnu-manage-alterations-rules":	lzUtil.openRulesDashboard();			break;
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

			case "kb-reload-page-wo-alterations":
				reloadPageWithoutAlterations();
				break;
				//////////////////////////////////////////////////////////////

			case "kb-manage-alterations-rules":
				lzUtil.openRulesDashboard();
				break;
				//////////////////////////////////////////////////////////////
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onWebNavCommitted(details) {

		if(details.windowId === m_webNavJumpToElement.windowId && details.tabId === m_webNavJumpToElement.tabId) {

			// clear ids for next web navigation
			m_webNavJumpToElement.windowId = m_webNavJumpToElement.tabId = -1;

			highlightElement(details.tabId, m_webNavJumpToElement.cssSelector);

		} else if(details.windowId === m_webNavReloadWithoutAlterations.windowId && details.tabId === m_webNavReloadWithoutAlterations.tabId) {

			// clear ids for next web navigation
			m_webNavReloadWithoutAlterations.windowId = m_webNavReloadWithoutAlterations.tabId = -1;

		} else {

			applySavedRules(details.tabId, details.url.toString());

			// tabIdReusedElementHighlight: tab used and reused by jump-to-element to highlightElement()
			// if tab is used for any user initiated navigation then stop reusing it
			if(details.tabId === m_webNavJumpToElement.tabIdReusedElementHighlight && WEB_NAV_USER_TRANSITION_TYPES.includes(details.transitionType)) {
				m_webNavJumpToElement.tabIdReusedElementHighlight = -1;
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function handleRememberPageAlterationsFromPreference() {

		let rememberPageAlters = await prefs.getRememberPageAlterations();
		let hasWebNavListener = browser.webNavigation.onCommitted.hasListener(onWebNavCommitted);

		if(rememberPageAlters && !hasWebNavListener) {

			if(!!!m_lizardDB) m_lizardDB = new LizardDB();
			m_lizardDB.open();

			browser.webNavigation.onCommitted.addListener(onWebNavCommitted, WEB_NAV_FILTER);

		} else if(!rememberPageAlters && hasWebNavListener) {

			if(!!m_lizardDB) m_lizardDB.close();
			m_lizardDB = null;

			browser.webNavigation.onCommitted.removeListener(onWebNavCommitted, WEB_NAV_FILTER);
		}

		if(m_rememberPageAlterationsMenusCreated) {
			const updateProps = { enabled: rememberPageAlters, visible: rememberPageAlters };
			browser.menus.update("mnu-reload-page-wo-alterations", updateProps);
			browser.menus.update("mnu-manage-alterations-rules", updateProps);
			browser.menus.update("mnu-separator-remember-page-alterations", updateProps);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createMenus() {

		let menus_contexts;

		prefs.getMenuItemContext().then((inContext) => {
			prefs.getMenuItemTools().then((inTools) => {

				menus_contexts = (inContext ? PAGE_CONTEXT : []).concat(inTools ? TOOLS_MENU_CONTEXT : []);

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

		lzUtil.unsupportedExtensionFeatures().then(async (unsupportedFeatures) => {

			// all but the last create() must await so that the menu-items order will be maintained.

			menus_contexts = ["browser_action"];

			if( !unsupportedFeatures.includes("rememberPageAlterations") ) {
				await browser.menus.create({
					id: "mnu-reload-page-wo-alterations",
					title: "Reload Current Page w/o Alterations",
					contexts: menus_contexts,
				});

				await browser.menus.create({
					id: "mnu-manage-alterations-rules",
					title: "Manage Alterations Rules...",
					contexts: menus_contexts,
				});

				await browser.menus.create({
					id: "mnu-separator-remember-page-alterations",
					type: "separator",
					contexts: menus_contexts,
				});

				m_rememberPageAlterationsMenusCreated = true;
			}

			// getBrowserVersion() must first be called from here or it will fail when called from content.js - EDIT: I can't remember/understand why
			let version = await lzUtil.getBrowserVersion();
			if(parseInt(version) < 62) {
				await browser.menus.create({
					id: "mnu-open-lizard-options",
					title: "Open Extension Options",
					contexts: menus_contexts,
				});
			}

			browser.menus.create({
				id: "mnu-reload-lizard-extension",
				title: "Reload Extension",
				contexts: menus_contexts,
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function sendToggleLizardStateMessage(tab) {

		if( tab.url === undefined || !(tab.url.match(/^(http|https|file|ftp):\/\//)) ) {
			createLizardNotification("Lizard can't work here.");
			return;
		}

		let msg = msgs.BROWSER_MESSAGE(msgs.ID_TOGGLE_SESSION_STATE);

		browser.tabs.sendMessage(tab.id, msg).then((response) => {

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

				injectLizardScripts(tab.id).then(() => {
					console.log("[lizard]", "Injection time(millisec):", Date.now()-m_lastInjectTime);
					browser.tabs.sendMessage(tab.id, msg).catch(onErrorToggleSessionState);
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
	function injectLizardScripts(tabId) {

		return new Promise((resolve, reject) => {

			let injecting = [];

			for(let i=0, len=INJECTABLE.length; i<len; i++) {
				if(INJECTABLE[i].isScript) {
					injecting.push(browser.tabs.executeScript(tabId, INJECTABLE[i].details));
				} else {
					injecting.push(browser.tabs.insertCSS(tabId, INJECTABLE[i].details));
				}
			}

			Promise.all(injecting).then(() => {
				resolve();
			}).catch((err) => {
				reject(new Error("Injecting '" + err.fileName.replace(browser.runtime.getURL(""), "") + "', " + err.message));
			});
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
	function openViewSourcePage(id, newWindow) {

		let viewSourceURL = browser.extension.getURL("viewSource/viewSource.html?id=" + id);

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
	function saveActionsAsRules(url, rules) {
		for(let i=0, len=rules.length; i<len; i++) {
			const rule = rules[i];
			if(!rule.saved) {
				m_lizardDB.setRule(url, rule.cssSelector, rule.details);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function jumpToElement(url, cssSelector, newTab, newWin) {

		let tabViewer = null;

		if(!newTab && !newWin) {

			// try to reuse same tab
			try {
				tabViewer = await browser.tabs.update(m_webNavJumpToElement.tabIdReusedElementHighlight, { active: true, url: url });
				browser.windows.update(tabViewer.windowId, { focused: true });
			} catch {}

		} else if(newWin && !newTab) {

			tabViewer = (await browser.windows.create({ url: url })).tabs[0];
		}

		// tab not found - open a new tab
		if(tabViewer === null) {
			let tabs = await browser.tabs.query({ active: true, currentWindow: true });
			tabViewer = await browser.tabs.create({ url: url, index: (tabs[0].index)+1 });
		}

		m_webNavJumpToElement.windowId = tabViewer.windowId;
		m_webNavJumpToElement.tabId = tabViewer.id;
		m_webNavJumpToElement.cssSelector = cssSelector;
		m_webNavJumpToElement.tabIdReusedElementHighlight = tabViewer.id;
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function highlightElement(tabId, cssSelector) {

		try {

			let jsCode = `elementHighlight.highlight("${encodeURIComponent(cssSelector)}")`;

			await browser.tabs.executeScript(tabId, { runAt: "document_start", file: "ruleActions/elementHighlight.js" });
			browser.tabs.executeScript(tabId, { runAt: "document_end", code: jsCode });

		} catch {
			// 'Error: Missing host permission for the tab' when tab is 'saved' after Fx load
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function applySavedRules(tabId, url) {

		m_lizardDB.getRules(url).then(async (rules) => {

			if(rules.length === 0) return;

			try {
				await browser.tabs.executeScript(tabId, { runAt: "document_start", file: "ruleActions/ruleActions.js" });
			} catch(error) { return; }	// 'Error: Missing host permission for the tab' when tab is 'saved' after Fx load

			let jsCode = "";

			for(let i=0, len=rules.length; i<len; i++) {

				const rule = rules[i];

				jsCode += `ruleActions.setCssSelector("${encodeURIComponent(rule.cssSelector)}");`;

				if(rule.remove) {
					jsCode += "ruleActions.removeElement();";
				}

				if(rule.hide) {
					jsCode += "ruleActions.hideElement();";
				}

				if(rule.dewidthify) {
					jsCode += "ruleActions.dewidthifyElement();";
				}

				if(rule.color !== null) {
					jsCode += `ruleActions.colorizeElement(${JSON.stringify(rule.color)});`;
				}

				if(rule.isolate) {
					jsCode += "ruleActions.isolateElement();";
				}
			}

			if(jsCode.length > 0) {
				//console.log("[Lizard] inject jsCode", jsCode.replace(/(^|;)/g, "$1\n\n").replace(/(\{|,)(\")?/g, "$1\n\t$2").replace(/\}/g, "\n}").replace(/":/g, "\": "));
				browser.tabs.executeScript(tabId, { runAt: "document_idle", code: jsCode });
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function reloadPageWithoutAlterations() {

		let tab = (await browser.tabs.query({ active: true, currentWindow: true }))[0];

		m_webNavReloadWithoutAlterations.windowId = tab.windowId;
		m_webNavReloadWithoutAlterations.tabId = tab.id;

		browser.tabs.reload(tab.id);
	}
})();
