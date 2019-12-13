/** @module delite/ScrollAnimation */
define([
	"dcl/dcl",
	"ibm-decor/Evented"
], function (dcl, Evented) {
	"use strict";

	/**
	 * A class which animates the scrolling on a given widget.
	 *
	 * This class should be imported and a new instance should be created
	 * for each animation.
	 *
	 * Example:
	 *
	 * ```js
	 * this._animation = new ScrollAnimation(scrollableNode, {
	 *		from: from,
	 *		to: to,
	 *		duration: duration
	 *	});
	 *
	 *	this._animation.on("ended", function () {
	 *		this._animation = null;
	 *	}.bind(this), true);
	 * ```
	 */
	var ScrollAnimation = dcl(Evented, {

		declaredClass: "delite/ScrollAnimation",

		/**
		 * Constructor
		 *
		 * @param {Element} node The node that will scroll.
		 * @param {Object} options
		 *		An object containing { to: { x: Number, y: Number }, duration: Number }
		 */
		constructor: function (node, options) {
			this.node = node;
			this.options = options;
			this.timerId = null;

			this._scroll();
		},

		/**
		 * Internal scroll method.
		 *
		 */
		_scroll: function () {
			var duration = this.options.duration,
				scrollTop = this.options.from.y || this.node.scrollTop,
				scrollLeft = this.options.from.x || this.node.scrollLeft,
				changeScrollTop = this.options.to.y - scrollTop,
				changeScrollLeft = this.options.to.x - scrollLeft,
				currentTime = 0,
				increment = 20;

			var step = function () {
				currentTime += increment;

				var scrollTopStep = ScrollAnimation.easeInOutQuad(currentTime, scrollTop, changeScrollTop, duration);
				var scrollLeftStep = ScrollAnimation.easeInOutQuad(currentTime, scrollLeft, changeScrollLeft, duration);

				this.node.scrollTop = scrollTopStep;
				this.node.scrollLeft = scrollLeftStep;

				if (currentTime < duration) {
					this.timerId = setTimeout(step, increment);
				} else {
					this.emit("ended");
					this.stop();
				}
			}.bind(this);

			step();
		},

		/**
		 * Stop the animation.
		 *
		 */
		stop: function () {
			if (this.timerId) {
				clearTimeout(this.timerId);
				this.timerId = null;
			}
		}
	});

	/**
	 * Easing function: easeInOutQuad
	 *
	 * @param {number} t The current time.
	 * @param {number} b The initial value.
	 * @param {number} c The target value.
	 * @param {number} d The duration.
	 * @returns {number} The interval between initial and target.
	 */
	ScrollAnimation.easeInOutQuad = function (t, b, c, d) {
		t /= d / 2;
		if (t < 1) {
			return c / 2 * t * t + b;
		}
		t--;
		return -c / 2 * (t * (t - 2) - 1) + b;
	};

	return ScrollAnimation;
});
