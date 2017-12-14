"use strict";

document.addEventListener("DOMContentLoaded", () => {

	// get elements
	let elmHelpBoxOnStart = document.getElementById("helpBoxOnStart");
	let elmViewSourceHtml = document.getElementById("viewSrcHtml");
	let elmViewSourceCss = document.getElementById("viewSrcCss");
	let elmColorizeColor = document.getElementById("colorizeColor");
	let elmColorizeBackgroundColor = document.getElementById("colorizeBackgroundColor");
	let elmDecolorizeColor = document.getElementById("decolorizeColor");
	let elmDecolorizeBackgroundColor = document.getElementById("decolorizeBackgroundColor");
	let elmButtonDefaults = document.getElementById("btnDefaults");
	

	// get saved preferences
	prefs.getHelpBoxOnStart().then((checked) => { elmHelpBoxOnStart.checked = checked; });

	prefs.getViewSourceType().then((type) => {
		if (type === prefs.VIEW_SOURCE_HTML)
			elmViewSourceHtml.checked = (type === prefs.VIEW_SOURCE_HTML);
		else if (type === prefs.VIEW_SOURCE_CSS)
			elmViewSourceCss.checked = true;
	});

	prefs.getColorizeColors().then((colors) => {
		elmColorizeColor.value = colors[0];
		elmColorizeBackgroundColor.value = colors[1];
	});

	prefs.getDecolorizeColors().then((colors) => {
		elmDecolorizeColor.value = colors[0];
		elmDecolorizeBackgroundColor.value = colors[1];
	});


	// save preferences when changed
	elmHelpBoxOnStart.addEventListener("change", () => { prefs.setHelpBoxOnStart(elmHelpBoxOnStart.checked); });
	elmViewSourceHtml.addEventListener("click", () => { prefs.setViewSourceType(prefs.VIEW_SOURCE_HTML); });
	elmViewSourceCss.addEventListener("click", () => { prefs.setViewSourceType(prefs.VIEW_SOURCE_CSS); });
	elmColorizeColor.addEventListener("change", () => { prefs.setColorizeColors( [elmColorizeColor.value, elmColorizeBackgroundColor.value] ); });
	elmColorizeBackgroundColor.addEventListener("change", () => { prefs.setColorizeColors( [elmColorizeColor.value, elmColorizeBackgroundColor.value] ); });
	elmDecolorizeColor.addEventListener("change", () => { prefs.setDecolorizeColors( [elmDecolorizeColor.value, elmDecolorizeBackgroundColor.value] ); });
	elmDecolorizeBackgroundColor.addEventListener("change", () => { prefs.setDecolorizeColors([elmDecolorizeColor.value, elmDecolorizeBackgroundColor.value]); });

	// restore defaults when requestes
	elmButtonDefaults.addEventListener("click", () => {
		let defPrefs = prefs.restoreDefaults();
		elmHelpBoxOnStart.checked = defPrefs.helpBoxOnStart;
		elmViewSourceHtml.checked = (defPrefs.viewSourceType === prefs.VIEW_SOURCE_HTML);
		elmViewSourceCss.checked = (defPrefs.viewSourceType === prefs.VIEW_SOURCE_CSS);
		elmColorizeColor.value = defPrefs.colorizeColors[0];
		elmColorizeBackgroundColor.value = defPrefs.colorizeColors[1];
		elmDecolorizeColor.value = defPrefs.decolorizeColors[0];
		elmDecolorizeBackgroundColor.value = defPrefs.decolorizeColors[1];
	});
	
});
