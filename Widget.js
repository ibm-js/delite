/** @module delite/Widget */
define([
	"dcl/dcl",
	"dojo/dom", // dom.byId
	"dojo/dom-class", // domClass.add domClass.replace
	"./features",
	"decor/Invalidating",
	"./CustomElement",
	"./register",
	"./features!bidi?./Bidi"
], function (dcl, dom, domClass, has, Invalidating, CustomElement, register, Bidi) {
	// Used to generate unique id for each widget
	var cnt = 0;

	/**
	 * Base class for all widgets, i.e. custom elements that appear visually.
	 *
	 * Provides stubs for widget lifecycle methods for subclasses to extend, like `buildRendering()`,
	 * `postCreate()`, `startup()`, and `destroy()`, and also public API methods like `observe()`.
	 * @mixin module:delite/Widget
	 * @augments module:delite/CustomElement
	 * @augments module:decor/Invalidating
	 * @mixes module:delite/Bidi
	 */
	var Widget = dcl([CustomElement, Invalidating], /** @lends module:delite/Widget# */ {

		/**
		 * Root CSS class of the widget (ex: d-text-box)
		 * @member {string}
		 * @protected
		 */
		baseClass: "",
		_setBaseClassAttr: function (value) {
			domClass.replace(this, value, this.baseClass);
			this._set("baseClass", value);
		},

		/**
		 * This widget or a widget it contains has focus, or is "active" because
		 * it was recently clicked.
		 * @member {boolean}
		 * @default false
		 * @protected
		 */
		focused: false,
		
		/**
		 * Designates where children of the source DOM node will be placed.
		 * "Children" in this case refers to both DOM nodes and widgets.
		 *
		 * containerNode must be defined for any widget that accepts innerHTML
		 * (like ContentPane or BorderContainer or even Button), and conversely
		 * is undefined for widgets that don't, like TextBox.
		 *
		 * @member {Element}
		 * @default undefined
		 * @protected
		 */
		containerNode: undefined,

		/**
		 * Set to true when startup() has completed.
		 * @member {boolean}
		 * @protected
		 */
		_started: false,

		/**
		 * Unique id for this widget, separate from id attribute (which may or may not be set).
		 * Useful when widget creates subnodes that need unique id's.
		 * @member {number}
		 * @constant
		 * @readonly
		 * @protected
		 */
		widgetId: 0,

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		/**
		 * Kick off the life-cycle of a widget.
		 *
		 * Calls a number of widget methods (`preCreate()`, `buildRendering()`, and `postCreate()`),
		 * some of which of you'll want to override.
		 *
		 * Of course, adventurous developers could override createdCallback entirely, but this should
		 * only be done as a last resort.
		 * @protected
		 */
		createdCallback: function () {
			this.preCreate();
			this.buildRendering();
			this.postCreate();
		},

		// Override Invalidating#refreshRendering() to execute the function returned by buildRendering
		refreshRendering: function (props) {
			if (this._templateHandle) {
				this._templateHandle.refresh(props);
			}
		},

		/**
		 * Called when the widget is first inserted into the document.
		 * If widget is created programatically then app must call startup() to trigger this method.
		 * @protected
		 */
		attachedCallback: function () {
			this._attached = true;

			// When Widget extends Invalidating some/all of this code should probably be moved to refreshRendering()

			if (this.baseClass) {
				domClass.add(this, this.baseClass);
			}
			if (!this.isLeftToRight()) {
				domClass.add(this, "d-rtl");
			}

			// Since safari masks all custom setters for tabIndex on the prototype, call them here manually.
			// For details see:
			//		https://bugs.webkit.org/show_bug.cgi?id=36423
			//		https://bugs.webkit.org/show_bug.cgi?id=49739
			//		https://bugs.webkit.org/show_bug.cgi?id=75297
			var tabIndex = this.tabIndex;
			// Trace up prototype chain looking for custom setter
			for (var proto = this; proto; proto = Object.getPrototypeOf(proto)) {
				var desc = Object.getOwnPropertyDescriptor(proto, "tabIndex");
				if (desc && desc.set) {
					if (this.hasAttribute("tabindex")) { // initial value was specified
						this.removeAttribute("tabindex");
						desc.set.call(this, tabIndex); // call custom setter
					}
					var self = this;
					// begin watching for changes to the tabindex DOM attribute
					/* global WebKitMutationObserver */
					if ("WebKitMutationObserver" in window) {
						// If Polymer is loaded, use MutationObserver rather than WebKitMutationObserver
						// to avoid error about "referencing a Node in a context where it does not exist".
						var MO = window.MutationObserver || WebKitMutationObserver;	// for jshint
						var observer = new MO(function () {
							var newValue = self.getAttribute("tabindex");
							if (newValue !== null) {
								self.removeAttribute("tabindex");
								desc.set.call(self, newValue);
							}
						});
						observer.observe(this, {
							subtree: false,
							attributeFilter: ["tabindex"],
							attributes: true
						});
					}
					break;
				}
			}
		},

		/**
		 * Processing before `buildRendering()`.
		 * @protected
		 */
		preCreate: function () {
			this.widgetId = ++cnt;
		},

		/**
		 * Value returned by delite/handlebars! or compatible template engine.
		 * Specifies how to build the widget DOM initially and also how to update the DOM when
		 * widget properties change.
		 * @member {Function}
		 * @protected
		 */
		template: null,

		/**
		 * Construct the UI for this widget, filling in subnodes and/or text inside of this.
		 * Most widgets will leverage delite/handlebars! to set `template`, rather than defining this method.
		 * @protected
		 */
		buildRendering: function () {
			if (this.template) {
				this._templateHandle = this.template(this.ownerDocument, register);
			}
		},

		/**
		 * Helper method to set/remove an attribute based on the given value:
		 *
		 * - If value is undefined, the attribute is removed.  Useful for attributes like aria-valuenow.
		 * - If value is boolean, the attribute is set to "true" or "false".  Useful for attributes like aria-selected.
		 * - If value is a number, it's converted to a string.
		 *
		 * @param {Element} node - The node to set the property on.
		 * @param {string} name - Name of the property.
		 * @param {*} value - Value of the property.
		 * @protected
		 */
		setOrRemoveAttribute: function (node, name, value) {
			if (value === undefined) {
				node.removeAttribute(name);
			} else {
				node.setAttribute(name, "" + value);
			}
		},

		/**
		 * Processing after the DOM fragment is created.
		 *
		 * Called after the DOM fragment has been created, but not necessarily
		 * added to the document.  Do not include any operations which rely on
		 * node dimensions or placement.
		 * @protected
		 */
		postCreate: function () {
			if (this._templateHandle) {
				this._templateHandle.dependencies.forEach(this.notifyCurrentValue, this);
			}
		},

		/**
		 * Processing after the DOM fragment is added to the document.
		 *
		 * Called after a widget and its children have been created and added to the page,
		 * and all related widgets have finished their create() cycle, up through `postCreate()`.
		 *
		 * Note that `startup()` may be called while the widget is still hidden, for example if the widget is
		 * inside a hidden deliteful/Dialog or an unselected tab of a deliteful/TabContainer.
		 * For widgets that need to do layout, it's best to put that layout code inside `resize()`, and then
		 * extend delite/LayoutWidget so that `resize()` is called when the widget is visible.
		 */
		startup: function () {
			if (this._started) {
				return;
			}

			if (!this._attached) {
				this.attachedCallback();
			}

			this._started = true;
			this.findCustomElements(this).forEach(function (obj) {
				if (!obj._started && !obj._destroyed && typeof obj.startup === "function") {
					obj.startup();
					obj._started = true;
				}
			});
		},

		//////////// DESTROY FUNCTIONS ////////////////////////////////
		
		/**
		 * Destroy this widget and its descendants.
		 */
		destroy: function () {
			if (this.bgIframe) {
				this.bgIframe.destroy();
				delete this.bgIframe;
			}
		},

		/**
		 * Returns all direct children of this widget, i.e. all widgets or DOM nodes underneath
		 * `this.containerNode` whose parent is this widget.  Note that it does not return all
		 * descendants, but rather just direct children.
		 *
		 * The result intentionally excludes internally created widgets (a.k.a. supporting widgets)
		 * outside of `this.containerNode`.
		 *
		 * @returns {Element[]}
		 */
		getChildren: function () {
			// use Array.prototype.slice to transform the live HTMLCollection into an Array
			return this.containerNode ? Array.prototype.slice.call(this.containerNode.children) : [];
		},

		/**
		 * Returns the parent widget of this widget.
		 */
		getParent: function () {
			return this.getEnclosingWidget(this.parentNode);
		},

		/**
		 * Return this widget's explicit or implicit orientation (true for LTR, false for RTL).
		 * @returns {boolean}
		 * @protected
		 */
		isLeftToRight: function () {
			var doc = this.ownerDocument;
			return !(/^rtl$/i).test(this.dir || doc.body.dir || doc.documentElement.dir);
		},

		/**
		 * Place this widget somewhere in the dom, and allow chaining.
		 *
		 * @param {string|Element|DocumentFragment} reference - Element, DocumentFragment,
		 * or id of Element to place this widget relative to.
		 * @param {string|number} [position] Numeric index or a string with the values:
		 * - number - place this widget as n'th child of `reference` node
		 * - "first" - place this widget as first child of `reference` node
		 * - "last" - place this widget as last child of `reference` node
		 * - "before" - place this widget as previous sibling of `reference` node
		 * - "after" - place this widget as next sibling of `reference` node
		 * - "replace" - replace specified reference node with this widget
		 * - "only" - replace all children of `reference` node with this widget
		 * @returns {module:delite/Widget} This widget, for chaining.
		 * @protected
		 * @example
		 * // create a Button with no srcNodeRef, and place it in the body:
		 * var button = new Button({ label:"click" }).placeAt(document.body);
		 * @example
		 * // place a new button as the first element of some div
		 * var button = new Button({ label:"click" }).placeAt("wrapper","first");
		 * @example
		 * // create a contentpane and add it to a TabContainer
		 * var tc = document.getElementById("myTabs");
		 * new ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)
		 */
		placeAt: function (reference, position) {
			if (typeof reference === "string") {
				reference = this.ownerDocument.getElementById(reference);
			}

			/* jshint maxcomplexity:14 */
			if (position === "replace") {
				reference.parentNode.replaceChild(this, reference);
			} else if (position === "only") {
				// SVG nodes, strict elements, and DocumentFragments don't support innerHTML
				for (var c; (c = reference.lastChild);) {
					reference.removeChild(c);
				}
				reference.appendChild(this);
			} else if (/^(before|after)$/.test(position)) {
				reference.parentNode.insertBefore(this, position === "before" ? reference : reference.nextSibling);
			} else {
				// Note: insertBefore(node, null) is equivalent to appendChild().  Second "null" arg needed only on IE.
				var parent = reference.containerNode || reference,
					children = parent.children || Array.prototype.filter.call(parent.childNodes, function (node) {
						return node.nodeType === 1;	// no .children[] on DocumentFragment :-(
					});
				parent.insertBefore(this, children[position === "first" ? 0 : position] || null);
			}

			// Start this iff it has a parent widget that's already started.
			// TODO: for 2.0 maybe it should also start the widget when this.getParent() returns null??
			if (!this._started && (this.getParent() || {})._started) {
				this.startup();
			}

			return this;
		},


		/**
		 * Returns the widget whose DOM tree contains the specified DOMNode, or null if
		 * the node is not contained within the DOM tree of any widget
		 * @param {Element} node
		 */
		getEnclosingWidget: function (node) {
			do {
				if (node.nodeType === 1 && node.buildRendering) {
					return node;
				}
			} while ((node = node.parentNode));
			return null;
		},

		// Focus related methods.  Used by focus.js.
		
		/**
		 * Called when the widget becomes "active" because
		 * it or a widget inside of it either has focus, or has recently
		 * been clicked.
		 * @param {Event} evt - A focus event.
		 */
		onFocus: function () {
			// TODO: we should be firing an event, not calling a callback method?
		},

		/**
		 * Called when the widget stops being "active" because
		 * focus moved to something outside of it, or the user
		 * clicked somewhere outside of it, or the widget was
		 * hidden.
		 */
		onBlur: function () {
		},

		/**
		 * This is where widgets do processing for when they are active,
		 * such as changing CSS classes.  See `onFocus()` for more details.
		 * @protected
		 */
		_onFocus: function () {
			this.onFocus();
		},

		/**
		 * This is where widgets do processing for when they stop being active,
		 * such as changing CSS classes.  See `onBlur()` for more details.
		 * @protected
		 */
		_onBlur: function () {
			this.onBlur();
		}
	});

	if (has("bidi")) {
		Widget = dcl(Widget, Bidi);
	}

	// Setup automatic chaining for lifecycle methods, except for buildRendering().
	// destroy() is chained in Destroyable.js.
	dcl.chainAfter(Widget, "preCreate");
	dcl.chainAfter(Widget, "postCreate");
	dcl.chainAfter(Widget, "startup");

	return Widget;
});
