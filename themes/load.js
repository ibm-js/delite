define([
	"require",
	"dojo/has",
	"dojo/_base/config",
	"../css"		// listed here for benefit of builder, so dui/css is included into the layer
], function(req, has, config){

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

		[/Holodark|Android 3|Android 4/, "holodark"],
		[/Android/, "android"],
		[/BlackBerry|BB10/, "blackberry"],
		[/iPhone|iPad/, "ios"],
		[/MSIE 10|WindowsPhone/, "windows"],
		[/.*/, "desktop"]
	];

	// Get the theme
	var theme = config.theme || location.search.match(/theme=(\w+)/) ? RegExp.$1 : null;
	if(!theme){
		var ua = config.userAgent || (location.search.match(/ua=(\w+)/) ? RegExp.$1 : navigator.userAgent);
		for(var i = 0; i < themeMap.length; i++){
			if(themeMap[i][0].test(ua)){
				theme = themeMap[i][1];
				break;
			}
		}
	}

	function getPaths(/*String*/ widget){
		// summary:
		//		Given a widget, return an array of paths to the CSS files that need to be loaded for that widget.
		//		The files to be loaded will vary depending on the theme.
		//		Typically the array returned will contain one path, but it may contain more if we are loading RTL
		//		files or compatibility files.

		var base = widget.replace(/\.css$/, ""),
			suffix = /\.css$/.test(widget) ? ".css" : "",
			path = "./" + theme + "/" + base
		return has("dojo-bidi") ? [ path + suffix, path + "_rtl" + suffix ] : [ path + suffix];
	}

	return {
		// summary:
		//		CSS loading plugin for the widgets with themes in this directory.
		//		Loads the CSS file(s) for the specified widget for the current theme.
		//
		//		For example, on an iPhone, css!Button will load dui/themes/iphone/Button.css.
		//
		//		You can also pass an additional query parameter string:
		//		theme={theme widget} to force a specific theme through the browser
		//		URL input. The available theme ids are Claro, Android, Holodark (theme introduced in Android 3.0),
		//		BlackBerry, Custom, iPhone, and iPad. The theme names are case-sensitive. If the given
		//		widget does not match, the iPhone theme is used.
		//
		//	|	http://your.server.com/yourapp.html // automatic detection
		//	|	http://your.server.com/yourapp.html?theme=android // forces Android theme
		//	|	http://your.server.com/yourapp.html?theme=holodark // forces Holodark theme
		//	|	http://your.server.com/yourapp.html?theme=blackBerry // forces Blackberry theme
		//	|	http://your.server.com/yourapp.html?theme=custom // forces Custom theme
		//	|	http://your.server.com/yourapp.html?theme=ios // forces iPhone theme
		//
		//		To simulate a particular device from the application code, the user agent
		//		can be forced by setting dojoConfig.userAgent as follows:
		//
		//	|	<script src="dojox/mobile/deviceTheme.js" data-dojo-config="userAgent: 'Holodark'"></script>
		//	|	<script src="dojo/dojo.js" data-dojo-config="parseOnLoad: true"></script>
		//


		load: function(widget, require, onload){
			// summary:
			//		Load and install the specified CSS files for the given widget, then call onload().
			// widget: String
			//		Name of the widget.
			// require: Function
			//		AMD's require() method
			// onload: Function
			//		Callback function which will be called when the loading finishes
			//		and the stylesheet has been inserted.


			var paths = getPaths(widget),
				dependencies = paths.map(function(path){
					return "../css!" + path;
				});

			req(dependencies, function(){
				onload(arguments);
			});
		}
	};
});