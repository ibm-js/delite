define([
	"intern!object",
	"intern/chai!assert",
	"delite/on",
	"delite/popup",
	"delite/register",
	"delite/Widget"
], function (registerSuite, assert, on, popup, register, Widget) {

	var myMenu, anchorNode;

	registerSuite({
		name: "popup",

		setup: function () {
			var Menu = register("my-menu", [HTMLElement, Widget], {
				render: function () {
					this.style.cssText = "display: block; position: absolute; width: 75px;";
					this.innerHTML = "I'm a drop down, wider and taller than the around nodes I'm placed next to.";
				}
			});
			myMenu = new Menu();
			document.body.appendChild(myMenu);
		},

		around: {
			setup: function () {
				// These around nodes are meant to be used with the document scrolled down 100px
				anchorNode = document.createElement("div");
				anchorNode.style.cssText =
					"position: absolute; width: 20px; height: 20px; background: yellow; top: 100px; left: 50%;";
				document.body.appendChild(anchorNode);
			},

			aroundT: function () {
				var self = this;

				var positionEvents = 0, openEvents = 0, closeEvents = 0;

				myMenu.addEventListener("popup-after-show", function () {
					openEvents++;
				});
				myMenu.addEventListener("popup-after-position", function () {
					positionEvents++;
				});
				myMenu.addEventListener("popup-before-hide", function () {
					closeEvents++;
				});

				// Open popup and check that correct events were fired.
				popup.open({
					parent: anchorNode,
					popup: myMenu,
					around: anchorNode,
					orient: ["below-centered"],
					onExecute: function () {
						self.closeDropDown(true);
					},
					onCancel: function () {
						self.closeDropDown(true);
					},
					onClose: function () {
						this.opened = false;
					}
				});
				assert.strictEqual(openEvents, 1, "popup-after-show");
				assert.strictEqual(positionEvents, 1, "popup-after-position");

				// Test that the popup is repositioned when its size changes.
				on.emit(myMenu, "delite-size-change");
				assert.strictEqual(openEvents, 1, "popup-after-show didn't fire");
				assert.strictEqual(positionEvents, 2, "popup-after-position");

				// Close popup and check that correct event was fired.
				popup.close(myMenu);
				assert.strictEqual(closeEvents, 1, "popup-before-hide");
			}
		},

		teardown: function () {
			document.body.removeChild(myMenu.parentNode);	// .parentNode due to delite/popup adding wrapper
			document.body.removeChild(anchorNode);
		}
	});
});
