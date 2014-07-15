define(["intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "tabIndex functional tests",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./TabIndex.html"))
				.waitForCondition("ready", 40000);
		},

		"default tab indices": function () {
			this.timeout = 120000;
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			return this.remote.elementById("d1").click()		// start on first element, before widgets
				.execute("return document.activeElement.id").then(function (value) {
					// start focus on the node before the two widgets
					assert.strictEqual(value, "d1");
				})
				.keys("\uE004")	// tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "d2");
				})
				.keys("\uE004") // tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "d3");
				})
				.keys("\uE004") // tab
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "d4");
				});
		},

		"specified tab indices": function () {
			this.timeout = 120000;
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			return this.remote.elementById("s1").click()		// start on first element, before widgets
				.execute("return document.activeElement.id").then(function (value) {
					// start focus on the node before the two widgets
					assert.strictEqual(value, "s1");
				})
				.keys("\uE004")	// tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "s2");
				})
				.keys("\uE004")	// tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// focused on <span> inside of widget
					assert.strictEqual(value, "s3");
				})
				.keys("\uE004")	// tab
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "s4");
				});
		},

		"changed tab indices": function () {
			this.timeout = 120000;
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			return this.remote.elementById("button").click()	// click button to change tab indices
				.execute("document.getElementById('button').focus();")	// needed on chrome for some reason
				.keys("\uE004")	// tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// should have tabbed back to <span> inside first widget, which now has tabIndex=5
					assert.strictEqual(value, "s2");
				})
				.execute("return document.activeElement.innerHTML").then(function (value) {
					// making sure that observe() worked
					assert.strictEqual(value, "widget, tabindex=1, updated to 5");
				})
				.keys("\uE004")	// tab
				.execute("return document.activeElement.parentNode.id").then(function (value) {
					// should have tabbed back to <span> inside second widget, which now has tabIndex=6
					assert.strictEqual(value, "s3");
				});
		}
	});
});