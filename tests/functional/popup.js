define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, pollUntil) {

	registerSuite({
		name: "popup functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./popup.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
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
				.findById("choiceDropDownButton")
					.click()
					.end()
				.findById("choiceDropDown")
					.isDisplayed(function (err, displayed) {
						assert.isTrue(displayed, "choiceDropDown popup visible");
					})
					.end()
				.findById("choiceDropDown_wrapper")	// parent of choiceDropDown
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
				.findById("stub-for-blurring")
					.click()
					.end()
				.sleep(500)
				.findById("choiceDropDown")
					.isDisplayed(function (err, displayed) {
						assert.isFalse(displayed, "choiceDropDown popup not visible");
					})
					.end();
		},

		nested: {
			"open around": function () {
				return this.remote
					.findById("showNestedMenuButton")
						.click()
						.end()
					.sleep(500)
					.findById("nestedOpener")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "nestedOpener popup wasn't visible");
						})
						.end();
			},

			open: function () {
				return this.remote
					.execute("nestedOpener._openPopup(nestedChoice1)")
					.sleep(500)
					.findById("nestedChoice1")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "nestedChoice1 popup wasn't visible");
						})
						.end();
			},

			close: function () {
				return this.remote
					.findById("stub-for-blurring")
						.click()
						.end()
					.sleep(500)
					.findById("nestedChoice1")
						.isDisplayed(function (err, displayed) {
							assert.isFalse(displayed, "nestedChoice1 popup hidden");
						})
						.end()
					.findById("nestedOpener")
						.isDisplayed(function (err, displayed) {
							assert.isFalse(displayed, "nestedOpener popup hidden");
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
				.execute("window.scrollTo(0, 0);")	// avoid spurious error due to scroll
				.findById("openAt1015Button")
					.click()
					.end()
				// note: "return xyPopup.getBoundingClientRect();" doesn't work on IE; webdriver bug.
				.execute("var pos = xyPopup.getBoundingClientRect(); return {left: pos.left, top: pos.top};")
						.then(function (pos) {
					assert.strictEqual(pos.left, 10, "popup x coord " + JSON.stringify(pos));
					assert.strictEqual(pos.top, 15, "popup y coord " + JSON.stringify(pos));
				})
				.findById("xyPopup")
					.click()
					.end();
		},

		"orient callback": {
			setup: function () {
				return this.remote
					.findById("tooltipDropDownButton")
						.click()
						.end()
					.findById("stub-for-blurring")
						.click()
						.end();
			},

			around: function () {
				return this.remote
					.execute("return tooltip.orientCalls.length").then(function (value) {
						assert.notStrictEqual(value, 0, "tooltipGlobal.orientCalls.length");
					})
					.execute("return tooltip.orientCalls.pop();").then(function (final) {
						assert.strictEqual(final.corner, "TL", "popup corner");
						assert.strictEqual(final.aroundCorner, "BL", "aroundNode corner");
					})
					.execute("return tooltipDropDownButton._openRet").then(function (value) {
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BL", "popup aroundCorner");
					});
			},

			at: function () {
				return this.remote
					.execute("tooltip.orientCalls = [];")
					.findById("openTooltipAt1015Button")
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
					.execute("return openRet;").then(function (value) {
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.findById("tooltip")
						.click()
						.end();
			}
		},

		scrollbar: {
			at: function () {
				return this.remote
					.execute("openLotsOfChoicesPopupButton.scrollIntoView()")
					.findById("openLotsOfChoicesPopupButton")
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
					.findById("lotsOfChoicesPopup")
						.click()
						.end();

			},

			around: function () {
				return this.remote
					.findById("tallChoiceDropDownButton")
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
