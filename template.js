/**
 * Plugin to compile an object tree representing a template into a function to generate that DOM,
 * and setup listeners to update the DOM as the widget properties change.
 *
 * Object tree for a button would look like:
 *
 * ```js
 * {
 * 	 tag: "button",
 * 	 attributes: {
 * 	    "class": ["d-reset ", {property: "baseClass"}]   // concatenate values in array to get attr value
 * 	 },
 * 	 children: [
 * 	    { tag: "span", attachPoints: ["iconNode"], ... },
 * 	    "some boilerplate text",
 * 	    { property: "label" } // text node bound to this.label
 * 	 ]
 * }
 * ```
 * @module delite/template
 */
define(["./register"], function (register) {

	var elementCache = {};

	/**
	 * Return cached reference to Element with given tag name.
	 * @param {string} tag
	 * @returns {Element}
	 * @private
	 */
	function getElement(tag) {
		if (!(tag in elementCache)) {
			elementCache[tag] = register.createElement(tag);
		}
		return elementCache[tag];
	}

	var attrMap = {};

	/**
	 * Given a tag and attribute name, return the associated property name,
	 * or undefined if no such property exists, for example:
	 *
	 * - getProp("div", "tabindex") --> "tabIndex"
	 * - getProp("div", "role") --> undefined
	 *
	 * Note that in order to support SVG, getProp("svg", "class") returns null instead of className.
	 *
	 * @param {string} tag
	 * @param {string} attrName
	 * @returns {string}
	 * @private
	 */
	function getProp(tag, attrName) {
		if (!(tag in attrMap)) {
			var proto = getElement(tag),
				map = attrMap[tag] = {};
			for (var prop in proto) {
				map[prop.toLowerCase()] = prop;
			}
			map.style = "style.cssText";
		}
		return attrMap[tag][attrName];
	}

	/**
	 * Helper for generating javascript; creates text strings enclosed in single quotes.
	 * @param {string} text
	 * @returns {string}
	 * @private
	 */
	function singleQuote(text) {
		return "'" + text.replace(/(['\\])/g, "\\$1").replace(/\n/g, "\\n").replace(/\t/g, "\\t") + "'";
	}

	return /** @lends module:delite/template. */ {
		// Note: this is generating actual JS code since:
		// 		- that's 3x faster than looping over the object tree every time...
		//		- so the build system can eliminate this file (and just use the generated code
		//
		// But perhaps that is misguided.  The performance difference is probably insignificant
		// compared to the cost of creating DOM elements and/or the cost of actually rendering them, and the size
		// of the generated code compared to the size of the object tree may offset gains from including this file.

		// Note: JSONML (http://www.ibm.com/developerworks/library/x-jsonml/#c7) represents elements as a single array
		// like [tag, attributesHash, child1, child2, child3].  Should we do the same?   But attach points are tricky.

		/**
		 * Generate JS code to create and add children to a node named nodeName.
		 * @param {string} nodeName
		 * @param {Object[]} children
		 * @param {string[]} buildText - (output param) add code to build the DOM to this array
		 * @param {string[]} observeText - (output param) add code to run in this.observe() callback to this array
		 * @private
		 */
		generateNodeChildrenCode: function (nodeName, children, buildText, observeText) {
			children.forEach(function (child, idx) {
				var childName = (nodeName === "this" ? "" : nodeName) + "c" + (idx + 1);
				if (child.tag) {
					// Standard DOM node, recurse
					this.generateNodeCode(childName, child, buildText, observeText);
					buildText.push(
						nodeName + ".appendChild(" + childName + ");"
					);
				} else if (child.property) {
					// text node bound to a widget property, ex: this.label
					var textNodeName = childName + "t" + (idx + 1);
					buildText.push(
						"var " + textNodeName + " = document.createTextNode(this." + child.property + " || '');",
						nodeName + ".appendChild(" + textNodeName + ");"
					);

					// watch for changes; if it's a nested property like item.foo then watch top level prop (item)
					observeText.push(
						"if(" + singleQuote(child.property.replace(/[^\w].*/, "")) + " in props)",
						"\t" + textNodeName + ".nodeValue = (this." + child.property + " || '');"
					);
				} else {
					// static text
					buildText.push(nodeName + ".appendChild(document.createTextNode(" + singleQuote(child) + "));");
				}
			}, this);
		},

		/**
		 * Generate JS code to create a node called nodeName based on templateNode.
		 * Works recursively according to descendants of templateNode.
		 * @param {string} nodeName - The node will be created in a variable with this name.
		 * If "this", indicates that the node already exists and should be referenced as "this".
		 * @param {Object} templateNode - An object representing a node in the template, as described in module summary.
		 * @param {string[]} buildText - (output param) add code to build the DOM to this array
		 * @param {string[]} observeText - (output param) add code to run in this.observe() callback to this array
		 * @private
		 */
		generateNodeCode: function (nodeName, templateNode, buildText, observeText) {
			/* jshint maxcomplexity:11*/
			// Helper string for setting up attach-point(s), ex: "this.foo = this.bar = ".
			var ap = (templateNode.attachPoints || []).map(function (n) {
				return  "this." + n + " = ";
			}).join("");

			// Create node
			if (nodeName !== "this") {
				buildText.push(
					"var " + nodeName + " = " + ap + (templateNode.xmlns ?
					"document.createElementNS('" + templateNode.xmlns + "', '" + templateNode.tag + "');" :
					"register.createElement('" + templateNode.tag + "');")
				);
			} else if (ap) {
				// weird case that someone set attach-point on root node
				buildText.push(ap + "this;");
			}

			// Set attributes/properties
			for (var attr in templateNode.attributes) {
				// List of strings and property names that define the attribute/property value
				var parts = templateNode.attributes[attr];

				// Get expression for the value of this property, ex: 'd-reset ' + this.baseClass.
				// Also get list of properties that we need to watch for changes.
				var wp = [], js = parts.map(function (part) {
					if (part.property) {
						// If it's a nested property like item.foo then watch top level prop (item).
						wp.push(part.property.replace(/[^\w].*/, ""));
						return "(this." + part.property + " || '')";
					} else {
						return singleQuote(part);
					}
				}).join(" + ");

				// Generate code to set this property or attribute
				var propName = getProp(templateNode.tag, attr);
				var codeToSetProp = propName ? nodeName + "." + propName + "=" + js + ";" :
					nodeName + ".setAttribute('" + attr + "', " + js + ");";
				buildText.push(codeToSetProp);
				if (wp.length) {
					observeText.push(
						"if(" + wp.map(function (prop) {
							return singleQuote(prop) + " in props";
						}).join(" || ") + ")",
						"\t" + codeToSetProp
					);
				}
			}

			// If this node is a custom element, make it immediately display the property changes I've made
			if (/-/.test(templateNode.tag)) {
				observeText.push(
					nodeName + ".deliver();"
				);
			}

			// Setup connections
			for (var type in templateNode.connects) {
				var handler = templateNode.connects[type];
				var callback = /^[a-zA-Z0-9_]+$/.test(handler) ?
					"this." + handler + ".bind(this)" :		// standard case, connecting to a method in the widget
					"function(event){" + handler + "}";	// connect to anon func, ex: on-click="g++;". used by dapp.
				buildText.push("this.on('" + type + "', " + callback + ", " + nodeName  + ");");
			}

			// Create descendant Elements and text nodes
			this.generateNodeChildrenCode(nodeName, templateNode.children, buildText, observeText);
		},

		/**
		 * Given an object tree as described in the module summary,
		 * returns the text for a function to generate DOM corresponding to that template,
		 * and then return a function to propagate changes in widget properties to the template.
		 *
		 * Code assumes that the root node already exists as "this".
		 * 
		 * @param {Object} tree
		 * @returns {string} Javascript code for function.
		 * @private
		 */
		codegen: function (tree) {
			var buildText = [],	// code to build the initial DOM
				observeText = [];	// code to update the DOM when widget properties change

			this.generateNodeCode("this", tree, buildText, observeText);

			return buildText.join("\n") +
				["\nreturn function(props){"].concat(observeText).join("\n\t") + "\n};\n";
		},

		/**
		 * Given an object tree as described in the module summary,
		 * returns a function to generate DOM corresponding to that template,
		 * and setup listeners (using `Stateful#observe()`) to propagate changes in the widget
		 * properties to the templates.
		 * @param {Object} tree
		 * @returns {Function}
		 */
		compile: function (tree) {
			var text = this.codegen(tree);

			/* jshint evil:true */
			return new Function("document", "register", text);
		}
	};
});