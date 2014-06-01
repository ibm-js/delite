/** @module delite/BackgroundIframe */
define([
	"dojo/_base/lang", // lang.extend
	"dojo/has"
], function (lang, has) {

	// TODO: switch to dcl() to remove dojo/_base/lang dependency

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
	 * @constructor module:delite/BackgroundIframe
	 */
	var BackgroundIframe = function (node) {
		if (has("config-bgIframe")) {
			var iframe = (this.iframe = _frames.pop());
			node.appendChild(iframe);
			iframe.style.width = "100%";
			iframe.style.height = "100%";
		}
	};

	lang.extend(BackgroundIframe, /** @lends module:delite/BackgroundIframe# */ {
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

	return BackgroundIframe;
});
