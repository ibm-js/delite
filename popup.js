/**
 * Show drop downs (ex: the select list of a ComboBox) or popups (ex: right-click context menus).
 * @module delite/popup
 */
define([
	"dcl/dcl",
	"resize-observer-polyfill/dist/ResizeObserver",
	"ibm-decor/sniff",
	"./DialogUnderlay",
	"./on",
	"./place",
	"./scrollIntoView",
	"./Viewport"
], function (
	dcl,
	ResizeObserver,
	has,
	DialogUnderlay,
	on,
	place,
	scrollIntoView,
	Viewport
) {
	var mobile = has("ios") || has("android");

	function isDocLtr (doc) {
		return !(/^rtl$/i).test(doc.body.dir || doc.documentElement.dir);
	}

	/**
	 * Dispatched on a popup after the popup is shown.
	 * @event module:delite/popup#popup-after-show
	 */

	/**
	 * Dispatched on a popup before it's hidden.
	 * @event module:delite/popup#popup-before-hide
	 */

	/**
	 * Dispatched before popup widget is shown.
	 * @example
	 * document.addEventListener("delite-before-show", function (evt) {
	 *      console.log("about to show popup", evt.child);
	 * });
	 * @event module:delite/popup#delite-before-show
	 * @property {Element} child - reference to popup
	 */

	/**
	 * Dispatched after popup widget is shown.
	 * @example
	 * document.addEventListener("delite-after-show", function (evt) {
	 *      console.log("just displayed popup", evt.child);
	 * });
	 * @event module:delite/popup#delite-after-show
	 * @property {Element} child - reference to popup
	 */

	/**
	 * Dispatched before popup widget is hidden.
	 * @example
	 * document.addEventListener("delite-before-hide", function (evt) {
	 *      console.log("about to hide popup", evt.child);
	 * });
	 * @event module:delite/popup#delite-before-hide
	 * @property {Element} child - reference to popup
	 */

	/**
	 * Dispatched after popup widget is hidden.
	 * @example
	 * document.addEventListener("delite-after-hide", function (evt) {
	 *      console.log("just hid popup", evt.child);
	 * });
	 * @event module:delite/popup#delite-after-hide
	 * @property {Element} child - reference to popup
	 */

	/**
	 * Dispatched on a popup after the popup is shown or when it is repositioned
	 * due to the size of its content changing.
	 * @event module:delite/popup#popup-after-position
	 * @property {string} aroundCorner - Corner of the anchor node, one of:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {string} nodeCorner - Corner of the popup node, one of:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {Object} size - `{w: 20, h: 30}` type object specifying size of the popup.
	 */

	/**
	 * Dispatched on a popup after the popup is repositioned
	 * due to the size of its content changing.
	 * TODO: remove this?
	 * @event module:delite/popup#delite-repositioned
	 */

	/**
	 * Arguments to `delite/popup#open()` method.
	 * @typedef {Object} module:delite/popup.OpenArgs
	 * @property {module:delite/Widget} popup - The Widget to display.
	 * @property {module:delite/Widget} parent - The button etc. that is displaying this popup.
	 * @property {Element|Rectangle} around - DOM node (typically a button);
	 * place popup relative to this node.  (Specify this *or* `x` and `y` properties.)
	 * @property {number} x - Absolute horizontal position (in pixels) to place node at.
	 * (Specify this *or* `around` parameter.)
	 * @property {number} y - Absolute vertical position (in pixels) to place node at.
	 * (Specify this *or* `around` parameter.)
	 * @property {string[]} orient - When the `around` parameter is specified, `orient` should be a
	 * list of positions to try, ex. `[ "below", "above" ]`
	 * `delite/popup.open()` tries to position the popup according to each specified position, in order,
	 * until the popup appears fully within the viewport.  The default value is `["below", "above"]`.
	 * When an `(x,y)` position is specified rather than an `around` node, `orient` is either
	 * "R" or "L".  R (for right) means that it tries to put the popup to the right of the mouse,
	 * specifically positioning the popup's top-right corner at the mouse position, and if that doesn't
	 * fit in the viewport, then it tries, in order, the bottom-right corner, the top left corner,
	 * and the top-right corner.
	 *
	 * Alternately, `orient` can be an array `["center"]`, which pops up the specified node in the center of
	 * the viewport, like a dialog.  It will shrink the size of the node if necessary, in which case the node
	 * must be designed so that scrolling occurs in the right place.
	 *
	 * @property {Function} beforeSize - Callback before setting the popup height, called both when popup initially
	 * shown and when screen resized.
	 *
	 * @property {Function} onCancel - Callback when user has canceled the popup by:
	 *
	 * 1. hitting ESC or TAB key
	 * 2. using the popup widget's proprietary cancel mechanism (like a cancel button in a dialog),
	 * causing the widget to emit a "cancel" event
	 *
	 * @property {Function} onExecute - Callback when user has executed the popup
	 * by using the popup widget's proprietary execute mechanism (like an OK button in a dialog, or clicking a choice
	 * in a dropdown list), causing the widget to emit an "execute" or "change" event.
	 * @property {Function} onClose - Callback whenever this popup is closed.
	 * @property {Position} padding - Adding a buffer around the opening position.
	 * This is only used when `around` is not set.
	 * @property {number} maxHeight - The maximum height for the popup.
	 * Any popup taller than this will have scroll bars.
	 * Set to `Infinity` for no max height.  Default is to limit height to available space in viewport,
	 * above or below the `aroundNode` or specified `x/y` position.
	 * @property {boolean} underlay - If true, put a DialogUnderlay underneath this popup so that it can't be
	 * closed by clicking on a blank part of the screen.
	 */

	// TODO: convert from singleton to just a hash of functions; easier to doc that way.

	var PopupManager = dcl(/** @lends module:delite/popup */ {
		/**
		 * Stack of information about currently popped up widgets.
		 * See `open()` method to see the properties set in each Object in this stack (widget, etc)
		 * (someone opened _stack[0], and then it opened _stack[1], etc.)
		 * @member {*} PopupManager._stack
		 */
		_stack: [],

		/**
		 * Z-index of the first popup.   (If first popup opens other popups they get a higher z-index.)
		 * @member {number} PopupManager._beginZIndex
		 */
		_beginZIndex: 1000,

		_idGen: 1,

		constructor: function () {
			// Monitor resize of the viewport and scrolling of any node (including the document itself).
			// Any of these events could require repositioning and resizing.
			Viewport.on("resize", function () {
				this._repositionAll(true);
				this._lastResize = new Date();
			}.bind(this));

			document.addEventListener("scroll", function () {
				if ((new Date()) - this._lastResize < 500) {
					// Treat scroll events right after a resize like resize events.  Because iOS fires scroll events as
					// it does automatic scrolling after the virtual keyboard pops up
					this._repositionAll(true);
				} else {
					// Close dropdowns where the user has scrolled the anchor node out of view,
					// so that they aren't hanging in mid-air.
					this._closeScrolledOutOfView();

					// But avoid closing the dropdown when a user was scrolling inside it and then reaches the end,
					// and inadvertently scrolls the main page or containing <div>.  Instead, reposition the dropdown.
					this._repositionAll();
				}
			}.bind(this), true);
		},

		/**
		 * Test if element is fully or partially visible.  Only checks scrolling on y-axis. Based loosely on
		 * https://stackoverflow.com/questions/487073/how-to-check-if-element-is-visible-after-scrolling.
		 * @param element
		 * @returns {boolean}
		 */
		isVisibleY: function (element) {
			var elRect = element.getBoundingClientRect(),
				elTop = elRect.top,
				elBottom = elRect.bottom;

			// Check if element out of viewport.
			var viewport = Viewport.getEffectiveBox();
			if (elBottom < 0 || elTop >= viewport.h) {
				return false;
			}

			// Check if element hidden by containing <div>'s.
			var body = element.ownerDocument.body;
			for (var container = element.parentNode; container !== body; container = container.parentNode) {
				var containerRect = container.getBoundingClientRect();
				if ((elTop > containerRect.bottom || elBottom <= containerRect.top) &&
					getComputedStyle(container).overflowY !== "visible") {
					return false;
				}
			}

			return true;
		},

		/**
		 * Close dropdowns where user has scrolled anchor out of view.  Touching a scrollbar (outside of a dropdown)
		 * closes it, but this is about scrolling on mobile, or via trackpad or mousewheel.
		 */
		_closeScrolledOutOfView: function () {
			for (var i = 0; i < this._stack.length; i++) {
				var args = this._stack[i];
				if (args.around && !this.isVisibleY(args.around)) {
					this.close(args.popup);
					break;
				}
			}
		},

		/**
		 * Reposition all the popups. It may need to be called when popup's content changes,
		 * when the anchornode has moved, or when the viewport has been resized.
		 * Handles both centered popups and dropdowns.
		 * @param {boolean} scroll - Scroll elements so that anchors and focused node are in view.
		 * @private
		 * @fires module:delite/popup#delite-repositioned
		 */
		_repositionAll: function (scroll) {
			if (this._repositioning) {
				return;
			}
			this._repositioning = true;

			this._stack.forEach(function (args) {
				// Anchor node must be in view, otherwise the popup/dropdown appears to be hanging in mid-air.
				if (scroll && args.around) {
					scrollIntoView(args.around);
				}

				this._size(args);
				this._position(args);

				// If the resizing (or repositioning) scrolled the active element out of view, then fix it.
				// Use scrollIntoView() because it does minimal scrolling (and only scrolls if necessary),
				// unlike iOS's native scrollIntoView() method.
				if (scroll && args.popup.contains(document.activeElement)) {
					scrollIntoView(document.activeElement);
				}

				on.emit(args.popup, "delite-repositioned", {args: args});
			}, this);

			this._repositioning = false;
		},

		/**
		 * Initialization for widgets that will be used as popups.
		 * @param {module:delite/Widget} widget
		 * @private
		 */
		initializeAsPopup: function (widget) {
			widget.classList.add("d-popup");
			widget.style.display = "none";
			if (!widget.parentNode) {
				widget.ownerDocument.body.appendChild(widget);
			}

			// Popups should be position:absolute or position: fixed to get the correct width,
			// and to not affect the height of the aroundNode.  Set position before _size() measures
			// sizes of aroundNode.
			widget.style.position = "absolute";
		},

		/**
		 * Moves the popup widget off-screen.  Do not use this method to hide popups when not in use, because
		 * that will create an accessibility issue: the offscreen popup will still be in the tabbing order.
		 * @param {module:delite/Widget} widget
		 * @returns {HTMLElement}
		 */
		moveOffScreen: function (widget) {
			this.initializeAsPopup(widget);
			widget.style.display = "";
			widget.classList.add("d-offscreen");
			return widget;
		},

		/**
		 * Detach specified popup widget from document
		 * @param {module:delite/Widget} widget
		 */
		detach: function (widget) {
			if (widget.parentNode) {
				widget.parentNode.removeChild(widget);
			}
		},

		/**
		 * Hide this popup widget (until it is ready to be shown).
		 * Initialization for widgets that will be used as popups.
		 *
		 * If popup widget needs to do javascript layout it should do so when it is made visible,
		 * and popup._onShow() is called.
		 * @param {module:delite/Widget} widget
		 */
		hide: function (widget) {
			widget.emit("popup-before-hide", {
				bubbles: false
			});

			this.initializeAsPopup(widget);

			widget.style.display = "none";
			widget.style.height = "auto";		// Open may have limited the height to fit in the viewport
		},

		/**
		 * Compute the closest ancestor popup that's *not* a child of another popup.
		 * Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
		 * @returns {module:delite/Widget}
		 */
		getTopPopup: function () {
			var stack = this._stack, pi;
			for (pi = stack.length - 1; pi > 0 && stack[pi].parent === stack[pi - 1].popup; pi--) {
				/* do nothing, just trying to get right value for pi */
			}
			return stack[pi];
		},

		/**
		 * Popup the widget at the specified position.
		 *
		 * Note that whatever widget called delite/popup.open() should also require activationTracker and listen for
		 * delite-deactivated event to know that focus has moved somewhere
		 * else and thus the popup should be closed.
		 *
		 * @param {module:delite/popup.OpenArgs} args
		 * @returns {*} If orient !== center then returns the alignment of the popup relative to the anchor node.
		 * @example
		 * // Open at the mouse position
		 * popup.open({popup: menuWidget, x: evt.pageX, y: evt.pageY});
		 * @example
		 * // Open the widget as a dropdown
		 * popup.open({parent: this, popup: menuWidget, around: this, onClose: function(){...}});
		 */
		open: function (args) {
			// Make copy of args so we don't modify original struct.
			args = Object.create(args);

			var eventNode = args.parent || document.body,
				popup = args.popup;

			on.emit(eventNode, "delite-before-show", {
				child: popup,
				cancelable: false
			});

			// Anchor node must be in view, otherwise the popup/dropdown could appear off screen, or hanging in mid-air.
			if (args.around) {
				scrollIntoView(args.around);
			}

			// Size and position the popup.
			this._prepareToOpen(args);
			this._size(args, true);
			var position = this._position(args);
			this._afterOpen(args);

			// For modal popups, set aria-hidden on all the nodes that aren't the popup, so that VoiceOver doesn't
			// navigate to those nodes.  Don't do this for tooltips (that don't get focus).  Differentiate between
			// modals vs. tooltips by detecting if focus goes into the popup.  Note that checking for dropDown.focus
			// is unreliable because even unfocusable nodes may have a focus() method, inherited from HTMLElement.
			args.hiddenNodes = [];
			if (mobile) {
				var focusinListener = args.focusinListener = popup.on("focusin", function () {
					focusinListener.remove();
					focusinListener = args.focusinListener = null;

					function pruneAriaVisibleNodes (branch) {
						if (branch === args.around || branch === popup) {
							return;
						} else if (branch.contains(popup)) {
							Array.prototype.forEach.call(branch.children, pruneAriaVisibleNodes);
						} else {
							if (!branch.hasAttribute("aria-hidden")) {
								branch.setAttribute("aria-hidden", "true");
								branch.style.pointerEvents = "none";
								args.hiddenNodes.push(branch);
							}
						}
					}
					pruneAriaVisibleNodes(popup.ownerDocument.body);
				});
			}

			// Emit event on popup.
			args.popup.emit("popup-after-show", {
				around: args.around,
				bubbles: false
			});

			on.emit(eventNode, "delite-after-show", {
				child: popup,
				cancelable: false
			});

			return position;
		},

		/**
		 * Do the work to display a popup widget, except for positioning.
		 * @param {module:delite/popup.OpenArgs} args
		 * @returns {*}
		 * @private
		 */
		_prepareToOpen: function (args) {
			var stack = this._stack,
				widget = args.popup,
				around = args.around;

			// Generate id for popup if it doesn't already have one.
			if (!widget.id) {
				widget.id = around && around.id ? around.id + "_dropdown" : "popup_" + this._idGen++;
			}

			// If we are opening a new popup that isn't a child of a currently opened popup, then
			// close currently opened popup(s).   This should happen automatically when the old popups
			// gets the delite-activated event, except that event isn't reliable on IE, see [22198].
			// TODO: check if this code still needed for delite
			while (stack.length && (!args.parent || !stack[stack.length - 1].popup.contains(args.parent))) {
				this.close(stack[stack.length - 1].popup);
			}

			this.initializeAsPopup(widget);

			widget.style.zIndex = this._beginZIndex + stack.length * 2;   // *2 leaves z-index slot for DialogUnderlay
			widget._popupParent = args.parent ? args.parent : null;
			widget.style.position = "absolute";		// avoid flicker due to popup pushing down other content
			widget.style.display = "";
			widget.style.visibility = "visible";	// counteract effects from HasDropDown
		},

		/**
		 * Setup handlers to detect size change, keypresses, etc.
		 * @param args
		 * @private
		 */
		_afterOpen: function (args) {
			var stack = this._stack,
				widget = args.popup;

			var handlers = [];

			// provide default escape and tab key handling
			// (this will work for any widget, not just menu)
			handlers.push(widget.on("keydown", function (evt) {
				if ((evt.key === "Escape" || evt.key === "Tab") && args.onCancel) {
					evt.stopPropagation();
					evt.preventDefault();
					args.onCancel();
				}
			}));

			// Watch for cancel/execute events on the popup and notify the caller.
			// Simple widgets like a Calendar will emit "change" events, whereas complex widgets like
			// a TooltipDialog/Menu will emit "execute" events.  No way to tell which event the widget will
			// emit, so listen for both.
			if (args.onCancel) {
				handlers.push(widget.on("cancel", args.onCancel));
			}
			if (args.onExecute) {
				handlers.push(widget.on("execute", args.onExecute));
				handlers.push(widget.on("change", function (event) {
					// Ignore change events from nodes inside the widget (for example, typing into an <input>),
					// but if the widget itself emits a change event then...
					if (event.target === widget) {
						args.onExecute();
					}
				}));
			}

			// Handle size changes due to added/removed DOM or changed attributes,
			// including changes that happen gradually due to animations.
			var oldClassName = widget.className;
			var classChangeObserver = new MutationObserver(function () {
				// If class has changed, then recompute maxHeight etc.
				if (widget.className !== oldClassName) {
					this._size(args);
					oldClassName = widget.className;
				}

				// Ignore notifications due to what happened in this method.
				classChangeObserver.takeRecords();
			}.bind(this));
			classChangeObserver.observe(widget, {
				attributes: true
			});

			var oldHeight = widget.offsetHeight,
				oldWidth = widget.offsetWidth;
			var sizeChangeObserver = new ResizeObserver(function () {
				var newHeight = widget.offsetHeight,
					newWidth = widget.offsetWidth;

				if (newHeight !== oldHeight || newWidth !== oldWidth) {
					oldHeight = newHeight;
					oldWidth = newWidth;
					this._repositionAll();
				}
			}.bind(this));
			sizeChangeObserver.observe(widget);

			handlers.push({
				remove: function () {
					classChangeObserver.disconnect();
					sizeChangeObserver.disconnect();
				}
			});

			// Stop recentering dialogs that the user has dragged or resized.
			handlers.push(
				widget.on("delite-dragged", function (evt) {
					if (evt.target === widget) {
						args.dragged = true;
					}
				}),
				widget.on("delite-manually-resized", function (evt) {
					if (evt.target === widget) {
						args.resized = true;
					}
				})
			);

			args.handlers = handlers;

			stack.push(args);
		},

		/**
		 * Size or resets the minHeight, maxHeight, minWidth, and maxWidth of the popup specified by args.
		 * @param {module:delite/popup.OpenArgs} args
		 * @returns {*} If orient !== center then returns the alignment of the popup relative to the anchor node.
		 * @private
		 */
		_size: function (args) {
			var widget = args.popup,
				around = args.around,
				orient = this._getOrient(args),
				viewport = Viewport.getEffectiveBox();

			if (args.beforeSize) {
				args.beforeSize();
			}

			if (orient[0] === "center") {
				// Limit height and width so popup fits within viewport.
				var minSize = typeof widget.getMinSize === "function" && widget.getMinSize();
				if (minSize) {
					widget.style.minHeight = minSize.h + "px";
					widget.style.minWidth = minSize.w + "px";
				} else {
					widget.style.removeProperty("min-height");
					widget.style.removeProperty("min-width");
				}

				var maxSize = typeof widget.getMaxSize === "function" ? widget.getMaxSize() :
					this.getMaxCenteredPopupSize(widget);
				widget.style.maxHeight = maxSize.h + "px";
				widget.style.maxWidth = maxSize.w + "px";
			} else {
				// Limit height to space available in viewport either above or below aroundNode (whichever side has
				// more room).  This may make the popup widget display a scrollbar (or multiple scrollbars).
				var maxHeight;
				if ("maxHeight" in args && args.maxHeight !== -1) {
					maxHeight = args.maxHeight;
				} else {
					// Get aroundNode position, doing correction if iOS auto-scroll has moved it off screen.
					var aroundPos = around ? around.getBoundingClientRect() : {
						top: args.y - (args.padding || 0),
						height: (args.padding || 0) * 2
					};
					var aroundPosTop = Math.max(aroundPos.top, 0);
					var aroundPosBottom = Math.max(aroundPos.top + aroundPos.height, 0);

					maxHeight = Math.floor(Math.max(aroundPosTop, viewport.h - aroundPosBottom));
				}

				var cs = getComputedStyle(widget),
					verticalMargin = parseFloat(cs.marginTop) + parseFloat(cs.marginBottom);

				widget.style.maxHeight = maxHeight - verticalMargin + "px";
			}
		},

		/**
		 * Return the default maximum size allowed for a centered popup,
		 * presumably based on the viewport size.  Used to control how much margin is
		 * displayed between the popup border and the edges of the viewport.
		 */
		getMaxCenteredPopupSize: function () {
			var viewport = Viewport.getEffectiveBox();
			return  {
				w: Math.floor(viewport.w * 0.9),
				h: Math.floor(viewport.h * 0.9)
			};
		},

		/**
		 * Get the array of orientations to try based on hash passed to open().
		 */
		_getOrient: function (args) {
			return typeof args.orient === "function" ? args.orient() :
				(args.orient || ["below", "below-alt", "above", "above-alt"]);
		},

		/**
		 * Position the popup specified by args.
		 * @param args
		 * @returns {*} If orient !== center then returns the alignment of the popup relative to the anchor node.
		 * @private
		 */
		_position: function (args) {
			var widget = args.popup,
				around = args.around,
				orient = this._getOrient(args),
				ltr = args.parent ? args.parent.effectiveDir !== "rtl" : isDocLtr(widget.ownerDocument),
				position;

			widget.classList.remove("d-offscreen");

			if (orient[0] === "center") {
				if (!args.dragged && !args.resized) {
					place.center(widget);
					widget.emit("popup-after-position");
				}
			} else {
				position = around ?
					place.around(widget, around, orient, ltr) :
					place.at(widget, args, orient === "R" ? ["TR", "BR", "TL", "BL"] : ["TL", "BL", "TR", "BR"],
						args.padding);

				// Emit event telling popup that it was [re]positioned.
				var event = Object.create(position);
				event.around = around;
				widget.emit("popup-after-position", event);
			}

			// Setup underlay for popups that want one.  By default it's done for centered popups,
			// but args can explicitly specify underlay=true or underlay=false.
			if (args.underlay !== undefined ? args.underlay : (orient[0] === "center")) {
				DialogUnderlay.showFor(widget);
			} else {
				DialogUnderlay.hideFor(widget);
			}

			return position;
		},

		/**
		 * If the specified widget is fully or partially offscreen, bring it fully into view.
		 * Only works for dialogs, i.e. for widgets that were originally centered using position:fixed.
		 * @param widget
		 */
		moveFullyIntoView: function (widget) {
			var viewport = Viewport.getEffectiveBox(),
				bcr = widget.getBoundingClientRect(),
				curTop = parseFloat(widget.style.top),
				curLeft = parseFloat(widget.style.left),
				maxTop = Math.max(viewport.h - bcr.height, 0),
				maxLeft = Math.max(viewport.w - bcr.width, 0);

			if (curTop < 0 || curTop > maxTop || curLeft < 0 || curLeft > maxLeft) {
				var top = Math.min(Math.max(curTop, 0), maxTop),
					left = Math.min(Math.max(curLeft, 0), maxLeft);
				widget.style.top = top  + "px";
				widget.style.left = left + "px";

				widget.emit("popup-after-position");
			}
		},

		/**
		 * Close specified popup and any popups that it parented.  If no popup is specified, closes all popups.
		 * @param {module:delite/Widget} [popup]
		 */
		close: function (popup, beforeClose) {
			var stack = this._stack;

			// Basically work backwards from the top of the stack closing popups
			// until we hit the specified popup, but IIRC there was some issue where closing
			// a popup would cause others to close too.  Thus if we are trying to close B in [A,B,C]
			// closing C might close B indirectly and then the while() condition will run where stack===[A]...
			// so the while condition is constructed defensively.
			while ((popup && stack.some(function (elem) {
				return elem.popup === popup;
			})) ||
				(!popup && stack.length)) {
				var top = stack.pop(),
					widget = top.popup,
					onClose = top.onClose,
					focusinListener = top.focusinListener,
					hiddenNodes = top.hiddenNodes,
					eventNode = top.parent || document.body;

				var h;
				while ((h = top.handlers.pop())) {
					h.remove();
				}

				// Remove aria-hidden on background nodes.
				if (focusinListener) {
					focusinListener.remove();
				}
				hiddenNodes.forEach(function (node) {
					node.removeAttribute("aria-hidden");
					node.style.pointerEvents = "";
				});

				// Give caller a chance to focus somewhere else before popup closes, but after aria-hidden
				// attributes removed.
				if (beforeClose) {
					beforeClose();
				}

				on.emit(eventNode, "delite-before-hide", {
					child: widget,
					cancelable: false
				});

				// Hide the widget.
				this.hide(widget);
				DialogUnderlay.hideFor(widget);

				on.emit(eventNode, "delite-after-hide", {
					child: widget,
					cancelable: false
				});

				if (onClose) {
					onClose();
				}
			}
		}
	});

	return new PopupManager();
});
