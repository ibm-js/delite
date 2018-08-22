/**
 *	When has("bidi") is true, delite/Widget will mix in the properties in this module.
 *	It enables support for the `textdir` property to control text direction independently from the GUI direction.
 * @module delite/Bidi
 */
define([
	"./features"
], function (has) {

	// UCC - constants that will be used by bidi support.
	var LRE = "\u202A",
		RLE = "\u202B",
		PDF = "\u202C";

	return /** @lends module:delite/Bidi */ {
		declaredClass: "delite/Bidi",

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
		 * Return the direction setting for the page itself, or if `has("inherited-dir")` is defined and the widget is
		 * attached to the page, then return the dir setting inherited from any ancestor node.
		 * @returns {string} "ltr" or "rtl"
		 * @protected
		 */
		getInheritedDir: function () {
			return this._inheritedDir || this.ownerDocument.body.dir || this.ownerDocument.documentElement.dir || "ltr";
		},

		connectedCallback: function () {
			if (has("inherited-dir")) {
				// Now that the widget is attached to the DOM, need to retrigger computation of effectiveDir.
				this._inheritedDir = window.getComputedStyle(this, null).direction;
				this.notifyCurrentValue("dir");
				this.deliver();
			}
		},

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
			var textDir = this.textDir;
			return textDir === "auto" ? this._checkContextual(text) :
				(/^(rtl|ltr)$/i).test(textDir) ? textDir : this.effectiveDir;
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
			return fdc ? (fdc[0] <= "z" ? "ltr" : "rtl") : this.effectiveDir;
		},

		/**
		 * Set element.dir according to this.textDir.
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
			else {
				element.dir = this.effectiveDir;
			}
		},

		/**
		 * Enforce base direction of the given text according to this.textDir.
		 *
		 * @param {string} text
		 * @returns {string}
		 * @protected
		 */
		applyTextDirection: function (text) {
			if (this.textDir) {
				return this.wrapWithUcc(this.removeUcc(text));
			} else {
				return this.removeUcc(text);
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
			return (this.getTextDir(text) === "ltr" ? LRE : RLE) + text + PDF;
		},

		/**
		 * Removes UCC from specified text.
		 *
		 * @param {string} text
		 * @returns {string}
		 * @protected
		 */
		removeUcc: function (text) {
			return text && text.replace(/[\u200E\u200F\u202A-\u202C]/g, "");
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
			node.innerHTML = this.applyTextDirection(node.innerHTML);
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
