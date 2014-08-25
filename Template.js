/** @module delite/Template */
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
	 * Class to compile an AST representing a template into a function to generate that template's DOM,
	 * and set up listeners to update the DOM as the widget properties change.
	 *
	 * See the reference documentation for details on the AST format.
	 *
	 * @mixin module:delite/Template
	 */
	var Template = register.dcl(null, /** @lends module:delite/Template# */ {
		/**
		 * Given an AST representation of the template, generates a function that:
		 *
		 * 1. generates DOM corresponding to the template
		 * 2. returns an object including a function to be called to update that DOM
		 *    when widget properties have changed.
		 *
		 * The function is available through this.func, i.e.:
		 *
		 *     var template = new Template(ast);
		 *     template.func(document, register);
		 *
		 * @param {Object} tree - AST representing the template.
		 * @param {string} rootNodeName - Name of variable for the root node of the tree, typically `this`.
		 * @param {boolean} createRootNode - If true, create node; otherwise assume node exists in variable `nodeName`.
		 * @private
		 */
		constructor: function (tree, rootNodeName, createRootNode) {
			this.buildText = [];	// code to build the initial DOM
			this.observeText = [];	// code to update the DOM when widget properties change

			this.generateNodeCode(rootNodeName || "this", createRootNode, tree);

			this.text = this.buildText.join("\n") +
				["\nreturn { refresh: function(props){"].concat(this.observeText).join("\n\t") + "\n}.bind(this) };\n";

			/* jshint evil:true */
			this.func = new Function("document", "register", this.text);
		},

		/**
		 * Text of the generated function.
		 * @member {string}
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
		 * @param {string[]} dependencies - List of variables referenced in `statement.
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
					var textNodeName = childName + "t" + (idx + 1);

					// code to create DOM text node
					this.buildText.push(
						"var " + textNodeName + " = document.createTextNode(" + child.expr + ");",
						nodeName + ".appendChild(" + textNodeName + ");"
					);

					// watch for widget property changes and update DOM text node
					this.generateWatchCode(child.dependsOn, textNodeName + ".nodeValue = " + child.expr);
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
			/* jshint maxcomplexity:11*/
			// Helper string for setting up attach-point(s), ex: "this.foo = this.bar = ".
			var ap = (templateNode.attachPoints || []).map(function (n) {
				return  "this." + n + " = ";
			}).join("");

			// Create node
			if (createNode) {
				this.buildText.push(
					"var " + nodeName + " = " + ap + (templateNode.xmlns ?
					"document.createElementNS('" + templateNode.xmlns + "', '" + templateNode.tag + "');" :
					"register.createElement('" + templateNode.tag + "');")
				);
			} else if (ap) {
				// weird case that someone set attach-point on root node
				this.buildText.push(ap + nodeName + ";");
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
				this.buildText.push(codeToSetProp + ";");

				// watch for changes and update property/attribute
				this.generateWatchCode(info.dependsOn, codeToSetProp);
			}

			// If this node is a custom element, make it immediately display the property changes I've made
			if (/-/.test(templateNode.tag)) {
				this.buildText.push(nodeName + ".deliver();");
				this.observeText.push(nodeName + ".deliver();");
			}

			// Setup connections
			for (var type in templateNode.connects) {
				var handler = templateNode.connects[type];
				var callback = /^[a-zA-Z0-9_]+$/.test(handler) ?
					"this." + handler + ".bind(this)" :		// standard case, connecting to a method in the widget
					"function(event){" + handler + "}";	// connect to anon func, ex: on-click="g++;". used by dapp.
				this.buildText.push("this.on('" + type + "', " + callback + ", " + nodeName  + ");");
			}

			// Create descendant Elements and text nodes
			this.generateNodeChildrenCode(nodeName, templateNode.children);
		}
	});

	// Export helper funcs so they can be used by handlebars.js
	Template.getElement = getElement;
	Template.getProp = getProp;

	return Template;
});