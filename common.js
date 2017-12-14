"use strict";

let prefs = (function () {

	const ACTION_MSG_LIZARD_TOGGLE_STATE = "lizardToggleState";
	const MSG_LIZARD_STATE_CHANGED = "lizardStateChanged";
	const MSG_LIZARD_DISPLAY_NOTIF = "lizardDisplayNotification";
	const MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW = "lizardOpenViewSourceWindow";

	const VIEW_SOURCE_HTML = "html";
	const VIEW_SOURCE_CSS = "css";

	const PREF_DEF_HELP_BOX_ON_START_VALUE = true;
	const PREF_DEF_VIEW_SOURCE_TYPE_VALUE = VIEW_SOURCE_HTML;
	const PREF_DEF_COLORIZE_COLORS_VALUE = ["#FF0000", "#FFFF00"];			// default red on yellow
	const PREF_DEF_DECOLORIZE_COLORS_VALUE = ["#000000", "#FFFFFF"];		// default black on white
	const PREF_DEF_VIEW_SOURCE_DATA_VALUE = "";		

	const PREF_VIEW_SOURCE_TYPE = "pref_viewSourceType";
	const PREF_HELP_BOX_ON_START = "pref_helpBoxOnStart";
	const PREF_COLORIZE_COLORS = "pref_colorizeColors";
	const PREF_DECOLORIZE_COLORS = "pref_decolorizeColors";
	const PREF_VIEW_SOURCE_DATA = "pref_viewSourceData";

	const PREF_COLOR_SEPARATOR_CHAR = "/";

	//////////////////////////////////////////////////////////////////////
	let getSavedViewSourceData = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_VIEW_SOURCE_DATA)
				.then((result) => {
					resolve(result[PREF_VIEW_SOURCE_DATA] ? result[PREF_VIEW_SOURCE_DATA] : PREF_DEF_VIEW_SOURCE_DATA_VALUE);
				});
		});
	}

	//////////////////////////////////////////////////////////////////////
	let getHelpBoxOnStart = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_HELP_BOX_ON_START)
				.then((result) => {
					resolve(result[PREF_HELP_BOX_ON_START] === false ? false : PREF_DEF_HELP_BOX_ON_START_VALUE);
				});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let getViewSourceType = function () {

		return new Promise((resolve) => {

			browser.storage.local.get(PREF_VIEW_SOURCE_TYPE)
				.then((result) => {
					resolve(result[PREF_VIEW_SOURCE_TYPE] === VIEW_SOURCE_CSS ? VIEW_SOURCE_CSS : PREF_DEF_VIEW_SOURCE_TYPE_VALUE);
				});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let getColorizeColors = function () {

		return new Promise((resolve, reject) => {

			browser.storage.local.get(PREF_COLORIZE_COLORS)
				.then((result) => {
					if (result[PREF_COLORIZE_COLORS])
						resolve(result[PREF_COLORIZE_COLORS].split(PREF_COLOR_SEPARATOR_CHAR));
					else
						resolve(PREF_DEF_COLORIZE_COLORS_VALUE);
				});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let getDecolorizeColors = function () {

		return new Promise((resolve, reject) => {

			browser.storage.local.get(PREF_DECOLORIZE_COLORS)
				.then((result) => {
					if (result[PREF_DECOLORIZE_COLORS])
						resolve(result[PREF_DECOLORIZE_COLORS].split(PREF_COLOR_SEPARATOR_CHAR));
					else
						resolve(PREF_DEF_DECOLORIZE_COLORS_VALUE);
				});
		});
	};

	//////////////////////////////////////////////////////////////////////
	let setSavedViewSourceData = function (data) {

		let obj = {};
		obj[PREF_VIEW_SOURCE_DATA] = data;
		browser.storage.local.set(obj);
	}

	//////////////////////////////////////////////////////////////////////
	let setHelpBoxOnStart = function (value) {

		let obj = {};
		obj[PREF_HELP_BOX_ON_START] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let setViewSourceType = function (value) {

		let obj = {};
		obj[PREF_VIEW_SOURCE_TYPE] = value;
		browser.storage.local.set(obj);
	};

	//////////////////////////////////////////////////////////////////////
	let setColorizeColors = function (values) {

		let obj = {};
		obj[PREF_COLORIZE_COLORS] = values[0] + PREF_COLOR_SEPARATOR_CHAR + values[1];
		browser.storage.local.set(obj);
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
		this.setColorizeColors(PREF_DEF_COLORIZE_COLORS_VALUE);
		this.setDecolorizeColors(PREF_DEF_DECOLORIZE_COLORS_VALUE);

		return {
			helpBoxOnStart: PREF_DEF_HELP_BOX_ON_START_VALUE,
			viewSourceType: PREF_DEF_VIEW_SOURCE_TYPE_VALUE,
			colorizeColors: PREF_DEF_COLORIZE_COLORS_VALUE,
			decolorizeColors: PREF_DEF_DECOLORIZE_COLORS_VALUE
		};
	};

	return {
		ACTION_MSG_LIZARD_TOGGLE_STATE: ACTION_MSG_LIZARD_TOGGLE_STATE,
		MSG_LIZARD_STATE_CHANGED: MSG_LIZARD_STATE_CHANGED,
		MSG_LIZARD_DISPLAY_NOTIF: MSG_LIZARD_DISPLAY_NOTIF,
		MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW: MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW,

		VIEW_SOURCE_HTML: VIEW_SOURCE_HTML,
		VIEW_SOURCE_CSS: VIEW_SOURCE_CSS,

		getHelpBoxOnStart: getHelpBoxOnStart,
		getViewSourceType: getViewSourceType,
		getColorizeColors: getColorizeColors,
		getDecolorizeColors: getDecolorizeColors,
		getSavedViewSourceData: getSavedViewSourceData,

		setHelpBoxOnStart: setHelpBoxOnStart,
		setViewSourceType: setViewSourceType,
		setColorizeColors: setColorizeColors,
		setDecolorizeColors: setDecolorizeColors,
		setSavedViewSourceData: setSavedViewSourceData,

		restoreDefaults: restoreDefaults
	};

})();
