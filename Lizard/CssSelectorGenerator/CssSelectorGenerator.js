"use strict";

/*
	CSS Selector Generator, v2.1.2
	by Riki Fridrich <riki@fczbkk.com> (http://fczbkk.com)
	https://github.com/fczbkk/css-selector-generator/
	commit 803a312 on Jul 8, 2020

	Dependencies:

		cartesian, v1.0.0
		by Alex Indigo <iam@alexindigo.com>
		https://github.com/alexindigo/cartesian/
		commit 4de6dd4 on Dec 2, 2015

		xtend, v4.0.2
		by Jake Verbaten <raynos2@gmail.com>
		https://github.com/Raynos/xtend/
		commit 37816c0 on on Jul 8, 2019

	bugfix:
		"Large amount of classes locks up getCombinations" #16
		by: Vishal Telangre
		https://github.com/fczbkk/css-selector-generator/issues/16#issuecomment-222778137
*/

let CssSelectorGenerator = (function () {

	const DESCENDANT_OPERATOR = " > ";
	const ESCAPED_COLON = ":".charCodeAt(0).toString(16).toUpperCase();
	const SPECIAL_CHARACTERS_RE = /[ !"#$%&'()\[\]{|}<>*+,./;=?@^`~\\]/;

	const SELECTOR_TYPE_GETTERS = {
		tag: getTagSelector,
		id: getIdSelector,
		class: getClassSelectors,
		attribute: getAttributeSelectors,
		nthchild: getNthChildSelector,
		nthoftype: getNthOfTypeSelector,
	};

	const DEFAULT_OPTIONS = {
		selectors: ["id", "class", "tag", "attribute"],
		// if set to true, always include tag name
		includeTag: false,
		whitelist: [],
		blacklist: [],
		combineWithinSelector: true,
		combineBetweenSelectors: true,
	};

	// RegExp that will match invalid patterns that can be used in ID attribute.
	const INVALID_ID_RE = new RegExp([
		"^$", // empty or not set
		"\\s", // contains whitespace
		"^\\d", // begins with a number
	].join("|"));

	// RegExp that will match invalid patterns that can be used in class attribute.
	const INVALID_CLASS_RE = new RegExp([
		"^$", // empty or not set
		"^\\d", // begins with a number
	].join("|"));

	// Order in which a combined selector is constructed.
	const SELECTOR_PATTERN = [
		"nthoftype",
		"tag",
		"id",
		"class",
		"attribute",
		"nthchild",
	];

	// List of attributes to be ignored. These are handled by different selector types.
	const ATTRIBUTE_BLACKLIST = convertMatchListToRegExp([
		"class",
		"id",
		// Angular attributes
		"ng-*",
	]);


	////////////////////////////////////////////////////////////////////////////////////
	// Generates unique CSS selector for an element.
	function getCssSelector(element, custom_options = {}) {
		const options = sanitizeOptions(element, custom_options);
		const parents = getParents(element, options.root);
		const result = [];

		// try to find optimized selector
		for (let i = 0; i < parents.length; i++) {
			result.unshift(getUniqueSelectorWithinParent(parents[i], options));
			const selector = result.join(DESCENDANT_OPERATOR);
			if (testSelector(element, selector, options.root)) {
				return selector;
			}
		}

		// use nth-child selector chain to root as fallback
		return getFallbackSelector(element, options.root);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Constructs default options with proper root node for given element.
	function constructDefaultOptions (element) {
		return Object.assign({}, DEFAULT_OPTIONS, { root: element.ownerDocument.querySelector(":root") });
	}

	/********************************************************************************/
	/********************************** selector-id *********************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get ID selector for an element.
	function getIdSelector(element) {
		const id = element.getAttribute("id") || "";
		const selector = `#${sanitizeSelectorItem(id)}`;
		return (!INVALID_ID_RE.test(id) && testSelector(element, selector, element.ownerDocument)) ? [selector] : [];
	}

	/********************************************************************************/
	/******************************** selector-class ********************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get class selectors for an element.
	function getClassSelectors(element) {

		// bugfix: Large amount of classes locks up getCombinations - https://github.com/fczbkk/css-selector-generator/issues/16#issuecomment-222778137
		if(element.tagName === 'HTML') {
			return [];
		}

		return (element.getAttribute("class") || "")
			.trim()
			.split(/\s+/)
			.filter((item) => !INVALID_CLASS_RE.test(item))
			.map((item) => `.${sanitizeSelectorItem(item)}`);
	}

	/********************************************************************************/
	/********************************* selector-tag *********************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get tag selector for an element.
	function getTagSelector(element) {
		return [sanitizeSelectorItem(element.tagName.toLowerCase())];
	}

	/********************************************************************************/
	/****************************** selector-attribute ******************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get attribute selectors for an element.
	function attributeNodeToSelector({ nodeName, nodeValue }) {
		return `[${nodeName}='${sanitizeSelectorItem(nodeValue)}']`;
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Checks whether attribute should be used as a selector.
	function isValidAttributeNode({ nodeName }) {
		return !ATTRIBUTE_BLACKLIST.test(nodeName);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Get attribute selectors for an element.
	function getAttributeSelectors(element) {
		return [...element.attributes]
			.filter(isValidAttributeNode)
			.map(attributeNodeToSelector);
	}

	/********************************************************************************/
	/****************************** selector-nth-of-type ****************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get nth-of-type selector for an element.
	function getNthOfTypeSelector(element) {
		const tag = getTagSelector(element)[0];
		const parentElement = element.parentElement;

		if (parentElement) {
			const siblings = parentElement.querySelectorAll(tag);
			for (let i = 0; i < siblings.length; i++) {
				if (siblings[i] === element) {
					return [`${tag}:nth-of-type(${i + 1})`];
				}
			}
		}
		return [];
	}

	/********************************************************************************/
	/******************************* selector-nth-child *****************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Get nth-child selector for an element.
	function getNthChildSelector(element) {
		const parent = element.parentNode;

		if (parent) {
			let counter = 0;
			const siblings = parent.childNodes;
			for (let i = 0; i < siblings.length; i++) {
				if (csgDependencies.isElement(siblings[i])) {
					counter += 1;
					if (siblings[i] === element) {
						return [`:nth-child(${counter})`];
					}
				}
			}
		}
		return [];
	}

	/********************************************************************************/
	/******************************* selector-fallback ******************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function getFallbackSelector(element, root) {
		return getParents(element, root)
			.map((element) => getNthChildSelector(element)[0])
			.reverse()
			.join(DESCENDANT_OPERATOR);
	}

	/********************************************************************************/
	/********************************* utilities-data *******************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	//Creates all possible combinations of items in the list.
	function getCombinations(items = []) {
		// see the empty first result, will be removed later
		const result = [[]];

		/*
			bugfix: Large amount of classes locks up getCombinations

			The following nested forEach() loops can consume a huge amount of memory if items.length is too large.
			The length of the result array will be 2^(items.length - 1).
			On tests when items.length was 45 the browser freeze when it tried to handle an array of 17,592,186,044,416 items.
		*/
		items.forEach((items_item) => {
			result.forEach((result_item) => {
				result.push(result_item.concat(items_item));
			});
		});

		// remove seed
		result.shift();

		return result
			// sort results by length, we want the shortest selectors to win
			.sort((a, b) => a.length - b.length);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Converts array of arrays into a flat array.
	function flattenArray(input) {
		return [].concat(...input);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Convert string that can contain wildcards (asterisks) to RegExp source.
	function wildcardToRegExp(input) {
		return input
			// convert all special characters used by RegExp, except an asterisk
			.replace(/[|\\{}()[\]^$+?.]/g, "\\$&")
			// convert asterisk to pattern that matches anything
			.replace(/\*/g, ".+");
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Converts list of white/blacklist items to a single RegExp.
	function convertMatchListToRegExp(list = []) {
		if (list.length === 0) {
			return new RegExp(".^");
		}
		const combined_re = list
			.map((item) => {
				return (typeof(item) === "string")
					? wildcardToRegExp(item)
					: item.source;
			})
			.join("|");
		return new RegExp(combined_re);
	}

	/********************************************************************************/
	/********************************* utilities-dom ********************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Check whether element is matched uniquely by selector.
	function testSelector(element, selector, root = document) {
		const result = root.querySelectorAll(selector);
		return (result.length === 1 && result[0] === element);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Find all parent elements of the element.
	function getParents(element, root = getRootNode(element)) {
		const result = [];
		let parent = element;
		while (csgDependencies.isElement(parent) && parent !== root) {
			result.push(parent);
			parent = parent.parentElement;
		}
		return result;
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Returns root node for given element. This needs to be used because of document-less environments, e.g. jsdom.
	function getRootNode(element) {
		return element.ownerDocument.querySelector(":root");
	}

	/********************************************************************************/
	/******************************* utilities-options ******************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Makes sure the options object contains all required keys.
	function sanitizeOptions(element, custom_options = {}) {
		return Object.assign({}, constructDefaultOptions(element), custom_options);
	}

	/********************************************************************************/
	/****************************** utilities-selectors *****************************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Escapes special characters used by CSS selector items.
	function sanitizeSelectorItem(input = "") {
		return input.split("")
			.map((character) => {
				if (character === ":") {
					return `\\${ESCAPED_COLON} `;
				}
				if (SPECIAL_CHARACTERS_RE.test(character)) {
					return `\\${character}`;
				}
				return escape(character)
					.replace(/%/g, "\\");
			})
			.join("");
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Returns list of selectors of given type for the element.
	function getSelectorsByType(element, selector_type) {
		return (SELECTOR_TYPE_GETTERS[selector_type] || (() => []))(element);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Remove blacklisted selectors from list.
	function filterSelectors(list = [], blacklist_re, whitelist_re) {
		return list.filter((item) => (
			whitelist_re.test(item)
			|| !blacklist_re.test(item)
		));
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Prioritise whitelisted selectors in list.
	function orderSelectors(list = [], whitelist_re) {
		return list.sort((a, b) => {
			const a_is_whitelisted = whitelist_re.test(a);
			const b_is_whitelisted = whitelist_re.test(b);
			if (a_is_whitelisted && !b_is_whitelisted) { return -1; }
			if (!a_is_whitelisted && b_is_whitelisted) { return 1; }
			return 0;
		});
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Tries to generate unique selector for the element within it's parent.
	function getUniqueSelectorWithinParent(element, options) {
		if (element.parentNode) {
			const selectors_list = getSelectorsList(element, options);
			const type_combinations = getTypeCombinations(selectors_list, options);
			const all_selectors = flattenArray(type_combinations);

			for (let i = 0; i < all_selectors.length; i++) {
				const selector = all_selectors[i];
				if (testSelector(element, selector, element.parentNode)) {
					return selector;
				}
			}
		}
		return "*";
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Creates object containing all selector types and their potential values.
	function getSelectorsList(element, options) {
		const {
			blacklist,
			whitelist,
			combineWithinSelector,
		} = options;

		const blacklist_re = convertMatchListToRegExp(blacklist);
		const whitelist_re = convertMatchListToRegExp(whitelist);

		const reducer = (data, selector_type) => {
			const selectors_by_type = getSelectorsByType(element, selector_type);
			const filtered_selectors =
				filterSelectors(selectors_by_type, blacklist_re, whitelist_re);
			const found_selectors = orderSelectors(filtered_selectors, whitelist_re);

			data[selector_type] = combineWithinSelector
				? getCombinations(found_selectors)
				: found_selectors.map((item) => [item]);

			return data;
		};

		return getSelectorsToGet(options)
			.reduce(reducer, {});
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Creates list of selector types that we will need to generate the selector.
	function getSelectorsToGet(options) {
		const {
			selectors,
			includeTag,
		} = options;

		const selectors_to_get = [].concat(selectors);
		if (includeTag && !selectors_to_get.includes("tag")) {
			selectors_to_get.push("tag");
		}
		return selectors_to_get;
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Adds "tag" to a list, if it does not contain it. Used to modify selectors list when includeTag option is enabled to make sure all results contain the TAG part.
	function addTagTypeIfNeeded(list) {
		return (list.includes("tag") || list.includes("nthoftype"))
			? [...list]
			: [...list, "tag"];
	}

	////////////////////////////////////////////////////////////////////////////////////
	function combineSelectorTypes(selectors_list, options = {}) {
		const {
			selectors,
			combineBetweenSelectors,
			includeTag,
		} = options;

		const combinations = combineBetweenSelectors
			? getCombinations(selectors)
			: selectors.map(item => [item]);

		return includeTag
			? combinations.map(addTagTypeIfNeeded)
			: combinations;
	}

	////////////////////////////////////////////////////////////////////////////////////
	function getTypeCombinations(selectors_list, options) {
		return combineSelectorTypes(selectors_list, options)
			.map((item) => constructSelectors(item, selectors_list))
			.filter((item) => item !== "");
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Generates all variations of possible selectors from provided data.
	function constructSelectors(selector_types, selectors_by_type) {
		const data = {};
		selector_types.forEach((selector_type) => {
			const selector_variants = selectors_by_type[selector_type];
			if (selector_variants.length > 0) {
				data[selector_type] = selector_variants;
			}
		});

		const combinations = csgDependencies.cartesian(data);
		return combinations.map(constructSelector);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Creates selector for given selector type. Combines several parts if needed.
	function constructSelectorType(selector_type, selectors_data) {
		return (selectors_data[selector_type])
			? selectors_data[selector_type].join("")
			: "";
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Converts selector data object to a selector.
	function constructSelector(selector_data = {}) {
		return SELECTOR_PATTERN
			.map((type) => constructSelectorType(type, selector_data))
			.join("");
	}

	/********************************************************************************/
	return {
		getCssSelector: getCssSelector,
	}

})();


let csgDependencies = (function () {

	/********************************************************************************/
	/****************** From: https://github.com/fczbkk/iselement *******************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function isElement(element) {
		return (element !== null)
			&& (typeof(element) === "object")
			&& (element.nodeType === Node.ELEMENT_NODE)
			&& (typeof(element.style) === "object")
			&& (typeof(element.ownerDocument) === "object");
	}

	/********************************************************************************/
	/**************** From: https://github.com/alexindigo/cartesian *****************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	// Creates cartesian product of the provided properties
	function cartesian(list) {
		let last, init, keys, product = [];

		if (Array.isArray(list)) {
			init = [];
			last = list.length - 1;
		}
		else if (typeof(list) === "object" && list !== null) {
			init = {};
			keys = Object.keys(list);
			last = keys.length - 1;
		}
		else {
			throw new TypeError("Expecting an Array or an Object, but '" + (list === null ? "null" : typeof(list)) + "' provided.");
		}

		function add(row, i) {
			let j, k, r;

			k = keys ? keys[i] : i;

			// either array or not, not expecting objects here
			Array.isArray(list[k]) || (typeof(list[k]) === "undefined" ? list[k] = [] : list[k] = [list[k]]);

			for (j = 0; j < list[k].length; j++) {
				r = clone(row);
				store(r, list[k][j], k);

				if (i >= last) {
					product.push(r);
				}
				else {
					add(r, i + 1);
				}
			}
		}
		add(init, 0);
		return product;
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Clones (shallow copy) provided object or array
	function clone(obj) {
		return Array.isArray(obj) ? [].concat(obj) : extend(obj);
	}

	////////////////////////////////////////////////////////////////////////////////////
	// Stores provided element in the provided object or array
	function store(obj, elem, key) {
		Array.isArray(obj) ? obj.push(elem) : (obj[key] = elem);
	}

	/********************************************************************************/
	/******************** From: https://github.com/Raynos/xtend *********************/
	/********************************************************************************/

	////////////////////////////////////////////////////////////////////////////////////
	function extend() {
		let target = {};

		for (let i=0, len=arguments.length; i<len; i++) {
			let source = arguments[i];

			for (let key in source) {
				if (hasOwnProperty.call(source, key)) {
					target[key] = source[key];
				}
			}
		}
		return target;
	}

	/********************************************************************************/
	return {
		isElement: isElement,
		cartesian: cartesian,
	}
})();
