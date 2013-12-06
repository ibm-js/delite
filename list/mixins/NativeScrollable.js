define(["dcl/dcl",
        "dui/register",
        "dojo/_base/lang",
        "dojo/dom-construct",
        "dui/Widget"
], function (dcl, register, lang, domConstruct, Widget) {

	return dcl(null, {
		// summary:
		//		NativeScrollable wraps a Widget inside a scrollable div (viewport).
		//		The height of this div is defined by the height parameter of the NativeScrollable mixin.

		/////////////////////////////////
		// Private attributes
		/////////////////////////////////

		_isScrollable: true,
		_viewportNode: null,
		_scroll: 0, // current scroll on the y axis
		_visibleHeight: null, // the height of the viewport, set by the resize method

		/////////////////////////////////
		// Public methods
		/////////////////////////////////

		scrollBy: function (y) {
			this._viewportNode.scrollTop += y;
		},

		/*jshint unused:false */
		onScroll: dcl.before(function (scroll) {
			// abstract method
		}),

		getCurrentScroll: function () {
			return this._scroll;
		},

		getViewportClientRect: function () {
			return this._viewportNode.getBoundingClientRect();
		},
		
		isTopScroll: function () {
			return this._viewportNode.scrollTop === 0;
		},
		
		isBottomScroll: function () {
			var scroller = this._viewportNode;
			return scroller.offsetHeight + scroller.scrollTop >= scroller.scrollHeight;
		},
	
		/////////////////////////////////
		// Widget methods updated by this mixin
		/////////////////////////////////

		buildRendering: dcl.after(function () {
			// Create a scrollable container and add the widget node to it
			this._viewportNode = domConstruct.create("div", {class: "duiNativeScrollable"});
			register.dcl.mix(this._viewportNode, new Widget());
			if (this.parentNode) {
				domConstruct.place(this._viewportNode, this, "after");
			}
			this._viewportNode.appendChild(this);
			// listen to scroll initiated by the browser (when the user navigates the list using the TAB key)
			this._viewportNode.addEventListener("scroll", lang.hitch(this, "_nsOnBrowserScroll"), true);
		}),

		enteredViewCallback: dcl.after(function () {
			if (this.height) {
				this._viewportNode.style.height = this.height;
				this.style.height = "";
				this.height = null;
			} else {
				// TODO: what is the default height ?
			}
		}),

		placeAt: dcl.superCall(function (sup) {
			return function (/* String|DomNode|Widget */ reference, /* String|Int? */ position) {
				// The node to place is this._viewportNode, not this
				return sup.apply(this._viewportNode, arguments);
			};
		}),

		destroy: dcl.after(function () {
			if (this._viewportNode) {
				this._viewportNode.removeEventListener("scroll", lang.hitch(this, "_nsOnBrowserScroll"), true);
				domConstruct.destroy(this._viewportNode);
			}
		}),

		/////////////////////////////////
		// Event handlers
		/////////////////////////////////

		_nsOnBrowserScroll: function (event) {
			var oldScroll = this._scroll;
			this._scroll = this._viewportNode.scrollTop;
			this.onScroll(oldScroll - this._scroll);
		},

	});
});