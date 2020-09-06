"use strict";

let elementHighlight = (function () {

	let m_elmHtml = null;
	let m_elmHighlighted = null;
	let m_styleElementOverlay = null;

	let m_observerSizeChange = null;

	//////////////////////////////////////////////////////////////////////
	function highlight(cssSelectorEncoded) {

		let cssSelector = decodeURIComponent(cssSelectorEncoded);

		document.body["highlightOverlay"] = true;

		m_elmHighlighted = document.querySelector(cssSelector);

		if(!!m_elmHighlighted) {

			m_elmHtml = document.documentElement;

			window.addEventListener("unload", _onUnload);
			window.addEventListener("load", _onDimensionsChange, false);
			window.addEventListener("resize", _onDimensionsChange, false);
			document.addEventListener("visibilitychange", _onDimensionsChange, false);

			m_observerSizeChange = new MutationObserver(_onDimensionsChange);
			m_observerSizeChange.observe(document.body, { subtree: true, childList: true });

			_createOverlay();

		} else {
			_createNotFoundOverlay();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//////////// I N T E R N A L S ///////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	function _onUnload() {

		m_observerSizeChange.takeRecords();
		m_observerSizeChange.disconnect();
		m_observerSizeChange = null;

		window.removeEventListener("unload", _onUnload);
		window.removeEventListener("load", _onDimensionsChange, false);
		window.removeEventListener("resize", _onDimensionsChange, false);
		document.removeEventListener("visibilitychange", _onDimensionsChange, false);
	}

	//////////////////////////////////////////////////////////////////////
	function _onDimensionsChange() {
		if(!document.hidden) {
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
		m_styleElementOverlay.zIndex = "2147483641";
		m_styleElementOverlay.pointerEvents = "none";
		m_styleElementOverlay.boxSizing = "border-box";
		m_styleElementOverlay.borderColor = "rgba(0, 0, 0, 0.85)";
		m_styleElementOverlay.borderStyle = "solid";

		m_styleElementOverlay.backgroundColor = "rgba(255, 0, 0, 0.10)";

		m_elmHtml.style.position = "relative";
		m_elmHtml.appendChild(elmOverlay);

		_setOverlayBorders();
	}

	//////////////////////////////////////////////////////////////////////
	function _setOverlayBorders() {

		const elmRect = m_elmHighlighted.getBoundingClientRect();
		const topPagePosition = window.pageYOffset + elmRect.top;
		const leftPagePosition = window.pageXOffset + elmRect.left;

		m_styleElementOverlay.width = m_elmHtml.scrollWidth + "px";
		m_styleElementOverlay.height = m_elmHtml.scrollHeight + "px";

		m_styleElementOverlay.borderTopWidth = topPagePosition + "px";
		m_styleElementOverlay.borderRightWidth = (m_elmHtml.scrollWidth - (leftPagePosition + elmRect.width)) + "px";
		m_styleElementOverlay.borderBottomWidth = (m_elmHtml.scrollHeight - (topPagePosition + elmRect.height)) + "px";
		m_styleElementOverlay.borderLeftWidth = leftPagePosition + "px";
	}

	//////////////////////////////////////////////////////////////////////
	function _createNotFoundOverlay() {

		window.customElements.define("not-found-overlay", class extends HTMLElement {} );
		let elmOverlay = document.createElement("not-found-overlay");
		let styleOverlay = elmOverlay.style;

		styleOverlay.all = "initial";
		styleOverlay.position = "fixed"
		styleOverlay.top = "0";
		styleOverlay.left = "0";
		styleOverlay.minWidth = "100%";
		styleOverlay.minHeight = "100%";
		styleOverlay.zIndex = "2147483641";
		styleOverlay.pointerEvents = "none";
		styleOverlay.backgroundColor = "rgba(0, 0, 0, 0.85)";
		styleOverlay.color = "white";
		styleOverlay.fontFamily = "Tahoma, Verdana, Segoe, sans-serif";
		styleOverlay.fontSize = "7vw";
		styleOverlay.lineHeight = "4";
		styleOverlay.textAlign = "center";

		elmOverlay.textContent = "😕 Element not found.";

		document.documentElement.appendChild(elmOverlay);
	}

	/********************************************************************/
	return {
		highlight: highlight,
	}
})();
