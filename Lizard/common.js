"use strict";

/////////////////////////////////////////////////////////////////////////////////////////////
///
let msgs = (function () {

	const ID_TOGGLE_SESSION_STATE = "msgToggleSessionState";
	const ID_SHUTDOWN_SESSION = "msgShutdownSession";
	const ID_SESSION_STATE_CHANGED = "msgSessionStateChanged";
	const ID_DISPLAY_NOTIFICATION = "msgDisplayNotification";
	const ID_OPEN_VIEW_SOURCE_WINDOW = "msgOpenViewSourceWindow";
	const ID_OPEN_VIEW_SOURCE_TAB = "msgOpenViewSourceTab";
	const ID_OPEN_OPTIONS_PAGE = "msgOpenOptionsPage";
	const ID_SAVE_ACTION_AS_RULE = "msgSaveActionAsRule";
	const ID_DELETE_RULE = "msgDeleteRule";
	const ID_TOGGLE_REMEMBER_PAGE_ALTERATIONS = "msgToggleRememberPageAlterations";

	const BROWSER_MESSAGE = (msgId) => {
		return {
			id: msgId,
			data: {},
		};
	};

	return {
		ID_TOGGLE_SESSION_STATE: ID_TOGGLE_SESSION_STATE,
		ID_SHUTDOWN_SESSION: ID_SHUTDOWN_SESSION,
		ID_SESSION_STATE_CHANGED: ID_SESSION_STATE_CHANGED,
		ID_DISPLAY_NOTIFICATION: ID_DISPLAY_NOTIFICATION,
		ID_OPEN_VIEW_SOURCE_WINDOW: ID_OPEN_VIEW_SOURCE_WINDOW,
		ID_OPEN_VIEW_SOURCE_TAB: ID_OPEN_VIEW_SOURCE_TAB,
		ID_OPEN_OPTIONS_PAGE: ID_OPEN_OPTIONS_PAGE,
		ID_SAVE_ACTION_AS_RULE: ID_SAVE_ACTION_AS_RULE,
		ID_DELETE_RULE: ID_DELETE_RULE,
		ID_TOGGLE_REMEMBER_PAGE_ALTERATIONS: ID_TOGGLE_REMEMBER_PAGE_ALTERATIONS,

		BROWSER_MESSAGE: BROWSER_MESSAGE,
	};
})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let prefs = (function () {

	const SOURCE_TYPE = { HTML: "HTML", CSS: "CSS" };
	const SOURCE_TYPES_ARRAY = [ SOURCE_TYPE.HTML, SOURCE_TYPE.CSS ];

	const CSS_TYPE = { MATCH_RULES: "matchRules", COMP_STYLE: "compStyle" };
	const CSS_TYPES_ARRAY = [CSS_TYPE.MATCH_RULES, CSS_TYPE.COMP_STYLE];

	const VIEW_SOURCE_IN_TYPE = { WINDOW: "inWindow", TAB: "inTab", PAGE: "inPage" };
	const VIEW_SOURCE_IN_TYPES_ARRAY = [ VIEW_SOURCE_IN_TYPE.WINDOW, VIEW_SOURCE_IN_TYPE.TAB, VIEW_SOURCE_IN_TYPE.PAGE ];

	const PREF_DEF_HELP_BOX_ON_START_VALUE = true;
	const PREF_DEF_WHEEL_TO_WIDER_NARROWER = false;
	const PREF_DEF_VIEW_SOURCE_TYPE_VALUE = SOURCE_TYPE.HTML;
	const PREF_DEF_VIEW_CSS_TYPE_VALUE = CSS_TYPE.COMP_STYLE;
	const PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE = VIEW_SOURCE_IN_TYPE.PAGE;
	const PREF_DEF_COLORIZE_COLORS_VALUE = ["#FF0000", "#FFFF00"];			// default red on yellow
	const PREF_DEF_DECOLORIZE_COLORS_VALUE = ["#000000", "#FFFFFF"];		// default black on white
	const PREF_DEF_COLORIZE_CHILDREN = false;
	const PREF_DEF_COLORIZE_IMAGES = true;
	const PREF_DEF_MENU_ITEM_CONTEXT = true;
	const PREF_DEF_MENU_ITEM_TOOLS = true;
	const PREF_DEF_REMEMBER_PAGE_ALTERATIONS = false;
	const PREF_DEF_EXPERT_MODE = false;
	const PREF_DEF_XP_MODE_CONTEXT_MENU = false;
	const PREF_DEF_VERSION_NOTICE = "";

	const PREF_HELP_BOX_ON_START = "pref_helpBoxOnStart";
	const PREF_WHEEL_TO_WIDER_NARROWER = "pref_wheelToWiderNarrower";
	const PREF_VIEW_SOURCE_TYPE = "pref_viewSourceType";
	const PREF_VIEW_CSS_TYPE = "pref_viewCssType";
	const PREF_OPEM_VIEW_SOURCE_IN = "pref_openViewSourceIn";
	const PREF_COLORIZE_COLORS = "pref_colorizeColors";
	const PREF_DECOLORIZE_COLORS = "pref_decolorizeColors";
	const PREF_COLORIZE_CHILDREN = "pref_colorizeChildren";
	const PREF_COLORIZE_IMAGES = "pref_colorizeImages";
	const PREF_MENU_ITEM_CONTEXT = "pref_menuItemContext";
	const PREF_MENU_ITEM_TOOLS = "pref_menuItemTools";
	const PREF_REMEMBER_PAGE_ALTERATIONS = "pref_rememberPageAlterations";
	const PREF_EXPERT_MODE = "pref_expertMode";
	const PREF_XP_MODE_CONTEXT_MENU = "pref_xpModeContextMenu";
	const PREF_VERSION_NOTICE = "pref_versionNotice";

	let m_localStorage = browser.storage.local;

	//////////////////////////////////////////////////////////////////////
	function getHelpBoxOnStart() {
		return getPreferenceValue(PREF_HELP_BOX_ON_START, PREF_DEF_HELP_BOX_ON_START_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setHelpBoxOnStart(value) {
		return setPreferenceValue(PREF_HELP_BOX_ON_START, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getWheelToWiderNarrower() {
		return getPreferenceValue(PREF_WHEEL_TO_WIDER_NARROWER, PREF_DEF_WHEEL_TO_WIDER_NARROWER);
	}

	//////////////////////////////////////////////////////////////////////
	function setWheelToWiderNarrower(value) {
		return setPreferenceValue(PREF_WHEEL_TO_WIDER_NARROWER, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getViewSourceType() {
		return getPreferenceValue(PREF_VIEW_SOURCE_TYPE, PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setViewSourceType(value) {
		return setPreferenceValue(PREF_VIEW_SOURCE_TYPE, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getViewCssType() {
		return getPreferenceValue(PREF_VIEW_CSS_TYPE, PREF_DEF_VIEW_CSS_TYPE_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setViewCssType(value) {
		return setPreferenceValue(PREF_VIEW_CSS_TYPE, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getOpenViewSourceIn() {
		return getPreferenceValue(PREF_OPEM_VIEW_SOURCE_IN, PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setOpenViewSourceIn(value) {
		return setPreferenceValue(PREF_OPEM_VIEW_SOURCE_IN, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorizeColors() {
		return getPreferenceValue(PREF_COLORIZE_COLORS, PREF_DEF_COLORIZE_COLORS_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setColorizeColors(value) {
		return setPreferenceValue(PREF_COLORIZE_COLORS, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getDecolorizeColors() {
		return getPreferenceValue(PREF_DECOLORIZE_COLORS, PREF_DEF_DECOLORIZE_COLORS_VALUE);
	}

	//////////////////////////////////////////////////////////////////////
	function setDecolorizeColors(value) {
		return setPreferenceValue(PREF_DECOLORIZE_COLORS, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorizeChildren() {
		return getPreferenceValue(PREF_COLORIZE_CHILDREN, PREF_DEF_COLORIZE_CHILDREN);
	}

	//////////////////////////////////////////////////////////////////////
	function setColorizeChildren(value) {
		return setPreferenceValue(PREF_COLORIZE_CHILDREN, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getColorizeImages() {
		return getPreferenceValue(PREF_COLORIZE_IMAGES, PREF_DEF_COLORIZE_IMAGES);
	}

	//////////////////////////////////////////////////////////////////////
	function setColorizeImages(value) {
		return setPreferenceValue(PREF_COLORIZE_IMAGES, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getMenuItemContext() {
		return getPreferenceValue(PREF_MENU_ITEM_CONTEXT, PREF_DEF_MENU_ITEM_CONTEXT);
	}

	//////////////////////////////////////////////////////////////////////
	function setMenuItemContext(value) {
		return setPreferenceValue(PREF_MENU_ITEM_CONTEXT, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getMenuItemTools() {
		return getPreferenceValue(PREF_MENU_ITEM_TOOLS, PREF_DEF_MENU_ITEM_TOOLS);
	}

	//////////////////////////////////////////////////////////////////////
	function setMenuItemTools(value) {
		return setPreferenceValue(PREF_MENU_ITEM_TOOLS, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getRememberPageAlterations() {
		return getPreferenceValue(PREF_REMEMBER_PAGE_ALTERATIONS, PREF_DEF_REMEMBER_PAGE_ALTERATIONS);
	}

	//////////////////////////////////////////////////////////////////////
	function setRememberPageAlterations(value) {
		return setPreferenceValue(PREF_REMEMBER_PAGE_ALTERATIONS, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getExpertMode() {
		return getPreferenceValue(PREF_EXPERT_MODE, PREF_DEF_EXPERT_MODE);
	}

	//////////////////////////////////////////////////////////////////////
	function setExpertMode(value) {
		return setPreferenceValue(PREF_EXPERT_MODE, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getXpModeContextMenu() {
		return getPreferenceValue(PREF_XP_MODE_CONTEXT_MENU, PREF_DEF_XP_MODE_CONTEXT_MENU);
	}

	//////////////////////////////////////////////////////////////////////
	function setXpModeContextMenu(value) {
		return setPreferenceValue(PREF_XP_MODE_CONTEXT_MENU, value);
	}

	//////////////////////////////////////////////////////////////////////
	function getVersionNotice() {
		return getPreferenceValue(PREF_VERSION_NOTICE, PREF_DEF_VERSION_NOTICE);
	}

	//////////////////////////////////////////////////////////////////////
	function setVersionNotice(value) {
		return setPreferenceValue(PREF_VERSION_NOTICE, value);
	}

	//////////////////////////////////////////////////////////////////////
	function restoreDefaults() {
		this.setHelpBoxOnStart(PREF_DEF_HELP_BOX_ON_START_VALUE);
		this.setWheelToWiderNarrower(PREF_DEF_WHEEL_TO_WIDER_NARROWER);
		this.setViewSourceType(PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
		this.setViewCssType(PREF_DEF_VIEW_CSS_TYPE_VALUE);
		this.setOpenViewSourceIn(PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE);
		this.setColorizeColors(PREF_DEF_COLORIZE_COLORS_VALUE);
		this.setDecolorizeColors(PREF_DEF_DECOLORIZE_COLORS_VALUE);
		this.setColorizeChildren(PREF_DEF_COLORIZE_CHILDREN);
		this.setColorizeImages(PREF_DEF_COLORIZE_IMAGES);
		this.setMenuItemContext(PREF_DEF_MENU_ITEM_CONTEXT);
		this.setMenuItemTools(PREF_DEF_MENU_ITEM_TOOLS);
		this.setRememberPageAlterations(PREF_DEF_REMEMBER_PAGE_ALTERATIONS);
		this.setExpertMode(PREF_DEF_EXPERT_MODE);
		this.setXpModeContextMenu(PREF_DEF_XP_MODE_CONTEXT_MENU);

		return {
			helpBoxOnStart: PREF_DEF_HELP_BOX_ON_START_VALUE,
			wheelToWiderNarrower: PREF_DEF_WHEEL_TO_WIDER_NARROWER,
			viewSourceType: PREF_DEF_VIEW_SOURCE_TYPE_VALUE,
			viewCssType: PREF_DEF_VIEW_CSS_TYPE_VALUE,
			OpenViewSourceIn: PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE,
			colorizeColors: PREF_DEF_COLORIZE_COLORS_VALUE,
			decolorizeColors: PREF_DEF_DECOLORIZE_COLORS_VALUE,
			colorizeChildren: PREF_DEF_COLORIZE_CHILDREN,
			colorizeImages: PREF_DEF_COLORIZE_IMAGES,
			menuItemContext: PREF_DEF_MENU_ITEM_CONTEXT,
			menuItemTools: PREF_DEF_MENU_ITEM_TOOLS,
			rememberPageAlterations: PREF_DEF_REMEMBER_PAGE_ALTERATIONS,
			expertMode: PREF_DEF_EXPERT_MODE,
			xpModeContextMenu: PREF_DEF_XP_MODE_CONTEXT_MENU,
		};
	}

	//////////////////////////////////////////////////////////////////////
	function getPreferenceValue(pref, defValue) {
		return new Promise((resolve) => {
			m_localStorage.get(pref).then((result) => {
				resolve(result[pref] === undefined ? defValue : result[pref]);
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setPreferenceValue(pref, value) {
		return m_localStorage.set({ [pref]: value });
	}

	return {
		SOURCE_TYPE: SOURCE_TYPE,
		SOURCE_TYPES_ARRAY: SOURCE_TYPES_ARRAY,

		CSS_TYPE: CSS_TYPE,
		CSS_TYPES_ARRAY: CSS_TYPES_ARRAY,

		VIEW_SOURCE_IN_TYPE: VIEW_SOURCE_IN_TYPE,
		VIEW_SOURCE_IN_TYPES_ARRAY: VIEW_SOURCE_IN_TYPES_ARRAY,

		getHelpBoxOnStart: getHelpBoxOnStart,
		setHelpBoxOnStart: setHelpBoxOnStart,
		getWheelToWiderNarrower: getWheelToWiderNarrower,
		setWheelToWiderNarrower: setWheelToWiderNarrower,
		getViewSourceType: getViewSourceType,
		setViewSourceType: setViewSourceType,
		getViewCssType: getViewCssType,
		setViewCssType: setViewCssType,
		getOpenViewSourceIn: getOpenViewSourceIn,
		setOpenViewSourceIn: setOpenViewSourceIn,
		getColorizeColors: getColorizeColors,
		setColorizeColors: setColorizeColors,
		getDecolorizeColors: getDecolorizeColors,
		setDecolorizeColors: setDecolorizeColors,
		getColorizeChildren: getColorizeChildren,
		setColorizeChildren: setColorizeChildren,
		getColorizeImages: getColorizeImages,
		setColorizeImages: setColorizeImages,
		getMenuItemContext: getMenuItemContext,
		setMenuItemContext: setMenuItemContext,
		getMenuItemTools: getMenuItemTools,
		setMenuItemTools: setMenuItemTools,
		getRememberPageAlterations: getRememberPageAlterations,
		setRememberPageAlterations: setRememberPageAlterations,
		getExpertMode: getExpertMode,
		setExpertMode: setExpertMode,
		getXpModeContextMenu: getXpModeContextMenu,
		setXpModeContextMenu: setXpModeContextMenu,
		getVersionNotice: getVersionNotice,
		setVersionNotice: setVersionNotice,

		restoreDefaults: restoreDefaults,
	}
})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let sourceData = (function () {

	const DEF_SAVED_VIEW_SOURCE_DATA_VALUE = "";
	const DEF_SAVED_VIEW_SOURCE_TYPE_VALUE = "";

	const SAVED_VIEW_SOURCE_DATA = "savedViewSourceData";
	const SAVED_VIEW_SOURCE_TYPE = "savedViewSourceType";

	let m_localStorage = browser.storage.local;

	//////////////////////////////////////////////////////////////////////
	function getSavedViewSourceData(id) {

		let viewSourceData = SAVED_VIEW_SOURCE_DATA + id;
		let viewSourceType = SAVED_VIEW_SOURCE_TYPE + id;

		return new Promise((resolve) => {

			m_localStorage.get(viewSourceData).then((resultData) => {

				m_localStorage.get(viewSourceType).then((resultType) => {

					resolve({
						data: (resultData[viewSourceData] ? resultData[viewSourceData] : DEF_SAVED_VIEW_SOURCE_DATA_VALUE),
						type: (resultType[viewSourceType] ? resultType[viewSourceType] : DEF_SAVED_VIEW_SOURCE_TYPE_VALUE)
					});
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	function setSavedViewSourceData(data, type, id) {
		m_localStorage.set( {
			[SAVED_VIEW_SOURCE_DATA + id]: data,
			[SAVED_VIEW_SOURCE_TYPE + id]: type,
		} );
	}

	//////////////////////////////////////////////////////////////////////
	function clearSavedViewSourceData(id) {
		m_localStorage.remove(SAVED_VIEW_SOURCE_DATA + id);
		m_localStorage.remove(SAVED_VIEW_SOURCE_TYPE + id);
	}

	return {
		getSavedViewSourceData: getSavedViewSourceData,
		setSavedViewSourceData: setSavedViewSourceData,
		clearSavedViewSourceData: clearSavedViewSourceData,
	};
})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let lzUtil = (function () {

	//////////////////////////////////////////////////////////////////////
	String.prototype.format = function (args) {
		let str = this;
		return str.replace(String.prototype.format.regex, (item) => {
			let intVal = parseInt(item.substring(1, item.length - 1));
			let replace;
			if (intVal >= 0) {
				replace = args[intVal];
			} else if (intVal === -1) {
				replace = "{";
			} else if (intVal === -2) {
				replace = "}";
			} else {
				replace = "";
			}
			return replace;
		});
	};
	String.prototype.format.regex = new RegExp("{-?[0-9]+}", "g");

	//////////////////////////////////////////////////////////////////////
	String.prototype.trunc = function (n) {
		return (this.length > n) ? this.substr(0, n - 1) + "&hellip;" : this;
	};

	//////////////////////////////////////////////////////////////////////
	function _sendMessageAllLizardSessions(message) {

		return new Promise((resolve) => {

			getBrowserVersion().then((version) => {

				// Browser compatibility: 'discarded' from Firefox 57
				let querying = browser.tabs.query((parseFloat(version) >= 57.0 ? { discarded: false } : {}));

				querying.then((tabs) => {

					let allPromises = [];

					for (let i=0; i<tabs.length; i++) {
						allPromises[i] = browser.tabs.sendMessage(tabs[i].id, message);
					}

					// Promise.all is fail-fast; first rejected promise will reject all immediately so convert catch error to simple regular (success) value.
					Promise.all(allPromises.map(p => p.catch((e) => { return e; }))).then((results) => {
						resolve(results);
					});
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	// filterName = "saturate"	; // "1000%" or "0%" (colorize, decolorize)
	// filterName = "invert"	; // "100%" or "0%" ((colorize || decolorize) +shift, (colorize || decolorize))
	function applyCssFilter(elm, filterName, amount) {

		let validFilters = [ "saturate", "invert" ];
		if( !validFilters.includes(filterName) ) {
			console.log("[Lizard]", "Error: invalid filter name: `" + filterName + "`. Expected: " + validFilters.map(n => "`" + n + "`").join(", "));
		}

		let re = new RegExp("\\b(" + filterName + "\\()([^)]+)(\\))");	// match: "saturate([amount])" or "invert([amount])"

		let compStyle = window.getComputedStyle(elm);

		if (re.test(compStyle.filter)) {
			elm.style.filter = compStyle.filter.replace(re, "$1" + amount + "$3");	// replace amount
		} else {
			if (compStyle.filter != "" && compStyle.filter != "none") {
				elm.style.filter = compStyle.filter;
			}
			elm.style.filter += filterName + "(" + amount + ")";
		}
	}

	//////////////////////////////////////////////////////////////////////
	function reloadLizardWebExtension() {

		_sendMessageAllLizardSessions(msgs.BROWSER_MESSAGE(msgs.ID_SHUTDOWN_SESSION)).then((results) => {
			setTimeout(() => { browser.runtime.reload(); }, 10);
		});
	}

	//////////////////////////////////////////////////////////////////////
	function reloadLizardWebExtensionAndTab() {

		_sendMessageAllLizardSessions(msgs.BROWSER_MESSAGE(msgs.ID_SHUTDOWN_SESSION)).then((results) => {
			setTimeout(() => {
				browser.tabs.reload({ bypassCache: true });
				browser.runtime.reload();
			}, 10);
		});
	}

	//////////////////////////////////////////////////////////////////////
	function toggleRememberPageAlterations() {

		let msg = msgs.BROWSER_MESSAGE(msgs.ID_TOGGLE_REMEMBER_PAGE_ALTERATIONS);

		browser.runtime.sendMessage(msg);
		_sendMessageAllLizardSessions(msg);
	}

	//////////////////////////////////////////////////////////////////////
	function getElementComputedCssText(elm) {

		let css = "";
		let name;
		let priority;

		let style = window.getComputedStyle(elm);

		for (let i = 0; i < style.length; i++) {
			name = style[i];
			priority = style.getPropertyPriority(name);
			css += name + ":" + style.getPropertyValue(name) + (priority.length > 0 ? " !" : "") + priority + ";";
		}
		return css;
	}

	//////////////////////////////////////////////////////////////////////
	function escapeRegExp(str) {
		return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
	}

	//////////////////////////////////////////////////////////////////////
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

	//////////////////////////////////////////////////////////////////////
	function getUniqId(prefix = "", length = 32) {

		let dec2hex = (d) => ( (d < 10) ? "0" + String(d) : d.toString(16) );
		let values = new Uint8Array(length / 2);

		window.crypto.getRandomValues(values);
		return prefix + Array.from(values, dec2hex).join("");
	}

	//////////////////////////////////////////////////////////////////////
	function isSVGObject(elm) {
		return ((typeof elm.className === "object") && (elm.className.toString() === "[object SVGAnimatedString]"));
	}

	//////////////////////////////////////////////////////////////////////
	function hasBackgroundImage(elm) {
		return (window.getComputedStyle(elm).getPropertyValue("background-image") !== "none");
	}

	//////////////////////////////////////////////////////////////////////
	function getElementMatchedCSSRules(elm) {

		let ssDomain;
		let rules;
		let sheets = document.styleSheets;

		let text = "";
		let remoteStyleSheetDomains = [];


		for (let i = 0; i < sheets.length; i++) {

			// security error when accessing a style sheet from a different domain
			try {
				rules = sheets[i].cssRules;
			} catch (e) {

				// href is null for local style sheets
				if (sheets[i].href !== null) {
					remoteStyleSheetDomains.push(ssDomain = (new URL(sheets[i].href)).hostname);
				} else {
					ssDomain = "";
				}

				// if any other execption
				if (e.name !== "SecurityError" || document.domain === ssDomain) {
					throw e;
				}
				rules = [];
			}

			for (let j = 0; j < rules.length; j++) {
				if (elm.matches(rules[j].selectorText)) {
					text += rules[j].cssText;
				}
			}
		}

		return {
			cssText: text,
			remoteStyleSheetDomains: remoteStyleSheetDomains,
		};
	}

	//////////////////////////////////////////////////////////////////////
	function disableElementTree(elm, value) {

		if (elm.nodeType !== Node.ELEMENT_NODE) {
			return;
		}

		for (let i in elm.children) {
			disableElementTree(elm.children[i], value);
		}

		if (elm.disabled !== undefined) {
			elm.disabled = value;
		}

		if (value === true) {
			elm.classList.add("disabled");
		} else {
			elm.classList.remove("disabled");
		}
	}

	//////////////////////////////////////////////////////////////////////
	function versionNumericCompare(ver1, ver2) {

		let v1 = ver1.split(".").map(e => { return parseInt(e); } );
		let v2 = ver2.split(".").map(e => { return parseInt(e); } );
		let len = Math.min(v1.length, v2.length);

		for (let i=0; i<len; i++) {
			if(v1[i] - v2[i]) {
				return v1[i] - v2[i];
			}
		}
		return (v1.length - v2.length);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getBrowserVersion() {
		return new Promise((resolve) => {
			browser.runtime.getBrowserInfo().then((result) => {
				resolve(result.version);
			});
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function unsupportedExtensionFeatures() {

		return new Promise((resolve) => {

			const MIN_VERSION_REMEMBER_PAGE_ALTERATIONS = 64;

			lzUtil.getBrowserVersion().then((version) => {

				let unsupportedFeatures = [];

				if(parseInt(version) < MIN_VERSION_REMEMBER_PAGE_ALTERATIONS) {
					prefs.setRememberPageAlterations(false);
					unsupportedFeatures.push("rememberPageAlterations");
				}

				resolve(unsupportedFeatures);
			});
		});
	}

	return {
		applyCssFilter: applyCssFilter,
		reloadLizardWebExtension: reloadLizardWebExtension,
		reloadLizardWebExtensionAndTab: reloadLizardWebExtensionAndTab,
		toggleRememberPageAlterations: toggleRememberPageAlterations,
		getElementComputedCssText: getElementComputedCssText,
		escapeRegExp: escapeRegExp,
		random1to100: random1to100,
		getUniqId: getUniqId,
		isSVGObject: isSVGObject,
		hasBackgroundImage: hasBackgroundImage,
		getElementMatchedCSSRules: getElementMatchedCSSRules,
		disableElementTree: disableElementTree,
		versionNumericCompare: versionNumericCompare,
		getBrowserVersion: getBrowserVersion,
		unsupportedExtensionFeatures: unsupportedExtensionFeatures,
	}
})();
