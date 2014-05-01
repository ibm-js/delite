define([
	"dcl/dcl",
	"dojo/dom", // dom.byId
	"dojo/dom-class", // domClass.add domClass.replace
	"dojo/dom-construct", // domConstruct.place
	"dojo/dom-geometry", // isBodyLtr
	"dojo/dom-style", // domStyle.set, domStyle.get
	"dojo/has",
	"./CustomElement",
	"./register",
	"dojo/has!bidi?./Bidi"
], function (dcl, dom, domClass, domConstruct, domGeometry, domStyle, has, CustomElement, register, Bidi) {

	// module:
	//		delite/Widget

	// Flag to enable support for textdir attribute
	has.add("bidi", false);

	// Used to generate unique id for each widget
	var cnt = 0;

	var Widget = dcl(CustomElement, {
		// summary:
		//		Base class for all widgets, i.e. custom elements that appear visually.
		//
		//		Provides stubs for widget lifecycle methods for subclasses to extend, like  buildRendering(),
		//		postCreate(), startup(), and destroy(), and also public API methods like watch().

		// baseClass: [protected] String
		//		Root CSS class of the widget (ex: d-text-box)
		baseClass: "",
		_setBaseClassAttr: function (value) {
			domClass.replace(this, value, this.baseClass);
			this._set("baseClass", value);
		},

		// focused: [readonly] Boolean
		//		This widget or a widget it contains has focus, or is "active" because
		//		it was recently clicked.
		focused: false,

		/*=====
		 // containerNode: [readonly] DomNode
		 //		Designates where children of the source DOM node will be placed.
		 //		"Children" in this case refers to both DOM nodes and widgets.
		 //
		 //		containerNode must be defined for any widget that accepts innerHTML
		 //		(like ContentPane or BorderContainer or even Button), and conversely
		 //		is undefined for widgets that don't, like TextBox.
		 containerNode: undefined,
		 =====*/

		// _started: [readonly] Boolean
		//		startup() has completed.
		_started: false,

		// register: delite/register
		//		Convenience pointer to register class.   Used by buildRendering() functions produced from
		//		handlebars! / template.
		register: register,


		// widgetId: [const readonly] Number
		//		Unique id for this widget, separate from id attribute (which may or may not be set).
		//		Useful when widget creates subnodes that need unique id's.
		widgetId: 0,

		//////////// INITIALIZATION METHODS ///////////////////////////////////////

		createdCallback: function () {
			// summary:
			//		Kick off the life-cycle of a widget
			// description:
			//		Create calls a number of widget methods (preCreate, buildRendering, and postCreate),
			//		some of which of you'll want to override.
			//
			//		Of course, adventurous developers could override createdCallback entirely, but this should
			//		only be done as a last resort.
			// tags:
			//		protected

			this.preCreate();

			// Render the widget
			this.buildRendering();

			this.postCreate();
		},

		attachedCallback: function () {
			// summary:
			//		Called when the widget is first inserted into the document.
			//		If widget is created programatically then app must call startup() to trigger this method.

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

		preCreate: function () {
			// summary:
			//		Processing before buildRendering()
			// tags:
			//		protected

			this.widgetId = ++cnt;
		},

		buildRendering: function () {
			// summary:
			//		Construct the UI for this widget, filling in subnodes and/or text inside of this.
			//		Most widgets will leverage delite/handlebars! to implement this method.
			// tags:
			//		protected
		},

		postCreate: function () {
			// summary:
			//		Processing after the DOM fragment is created
			// description:
			//		Called after the DOM fragment has been created, but not necessarily
			//		added to the document.  Do not include any operations which rely on
			//		node dimensions or placement.
			// tags:
			//		protected
		},

		startup: function () {
			// summary:
			//		Processing after the DOM fragment is added to the document
			// description:
			//		Called after a widget and its children have been created and added to the page,
			//		and all related widgets have finished their create() cycle, up through postCreate().
			//
			//		Note that startup() may be called while the widget is still hidden, for example if the widget is
			//		inside a hidden deliteful/Dialog or an unselected tab of a deliteful/TabContainer.
			//		For widgets that need to do layout, it's best to put that layout code inside resize(), and then
			//		extend delite/_LayoutWidget so that resize() is called when the widget is visible.

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
		destroy: function () {
			// summary:
			//		Destroy this widget and its descendants.

			if (this.bgIframe) {
				this.bgIframe.destroy();
				delete this.bgIframe;
			}
		},

		getChildren: function () {
			// summary:
			//		Returns all direct children of this widget, i.e. all widgets or DOM node underneath
			//		this.containerNode whose parent is this widget.  Note that it does not return all
			//		descendants, but rather just direct children.
			//
			//		The result intentionally excludes internally created widgets (a.k.a. supporting widgets)
			//		outside of this.containerNode.

			// use Array.prototype.slice to transform the live HTMLCollection into an Array
			return this.containerNode ? Array.prototype.slice.call(this.containerNode.children) : []; // []
		},

		getParent: function () {
			// summary:
			//		Returns the parent widget of this widget.

			return this.getEnclosingWidget(this.parentNode);
		},

		isLeftToRight: function () {
			// summary:
			//		Return this widget's explicit or implicit orientation (true for LTR, false for RTL)
			// tags:
			//		protected
			return this.dir ? (this.dir === "ltr") : domGeometry.isBodyLtr(this.ownerDocument); //Boolean
		},

		isFocusable: function () {
			// summary:
			//		Return true if this widget can currently be focused
			//		and false if not
			return this.focus && (domStyle.get(this, "display") !== "none");
		},

		placeAt: function (/* String|DomNode|Widget */ reference, /* String|Int? */ position) {
			// summary:
			//		Place this widget somewhere in the DOM based
			//		on standard domConstruct.place() conventions.
			// description:
			//		A convenience function provided in all _Widgets, providing a simple
			//		shorthand mechanism to put an existing (or newly created) Widget
			//		somewhere in the dom, and allow chaining.
			// reference:
			//		Widget, DOMNode, or id of widget or DOMNode
			// position:
			//		If reference is a widget (or id of widget), and that widget has an ".addChild" method,
			//		it will be called passing this widget instance into that method, supplying the optional
			//		position index passed.  In this case position (if specified) should be an integer.
			//
			//		If reference is a DOMNode (or id matching a DOMNode but not a widget),
			//		the position argument can be a numeric index or a string
			//		"first", "last", "before", or "after", same as dojo/dom-construct::place().
			// returns: delite/Widget
			//		Provides a useful return of the newly created delite/Widget instance so you
			//		can "chain" this function by instantiating, placing, then saving the return value
			//		to a variable.
			// example:
			//	|	// create a Button with no srcNodeRef, and place it in the body:
			//	|	var button = new Button({ label:"click" }).placeAt(document.body);
			//	|	// now, 'button' is still the widget reference to the newly created button
			//	|	button.on("click", function (e) { console.log('click'); }));
			// example:
			//	|	// create a button out of a node with id="src" and append it to id="wrapper":
			//	|	var button = new Button({},"src").placeAt("wrapper");
			// example:
			//	|	// place a new button as the first element of some div
			//	|	var button = new Button({ label:"click" }).placeAt("wrapper","first");
			// example:
			//	|	// create a contentpane and add it to a TabContainer
			//	|	var tc = document.getElementById("myTabs");
			//	|	new ContentPane({ href:"foo.html", title:"Wow!" }).placeAt(tc)

			reference = dom.byId(reference);

			if (reference && reference.addChild && (!position || typeof position === "number")) {
				// Use addChild() if available because it skips over text nodes and comments.
				reference.addChild(this, position);
			} else {
				// "reference" is a plain DOMNode, or we can't use refWidget.addChild().   Use domConstruct.place() and
				// target refWidget.containerNode for nested placement (position==number, "first", "last", "only"), and
				// refWidget otherwise ("after"/"before"/"replace").
				var ref = reference ?
					(reference.containerNode && !/after|before|replace/.test(position || "") ?
						reference.containerNode : reference) : dom.byId(reference, this.ownerDocument);
				domConstruct.place(this, ref, position);

				// Start this iff it has a parent widget that's already started.
				// TODO: for 2.0 maybe it should also start the widget when this.getParent() returns null??
				if (!this._started && (this.getParent() || {})._started) {
					this.startup();
				}
			}
			return this;
		},


		getEnclosingWidget: function (/*DOMNode*/ node) {
			// summary:
			//		Returns the widget whose DOM tree contains the specified DOMNode, or null if
			//		the node is not contained within the DOM tree of any widget
			do {
				if (node.nodeType === 1 && node.buildRendering) {
					return node;
				}
			} while ((node = node.parentNode));
			return null;
		},

		// Focus related methods.  Used by focus.js.
		onFocus: function () {
			// summary:
			//		Called when the widget becomes "active" because
			//		it or a widget inside of it either has focus, or has recently
			//		been clicked.
			// tags:
			//		callback
		},

		onBlur: function () {
			// summary:
			//		Called when the widget stops being "active" because
			//		focus moved to something outside of it, or the user
			//		clicked somewhere outside of it, or the widget was
			//		hidden.
			// tags:
			//		callback
		},

		_onFocus: function () {
			// summary:
			//		This is where widgets do processing for when they are active,
			//		such as changing CSS classes.  See onFocus() for more details.
			// tags:
			//		protected
			this.onFocus();
		},

		_onBlur: function () {
			// summary:
			//		This is where widgets do processing for when they stop being active,
			//		such as changing CSS classes.  See onBlur() for more details.
			// tags:
			//		protected
			this.onBlur();
		}
	});

	if (has("dojo-bidi")) {
		Widget = dcl(Widget, Bidi);
	}

	// Setup automatic chaining for lifecycle methods, except for buildRendering().
	// destroy() is chained in Destroyable.js.
	dcl.chainAfter(Widget, "preCreate");
	dcl.chainAfter(Widget, "postCreate");
	dcl.chainAfter(Widget, "startup");

	return Widget;
});
