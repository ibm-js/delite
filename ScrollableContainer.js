define([
	"dcl/dcl",
	"dojo/dom",
	"dojo/dom-style",
	"dojo/on",
	"dojo/_base/fx",
	"dojo/fx/easing",
	"./register",
	"./Widget",
	"./Container",
	"./Invalidating",
	"./themes/load!ScrollableContainer"
], function (dcl, dom, domStyle, on, baseFx, easing, register, Widget, Container, Invalidating) {

	// module:
	//		dui/ScrollableContainer
	
	return register("d-scrollable-container", [HTMLElement, Widget, Container, Invalidating], {
		// summary:
		//		A container widget with scrolling capabilities.
		// description:
		//		A container widget which can scroll its content 
		//		horizontally and/or vertically. TODO: document events etc.

		// scrollDirection: String
		//		The direction of the interactive scroll. Possible values are:
		//		"vertical", "horizontal", and "both". The default value is "vertical".
		//		Note that scrolling programmatically using scrollTo() is
		//		possible on both direction independently on the value of scrollDirection.
		scrollDirection: "vertical",
		
		// baseClass: String
		//		The name of the CSS class of this widget.
		baseClass: "duiScrollableContainer",
		
		preCreate: function () {
			this.addInvalidatingProperties("scrollDirection");
		},

		refreshRendering: function(){
			if (this.scrollDirection === "horizontal") {
				domStyle.set(this.containerNode, "overflowX", "scroll");
				domStyle.set(this.containerNode, "overflowY", ""); // restore the default
			} else if (this.scrollDirection === "vertical") {
				domStyle.set(this.containerNode, "overflowX", ""); // restore the default
				domStyle.set(this.containerNode, "overflowY", "scroll");
			} else if (this.scrollDirection === "both") {
				domStyle.set(this.containerNode, "overflowX", "scroll");
				domStyle.set(this.containerNode, "overflowY", "scroll");
			} // else: do nothing for unsupported values
		},

		buildRendering: function () {
			this.containerNode = this;
			dom.setSelectable(this.containerNode, false);
			this.invalidateRendering();
			on(this.containerNode, "scroll", this._onScroll);
			
			/* TODO: Temporary, for testing, delete */
			this.on("deliteful-scroll-bottom", function() {
				console.log("deliteful-scroll-bottom");
				alert("bottom");
			});
			this.on("deliteful-scroll-top", function() {
				console.log("deliteful-scroll-top");
				alert("top");
			});
		},
		
		_onScroll: function(e) {
			scroller = this.containerNode;
			/* TODO: temporary, for debug, delete
			console.log("left hand: " + (scroller.offsetHeight + scroller.scrollTop));
			console.log("right hand: " + (scroller.scrollHeight));
			console.log("diff: " + ((scroller.offsetHeight + scroller.scrollTop) - scroller.scrollHeight));
			*/
			// TODO: better event names?
			// TODO: check taking into account margins, padding etc.
			if (scroller.offsetHeight + scroller.scrollTop >= scroller.scrollHeight) {
				// scrolled to bottoms
				this.emit("deliteful-scroll-bottom");
			} else if (scroller.scrollTop == 0) {
				// scrolled to top
				this.emit("deliteful-scroll-top");
			}
		},
		
		// TODO: to be tested if it's worth setting the overflow:scroll on this.containerNode
		// versus setting it directly on this. The later would allow the user to install 
		// listeners for "scroll" events directly on the widget. Otherwise, we'd need to expose
		// an API to hide the existence of the internal containerNode. 

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
});
