"use strict";

let ruleActions = (function () {

	//////////////////////////////////////////////////////////////////////
	function hideElement(cssSelector) {
		let elm = document.querySelector(decodeURIComponent(cssSelector));
		if(!!elm) {
			elm.style.visibility = "hidden";
		}
	}

	//////////////////////////////////////////////////////////////////////
	function removeElement(cssSelector) {
		let elm = document.querySelector(decodeURIComponent(cssSelector));
		if(!!elm) {
			elm.parentNode.removeChild(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function dewidthifyElement(cssSelector) {
		let elm = document.querySelector(decodeURIComponent(cssSelector));
		if(!!elm) {
			_dewidthify(elm);
		}
	}

	//////////////////////////////////////////////////////////////////////
	function isolateElement(cssSelector) {
		let elm = document.querySelector(decodeURIComponent(cssSelector));
		if(!!elm) {
			let cloning = _cloneIsolatedElement(elm);

			document.documentElement.removeChild(document.body);
			document.body = document.createElement("body");

			let bodyStyle = document.body.style;

			bodyStyle.all = "initial";
			bodyStyle.display = "table";
			bodyStyle.margin = "auto";
			bodyStyle.paddingTop = "20px";

			cloning.then((isolated) => {
				isolated.style.display = "table-cell";
				isolated.style.verticalAign = "middle";
				document.body.appendChild(isolated);
			} );
		}
	}

	//////////////////////////////////////////////////////////////////////
	function colorizeElement(details) {
		let elm = document.querySelector(decodeURIComponent(details.cssSelectorEncoded));
		if(!!elm) {
			_colorizeElement(elm, details.foreground, details.background, details.colorizeChildren, details.saturateAmount, details.invertAmount);
		}
	}

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

		return new Promise((resolve) => {

			let name, priority, css = "";
			let style = window.getComputedStyle(elm);

			for(let i=0, len=style.length; i<len; i++) {
				name = style[i];
				priority = style.getPropertyPriority(name);
				css += name + ":" + style.getPropertyValue(name) + (priority.length > 0 ? " !" : "") + priority + ";";
			}

			let e = elm.cloneNode(true);
			e.style.cssText = css;
			resolve(e)
		});
	}

	//////////////////////////////////////////////////////////////////////
	function _colorizeElement(elm, foreground, background, colorizeChildren, saturateAmount, invertAmount) {

		let colorImages = (!!saturateAmount && ((elm.nodeName === "IMG") || _isSVGObject(elm) || _hasBackgroundImage(elm)));

		elm.style.color = foreground;
		elm.style.borderColor = foreground;
		elm.style.backgroundColor = background;
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
			console.log("[Lizard]", "Error: invalid filter name: `" + filterName + "`. Expected: " + validFilters.map(n => "`" + n + "`").join(", "));
		}

		let re = new RegExp("\\b(" + filterName + "\\()([^)]+)(\\))");	// match: "saturate([amount])" or "invert([amount])"

		let compStyle = window.getComputedStyle(elm);

		if (re.test(compStyle.filter)) {
			elm.style.filter = compStyle.filter.replace(re, "$1" + amount + "$3");	// replace amount
		} else {
			if (compStyle.filter != "" && compStyle.filter != "none") {
				elm.style.filter = compStyle.filter;
			}
			elm.style.filter += filterName + "(" + amount + ")";
		}
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
