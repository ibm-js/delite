/**
 * Element.classList utility functions
 * @module delite/classlist
 * */
define([], function () {

	var classList = /** @lends module:delite/classList */ {

		/**
		 * Execute a classList method on a given node.
		 *
		 * @param {Element} node The node.
		 * @param {string} values Single or space-separated string representing the classes.
		 * @param {string} method The method. Should be one of "add", "remove" or "toggle".
		 */
		process: function (node, values, method) {
			if (values) {
				values = values.trim();

				if (values !== "") {
					values.split(/\s+/).forEach(function (v) {
						node.classList[method](v);
					});
				}
			}
		},

		/**
		 * Toggle one or multiple classes helper method.
		 *
		 * @param {HTMLElement} node The node.
		 * @param {string} value Single or space-separated string representing the classes to be toggled.
		 * @param {boolean} [force] A boolean value to determine whether the class should be added or removed.
		 */
		toggleClass: function (node, value, force) {
			this.process(node, value, force ? "add" : force === false ? "remove" : "toggle");
		},

		/**
		 * Add one or multiple classes.
		 *
		 * @param {Element} node The node.
		 * @param {string} value Single or space-separated string representing the classes to be added.
		 */
		addClass: function (node, value) {
			this.process(node, value, "add");
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
			this.process(node, value, "remove");
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
		}
	};

	return classList;
});