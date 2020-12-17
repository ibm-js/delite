/** @module delite/HasDropDown */
define([
	"dcl/dcl",
	"ibm-decor/sniff",
	"./on",
	"./place",
	"./popup",
	"./register",
	"./Widget",
	"./activationTracker"		// for delite-deactivated event
], function (
	dcl,
	has,
	on,
	place,
	popup,
	register,
	Widget
) {
	var mobile = has("ios") || has("android");

	/**
	 * Base class for widgets that need drop down ability.
	 * @mixin module:delite/HasDropDown
	 * @augments module:delite/Widget
	 */
	var HasDropDown = dcl(Widget, /** @lends module:delite/HasDropDown# */ {
		declaredClass: "delite/HasDropDown",

		/**
		 * If specified, defines a node to set up the dropdown-opening behavior on,
		 * rather than the HasDropDown node itself.
		 * @member {Element}
		 * @protected
		 */
		behaviorNode: null,

		/**
		 * The button/icon/node to click to display the drop down.
		 * Useful for widgets like Combobox which contain an `<input>` and a
		 * down arrow icon, and only clicking the icon should open the drop down.
		 * If undefined, click handler set up on `this.behaviorNode` (if defined),
		 * or otherwise on `this`.
		 * @member {Element}
		 * @protected
		 */
		buttonNode: null,

		/**
		 * The Element that will contain some aria attributes.
		 * Useful for widgets like Combobox that needs some special attibutes like aria-haspopup
		 * to be defined on a specific element.
		 * @member {Element}
		 * @protected
		 */
		popupStateNode: null,

		/**
		 * The node to display the popup next to.
		 * Can be set in a template via a `attach-point` assignment.
		 * If undefined, popup will be displayed next to`this.behaviorNode` (if defined),
		 * or otherwise next to `this`.
		 * @member {Element}
		 * @protected
		 */
		aroundNode: null,

		/**
		 * The widget to display as a popup.  Applications/subwidgets should *either*:
		 *
		 * 1. define this property
		 * 2. override `loadDropDown()` to return a dropdown widget or Promise for one
		 * 3. listen for a `delite-display-load` event, and then call event.setChild() with an Object like
		 *    `{child: dropDown}` or a Promise for such an Object
		 * @member {Element}
		 */
		dropDown: null,

		/**
		 * If true, make the drop down at least as wide as this widget.
		 * If false, leave the drop down at its default width.
		 * Has no effect when `dropDownPosition === ["center"]`.
		 * @member {boolean}
		 * @default true
		 */
		autoWidth: true,

		/**
		 * If true, make the drop down exactly as wide as this widget.  Overrides `autoWidth`.
		 * Has no effect when `dropDownPosition === ["center"]`.
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
		 * - center: drop down is centered on the screen, like a dialog; when used, this should be
		 *   the only choice in the array
		 *
		 * The positions are tried, in order, until a position is found where the drop down fits
		 * within the viewport.
		 *
		 * @member {string[]}
		 * @default ["below", "above"]
		 */
		dropDownPosition: ["below", "above"],

		/**
		 * Focus the popup when opened by mouse or touch.  This flag should generally be left as `true` unless
		 * the popup is a menu.  Usually drop down menus don't get focus unless opened by the keyboard.
		 * @member {boolean}
		 * @default true
		 */
		focusOnPointerOpen: true,

		/**
		 * Focus the popup when opened by the keyboard.  This flag should be left as `true` except for widgets
		 * like Combobox where the focus is meant to always remain on the HasDropDown widget itself.
		 * @member {boolean}
		 * @default true
		 */
		focusOnKeyboardOpen: true,

		/**
`		 * Make the popup open just by hovering, and close when the user stops hovering this node
		 * and its popup.
		 * @member {boolean}
		 * @default false
		 */
		openOnHover: false,

		/**
`		 * Open the popup from the arrow-down key (in addition to Enter and Spacebar).
		 * @member {boolean}
		 * @default true
		 */
		openOnArrowDown: true,

		/**
		 * Value to set aria-haspopup to.  Describes the type of the popup.  Values:
		 *
		 * - menu
		 * - listbox
		 * - tree
		 * - grid
		 * - dialog
		 */
		dropDownType: "menu",

		/**
		 * Whether or not the drop down is open.
		 * @member {boolean}
		 * @readonly
		 */
		opened: false,

		/**
		 * True if the user has clicked or focused this control, the associated dropdown,
		 * or a descendant dropdown.
		 * @member {boolean}
		 * @readonly
		 */
		activated: false,

		/**
		 * Use underlay behind popup.
		 * By default, turns on (only) for centered popups.
		 */
		underlay: undefined,

		/**
		 * Milliseconds to wait between opening the dropdown and trying to focus it.
		 */
		focusOnOpenDelay: 10,

		/**
		 * Test if event happened on the dropdown.
		 * @param {Event} e
		 * @returns {boolean}
		 * @private
		 */
		_eventOnDropdown: function (e) {
			// The event may have caused the dropdown to close, then bubbled up to me.  In that
			// case, the event would be on this._previousDropDown rather than this._currentDropDown.
			return (this._currentDropDown && this._currentDropDown.contains(e.target)) ||
				(this._previousDropDown && this._previousDropDown.contains(e.target));
		},

		/**
		 * Callback when the user clicks the button to open the dropdown.
		 * @private
		 */
		_dropDownClickHandler: function (e) {
			// Ignore event if it happened inside the dropdown.  This happens when the root node
			// is the button to open the dropdown, but it also contains the dropdown.
			if (this._eventOnDropdown(e)) {
				return;
			}

			e.preventDefault();
			e.stopPropagation();

			if (this.disabled || this.readOnly) {
				return;
			}

			this.toggleDropDown();

			if (!this._openDropDownPromise) {
				// We just closed the dropdown.
				// The drop down arrow icon probably can't receive focus, but widget itself should get focus.
				// defer() needed to make it work on IE (test DateTextBox)
				if (this.focus) {
					this.defer(this.focus);
				}
			}
		},

		refreshRendering: function (oldVals) {
			// Set aria-haspopup after LitWidget renders, so popupStateNode etc. are set.
			if (this.attached && ("attached" in oldVals || "dropDownType" in oldVals)) {
				var popupStateNode = this.popupStateNode || this.focusNode || this.buttonNode ||
					this.behaviorNode || this;
				if (this.dropDownType === "dialog") {
					// Note: Not setting when dropDownType is dialog to workaround JAWS bug #511.
					popupStateNode.removeAttribute("aria-haspopup");
				} else {
					popupStateNode.setAttribute("aria-haspopup", this.dropDownType);
				}
			}

			// Setup listeners for mouse and keyboard after LitWidget renders, so focusNode etc. are set.
			if ("attached" in oldVals) {
				if (this.attached) {
					this._setupHasDropDownListeners();
				} else {
					this._removeHasDropDownListeners();
				}
			} else if ("behaviorNode" in oldVals || "buttonNode" in oldVals || "focusNode" in oldVals ||
				"openOnHover" in oldVals) {
				// Respond to changes to behaviorNode etc. after connection.
				// Doesn't work when behaviorNode etc. is a custom getter though because there's no change notification.
				this._removeHasDropDownListeners();
				this._setupHasDropDownListeners();
			}
		},

		_setupHasDropDownListeners: function () {
			var behaviorNode = this.behaviorNode || this,
				buttonNode = this.buttonNode || behaviorNode,
				keystrokeNode = this.focusNode || behaviorNode;

			this._HasDropDownListeners = [
				// basic listeners
				on(buttonNode, "click", this._dropDownClickHandler.bind(this)),
				on(keystrokeNode, "keydown", this._dropDownKeyDownHandler.bind(this)),
				on(keystrokeNode, "keyup", this._dropDownKeyUpHandler.bind(this)),

				on(behaviorNode, "delite-activated", this._activatedHandler.bind(this)),
				on(behaviorNode, "delite-deactivated", this._deactivatedHandler.bind(this)),

				// set this.hovering when mouse is over widget so we can differentiate real mouse clicks
				// from synthetic mouse clicks generated from JAWS upon keyboard events
				on(behaviorNode, "pointerenter", function () {
					this.hovering = true;
				}.bind(this)),
				on(behaviorNode, "pointerleave", function () {
					this.hovering = false;
				}.bind(this))
			];
			buttonNode._hasDropDownClickListener = true;

			if (this.openOnHover) {
				this._HasDropDownListeners.push(
					on(buttonNode, "delite-hover-activated", function () {
						// Hovering my dropdown will cause me to get a delite-hover-activated event.
						// Ignore this case.
						if (this.opened) {
							return;
						}

						// Opening a dropdown can cause already opened dropdowns to close.  (Delite/popup.open() -->
						// _prepareToOpen() --> while() loop calling close).  Don't let hovering cause another dropdown
						// to close, especially if the other dropdown was opened by clicking.
						var topPopup = popup._stack.length > 0 ? popup._stack[popup._stack.length - 1].popup : null;
						if (topPopup && !topPopup.contains(this)) {
							return;
						}

						this.openDropDown();
					}.bind(this)),
					on(buttonNode, "delite-hover-deactivated", function () {
						if (this.activated) {
							// If the user has clicked the dropdown or a descendant, then don't close the
							// dropdown unless the user clicks somewhere else.
							return;
						}
						this.closeDropDown();
					}.bind(this))
				);
			}
		},

		_removeHasDropDownListeners: function () {
			if (this._HasDropDownListeners) {
				this._HasDropDownListeners.forEach(function (handle) {
					handle.remove();
				});
				delete this._HasDropDownListeners;
			}
		},

		disconnectedCallback: function () {
			// If dropdown is open, close it, to avoid leaving delite/activationTracker in a strange state.
			// Put focus back on me to avoid the focused node getting destroyed, which flummoxes IE.
			if (this.opened) {
				this.closeDropDown(true);
			}

			if (this._previousDropDown && !this.contains(this._previousDropDown)) {
				popup.detach(this._previousDropDown);
				delete this._previousDropDown;
			}
		},

		destroy: function () {
			this._removeHasDropDownListeners();

			if (this.dropDown) {
				// Destroy the drop down, unless it's already been destroyed.  This can happen if
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
		// eslint-disable-next-line complexity
		_dropDownKeyDownHandler: function (e) {
			if (this.disabled || this.readOnly) {
				return;
			}

			// Ignore event if it happened inside the dropdown.  This happens when the root node
			// is the button to open the dropdown, but it also contains the dropdown.
			if (this._eventOnDropdown(e)) {
				return;
			}

			var dropDown = this._currentDropDown, target = e.target;
			if (dropDown && this.opened) {
				if (e.key === "Escape") {
					this.closeDropDown();
					e.stopPropagation();
					e.preventDefault();
				} else if (e.key === "Tab") {
					// Let the browser handle the TAB navigation.  Don't forward the keystroke to the dropdown.
					// Note that this code doesn't apply to dialogs, where the focus is on the dropdown.
					this.closeDropDown();
				} else {
					// Forward the keystroke to the dropdown widget.
					// deliteful/List (the dropdown for deliteful/Combobox)
					// listens for events on List#containerNode rather than the List root node.
					var forwardNode = dropDown.keyNavContainerNode || dropDown.containerNode || dropDown;
					if (dropDown.emit("keydown", e, forwardNode) === false) {
						/* false return code means that the drop down handled the key */
						e.stopPropagation();
						e.preventDefault();
					}
				}
			} else if (!this.opened) {
				var openOnKeyUp,
					tagName = target.tagName && target.tagName.toLowerCase();
				if (e.key === "ArrowDown" && this.openOnArrowDown) {
					openOnKeyUp = true;
				} else if (target._hasDropDownClickListener && tagName === "button") {
					// Ignore space/enter key for a <button> because we already do toggling for
					// the <button> on "click", and space/enter on a <button> generates a "click" event.
					openOnKeyUp = false;
				} else if (tagName === "input" || (target.type && target.type.toLowerCase() === "text")) {
					// Ignore enter and space if the focusNode is a text input.
					openOnKeyUp = false;
				} else {
					// Ignore unmodified SPACE if KeyNav has search in progress.
					openOnKeyUp = e.key === "Enter" || (e.key === "Spacebar" &&
						(!this._searchTimer || (e.ctrlKey || e.altKey || e.metaKey)));
				}

				// Toggle the drop down, but wait until keyup so that the drop down doesn't
				// get a stray keyup event, or in the case of key-repeat (because user held
				// down key for too long), stray keydown events.
				if (openOnKeyUp) {
					this._openOnKeyUp = true;
					e.stopPropagation();
					e.preventDefault();
				}
			}
		},

		/**
		 * Callback when the user releases a key while focused on the button node.
		 * @param {Event} e
		 * @private
		 */
		_dropDownKeyUpHandler: function (e) {
			// Ignore event if it happened inside the dropdown.  This happens when the root node
			// is the button to open the dropdown, but it also contains the dropdown.
			if (this._eventOnDropdown(e)) {
				return;
			}

			this._justGotKeyUp = true;

			if (this._openOnKeyUp) {
				delete this._openOnKeyUp;
				this.openDropDown();
			}

			// Don't clear flag until after browser converts the SPACE/ENTER key into a "click" event.
			this.defer(function () {
				this._justGotKeyUp = false;
			});
		},

		_activatedHandler: function () {
			// Called when focus has shifted to this widget or its dropdown.
			this.activated = true;
		},

		_deactivatedHandler: function () {
			// Called when focus has shifted away from this widget and its dropdown.

			this.activated = false;

			// Close dropdown but don't focus my <input>.  User may have focused somewhere else (ex: clicked another
			// input), and even if they just clicked a blank area of the screen, focusing my <input> will unwantedly
			// popup the keyboard on mobile.
			this.closeDropDown(false);
		},

		/**
		 * Creates/loads the drop down.
		 * Returns a Promise for the dropdown, or if loaded synchronously, the dropdown itself.
		 *
		 * Applications must either:
		 *
		 * 1. set the `dropDown` property to point to the dropdown (as an initialisation parameter)
		 * 2. override this method to create custom drop downs on the fly, returning a reference or promise
		 *    for the dropdown
		 * 3. listen for a `delite-display-load` event, and then call event.setChild() with an Object like
		 *    `{child: dropDown}` or a Promise for such an Object
		 *
		 * With option (2) or (3) the application is responsible for destroying the dropdown.
		 *
		 * @returns {Element|Promise} Element or Promise for the dropdown
		 * @protected
		 * @fires module:delite/DisplayContainer#delite-display-load
		 */
		loadDropDown: function () {
			if (this.dropDown) {
				return this.dropDown;
			} else {
				// tell app controller we are going to show the dropdown; it must return a pointer to the dropdown
				var dropdown;
				this.emit("delite-display-load", {
					setChild: function (val) { dropdown = val; }
				});
				return Promise.resolve(dropdown).then(function (value) { return value.child; });
			}
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
				return this.openDropDown();
			} else {
				return this.closeDropDown(true);	// refocus button to avoid hiding node w/focus
			}
		},

		/**
		 * Creates the drop down if it doesn't exist, loads the data
		 * if there's an href and it hasn't been loaded yet, and
		 * then opens the drop down.  This is basically a callback when the
		 * user presses the down arrow button to open the drop down.
		 * @returns {Promise} Promise for the drop down widget that fires when drop down is created and loaded.
		 * @protected
		 * @fires module:delite/popup#delite-before-show
		 * @fires module:delite/popup#delite-after-show
		 */
		openDropDown: function () {
			// If openDropDown() has already been called, don't do anything
			if (this._openDropDownPromise) {
				return this._openDropDownPromise;
			}

			// Is the dropdown being opened due to a SPACE/ENTER/down arrow keystroke?
			// Use this.hovering flag since JAWS sometimes suppresses keydown/keyup events.
			// Side effect: treats touch click on mobile like a keyboard click,
			// but I think that's actually what we want for focus, since
			// the mobile popup can cover the original anchor node.
			var keyboard = this._justGotKeyUp || !this.hovering;

			// will be set to true if closeDropDown() is called before the loadDropDown() promise completes
			var canceled;

			var loadDropDownPromise = this.loadDropDown();

			// eslint-disable-next-line complexity
			this._openDropDownPromise = Promise.resolve(loadDropDownPromise).then(function (dropDown) {
				if (this._previousDropDown && this._previousDropDown !== dropDown) {
					popup.detach(this._previousDropDown);
					delete this._previousDropDown;
				}

				if (canceled) { return; }
				delete this._cancelPendingDisplay;

				this._currentDropDown = dropDown;
				var behaviorNode = this.behaviorNode || this,
					aroundNode = this.aroundNode || behaviorNode,
					self = this;

				// Generate id for anchor if it's not already specified
				if (!this.id) {
					this.id = "HasDropDown_" + this.widgetId;
				}

				var popupStateNode = this.popupStateNode || this.focusNode || this.buttonNode ||
					this.behaviorNode || this;

				var retVal = popup.open({
					parent: behaviorNode,
					popup: dropDown,
					around: aroundNode,
					orient: typeof this.dropDownPosition === "function" ?
						this.dropDownPosition.bind(this) : this.dropDownPosition,
					maxHeight: this.maxHeight,
					underlay: this.underlay,
					beforeSize: function () {
						// Called on initial display and also when aroundNode's width changes due to viewport resize.
						// Sets width of dropdown [including scrollbar] to match width of aroundNode.
						var initialOrient = typeof self.dropDownPosition === "function" ?
							self.dropDownPosition() : self.dropDownPosition;
						if (initialOrient[0] !== "center") {
							dropDown.style.width = "";
							dropDown.style.minWidth = "";

							if (self.forceWidth) {
								dropDown.style.width = aroundNode.offsetWidth + "px";
							} else if (self.autoWidth) {
								dropDown.style.minWidth = aroundNode.offsetWidth + "px";
							}
						}
					},
					onExecute: function () {
						self.closeDropDown(true);
					},
					onCancel: function () {
						self.closeDropDown(true);
					},
					onClose: function () {
						popupStateNode.classList.remove("d-drop-down-open");
						self.opened = false;

						// Avoid complaint about aria-owns pointing to hidden element.
						popupStateNode.removeAttribute("aria-owns");
					}
				});

				popupStateNode.classList.add("d-drop-down-open");
				this.opened = true;

				if (this.dropDownType !== "dialog") {
					// Note: Not setting when dropDownType is dialog to workaround JAWS bug #511.
					popupStateNode.setAttribute("aria-owns", dropDown.id);
				}

				// Set aria-labelledby on dropdown if it's not already set to something more meaningful
				if (dropDown.getAttribute("role") !== "presentation" && !dropDown.hasAttribute("aria-label")
						&& !dropDown.hasAttribute("aria-labelledby")) {
					dropDown.setAttribute("aria-labelledby", behaviorNode.id);
				}

				// Focus the dropdown if it was opened by clicking, and focusOnPointerOpen is true,
				// or if it was opened by keyboard, and focusOnKeyboardOpen is true.
				// Don't focus it if it was opened by hovering, in which case this.activated is false.
				// However, DO focus when opened on iOS through VoiceOver, in which case this.activated is also false.
				// Give some time for popup to initialize, especially when dealing with LitWidget subclasses
				// which don't render anything until the first refreshRendering() call.
				if (dropDown.focus && (keyboard ? this.focusOnKeyboardOpen : this.focusOnPointerOpen)
						&& (this.activated || mobile)) {
					this._focusDropDownTimer = this.defer(function () {
						dropDown.focus();
						delete this._focusDropDownTimer;
					}, this.focusOnOpenDelay);
				}

				return {
					dropDown: dropDown,
					position: retVal
				};
			}.bind(this));

			// Setup a hook for closeDropDown() to abort an in-progress showDropDown() operation.
			this._cancelPendingDisplay = function () {
				if (loadDropDownPromise.cancel) { loadDropDownPromise.cancel(); }
				canceled = true;
				delete this._cancelPendingDisplay;
				delete this._openDropDownPromise;
			}.bind(this);

			return this._openDropDownPromise;
		},

		/**
		 * Closes the drop down on this widget.
		 * @param {boolean} [focus] - If true, refocus this widget.
		 * @protected
		 * @fires module:delite/popup#delite-before-hide
		 * @fires module:delite/popup#delite-after-hide
		 */
		closeDropDown: function (focus) {
			var dropdown = this._currentDropDown;

			if (this._cancelPendingDisplay) {
				this._cancelPendingDisplay();
			}
			if (this._openDropDownPromise) {
				delete this._openDropDownPromise;
			}

			if (this._focusDropDownTimer) {
				this._focusDropDownTimer.remove();
				delete this._focusDropDownTimer;
			}

			if (this.opened) {
				var behaviorNode = this.behaviorNode || this;

				popup.close(dropdown, function () {
					if (focus && behaviorNode.focus) {
						behaviorNode.focus();
					}
				});
				this.opened = false;

				this._previousDropDown = this._currentDropDown;
				delete this._currentDropDown;
			}
		}
	});

	/**
	 * Widget to setup HasDropDown behavior on an arbitrary Element or Custom Element.
	 * @class module:delite/HasDropDown.HasDropDownCustomElement
	 * @augments module:delite/Widget
	 */
	HasDropDown.HasDropDownCustomElement = register("d-has-drop-down", [HTMLElement, HasDropDown], {});

	return HasDropDown;
});
