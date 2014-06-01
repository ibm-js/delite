/**
 * Tracks the currently focused node, and which widgets are currently "active".
 *
 * A widget is considered active if it or a descendant widget has focus,
 * or if a non-focusable node of this widget or a descendant was recently clicked.
 *
 * Call `focus.watch("curNode", callback)` to track the current focused Element,
 * or `focus.watch("activeStack", callback)` to track the currently focused stack of widgets.
 *
 * Call `focus.on("widget-blur", func)` or `focus.on("widget-focus", ...)` to monitor when
 * when widgets become active/inactive
 *
 * Finally, `focus.focus(node)` will focus a node, suppressing errors if the node doesn't exist.
 *
 * @module delite/focus
 * */
define([
	"dcl/advise",
	"dcl/dcl",
	"dojo/dom", // dom.byId
	"dojo/dom-attr", // domAttr.get
	"dojo/dom-class",
	"dojo/dom-construct", // connect to domConstruct.empty, domConstruct.destroy
	"dojo/Evented",
	"dojo/on",
	"dojo/Stateful",
	"dojo/window", // winUtils.get
	"./a11y",	// a11y.isTabNavigable
	"dojo/domReady!"
], function (advise, dcl, dom, domAttr, domClass, domConstruct, Evented, on, Stateful, winUtils, a11y) {

	// Time of the last touch or focusIn event
	var lastTouch;

	// TODO: switch to using delite/Stateful, and dcl.advise

	var FocusManager = dcl([Stateful, Evented], /** @lends module:delite/focus */ {

		// TODO: get rid of curNode and prevNode?  App can just use document.activeElement.

		/**
		 * Currently focused item on screen.
		 * @property {Element} curNode
		 */
		curNode: null,

		/**
		 * List of currently active widgets (focused widget and its ancestors).
		 * @property {Element[]} activeStack
		 */
		activeStack: [],

		constructor: function () {
			// Don't leave curNode/prevNode pointing to bogus elements
			function check(node) {
				if (this.curNode && this.curNode.contains(node)) {
					this.set("curNode", null);
				}
				if (this.prevNode && this.prevNode.contains(node)) {
					this.set("prevNode", null);
				}
			}

			advise.before(domConstruct, "empty", check.bind(this));
			advise.before(domConstruct, "destroy", check.bind(this));
		},

		/**
		 * Registers listeners on the specified iframe so that any click
		 * or focus event on that iframe (or anything in it) is reported
		 * as a focus/click event on the `<iframe>` itself.
		 *
		 * In dijit this was only used by editor; perhaps it should be removed.
		 *
		 * @param {HTMLIframeElement} iframe
		 * @returns {Object} Handle with `remove()` method to deregister.
		 */
		registerIframe: function (iframe) {
			return this.registerWin(iframe.contentWindow, iframe);
		},

		/**
		 * Registers listeners on the specified window (either the main
		 * window or an iframe's window) to detect when the user has clicked somewhere
		 * or focused somewhere.
		 *
		 * Users should call registerIframe() instead of this method.
		 *
		 * @param {Window} [targetWindow] - If specified this is the window associated with the iframe,
		 *       i.e. iframe.contentWindow.
		 * @param {Element} [effectiveNode] - If specified, report any focus events inside targetWindow as
		 *       an event on effectiveNode, rather than on evt.target.
		 * @returns {Object} Handle with `remove()` method to deregister.
		 * @private
		 */
		registerWin: function (targetWindow, effectiveNode) {
			// Listen for blur and focus events on targetWindow's document.
			var _this = this,
				body = targetWindow.document && targetWindow.document.body;

			if (body) {
				// TODO: change this to run on capture phase rather than bubbling phase after that option is added to
				// dojo/on (see #16596)
				var mdh = on(targetWindow.document, "mousedown, touchstart", function (evt) {
					// workaround weird IE bug where the click is on an orphaned node
					// (first time clicking a Select/DropDownButton inside a TooltipDialog).
					// actually, strangely this is happening on latest chrome too.
					if (evt && evt.target && evt.target.parentNode == null) {
						return;
					}

					_this._onTouchNode(effectiveNode || evt.target, "mouse");
				});

				var fih = on(body, "focusin", function (evt) {
					// When you refocus the browser window, IE gives an event with an empty srcElement
					if (!evt.target.tagName) {
						return;
					}

					// IE reports that nodes like <body> have gotten focus, even though they have tabIndex=-1,
					// ignore those events
					var tag = evt.target.tagName.toLowerCase();
					if (tag === "#document" || tag === "body") {
						return;
					}

					if (a11y.isFocusable(evt.target)) {
						_this._onFocusNode(effectiveNode || evt.target);
					} else {
						// Previous code called _onTouchNode() for any activate event on a non-focusable node.   Can
						// probably just ignore such an event as it will be handled by onmousedown handler above, but
						// leaving the code for now.
						_this._onTouchNode(effectiveNode || evt.target);
					}
				});

				var foh = on(body, "focusout", function (evt) {
					// IE9+ and chrome have a problem where focusout events come after the corresponding focusin event.
					// For chrome problem see https://bugs.dojotoolkit.org/ticket/17668.
					// IE problem happens when moving focus from the Editor's <iframe> to a normal DOMNode.
					if ((new Date()).getTime() < lastTouch + 100) {
						return;
					}

					_this._onBlurNode(effectiveNode || evt.target);
				});

				return {
					remove: function () {
						mdh.remove();
						fih.remove();
						foh.remove();
						mdh = fih = foh = null;
						body = null;	// prevent memory leak (apparent circular reference via closure)
					}
				};
			}
		},

		/**
		 * Called when focus leaves a node.
		 * Usually ignored, _unless_ it *isn't* followed by touching another node,
		 * which indicates that we tabbed off the last field on the page,
		 * in which case every widget is marked inactive.
		 * @param {Element} node
		 * @private
		 */
		_onBlurNode: function (node) { // jshint unused: vars
			// If the blur event isn't followed by a focus event, it means the user clicked on something unfocusable,
			// so clear focus.
			if (this._clearFocusTimer) {
				clearTimeout(this._clearFocusTimer);
			}
			this._clearFocusTimer = setTimeout(function () {
				this.set("prevNode", this.curNode);
				this.set("curNode", null);
			}.bind(this), 0);

			// If the blur event isn't followed by a focus or touch event then mark all widgets as inactive.
			if (this._clearActiveWidgetsTimer) {
				clearTimeout(this._clearActiveWidgetsTimer);
			}
			this._clearActiveWidgetsTimer = setTimeout(function () {
				delete this._clearActiveWidgetsTimer;
				this._setStack([]);
			}.bind(this), 0);
		},

		/**
		 * Callback when node is focused or mouse-downed.
		 * @param {Element} node - The node that was touched.
		 * @param {string} by - "mouse" if the focus/touch was caused by a mouse down event.
		 * @private
		 */
		_onTouchNode: function (node, by) {
			// Keep track of time of last focusin or touch event.
			lastTouch = (new Date()).getTime();

			// ignore the recent blurNode event
			if (this._clearActiveWidgetsTimer) {
				clearTimeout(this._clearActiveWidgetsTimer);
				delete this._clearActiveWidgetsTimer;
			}

			// if the click occurred on the scrollbar of a dropdown, treat it as a click on the dropdown,
			// even though the scrollbar is technically on the popup wrapper (see #10631)
			if (domClass.contains(node, "d-popup")) {
				node = node.firstChild;
			}

			// compute stack of active widgets (ex: ComboButton --> Menu --> MenuItem)
			var newStack = [];
			try {
				while (node) {
					var popupParent = domAttr.get(node, "duiPopupParent");
					if (popupParent) {
						node = dom.byId(popupParent);
					} else if (node.tagName && node.tagName.toLowerCase() === "body") {
						// is this the root of the document or just the root of an iframe?
						if (node === document.body) {
							// node is the root of the main document
							break;
						}
						// otherwise, find the iframe this node refers to (can't access it via parentNode,
						// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
						node = winUtils.get(node.ownerDocument).frameElement;
					} else {
						// if this node is the root node of a widget, then add widget id to stack,
						// except ignore clicks on disabled widgets (actually focusing a disabled widget still works,
						// to support MenuItem)
						if (node.buildRendering && !(by === "mouse" && node.disabled)) {
							newStack.unshift(node);
						}
						node = node.parentNode;
					}
				}
			} catch (e) { /* squelch */
			}

			this._setStack(newStack, by);
		},

		/**
		 * Callback when node is focused
		 * @param {Element} node
		 * @private
		 */
		_onFocusNode: function (node) {
			if (!node) {
				return;
			}

			if (node.nodeType === 9) {
				// Ignore focus events on the document itself.  This is here so that
				// (for example) clicking the up/down arrows of a spinner
				// (which don't get focus) won't cause that widget to blur. (FF issue)
				return;
			}

			// There was probably a blur event right before this event, but since we have a new focus, don't
			// do anything with the blur
			if (this._clearFocusTimer) {
				clearTimeout(this._clearFocusTimer);
				delete this._clearFocusTimer;
			}

			this._onTouchNode(node);

			if (node === this.curNode) {
				return;
			}
			this.set("prevNode", this.curNode);
			this.set("curNode", node);
		},

		/**
		 * The stack of active widgets has changed.  Send out appropriate events and records new stack.
		 * @param {module:delite/Widget[]} newStack - Array of widgets, starting from the top (outermost) widget.
		 * @param {string} by - "mouse" if the focus/touch was caused by a mouse down event.
		 * @private
		 */
		_setStack: function (newStack, by) {
			var oldStack = this.activeStack, lastOldIdx = oldStack.length - 1, lastNewIdx = newStack.length - 1;

			if (newStack[lastNewIdx] === oldStack[lastOldIdx]) {
				// no changes, return now to avoid spurious notifications about changes to activeStack
				return;
			}

			this.set("activeStack", newStack);

			var widget, i;

			// for all elements that have gone out of focus, set focused=false
			for (i = lastOldIdx; i >= 0 && oldStack[i] !== newStack[i]; i--) {
				widget = oldStack[i];
				if (widget) {
					widget._hasBeenBlurred = true;		// TODO: used by form widgets, should be moved there
					widget.focused = false;
					if (widget._onBlur) {
						widget._onBlur(by);
					}
					this.emit("widget-blur", widget, by);
				}
			}

			// for all element that have come into focus, set focused=true
			for (i++; i <= lastNewIdx; i++) {
				widget = newStack[i];
				if (widget) {
					widget.focused = true;
					if (widget._onFocus) {
						widget._onFocus(by);
					}
					this.emit("widget-focus", widget, by);
				}
			}
		},

		/**
		 * Focus the specified node, suppressing errors if they occur.
		 * @param {Element} node
		 */
		focus: function (node) {
			if (node) {
				try {
					node.focus();
				} catch (e) {/*quiet*/
				}
			}
		}
	});

	// Create singleton for top window
	var singleton = new FocusManager();
	singleton.registerWin(window);

	return singleton;
});
