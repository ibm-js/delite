/**
 * Plugin to compile an AST representing a template into a function to generate that DOM,
 * and setup listeners to update the DOM as the widget properties change.
 *
 * See the reference documentation for details on the AST format.
 *
 * @module delite/template
 */
define(["./register"], function (register) {

	var elementCache = {};

	/**
	 * Return cached reference to Element with given tag name.
	 * @param {string} tag
	 * @returns {Element}
	 * @protected
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
	 * @param {string} tag - Tag name.
	 * @param {string} attrName - Attribute name.
	 * @returns {string}
	 * @protected
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
	 * Generate code that executes `statement` if any of the properties in `dependencies` change.
	 * @param {string[]} dependencies - List of variables referenced in `statement.
	 * @param {string} statement - Content inside if() statement.
	 * @param {string[]} observeText - Statement appended to this array.
	 */
	function generateWatchCode(dependencies, statement, observeText) {
		if (dependencies.length) {
			observeText.push(
					"if(" + dependencies.map(function (prop) {
					return "'" + prop + "' in props";
				}).join(" || ") + ")",
					"\t" + statement + ";"
			);
		}
	}

	return /** @lends module:delite/template. */ {
		// Export helper funcs so they can be used by handlebars.js
		getElement: getElement,
		getProp: getProp,

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
					this.generateNodeCode(childName, true, child, buildText, observeText);
					buildText.push(
						nodeName + ".appendChild(" + childName + ");"
					);
				} else {
					// JS code to compute text value
					var textNodeName = childName + "t" + (idx + 1);

					// code to create DOM text node
					buildText.push(
						"var " + textNodeName + " = document.createTextNode(" + child.expr + ");",
						nodeName + ".appendChild(" + textNodeName + ");"
					);

					// watch for widget property changes and update DOM text node
					generateWatchCode(child.dependsOn, textNodeName + ".nodeValue = " + child.expr, observeText);
				}
			}, this);
		},

		/**
		 * Generate JS code to create a node called nodeName based on templateNode, then
		 * set its properties, attributes, and children, according to descendants of templateNode.
		 * @param {string} nodeName - The node will be in a variable with this name.
		 * @param {boolean} createNode - If true, create node; otherwise assume node exists in variable `nodeName`
		 * @param {Object} templateNode - An object representing a node in the template, as described in module summary.
		 * @param {string[]} buildText - (output param) add code to build the DOM to this array
		 * @param {string[]} observeText - (output param) add code to run in this.observe() callback to this array
		 * @private
		 */
		generateNodeCode: function (nodeName, createNode, templateNode, buildText, observeText) {
			/* jshint maxcomplexity:11*/
			// Helper string for setting up attach-point(s), ex: "this.foo = this.bar = ".
			var ap = (templateNode.attachPoints || []).map(function (n) {
				return  "this." + n + " = ";
			}).join("");

			// Create node
			if (createNode) {
				buildText.push(
					"var " + nodeName + " = " + ap + (templateNode.xmlns ?
					"document.createElementNS('" + templateNode.xmlns + "', '" + templateNode.tag + "');" :
					"register.createElement('" + templateNode.tag + "');")
				);
			} else if (ap) {
				// weird case that someone set attach-point on root node
				buildText.push(ap + nodeName + ";");
			}

			// Set attributes/properties
			for (var attr in templateNode.attributes) {
				var info = templateNode.attributes[attr];

				// Generate code to set this property or attribute
				var propName = getProp(templateNode.tag, attr),
					js = info.expr,		// code to compute property value
					codeToSetProp = propName ? nodeName + "." + propName + "=" + js :
						"this.setOrRemoveAttribute(" + nodeName + ", '" + attr + "', " + js + ")";

				// set property/attribute initially
				buildText.push(codeToSetProp + ";");

				// watch for changes and update property/attribute
				generateWatchCode(info.dependsOn, codeToSetProp, observeText);
			}

			// If this node is a custom element, make it immediately display the property changes I've made
			if (/-/.test(templateNode.tag)) {
				buildText.push(nodeName + ".deliver();");
				observeText.push(nodeName + ".deliver();");
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
		 * Given an AST representation of the template,
		 * returns the text for a function to generate DOM corresponding to that template,
		 * and then returns an object including a function to be called to update that DOM
		 * when widget properties have changed.
		 *
		 * @param {string} rootNodeName - Name of variable for the root node of the tree, typically `this`.
		 * @param {boolean} createRootNode - If true, create node; otherwise assume node exists in variable `nodeName`
		 * @param {Object} tree
		 * @returns {string} Javascript code for function.
		 * @private
		 */
		codegen: function (rootNodeName, createRootNode, tree) {
			var buildText = [],	// code to build the initial DOM
				observeText = [];	// code to update the DOM when widget properties change

			this.generateNodeCode(rootNodeName, createRootNode, tree, buildText, observeText);

			return buildText.join("\n") +
				["\nreturn { refresh: function(props){"].concat(observeText).join("\n\t") + "\n}.bind(this) };\n";
		},

		/**
		 * Given an AST representation of the template,
		 * returns a function to generate DOM corresponding to that template,
		 * and then returns an object including a function to be called to update that DOM
		 * when widget properties have changed.
		 *
		 * @param {string} [rootNodeName] - Name of variable for the root node of the tree, defaults to `this`.
		 * @param {boolean} [createRootNode] - If true, create root node; otherwise assume it already exists
		 * in variable `rootNodeName`
		 * @param {Object} tree
		 * @returns {Function}
		 */
		compile: function (tree, rootNodeName, createRootNode) {
			var text = this.codegen(rootNodeName || "this", createRootNode, tree);

			/* jshint evil:true */
			return new Function("document", "register", text);
		}
	};
});