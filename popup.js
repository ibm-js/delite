/**
 * Show drop downs (ex: the select list of a ComboBox) or popups (ex: right-click context menus).
 * @module delite/popup
 */
define([
	"dcl/advise",
	"dcl/dcl",
	"requirejs-dplugins/jquery!attributes/classes",	// addClass(), removeClass(), hasClass()
	"./BackgroundIframe",
	"./DialogUnderlay",
	"./features", // has("config-bgIframe")
	"./on",
	"./place",
	"./Viewport",
	"./theme!" // d-popup class
], function (advise, dcl, $, BackgroundIframe, DialogUnderlay, has, on, place, Viewport) {

	function isDocLtr(doc) {
		return !(/^rtl$/i).test(doc.body.dir || doc.documentElement.dir);
	}

	// Mysterious code to workaround iOS problem where clicking a button  below an input will just keep the input
	// focused.  Button gets pointerdown event but not click event.  Test case: popup.html, press "show centered dialog"
	// and first click the <input>, then click the <button> below it.
	document.addEventListener("pointerdown", function () {
		document.body.scrollTop = document.body.scrollTop;
	}, true);

	/**
	 * Dispatched on a popup after the popup is shown.
	 * @event module:delite/popup#popup-after-show
	 */

	/**
	 * Dispatched on a popup before it's hidden.
	 * @event module:delite/popup#popup-before-hide
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
	 */

	/**
	 * Function to destroy wrapper when popup widget is destroyed.
	 */
	function destroyWrapper() {
		if (this._popupWrapper) {
			this._popupWrapper.parentNode.removeChild(this._popupWrapper);
			delete this._popupWrapper;
		}
	}

	// TODO: convert from singleton to just a hash of functions; easier to doc that way.

	var PopupManager = dcl(null, /** @lends module:delite/popup */ {
		/**
		 * Stack of information about currently popped up widgets.
		 * See `open()` method to see the properties set in each Object in this stack (widget, wrapper, etc)
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
			Viewport.on("resize", this._repositionAll.bind(this));
			Viewport.on("scroll", this._viewportScrollHandler.bind(this));
		},

		/**
		 * We check for viewport scroll above, but this code checks for scrolling an inner `<div>`,
		 * thus moving the anchor node.  Using the scrollbar will close all the popups on the screen, but not
		 * if you scroll via a mousewheel or a mousepad double-finger gesture.
		 * @private
		 */
		_checkScroll: function () {
			if (this._firstAroundNode) {	// guard for when clearTimeout() on IE doesn't work
				var oldPos = this._firstAroundPosition,
					newPos = place.position(this._firstAroundNode),
					dx = newPos.x - oldPos.x,
					dy = newPos.y - oldPos.y;

				if (dx || dy) {
					this._firstAroundPosition = newPos;
					this._repositionAll();
				}

				this._aroundMoveListener = setTimeout(this._checkScroll.bind(this), dx || dy ? 10 : 50);
			}
		},

		/**
		 * Reposition all the popups. It may need to be called when popup's content changes.
		 * @param {boolean} measureSize force to calculate natural height and width of the popup.
		 * @private
		 * @fires module:delite/popup#delite-repositioned
		 */
		_repositionAll: function (measureSize) {
			this._stack.forEach(function (args) {
				this._size(args, measureSize);
				this._position(args);
				on.emit(args.popup, "delite-repositioned", {args: args});
			}, this);
		},

		/**
		 * Reposition [and resize] all the popups due to viewport scroll.  The main purpose of the function is to handle
		 * automatic scrolling on mobile from the keyboard popping up or when the browser tries to scroll the
		 * focused element to the upper part of the screen.
		 * @private
		 */
		_viewportScrollHandler: function () {
			this._stack.forEach(function (args) {
				this._size(args);
				this._position(args);
			}, this);
		},

		/**
		 * Initialization for widgets that will be used as popups.
		 * Puts widget inside a wrapper DIV (if not already in one), and returns pointer to that wrapper DIV.
		 * @param {module:delite/Widget} widget
		 * @returns {HTMLElement} The wrapper DIV.
		 * @private
		 */
		_createWrapper: function (widget) {
			var wrapper = widget._popupWrapper;
			if (!wrapper) {
				// Create wrapper <div> for when this widget [in the future] will be used as a popup.
				// This is done early because of IE bugs where creating/moving DOM nodes causes focus
				// to go wonky, see tests/robot/Toolbar.html to reproduce
				wrapper = widget.ownerDocument.createElement("div");
				wrapper.className = "d-popup";
				wrapper.style.display = "none";
				wrapper.setAttribute("role", "region");
				wrapper.setAttribute("aria-label", widget["aria-label"] || widget.label || widget.name || widget.id);
				widget.ownerDocument.body.appendChild(wrapper);

				wrapper.appendChild(widget);
				widget.connectedCallback();

				// Original popup widget might be hidden (so user doesn't see it prematurely).
				// Clear that CSS now.  The wrapper itself is hidden.
				if (widget.style.display === "none") {
					widget.style.display = "";
				}
				if (widget.style.visibility === "hidden") {
					widget.style.visibility = "";
				}
				$(widget).removeClass("d-hidden d-invisible d-offscreen");

				widget._popupWrapper = wrapper;
				advise.after(widget, "destroy", destroyWrapper);
			}

			return wrapper;
		},

		/**
		 * Moves the popup widget off-screen.  Do not use this method to hide popups when not in use, because
		 * that will create an accessibility issue: the offscreen popup will still be in the tabbing order.
		 * @param {module:delite/Widget} widget
		 * @returns {HTMLElement}
		 */
		moveOffScreen: function (widget) {
			// Create wrapper if not already there, then besides setting visibility:hidden,
			// move it out of the viewport, see #5776, #10111, #13604
			var wrapper = this._createWrapper(widget);
			wrapper.style.display = "";
			$(wrapper).addClass("d-offscreen");
			return wrapper;
		},

		/**
		 * Detach specified popup widget from document
		 * @param {module:delite/Widget} widget
		 */
		detach: function (widget) {
			if (widget._popupWrapper) {
				widget._popupWrapper.parentNode.removeChild(widget._popupWrapper);
				delete widget._popupWrapper;
				widget.disconnectedCallback();
			} else if (widget.parentNode) {
				widget.parentNode.removeChild(widget);
				widget.disconnectedCallback();
			}
		},

		/**
		 * Hide this popup widget (until it is ready to be shown).
		 * Initialization for widgets that will be used as popups.
		 *
		 * Also puts widget inside a wrapper DIV (if not already in one).
		 *
		 * If popup widget needs to layout it should do so when it is made visible,
		 * and popup._onShow() is called.
		 * @param {module:delite/Widget} widget
		 */
		hide: function (widget) {
			widget.emit("popup-before-hide");

			// Create wrapper if not already there
			var wrapper = this._createWrapper(widget);

			wrapper.style.display = "none";
			wrapper.style.height = "auto";		// Open may have limited the height to fit in the viewport
		},

		/**
		 * Compute the closest ancestor popup that's *not* a child of another popup.
		 * Ex: For a TooltipDialog with a button that spawns a tree of menus, find the popup of the button.
		 * @returns {module:delite/Widget}
		 */
		getTopPopup: function () {
			var stack = this._stack;
			for (var pi = stack.length - 1; pi > 0 && stack[pi].parent === stack[pi - 1].popup; pi--) {
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
			// Size and position the popup.
			this._prepareToOpen(args);
			this._size(args, true);
			var position = this._position(args);

			// Emit event on popup.
			args.popup.emit("popup-after-show", {
				around: args.around
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
			/* jshint maxcomplexity:12 */

			var stack = this._stack,
				widget = args.popup,
				around = args.around;

			// Generate id for popup if it doesn't already have one.
			if (!widget.id) {
				widget.id = args.around && args.around.id ? args.around.id + "_dropdown" : "popup_" + this._idGen++;
			}

			// If we are opening a new popup that isn't a child of a currently opened popup, then
			// close currently opened popup(s).   This should happen automatically when the old popups
			// gets the delite-activated event, except that event isn't reliable on IE, see [22198].
			// TODO: check if this code still needed for delite
			while (stack.length && (!args.parent || !stack[stack.length - 1].popup.contains(args.parent))) {
				this.close(stack[stack.length - 1].popup);
			}

			// Get pointer to popup wrapper, and create wrapper if it doesn't exist.  Remove display:none (but keep
			// off screen) so we can do sizing calculations.
			var wrapper = this.moveOffScreen(widget);

			var wrapperClasses = ["d-popup"];
			((widget.baseClass || "") + " " + widget.className).split(/ +/).forEach(function (cls) {
				if (cls) {
					wrapperClasses.push(cls + "-popup");
				}
			});
			wrapper.id = widget.id + "_wrapper";
			wrapper.className = wrapperClasses.join(" ");
			wrapper.style.zIndex = this._beginZIndex + stack.length * 2;   // *2 leaves z-index slot for DialogUnderlay
			wrapper._popupParent = args.parent ? args.parent : null;

			if (stack.length === 0 && around) {
				// First element on stack. Save position of aroundNode and setup listener for changes to that position.
				this._firstAroundNode = around;
				this._firstAroundPosition = place.position(around);
				this._aroundMoveListener = setTimeout(this._checkScroll.bind(this), 50);
			}

			if (has("config-bgIframe") && !widget.bgIframe) {
				// setting widget.bgIframe triggers cleanup in Widget.destroy()
				widget.bgIframe = new BackgroundIframe(wrapper);
			}

			wrapper.style.visibility = "visible";
			widget.style.visibility = "visible";	// counteract effects from HasDropDown

			var handlers = [];

			// provide default escape and tab key handling
			// (this will work for any widget, not just menu)
			var onKeyDown = function (evt) {
				if ((evt.key === "Escape" || evt.key === "Tab") && args.onCancel) {
					evt.stopPropagation();
					evt.preventDefault();
					args.onCancel();
				}
			}.bind(this);
			wrapper.addEventListener("keydown", onKeyDown);
			handlers.push({
				remove: function () {
					wrapper.removeEventListener("keydown", onKeyDown);
				}
			});

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

			handlers.push(widget.on("delite-size-change", function () {
				this._repositionAll(true);
			}.bind(this)));

			var stackEntry = Object.create(args);
			stackEntry.wrapper = wrapper;
			stackEntry.handlers = handlers;
			stack.push(stackEntry);
		},

		/**
		 * Size or resize the popup specified by args.
		 * @param {module:delite/popup.OpenArgs} args
		 * @param {boolean} measureSize
		 * @returns {*} If orient !== center then returns the alignment of the popup relative to the anchor node.
		 * @private
		 */
		_size: function (args, measureSize) {
			/* jshint maxcomplexity:13 */
			var widget = args.popup,
				around = args.around,
				orient = args.orient || ["below", "below-alt", "above", "above-alt"],
				viewport = Viewport.getEffectiveBox(widget.ownerDocument);

			var cs = getComputedStyle(widget),
				verticalMargin = parseFloat(cs.marginTop) + parseFloat(cs.marginBottom),
				horizontalMargin = parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);

			if (measureSize) {
				// Get natural size of popup (i.e. when not squashed to fit within viewport).  First, remove any
				// previous size restriction set on popup.  Note that setting popups's height and width to "auto"
				// erases scroll position, so should only be done when popup is first shown, before user has scrolled.
				widget.style.height = "auto";
				if (orient[0] === "center") {
					// Don't set width to "auto" when orient!=center because it interferes with HasDropDown's
					// autoWidth/forceWidth.
					// TODO: maybe this if() check is no longer necessary to due to parent if(measureSize)
					widget.style.width = "auto";
				}

				args._naturalHeight = widget.offsetHeight + verticalMargin;
				args._naturalWidth = widget.offsetWidth + horizontalMargin;
			}

			if (orient[0] === "center") {
				// Limit height and width so dialog fits within viewport.
				widget.style.height = args._naturalHeight > viewport.h * 0.9 ? Math.floor(viewport.h * 0.9) + "px" :
					"auto";
				widget.style.width = args._naturalWidth > viewport.w * 0.9 ? Math.floor(viewport.w * 0.9) + "px" :
					"auto";
			} else {
				// Limit height to space available in viewport either above or below aroundNode (whichever side has
				// more room).  This may make the popup widget display a scrollbar (or multiple scrollbars).
				var maxHeight;
				if ("maxHeight" in args && args.maxHeight !== -1) {
					maxHeight = args.maxHeight || Infinity;
				} else {
					// Get around node position, doing correction if iOS auto-scroll has moved it off screen.
					var aroundPos = around ? around.getBoundingClientRect() : {
						top: args.y - (args.padding || 0),
						height: (args.padding || 0) * 2
					};
					var aroundPosTop = Math.max(aroundPos.top, 0);
					var aroundPosBottom = Math.max(aroundPos.top + aroundPos.height, 0);

					maxHeight = Math.floor(Math.max(aroundPosTop, viewport.h - aroundPosBottom));
				}

				widget.style.height = args._naturalHeight > maxHeight ? maxHeight - verticalMargin + "px" : "auto";
			}
		},

		/**
		 * Position the popup specified by args.
		 * @param args
		 * @returns {*} If orient !== center then returns the alignment of the popup relative to the anchor node.
		 * @private
		 */
		_position: function (args) {
			var widget = args.popup,
				wrapper = widget._popupWrapper,
				around = args.around,
				orient = args.orient || ["below", "below-alt", "above", "above-alt"],
				ltr = args.parent ? args.parent.effectiveDir !== "rtl" : isDocLtr(widget.ownerDocument);

			// position the wrapper node
			if (orient[0] === "center") {
				place.center(wrapper);
				DialogUnderlay.showFor(wrapper);
			} else {
				var position = around ?
					place.around(wrapper, around, orient, ltr) :
					place.at(wrapper, args, orient === "R" ? ["TR", "BR", "TL", "BL"] : ["TL", "BL", "TR", "BR"],
						args.padding);

				// Emit event telling popup that it was [re]positioned.
				var event = Object.create(position);
				event.around = around;
				widget.emit("popup-after-position", event);

				return position;
			}

		},

		/**
		 * Close specified popup and any popups that it parented.  If no popup is specified, closes all popups.
		 * @param {module:delite/Widget} [popup]
		 */
		close: function (popup) {
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
					onClose = top.onClose;

				if (widget.bgIframe) {
					// push the iframe back onto the stack.
					widget.bgIframe.destroy();
					delete widget.bgIframe;
				}

				var h;
				while ((h = top.handlers.pop())) {
					h.remove();
				}

				// Hide the widget and its wrapper unless it has already been destroyed in above onClose() etc.
				this.hide(widget);
				DialogUnderlay.hideFor(widget._popupWrapper);

				if (onClose) {
					onClose();
				}
			}

			if (stack.length === 0 && this._aroundMoveListener) {
				clearTimeout(this._aroundMoveListener);
				this._firstAroundNode = this._firstAroundPosition = this._aroundMoveListener = null;
			}
		}
	});

	return new PopupManager();
});
