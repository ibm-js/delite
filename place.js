/**
 * Place an Element relative to a point, rectangle, or another Element.
 * @module delite/place
 */
define([
	"./Viewport" // getEffectiveBox
], function (Viewport) {

	/**
	 * @typedef {Object} module:delite/place.Position
	 * @property {number} x - Horizontal coordinate in pixels, relative to document body.
	 * @property {number} y - Vertical coordinate in pixels, relative to document body.
	 */

	/**
	 * Represents the position of the "anchor" node.   Popup node will be placed adjacent to this rectangle.
	 * @typedef {Object} module:delite/place.Rectangle
	 * @property {number} x - Horizontal coordinate in pixels, relative to document body.
	 * @property {number} y - Vertical coordinate in pixels, relative to document body.
	 * @property {number} w - Width in pixels.
	 * @property {number} h - Height in pixels.
	 */

	/**
	 * Meta-data about the position chosen for a popup node.
	 * Specifies the corner of the anchor node and the corner of the popup node that touch each other,
	 * plus sizing data.
	 * @typedef {Object} module:delite/place.ChosenPosition
	 * @property {string} aroundCorner - Corner of the anchor node:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {string} corner - Corner of the popup node:
	 * - "BL" - bottom left
	 * - "BR" - bottom right
	 * - "TL" - top left
	 * - "TR" - top right
	 * @property {number} x - Horizontal position of popup in pixels, relative to document body.
	 * @property {number} y - Vertical position of popup in pixels, relative to document body.
	 * @property {number} w - Width of popup in pixels.
	 * @property {number} h - Height of popup in pixels.
	 * @property {Object} spaceAvailable - `{w: 30, h: 20}` type object listing the amount of space that
	 * was available for the popup in the chosen position.
	 */

	function marginBox (node) {
		var bb = node.getBoundingClientRect(),
			cs = getComputedStyle(node);
		return {
			width: bb.width + parseFloat(cs.marginLeft) +  + parseFloat(cs.marginRight), // parseFloat() removes "px"
			height: bb.height + parseFloat(cs.marginTop) +  + parseFloat(cs.marginBottom)
		};
	}

	/**
	 * Given a list of positions to place node, place it at the first position where it fits,
	 * or if it doesn't fit anywhere then the position with the least overflow.
	 * @param {Element} node
	 * @param {Array} choices - Array of objects like `{corner: "TL", pos: {x: 10, y: 20} }`.
	 * This example says to put the top-left corner of the node at (10,20).
	 * @returns {module:delite/place.ChosenPosition} Best position to place node.
	 * @private
	 */
	function _placeAt (node, choices) {
		// get {l: 10, t: 10, w: 100, h:100} type obj representing position of
		// viewport over document
		var view = Viewport.getEffectiveBox(node.ownerDocument),
			style = node.style;

		// Backwards compatibility code.  Popups should generally be the next-sibling of their anchor node so that
		// VoiceOver users can swipe from the anchor to the popup.
		if (!node.parentNode) {
			node.ownerDocument.body.appendChild(node);
		}

		var best;
		choices.some(function (choice) {
			var corner = choice.corner;
			var pos = choice.pos;
			var overflow = 0;

			// calculate amount of space available given specified position of node
			var spaceAvailable = {
				w: {
					L: view.l + view.w - pos.x,
					R: pos.x - view.l,
					M: view.w
				}[corner.charAt(1)],
				h: {
					T: view.t + view.h - pos.y,
					B: pos.y - view.t,
					M: view.h
				}[corner.charAt(0)]
			};

			// Clear left/right position settings set earlier so they don't interfere with calculations.
			// Unclear if this is still needed: we no longer call Tooltip#orient() while testing different choices.
			style.left = style.right = "auto";

			// Get node's size.  Use margin-box because Tooltip uses margin to leave space for connector.
			var oldDisplay = style.display;
			var oldVis = style.visibility;
			if (style.display === "none") {
				style.visibility = "hidden";
				style.display = "";
			}
			var mb = marginBox(node);
			style.display = oldDisplay;
			style.visibility = oldVis;

			// coordinates and size of node with specified corner placed at pos,
			// and clipped by viewport
			var
				startXpos = {
					L: pos.x,
					R: pos.x - mb.width,
					// M orientation is more flexible
					M: Math.max(view.l, Math.min(view.l + view.w, pos.x + (mb.width >> 1)) - mb.width)
				}[corner.charAt(1)],
				startYpos = {
					T: pos.y,
					B: pos.y - mb.height,
					M: Math.max(view.t, Math.min(view.t + view.h, pos.y + (mb.height >> 1)) - mb.height)
				}[corner.charAt(0)],
				startX = Math.max(view.l, startXpos),
				startY = Math.max(view.t, startYpos),
				endX = Math.min(view.l + view.w, startXpos + mb.width),
				endY = Math.min(view.t + view.h, startYpos + mb.height),
				width = endX - startX,
				height = endY - startY;

			overflow += (mb.width - width) + (mb.height - height);

			if (!best || overflow < best.overflow) {
				best = {
					corner: corner,
					aroundCorner: choice.aroundCorner,
					x: startX,
					y: startY,
					w: width,
					h: height,
					overflow: overflow,
					spaceAvailable: spaceAvailable
				};
			}

			return !overflow;
		});

		// And then position the node.  Do this last,
		// due to browser quirks when the viewport is scrolled
		// (specifically that a Tooltip will shrink to fit as though the window was
		// scrolled to the left).

		var top = best.y,
			side = best.x;

		// Find the nearest ancestor set to position:absolute or position: relative.
		var ancestor = node.parentNode;
		while (ancestor !== node.ownerDocument.body
				&& !/^(relative|absolute|fixed)$/.test(getComputedStyle(ancestor).position)) {
			ancestor = ancestor.parentNode;
		}
		var cs = getComputedStyle(ancestor);

		if (ancestor === node.ownerDocument.body) {
			if (/^(relative|absolute)$/.test(cs.position)) {
				// compensate for margin on <body>, see #16148
				top -= cs.marginTop;
				side -= cs.marginLeft;
			}
		} else {
			var bcr = place.position(ancestor);
			top -= bcr.y + parseFloat(cs.borderTopWidth) - ancestor.scrollTop;
			side -= bcr.x + parseFloat(cs.borderLeftWidth) - ancestor.scrollLeft;
		}

		if (style.top !== top + "px" || style.left !== side + "px" || style.right !== "auto") {
			style.top = top + "px";
			style.left = side + "px";
			style.right = "auto";	// needed for FF or else tooltip goes to far left
		}

		return best;
	}

	var reverse = {
		// Map from corner to kitty-corner
		TL: "BR",
		TR: "BL",
		BL: "TR",
		BR: "TL"
	};

	var place = /** @lends module:delite/place */ {

		// TODO: it's weird that padding is specified as x/y rather than h/w.

		/**
		 * Positions node kitty-corner to the rectangle centered at (pos.x, pos.y) with width and height of
		 * padding.x * 2 and padding.y * 2, or zero if padding not specified.  Picks first corner in
		 * corners[] where node is fully visible, or the corner where it's most visible.
		 *
		 * Node is assumed to be absolutely or relatively positioned.
		 *
		 * @param {Element} node - The popup node to be positioned.
		 * @param {module:delite/place.Position} pos - The point (or if padding specified, rectangle) to place
		 * the node kitty-corner to.
		 * @param {string[]} corners - Array of strings representing order to try corners of the node in,
		 * like `["TR", "BL"]`.  Possible values are:
		 * - "BL" - bottom left
		 * - "BR" - bottom right
		 * - "TL" - top left
		 * - "TR" - top right
		 * @param {module:delite/place.Position} [padding] - Optional param to set padding, to put some buffer
		 * around the element you want to position.  Defaults to zero.
		 * @returns {module:delite/place.ChosenPosition} Position node was placed at.
		 * @example
		 * // Try to place node's top right corner at (10,20).
		 * // If that makes node go (partially) off screen, then try placing
		 * // bottom left corner at (10,20).
		 * place.at(node, {x: 10, y: 20}, ["TR", "BL"])
		 */
		at: function (node, pos, corners, padding) {
			// Set position:absolute first since it affects the width.
			if (node.style.position !== "absolute") {
				node.style.position = "absolute";
			}

			var choices = corners.map(function (corner) {
				var c = {
					corner: corner,
					aroundCorner: reverse[corner],	// so TooltipDialog.orient() gets aroundCorner argument set
					pos: {x: pos.x, y: pos.y}
				};
				if (padding) {
					c.pos.x += corner.charAt(1) === "L" ? padding.x : -padding.x;
					c.pos.y += corner.charAt(0) === "T" ? padding.y : -padding.y;
				}
				return c;
			});

			return _placeAt(node, choices);
		},

		/**
		 * Position node adjacent to anchor such that it's fully visible in viewport.
		 * Adjacent means that one side of the anchor is flush with one side of the node.
		 * @param {Element} node - The popup node to be positioned.
		 * @param {Element|module:delite/place.Rectangle} anchor - Place node adjacent to this Element or rectangle.
		 * @param {string[]} positions - Ordered list of positions to try matching up.
		 * - before: places drop down to the left of the anchor node/widget, or to the right in the case
		 *   of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
		 *   with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
		 * - after: places drop down to the right of the anchor node/widget, or to the left in the case
		 *   of RTL scripts like Hebrew and Arabic; aligns either the top of the drop down
		 *   with the top of the anchor, or the bottom of the drop down with bottom of the anchor.
		 * - before-centered: centers drop down to the left of the anchor node/widget, or to the right
		 *   in the case of RTL scripts like Hebrew and Arabic
		 * - after-centered: centers drop down to the right of the anchor node/widget, or to the left
		 *   in the case of RTL scripts like Hebrew and Arabic
		 * - above-centered: drop down is centered above anchor node
		 * - above: drop down goes above anchor node, left sides aligned
		 * - above-alt: drop down goes above anchor node, right sides aligned
		 * - below-centered: drop down is centered above anchor node
		 * - below: drop down goes below anchor node
		 * - below-alt: drop down goes below anchor node, right sides aligned
		 * @param {boolean} leftToRight - True if widget is LTR, false if widget is RTL.
		 * Affects the behavior of "above" and "below" positions slightly.
		 * @returns {module:delite/place.ChosenPosition} Position node was placed at.
		 * @example
		 * // Try to position node such that node's top-left corner is at the same position
		 * // as the bottom left corner of the aroundNode (ie, put node below
		 * // aroundNode, with left edges aligned).	If that fails try to put
		 * // the bottom-right corner of node where the top right corner of aroundNode is
		 * // (i.e., put node above aroundNode, with right edges aligned)
		 * place.around(node, aroundNode, {'BL':'TL', 'TR':'BR'});
		 */
		around: function (node, anchor, positions, leftToRight) {
			// First set popup to position:absolute, since it affects its width,
			// and also so we can correctly calculate the height of the aroundNode.
			if (node.style.position !== "absolute") {
				node.style.position = "absolute";
			}

			// If around is a DOMNode (or DOMNode id), convert to coordinates.
			var aroundNodePos;
			if (typeof anchor === "string" || "offsetWidth" in anchor || "ownerSVGElement" in anchor) {
				aroundNodePos = place.position(anchor);

				// For above and below dropdowns, subtract width of border so that popup and aroundNode borders
				// overlap, preventing a double-border effect.  Unfortunately, difficult to measure the border
				// width of either anchor or popup because in both cases the border may be on an inner node.
				if (/^(above|below)/.test(positions[0])) {
					var border = function (node2) {
						var cs = getComputedStyle(node2);
						return {
							t: parseFloat(cs.borderTopWidth),	// remove "px"
							b: parseFloat(cs.borderBottomWidth)	// remove "px"
						};
					};
					var anchorBorder = border(anchor),
						anchorChildBorder = anchor.firstElementChild ? border(anchor.firstElementChild) : {t: 0, b: 0},
						nodeBorder = border(node),
						nodeChildBorder = node.firstElementChild ? border(node.firstElementChild) : {t: 0, b: 0};
					aroundNodePos.y += Math.min(anchorBorder.t + anchorChildBorder.t,
						nodeBorder.t + nodeChildBorder.t);
					aroundNodePos.h -= Math.min(anchorBorder.t + anchorChildBorder.t,
						nodeBorder.t + nodeChildBorder.t) +
						Math.min(anchorBorder.b + anchorChildBorder.b, nodeBorder.b + nodeChildBorder.b);
				}
			} else {
				aroundNodePos = anchor;
			}

			// Compute position and size of visible part of anchor (it may be partially hidden by ancestor
			// nodes w/scrollbars)
			if (anchor.parentNode) {
				// ignore nodes between position:relative and position:absolute
				var sawPosAbsolute = getComputedStyle(anchor).position === "absolute";
				var parent = anchor.parentNode;
				// ignoring the body will help performance
				while (parent && parent.nodeType === 1 && parent.nodeName !== "BODY") {
					var parentPos = place.position(parent),
						pcs = getComputedStyle(parent);
					if (/^(relative|absolute|fixed)$/.test(pcs.position)) {
						sawPosAbsolute = false;
					}
					if (!sawPosAbsolute && /^(hidden|auto|scroll)$/.test(pcs.overflow)) {
						var bottomYCoord = Math.min(aroundNodePos.y + aroundNodePos.h, parentPos.y + parentPos.h);
						var rightXCoord = Math.min(aroundNodePos.x + aroundNodePos.w, parentPos.x + parentPos.w);
						aroundNodePos.x = Math.max(aroundNodePos.x, parentPos.x);
						aroundNodePos.y = Math.max(aroundNodePos.y, parentPos.y);
						aroundNodePos.h = bottomYCoord - aroundNodePos.y;
						aroundNodePos.w = rightXCoord - aroundNodePos.x;
					}
					if (pcs.position === "absolute") {
						sawPosAbsolute = true;
					}
					parent = parent.parentNode;
				}
			}

			var x = aroundNodePos.x,
				y = aroundNodePos.y,
				width = aroundNodePos.w,
				height = aroundNodePos.h;

			// Convert positions arguments into choices argument for _placeAt()
			var choices = [];

			function push (aroundCorner, corner) {
				choices.push({
					aroundCorner: aroundCorner,
					corner: corner,
					pos: {
						x: {
							L: x,
							R: x + width,
							M: x + (width >> 1)
						}[aroundCorner.charAt(1)],
						y: {
							T: y,
							B: y + height,
							M: y + (height >> 1)
						}[aroundCorner.charAt(0)]
					}
				});
			}

			// eslint-disable-next-line complexity
			positions.forEach(function (pos) {
				var ltr = leftToRight;
				switch (pos) {
				case "above-centered":
					push("TM", "BM");
					break;
				case "below-centered":
					push("BM", "TM");
					break;
				case "after-centered":
					ltr = !ltr;
					/* falls through */
				case "before-centered":
					push(ltr ? "ML" : "MR", ltr ? "MR" : "ML");
					break;
				case "after":
					ltr = !ltr;
					/* falls through */
				case "before":
					push(ltr ? "TL" : "TR", ltr ? "TR" : "TL");
					push(ltr ? "BL" : "BR", ltr ? "BR" : "BL");
					break;
				case "below-alt":
					ltr = !ltr;
					/* falls through */
				case "below":
					// first try to align left borders, next try to align right borders (or reverse for RTL mode)
					push(ltr ? "BL" : "BR", ltr ? "TL" : "TR");
					push(ltr ? "BR" : "BL", ltr ? "TR" : "TL");
					break;
				case "above-alt":
					ltr = !ltr;
					/* falls through */
				case "above":
					// first try to align left borders, next try to align right borders (or reverse for RTL mode)
					push(ltr ? "TL" : "TR", ltr ? "BL" : "BR");
					push(ltr ? "TR" : "TL", ltr ? "BR" : "BL");
					break;
				}
			});

			var position = _placeAt(node, choices);
			position.aroundNodePos = aroundNodePos;

			return position;
		},

		/**
		 * Centers the specified node, like a Dialog.
		 * Node must fit within viewport.
		 *
		 * Node is assumed to be absolutely or relatively positioned.
		 *
		 * @param {Element} node - The popup node to be positioned.
		 */
		center: function (node) {
			var view = Viewport.getEffectiveBox(),
				bb = node.getBoundingClientRect(),
				style = node.style;

			// Set position:fixed first since it affects the width.
			if (style.position !== "fixed") {
				style.position = "fixed";
			}

			// If neither node nor viewport has changed size, then just return, to avoid breaking momentum scrolling.
			if (style.top === view.t + (view.h - bb.height) / 2 + "px" &&
				style.left === view.l + (view.w - bb.width) / 2 + "px" &&
				style.right === "auto") {
				return;
			}

			// Move node off screen so we can get accurate size.
			// TODO: move this code [and RTL detect code] to separate methods, and leverage from popup.moveOffScreen()
			var rtl = (/^rtl$/i).test(node.dir || node.ownerDocument.body.dir ||
					node.ownerDocument.documentElement.dir);
			style.top = "-9999px";
			style[rtl ? "right" : "left"] = "-9999px";
			style[rtl ? "left" : "right"] = "auto";
			bb = node.getBoundingClientRect();

			// Then set position so node is centered.
			style.top = (view.h - bb.height) / 2 + "px";
			style.left = (view.w - bb.width) / 2 + "px";
			style.right = "auto";
		},

		/**
		 * Return node position relative to document (rather than to viewport).
		 * @param node
		 */
		position: function (node) {
			var bcr = node.getBoundingClientRect(),
				doc = node.ownerDocument,
				win = doc.defaultView;
			return {
				x: bcr.left + (win.pageXOffset || doc.documentElement.scrollLeft),
				y: bcr.top + (win.pageYOffset || doc.documentElement.scrollTop),
				h: bcr.height,
				w: bcr.width
			};
		}
	};

	return place;
});
