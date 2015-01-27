// Helper methods for automated testing

define([
	"requirejs-dplugins/Promise!",
	"../../a11y"	// isTabNavigable, _isElementShown
], function (Promise, a11y) {


	// Globals used by onFocus()
	var curFocusNode, focusListener, focusCallback, focusCallbackDelay;

	return {

		isVisible: function isVisible(/*DomNode*/ node) {
			// summary:
			//		Return true if node/widget is visible

			var p, cs = getComputedStyle(node);

			return cs.display !== "none" &&
				cs.visibility !== "hidden" &&
				(p = node.getBoundingClientRect(), p.bottom >= 0 && p.right >= 0 && p.height && p.width);
		},

		isHidden: function isHidden(/*DomNode*/ node) {
			// summary:
			//		Return true if node/widget is hidden

			var p, cs = getComputedStyle(node);

			return cs.display === "none" ||
				cs.visibility === "hidden" ||
				(p = node.getBoundingClientRect(), p.bottom < 0 || p.right < 0 && p.height <= 0 || p.width <= 0);
		},

		innerText: function innerText(/*DomNode*/ node) {
			// summary:
			//		Browser portable function to get the innerText of specified DOMNode
			return (node.textContent || "").trim();
		},

		tabOrder: function tabOrder(/*DomNode?*/ root) {
			// summary:
			//		Return all tab-navigable elements under specified node in the order that
			//		they will be visited (by repeated presses of the tab key)

			var elems = [];

			function walkTree(/*DOMNode*/ parent) {
				var children = Array.prototype.slice.call(parent.children);
				children.forEach(function (child) {
					// Skip hidden elements
					if (!a11y._isElementShown(child)) {
						return;
					}

					if (a11y.isTabNavigable(child)) {
						elems.push({
							elem: child,
							tabIndex: child.hasAttribute("tabindex") ? child.getAttribute("tabindex") : 0,
							pos: elems.length
						});
					}
					if (child.nodeName.toUpperCase() !== "SELECT") {
						walkTree(child);
					}
				});
			}

			walkTree(root || document.body);

			elems.sort(function (a, b) {
				return a.tabIndex !== b.tabIndex ? a.tabIndex - b.tabIndex : a.pos - b.pos;
			});
			return elems.map(function (elem) {
				return elem.elem;
			});
		},


		onFocus: function onFocus(func, delay) {
			// summary:
			//		Wait for the next change of focus, and then delay ms (so widget has time to react to focus event),
			//		then call func(node) with the currently focused node.  Note that if focus changes again during
			//		delay, newest focused node is passed to func.

			if (!focusListener) {
				focusListener = document.addEventListener("focus", function (evt) {
					// Track most recently focused node; note it may change again before delay completes
					curFocusNode = evt.target;

					// If a handler was specified to fire after the next focus event (plus delay),
					// set timeout to run it.
					if (focusCallback) {
						var callback = focusCallback;
						focusCallback = null;
						setTimeout(function () {
							callback(curFocusNode);		// return current focus, may be different than 10ms earlier
						}, focusCallbackDelay);	// allow time for focus to change again, see #8285
					}
				}, true);
			}

			focusCallback = func;
			focusCallbackDelay = delay || 10;
		},

		waitForLoad: function () {
			// summary:
			//		Returns Promise that fires when all widgets have finished initializing.
			//		Call this after the parser has finished running.

			// Promise fires when all widgets with a loadPromise have fired.
			// Note that we really just want to search for the widgets registered via register.createElement()
			// but that info isn't public.
			var allNodes = Array.prototype.slice.call(document.getElementsByTagName("*"));
			var widgets = allNodes.filter(function (w) {
					return w.loadPromise;
				}),
				promises = widgets.map(function (w) {
					return w.loadPromise;
				});

			console.log("Waiting for " + widgets.length + " widgets: " +
			widgets.map(function (w) {
				return w.id;
			}).join(", "));

			return Promise.all(promises).then(function () {
				console.log("All widgets loaded.");
			});
		}

	};

});
