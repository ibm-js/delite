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
		 * @param {string} value Single or space-separated string representing the classes to be toggled.
		 * @param {boolean} force A boolean value to determine whether the class should be added or removed.
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
				this._getValues(value).forEach(function (v) {
					method = classList.hasClass(node, v) ? "removeClass" : "addClass";
					classList[method](node, v);
				}, this);
			}
		},

		/**
		 * Add one or multiple classes.
		 *
		 * @param {Element} node The node.
		 * @param {string} value Single or space-separated string representing the classes to be added.
		 */
		addClass: function (node, value) {
			this._getValues(value).forEach(function (v) {
				node.classList.add(v);
			});
		},

		/**
		 * Remove one or multiple classes.
		 *
		 * @param {Element} node The node.
		 * @param {string|function} value
		 *		String or function that returns a single or space-separated
		 *		string representing the classes to be removed.
		 */
		removeClass: function (node, value) {
			this._getValues(value).forEach(function (v) {
				node.classList.remove(v);
			});
		},

		/**
		 * Determine whether the node contains a given class.
		 *
		 * @param {Element} node The node.
		 * @param {string} value String representing the class to be verified.
		 * @returns {boolean} Return true if the node contains the given class. False otherwise.
		 */
		hasClass: function (node, value) {
			return node.classList.contains(value);
		},

		/**
		 * Get value as a list and handles a space-separated string.
		 *
		 * @param {string} value
		 *		Single or space-separated string representing the classes.
		 * @returns {string[]} A single entry list or a list of string values if value is space-separated.
		 */
		_getValues: function (value) {
			if (value) {
				value = value.trim();
			}

			return value ? value.split(/\s+/) : [];
		}
	};

	return classList;
});
