"use strict";

let preferences = (function() {

	let m_elmHelpBoxOnStart;
	let m_elmWheelToWiderNarrower;
	let m_elmLabelReqRestartSessionMw;
	let m_elmViewSourceHtml;
	let m_elmViewSourceCss;
	let m_elmViewCssMatchRules;
	let m_elmViewCssCompStyle;
	let m_elmOpenViewSourceInWin;
	let m_elmOpenViewSourceInTab;
	let m_elmOpenViewSourceInPage;
	let m_elmColorizeColor;
	let m_elmColorizeBackgroundColor;
	let m_elmDecolorizeColor;
	let m_elmDecolorizeBackgroundColor;
	let m_elmColorizeChildren;
	let m_elmColorizeImages;
	let m_elmContextMenu;
	let m_elmToolsMenu;
	let m_elmRememberPageAlterations;
	let m_elmLabelReqRestartSessionRpa;
	let m_elmExpertMode;
	let m_elmXpModeContextMenu;
	let m_elmLabelReqRestartSessionXp;
	let m_elmLabelReqRestartExtension;

	let m_elmBtnReloadExtension;
	let m_elmBtnRestoreDefaults;

	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		m_elmHelpBoxOnStart = document.getElementById("helpBoxOnStart");
		m_elmWheelToWiderNarrower = document.getElementById("wheelToWiderNarrower");
		m_elmLabelReqRestartSessionMw = document.getElementById("restartSessionMw");
		m_elmViewSourceHtml = document.getElementById("viewSrcHtml");
		m_elmViewSourceCss = document.getElementById("viewSrcCss");
		m_elmViewCssMatchRules = document.getElementById("viewCssMatchRules");
		m_elmViewCssCompStyle = document.getElementById("viewCssCompStyle");
		m_elmOpenViewSourceInWin = document.getElementById("openViewSrcInWin");
		m_elmOpenViewSourceInTab = document.getElementById("openViewSrcInTab");
		m_elmOpenViewSourceInPage = document.getElementById("openViewSrcInPage");
		m_elmColorizeColor = document.getElementById("colorizeColor");
		m_elmColorizeBackgroundColor = document.getElementById("colorizeBackgroundColor");
		m_elmDecolorizeColor = document.getElementById("decolorizeColor");
		m_elmDecolorizeBackgroundColor = document.getElementById("decolorizeBackgroundColor");
		m_elmColorizeChildren = document.getElementById("colorizeChildren");
		m_elmColorizeImages = document.getElementById("colorizeImages");
		m_elmContextMenu = document.getElementById("contextMenu");
		m_elmToolsMenu = document.getElementById("toolsMenu");
		m_elmRememberPageAlterations = document.getElementById("rememberPageAlterations");
		m_elmLabelReqRestartSessionRpa = document.getElementById("restartSessionRpa");
		m_elmExpertMode = document.getElementById("expertMode");
		m_elmXpModeContextMenu = document.getElementById("xpModeContextMenu");
		m_elmLabelReqRestartSessionXp = document.getElementById("restartSessionXp");
		m_elmLabelReqRestartExtension = document.getElementById("reloadExtension");

		m_elmBtnReloadExtension = document.getElementById("btnReloadExtension");
		m_elmBtnRestoreDefaults = document.getElementById("btnRestoreDefaults");

		lzUtil.getBrowserVersion().then((version) => {
			if(parseInt(version) >= 68) {
				document.body.classList.add("noCaptionStyleV68");
			}
		});

		addEventListeners();
		getSavedPreferences();

		handleUnsupportedFeatures();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		removeEventListeners();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		document.documentElement.addEventListener("click", onClickPreference);

		m_elmHelpBoxOnStart.addEventListener("change", onChangeHelpBoxOnStart);
		m_elmWheelToWiderNarrower.addEventListener("change", onChangeWheelToWiderNarrower);
		m_elmViewSourceHtml.addEventListener("click", onClickViewSourceHtml);
		m_elmViewSourceCss.addEventListener("click", onClickViewSourceCss);
		m_elmViewCssMatchRules.addEventListener("click", onClickViewCssMatchRules);
		m_elmViewCssCompStyle.addEventListener("click", onClickViewCssCompStyle);
		m_elmOpenViewSourceInWin.addEventListener("click", onClickOpenViewSourceInWin);
		m_elmOpenViewSourceInTab.addEventListener("click", onClickOpenViewSourceInTab);
		m_elmOpenViewSourceInPage.addEventListener("click", onClickOpenViewSourceInPage);
		m_elmColorizeColor.addEventListener("change", onChangeColorizeColor);
		m_elmColorizeBackgroundColor.addEventListener("change", onChangeColorizeBackgroundColor);
		m_elmDecolorizeColor.addEventListener("change", onChangeDecolorizeColor);
		m_elmDecolorizeBackgroundColor.addEventListener("change", onChangeDecolorizeBackgroundColor);
		m_elmColorizeChildren.addEventListener("change", onChangeColorizeChildren);
		m_elmColorizeImages.addEventListener("change", onChangeColorizeImages);
		m_elmContextMenu.addEventListener("change", onChangeContextMenu);
		m_elmToolsMenu.addEventListener("change", onChangeToolsMenu);
		m_elmRememberPageAlterations.addEventListener("change", onChangeRememberPageAlterations);
		m_elmExpertMode.addEventListener("change", onChangeExpertMode);
		m_elmXpModeContextMenu.addEventListener("change", onChangeXpModeContextMenu);

		m_elmBtnReloadExtension.addEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.addEventListener("click", onClickBtnRestoreDefaults);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function removeEventListeners() {

		document.documentElement.removeEventListener("click", onClickPreference);

		m_elmHelpBoxOnStart.removeEventListener("change", onChangeHelpBoxOnStart);
		m_elmWheelToWiderNarrower.removeEventListener("change", onChangeWheelToWiderNarrower);
		m_elmViewSourceHtml.removeEventListener("click", onClickViewSourceHtml);
		m_elmViewSourceCss.removeEventListener("click", onClickViewSourceCss);
		m_elmViewCssMatchRules.removeEventListener("click", onClickViewCssMatchRules);
		m_elmViewCssCompStyle.removeEventListener("click", onClickViewCssCompStyle);
		m_elmOpenViewSourceInWin.removeEventListener("click", onClickOpenViewSourceInWin);
		m_elmOpenViewSourceInTab.removeEventListener("click", onClickOpenViewSourceInTab);
		m_elmOpenViewSourceInPage.removeEventListener("click", onClickOpenViewSourceInPage);
		m_elmColorizeColor.removeEventListener("change", onChangeColorizeColor);
		m_elmColorizeBackgroundColor.removeEventListener("change", onChangeColorizeBackgroundColor);
		m_elmDecolorizeColor.removeEventListener("change", onChangeDecolorizeColor);
		m_elmDecolorizeBackgroundColor.removeEventListener("change", onChangeDecolorizeBackgroundColor);
		m_elmColorizeChildren.removeEventListener("change", onChangeColorizeChildren);
		m_elmColorizeImages.removeEventListener("change", onChangeColorizeImages);
		m_elmContextMenu.removeEventListener("change", onChangeContextMenu);
		m_elmToolsMenu.removeEventListener("change", onChangeToolsMenu);
		m_elmRememberPageAlterations.removeEventListener("change", onChangeRememberPageAlterations);
		m_elmExpertMode.removeEventListener("change", onChangeExpertMode);
		m_elmXpModeContextMenu.removeEventListener("change", onChangeXpModeContextMenu);

		m_elmBtnReloadExtension.removeEventListener("click", onClickBtnReloadExtension);
		m_elmBtnRestoreDefaults.removeEventListener("click", onClickBtnRestoreDefaults);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getSavedPreferences() {

		prefs.getHelpBoxOnStart().then((checked) => {
			m_elmHelpBoxOnStart.checked = checked;
		});

		prefs.getWheelToWiderNarrower().then((checked) => {
			m_elmWheelToWiderNarrower.checked = checked;
		});

		prefs.getViewSourceType().then((type) => {
			if (type === prefs.SOURCE_TYPE.HTML) {
				m_elmViewSourceHtml.checked = true;
			} else if (type === prefs.SOURCE_TYPE.CSS) {
				m_elmViewSourceCss.checked = true;
			}
			lzUtil.disableElementTree(m_elmViewCssMatchRules.parentElement.parentElement, type === prefs.SOURCE_TYPE.HTML);
		});

		prefs.getViewCssType().then((type) => {
			if (type === prefs.CSS_TYPE.MATCH_RULES) {
				m_elmViewCssMatchRules.checked = true;
			} else if (type === prefs.CSS_TYPE.COMP_STYLE) {
				m_elmViewCssCompStyle.checked = true;
			}
		});

		prefs.getOpenViewSourceIn().then((value) => {
			if (value === prefs.VIEW_SOURCE_IN_TYPE.WINDOW) {
				m_elmOpenViewSourceInWin.checked = true;
			} else if (value === prefs.VIEW_SOURCE_IN_TYPE.TAB) {
				m_elmOpenViewSourceInTab.checked = true;
			} else if (value === prefs.VIEW_SOURCE_IN_TYPE.PAGE) {
				m_elmOpenViewSourceInPage.checked = true;
			}
		});

		prefs.getColorizeColors().then((colors) => {
			m_elmColorizeColor.value = colors[0];
			m_elmColorizeBackgroundColor.value = colors[1];
		});

		prefs.getDecolorizeColors().then((colors) => {
			m_elmDecolorizeColor.value = colors[0];
			m_elmDecolorizeBackgroundColor.value = colors[1];
		});

		prefs.getColorizeChildren().then((checked) => {
			m_elmColorizeChildren.checked = checked;
		});

		prefs.getColorizeImages().then((checked) => {
			m_elmColorizeImages.checked = checked;
		});

		prefs.getMenuItemContext().then((checked) => {
			m_elmContextMenu.checked = checked;
		});

		prefs.getMenuItemTools().then((checked) => {
			m_elmToolsMenu.checked = checked;
		});

		prefs.getRememberPageAlterations().then((checked) => {
			m_elmRememberPageAlterations.checked = checked;
		});

		prefs.getExpertMode().then((checked) => {
			m_elmExpertMode.checked = checked;
			lzUtil.disableElementTree(m_elmXpModeContextMenu.parentElement.parentElement, !checked);
		});

		prefs.getXpModeContextMenu().then((checked) => {
			m_elmXpModeContextMenu.checked = checked;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickPreference(event) {

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
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeHelpBoxOnStart() {
		prefs.setHelpBoxOnStart(m_elmHelpBoxOnStart.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeWheelToWiderNarrower() {
		prefs.setWheelToWiderNarrower(m_elmWheelToWiderNarrower.checked);
		m_elmLabelReqRestartSessionMw.classList.add("flash");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickViewSourceHtml() {
		prefs.setViewSourceType(prefs.SOURCE_TYPE.HTML);
		lzUtil.disableElementTree(m_elmViewCssMatchRules.parentElement.parentElement, true);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickViewSourceCss() {
		prefs.setViewSourceType(prefs.SOURCE_TYPE.CSS);
		lzUtil.disableElementTree(m_elmViewCssMatchRules.parentElement.parentElement, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickViewCssMatchRules() {
		prefs.setViewCssType(prefs.CSS_TYPE.MATCH_RULES);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickViewCssCompStyle() {
		prefs.setViewCssType(prefs.CSS_TYPE.COMP_STYLE);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickOpenViewSourceInWin() {
		prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.WINDOW);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickOpenViewSourceInTab() {
		prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.TAB);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickOpenViewSourceInPage() {
		prefs.setOpenViewSourceIn(prefs.VIEW_SOURCE_IN_TYPE.PAGE);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorizeColor() {
		prefs.setColorizeColors( [m_elmColorizeColor.value, m_elmColorizeBackgroundColor.value] );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorizeBackgroundColor() {
		prefs.setColorizeColors( [m_elmColorizeColor.value, m_elmColorizeBackgroundColor.value] );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeDecolorizeColor() {
		prefs.setDecolorizeColors( [m_elmDecolorizeColor.value, m_elmDecolorizeBackgroundColor.value] );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeDecolorizeBackgroundColor() {
		prefs.setDecolorizeColors( [m_elmDecolorizeColor.value, m_elmDecolorizeBackgroundColor.value] );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorizeChildren() {
		prefs.setColorizeChildren(m_elmColorizeChildren.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeColorizeImages() {
		prefs.setColorizeImages(m_elmColorizeImages.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeContextMenu() {
		prefs.setMenuItemContext(m_elmContextMenu.checked);
		m_elmLabelReqRestartExtension.classList.add("flash");
		m_elmBtnReloadExtension.classList.add("flash");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeToolsMenu() {
		prefs.setMenuItemTools(m_elmToolsMenu.checked);
		m_elmLabelReqRestartExtension.classList.add("flash");
		m_elmBtnReloadExtension.classList.add("flash");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeRememberPageAlterations() {
		prefs.setRememberPageAlterations(m_elmRememberPageAlterations.checked);
		m_elmLabelReqRestartSessionRpa.classList.add("flash");
		lzUtil.toggleRememberPageAlterations();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeExpertMode() {
		prefs.setExpertMode(m_elmExpertMode.checked);
		m_elmLabelReqRestartSessionXp.classList.add("flash");
		lzUtil.disableElementTree(m_elmXpModeContextMenu.parentElement.parentElement, !m_elmExpertMode.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onChangeXpModeContextMenu() {
		prefs.setXpModeContextMenu(m_elmXpModeContextMenu.checked);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnReloadExtension() {
		lzUtil.reloadLizardWebExtensionAndTab();
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRestoreDefaults() {
		let defPrefs = prefs.restoreDefaults();

		lzUtil.disableElementTree(m_elmViewCssMatchRules.parentElement.parentElement, defPrefs.viewSourceType === prefs.SOURCE_TYPE.HTML);
		lzUtil.disableElementTree(m_elmXpModeContextMenu.parentElement.parentElement, !defPrefs.xpModeContextMenu);

		if (m_elmWheelToWiderNarrower.checked !== defPrefs.wheelToWiderNarrower) {
			m_elmLabelReqRestartSessionMw.classList.add("flash");
		}
		if (m_elmContextMenu.checked !== defPrefs.menuItemContext || m_elmToolsMenu.checked !== defPrefs.menuItemTools) {
			m_elmLabelReqRestartExtension.classList.add("flash");
			m_elmBtnReloadExtension.classList.add("flash");
		}
		if (m_elmRememberPageAlterations.checked !== defPrefs.rememberPageAlterations) {
			m_elmLabelReqRestartSessionRpa.classList.add("flash");
		}
		if (m_elmExpertMode.checked !== defPrefs.expertMode) {
			m_elmLabelReqRestartSessionXp.classList.add("flash");
		}

		m_elmHelpBoxOnStart.checked = defPrefs.helpBoxOnStart;
		m_elmWheelToWiderNarrower.checked = defPrefs.wheelToWiderNarrower;
		m_elmViewSourceHtml.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.HTML);
		m_elmViewSourceCss.checked = (defPrefs.viewSourceType === prefs.SOURCE_TYPE.CSS);
		m_elmViewCssMatchRules.checked = (defPrefs.viewCssType === prefs.CSS_TYPE.MATCH_RULES);
		m_elmViewCssCompStyle.checked = (defPrefs.viewCssType === prefs.CSS_TYPE.COMP_STYLE);
		m_elmOpenViewSourceInWin.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.WINDOW);
		m_elmOpenViewSourceInTab.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.TAB);
		m_elmOpenViewSourceInPage.checked = (defPrefs.OpenViewSourceIn === prefs.VIEW_SOURCE_IN_TYPE.PAGE);
		m_elmColorizeColor.value = defPrefs.colorizeColors[0];
		m_elmColorizeBackgroundColor.value = defPrefs.colorizeColors[1];
		m_elmDecolorizeColor.value = defPrefs.decolorizeColors[0];
		m_elmDecolorizeBackgroundColor.value = defPrefs.decolorizeColors[1];
		m_elmColorizeChildren.checked = defPrefs.colorizeChildren;
		m_elmColorizeImages.checked = defPrefs.colorizeImages;
		m_elmContextMenu.checked = defPrefs.menuItemContext;
		m_elmToolsMenu.checked = defPrefs.menuItemTools;
		m_elmRememberPageAlterations.checked = defPrefs.rememberPageAlterations;
		m_elmExpertMode.checked = defPrefs.expertMode;
		m_elmXpModeContextMenu.checked = defPrefs.xpModeContextMenu;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function handleUnsupportedFeatures() {

		lzUtil.unsupportedExtensionFeatures().then((unsupportedFeatures) => {

			if(unsupportedFeatures.includes("rememberPageAlterations")) {
				m_elmRememberPageAlterations.checked = false;
				lzUtil.disableElementTree(m_elmRememberPageAlterations.parentElement.parentElement, true);
			}
		});
	}
})();
