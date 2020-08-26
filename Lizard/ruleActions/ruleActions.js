"use strict";

let ruleActions = (function () {

	//////////////////////////////////////////////////////////////////////
	function hideElement(cssSelectorEncoded) {
		let cssSelector = decodeURIComponent(cssSelectorEncoded);
		let elm = document.querySelector(cssSelector);
		if(!!elm) {
			_updateRuleStats(cssSelector);
			elm.style.visibility = "hidden";
		}
	}

	//////////////////////////////////////////////////////////////////////
	function removeElement(cssSelectorEncoded) {
		let cssSelector = decodeURIComponent(cssSelectorEncoded);
		let elm = document.querySelector(cssSelector);
		if(!!elm) {
			_updateRuleStats(decodeURIComponent(cssSelector));
			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function dewidthifyElement(cssSelectorEncoded) {
		let cssSelector = decodeURIComponent(cssSelectorEncoded);
		let elm = document.querySelector(cssSelector);
		if(!!elm) {
			_updateRuleStats(decodeURIComponent(cssSelector));
			_dewidthify(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function isolateElement(cssSelectorEncoded) {
		let cssSelector = decodeURIComponent(cssSelectorEncoded);
		let elm = document.querySelector(cssSelector);
		if(!!elm) {
			_updateRuleStats(decodeURIComponent(cssSelector));

			let isolated = _cloneIsolatedElement(elm);
			isolated.style.display = "table-cell";
			isolated.style.verticalAign = "middle";

			document.documentElement.removeChild(document.body);
			document.body = document.createElement("body");

			let bodyStyle = document.body.style;
			bodyStyle.all = "initial";
			bodyStyle.display = "table";
			bodyStyle.margin = "auto";
			bodyStyle.paddingTop = "20px";

			document.body.appendChild(isolated);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function colorizeElement(details) {
		let cssSelector = decodeURIComponent(details.cssSelectorEncoded);
		let elm = document.querySelector(cssSelector);
		if(!!elm) {
			_updateRuleStats(cssSelector);
			_colorizeElement(elm, details.foreground, details.background, details.colorizeChildren, details.saturateAmount, details.invertAmount);
		}
	}

	//////////////////////////////////////////////////////////////////////
	//////////// I N T E R N A L S ///////////////////////////////////////
	//////////////////////////////////////////////////////////////////////

	//////////////////////////////////////////////////////////////////////
	function _dewidthify(elm) {

		elm.style.width = "auto";
		elm.style.maxWidth = "none";

		for(let i=0, len=elm.children.length; i<len; i++) {
			_dewidthify(elm.children[i]);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _cloneIsolatedElement(elm) {

		let name, priority, css = "";
		let style = window.getComputedStyle(elm);

		for(let i=0, len=style.length; i<len; i++) {
			name = style[i];
			priority = style.getPropertyPriority(name);
			css += name + ":" + style.getPropertyValue(name) + (priority.length > 0 ? ` !${priority};` : ";");
		}

		let e = elm.cloneNode(true);
		e.style.cssText = css;
		return e;
	}

	//////////////////////////////////////////////////////////////////////
	function _colorizeElement(elm, foreground, background, colorizeChildren, saturateAmount, invertAmount) {

		let colorImages = (!!saturateAmount && ((elm.nodeName === "IMG") || _isSVGObject(elm) || _hasBackgroundImage(elm)));
		let elmStyle = elm.style;

		elmStyle.color = foreground;
		elmStyle.webkitTextFillColor = foreground;
		elmStyle.borderColor = foreground;
		elmStyle.backgroundColor = background;
		if(colorImages) {
			_applyCssFilter(elm, "saturate", saturateAmount);
			if (invertAmount) {
				_applyCssFilter(elm, "invert", invertAmount);
			}
		}

		for(let i=0, len=elm.children.length; i<len && colorizeChildren; i++) {
			_colorizeElement(elm.children[i], foreground, background, true, saturateAmount, invertAmount);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _isSVGObject(elm) {
		return ((typeof(elm.className) === "object") && (elm.className.toString() === "[object SVGAnimatedString]"));
	}

	//////////////////////////////////////////////////////////////////////
	function _hasBackgroundImage(elm) {
		return (window.getComputedStyle(elm).getPropertyValue("background-image") !== "none");
	}

	//////////////////////////////////////////////////////////////////////
	// filterName = "saturate"	; // "1000%" or "0%" (colorize, decolorize)
	// filterName = "invert"	; // "100%" or "0%" ((colorize || decolorize) +shift, (colorize || decolorize))
	function _applyCssFilter(elm, filterName, amount) {

		let validFilters = [ "saturate", "invert" ];
		if( !validFilters.includes(filterName) ) {
			let msg = "Invalid filter name: '" + filterName + "'. Expected: " + validFilters.map(n => "'" + n + "'").join(", ");
			console.log("[Lizard]", "Error:", msg);
			throw new Error(msg);
		}

		let re = new RegExp("\\b(" + filterName + "\\()([^)]+)(\\))");	// match: "saturate([amount])" or "invert([amount])"

		let compStyle = window.getComputedStyle(elm);

		if (re.test(compStyle.filter)) {
			elm.style.filter = compStyle.filter.replace(re, "$1" + amount + "$3");	// replace amount
		} else {
			if (compStyle.filter !== "" && compStyle.filter !== "none") {
				elm.style.filter = compStyle.filter;
			} else if(elm.style.filter === "none") {
				elm.style.filter = "";
			}
			elm.style.filter += filterName + "(" + amount + ")";
		}
	}

	//////////////////////////////////////////////////////////////////////
	function _updateRuleStats(cssSelector) {
		browser.runtime.sendMessage({
			id: "msgUpdateRuleStats",			// msgs.ID_UPDATE_RULE_STATS -> For economical reasons the common.js was not injected
			data: {
				url: window.location.toString(),
				cssSelector: cssSelector,
			},
		});
	}

	/********************************************************************/
	return {
		hideElement: hideElement,
		removeElement: removeElement,
		dewidthifyElement: dewidthifyElement,
		isolateElement: isolateElement,
		colorizeElement: colorizeElement,
	}
})();
