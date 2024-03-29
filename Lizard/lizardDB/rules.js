"use strict";

(function() {

	const ATTR_STRING_RULE = "data-stringified-rule";

	let m_elmTextFilterURLs;
	let m_elmBtnClearFilterURLs;
	let m_elmBtnRefreshURLs;
	let m_elmBtnEditURL;
	let m_elmBtnDeleteURL;
	let m_elmBtnDeleteAllRules;
	let m_elmListURLs;
	let m_elmAnchorURL;
	let m_elmNotifyUrlsList;

	let m_elmTextFilterSelectors;
	let m_elmBtnClearFilterSelectors;
	let m_elmBtnRefreshSelectors;
	let m_elmBtnJumpToElement;
	let m_elmBtnEditSelector;
	let m_elmBtnDeleteSelector;
	let m_elmListSelectors;
	let m_elmNotifySelectorsList;

	let m_elmBtnSave;
	let m_elmBtnRevert;
	let m_elmRuleProperties;
	let m_elmTextRuleDetails;
	let m_elmNotifyRuleDetails;

	let m_elmInputImport;
	let m_elmBtnExport;

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
	async function onDOMContentLoaded() {

		if(await pageLoadError()) {
			return;
		}

		// URLs
		m_elmTextFilterURLs = document.getElementById("textFilterURLs");
		m_elmBtnClearFilterURLs = document.getElementById("btnClearFilterURLs");
		m_elmBtnRefreshURLs = document.getElementById("btnRefreshURLs");
		m_elmBtnEditURL = document.getElementById("btnEditURL");
		m_elmBtnDeleteURL = document.getElementById("btnDeleteURL");
		m_elmBtnDeleteAllRules = document.getElementById("btnDeleteAllRules");
		m_elmListURLs = document.getElementById("urlsList");
		m_elmAnchorURL = document.getElementById("anchorURL");
		m_elmNotifyUrlsList = document.getElementById("notifyUrlsList");

		// Selectors
		m_elmTextFilterSelectors = document.getElementById("textFilterSelectors");
		m_elmBtnClearFilterSelectors = document.getElementById("btnClearFilterSelectors");
		m_elmBtnRefreshSelectors = document.getElementById("btnRefreshSelectors");
		m_elmBtnJumpToElement = document.getElementById("btnJumpToElement");
		m_elmBtnEditSelector = document.getElementById("btnEditSelector");
		m_elmBtnDeleteSelector = document.getElementById("btnDeleteSelector");
		m_elmListSelectors = document.getElementById("selectorsList");
		m_elmNotifySelectorsList = document.getElementById("notifySelectorsList");

		// Details
		m_elmBtnSave = document.getElementById("btnSave");
		m_elmBtnRevert = document.getElementById("btnRevert");
		m_elmRuleProperties = document.getElementById("ruleProperties");
		m_elmTextRuleDetails = document.getElementById("textRuleDetails");
		m_elmNotifyRuleDetails = document.getElementById("notifyRuleDetails");

		// Import/Export
		m_elmInputImport = document.getElementById("inputImport");
		m_elmBtnExport = document.getElementById("btnExport");

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
		m_elmBtnEditURL.addEventListener("click", onClickBtnEditURL);
		m_elmBtnDeleteURL.addEventListener("click", onClickBtnDeleteURL);
		m_elmBtnDeleteAllRules.addEventListener("click", onClickBtnDeleteAllRules);
		m_elmListURLs.addEventListener("mousedown", onMouseDownURLsList);
		m_elmListURLs.addEventListener("keydown", onKeyDownList);

		// Selectors
		m_elmTextFilterSelectors.addEventListener("input", onInputChangeFilterSelectorsText);
		m_elmTextFilterSelectors.addEventListener("keydown", onKeyDownFilterSelectorsText);
		m_elmBtnClearFilterSelectors.addEventListener("click", onClickBtnClearFilterSelectors);
		m_elmBtnRefreshSelectors.addEventListener("click", onClickBtnRefreshSelectors);
		m_elmBtnJumpToElement.addEventListener("click", onClickBtnJumpToElement);
		m_elmBtnEditSelector.addEventListener("click", onClickBtnEditSelector);
		m_elmBtnDeleteSelector.addEventListener("click", onClickBtnDeleteSelector);
		m_elmListSelectors.addEventListener("mousedown", onMouseDownSelectorsList);
		m_elmListSelectors.addEventListener("keydown", onKeyDownList);

		// Details
		m_elmBtnSave.addEventListener("click", onClickBtnSave);
		m_elmBtnRevert.addEventListener("click", onClickBtnRevert);
		m_elmTextRuleDetails.addEventListener("input", onInputChangeRuleDetailsText);
		m_elmTextRuleDetails.addEventListener("keydown", onKeyDownTextRuleDetails);

		// Import/Export
		m_elmInputImport.addEventListener("change", onChangeImport);
		m_elmBtnExport.addEventListener("click", onClickExport);
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
	function onClickBtnEditURL() {

		if(!!m_elmSelListItemURL && m_elmSelListItemURL.style.display !== "none") {

			// select the previous list item
			const idxSel = ([].indexOf.call(m_elmListURLs.children, m_elmSelListItemURL));
			const url = m_elmSelListItemURL.textContent;
			const newUrl = messageBox("Edit URL.\n\n", "prompt", { defaultValue: url });

			if(typeof(newUrl) === "string" && newUrl.trim() !== url) {
				m_lizardDB.updateUrl(url, newUrl).then(() => {
					notifyAction(m_elmNotifyUrlsList, "Updated");
					loadURLsList(idxSel);
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteURL() {

		if(!!m_elmSelListItemURL && m_elmSelListItemURL.style.display !== "none") {

			// select the previous list item
			let idxNewSel = ([].indexOf.call(m_elmListURLs.children, m_elmSelListItemURL)) - 1;

			if( messageBox("Delete following URL and all of its associated rules?\n\n'" + m_elmSelListItemURL.textContent + "'", "confirm") ) {
				m_lizardDB.deleteRulesByUrl(m_elmSelListItemURL.textContent).then(() => {
					notifyAction(m_elmNotifyUrlsList, "Deleted");
					loadURLsList(idxNewSel);
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteAllRules() {

		if(m_elmListURLs.children.length > 0) {

			let replay = messageBox("Delete all rules?\n\nType the word 'DELETE' to confirm.\n\n", "prompt");
			if ((replay || "").toLowerCase() === "delete") {
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
	function onClickBtnJumpToElement(event) {

		let msg = msgs.BROWSER_MESSAGE(msgs.ID_JUMP_TO_ELEMENT);
		msg.data["url"] = m_elmSelListItemURL.textContent;
		msg.data["cssSelector"] = m_elmSelListItemSelector.textContent;
		msg.data["newTab"] = event.ctrlKey;
		msg.data["newWin"] = event.shiftKey;

		browser.runtime.sendMessage(msg);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnEditSelector() {

		if(!!m_elmSelListItemURL && !!m_elmSelListItemSelector && m_elmSelListItemSelector.style.display !== "none") {

			const idxSel = ([].indexOf.call(m_elmListSelectors.children, m_elmSelListItemSelector));
			const selector = m_elmSelListItemSelector.textContent;
			const newSelector = messageBox("Edit selector.\n\n", "prompt", { defaultValue: selector });

			if(typeof(newSelector) === "string" && newSelector.trim() !== selector) {
				m_lizardDB.updateCssSelector(m_elmSelListItemURL.textContent, selector, newSelector).then(() => {
					loadSelectorsList(m_elmSelListItemURL.textContent, idxSel);
					notifyAction(m_elmNotifySelectorsList, "Updated");
				});
			}
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onClickBtnDeleteSelector() {

		if(!!m_elmSelListItemURL && !!m_elmSelListItemSelector && m_elmSelListItemSelector.style.display !== "none") {

			// select the previous list item
			let idxNewSel = ([].indexOf.call(m_elmListSelectors.children, m_elmSelListItemSelector)) - 1;

			m_lizardDB.deleteRule(m_elmSelListItemURL.textContent, m_elmSelListItemSelector.textContent).then(() => {
				notifyAction(m_elmNotifySelectorsList, "Deleted");
				if(!!m_elmSelListItemURL) {
					loadSelectorsList(m_elmSelListItemURL.textContent, idxNewSel);
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

	////////////////////////////////////////////////////////////////////////////////////
	function onInputChangeRuleDetailsText() {
		clearTimeout(m_textAreaChangeDebouncer);
		m_textAreaChangeDebouncer = setTimeout(() => {
			validateRuleDetailsText();
			m_textAreaChangeDebouncer = null;
		}, 200);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function onKeyDownTextRuleDetails(event) {
		if(event.ctrlKey && event.code === "KeyS") {
			onClickBtnSave();
			event.preventDefault();
		}
	}


	/************************************************************************************************************/
	/** Import/Export **/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	async function onChangeImport(event) {

		document.body.classList.add("inProgress");

		let file = event.target.files[0];
		let urlRules = await importJsonFile.run(file);

		if(urlRules instanceof Array) {

			let count = 0;

			for(let i=0, len=urlRules.length; i<len; i++) {

				const urlRule = urlRules[i];

				if(	urlRule.hasOwnProperty("url") && (typeof(urlRule.url) === "string") &&
					urlRule.hasOwnProperty("rules") && (urlRule.rules instanceof Array) ) {

					const url = urlRule.url;

					for(let j=0, len=urlRule.rules.length; j<len; j++) {

						const rule = urlRule.rules[j];
						const cssSelector = rule.cssSelector;

						// remove from object so it can be passed as a parameter to isRuleObjectValid() and setRule()
						delete rule.cssSelector;

						if(LizardDB.isRuleObjectValid(rule) && LizardDB.ruleHasValue(rule)) {
							await m_lizardDB.setRule(url, cssSelector, rule);
							count++;
						}
					}
				}
			}

			if(count > 0) {
				loadURLsList();
				messageBox(`${count} valid rules for ${urlRules.length} URLs were successfully imported from file.\n\n'${file.name}'\n\n✱ Duplicate rules are merged and their details values are overwritten.`, "alert", {fail: false});
			} else {
				messageBox("No valid rules were found in file", "alert");
			}
		} else {
			messageBox("File may not be a valid lizard-rules file (json).", "alert");
		}

		m_elmInputImport.value = "";		// forget last import name
		document.body.classList.remove("inProgress");
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function onClickExport() {

		try {

			document.body.classList.add("inProgress");

			const urlRules = await m_lizardDB.getAllUrlRules();

			if(urlRules.length > 0) {

				let ruleCount = 0;

				// remove misc properties before exporting
				for(let i=0, len=urlRules.length; i<len; i++) {
					for(let j=0, len=urlRules[i].rules.length; j<len; j++) {

						const rule = urlRules[i].rules[j];

						delete rule._id_url;
						delete rule.created;
						delete rule.hitCount
						delete rule.lastUsed;

						ruleCount++;
					}
				}

				let result = await exportJsonFile.run(urlRules, "lizard-rules");

				if( !!result.fileName && result.fileName.length > 0) {
					messageBox(`${ruleCount} rules for ${urlRules.length} URLs were successfully exported to file.\n\n'${result.fileName}'`, "alert", {fail: false});
				}
			} else {
				messageBox("There isn't any rule to exported.", "alert", {fail: false});
			}

		} catch (error) {
			console.log("[Lizard]", "Export failed", error);
		} finally {
			document.body.classList.remove("inProgress");
		}
	}

	/************************************************************************************************************/
	/************************************************************************************************************/
	/************************************************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function loadURLsList(idxNewSelection = -1) {

		clearURLsList();
		m_elmTextFilterURLs.value = "";

		m_lizardDB.getAllUrls().then((urls) => {

			for(let i=0, len=urls.length; i<len; i++) {
				const item = m_elmListURLs.appendChild(createListItem(urls[i], "url"));
				fetchUrlTitleLazy(item, 20*i);
			}

			if(!!m_elmListURLs.firstElementChild) {
				let selItem = (idxNewSelection < 0 ? m_elmListURLs.firstElementChild : m_elmListURLs.children.item(idxNewSelection));
				selItem.focus();
				selectURLsListItem(selItem);
			} else {
				clearAnchorURL();
				clearSelectorsList();
				clearRuleDetails();
			}
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	function loadSelectorsList(url, idxNewSelection = -1, focusItem = true) {

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

				let selItem = (idxNewSelection < 0 ? m_elmListSelectors.firstElementChild : m_elmListSelectors.children.item(idxNewSelection));
				if(focusItem) {
					selItem.focus();
				} else {
					selItem.scrollTop = 0;
				}
				selectSelectorsListItem(selItem);
			} else {
				clearRuleDetails();
				loadURLsList(([].indexOf.call(m_elmListURLs.children, m_elmSelListItemURL)) - 1);	// URL w/o selectors dosn't exists, select previous list item
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
		loadSelectorsList(m_elmSelListItemURL.textContent, -1, false);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function selectSelectorsListItem(elmListItem) {

		if(!!m_elmSelListItemSelector) m_elmSelListItemSelector.classList.remove("selected");
		elmListItem.classList.add("selected");

		m_elmSelListItemSelector = elmListItem;

		clearRuleDetails(false);

		let objRule = JSON.parse(m_elmSelListItemSelector.getAttribute(ATTR_STRING_RULE).unescapeMarkup());

		m_elmRuleProperties.appendChild(createPropertyLabel("Created", (new Date(objRule.created)).toWebExtensionLocaleShortString()));
		m_elmRuleProperties.appendChild(createPropertyLabel("Last Used", objRule.lastUsed === 0 ? "{never}" : (new Date(objRule.lastUsed)).toWebExtensionLocaleShortString()));
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

			if(LizardDB.ruleHasValue(m_objValidModifiedRuleDetails)) {

				m_lizardDB.setRule(m_elmSelListItemURL.textContent, m_elmSelListItemSelector.textContent, m_objValidModifiedRuleDetails).then(() => {

					m_strMirrorJsonRuleDetails = mirrorJsonRuleDetails(m_objValidModifiedRuleDetails);

					// get stale rule properties from the the selected list item
					let freshRule = JSON.parse(m_elmSelListItemSelector.getAttribute(ATTR_STRING_RULE).unescapeMarkup());

					// refresh it by assigning modified properties
					Object.assign(freshRule, m_objValidModifiedRuleDetails);

					// reapply to selected list item
					m_elmSelListItemSelector.setAttribute(ATTR_STRING_RULE, JSON.stringify(freshRule).escapeMarkup());

					m_elmTextRuleDetails.value = m_strMirrorJsonRuleDetails;
					m_elmTextRuleDetails.classList.remove("editValid");
					notifyAction(m_elmNotifyRuleDetails, "Saved");

				});
			} else {
				messageBox("Selector has no value.\n\nAll fields are either 'false' or 'null'. It will be better to\ndelete it from the 'Delete Selector' button.", "alert", {fail: false});
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

			let isValid = LizardDB.isRuleObjectValid(obj);

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
	function messageBox(msgText, type = "alert", details = {}) {

		const {
			fail = true,
			defaultValue = "",
		 } = details;
		const lineIndent = "     ";
		const prefixMessage = "➤ ";
		const failPrefixMessage = prefixMessage + "Error\n\n" + lineIndent;

		msgText = msgText.replace(/\n([^\n])/g, `\n${lineIndent}$1`);

		if(type === "alert") {
			return alert((fail ? failPrefixMessage : prefixMessage) + msgText + "\n\n");
		} else if(type === "confirm") {
			return confirm(prefixMessage + msgText + "\n\n");
		} else if(type === "prompt") {
			return prompt(prefixMessage + msgText, defaultValue);
		}
	}

	////////////////////////////////////////////////////////////////////////////////////
	function mirrorJsonRuleDetails(objRule) {
		return m_strMirrorJsonRuleDetails = JSON.stringify(objRule, null, 2);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function notifyAction(elmOverlay, textOverlay, timeout = 1000) {
		elmOverlay.textContent = textOverlay;
		elmOverlay.style.opacity = "0.5";
		setTimeout(() => elmOverlay.style.opacity = "0", timeout);
	}

	////////////////////////////////////////////////////////////////////////////////////
	function fetchUrlTitleLazy(item, timeout) {
		let fetching = () => {
			fetch(item.textContent)
				.then(response => response.text() )
				.then(text => item.title = (/<title>(.*?)<\/title>/m).exec(text)[1] )
				.catch(() => item.title = "{Error: failed to get the page title}" );
		}
		setTimeout(fetching, timeout);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function pageLoadError() {

		try {
			browser.extension;
		}
		catch(_) {
			pageErrorMessage([
				"This page has apparently failed in the most basic manner.",
				"Are you trying to manually access 'Alteration Rules' in a private window while the extension is not allowed to run in private windows?",
				"Allow Lizard to run in private windows from the Manage Extension page.",
			]);
			return true;
		}

		if((await lzUtil.unsupportedExtensionFeatures()).includes("rememberPageAlterations")) {
			pageErrorMessage(["This page is part of the 'Remember page alterations' feature and is only available for Firefox version 64.0 and above."]);
			return true;
		}

		if((await browser.tabs.getCurrent()).incognito || (await browser.windows.getCurrent()).incognito) {
			pageErrorMessage([
				"For now and due to Firefox restrictions the 'Alteration Rules' page cannot be used in Private Browsing tabs or windows.",
				"This behavior might change in the upcoming versions.",
				"Open 'Alteration Rules' in a regular window (non-private)."
			], {
				index: 2,
				onClock: () => browser.windows.create({ url: lzUtil.URL_RULES_DASHBOARD, incognito: false })
			});
			return true;
		}

		return false;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function pageErrorMessage(lines, clickableLine = { index: null, onClock: undefined }) {

		while(!!document.body.firstElementChild) {
			document.body.removeChild(document.body.firstElementChild);
		}

		let left = document.createElement("div");
		left.style.float = "left";
		left.style.fontSize = left.style.lineHeight= "32px"
		left.textContent = "⛔️";

		let right = document.createElement("div");
		right.style.fontSize = "18px"
		right.style.marginLeft = "55px";
		for(let i=0, len=lines.length; i<len; i++) {
			const p = document.createElement("p");
			p.style.margin = "12px 0";
			p.textContent = lines[i];
			right.appendChild(p);
		}
		right.firstElementChild.style.paddingTop = "7px";

		const idx = parseInt(clickableLine.index);
		if(!isNaN(idx) && idx > -1 && idx < right.children.length) {
			const clickLine = right.children[idx];
			clickLine.style.textDecoration = "underline";
			clickLine.style.color = "blue";
			clickLine.style.cursor = "pointer";
			clickLine.onclick = clickableLine.onClock;
		}

		let container = document.createElement("div");
		container.appendChild(left);
		container.appendChild(right);
		document.body.appendChild(container);
	}

	////////////////////////////////////////////////////////////////////////////////////
	async function _add_testing_rules(selectorsForUrl = 17) {

		const msg = "Congratulations!\n\nYou've stumbled upon a hidden testing function.\n\n" +
					"This will add an untold number of meaningless rules to the\n" +
					"extension's database, and it's going be exhausting to delete\n" +
					"them without deleting all the rules.\n\nContinue?\n\n" +
					"✱ Watch the console for progress.";

		if( !messageBox(msg, "confirm") ) return;

		document.body.classList.add("inProgress");

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
		document.body.classList.remove("inProgress");
	}
})();
