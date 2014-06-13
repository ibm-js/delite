define([
	"intern!object",
	"intern/chai!assert",
	"dojo/dom-geometry",
	"dojo/keys",
	"dojo/on",
	"delite/register",
	"delite/HasDropDown",
	"delite/Widget",
	"../helpers"
], function (registerSuite, assert, domGeom, keys, on, register, HasDropDown, Widget, helpers) {
	var container, SimplePopup, SimpleDropDownButton, NonFocusableDropDownButton, popup, dd, ndd;

	function key(node, keyCode) {
		on.emit(node, "keydown", {
			keyCode: keyCode,
			bubbles: true
		});
		on.emit(node, "keyup", {
			keyCode: keyCode,
			bubbles: true
		});
	}

	function click(node) {
		on.emit(node, navigator.pointerEnabled ? "pointerdown" :
				navigator.msPointerEnabled ? "MSPointerDown" : "mousedown", {
			button: 0,	// left button (except on IE quirks mode, when it's 1)
			bubbles: true
		});
		on.emit(node, navigator.pointerEnabled ? "pointerup" :
				navigator.msPointerEnabled ? "MSPointerUp" : "mouseup", {
			button: 0,	// left button (except on IE quirks mode, when it's 1)
			bubbles: true
		});
		on.emit(node, "click", {
			bubbles: true
		});
	}

	registerSuite({
		name: "HasDropDown",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);

			SimplePopup = register("simple-popup", [HTMLElement, Widget], {
				// summary:
				//		A trivial popup widget
				label: "i'm a popup",

				_setLabelAttr: function (val) {
					this.textContent = val;
					this._set("label", val);
				}
			});

			// The popup has to have some display type where you can set the width.
			// Perhaps this should be done in global.less but I didn't want to hard code the display type to "block"
			// when it could have other values like "table" etc.
			container.insertAdjacentHTML("afterbegin", "<style>simple-popup { display: block; }");

			// A button that shows a popup
			SimpleDropDownButton = register("simple-drop-down-button", [HTMLButtonElement, Widget, HasDropDown], {
				label: "show dropdown",
				_setLabelAttr: function (val) {
					this.textContent = val;
					this._set("label", val);
				},
				popupLabel: "i'm a popup",
				orient: ["below"],

				postCreate: register.after(function () {
					this.dropDown = new SimplePopup({
						id: this.id + "_popup",
						label: this.popupLabel
					});
				})
			});

			// A non-focusable "button" that shows a popup.
			// Should work for mouse, although not for keyboard.
			NonFocusableDropDownButton = register("non-focusable-drop-down-button",
					[HTMLElement, Widget, HasDropDown], {
				label: "show popup (non-focusable)",
				_setLabelAttr: function (val) {
					this.textContent = val;
					this._set("label", val);
				},

				orient: ["below"],

				postCreate: register.after(function () {
					this.dropDown = new SimplePopup({
						id: this.id + "_popup",
						label: "popup from non-focusable"
					});
				})
			});

		},

		basic: function () {
			// setup
			dd = new SimpleDropDownButton({
				id: "dd",
				label: "show dropdown - ltr"
			}).placeAt(container);
			popup = dd.dropDown;
			assert.ok(!!popup, "popup exists");

			// open
			click(dd);
			var anchorPos = domGeom.position(dd),
				dropDownPos = domGeom.position(popup);
			assert(Math.abs(anchorPos.x - dropDownPos.x) < 1, "drop down and anchor left aligned");
			assert(Math.abs(anchorPos.w - dropDownPos.w) < 1, "drop down same width as anchor");
			assert.ok(helpers.isVisible(popup), "popup visible");

			// close
			dd.closeDropDown();
			assert.ok(helpers.isHidden(popup), "popup hidden");

			// open by space
			key(dd, keys.SPACE);
			assert.ok(!!popup, "popup exists");
			assert.ok(helpers.isVisible(popup), "popup visible again");

			// close 2
			dd.closeDropDown();
			assert.ok(helpers.isHidden(popup), "popup hidden again");
		},
		rtl: function () {
			// setup
			dd = new SimpleDropDownButton({
				id: "rdd",
				dir: "rtl",
				label: "show dropdown - rtl"
			}).placeAt(container);
			popup = dd.dropDown;
			assert(!!popup, "popup exists");

			// open
			var d = this.async(1000);
			click(dd);
			setTimeout(d.callback(function () {
				assert(helpers.isVisible(popup), "popup visible");
				var anchorPos = domGeom.position(dd),
					dropDownPos = domGeom.position(popup);
				assert(Math.abs(anchorPos.x - dropDownPos.x) < 1, "drop down and anchor left aligned");
				assert(Math.abs(anchorPos.w - dropDownPos.w) < 1, "drop down same width as anchor");
			}), 10);
			return d;
		},

		"non focusable": function () {
			// setup
			ndd = new NonFocusableDropDownButton({id: "ndd"}).placeAt(container);
			popup = ndd.dropDown;
			assert.ok(!!popup, "popup exists");

			// open
			click(ndd);
			assert.ok(helpers.isVisible(popup), "popup visible");

			// close
			ndd.closeDropDown();
		},

		"alignment - left": function () {
			var d = this.async(1000);
			var ltr = new SimpleDropDownButton({
				id: "ltr",
				label: "show non-auto-width dropdown - ltr",
				autoWidth: false
			}).placeAt(container);
			click(ltr);
			setTimeout(d.callback(function () {
				var anchorPos = domGeom.position(ltr),
					dropDownPos = domGeom.position(ltr.dropDown);
				assert(Math.abs(anchorPos.x - dropDownPos.x) < 1, "drop down and anchor left aligned");
				assert(anchorPos.w > dropDownPos.w, "anchor wider than drop down");
			}), 10);
			return d;
		},

		"alignment - right": function () {
			var d = this.async(1000);
			var rtl = new SimpleDropDownButton({
				id: "rtl",
				dir: "rtl",
				label: "show non-auto-width dropdown - rtl",
				autoWidth: false
			}).placeAt(container);
			click(rtl);
			setTimeout(d.callback(function () {
				var anchorPos = domGeom.position(rtl),
					dropDownPos = domGeom.position(rtl.dropDown);
				assert(Math.abs((anchorPos.x + anchorPos.w) - (dropDownPos.x + dropDownPos.w)) < 1,
					"drop down and anchor right aligned");
				assert(anchorPos.w > dropDownPos.w, "anchor wider than drop down");
			}), 10);
			return d;
		},

		destroy: function () {
			// setup
			dd = new SimpleDropDownButton({id: "dd2"}).placeAt(container);
			popup = dd.dropDown;
			assert.ok(!!popup, "popup exists");

			// open
			click(dd);
			assert.ok(helpers.isVisible(popup), "popup visible");
			assert.deepEqual(1, require("delite/popup")._stack.length, "in popup manager stack");

			// destroy
			dd.destroy();
			assert.deepEqual(0, require("delite/popup")._stack.length, "popup was closed");
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
