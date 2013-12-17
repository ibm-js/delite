define([
	"dcl/dcl",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/dom-class",
	"dojo/_base/fx",
	"dojo/fx/easing",
	"./Invalidating",
	"./themes/load!./themes/{{theme}}/Scrollable"
], function (dcl, dom, domStyle, domClass, baseFx, easing, Invalidating) {

	// module:
	//		dui/Scrollable
	
	return dcl(Invalidating, {
		// summary:
		//		A mixin which adds scrolling capabilities to a widget.
		// description:
		//		TODO

		// scrollDirection: String
		//		The direction of the interactive scroll. Possible values are:
		//		"vertical", "horizontal", "both, and "none". The default value is "vertical".
		//		Note that scrolling programmatically using scrollTo() is
		//		possible on both horizontal and vertical directions independently 
		//		on the value of scrollDirection.
		scrollDirection: "vertical",
		
		preCreate: function () {
			this.addInvalidatingProperties("scrollDirection");
		},

		refreshRendering: function () {
			if (this.scrollDirection === "horizontal") {
				domStyle.set(this, "overflowX", "scroll");
				domStyle.set(this, "overflowY", ""); // restore the default
			} else if (this.scrollDirection === "vertical") {
				domStyle.set(this, "overflowX", ""); // restore the default
				domStyle.set(this, "overflowY", "scroll");
			} else if (this.scrollDirection === "both") {
				domStyle.set(this, "overflowX", "scroll");
				domStyle.set(this, "overflowY", "scroll");
			} else if (this.scrollDirection === "none") {
				domStyle.set(this, "overflowX", ""); // restore the default
				domStyle.set(this, "overflowY", ""); // restore the default
			} // else: do nothing for unsupported values
		},

		buildRendering: dcl.after(function () {
			domClass.add(this, "d-scrollable");
			dom.setSelectable(this, false);
			this.invalidateRendering();
		}),
		
		isTopScroll: function () {
			// summary:
			//		Returns true if container's scroll has reached the maximum at
			//		the top of the content. Returns false otherwise.
			// example:
			// | scrollContainer.on("scroll", function () {
			// |	if (scrollContainer.isTopScroll()) {
			// |		console.log("Scroll reached the maximum at the top");
			// |	}
			// | }
			// returns: Boolean
			return this.scrollTop === 0;
		},
		
		isBottomScroll: function () {
			// summary:
			//		Returns true if container's scroll has reached the maximum at
			//		the bottom of the content. Returns false otherwise.
			// example:
			// | scrollContainer.on("scroll", function () {
			// |	if (scrollContainer.isBottomScroll()) {
			// |		console.log("Scroll reached the maximum at the bottom");
			// |	}
			// | }
			// returns: Boolean
			var scroller = this;
			return scroller.offsetHeight + scroller.scrollTop >= scroller.scrollHeight;
		},
		
		isLeftScroll: function () {
			// summary:
			//		Returns true if container's scroll has reached the maximum at
			//		the left of the content. Returns false otherwise.
			// example:
			// | scrollContainer.on("scroll", function () {
			// |	if (scrollContainer.isLeftScroll()) {
			// |		console.log("Scroll reached the maximum at the left");
			// |	}
			// | }
			// returns: Boolean
			return this.scrollLeft === 0;
		},
		
		isRightScroll: function () {
			// summary:
			//		Returns true if container's scroll has reached the maximum at
			//		the right of the content. Returns false otherwise.
			// example:
			// | scrollContainer.on("scroll", function () {
			// |	if (scrollContainer.isRightScroll()) {
			// |		console.log("Scroll reached the maximum at the right");
			// |	}
			// | }
			// returns: Boolean
			var scroller = this;
			return scroller.offsetWidth + scroller.scrollLeft >= scroller.scrollWidth;
		},

		getCurrentScroll: function () {
			// summary:
			//		Returns the current amount of scroll, as an object with x and y properties
			//		for the horizontal and vertical scroll amount. TODO: improve the doc.
			// returns: Object
			return {x: this.scrollLeft, y: this.scrollTop};
		},
		
		scrollBy: function (by, duration) {
			// summary:
			//		Scrolls by the given amount.
			// by:
			//		The scroll amount. An object with x and/or y properties, for example
			//		{x:0, y:-5} or {y:-29}.
			// duration:
			//		Duration of scrolling animation in milliseconds. If 0 or unspecified,
			//		scrolls without animation. 
			var to = {};
			if (by.x) {
				to.x = this.scrollLeft + by.x;
			}
			if (by.y) {
				to.y = this.scrollTop + by.y;
			}
			this.scrollTo(to, duration);
		},
		
		scrollTo: function (to, /*Number?*/duration) {
			// summary:
			//		Scrolls to the given position.
			// to:
			//		The scroll destination position. An object with x and/or y properties,
			//		for example {x:0, y:-5} or {y:-29}.
			// duration:
			//		Duration of scrolling animation in milliseconds. If 0 or unspecified,
			//		scrolls without animation. 
			
			var self = this;
			var domNode = this;
			if (!duration || duration <= 0) { // shortcut
				if (to.x) {
					domNode.scrollLeft = to.x;
				}
				if (to.y) {
					domNode.scrollTop = to.y;
				}
			} else {
				var from = {
					x: to.x ? domNode.scrollLeft : undefined,
					y: to.y ? domNode.scrollTop : undefined
				};
				var animation = function () {
					if (self._animation && self._animation.status() === "playing") {
						self._animation.stop();
					}
					// dojo/_base/fx._Line cannot be used for animating several
					// properties at once. Hence:
					baseFx._Line.prototype.getValue = function (/*float*/ n) {
						return {
							x: ((this.end.x - this.start.x) * n) + this.start.x,
							y: ((this.end.y - this.start.y) * n) + this.start.y
						};
					};
					var	anim = new baseFx.Animation({
						beforeBegin: function () {
							if (this.curve) {
								delete this.curve;
							}
							anim.curve = new baseFx._Line(from, to);
						},
						onAnimate: function (val) {
							if (val.x) {
								domNode.scrollLeft = val.x;
							}
							if (val.y) {
								domNode.scrollTop = val.y;
							}
						},
						easing: easing.expoInOut, // TODO: IMPROVEME
						duration: duration,
						rate: 20 // TODO: IMPROVEME
					});
					self._animation = anim;

					return anim; // dojo/_base/fx/Animation
				};
				animation().play();
			}
		}
	});
});
