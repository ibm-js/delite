define(["intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "KeyNav functional tests",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./KeyNavTests.html"))
				.waitForCondition("ready", 10000);
		},

		"inter widget tab navigation": function () {
			if (/safari|iPhone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			return this.remote.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "autofocusInput", "initial element");
					})
				.keys("\uE004") // tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "one", "tab to one");
					})
				.keys("\uE008\uE004") // shift tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "autofocusInput", "shift tab back to autofocusInput");
					})
				.keys("\uE008") // release shift
				.keys("\uE004") // tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "one", "tab to one again");
					})
				.keys("\uE004") // tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "emptyContainer", "tab to emptyContainer");
					})
				.keys("\uE008\uE004") // shift tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "one", "shift tab to one");
					})
				.keys("\uE008") // release shift
				.keys("\uE004") // tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "emptyContainer", "tab to emptyContainer again");
					});
		},
		"intra widget arrow navigation": function () {
			if (/safari|iPhone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			return this.remote.execute("autofocusInput.focus();")
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "autofocusInput", "start on autofocusInput");
					})
				.keys("\uE004") // tab
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "one", "tabbed to one");
					})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "two", "arrowed to two");
					})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "three", "arrowed to three");
					})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "four", "arrowed to four");
					})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "five", "arrowed to five");
					})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "five", "still on five");
					})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "four", "back to four");
					})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal(value, "three", "back to three");
					})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal("two", value, "back to two");
					})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal("one", value, "back to one");
					})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.id")
					.then(function (value) {
						assert.equal("one", value, "still on one");
					});
		}
	});
});