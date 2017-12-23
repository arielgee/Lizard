"use strict";

(function () {

	const CLS_LIZARD_ELEMENT = "lizardWebExtElement";

	const CLS_HELP_IMG = "helpImg";
	const CLS_HELP_RECORD = "helpRec";
	const CLS_HELP_TEXT = "helpText";
	const CLS_HELP_COLOR = "helpColor";
	const CLS_LETTER_KEY = "letterKey";

	const LIZARD_BOX_PREFIX = "lizardBox";
	const ID_LIZARD_BOX = LIZARD_BOX_PREFIX + "Container";
	const ID_LIZARD_BOX_BORDER = LIZARD_BOX_PREFIX + "Border";
	const ID_LIZARD_BOX_LABEL_TAG = LIZARD_BOX_PREFIX + "LabelTag";
	const ID_LIZARD_SOURCE_BOX = "lizardSourceBox";
	const ID_LIZARD_SOURCE_BOX_LEFT_BORDER = "lizardSourceBoxLeftBorder";
	const ID_LIZARD_SOURCE_BOX_PRE = "lizardSourceBoxPre";
	const ID_LIZARD_SOURCE_BOX_CLOSE = "lizardSourceBoxClose";
	const ID_LIZARD_SOURCE_BOX_COPY = "lizardSourceBoxCopy";
	const ID_LIZARD_SOURCE_BOX_SOURCE_TYPE = "lizardSourceBoxSourceType";
	const ID_LIZARD_ISOLATE_CONTAINER = "lizardIsolateContainer";

	const ID_LIZARD_HELP_BOX = "lizardHelpBox";

	const PATH_TO_HELP_IMG = "icons/lizard-32.png";
	const BOX_BORDER_WIDTH = 2;		// #lizardBoxBorder border width 2px (as in the content.css file)
	const DEF_SCROLL_BAR_WIDTH = 16;
	const NOTIFICATION_TIMEOUT = 4300;
	const MANDATORY_ROOT_ELEMENTS = ["html", "body"];

	const UNDO_ACTION_HIDE = "undoHide";
	const UNDO_ACTION_REMOVE = "undoRemove";
	const UNDO_ACTION_ISOLATE = "undoIsolate";
	const UNDO_ACTION_COLORIZE = "undoColorize";

	const BROWSER_MESSAGE = function (typeval) {
		return {
			type: typeval,
			data: {
			},
		};
	};

	const UNDO_LIZARD_ACTION = function (typeval) {
		return {
			type: typeval,
			data: {
			},
		};
	};

	let lizardState = {
		bSelectionStarted: false,
		currentElement: null,
		bSelectionLocked: false,

		undoActions: [],
		strolledElements: [],

		scrollbarWidth: -1,
	};


	//////////////////////////////////////////////////////////////////////
	//
	browser.runtime.onMessage.addListener((request, sender, sendResponse) => {
		if (request.action === prefs.ACTION_MSG_LIZARD_TOGGLE_STATE) {
			if (lizardState.bSelectionStarted) {
				stopSelection();
			} else {
				startSelection();
			}
		}
	});

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseMove(event) {

		if (lizardState.bSelectionLocked) {
			return;
		}

		// no narrower action if mouse is moved
		lizardState.strolledElements = [];

		removeSelectionBox();

		unselectElement();
		selectElement(document.elementFromPoint(event.clientX, event.clientY));

		createSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseLeave(event) {

		if (lizardState.bSelectionLocked) {
			return;
		}

		if (event.target.nodeName.toLowerCase() === "html") {
			removeSelectionBox();
			unselectElement();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onWheel(event) {

		let elm = document.elementFromPoint(event.clientX, event.clientY);

		if (elm && elm.id.startsWith(LIZARD_BOX_PREFIX)) {

			if (event.deltaY < 0) {
				wider();
			} else if (event.deltaY > 0) {
				narrower();
			}
			event.preventDefault();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onPageHide(event) {
		stopSelection();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onVisibilityChange(event) {
		notifyToolbarButtonStatus(!document.hidden);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClick(event) {
		if (event.shiftKey) {
			hideElement();
			event.preventDefault();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onKeyDown(event) {

		if (event.preventDefaulted || event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}

		switch (event.key.toLowerCase()) {
			case "h":
				hideElement();
				break;
			case "r":
				removeElement();
				break;
			case "i":
				isolateElement();
				break;
			case "c":
				colorizeElement(event.shiftKey);
				break;
			case "d":
				decolorizeElement(event.shiftKey);
				break;
			case "u":
				undoLastAction();
				break;
			case "w":
				wider();
				break;
			case "n":
				narrower();
				break;
			case "l":
				lockSelection(!lizardState.bSelectionLocked);
				break;
			case "b":
				blinkElement();
				break;
			case "v":
				viewSource();
				break;
			case "q":
				stopSelection();
				break;
			case "f1":
				showHelp();
				break;
			case "escape":
				removeInfoBoxes();
				break;
/*
			case "t":
				__test();
				break;
*/
			default:
				//console.log("[lizard] Unused key:" + event.key);
				return;
		}

		event.preventDefault();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onScroll(event) {
		repositionSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onResize(event) {
		repositionSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function startSelection() {

		if (!document || !document.body) {
			alert("\tWhoops!\n\n\tSorry, this is not a valid html document with a <body>.\t");
			return;
		}

		if (lizardState.scrollbarWidth === -1) setScrollbarWidth();

		document.addEventListener("mousemove", onMouseMove, true);
		document.addEventListener("mouseleave", onMouseLeave, true);
		document.addEventListener("wheel", onWheel, true);
		document.addEventListener("pagehide", onPageHide, true);
		document.addEventListener("visibilitychange", onVisibilityChange, false);

		document.addEventListener("click", onClick, true);
		document.addEventListener("keydown", onKeyDown, false);

		// select something
		onMouseMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, screenX: -1, screenY: -1, target: null });

		prefs.getHelpBoxOnStart().then((checked) => {
			if (checked) {
				showHelp();
				//setTimeout(onCloseHelpBox, 5000);
			}
		});

		lizardState.bSelectionStarted = true;
		notifyToolbarButtonStatus(lizardState.bSelectionStarted);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function stopSelection() {

		lockSelection(false);
		removeSelectionBox();
		unselectElement();
		removeInfoBoxes();

		document.removeEventListener("mousemove", onMouseMove, true);
		document.removeEventListener("mouseleave", onMouseLeave, true);
		document.removeEventListener("wheel", onWheel, true);
		document.removeEventListener("pagehide", onPageHide, true);
		document.removeEventListener("visibilitychange", onVisibilityChange, false);

		document.removeEventListener("click", onClick, true);
		document.removeEventListener("keydown", onKeyDown, false);

		lizardState.bSelectionStarted = false;
		notifyToolbarButtonStatus(lizardState.bSelectionStarted);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function selectElement(elm) {
		if (elm && ((typeof elm.className !== "string") || !(elm.className.includes(CLS_LIZARD_ELEMENT)))) {
			lizardState.currentElement = elm;
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function unselectElement() {
		lizardState.currentElement = null;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function createSelectionBox() {

		if (!lizardState.currentElement) {
			return;
		}

		let box;
		let boxBorder;
		let boxLabelTag;

		box = document.getElementById(ID_LIZARD_BOX);

		if (!box) {

			box = document.createElement("div");
			box.id = ID_LIZARD_BOX;
			box.className = CLS_LIZARD_ELEMENT;

			boxBorder = document.createElement("div");
			boxBorder.id = ID_LIZARD_BOX_BORDER;
			boxBorder.className = CLS_LIZARD_ELEMENT;

			boxLabelTag = document.createElement("div");
			boxLabelTag.id = ID_LIZARD_BOX_LABEL_TAG;
			boxLabelTag.className = CLS_LIZARD_ELEMENT;

			box.appendChild(boxBorder);
			box.appendChild(boxLabelTag);

			document.body.appendChild(box);
		} else {
			// querySelector is slower but i'm looking just in the ID_LIZARD_BOX's element
			boxBorder = box.querySelector("#" + ID_LIZARD_BOX_BORDER);
			boxLabelTag = box.querySelector("#" + ID_LIZARD_BOX_LABEL_TAG);
		}

		// real inner size accounting for the scrollbars width if they exist
		const innerWidth = window.innerWidth - getVScrollWidth();
		const innerHeight = window.innerHeight - getHScrollWidth();

		const vpRect = getElementViewportRect(lizardState.currentElement, innerWidth, innerHeight);

		box.style.left = vpRect.left + "px";
		box.style.top = vpRect.top + "px";
		boxBorder.style.width = (vpRect.width <= BOX_BORDER_WIDTH ? 0 : vpRect.width) + "px";
		boxBorder.style.height = (vpRect.height <= BOX_BORDER_WIDTH ? 0 : vpRect.height) + "px";

		/*console.log("[lizard]", "Node: ", lizardState.currentElement.nodeName,
			"\nVScrollWidth/HScrollHeight", getVScrollWidth(), "/", getHScrollWidth(),
			"\ninnerWidth/Height", innerWidth, "/", innerHeight,
			"\nrect: ", lizardState.currentElement.getBoundingClientRect(),
			"\nvpRect: ", vpRect,
			"\nboxRect: ", boxBorder.getBoundingClientRect(),
			"\n----------------");*/

		// label content
		boxLabelTag.innerHTML = getLabelContent(lizardState.currentElement);

		// label position	
		let rect = boxLabelTag.getBoundingClientRect();
		let isFloater = false;

		if ((rect.left + boxLabelTag.offsetWidth) > innerWidth) {
			boxLabelTag.style.left = (innerWidth - rect.left - boxLabelTag.offsetWidth) + "px";
			isFloater = true;
		}
		if ((rect.top + boxLabelTag.offsetHeight) > innerHeight) {
			boxLabelTag.style.top = (innerHeight - rect.top - boxLabelTag.offsetHeight) + "px";
			isFloater = true;
		}

		if (isFloater) {
			boxLabelTag.className += " floater";
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getElementViewportRect(elm, innerWidth, innerHeight) {

		let vpRect = { left: 0, top: 0, width: 0, height: 0 };

		const rect = elm.getBoundingClientRect();

		vpRect.left = parseInt(rect.left < 0 ? 0 : Math.min(rect.left, innerWidth - BOX_BORDER_WIDTH));
		vpRect.top = parseInt(rect.top < 0 ? 0 : Math.min(rect.top, innerHeight - BOX_BORDER_WIDTH));

		vpRect.width = parseInt(rect.right <= 0 ? 0 : (rect.left < 0 ? rect.right : Math.min(rect.width, Math.max(innerWidth - rect.left, 0))));
		vpRect.height = parseInt(rect.bottom <= 0 ? 0 : (rect.top < 0 ? rect.bottom : Math.min(rect.height, Math.max(innerHeight - rect.top, 0))));

		// private cases where the element (usualy html & body) is large as the innerSpace and its starting point is negative (scrolled)
		if (rect.left < 0 && (rect.right + Math.abs(rect.left) === innerWidth)) {
			vpRect.width = innerWidth;
		}
		if (rect.top < 0 && (rect.bottom + Math.abs(rect.top) === innerHeight)) {
			vpRect.height = innerHeight;
		}

		return vpRect;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getLabelContent(elm) {

		let labelInnerHTML = "<strong>" + elm.nodeName.toLowerCase() + "</strong>";

		if (elm.id !== "") {
			labelInnerHTML += ", id: " + elm.id;
		}
		if (elm.className !== "") {
			labelInnerHTML += ", class: " + elm.className;
		}
		if (elm.style.cssText !== "") {
			labelInnerHTML += ", style: " + elm.style.cssText;
		}

		return labelInnerHTML;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getHScrollWidth() {
		return (document.body.scrollWidth > (window.innerWidth - getVScrollWidthHScrollIgnored()) ? lizardState.scrollbarWidth : 0);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getVScrollWidth() {
		return (document.body.scrollHeight > (window.innerHeight - getHScrollWidthVScrollIgnored()) ? lizardState.scrollbarWidth : 0);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getHScrollWidthVScrollIgnored() {
		return (document.body.scrollWidth > window.innerWidth ? lizardState.scrollbarWidth : 0);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getVScrollWidthHScrollIgnored() {
		return (document.body.scrollHeight > window.innerHeight ? lizardState.scrollbarWidth : 0);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeSelectionBox() {
		let box = document.getElementById(ID_LIZARD_BOX);
		if(box !== null) {
			box.parentNode.removeChild(box);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function repositionSelectionBox() {
		if(lizardState.bSelectionLocked) {
			removeSelectionBox();
			createSelectionBox();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function hideElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("No element is selected.", NOTIFICATION_TIMEOUT);
			return;
		}		

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("Root elements can't be hidden.", NOTIFICATION_TIMEOUT);
			return;
		}

		removeSelectionBox();
		unselectElement();
		lockSelection(false);

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_HIDE);

		ua.data["element"] = elm;
		ua.data["prev_visibility"] = elm.style.visibility;

		lizardState.undoActions.push(ua);

		elm.style.visibility = "hidden";
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("No element is selected.", NOTIFICATION_TIMEOUT);
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("Root elements can't be removed.", NOTIFICATION_TIMEOUT);
			return;
		}

		removeSelectionBox();
		unselectElement();
		lockSelection(false);

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_REMOVE);

		// save element and it's position
		ua.data["element"] = elm;
		ua.data["prev_parentNode"] = elm.parentNode;
		ua.data["prev_nextSibling"] = elm.nextSibling;

		lizardState.undoActions.push(ua);

		elm.parentNode.removeChild(elm);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function isolateElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("No valid element is selected.", NOTIFICATION_TIMEOUT);
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("Root elements can't be isolated.", NOTIFICATION_TIMEOUT);
			return;
		}

		removeSelectionBox();
		unselectElement();
		lockSelection(false);
		removeInfoBoxes();

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_ISOLATE);

		// save document's body and scroll position
		ua.data["prev_body"] = document.body;
		ua.data["prev_scrollTop"] = document.documentElement.scrollTop;
		ua.data["prev_scrollLeft"] = document.documentElement.scrollLeft;

		lizardState.undoActions.push(ua);

		document.documentElement.removeChild(document.body);
		document.body = document.createElement("body");
		document.body.id = ID_LIZARD_ISOLATE_CONTAINER;
		document.body.appendChild(elm.cloneNode(true));
	}

	//////////////////////////////////////////////////////////////////////
	//
	function colorizeElement(invertColors) {

		prefs.getColorizeColors().then((colors) => {
			prefs.getColorizeChildren().then((colorizeChildren) => {
				if(invertColors) {
					colorElement(colors[1], colors[0], colorizeChildren);
				} else {
					colorElement(colors[0], colors[1], colorizeChildren);
				}
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function decolorizeElement(invertColors) {

		prefs.getDecolorizeColors().then((colors) => {
			prefs.getColorizeChildren().then((colorizeChildren) => {
				if(invertColors) {
					colorElement(colors[1], colors[0], colorizeChildren);
				} else {
					colorElement(colors[0], colors[1], colorizeChildren);
				}
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function colorElement(foreground, background, colorizeChildren) {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) { 
			displayNotification("No element is selected.", NOTIFICATION_TIMEOUT);
			return;
		}

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_COLORIZE);

		ua.data["coloureditems"] = [];

		_colorElement(elm, foreground, background, ua.data.coloureditems, colorizeChildren);

		lizardState.undoActions.push(ua);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _colorElement(elm, foreground, background, uaItems, deep) {

		uaItems.push({
			element:  elm,
			prev_color: elm.style.color,
			prev_borderColor: elm.style.borderColor,
			prev_backgroundColor: elm.style.backgroundColor							
		});
		
		elm.style.color = foreground;
		elm.style.borderColor = foreground;
		elm.style.backgroundColor = background;

		for(let i=0; i<elm.children.length && deep; i++) {
			
			let c = elm.children[i];
			
			if(c.nodeType === Node.ELEMENT_NODE && !c.className.includes(CLS_LIZARD_ELEMENT)) { 
				_colorElement(c, foreground, background, uaItems, true);
			}
		}
	}
	
	//////////////////////////////////////////////////////////////////////
	//
	function undoLastAction() {

		// nothing to undo
		if (0 === lizardState.undoActions.length) {
			return;
		}

		// pop the last undo action
		let ua = lizardState.undoActions.pop();

		switch (ua.type) {
			case UNDO_ACTION_HIDE:
				ua.data.element.style.visibility = ua.data.prev_visibility;
				break;
				//////////////////////////////////////////////////////////////

			case UNDO_ACTION_REMOVE:
				ua.data.prev_parentNode.insertBefore(ua.data.element, ua.data.prev_nextSibling);
				break;
				//////////////////////////////////////////////////////////////

			case UNDO_ACTION_ISOLATE:
				unselectElement();
				lockSelection(false);
				document.documentElement.removeChild(document.body);
				document.body = document.createElement("body");
				document.body = ua.data.prev_body;
				document.documentElement.scrollTop = ua.data.prev_scrollTop;
				document.documentElement.scrollLeft = ua.data.prev_scrollLeft;
				break;
				//////////////////////////////////////////////////////////////

			case UNDO_ACTION_COLORIZE:
				for(let i=0; i<ua.data.coloureditems.length; i++) {
					let e = ua.data.coloureditems[i];
					e.element.style.color = e.prev_color;
					e.element.style.borderColor = e.prev_borderColor;
					e.element.style.backgroundColor = e.prev_backgroundColor;
				}
				break;
				//////////////////////////////////////////////////////////////

			default:
				console.log("[lizard]", "Unknown undo type. This is not right.", ua.type, ua.data);
				break;
				//////////////////////////////////////////////////////////////
		}
		ua = null;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function wider() {

		let elm = lizardState.currentElement;

		if (elm && elm.parentElement) {

			lizardState.strolledElements.push(elm);

			removeSelectionBox();
			unselectElement();
			selectElement(elm.parentElement);
			createSelectionBox();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function narrower() {

		if(lizardState.strolledElements.length > 0) {
			removeSelectionBox();
			unselectElement();
			selectElement(lizardState.strolledElements.pop());
			createSelectionBox();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function lockSelection(bLock) {

		lizardState.bSelectionLocked = bLock;

		if(lizardState.bSelectionLocked) {
			document.addEventListener("scroll", onScroll, false);
			window.addEventListener("resize", onResize, false);
		} else {
			document.removeEventListener("scroll", onScroll, false);
			window.removeEventListener("resize", onResize, false);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function blinkElement() {

		let elm = lizardState.currentElement;

		if (!elm) {
			return;
		}

		_blinkElement(elm, elm.style.visibility, 200, 3000);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _blinkElement(elm, orgVisibility, interval, duration) {

		elm.style.visibility = (elm.style.visibility === "hidden" ? orgVisibility : "hidden");

		if(duration > 0) {
			setTimeout(_blinkElement, interval, elm, orgVisibility, interval, duration-interval);
		} else {
			elm.style.visibility = orgVisibility;
		}
	}
	//////////////////////////////////////////////////////////////////////
	//	
	function viewSource() {

		let elm = lizardState.currentElement;

		if (!elm) {
			return;
		}

		prefs.getViewSourceType().then((type) => {

			let source = "";

			if (type === prefs.SOURCE_TYPE.HTML) {
				source = sanitizeHtmlFromLizardElements(elm.outerHTML);
			} else if (type === prefs.SOURCE_TYPE.CSS) {
				let style = window.getComputedStyle(elm);
				for (let i = 0; i < style.length; i++) {
					source += style[i] + ": " +style.getPropertyValue(style[i]) + "\n";
				}
			} else {
				source = "wtf?";
			}

			prefs.getOpenViewSourceIn().then((value) => {
				if (value === prefs.VIEW_SOURCE_IN_TYPE.WINDOW) {
					viewSourceInNewPage(type, source, true);
				} else if (value === prefs.VIEW_SOURCE_IN_TYPE.TAB) {
					viewSourceInNewPage(type, source, false);
				} else if (value === prefs.VIEW_SOURCE_IN_TYPE.PAGE) {
					viewSourceInPage(type, source);
				}
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function viewSourceInNewPage(type, source, newWin) {

		let id = window.btoa(random1to100() + Date.now().toString());

		prefs.setSavedViewSourceData(source, type, id);

		let msg = BROWSER_MESSAGE(newWin ? prefs.MSG_LIZARD_OPEN_VIEW_SOURCE_WINDOW : prefs.MSG_LIZARD_OPEN_VIEW_SOURCE_TAB);
		msg.data["id"] = id;

		browser.runtime.sendMessage(msg);
	}

	//////////////////////////////////////////////////////////////////////
	//	
	function viewSourceInPage(type, source) {

		let sourceBox;
		let sourceBoxLeftBorder;
		let sourceBoxPre;
		let btnClose;
		let btnCopy;
		let lblType;

		sourceBox = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (!sourceBox) {

			sourceBox = document.createElement("div");
			sourceBox.id = ID_LIZARD_SOURCE_BOX;
			sourceBox.className = CLS_LIZARD_ELEMENT;

			sourceBoxLeftBorder = document.createElement("div");
			sourceBoxLeftBorder.id = ID_LIZARD_SOURCE_BOX_LEFT_BORDER;
			sourceBoxLeftBorder.className = CLS_LIZARD_ELEMENT;

			sourceBoxPre = document.createElement("pre");
			sourceBoxPre.id = ID_LIZARD_SOURCE_BOX_PRE;
			sourceBoxPre.className = CLS_LIZARD_ELEMENT;

			btnClose = document.createElement("div");
			btnClose.id = ID_LIZARD_SOURCE_BOX_CLOSE;
			btnClose.className = CLS_LIZARD_ELEMENT;
			btnClose.textContent = "❌";					// Dingbat - CROSS MARK / String.fromCharCode(10060);	
			btnClose.title = "Close";

			btnCopy = document.createElement("div");
			btnCopy.id = ID_LIZARD_SOURCE_BOX_COPY;
			btnCopy.className = CLS_LIZARD_ELEMENT;
			btnCopy.textContent = "⧉";					// Dingbat - boxbox / String.fromCharCode(10697)
			btnCopy.title = "Copy to clipboard";

			lblType = document.createElement("span");
			lblType.id = ID_LIZARD_SOURCE_BOX_SOURCE_TYPE;
			lblType.className = CLS_LIZARD_ELEMENT;

			sourceBoxLeftBorder.appendChild(btnClose);
			sourceBoxLeftBorder.appendChild(btnCopy);
			sourceBoxLeftBorder.appendChild(lblType);

			sourceBox.appendChild(sourceBoxLeftBorder);
			sourceBox.appendChild(sourceBoxPre);

			document.body.appendChild(sourceBox);
		} else {
			// querySelector is slower but i'm looking just in the ID_LIZARD_SOURCE_BOX's element
			sourceBoxPre = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_PRE);
			btnClose = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_CLOSE);
			btnCopy = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_COPY);
			lblType = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_SOURCE_TYPE);
		}

		lblType.textContent = type;

		sourceBoxPre.textContent = source;

		let point = getSourceBoxPosition(sourceBox, lizardState.currentElement.getBoundingClientRect());

		sourceBox.style.left = point.left + "px";
		sourceBox.style.top = point.top + "px";

		btnClose.addEventListener("click", onCloseHtmlBox, false);
		btnCopy.addEventListener("click", onClickHtmlCopy, false);

		sourceBoxPre.focus();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getSourceBoxPosition(elm, rectReference) {

		const EXTRA = 25;
		let point = { left: 0, top: 0 };

		point.left = rectReference.left + EXTRA;
		point.top = rectReference.top + EXTRA;

		if (point.left + elm.offsetWidth > window.innerWidth) {
			point.left = window.innerWidth - elm.offsetWidth - EXTRA;
		}

		if (point.left < EXTRA) {
			point.left = EXTRA;
		}

		if (point.top + elm.offsetHeight > window.innerHeight) {
			point.top = window.innerHeight - elm.offsetHeight - EXTRA;
		}

		if (point.top < EXTRA) {
			point.top = EXTRA;
		}

		return point;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClickHtmlCopy(event) {

		let sourceBoxPre = document.getElementById(ID_LIZARD_SOURCE_BOX_PRE);

		if (sourceBoxPre) {

			let sel = window.getSelection();

			if ((sel.anchorOffset !== sel.focusOffset) &&								// something is selected
				(sel.anchorNode.parentNode.id === sel.focusNode.parentNode.id) &&		// selection in same node
				(sel.focusNode.parentNode.id === ID_LIZARD_SOURCE_BOX_PRE)) {			// selection is in ID_LIZARD_SOURCE_BOX_PRE

				document.execCommand("copy");		// copy user selected text in ID_LIZARD_SOURCE_BOX_PRE element
			} else {

				let rng = document.createRange();

				rng.selectNodeContents(sourceBoxPre);
				sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(rng);

				document.execCommand("copy");		// copy all text in ID_LIZARD_SOURCE_BOX_PRE element

				sel.removeAllRanges();
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function showHelp() {

		let srcGetting = prefs.getViewSourceType();
		let colGetting = prefs.getColorizeColors();
		let decolGetting = prefs.getDecolorizeColors();

		srcGetting.then((srcType) => {
			colGetting.then((colorize) => {
				decolGetting.then((decolorize) => {
					_showHelp(srcType, colorize, decolorize);
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _showHelp(srcType, colorizeColors, decolorizeColors) {

		let hlp = document.getElementById(ID_LIZARD_HELP_BOX);

		if (!hlp) {

			hlp = document.createElement("div");
			hlp.id = ID_LIZARD_HELP_BOX;
			hlp.className = CLS_LIZARD_ELEMENT;
			document.body.appendChild(hlp);

			hlp.style.top = "20px";
			hlp.style.left = "15px";
		}

		const fmt = "<p class='{0} {1}'>Lizard Hotkeys<img class='{0} {4}' src={5}></img></p>" +
			"<div class='{0} {1}'><span class='{0} {2}'>H</span><span class='{0} {3}'>Hide (or: shift+click)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>R</span><span class='{0} {3}'>Remove (collapses element)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>I</span><span class='{0} {3}'>Isolate</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>C</span><span class='{0} {3}'>" +
				"Colorize (<span class='{0} {6}' style='background-color:{7} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{8} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>D</span><span class='{0} {3}'>" +
				"Decolorize (<span class='{0} {6}' style='background-color:{9} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{10} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>U</span><span class='{0} {3}'>Undo</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>W</span><span class='{0} {3}'>Wider (or: mouse wheel up)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>N</span><span class='{0} {3}'>Narrower (or: mouse wheel down)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>L</span><span class='{0} {3}'>Lock/Unlock</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>B</span><span class='{0} {3}'>Blink</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>V</span><span class='{0} {3}'>View source ({11})</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>Q</span><span class='{0} {3}'>Quit</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>F1</span><span class='{0} {3}'>Show help</span></div>";

		hlp.innerHTML = fmt.format([CLS_LIZARD_ELEMENT, CLS_HELP_RECORD, CLS_LETTER_KEY,
									CLS_HELP_TEXT, CLS_HELP_IMG, browser.extension.getURL(PATH_TO_HELP_IMG), CLS_HELP_COLOR,
									colorizeColors[0], colorizeColors[1], decolorizeColors[0], decolorizeColors[1], srcType]);

		const CLS_justShowedUp = " justShowedUp";
		const CLS_fadeout = " fadeout";
		const REGEXP_CLS_fadeout = new RegExp(CLS_fadeout, "g");

		if (!hlp.className.includes(CLS_justShowedUp)) {
			hlp.className += CLS_justShowedUp;
		}

		hlp.className = hlp.className.replace(REGEXP_CLS_fadeout, "");

		setTimeout(() => {
			hlp.className = hlp.className.replace(CLS_justShowedUp, CLS_fadeout);
			setTimeout(() => { hlp.className = hlp.className.replace(REGEXP_CLS_fadeout, ""); }, 2100);
		}, 3000);

		hlp.addEventListener("click", onCloseHelpBox, false);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeInfoBoxes() {
		onCloseHtmlBox();
		onCloseHelpBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseHtmlBox() {

		let elm = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (elm) {
			let btn = document.getElementById(ID_LIZARD_SOURCE_BOX_CLOSE);
			btn.removeEventListener("click", onCloseHtmlBox, false);

			btn = document.getElementById(ID_LIZARD_SOURCE_BOX_COPY);
			btn.removeEventListener("click", onClickHtmlCopy, false);

			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseHelpBox() {

		let elm = document.getElementById(ID_LIZARD_HELP_BOX);

		if (elm) {
			elm.removeEventListener("click", onCloseHelpBox, false);
			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function notifyToolbarButtonStatus(bStatus) {

		let msg = BROWSER_MESSAGE(prefs.MSG_LIZARD_STATE_CHANGED);
		msg.data["status"] = (bStatus ? "on" : "off");

		browser.runtime.sendMessage(msg);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function displayNotification(message, timeout) {

		let msg = BROWSER_MESSAGE(prefs.MSG_LIZARD_DISPLAY_NOTIF);
		msg.data["message"] = message;
		msg.data["timeout"] = timeout;

		browser.runtime.sendMessage(msg);
	}

	/////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////
	//////                                                                     //////
	//////               U T I L S                                             //////
	//////                                                                     //////
	/////////////////////////////////////////////////////////////////////////////////
	/////////////////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	//
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
	//
	function setScrollbarWidth() {

		lizardState.scrollbarWidth = DEF_SCROLL_BAR_WIDTH;

		let inner = document.createElement("p");
		inner.style.width = "100%";
		inner.style.height = "200px";

		let outer = document.createElement("div");
		outer.style.position = "absolute";
		outer.style.top = "0px";
		outer.style.left = "0px";
		outer.style.visibility = "hidden";
		outer.style.width = "200px";
		outer.style.height = "150px";
		outer.style.overflow = "hidden";
		outer.appendChild(inner);

		document.body.appendChild(outer);
		let w1 = inner.offsetWidth;
		outer.style.overflow = "scroll";
		let w2 = inner.offsetWidth;
		if (w1 == w2) w2 = outer.clientWidth;

		document.body.removeChild(outer);

		lizardState.scrollbarWidth = w1 - w2;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function sanitizeHtmlFromLizardElements(source) {

		let parser = new DOMParser();

		let doc = parser.parseFromString(source, "text/html");

		let lizardElements = doc.getElementsByClassName(CLS_LIZARD_ELEMENT);

		// When removing an element, it also shrinks the elements array.
		// If removing an element with it's children also in array, children will be removed in same iteration.
		while (lizardElements.length > 0) {
			lizardElements[0].parentNode.removeChild(lizardElements[0]);
		}

		let matchs = source.match(/^\<(html|body)\b/i);

		if (matchs === null) {
			return (doc.body.innerHTML);
		} else if (matchs[1] === "body") {
			return (doc.body.outerHTML);
		} else if (matchs[1] === "html") {
			return (doc.documentElement.outerHTML);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function addListenersToAllFrames(wnd, evt, handler, useCapture) {
		for (var i = 0; i < wnd.frames.length; i++) {
			addListenersToAllFrames(wnd.frames[i], handler);
		}
		wnd.document.addEventListener(evt, handler, useCapture);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeListenersFromAllFrames(wnd, evt, handler, useCapture) {
		for (var i = 0; i < wnd.frames.length; i++) {
			removeListenersFromAllFrames(wnd.frames[i], handler);
		}
		wnd.document.removeEventListener(evt, handler, useCapture);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function __test() {}

})();
