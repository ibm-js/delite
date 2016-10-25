define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "HasDropDown \"open on hover\" functional tests",

		setup: function () {
			var environmentType = this.remote.environmentType;
			if (environmentType.platformName === "iOS" || environmentType.browserName === "android") {
				return this.skip("no hover on mobile devices");
			}
			return this.remote
				.get(require.toUrl("./HasDropDownHover.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		basic: {
			"simple open and close": function () {
				return this.remote
					.findById("fileMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("fileMenu").isDisplayed().then(function (visible) {
						assert(visible, "file menu visible");
					}).end()
					.findById("editMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("fileMenu").isDisplayed().then(function (visible) {
						assert(!visible, "file menu hidden");
					}).end()
					.findById("editMenu").isDisplayed().then(function (visible) {
						assert(visible, "edit menu visible");
					}).end()
					.findById("header").moveMouseTo().end()
					.sleep(500)
					.findById("editMenu").isDisplayed().then(function (visible) {
						assert(!visible, "edit menu hidden");
					}).end();
			},

			"nested open and close": function () {
				return this.remote
					.findById("fileMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("fileMenu").isDisplayed().then(function (visible) {
						assert(visible, "file menu visible");
					}).end()
					.findById("recentsMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("recentsMenu").isDisplayed().then(function (visible) {
						assert(visible, "recents menu shown");
					}).end()
					.findById("favoritesMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("recentsMenu").isDisplayed().then(function (visible) {
						assert(!visible, "recents menu hidden");
					}).end()
					.findById("favoritesMenu").isDisplayed().then(function (visible) {
						assert(visible, "favorites menu shown");
					}).end()
					.findById("fileMenuItem").moveMouseTo().end()
					.sleep(500)
					.findById("favoritesMenu").isDisplayed().then(function (visible) {
						assert(!visible, "favorites menu hidden");
					}).end()
					.findById("fileMenu").isDisplayed().then(function (visible) {
						assert(visible, "file menu still visible");
					}).end()
					.findById("header").moveMouseTo().end()
					.sleep(500)
					.findById("fileMenu").isDisplayed().then(function (visible) {
						assert(!visible, "file menu hidden");
					}).end();
			}
		}
	});
});
