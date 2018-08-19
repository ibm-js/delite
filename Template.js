/** @module delite/Template */
define([
	"dcl/dcl"
], function (
	dcl
) {
	// Get list of properties that the javascript expression depends on.
	// For example, for "this.label + ' hi ' + this.foo", returns ["label", "foo"].
	// For nested props (ex: this.item.foo), return top level prop (ex: item).
	function propertiesReferenced(expr) {
		var matches = expr.match(/this\.(\w+)/g);
		if (matches) {
			// use hash to remove duplicates, then convert to array to return
			return Object.keys(matches.reduce(function (hash, thisVar) {
				hash[thisVar.substring(5)] = true;	// "this.foo" --> "foo"
				return hash;
			}, {}));
		} else {
			return [];
		}
	}

	/**
	 * Given an AST representation of the template, generates a function that:
	 *
	 * 1. generates DOM corresponding to the template
	 * 2. returns an object including a function to be called to update that DOM
	 *    when widget properties have changed.
	 *
	 * The function is available through `this.func`, i.e.:
	 *
	 * ```js
	 * var template = new Template(ast);
	 * template.func(document);
	 * ```
	 *
	 * See the reference documentation for details on the AST format.
	 *
	 * @param {Object} tree - AST representing the template.
	 * @param {string} rootNodeName - Name of variable for the root node of the tree, typically `this`.
	 * @param {boolean} createRootNode - If true, create node; otherwise assume node exists in variable `nodeName`.
	 * @class module:delite/Template
	 */
	var Template = dcl(/** @lends module:delite/Template# */ {
		declaredClass: "delite/Template",

		constructor: function (tree, rootNodeName, createRootNode) {
			this.buildText = [];	// code to build the initial DOM
			this.destroyText = [];	// code to run in tear down template, removing listeners etc.
			this.observeText = [];	// code to update the DOM when widget properties change

			this.generateNodeCode(rootNodeName || "this", createRootNode, tree);

			// Generate text of function.
			this.text = this.buildText.join("\n") + "\n" +
				"return {\n" +
					"\trefresh: function(props){\n\t\t" +
						this.observeText.join("\n\t\t") +
					"\n\t}.bind(this),\n" +
					"\tdestroy: function(){\n" +
						this.destroyText.join("\n\t\t") +
						"\n\t\twhile(this.firstChild){ this.removeChild(this.firstChild); }\n" +
					"\t}.bind(this)\n" +
				"};\n";

			/* jshint evil:true */
			this.func = new Function("document", this.text);
		},

		/**
		 * Text of the generated function.
		 * @member {string}
		 * @readonly
		 */
		text: "",

		/**
		 * Generated function.
		 * @member {Function}
		 * @readonly
		 */
		func: null,

		/**
		 * Generate code that executes `statement` if any of the properties in `dependencies` change.
		 * @param {string[]} dependencies - List of variables referenced in `statement`.
		 * Must have at least one entry.
		 * @param {string} statement - Content inside if() statement.
		 * @private
		 */
		generateWatchCode: function (dependencies, statement) {
			if (dependencies.length) {
				this.observeText.push(
					"if(" + dependencies.map(function (prop) {
						return "'" + prop + "' in props";
					}).join(" || ") + ")",
					"\t" + statement + ";"
				);
			}
		},

		/**
		 * Generate JS code to create and add children to a node named nodeName.
		 * @param {string} nodeName
		 * @param {Object[]} children
		 * @private
		 */
		generateNodeChildrenCode: function (nodeName, children) {
			children.forEach(function (child, idx) {
				var childName = (nodeName === "this" ? "" : nodeName) + "c" + (idx + 1);
				if (child.tag) {
					// Standard DOM node, recurse
					this.generateNodeCode(childName, true, child);
					this.buildText.push(
						nodeName + ".appendChild(" + childName + ");"
					);
				} else {
					// JS code to compute text value
					var textNodeName = childName + "t" + (idx + 1),
						js = child,
						dependsOn = propertiesReferenced(js);

					// Generate code to create DOM text node.
					this.buildText.push(
						"var " + textNodeName + " = document.createTextNode(" + js + ");",
						nodeName + ".appendChild(" + textNodeName + ");"
					);

					// watch for widget property changes and update DOM text node
					this.generateWatchCode(dependsOn, textNodeName + ".nodeValue = " + js);
				}
			}, this);
		},

		/**
		 * Generate JS code to create a node called nodeName based on templateNode, then
		 * set its properties, attributes, and children, according to descendants of templateNode.
		 * @param {string} nodeName - The node will be in a variable with this name.
		 * @param {boolean} createNode - If true, create node; otherwise assume node exists in variable `nodeName`
		 * @param {Object} templateNode - An object representing a node in the template, as described in module summary.
		 * @private
		 */
		generateNodeCode: function (nodeName, createNode, templateNode) {
			/* jshint maxcomplexity:16 */

			// Helper string for setting up attach-point(s), ex: "this.foo = this.bar = ".
			var ap = (templateNode.attachPoints || []).map(function (n) {
				return "this." + n + " = ";
			}).join("");

			// Create node
			if (createNode) {
				this.buildText.push(
					"var " + nodeName + " = " + ap + (templateNode.xmlns ?
					"document.createElementNS('" + templateNode.xmlns + "', '" + templateNode.tag + "');" :
					"document.createElement('" + templateNode.tag + "');")
				);
			} else if (ap) {
				// weird case that someone set attach-point on root node
				this.buildText.push(ap + nodeName + ";");
			}

			// Setup code to delete attach points created above.
			this.destroyText.push((templateNode.attachPoints || []).map(function (n) {
				return "delete this." + n + ";\n";
			}).join("").trim());

			// Set attributes/properties
			for (var attr in templateNode.attributes) {
				var js = templateNode.attributes[attr],
					dependsOn = propertiesReferenced(js);

				// Generate code to set this property or attribute
				var propName = Template.getProp(templateNode.tag, attr);

				if (attr === "class" && !templateNode.xmlns) {
					// Special path for class to not overwrite classes set by application or by other code.
					this.buildText.push("this.setClassComponent('template'+this.widgetId, " + js + ", " + nodeName +
						");");
					this.generateWatchCode(dependsOn,
							"this.setClassComponent('template'+this.widgetId, " + js + ", " + nodeName + ")");
				} else {
					var setJs = propName ? nodeName + "." + propName + " = " + js :
						"this.setOrRemoveAttribute(" + nodeName + ", '" + attr + "', " + js + ")";
					this.buildText.push(setJs);
					this.generateWatchCode(dependsOn, setJs);
				}
			}

			// If this node is a custom element, make it immediately display the property changes I've made
			if (/-/.test(templateNode.tag)) {
				this.buildText.push(nodeName + ".deliver();");
				this.observeText.push(nodeName + ".deliver();");
			}

			// Setup connections.
			for (var type in templateNode.connects) {
				var handler = templateNode.connects[type];
				var callback = /^[a-zA-Z0-9_]+$/.test(handler) ?
					"this." + handler + ".bind(this)" :		// standard case, connecting to a method in the widget
					"function(event){" + handler + "}";	// connect to anon func, ex: on-click="g++;". used by dapp.

				if (nodeName === "this") {
					// Special case, because on template teardown need to manually remove listeners.
					this.buildText.push("var h_" + type + " = this.on('" + type + "', " + callback + ");");
					this.destroyText.push("h_" + type + ".remove();");
				} else {
					this.buildText.push("this.on('" + type + "', " + callback + ", " + nodeName  + ");");
				}
			}

			// Create descendant Elements and text nodes.
			if (templateNode.children) {
				this.generateNodeChildrenCode(nodeName, templateNode.children);
			}
		}
	});

	// Export helper funcs so they can be used by handlebars.js

	/**
	 * Return cached reference to Element with given tag name.
	 * @function module:delite/Template.getElement
	 * @param {string} tag
	 * @returns {Element}
	 */
	var elementCache = {};
	Template.getElement = function (tag) {
		if (!(tag in elementCache)) {
			elementCache[tag] = document.createElement(tag);
		}
		return elementCache[tag];
	};

	/**
	 * Given a tag and attribute name, return the associated property name,
	 * or undefined if no such property exists, for example:
	 *
	 * - getProp("div", "tabindex") --> "tabIndex"
	 * - getProp("div", "role") --> undefined
	 *
	 * Note that in order to support SVG, getProp("svg", "class") returns null instead of className.
	 *
	 * @function module:delite/Template.getProp
	 * @param {string} tag - Tag name.
	 * @param {string} attrName - Attribute name.
	 * @returns {string}
	 */
	var attrMap = {};
	Template.getProp = function (tag, attrName) {
		if (!(tag in attrMap)) {
			var proto = Template.getElement(tag),
				map = attrMap[tag] = {};
			for (var prop in proto) {
				map[prop.toLowerCase()] = prop;
			}
			map.style = "style.cssText";
		}
		return attrMap[tag][attrName];
	};

	return Template;
});
