/**
 * CSS loading plugin for widgets.
 *
 * This plugin will load and wait for css file.  This could be handy when
 * loading css file as part of a layer or as a way to apply a run-time theme.
 * This plugin uses the link load event and a work-around on old webkit browser.
 * The universal work-around watches a stylesheet until its rules are
 * available (not null or undefined). This plugin will return the path of the
 * inserted css file relative to baseUrl.
 *
 * Global configuration options:
 *
 * You may specify an alternate file extension:
 *
 *      require("css!myproj/component.less") // --> myproj/component.less
 *      require("css!myproj/component.scss") // --> myproj/component.scss
 *
 * When using alternative file extensions, be sure to serve the files from
 * the server with the correct mime type (text/css) or some browsers won't
 * parse them, causing an error in the plugin.
 *
 * @example:
 *      // load and wait for myproj/comp.css
 *      require(["delite/css!myproj/comp.css"]);
 *
 * @module delite/css
 */

define([
	"requirejs-dplugins/has",
	"dojo/Deferred",
	"module"
], function (has, Deferred, module) {
	"use strict";

	has.add("event-link-onload-api", function (global) {
		var wk = global.navigator.userAgent.match(/AppleWebKit\/([\d.]+)/);
		return !wk || parseInt(wk[1], 10) > 535;
	});
	var cache = {},
		lastInsertedLink;

	/**
	 * Return a promise that resolves when the specified link has finished loading.
	 * @param {HTMLLinkElement} link - The link element to be notified for.
	 * @returns {module:dojo/promise/Promise} - A promise.
	 */
	var listenOnLoad = function (link) {
		var def = new Deferred(),
			loadHandler = has("event-link-onload-api") ?
				function () {
					// We're using "readystatechange" because IE happily support both
					link.onreadystatechange = link.onload = function () {
						if (!link.readyState || link.readyState === "complete") {
							link.onreadystatechange = link.onload = null;
							def.resolve();
						}
					};
				} :
				function () {
					// watches a stylesheet for loading signs.
					var sheet = link.sheet || link.styleSheet,
						styleSheets = document.styleSheets;
					if (sheet && Array.prototype.lastIndexOf.call(styleSheets, sheet) !== -1) {
						def.resolve();
					} else {
						setTimeout(loadHandler, 25);
					}
				};

		loadHandler();
		return def.promise;
	};

	var loadCss = {
		id: module.id,

		/*jshint maxcomplexity: 11*/
		/**
		 * Loads a set of css resources.
		 * @param {string} path - A css file to load.
		 * @param {Function} require - A local require function to use to load other modules.
		 * @param {Function} callback - A function to call when the specified stylesheets have been loaded.
		 * @method
		 */
		load: function (path, require, callback) {
			if (has("builder")) {
				buildFunctions.addOnce(loadList, path);
				callback();
				return;
			}

			// Replace single css bundles by corresponding layer.
			var config = module.config();
			if (config.layersMap) {
				path = config.layersMap[path] || path;
			}

			var head = document.head || document.getElementsByTagName("head")[0],
				url = require.toUrl(path),
				link;

			// if the url has not already been injected/loaded, create a new promise.
			if (!cache[url]) {
				// hook up load detector(s)
				link = document.createElement("link");
				link.rel = "stylesheet";
				link.type = "text/css";
				link.href = url;
				head.insertBefore(link, lastInsertedLink ? lastInsertedLink.nextSibling : head.firstChild);
				lastInsertedLink = link;
				cache[url] = listenOnLoad(link);
			}

			cache[url].then(function () {
				// The stylesheet has been loaded, so call the callback
				callback(path);
			});
		}
	};

	if (has("builder")) {
		// build variables
		var loadList = [],
			writePluginFiles;

		var buildFunctions = {
			/**
			 * Write the layersMap configuration to the corresponding modules layer.
			 * The configuration will look like this:
			 * ```js
			 * require.config({
			 *     config: {
			 *         "delite/css": {
			 *             layersMap: {
			 *                 "module1.css": "path/to/layer.css",
			 *                 "module2.css": "path/to/layer.css"
			 *             }
			 *         }
			 *     }
			 * });
			 * ```
			 *
			 * @param {Function} write - This function takes a string as argument
			 * and writes it to the modules layer.
			 * @param {string} mid - Current module id.
			 * @param {string} dest - Current css layer path.
			 * @param {Array} loadList - List of css files contained in current css layer.
			 */
			writeConfig: function (write, mid, dest, loadList) {
				var cssConf = {
					config: {}
				};
				cssConf.config[mid] = {
					layersMap: {}
				};
				loadList.forEach(function (path) {
					cssConf.config[mid].layersMap[path] = dest;
				});

				write("require.config(" + JSON.stringify(cssConf) + ");");
			},

			/**
			 * Concat and optimize all css files required by a modules layer and write the result.
			 * The node module `clean-css` is responsible for optimizing the css and correcting
			 * images paths.
			 *
			 * @param {Function} writePluginFiles - The write function provided by the builder to `writeFile`.
			 * and writes it to the modules layer.
			 * @param {string} dest - Current css layer path.
			 * @param {Array} loadList - List of css files contained in current css layer.
			 */
			writeLayer: function (writePluginFiles, dest, loadList) {
				// This is a node-require so it is synchronous.
				var path = require.toUrl(module.id).replace(/[^\/]*$/, "node_modules/clean-css");
				var CleanCSS = require.nodeRequire(require.getNodePath(path));

				var result = "";
				loadList.forEach(function (src) {
					result += new CleanCSS({
						relativeTo: "./",
						target: dest
					}).minify("@import url(" + src + ");");
				});
				writePluginFiles(dest, result);
			},

			/**
			 * Add the string to `ary` if it's not already in it.
			 * @param {Array} ary - Destination array.
			 * @param {string} element - Element to add.
			 */
			addOnce: function (ary, element) {
				if (ary.indexOf(element) === -1) {
					ary.push(element);
				}
			}
		};

		loadCss.writeFile = function (pluginName, resource, require, write) {
			writePluginFiles = write;
		};

		loadCss.onLayerEnd = function (write, data) {
			function getLayerPath() {
				return data.path.replace(/^(?:\.\/)?(([^\/]*\/)*)[^\/]*$/, "$1css/layer.css");
			}

			if (data.name && data.path) {
				var dest = getLayerPath();

				// Write layer file
				buildFunctions.writeLayer(writePluginFiles, dest, loadList);
				// Write css config on the layer
				buildFunctions.writeConfig(write, module.id, dest, loadList);
				// Reset loadList
				loadList = [];
			}
		};

		// Expose build functions to be used by delite/theme
		loadCss.buildFunctions = buildFunctions;
	}

	return loadCss;
});
