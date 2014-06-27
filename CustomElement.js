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

	var div = document.createElement("div"),
		global = (function () { return this; })();

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
				this._declaredParams = this._mapAttributes();

				// FF has a native watch() method that overrides our Stateful.watch() method and breaks custom setters,
				// so that any command like this.label = "hello" sets label to undefined instead.  Try to workaround.
				this.watch = Stateful.prototype.watch;
			},

			after: function () {
				this._created = true;

				// Now that creation has finished, apply parameters that were specified declaratively.
				// This is consistent with the timing that parameters are applied for programmatic creation.
				dcl.mix(this, this._declaredParams);
			}
		}),

		/**
		 * Get declaratively specified attributes for widget properties.
		 * @returns {Object} Hash mapping attribute names to their values.
		 * @private
		 */
		_mapAttributes: function () {
			var pcm = this._propCaseMap,
				attr,
				idx = 0,
				props = {};

			// inner functions useful to reduce cyclomatic complexity when using jshint
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

			function setTypedValue(widget, name, value) {
				switch (typeof widget[name]) {
				case "string":
					props[name] = value;
					break;
				case "number":
					props[name] = value - 0;
					break;
				case "boolean":
					props[name] = value !== "false";
					break;
				case "object":
					// Search for value as global variable.
					var obj = lang.getObject(value, false, global);
					if (obj) {
						// it's a global, ex: store="myStore"
						props[name] = obj;
					} else {
						// it's an expression, ex: constraints="min: 10, max: 100"
						props[name] = (widget[name] instanceof Array)
							? (value
							? value.split(/\s+/)
							: [])
							: stringToObject(value);
					}
					break;
				case "function":
					props[name] = lang.getObject(value, false, global);
					if (!props[name]) {
						var functionString = widget[name].toString().replace(/(\/\*([\s\S]*?)\*\/)|(\/\/(.*)$)/gm, "");
						var functionArgs = functionString.match(/^function\s*[^\(]*\(\s*([^\)]*)\)/m)[1].split();
						functionArgs.unshift(undefined);
						functionArgs.push(value);
						// use Function.bind to get a partial on Function constructor (trick to call it with an array 
						// of args instead list of args)
						/* jshint evil:true */
						// This will only be executed if you have properties that are of function type in your widget
						// and that you use them in your tag attributes as follows:
						// <my-tag whatever="console.log(param)"></my-tag>
						// This can be avoided by setting the function progammatically or by not setting it at all.
						// This is harmless if you make sure the JavaScript code that is passed to the attribute
						// is harmless.
						props[name] = new (Function.bind.apply(Function, functionArgs))();
					}
				}
				delete widget[name]; // make sure custom setters fire
			}

			var attrsToRemove = [];
			while ((attr = this.attributes[idx++])) {
				// Map all attributes except for things like onclick="..." since the browser already handles them.
				var name = attr.name.toLowerCase();	// note: will be lower case already except for IE9
				if (name in pcm) {
					setTypedValue(this, pcm[name]/* convert to correct case for widget */, attr.value);
					attrsToRemove.push(name);
				}
			}

			// Remove attributes that were processed, but do it in a separate loop so we don't modify this.attributes
			// while we are looping through it.   (See CustomElement-attr.html test failure on IE10.)
			attrsToRemove.forEach(this.removeAttribute, this);

			return props;
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
				// Call onType() method if one exists.   But skip functions like onchange and onclick
				// because the browser will call them automatically when the event is emitted.
				var ret, callback = this["on" + type];
				if (callback && !("on" + type.toLowerCase() in div)) {
					ret = callback.call(this, eventObj);
				}

				// Emit the event
				on.emit(this, type, eventObj);
			}

			return ret;
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
