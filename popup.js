/**
 * Show drop downs (ex: the select list of a ComboBox) or popups (ex: right-click context menus).
 * @module delite/popup
 */
define([
	"dcl/dcl",
	"dojo/window",
	"resize-observer-polyfill/dist/ResizeObserver",
	"./BackgroundIframe",
	"./DialogUnderlay",
	"./features", // has("config-bgIframe")
	"./on",
	"./place",
	"./Viewport",
	"./theme!" // d-popup class
], function (
	dcl,
	win,
	ResizeObserver,
	BackgroundIframe,
	DialogUnderlay,
	has,
	on,
	place,
	Viewport
) {

	function isDocLtr(doc) {
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
					win.scrollIntoView(args.around);
				}

				this._size(args);
				this._position(args);

				// If the resizing (or repositioning) scrolled the active element out of view, then fix it.
				// Use dojo/window.scrollIntoView() because it does minimal scrolling (and only scrolls if necessary),
				// unlike iOS's native scrollIntoView() method.
				if (scroll && args.popup.contains(document.activeElement)) {
					win.scrollIntoView(document.activeElement);
				}

				on.emit(args.popup, "delite-repositioned", {args: args});
			}, this);

			this._repositioning = false;
		},

		/**
		 * Initialization for widgets that will be used as popups.
		 * Puts widget inside a wrapper DIV (if not already in one), and returns pointer to that wrapper DIV.
		 * @param {module:delite/Widget} widget
		 * @returns {HTMLElement} The wrapper DIV.
		 * @private
		 */
		createWrapper: function (widget) {
			var wrapper = widget._popupWrapper;
			if (!wrapper) {
				// Create wrapper <div> for when this widget [in the future] will be used as a popup.
				// This is done early because of IE bugs where creating/moving DOM nodes causes focus
				// to go wonky, see tests/robot/Toolbar.html to reproduce
				wrapper = widget._popupWrapper = widget.ownerDocument.createElement("div");
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
				widget.classList.remove("d-hidden");
				widget.classList.remove("d-invisible");
				widget.classList.remove("d-offscreen");

				// Destroy wrapper when popup widget is destroyed.
				widget.own({
					destroy: function destroyWrapper() {
						if (widget._popupWrapper) {
							widget._popupWrapper.parentNode.removeChild(widget._popupWrapper);
							delete widget._popupWrapper;
						}
					}
				});
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
			var wrapper = this.createWrapper(widget);
			wrapper.style.display = "";
			wrapper.classList.add("d-offscreen");
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
			var wrapper = this.createWrapper(widget);

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
			// Make copy of args so we don't modify original struct.
			args = Object.create(args);

			var eventNode = args.parent || document.body,
				popup = args.popup;

			on.emit(eventNode, "delite-before-show", {
				child: popup,
				cancelable: false
			});

			// Size and position the popup.
			this._prepareToOpen(args);
			this._size(args, true);
			var position = this._position(args);

			// Emit event on popup.
			args.popup.emit("popup-after-show", {
				around: args.around
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
			/* jshint maxcomplexity:12 */

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

			// Get reference to popup wrapper, and create wrapper if it doesn't exist.  Remove display:none (but keep
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

			args.wrapper = wrapper;
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
			/* jshint maxcomplexity:15 */
			var widget = args.popup,
				around = args.around,
				orient = this._getOrient(args),
				viewport = Viewport.getEffectiveBox();

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
			/* jshint maxcomplexity:11 */
			var widget = args.popup,
				wrapper = widget._popupWrapper,
				around = args.around,
				orient = this._getOrient(args),
				ltr = args.parent ? args.parent.effectiveDir !== "rtl" : isDocLtr(widget.ownerDocument),
				position;

			// position the wrapper node
			if (orient[0] === "center") {
				if (!args.dragged && !args.resized) {
					place.center(wrapper);
					widget.emit("popup-after-position");
				}
			} else {
				position = around ?
					place.around(wrapper, around, orient, ltr) :
					place.at(wrapper, args, orient === "R" ? ["TR", "BR", "TL", "BL"] : ["TL", "BL", "TR", "BR"],
						args.padding);

				// Emit event telling popup that it was [re]positioned.
				var event = Object.create(position);
				event.around = around;
				widget.emit("popup-after-position", event);
			}

			// Setup underlay for popups that want one.  By default it's done for centered popups,
			// but args can explicitly specify underlay=true or underlay=false.
			if (args.underlay !== undefined ? args.underlay : (orient[0] === "center")) {
				DialogUnderlay.showFor(wrapper);
			} else {
				DialogUnderlay.hideFor(wrapper);
			}

			return position;
		},

		/**
		 * If the specified widget is fully or partially offscreen, bring it fully into view.
		 * @param widget
		 */
		moveFullyIntoView: function (widget) {
			var viewport = Viewport.getEffectiveBox(),
				wrapper = this.createWrapper(widget),
				bcr = wrapper.getBoundingClientRect(),
				curTop = parseFloat(wrapper.style.top),
				curLeft = parseFloat(wrapper.style.left),
				minTop = viewport.t,
				minLeft = viewport.l,
				maxTop = Math.max(viewport.t + viewport.h - bcr.height, 0),
				maxLeft = Math.max(viewport.l + viewport.w - bcr.width, 0);

			if (curTop < 0 || curTop > maxTop || curLeft < minLeft || curLeft > maxLeft) {
				var top = Math.min(Math.max(curTop, minTop), maxTop),
					left = Math.min(Math.max(curLeft, minLeft), maxLeft);
				wrapper.style.top = top  + "px";
				wrapper.style.left = left + "px";

				widget.emit("popup-after-position");
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
		}
	});

	return new PopupManager();
});
