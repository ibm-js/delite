/** @module delite/DialogUnderlay */
define([
	"dojo/dom-attr", // domAttr.set
	"dojo/dom-style", // domStyle.getComputedStyle
	"dojo/on",
	"dojo/window", // winUtils.getBox, winUtils.get
	"./register",
	"./Widget",
	"./BackgroundIframe",
	"./Viewport"
], function (domAttr, domStyle, on, winUtils, register, Widget, BackgroundIframe, Viewport) {

	// TODO: having show() methods on the instance and also on the module is confusing,
	// at least when looking at the API doc page.  Should one be renamed?

	/**
	 * A component used to block input behind a Dialog widget.
	 *
	 * Normally this widget should not be instantiated directly, but rather shown and hidden via
	 * `DialogUnderlay.show()` and `DialogUnderlay.hide()`.  And usually the module is not accessed directly
	 * at all, since the underlay is shown and hidden by the Dialog.
	 *
	 * @class module:delite/DialogUnderlay
	 */
	var DialogUnderlay = register("d-dialog-underlay", [HTMLElement, Widget],
			/** @lends module:delite/DialogUnderlay# */ {

		/**
		 * This class name is used on the DialogUnderlay node, in addition to d-dialog-underlay.
		 * @member {string}
		 */
		"class": "",
		_setClassAttr: function (clazz) {
			this.node.className = "d-dialog-underlay " + clazz;
			this._set("class", clazz);
		},

		// This will get overwritten as soon as show() is call, but leave an empty array in case hide() or destroy()
		// is called first.  The array is shared between instances but that's OK because we never write into it.
		_modalConnects: [],

		buildRendering: function () {
			// Outer div is used for fade-in/fade-out, and also to hold background iframe.
			// Inner div has opacity specified in CSS file.
			this.domNode.class = "d-dialog-underlay";
			this.node = this.ownerDocument.createElement("div");
			this.node.setAttribute("tabindex", "-1");
			this.domNode.appendChild(this.node);
		},

		postCreate: function () {
			// Append the underlay to the body
			this.ownerDocument.body.appendChild(this);

			this.own(on(this, "keydown", this._onKeyDown.bind(this)));
		},

		/**
		 * Sets the background to the size of the viewport (rather than the size
		 * of the document) since we need to cover the whole browser window, even
		 * if the document is only a few lines long.
		 * @private
		 */
		layout: function () {
			var is = this.node.style,
				os = this.style;

			// hide the background temporarily, so that the background itself isn't
			// causing scrollbars to appear (might happen when user shrinks browser
			// window and then we are called to resize)
			os.display = "none";

			// then resize and show
			var viewport = winUtils.getBox(this.ownerDocument);
			os.top = viewport.t + "px";
			os.left = viewport.l + "px";
			is.width = viewport.w + "px";
			is.height = viewport.h + "px";
			os.display = "block";
		},

		/**
		 * Show the dialog underlay (instance method).
		 */
		show: function () {
			this.style.display = "block";
			this.open = true;
			this.layout();
			this.bgIframe = new BackgroundIframe(this);

			var win = winUtils.get(this.ownerDocument);
			this._modalConnects = [
				Viewport.on("resize", this.layout.bind(this)),
				on(win, "scroll", this.layout.bind(this))
			];

		},

		/**
		 * Hide the dialog underlay (instance method).ore fixes
		 */
		hide: function () {
			this.bgIframe.destroy();
			delete this.bgIframe;
			this.style.display = "none";
			while (this._modalConnects.length) {
				(this._modalConnects.pop()).remove();
			}
			this.open = false;
		},

		destroy: register.before(function () {
			while (this._modalConnects.length) {
				(this._modalConnects.pop()).remove();
			}
		}),

		/**
		 * Extension point so Dialog can monitor keyboard events on the underlay.
		 * @protected
		 */
		_onKeyDown: function () {
		}
	});

	/**
	 * Static method to display the underlay with the given attributes set.  If the underlay is already displayed,
	 * then adjust it's attributes as specified.
	 * @memberof module:delite/DialogUnderlay
	 * @param {Object} attrs - The parameters to create DialogUnderlay with.
	 * @param {number} zIndex - z-index of the underlay.
	 */
	DialogUnderlay.show = function (attrs, zIndex) {
		var underlay = DialogUnderlay._singleton;
		if (!underlay || underlay._destroyed) {
			underlay = DialogUnderlay._singleton = new DialogUnderlay(attrs);
		} else {
			if (attrs) {
				underlay.set(attrs);
			}
		}
		domStyle.set(underlay, "zIndex", zIndex);
		if (!underlay.open) {
			underlay.show();
		}
	};

	/**
	 * Static method to hide the underlay.
	 * @memberof module:delite/DialogUnderlay
	 */
	DialogUnderlay.hide = function () {
		// Guard code in case the underlay widget has already been destroyed
		// because we are being called during page unload (when all widgets are destroyed)
		var underlay = DialogUnderlay._singleton;
		if (underlay && !underlay._destroyed) {
			underlay.hide();
		}
	};

	return DialogUnderlay;
});
