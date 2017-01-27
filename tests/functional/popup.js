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
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL))
				.setFindTimeout(5000);
		},

		afterEach: function () {
			// Try to make sure that all popups are closed.
			return this.remote
				.findById("stub-for-blurring")
				.click()
				.end();
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
					.isDisplayed().then(function (displayed) {
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
					.isDisplayed().then(function (displayed) {
						assert.isFalse(displayed, "choiceDropDown popup not visible");
					})
					.end();
		},

		"centered popup": function () {
			return this.remote
				.findById("showCenteredDialogButton")
					.click()
					.end()
				.findById("centeredDialog")
					.isDisplayed().then(function (displayed) {
						assert.isTrue(displayed, "centeredDialog popup visible");
					})
					.end()
				.findByCssSelector("d-dialog-underlay")
					.isDisplayed().then(function (displayed) {
						assert.isTrue(displayed, "d-dialog-underlay visible");
					})
					.end()
				.findByCssSelector("#centeredDialog .ok-button")
					.click()	// close popup
					.end()
				.findById("centeredDialog")
					.isDisplayed().then(function (displayed) {
						assert.isFalse(displayed, "centeredDialog popup hidden");
					})
					.end()
				.findByCssSelector("d-dialog-underlay") // underlay should either be detached or set as display: none
					.isDisplayed().then(function (displayed) {	// currently, it's set as display: none
						assert.isFalse(displayed, "d-dialog-underlay hidden");
					})
					.end();
		},

		nested: function () {
			return this.remote
				.findById("showNestedMenuButton")
					.click()
					.end()
				.sleep(500)
				.findById("nestedOpener")
					.isDisplayed().then(function (displayed) {
						assert.isTrue(displayed, "nestedOpener popup wasn't visible");
					})
					.end()
				.execute("nestedOpener._openPopup(nestedChoice1)")
				.sleep(500)
				.findById("nestedChoice1")
					.isDisplayed().then(function (displayed) {
						assert.isTrue(displayed, "nestedChoice1 popup wasn't visible");
					})
					.end()
				.findById("stub-for-blurring")
					.click()
					.end()
				.sleep(500)
				.findById("nestedChoice1")
					.isDisplayed().then(function (displayed) {
						assert.isFalse(displayed, "nestedChoice1 popup hidden");
					})
					.end()
				.findById("nestedOpener")
					.isDisplayed().then(function (displayed) {
						assert.isFalse(displayed, "nestedOpener popup hidden");
					})
					.end();
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

		"popup-after-position event": {
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
					.execute("return tooltip.popupAfterPositionEvents.length").then(function (value) {
						assert.strictEqual(value, 1, "popupAfterPositionEvents.length");
					})
					.execute("return tooltip.popupAfterPositionEvents.pop();").then(function (final) {
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
					.execute("tooltip.popupAfterPositionEvents = [];")
					.findById("openTooltipAt1015Button")
						.click()
						.end()
					.execute("return tooltip.popupAfterPositionEvents.length").then(function (value) {
						assert.strictEqual(value, 1, "popupAfterPositionEvents.length");
					})
					.execute("return tooltip.popupAfterPositionEvents.pop()").then(function (value) {
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
					.execute("openLotsOfChoicesPopupButton.scrollIntoView();")
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
						.isDisplayed().then(function (visible) {
							assert.isFalse(visible, "lotsOfChoicesPopup hidden");
						})
						.end();

			},

			around: function () {
				return this.remote
					.execute("tallChoiceDropDownButton.scrollIntoView();")
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
		},

		"change events": {
			"change event from dropdown closes dropdown": function () {
				return this.remote
					.findById("showDatePickerButton")
						.click()
						.end()
					.findById("myDatePicker")
						.isDisplayed().then(function (displayed) {
							assert.isTrue(displayed, "DatePicker popup visible");
						})
						.click()
						.isDisplayed().then(function (displayed) {
							assert.isFalse(displayed, "DatePicker popup hidden");
						})
						.end();
			},

			"change event from dropdown descendant doesn't close dropdown": function () {
				return this.remote
					.findById("showSimpleDialogButton")
						.click()
						.end()
					.findById("simpleDialog")
						.isDisplayed().then(function (displayed) {
							assert.isTrue(displayed, "Dialog visible");
						})
						.findByCssSelector("#simpleDialog input:nth-of-type(1)")
							.type("hello")
							.end()
						.findByCssSelector("#simpleDialog input:nth-of-type(2)")
							.click()
							.end()
						.isDisplayed().then(function (displayed) {
							assert.isTrue(displayed, "Dialog still visible");
						})
						.end();
			}
		}
	});
});
