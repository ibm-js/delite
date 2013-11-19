define([
	"dcl/dcl",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/_base/fx",
	"dojo/fx/easing",
	"./register",
	"./Widget",
	"./Container",
	"./themes/load!ScrollableContainer"
], function (dcl, dom, domStyle, baseFx, easing, register, Widget, Container) {

	// module:
	//		dui/ScrollableContainer

	var ScrollableContainer = dcl([Widget, Container], {
		// summary:
		//		A container widget with scrolling capabilities.
		// description:
		//		A container widget which can scroll its content 
		//		horizontally and/or vertically.

		// scrollDirection: String
		//		The direction of the interactive scroll:
		//		v: vertical, h: horizontal, vh: both.
		//		Note that scrolling programmatically using scrollTo() is
		//		possible on both direction independently on the value of scrollDirection.
		scrollDirection: "v",
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "duiScrollableContainer",
		
		buildRendering: function () {
			this.containerNode = this;
			dom.setSelectable(this.containerNode, false);
			
			if (this.scrollDirection.indexOf("v") !== -1) {
				domStyle.set(this.containerNode, "overflowY", "scroll");
			}
			if (this.scrollDirection.indexOf("h") !== -1) {
				domStyle.set(this.containerNode, "overflowX", "scroll");
			}
		},
		
		// TODO: custom setter for scrollDirection? The difficult point is what
		// value to restore for overflowX/Y when the user changes the scrollDirection
		// afterwards. The default one? Or should we store the initial value such that
		// we can restore it? Needs more thinking.
		
		getCurrentScroll: function () {
			// summary:
			//		Returns the current amount of scroll, as an object with x and y properties
			//		for the horizontal and vertical scroll amount. TODO: improve the doc.
			return {x: this.containerNode.scrollLeft, y: this.containerNode.scrollTop};
		},
		
		scrollTo: function (to, /*Number?*/duration) {
			// summary:
			//		Scrolls to the given position.
			// to:
			//		The scroll destination position. An object with x and/or y, for example
			//		{x:0, y:-5} or {y:-29}.
			// duration:
			//		Duration of scrolling animation in milliseconds. If 0 or unspecified,
			//		scrolls without animation. 
			
			var self = this;
			var domNode = this.containerNode;
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
	
	return register("d-scrollable-container", [HTMLElement, ScrollableContainer]);
});
