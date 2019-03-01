define([
	"delite/on",
	"delite/popup",
	"delite/register",
	"delite/Widget",
	"delite/Viewport"
], function (
	on,
	popup,
	register,
	Widget,
	Viewport
) {
	var registerSuite = intern.getPlugin("interface.object").registerSuite;
	var assert = intern.getPlugin("chai").assert;

	var myMenu, anchorNode;

	function isVisible(element) {
		var elRect = element.getBoundingClientRect(),
			elTop = elRect.top,
			elBottom = elRect.bottom;

		// Check if element out of viewport.
		var viewport = Viewport.getEffectiveBox();
		return elBottom >= 0 && elTop < viewport.h;
	}

	registerSuite("popup", {
		before: function () {
			var Menu = register("my-menu", [HTMLElement, Widget], {
				render: function () {
					this.style.cssText = "display: block; position: absolute; width: 75px;";
					this.innerHTML =
						"<div>I'm a drop down, wider and taller than the around nodes I'm placed next to.</div>";
				}
			});
			myMenu = new Menu();
			document.body.appendChild(myMenu);
		},

		tests: {
			around: {
				before: function () {
					anchorNode = document.createElement("div");
					anchorNode.style.cssText =
						"position: absolute; width: 20px; height: 20px; background: yellow; top: 0; left: 0;";
					document.body.appendChild(anchorNode);
				},

				tests: {
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
						window.scrollTo(0, 0);
						assert(isVisible(anchorNode), "anchor visible before popup.open()");
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
						assert(isVisible(myMenu), "menu visible #1");

						var dfd = this.async();

						setTimeout(dfd.rejectOnError(function () {
							assert(isVisible(myMenu), "menu visible #2");

							var div = document.createElement("div");
							div.textContent = "Another line.";
							myMenu.appendChild(div);

							setTimeout(dfd.callback(function () {
								// Test that the popup is repositioned when its size changes.
								// For some reason it might get a few reposition calls.  Don't fail the test for that.
								assert(isVisible(myMenu), "menu visible #3");
								assert.strictEqual(openEvents, 1, "popup-after-show didn't fire");
								assert(positionEvents >= 2 && positionEvents <= 5,
									"popup-after-position, positionEvents = " + positionEvents);

								// Close popup and check that correct event was fired.
								popup.close(myMenu);
								assert.strictEqual(closeEvents, 1, "popup-before-hide");
							}), 50);
						}), 50);
					}
				}
			}
		},

		after: function () {
			document.body.removeChild(myMenu.parentNode);	// .parentNode due to delite/popup adding wrapper
			document.body.removeChild(anchorNode);
		}
	});
});
