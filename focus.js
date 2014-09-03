/**
 * Tracks which widgets are currently "active".
 *
 * A widget is considered active if it or a descendant widget has focus,
 * or if a non-focusable node of this widget or a descendant was recently clicked.
 *
 * Call `focus.on("active-widget-stack", callback)` to track the stack of currently focused widgets.
 *
 * Call `focus.on("widget-blur", func)` or `focus.on("widget-focus", ...)` to monitor when
 * when widgets become active/inactive.
 *
 * Finally, `focus.focus(node)` will focus a node, suppressing errors if the node doesn't exist.
 *
 * @module delite/focus
 * */
define([
	"dcl/advise",
	"dcl/dcl",
	"dojo/dom-class",
	"decor/Evented",
	"dpointer/events",		// so can just monitor for "pointerdown"
	"requirejs-domready/domReady!"
], function (advise, dcl, domClass, Evented) {

	// Time of the last focusin event
	var lastFocusin;

	// Time of the last touch/mousedown or focusin event
	var lastTouchOrFocusin;

	var FocusManager = dcl(Evented, /** @lends module:delite/focus */ {

		/**
		 * List of currently active widgets (focused widget and its ancestors).
		 * @property {Element[]} activeStack
		 */
		activeStack: [],

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
				doc = targetWindow.document,
				body = doc && doc.body;

			function pointerDownHandler(evt) {
				// workaround weird IE bug where the click is on an orphaned node
				// (first time clicking a Select/DropDownButton inside a TooltipDialog).
				// actually, strangely this is happening on latest chrome too.
				if (evt && evt.target && evt.target.parentNode == null) {
					return;
				}

				_this._onTouchNode(effectiveNode || evt.target, "mouse");
			}

			function focusHandler(evt) {
				// When you refocus the browser window, IE gives an event with an empty srcElement
				if (!evt.target.tagName) {
					return;
				}

				// IE reports that nodes like <body> have gotten focus, even though they don't have a
				// tabindex setting.  Ignore those events.
				var tag = evt.target.tagName.toLowerCase();
				if (tag === "#document" || tag === "body") {
					return;
				}

				_this._onFocusNode(effectiveNode || evt.target);
			}

			function blurHandler(evt) {
				_this._onBlurNode(effectiveNode || evt.target);
			}

			if (body) {
				// Listen for touches or mousedowns.
				doc.addEventListener("pointerdown", pointerDownHandler, true);
				body.addEventListener("focus", focusHandler, true);	// need true since focus doesn't bubble
				body.addEventListener("blur", blurHandler, true);	// need true since blur doesn't bubble

				return {
					remove: function () {
						doc.removeEventListener("pointerdown", pointerDownHandler, true);
						body.removeEventListener("focus", focusHandler, true);
						body.removeEventListener("blur", blurHandler, true);
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
			var now = (new Date()).getTime();

			// IE9+ and chrome have a problem where focusout events come after the corresponding focusin event.
			// For chrome problem see https://bugs.dojotoolkit.org/ticket/17668.
			// IE problem happens when moving focus from the Editor's <iframe> to a normal DOMNode.
			if (now < lastFocusin + 100) {
				return;
			}

			// Unset timer to zero-out widget stack; we'll reset it below if appropriate.
			if (this._clearActiveWidgetsTimer) {
				clearTimeout(this._clearActiveWidgetsTimer);
			}

			if (now < lastTouchOrFocusin + 100) {
				// This blur event is coming late (after the call to _onTouchNode() rather than before.
				// So let _onTouchNode() handle setting the widget stack.
				// See https://bugs.dojotoolkit.org/ticket/17668
				return;
			}

			// If the blur event isn't followed (or preceded) by a focus or touch event, mark all widgets as inactive.
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
			lastTouchOrFocusin = (new Date()).getTime();

			if (this._clearActiveWidgetsTimer) {
				// forget the recent blur event
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
					if (node._popupParent) {
						node = node._popupParent;
					} else if (node.tagName && node.tagName.toLowerCase() === "body") {
						// is this the root of the document or just the root of an iframe?
						if (node === document.body) {
							// node is the root of the main document
							break;
						}
						// otherwise, find the iframe this node refers to (can't access it via parentNode,
						// need to do this trick instead). window.frameElement is supported in IE/FF/Webkit
						node = node.ownerDocument.defaultView.frameElement;
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
		 * Callback when node is focused.
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

			// Keep track of time of last focusin event.
			lastFocusin = (new Date()).getTime();

			// There was probably a blur event right before this event, but since we have a new focus,
			// forget about the blur
			if (this._clearFocusTimer) {
				clearTimeout(this._clearFocusTimer);
				delete this._clearFocusTimer;
			}

			this._onTouchNode(node);
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

			this.activeStack = newStack;
			this.emit("active-widget-stack", newStack);

			var widget, i;

			// for all elements that have gone out of focus, set focused=false
			for (i = lastOldIdx; i >= 0 && oldStack[i] !== newStack[i]; i--) {
				widget = oldStack[i];
				if (widget) {
					widget.focused = false;
					if (widget._onBlur) {
						widget._onBlur();
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
