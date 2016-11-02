define([
	"intern!object",
	"intern/chai!assert",
	"delite/place",
	"delite/Viewport"
], function (registerSuite, assert, place, Viewport) {

	var aroundTop,
		aroundBottom,
		aroundLeft,
		aroundRight,
		popup;

	function toTheLeftOrRight(anchor) {
		var textboxPos = anchor.getBoundingClientRect(),
			popupContainerPos = popup.getBoundingClientRect();

		var xDiff = textboxPos.left - popupContainerPos.left - popupContainerPos.width;
		var toTheLeft = xDiff >= -1 && xDiff < 2;

		xDiff = popupContainerPos.left - textboxPos.left - textboxPos.width;
		var toTheRight = xDiff >= -1 && xDiff < 2;

		assert(toTheLeft || toTheRight, "The popup was not to the left or right");
	}

	function scrollTo(y) {
		window.scrollTo(0, y);
	}

	registerSuite({
		name: "place",

		setup: function () {
			popup = document.createElement("div");
			popup.style.cssText = "position: absolute; width: 75px; background: blue; color: white;";
			popup.innerHTML = "I'm a drop down, wider and taller than the around nodes I'm placed next to.";
			document.body.appendChild(popup);
		},

		at: {
			atTL: function () {
				// Place popup at (10,7)... place.at() should choose the top-left corner, because
				// any of the other corner would make the popup go partially off the screen
				scrollTo(0);
				var ret = place.at(popup, {x: 10, y: 7}, ["TR", "BR", "BL", "TL"]);

				assert.strictEqual(ret.corner, "TL", "top left corner chosen");
				assert.strictEqual(popup.style.left, "10px", "x coord");
				assert.strictEqual(popup.style.top, "7px", "y coord, page scroll is " + window.pageYOffset);
				assert.strictEqual(ret.w, 75, "it's 75px wide");
			},

			atTR: function () {
				// Place popup at top right... place.at() should choose the top-right corner, because
				// any of the other corner would make the popup go partially off the screen
				scrollTo(0);
				var viewport = Viewport.getEffectiveBox(),
					ret = place.at(popup, {x: viewport.w - 10, y: 7}, ["TL", "BR", "TR", "BL"]),
					popupCoords = popup.getBoundingClientRect();

				assert.strictEqual(ret.corner, "TR", "top left corner chosen");
				assert.strictEqual(popupCoords.left + popupCoords.width, viewport.w - 10, "x coord");
				assert.strictEqual(popup.style.top, "7px", "y coord, window scroll is " + window.pageYOffset);
				assert.strictEqual(ret.w, 75, "it's 75px wide");
			}
		},

		around: {
			setup: function () {
				// These around nodes are meant to be used with the document scrolled down 100px
				aroundTop = document.createElement("div");
				aroundTop.style.cssText =
					"position: absolute; width: 20px; height: 20px; background: yellow; top: 100px; left: 50%;";
				document.body.appendChild(aroundTop);

				var viewport = Viewport.getEffectiveBox();
				aroundBottom = document.createElement("div");
				aroundBottom.style.cssText =
					"position: absolute; width: 20px; height: 20px; background: yellow; left: 50%; top: " +
					(viewport.h + 80) + "px";
				document.body.appendChild(aroundBottom);

				aroundLeft = document.createElement("div");
				aroundLeft.style.cssText =
					"position: absolute; width: 20px; height: 20px; background: yellow; top: 350px; left: 0;";
				document.body.appendChild(aroundLeft);

				aroundRight = document.createElement("div");
				aroundRight.style.cssText =
					"position: absolute; width: 20px; height: 20px; background: yellow; top: 350px; right: 1px;";
				document.body.appendChild(aroundRight);
			},

			aroundT: function () {
				// Dropdown from "aroundTop" node. Should pick the second choice, since the first
				// goes off screen.

				scrollTo(100);

				var ret = place.around(popup, aroundTop, [
					"above",	// aroundTop's top-left corner with the popup's bottom-left corner (fails)
					"below",	// aroundTop's bottom-left corner with the popup's top-left corner (works)
					"below-alt"	// aroundTop's bottom-right corner with the popup's top-right corner (works)
				], true);

				assert.strictEqual(ret.aroundCorner, "BL", "around corner, window.pageYOffset = " + window.pageYOffset);
				assert.strictEqual(ret.corner, "TL", "popup's corner");
				assert.strictEqual(Math.round(popup.style.top.replace("px", "")), 120, "underneath around node");
				assert.strictEqual(Math.round(popup.style.left.replace("px", "")),
						Math.round(aroundTop.getBoundingClientRect().left), "left sides aligned");
			},

			aroundB: function () {
				// Dropdown from "aroundBottom" node. Should go above aroundNode so that
				// popup doesn't go off screen.
				scrollTo(100);
				var ret = place.around(popup, aroundBottom, [
					"below",	// aroundBottom's bottom-left corner with the popup's top-left corner (fails)
					"above",	// aroundBottom's top-left corner with the popup's bottom-left corner (works)
					"below-alt"	// aroundBottom's bottom-right corner with the popup's top-right corner (fails)
				], true);

				assert.strictEqual(ret.aroundCorner, "TL", "around corner");
				assert.strictEqual(ret.corner, "BL", "popup's corner");

				var aroundPos = aroundBottom.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(aroundPos.top), Math.round(popupPos.bottom), "above around node");
			},

			aroundBM: function () {
				// bottom middle popup from "aroundBottom" node
				scrollTo(100);
				var ret = place.around(popup, aroundBottom, [
					"above-centered",	// aroundBottom's top-middle with the popup's bottom-middle (works)
					"below-centered"	// aroundBottom's bottom-middle with the popup's top-middle (fails)
				], true);

				assert.strictEqual(ret.aroundCorner, "TM", "around middle");
				assert.strictEqual(ret.corner, "BM", "popup's middle");

				var aroundPos = aroundBottom.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(popupPos.bottom), Math.round(aroundPos.top), "above around node");
				assert(aroundPos.left > popupPos.left, "starts before around node");
				assert(aroundPos.left < popupPos.right, "ends after around node");
			},

			aroundTM: function () {
				// top middle popup from "aroundTop" node
				scrollTo(100);
				var ret = place.around(popup, aroundTop, [
					"above-centered",	// aroundTop's top-middle with the popup's bottom-middle (fails)
					"below-centered"	// aroundTop's bottom-middle with the popup's top-middle (works)
				], true);

				assert.strictEqual(ret.aroundCorner, "BM", "around middle");
				assert.strictEqual(ret.corner, "TM", "popup's middle");

				var aroundPos = aroundTop.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(popupPos.top), Math.round(aroundPos.bottom), "below around node");
				assert(aroundPos.left > popupPos.left, "starts before around node");
				assert(aroundPos.left < (popupPos.right), "ends after around node");
			},

			aroundML: function () {
				// middle left popup from "aroundLeft" node
				scrollTo(100);
				var ret = place.around(popup, aroundLeft, [
					"after-centered",	// aroundLeft's middle-right with the popup's middle-left (works)
					"before-centered"	// aroundLeft's middle-left with the popup's middle-right (fails)
				], true);

				assert.strictEqual(ret.aroundCorner, "MR", "around middle");
				assert.strictEqual(ret.corner, "ML", "popup's middle");

				var aroundPos = aroundLeft.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(popupPos.left), Math.round(aroundPos.right), "after around node");
				assert(aroundPos.top > popupPos.top, "starts before around node");
				assert(aroundPos.top < popupPos.bottom, "ends after around node");
			},

			aroundMR: function () {
				// middle left popup from "aroundRight" node
				scrollTo(100);
				var ret = place.around(popup, aroundRight, [
					"after-centered",	// aroundRight's middle-right with the popup's middle-left (fails)
					"before-centered"	// aroundRight's middle-left with the popup's middle-right (works)
				], true);

				assert.strictEqual(ret.aroundCorner, "ML", "around middle");
				assert.strictEqual(ret.corner, "MR", "popup's middle");

				var aroundPos = aroundRight.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(aroundPos.left), Math.round(popupPos.right), "before around node");
				assert(aroundPos.top > popupPos.top, "starts before around node");
				assert(aroundPos.top < popupPos.bottom, "ends after around node");
			},

			aroundMLB: function () {
				// This will put the drop-down below the "aroundLeft" node, first trying to right-align
				// but since that doesn't work then trying to left-align.
				scrollTo(100);
				var ret = place.around(popup, aroundLeft, ["below-alt"], true);

				assert.strictEqual(ret.aroundCorner, "BL", "around left");
				assert.strictEqual(ret.corner, "TL", "popup's left");

				var aroundPos = aroundLeft.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(popupPos.top), Math.round(aroundPos.bottom), "below around node");
				assert.strictEqual(popupPos.left, aroundPos.left, "left aligned with around node");
			},

			aroundMRT: function () {
				// This will put the drop-down above the "aroundRight" node, first trying to left-align
				// but since that doesn't work then trying to right-align.
				scrollTo(100);
				var ret = place.around(popup, aroundRight, ["above"], true);

				assert.strictEqual(ret.aroundCorner, "TR", "around right");
				assert.strictEqual(ret.corner, "BR", "popup's right");

				var aroundPos = aroundRight.getBoundingClientRect(),
					popupPos = popup.getBoundingClientRect();
				assert.strictEqual(Math.round(aroundPos.right), Math.round(popupPos.right),
					"right aligned with around node");
				assert.strictEqual(Math.round(aroundPos.top), Math.round(popupPos.bottom),
					"above around node");
			},

			svgAnchor: function () {
				document.body.insertAdjacentHTML("beforeend",
						"<div id='svgWrapper' style='position: relative; top: 100px; left: 100px;'>" +
						"<svg xmlns='http://www.w3.org/2000/svg' version='1.1'>" +
						"<rect id='theRectangle' width='300' height='100' " +
						"style='fill:rgb(0,0,255);stroke-width:1;stroke:rgb(0,0,0)' />" +
						"</svg>" +
						"</div>"
				);

				var theRectangle = document.getElementById("theRectangle");
				scrollTo(0);
				place.around(popup, theRectangle, ["before", "after"], true);
				toTheLeftOrRight(theRectangle);
				document.body.removeChild(document.getElementById("svgWrapper"));
			},

			teardown: function () {
				[aroundTop, aroundBottom, aroundLeft, aroundRight].forEach(function (node) {
					document.body.removeChild(node);
				});
			}
		},

		center: function () {
			scrollTo(0);
			place.center(popup);

			var viewport = Viewport.getEffectiveBox(),
				popupCoords = popup.getBoundingClientRect();

			assert(Math.abs(viewport.h / 2 - popupCoords.top - popupCoords.height / 2) < 1, "centered vertically");
			assert(Math.abs(viewport.w / 2 - popupCoords.left - popupCoords.width / 2) < 1, "centered horizontally");
		},

		teardown: function () {
			document.body.removeChild(popup);
		}
	});
});

