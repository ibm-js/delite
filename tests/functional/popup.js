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
			this.timeout = 120000;
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
			this.timeout = 120000;
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
				this.timeout = 120000;
				return this.remote
					.elementById("showNestedMenuButton")
						.click()
						.end()
					.wait(500)
					.elementById("nestedOpener")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "nestedOpener popup wasn't visible");
						})
						.end();
			},

			open: function () {
				this.timeout = 120000;
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
				this.timeout = 120000;
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
					.elementById("nestedOpener_dropdown")
						.isDisplayed(function (err, displayed) {
							assert.isFalse(displayed, "nestedOpener_dropdown popup not visible");
						})
						.end();
			}
		},

		"no hidden tab stops": function () {
			this.timeout = 120000;
			return this.remote
				.execute("return tabOrder()[0].id").then(function (value) {
					assert.strictEqual(value, "inputAtStart");
				})
				.execute("return tabOrder()[tabOrder().length - 1].id").then(function (value) {
					assert.strictEqual(value, "inputAtEnd");
				});
		},

		"x/y placement": function () {
			this.timeout = 120000;
			return this.remote
				.elementById("openAt1015Button")
					.click()
					.end()
				// note: "return xyPopup.getBoundingClientRect();" doesn't work on IE; webdriver bug.
				// TODO: retest with Intern 2.0
				.execute("var pos = xyPopup.getBoundingClientRect(); return {left: pos.left, top: pos.top};")
						.then(function (pos) {
					assert.strictEqual(pos.left, 10, "popup x coord " + JSON.stringify(pos));
					assert.strictEqual(pos.top, 15, "popup y coord " + JSON.stringify(pos));
				})
				.elementById("closeAt1015Button")
					.click()
					.end();
		},

		"orient callback": {
			setup: function () {
				this.timeout = 120000;
				return this.remote
					.elementById("tooltipDropDownButton")
						.click()
						.end()
					.elementById("stub-for-blurring")
						.click()
						.end();
			},

			around: function () {
				this.timeout = 120000;
				return this.remote
					.execute("return tooltip.orientCalls.length").then(function (value) {
						assert.notStrictEqual(value, 0, "tooltipGlobal.orientCalls.length");
					})
					.execute("return tooltip.orientCalls.pop();").then(function (final) {
						assert.strictEqual(final.corner, "TL", "popup corner");
						assert.strictEqual(final.aroundCorner, "BL", "aroundNode corner");
					})
					.execute("return tooltip.onOpenArg").then(function (value) {
						assert.ok(value, "tooltip.onOpenArg");
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BL", "popup aroundCorner");
					});
			},

			at: function () {
				this.timeout = 120000;
				return this.remote
					.execute("tooltip.orientCalls = []; delete tooltip.onOpenArg;")
					.elementById("openTooltipAt1015Button")
						.click()
						.end()
					.execute("return tooltip.orientCalls.length").then(function (value) {
						assert.notStrictEqual(value, 0, "tooltip.orientCalls.length");
					})
					.execute("return tooltip.orientCalls.pop()").then(function (value) {
						// The final call to orient(), as well as the call to onOpen(), should have been for the final
						// position of the node, where corner == TL and aroundCorner == BR (they are caddy-corner).
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.execute("return tooltip.onOpenArg").then(function (value) {
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
				this.timeout = 120000;
				return this.remote
					.elementById("openLotsOfChoicesPopupButton")
						.click()
						.end()
					.execute(
						"return [getComputedStyle(lotsOfChoicesPopup).height.replace(/px/, ''), " +
							"document.documentElement.clientHeight, " +
							"getComputedStyle(lotsOfChoicesPopup.parentNode).height.replace(/px/, '')];")
					.then(function (value) {
						assert.isTrue(value[2] < value[1], "lotsOfChoicesPopup wrapper not shorter than viewport " +
							value[2] + ", " + value[1]);
						assert.isTrue(value[0] < value[1], "lotsOfChoicesPopup popup not shorter than viewport " +
							value[0] + ", " + value[1]);
					})
					.elementById("closeLotsOfChoicesPopupButton")
						.click()
						.end();

			},

			around: function () {
				this.timeout = 120000;
				return this.remote
					.elementById("tallChoiceDropDownButton")
						.click()
						.end()
					.execute("return [getComputedStyle(tallChoiceDropDown).height.replace(/px/, ''), " +
						"document.documentElement.clientHeight, " +
						"getComputedStyle(tallChoiceDropDown.parentNode).height.replace(/px/, '')];")
					.then(function (value) {
						assert.isTrue(value[2] < value[1], "tallChoiceDropDown wrapper is not shorter than viewport");
						assert.isTrue(value[0] < value[1], "tallChoiceDropDown popup is not shorter than the viewport");
					});
			}
		}
	});
});
