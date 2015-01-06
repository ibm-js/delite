define([
	"doh/main",
	"require"
], function (doh, require) {

	// Utility methods (previously in delite/_base)
	// doh.register("focus", require.toUrl("./activationTracker.html"), 999999); // not working, refs old dijit widgets
	doh.register("place-margin", require.toUrl("./place-margin.html"), 999999);
	doh.register("place-clip", require.toUrl("./place-clip.html"), 999999);

	// comment out until converted to webdriver test
	// doh.register("robot.BgIframe", require.toUrl("./robot/BgIframe.html"), 999999);
});
