"use strict";

document.addEventListener("DOMContentLoaded", () => {

	/////////////////////////////////////////////////////////////////////////////////
	// get elements
	let elmHelpBoxOnStart = document.getElementById("helpBoxOnStart");
	let elmWheelToWiderNarrower = document.getElementById("wheelToWiderNarrower");
	let elmLabelReqRestartSessionMw = document.getElementById("restartSessionMw");
	let elmViewSourceHtml = document.getElementById("viewSrcHtml");
	let elmViewSourceCss = document.getElementById("viewSrcCss");
	let elmViewCssMatchRules = document.getElementById("viewCssMatchRules");
	let elmViewCssCompStyle = document.getElementById("viewCssCompStyle");
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
	let elmExpertMode = document.getElementById("expertMode");
	let elmXpModeContextMenu = document.getElementById("xpModeContextMenu");
	let elmLabelReqRestartSessionXp = document.getElementById("restartSessionXp");
	let elmLabelReqRestartExtension = document.getElementById("reloadExtension");

	let elmBtnReloadExtension = document.getElementById("btnReloadExtension");
	let elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

	lzUtil.getBrowserVersion().then((version) => {
		if(version >= "68.0") {
			document.body.classList.add("noCaptionStyleV68");
		}
	});


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
		lzUtil.disableElementTree(elmViewCssMatchRules.parentElement.parentElement, type === prefs.SOURCE_TYPE.HTML);
	});

	prefs.getViewCssType().then((type) => {
		if (type === prefs.CSS_TYPE.MATCH_RULES) {
			elmViewCssMatchRules.checked = true;
		} else if (type === prefs.CSS_TYPE.COMP_STYLE) {
			elmViewCssCompStyle.checked = true;
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

	prefs.getExpertMode().then((checked) => {
		elmExpertMode.checked = checked;
		lzUtil.disableElementTree(elmXpModeContextMenu.parentElement.parentElement, !checked);
	});

	prefs.getXpModeContextMenu().then((checked) => {
		elmXpModeContextMenu.checked = checked;
	});


	/////////////////////////////////////////////////////////////////////////////////
	// save preferences when changed

	document.documentElement.addEventListener("click", (event) => {
		if( !!event.target && event.target.classList.contains("preference") ) {

			let elmInputs = event.target.querySelectorAll("input[type=checkbox],input[type=text]");

			if(elmInputs.length === 1) {
				event.stopPropagation();

				if(elmInputs[0].type === "checkbox") {
					elmInputs[0].click();
				} else if(elmInputs[0].type === "text") {
					elmInputs[0].focus();
					elmInputs[0].select();
				}
			}
		}
	});

	elmHelpBoxOnStart.addEventListener("change", () => { prefs.setHelpBoxOnStart(elmHelpBoxOnStart.checked); });
	elmWheelToWiderNarrower.addEventListener("change", () => {
		prefs.setWheelToWiderNarrower(elmWheelToWiderNarrower.checked);
		elmLabelReqRestartSessionMw.classList.add("flash");
	});
	elmViewSourceHtml.addEventListener("click", () => {
		prefs.setViewSourceType(prefs.SOURCE_TYPE.HTML);
		lzUtil.disableElementTree(elmViewCssMatchRules.parentElement.parentElement, true);
	});
	elmViewSourceCss.addEventListener("click", () => {
		prefs.setViewSourceType(prefs.SOURCE_TYPE.CSS);
		lzUtil.disableElementTree(elmViewCssMatchRules.parentElement.parentElement, false);
	});
	elmViewCssMatchRules.addEventListener("click", () => { prefs.setViewCssType(prefs.CSS_TYPE.MATCH_RULES); });
	elmViewCssCompStyle.addEventListener("click", () => { prefs.setViewCssType(prefs.CSS_TYPE.COMP_STYLE); });
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
		elmLabelReqRestartExtension.classList.add("flash");
		elmBtnReloadExtension.classList.add("flash");
	});
	elmToolsMenu.addEventListener("change", () => {
		prefs.setMenuItemTools(elmToolsMenu.checked);
		elmLabelReqRestartExtension.classList.add("flash");
		elmBtnReloadExtension.classList.add("flash");
	});
	elmExpertMode.addEventListener("change", () => {
		prefs.setExpertMode(elmExpertMode.checked);
		elmLabelReqRestartSessionXp.classList.add("flash");
		lzUtil.disableElementTree(elmXpModeContextMenu.parentElement.parentElement, !elmExpertMode.checked);
	});
	elmXpModeContextMenu.addEventListener("change", () => { prefs.setXpModeContextMenu(elmXpModeContextMenu.checked); });


	/////////////////////////////////////////////////////////////////////////////////
	// restore defaults when requestes
	elmBtnRestoreDefaults.addEventListener("click", () => {
		let defPrefs = prefs.restoreDefaults();

		lzUtil.disableElementTree(elmViewCssMatchRules.parentElement.parentElement, defPrefs.viewSourceType === prefs.SOURCE_TYPE.HTML);
		lzUtil.disableElementTree(elmXpModeContextMenu.parentElement.parentElement, !defPrefs.xpModeContextMenu);

		if (elmWheelToWiderNarrower.checked !== defPrefs.wheelToWiderNarrower) {
			elmLabelReqRestartSessionMw.classList.add("flash");
		}
		if (elmContextMenu.checked !== defPrefs.menuItemContext || elmToolsMenu.checked !== defPrefs.menuItemTools) {
			elmLabelReqRestartExtension.classList.add("flash");
			elmBtnReloadExtension.classList.add("flash");
		}
		if (elmExpertMode.checked !== defPrefs.expertMode) {
			elmLabelReqRestartSessionXp.classList.add("flash");
		}

		elmHelpBoxOnStart.checked = defPrefs.helpBoxOnStart;
		elmWheelToWiderNarrower.checked = defPrefs.wheelToWiderNarrower;
		elmViewSourceHtml.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.HTML);
		elmViewSourceCss.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.CSS);
		elmViewCssMatchRules.checked = (defPrefs.viewCssType === prefs.CSS_TYPE.MATCH_RULES);
		elmViewCssCompStyle.checked = (defPrefs.viewCssType === prefs.CSS_TYPE.COMP_STYLE);
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
		elmExpertMode.checked = defPrefs.expertMode;
		elmXpModeContextMenu.checked = defPrefs.xpModeContextMenu;
	});


	/////////////////////////////////////////////////////////////////////////////////
	// reload web extension
	elmBtnReloadExtension.addEventListener("click", () => {
		lzUtil.reloadLizardWebExtensionAndTab();
	});

});
