"use strict";

let prefs = (function () {

	const ACTION_MSG_LIZARD_TOGGLE_STATE = "lizardToggleState";
	const MSG_LIZARD_STATE_CHANGED = "lizardStateChanged";
	const MSG_LIZARD_DISPLAY_NOTIF = "lizardDisplayNotification";
	const MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW = "lizardOpenViewSourceWindow";
	const MSG_LIZARD_OPEN_VIEW_SOURCE_TAB = "lizardOpenViewSourceTab";

	const SOURCE_TYPE = { HTML: "HTML", CSS: "CSS" };
	const SOURCE_TYPES_ARRAY = [ SOURCE_TYPE.HTML, SOURCE_TYPE.CSS ];

	const VIEW_SOURCE_IN_TYPE = { WINDOW: "inWindow", TAB: "inTab", PAGE: "inPage" };
	const VIEW_SOURCE_IN_TYPES_ARRAY = [ VIEW_SOURCE_IN_TYPE.WINDOW, VIEW_SOURCE_IN_TYPE.TAB, VIEW_SOURCE_IN_TYPE.PAGE ];

	const PREF_DEF_HELP_BOX_ON_START_VALUE = true;
	const PREF_DEF_VIEW_SOURCE_TYPE_VALUE = SOURCE_TYPE.HTML;
	const PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE = VIEW_SOURCE_IN_TYPE.PAGE;
	const PREF_DEF_COLORIZE_COLORS_VALUE = ["#FF0000", "#FFFF00"];			// default red on yellow
	const PREF_DEF_DECOLORIZE_COLORS_VALUE = ["#000000", "#FFFFFF"];		// default black on white
	const PREF_DEF_SAVED_VIEW_SOURCE_DATA_VALUE = "";
	const PREF_DEF_SAVED_VIEW_SOURCE_TYPE_VALUE = "";

	const PREF_VIEW_SOURCE_TYPE = "pref_viewSourceType";
	const PREF_HELP_BOX_ON_START = "pref_helpBoxOnStart";
	const PREF_OPEM_VIEW_SOURCE_IN = "pref_openViewSourceIn";
	const PREF_COLORIZE_COLORS = "pref_colorizeColors";
	const PREF_DECOLORIZE_COLORS = "pref_decolorizeColors";
	const PREF_SAVED_VIEW_SOURCE_DATA = "pref_savedViewSourceData";
	const PREF_SAVED_VIEW_SOURCE_TYPE = "pref_savedViewSourceType";

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
	let restoreDefaults = function () {
		this.setHelpBoxOnStart(PREF_DEF_HELP_BOX_ON_START_VALUE);
		this.setViewSourceType(PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
		this.setOpenViewSourceIn(PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE);
		this.setColorizeColors(PREF_DEF_COLORIZE_COLORS_VALUE);
		this.setDecolorizeColors(PREF_DEF_DECOLORIZE_COLORS_VALUE);

		return {
			helpBoxOnStart: PREF_DEF_HELP_BOX_ON_START_VALUE,
			viewSourceType: PREF_DEF_VIEW_SOURCE_TYPE_VALUE,
			OpenViewSourceIn: PREF_DEF_OPEM_VIEW_SOURCE_IN_VALUE,
			colorizeColors: PREF_DEF_COLORIZE_COLORS_VALUE,
			decolorizeColors: PREF_DEF_DECOLORIZE_COLORS_VALUE
		};
	};

	//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\
	//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\//\\

	//////////////////////////////////////////////////////////////////////
	let getSavedViewSourceData = function (id) {

		let viewSourceData = PREF_SAVED_VIEW_SOURCE_DATA + id;
		let viewSourceType = PREF_SAVED_VIEW_SOURCE_TYPE + id;

		return new Promise((resolve) => {

			browser.storage.local.get(viewSourceData).then((resultData) => {

				browser.storage.local.get(viewSourceType).then((resultType) => {

					resolve({
						data: (resultData[viewSourceData]? resultData[viewSourceData]: PREF_DEF_SAVED_VIEW_SOURCE_DATA_VALUE),
						type: (resultType[viewSourceType] ? resultType[viewSourceType] : PREF_DEF_SAVED_VIEW_SOURCE_TYPE_VALUE)
					});
				});
			});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setSavedViewSourceData = function (data, type, id) {

		let obj = {};
		obj[PREF_SAVED_VIEW_SOURCE_DATA + id] = data;
		obj[PREF_SAVED_VIEW_SOURCE_TYPE + id] = type;
		browser.storage.local.set(obj);
	};
	
	//////////////////////////////////////////////////////////////////////
	let clearSavedViewSourceData = function (id) {
		browser.storage.local.remove(PREF_SAVED_VIEW_SOURCE_DATA + id);
		browser.storage.local.remove(PREF_SAVED_VIEW_SOURCE_TYPE + id);
	};

	return {
		ACTION_MSG_LIZARD_TOGGLE_STATE: ACTION_MSG_LIZARD_TOGGLE_STATE,
		MSG_LIZARD_STATE_CHANGED: MSG_LIZARD_STATE_CHANGED,
		MSG_LIZARD_DISPLAY_NOTIF: MSG_LIZARD_DISPLAY_NOTIF,
		MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW: MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW,
		MSG_LIZARD_OPEN_VIEW_SOURCE_TAB: MSG_LIZARD_OPEN_VIEW_SOURCE_TAB,

		SOURCE_TYPE: SOURCE_TYPE,
		SOURCE_TYPES_ARRAY: SOURCE_TYPES_ARRAY,

		VIEW_SOURCE_IN_TYPE: VIEW_SOURCE_IN_TYPE,
		VIEW_SOURCE_IN_TYPES_ARRAY: VIEW_SOURCE_IN_TYPES_ARRAY,

		getHelpBoxOnStart: getHelpBoxOnStart,
		setHelpBoxOnStart: setHelpBoxOnStart,

		getViewSourceType: getViewSourceType,
		setViewSourceType: setViewSourceType,

		getOpenViewSourceIn: getOpenViewSourceIn,
		setOpenViewSourceIn: setOpenViewSourceIn,
		
		getColorizeColors: getColorizeColors,
		getDecolorizeColors: getDecolorizeColors,

		setColorizeColors: setColorizeColors,
		setDecolorizeColors: setDecolorizeColors,

		restoreDefaults: restoreDefaults,
		
		getSavedViewSourceData: getSavedViewSourceData,
		setSavedViewSourceData: setSavedViewSourceData,
		clearSavedViewSourceData: clearSavedViewSourceData
	};
	
})();
