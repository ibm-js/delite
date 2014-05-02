define([
	"intern!object",
	"intern/chai!assert",
	"delite/sniff"
], function (registerSuite, assert, has) {
	registerSuite({
		name: "sniff",
		sniff: function () {
			assert(has("chrome") || has("safari") || has("ff") || has("ie") || has("ios") || has("android"),
				"one browser's flag is set");
		}
	});
});

