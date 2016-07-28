/**
 * Plugin that loads a handlebars template from a specified MID and returns a function to
 * generate DOM corresponding to that template.
 *
 * When that function is run, it returns another function,
 * meant to be run when the widget properties change.  The returned function will update the
 * DOM corresponding to the widget property changes.
 *
 * Both functions are meant
 * to be run in the context of the widget, so that properties are available through `this`.
 *
 * Could also theoretically be used by a build-tool to precompile templates, assuming you loaded
 * [jsdom](https://github.com/tmpvar/jsdom) to provide methods like `document.createElement()`.
 * But the problem is that the build tool has to load the definitions for the custom elements
 * referenced in the templates, in order to get the types of their properties.
 *
 * Template has a format like:
 *
 * ```html
 * <button>
 *   <span class="d-reset {{iconClass}}"></span>
 *   {{label}}
 * </button>
 * ```
 *
 * Usage is typically like:
 *
 * ```js
 * define([..., "delite/handlebars!./templates/MyTemplate.html"], function(..., template){
 *     ...
 *     template: template,
 *     ...
 * });
 * ```
 *
 * @module delite/handlebars
 */
define([
	"module",
	"require",
	"requirejs-dplugins/has",
	"requirejs-dplugins/Promise!",
	"requirejs-text/text",
	"./Template"
], function (module, moduleRequire, has, Promise, textPlugin, Template) {

	/**
	 * Given a string like "hello {{foo}} world", generate JS code to output that string,
	 * ex: "hello" + this.foo + "world"
	 * @param {string} text
	 * @param {boolean} convertUndefinedToBlank - Useful so that class="foo {{item.bar}}" will convert to class="foo"
	 * rather than class="foo undefined", but for something like aria-valuenow="{{value}}", when value is undefined
	 * we need to leave it that way, to trigger removal of that attribute completely instead of setting
	 * aria-valuenow="".
	 * @returns {string} like "'hello' + this.foo + 'world'"
	 */
	function toJs(text, convertUndefinedToBlank) {
		var pos = 0, length = text.length, insideBraces = false, parts = [];

		while (pos < length) {
			var bracesIndex = text.indexOf(insideBraces ? "}}" : "{{", pos),
				str = text.substring(pos, bracesIndex === -1 ? length : bracesIndex);
			if (insideBraces) {
				// str is a property name or a JS expression.
				var prop = str.trim();
				if (/this\./.test(prop)) {
					// JS expression (ex: this.selectionMode === "multiple")
					parts.push("(" + prop + ")");
				} else {
					// Property (ex: selectionMode) or path (ex: item.foo)
					parts.push(convertUndefinedToBlank ? "(this." + prop + "== null ? '' : this." + prop + ")" :
						"this." + prop);
				}
			} else {
				// string literal, single quote it and escape special characters
				if (str) {
					parts.push("'" +
						str.replace(/(['\\])/g, "\\$1").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + "'");
				}
			}
			pos = bracesIndex === -1 ? length : bracesIndex + 2;
			insideBraces = !insideBraces;
		}

		return parts.join(" + ");
	}

	var handlebars = /** @lends module:delite/handlebars */ {
		/**
		 * Given a template in DOM, returns the Object tree representing that template.
		 * @param {Element} templateNode - Root node of template.
		 * @param {string} [xmlns] - Used primarily for SVG nodes.
		 * @returns {Object} Object in format
		 * `{tag: string, xmlns: string, attributes: {}, children: Object[], attachPoints: string[]}`.
		 * @private
		 */
		parse: function (templateNode, xmlns) {
			// Get tag name, reversing the tag renaming done in toDom()
			var tag = templateNode.hasAttribute("is") ? templateNode.getAttribute("is") :
					templateNode.tagName.replace(/^template-/i, "").toLowerCase(),
				elem = Template.getElement(tag);

			// Process attributes
			var attributes = {}, connects = {}, attachPoints;
			var i = 0, item, attrs = templateNode.attributes;
			while ((item = attrs[i++])) {
				var name = item.name.replace("template-", ""), value = item.value;
				if (value || typeof elem[name.toLowerCase()] === "boolean") {
					switch (name) {
					case "xmlns":
						xmlns = value;
						break;
					case "is":
						// already handled above
						break;
					case "attach-point":
					case "data-attach-point":		// in case user wants to use HTML validator
						attachPoints = value.split(/, */);
						break;
					default:
						if (/^on-/.test(name)) {
							// on-click="{{handlerMethod}}" sets connects.click = "handlerMethod"
							connects[name.substring(3)] = value.replace(/\s*({{|}})\s*/g, "");
						} else {
							attributes[name] = this.parseValueAttribute(tag, elem, name, value);
						}
					}
				}
			}

			return {
				tag: tag,
				xmlns: xmlns,
				attributes: attributes,
				connects: connects,
				children: handlebars.parseChildren(templateNode, xmlns),
				attachPoints: attachPoints
			};
		},

		/**
		 * Parse markup for a normal attribute, ex: value="foo".  Does not handle on-click="..." or attach-point="...".
		 * Returns the value to set for the corresponding property (if there's a shadow property), or otherwise
		 * the value to set for the attribute.
		 * For example, for markup of value="fred", returns "fred", and for selected="selected", returns true.
		 * @param {string} tag - Name of tag, ex: "div".
		 * @param {Element} elem - Example element.
		 * @param {string} name - The name of the attribute.
		 * @param {string} value - The value of the attribute.
		 * @returns {string} Javascript expression representing the value, ex: "true" or "5 + this.bar".
		 * @private
		 */
		parseValueAttribute: function (tag, elem, name, value) {
			// map x="hello {{foo}} world" --> "hello " + this.foo + " world";
			var propName = Template.getProp(tag, name),
				propType = typeof elem[propName];
			if (propName && propType !== "string" && !/{{/.test(value) && propName !== "style.cssText") {
				// This attribute corresponds to a non-string property, and the value specified is a
				// literal like vertical="false", so *don't* convert value to string.
				if (propType === "boolean") {
					// Convert autocorrect="on" and selected="selected" and just <option selected> to set
					// corresponding properties to true.  Also convert autocorrect="off" to set
					// corresponding property to false.
					return value === "off" || value === "false" ? "false" : "true";
				} else {
					return value;
				}
			} else {
				return toJs(value, name === "class");
			}
		},

		/**
		 * Scan child nodes, both text and Elements.
		 * @param {Element} templateNode
		 * @param {string} [xmlns] - Used primarily for SVG nodes.
		 * @returns {Array}
		 * @private
		 */
		parseChildren: function (templateNode, xmlns) {
			var children = [];

			// Index of most recent non-whitespace node added to children array
			var lastRealNode;

			// Scan all the children, populating children[] array.
			// Trims starting and ending whitespace nodes, but not whitespace in the middle, so that
			// the following example only ends up with one whitespace node between hello and world:
			//
			// <div>\n\t<span>hello</span> <span>world</span>\n</div>
			for (var child = templateNode.firstChild; child; child = child.nextSibling) {
				var childType = child.nodeType;
				if (childType === 1) {
					// Standard DOM node, recurse
					lastRealNode = children.length;
					children.push(handlebars.parse(child, xmlns));
				} else if (childType === 3) {
					// Text node likely containing variables like {{foo}}.
					if (/^[ \t\n]*$/.test(child.nodeValue)) {
						// Whitespace node.  Note: avoided using trim() since that removes &nbsp; nodes.
						if (lastRealNode === undefined) {
							// Skip leading whitespace nodes
							continue;
						}
					} else {
						lastRealNode = children.length;
					}
					children.push(toJs(child.nodeValue, true));
				}
			}

			return children.slice(0, lastRealNode + 1); // slice() removes trailing whitespace nodes
		},


		/**
		 * Neutralize custom element tags.
		 * Rename all the elements in the template so that:
		 * 1. browsers with native document.createElement() support don't start instantiating custom elements
		 *    in the template, creating internal nodes etc.
		 * 2. prevent <select size={{size}}> from converting to <select size=0> on webkit
		 * 3. prevent <img src={{foo}}> from starting an XHR for a URL called {{foo}} (webkit, maybe other browsers)
		 * @private
		 */
		neutralizeTags: function (templateText) {
			// Regex will not match <!-- comment -->.
			templateText = templateText.replace(
				/(<\/? *)([-a-zA-Z0-9]+)/g, "$1template-$2");

			// For self-closing tags like <input> that have been converted to <template-input>, we need to add a
			// closing </template-input> tag.
			templateText = templateText.replace(
				/* jshint maxlen:200 */
				/<template-(area|base|br|col|command|embed|hr|img|input|keygen|link|meta|param|source|track|wbr)([^>]*?)\/?>/g,
				"<template-$1$2></template-$1>");

			// Also rename style attribute, because IE will drop style="..." if the ... is an illegal value
			// like "height: {{foo}}px".
			templateText = templateText.replace(/style=/g, "template-style=");

			return templateText;
		},

		/**
		 * Given a template string, returns the DOM tree representing that template.  Will only run in a browser.
		 * @param {string} templateText - HTML text for template.
		 * @returns {Element} Root element of tree.
		 * @private
		 */
		toDom: function (templateText) {
			templateText = handlebars.neutralizeTags(templateText);

			// Create DOM tree from template.
			// If template contains SVG nodes then parse as XML, to preserve case of attributes like viewBox.
			// Otherwise parse as HTML, to allow for missing closing tags, ex: <ul> <li>1 <li>2 </ul>.
			var root;
			if (/<template-svg/.test(templateText)) {
				var parser = new DOMParser();
				root = parser.parseFromString(templateText, "text/xml").firstChild;
				while (root.nodeType !== 1) {
					// Skip top level comment and move to "real" template root node.
					// Needed since there's no .firstElementChild or .nextElementSibling for SVG nodes on FF.
					root = root.nextSibling;
				}
			} else {
				// Use innerHTML because Safari doesn't support DOMParser.parseFromString(str, "text/html")
				var container = document.createElement("div");
				container.innerHTML = templateText;
				root = container.firstElementChild; // use .firstElementChild to skip possible top level comment
			}

			return root;
		},

		/**
		 * Given a template, returns a function to generate DOM corresponding to that template,
		 * and setup listeners (using `Stateful#observe()`) to propagate changes in the widget
		 * properties to the templates.
		 *
		 * This method is usually only called directly when your template contains custom elements,
		 * and a call to handlebars!myTemplate.html might try to compile the template before the custom
		 * elements were loaded.
		 *
		 * @param {string} template - See module description for details on template format.
		 * @returns {Function} - Function that optionally takes a top level node, or creates it if not passed in, and
		 * then creates the rest of the DOMNodes in the template.
		 */
		compile: function (templateText) {
			var templateDom = handlebars.toDom(templateText);
			var tree = handlebars.parse(templateDom);
			var template = new Template(tree);
			return template.func;
		},

		/**
		 * Similar to compile() but before compiling the template, loads the modules specified in the
		 * template via the `requires=...` attribute.
		 * @param {string} templateText - See module description for details on template format.
		 * @param {Function} require - AMD's require() method.
		 * @returns {Promise} Promise for the function that compile() would have returned.
		 */
		requireAndCompile: function (templateText, require) {
			var templateDom = handlebars.toDom(templateText),
				requires = templateDom.getAttribute("requires") ||
					templateDom.getAttribute("data-requires") || "";
			templateDom.removeAttribute("requires");
			templateDom.removeAttribute("data-requires");

			return new Promise(function (resolve) {
				require(requires.split(/,\s*/), function () {
					var tree = handlebars.parse(templateDom);
					var template = new Template(tree);
					resolve(template.func);
				});
			});
		},

		/**
		 * Returns a function to generate the DOM specified by the template.
		 * Also loads any AMD dependencies specified on the template's root node via the `requires` property.
		 * This is the function run when you use this module as a plugin.
		 * @param {string} mid - Absolute path to the resource.
		 * @param {Function} require - AMD's require() method.
		 * @param {Function} onload - Callback function which will be called with the compiled template.
		 * @param {Object} loaderConfig - Configuration object from the loader with `isBuild === true`
		 * when doing a build.
		 * @private
		 */
		load: function (mid, require, onload) {
			textPlugin.load(mid, require, function (templateText) {
				this.requireAndCompile(templateText, require).then(onload);
			}.bind(this));
		}
	};

	if (has("builder")) {
		var fs = require.nodeRequire("fs"),
			jsdom = require.nodeRequire("jsdom").jsdom;

		// Info about the MID being currently processed
		var templateText, templateRequires;

		handlebars.load = function (mid, require, onload) {
			templateText = fs.readFileSync(require.toUrl(mid), "utf8");
			onload();
		};

		// Inline the template text and list of dependencies into the layer file.
		handlebars.write = function (pluginName, moduleName, write) {
			var dom = jsdom(templateText),
				template = dom.querySelector("template"),
				requiresAttr = template.getAttribute("requires") || template.getAttribute("data-requires");
			templateRequires = requiresAttr ? requiresAttr.split(/,\s*/) : [];
			template.removeAttribute("requires");
			template.removeAttribute("data-requires");

			var moduleRequires = [module.id].concat(templateRequires);
			var moduleText = "define(" + JSON.stringify(moduleRequires) +  ", function(handlebars){\n" +
				"\treturn handlebars.compile(" + JSON.stringify(template.outerHTML) + ");\n" +
				"});";
			write.asModule(pluginName + "!" + moduleName, moduleText);
		};

		// Notify builder to take dependencies specified in requires="..." attribute, and inline them into the layer.
		handlebars.addModules = function (pluginName, resource, addModules) {
			addModules(templateRequires);

		};
	}

	return handlebars;
});
