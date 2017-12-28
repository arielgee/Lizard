"use strict";


/////////////////////////////////////////////////////////////////////////////////////////////
///
let msgs = (function () {

	const MSG_TOGGLE_SESSION_STATE = "msgToggleSessionState";
	const MSG_SESSION_STATE_CHANGED = "msgSessionStateChanged";
	const MSG_DISPLAY_NOTIFICATION = "msgDisplayNotification";
	const MSG_OPEN_VIEW_SOURCE_WINDOW = "msgOpenViewSourceWindow";
	const MSG_OPEN_VIEW_SOURCE_TAB = "msgOpenViewSourceTab";
	const MSG_OPEN_OPTIONS_PAGE = "msgOpenOptionsPage";

	return {
		MSG_TOGGLE_SESSION_STATE: MSG_TOGGLE_SESSION_STATE,
		MSG_SESSION_STATE_CHANGED: MSG_SESSION_STATE_CHANGED,
		MSG_DISPLAY_NOTIFICATION: MSG_DISPLAY_NOTIFICATION,
		MSG_OPEN_VIEW_SOURCE_WINDOW: MSG_OPEN_VIEW_SOURCE_WINDOW,
		MSG_OPEN_VIEW_SOURCE_TAB: MSG_OPEN_VIEW_SOURCE_TAB,
		MSG_OPEN_OPTIONS_PAGE: MSG_OPEN_OPTIONS_PAGE,
	};
})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let prefs = (function () {

	const SOURCE_TYPE = { HTML: "HTML", CSS: "CSS" };
	const SOURCE_TYPES_ARRAY = [ SOURCE_TYPE.HTML, SOURCE_TYPE.CSS ];

	const VIEW_SOURCE_IN_TYPE = { WINDOW: "inWindow", TAB: "inTab", PAGE: "inPage" };
	const VIEW_SOURCE_IN_TYPES_ARRAY = [ VIEW_SOURCE_IN_TYPE.WINDOW, VIEW_SOURCE_IN_TYPE.TAB, VIEW_SOURCE_IN_TYPE.PAGE ];

	const PREF_DEF_HELP_BOX_ON_START_VALUE = true;
	const PREF_DEF_WHEEL_TO_WIDER_NARROWER = false;
	const PREF_DEF_VIEW_SOURCE_TYPE_VALUE = SOURCE_TYPE.HTML;
	const PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE = VIEW_SOURCE_IN_TYPE.PAGE;
	const PREF_DEF_COLORIZE_COLORS_VALUE = ["#FF0000", "#FFFF00"];			// default red on yellow
	const PREF_DEF_DECOLORIZE_COLORS_VALUE = ["#000000", "#FFFFFF"];		// default black on white
	const PREF_DEF_COLORIZE_CHILDREN = false;

	const PREF_HELP_BOX_ON_START = "pref_helpBoxOnStart";
	const PREF_WHEEL_TO_WIDER_NARROWER = "pref_wheelToWiderNarrower";
	const PREF_VIEW_SOURCE_TYPE = "pref_viewSourceType";
	const PREF_OPEM_VIEW_SOURCE_IN = "pref_openViewSourceIn";
	const PREF_COLORIZE_COLORS = "pref_colorizeColors";
	const PREF_DECOLORIZE_COLORS = "pref_decolorizeColors";
	const PREF_COLORIZE_CHILDREN = "pref_colorizeChildren";

	const PREF_COLOR_SEPARATOR_CHAR = "/";

	//////////////////////////////////////////////////////////////////////
	let getHelpBoxOnStart = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_HELP_BOX_ON_START).then((result) => {
				resolve(result[PREF_HELP_BOX_ON_START] === false ? false : PREF_DEF_HELP_BOX_ON_START_VALUE);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setHelpBoxOnStart = function (value) {

		let obj = {};
		obj[PREF_HELP_BOX_ON_START] = value;
		browser.storage.local.set(obj);
	};
	
	//////////////////////////////////////////////////////////////////////
	let getWheelToWiderNarrower = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_WHEEL_TO_WIDER_NARROWER).then((result) => {
				resolve(result[PREF_WHEEL_TO_WIDER_NARROWER] === true ? true : PREF_DEF_WHEEL_TO_WIDER_NARROWER);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setWheelToWiderNarrower = function (value) {

		let obj = {};
		obj[PREF_WHEEL_TO_WIDER_NARROWER] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getViewSourceType = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_VIEW_SOURCE_TYPE).then((result) => {
				if (SOURCE_TYPES_ARRAY.indexOf(result[PREF_VIEW_SOURCE_TYPE]) === -1) {
					resolve(PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
				} else {
					resolve(result[PREF_VIEW_SOURCE_TYPE]);
				}					
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setViewSourceType = function (value) {

		let obj = {};
		obj[PREF_VIEW_SOURCE_TYPE] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getOpenViewSourceIn = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_OPEM_VIEW_SOURCE_IN).then((result) => {

				if (VIEW_SOURCE_IN_TYPES_ARRAY.indexOf(result[PREF_OPEM_VIEW_SOURCE_IN]) === -1) {
					resolve(PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE);
				} else {
					resolve(result[PREF_OPEM_VIEW_SOURCE_IN]);
				}
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setOpenViewSourceIn = function (value) {

		let obj = {};
		obj[PREF_OPEM_VIEW_SOURCE_IN] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getColorizeColors = function () {

		return new Promise((resolve, reject) => {

			browser.storage.local.get(PREF_COLORIZE_COLORS).then((result) => {

				if (result[PREF_COLORIZE_COLORS]) {
					resolve(result[PREF_COLORIZE_COLORS].split(PREF_COLOR_SEPARATOR_CHAR));
				} else {
					resolve(PREF_DEF_COLORIZE_COLORS_VALUE);
				}
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setColorizeColors = function (values) {

		let obj = {};
		obj[PREF_COLORIZE_COLORS] = values[0] + PREF_COLOR_SEPARATOR_CHAR + values[1];
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getDecolorizeColors = function () {

		return new Promise((resolve, reject) => {

			browser.storage.local.get(PREF_DECOLORIZE_COLORS).then((result) => {

				if (result[PREF_DECOLORIZE_COLORS]) {
					resolve(result[PREF_DECOLORIZE_COLORS].split(PREF_COLOR_SEPARATOR_CHAR));
				} else {
					resolve(PREF_DEF_DECOLORIZE_COLORS_VALUE);
				}
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setDecolorizeColors = function (values) {

		let obj = {};
		obj[PREF_DECOLORIZE_COLORS] = values[0] + PREF_COLOR_SEPARATOR_CHAR + values[1];
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let getColorizeChildren = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_COLORIZE_CHILDREN).then((result) => {
				resolve(result[PREF_COLORIZE_CHILDREN] === true ? true : PREF_DEF_COLORIZE_CHILDREN);
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setColorizeChildren = function (value) {

		let obj = {};
		obj[PREF_COLORIZE_CHILDREN] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let restoreDefaults = function () {
		this.setHelpBoxOnStart(PREF_DEF_HELP_BOX_ON_START_VALUE);
		this, setWheelToWiderNarrower(PREF_DEF_WHEEL_TO_WIDER_NARROWER);
		this.setViewSourceType(PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
		this.setOpenViewSourceIn(PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE);
		this.setColorizeColors(PREF_DEF_COLORIZE_COLORS_VALUE);
		this.setDecolorizeColors(PREF_DEF_DECOLORIZE_COLORS_VALUE);
		this.setColorizeChildren(PREF_DEF_COLORIZE_CHILDREN);

		return {
			helpBoxOnStart: PREF_DEF_HELP_BOX_ON_START_VALUE,
			WheelToWiderNarrower: PREF_DEF_WHEEL_TO_WIDER_NARROWER,
			viewSourceType: PREF_DEF_VIEW_SOURCE_TYPE_VALUE,
			OpenViewSourceIn: PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE,
			colorizeColors: PREF_DEF_COLORIZE_COLORS_VALUE,
			decolorizeColors: PREF_DEF_DECOLORIZE_COLORS_VALUE,
			colorizeChildren: PREF_DEF_COLORIZE_CHILDREN,
		};
	};

	return {
		SOURCE_TYPE: SOURCE_TYPE,
		SOURCE_TYPES_ARRAY: SOURCE_TYPES_ARRAY,

		VIEW_SOURCE_IN_TYPE: VIEW_SOURCE_IN_TYPE,
		VIEW_SOURCE_IN_TYPES_ARRAY: VIEW_SOURCE_IN_TYPES_ARRAY,

		getHelpBoxOnStart: getHelpBoxOnStart,
		setHelpBoxOnStart: setHelpBoxOnStart,

		getWheelToWiderNarrower: getWheelToWiderNarrower,
		setWheelToWiderNarrower: setWheelToWiderNarrower,

		getViewSourceType: getViewSourceType,
		setViewSourceType: setViewSourceType,

		getOpenViewSourceIn: getOpenViewSourceIn,
		setOpenViewSourceIn: setOpenViewSourceIn,
		
		getColorizeColors: getColorizeColors,
		setColorizeColors: setColorizeColors,

		getDecolorizeColors: getDecolorizeColors,
		setDecolorizeColors: setDecolorizeColors,

		getColorizeChildren: getColorizeChildren,
		setColorizeChildren: setColorizeChildren,

		restoreDefaults: restoreDefaults,		
	};
})();

/////////////////////////////////////////////////////////////////////////////////////////////
///
let sourceData = (function () {

	const DEF_SAVED_VIEW_SOURCE_DATA_VALUE = "";
	const DEF_SAVED_VIEW_SOURCE_TYPE_VALUE = "";

	const SAVED_VIEW_SOURCE_DATA = "savedViewSourceData";
	const SAVED_VIEW_SOURCE_TYPE = "savedViewSourceType";

	//////////////////////////////////////////////////////////////////////
	let getSavedViewSourceData = function (id) {

		let viewSourceData = SAVED_VIEW_SOURCE_DATA + id;
		let viewSourceType = SAVED_VIEW_SOURCE_TYPE + id;

		return new Promise((resolve) => {

			browser.storage.local.get(viewSourceData).then((resultData) => {

				browser.storage.local.get(viewSourceType).then((resultType) => {

					resolve({
						data: (resultData[viewSourceData] ? resultData[viewSourceData] : DEF_SAVED_VIEW_SOURCE_DATA_VALUE),
						type: (resultType[viewSourceType] ? resultType[viewSourceType] : DEF_SAVED_VIEW_SOURCE_TYPE_VALUE)
					});
				});
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setSavedViewSourceData = function (data, type, id) {

		let obj = {};
		obj[SAVED_VIEW_SOURCE_DATA + id] = data;
		obj[SAVED_VIEW_SOURCE_TYPE + id] = type;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let clearSavedViewSourceData = function (id) {
		browser.storage.local.remove(SAVED_VIEW_SOURCE_DATA + id);
		browser.storage.local.remove(SAVED_VIEW_SOURCE_TYPE + id);
	};

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
	let log = function (...args) {
		console.log("[lizard]", ...args);
	};

	return {
		log: log,
	};

})();

