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
			var js = "glblPopupUtil.moveOffScreen(document.getElementById('spw')); glblPopupUtil.moveOffScreen(document.getElementById('spw'));";
			return this.remote.execute(js);
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
			var js = "xyPopup = new SimpleChoiceWidget({id : 'SimpleChoiceWidgetId'}); \
			glblPopupUtil.open({ \
				popup: xyPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
			}); return domGeometryGlobal.position(xyPopup)"; // return popup.getBoundingClientRect()
			return this.remote
				.execute(js).then(function (value) {
					assert.strictEqual(value.x, 10, "popup x coord");
					assert.strictEqual(value.y, 15, "popup y coord");
				})
				.execute("glblPopupUtil.close(xyPopup)");
		},

		"orient callback": {
			setup: function () {
				// TODO: don't like this calling setup functions on the client. Not much different to the x / y placement test though??
				return this.remote
					.execute("setupOrientCallback()")
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
				var js1 = "tooltipGlobal.orientCalls = []; delete tooltipGlobal.onOpenArg; \
								glblPopupUtil.open({ \
								popup: tooltipGlobal, \
								orient: 'R', \
								x: 10, \
								y: 15 \
								});";
				return this.remote
					.execute(js1).then(function (value) {
						// The final call to orient(), as well as the call to onOpen(), should have been for the final
						// position of the node, where corner == TL and aroundCorner == BR (they are caddy-corner).
						assert.notStrictEqual(value, 0, "tooltipGlobal.orientCalls.length");
					})
					.execute("return tooltipGlobal.orientCalls.pop()").then(function (value) {
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.execute("return tooltipGlobal.onOpenArg").then(function (value) {
						assert.ok(value, "onOpen called");
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					});
			}
		},

		a11y: function () {
			var js = "allyPopup = new SimpleChoiceWidget({id: 'scwPopup'});\
				glblPopupUtil.open({ \
				popup: allyPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
				}); return [allyPopup.parentNode.getAttribute('role'), allyPopup.parentNode.getAttribute('aria-label')]";

			return this.remote
				.execute(js).then(function (value) {
					assert.strictEqual(value[0], "region", "popup's wrapper node needs role=region");
					assert.strictEqual(value[1], "scwPopup", "popup's wrapper node needs aria-label");
				});
		},

		scrollbar: {
			at: function () {
				var js = "lotsOfChoicesPopup = new LotsOfChoicesWidget({id: 'tallPopup1'});\
				glblPopupUtil.open({ \
				popup: lotsOfChoicesPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
				}); return [domStyleGlobal.get(lotsOfChoicesPopup, 'height'), winUtilsGlobal.getBox().h, domStyleGlobal.get(lotsOfChoicesPopup.parentNode, 'height')]";
				
				return this.remote
					.execute(js).then(function (value) {
						assert.isTrue(value[0] > value[1], "lotsOfChoicesPopup popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "lotsOfChoicesPopup wrapper is not shorter than viewport");
					});
			},

			around: function () {
				// cant use .click() here because it fails in chrome, see http://stackoverflow.com/questions/11908249/debugging-element-is-not-clickable-at-point-error
				var js = "tallChoiceDropDownButton.click();\
				return [domStyleGlobal.get(tallChoiceDropDown, 'height'), winUtilsGlobal.getBox().h, domStyleGlobal.get(tallChoiceDropDown.parentNode, 'height')]";
				
				return this.remote
					.execute(js).then(function (value) {
						assert.isTrue(value[0] > value[1], "tallChoiceDropDown popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "tallChoiceDropDown wrapper is not shorter than viewport");
					});
			}
		}
	});
});
