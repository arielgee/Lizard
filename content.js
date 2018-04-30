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


	const PATH_TO_HELP_IMG = "icons/lizard-32.png";
	const BOX_BORDER_WIDTH = 2;		// #lizardBoxBorder border width 2px (as in the content.css file)
	const DEF_SCROLL_BAR_WIDTH = 16;	
	const MANDATORY_ROOT_ELEMENTS = ["HTML", "BODY"];

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
		bSessionStarted: false,
		currentElement: null,
		bSelectionLocked: false,
		bSelectionSuspended: false,
		undoActions: [],
		strolledElements: [],
		scrollbarWidth: -1,
	};


	//////////////////////////////////////////////////////////////////////
	//
	browser.runtime.onMessage.addListener((request, sender, sendResponse) => {

		// accept messages from background only when all scripts are injected
		if (ALL_LIZARD_SCRIPTS_INJECTED === undefined || ALL_LIZARD_SCRIPTS_INJECTED !== true) {
			return;
		}

		switch (request.message) {

			case msgs.MSG_TOGGLE_SESSION_STATE:
				sendResponse({ message: "toggle" });
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
				sendResponse({ message: "shutdown" });
				break;
				//////////////////////////////////////////////////////////////

		}
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
		selectElement(document.elementFromPoint(event.clientX, event.clientY));

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
			default:
				//lzUtil.log("Unused key:" + event.key);
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

		prefs.getWheelToWiderNarrower().then((checked) => {
			if(checked) {
				document.addEventListener("wheel", onWheel, true);
			}
		});
		
		document.addEventListener("click", onClick, true);
		document.addEventListener("keydown", onKeyDown, false);

		// select something
		onMouseMove({ clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, screenX: -1, screenY: -1, target: null });

		prefs.getHelpBoxOnStart().then((checked) => {
			if (checked) {
				showHelp();
			}
		});
		
		lizardState.bSessionStarted = true;
		notifyToolbarButtonStatus(lizardState.bSessionStarted);
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

		document.removeEventListener("wheel", onWheel, true);
		
		document.removeEventListener("click", onClick, true);
		document.removeEventListener("keydown", onKeyDown, false);

		lizardState.bSessionStarted = false;
		notifyToolbarButtonStatus(lizardState.bSessionStarted);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function selectElement(elm) {
		// check type of className. <SVG> elements are evil.
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
			displayNotification("No element is selected.");
			return;
		}		
		
		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName) !== -1) {
			displayNotification("The element '<" + elm.nodeName + ">' can't be hidden.");
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
		
		if (MANDATORY_ROOT_ELEMENTS.indexOf(elm.nodeName) !== -1) {
			displayNotification("The element '<" + elm.nodeName + ">' can't be removed.");
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

			let css = lzUtil.getElementComputedCssText(elm, false);

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
			displayNotification("No element is selected.");
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
				source = lzUtil.getElementComputedCssText(elm, true);
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
			displayNotification("No element is selected.");
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
			"<div class='{0} {1}'><span class='{0} {2}'>S</span><span class='{0} {3}'>CSS Selector</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>Q</span><span class='{0} {3}'>Quit</span></div>" +
			"<div class='{0} {1}'><span class='{0} {2}'>F1</span><span class='{0} {3}'>Show help</span></div>" +
			"<div class='{0} {12}'><span id='{13}' class='{0} {14}'>Options page</span></div>";

		hlp.innerHTML = fmt.format([CLS_LIZARD_ELEMENT, CLS_HELP_RECORD, CLS_LETTER_KEY,
									CLS_HELP_TEXT, CLS_HELP_IMG, browser.extension.getURL(PATH_TO_HELP_IMG), CLS_HELP_COLOR,
									colorizeColors[0], colorizeColors[1], decolorizeColors[0], decolorizeColors[1], srcType,
									CLS_HELP_FOOTER, ID_LIZARD_HELP_FOOTER_LINK, CLS_HELP_FOOTER_LINK]);

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

})();
