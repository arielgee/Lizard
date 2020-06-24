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

