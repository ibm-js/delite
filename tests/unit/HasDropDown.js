define([
	"dcl/dcl",
	"delite/register",
	"delite/HasDropDown",
	"delite/Widget",
	"../functional/helpers"
], function (
	dcl,
	register,
	HasDropDown,
	Widget,
	helpers
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

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

		render: function () {
			this.tabIndex = 0;
		},

		loadDropDown: function () {
			if (!this._dropDown) {
				this._dropDown = new this.DropDownConstructor({
					className: this.dropDownClass || "basic-dropdown"
				});
				if (this.id) {
					this._dropDown.id = this.id + "_popup";
				}
			}

			return this._dropDown;
		}
	});

	// A button that shows a popup
	var CreateEveryTimeDropdownButton = register("create-every-time-drop-down-button", [SimpleDropDownButton], {
		loadDropDown: function () {
			return new this.DropDownConstructor({
				className: this.dropDownClass || "create-every-time-dropdown"
			});
		}
	});

	registerSuite("HasDropDown", {
		before: function () {
			container = document.createElement("div");
			document.body.appendChild(container);
		},

		tests: {
			// Note: most of the HasDropDown tests are in tests/functional

			"basic": function () {
				// basic drop down with menu
				var sdd = new SimpleDropDownButton({
					id: "dd",
					label: "basic",
					DropDownConstructor: Menu,
					focusOnPointerOpen: false // traditionally, only focus drop down menus when opened by the keyboard
				}).placeAt(container);

				return sdd.openDropDown().then(function () {
					var popup = document.getElementById("dd_popup");
					assert(helpers.isVisible(popup), "visible");

					sdd.closeDropDown();
					assert.isFalse(helpers.isVisible(popup), "not visible");
				});
			},

			"detach": function () {
				// basic drop down with menu
				var sdd = new SimpleDropDownButton({
					id: "dd2",
					label: "detach",
					DropDownConstructor: Menu,
					focusOnPointerOpen: false // traditionally, only focus drop down menus when opened by the keyboard
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

			"dom leaks": function () {
				var ddb = new CreateEveryTimeDropdownButton({
					id: "cetdb",
					label: "create every time",
					DropDownConstructor: Menu,
					focusOnPointerOpen: false // traditionally only focus drop down menus when opened by the keyboard
				}).placeAt(container);

				var input = document.createElement("input");
				container.appendChild(input);

				var origNumWrappers = document.querySelectorAll(".d-popup").length,
					origNumDropdowns = document.querySelectorAll("d-hasdropdown-menu").length;

				// Open the dropdown
				ddb.focus();
				ddb.click();

				var dfd = this.async();

				setTimeout(dfd.rejectOnError(function () {
					// Close the dropdown and then blur the SimpleDropDownButton.
					// (Makes two calls to closeDropDown().)
					ddb.click();
					input.focus();

					// Reopen the dropdown.
					setTimeout(dfd.rejectOnError(function () {
						ddb.focus();
						ddb.click();

						// Check that old dropdown and wrapper were removed from doc.
						setTimeout(dfd.callback(function () {
							// Make sure that there's no DOM leak
							var newNumWrappers = document.querySelectorAll(".d-popup").length,
								newNumDropdowns = document.querySelectorAll("d-hasdropdown-menu").length;

							assert.strictEqual(newNumWrappers, origNumWrappers + 1, "wrapper leak");
							assert.strictEqual(newNumDropdowns, origNumDropdowns + 1, "dropdown widget leak");
						}, 10));
					}, 10));
				}, 10));
			}
		},

		after: function () {
			container.parentNode.removeChild(container);
		}
	});
});
