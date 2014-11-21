/**
 * Plugin to load the specified CSS file, substituting {{theme}} with the theme for the current page.
 * This plugin will also load the common css file for the theme, `delite/themes/{{theme}}/common.css`,
 * even if no resource is provided (like in `delite/theme!`).
 *
 * For example, on an iPhone `theme!./css/{{theme}}/Button.css`
 * will load `./css/ios/Button.css` and `delite/themes/ios/common.css`.
 *
 * You can also pass an additional URL parameter string
 * `theme={theme widget}` to force a specific theme through the browser
 * URL input. The available theme ids are bootstrap, holodark (theme introduced in Android 3.0)
 * and ios. The theme names are case-sensitive. If the given
 * theme does not match, the bootstrap theme is used.
 *
 * ```
 * http://your.server.com/yourapp.html --> automatic detection
 * http://your.server.com/yourapp.html?theme=holodark --> forces Holodark theme
 * http://your.server.com/yourapp.html?theme=ios --> forces iPhone theme
 * ```
 *
 * You can also specify a particular user agent through the `ua=...` URL parameter.
 *  @module delite/theme
 */
define([
	"require",
	"requirejs-dplugins/has",
	"module",
	"requirejs-dplugins/css"
], function (req, has, module, css) {

	"use strict";

	var config = module.config();

	var load = /** @lends module:delite/theme */ {
		/**
		 * A map of user-agents to theme files.
		 *
		 * The first array element is a regexp pattern that matches the userAgent string.
		 * The second array element is a theme folder widget.
		 * The matching is performed in the array order, and stops after the first match.
		 *
		 * Can be overridden by a module-level configuration setting passed to AMD loader:
		 *
		 * ```js
		 * require.config({
		 *     config: {
		 *         "delite/theme": {
		 *             themeMap: ...
		 *         }
		 *     }
		 * });
		 * ```
		 * @member {Array}
		 * @default [[/Holodark|Android/, "holodark"], [/iPhone/iPad/, "ios"], [/.*\/, "bootstrap"]]
		 */
		themeMap: config.themeMap || [
			// Temporarily comment out until more widgets support them
			// [/Holodark|Android/, "holodark"],
			// [/iPhone|iPad/, "ios"],
			[/.*/, "bootstrap"]			// chrome, firefox, IE
		],

		/**
		 * Compute the theme name, according to browser and this.themeMap.
		 * @private
		 */
		getTheme: function () {
			var theme = load.theme || config.theme;
			if (!theme) {
				var matches = location.search.match(/theme=(\w+)/);
				theme = matches && matches.length > 1 ? matches[1] : null;
			}
			if (!theme) {
				var ua = config.userAgent || (location.search.match(/ua=(\w+)/) ? RegExp.$1 : navigator.userAgent),
					themeMap = this.themeMap;
				for (var i = 0; i < themeMap.length; i++) {
					if (themeMap[i][0].test(ua)) {
						theme = themeMap[i][1];
						break;
					}
				}
			}
			load.theme = theme;
			return theme;
		},

		/**
		 * Load and install the specified CSS file for the given path, then call onload().
		 * @param {string} path - Simplified path. It will be expanded to convert {{theme}} to the current theme.
		 * @param {Function} require - AMD's require() method.
		 * @param {Function} onload - Callback function which will be called when the loading finishes
		 * and the stylesheet has been inserted.
		 * @private
		 */
		load: function (path, require, onload) {
			// Update config to be sure to get latest value.
			config = module.config();

			// Add CSS file which contains definitions common to the theme.
			// Use absolute MID (rather than relative MID) for benefit of builder, and since the MID specified
			// in path has already been converted to an absolute MID.
			var commonCss = module.id.replace(/\/.*/, "") + "/themes/{{theme}}/common.css";
			var resources = path ? [commonCss, path] : [commonCss];

			if (has("builder")) {
				resources.forEach(function (path) {
					css.buildFunctions.addOnce(loadList, path);
				});
				onload();
				return;
			}

			// Replace single css bundles by corresponding layer.
			if (config.layersMap) {
				resources = resources.map(function (path) {
					return config.layersMap[path] || path;
				});
			}

			// Convert list of logical resources into list of dependencies.
			// ex: Button/css/{{theme}}/Button.css --> requirejs-dplugins/css!Button/css/ios/Button.css
			var deps = resources.map(function (path) {
				return css.id + "!" + path.replace(/{{theme}}/, load.getTheme());
			});

			// Call css! plugin to insert the stylesheets.
			req(deps, function () {
				onload(arguments);
			});
		}
	};

	if (has("builder")) {
		var loadList = [];
		var writePluginFiles;

		load.writeFile = function (pluginName, resource, require, write) {
			writePluginFiles = write;
		};

		load.onLayerEnd = function (write, data) {
			function getLayerPath(theme) {
				var pathRE = /^(?:\.\/)?(([^\/]*\/)*)[^\/]*$/;
				return data.path.replace(pathRE, "$1themes/layer_" + (theme || "{{theme}}") + ".css");
			}

			if (data.name && data.path) {
				var success = load.themeMap.map(function (theme) {
					var themeDir = theme[1];
					var dest = getLayerPath(themeDir);
					var themedLoadList = loadList.map(function (path) {
						return path.replace(/{{theme}}/g, themeDir);
					});
					return css.buildFunctions.writeLayer(writePluginFiles, dest, themedLoadList);
				}).every(function (bool) {
					return bool;
				});

				// Write generic css config with {{theme}} on the layer (only if the layers were successfully
				// written).
				var destMid = data.name.replace(/^(([^\/]*\/)*)[^\/]*$/, "$1themes/layer_{{theme}}.css");
				success && css.buildFunctions.writeConfig(write, module.id, destMid, loadList);

				// Reset loadList
				loadList = [];
			}
		};
	}
	return load;
});
