define([
	"intern!object",
	"intern/chai!assert",
	"delite/uacss"
], function (registerSuite, assert, has) {
	registerSuite({
		name: "uacss",

		uacss: function () {
			if (has("edge")) {
				assert(/d-edge/.test(document.body.className), "edge");
			}
			if (has("ie")) {
				assert(/d-ie/.test(document.body.className), "ie");
				assert(/d-ie-[1-9]/.test(document.body.className), "ie version");
			}
			if (has("chrome")) {
				assert(/d-chrome/.test(document.body.className), "chrome");
			}
			if (has("safari")) {
				assert(/d-safari/.test(document.body.className), "safari");
			}
			if (has("ff")) {
				assert(/d-ff/.test(document.body.className), "firefox");
			}
			if (has("ios")) {
				assert(/d-ios/.test(document.body.className), "ios");
			}
			if (has("android")) {
				assert(/d-android/.test(document.body.className), "android");
			}
		}
	});
});

