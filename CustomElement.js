/** @module delite/CustomElement */
define([
	"dcl/advise",
	"dcl/dcl",
	"ibm-decor/Destroyable",
	"ibm-decor/Stateful",
	"requirejs-dplugins/has",
	"./on"
], function (
	advise,
	dcl,
	Destroyable,
	Stateful,
	has,
	on
) {

	/**
	 * Dispatched after the CustomElement has been attached.
	 * This is useful to be notified when an HTMLElement has been upgraded to a
	 * CustomElement and attached to the DOM, in particular on browsers supporting native Custom Element.
	 * @example
	 * element.addEventListener("customelement-attached", function (evt) {
	 *      console.log("custom element: "+evt.target.id+" has been attached");
	 * });
	 * @event module:delite/CustomElement#customelement-attached
	 */

	/**
	 * Get a property from a dot-separated string, such as "A.B.C".
	 * Returns undefined to indicate the object doesn't exist (although that
	 * could also mean that the object does exist, but its value is "undefined".
	 */
	function getObject (name) {
		if (!name) {
			return;
		}
		var context = this,   // "this" is the global object (i.e. window on browsers)
			parts = name.split(".");
		while (context && parts.length) {
			context = context[parts.shift()];
		}
		return context;
	}

	/**
	 * Base class for all custom elements.
	 *
	 * Use this class rather that delite/Widget for non-visual custom elements.
	 *
	 * @mixin module:delite/CustomElement
	 * @augments module:decor/Stateful
	 * @augments module:decor/Destroyable
	 */
	var CustomElement = dcl([Stateful, Destroyable], /** @lends module:delite/CustomElement# */{
		declaredClass: "delite/CustomElement",

		instrument: function () {
			var prototype = Object.getPrototypeOf(this);
			var pcm = prototype._propCaseMap = {};

			// Set up this._propCaseMap, a mapping from lowercase property name to actual name,
			// ex: iconclass --> iconClass, including the methods, but excluding
			// props like "style" that are merely inherited from HTMLElement.

			for (var proto = prototype;
				proto && proto !== this._BaseHTMLElement.prototype;
				proto = Object.getPrototypeOf(proto)
			) {
				Object.keys(proto).forEach(function (prop) {
					pcm[prop.toLowerCase()] = prop;
				});
			}
		},

		/**
		 * Set to true when `constructor()` has completed.
		 * @member {boolean}
		 * @protected
		 */
		created: false,

		/**
		 * Called when the custom element is created, or when a custom tag is parsed.
		 *
		 * This method is automatically chained, so subclasses generally do not need to use `dcl.superCall()`,
		 * `dcl.advise()`, etc.
		 * @method
		 * @protected
		 */
		constructor: dcl.advise({
			before: function () {
				// Set up this.constructor._propCaseMap, a mapping from lowercase property name to actual name,
				// ex: iconclass --> iconClass, including the methods, but excluding
				// props like "style" that are merely inherited from HTMLElement.
				if (!this.constructor._propCaseMap) {
					var pcm = this.constructor._propCaseMap = {};
					for (var proto = Object.getPrototypeOf(this);
						proto && proto !== this._BaseHTMLElement.prototype;
						proto = Object.getPrototypeOf(proto)
					) {
						Object.keys(proto).forEach(function (prop) {
							pcm[prop.toLowerCase()] = prop;
						});
					}
				}
			},

			after: function () {
				this.created = true;
			}
		}),

		/**
		 * Set to true when `connectedCallback()` has completed, and false when `disconnectedCallback()` called.
		 * @member {boolean}
		 * @protected
		 */
		attached: false,

		/**
		 * Apply parameters that were specified as attributes on the custom element root node.
		 * On Safari (and maybe other browsers), the attributes sometimes aren't available until
		 * connectedCallback().  It's part of the black magic of calling constructor() for elements that
		 * already exist.  (Of course, only parse the attributes the first time the element is connected.)
		 */
		applyAttributes: function () {
			if (!this._parsedAttributes) {
				this._parsedAttributes = this._mapAttributes();
				this._parsedAttributes.forEach(function (pa) {
					if (pa.event) {
						this.on(pa.event, pa.callback);
					} else {
						this[pa.prop] = pa.value;
					}
				}, this);
			}
		},

		/**
		 * Called automatically when the element is added to the document, after `constructor()` completes.
		 * This method is automatically chained, so subclasses generally do not need to use `dcl.superCall()`,
		 * `dcl.advise()`, etc.
		 * @method
		 * @fires module:delite/CustomElement#customelement-attached
		 */
		connectedCallback: dcl.advise({
			// TODO: switch to standard around advice?
			before: function () {
				this.applyAttributes();
			},

			after: function () {
				this.deliver();

				this.attached = true;

				this.emit("customelement-attached", {
					bubbles: false,
					cancelable: false
				});
			}
		}),

		/**
		 * Called when the element is removed the document.
		 * This method is automatically chained, so subclasses generally do not need to use `dcl.superCall()`,
		 * `dcl.advise()`, etc.
		 */
		disconnectedCallback: function () {
			this.attached = false;
		},

		/**
		 * Returns value for widget property based on attribute value in markup.
		 * @param {string} name - Name of widget property.
		 * @param {string} value - Value of attribute in markup.
		 * @private
		 */
		_parsePrototypeAttr: function (name, value) {
			// inner function useful to reduce cyclomatic complexity
			function stringToObject (str) {
				var obj;

				try {
					// TODO: remove this code if it isn't being used, so we don't scare people that are afraid of eval.
					// This will only be executed when complex parameters are used in markup
					// <my-tag constraints="max: 3, min: 2"></my-tag>
					// This can be avoided by using such complex parameters only programmatically or by not using
					// them at all.
					// This is harmless if you make sure the JavaScript code that is passed to the attribute
					// is harmless.
					obj = eval("(" + (str[0] === "{" ? "" : "{") + str + (str[0] === "{" ? "" : "}") + ")");
				}
				catch (e) {
					throw new SyntaxError("Error in attribute conversion to object: " + e.message +
						"\nAttribute Value: '" + str + "'");
				}
				return obj;
			}

			switch (typeof this[name]) {
			case "string":
				return value;
			case "number":
				return value - 0;
			case "boolean":
				return value !== "false";
			case "object":
				// Try to interpret value as global variable, ex: store="myStore", array of strings
				// ex: "1, 2, 3", or expression, ex: constraints="min: 10, max: 100"
				return getObject(value) ||
					(Array.isArray(this[name]) ? (value ? value.split(/,\s*/) : []) : stringToObject(value));
			case "function":
				return this.parseFunctionAttribute(value, []);
			}
		},

		/**
		 * Helper to parse function attribute in markup.  Unlike `_parsePrototypeAttr()`, does not require a
		 * corresponding widget property.  Functions can be specified as global variables or as inline javascript:
		 *
		 * ```html
		 * <my-widget funcAttr="globalFunction" on-click="console.log(event.pageX);">
		 * ```
		 *
		 * @param {string} value - Value of the attribute.
		 * @param {string[]} params - When generating a function from inline javascript, give it these parameter names.
		 * @protected
		 */
		parseFunctionAttribute: function (value, params) {
			// new Function() will only be executed if you have properties that are of function type in your widget
			// and that you use them in your tag attributes as follows:
			// <my-tag whatever="console.log(param)"></my-tag>
			// This can be avoided by setting the function programmatically or by not setting it at all.
			// This is harmless if you make sure the JavaScript code that is passed to the attribute is harmless.
			// Use Function.bind to get a partial on Function constructor (trick to call it with an array
			// of args instead list of args).
			return getObject(value) ||
				new (Function.bind.apply(Function, [undefined].concat(params).concat([value])))();
		},

		/**
		 * Helper for parsing declarative widgets.  Interpret a given attribute specified in markup, returning either:
		 *
		 * - `undefined`: ignore
		 * - `{prop: prop, value: value}`: set `this[prop] = value`
		 * - `{event: event, callback: callback}`: call `this.on(event, callback)`
		 *
		 * @param {string} name - Attribute name.
		 * @param {string} value - Attribute value.
		 * @protected
		 */
		parseAttribute: function (name, value) {
			var pcm = this.constructor._propCaseMap;
			if (name in pcm) {
				name =  pcm[name]; // convert to correct case for widget
				return {
					prop: name,
					value: this._parsePrototypeAttr(name, value)
				};
			} else if (/^on-/.test(name)) {
				return {
					event: name.substring(3),
					callback: this.parseFunctionAttribute(value, ["event"])
				};
			}
		},

		/**
		 * Parse declaratively specified attributes for widget properties and connects.
		 * @returns {Array} Info about the attributes and their values as returned by `parseAttribute()`.
		 * @private
		 */
		_mapAttributes: function () {
			var attr,
				idx = 0,
				parsedAttrs = [],
				attrsToRemove = [];

			while ((attr = this.attributes[idx++])) {
				var name = attr.name.toLowerCase();	// note: will be lower case already except for IE9
				var parsedAttr = this.parseAttribute(name, attr.value);
				if (parsedAttr) {
					parsedAttrs.push(parsedAttr);
					attrsToRemove.push(attr.name);
				}
			}

			// Remove attributes that were processed, but do it in a separate loop so we don't modify this.attributes
			// while we are looping through it.   (See CustomElement-attr.html test failure on IE10.)
			attrsToRemove.forEach(this.removeAttribute, this);

			return parsedAttrs;
		},

		/**
		 * Release resources used by this custom element and its descendants.
		 * After calling this method, the element can no longer be used,
		 * and should be removed from the document.
		 */
		destroy: function () {
			// Destroy descendants
			this.findCustomElements().forEach(function (w) {
				if (w.destroy) {
					w.destroy();
				}
			});

			if (this.parentNode) {
				this.parentNode.removeChild(this);
				this.disconnectedCallback();
			}
		},

		/**
		 * Emits a synthetic event of specified type, based on eventObj.
		 * @param {string} type - Name of event.
		 * @param {Object} [eventObj] - Properties to mix in to emitted event.  Can also contain
		 * `bubbles` and `cancelable` properties to control how the event is emitted.
		 * @param {Element} [node] - Element to emit event on, defaults to `this`.
		 * @returns {boolean} True if the event was *not* canceled, false if it was canceled.
		 * @example
		 * myWidget.emit("query-success", {});
		 * @protected
		 */
		emit: function (type, eventObj, node) {
			return on.emit(node || this, type, eventObj);
		},

		/**
		 * Call specified function when event occurs.
		 *
		 * Note that the function is not run in any particular scope, so if (for example) you want it to run
		 * in the element's scope you must do `myCustomElement.on("click", myCustomElement.func.bind(myCustomElement))`.
		 *
		 * Note that `delite/Widget` overrides `on()` so that `on("focus", ...)` and `on("blur", ...) will trigger the
		 * listener when focus moves into or out of the widget, rather than just when the widget's root node is
		 * focused/blurred.  In other words, the listener is called when the widget is conceptually focused or blurred.
		 *
		 * @param {string} type - Name of event (ex: "click").
		 * @param {Function} func - Callback function.
		 * @param {Element} [node] - Element to attach handler to, defaults to `this`.
		 * @returns {Object} Handle with `remove()` method to cancel the event.
		 */
		on: function (type, func, node) {
			return on(node || this, type, func);
		},

		/**
		 * Search subtree under root returning custom elements found.
		 * @param {Element} [root] - Node to search under.
		 */
		findCustomElements: function (root) {
			var outAry = [];

			function getChildrenHelper (node) {
				for (var child = node.firstChild; child; child = child.nextSibling) {
					if (child.nodeType === 1 && /-/.test(child.tagName)) {
						outAry.push(child);
					} else {
						getChildrenHelper(child);
					}
				}
			}

			getChildrenHelper(root || this);
			return outAry;
		}
	});

	// Setup automatic chaining for lifecycle methods.
	// destroy() is chained in Destroyable.js.
	dcl.chainAfter(CustomElement, "connectedCallback");
	dcl.chainBefore(CustomElement, "disconnectedCallback");

	return CustomElement;
});
