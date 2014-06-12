/**
 * Accessibility utility functions (keyboard, tab stops, etc.).
 * @module delite/a11y
 * */
define([], function () {

	var a11y = /** @lends module:delite/a11y */ {
		/**
		 * Returns true if Element is visible.
		 * @param {Element} elem - The Element.
		 * @returns {boolean}
		 * @private
		 */
		_isElementShown: function (elem) {
			var s = getComputedStyle(elem);
			return s.visibility !== "hidden"
				&& s.visibility !== "collapsed"
				&& s.display !== "none"
				&& elem.type !== "hidden";
		},

		/**
		 * Tests if element is tab-navigable even without an explicit tabIndex setting
		 * @param {Element} elem - The Element.
		 * @returns {boolean}
		 */
		hasDefaultTabStop: function (elem) {
			/* jshint maxcomplexity:11 */

			// No explicit tabIndex setting, need to investigate node type
			switch (elem.nodeName.toLowerCase()) {
			case "a":
				// An <a> w/out a tabindex is only navigable if it has an href
				return elem.hasAttribute("href");
			case "area":
			case "button":
			case "input":
			case "object":
			case "select":
			case "textarea":
				// These are navigable by default
				return true;
			case "iframe":
				// If it's an editor <iframe> then it's tab navigable.
				var contentDocument = elem.contentDocument;
				if ("designMode" in contentDocument && contentDocument.designMode === "on") {
					return true;
				}
				var body = contentDocument.body;
				return body && (body.contentEditable === "true" ||
					(body.firstChild && body.firstChild.contentEditable === "true"));
			default:
				return elem.contentEditable === "true";
			}
		},

		/**
		 * Returns effective tabIndex of an element, either a number, or undefined if element isn't focusable.
		 * @param {Element} elem - The Element.
		 * @returns {number|undefined}
		 */
		effectiveTabIndex: function (elem) {
			if (elem.disabled) {
				return undefined;
			} else if (elem.hasAttribute("tabIndex")) {
				// Explicit tab index setting
				return +elem.getAttribute("tabIndex");// + to convert string --> number
			} else {
				// No explicit tabIndex setting, so depends on node type
				return a11y.hasDefaultTabStop(elem) ? 0 : undefined;
			}
		},

		/**
		 * Tests if an element is tab-navigable.
		 * @param {Element} elem - The Element.
		 * @returns {boolean}
		 */
		isTabNavigable: function (elem) {
			return a11y.effectiveTabIndex(elem) >= 0;
		},

		/**
		 * Tests if an element is focusable by tabbing to it, or clicking it with the mouse.
		 * @param {Element} elem - The Element.
		 * @returns {boolean}
		 */
		isFocusable: function (elem) {
			return a11y.effectiveTabIndex(elem) >= -1;
		},

		/**
		 * Finds descendants of the specified root node.
		 *
		 * The following descendants of the specified root node are returned:
		 *
		 * - the first tab-navigable element in document order without a tabIndex or with tabIndex="0"
		 * - the last tab-navigable element in document order without a tabIndex or with tabIndex="0"
		 * - the first element in document order with the lowest positive tabIndex value
		 * - the last element in document order with the highest positive tabIndex value
		 *
		 * @param Element root - The Element.
		 * @returns {Object} Hash of the format `{first: Element, last: Element, lowest: Element, highest: Element}`.
		 * @private
		 */
		_getTabNavigable: function (root) {
			var first, last, lowest, lowestTabindex, highest, highestTabindex, radioSelected = {};

			function radioName(node) {
				// If this element is part of a radio button group, return the name for that group.
				return node && node.tagName.toLowerCase() === "input" &&
					node.type && node.type.toLowerCase() === "radio" &&
					node.name && node.name.toLowerCase();
			}

			var shown = a11y._isElementShown, effectiveTabIndex = a11y.effectiveTabIndex;

			function walkTree(/*Element*/ parent) {
				/* jshint maxcomplexity:14 */
				for (var child = parent.firstChild; child; child = child.nextSibling) {
					// Skip text elements, hidden elements
					if (child.nodeType !== 1 || !shown(child)) {
						continue;
					}

					var tabindex = effectiveTabIndex(child);
					if (tabindex >= 0) {
						if (tabindex === 0) {
							if (!first) {
								first = child;
							}
							last = child;
						} else if (tabindex > 0) {
							if (!lowest || tabindex < lowestTabindex) {
								lowestTabindex = tabindex;
								lowest = child;
							}
							if (!highest || tabindex >= highestTabindex) {
								highestTabindex = tabindex;
								highest = child;
							}
						}
						var rn = radioName(child);
						if (child.checked && rn) {
							radioSelected[rn] = child;
						}
					}
					if (child.nodeName.toUpperCase() !== "SELECT") {
						walkTree(child);
					}
				}
			}

			if (shown(root)) {
				walkTree(root);
			}
			function rs(node) {
				// substitute checked radio button for unchecked one, if there is a checked one with the same name.
				return radioSelected[radioName(node)] || node;
			}

			return { first: rs(first), last: rs(last), lowest: rs(lowest), highest: rs(highest) };
		},

		/**
		 * Finds the descendant of the specified root node that is first in the tabbing order.
		 * @param {string|Element} root
		 * @param {Document} [doc]
		 * @returns {Element}
		 */
		getFirstInTabbingOrder: function (root, doc) {
			if (typeof root === "string") {
				root = (doc || document).getElementById(root);
			}
			var elems = a11y._getTabNavigable(root);
			return elems.lowest ? elems.lowest : elems.first;
		},

		/**
		 * Finds the descendant of the specified root node that is last in the tabbing order.
		 * @param {string|Element} root
		 * @param {Document} [doc]
		 * @returns {Element}
		 */
		getLastInTabbingOrder: function (root, doc) {
			if (typeof root === "string") {
				root = (doc || document).getElementById(root);
			}
			var elems = a11y._getTabNavigable(root);
			return elems.last ? elems.last : elems.highest;
		}
	};

	return a11y;
});
