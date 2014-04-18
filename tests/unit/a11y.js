define([
	"intern!object",
	"intern/chai!assert",
	"delite/a11y",
	"dojo/sniff",
	"requirejs-text/text!../resources/a11y.html"
], function (registerSuite, assert, a11y, has, html) {
	var container;
	registerSuite({
		name: "a11y",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
			container.innerHTML = html;
		},
		"isTabNavigable": function () {
			assert.ok(a11y.isTabNavigable(document.getElementById("a-with-href")), "a-with-href");
			assert.ok(!a11y.isTabNavigable(document.getElementById("a-without-href")), "a-without-href");
			assert.ok(a11y.isTabNavigable(document.getElementById("area")), "area");
			assert.ok(a11y.isTabNavigable(document.getElementById("button")), "button");
			assert.ok(a11y.isTabNavigable(document.getElementById("input")), "input");
			assert.ok(a11y.isTabNavigable(document.getElementById("object")), "object");
			assert.ok(a11y.isTabNavigable(document.getElementById("select")), "select");
			assert.ok(a11y.isTabNavigable(document.getElementById("textarea")), "textarea");
			assert.ok(!a11y.isTabNavigable(document.getElementById("empty")), "empty");
			assert.ok(a11y.isTabNavigable(document.getElementById("zero-tabindex-div")), "zero-tabindex-div");
			assert.ok(!a11y.isTabNavigable(document.getElementById("no-tabindex-div")), "no-tabindex-div");
			assert.ok(!a11y.isTabNavigable(document.getElementById("iframe")), "iframe");
		},
		"findTabNullOnEmpty": function () {
			assert.equal(null, a11y.getFirstInTabbingOrder("empty"));
			assert.equal(null, a11y.getLastInTabbingOrder("empty"));
		},
		"findTabElements": function () {
			assert.equal(null, a11y.getFirstInTabbingOrder("div-container"));
			assert.equal(null, a11y.getFirstInTabbingOrder("a-without-href-container"));
			assert.strictEqual("a-with-href", a11y.getFirstInTabbingOrder("a-with-href-container").id);

			// in WebKit area elements are not in the tab order
			// and their display style property is "none";
			// therefore it is expected that this test will fail
			if (!has("webkit")) {
				assert.strictEqual("area", a11y.getFirstInTabbingOrder("area-map").id);
			}

			assert.strictEqual("button", a11y.getFirstInTabbingOrder("button-container").id);
			assert.strictEqual("input", a11y.getFirstInTabbingOrder("input-container").id);
			assert.strictEqual("object", a11y.getFirstInTabbingOrder("object-container").id);
			assert.strictEqual("select", a11y.getFirstInTabbingOrder("select-container").id);
			assert.strictEqual("textarea", a11y.getFirstInTabbingOrder("textarea-container").id);
			assert.equal(null, a11y.getLastInTabbingOrder("div-container"));
			assert.equal(null, a11y.getLastInTabbingOrder("a-without-href-container"));
			assert.strictEqual("a-with-href", a11y.getLastInTabbingOrder("a-with-href-container").id);

			// in WebKit area elements are not in the tab order
			// and their display style property is "none";
			// therefore it is expected that this test will fail
			if (!has("webkit")) {
				assert.strictEqual("area", a11y.getLastInTabbingOrder("area-map").id);
			}

			assert.strictEqual("button", a11y.getLastInTabbingOrder("button-container").id);
			assert.strictEqual("input", a11y.getLastInTabbingOrder("input-container").id);
			assert.strictEqual("object", a11y.getLastInTabbingOrder("object-container").id);
			assert.strictEqual("select", a11y.getLastInTabbingOrder("select-container").id);
			assert.strictEqual("textarea", a11y.getLastInTabbingOrder("textarea-container").id);
		},
		"findTabOnElementRatherThanString": function () {
			assert.strictEqual("a-with-href",
				a11y.getFirstInTabbingOrder(document.getElementById("a-with-href-container")).id);
			assert.strictEqual("a-with-href",
				a11y.getLastInTabbingOrder(document.getElementById("a-with-href-container")).id);
		},
		"findTabSkipDisabled": function () {
			assert.strictEqual("not-disabled-input", a11y.getFirstInTabbingOrder("skip-disabled").id);
			assert.strictEqual("not-disabled-input", a11y.getLastInTabbingOrder("skip-disabled").id);
		},
		"findTabZeroTabindex": function () {
			assert.strictEqual("zero-tabindex-div", a11y.getFirstInTabbingOrder("zero-tabindex-div-container").id);
			assert.strictEqual("zero-tabindex-input", a11y.getFirstInTabbingOrder("zero-tabindex-input-container").id);
			assert.strictEqual("zero-tabindex-div", a11y.getLastInTabbingOrder("zero-tabindex-div-container").id);
			assert.strictEqual("zero-tabindex-input", a11y.getLastInTabbingOrder("zero-tabindex-input-container").id);
		},
		"findTabPositiveTabindex": function () {
			assert.strictEqual("positive-tabindex-input1a",
				a11y.getFirstInTabbingOrder("positive-tabindex-mixed-with-no-tabindex").id);
			assert.strictEqual("positive-tabindex-input3a",
				a11y.getFirstInTabbingOrder("positive-tabindex").id);
			assert.strictEqual("no-tabindex-input2",
				a11y.getLastInTabbingOrder("positive-tabindex-mixed-with-no-tabindex").id);
			assert.strictEqual("positive-tabindex-input4b", a11y.getLastInTabbingOrder("positive-tabindex").id);
		},
		"findTabSkipMinusOneTabindex": function () {
			assert.strictEqual("not-minus-one-input", a11y.getFirstInTabbingOrder("skip-minus-one").id);
			assert.strictEqual("not-minus-one-input", a11y.getLastInTabbingOrder("skip-minus-one").id);
		},
		"findTabDescend": function () {
			assert.strictEqual("child-input1", a11y.getFirstInTabbingOrder("descend").id);
			assert.strictEqual("child-input2", a11y.getLastInTabbingOrder("descend").id);
		},
		"findTabOuterInner": function () {
			assert.strictEqual("outer1", a11y.getFirstInTabbingOrder("outer-inner-container").id);
			assert.strictEqual("inner2", a11y.getLastInTabbingOrder("outer-inner-container").id);
		},

		"skipNotShown": function () {
			assert.equal(null, a11y.getFirstInTabbingOrder("hidden-element-container"));
			assert.equal(null, a11y.getFirstInTabbingOrder("hidden-container-tabindex-zero"));
			assert.equal(null, a11y.getFirstInTabbingOrder("hidden-container-no-tabindex"));
			assert.equal(null, a11y.getFirstInTabbingOrder("container-with-hidden-containers"));

			assert.equal(null, a11y.getFirstInTabbingOrder("display-none-element-container"));
			assert.equal(null, a11y.getFirstInTabbingOrder("display-none-container-tabindex-zero"));
			assert.equal(null, a11y.getFirstInTabbingOrder("display-none-container-no-tabindex"));
			assert.equal(null, a11y.getFirstInTabbingOrder("container-with-display-none-containers"));
		},
		"multiDigitTabIndex": function () {
			assert.strictEqual("one", a11y.getFirstInTabbingOrder("multiDigitTabIndex").name, "first");
			assert.strictEqual("eleven", a11y.getLastInTabbingOrder("multiDigitTabIndex").name, "last");
		},
		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
