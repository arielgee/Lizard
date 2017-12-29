"use strict";

(function () {

	const CLS_LIZARD_ELEMENT = "lizardWebExtElement";

	const CLS_DRAGGABLE_ELEMENT = "lizardDraggable";
	const CLS_HELP_IMG = "helpImg";
	const CLS_HELP_RECORD = "helpRec";
	const CLS_HELP_TEXT = "helpText";
	const CLS_HELP_COLOR = "helpColor";
	const CLS_HELP_FOOTER = "helpFooter";
	const CLS_HELP_FOOTER_LINK = "helpFooterLink";
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
	const ID_LIZARD_HELP_FOOTER_LINK = "lizardHelpBoxFooterLink";

	const ID_LIZARD_HELP_BOX = "lizardHelpBox";

	const PATH_TO_HELP_IMG = "icons/lizard-32.png";
	const BOX_BORDER_WIDTH = 2;		// #lizardBoxBorder border width 2px (as in the content.css file)
	const DEF_SCROLL_BAR_WIDTH = 16;	
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

		useWheelToWiderNarrower: false,
	};

	
	//////////////////////////////////////////////////////////////////////
	//
	browser.runtime.onMessage.addListener((request, sender, sendResponse) => {

		// accept messages from background only when all scripts are injected
		if (ALL_LIZARD_SCRIPTS_INJECTED === undefined || ALL_LIZARD_SCRIPTS_INJECTED !== true) {
			return;
		}

		sendResponse({ message : "injected" });

		if (request.message === msgs.MSG_TOGGLE_SESSION_STATE) {
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

		if (lizardState.useWheelToWiderNarrower) {

			let elm = document.elementFromPoint(event.clientX, event.clientY);

			if (event.deltaY < 0) {
				wider();
			} else if (event.deltaY > 0) {
				narrower();
			}
			event.preventDefault();

		} else {

			if (!lizardState.bSelectionLocked) {
				lizardState.strolledElements =[];
				removeSelectionBox();
				unselectElement();
			}

			// scroll some pixels so the UX will fill responsive
			window.scrollBy({
				top : (20 * event.deltaY),
				left: 0,
				behavior: 'smooth',
			});
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
			default:
				//lzUtil.log("[lizard] Unused key:" + event.key);
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

		if (lizardState.scrollbarWidth === -1) determineScrollbarWidth();

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
			}
		});
		
		prefs.getWheelToWiderNarrower().then((checked) => {
			lizardState.useWheelToWiderNarrower = checked;
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

		/*lzUtil.log("Node: ", lizardState.currentElement.nodeName,
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

		let labelInnerHTML = "<b>" + elm.nodeName.toLowerCase() + "</b>";

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
			displayNotification("No element is selected.");
			return;
		}		
		
		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("The element '<" + elm.nodeName.toLowerCase() + ">' can't be hidden.");
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
			displayNotification("No element is selected.");
			return;
		}
		
		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("The element '<" + elm.nodeName.toLowerCase() + ">' can't be removed.");
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
			displayNotification("No valid element is selected.");
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName.toLowerCase()) !== -1) {
			displayNotification("The element '<" + elm.nodeName.toLowerCase() + ">' can't be isolated.");
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
			displayNotification("No element is selected.");
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
			prev_backgroundColor: elm.style.backgroundColor,
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
				lzUtil.log("Unknown undo type. This is not right.", ua.type, ua.data);
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

		let elm;

		if (lizardState.strolledElements.length > 0) {
			elm = lizardState.strolledElements.pop();
		} else if (lizardState.currentElement) {
			elm = lizardState.currentElement.firstElementChild;
		}

		if (elm) {
			removeSelectionBox();
			unselectElement();
			selectElement(elm);
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

		if (elm) {
			_blinkElement(elm, elm.style.visibility, 200, 3000);
		} else {
			displayNotification("No element is selected.");
		}
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
			displayNotification("No element is selected.");
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

		sourceData.setSavedViewSourceData(source, type, id);

		let msg = BROWSER_MESSAGE(newWin ? msgs.MSG_OPEN_VIEW_SOURCE_WINDOW : msgs.MSG_OPEN_VIEW_SOURCE_TAB);
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
			sourceBoxLeftBorder.className = CLS_LIZARD_ELEMENT + " " + CLS_DRAGGABLE_ELEMENT;

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
			lblType.className = CLS_LIZARD_ELEMENT + " " + CLS_DRAGGABLE_ELEMENT;

			sourceBoxLeftBorder.appendChild(btnClose);
			sourceBoxLeftBorder.appendChild(btnCopy);
			sourceBoxLeftBorder.appendChild(lblType);

			sourceBox.appendChild(sourceBoxLeftBorder);
			sourceBox.appendChild(sourceBoxPre);

			document.body.appendChild(sourceBox);

			btnClose.addEventListener("click", onCloseSourceBox, false);
			btnCopy.addEventListener("click", onClickHtmlCopy, false);

			sourceBoxLeftBorder.addEventListener("mousedown", onMouseDownSourceBoxBorder, false);
			window.addEventListener("mouseup", onMouseUpSourceBoxBorder, false);

		} else {
			// querySelector is slower but i'm looking just in the ID_LIZARD_SOURCE_BOX's element
			sourceBoxPre = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_PRE);
			lblType = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_SOURCE_TYPE);
		}

		lblType.textContent = type;

		sourceBoxPre.textContent = source;

		let point = getSourceBoxPosition(sourceBox, lizardState.currentElement.getBoundingClientRect());

		sourceBox.style.left = point.left + "px";
		sourceBox.style.top = point.top + "px";

		sourceBoxPre.focus();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseDownSourceBoxBorder(event) {

		if(event.target.className.includes(CLS_DRAGGABLE_ELEMENT)) {
			window.addEventListener('mousemove', onMoveSourceBox, true);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseUpSourceBoxBorder(event) {
		window.removeEventListener('mousemove', onMoveSourceBox, true);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMoveSourceBox(event) {

		let sourceBox = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (sourceBox) {
			sourceBox.style.top = parseInt(sourceBox.style.top) + event.movementY + "px";
			sourceBox.style.left = parseInt(sourceBox.style.left) + event.movementX + "px";
		}
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

			hlp.addEventListener("click", onCloseHelpBox, false);
		}

		const fmt = "<p class='{0} {1}'>Lizard Hotkeys<img class='{0} {4}' src={5}></img></p>" +
			"<div class='{0} {1}'><span class='{0} {2}'>H</span><span class='{0} {3}'>Hide (or: shift+click)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>R</span><span class='{0} {3}'>Remove (collapse element)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>I</span><span class='{0} {3}'>Isolate</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>C</span><span class='{0} {3}'>" +
				"Colorize (<span class='{0} {6}' style='background-color:{7} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{8} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>D</span><span class='{0} {3}'>" +
				"Decolorize (<span class='{0} {6}' style='background-color:{9} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{10} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>U</span><span class='{0} {3}'>Undo</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>W</span><span class='{0} {3}'>Wider</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>N</span><span class='{0} {3}'>Narrower</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>L</span><span class='{0} {3}'>Lock/Unlock</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>B</span><span class='{0} {3}'>Blink</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>V</span><span class='{0} {3}'>View source ({11})</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>Q</span><span class='{0} {3}'>Quit</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>F1</span><span class='{0} {3}'>Show help</span></div>" +
			"<div class='{0} {12}'><span id='{13}' class='{0} {14}'>Options page</span></div>";

		hlp.innerHTML = fmt.format([CLS_LIZARD_ELEMENT, CLS_HELP_RECORD, CLS_LETTER_KEY,
									CLS_HELP_TEXT, CLS_HELP_IMG, browser.extension.getURL(PATH_TO_HELP_IMG), CLS_HELP_COLOR,
									colorizeColors[0], colorizeColors[1], decolorizeColors[0], decolorizeColors[1], srcType,
									CLS_HELP_FOOTER, ID_LIZARD_HELP_FOOTER_LINK, CLS_HELP_FOOTER_LINK]);

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

		document.getElementById(ID_LIZARD_HELP_FOOTER_LINK).addEventListener("click", onLizardOptionsPage, false);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeInfoBoxes() {
		onCloseSourceBox();
		onCloseHelpBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseSourceBox() {

		let elm = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (elm) {
			let el = document.getElementById(ID_LIZARD_SOURCE_BOX_CLOSE);
			el.removeEventListener("click", onCloseSourceBox, false);

			el = document.getElementById(ID_LIZARD_SOURCE_BOX_COPY);
			el.removeEventListener("click", onClickHtmlCopy, false);

			el = document.getElementById(ID_LIZARD_SOURCE_BOX_LEFT_BORDER);
			el.removeEventListener("mousedown", onMouseDownSourceBoxBorder, false);

			window.removeEventListener("mouseup", onMouseUpSourceBoxBorder, false);

			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onLizardOptionsPage(event) {

		let msg = BROWSER_MESSAGE(msgs.MSG_OPEN_OPTIONS_PAGE);

		browser.runtime.sendMessage(msg);

		event.stopPropagation();
		return false;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseHelpBox() {

		let elm = document.getElementById(ID_LIZARD_HELP_FOOTER_LINK);

		if (elm) {
			elm.removeEventListener("click", onLizardOptionsPage, false);
		}

		elm = document.getElementById(ID_LIZARD_HELP_BOX);

		if (elm) {
			elm.removeEventListener("click", onCloseHelpBox, false);
			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function notifyToolbarButtonStatus(bStatus) {

		let msg = BROWSER_MESSAGE(msgs.MSG_SESSION_STATE_CHANGED);
		msg.data["status"] = (bStatus ? "on" : "off");

		browser.runtime.sendMessage(msg);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function displayNotification(message, timeout) {

		let msg = BROWSER_MESSAGE(msgs.MSG_DISPLAY_NOTIFICATION);
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
	function determineScrollbarWidth() {

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
		
		let matchs = source.match(/^\<(html|body)(\s|\>)/i);

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
	function random1to100() {
		return Math.floor(Math.random() * (100 - 1) + 1).toString();
	}

})();
