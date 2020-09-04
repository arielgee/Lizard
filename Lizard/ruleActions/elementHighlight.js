"use strict";

let elementHighlight = (function () {

	let m_elmHtml = null;
	let m_elmHighlighted = null;
	let m_styleElementOverlay = null;

	//////////////////////////////////////////////////////////////////////
	function highlight(cssSelectorEncoded) {

		let cssSelector = decodeURIComponent(cssSelectorEncoded);

		m_elmHighlighted = document.querySelector(cssSelector);

		if(!!m_elmHighlighted) {

			m_elmHtml = document.documentElement;

			window.addEventListener("unload", _onUnload);
			window.addEventListener("resize", _onWindowResize, false);
			document.addEventListener("visibilitychange", _onVisibilityChange, false);

			_createOverlay();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//////////// I N T E R N A L S ///////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	function _onUnload() {
		window.removeEventListener("unload", _onUnload);
		window.removeEventListener("resize", _onWindowResize, false);
		document.removeEventListener("visibilitychange", _onVisibilityChange, false);
	}

	//////////////////////////////////////////////////////////////////////
	function _onWindowResize() {
		_setOverlayBorders();
	}

	//////////////////////////////////////////////////////////////////////
	function _onVisibilityChange() {
		if(document.hidden === false) {
			_setOverlayBorders();
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _createOverlay() {

		m_elmHighlighted.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });

		window.customElements.define("highlight-overlay", class extends HTMLElement {} );
		let elmOverlay = document.createElement("highlight-overlay");
		m_styleElementOverlay = elmOverlay.style;

		m_styleElementOverlay.all = "initial";
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

		m_styleElementOverlay.backgroundColor = "rgba(255, 0, 0, 0.10)";

		m_elmHtml.style.position = "relative";
		m_elmHtml.appendChild(elmOverlay);

		setTimeout(_setOverlayBorders, 5);
	}

	//////////////////////////////////////////////////////////////////////
	function _setOverlayBorders() {

		const elmRect = m_elmHighlighted.getBoundingClientRect();
		const topPagePosition = window.pageYOffset + elmRect.top;
		const leftPagePosition = window.pageXOffset + elmRect.left;

		m_styleElementOverlay.borderTopWidth = topPagePosition + "px";
		m_styleElementOverlay.borderRightWidth = (m_elmHtml.offsetWidth - (leftPagePosition + elmRect.width)) + "px";
		m_styleElementOverlay.borderBottomWidth = (m_elmHtml.offsetHeight - (topPagePosition + elmRect.height)) + "px";
		m_styleElementOverlay.borderLeftWidth = leftPagePosition + "px";
	}

	/********************************************************************/
	return {
		highlight: highlight,
	}
})();
