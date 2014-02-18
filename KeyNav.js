define([
	"dcl/dcl",
	"dojo/keys", // keys.END keys.HOME, keys.LEFT_ARROW etc.
	"dojo/_base/lang", // lang.hitch
	"dojo/on",
	"./Widget",
	"./focus"
], function (dcl, keys, lang, on, Widget) {

	// module:
	//		delite/KeyNav

	function takesInput(/*Element*/ node){
		// summary:
		//		Return true if node is an <input> or similar that responds to keyboard input

		var tag = node.nodeName.toLowerCase();

		return !node.readOnly && (tag === "textarea" || (tag === "input" &&
			/^(color|email|number|password|search|tel|text|url|range)$/.test(node.type)));
	}

	return dcl(Widget, {
		// summary:
		//		A mixin to allow arrow key and letter key navigation of child Elements.
		//		It can be used by delite/Container based widgets with a flat list of children,
		//		or more complex widgets like deliteful/Tree.
		//
		//		To use this mixin, the subclass must:
		//
		//			- Implement  _getNext(), _getFirst(), _getLast(), _onLeftArrow(), _onRightArrow()
		//			  _onDownArrow(), _onUpArrow() methods to handle home/end/left/right/up/down keystrokes.
		//			  Next and previous in this context refer to a linear ordering of the descendants used
		//			  by letter key search.
		//			- Set all navigable descendants' initial tabIndex to "-1"; both initial descendants and any
		//			  descendants added later, by for example addChild().
		//			- Define childSelector to a function or string that identifies focusable child Elements.
		//
		//		Note the word "child" in that class is used loosely, to refer to any descendant Element.
		//		If the child elements contain text though, they should have a label attribute.  KeyNav uses the label
		//		attribute for letter key navigation.

		/*=====
		// focusedChild: [protected readonly] Element
		//		The currently focused descendant, or null if there isn't one
		focusedChild: null,

		// _keyNavCodes: Object
		//		Hash mapping key code (arrow keys and home/end key) to functions to handle those keys.
		//		Usually not used directly, as subclasses can instead override _onLeftArrow() etc.
		_keyNavCodes: {},
		=====*/

		// childSelector: [protected abstract] Function||String
		//		Selector (passed to on.selector()) to identify what to treat as a navigable descendant. Used to monitor
		//		focus events and set this.focusedChild.   Must be set by implementing class.  If this is a string
		//		(ex: "> *"), then the implementing class must require dojo/query.
		childSelector: null,

		postCreate: function () {
			// If the user hasn't specified a tabindex declaratively, then set to default value.
			if (!this.hasAttribute("tabindex")){
				this.tabIndex = "0";
			}

			if (!this._keyNavCodes) {
				var keyCodes = this._keyNavCodes = {};
				keyCodes[keys.HOME] = lang.hitch(this, "focusFirstChild");
				keyCodes[keys.END] = lang.hitch(this, "focusLastChild");
				keyCodes[this.isLeftToRight() ? keys.LEFT_ARROW : keys.RIGHT_ARROW] = lang.hitch(this, "_onLeftArrow");
				keyCodes[this.isLeftToRight() ? keys.RIGHT_ARROW : keys.LEFT_ARROW] = lang.hitch(this, "_onRightArrow");
				keyCodes[keys.UP_ARROW] = lang.hitch(this, "_onUpArrow");
				keyCodes[keys.DOWN_ARROW] = lang.hitch(this, "_onDownArrow");
			}

			var self = this,
				childSelector = typeof this.childSelector === "string"
					? this.childSelector
					: lang.hitch(this, "childSelector");
			this.own(
				on(this, "keypress", lang.hitch(this, "_onContainerKeypress")),
				on(this, "keydown", lang.hitch(this, "_onContainerKeydown")),
				on(this, "focus", lang.hitch(this, "_onContainerFocus")),
				on(this.containerNode || this, on.selector(childSelector, "focusin"), function (evt) {
					// "this" refers to the Element that matched the selector
					self._onChildFocus(this, evt);
				})
			);
		},

		_onLeftArrow: function () {
			// summary:
			//		Called on left arrow key, or right arrow key if widget is in RTL mode.
			//		Should go back to the previous child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onRightArrow: function () {
			// summary:
			//		Called on right arrow key, or left arrow key if widget is in RTL mode.
			//		Should go to the next child in horizontal container widgets like Toolbar.
			// tags:
			//		extension
		},

		_onUpArrow: function () {
			// summary:
			//		Called on up arrow key. Should go to the previous child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		_onDownArrow: function () {
			// summary:
			//		Called on down arrow key. Should go to the next child in vertical container widgets like Menu.
			// tags:
			//		extension
		},

		focus: function () {
			// summary:
			//		Default focus() implementation: focus the first child.
			this.focusFirstChild();
		},

		_getFirstFocusableChild: function () {
			// summary:
			//		Returns first child that can be focused.

			// Leverage _getNextFocusableChild() to skip disabled children
			return this._getNextFocusableChild(null, 1);	// Element
		},

		_getLastFocusableChild: function () {
			// summary:
			//		Returns last child that can be focused.

			// Leverage _getNextFocusableChild() to skip disabled children
			return this._getNextFocusableChild(null, -1);	// Element
		},

		focusFirstChild: function () {
			// summary:
			//		Focus the first focusable child in the container.
			// tags:
			//		protected

			this.focusChild(this._getFirstFocusableChild());
		},

		focusLastChild: function () {
			// summary:
			//		Focus the last focusable child in the container.
			// tags:
			//		protected

			this.focusChild(this._getLastFocusableChild());
		},

		focusChild: function (/*Element*/ child, /*Boolean*/ last) {
			// summary:
			//		Focus specified child Element.
			// child:
			//		Reference to container's child
			// last:
			//		If true and if child has multiple focusable nodes, focus the
			//		last one instead of the first one
			// tags:
			//		protected

			// For IE focus outline to appear, must set tabIndex before focus.
			// If this._savedTabIndex is set, use it instead of this.tabIndex, because it means
			// the container's tabIndex has already been changed to -1.
			child.tabIndex = this._savedTabIndex || this.tabIndex;
			child.focus(last ? "end" : "start");

			// Don't set focusedChild here, because the focus event should trigger a call to _onChildFocus(), which will
			// set it.   More importantly, _onChildFocus(), which may be executed asynchronously (after this function
			// returns) needs to know the old focusedChild to set its tabIndex to -1.
		},

		_onContainerFocus: function (evt) {
			// summary:
			//		Handler for when the container itself gets focus.
			// description:
			//		Initially the container itself has a tabIndex, but when it gets
			//		focus, switch focus to first child.
			// tags:
			//		private

			// Note that we can't use _onFocus() because switching focus from the
			// _onFocus() handler confuses the focus.js code
			// (because it causes _onFocusNode() to be called recursively).
			// Also, _onFocus() would fire when focus went directly to a child widget due to mouse click.

			// Ignore spurious focus events:
			//	1. focus on a child widget bubbles on FF
			//	2. on IE, clicking the scrollbar of a select dropdown moves focus from the focused child item to me
			if (evt.target !== this || this.focusedChild) {
				return;
			}

			// When the container gets focus by being tabbed into, or a descendant gets focus by being clicked,
			// set the container's tabIndex to -1 (don't remove as that breaks Safari 4) so that tab or shift-tab
			// will go to the fields after/before the container, rather than the container itself
			this._savedTabIndex = this.tabIndex;
			this.setAttribute("tabindex", "-1");

			this.focus();
		},

		_onBlur: dcl.after(function () {
			// When focus is moved away the container, and its descendant (popup) widgets,
			// then restore the container's tabIndex so that user can tab to it again.
			// Note that using _onBlur() so that this doesn't happen when focus is shifted
			// to one of my child widgets (typically a popup)

			// TODO: for 2.0 consider changing this to blur whenever the container blurs, to be truthful that there is
			// no focused child at that time.
			this.setAttribute("tabindex", this._savedTabIndex);
			delete this._savedTabIndex;
			if (this.focusedChild) {
				this.focusedChild.tabIndex = "-1";
				this.focusedChild = null;
			}
		}),

		_onChildFocus: function (/*Element*/ child) {
			// summary:
			//		Called when a child gets focus, either by user clicking
			//		it, or programatically by arrow key handling code.
			// description:
			//		It marks that the current node is the selected one, and the previously
			//		selected node no longer is.

			if (child && child !== this.focusedChild) {
				if (this.focusedChild && !this.focusedChild._destroyed) {
					// mark that the previously focusable node is no longer focusable
					this.focusedChild.tabIndex = "-1";
				}

				// If container still has tabIndex setting then remove it; instead we'll set tabIndex on child
				if (!("_savedTabIndex" in this)) {
					this._savedTabIndex = this.tabIndex;
					this.setAttribute("tabindex", "-1");
				}

				// mark that the new node is the currently selected one
				child.tabIndex = this._savedTabIndex;
				this.focusedChild = child;
			}
		},

		_searchString: "",

		// multiCharSearchDuration: Number
		//		If multiple characters are typed where each keystroke happens within
		//		multiCharSearchDuration of the previous keystroke,
		//		search for nodes matching all the keystrokes.
		//
		//		For example, typing "ab" will search for entries starting with
		//		"ab" unless the delay between "a" and "b" is greater than multiCharSearchDuration.
		multiCharSearchDuration: 1000,

		onKeyboardSearch: function (
				/*Element*/ item,
				/*jshint unused: vars */
				/*Event*/ evt,
				/*String*/  searchString,
				/*Number*/ numMatches) {
			// summary:
			//		When a key is pressed that matches a child item,
			//		this method is called so that a widget can take appropriate action is necessary.
			// tags:
			//		protected
			if (item) {
				this.focusChild(item);
			}
		},

		_keyboardSearchCompare: function (/*Element*/ item, /*String*/ searchString) {
			// summary:
			//		Compares the searchString to the Element's text label, returning:
			//
			//			* -1: a high priority match  and stop searching
			//			* 0: not a match
			//			* 1: a match but keep looking for a higher priority match
			// tags:
			//		private

			var element = item,
				text = item.label || (element.focusNode ? element.focusNode.label : "") || element.textContent || "",
				currentString = text.replace(/^\s+/, "").substr(0, searchString.length).toLowerCase();

			// stop searching after first match by default
			return (!!searchString.length && currentString === searchString) ? -1 : 0;
		},

		_onContainerKeydown: function (evt) {
			// summary:
			//		When a key is pressed, if it's an arrow key etc. then it's handled here.
			// tags:
			//		private

			// Ignore left, right, home, and end on <input> controls
			if ( takesInput(evt.target) &&
				(evt.keyCode == keys.LEFT_ARROW || evt.keyCode == keys.RIGHT_ARROW ||
					evt.keyCode == keys.HOME || evt.keyCode == keys.END)) {
				return;
			}
				
			var func = this._keyNavCodes[evt.keyCode];
			if (func) {
				func(evt, this.focusedChild);
				evt.stopPropagation();
				evt.preventDefault();
				this._searchString = ""; // so a DOWN_ARROW b doesn't search for ab
			} else if (evt.keyCode === keys.SPACE && this._searchTimer && !(evt.ctrlKey || evt.altKey || evt.metaKey)) {
				// stop a11yclick and _HasDropdown from seeing SPACE if we're doing keyboard searching
				evt.stopImmediatePropagation();

				// stop IE from scrolling, and most browsers (except FF) from sending keypress
				evt.preventDefault();

				this._keyboardSearch(evt, " ");
			}
		},

		_onContainerKeypress: function (evt) {
			// summary:
			//		When a printable key is pressed, it's handled here, searching by letter.
			// tags:
			//		private

			if (takesInput(evt.target) || evt.charCode < keys.SPACE || evt.ctrlKey || evt.altKey || evt.metaKey ||
				(evt.charCode === keys.SPACE && this._searchTimer)) {
				// Ignore characters typed on <input> controls.
				// Also, avoid duplicate events on firefox (ex: arrow key that will be handled by keydown handler),
				// and also control sequences like CMD-Q
				return;
			}
			if (/^(checkbox|radio)$/.test(evt.target.type) &&
				(evt.charCode === keys.SPACE || evt.charCode === keys.ENTER)){
				// Ignore keyboard clicks on checkbox controls
				return;
			}

			evt.preventDefault();
			evt.stopPropagation();

			this._keyboardSearch(evt, String.fromCharCode(evt.charCode).toLowerCase());
		},

		_keyboardSearch: function (/*Event*/ evt, /*String*/ keyChar) {
			// summary:
			//		Perform a search of the widget's options based on the user's keyboard activity
			// description:
			//		Called on keypress (and sometimes keydown), searches through this widget's children
			//		looking for items that match the user's typed search string.  Multiple characters
			//		typed within 1 sec of each other are combined for multicharacter searching.
			// tags:
			//		private
			var
				matchedItem = null,
				searchString,
				numMatches = 0,
				search = lang.hitch(this, function () {
					if (this._searchTimer) {
						this._searchTimer.remove();
					}
					this._searchString += keyChar;
					var allSameLetter = /^(.)\1*$/.test(this._searchString);
					var searchLen = allSameLetter ? 1 : this._searchString.length;
					searchString = this._searchString.substr(0, searchLen);
					// commented out code block to search again if the multichar search fails after a smaller timeout
					//this._searchTimer = this.defer(function(){ // this is the "failure" timeout
					//	this._typingSlowly = true; // if the search fails, then treat as a full timeout
					//	this._searchTimer = this.defer(function(){ // this is the "success" timeout
					//		this._searchTimer = null;
					//		this._searchString = '';
					//	}, this.multiCharSearchDuration >> 1);
					//}, this.multiCharSearchDuration >> 1);
					this._searchTimer = this.defer(function () { // this is the "success" timeout
						this._searchTimer = null;
						this._searchString = "";
					}, this.multiCharSearchDuration);
					var currentItem = this.focusedChild || null;
					if (searchLen === 1 || !currentItem) {
						currentItem = this._getNextFocusableChild(currentItem, 1); // skip current
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
						currentItem = this._getNextFocusableChild(currentItem, 1);
					} while (currentItem !== stop);
					// commented out code block to search again if the multichar search fails after a smaller timeout
					//if(!numMatches && (this._typingSlowly || searchLen === 1)){
					//	this._searchString = '';
					//	if(searchLen > 1){
					//		// if no matches and they're typing slowly, then go back to first letter searching
					//		search();
					//	}
					//}
				});

			search();
			// commented out code block to search again if the multichar search fails after a smaller timeout
			//this._typingSlowly = false;
			this.onKeyboardSearch(matchedItem, evt, searchString, numMatches);
		},

		_getNextFocusableChild: function (child, dir) {
			// summary:
			//		Returns the next or previous focusable child, compared to "child".
			// child: Element
			//		The current element
			// dir: Integer
			//		- 1 = after
			//		- -1 = before
			// tags:
			//		abstract extension

			var wrappedValue = child;
			do {
				if (!child) {
					child = this[dir > 0 ? "_getFirst" : "_getLast"]();
					if (!child) {
						break;
					}
				} else {
					child = this._getNext(child, dir);
				}
				if (child && child !== wrappedValue && this.isFocusable.call(child)) {
					return child;	// Element
				}
			} while (child !== wrappedValue);
			// no focusable child found
			return null;	// Element
		},

		_getFirst: function () {
			// summary:
			//		Returns the first child.
			// tags:
			//		extension

			return this._getNavigableChildren()[0];	// Element
		},

		_getLast: function () {
			// summary:
			//		Returns the last descendant.
			// tags:
			//		extension

			var children = this._getNavigableChildren();
			return children[children.length - 1];	// Element
		},

		_getNext: function (child, dir) {
			// summary:
			//		Returns the next or previous navigable child, relative to "child".
			//		Subclasses should override this method with a more efficient implementation.
			// child: Element
			//		The current child Element
			// dir: Integer
			//		- 1 = after
			//		- -1 = before
			// tags:
			//		extension

			var children = this._getNavigableChildren(),
				index = children.indexOf(child);
			return children[(index + children.length + dir) % children.length];
		},

		_getNavigableChildren: function(){
			// summary:
			//		Helper method to get list of navigable children (navigable via arrow keys and letter keys).

			if (typeof this.childSelector == "function"){
				return Array.prototype.filter.call(this.querySelectorAll("*"), this.childSelector);
			} else {
				return Array.prototype.slice.call(this.querySelectorAll(this.childSelector));	// convert to array
			}
		}
	});
});
