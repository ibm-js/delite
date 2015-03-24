/** @module delite/Widget */
define([
	"dcl/dcl",
	"requirejs-dplugins/jquery!attributes/classes",	// addClass(), removeClass()
	"./features",
	"decor/Invalidating",
	"./CustomElement",
	"./register",
	"./features!bidi?./Bidi"
], function (dcl, $, has, Invalidating, CustomElement, register, Bidi) {
	// Used to generate unique id for each widget
	var cnt = 0;

	/**
	 * Base class for all widgets, i.e. custom elements that appear visually.
	 *
	 * Provides stubs for widget lifecycle methods for subclasses to extend, like `render()`,
	 * `postRender()`, and `destroy()`, and also public API methods like `observe()`.
	 * @mixin module:delite/Widget
	 * @augments module:delite/CustomElement
	 * @augments module:decor/Invalidating
	 * @mixes module:delite/Bidi
	 */
	var Widget = dcl([CustomElement, Invalidating], /** @lends module:delite/Widget# */ {

		/**
		 * Root CSS class of the widget (ex: "d-text-box")
		 * @member {string}
		 * @protected
		 */
		baseClass: "",

		/**
		 * This widget or a widget it contains has focus, or is "active" because
		 * it was recently clicked.
		 * @member {boolean}
		 * @default false
		 * @protected
		 */
		focused: false,

		/**
		 * Unique id for this widget, separate from id attribute (which may or may not be set).
		 * Useful when widget creates subnodes that need unique id's.
		 * @member {number}
		 * @constant
		 * @readonly
		 * @protected
		 */
		widgetId: 0,

		/**
		 * Controls the layout direction of the widget, for example whether the arrow of
		 * a Combobox appears to the right or the left of the input field.
		 *
		 * Values are "ltr" and "rtl", or "" which means that the value is inherited from the
		 * setting on the document root (either `<html>` or `<body>`).
		 *
		 * @member {string}
		 */
		dir: "",

		/**
		 * Actual direction of the widget, which can be set explicitly via `dir` property or inherited from the
		 * setting on the document root (either `<html>` or `<body>`).
		 * Value is either "ltr" or "rtl".
		 * @member {string}
		 * @readonly
		 */
		effectiveDir: "",

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		createdCallback: function () {
			this.preRender();
			this.render();
			this.postRender();
		},

		computeProperties: function (props) {
			if ("dir" in props) {
				if ((/^(ltr|rtl)$/i).test(this._get("dir"))) {
					this.effectiveDir = this._get("dir").toLowerCase();
				} else {
					this.effectiveDir = this.getInheritedDir();
				}
			}
		},

		/**
		 * Get the direction setting for the page itself.
		 * @returns {string} "ltr" or "rtl"
		 * @protected
		 */
		getInheritedDir: function () {
			return (this.ownerDocument.body.dir || this.ownerDocument.documentElement.dir || "ltr").toLowerCase();
		},

		// Override Invalidating#refreshRendering() to execute the template's refreshRendering() code, etc.
		refreshRendering: function (oldVals) {
			if (this._templateHandle) {
				this._templateHandle.refresh(oldVals);
			}

			if ("baseClass" in oldVals) {
				$(this).removeClass(oldVals.baseClass).addClass(this.baseClass);
			}
			if ("effectiveDir" in oldVals) {
				$(this).toggleClass("d-rtl", this.effectiveDir === "rtl");
			}
			if ("dir" in oldVals) {
				this.style.direction = this._get("dir");
			}
		},

		attachedCallback: dcl.after(function () {
			// Call attachedCallback() on any widgets in the template
			if (this._templateHandle && !has("document-register-element")) {
				this._templateHandle.attach();
			}
		}),

		/**
		 * Processing before `render()`.
		 *
		 * This method is automatically chained, so subclasses generally do not need to use `dcl.superCall()`,
		 * `dcl.advise()`, etc.
		 * @protected
		 */
		preRender: function () {
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
		render: function () {
			if (this.template) {
				this._templateHandle = this.template(this.ownerDocument, register);
			}
		},

		/**
		 * Helper method to set a class (or classes) on a given node, removing the class (or classes) set
		 * by the previous call to `setClassComponent()` *for the specified component and node*.  Used mainly by
		 * template.js to set classes without overwriting classes set by the user or other code (ex: CssState).
		 * @param {string} component - Specifies the category.
		 * @param {string} value - Class (or classes) to set.
		 * @param {HTMLElement} [node] - The node to set the property on; defaults to widget root node.
		 * @protected
		 */
		setClassComponent: function (component, value, node) {
			if (!node) { node = this; }
			var oldValProp = "_" + component + "Class";
			$(node).removeClass(node[oldValProp] || "").addClass(value);
			node[oldValProp] = value;
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
		 * @param {string} value - Value of the property.
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
		 *
		 * This method is automatically chained, so subclasses generally do not need to use `dcl.superCall()`,
		 * `dcl.advise()`, etc.
		 * @protected
		 */
		postRender: function () {
			this.initializeInvalidating();
			if (this._templateHandle) {
				this.notifyCurrentValue.apply(this, this._templateHandle.dependencies);
			}
			this.notifyCurrentValue("dir", "baseClass");	// "dir" triggers computation of effectiveDir
		},

		//////////// DESTROY FUNCTIONS ////////////////////////////////

		detachedCallback: function () {
			// Call detachedCallback() on any widgets in the template
			if (this._templateHandle && !has("document-register-element")) {
				this._templateHandle.detach();
			}
			if (this.bgIframe) {
				this.bgIframe.destroy();
				delete this.bgIframe;
			}
		},

		/**
		 * Returns the parent widget of this widget.
		 */
		getParent: function () {
			return this.getEnclosingWidget(this.parentNode);
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

			if (!this.attached) {
				// run attach code for this widget and any descendant custom elements too
				this.attachedCallback(true);
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
				if (node.nodeType === 1 && node.render) {
					return node;
				}
			} while ((node = node.parentNode));
			return null;
		}
	});

	if (has("bidi")) {
		Widget = dcl(Widget, Bidi);
	}

	// Setup automatic chaining for lifecycle methods, except for render().
	// destroy() is chained in Destroyable.js.
	dcl.chainAfter(Widget, "preRender");
	dcl.chainAfter(Widget, "postRender");

	return Widget;
});
