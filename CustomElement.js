/** @module delite/CustomElement */
define([
	"dcl/dcl",
	"dojo/_base/lang",
	"dojo/on",
	"./Destroyable",
	"./Stateful"
], function (dcl, lang, on, Destroyable, Stateful) {

	// Need to pass in "global" parameter to lang.getObject() to workaround
	// https://bugs.dojotoolkit.org/ticket/17829

	var global = (function () { return this; })();

	/**
	 * Base class for all custom elements.
	 *
	 * Use this class rather that delite/Widget for non-visual custom elements.
	 * Custom elements can provide custom setters/getters for properties, which are called automatically
	 * when the value is set.  For an attribute XXX, define methods _setXXXAttr() and/or _getXXXAttr().
	 *
	 * @mixin module:delite/CustomElement
	 * @augments module:delite/Stateful
	 * @augments module:delite/Destroyable
	 */
	return dcl([Stateful, Destroyable], /** @lends module:delite/CustomElement# */{
		_getProps: function () {
			// Override _Stateful._getProps() to ignore properties from the HTML*Element superclasses, like "style".
			// You would need to explicitly declare style: "" in your widget to get it here.
			// Intentionally skips privates and methods, because it seems wasteful to have a custom
			// setter for every method; not sure that would work anyway.
			//
			// Also sets up this._propCaseMap, a mapping from lowercase property name to actual name,
			// ex: iconclass --> iconClass, which does include the methods, but again doesn't
			// include props like "style" that are merely inherited from HTMLElement.

			var list = [], proto = this, ctor,
				pcm = this._propCaseMap = {};

			do {
				Object.keys(proto).forEach(function (prop) {
					if (!/^_/.test(prop)) {
						if (typeof proto[prop] !== "function") {
							list.push(prop);
						}
						pcm[prop.toLowerCase()] = prop;
					}
				});

				proto = Object.getPrototypeOf(proto);
				ctor = proto && proto.constructor;
			} while (proto && ctor !== this._baseElement);

			return list;
		},

		createdCallback: dcl.advise({
			before: function () {
				// Get parameters that were specified declaratively on the widget DOMNode.
				this._parsedAttributes = this._mapAttributes();

				// FF has a native watch() method that overrides our Stateful.watch() method and breaks custom setters,
				// so that any command like this.label = "hello" sets label to undefined instead.  Try to workaround.
				this.watch = Stateful.prototype.watch;
			},

			after: function () {
				this._created = true;

				// Now that creation has finished, apply parameters that were specified declaratively.
				// This is consistent with the timing that parameters are applied for programmatic creation.
				this._parsedAttributes.forEach(function (pa) {
					if (pa.event) {
						this.on(pa.event, pa.callback);
					} else {
						this[pa.prop] = pa.value;
					}
				}, this);
			}
		}),

		/**
		 * Returns value for widget property based on attribute value in markup.
		 * @param {string} name - Name of widget property.
		 * @param {string} value - Value of attribute in markup.
		 * @private
		 */
		_parsePrototypeAttr: function (name, value) {
			// inner function useful to reduce cyclomatic complexity when using jshint
			function stringToObject(value) {
				var obj;

				try {
					// TODO: remove this code if it isn't being used, so we don't scare people that are afraid of eval.
					/* jshint evil:true */
					// This will only be executed when complex parameters are used in markup
					// <my-tag constraints="max: 3, min: 2"></my-tag>
					// This can be avoided by using such complex parameters only programmatically or by not using
					// them at all.
					// This is harmless if you make sure the JavaScript code that is passed to the attribute
					// is harmless.
					obj = eval("(" + (value[0] === "{" ? "" : "{") + value + (value[0] === "{" ? "" : "}") + ")");
				}
				catch (e) {
					throw new SyntaxError("Error in attribute conversion to object: " + e.message +
						"\nAttribute Value: '" + value + "'");
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
				return lang.getObject(value, false, global) ||
					(this[name] instanceof Array ? (value ? value.split(/\s+/) : []) : stringToObject(value));
			case "function":
				return this._parseFunctionAttr(value, []);
			}
		},

		/**
		 * Helper to parse function attribute in markup.  Unlike _parsePrototypeAttr(), does not require a
		 * corresponding widget property.  Functions can be specified as global variables or as inline javascript:
		 *
		 * ```
		 * <my-widget funcAttr="globalFunction" on-click="console.log(event.pageX);">
		 * ```
		 *
		 * @param {string} value - Value of the attribute.
		 * @param {string[]} params - When generating a function from inline javascript, give it these parameter names.
		 * @protected
		 */
		_parseFunctionAttr: function (value, params) {
			/* jshint evil:true */
			// new Function() will only be executed if you have properties that are of function type in your widget
			// and that you use them in your tag attributes as follows:
			// <my-tag whatever="console.log(param)"></my-tag>
			// This can be avoided by setting the function programmatically or by not setting it at all.
			// This is harmless if you make sure the JavaScript code that is passed to the attribute is harmless.
			// Use Function.bind to get a partial on Function constructor (trick to call it with an array
			// of args instead list of args).
			return lang.getObject(value, false, global) ||
				new (Function.bind.apply(Function, [undefined].concat(params).concat([value])))();
		},

		/**
		 * Helper for _mapAttributes().  Interpret a given attribute specified in markup, returning either:
		 *
		 * - undefined: ignore
		 * - {prop: prop, value: value}: set this[prop] = value
		 * - {event: event, callback: callback}: call this.on(event, callback);
		 *
		 * @param {string} name - Attribute name.
		 * @param {string} value - Attribute value.
		 * @protected
		 */
		_parseAttr: function (name, value) {
			var pcm = this._propCaseMap;
			if (name in pcm) {
				name =  pcm[name]; // convert to correct case for widget
				return {
					prop: name,
					value: this._parsePrototypeAttr(name, value)
				};
			} else if (/^on-/.test(name)) {
				return {
					event: name.substring(3),
					callback: this._parseFunctionAttr(value, ["event"])
				};
			}
		},

		/**
		 * Parse declaratively specified attributes for widget properties and connects.
		 * @returns {Array} Info about the attributes and their values as returned by _parseAttr().
		 * @private
		 */
		_mapAttributes: function () {
			var attr,
				idx = 0,
				parsedAttrs = [],
				attrsToRemove = [];

			while ((attr = this.attributes[idx++])) {
				var name = attr.name.toLowerCase();	// note: will be lower case already except for IE9
				var parsedAttr = this._parseAttr(name, attr.value);
				if (parsedAttr) {
					parsedAttrs.push(parsedAttr);
					attrsToRemove.push(attr);
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
			}
		},

		/**
		 * Signal that a synthetic event occurred.
		 *
		 * Emits an event of specified type, based on eventObj.
		 * Also calls onType() method, if present, and returns value from that method.
		 * Modifies eventObj by adding missing parameters (bubbles, cancelable, widget).
		 *
		 * @param {string} type - Name of event.
		 * @param {Object} [eventObj] - Properties to mix in to emitted event.
		 * @returns {boolean} Whether or not the event was prevented.
		 * @example
		 * myWidget.emit("query-success", {});
		 * @protected
		 */
		emit: function (type, eventObj) {
			// Specify fallback values for bubbles, cancelable in case they are not set in eventObj.
			// Also set pointer to widget, although since we can't add a pointer to the widget for native events
			// (see #14729), maybe we shouldn't do it here?
			eventObj = eventObj || {};
			if (eventObj.bubbles === undefined) {
				eventObj.bubbles = true;
			}
			if (eventObj.cancelable === undefined) {
				eventObj.cancelable = true;
			}

			// Emit event, but (for the case of the Widget subclass)
			// avoid spurious emit()'s as parent sets properties on child during startup/destroy
			if (this._started !== false && !this._beingDestroyed) {
				return on.emit(this, type, eventObj);
			}
		},

		/**
		 * Call specified function when event occurs.
		 *
		 * Note that the function is not run in any particular scope, so if (for example) you want it to run
		 * in the widget's scope you must do `myWidget.on("click", myWidget.func.bind(myWidget))`.
		 * @param {string|Function} type - Name of event (ex: "click") or extension event like `touch.press`.
		 * @param {Function} func - Callback function.
		 */
		on: function (type, func) {
			return this.own(on(this, type, func))[0];
		},

		// Utility functions previously in registry.js

		/**
		 * Search subtree under root returning custom elements found.
		 * @param {Element} [root] Node to search under.
		 */
		findCustomElements: function (root) {
			var outAry = [];

			function getChildrenHelper(root) {
				for (var node = root.firstChild; node; node = node.nextSibling) {
					if (node.nodeType === 1 && node.createdCallback) {
						outAry.push(node);
					} else {
						getChildrenHelper(node);
					}
				}
			}

			getChildrenHelper(root || this);
			return outAry;
		}
	});
});
