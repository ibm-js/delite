define([
	"require",
	"dojo/has",
	"dojo/_base/config",
	"../css"		// listed here for benefit of builder, so dui/css is included into the layer
], function (req, has, config) {

	"use strict";

	var themeMap = config.themeMap || [
		// summary:
		//		A map of user-agents to theme files.
		// description:
		//		The first array element is a regexp pattern that matches the
		//		userAgent string.
		//
		//		The second array element is a theme folder widget.
		//
		//		The matching is performed in the array order, and stops after the
		//		first match.

		[/Holodark|Android/, "holodark"],
		[/BlackBerry|BB10/, "blackberry"],
		[/iPhone|iPad/, "ios"],
		[/.*/, "bootstrap"]			// chrome, firefox, IE
	];

	// Get the theme
	var theme = config.theme || location.search.match(/theme=(\w+)/) ? RegExp.$1 : null;
	if (!theme) {
		var ua = config.userAgent || (location.search.match(/ua=(\w+)/) ? RegExp.$1 : navigator.userAgent);
		for (var i = 0; i < themeMap.length; i++) {
			if (themeMap[i][0].test(ua)) {
				theme = themeMap[i][1];
				break;
			}
		}
	}

	function getPaths(/*String*/ logicalPath, /*String[]*/ ary) {
		// summary:
		//		Given a logical path, add the paths of the CSS files that need to be loaded into ary.
		//		The files to be loaded will vary depending on the theme.
		//		For example, if logicalPath == "./foo/bar", it will load "./foo/ios/bar" and "./foo/ios/bar_rtl".

		logicalPath.replace(/(.*\/)([^/\.]+)(.css|)/, function(
				all,
				logicalDir,		// path to directory containing themes subdirs (ios/ etc.)
				fnameBase,		// name of file w/out .css suffix or _rtl
				suffix			// .css if we are loading a text file, or "" if loading a javascript file
				){
			var firstPart = logicalDir + theme + "/" + fnameBase;	// the actual dir + base of file name

			ary.push(firstPart + suffix);
			if (has("dojo-bidi")) {
				ary.push(firstPart + "_rtl" + suffix);
			}
		});
	}

	return {
		// summary:
		//		Loads the specified CSS file(s) for the current theme and page direction.
		//
		//		For example, on an iPhone with an RTL locale, load!./themes/common,./Button/Button
		//		will load (in the following order):
		//
		//			- dui/themes/ios/common.css
		//			- dui/themes/ios/common_rtl.css
		//			- dui/Button/ios/Button.css
		//			- dui/Button/ios/Button_rtl.css.
		//
		//		In other words, the paths supplied to the plugin are "logical paths" that are expanded
		//		according to the page's theme and direction.
		//
		//		You can also pass an additional URL parameter string
		//		theme={theme widget} to force a specific theme through the browser
		//		URL input. The available theme ids are bootstrap, holodark (theme introduced in Android 3.0),
		//		blackberry, and bootstrap. The theme names are case-sensitive. If the given
		//		theme does not match, the bootstrap theme is used.
		//
		//	|	http://your.server.com/yourapp.html // automatic detection
		//	|	http://your.server.com/yourapp.html?theme=holodark // forces Holodark theme
		//	|	http://your.server.com/yourapp.html?theme=blackberry // forces Blackberry theme
		//	|	http://your.server.com/yourapp.html?theme=ios // forces iPhone theme
		//
		//		You can also specify a particular user agent through the ua=... URL parameter.

		normalize: function(logicalPaths, normalize){
			// summary:
			//		Convert relative paths to absolute ones.   By default only the first path (in the comma
			//		separated list) is converted.

			return logicalPaths.split(/, */).map(normalize).join(",");
		},

		load: function (logicalPaths, require, onload) {
			// summary:
			//		Load and install the specified CSS files for the given logicalPaths, then call onload().
			// logicalPaths: String
			//		Comma separated list of simplified paths.  They will be expanded to include the theme
			//		name, and to load the RTL versions of files too.
			// require: Function
			//		AMD's require() method
			// onload: Function
			//		Callback function which will be called when the loading finishes
			//		and the stylesheet has been inserted.


			// Convert list of logicalPaths (ex: common,Button) into arguments to CSS plugin
			// ex: ios/common, ios/common_rtl, ios/Button, ios/Button_rtl
			var actualPaths = [];
			logicalPaths.split(/, */).forEach(function (logicalPath) {
				getPaths(logicalPath, actualPaths);
			});

			// Make single call to css! plugin to load resources in order specified
			req([ "../css!" + actualPaths.join(",") ], function () {
				onload(arguments);
			});
		}
	};
});
