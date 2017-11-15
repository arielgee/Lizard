"use strict";

const ACTION_MSG_LIZARD_TOGGLE_STATE = "lizardToggleState";
const MSG_LIZARD_STATE_CHANGED = "lizardStateChanged";

let prefs = (function () {

	const PREF_DEF_HELP_BOX_ON_START = true;
	const PREF_DEF_COLORIZE_COLORS_VALUE = ["#FF0000", "#FFFF00"];			// default red on yellow
	const PREF_DEF_DECOLORIZE_COLORS_VALUE = ["#000000", "#FFFFFF"];		// default black on white

	const PREF_HELP_BOX_ON_START = "pref_helpBoxOnStart";
	const PREF_COLORIZE_COLORS = "pref_colorizeColors";
	const PREF_DECOLORIZE_COLORS = "pref_decolorizeColors";
	const PREF_COLOR_SEPARATOR_CHAR = "/";

	//////////////////////////////////////////////////////////////////////
	let getHelpBoxOnStart = function () {

		return new Promise((resolve, reject) => {

			browser.storage.local.get(PREF_HELP_BOX_ON_START)
				.then((result) => {
					resolve(result[PREF_HELP_BOX_ON_START] === false ? false : PREF_DEF_HELP_BOX_ON_START);
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
	let setHelpBoxOnStart = function (value) {

		let obj = {};
		obj[PREF_HELP_BOX_ON_START] = value;
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
		this.setHelpBoxOnStart(PREF_DEF_HELP_BOX_ON_START);
		this.setColorizeColors(PREF_DEF_COLORIZE_COLORS_VALUE);
		this.setDecolorizeColors(PREF_DEF_DECOLORIZE_COLORS_VALUE);

		return {
			helpBoxOnStart: PREF_DEF_HELP_BOX_ON_START,
			colorizeColors: PREF_DEF_COLORIZE_COLORS_VALUE,
			decolorizeColors: PREF_DEF_DECOLORIZE_COLORS_VALUE
		};
	};

	return {
		getHelpBoxOnStart: getHelpBoxOnStart,
		getColorizeColors: getColorizeColors,
		getDecolorizeColors: getDecolorizeColors,
		setHelpBoxOnStart: setHelpBoxOnStart,
		setColorizeColors: setColorizeColors,
		setDecolorizeColors: setDecolorizeColors,
		restoreDefaults: restoreDefaults
	};

})();

