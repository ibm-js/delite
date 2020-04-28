define([
	"ibm-decor/sniff"
], function (
	has
) {
	// True on Windows (IE, legacy Edge, Firefox, Chrome).  False on Mac and iOS.
	has.add("rtl-adjust-position-for-verticalScrollBar", function () {
		var	body = document.body;
		var scrollable = document.createElement("div");
		scrollable.style.cssText =
			"overflow: scroll; overflow-x: visible; direction: rtl; visibility: hidden; " +
			"position: absolute; left: 0; top: 0; width: 64px; height: 64px";
		var div = document.createElement("div");
		div.style.cssText = "overflow: hidden; direction: ltr";
		scrollable.appendChild(div);
		body.appendChild(scrollable);
		var ret = position(div).x !== 0;
		body.removeChild(scrollable);
		return ret;
	});

	function position (node) {
		var ret = node.getBoundingClientRect();
		return { x: ret.left, y: ret.top, w: ret.right - ret.left, h: ret.bottom - ret.top };
	}

	function px (value) {
		// style values can be floats, client code may want
		// to round for integer pixels.
		return parseFloat(value) || 0;
	}

	function getPadExtents (/*Element*/ node, /*Object*/ computedStyle) {
		// summary:
		//		Returns object with special values specifically useful for node
		//		fitting.
		// description:
		//		Returns an object with `w`, `h`, `l`, `t` properties:
		//	|		l/t/r/b = left/top/right/bottom padding (respectively)
		//	|		w = the total of the left and right padding
		//	|		h = the total of the top and bottom padding
		//		If 'node' has position, l/t forms the origin for child nodes.
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: Element
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		getComputedStyle to get one. It is a better way, calling
		//		getComputedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of getComputedStyle().

		var s = computedStyle || getComputedStyle(node),
			l = px(node, s.paddingLeft), t = px(node, s.paddingTop), r = px(node, s.paddingRight),
			b = px(node, s.paddingBottom);
		return { l: l, t: t, r: r, b: b, w: l + r, h: t + b };
	}

	function getBorderExtents (/*Element*/ node, /*Object*/ computedStyle) {
		// summary:
		//		returns an object with properties useful for noting the border
		//		dimensions.
		// description:
		//		- l/t/r/b = the sum of left/top/right/bottom border (respectively)
		//		- w = the sum of the left and right border
		//		- h = the sum of the top and bottom border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: Element
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		getComputedStyle to get one. It is a better way, calling
		//		getComputedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of getComputedStyle().

		var s = computedStyle || getComputedStyle(node),
			l = s.borderLeftStyle !== "none" ? px(node, s.borderLeftWidth) : 0,
			t = s.borderTopStyle !== "none" ? px(node, s.borderTopWidth) : 0,
			r = s.borderRightStyle !== "none" ? px(node, s.borderRightWidth) : 0,
			b = s.borderBottomStyle !== "none" ? px(node, s.borderBottomWidth) : 0;
		return { l: l, t: t, r: r, b: b, w: l + r, h: t + b };
	}

	function getPadBorderExtents (/*Element*/ node, /*Object*/ computedStyle) {
		// summary:
		//		Returns object with properties useful for box fitting with
		//		regards to padding.
		// description:
		//		- l/t/r/b = the sum of left/top/right/bottom padding and left/top/right/bottom border (respectively)
		//		- w = the sum of the left and right padding and border
		//		- h = the sum of the top and bottom padding and border
		//
		//		The w/h are used for calculating boxes.
		//		Normally application code will not need to invoke this
		//		directly, and will use the ...box... functions instead.
		// node: Element
		// computedStyle: Object?
		//		This parameter accepts computed styles object.
		//		If this parameter is omitted, the functions will call
		//		getComputedStyle to get one. It is a better way, calling
		//		getComputedStyle once, and then pass the reference to this
		//		computedStyle parameter. Wherever possible, reuse the returned
		//		object of getComputedStyle().

		var s = computedStyle || getComputedStyle(node),
			p = getPadExtents(node, s),
			b = getBorderExtents(node, s);
		return {
			l: p.l + b.l,
			t: p.t + b.t,
			r: p.r + b.r,
			b: p.b + b.b,
			w: p.w + b.w,
			h: p.h + b.h
		};
	}

	/**
	 * 	Scroll the passed node into view using minimal movement, if it is not already.
	 *
	 * Don't rely on node.scrollIntoView working just because the function is there since it forces the node to the
	 * page's bottom or top (and left or right in IE) without consideration for the minimal movement.
	 * WebKit's node.scrollIntoViewIfNeeded doesn't work either for inner scrollbars in right-to-left mode
	 * and when there's a fixed position scrollable element.
	 */
	// eslint-disable-next-line complexity
	return function (/*Element*/ node, /*Object?*/ pos) {
		try { // catch unexpected/unrecreatable errors since we can recover using a semi-acceptable native method
			var doc = node.ownerDocument,
				body = doc.body,
				html = doc.documentElement || body.parentNode,
				isIE = has("ie") || has("trident"),
				isWK = has("webkit");
			// if an untested browser, then use the native method
			if (node === body || node === html) {
				return;
			}
			if (!(has("mozilla") || isIE || isWK || has("edge"))
				&& ("scrollIntoView" in node)) {
				node.scrollIntoView(false); // short-circuit to native if possible
				return;
			}
			var rootWidth = Math.min(body.clientWidth || html.clientWidth, html.clientWidth || body.clientWidth),
				rootHeight = Math.min(body.clientHeight || html.clientHeight, html.clientHeight || body.clientHeight),
				scrollRoot = isWK ? body : html,
				nodePos = pos || position(node),
				el = node.parentNode,
				isFixed = function (elem) {
					return getComputedStyle(elem).position.toLowerCase() === "fixed";
				},
				scrollElementBy = function (elem, x, y) {
					if (elem.tagName === "BODY" || elem.tagName === "HTML") {
						scrollBy(x, y);
					} else {
						if (x) {
							elem.scrollLeft += x;
						}
						if (y) {
							elem.scrollTop += y;
						}
					}
				};
			if (isFixed(node)) {
				return;
			} // nothing to do
			while (el) {
				if (el === body) {
					el = scrollRoot;
				}
				var elPos = position(el),
					fixedPos = isFixed(el),
					rtl = getComputedStyle(el).direction.toLowerCase() === "rtl";

				if (el === scrollRoot) {
					elPos.w = rootWidth;
					elPos.h = rootHeight;
					if (scrollRoot === html && isIE && rtl) {
						elPos.x += scrollRoot.offsetWidth - elPos.w;// IE workaround where scrollbar causes negative x
					}
					elPos.x = 0;
					elPos.y = 0;
				} else {
					var pb = getPadBorderExtents(el);
					elPos.w -= pb.w;
					elPos.h -= pb.h;
					elPos.x += pb.l;
					elPos.y += pb.t;
					var clientSize = el.clientWidth,
						scrollBarSize = elPos.w - clientSize;
					if (clientSize > 0 && scrollBarSize > 0) {
						if (rtl && has("rtl-adjust-position-for-verticalScrollBar")) {
							elPos.x += scrollBarSize;
						}
						elPos.w = clientSize;
					}
					clientSize = el.clientHeight;
					scrollBarSize = elPos.h - clientSize;
					if (clientSize > 0 && scrollBarSize > 0) {
						elPos.h = clientSize;
					}
				}
				if (fixedPos) { // bounded by viewport, not parents
					if (elPos.y < 0) {
						elPos.h += elPos.y;
						elPos.y = 0;
					}
					if (elPos.x < 0) {
						elPos.w += elPos.x;
						elPos.x = 0;
					}
					if (elPos.y + elPos.h > rootHeight) {
						elPos.h = rootHeight - elPos.y;
					}
					if (elPos.x + elPos.w > rootWidth) {
						elPos.w = rootWidth - elPos.x;
					}
				}
				// calculate overflow in all 4 directions
				var l = nodePos.x - elPos.x, // beyond left: < 0
					t = nodePos.y - elPos.y, // beyond top: < 0
					r = l + nodePos.w - elPos.w, // beyond right: > 0
					bot = t + nodePos.h - elPos.h; // beyond bottom: > 0
				var s, old;
				if (r * l > 0 && (!!el.scrollLeft || el === scrollRoot || el.scrollWidth > el.offsetHeight)) {
					s = Math[l < 0 ? "max" : "min"](l, r);
					if (rtl && has("trident") >= 5) {
						s = -s;
					}
					old = el.scrollLeft;
					scrollElementBy(el, s, 0);
					s = el.scrollLeft - old;
					nodePos.x -= s;
				}
				if (bot * t > 0 && (!!el.scrollTop || el === scrollRoot || el.scrollHeight > el.offsetHeight)) {
					s = Math.ceil(Math[t < 0 ? "max" : "min"](t, bot));
					old = el.scrollTop;
					scrollElementBy(el, 0, s);
					s = el.scrollTop - old;
					nodePos.y -= s;
				}
				el = (el !== scrollRoot) && !fixedPos && el.parentNode;
			}
		} catch (error) {
			console.error("scrollIntoView: " + error);
			node.scrollIntoView(false);
		}
	};
});