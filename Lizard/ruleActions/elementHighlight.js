"use strict";

let elementHighlight = (function () {

	let m_elmHighlighted = null;
	let m_styleElementOverlay = null;
	let m_elmDocBody = null;

	//////////////////////////////////////////////////////////////////////
	function highlight(cssSelectorEncoded) {

		const cssSelector = decodeURIComponent(cssSelectorEncoded);

		m_elmHighlighted = document.querySelector(cssSelector);

		if(!!m_elmHighlighted) {

			_initialization();

			m_elmHighlighted.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

			let elmOverlay = document.createElement("div");
			m_styleElementOverlay = elmOverlay.style;

			m_styleElementOverlay.position = "absolute"
			m_styleElementOverlay.top = "0";
			m_styleElementOverlay.left = "0";
			m_styleElementOverlay.right = "0";
			m_styleElementOverlay.bottom = "0";
			m_styleElementOverlay.zIndex = "2147483641";
			m_styleElementOverlay.pointerEvents = "none";
			m_styleElementOverlay.boxSizing = "border-box";
			m_styleElementOverlay.borderColor = "rgba(0, 0, 0, 0.85)";
			m_styleElementOverlay.borderStyle = "solid";

			_setOverlayBorders();

			m_elmDocBody.style.position = "relative";
			m_elmDocBody.appendChild(elmOverlay);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//////////// I N T E R N A L S ///////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	function _initialization() {
		m_elmDocBody = document.body;
		window.addEventListener("resize", _onWindowResize, false);
	}

	//////////////////////////////////////////////////////////////////////
	function _onWindowResize() {
		_setOverlayBorders();
	}

	//////////////////////////////////////////////////////////////////////
	function _setOverlayBorders() {

		const elmRect = m_elmHighlighted.getBoundingClientRect();
		const topPagePosition = window.pageYOffset + elmRect.top;

		m_styleElementOverlay.borderTopWidth = topPagePosition + "px";
		m_styleElementOverlay.borderRightWidth = (m_elmDocBody.clientWidth - elmRect.right) + "px";
		m_styleElementOverlay.borderBottomWidth = (m_elmDocBody.clientHeight - (topPagePosition + elmRect.height)) + "px";
		m_styleElementOverlay.borderLeftWidth = (window.pageXOffset + elmRect.left) + "px";
	}

	/********************************************************************/
	return {
		highlight: highlight,
	}
})();
