// JavaScript source code

//////////////////////////////////////////////////////////////////////
//
function beautifyHtml(doc, node, level) {

	let indentBefore = new Array(level++ + 1).join("..");
	let indentAfter = new Array(level - 1).join("..");
	let textNode;

	for (let i = 0; i < node.children.length; i++) {

		textNode = doc.createTextNode("\n" + indentBefore);
		node.insertBefore(textNode, node.children[i]);

		beautifyHtml(doc, node.children[i], level);

		if (node.lastElementChild == node.children[i]) {
			textNode = doc.createTextNode("\n" + indentAfter);
			node.appendChild(textNode);
		}
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

const INDICATION_DIV_ID = "lizardAlterationIndication";
const INDICATION_COLOR = "#ffc0c0";

//////////////////////////////////////////////////////////////////////
function insertIndication() {

	//This fucks up the detection of the first image in example.html

	let elmLAI = document.getElementById(INDICATION_DIV_ID);

	// Exit if exist
	if(!!elmLAI) return;

	elmLAI = document.createElement("div");
	let elmInner = document.createElement("div");
	let elmImg = document.createElement("img");

	elmLAI.className = CLS_LIZARD_ELEMENT;
	elmInner.className = CLS_LIZARD_ELEMENT;
	elmImg.className = CLS_LIZARD_ELEMENT;

	elmLAI.id = INDICATION_DIV_ID;
	elmLAI.title = "Lizard Alterations";
	elmImg.src = browser.extension.getURL("../icons/lizard-32.png");

	let styleLAI = elmLAI.style;
	styleLAI.all = "initial";
	styleLAI.position = "fixed";
	styleLAI.top = "0";
	styleLAI.right = "0";
	styleLAI.left = "0";
	styleLAI.lineHeight = "0";
	styleLAI.border = `0 solid ${INDICATION_COLOR}`;
	styleLAI.borderTopWidth = "3px";
	styleLAI.zIndex = "999999";

	let styleInner = elmInner.style;
	styleInner.all = "initial";
	styleInner.position = "absolute";
	styleInner.top = "0";
	styleInner.right = "0";
	styleInner.lineHeight = "normal";
	styleInner.backgroundColor = INDICATION_COLOR;
	styleInner.borderBottomLeftRadius = "4px";

	let styleImg = elmImg.style;
	styleImg.all = "initial";
	styleImg.margin = "0 5px 2px 5px";
	styleImg.width = "18px";
	styleImg.height = "18px";

	elmInner.appendChild(elmImg);
	elmLAI.appendChild(elmInner);
	document.documentElement.appendChild(elmLAI, document.body);
}
