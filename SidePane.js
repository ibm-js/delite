define(
	["./register",
		"./Widget",
		"./Container",
		"./Contained",
		"./Invalidating",
		"dojo/_base/lang",
		"dojo/dom-class",
		"dojo/_base/window",
		"dojo/touch",
		"dojo/on",
		"dojo/sniff",
		"./themes/load!./themes/{{theme}}/SidePane"],
	function (register, Widget, Container, Contained, Invalidating, lang, domClass, win, touch, on, has) {
		function prefix(v) {
			return "-d-side-pane-" + v;
		}
		function setVisibility(node, val) {
			if (node) {
				if (val) {
					node.style.visibility = "visible";
					node.style.display = "";
				} else {
					node.style.visibility = "hidden";
					node.style.display = "none";
				}
			}
		}

		return register("d-side-pane", [HTMLElement, Widget, Container, Contained, Invalidating], {

			// summary:
			//		A container displayed on the side of the screen. It can be displayed on top of the page
			// 		(mode=overlay) or
			//		can push the content of the page (mode=push or mode=reveal).
			// description:
			//		SidePane is an interactive container hidden by default. To open it, swipe the screen from the
			// border to the center of the page.
			//		To close it, swipe horizontally the panel in the other direction.
			//		This widget must be a sibling of html's body element or use the entire screen.
			//		If mode is set to "push" or "reveal", the width of the SidePane can't be changed in the markup
			//		(15em by default).
			//		However it can be changed in SidePane.less (@PANE_WIDTH variable) to regenerate SidePane.css.
			//		In "push" and "reveal" mode, the pushed element is the first sibling of the SidePane which is
			//		of type element
			//		(nodeType == 1) and not a SidePane.

			// baseClass: String
			//		The name of the CSS class of this widget.
			baseClass: "d-side-pane",

			// mode: String
			//		Can be "overlay", "reveal" or "push". Default is "push".
			mode: "push",

			// position: String
			//		Can be "start" or "end". If set to "start", the panel is displayed on the
			//		left side in left-to-right mode.
			position: "start",

			// animate: Boolean
			//		Enable/Disable open/hide animations.
			animate: true,

			// swipeOpening: Boolean
			//		Enables the swipe opening of the pane.
			swipeOpening: false,

			// swipeClosing: Boolean
			//		Enables the swipe closing of the pane.
			swipeClosing: false,

			_transitionTiming: {default: 0, chrome: 50, ios: 20, android: 100, mozilla: 100},
			_timing: 0,
			_visible: false,
			_opening: false,
			_originX: NaN,
			_originY: NaN,
			_cssClasses: {},
			_transitionEndHandlers: [],

			open: function () {
				// summary:
				//		Open the panel.
				var nextElement;
				if (this.animate) {
					domClass.add(this, prefix("animate"));
					nextElement = this.getNextSibling();
					if (nextElement) {
						domClass.add(nextElement, prefix("animate"));
					}
				}
				setVisibility(this, true);
				if (this.mode === "reveal") {
					nextElement = this.getNextSibling();
					if (nextElement) {
						this._setAfterTransitionHandlers(nextElement, {node: nextElement});
					}
				} else {
					this._setAfterTransitionHandlers(this, {node: this});
				}
				this.defer(this._openImpl, this._timing);
			},

			close: function () {
				// summary:
				//		Close the panel.
				if (this.mode === "reveal") {
					var nextElement = this.getNextSibling();
					if (nextElement) {
						this._setAfterTransitionHandlers(nextElement, {node: nextElement});
					}
				} else {
					this._setAfterTransitionHandlers(this, {node: this});
				}
				this._hideImpl();
			},

			_setAfterTransitionHandlers: function (node, event, deferred) {
				var handle = lang.hitch(this, this._afterTransitionHandle);
				this._transitionEndHandlers.push({node: node, handle: handle, props: event, deferred: deferred});
				node.addEventListener("webkitTransitionEnd", handle);
				node.addEventListener("transitionend", handle); // IE10 + FF
			},

			_afterTransitionHandle: function (/*jshint unused: vars */ event) {
				var item;
				for (var i = 0; i < this._transitionEndHandlers.length; i++) {
					item = this._transitionEndHandlers[i];
					if (!this._visible) {
						setVisibility(this, false);
					}
					item.node.removeEventListener("webkitTransitionEnd", item.handle);
					item.node.removeEventListener("transitionend", item.handle);
					this._transitionEndHandlers.splice(i, 1);
					if (item.props.deferred) {
						item.props.deferred.resolve();
					}
					break;
				}
			},

			_setSwipeClosingAttr: function (value) {
				this.swipeClosing = value;
				this._resetInteractions();
			},

			_setSwipeOpeningAttr: function (value) {
				this.swipeOpening = value;
				this._resetInteractions();
			},

			postCreate: function () {
				setVisibility(this, false);
			},

			preCreate: function () {
				this.addInvalidatingProperties("position", "mode");
			},

			buildRendering: function () {
				this.parentNode.style.overflow = "hidden";
				this._resetInteractions();
				this.invalidateRendering();
			},

			_firstRendering: true,

			refreshRendering: function (props) {

				var fullRefresh = this._firstRendering || Object.getOwnPropertyNames(props).length === 0;
				this._firstRendering = false;

				var nextElement = this.getNextSibling();

				if (this.animate) {
					domClass.remove(this, prefix("animate"));
					if (nextElement) {
						domClass.remove(nextElement, prefix("animate"));
					}
				}

				if (fullRefresh || props.mode) {
					domClass.remove(this, prefix("push"));
					domClass.remove(this, prefix("overlay"));
					domClass.remove(this, prefix("reveal"));
					domClass.add(this, prefix(this.mode));

					if (this.mode === "overlay") {
						this.style["z-index"] = 1;
					}
					else if (this.mode === "reveal") {
						this.style["z-index"] = -1;
					}

					if (nextElement && this._visible) {
						if (this.mode === "overlay") {
							domClass.remove(nextElement, prefix("translated"));
						} else {
							domClass.add(nextElement, prefix("translated"));
						}
					}
				}
				if (fullRefresh || props.position) {
					domClass.remove(this, prefix("start"));
					domClass.remove(this, prefix("end"));
					domClass.add(this, prefix(this.position));
					if (nextElement && this._visible) {
						domClass.remove(nextElement, prefix("start"));
						domClass.remove(nextElement, prefix("end"));
						domClass.add(nextElement, prefix(this.position));
					}
				}
				if (fullRefresh) {
					if (this._visible) {
						domClass.remove(this, prefix("hidden"));
						domClass.add(this, prefix("visible"));
					} else {
						domClass.remove(this, prefix("visible"));
						domClass.add(this, prefix("hidden"));
					}
				}
				if (this._timing === 0) {
					for (var o in this._transitionTiming) {
						if (has(o) && this._timing < this._transitionTiming[o]) {
							this._timing = this._transitionTiming[o];
						}
					}

				}
				if (this.animate) {
					this.defer(function () {
						domClass.add(this, prefix("animate"));
						if (nextElement) {
							domClass.add(nextElement, prefix("animate"));
						}
					}, this._timing);
				}
			},
			_openImpl: function () {
				if (!this._visible) {
					this._visible = true;
					domClass.remove(this, prefix("hidden"));
					domClass.add(this, prefix("visible"));

					if (this.mode === "push" || this.mode === "reveal") {
						var nextElement = this.getNextSibling();
						if (nextElement) {
							domClass.remove(nextElement, prefix("nottranslated"));
							domClass.remove(nextElement, prefix("start"));
							domClass.remove(nextElement, prefix("end"));
							domClass.add(nextElement, prefix(this.position));
							domClass.add(nextElement, prefix("translated"));
						}
					}
				}
			},

			_hideImpl: function () {
				if (this._visible) {
					this._visible = false;
					this._opening = false;
					domClass.remove(win.doc.body, prefix("no-select"));
					domClass.remove(this, prefix("visible"));
					domClass.add(this, prefix("hidden"));
					if (this.mode === "push" || this.mode === "reveal") {
						var nextElement = this.getNextSibling();
						if (nextElement) {
							domClass.remove(nextElement, prefix("translated"));
							domClass.remove(nextElement, prefix("start"));
							domClass.remove(nextElement, prefix("end"));
							domClass.add(nextElement, prefix(this.position));
							domClass.add(nextElement, prefix("nottranslated"));
						}
					}
				}
			},

			_touchPress: function (event) {
				this._originX = event.pageX;
				this._originY = event.pageY;

				if (this.style.display === "none") {
					setVisibility(this, true);
				}

				if (this._visible || (this.position === "start" && !this._visible && this._originX <= 10) ||
					(this.position === "end" && !this._visible && this._originX >= win.doc.width - 10)) {
					this._opening = !this._visible;
					this._pressHandle.remove();
					this._moveHandle = on(win.doc, touch.move, lang.hitch(this, this._touchMove));
					this._releaseHandle = on(win.doc, touch.release, lang.hitch(this, this._touchRelease));

					this._addClass(win.doc.body, "-d-side-pane-no-select");
				}
			},

			_touchMove: function (event) {
				if (!this._opening && Math.abs(event.pageY - this._originY) > 10) {
					this._resetInteractions();
				} else {
					var pos = event.pageX;

					if (this.position === "start") {
						if (this.swipeOpening && !this._visible && (pos - this._originX) > 10) {
							this.open();
						} else if (this._visible) {
							if (this._originX < pos) {
								this._originX = pos;
							}

							if ((this.swipeClosing && this._originX - pos) > 10) {
								this.close();
								this._originX = pos;
							}
						}
					} else {
						if (this.swipeOpening && !this._visible && (this._originX - pos) > 10) {
							this.open();
						} else if (this._visible) {
							if (this._originX > pos) {
								this._originX = pos;
							}
							if ((this.swipeClosing && pos - this._originX) > 10) {
								this.close();
								this._originX = pos;
							}
						}
					}
				}
			},

			_touchRelease: function () {
				this._opening = false;
				this._removeClass(win.doc.body, "-d-side-pane-no-select");
				this._resetInteractions();
			},

			_resetInteractions: function () {
				if (this._releaseHandle) {
					this._releaseHandle.remove();
				}
				if (this._moveHandle) {
					this._moveHandle.remove();
				}
				if (this._pressHandle) {
					this._pressHandle.remove();
				}
				var elt = this._visible ? this : win.doc;

				if (this.style.display === "none" || this.swipeOpening || this.swipeClosing) {
					this._pressHandle = on(elt, touch.press, lang.hitch(this, this._touchPress));
				}

				this._originX = NaN;
				this._originY = NaN;
			},

			destroy: function () {
				this._cleanCSS();

				if (this._pressHandle) {
					this._pressHandle.remove();
				}
				if (this._moveHandle) {
					this._moveHandle.remove();
				}
				if (this._releaseHandle) {
					this._releaseHandle.remove();
				}
			}
		});
	});

