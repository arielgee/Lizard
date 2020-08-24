"use strict";

(function() {

	const ATTR_STRING_RULE = "data-stringified-rule";

	let m_elmTextFilterURLs;
	let m_elmBtnClearFilterURLs;
	let m_elmBtnRefreshURLs;
	let m_elmBtnDeleteRule;
	let m_elmBtnDeleteAllRules;
	let m_elmListURLs;
	let m_elmAnchorURL;
	let m_elmNotifyUrlsList;

	let m_elmTextFilterSelectors;
	let m_elmBtnClearFilterSelectors;
	let m_elmBtnRefreshSelectors;
	let m_elmBtnDeleteSelector;
	let m_elmListSelectors;
	let m_elmNotifySelectorsList;

	let m_elmBtnSave;
	let m_elmBtnRevert;
	let m_elmRuleProperties;
	let m_elmTextRuleDetails;
	let m_elmNotifyRuleDetails;


	let m_lizardDB = new LizardDB();

	let m_filterChangeDebouncer = null;
	let m_textAreaChangeDebouncer = null;

	let m_elmSelListItemURL = null;
	let m_elmSelListItemSelector = null;
	let m_strMirrorJsonRuleDetails = "";
	let m_objValidModifiedRuleDetails = null;


	initialization();

	////////////////////////////////////////////////////////////////////////////////////
	function initialization() {
		document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.addEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onDOMContentLoaded() {

		// URLs
		m_elmTextFilterURLs = document.getElementById("textFilterURLs");
		m_elmBtnClearFilterURLs = document.getElementById("btnClearFilterURLs");
		m_elmBtnRefreshURLs = document.getElementById("btnRefreshURLs");
		m_elmBtnDeleteRule = document.getElementById("btnDeleteRule");
		m_elmBtnDeleteAllRules = document.getElementById("btnDeleteAllRules");
		m_elmListURLs = document.getElementById("urlsList");
		m_elmAnchorURL = document.getElementById("anchorURL");
		m_elmNotifyUrlsList = document.getElementById("notifyUrlsList");

		// Selectors
		m_elmTextFilterSelectors = document.getElementById("textFilterSelectors");
		m_elmBtnClearFilterSelectors = document.getElementById("btnClearFilterSelectors");
		m_elmBtnRefreshSelectors = document.getElementById("btnRefreshSelectors");
		m_elmBtnDeleteSelector = document.getElementById("btnDeleteSelector");
		m_elmListSelectors = document.getElementById("selectorsList");
		m_elmNotifySelectorsList = document.getElementById("notifySelectorsList");

		// Details
		m_elmBtnSave = document.getElementById("btnSave");
		m_elmBtnRevert = document.getElementById("btnRevert");
		m_elmRuleProperties = document.getElementById("ruleProperties");
		m_elmTextRuleDetails = document.getElementById("textRuleDetails");
		m_elmNotifyRuleDetails = document.getElementById("notifyRuleDetails");

		addEventListeners();

		m_lizardDB.open().then(() => loadURLsList() );
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onUnload(event) {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function addEventListeners() {

		document.getElementById("mainDashboard").addEventListener("click", (event) => {
			let runIt = event.shiftKey && event.ctrlKey && event.altKey &&
						event.target.tagName === "IMG" &&
						event.clientX >= 22 && event.clientX <= 27 &&
						event.clientY >= 32 && event.clientY <= 37;
			if(runIt) _add_testing_rules();
		});


		// URLs
		m_elmTextFilterURLs.addEventListener("input", onInputChangeFilterURLsText);
		m_elmTextFilterURLs.addEventListener("keydown", onKeyDownFilterURLsText);
		m_elmBtnClearFilterURLs.addEventListener("click", onClickBtnClearFilterURLs);
		m_elmBtnRefreshURLs.addEventListener("click", onClickBtnRefreshURLs);
		m_elmBtnDeleteRule.addEventListener("click", onClickBtnDeleteRule);
		m_elmBtnDeleteAllRules.addEventListener("click", onClickBtnDeleteAllRules);
		m_elmListURLs.addEventListener("mousedown", onMouseDownURLsList);
		m_elmListURLs.addEventListener("keydown", onKeyDownList);

		// Selectors
		m_elmTextFilterSelectors.addEventListener("input", onInputChangeFilterSelectorsText);
		m_elmTextFilterSelectors.addEventListener("keydown", onKeyDownFilterSelectorsText);
		m_elmBtnClearFilterSelectors.addEventListener("click", onClickBtnClearFilterSelectors);
		m_elmBtnRefreshSelectors.addEventListener("click", onClickBtnRefreshSelectors);
		m_elmBtnDeleteSelector.addEventListener("click", onClickBtnDeleteSelector);
		m_elmListSelectors.addEventListener("mousedown", onMouseDownSelectorsList);
		m_elmListSelectors.addEventListener("keydown", onKeyDownList);

		// Details
		m_elmBtnSave.addEventListener("click", onClickBtnSave);
		m_elmBtnRevert.addEventListener("click", onClickBtnRevert);
		m_elmTextRuleDetails.addEventListener("input", onInputChangeRuleDetailsText);
	}


	/************************************************************************************************************/
	/** URLs **/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeFilterURLsText() {
		filterInputChange(m_elmTextFilterURLs, m_elmListURLs);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownFilterURLsText(event) {
		if(event.code === "Escape") {
			m_elmTextFilterURLs.value = "";
			filterInputChange(m_elmTextFilterURLs, m_elmListURLs);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnClearFilterURLs() {
		m_elmTextFilterURLs.value = "";
		filterInputChange(m_elmTextFilterURLs, m_elmListURLs);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRefreshURLs() {
		loadURLsList();
		notifyAction(m_elmNotifyUrlsList, "Refreshed");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteRule() {

		if(!!m_elmSelListItemURL && m_elmSelListItemURL.style.display !== "none") {

			if( messageBox("Delete the following rule?\n\n'" + m_elmSelListItemURL.textContent + "'", "confirm") ) {
				m_lizardDB.deleteRulesByUrl(m_elmSelListItemURL.textContent).then(() => {
					notifyAction(m_elmNotifyUrlsList, "Deleted");
					loadURLsList();
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteAllRules() {

		if(m_elmListURLs.children.length > 0) {

			let replay = messageBox("Delete all rules?\n\nType the word 'YES' to confirm.\n\n", "prompt");
			if ((replay || "").toLowerCase() === "yes") {
				m_lizardDB.deleteAllRules().then(() => {
					notifyAction(m_elmNotifyUrlsList, "All Deleted");
					clearURLsList();
					clearAnchorURL();
					clearSelectorsList();
					clearRuleDetails();
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownURLsList(event) {
		if(event.target.tagName === "LI") {
			selectURLsListItem(event.target);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownList(event) {

		let lstItem = event.target;
		let list = lstItem.parentElement;
		let keyboardAction, elm, index;

		if(lstItem.tagName !== "LI") return;


		if(event.ctrlKey && (event.code === "KeyC" || event.key === "Insert")) {
			keyboardAction = "CopyToClipboard";
		} else {
			keyboardAction = event.code;
		}

		switch (keyboardAction) {
			case "CopyToClipboard":
				lzUtil.writeTextToClipboard(lstItem.textContent);
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Tab":
				elm = event.shiftKey ? lstItem.previousElementSibling : lstItem.nextElementSibling;
				break;
				/////////////////////////////////////////////////////////////////////////

			case "Home":
				elm = list.firstElementChild;
				break;
				/////////////////////////////////////////////////////////////////////////

			case "End":
				elm = list.lastElementChild;
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowUp":
				elm = lstItem.previousElementSibling;
				break;
				/////////////////////////////////////////////////////////////////////////

			case "ArrowDown":
				elm = lstItem.nextElementSibling;
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageUp":
				index = ([].indexOf.call(list.children, lstItem)) - (lzUtil.numberOfVItemsInViewport(lstItem, list) - 1);
				elm = list.children[index < 0 ? 0 : index];
				break;
				/////////////////////////////////////////////////////////////////////////

			case "PageDown":
				index = ([].indexOf.call(list.children, lstItem)) + (lzUtil.numberOfVItemsInViewport(lstItem, list) - 1);
				elm = (index >= list.children.length) ? list.lastElementChild : list.children[index];
				break;
				/////////////////////////////////////////////////////////////////////////

			default:
				return;		// do not stop propagation
				/////////////////////////////////////////////////////////////////////////
		}

		if(!!elm) {
			elm.focus();

			if(elm.classList.contains("url")) {
				selectURLsListItem(elm);
			} else if(elm.classList.contains("selector")) {
				selectSelectorsListItem(elm)
			}
		}

		//event.stopPropagation();
		event.preventDefault();
	}

	/************************************************************************************************************/
	/** Selectors **/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeFilterSelectorsText() {
		filterInputChange(m_elmTextFilterSelectors, m_elmListSelectors);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownFilterSelectorsText(event) {
		if(event.code === "Escape") {
			m_elmTextFilterSelectors.value = "";
			filterInputChange(m_elmTextFilterSelectors, m_elmListSelectors);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnClearFilterSelectors() {
		m_elmTextFilterSelectors.value = "";
		filterInputChange(m_elmTextFilterSelectors, m_elmListSelectors);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRefreshSelectors() {
		if(!!m_elmSelListItemURL) {
			loadSelectorsList(m_elmSelListItemURL.textContent);
			notifyAction(m_elmNotifySelectorsList, "Refreshed");
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteSelector() {

		if(!!m_elmSelListItemURL && !!m_elmSelListItemSelector && m_elmSelListItemSelector.style.display !== "none") {

			m_lizardDB.deleteRule(m_elmSelListItemURL.textContent, m_elmSelListItemSelector.textContent).then(() => {
				notifyAction(m_elmNotifySelectorsList, "Deleted");
				if(!!m_elmSelListItemURL) {
					loadSelectorsList(m_elmSelListItemURL.textContent);
				}
			});
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onMouseDownSelectorsList(event) {
		if(event.target.tagName === "LI") {
			selectSelectorsListItem(event.target);
		}
	}


	/************************************************************************************************************/
	/** Details **/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeRuleDetailsText() {
		clearTimeout(m_textAreaChangeDebouncer);
		m_textAreaChangeDebouncer = setTimeout(() => {
			validateRuleDetailsText();
			m_textAreaChangeDebouncer = null;
		}, 200);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnSave() {

		if(!!m_elmSelListItemSelector) {

			if(m_elmTextRuleDetails.classList.contains("editValid")) {
				saveModifiedRule();
			} else if(m_elmTextRuleDetails.classList.contains("editError")) {
				messageBox("The values or structure of the details are invalid.");
			} else {
				messageBox("None of the values were modified.");
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnRevert() {

		if(!!m_elmSelListItemSelector) {

			if(m_strMirrorJsonRuleDetails.length === 0) {
				messageBox("Revert data was not found. This should not have happened.");
			} else {
				m_elmTextRuleDetails.value = m_strMirrorJsonRuleDetails;
				notifyAction(m_elmNotifyRuleDetails, "Reverted");
				validateRuleDetailsText();
			}
		}
	}


	/************************************************************************************************************/
	/************************************************************************************************************/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function loadURLsList() {

		clearURLsList();
		m_elmTextFilterURLs.value = "";

		m_lizardDB.getAllDistinctUrls().then((urls) => {
			for(let i=0, len=urls.length; i<len; i++) {
				m_elmListURLs.appendChild(createListItem(urls[i], "url"));
			}

			if(!!m_elmListURLs.firstElementChild) {
				m_elmListURLs.firstElementChild.focus();
				selectURLsListItem(m_elmListURLs.firstElementChild);
			} else {
				clearAnchorURL();
				clearSelectorsList();
				clearRuleDetails();
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function loadSelectorsList(url, focusFirstItem = true) {

		clearSelectorsList();
		m_elmTextFilterSelectors.value = "";

		m_lizardDB.getRules(url).then((rules) => {
			for(let i=0, len=rules.length; i<len; i++) {
				m_elmListSelectors.appendChild(createListItem(rules[i].cssSelector, "selector", [{
					name: ATTR_STRING_RULE,
					value: JSON.stringify(rules[i]).escapeMarkup()
				}]));
			}

			if(!!m_elmListSelectors.firstElementChild) {
				if(focusFirstItem) {
					m_elmListSelectors.firstElementChild.focus();
				} else {
					m_elmListSelectors.firstElementChild.scrollTop = 0;
				}
				selectSelectorsListItem(m_elmListSelectors.firstElementChild);
			} else {
				clearRuleDetails();
				loadURLsList();		// URL no longer exists if it has no selectors
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function selectURLsListItem(elmListItem) {

		if(!!m_elmSelListItemURL) m_elmSelListItemURL.classList.remove("selected");
		elmListItem.classList.add("selected");

		m_elmSelListItemURL = elmListItem;

		m_elmAnchorURL.href = m_elmAnchorURL.textContent = m_elmSelListItemURL.textContent;
		m_elmAnchorURL.title = `URL No. ${[...m_elmSelListItemURL.parentElement.children].indexOf(m_elmSelListItemURL)+1}`;
		loadSelectorsList(m_elmSelListItemURL.textContent, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function selectSelectorsListItem(elmListItem) {

		if(!!m_elmSelListItemSelector) m_elmSelListItemSelector.classList.remove("selected");
		elmListItem.classList.add("selected");

		m_elmSelListItemSelector = elmListItem;

		clearRuleDetails(false);

		let objRule = JSON.parse(m_elmSelListItemSelector.getAttribute(ATTR_STRING_RULE).unescapeMarkup());

		m_elmRuleProperties.appendChild(createPropertyLabel("Created", (new Date(objRule.created)).toLocaleString()));
		m_elmRuleProperties.appendChild(createPropertyLabel("Last Used", objRule.lastUsed === 0 ? "{never}" : (new Date(objRule.lastUsed)).toLocaleString()));
		m_elmRuleProperties.appendChild(createPropertyLabel("Hit Count", objRule.hitCount));

		delete objRule.url;
		delete objRule.cssSelector;
		delete objRule.created;
		delete objRule.lastUsed;
		delete objRule.hitCount;

		m_elmTextRuleDetails.value = mirrorJsonRuleDetails(objRule);
		m_elmTextRuleDetails.classList.remove("editValid", "editError");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function saveModifiedRule() {

		if( !!m_objValidModifiedRuleDetails && !!m_elmSelListItemURL && !!m_elmSelListItemSelector ) {

			let hasValue = 	m_objValidModifiedRuleDetails.hide ||
							m_objValidModifiedRuleDetails.remove ||
							m_objValidModifiedRuleDetails.dewidthify ||
							m_objValidModifiedRuleDetails.isolate ||
							m_objValidModifiedRuleDetails.color !== null;

			if(hasValue) {
				m_lizardDB.setRule(m_elmSelListItemURL.textContent, m_elmSelListItemSelector.textContent, m_objValidModifiedRuleDetails).then(() => {

					m_strMirrorJsonRuleDetails = mirrorJsonRuleDetails(m_objValidModifiedRuleDetails);

					// get stale rule properties from the the selected list item
					let freshRule = JSON.parse(m_elmSelListItemSelector.getAttribute(ATTR_STRING_RULE).unescapeMarkup());

					// refresh it by assigning modified properties
					Object.assign(freshRule, m_objValidModifiedRuleDetails);

					// reapply to selected list item
					m_elmSelListItemSelector.setAttribute(ATTR_STRING_RULE, JSON.stringify(freshRule).escapeMarkup());

					m_elmTextRuleDetails.classList.remove("editValid");
					notifyAction(m_elmNotifyRuleDetails, "Saved");

				});
			} else {
				messageBox("This selector has no value.\n\nAll fields are either 'false' or 'null'. It's better to delete it from the 'Delete Selector' button.", "alert", false);
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function filterInputChange(elmTextFilter, elmList) {

		clearTimeout(m_filterChangeDebouncer);
		m_filterChangeDebouncer = setTimeout(() => {

			let textFilter = elmTextFilter.value.toLowerCase();
			let childrenList = elmList.children;

			for(let i=0, len=childrenList.length; i<len; i++) {
				childrenList[i].style.display = childrenList[i].textContent.toLowerCase().includes(textFilter) ? "list-item" : "none";
			}

			m_filterChangeDebouncer = null;
		}, 150);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function validateRuleDetailsText() {

		m_objValidModifiedRuleDetails = null;

		let obj, text = m_elmTextRuleDetails.value;

		// If the JSON has changed, differ from m_strMirrorJsonRuleDetails that was set in selectSelectorsListItem()
		if(text !== m_strMirrorJsonRuleDetails) {

			try {
				obj = JSON.parse(text);
			} catch(error) {
				if( !error.message.startsWith("JSON.parse:") ) console.log("[Lizard]", error);
				m_elmTextRuleDetails.classList.add("editError");
				m_elmTextRuleDetails.classList.remove("editValid");
				return;		// JSON parsing error
			}

			let isValid =	Object.keys(obj).length === 5 &&
							obj.hasOwnProperty("hide") && (typeof(obj.hide) === "boolean") &&
							obj.hasOwnProperty("remove") && (typeof(obj.remove) === "boolean") &&
							obj.hasOwnProperty("dewidthify") && (typeof(obj.dewidthify) === "boolean") &&
							obj.hasOwnProperty("isolate") && (typeof(obj.isolate) === "boolean") &&
							obj.hasOwnProperty("color") && LizardDB.isColorObjectValid(obj.color);

			m_objValidModifiedRuleDetails = isValid ? obj : null;
			m_elmTextRuleDetails.classList.add( isValid ? "editValid" : "editError" );
			m_elmTextRuleDetails.classList.remove( isValid ? "editError" : "editValid" );

		} else {
			m_elmTextRuleDetails.classList.remove("editValid", "editError");		// not differ then saved; no shadow color
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function clearURLsList() {
		while(!!m_elmListURLs.firstElementChild) {
			m_elmListURLs.removeChild(m_elmListURLs.firstElementChild);
		}
		m_elmSelListItemURL = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function clearAnchorURL() {
		m_elmAnchorURL.href = m_elmAnchorURL.title = m_elmAnchorURL.textContent = "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function clearSelectorsList() {
		while(!!m_elmListSelectors.firstElementChild) {
			m_elmListSelectors.removeChild(m_elmListSelectors.firstElementChild);
		}
		m_elmSelListItemSelector = null;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function clearRuleDetails(clearTextRuleDetails = true) {
		while(!!m_elmRuleProperties.firstElementChild) {
			m_elmRuleProperties.removeChild(m_elmRuleProperties.firstElementChild);
		}
		if(clearTextRuleDetails) m_elmTextRuleDetails.value = "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createListItem(textContent, className, attributes = []) {

		let elmLI = document.createElement("li");

		elmLI.className = className;
		elmLI.tabIndex = 0;
		elmLI.textContent = textContent;
		for(let i=0, len=attributes.length; i<len; i++) {
			elmLI.setAttribute(attributes[i].name, attributes[i].value);
		}

		return elmLI;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function createPropertyLabel(name, value) {

		let elmLabel = document.createElement("label");
		let elmName = document.createElement("b");
		let elmValue = document.createElement("span");

		elmLabel.className = "propertyLabel";
		elmName.textContent = name + ": ";
		elmValue.textContent = value;

		elmLabel.appendChild(elmName);
		elmLabel.appendChild(elmValue);

		return elmLabel;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function messageBox(msgText, type = "alert", fail = true) {

		const prefixMessage = "➤ ";
		const failPrefixMessage = prefixMessage + "Failed to Complete the Operation!\n\n";

		if(type === "alert") {
			return alert((fail ? failPrefixMessage : prefixMessage) + msgText + "\n\n");
		} else if(type === "confirm") {
			return confirm(prefixMessage + msgText + "\n\n");
		} else if(type === "prompt") {
			return prompt(prefixMessage + msgText);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function mirrorJsonRuleDetails(objRule) {
		return m_strMirrorJsonRuleDetails = JSON.stringify(objRule, null, "  ");
	}

	////////////////////////////////////////////////////////////////////////////////////
	function notifyAction(elmOverlay, textOverlay, timeout = 1000) {
		elmOverlay.textContent = textOverlay;
		elmOverlay.style.opacity = "50%";
		setTimeout(() => elmOverlay.style.opacity = "0", timeout);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function _add_testing_rules(selectorsForUrl = 17) {

		const msg = "Congratulations! You've stumbled upon a hidden testing function.\n\n" +
					"This will add an untold number of meaningless rules to the extension's database,\n" +
					"and it's going be exhausting to clean without deleting all the rules.\n\nContinue?\n\n\n" +
					"* Watch the console for progress.";

		if( !messageBox(msg, "confirm") ) return;

		const logStyle = "font-size:150%;color:red;"

		console.log("%c[Lizard] _add_testing_rules(): ▶️ Started. Wait for it...", logStyle);

		const hosts = 73;
		let urls = [];

		for(let i=0; i<hosts; i++) {
			urls.push(lzUtil.getUniqId("https://www.host", (!!(lzUtil.random1to100()%2)?6:10)) +
										(!!(lzUtil.random1to100()%2) ? lzUtil.getUniqId(".com/path", lzUtil.random1to100()) : lzUtil.getUniqId(".net.hk/folder", lzUtil.random1to100())) +
										(!!(lzUtil.random1to100()%2) ? lzUtil.getUniqId("/page", 8) : lzUtil.getUniqId("/web", 48)) +
										(!!(lzUtil.random1to100()%2) ? ".html" : ".asp"));
		}

		let pause = (timeout) => { return new Promise((resolve) => setTimeout(() => resolve(), timeout) ); };

		for(let i=0, len=urls.length; i<len; i++) {
			for(let j=0; j<selectorsForUrl; j++) {
				await m_lizardDB.setRule(urls[i], !!(lzUtil.random1to100()%2) ? lzUtil.getUniqId("#id", j===6?8192:100) : lzUtil.getUniqId(".cls", j===3?8192:32), {
					hide:		!!(lzUtil.random1to100()%2),
					remove:		!!(lzUtil.random1to100()%2),
					dewidthify:	!!(lzUtil.random1to100()%2),
					isolate:	!!(lzUtil.random1to100()%2),
				});
			}
			console.log("%c[Lizard] _add_testing_rules(): ⏩ Added so far: " + selectorsForUrl*(i+1) + " ✔️", logStyle);
			await pause(10);
		}
		loadURLsList();
		notifyAction(m_elmNotifyUrlsList, hosts*selectorsForUrl + " rules added", 2000);
		console.log("%c[Lizard] _add_testing_rules(): ⏹️ Done.", logStyle);
	}
})();
