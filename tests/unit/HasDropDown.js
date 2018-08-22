define([
	"intern!object",
	"intern/chai!assert",
	"dcl/dcl",
	"delite/register",
	"delite/HasDropDown",
	"delite/Widget",
	"../functional/helpers"
], function (registerSuite, assert, dcl, register, HasDropDown, Widget, helpers) {
	var container;

	// ------------
	// Test widgets.  Also used by functional/HasDropDown.html.   Could share the code between them.

	var Menu = register("d-hasdropdown-menu", [HTMLElement, Widget], {
		choice1: "1",
		choice2: "2",
		choice3: "3",

		render: function () {
			this.className = "choice";

			this.on("click", this.emit.bind(this, "change"));

			for (var i = 1; i < 4; i++) {
				this.innerHTML += "<div index='" + i +
					"'>choice #" + this["choice" + i] + "</div>";
			}
		}
	});

	// A button that shows a popup
	var SimpleDropDownButton = register("simple-drop-down-button", [HTMLElement, HasDropDown], {
		label: dcl.prop({
			set: function (val) {
				this.textContent = val;
			},
			get: function () {
				return this.textContent;
			}
		}),

		loadDropDown: function () {
			if (!this._dropDown) {
				this._dropDown = new this.dropDownConstructor({
					className: this.dropDownClass || "basic-dropdown"
				});
				if (this.id) {
					this._dropDown.id = this.id + "_popup";
				}
			}

			return this._dropDown;
		}
	});

	registerSuite({
		name: "HasDropDown",
		setup: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		// Note: most of the HasDropDown tests are in tests/functional

		basic: function () {
			// basic drop down with menu
			var sdd = new SimpleDropDownButton({
				id: "dd",
				label: "basic",
				dropDownConstructor: Menu,
				focusOnPointerOpen: false	// traditionally you only focus drop down menus when opened by the keyboard
			}).placeAt(container);

			return sdd.openDropDown().then(function () {
				var popup = document.getElementById("dd_popup");
				assert(helpers.isVisible(popup), "visible");

				sdd.closeDropDown();
				assert.isFalse(helpers.isVisible(popup), "not visible");
			});
		},

		detach: function () {
			// basic drop down with menu
			var sdd = new SimpleDropDownButton({
				id: "dd2",
				label: "detach",
				dropDownConstructor: Menu,
				focusOnPointerOpen: false	// traditionally you only focus drop down menus when opened by the keyboard
			}).placeAt(container);

			return sdd.openDropDown().then(function () {
				var popup = document.getElementById("dd2_popup");
				assert(helpers.isVisible(popup), "visible");

				sdd.closeDropDown();
				assert.isFalse(helpers.isVisible(popup), "not visible");

				sdd.parentNode.removeChild(sdd);

				assert.isFalse(document.body.contains(popup), "removeChild() detaches popup too");

				container.appendChild(sdd);
				return sdd.openDropDown().then(function () {
					assert(document.body.contains(popup), "openDropDown() reattaches popup");
					assert(helpers.isVisible(popup), "visible");
				});
			});
		},

		teardown: function () {
			container.parentNode.removeChild(container);
		}
	});
});
