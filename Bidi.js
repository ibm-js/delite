/**
 *	When has("bidi") is true, delite/Widget will mix in the properties in this module.
 *	It enables support for the `textdir` property to control text direction independently from the GUI direction.
 * @module delite/Bidi
 */
define([], function () {

	// UCC - constants that will be used by bidi support.
	var LRE = "\u202A",
		RLE = "\u202B",
		PDF = "\u202C";

	return /** @lends module:delite/Bidi */ {

		/**
		 * Bi-directional support, the main variable which is responsible for the direction of the text.
		 * The text direction can be different than the GUI direction by using this parameter in creation
		 * of a widget.
		 *
		 * Allowed values:
		 *
		 * 1. "ltr"
		 * 2. "rtl"
		 * 3. "auto" - contextual the direction of a text defined by first strong letter.
		 *
		 * By default is as the page direction.
		 */
		textDir: "",

		/**
		 * Returns the right direction of text.
		 *
		 * If textDir is ltr or rtl, returns the value.
		 * If it's auto, calls to another function that's responsible
		 * for checking the value, and defining the direction.
		 *
		 * @param {string} text
		 * @returns {string} ltr or rtl
		 * @protected
		 */
		getTextDir: function (text) {
			return this.textDir === "auto" ? this._checkContextual(text) : this.textDir;
		},

		/**
		 * Finds the first strong (directional) character, return ltr if isLatin or rtl if isBidiChar.
		 *
		 * @param {string} text
		 * @returns {string} ltr or rtl
		 * @private
		 */
		_checkContextual: function (text) {
			// look for strong (directional) characters
			var fdc = /[A-Za-z\u05d0-\u065f\u066a-\u06ef\u06fa-\u07ff\ufb1d-\ufdff\ufe70-\ufefc]/.exec(text);
			// if found return the direction that defined by the character, else return widgets dir as default.
			return fdc ? (fdc[0] <= "z" ? "ltr" : "rtl") : this.dir ? this.dir : this.isLeftToRight() ? "ltr" : "rtl";
		},

		/**
		 * Set element.dir according to this.textDir, assuming this.textDir has a value.
		 *
		 * @param {HTMLElement} element - The text element to be set. Should have dir property.
		 * @protected
		 */
		applyTextDir: function (element) {
			if (this.textDir) {
				var textDir = this.textDir;
				if (textDir === "auto") {
					// convert "auto" to either "ltr" or "rtl"
					var tagName = element.tagName.toLowerCase();
					var text = (tagName === "input" || tagName === "textarea") ? element.value : element.textContent;
					textDir = this._checkContextual(text);
				}
				element.dir = textDir;
			}
		},

		/**
		 * Returns specified text with UCC added to enforce widget's textDir setting.
		 *
		 * @param {string} text
		 * @returns {string}
		 * @protected
		 */
		wrapWithUcc: function (text) {
			var dir = this.textDir === "auto" ? this._checkContextual(text) : this.textDir;
			return (dir === "ltr" ? LRE : RLE) + text + PDF;
		},

		/**
		 * Wraps by UCC (Unicode control characters) option's text according to this.textDir.
		 *
		 * This function saves the original text value for later restoration if needed,
		 * for example if the textDir will change etc.
		 *
		 * @param {HTMLOptionElement} node - The node we wrapping the text for.
		 * @protected
		 */
		enforceTextDirWithUcc: function (node) {
			node.originalText = node.text;
			node.innerHTML = this.wrapWithUcc(node.innerHTML);
		},

		/**
		 * Restores the text of origObj, if needed, after enforceTextDirWithUcc, for example
		 * after `myWidget.textDir = "ltr"`.  The function then removes the originalText from origObj!
		 *
		 * @param {HTMLOptionElement} origObj - The node to restore.
		 * @protected
		 */
		restoreOriginalText: function (origObj) {
			if (origObj.originalText) {
				origObj.text = origObj.originalText;
				delete origObj.originalText;
			}
		}
	};
});
