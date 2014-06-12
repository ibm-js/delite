/** @module delite/BackgroundIframe */
define([
	"dcl/dcl",
	"dojo/has"
], function (dcl, has) {

	// Flag for whether to create background iframe behind popups like Menus and Dialog.
	// A background iframe is useful to prevent problems with popups appearing behind applets/pdf files.
	has.add("config-bgIframe", false);

	// TODO: remove _frames, it isn't being used much, since popups never release their
	// iframes (see [22236])
	/**
	 * Cache of iframes.
	 * @constructor
	 */
	var Frames = function () {
		var queue = [];

		this.pop = function () {
			var iframe;
			if (queue.length) {
				iframe = queue.pop();
				iframe.style.display = "";
			} else {
				iframe = document.createElement("iframe");
				iframe.src = "javascript:''";
				iframe.className = "d-background-iframe";
				iframe.setAttribute("role", "presentation");

				// Magic to prevent iframe from getting focus on tab keypress - as style didn't work.
				iframe.tabIndex = -1;
			}
			return iframe;
		};

		this.push = function (iframe) {
			iframe.style.display = "none";
			queue.push(iframe);
		};
	};
	var _frames = new Frames();


	/**
	 * Makes a background iframe as a child of node.  Iframe fills area (and position) of node.
	 * @param {Element} node
	 * @class module:delite/BackgroundIframe
	 */
	return dcl(null, /** @lends module:delite/BackgroundIframe# */ {
		constructor: function (node) {
			if (has("config-bgIframe")) {
				var iframe = (this.iframe = _frames.pop());
				node.appendChild(iframe);
				iframe.style.width = "100%";
				iframe.style.height = "100%";
			}
		},

		/**
		 * Destroy the iframe.
		 */
		destroy: function () {
			if (this._conn) {
				this._conn.remove();
				this._conn = null;
			}
			if (this.iframe) {
				_frames.push(this.iframe);
				delete this.iframe;
			}
		}
	});
});
