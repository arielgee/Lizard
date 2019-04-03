"use strict";

(function () {

	const CLS_LIZARD_ELEMENT = "lizardWebExtElement";

	const CLS_DRAGGABLE_ELEMENT = "lizardDraggable";
	const CLS_HELP_IMG = "helpImg";
	const CLS_HELP_CAPTION = "helpCap";
	const CLS_HELP_RECORD = "helpRec";
	const CLS_HELP_TEXT = "helpText";
	const CLS_HELP_XP_MODE = "xpMode";
	const CLS_HELP_COLOR = "helpColor";
	const CLS_HELP_FOOTER = "helpFooter";
	const CLS_HELP_FOOTER_LINK = "helpFooterLink";
	const CLS_LETTER_KEY = "letterKey";
	const CLS_MOUSE_BUTTON = "mouseButton";
	const CLS_MOUSE_BUTTON_IMG = "mouseButtonImg";

	const ATTRI_LIZARD_ISOLATED_CENTERED = "lizardIsolatedCentered";

	const LIZARD_BOX_PREFIX = "lizardBox";
	const ID_LIZARD_BOX = LIZARD_BOX_PREFIX + "Container";
	const ID_LIZARD_BOX_BORDER = LIZARD_BOX_PREFIX + "Border";
	const ID_LIZARD_BOX_LABEL_TAG = LIZARD_BOX_PREFIX + "LabelTag";
	const ID_LIZARD_SOURCE_BOX = "lizardSourceBox";
	const ID_LIZARD_SOURCE_BOX_RESIZER = "lizardSourceBoxResizer";
	const ID_LIZARD_SOURCE_BOX_LEFT_BORDER = "lizardSourceBoxLeftBorder";
	const ID_LIZARD_SOURCE_BOX_PRE = "lizardSourceBoxPre";
	const ID_LIZARD_SOURCE_BOX_CLOSE = "lizardSourceBoxClose";
	const ID_LIZARD_SOURCE_BOX_COPY = "lizardSourceBoxCopy";
	const ID_LIZARD_SOURCE_BOX_SOURCE_TYPE = "lizardSourceBoxSourceType";
	const ID_LIZARD_ISOLATE_BODY = "lizardIsolateBody";
	const ID_LIZARD_HELP_BOX = "lizardHelpBox";
	const ID_LIZARD_HELP_FOOTER_LINK = "lizardHelpBoxFooterLink";
	const ID_LIZARD_VERSION_NOTICE_BOX = "lizardVersionNoticeBox";
	const ID_LIZARD_VER_NOTICE_19_OPTIONS_LINK = "lizardVersionNotice19OptionsLink";
	const ID_LIZARD_VERSION_NOTICE_BOX_CLOSE = "lizardVersionNoticeBoxClose";
	const ID_LIZARD_CONTEXT_MENU_BOX = "lizardContextMenuBox";


	const BOX_BORDER_WIDTH = 2;		// #lizardBoxBorder border width 2px (as in the content.css file)
	const DEF_SCROLL_BAR_WIDTH = 16;
	const MANDATORY_ROOT_ELEMENTS = ["HTML", "BODY"];

	const UNDO_ACTION_HIDE = "undoHide";
	const UNDO_ACTION_REMOVE = "undoRemove";
	const UNDO_ACTION_DEWIDTHIFY = "undoDeWidthify";
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
		bSessionStarted: false,
		currentElement: null,
		lastCursorPosition: {x: -1, y: -1},
		bSelectionLocked: false,
		bSelectionSuspended: false,
		bContextMenuVisible: false,
		undoActions: [],
		strolledElements: [],
		scrollbarWidth: -1,
	};


	//////////////////////////////////////////////////////////////////////
	//
	browser.runtime.onMessage.addListener((request, sender) => {

		return new Promise((resolve, reject) => {

			// accept messages from background only when ALL scripts are injected
			if (ALL_LIZARD_SCRIPTS_INJECTED === undefined || ALL_LIZARD_SCRIPTS_INJECTED !== true) {
				reject();
			} else {

				switch (request.message) {

					case msgs.MSG_TOGGLE_SESSION_STATE:
						resolve({ message: "toggle" });
						if (lizardState.bSessionStarted) {
							stopSession();
						} else {
							startSession();
						}
						break;
						//////////////////////////////////////////////////////////////

					case msgs.MSG_SHUTDOWN_SESSION:
						if (lizardState.bSessionStarted) {
							stopSession();
						}
						resolve({ message: "shutdown" });
						break;
						//////////////////////////////////////////////////////////////

					default:
						reject();
						break;
						//////////////////////////////////////////////////////////////
				}
			}
		});
	});

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseMove(event) {

		if (lizardState.bSelectionLocked || lizardState.bSelectionSuspended) {
			return;
		}

		// no narrower action if mouse is moved
		lizardState.strolledElements = [];

		removeSelectionBox();

		unselectElement();
		selectElement(document.elementFromPoint(event.clientX, event.clientY), event.clientX, event.clientY);

		createSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseLeave(event) {

		if (lizardState.bSelectionLocked) {
			return;
		}

		if (event.target.nodeName === "HTML") {
			removeSelectionBox();
			unselectElement();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onWheel(event) {

		// this listener is added only when pref_wheelToWiderNarrower is checked

		let elm = document.elementFromPoint(event.clientX, event.clientY);

		if (event.deltaY < 0) {
			wider();
		} else if (event.deltaY > 0) {
			narrower();
		}
		event.preventDefault();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onPageHide(event) {
		stopSession();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onVisibilityChange(event) {
		if(document.hidden) {
			notifyToolbarButtonStatus(false);
		} else {
			// When switching from one tab to another the first event fired is for the now visible tab and
			// the second event is fired for the now hidden tab.
			// When switching between 2 Lizard sessions the LAST event must be for the now visible tab so
			// the toolbar button will reflect the state correctly
			setTimeout(() => notifyToolbarButtonStatus(true), 450);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClick(event) {

		if (lizardState.currentElement && event.shiftKey) {
			hideElement();
			event.preventDefault();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClick_XpMode(event) {

		if(!lizardState.currentElement) {
			return;
		}

		const MOUSE_BUTTON_LEFT = 0;
		const MOUSE_BUTTON_RIGHT = 2;

		if (event.button === MOUSE_BUTTON_RIGHT) {

			prefs.getXpModeContextMenu().then((checked) => {
				if(checked) {
					showContextMenu(event.clientX, event.clientY, event.type);
				} else {
					undoLastAction();
				}
			});

		} else if(event.button === MOUSE_BUTTON_LEFT && !lizardState.bContextMenuVisible) {

			if (event.shiftKey) {
				hideElement();
			} else {
				removeElement();
			}
			event.preventDefault();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onKeyDown(event) {

		if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
			return;
		}

		let lowerKey = event.key.toLowerCase();
		let knownKey = true;		//  optimistic

		switch (lowerKey) {
			case "h":
				hideElement();
				break;
			case "r":
				removeElement();
				break;
			case "e":
				deWidthify();
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
			case "s":
				cssSelector();
				break;
			case "q":
				stopSession();
				break;
			case "f1":
				showHelp();
				break;
			case "escape":
				removeInfoBoxes();
				break;
			case "contextmenu":
				showContextMenu(lizardState.currentElement.offsetLeft+1, lizardState.currentElement.offsetTop+1, event.type);
				break;
			default:
				//console.log("[lizard]", "Unused key:" + event.key);
				if(lowerKey.length === 1 && lowerKey >= 'a' && lowerKey <= 'z') {
					displayNotification("Hotkeys: Unknown key '" + lowerKey + "'");
				}
				knownKey = false;
		}

		if(knownKey === true) {
			if(lizardState.bContextMenuVisible === true) {
				onCloseLizardContextMenu();
			}
			event.preventDefault();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onContextMenu(event) {
		event.preventDefault();
		return false;
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
	function startSession() {

		if (!document || !document.body) {
			alert("\tWhoops!\n\n\tSorry, this is not a valid html document with a <body>.\t");
			return;
		}

		if (lizardState.scrollbarWidth === -1) determineScrollbarWidth();

		document.addEventListener("mousemove", onMouseMove, true);
		document.addEventListener("mouseleave", onMouseLeave, true);
		document.addEventListener("scroll", onScroll, false);
		window.addEventListener("resize", onResize, false);
		document.addEventListener("pagehide", onPageHide, true);
		document.addEventListener("visibilitychange", onVisibilityChange, false);
		document.addEventListener("keydown", onKeyDown, false);

		prefs.getWheelToWiderNarrower().then((checked) => {
			if(checked) {
				document.addEventListener("wheel", onWheel, true);
			}
		});

		prefs.getExpertMode().then((checked) => {
			if(checked) {
				document.addEventListener("click", onClick_XpMode, true);
				document.addEventListener("contextmenu", onContextMenu, true);
			} else {
				document.addEventListener("click", onClick, true);
			}
		});

		// select something
		onMouseMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2 });

		prefs.getHelpBoxOnStart().then((checked) => {
			if (checked) {
				showHelp();
			}
		});

		lizardState.bSessionStarted = true;
		notifyToolbarButtonStatus(lizardState.bSessionStarted);

		prefs.getVersionNotice().then((prevVersion) => {
			if(prevVersion !== "") {
				prefs.setVersionNotice("");
				showVersionNotice(prevVersion);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function stopSession() {

		lockSelection(false);
		removeSelectionBox();
		unselectElement();
		removeInfoBoxes();

		document.removeEventListener("mousemove", onMouseMove, true);
		document.removeEventListener("mouseleave", onMouseLeave, true);
		document.removeEventListener("scroll", onScroll, false);
		window.removeEventListener("resize", onResize, false);
		document.removeEventListener("pagehide", onPageHide, true);
		document.removeEventListener("visibilitychange", onVisibilityChange, false);
		document.removeEventListener("keydown", onKeyDown, false);
		document.removeEventListener("wheel", onWheel, true);
		document.removeEventListener("click", onClick, true);
		document.removeEventListener("click", onClick_XpMode, true);
		document.removeEventListener("contextmenu", onContextMenu, true);

		lizardState.bSessionStarted = false;
		notifyToolbarButtonStatus(lizardState.bSessionStarted);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function selectElement(elm, clientX, clientY) {
		// check type of className. <SVG> elements are evil.
		if (elm && ((typeof elm.className !== "string") || !(elm.className.includes(CLS_LIZARD_ELEMENT)))) {
			lizardState.currentElement = elm;

			if(clientX !== undefined && clientY !== undefined) {
				lizardState.lastCursorPosition.x = clientX;
				lizardState.lastCursorPosition.y = clientY;
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function unselectElement() {
		lizardState.currentElement = null;
		lizardState.lastCursorPosition.x = lizardState.lastCursorPosition.y = -1;
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

		const CLS_floater = "floater";

		if ((rect.left + boxLabelTag.offsetWidth) > innerWidth) {
			boxLabelTag.style.left = (innerWidth - rect.left - boxLabelTag.offsetWidth) + "px";
			lzUtil.concatClassName(boxLabelTag, CLS_floater);
		}
		if ((rect.top + boxLabelTag.offsetHeight) > innerHeight) {
			boxLabelTag.style.top = (innerHeight - rect.top - boxLabelTag.offsetHeight) + "px";
			lzUtil.concatClassName(boxLabelTag, CLS_floater);
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

		let labelInnerHTML = "<span class=" + CLS_LIZARD_ELEMENT + ">" + elm.nodeName.toLowerCase() + "</span>";

		if (elm.id !== "") {
			labelInnerHTML += ", id: " + elm.id;
		}
		if (elm.className !== "") {
			labelInnerHTML += ", class: " + elm.className.toString().trunc(512);
		}
		if (elm.style.cssText !== "") {
			labelInnerHTML += ", style: " + elm.style.cssText.toString().trunc(512);
		}

		return labelInnerHTML;
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
		removeSelectionBox();
		createSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function hideElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("Hide: No element is selected.");
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName) !== -1) {
			displayNotification("The element '<" + elm.nodeName + ">' can't be hidden.");
			return;
		}

		let cursorPos = Object.assign({}, lizardState.lastCursorPosition);

		removeSelectionBox();
		unselectElement();
		lockSelection(false);

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_HIDE);

		ua.data["element"] = elm;
		ua.data["prev_visibility"] = elm.style.visibility;

		lizardState.undoActions.push(ua);

		elm.style.visibility = "hidden";

		onMouseMove({ clientX: cursorPos.x, clientY: cursorPos.y });
	}

	//////////////////////////////////////////////////////////////////////
	//
	function removeElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("Remove: No element is selected.");
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName) !== -1) {
			displayNotification("The element '<" + elm.nodeName + ">' can't be removed.");
			return;
		}

		let cursorPos = Object.assign({}, lizardState.lastCursorPosition);

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

		onMouseMove({ clientX: cursorPos.x, clientY: cursorPos.y });
	}

	//////////////////////////////////////////////////////////////////////
	//
	function deWidthify() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("DeWidthify: No element is selected.");
			return;
		}

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_DEWIDTHIFY);

		ua.data["dewidthifiedItems"] = [];

		_deWidthify(elm, ua.data.dewidthifiedItems);

		lizardState.undoActions.push(ua);

		repositionSelectionBox();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _deWidthify(elm, uaItems) {

		uaItems.push({
			element: elm,
			prev_width: elm.style.width,
			prev_maxWidth: elm.style.maxWidth,
		});

		elm.style.width = "auto";
		elm.style.maxWidth = "none";

		for(let i=0, len=elm.children.length; i<len; i++) {

			let c = elm.children[i];

			// check type of className. <SVG> elements are evil.
			if(c.nodeType === Node.ELEMENT_NODE && ((typeof c.className !== "string") || !(c.className.includes(CLS_LIZARD_ELEMENT)))) {
				_deWidthify(c, uaItems);
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function isolateElement() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("Isolate: No valid element is selected.");
			return;
		}

		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName) !== -1) {
			displayNotification("The element '<" + elm.nodeName + ">' can't be isolated.");
			return;
		}

		if (elm.hasAttribute(ATTRI_LIZARD_ISOLATED_CENTERED)) {
			displayNotification("The element is already isolated.");
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

		let cloning = cloneIsolatedElement(elm);

		document.documentElement.removeChild(document.body);
		document.body = document.createElement("body");
		document.body.id = ID_LIZARD_ISOLATE_BODY;

		cloning.then((isolated) => { document.body.appendChild(isolated); });
	}

	//////////////////////////////////////////////////////////////////////
	//
	function cloneIsolatedElement(elm) {

		return new Promise((resolve) => {

			let css = lzUtil.getElementComputedCssText(elm);

			let e = elm.cloneNode(true);
			e.style.cssText = css;
			e.setAttribute(ATTRI_LIZARD_ISOLATED_CENTERED, "");
			resolve(e)
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function colorizeElement(invertColors) {

		prefs.getColorizeColors().then((colors) => {
			prefs.getColorizeChildren().then((colorizeChildren) => {
				prefs.getColorizeImages().then((colorImages) => {

					let fg = (invertColors ? colors[1] : colors[0]);
					let bg = (invertColors ? colors[0] : colors[1]);
					let saturateAmount = (colorImages ? "1000%" : null);
					let invertAmount = (invertColors ? "100%" : "0%");

					colorElement(fg, bg, colorizeChildren, saturateAmount, invertAmount);
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function decolorizeElement(invertColors) {

		prefs.getDecolorizeColors().then((colors) => {
			prefs.getColorizeChildren().then((colorizeChildren) => {
				prefs.getColorizeImages().then((colorImages) => {

					let fg = (invertColors ? colors[1] : colors[0]);
					let bg = (invertColors ? colors[0] : colors[1]);
					let saturateAmount = (colorImages ? "0%" : null);
					let invertAmount = (invertColors ? "100%" : "0%");

					colorElement(fg, bg, colorizeChildren, saturateAmount, invertAmount);
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function colorElement(foreground, background, colorizeChildren, saturateAmount, invertAmount) {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("Colorize/Decolorize: No element is selected.");
			return;
		}

		let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_COLORIZE);

		ua.data["coloureditems"] = [];

		_colorElement(elm, foreground, background, ua.data.coloureditems, colorizeChildren, saturateAmount, invertAmount);

		lizardState.undoActions.push(ua);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _colorElement(elm, foreground, background, uaItems, deep, saturateAmount, invertAmount) {

		let colorImages = (saturateAmount && ((elm.nodeName === "IMG") || lzUtil.isSVGObject(elm) || lzUtil.hasBackgroundImage(elm)));

		uaItems.push({
			element:  elm,
			prev_color: elm.style.color,
			prev_borderColor: elm.style.borderColor,
			prev_backgroundColor: elm.style.backgroundColor,
			prev_filter: elm.style.filter,
			undoFilter: colorImages,
		});

		elm.style.color = foreground;
		elm.style.borderColor = foreground;
		elm.style.backgroundColor = background;
		if (colorImages) {
			lzUtil.applySaturateFilter(elm, saturateAmount);
			if (invertAmount) {
				lzUtil.applyInvertFilter(elm, invertAmount);
			}
		}

		for(let i=0; i<elm.children.length && deep; i++) {

			let c = elm.children[i];

			// check type of className. <SVG> elements are evil.
			if(c.nodeType === Node.ELEMENT_NODE && ((typeof c.className !== "string") || !(c.className.includes(CLS_LIZARD_ELEMENT)))) {
				_colorElement(c, foreground, background, uaItems, true, saturateAmount, invertAmount);
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function undoLastAction() {

		// nothing to undo
		if (0 === lizardState.undoActions.length) {
			displayNotification("Undo stack is empty.");
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

			case UNDO_ACTION_DEWIDTHIFY:
				for(let i=0, len=ua.data.dewidthifiedItems.length; i<len; i++) {
					let e = ua.data.dewidthifiedItems[i];
					e.element.style.width = e.prev_width;
					e.element.style.maxWidth = e.prev_maxWidth;
				}
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
					if (e.undoFilter) {
						e.element.style.filter = e.prev_filter;
					}
				}
				break;
				//////////////////////////////////////////////////////////////

			default:
				console.log("[lizard]", "Unknown undo type. This is not right.", ua.type, ua.data);
				break;
				//////////////////////////////////////////////////////////////
		}
		repositionSelectionBox();
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
	}

	//////////////////////////////////////////////////////////////////////
	//
	function blinkElement() {

		let elm = lizardState.currentElement;

		if (elm) {
			// blink only none hidden elements
			if(elm.style.visibility !== "hidden") {
				_blinkElement(elm, elm.style.visibility, 200, 3000);
			}
		} else {
			displayNotification("Blink: No element is selected.");
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
			displayNotification("view Source: No element is selected.");
			return;
		}

		prefs.getViewSourceType().then((type) => {

			let source = "wtf?";

			if (type === prefs.SOURCE_TYPE.HTML) {
				source = SourceBeautifier.html(sanitizeHtmlFromLizardElements(elm.outerHTML));
			} else if (type === prefs.SOURCE_TYPE.CSS) {

				prefs.getViewCssType().then((cssType) => {
					if (cssType == prefs.CSS_TYPE.MATCH_RULES) {

						let result = lzUtil.getElementMatchedCSSRules(elm);
						if (result.remoteStyleSheetDomains.length > 0) {
							displayNotification("Can't access StyleSheets from different domains (security).\n\n(" + result.remoteStyleSheetDomains.join(", ") + ")");
						}
						source = result.cssText.length ? result.cssText : "-none found-";

					} else if (cssType === prefs.CSS_TYPE.COMP_STYLE) {
						source = lzUtil.getElementComputedCssText(elm);
					}
					source = SourceBeautifier.css(source);
				});
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

		let id = window.btoa(lzUtil.random1to100() + Date.now().toString());

		sourceData.setSavedViewSourceData(source, type, id);

		let msg = BROWSER_MESSAGE(newWin ? msgs.MSG_OPEN_VIEW_SOURCE_WINDOW : msgs.MSG_OPEN_VIEW_SOURCE_TAB);
		msg.data["id"] = id;

		browser.runtime.sendMessage(msg);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function viewSourceInPage(type, source, altBorderColor) {

		let sourceBox;
		let divResizer;
		let divLeftBorder;
		let sourceBoxPre;
		let btnClose;
		let btnCopy;
		let lblType;

		sourceBox = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (!sourceBox) {

			sourceBox = document.createElement("div");
			sourceBox.id = ID_LIZARD_SOURCE_BOX;
			sourceBox.className = CLS_LIZARD_ELEMENT;

			divResizer = document.createElement("div");
			divResizer.id = ID_LIZARD_SOURCE_BOX_RESIZER;
			divResizer.className = CLS_LIZARD_ELEMENT;

			divLeftBorder = document.createElement("div");
			divLeftBorder.id = ID_LIZARD_SOURCE_BOX_LEFT_BORDER;
			divLeftBorder.className = CLS_LIZARD_ELEMENT + " " + CLS_DRAGGABLE_ELEMENT;

			sourceBoxPre = document.createElement("pre");
			sourceBoxPre.id = ID_LIZARD_SOURCE_BOX_PRE;
			sourceBoxPre.className = CLS_LIZARD_ELEMENT;

			btnClose = document.createElement("div");
			btnClose.id = ID_LIZARD_SOURCE_BOX_CLOSE;
			btnClose.className = CLS_LIZARD_ELEMENT;
			btnClose.title = "Close";

			btnCopy = document.createElement("div");
			btnCopy.id = ID_LIZARD_SOURCE_BOX_COPY;
			btnCopy.className = CLS_LIZARD_ELEMENT;
			btnCopy.title = "Copy to clipboard";

			lblType = document.createElement("span");
			lblType.id = ID_LIZARD_SOURCE_BOX_SOURCE_TYPE;
			lblType.className = CLS_LIZARD_ELEMENT + " " + CLS_DRAGGABLE_ELEMENT;

			divLeftBorder.appendChild(btnClose);
			divLeftBorder.appendChild(btnCopy);
			divLeftBorder.appendChild(lblType);

			sourceBox.appendChild(divResizer);
			sourceBox.appendChild(divLeftBorder);
			sourceBox.appendChild(sourceBoxPre);

			document.body.appendChild(sourceBox);

			btnClose.addEventListener("click", onClick_CloseSourceBox, false);
			btnCopy.addEventListener("click", onClick_CopySourceText, false);
			divLeftBorder.addEventListener("mousedown", onMouseDown_startSourceBoxDrag, false);
			divResizer.addEventListener("mousedown", onMouseDown_startSourceBoxResize, false);
		} else {
			// querySelector is slower but i'm looking just in the ID_LIZARD_SOURCE_BOX's element
			divLeftBorder = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_LEFT_BORDER);
			sourceBoxPre = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_PRE);
			lblType = sourceBox.querySelector("#" + ID_LIZARD_SOURCE_BOX_SOURCE_TYPE);
		}

		const CLS_altBorderColor = "altBorderColor";

		if (altBorderColor === true) {
			lzUtil.concatClassName(sourceBox, CLS_altBorderColor);
			lzUtil.concatClassName(divLeftBorder, CLS_altBorderColor);
		} else {
			lzUtil.removeClassName(sourceBox, CLS_altBorderColor);
			lzUtil.removeClassName(divLeftBorder, CLS_altBorderColor);
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
	function cssSelector() {

		let elm = lizardState.currentElement;

		if (elm) {
			let selector = (new CssSelectorGenerator()).getSelector(elm);
			viewSourceInPage("CSS Selector", selector, true);
		} else {
			displayNotification("CSS Selector: No element is selected.");
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseDown_startSourceBoxDrag(event) {

		if (event.target.className.includes(CLS_DRAGGABLE_ELEMENT)) {
			window.addEventListener("mouseup", onMouseUp_stopSourceBoxDrag, false);
			window.addEventListener('mousemove', onMouseMove_dragSourceBox, true);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseUp_stopSourceBoxDrag(event) {

		window.removeEventListener('mousemove', onMouseMove_dragSourceBox, true);
		window.removeEventListener("mouseup", onMouseUp_stopSourceBoxDrag, false);

		let sourceBox = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (sourceBox) {

			let winInnerWidth = window.innerWidth-getVScrollWidth()-28;		// source box left border width + box border
			let winInnerHeight = window.innerHeight-getHScrollWidth()-65;	// 2 button height + padding + box border + extra space

			if (sourceBox.offsetLeft < 0) {
				sourceBox.style.left = "0";
			} else if (sourceBox.offsetLeft > winInnerWidth) {
				sourceBox.style.left = winInnerWidth + "px";
			}

			if (sourceBox.offsetTop < 0) {
				sourceBox.style.top = "0";
			} else if (sourceBox.offsetTop > winInnerHeight) {
				sourceBox.style.top = winInnerHeight + "px";
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseMove_dragSourceBox(event) {

		let box = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (box) {
			box.style.top = (box.offsetTop + event.movementY) + "px";
			box.style.left = (box.offsetLeft + event.movementX) + "px";
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseDown_startSourceBoxResize(event) {
		lizardState.bSelectionSuspended = true;
		window.addEventListener("mouseup", onMouseUp_stopSourceBoxResize, false);
		window.addEventListener("mousemove", onMouseMove_resizeSourceBox, false);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseUp_stopSourceBoxResize(e) {
		lizardState.bSelectionSuspended = false;
		window.removeEventListener("mousemove", onMouseMove_resizeSourceBox, false);
		window.removeEventListener("mouseup", onMouseUp_stopSourceBoxResize, false);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseMove_resizeSourceBox(event) {

		let box = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (box) {
			box.style.width = (event.clientX - box.offsetLeft) + "px";
			box.style.height = (event.clientY - box.offsetTop) + "px";
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
	function onClick_CopySourceText(event) {

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
		let xpModeGetting = prefs.getExpertMode();
		let xpModeContextMenuGetting = prefs.getXpModeContextMenu();

		srcGetting.then((srcType) => {
			colGetting.then((colorize) => {
				decolGetting.then((decolorize) => {
					xpModeGetting.then((xpMode) => {
						xpModeContextMenuGetting.then((xpMenu) => {
							_showHelp(srcType, colorize, decolorize, xpMode ? "" : "hidden", xpMenu ? "Menu" : "Undo");
						});
					});
				});
			});
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _showHelp(srcType, colorizeColors, decolorizeColors, xpModeState, rightClickAction) {

		let hlp = document.getElementById(ID_LIZARD_HELP_BOX);

		if (!hlp) {

			hlp = document.createElement("div");
			hlp.id = ID_LIZARD_HELP_BOX;
			hlp.className = CLS_LIZARD_ELEMENT;
			document.body.appendChild(hlp);

			hlp.addEventListener("click", onCloseHelpBox, false);
		}

		const FMT = "<div class='{0} {14}'><span>Lizard Hotkeys</span><div class='{0} {4}'></div></div>" +
			"<div class='{0} {1} {15} {18}'>" +
				"<span class='{0} {16}'><div class='{0} {17}'></div></span>" +
				"<span class='{0} {16}'><div class='{0} {17} flip'></div></span>" +
				"<span class='{0} {3}'>Remove</span>" +
				"<span class='{0} {3}'>{19}</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>H</span><span class='{0} {3}'>Hide (or: shift+click)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>R</span><span class='{0} {3}'>Remove (collapse element)</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>E</span><span class='{0} {3}'>DeWidthify</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>I</span><span class='{0} {3}'>Isolate</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>C</span><span class='{0} {3}'>" +
				"Colorize (<span class='{0} {5}' style='background-color:{6} !important;'>&emsp;</span> on <span class='{0} {5}' style='background-color:{7} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>D</span><span class='{0} {3}'>" +
				"Decolorize (<span class='{0} {5}' style='background-color:{8} !important;'>&emsp;</span> on <span class='{0} {5}' style='background-color:{9} !important;'>&emsp;</span>)</span>" +
			"</div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>U</span><span class='{0} {3}'>Undo</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>W</span><span class='{0} {3}'>Wider</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>N</span><span class='{0} {3}'>Narrower</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>L</span><span class='{0} {3}'>Lock/Unlock</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>B</span><span class='{0} {3}'>Blink</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>V</span><span class='{0} {3}'>View source ({10})</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>S</span><span class='{0} {3}'>CSS Selector</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>Q</span><span class='{0} {3}'>Quit</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>F1</span><span class='{0} {3}'>Show help</span></div>" +
			"<div class='{0} {11}'><span id='{12}' class='{0} {13}'>Options page</span></div>";

		hlp.innerHTML = FMT.format([CLS_LIZARD_ELEMENT, CLS_HELP_RECORD, CLS_LETTER_KEY,
									CLS_HELP_TEXT, CLS_HELP_IMG, CLS_HELP_COLOR,
									colorizeColors[0], colorizeColors[1], decolorizeColors[0], decolorizeColors[1], srcType,
									CLS_HELP_FOOTER, ID_LIZARD_HELP_FOOTER_LINK, CLS_HELP_FOOTER_LINK, CLS_HELP_CAPTION,
									CLS_HELP_XP_MODE, CLS_MOUSE_BUTTON, CLS_MOUSE_BUTTON_IMG,
									xpModeState, rightClickAction]);

		const CLS_justShowedUp = "justShowedUp";
		const CLS_fadeout = "fadeout";

		lzUtil.concatClassName(hlp, CLS_justShowedUp);
		lzUtil.removeClassName(hlp, CLS_fadeout);		// remove leftovers if user repeatedly clicks the F1

		setTimeout(() => {
			lzUtil.replaceClassName(hlp, CLS_justShowedUp, CLS_fadeout);
			setTimeout(() => { lzUtil.removeClassName(hlp, CLS_fadeout); }, 2100);
		}, 3000);

		document.getElementById(ID_LIZARD_HELP_FOOTER_LINK).addEventListener("click", onLizardOptionsPage, false);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function showContextMenu(clientX, clientY, eventType) {

		if (!lizardState.currentElement) {
			return;
		}

		// when action originate from click make sure element under menu is selected
		if(eventType === "click") {
			onMouseMove({ clientX: clientX, clientY: clientY });
		}

		let mnu = document.getElementById(ID_LIZARD_CONTEXT_MENU_BOX);

		if (!mnu) {

			mnu = document.createElement("div");
			mnu.id = ID_LIZARD_CONTEXT_MENU_BOX;
			mnu.className = CLS_LIZARD_ELEMENT;
			mnu.setAttribute("tabindex", "0");
			document.body.appendChild(mnu);
		}

		const EXTRA_SPACE = 25;
		const FMT = "<div class='{0} mnuItem' data-access-key='h'><span class='{0} mnuTitle mnuAccessKey'>Hide</span></div>" +
					"<div class='{0} mnuItem' data-access-key='r'><span class='{0} mnuTitle mnuAccessKey'>Remove</span></div>" +
					"<div class='{0} mnuItem' data-access-key='e'><span class='{0} mnuTitle'>D<span class='{0} mnuAccessKey'>eWidthify</span></span></div>" +
					"<div class='{0} mnuItem' data-access-key='i'><span class='{0} mnuTitle mnuAccessKey'>Isolate</span></div>" +
					"<div class='{0} mnuItem' data-access-key='c'><span class='{0} mnuTitle mnuAccessKey'>Colorize</span></div>" +
					"<div class='{0} mnuItem' data-access-key='d'><span class='{0} mnuTitle mnuAccessKey'>Decolorize</span></div>" +
					"<div class='{0} mnuItem' data-access-key='u'><span class='{0} mnuTitle mnuAccessKey'>Undo</span></div>" +
					"<div class='{0} mnuItem' data-access-key='w'><span class='{0} mnuTitle mnuAccessKey'>Wider</span></div>" +
					"<div class='{0} mnuItem' data-access-key='n'><span class='{0} mnuTitle mnuAccessKey'>Narrower</span></div>" +
					"<div class='{0} mnuItem' data-access-key='l'><span class='{0} mnuTitle mnuAccessKey'>Lock/Unlock</span></div>" +
					"<div class='{0} mnuItem' data-access-key='b'><span class='{0} mnuTitle mnuAccessKey'>Blink</span></div>" +
					"<div class='{0} mnuItem' data-access-key='v'><span class='{0} mnuTitle mnuAccessKey'>View Source</span></div>" +
					"<div class='{0} mnuItem' data-access-key='s'><span class='{0} mnuTitle'><span>CSS&nbsp;</span><span class='{0} mnuAccessKey'>Selector</span></span></div>" +
					"<div class='{0} mnuItem' data-access-key='q'><span class='{0} mnuTitle mnuAccessKey'>Quit</span></div>" +
					"<div class='{0} mnuItem seperator'></div>" +
					"<div class='{0} mnuItem' data-access-key='f1'><span class='{0} mnuTitle'>Show Help</span><span class='{0} mnuHotkey'>F1</span></div>" +
					"<div class='{0} mnuItem' data-options-page><span class='{0} mnuTitle'>Options Page</span></div>";

		mnu.innerHTML = FMT.format([CLS_LIZARD_ELEMENT]);

		// real inner size accounting for the scrollbars width if they exist
		const INNER_WIDTH = window.innerWidth - getVScrollWidth();
		const INNER_HEIGHT = window.innerHeight - getHScrollWidth();

		if(eventType === "click") {

			if(clientX + mnu.offsetWidth > INNER_WIDTH) {
				clientX = INNER_WIDTH - mnu.offsetWidth - EXTRA_SPACE;
			}

			if(clientY + mnu.offsetHeight > INNER_HEIGHT) {
				clientY = INNER_HEIGHT - mnu.offsetHeight - EXTRA_SPACE;
			}

		} else if(eventType === "keydown") {

			let vpRect = getElementViewportRect(lizardState.currentElement, INNER_WIDTH, INNER_HEIGHT);
			clientX = vpRect.left + 1;
			clientY = vpRect.top + 1;
		}

		mnu.style.left = clientX + "px";
		mnu.style.top = clientY + "px";

		lockSelection(true);

		setTimeout(() => lizardState.bContextMenuVisible = true, 400);

		document.addEventListener("wheel", onWheel_preventScroll, true);
		document.addEventListener("keydown", onKeyDown_preventScroll, true);
		mnu.addEventListener("blur", onCloseLizardContextMenu, true);

		mnu.querySelectorAll("#" + ID_LIZARD_CONTEXT_MENU_BOX + " .mnuItem:not(.seperator)").forEach((elm) => {
			elm.addEventListener("click", onClickLizardContextMenuItem, true);
		});

		mnu.focus();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClickLizardContextMenuItem(event) {

		onCloseLizardContextMenu();

		event.preventDefault();
		event.stopPropagation();

		let elm = event.target;
		while (elm && !elm.classList.contains("mnuItem")) {
			elm = elm.parentElement;
		}

		if(elm && elm.classList.contains("mnuItem")) {

			if(elm.hasAttribute("data-options-page")) {
				onLizardOptionsPage();
			} else {
				onKeyDown({
					defaultPrevented: false,
					altKey: false,
					ctrlKey: false,
					metaKey: false,
					shiftKey: event.shiftKey,
					key: elm.getAttribute("data-access-key"),
					preventDefault: () => {},
				});
			}
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseLizardContextMenu() {

		let elm = document.getElementById(ID_LIZARD_CONTEXT_MENU_BOX);

		if(elm) {

			document.removeEventListener("wheel", onWheel_preventScroll, true);
			document.removeEventListener("keydown", onKeyDown_preventScroll, true);
			elm.removeEventListener("blur", onCloseLizardContextMenu, true);

			elm.querySelectorAll("#" + ID_LIZARD_CONTEXT_MENU_BOX + " .mnuItem:not(.seperator)").forEach((elm) => {
				elm.removeEventListener("click", onClickLizardContextMenuItem, true);
			});

			elm.parentNode.removeChild(elm);

			lockSelection(false);
		}

		setTimeout(() => lizardState.bContextMenuVisible = false, 400);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onWheel_preventScroll(event) {
		event.preventDefault();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onKeyDown_preventScroll(event) {

		const SCROLL_KEYS = [ "arrowup", "arrowdown", "arrowleft", "arrowright", "pageup", "pagedown", "home", "end" ];

		if(SCROLL_KEYS.indexOf(event.key.toLowerCase()) !== -1) {
			event.preventDefault();
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
	function removeInfoBoxes() {
		onClick_CloseSourceBox();
		onCloseHelpBox();
		onCloseVersionNoticeBox();
		onCloseLizardContextMenu();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onClick_CloseSourceBox() {

		let elm = document.getElementById(ID_LIZARD_SOURCE_BOX);

		if (elm) {
			let el = document.getElementById(ID_LIZARD_SOURCE_BOX_CLOSE);
			el.removeEventListener("click", onClick_CloseSourceBox, false);

			el = document.getElementById(ID_LIZARD_SOURCE_BOX_COPY);
			el.removeEventListener("click", onClick_CopySourceText, false);

			el = document.getElementById(ID_LIZARD_SOURCE_BOX_LEFT_BORDER);
			el.removeEventListener("mousedown", onMouseDown_startSourceBoxDrag, false);

			el = document.getElementById(ID_LIZARD_SOURCE_BOX_RESIZER);
			el.addEventListener("mousedown", onMouseDown_startSourceBoxResize, false);

			elm.parentNode.removeChild(elm);
		}
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
	function sanitizeHtmlFromLizardElements(source) {

		let re = new RegExp("\<[^<]+\ class=\"[^\"]*" + CLS_LIZARD_ELEMENT + "[^>]+\>[^<]*\<\/[^>]+\>", "g");

		while (source.search(re) >= 0) {
			source = source.replace(re, "");
		}
		return source;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function showVersionNotice(prevVersion) {

		let fmt = "<div id='{1}' class='{0}'></div><h1 class='{0}'>Lizard Release Notes</h1>";

		// make sure all versions are numeric
		if(lzUtil.versionNumericCompare(prevVersion, "1.9") < 0) {
			fmt += "<div class='{0} noticeText'>&#x25cf; v1.9: Check out the new <b class='{0}'>Expert Mode</b> in the <span id='{2}' class='{0} noticeLink'>Options page</span>!</div>";
		}

		let noticeBox = document.createElement("div");
		noticeBox.id = ID_LIZARD_VERSION_NOTICE_BOX;
		noticeBox.className = CLS_LIZARD_ELEMENT;
		noticeBox.innerHTML = fmt.format([CLS_LIZARD_ELEMENT, ID_LIZARD_VERSION_NOTICE_BOX_CLOSE, ID_LIZARD_VER_NOTICE_19_OPTIONS_LINK]);
		document.body.appendChild(noticeBox);

		document.getElementById(ID_LIZARD_VERSION_NOTICE_BOX_CLOSE).addEventListener("click", onCloseVersionNoticeBox, false);

		let elm = document.getElementById(ID_LIZARD_VER_NOTICE_19_OPTIONS_LINK);
		if (elm) {
			elm.addEventListener("click", onLizardOptionsPage, false);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onCloseVersionNoticeBox() {

		let elm = document.getElementById(ID_LIZARD_VER_NOTICE_19_OPTIONS_LINK);

		if (elm) {
			elm.removeEventListener("click", onLizardOptionsPage, false);
		}

		elm = document.getElementById(ID_LIZARD_VERSION_NOTICE_BOX);

		if (elm) {
			elm.removeEventListener("click", onCloseVersionNoticeBox, false);
			elm.parentNode.removeChild(elm);
		}
	}

})();
