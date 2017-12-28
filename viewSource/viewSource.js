"use strict";

(function () {

	const IS_POPUP_WINDOW = !(window.locationbar.visible);
	const SCROLL_Y_OFFSET = 70;
	const MAX_OFFSET_MULTIPLIER = 40;

	let elmScrollUp;
	let elmScrollDown;
	let scrollerTimeoutId = -1;

	document.addEventListener("DOMContentLoaded", onDOMContentLoaded);
	window.addEventListener("beforeunload", onBeforeUnload);

	//////////////////////////////////////////////////////////////////////
	//
	function onDOMContentLoaded() {

		let dataId = getQueryVariable("id");
		let elmSourceBoxPre = document.getElementById("lizardSourceBoxPre");

		elmScrollUp = document.getElementById("btnScrollUp");
		elmScrollDown = document.getElementById("btnScrollDown");


		/////////////////////////////////////////////////////////////////////////
		// is popup window or tab window
		if (IS_POPUP_WINDOW) {

			// POPUP window
			document.addEventListener("keydown", onKeyDown, false);

			elmScrollUp.addEventListener("mousedown", onMouseDownScrollButton);
			elmScrollUp.addEventListener("mouseup", onMouseUpScrollButton);
			elmScrollUp.addEventListener("mouseleave", onMouseLeaveScrollButton);

			elmScrollDown.addEventListener("mousedown", onMouseDownScrollButton);
			elmScrollDown.addEventListener("mouseup", onMouseUpScrollButton);
			elmScrollDown.addEventListener("mouseleave", onMouseLeaveScrollButton);

			document.addEventListener("wheel", onWheel);

		} else {

			// TAB window
			elmScrollUp.style.display = elmScrollDown.style.display = "none";
		}

		sourceData.getSavedViewSourceData(dataId).then((result) => {
			document.title = "View " + result.type + " Source - Lizard";

			if (result.data) {
				elmSourceBoxPre.textContent = result.data;
			} else {
				showEnlargedLabel();
			}
			sourceData.clearSavedViewSourceData(dataId);
		});
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onBeforeUnload(event) {

		if (IS_POPUP_WINDOW) {
			document.removeEventListener("keydown", onKeyDown, false);

			elmScrollUp.removeEventListener("mousedown", onMouseDownScrollButton);
			elmScrollUp.removeEventListener("mouseup", onMouseUpScrollButton);
			elmScrollUp.removeEventListener("mouseleave", onMouseLeaveScrollButton);

			elmScrollDown.removeEventListener("mousedown", onMouseDownScrollButton);
			elmScrollDown.removeEventListener("mouseup", onMouseUpScrollButton);
			elmScrollDown.removeEventListener("mouseleave", onMouseLeaveScrollButton);

			document.removeEventListener("wheel", onWheel);
		}

		document.removeEventListener("DOMContentLoaded", onDOMContentLoaded);
		window.removeEventListener("beforeunload", onBeforeUnload);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onKeyDown(event) {
		if (event.key.toLowerCase() === "escape") {
			window.close();
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseDownScrollButton(event) {

		// This function can be called from btnScrollUp/btnScrollDown (via EventListener -> mousedown) or from onWheel.
		// In both cases the target.id string will end with "ScrollUp" or "ScrollDown".
		// When called from btnScrollUp/btnScrollDown it will start with "btn".
		// When called from onWheel it will start with "wheel".
		let offsetY = (event.target.id.match("ScrollUp$") ? -SCROLL_Y_OFFSET : SCROLL_Y_OFFSET);

		// don't scroll if there is nowhere to scroll
		if (!canDocumentScroll(offsetY < 0 ? "up" : "down")) {
			return;
		}

		window.scrollBy({
			top: offsetY,
			left: 0,
			behavior: 'smooth',
		});

		// continuous scroll is done only from btnScrollUp/btnScrollDown (via EventListener -> mousedown)
		if (event.target.id.match("^btnScroll")) {
			scrollerTimeoutId = setTimeout(continuousScroll, 500, offsetY, 1);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseUpScrollButton(event) {
		clearTimeout(scrollerTimeoutId);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onMouseLeaveScrollButton(event) {
		clearTimeout(scrollerTimeoutId);
	}

	//////////////////////////////////////////////////////////////////////
	//
	function continuousScroll(offsetY, offsetMultiplier) {

		// don't scroll if there is nowhere to scroll
		if (canDocumentScroll(offsetY < 0 ? "up" : "down")) {

			window.scrollBy({
				top: (offsetY * (offsetMultiplier <= MAX_OFFSET_MULTIPLIER ? offsetMultiplier : MAX_OFFSET_MULTIPLIER)),
				left: 0,
				behavior: 'smooth',
			});
			scrollerTimeoutId = setTimeout(continuousScroll, 150, offsetY, offsetMultiplier + 1);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//
	function onWheel(event) {

		if (event.deltaY < 0) {
			onMouseDownScrollButton({ target: { id: "WheelScrollUp" } });
		} else if (event.deltaY > 0) {
			onMouseDownScrollButton({ target: { id: "WheelScrollDown" } });
		}

		event.preventDefault();
	}

	//////////////////////////////////////////////////////////////////////
	//
	function showEnlargedLabel() {

		const CLS_enlarged = " enlarged";

		document.getElementById("labelInfo").className += CLS_enlarged;
		document.getElementById("imgExclamation").className += CLS_enlarged;
	}

	//////////////////////////////////////////////////////////////////////
	//
	function getQueryVariable(name) {
		let sval = window.location.search.match("[\?\&]" + name + "=([^\&]*)(\&?)");
		return sval ? sval[1] : sval;
	};

	//////////////////////////////////////////////////////////////////////
	//
	function canDocumentScroll(direction) {
		
		let docElm = document.documentElement;

		if (((direction === "up") && docElm.scrollTop === 0) || ((direction === "down") && docElm.scrollTop === docElm.scrollTopMax)) {
			return false;
		}
		return true;
	}

})();
