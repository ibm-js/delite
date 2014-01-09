define([
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-geometry",
	"dojo/dom-class"
], function (registerSuite, assert, domGeom, domClass) {

	// This object is shared by ScrollableContainer tests.

	return {
		"Default CSS" : function () {
			var w = document.getElementById("sc1");
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable

			w = document.getElementById("sc2"); // with scrollDirection == "none"
			assert.equal(w.scrollDirection, "none", "wrong scroll direction for sc2!");
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			// when scrollDirection is "none", this CSS class should NOT be present:
			assert.isFalse(domClass.contains(w, "d-scrollable"));

			w = document.getElementById("mysc1");
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable
		},

		"CSS class dependency on scrollDirection" : function () {
			var w = document.getElementById("sc1");
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable

			w.scrollDirection = "none";
			w.validateRendering(); // scrollDirection is an invalidating property
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			// when scrollDirection is "none", this CSS class should NOT be present:
			assert.isFalse(domClass.contains(w, "d-scrollable"));

			w.scrollDirection = "vertical"; // set back to "vertical"
			w.validateRendering();
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable

			w.scrollDirection = "horizontal"; // same for "horizontal"
			w.validateRendering();
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable

			w.scrollDirection = "both"; // same for "both"
			w.validateRendering();
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			assert.isTrue(domClass.contains(w, "d-scrollable")); // via the mixin delite/Scrollable

			w.scrollDirection = "none"; // and none again
			w.validateRendering();
			assert.isTrue(domClass.contains(w, "test-scrollable-container"));
			// when scrollDirection is "none", this CSS class should NOT be present:
			assert.isFalse(domClass.contains(w, "d-scrollable"));
		},

		"scrollableNode" : function () {
			var w = document.getElementById("sc1");
			assert.isTrue(w.scrollableNode === w);
		},

		"scrollTop/scrollLeft" : function () {
			var w = document.getElementById("sc1");
			w.scrollDirection = "both";
			w.validateRendering();
			assert.equal(w.scrollableNode.scrollTop, 0, "scrollTop");
			assert.equal(w.scrollableNode.scrollLeft, 0, "scrollLeft");
		},

		"scrollBy" : function () {
			var w = document.getElementById("sc1");
			var d = this.async(1000);
			w.scrollDirection = "both";
			w.validateRendering();
			w.scrollBy({x: 10});
			assert.equal(w.scrollableNode.scrollLeft, 10, "scrollLeft");
			assert.equal(w.scrollableNode.scrollTop, 0, "scrollTop");
			w.scrollBy({y: 10});
			assert.equal(w.scrollableNode.scrollLeft, 10, "scrollLeft");
			assert.equal(w.scrollableNode.scrollTop, 10, "scrollTop");
			w.scrollBy({x: 10, y: 10});
			assert.equal(w.scrollableNode.scrollLeft, 20, "scrollLeft");
			assert.equal(w.scrollableNode.scrollTop, 20, "scrollTop");
			
			// Now with animation:
			w.scrollBy({x: 10, y: 10}, 100/*duration*/);
			setTimeout(d.callback(function () {
				assert.equal(w.scrollableNode.scrollLeft, 30, "scrollLeft");
				assert.equal(w.scrollableNode.scrollTop, 30, "scrollTop");
				
				w.scrollBy({x: 10, y: 10}, 0/*duration*/);
				// when the duration is 0, no animation, thus no need to test asynchronously
				assert.equal(w.scrollableNode.scrollLeft, 40, "scrollLeft");
				assert.equal(w.scrollableNode.scrollTop, 40, "scrollTop");
			}), 1000);
			
			return d;
		},

		"scrollTo" : function () {
			var w = document.getElementById("sc1");
			var d = this.async(1000);
			w.scrollDirection = "both";
			w.validateRendering();
			w.scrollTo({x: 10});
			assert.equal(w.scrollableNode.scrollLeft, 10, "scrollLeft");
			w.scrollTo({y: 10});
			assert.equal(w.scrollableNode.scrollTop, 10, "scrollTop");
			w.scrollTo({x: 20, y: 20});
			assert.equal(w.scrollableNode.scrollLeft, 20, "scrollLeft");
			assert.equal(w.scrollableNode.scrollTop, 20, "scrollTop");
			
			// Now with animation:
			w.scrollTo({x: 30, y: 30}, 100/*duration*/);
			setTimeout(d.callback(function () {
				assert.equal(w.scrollableNode.scrollLeft, 30, "scrollLeft");
				assert.equal(w.scrollableNode.scrollTop, 30, "scrollTop");
				
				w.scrollTo({x: 40, y: 40}, 0/*duration*/);
				// when the duration is 0, no animation, thus no need to test asynchronously
				assert.equal(w.scrollableNode.scrollLeft, 40, "scrollLeft");
				assert.equal(w.scrollableNode.scrollTop, 40, "scrollTop");
			}), 1000);
			
			return d;
		},

		"getCurrentScroll" : function () {
			var w = document.getElementById("sc1");
			var pos = {x: 10, y: 10};
			w.scrollDirection = "both";
			w.validateRendering();
			w.scrollTo(pos);
			assert.deepEqual(w.getCurrentScroll(), pos);
		},

		"isTop/Bottom/Left/RightScroll" : function () {
			var w = document.getElementById("sc1");
			var wContent = document.getElementById("sc1content");
			var pos = {x: 10, y: 10};
			var box = domGeom.getMarginBox(wContent);
			var width = box.w;
			var height = box.h;
			w.scrollDirection = "both";
			w.validateRendering();
			w.scrollTo(pos);
			assert.isFalse(w.isTopScroll());
			assert.isFalse(w.isBottomScroll());
			assert.isFalse(w.isRightScroll());
			assert.isFalse(w.isLeftScroll());

			pos = {x: 0, y: 10};
			w.scrollTo(pos);
			assert.isFalse(w.isTopScroll());
			assert.isFalse(w.isBottomScroll());
			assert.isFalse(w.isRightScroll());
			assert.isTrue(w.isLeftScroll());

			pos = {x: 10, y: 0};
			w.scrollTo(pos);
			assert.isTrue(w.isTopScroll());
			assert.isFalse(w.isBottomScroll());
			assert.isFalse(w.isRightScroll());
			assert.isFalse(w.isLeftScroll());

			pos = {x: width, y: 10};
			w.scrollTo(pos);
			assert.isFalse(w.isTopScroll());
			assert.isFalse(w.isBottomScroll());
			assert.isTrue(w.isRightScroll());
			assert.isFalse(w.isLeftScroll());

			pos = {x: 10, y: height};
			w.scrollTo(pos);
			assert.isFalse(w.isTopScroll());
			assert.isTrue(w.isBottomScroll());
			assert.isFalse(w.isRightScroll());
			assert.isFalse(w.isLeftScroll());

			pos = {x: 0, y: 0};
			w.scrollTo(pos);
			assert.isTrue(w.isTopScroll());
			assert.isFalse(w.isBottomScroll());
			assert.isFalse(w.isRightScroll());
			assert.isTrue(w.isLeftScroll());
		}
	};
});
