	//////////////////////////////////////////////////////////////////////
	//
	function deWidthify() {

		let elm = lizardState.currentElement;

		if (!elm || elm === null) {
			displayNotification("Colorize/Decolorize: No element is selected.");
			return;
		}

		_deWidthify(elm);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function _deWidthify(elm) {

		elm.style.width = "auto";
		if(elm.width) {
			console.log("[Lizard]", "elm.width=", elm.width);
			elm.width = null;
		}

		for(let i=0; i<elm.children.length; i++) {

			let c = elm.children[i];

			// check type of className. <SVG> elements are evil.
			//if(c.nodeType === Node.ELEMENT_NODE && ((typeof c.className !== "string") || !(c.className.includes(CLS_LIZARD_ELEMENT)))) {
			_deWidthify(c);
		}
	}
