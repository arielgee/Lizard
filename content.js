"use strict";

console.log("[lizard] -- content.js --");

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
const ID_LIZARD_HTML_BOX = "lizardHtmlBox";
const ID_LIZARD_HTML_BOX_LEFT_BORDER = "lizardHtmlBoxLeftBorder";
const ID_LIZARD_HTML_BOX_PRE = "lizardHtmlBoxPre";
const ID_LIZARD_HTML_BOX_CLOSE = "lizardHtmlBoxClose";
const ID_LIZARD_HTML_BOX_COPY = "lizardHtmlBoxCopy";
const ID_LIZARD_HELP_BOX = "lizardHelpBox";

const PATH_TO_HELP_IMG = "icons/lizard-32.png";
const BOX_BORDER_WIDTH = 2;		// #lizardBoxBorder border width 2px (as in the content.css file)
const DEF_SCROLL_BAR_WIDTH = 16;

const UNDO_ACTION_HIDE = "undoHide";
const UNDO_ACTION_REMOVE = "undoRemove";
const UNDO_ACTION_COLORIZE = "undoColorize";

const BROWSER_MESSAGE = function(typeval) {
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

let g_lizardState = {
	bSelectionStarted : false,
	currentElement: null,
	bSelectionLocked: false,

	undoActions: [],
	strolledElements: [],

	scrollbarWidth: -1,
};


//////////////////////////////////////////////////////////////////////
//
browser.runtime.onMessage.addListener((request, sender, sendResponse) => {	
	if (request.action === ACTION_MSG_LIZARD_TOGGLE_STATE) {
	  if(g_lizardState.bSelectionStarted) {
		  stopSelection();
	  } else {
		  startSelection();
	  }
  }
});

//////////////////////////////////////////////////////////////////////
//
function onMouseMove(event) {

	if(g_lizardState.bSelectionLocked)
		return;

	// no narrower action if mouse is moved
	g_lizardState.strolledElements = [];
	
	removeSelectionBox();

	unselectElement();
	selectElement(document.elementFromPoint(event.clientX, event.clientY));

	createSelectionBox();
}

//////////////////////////////////////////////////////////////////////
//
function onMouseLeave(event) {

	if(g_lizardState.bSelectionLocked)
		return;

	if(event.target.nodeName.toLowerCase() === "html") {
		removeSelectionBox();
		unselectElement();
	}
}

//////////////////////////////////////////////////////////////////////
//
function onWheel(event) {

	let elm = document.elementFromPoint(event.clientX, event.clientY);

	if(elm && elm.id.startsWith(LIZARD_BOX_PREFIX) ) {

		if(event.deltaY < 0)
			wider();
		else if(event.deltaY > 0)
			narrower();

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

	if(event.preventDefaulted || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey)
		return;

	switch (event.key.toLowerCase()) {
		case "r":
			hideElement();
			break;
		case "k":
			removeElement();
			break;
		case "c":
			colorizeElement();
			break;
		case "d":
			decolorizeElement();
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
			lockSelection(!g_lizardState.bSelectionLocked);
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
		case "h":
			showHelp();
			break;
		case "escape":
			removeInfoBoxes();
			break;
//		case "t":
//			break;
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

	if(!document || !document.body) {
		alert("\tWhoops!\n\n\tSorry, this is not a valid html document.\t");
		return;
	}

	if (g_lizardState.scrollbarWidth === -1) setScrollbarWidth();

	document.addEventListener("mousemove", onMouseMove, true);
	document.addEventListener("mouseleave", onMouseLeave, true);
	document.addEventListener("wheel", onWheel, true);
	document.addEventListener("pagehide", onPageHide, true);
	document.addEventListener("visibilitychange", onVisibilityChange, false);

	document.addEventListener("click", onClick, true);
	document.addEventListener("keydown", onKeyDown, false);

	// select something
	onMouseMove({clientX: window.innerWidth / 2, clientY: window.innerHeight / 2, screenX: -1, screenY: -1, target: null});

	prefs.getHelpBoxOnStart().then((checked) => {
		if (checked) {
			showHelp();
			//setTimeout(closeHelpBox, 5000);
		}
	});

	g_lizardState.bSelectionStarted = true;
	notifyToolbarButtonStatus(g_lizardState.bSelectionStarted);
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

	g_lizardState.bSelectionStarted = false;
	notifyToolbarButtonStatus(g_lizardState.bSelectionStarted);
}

//////////////////////////////////////////////////////////////////////
//
function selectElement(elm) {
	if(elm && !(elm.className.includes(CLS_LIZARD_ELEMENT)) ) {
		g_lizardState.currentElement = elm;
	}
}

//////////////////////////////////////////////////////////////////////
//
function unselectElement() {
	g_lizardState.currentElement = null;
}

//////////////////////////////////////////////////////////////////////
//
function createSelectionBox() {

	if(!g_lizardState.currentElement)
		return;

	let box;
	let boxBorder;
	let boxLabelTag;

	box = document.getElementById(ID_LIZARD_BOX);

	if(!box) {

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

	const vpRect = getElementViewportRect(g_lizardState.currentElement, innerWidth, innerHeight);

	box.style.left = vpRect.left + "px";
	box.style.top = vpRect.top + "px";
	boxBorder.style.width = (vpRect.width <= BOX_BORDER_WIDTH ? 0 : vpRect.width) + "px";
	boxBorder.style.height = (vpRect.height <= BOX_BORDER_WIDTH ? 0 : vpRect.height) + "px";

	/*console.log("[lizard]", "Node: ", g_lizardState.currentElement.nodeName,
		"\ninnerWidth/Height", innerWidth, "/", innerHeight,
		"\nrect: ", g_lizardState.currentElement.getBoundingClientRect(),
		"\nvpRect: ", vpRect,
		"\nboxRect: ", boxBorder.getBoundingClientRect(),
		"\n----------------");*/

	// label content
	boxLabelTag.innerHTML = getLabelContent(g_lizardState.currentElement);

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

	if (isFloater)
		boxLabelTag.className += " floater";
}

//////////////////////////////////////////////////////////////////////
//
function getElementViewportRect(elm, innerWidth, innerHeight) {

	let vpRect = { left: 0, top: 0, width: 0, height: 0 };

	const rect = elm.getBoundingClientRect();

	vpRect.left = parseInt(rect.left < 0 ? 0 : Math.min(rect.left, innerWidth));
	vpRect.top = parseInt(rect.top < 0 ? 0 : Math.min(rect.top, innerHeight));

	vpRect.width = parseInt(rect.right <= 0 ? 0 : (rect.left < 0 ? rect.right : Math.min(rect.width, Math.max(innerWidth - rect.left, 0))));
	vpRect.height = parseInt(rect.bottom <= 0 ? 0 : (rect.top < 0 ? rect.bottom : Math.min(rect.height, Math.max(innerHeight - rect.top, 0))));
	
	// private cases where the element (usualy html & body) is large as the innerSpace and its starting point is negative (scrolled)
	if (rect.left < 0 && (rect.right + Math.abs(rect.left) === innerWidth) )
		vpRect.width = innerWidth;

	if (rect.top < 0 && (rect.bottom + Math.abs(rect.top) === innerHeight) )
		vpRect.height = innerHeight;

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
	return (document.body.scrollWidth > window.innerWidth ? g_lizardState.scrollbarWidth : 0);
}

//////////////////////////////////////////////////////////////////////
//
function getVScrollWidth() {
	return (document.body.scrollHeight > window.innerHeight ? g_lizardState.scrollbarWidth : 0);
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
	if(g_lizardState.bSelectionLocked) {
		removeSelectionBox();
		createSelectionBox();
	}
}

//////////////////////////////////////////////////////////////////////
//
function hideElement() {

	let elm = g_lizardState.currentElement;

	if (!elm || elm === null || elm.nodeName.toLowerCase() === "html")
		return;

	let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_HIDE);

	ua.data["element"] = elm;
	ua.data["prev_visibility"] = elm.style.visibility;

	g_lizardState.undoActions.push(ua);

	elm.style.visibility = "hidden";

	removeSelectionBox();
	unselectElement();

	lockSelection(false);
}

//////////////////////////////////////////////////////////////////////
//
function removeElement() {

	let elm = g_lizardState.currentElement;

	if (!elm || elm === null || elm.nodeName.toLowerCase() === "html")
		return;


	let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_REMOVE);

	// save element and it's position
	ua.data["element"] = elm;
	ua.data["prev_parentNode"] = elm.parentNode;
	ua.data["prev_nextSibling"]= elm.nextSibling;

	g_lizardState.undoActions.push(ua);

	elm.parentNode.removeChild(elm);

	removeSelectionBox();
	unselectElement();

	lockSelection(false);
}


//////////////////////////////////////////////////////////////////////
//
function colorizeElement() {
	
	prefs.getColorizeColors().then((colors) => { colorElement(colors[0], colors[1]); });
}

//////////////////////////////////////////////////////////////////////
//
function decolorizeElement() {

	prefs.getDecolorizeColors().then((colors) => { colorElement(colors[0], colors[1]); });
}

//////////////////////////////////////////////////////////////////////
//
function colorElement(foreground, background) {

	let elm = g_lizardState.currentElement;

	if (!elm)
		return;

	let ua = UNDO_LIZARD_ACTION(UNDO_ACTION_COLORIZE);

	ua.data["element"] = elm;
	ua.data["prev_color"]= elm.style.color;
	ua.data["prev_backgroundColor"]= elm.style.backgroundColor;

	g_lizardState.undoActions.push(ua);

	elm.style.color = foreground;
	elm.style.backgroundColor = background;
}

//////////////////////////////////////////////////////////////////////
//
function undoLastAction() {

	// nothing to undo
	if (0 === g_lizardState.undoActions.length)
		return;

	// pop the last undo action
	let ua = g_lizardState.undoActions.pop();

	switch(ua.type) {
		case UNDO_ACTION_HIDE:
			ua.data.element.style.visibility = ua.data.prev_visibility;
			break;
			//////////////////////////////////////////////////////////////

		case UNDO_ACTION_REMOVE:
			ua.data.prev_parentNode.insertBefore(ua.data.element, ua.data.prev_nextSibling);
			break;
			//////////////////////////////////////////////////////////////

		case UNDO_ACTION_COLORIZE:
			ua.data.element.style.color = ua.data.prev_color;
			ua.data.element.style.backgroundColor = ua.data.prev_backgroundColor;
			break;
			//////////////////////////////////////////////////////////////

		default:
			console.log("[lizard]", "Unknown undo type. This is not right.", ua.type, ua.data);
			break;
			//////////////////////////////////////////////////////////////
	}
}

//////////////////////////////////////////////////////////////////////
//
function wider() {

	let elm = g_lizardState.currentElement;
	
	if (elm && elm.parentElement) {
		
		g_lizardState.strolledElements.push(elm);
		
		removeSelectionBox();
		unselectElement();
		selectElement(elm.parentElement);
		createSelectionBox();
	}
}

//////////////////////////////////////////////////////////////////////
//
function narrower() {

	if(g_lizardState.strolledElements.length > 0) {
		removeSelectionBox();
		unselectElement();
		selectElement(g_lizardState.strolledElements.pop());
		createSelectionBox();
	}
}

//////////////////////////////////////////////////////////////////////
//
function lockSelection(bLock) {

	g_lizardState.bSelectionLocked = bLock;

	if(g_lizardState.bSelectionLocked) {
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

	let elm = g_lizardState.currentElement;

	if(!elm)
		return;

	for(let i=0; i<5; i++) {
		setTimeout(function(){ elm.style.visibility = "hidden"; }, i*400);
		setTimeout(function(){ elm.style.visibility = "visible"; }, i*400+200);
	}
}

//////////////////////////////////////////////////////////////////////
//
function viewSource() {

	let elm = g_lizardState.currentElement;

	if (!elm)
		return;

	let htmlData = elm.outerHTML;
	let htm;
	let htmLeftBorder;
	let htmPre;
	let btnClose;
	let btnCopy;

	htm = document.getElementById(ID_LIZARD_HTML_BOX);

	if (!htm) {

		htm = document.createElement("div");
		htm.id = ID_LIZARD_HTML_BOX;
		htm.className = CLS_LIZARD_ELEMENT;

		htmLeftBorder = document.createElement("div");
		htmLeftBorder.id = ID_LIZARD_HTML_BOX_LEFT_BORDER;
		htmLeftBorder.className = CLS_LIZARD_ELEMENT;

		htmPre = document.createElement("pre");
		htmPre.id = ID_LIZARD_HTML_BOX_PRE;
		htmPre.className = CLS_LIZARD_ELEMENT;

		btnClose = document.createElement("div");
		btnClose.id = ID_LIZARD_HTML_BOX_CLOSE;
		btnClose.className = CLS_LIZARD_ELEMENT;
		btnClose.textContent = "❌";					// Dingbat - CROSS MARK / String.fromCharCode(10060);	
		btnClose.title = "Close";

		btnCopy = document.createElement("div");
		btnCopy.id = ID_LIZARD_HTML_BOX_COPY;
		btnCopy.className = CLS_LIZARD_ELEMENT;
		btnCopy.textContent = "⧉";					// Dingbat - boxbox / String.fromCharCode(10697)
		btnCopy.title = "Copy to clipboard";

		htmLeftBorder.appendChild(btnClose);
		htmLeftBorder.appendChild(btnCopy);

		htm.appendChild(htmLeftBorder);
		htm.appendChild(htmPre);

		document.body.appendChild(htm);
	} else {
		// querySelector is slower but i'm looking just in the ID_LIZARD_HTML_BOX's element
		htmPre = htm.querySelector("#" + ID_LIZARD_HTML_BOX_PRE);
		btnClose = htm.querySelector("#" + ID_LIZARD_HTML_BOX_CLOSE);
		btnCopy = htm.querySelector("#" + ID_LIZARD_HTML_BOX_COPY);
	}

	htmPre.textContent = htmlData;

	let point = getHtmlBoxPosition(htm, g_lizardState.currentElement.getBoundingClientRect());

	htm.style.left = point.left + "px";
	htm.style.top = point.top + "px";

	btnClose.addEventListener("click", closeHtmlBox, false);
	btnCopy.addEventListener("click", onClickHtmlCopy, false);

	htmPre.focus();
}

//////////////////////////////////////////////////////////////////////
//
function getHtmlBoxPosition(elm, rectReference) {
	
	const EXTRA = 25;
	let point = { left: 0, top: 0 };
	
	point.left = rectReference.left + EXTRA;
	point.top = rectReference.top + EXTRA;

	if (point.left + elm.offsetWidth > window.innerWidth)
		point.left = window.innerWidth - elm.offsetWidth - EXTRA;

	if (point.left < EXTRA)
		point.left = EXTRA;

	if (point.top + elm.offsetHeight > window.innerHeight)
		point.top = window.innerHeight - elm.offsetHeight - EXTRA;

	if (point.top < EXTRA)
		point.top = EXTRA;

	return point;
}

//////////////////////////////////////////////////////////////////////
//
function onClickHtmlCopy(event) {

	let htmPre = document.getElementById(ID_LIZARD_HTML_BOX_PRE);

	if (htmPre) {
		
		console.log("sell", htmPre.getSelection());
		let rng = document.createRange();

		rng.selectNodeContents(htmPre);
		let sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(rng);

		document.execCommand("copy");

		sel.removeAllRanges();
	}
}

//////////////////////////////////////////////////////////////////////
//
function showHelp() {

	let colGetting = prefs.getColorizeColors();
	let decolGetting = prefs.getDecolorizeColors();

	colGetting.then((colors) => {
		let colorize = colors;

		decolGetting.then((colors) => {
			let decolorize = colors;

			_showHelp(colorize, decolorize);
		});
	});
}

//////////////////////////////////////////////////////////////////////
//
function _showHelp(colorizeColors, decolorizeColors) {

	let hlp = document.getElementById(ID_LIZARD_HELP_BOX);

	if(!hlp) {

		hlp = document.createElement("div");
		hlp.id = ID_LIZARD_HELP_BOX;
		hlp.className = CLS_LIZARD_ELEMENT;
		document.body.appendChild(hlp);

		hlp.style.top = "20px";
		hlp.style.left = "15px";
	}
	
	const htmlFmt = "<p class='{0} {1}'>Lizard Hotkeys<img class='{0} {4}' src={5}></img></p>" +
					"<div class='{0} {1}'><span class='{0} {2}'>R</span><span class='{0} {3}'>Remove selection (or: shift+click)</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>K</span><span class='{0} {3}'>Kill selection (collapses element)</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>C</span><span class='{0} {3}'>" +
						"Colorize selection (<span class='{0} {6}' style='background-color:{7} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{8} !important;'>&emsp;</span>)</span>" +
					"</div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>D</span><span class='{0} {3}'>" +
						"Decolorize selection (<span class='{0} {6}' style='background-color:{9} !important;'>&emsp;</span> on <span class='{0} {6}' style='background-color:{10} !important;'>&emsp;</span>)</span>" +
					"</div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>U</span><span class='{0} {3}'>Undo</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>W</span><span class='{0} {3}'>Wider selection (or: mouse wheel up)</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>N</span><span class='{0} {3}'>Narrower selection (or: mouse wheel down)</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>L</span><span class='{0} {3}'>Lock/Unlock selection</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>B</span><span class='{0} {3}'>Blink selection</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>V</span><span class='{0} {3}'>View source</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>Q</span><span class='{0} {3}'>Quit</span></div>" +
					"<div class='{0} {1}'><span class='{0} {2}'>H</span><span class='{0} {3}'>Show help</span></div>";

	hlp.innerHTML = htmlFmt.format([CLS_LIZARD_ELEMENT, CLS_HELP_RECORD, CLS_LETTER_KEY,
									CLS_HELP_TEXT, CLS_HELP_IMG, browser.extension.getURL(PATH_TO_HELP_IMG), CLS_HELP_COLOR,
									colorizeColors[0], colorizeColors[1], decolorizeColors[0], decolorizeColors[1]]);

	const CLS_justShowedUp = "justShowedUp";

	if (!hlp.className.includes(CLS_justShowedUp)) {
		hlp.className += ` ${CLS_justShowedUp}`;
	}

	setTimeout(() => {
		hlp.style.setProperty("transition", "opacity 2s", "important");
		hlp.className = hlp.className.replace(` ${CLS_justShowedUp}`, "");
		setTimeout(() => { hlp.style.setProperty("transition", "opacity 0s", "important"); }, 2100);
	}, 3000);

	hlp.addEventListener("click", closeHelpBox, false);
}

//////////////////////////////////////////////////////////////////////
//
function removeInfoBoxes() {
	closeHtmlBox();
	closeHelpBox();
}

//////////////////////////////////////////////////////////////////////
//
function closeHtmlBox() {
	
	let elm = document.getElementById(ID_LIZARD_HTML_BOX);

	if (elm) {
		let btn = document.getElementById(ID_LIZARD_HTML_BOX_CLOSE);
		btn.removeEventListener("click", closeHtmlBox, false);

		btn = document.getElementById(ID_LIZARD_HTML_BOX_COPY);
		btn.removeEventListener("click", onClickHtmlCopy, false);

		elm.parentNode.removeChild(elm);
	}
}

//////////////////////////////////////////////////////////////////////
//
function closeHelpBox() {

	let elm = document.getElementById(ID_LIZARD_HELP_BOX);

	if (elm) {
		elm.removeEventListener("click", closeHelpBox, false);
		elm.parentNode.removeChild(elm);
	}
}

//////////////////////////////////////////////////////////////////////
//
function notifyToolbarButtonStatus(bStatus) {

	let msg = BROWSER_MESSAGE(MSG_LIZARD_STATE_CHANGED);
	msg.data["status"] = (bStatus ? "on" : "off");

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
	return str.replace(String.prototype.format.regex, function(item) {
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

	g_lizardState.scrollbarWidth = DEF_SCROLL_BAR_WIDTH;

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

	g_lizardState.scrollbarWidth = w1 - w2;
}

//////////////////////////////////////////////////////////////////////
//
function addListenersToAllFrames(wnd, evt, handler) {
	for (var i = 0; i < wnd.frames.length; i++)
		addListenersToAllFrames(wnd.frames[i], handler);
	wnd.addEventListener(evt, handler, false);
}

//////////////////////////////////////////////////////////////////////
//
function removeListenersFromAllFrames(wnd, evt, handler) {
	for (var i = 0; i < wnd.frames.length; i++)
		removeListenersFromAllFrames(wnd.frames[i], handler);
	wnd.removeEventListener(evt, handler, false);
}
