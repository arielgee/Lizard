"use strict";

document.addEventListener("DOMContentLoaded", () => {

	/////////////////////////////////////////////////////////////////////////////////
	// get elements
	let elmHelpBoxOnStart = document.getElementById("helpBoxOnStart");
	let elmWheelToWiderNarrower = document.getElementById("wheelToWiderNarrower");
	let elmLabelReqRestartSession = document.getElementById("restartSession");
	let elmViewSourceHtml = document.getElementById("viewSrcHtml");
	let elmViewSourceCss = document.getElementById("viewSrcCss");
	let elmOpenViewSourceInWin = document.getElementById("openViewSrcInWin");
	let elmOpenViewSourceInTab = document.getElementById("openViewSrcInTab");
	let elmOpenViewSourceInPage = document.getElementById("openViewSrcInPage");	
	let elmColorizeColor = document.getElementById("colorizeColor");
	let elmColorizeBackgroundColor = document.getElementById("colorizeBackgroundColor");
	let elmDecolorizeColor = document.getElementById("decolorizeColor");
	let elmDecolorizeBackgroundColor = document.getElementById("decolorizeBackgroundColor");
	let elmColorizeChildren = document.getElementById("colorizeChildren");
	let elmColorizeImages = document.getElementById("colorizeImages");
	let elmContextMenu = document.getElementById("contextMenu");
	let elmToolsMenu = document.getElementById("toolsMenu");
	let elmLabelReqRestartExtension = document.getElementById("reloadExtension");

	let elmBtnReloadExtension = document.getElementById("btnReloadExtension");
	let elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");
	

	/////////////////////////////////////////////////////////////////////////////////
	// get saved preferences
	prefs.getHelpBoxOnStart().then((checked) => {
		elmHelpBoxOnStart.checked = checked;
	});

	prefs.getWheelToWiderNarrower().then((checked) => {
		elmWheelToWiderNarrower.checked = checked;
	});

	prefs.getViewSourceType().then((type) => {
		if (type === prefs.SOURCE_TYPE.HTML) {
			elmViewSourceHtml.checked = true;
		} else if (type === prefs.SOURCE_TYPE.CSS) {
			elmViewSourceCss.checked = true;
		}
	});

	prefs.getOpenViewSourceIn().then((value) => {
		if (value === prefs.VIEW_SOURCE_IN_TYPE.WINDOW) {
			elmOpenViewSourceInWin.checked = true;
		} else if (value === prefs.VIEW_SOURCE_IN_TYPE.TAB) {
			elmOpenViewSourceInTab.checked = true;
		} else if (value === prefs.VIEW_SOURCE_IN_TYPE.PAGE) {
			elmOpenViewSourceInPage.checked = true;
		}
	});

	prefs.getColorizeColors().then((colors) => {
		elmColorizeColor.value = colors[0];
		elmColorizeBackgroundColor.value = colors[1];
	});

	prefs.getDecolorizeColors().then((colors) => {
		elmDecolorizeColor.value = colors[0];
		elmDecolorizeBackgroundColor.value = colors[1];
	});

	prefs.getColorizeChildren().then((checked) => {
		elmColorizeChildren.checked = checked;
	});

	prefs.getColorizeImages().then((checked) => {
		elmColorizeImages.checked = checked;
	});

	prefs.getMenuItemContext().then((checked) => {
		elmContextMenu.checked = checked;
	});

	prefs.getMenuItemTools().then((checked) => {
		elmToolsMenu.checked = checked;
	});


	/////////////////////////////////////////////////////////////////////////////////
	// save preferences when changed
	elmHelpBoxOnStart.addEventListener("change", () => { prefs.setHelpBoxOnStart(elmHelpBoxOnStart.checked); });
	elmWheelToWiderNarrower.addEventListener("change", () => {
		prefs.setWheelToWiderNarrower(elmWheelToWiderNarrower.checked);		
		lzUtil.concatClassName(elmLabelReqRestartSession, "flash");
	});
	elmViewSourceHtml.addEventListener("click", () => { prefs.setViewSourceType(prefs.SOURCE_TYPE.HTML); });
	elmViewSourceCss.addEventListener("click", () => { prefs.setViewSourceType(prefs.SOURCE_TYPE.CSS); });
	elmOpenViewSourceInWin.addEventListener("click", () => { prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.WINDOW); });
	elmOpenViewSourceInTab.addEventListener("click", () => { prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.TAB); });
	elmOpenViewSourceInPage.addEventListener("click", () => { prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.PAGE); });
	elmColorizeColor.addEventListener("change", () => { prefs.setColorizeColors( [elmColorizeColor.value, elmColorizeBackgroundColor.value] ); });
	elmColorizeBackgroundColor.addEventListener("change", () => { prefs.setColorizeColors( [elmColorizeColor.value, elmColorizeBackgroundColor.value] ); });
	elmDecolorizeColor.addEventListener("change", () => { prefs.setDecolorizeColors( [elmDecolorizeColor.value, elmDecolorizeBackgroundColor.value] ); });
	elmDecolorizeBackgroundColor.addEventListener("change", () => { prefs.setDecolorizeColors([elmDecolorizeColor.value, elmDecolorizeBackgroundColor.value]); });
	elmColorizeChildren.addEventListener("change", () => { prefs.setColorizeChildren(elmColorizeChildren.checked); });
	elmColorizeImages.addEventListener("change", () => { prefs.setColorizeImages(elmColorizeImages.checked); });
	elmContextMenu.addEventListener("change", () => {
		prefs.setMenuItemContext(elmContextMenu.checked);
		lzUtil.concatClassName(elmLabelReqRestartExtension, "flash");
		lzUtil.concatClassName(elmBtnReloadExtension, "flash");
	});
	elmToolsMenu.addEventListener("change", () => {
		prefs.setMenuItemTools(elmToolsMenu.checked);
		lzUtil.concatClassName(elmLabelReqRestartExtension, "flash");
		lzUtil.concatClassName(elmBtnReloadExtension, "flash");
	});


	/////////////////////////////////////////////////////////////////////////////////
	// restore defaults when requestes
	elmBtnRestoreDefaults.addEventListener("click", () => {
		let defPrefs = prefs.restoreDefaults();

		if (elmWheelToWiderNarrower.checked !== defPrefs.wheelToWiderNarrower) {
			lzUtil.concatClassName(elmLabelReqRestartSession, "flash");
		}
		if (elmContextMenu.checked !== defPrefs.menuItemContext || elmToolsMenu.checked !== defPrefs.menuItemTools) {
			lzUtil.concatClassName(elmLabelReqRestartExtension, "flash");
			lzUtil.concatClassName(elmBtnReloadExtension, "flash");
		}

		elmHelpBoxOnStart.checked = defPrefs.helpBoxOnStart;
		elmWheelToWiderNarrower.checked = defPrefs.wheelToWiderNarrower;
		elmViewSourceHtml.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.HTML);
		elmViewSourceCss.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.CSS);
		elmOpenViewSourceInWin.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.WINDOW);
		elmOpenViewSourceInTab.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.TAB);
		elmOpenViewSourceInPage.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.PAGE);
		elmColorizeColor.value = defPrefs.colorizeColors[0];
		elmColorizeBackgroundColor.value = defPrefs.colorizeColors[1];
		elmDecolorizeColor.value = defPrefs.decolorizeColors[0];
		elmDecolorizeBackgroundColor.value = defPrefs.decolorizeColors[1];
		elmColorizeChildren.checked = defPrefs.colorizeChildren;
		elmColorizeImages.checked = defPrefs.colorizeImages;
		elmContextMenu.checked = defPrefs.menuItemContext;
		elmToolsMenu.checked = defPrefs.menuItemTools;
	});


	/////////////////////////////////////////////////////////////////////////////////
	// reload web extension
	elmBtnReloadExtension.addEventListener("click", () => {
		lzUtil.reloadLizardWebExtensionAndTab();
	});

});
