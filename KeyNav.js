/** @module delite/KeyNav */
define([
	"dcl/dcl",
	"./features",
	"./Widget",
	"dpointer/events"		// so can just monitor for "pointerdown"
], function (
	dcl,
	has,
	Widget
) {

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
	 * Return true if node is "clickable" via keyboard space / enter key
	 * @param {Element} node
	 * @returns {boolean}
	 */
	function keyboardClickable(node) {
		return !node.readOnly && /^(button|a)$/i.test(node.nodeName);
	}

	/**
	  * A mixin to allow arrow key and letter key navigation of child Elements.
	  * It can be used by delite/Container based widgets with a flat list of children,
	  * or more complex widgets like a Tree.
	  *
	  * To use this mixin, the subclass must:
	  *
	  * - Implement one method for each keystroke that the subclass wants to handle.
	  *   The methods for up and down arrow keys are `upKeyHandler() and `downKeyHandler()`.
	  *   For BIDI support, the left and right arrows are handled specially, mapped to the `previousKeyHandler()`
	  *   and `nextKeyHandler()` methods in LTR mode, or reversed in RTL mode.
	  *   Otherwise, the method name is based on the key names
	  *   defined by https://developer.mozilla.org/en-US/docs/Web/API/KeyboardEvent/key, for example `homeKeyHandler()`.
	  *   The method takes two parameters: the event, and the currently navigated node.
	  *   Most subclasses will want to implement either `previousKeyHandler()`
	  *   and `nextKeyHandler()`, or `downKeyHandler()` and `upKeyHandler()`.
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
		declaredClass: "delite/KeyNav",

		/*jshint -W101*/
		/**
		 * When true, focus the descendant widgets as the user navigates to them via arrow keys or keyboard letter
		 * search.  When false, rather than focusing the widgets, it merely sets `navigatedDescendant`,
		 * and sets the `d-active-descendant` class on the descendant widget the user has navigated to.
		 *
		 * False mode is intended for widgets like ComboBox where the focus is somewhere outside this widget
		 * (typically on an `<input>`) and keystrokes are merely being forwarded to the KeyNav widget.
		 *
		 * When set to false:
		 *
		 * - Navigable descendants shouldn't have any tabIndex (as opposed to having tabIndex=-1).
		 * - The focused element should specify `aria-owns` to point to this KeyNav Element.
		 * - The focused Element must be kept synced so that `aria-activedescendant` points to the currently
		 *   navigated descendant.  Do this responding to the `keynav-child-navigated` event emitted by this widget,
		 *   or by calling `observe()` and monitoring changed to `navigatedDescendant`.
		 * - The focused Element must forward keystrokes by calling `emit("keydown", ...)` and/or
		 *   `emit("keypress", ...)` on this widget.
		 * - You must somehow set the initial navigated descendant, typically by calling `navigateToFirst()` either
		 *   when the the dropdown is opened, or on the first call to `downKeyHandler()`.
		 * - You must have some CSS styling so that the currently navigated node is apparent.
		 *
		 * See http://www.w3.org/WAI/GL/wiki/Using_aria-activedescendant_to_allow_changes_in_focus_within_widgets_to_be_communicated_to_Assistive_Technology#Example_1:_Combobox
		 * for details.
		 * @member {boolean}
		 * @default true
		 * @protected
		 */
		focusDescendants: true,
		/*jshint +W101*/

		/**
		 * The currently navigated descendant, or null if there isn't one.
		 * @member {Element}
		 * @readonly
		 * @protected
		 */
		navigatedDescendant: null,

		/**
		 * Selector to identify which descendant Elements are navigable via arrow keys or
		 * keyboard search.  Note that for subclasses like a Tree, one navigable node could be a descendant of another.
		 *
		 * It's either a function that takes an Element parameter and returns true/false,
		 * or a CSS selector string, for example ".list-item".
		 *
		 * By default, the direct DOM children of this widget are considered the selectable descendants.
		 *
		 * Must be set in the prototype rather than on the instance.
		 *
		 * @member {string|Function}
		 * @protected
		 * @constant
		 */
		descendantSelector: null,

		/**
		 * The node to receive the KeyNav behavior.
		 * Can be set in a template via a `attach-point` assignment.
		 * If missing, then `this.containerNode` or `this` will be used.
		 * If set, then subclass must set the tabIndex on this node rather than the root node.
		 * @member {Element}
		 * @protected
		 */
		keyNavContainerNode: null,

		/**
		 * Figure out effective navigable descendant of this event.
		 * @param {Event} evt
		 * @private
		 */
		_getTargetElement: function (evt) {
			for (var child = evt.target; child !== this; child = child.parentNode) {
				if (this._selectorFunc(child)) {
					return child;
				}
			}
			return null;
		},

		postRender: function () {
			// If keyNavContainerNode unspecified, set to default value.
			if (!this.keyNavContainerNode) {
				this.keyNavContainerNode = this.containerNode || this;
			}

			this.on("keypress", this._keynavKeyPressHandler.bind(this), this.keyNavContainerNode);
			this.on("keydown", this._keynavKeyDownHandler.bind(this), this.keyNavContainerNode);

			this.on("pointerdown", this.pointerdownHandler.bind(this), this.keyNavContainerNode);
			this.on("focusin", this.focusinHandler.bind(this), this.keyNavContainerNode);
			this.on("focusout", this.focusoutHandler.bind(this), this.keyNavContainerNode);

			// Setup function to check which child nodes are navigable.
			if (typeof this.descendantSelector === "string") {
				var matchesFuncName = has("dom-matches");
				this._selectorFunc = function (elem) {
					return elem[matchesFuncName](this.descendantSelector);
				};
			} else if (this.descendantSelector) {
				this._selectorFunc = this.descendantSelector;
			} else {
				this._selectorFunc = function (elem) { return elem.parentNode === this.containerNode; };
			}
		},

		connectedCallback: dcl.after(function () {
			// If the user hasn't specified a tabindex declaratively, then set to default value.
			var container = this.keyNavContainerNode;
			if (this.focusDescendants && !container.hasAttribute("tabindex")) {
				container.tabIndex = "0";
			}
		}),

		/**
		 * Called on pointerdown event (on container or child of container).
		 * Navigation occurs on pointerdown, to match behavior of native elements.
		 * Normally this handler isn't needed as it's redundant w/the focusin event.
		 */
		pointerdownHandler: function (evt) {
			var target = this._getTargetElement(evt);
			if (target) {
				this._descendantNavigateHandler(target, evt);
			}
		},

		/**
		 * Called on focus of container or child of container.
		 */
		focusinHandler: function (evt) {
			var container = this.keyNavContainerNode;
			if (this.focusDescendants) {
				if (evt.target === this || evt.target === container) {
					// Ignore spurious focus event:
					// On IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
					if (!this.navigatedDescendant) {
						// Focus the first child but do it on a delay so that activationTracker sees my "focus"
						// event before seeing the "focus" event on the child widget.
						this.defer(this.focus);
					}
				} else {
					// When container's descendant gets focus,
					// remove the container's tabIndex so that tab or shift-tab
					// will go to the fields after/before the container, rather than the container itself.
					// Also avoids Safari and Firefox problems with nested focusable elements.
					if (container.hasAttribute("tabindex")) {
						this._savedTabIndex = container.tabIndex;
						container.removeAttribute("tabindex");
					}

					// Handling for when navigatedDescendant or a node inside a navigableDescendant gets focus.
					var navigatedDescendant = this._getTargetElement(evt);
					if (navigatedDescendant) {
						if (evt.target === navigatedDescendant) {
							// If the navigable descendant itself is focused, then set tabIndex=0 so that tab and
							// shift-tab work correctly.
							navigatedDescendant.tabIndex = this._savedTabIndex;
						}

						// Note: when focus is moved outside the navigable descendant,
						// focusoutHandler() resets its tabIndex to -1.

						this._descendantNavigateHandler(navigatedDescendant, evt);
					}
				}
			}
		},

		/**
		 * Called on blur of container or child of container.
		 */
		focusoutHandler: function (evt) {
			if (this.focusDescendants) {
				// Note: don't use this.navigatedDescendant because it may or may not have already been
				// updated to point to the new descendant, depending on if navigation was by mouse
				// or keyboard.
				var previouslyNavigatedDescendant = this._getTargetElement(evt);
				if (previouslyNavigatedDescendant) {
					if (previouslyNavigatedDescendant !== evt.relatedTarget) {
						// If focus has moved outside of the previously navigated descendant, then set its
						// tabIndex back to -1, for future time when navigable descendant is clicked.
						previouslyNavigatedDescendant.tabIndex = "-1";
						previouslyNavigatedDescendant.classList.remove("d-active-descendant");

						if (this.navigatedDescendant === previouslyNavigatedDescendant) {
							this.navigatedDescendant = null;
						}
					}
				}

				// If focus has moved outside of container, then restore container's tabindex.
				if ("_savedTabIndex" in this && !this.keyNavContainerNode.contains(evt.relatedTarget)) {
					this.keyNavContainerNode.setAttribute("tabindex", this._savedTabIndex);
					delete this._savedTabIndex;
				}
			}
		},

		/**
		 * Called on home key.
		 * @param {Event} evt
		 * @param {Element} navigatedDescendant
		 * @protected
		 */
		homeKeyHandler: function (evt) {
			this.navigateToFirst(evt);
		},

		/**
		 * Called on end key.
		 * @param {Event} evt
		 * @param {Element} navigatedDescendant
		 * @protected
		 */
		endKeyHandler: function (evt) {
			this.navigateToLast(evt);
		},

		/**

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
		 * @param {Event} [triggerEvent] - The event that lead to the navigation, or `undefined`
		 *     if the navigation is triggered programmatically.
		 * @protected
		 */
		navigateToFirst: function (triggerEvent) {
			this.navigateTo(this.getNext(this.keyNavContainerNode, 1), triggerEvent);
		},

		/**
		 * Navigate to the last navigable descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 * @param {Event} [triggerEvent] - The event that lead to the navigation, or `undefined`
		 *     if the navigation is triggered programmatically.
		 * @protected
		 */
		navigateToLast: function (triggerEvent) {
			this.navigateTo(this.getNext(this.keyNavContainerNode, -1), triggerEvent);
		},

		/**
		 * Navigate to the specified descendant.
		 * Note that if `focusDescendants` is false, this will merely set the `d-active-descendant` class
		 * rather than actually focusing the descendant.
		 * @param {Element} child - Reference to the descendant.
		 * @param {Event} [triggerEvent] - The event that lead to the navigation, or `undefined`
		 *     if the navigation is triggered programmatically.
		 * @protected
		 */
		navigateTo: function (child, triggerEvent) {
			if (this.focusDescendants) {
				// For IE focus outline to appear, must set tabIndex before focus.
				// If this._savedTabIndex is set, use it instead of this.tabIndex, because it means
				// the container's tabIndex has already been changed to -1.
				child.tabIndex = "_savedTabIndex" in this ? this._savedTabIndex : this.keyNavContainerNode.tabIndex;
				child.focus();

				// _descendantNavigateHandler() will be called automatically from child's focus event.
			} else {
				this._descendantNavigateHandler(child, triggerEvent);
			}
		},

		/**
		 * Called when a child is navigated to, either by user clicking it, or programatically by arrow key handling
		 * code.  It marks that the specified child is the navigated one.
		 * @param {Element} child
		 * @param {Event} triggerEvent - The event that lead to the navigation, or `undefined`
		 *     if the navigation is triggered programmatically.
		 * @fires module:delite/KeyNav#keynav-child-navigated
		 * @private
		 */
		_descendantNavigateHandler: function (child, triggerEvent) {
			if (child && child !== this.navigatedDescendant) {
				if (this.navigatedDescendant) {
					this.navigatedDescendant.classList.remove("d-active-descendant");
					this.navigatedDescendant.tabIndex = "-1";
				}

				this.emit("keynav-child-navigated", {
					oldValue: this.navigatedDescendant,
					newValue: child,
					triggerEvent: triggerEvent
				});

				// mark that the new node is the currently navigated one
				this.navigatedDescendant = child;
				if (child) {
					child.classList.add("d-active-descendant");
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
		 * Called when keydown.  Ignores key events inside <input>, <button>, etc.,
		 * and passes the other events to the _processKeyDown() method.
		 * @param {Event} evt
		 * @private
		 */
		_keynavKeyDownHandler: function (evt) {
			// Ignore left, right, home, end, and space on <input> controls.
			if (takesInput(evt.target) &&
				(evt.key === "ArrowLeft" || evt.key === "ArrowRight" ||
				evt.key === "Home" || evt.key === "End" || evt.key === "Spacebar")) {
				return;
			}

			// Ignore space and enter on <button> elements.
			if (keyboardClickable(evt.target) && (evt.key === "Enter" || evt.key === "Spacebar")) {
				return;
			}

			this._processKeyDown(evt);
		},

		/**
		 * Called when there's a keydown event that should be handled by the KeyNav class.
		 * @param evt
		 * @private
		 */
		_processKeyDown: function (evt) {
			if (evt.key === "Spacebar" && this._searchTimer && !(evt.ctrlKey || evt.altKey || evt.metaKey)) {
				// If the user types some string like "new york", interpret the space as part of the search rather
				// than to perform some action, even if there is a key handler method defined.

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
		 * If the class has defined a method to handle the specified key, then call it.
		 * See the description of `KeyNav` for details on how to define methods.
		 * @param {Event} evt
		 * @private
		 */
		_applyKeyHandler: function (evt) {
			// Get name of method to call
			var methodName;
			switch (evt.key) {
			case "ArrowLeft":
				methodName = this.effectiveDir === "rtl" ? "nextKeyHandler" : "previousKeyHandler";
				break;
			case "ArrowRight":
				methodName = this.effectiveDir === "rtl" ? "previousKeyHandler" : "nextKeyHandler";
				break;
			case "ArrowUp":
			case "ArrowDown":
				methodName = evt.key.charAt(5).toLowerCase() + evt.key.substr(6) + "KeyHandler";
				break;
			default:
				methodName = evt.key.charAt(0).toLowerCase() + evt.key.substr(1) + "KeyHandler";
			}

			// Call it
			var func = this[methodName];
			if (func) {
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
			if (takesInput(evt.target) || evt.charCode <= 32 || evt.ctrlKey || evt.altKey || evt.metaKey) {
				return;
			}

			evt.preventDefault();
			evt.stopPropagation();

			this._keyboardSearch(evt, evt.key.toLowerCase());
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
			var container = this.keyNavContainerNode, origChild = child;
			function dfsNext(node) {
				if (node.firstElementChild) { return node.firstElementChild; }
				while (node !== container) {
					if (node.nextElementSibling) { return node.nextElementSibling; }
					node = node.parentNode;
				}
				return container;	// loop around, plus corner case when no children
			}
			function dfsLast(node) {
				while (node.lastElementChild) { node = node.lastElementChild; }
				return node;
			}
			function dfsPrev(node) {
				return node === container ? dfsLast(container) : // loop around, plus corner case when no children
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
