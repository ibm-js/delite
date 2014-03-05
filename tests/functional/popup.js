define(["intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "popup functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./popup.html"))
				.waitForCondition("ready", 40000);
		},

		"repeat move off screen": function () {
			// In old version of code, calling moveOffScreen twice would cause an exception.
			// No actual assert here, we're relying on the browser throwing an exception to wd?
			return this.remote
				.execute("glblPopupUtil.moveOffScreen(document.getElementById('spw'));")
				.execute("glblPopupUtil.moveOffScreen(document.getElementById('spw'));");
		},

		"open popup on the edge of another widget": function () {
			return this.remote
				.elementById("choiceDropDownButton")
					.click()
					.end()
				.elementById("choiceDropDown")
					.isDisplayed(function (err, displayed) {
						assert.isTrue(displayed, "choiceDropDown popup visible");
					})
				.end()
				.elementById("choiceDropDownButton_dropdown")	// parent of choiceDropDown
				.getAttribute("role").then(function (role) {
					assert.strictEqual(role, "region", "popup's wrapper node needs role=region");
				})
				.getAttribute("aria-label").then(function (label) {
					assert.strictEqual(label, "choiceDropDown", "popup's wrapper node needs aria-label");
				})
				.end();
		},

		"close popup on the edge of another widget": function () {
			return this.remote
				.elementById("stub-for-blurring")
					.click()
					.end()
				.wait(500)
				.elementById("choiceDropDown")
					.isDisplayed(function (err, displayed) {
						assert.isFalse(displayed, "choiceDropDown popup not visible");
					})
					.end();
		},

		nested: {
			"open around": function () {
				return this.remote
					.elementById("showNestedMenuButton")
						.click()
						.end()
					.wait(500)
					.elementById("nestedPopupOpener")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "nestedPopupOpener popup wasn't visible");
						})
						.end();
			},

			open: function () {
				return this.remote
					.execute("nestedOpener._openPopup(nestedChoice1)")
					.wait(500)
					.elementById("nestedChoice1")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "nestedChoice1 popup wasn't visible");
						})
						.end();
			},

			close: function () {
				return this.remote
					.elementById("stub-for-blurring")
						.click()
						.end()
					.wait(500)
					.elementById("showNestedMenuButton_dropdown")
						.isDisplayed(function (err, displayed) {
							assert.isFalse(displayed, "showNestedMenuButton_dropdown popup not visible");
						})
						.end()
					.elementById("nestedPopupOpener_dropdown")
						.isDisplayed(function (err, displayed) {
							assert.isFalse(displayed, "nestedPopupOpener_dropdown popup not visible");
						})
						.end();
			}
		},

		"no hidden tab stops": function () {
			return this.remote
				.execute("return tabOrder()[0].id").then(function (value) {
					assert.strictEqual(value, "inputAtStart");
				})
				.execute("return tabOrder()[tabOrder().length - 1].id").then(function (value) {
					assert.strictEqual(value, "inputAtEnd");
				});
		},

		"x/y placement": function () {
			return this.remote
				.elementById("openAt1015Button")
				.click()
				.end()
				.execute("return domGeometryGlobal.position(xyPopup)").then(function (value) {
					assert.strictEqual(value.x, 10, "popup x coord");
					assert.strictEqual(value.y, 15, "popup y coord");
				})
				.elementById("closeAt1015Button")
				.click()
				.end()
		},

		"orient callback": {
			setup: function () {
				return this.remote
					.elementById("tooltipDropDownButton")
						.click()
						.end()
					.elementById("stub-for-blurring")
						.click()
						.end();
			},

			around: function () {
				return this.remote
					.execute("return tooltipGlobal.orientCalls.length").then(function (value) {
						assert.notStrictEqual(value, 0, "tooltipGlobal.orientCalls.length");
					})
					.execute("return tooltipGlobal.orientCalls.pop();").then(function (final){
						assert.strictEqual(final.corner, "TL", "popup corner");
						assert.strictEqual(final.aroundCorner, "BL", "aroundNode corner");
					})
					.execute("return tooltipGlobal.onOpenArg").then(function (value) {
						assert.ok(value, "tooltipGlobal.onOpenArg");
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BL", "popup aroundCorner");
					});
			},

			at: function () {
				return this.remote
					.execute("tooltipGlobal.orientCalls = []; delete tooltipGlobal.onOpenArg;")
					.elementById("openTooltipAt1015Button")
					.click()
					.end()
					.execute("return tooltipGlobal.orientCalls.length").then(function (value) {
						assert.notStrictEqual(value, 0, "tooltipGlobal.orientCalls.length");
					})
					.execute("return tooltipGlobal.orientCalls.pop()").then(function (value) {
						// The final call to orient(), as well as the call to onOpen(), should have been for the final
						// position of the node, where corner == TL and aroundCorner == BR (they are caddy-corner).
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.execute("return tooltipGlobal.onOpenArg").then(function (value) {
						assert.ok(value, "onOpen called");
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.elementById("closeTooltipAt1015Button")
					.click()
					.end();
			}
		},

		scrollbar: {
			at: function () {
				return this.remote
					.elementById("openLotsOfChoicesPopupButton")
					.click()
					.end()
					.execute(
						"return [domStyleGlobal.get(lotsOfChoicesPopup, 'height'), " +
							"winUtilsGlobal.getBox().h, domStyleGlobal.get(lotsOfChoicesPopup.parentNode, 'height')];")
					.then(function (value) {
						assert.isTrue(value[0] > value[1], "lotsOfChoicesPopup popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "lotsOfChoicesPopup wrapper is not shorter than viewport");
					});
			},

			around: function () {
				return this.remote
					// cant use .click() here because it fails in chrome, see http://stackoverflow.com/questions/11908249/debugging-element-is-not-clickable-at-point-error
					.execute("tallChoiceDropDownButton.click();")
					.execute("return [domStyleGlobal.get(tallChoiceDropDown, 'height'), " +
						"winUtilsGlobal.getBox().h, domStyleGlobal.get(tallChoiceDropDown.parentNode, 'height')];")
					.then(function (value) {
						assert.isTrue(value[0] > value[1], "tallChoiceDropDown popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "tallChoiceDropDown wrapper is not shorter than viewport");
					});
			}
		}
	});
});
