/** @module delite/BackgroundIframe */
define([
	"dcl/dcl",
	"./features"
], function (dcl, has) {
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
			if (this.iframe) {
				this.iframe.parentNode.removeChild(this.iframe);
				_frames.push(this.iframe);
				delete this.iframe;
			}
		}
	});
});
