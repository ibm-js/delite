/**
 * Element.classList utility functions
 * @module delite/classlist
 * */
define([], function () {

	var classList = /** @lends module:delite/classList */ {
		/**
		 * Toggle one or multiple classes helper method.
		 *
		 * @param {Element} node
		 * @param {String} value
		 * @param {Boolean} force
		 */
		toggleClass: function (node, value, force) {
			if (value && value.trim() !== "") {
				if (force === true) {
					classList.addClass(node, value);
				}
				else if (force === false) {
					classList.removeClass(node, value);
				}
				else {
					var method;
					this._getValues(value).forEach(function (v) {
						method = node.classList.contains(v) ? "removeClass" : "addClass";
						classList[method](node, v);
					}, this);
				}
			}
		},

		/**
		 * Add one or multiple classes.
		 *
		 * @param {Element} node
		 * @param {String} value Single or space-separated string representing the classes to be added.
		 */
		addClass: function (node, value) {
			if (value && value.trim() !== "") {
				node.classList.add.apply(node.classList, this._getValues(value));
			}
		},

		/**
		 * Remove one or multiple classes.
		 *
		 * @param {Element} node
		 * @param {String} value Single or space-separated string representing the classes to be removed.
		 */
		removeClass: function (node, value) {
			if (value && value.trim() !== "") {
				node.classList.remove.apply(node.classList, this._getValues(value));
			}
		},

		/**
		 * Get value as a list and handles a space-separated string.
		 *
		 * @param {String} value Single or space-separated string.
		 * @returns {Array} A single entry list or a list of values if value is space-separated.
		 */
		_getValues: function (value) {
			var values = [value];

			if (values[0].indexOf(" ") >= 0) {
				values = values[0].split(" ");
			}

			return values;
		}
	};

	return classList;
});
