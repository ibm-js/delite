/** @module delite/KeyNav */
define([
	"dcl/dcl",
	"dojo/dom-class",
	"delite/keys", // keys.END keys.HOME, keys.LEFT_ARROW etc.
	"./features",
	"./Widget",
	"dpointer/events",		// so can just monitor for "pointerdown"
	"./activationTracker"	// delite-deactivated event when focus removed from KeyNav and logical descendants
], function (dcl, domClass, keys, has, Widget) {
	/**
	 * Return true if node is an `<input>` or similar that responds to keyboard input.
	 * @param {Element} node
	 * @returns {boolean}
	 */
	function takesInput(node) {
		var tag = node.nodeName.toLowerCase();

		return !node.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url|range)$/.test(node.type)));
	}

	/**
	  * A mixin to allow arrow key and letter key navigation of child Elements.
	  * It can be used by delite/Container based widgets with a flat list of children,
	  * or more complex widgets like a Tree.
	  * 
	  * To use this mixin, the subclass must:
	  * 
	  * - Implement `onLeftArrow()`, `onRightArrow()``onDownArrow()`, `onUpArrow()` methods to handle
	  *   left/right/up/down keystrokes.
	  * - Set all navigable descendants' initial tabIndex to "-1"; both initial descendants and any
	  *   descendants added later, by for example `addChild()`.  Exception: if `focusDescendants` is false then the
	  *   descendants shouldn't have any tabIndex at all.
	  * - Define `descendantSelector` as a function or string that identifies navigable child Elements.
	  * - If the descendant elements contain text, they should have a label attribute.  KeyNav uses the label
	  *   attribute for letter key navigation.
	  *
	  * @mixin module:delite/KeyNav
	  * @augments module:delite/Widget
	  */
	return dcl(Widget, /** @lends module:delite/KeyNav# */ {

		/**
		 * When true, focus the descendant widgets as the user navigates to them via arrow keys or keyboard letter
		 * search.  When false, rather than focusing the widgets, it merely sets `navigatedDescendant`,
		 * and sets the `d-active-descendant` class on the descendant widget the user has navigated to.
		 *
		 * False mode is intended for widgets like ComboBox where the focus is somewhere else and
		 * keystrokes are merely being forwarded to the KeyNav widget.
		 * @member {boolean}
		 * @default true
		 * @protected
		 */
		focusDescendants: true,

		/**
		 * The currently navigated descendant, or null if there isn't one.
		 * @member {Element}
		 * @readonly
		 * @protected
		 */
		navigatedDescendant: null,

		/**
		 * Hash mapping key code (arrow keys and home/end key) to functions to handle those keys.
		 * Usually not used directly, as subclasses can instead override onLeftArrow() etc.
		 * Must be set before postRender().
		 * @member {Object}
		 * @protected
		 */
		keyHandlers: null,

		/**
		 * Selector to identify which descendants Elements are navigable via arrow keys or
		 * keyboard search.  Note that for subclasses like a Tree, one navigable node could be a descendant of another.
		 *
		 * By default, the direct DOM children of this widget are considered as the children.
		 *
		 * Must be set in the prototype rather than on the instance.
		 *
		 * @member {string|Function}
		 * @protected
		 * @constant
		 */
		descendantSelector: null,

		/**
		 * Figure out effective target of this event, either a navigable node (a.k.a. a child),
		 * or this widget itself.
		 * The meaning of "child" here is complicated because this could be a Tree with nested children.
		 * @param {Event} evt
		 * @private
		 */
		_getTargetElement: function (evt) {
			for (var child = evt.target; child !== this; child = child.parentNode) {
				if (this._selectorFunc(child)) {
					return child;
				}
			}
			return this;
		},

		postRender: function () {
			var self = this;

			// Setup function to check which child nodes are navigable.
			if (typeof this.descendantSelector === "string") {
				var matchesFuncName = has("dom-matches");
				this._selectorFunc = function (elem) {
					return elem[matchesFuncName](this.descendantSelector);
				};
			} else if (this.descendantSelector) {
				this._selectorFunc = this.descendantSelector;
			} else {
				this._selectorFunc = function (child) { return child.parentNode === self.containerNode; };
			}

			if (!this.keyHandlers) {
				var keyCodes = this.keyHandlers = {};
				keyCodes[keys.HOME] = function () {
					self.navigateToFirst();
				};
				keyCodes[keys.END] = function () {
					self.navigateToLast();
				};
				keyCodes[this.isLeftToRight() ? keys.LEFT_ARROW : keys.RIGHT_ARROW] = this.onLeftArrow.bind(this);
				keyCodes[this.isLeftToRight() ? keys.RIGHT_ARROW : keys.LEFT_ARROW] = this.onRightArrow.bind(this);
				keyCodes[keys.UP_ARROW] = this.onUpArrow.bind(this);
				keyCodes[keys.DOWN_ARROW] = this.onDownArrow.bind(this);
			}

			this.on("keypress", this._keynavKeyPressHandler.bind(this));
			this.on("keydown", this._keynavKeyDownHandler.bind(this));
			this.on("pointerdown", function (evt) {
				var target = self._getTargetElement(evt);
				if (target !== self) {
					self._descendantNavigateHandler(target, evt);
				}
			});

			if (this.focusDescendants) {
				this.on("delite-deactivated", this._keynavDeactivatedHandler.bind(this));

				// TODO: this looks wrong, focusin shouldn't bubble so we shouldn't get any notification
				// from descendant focus events.
				this.on("focusin", function (evt) {
					var target = self._getTargetElement(evt);
					if (target === self) {
						self._keynavFocusHandler(evt);
					} else {
						self._descendantNavigateHandler(target, evt);
					}
				});
			}
		},

		attachedCallback: function () {
			// If the user hasn't specified a tabindex declaratively, then set to default value.
			if (this.focusDescendants && !this.hasAttribute("tabindex")) {
				this.tabIndex = "0";
			}
		},

		/**
		 * Called on left arrow key, or right arrow key if widget is in RTL mode.
		 * Should go back to the previous child in horizontal container widgets like Toolbar.
		 * @protected
		 * @abstract
		 */
		onLeftArrow: function () {
		},

		/**
		 * Called on right arrow key, or left arrow key if widget is in RTL mode.
		 * Should go to the next child in horizontal container widgets like Toolbar.
		 * @protected
		 * @abstract
		 */
		onRightArrow: function () {
		},

		/**
		 * Called on up arrow key.  Should go to the previous child in vertical container widgets like Menu.
		 * @protected
		 * @abstract
		 */
		onUpArrow: function () {
		},

		/**
		 * Called on down arrow key.  Should go to the next child in vertical container widgets like Menu.
		 * @protected
		 * @abstract
		 */
		onDownArrow: function () {
		},

		/**
		 * Default focus() implementation: navigate to the first navigable descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 */
		focus: function () {
			this.navigateToFirst();
		},

		/**
		 * Navigate to the first navigable descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 * @protected
		 */
		navigateToFirst: function () {
			this.navigateTo(this.getNext(this, 1));
		},

		/**
		 * Navigate to the last navigable descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 * @protected
		 */
		navigateToLast: function () {
			this.navigateTo(this.getNext(this, -1));
		},

		/**
		 * Navigate to the specified descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 * @param {Element} child - Reference to the descendant.
		 * @param {boolean} last - If true and if descendant has multiple focusable nodes, focus the
		 *     last one instead of the first one.  This assumes that the child's `focus()` method takes a boolean
		 *     parameter where `true` means to focus the last child.
		 * @protected
		 */
		navigateTo: function (child, last) {
			if (this.focusDescendants) {
				// For IE focus outline to appear, must set tabIndex before focus.
				// If this._savedTabIndex is set, use it instead of this.tabIndex, because it means
				// the container's tabIndex has already been changed to -1.
				child.tabIndex = "_savedTabIndex" in this ? this._savedTabIndex : this.tabIndex;
				child.focus(last ? "end" : "start");

				// _descendantNavigateHandler() will be called automatically from child's focus event.
			} else {
				this._descendantNavigateHandler(child);
			}
		},

		/**
		 * Handler for when the container itself gets focus.
		 * Called only when `this.focusDescendants` is true.
		 * Initially the container itself has a tabIndex, but when it gets focus, switch focus to first child.
		 * 
		 * @param {Event} evt
		 * @private
		 */
		_keynavFocusHandler: function () {
			// Note that we can't use the delite-activated event because switching focus from that
			// event handler confuses the activationTracker.js code (because it recursively triggers the
			// delite-activated event).  Also, delite-activated would fire when focus went
			// directly to a child widget due to mouse click.

			// Ignore spurious focus event:
			// On IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if (this.navigatedDescendant) {
				return;
			}

			// When the container gets focus by being tabbed into, or a descendant gets focus by being clicked,
			// remove the container's tabIndex so that tab or shift-tab
			// will go to the fields after/before the container, rather than the container itself
			this._savedTabIndex = this.tabIndex;
			this.removeAttribute("tabindex");

			this.focus();
		},

		/**
		 * Handler for when focus is moved away the container, and its descendant (popup) widgets.
		 * Called only when `this.focusDescendants` is true.
		 * @private
		 */
		_keynavDeactivatedHandler: function () {
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)

			// TODO: for 2.0 consider changing this to blur whenever the container blurs, to be truthful that there is
			// no focused child at that time.
			this.setAttribute("tabindex", this._savedTabIndex);
			delete this._savedTabIndex;
			if (this.navigatedDescendant) {
				this.navigatedDescendant.tabIndex = "-1";
				this.navigatedDescendant = null;
			}
		},

		/**
		 * Called when a child is navigated to, either by user clicking it, or programatically by arrow key handling
		 * code.  It marks that the specified child is the navigated one.
		 * @param {Element} child
		 * @private
		 */
		_descendantNavigateHandler: function (child) {
			if (child && child !== this.navigatedDescendant) {
				if (this.focusDescendants) {
					if (this.navigatedDescendant && !this.navigatedDescendant._destroyed) {
						// mark that the previously focusable node is no longer focusable
						this.navigatedDescendant.tabIndex = "-1";
					}

					// If container still has tabIndex setting then remove it; instead we'll set tabIndex on child
					if (!("_savedTabIndex" in this)) {
						this._savedTabIndex = this.tabIndex;
						this.removeAttribute("tabindex");
					}

					child.tabIndex = this._savedTabIndex;
				} else {
					if (child) {
						this.setAttribute("aria-activedescendant", child.id);
					} else {
						this.removeAttribute("aria-activedescendant");
					}
				}

				if (this.navigatedDescendant) {
					domClass.remove(this.navigatedDescendant, "d-active-descendant");
				}

				/**
				 * Dispatched after the user has selected a different descendant, by clicking, arrow keys,
				 * or keyboard search.
				 * @example
				 * widget.on("keynav-child-navigated", function (evt) {
				 *	console.log("old value: " + evt.oldValue);
				 *	console.log("new value: " + evt.newValue);
				 * }
				 * @event module:delite/KeyNav#keynav-child-navigated
				 * @property {number} oldValue - The previously selected item.
				 * @property {number} newValue - The new selected item.
				 */
				this.emit("keynav-child-navigated", {
					oldValue: this.navigatedDescendant,
					newValue: child
				});

				// mark that the new node is the currently navigated one
				this.navigatedDescendant = child;
				if (child) {
					domClass.add(child, "d-active-descendant");
				}
			}
		},

		_searchString: "",

		/**
		 * If multiple characters are typed where each keystroke happens within
		 * multiCharSearchDuration of the previous keystroke,
		 * search for nodes matching all the keystrokes.
		 * 
		 * For example, typing "ab" will search for entries starting with
		 * "ab" unless the delay between "a" and "b" is greater than `multiCharSearchDuration`.
		 * 
		 * @member {number} KeyNav#multiCharSearchDuration
		 * @default 1000
		 */
		multiCharSearchDuration: 1000,

		/**
		 * When a key is pressed that matches a child item,
		 * this method is called so that a widget can take appropriate action if necessary.
		 * 
		 * @param {Element} item
		 * @param {Event} evt
		 * @param {string} searchString
		 * @param {number} numMatches
		 * @private
		 */
		_keyboardSearchHandler: function (item, /*jshint unused: vars */ evt, searchString, numMatches) {
			if (item) {
				this.navigateTo(item);
			}
		},

		/**
		 * Compares the searchString to the Element's text label, returning:
		 *
		 * - -1: a high priority match  and stop searching
		 * - 0: not a match
		 * - 1: a match but keep looking for a higher priority match
		 * 
		 * @param {Element} item
		 * @param {string} searchString
		 * @returns {number}
		 * @private
		 */
		_keyboardSearchCompare: function (item, searchString) {
			var element = item,
				text = item.label || (element.focusNode ? element.focusNode.label : "") || element.textContent || "",
				currentString = text.replace(/^\s+/, "").substr(0, searchString.length).toLowerCase();

			// stop searching after first match by default
			return (!!searchString.length && currentString === searchString) ? -1 : 0;
		},

		/**
		 * When a key is pressed, if it's an arrow key etc. then it's handled here.
		 * @param {Event} evt
		 * @private
		 */
		_keynavKeyDownHandler: function (evt) {
			// Ignore left, right, home, end, and space on <input> controls
			if (takesInput(evt.target) &&
				(evt.keyCode === keys.LEFT_ARROW || evt.keyCode === keys.RIGHT_ARROW ||
					evt.keyCode === keys.HOME || evt.keyCode === keys.END || evt.keyCode === keys.SPACE)) {
				return;
			}

			if (evt.keyCode === keys.SPACE && this._searchTimer && !(evt.ctrlKey || evt.altKey || evt.metaKey)) {
				// If the user types some string like "new york", interpret the space as part of the search rather
				// than to perform some action, even if this.keyHandlers[evt.keyCode] is set).

				// Stop a11yclick from interpreting key as a click event.
				// Also stop IE from scrolling, and most browsers (except FF) from emitting keypress event.
				evt.preventDefault();

				this._keyboardSearch(evt, " ");
			} else {
				// Otherwise call the handler specified in this.keyHandlers.
				this._applyKeyHandler(evt);
			}
		},

		/**
		 * Call handler specified in this.keyHandlers[] for the current keystroke.
		 * @param evt
		 * @private
		 */
		_applyKeyHandler: function (evt) {
			var func = this.keyHandlers[evt.keyCode];
			if (func) {
				if (typeof func === "string") {
					func = this[func];
				}
				func.call(this, evt, this.navigatedDescendant);
				evt.stopPropagation();
				evt.preventDefault();
				this._searchString = ""; // so a DOWN_ARROW b doesn't search for ab
			}
		},

		/**
		 * When a printable key is pressed, it's handled here, searching by letter.
		 * @param {Event} evt
		 * @private
		 */
		_keynavKeyPressHandler: function (evt) {
			// Ignore:
			//		- keystrokes on <input> and <textarea>
			// 		- duplicate events on firefox (ex: arrow key that will be handled by keydown handler)
			//		- control sequences like CMD-Q.
			//		- the SPACE key (only occurs on FF)
			//
			// Note: if there's no search in progress, then SPACE should be ignored.   If there is a search
			// in progress, then SPACE is handled in _keynavKeyDownHandler.
			if (takesInput(evt.target) || evt.charCode <= keys.SPACE || evt.ctrlKey || evt.altKey || evt.metaKey) {
				return;
			}

			evt.preventDefault();
			evt.stopPropagation();

			this._keyboardSearch(evt, String.fromCharCode(evt.charCode).toLowerCase());
		},

		/**
		 * Perform a search of the widget's options based on the user's keyboard activity.
		 *
		 * Called on keypress (and sometimes keydown), searches through this widget's children
		 * looking for items that match the user's typed search string.  Multiple characters
		 * typed within `multiCharSearchDuration` of each other are combined for multi-character searching.
		 * @param {Event} evt
		 * @param {string} keyChar
		 * @private
		 */
		_keyboardSearch: function (evt, keyChar) {
			var
				matchedItem = null,
				searchString,
				numMatches = 0;

			if (this._searchTimer) {
				this._searchTimer.remove();
			}
			this._searchString += keyChar;
			var allSameLetter = /^(.)\1*$/.test(this._searchString);
			var searchLen = allSameLetter ? 1 : this._searchString.length;
			searchString = this._searchString.substr(0, searchLen);
			this._searchTimer = this.defer(function () { // this is the "success" timeout
				this._searchTimer = null;
				this._searchString = "";
			}, this.multiCharSearchDuration);
			var currentItem = this.navigatedDescendant || null;
			if (searchLen === 1 || !currentItem) {
				currentItem = this.getNext(currentItem, 1); // skip current
				if (!currentItem) {
					return;
				} // no items
			}
			var stop = currentItem;
			do {
				var rc = this._keyboardSearchCompare(currentItem, searchString);
				if (!!rc && numMatches++ === 0) {
					matchedItem = currentItem;
				}
				if (rc === -1) { // priority match
					numMatches = -1;
					break;
				}
				currentItem = this.getNext(currentItem, 1);
			} while (currentItem !== stop);

			this._keyboardSearchHandler(matchedItem, evt, searchString, numMatches);
		},

		/**
		 * Returns the next or previous navigable descendant, relative to "child".
		 * If "child" is this, then it returns the first focusable descendant (when dir === 1)
		 * or last focusable descendant (when dir === -1).
		 * @param {Element} child - The current child Element.
		 * @param {number} dir - 1 = after, -1 = before
		 * @returns {Element}
		 * @protected
		 */
		getNext: function (child, dir) {
			var root = this, origChild = child;
			function dfsNext(node) {
				if (node.firstElementChild) { return node.firstElementChild; }
				while (node !== root) {
					if (node.nextElementSibling) { return node.nextElementSibling; }
					node = node.parentNode;
				}
				return root;	// loop around, plus corner case when no children
			}
			function dfsLast(node) {
				while (node.lastElementChild) { node = node.lastElementChild; }
				return node;
			}
			function dfsPrev(node) {
				return node === root ? dfsLast(root) : // loop around, plus corner case when no children
					(node.previousElementSibling && dfsLast(node.previousElementSibling)) || node.parentNode;
			}
			while (true) {
				child = dir > 0 ? dfsNext(child) : dfsPrev(child);
				if (child === origChild) {
					return null;	// looped back to original child
				} else if (this._selectorFunc(child)) {
					return child;	// this child matches
				}
			}
		}
	});
});
