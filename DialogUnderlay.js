/** @module delite/DialogUnderlay */
define([
	"./register",
	"./Widget",
	"./BackgroundIframe",
	"./Viewport",
	"./theme!./DialogUnderlay/themes/{{theme}}/DialogUnderlay.css"
], function (register, Widget, BackgroundIframe, Viewport) {

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

		// This will get overwritten as soon as show() is call, but leave an empty array in case hide() or destroy()
		// is called first.  The array is shared between instances but that's OK because we never write into it.
		_modalConnects: [],

		render: function () {
			// Outer div is used for fade-in/fade-out, and also to hold background iframe.
			// Inner div has opacity specified in CSS file.
			this.className = "d-dialog-underlay";
		},

		postRender: function () {
			// Append the underlay to the body
			this.ownerDocument.body.appendChild(this);
		},

		/**
		 * Sets the background to the size of the viewport (rather than the size
		 * of the document) since we need to cover the whole browser window, even
		 * if the document is only a few lines long.
		 * @private
		 */
		layout: function () {
			var s = this.style;

			// hide the background temporarily, so that the background itself isn't
			// causing scrollbars to appear (might happen when user shrinks browser
			// window and then we are called to resize)
			s.display = "none";

			// then resize and show
			// could alternately use $(window).scrollTop() and $(window).height(), etc.
			var html = this.ownerDocument.documentElement;
			s.width = html.clientWidth + "px";
			s.height = html.clientHeight + "px";

			s.display = "";
		},

		/**
		 * Show the dialog underlay (instance method).
		 */
		show: function () {
			if (!this._open) {
				this.style.display = "block";
				this._open = true;
				this.layout();
				this.bgIframe = new BackgroundIframe(this);

				this._modalConnects = [
					Viewport.on("resize", function () { this.layout(); }.bind(this))
				];
			}
		},

		/**
		 * Hide the dialog underlay (instance method).
		 */
		hide: function () {
			if (this._open) {
				this.bgIframe.destroy();
				delete this.bgIframe;
				this.style.display = "none";
				while (this._modalConnects.length) {
					(this._modalConnects.pop()).remove();
				}
				this._open = false;
			}
		},

		destroy: function () {
			while (this._modalConnects.length) {
				(this._modalConnects.pop()).remove();
			}
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
				underlay.mix(attrs);
			}
		}
		underlay.style.zIndex = zIndex;
		underlay.show();
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
