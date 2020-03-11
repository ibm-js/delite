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
			// No explicit tabIndex setting, need to investigate node type
			switch (elem.nodeName.toLowerCase()) {
			case "a":
				// An <a> w/out a tabIndex is only navigable if it has an href
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
				var contentDocument = elem.contentDocument;

				// If it's a cross-domain <iframe> then contentDocument is null for security.  Just return false.
				if (!contentDocument) {
					return false;
				}

				// Otherwise, if it's an editor <iframe> then it's tab navigable.
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
		 * Return array of tab-navigable descendants of the specified root node,
		 * in the order that they would be navigated by the tab key.
		 *
		 * @param {Element} root - The Element.
		 * @returns [{Element}]
		 */
		getTabNavigable: function (root) {
			var elements = [], radioButtonByName = {};

			function radioName (node) {
				// If this element is part of a radio button group, return the name for that group.
				return node && node.tagName.toLowerCase() === "input" &&
					node.type && node.type.toLowerCase() === "radio" &&
					node.name && node.name.toLowerCase();
			}

			var shown = a11y._isElementShown, effectiveTabIndex = a11y.effectiveTabIndex;

			function walkTree (/*Element*/ parent) {
				for (var child = parent.firstElementChild; child; child = child.nextElementSibling) {
					// Skip hidden DOM trees.
					if (!shown(child)) {
						continue;
					}

					// If node is tab-navigable then add to elements[].
					var tabIndex = effectiveTabIndex(child);
					if (tabIndex >= 0) {
						var rn = radioName(child);
						if (rn) {
							// Only register one radio button (for a given group) as tab-navigable.
							// Note: assumes that all radio buttons in the same group have the same tabindex.
							if (!(rn in radioButtonByName)) {
								// First radio button seen with this name.  Register it, and add it to
								// elements[] array.
								radioButtonByName[rn] = {
									tabIndex: tabIndex,
									position: elements.length,
									element: child
								};
								elements.push(radioButtonByName[rn]);
							} else if (child.checked) {
								// This radio button is selected, so it overrides the radio button already added to
								// elements[].
								radioButtonByName[rn].element = child;
							} else {
								// Ignore this radio button since it's not the first one with seen (with this name),
								// and it's not selected.
							}
						} else {
							// Not a radio button, so just add it to elements[];
							elements.push({
								tabIndex: tabIndex,
								position: elements.length,
								element: child
							});
						}
					}

					// Search child nodes.
					if (child.nodeName.toUpperCase() !== "SELECT") {
						walkTree(child);
					}
				}
			}

			if (shown(root)) {
				walkTree(root);
			}

			var sortedElements = elements.sort(function (a, b) {
				// Tab should go to positive tabindexes before tabindex=0, so convert 0 to Infinity.
				return (a.tabIndex || Infinity) - (b.tabIndex || Infinity) || a.position - b.position;
			}).map(function (info) {
				return info.element;
			});

			return sortedElements;
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
			var elems = a11y.getTabNavigable(root);
			return elems[0];
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
			var elems = a11y.getTabNavigable(root);
			return elems[elems.length - 1];
		}
	};

	return a11y;
});
