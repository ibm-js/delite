/** @module delite/Stateful */
define([
	"dcl/dcl",
	"decor/Stateful"
], function (dcl, Stateful) {
	var apn = {};

	/**
	 * Helper function to map "foo" --> "_setFooAttr" with caching to avoid recomputing strings.
	 */
	function propNames(name) {
		if (apn[name]) {
			return apn[name];
		}
		var uc = name.replace(/^[a-z]|-[a-zA-Z]/g, function (c) {
			return c.charAt(c.length - 1).toUpperCase();
		});
		var ret = apn[name] = {
			p: "_" + name + "Attr",		// shadow property, since real property hidden by setter/getter
			s: "_set" + uc + "Attr",	// converts dashes to camel case, ex: accept-charset --> _setAcceptCharsetAttr
			g: "_get" + uc + "Attr"
		};
		return ret;
	}

	/**
	 * Base class for objects that provide named properties with optional getter/setter
	 * control and the ability to watch for property changes.
	 *
	 * The class also provides the functionality to auto-magically manage getters
	 * and setters for class attributes/properties.  Note though that expando properties
	 * (i.e. properties added to an instance but not in the prototype) are not supported.
	 *
	 * Getters and Setters should follow the format of `_setXxxAttr` or `_getXxxAttr` where
	 * the xxx is a name of the attribute to handle.  So an attribute of `foo`
	 * would have a custom getter of `_getFooAttr` and a custom setter of `_setFooAttr`.
	 * Setters must save and announce the new property value by calling `this._set("foo", val)`,
	 * and getters should access the property value as `this._get("foo")`.
	 *
	 * @example <caption>Example 1</caption>
	 * var MyClass = dcl(Stateful, { foo: "initial" });
	 * var obj = new MyClass();
	 * obj.watch("foo", function(){
	 *    console.log("foo changed to " + this.foo);
	 * });
	 * obj.foo = bar;
	 * // Stateful by default interprets the first parameter passed to
	 * // the constructor as a set of properties to set on the widget 
	 * // immediately after it is created.
	 *
	 * @example <caption>Example 2</caption>
	 * var MyClass = dcl(Stateful, { foo: "initial" });
	 * var obj = new MyClass({ foo: "special"});
	 *
	 * @mixin module:delite/Stateful
	 */
	return dcl(Stateful, {
		_set: dcl.superCall(function (sup) {
			return function (name, value) {
				var oldValue = this[propNames(name).p];
				sup.apply(this, arguments);
				if (this._watchCallbacks) {
					this._watchCallbacks(name, oldValue, value);
				}
			};
		}),

		notifyCurrentValue: dcl.superCall(function (sup) {
			return function (name) {
				var value = this[propNames(name).p];
				sup.apply(this, arguments);
				if (this._watchCallbacks) {
					this._watchCallbacks(name, value, value); // Old and current are the same here
				}
			};
		}),

		/**
		 * Watches a property for changes.
		 * @param {string} name - Indicates the property to watch.
		 * @param {Function} callback - The function to execute when the property changes.  This will be called after
		 * the property has been changed. The callback will be called with the `this`
		 * set to the instance, the first argument as the name of the property, the
		 * second argument as the old value and the third argument as the new value.
		 * @returns {Object} An object handle for the watch.  The unwatch method of this object
		 * can be used to discontinue watching this property:
		 *
		 * ```js
		 * var watchHandle = obj.watch("foo", callback);
		 * watchHandle.unwatch(); // callback won't be called now
		 * ```
		 */
		watch: function (name, callback) {
			// TODO(asudoh): Remove this function once we finish the transition
			console.warn("Stateful.watch() is deprecated. To be removed soon. Use Stateful.observe() instead.");

			var callbacks = this._watchCallbacks;
			if (!callbacks) {
				var self = this;
				Object.defineProperty(this, "_watchCallbacks", { // Make _watchCallbacks() not enumerable
					value: callbacks = function (name, oldValue, value, ignoreCatchall) {
						var notify = function (propertyCallbacks) {
							if (propertyCallbacks) {
								propertyCallbacks = propertyCallbacks.slice();
								for (var i = 0, l = propertyCallbacks.length; i < l; i++) {
									propertyCallbacks[i].call(self, name, oldValue, value);
								}
							}
						};
						notify(callbacks["_" + name]);
						if (!ignoreCatchall) {
							notify(callbacks["*"]); // the catch-all
						}
					},
					configurable: true,
					writable: true
				}); // we use a function instead of an object so it will be ignored by JSON conversion
			}
			if (!callback && typeof name === "function") {
				callback = name;
				name = "*";
			} else {
				// prepend with dash to prevent name conflicts with function (like "name" property)
				name = "_" + name;
			}
			var propertyCallbacks = callbacks[name];
			if (typeof propertyCallbacks !== "object") {
				propertyCallbacks = callbacks[name] = [];
			}
			propertyCallbacks.push(callback);

			return {
				remove: function () {
					var index = propertyCallbacks.indexOf(callback);
					if (index > -1) {
						propertyCallbacks.splice(index, 1);
					}
				}
			}; //Object
		}
	});
});
