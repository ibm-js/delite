/**
 * Tracks which nodes are currently "active".
 * A node is considered active if it or a descendant node has focus,
 * or if a non-focusable descendant was the most recent node
 * to get a touchstart/mousedown/pointerdown event.
 *
 * Emits non-bubbling `delite-activated` and `delite-deactivated` events on nodes
 * as they become active, or stop being active, as defined above.
 *
 * Call `activationTracker.on("active-stack", callback)` to track the stack of currently active nodes.
 *
 * Call `activationTracker.on("deactivated", func)` or `activationTracker.on("activated", ...)` to monitor when
 * when nodes become active/inactive.
 *
 * ActivationTracker also provides infrastructure for opening/closing popups merely by hovering/unhovering
 * a button.  Emits `delite-hover-activated` event on nodes that are hovered for `hoverDelay`
 * milliseconds, and emits `delite-hover-deactivated` event after a node
 * and its descendants (ex: DropDownButton's descendant is a Tooltip)
 * have been unhovered for `hoverDelay` milliseconds.  If the user unhovers a node and then re-hovers within
 * `hoverDelay` milliseconds, there's no `delite-hover-deactivated` event.
 *
 * TO IMPLEMENT: Generally, there is a delay between hovering a node and the "delite-hover-activated" event, and
 * if the user hovers a node and then unhovers within the delay, there's no "delite-hover-activated"
 * event.  However, clicking a node sends the "delite-hover-activated" event to it (and its ancestors)
 * immediately.
 *
 * TO IMPLEMENT: Make clicking a blank area of the screen cause immediate delite-hover-deactivated events
 * for nodes with running timers.  Likewise for keyboard click.
 *
 * TO IMPLEMENT: Similarly, waive the delay if there is already a popup open and then the user hovers
 * another button that shows a popup on hover.  To achieve this, all nodes that show a popup
 * on the "delite-hover-activated" event must be marked with the attribute "hover-shows-popup".
 * TODO: How to tell if another popup is opened?  It might have been opened by clicking rather than
 * by hover.  Or do we care about that case?
 *
 * TO IMPLEMENT: Remember whether popup was opened due to a hover event or a click event.  If it was opened
 * due to a click event then it shouldn't close until another click.
 *
 * @module delite/activationTracker
 * */
define([
	"dcl/advise",
	"dcl/dcl",
	"requirejs-dplugins/jquery!attributes/classes",	// hasClass()
	"decor/Evented",
	"./on",
	"dpointer/events",		// so can just monitor for "pointerdown"
	"requirejs-domready/domReady!"
], function (advise, dcl, $, Evented, on) {

	// Time of the last touch/mouse and focusin events
	var lastPointerDownTime;
	var lastFocusinTime;

	// Last node that got pointerdown or focusin event, and the time it happened.
	var lastPointerDownOrFocusInNode;
	var lastPointerDownOrFocusInTime;

	var ActivationTracker = dcl(Evented, /** @lends module:delite/activationTracker */ {
		/**
		 * Amount of time in milliseconds after a node is hovered to send the delite-hover-activated event,
		 * and likewise the amount of time after a node is unhovered before sending the
		 * delite-hover-deactivated event.
		 */
		hoverDelay: 500,

		/**
		 * List of currently active nodes (focused node and its ancestors).
		 * @property {Element[]} activeStack
		 */
		activeStack: [],

		/**
		 * Currently hovered nodes and its ancestors.
		 * @property {Element[]} hoverStack
		 */
		hoverStack: [],

		/**
		 * Registers listeners on the specified window to detect when the user has
		 * touched / mouse-downed / focused somewhere.  This is called automatically.
		 *
		 * @param {Window} [targetWindow]
		 * @returns {Object} Handle with `remove()` method to deregister.
		 * @private
		 */
		registerWin: function (targetWindow) {
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

				lastPointerDownTime = (new Date()).getTime();

				_this._pointerDownOrFocusHandler(evt.target, "mouse");
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

				_this._focusHandler(evt.target);
			}

			function blurHandler(evt) {
				_this._blurHandler(evt.target);
			}

			function mouseOverHandler(evt) {
				_this._mouseOverHandler(evt.target);
			}

			if (body) {
				// Listen for touches or mousedowns.
				body.addEventListener("pointerdown", pointerDownHandler, true);
				body.addEventListener("focus", focusHandler, true);	// need true since focus doesn't bubble
				body.addEventListener("blur", blurHandler, true);	// need true since blur doesn't bubble
				body.addEventListener("mouseover", mouseOverHandler);

				return {
					remove: function () {
						body.removeEventListener("pointerdown", pointerDownHandler, true);
						body.removeEventListener("focus", focusHandler, true);
						body.removeEventListener("blur", blurHandler, true);
						body.addEventListener("mouseover", mouseOverHandler);
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
		_blurHandler: function (node) { // jshint unused: vars
			var now = (new Date()).getTime();

			// IE9+ and chrome have a problem where focusout events come after the corresponding focusin event.
			// For chrome problem see https://bugs.dojotoolkit.org/ticket/17668.
			// IE problem happens when moving focus from the Editor's <iframe> to a normal DOMNode.
			if (now < lastFocusinTime + 100) {
				return;
			}

			// Unset timer to zero-out widget stack; we'll reset it below if appropriate.
			if (this._clearActiveWidgetsTimer) {
				clearTimeout(this._clearActiveWidgetsTimer);
			}

			if (now < lastPointerDownOrFocusInTime + 500) {
				// This blur event is coming late (after the call to _pointerDownOrFocusHandler() rather than before.
				// So let _pointerDownOrFocusHandler() handle setting the widget stack.
				// See https://bugs.dojotoolkit.org/ticket/17668
				return;
			}

			// If the blur event isn't followed (or preceded) by a focus or pointerdown event,
			// mark all widgets as inactive.
			this._clearActiveWidgetsTimer = setTimeout(function () {
				delete this._clearActiveWidgetsTimer;
				this._setStack([]);
			}.bind(this), 0);
		},

		/**
		 * Given a node, return the stack of nodes starting with <body> and ending with that node.
		 * @param {Element} node
		 * @param {boolean} byKeyboard - node was navigated to by keyboard rather than mouse
		 * @private
		 */
		_getStack: function (node, byKeyboard) {
			var stack = [];

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
						// Ignore clicks/hovers on disabled widgets (actually focusing a disabled widget still works,
						// to support MenuItem).
						if (node.disabled && !byKeyboard) {
							stack = [];
						} else {
							stack.unshift(node);
						}
						node = node.parentNode;
					}
				}
			} catch (e) { /* squelch */
			}

			return stack;
		},

		/**
		 * Callback when node is focused or pointerdown'd.
		 * @param {Element} node - The node.
		 * @param {string} by - "mouse" if the focus/pointerdown was caused by a mouse down event.
		 * @private
		 */
		_pointerDownOrFocusHandler: function (node, by) {
			if (this._clearActiveWidgetsTimer) {
				// forget the recent blur event
				clearTimeout(this._clearActiveWidgetsTimer);
				delete this._clearActiveWidgetsTimer;
			}

			// Compute stack of active widgets ending at node (ex: ComboButton --> Menu --> MenuItem).
			var newStack = this._getStack(node, by !== "mouse");

			this._setStack(newStack, by);

			// Keep track of most recent focusin or pointerdown event.
			lastPointerDownOrFocusInTime = (new Date()).getTime();
			lastPointerDownOrFocusInNode = node;
		},

		/**
		 * Callback when node is focused.
		 * @param {Element} node
		 * @private
		 */
		_focusHandler: function (node) {
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
			lastFocusinTime = (new Date()).getTime();

			// Also, if clicking a node causes its ancestor to be focused, ignore the focus event.
			// Example in the activationTracker.html functional test on IE, where clicking the spinner buttons
			// focuses the <fieldset> holding the spinner.
			if ((new Date()).getTime() < lastPointerDownTime + 100 &&
					node.contains(lastPointerDownOrFocusInNode.parentNode)) {
				return;
			}

			// There was probably a blur event right before this event, but since we have a new focus,
			// forget about the blur
			if (this._clearFocusTimer) {
				clearTimeout(this._clearFocusTimer);
				delete this._clearFocusTimer;
			}

			this._pointerDownOrFocusHandler(node);
		},

		/**
		 * The stack of active nodes has changed.  Send out appropriate events and record new stack.
		 * @param {Element} newStack - Array of nodes, starting from the top (outermost) node.
		 * @param {string} by - "mouse" if the focus/pointerdown was caused by a mouse down event.
		 * @private
		 */
		_setStack: function (newStack, by) {
			var oldStack = this.activeStack, lastOldIdx = oldStack.length - 1, lastNewIdx = newStack.length - 1;

			if (newStack[lastNewIdx] === oldStack[lastOldIdx]) {
				// no changes, return now to avoid spurious notifications about changes to activeStack
				return;
			}

			this.activeStack = newStack;
			this.emit("active-stack", newStack);

			var node, i;

			// for all elements that have become deactivated
			for (i = lastOldIdx; i >= 0 && oldStack[i] !== newStack[i]; i--) {
				node = oldStack[i];
				on.emit(node, "delite-deactivated", {bubbles: false, by: by});
				this.emit("deactivated", node, by);
			}

			// for all elements that have become activated
			for (i++; i <= lastNewIdx; i++) {
				node = newStack[i];
				on.emit(node, "delite-activated", {bubbles: false, by: by});
				this.emit("activated", node, by);
			}
		},

		/**
		 * React to when a new node is hovered.  If a node is hovered long enough it
		 * will get a `delite-hover-activated` event, and if it and its descendants (ex:
		 * DropDownButton's descendant Tooltip) lose hover for long enough, it will get a
		 * `delite-hover-deactivated` event.
		 * @private
		 */
		_mouseOverHandler: function (node) {
			var oldStack = this.hoverStack, lastOldIdx = oldStack.length - 1;
			var newStack = this.hoverStack = this._getStack(node), lastNewIdx = newStack.length - 1;
			var i;

			// For all elements that have left the hover chain, stop timer to
			// send those elements delite-hover-activated event, or start timer to send
			// those elements delite-hover-deactivated event.
			for (i = lastOldIdx; i >= 0 && oldStack[i] !== newStack[i]; i--) {
				this.onNodeLeaveHoverStack(oldStack[i]);
			}

			// For all elements that have become hovered, start timer to send
			// those elements delite-hover-activated event, or clear timer to send
			// delite-hover-deactivated event.
			for (i++; i <= lastNewIdx; i++) {
				this.onNodeEnterHoverStack(newStack[i]);
			}
		},

		/**
		 * Called when a node enters the hover stack.
		 * @param {Element} hoveredNode
		 */
		onNodeEnterHoverStack: function (hoveredNode) {
			if (hoveredNode.hoverDeactivateTimer) {
				// This node previously got a delite-hover-activated event,
				// but didn't yet get a delite-hover-deactivated, so nothing really to do.
				clearTimeout(hoveredNode.hoverDeactivateTimer);
				delete hoveredNode.hoverDeactivateTimer;
			} else {
				// Set timer so that if node remains hovered, we send a delite-hover-activated event.
				hoveredNode.hoverActivateTimer = setTimeout(function () {
					delete hoveredNode.hoverActivateTimer;
					on.emit(hoveredNode, "delite-hover-activated", {bubbles: false});
				}.bind(this), this.hoverDelay);
			}
		},

		/**
		 * Called when a node leaves the hover stack.
		 * @param {Element} unhoveredNode
		 */
		onNodeLeaveHoverStack: function (unhoveredNode) {
			if (unhoveredNode.hoverActivateTimer) {
				// Node was hovered but it hadn't gotten a delite-hover-activated event yet, so nothing to do.
				clearTimeout(unhoveredNode.hoverActivateTimer);
				delete unhoveredNode.hoverActivateTimer;
			} else {
				// Set timer so that if node remains unhovered, we send a delite-hover-deactivated event.
				unhoveredNode.hoverDeactivateTimer = setTimeout(function () {
					delete unhoveredNode.hoverDeactivateTimer;
					unhoveredNode.hoverActivated = false;
					on.emit(unhoveredNode, "delite-hover-deactivated", {bubbles: false});
				}.bind(this), this.hoverDelay);
			}
		}
	});

	// Create singleton for top window
	var singleton = new ActivationTracker();
	singleton.registerWin(window);

	return singleton;
});
