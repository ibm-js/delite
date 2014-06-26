/**
 * These functions are used to repetitively call a user specified callback
 * method when a specific key or mouse click over a specific DOM node is
 * held down for a specific amount of time.
 * Only one such event is allowed to occur on the browser page at one time.
 * @module delite/typematic
 */
define([], function () {

	// TODO: do we still need this module at all?

	// TODO: wouldn't this be easier to use as a widget base class (although we would need to make sure the function
	// names wouldn't likely conflict with other general method names)?

	var typematic = /** @lends module:delite/typematic */ {
		_fireEventAndReload: function () {
			this._timer = null;
			this._callback(++this._count, this._node, this._evt);

			// Schedule next event, timer is at most minDelay (default 10ms) to avoid
			// browser overload (particularly avoiding starving DOH robot so it never gets to send a mouseup)
			this._currentTimeout = Math.max(
				this._currentTimeout < 0 ? this._initialDelay :
					(this._subsequentDelay > 1 ? this._subsequentDelay :
						Math.round(this._currentTimeout * this._subsequentDelay)),
				this._minDelay);
			this._timer = setTimeout(this._fireEventAndReload.bind(this), this._currentTimeout);
		},

		/**
		 * Callback function passed to addKeyListener(), addMouseListener(), and addListener().
		 * @callback module:delite/typematic.TriggerCallback
		 * @param {number} count - Integer representing number of repeated calls (0..n)
		 * with -1 indicating the iteration has stopped.
		 * @param {Element} node - The DOM node object passed in.
		 * @param {Event} evt - Key or mouse event object.
		 */

		/**
		 * Start a timed, repeating callback sequence.
		 * If already started, the function call is ignored.
		 * This method is not normally called by the user but can be
		 * when the normal listener code is insufficient.
		 * @param {Event} evt - Key or mouse event object to pass to the user callback.
		 * @param {module:delite/Widget} _this - Pointer to the user's widget space.
		 * @param {Element} node - The DOM node object to pass the the callback function.
		 * @param {module:delite/typematic.TriggerCallback} callback - Function to call until the sequence is stopped.
		 * @param {Object} obj - User space object used to uniquely identify each typematic sequence.
		 * @param {number} [subsequentDelay] - If > 1, the number of milliseconds until the 3->n events occur
		 * or else the fractional time multiplier for the next event's delay, default=0.9.
		 * @param {number} [initialDelay] - The number of milliseconds until the 2nd event occurs, default=500ms.
		 * @param {number} [minDelay] - The maximum delay in milliseconds for event to fire, default=10ms.
		 */
		trigger: function (evt, _this, node, callback, obj,
				subsequentDelay, initialDelay, minDelay) {
			if (obj !== this._obj) {
				this.stop();
				this._initialDelay = initialDelay || 500;
				this._subsequentDelay = subsequentDelay || 0.90;
				this._minDelay = minDelay || 10;
				this._obj = obj;
				this._node = node;
				this._currentTimeout = -1;
				this._count = -1;
				this._callback = callback.bind(_this);
				this._evt = { faux: true };
				for (var attr in evt) {
					if (attr !== "layerX" && attr !== "layerY") { // prevent WebKit warnings
						var v = evt[attr];
						if (typeof v !== "function" && typeof v !== "undefined") {
							this._evt[attr] = v;
						}
					}
				}
				this._fireEventAndReload();
			}
		},

		/**
		 * Stop an ongoing timed, repeating callback sequence.
		 */
		stop: function () {
			if (this._timer) {
				clearTimeout(this._timer);
				this._timer = null;
			}
			if (this._obj) {
				this._callback(-1, this._node, this._evt);
				this._obj = null;
			}
		},

		/**
		 * Handle to cancel a listener.
		 * @typedef module:delite/typematic.Handle
		 * @property {Function} remove - cancel the listener
		 */

		/**
		 * Start listening for a specific typematic key.
		 * See also the trigger method for other parameters.
		 * @param {Element} node
		 * @param {Object} keyObject - An object defining the key to listen for:
		 * - keyCode: the keyCode (number) to listen for, used for non-printable keys
		 * - charCode: the charCode (number) to listen for, used for printable keys
		 * - ctrlKey: desired ctrl key state to initiate the callback sequence:
		 * - pressed (true)
		 * - released (false)
		 * - either (unspecified)
		 * - altKey: same as ctrlKey but for the alt key
		 * - shiftKey: same as ctrlKey but for the shift key
		 * @param {module:delite/Widget} _this - Pointer to the user's widget space.
		 * @param {module:delite/typematic.TriggerCallback} callback - Function to call until the sequence is stopped.
		 * @param {number} [subsequentDelay] - If > 1, the number of milliseconds until the 3->n events occur
		 * or else the fractional time multiplier for the next event's delay, default=0.9.
		 * @param {number} [initialDelay] - The number of milliseconds until the 2nd event occurs, default=500ms.
		 * @param {number} [minDelay] - The maximum delay in milliseconds for event to fire, default=10ms.
		 * @returns {module:delite/typematic.Handle} A connection handle.
		 */
		addKeyListener: function (node, keyObject, _this, callback,
				subsequentDelay, initialDelay, minDelay) {
			// Setup keydown or keypress listener depending on whether keyCode or charCode was specified.
			var type = "keyCode" in keyObject ? "keydown" : "keypress",
				attr = "keyCode" in keyObject ? "keyCode" : "charCode";

			var handles = [
				_this.on(type, function (evt) {
					if (evt[attr] === keyObject[attr] &&
						(keyObject.ctrlKey === undefined || keyObject.ctrlKey === evt.ctrlKey) &&
						(keyObject.altKey === undefined || keyObject.altKey === evt.altKey) &&
						(keyObject.metaKey === undefined || keyObject.metaKey === evt.metaKey) &&
						(keyObject.shiftKey === undefined || keyObject.shiftKey === evt.shiftKey)) {
						evt.stopPropagation();
						evt.preventDefault();
						typematic.trigger(evt, _this, node, callback, keyObject,
							subsequentDelay, initialDelay, minDelay);
					} else if (typematic._obj === keyObject) {
						typematic.stop();
					}
				}, node),
				_this.on("keyup", function () {
					if (typematic._obj === keyObject) {
						typematic.stop();
					}
				}, node)
			];
			return {
				remove: function () {
					handles.forEach(function (h) {
						h.remove();
					});
				}
			};
		},

		/**
		 * Start listening for a typematic mouse click.
		 * See also the trigger method for other parameters.
		 * @param {Element} node
		 * @param {Object} keyObject - An object defining the key to listen for:
		 * - keyCode: the keyCode (number) to listen for, used for non-printable keys
		 * - charCode: the charCode (number) to listen for, used for printable keys
		 * - ctrlKey: desired ctrl key state to initiate the callback sequence:
		 * - pressed (true)
		 * - released (false)
		 * - either (unspecified)
		 * - altKey: same as ctrlKey but for the alt key
		 * - shiftKey: same as ctrlKey but for the shift key
		 * @param {module:delite/Widget} _this - Pointer to the user's widget space.
		 * @param {module:delite/typematic.TriggerCallback} callback - Function to call untilthe sequence is stopped.
		 * @param {number} [subsequentDelay] - If > 1, the number of milliseconds until the 3->n events occur
		 * or else the fractional time multiplier for the next event's delay, default=0.9.
		 * @param {number} [initialDelay] - The number of milliseconds until the 2nd event occurs, default=500ms.
		 * @param {number} [minDelay] - The maximum delay in milliseconds for event to fire, default=10ms.
		 * @returns {module:delite/typematic.Handle} A connection handle.
		 */
		addMouseListener: function (node,  _this, callback,
				subsequentDelay, initialDelay, minDelay) {
			var handles = [
				_this.on("mousedown", function (evt) {
					evt.preventDefault();
					typematic.trigger(evt, _this, node, callback, node, subsequentDelay, initialDelay, minDelay);
				}, node),
				_this.on("mouseup", function (evt) {
					if (this._obj) {
						evt.preventDefault();
					}
					typematic.stop();
				}.bind(this), node),
				_this.on("mouseout", function (evt) {
					if (this._obj) {
						evt.preventDefault();
					}
					typematic.stop();
				}.bind(this), node),
				_this.on("dblclick", function (evt) {
					evt.preventDefault();
				}, node)
			];
			return { remove: function () {
				handles.forEach(function (h) {
					h.remove();
				});
			} };
		},

		/**
		 * Start listening for a specific typematic key and mouseclick.
		 * This is a thin wrapper to addKeyListener and addMouseListener.
		 * @param {Element} mouseNode - The DOM node object to listen on for mouse events.
		 * @param {Element} keyNodeNode - The DOM node object to listen on for key events.
		 * @param {Object} keyObject - An object defining the key to listen for:
		 * - keyCode: the keyCode (number) to listen for, used for non-printable keys
		 * - charCode: the charCode (number) to listen for, used for printable keys
		 * - ctrlKey: desired ctrl key state to initiate the callback sequence:
		 * - pressed (true)
		 * - released (false)
		 * - either (unspecified)
		 * - altKey: same as ctrlKey but for the alt key
		 * - shiftKey: same as ctrlKey but for the shift key
		 * @param {module:delite/Widget} _this - Pointer to the user's widget space.
		 * @param {module:delite/typematic.TriggerCallback} callback - Function to call until the sequence is stopped.
		 * @param {number} [subsequentDelay] - If > 1, the number of milliseconds until the 3->n events occur
		 * or else the fractional time multiplier for the next event's delay, default=0.9.
		 * @param {number} [initialDelay] - The number of milliseconds until the 2nd event occurs, default=500ms.
		 * @param {number} [minDelay] - The maximum delay in milliseconds for event to fire, default=10ms.
		 * @returns {module:delite/typematic.Handle} A connection handle.
		 */
		addListener: function (mouseNode, keyNode, keyObject, _this,
				callback, subsequentDelay, initialDelay, minDelay) {
			var handles = [
				this.addKeyListener(keyNode, keyObject, _this, callback, subsequentDelay, initialDelay, minDelay),
				this.addMouseListener(mouseNode, _this, callback, subsequentDelay, initialDelay, minDelay)
			];
			return {
				remove: function () {
					handles.forEach(function (h) {
						h.remove();
					});
				}
			};
		}
	};

	return typematic;
});
