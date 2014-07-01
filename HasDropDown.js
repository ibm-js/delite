/** @module delite/HasDropDown */
define([
	"dcl/dcl",
	"dojo/Deferred",
	"dojo/dom-class", // domClass.add domClass.contains domClass.remove
	"dojo/dom-geometry", // domGeometry.marginBox domGeometry.position
	"requirejs-dplugins/has", // has("touch")
	"dojo/keys", // keys.DOWN_ARROW keys.ENTER keys.ESCAPE
	"dojo/on",
	"dojo/touch",
	"./focus",
	"./popup",
	"./Widget"
], function (dcl, Deferred, domClass, domGeometry, has, keys, on, touch,
			 focus, popup, Widget) {

	// TODO: this needs an overhaul for 2.0, including
	//	- use deferreds instead of callbacks
	//	- use ES5 setters rather than methods??
	//	- _onXXX() methods should be renamed to _xxxHandler() or something like that

	/**
	 * Mixin for widgets that need drop down ability.
	 * @mixin module:delite/HasDropDown
	 * @augments module:delite/Widget
	 */
	return dcl(Widget, /** @lends module:delite/HasDropDown# */ {
		/**
		 * The button/icon/node to click to display the drop down.
		 * Can be set in a template via a `attach-point` assignment.
		 * If missing, then either `this.focusNode` or `this.domNode` (if `focusNode` is also missing) will be used.
		 * @member {Element}
		 * @protected
		 */
		_buttonNode: null,

		/**
		 * Will set CSS class `d-up-arrow-button`, `d-down-arrow-button`, `d-right-arrow-button` etc. on this node
		 * depending on where the drop down is set to be positioned.
		 * Can be set in a template via a `attach-point` assignment.
		 * If missing, then `this._buttonNode` will be used.
		 * @member {Element}
		 * @protected
		 */
		_arrowWrapperNode: null,

		/**
		 * The node to set the aria-expanded class on.
		 * Can be set in a template via a `attach-point` assignment.
		 * If missing, then `this.focusNode` or `this._buttonNode` (if `focusNode` is missing) will be used.
		 * @member {Element}
		 * @protected
		 */
		_popupStateNode: null,

		/**
		 * The node to display the popup around.
		 * Can be set in a template via a `attach-point` assignment.
		 * If missing, then `this.domNode` will be used.
		 * @member {Element}
		 * @protected
		 */
		_aroundNode: null,

		/**
		 * The widget to display as a popup.  This property *must* be
		 * defined before the `startup()` method is called.
		 * @member {module:delite/Widget}
		 */
		dropDown: null,

		/**
		 * If true, make the drop down at least as wide as this widget.
		 * If false, leave the drop down at its default width.
		 * @member {boolean}
		 * @default true
		 */
		autoWidth: true,

		/**
		 * If true, make the drop down exactly as wide as this widget.  Overrides `autoWidth`.
		 * @member {boolean}
		 * @default false
		 */
		forceWidth: false,

		/**
		 * The maximum height for our dropdown.
		 * Any dropdown taller than this will have a scroll bar.
		 * Set to 0 for no max height, or -1 to limit height to available space in viewport.
		 * @member {number}
		 * @default -1
		 */
		maxHeight: -1,

		/**
		 * Controls the position of the drop down.
		 * It's an array of strings with the following values:
		 *
		 * - before: places drop down to the left of the target node/widget, or to the right in
		 * the case of RTL scripts like Hebrew and Arabic
		 * - after: places drop down to the right of the target node/widget, or to the left in
		 * the case of RTL scripts like Hebrew and Arabic
		 * - above: drop down goes above target node
		 * - below: drop down goes below target node
		 *
		 * The positions are tried, in order, until a position is found where the drop down fits
		 * within the viewport.
		 *
		 * @member {string[]}
		 * @default ["below", "above"]
		 */
		dropDownPosition: ["below", "above"],

		/**
		 * If false, click events will not be stopped.
		 * Set to true in case you want to listen to those events in your subclass.
		 * @member {boolean}
		 * @default true
		 * @protected
		 */
		_stopClickEvents: true,

		/**
		 * Whether or not the drop down is open.
		 * @member {boolean}
		 * @readonly
		 */
		opened: false,

		/**
		 * Callback when the user mousedown/touchstart on the arrow icon.
		 * @param {Event} e
		 * @private
		 */
		_onDropDownMouseDown: function (e) {
			if (this.disabled || this.readOnly) {
				return;
			}

			// Prevent default to stop things like text selection, but don't stop propagation, so that:
			//		1. TimeTextBox etc. can focus the <input> on mousedown
			//		2. dropDownButtonActive class applied by _CssStateMixin (on button depress)
			//		3. user defined onMouseDown handler fires
			//
			// Also, don't call preventDefault() on MSPointerDown event (on IE10) because that prevents the button
			// from getting focus, and then the focus manager doesn't know what's going on (#17262)
			if (e.type !== "MSPointerDown" && e.type !== "pointerdown") {
				e.preventDefault();
			}

			this._docHandler = this.own(on(this.ownerDocument, touch.release, this._onDropDownMouseUp.bind(this)))[0];

			this.toggleDropDown();
		},

		/**
		 * Callback on mouseup/touchend after mousedown/touchstart on the arrow icon.
		 * Note that this function is called regardless of what node the event occurred on (but only after
		 * a mousedown/touchstart on the arrow).
		 *
		 * If the drop down is a simple menu and the cursor is over the menu, we execute it, otherwise,
		 * we focus our drop down widget.  If the event is missing, then we are not a mouseup event.
		 *
		 * This is useful for the common mouse movement pattern with native browser `<select>` nodes:
		 *
		 * 1. mouse down on the select node (probably on the arrow)
		 * 2. move mouse to a menu item while holding down the mouse button
		 * 3. mouse up; this selects the menu item as though the user had clicked it
		 *
		 * @param {Event} [e]
		 * @private
		 */
		_onDropDownMouseUp: function (e) {
			/* jshint maxcomplexity:14 */	// TODO: simplify this method?

			if (e && this._docHandler) {
				this._docHandler.remove();
				this._docHandler = null;
			}
			var dropDown = this.dropDown, overMenu = false;

			if (e && this.opened) {
				// This code deals with the corner-case when the drop down covers the original widget,
				// because it's so large.  In that case mouse-up shouldn't select a value from the menu.
				// Find out if our target is somewhere in our dropdown widget,
				// but not over our _buttonNode (the clickable node)
				var c = domGeometry.position(this._buttonNode, true);
				if (!(e.pageX >= c.x && e.pageX <= c.x + c.w) || !(e.pageY >= c.y && e.pageY <= c.y + c.h)) {
					var t = e.target;
					while (t && !overMenu) {
						if (domClass.contains(t, "d-popup")) {
							overMenu = true;
						} else {
							t = t.parentNode;
						}
					}
					if (overMenu) {
						if (dropDown.onItemClick) {
							var menuItem = this.getEnclosingWidget(e.target);
							if (menuItem && menuItem.onClick && menuItem.getParent) {
								menuItem.getParent().onItemClick(menuItem, e);
							}
						}
						return;
					}
				}
			}
			if (this.opened) {
				// Focus the dropdown widget unless it's a menu (in which case focusOnOpen is set to false).
				// Even if it's a menu, we need to focus it if this is a fake mouse event caused by the user typing
				// SPACE/ENTER while using JAWS.  Jaws converts the SPACE/ENTER key into mousedown/mouseup events.
				// If this.hovering is false then it's presumably actually a keyboard event.

				// TODO: this.hovering was removed from _CssStateMixin, so need to track hovered node/widget
				// from this module (or put code back into _CssStateMixin)
				if (dropDown.focus && (dropDown.focusOnOpen !== false || (e.type === "mouseup" && !this.hovering))) {
					// Do it on a delay so that we don't steal back focus from the dropdown.
					this._focusDropDownTimer = this.defer(function () {
						dropDown.focus();
						delete this._focusDropDownTimer;
					});
				}
			} else {
				// The drop down arrow icon probably can't receive focus, but widget itself should get focus.
				// defer() needed to make it work on IE (test DateTextBox)
				if (this.focus) {
					this.defer("focus");
				}
			}
		},

		/**
		 * Callback for click event.
		 * @param {Event} e
		 * @private
		 */
		_onDropDownClick: function (e) {
			// The drop down was already opened on mousedown/keydown; just need to stop the event
			if (this._stopClickEvents) {
				e.stopPropagation();
				e.preventDefault();
			}
		},

		buildRendering: dcl.after(function () {
			this._buttonNode = this._buttonNode || this.focusNode || this;
			this._popupStateNode = this._popupStateNode || this.focusNode || this._buttonNode;

			// Add a "d-down-arrow" type class to _buttonNode so theme can set direction of arrow
			// based on where drop down will normally appear
			var defaultPos = {
				"after": this.isLeftToRight() ? "right" : "left",
				"before": this.isLeftToRight() ? "left" : "right"
			}[this.dropDownPosition[0]] || this.dropDownPosition[0] || "down";

			domClass.add(this._arrowWrapperNode || this._buttonNode, "d-" + defaultPos + "-arrow");
		}),

		postCreate: function () {
			var keyboardEventNode = this.focusNode || this;
			this.own(
				on(this._buttonNode, touch.press, this._onDropDownMouseDown.bind(this)),
				on(this._buttonNode, "click", this._onDropDownClick.bind(this)),
				on(keyboardEventNode, "keydown", this._onKey.bind(this)),
				on(keyboardEventNode, "keyup", this._onKeyUp.bind(this))
			);
		},

		destroy: function () {
			// If dropdown is open, close it, to avoid leaving delite/focus in a strange state.
			// Put focus back on me to avoid the focused node getting destroyed, which flummoxes IE.
			if (this.opened) {
				this.closeDropDown(true);
			}

			if (this.dropDown) {
				// Destroy the drop down, unless it's already been destroyed.  This can happen because
				// the drop down is a direct child of <body> even though it's logically my child.
				if (!this.dropDown._destroyed) {
					this.dropDown.destroy();
				}
				delete this.dropDown;
			}
		},

		/**
		 * Callback when the user presses a key while focused on the button node.
		 * @param {Event} e
		 * @private
		 */
		_onKey: function (e) {
			/* jshint maxcomplexity:14 */

			if (this.disabled || this.readOnly) {
				return;
			}
			var d = this.dropDown, target = e.target;
			if (d && this.opened && d.handleKey) {
				if (d.handleKey(e) === false) {
					/* false return code means that the drop down handled the key */
					e.stopPropagation();
					e.preventDefault();
					return;
				}
			}
			if (d && this.opened && e.keyCode === keys.ESCAPE) {
				this.closeDropDown();
				e.stopPropagation();
				e.preventDefault();
			} else if (!this.opened &&
				(e.keyCode === keys.DOWN_ARROW ||
					// ignore unmodified SPACE if KeyNav has search in progress
					((e.keyCode === keys.ENTER || (e.keyCode === keys.SPACE &&
						(!this._searchTimer || (e.ctrlKey || e.altKey || e.metaKey)))) &&
						//ignore enter and space if the event is for a text input
						((target.tagName || "").toLowerCase() !== "input" ||
							(target.type && target.type.toLowerCase() !== "text"))))) {
				// Toggle the drop down, but wait until keyup so that the drop down doesn't
				// get a stray keyup event, or in the case of key-repeat (because user held
				// down key for too long), stray keydown events
				this._toggleOnKeyUp = true;
				e.stopPropagation();
				e.preventDefault();
			}
		},

		/**
		 * Callback when the user releases a key while focused on the button node.
		 * @param {Event} e
		 * @private
		 */
		_onKeyUp: function () {
			if (this._toggleOnKeyUp) {
				delete this._toggleOnKeyUp;
				this.toggleDropDown();
				var d = this.dropDown;	// drop down may not exist until toggleDropDown() call
				if (d && d.focus) {
					this.defer(d.focus.bind(d), 1);
				}
			}
		},

		_onBlur: dcl.before(function () {
			// Called magically when focus has shifted away from this widget and it's dropdown

			// Close dropdown but don't focus my <input>.  User may have focused somewhere else (ex: clicked another
			// input), and even if they just clicked a blank area of the screen, focusing my <input> will unwantedly
			// popup the keyboard on mobile.
			this.closeDropDown(false);
		}),

		/**
		 * Returns true if the dropdown exists and its data is loaded. This can
		 * be overridden in order to force a call to loadDropDown().
		 * @returns {boolean}
		 * @protected
		 */
		isLoaded: function () {
			return true;
		},

		/**
		 * Creates the drop down if it doesn't exist, loads the data
		 * if there's an href and it hasn't been loaded yet, and then calls
		 * the given callback.
		 * @param {Function} loadCallback
		 * @protected
		 */
		loadDropDown: function (loadCallback) {
			// TODO: for 2.0, change API to return a Deferred, instead of calling loadCallback?
			loadCallback();
		},

		/**
		 * Creates the drop down if it doesn't exist, loads the data
		 * if there's an href and it hasn't been loaded yet, and
		 * then opens the drop down.  This is basically a callback when the
		 * user presses the down arrow button to open the drop down.
		 * @returns {Promise} Promise for the drop down widget that fires when drop down is created and loaded.
		 * @protected
		 */
		loadAndOpenDropDown: function () {
			var d = new Deferred();

			function afterLoad() {
				this.openDropDown();
				d.resolve(this.dropDown);
			}

			if (!this.isLoaded()) {
				this.loadDropDown(afterLoad.bind(this));
			} else {
				afterLoad.call(this);
			}
			return d;
		},

		/**
		 * Toggle the drop-down widget; if it is open, close it, if not, open it.
		 * Called when the user presses the down arrow button or presses
		 * the down arrow key to open/close the drop down.
		 * @protected
		 */
		toggleDropDown: function () {
			if (this.disabled || this.readOnly) {
				return;
			}
			if (!this.opened) {
				this.loadAndOpenDropDown();
			} else {
				this.closeDropDown(true);	// refocus button to avoid hiding node w/focus
			}
		},

		/**
		 * Opens the dropdown for this widget.  To be called only when this.dropDown
		 * has been created and is ready to display (i.e. its data is loaded).
		 * @returns {*} Return value of delite/popup.open().
		 * @protected
		 */
		openDropDown: function () {
			var dropDown = this.dropDown,
				aroundNode = this._aroundNode || this,
				self = this;

			var retVal = popup.open({
				parent: this,
				popup: dropDown,
				around: aroundNode,
				orient: this.dropDownPosition,
				maxHeight: this.maxHeight,
				onExecute: function () {
					self.closeDropDown(true);
				},
				onCancel: function () {
					self.closeDropDown(true);
				},
				onClose: function () {
					domClass.remove(self._popupStateNode, "d-drop-down-open");
					self._set("opened", false);	// use _set() because CssStateMixin is watching
				}
			});

			// Set width of drop down if necessary, so that dropdown width + width of scrollbar (from popup wrapper)
			// matches width of aroundNode
			if (this.forceWidth || (this.autoWidth && aroundNode.offsetWidth > dropDown._popupWrapper.offsetWidth)) {
				var widthAdjust = aroundNode.offsetWidth - dropDown._popupWrapper.offsetWidth;
				var resizeArgs = {
					w: dropDown.offsetWidth + widthAdjust
				};
				if (typeof dropDown.resize === "function") {
					dropDown.resize(resizeArgs);
				} else {
					domGeometry.setMarginBox(dropDown, resizeArgs);
				}

				// If dropdown is right-aligned then compensate for width change by changing horizontal position
				if (retVal.corner[1] === "R") {
					dropDown._popupWrapper.style.left =
						(dropDown._popupWrapper.style.left.replace("px", "") - widthAdjust) + "px";
				}
			}

			domClass.add(this._popupStateNode, "d-drop-down-open");
			this._set("opened", true);	// use set() because _CssStateMixin is watching

			this._popupStateNode.setAttribute("aria-expanded", "true");
			this._popupStateNode.setAttribute("aria-owns", dropDown.id);

			// Set aria-labelledby on dropdown if it's not already set to something more meaningful
			if (dropDown.getAttribute("role") !== "presentation" && !dropDown.getAttribute("aria-labelledby")) {
				dropDown.setAttribute("aria-labelledby", this.id);
			}

			return retVal;
		},

		/**
		 * Closes the drop down on this widget.
		 * @param {boolean} focus - If true, refocus this widget.
		 * @protected
		 */
		closeDropDown: function (focus) {
			if (this._focusDropDownTimer) {
				this._focusDropDownTimer.remove();
				delete this._focusDropDownTimer;
			}

			if (this.opened) {
				this._popupStateNode.setAttribute("aria-expanded", "false");
				if (focus && this.focus) {
					this.focus();
				}
				popup.close(this.dropDown);
				this.opened = false;
			}
		}
	});
});
