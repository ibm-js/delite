/**
 * Element.classList utility functions
 * @module delite/classlist
 * */
define([], function () {

	var classList = /** @lends module:delite/classList */ {
		/**
		 * Toggle one or multiple classes helper method.
		 *
		 * @param {HTMLElement} node The node.
		 * @param {String|Function} value
		 *		String or function that returns a single or space-separated
		 *		string representing the classes to be toggled.
		 * @param {Boolean} force
		 */
		toggleClass: function (node, value, force) {
			if (force === true) {
				classList.addClass(node, value);
			}
			else if (force === false) {
				classList.removeClass(node, value);
			}
			else {
				var method;
				this._getValues(node, value).forEach(function (v) {
					method = classList.hasClass(node, v) ? "removeClass" : "addClass";
					classList[method](node, v);
				}, this);
			}
		},

		/**
		 * Add one or multiple classes.
		 *
		 * @param {HTMLElement} node The node.
		 * @param {String|Function} value
		 *		String or function that returns a single or space-separated
		 *		string representing the classes to be added.
		 */
		addClass: function (node, value) {
			if (value) {
				node.classList.add.apply(node.classList, this._getValues(node, value));
			}
		},

		/**
		 * Remove one or multiple classes.
		 *
		 * @param {HTMLElement} node The node.
		 * @param {String|Function} value
		 *		String or function that returns a single or space-separated
		 *		string representing the classes to be removed.
		 */
		removeClass: function (node, value) {
			if (value) {
				node.classList.remove.apply(node.classList, this._getValues(node, value));
			}
		},

		/**
		 * Determine whether the node contains a given class.
		 *
		 * @param {HTMLElement} node The node.
		 * @param {String|Function} value
		 * @returns {Boolean} Return true if the node contains the given class. False otherwise.
		 */
		hasClass: function (node, value) {
			return node.classList.contains(value);
		},

		/**
		 * Get value as a list and handles a space-separated string.
		 *
		 * @param {Element} node
		 * @param {String|Function} value
		 *		String or function that returns a single or space-separated
		 *		string representing the classes to be toggled.
		 * @returns {Array} A single entry list or a list of values if value is space-separated.
		 */
		_getValues: function (node, value) {
			var values = [];

			// If value is a function evaluate using node as the scope
			if (typeof value === "function") {
				value = value.apply(node);
			}

			if (!value) {
				return values;
			}

			value = value.toString().trim();

			if (value !== "") {
				values.push(value);

				if (value.indexOf(" ") >= 0) {
					values = value.split(" ");
				}
			}

			return values;
		}
	};

	return classList;
});
