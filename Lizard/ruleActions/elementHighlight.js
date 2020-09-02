"use strict";

let elementHighlight = (function () {

	let m_cssSelector = null;
	let m_elmDocBody = null;
	let m_elmHighlighted = null;
	let m_styleElementOverlay = null;

	//////////////////////////////////////////////////////////////////////
	function initialize(cssSelectorEncoded) {

		m_cssSelector = decodeURIComponent(cssSelectorEncoded);

		document.addEventListener("DOMContentLoaded", _onDOMContentLoaded);
		window.addEventListener("unload", _onUnload);
	}

	//////////////////////////////////////////////////////////////////////
	//////////// I N T E R N A L S ///////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	function _onDOMContentLoaded() {

		m_elmHighlighted = document.querySelector(m_cssSelector);

		if(!!m_elmHighlighted) {

			m_elmDocBody = document.body;

			window.addEventListener("resize", _onWindowResize, false);
			document.addEventListener("visibilitychange", _onVisibilityChange, false);

			_createOverlay();
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _onUnload() {
		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("unload", onUnload);

		if(!!m_elmHighlighted) {
			window.removeEventListener("resize", _onWindowResize, false);
			document.removeEventListener("visibilitychange", _onVisibilityChange, false);
		}
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

		m_elmDocBody.style.position = "relative";
		m_elmDocBody.appendChild(elmOverlay);

		setTimeout(_setOverlayBorders, 5);
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
		initialize: initialize,
	}
})();
