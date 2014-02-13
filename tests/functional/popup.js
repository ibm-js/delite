define(["intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "popup functional tests",
// no TODO: the 'ie6' tests (which shouldn't have been ie6 only tests) will be moved to the bgIframe tests
		"setup": function () {
			return this.remote
				.get(require.toUrl("./popup.html"))
				.waitForCondition("ready", 40000);
		},
		"repeat move off screen": function () {
			// Previously(TODO: not sure what previously means), calling moveOffScreen twice would cause an exception
			// no actual assert here, we're relying on the browser throwing an exception to wd?
			var wd = this.remote, js = "glblPopupUtil.moveOffScreen(document.getElementById('spw')); glblPopupUtil.moveOffScreen(document.getElementById('spw'));";
			wd.execute(js);
			return wd;
		},
		"initial frames are hidden": function () {
			var wd = this.remote;
			wd.elementsByTagName("iframe")
				.then(function (elements) {
					// always zero at the moment, this expected? for the old ie6..9 tests?
					wd.end();
					elements.forEach(function (item) {
						item.isDisplayed(function (err, displayed){
							assert.isFalse(displayed, "iframe wasn't hidden");
						});
					});
				});
			return wd;
		},
		"open popup on the edge of another widget": function () {
			var wd = this.remote;
			wd.end();
			wd.elementById("choiceDropDownButton")
				.click()
				.then(function () {
					wd.end();
					wd.elementById("choiceDropDown")
						.isDisplayed(function (err, displayed) {
							assert.isTrue(displayed, "choiceDropDown popup wasn't visible");
						});
				});
			return wd;
		},
		"close popup on the edge of another widget": function () {
			var wd = this.remote;
			wd.elementById("stub-for-blurring")
				.click().end();
			wd.elementById("choiceDropDown")
				.isDisplayed(function (err, displayed) {
					assert.isTrue(!displayed, "choiceDropDown popup was visible");
				});
			return wd;
		},
		"nested" :{
			"open around": function () {
				var wd = this.remote;
				wd.elementById("showNestedMenuButton")
					.click()
					.wait(500)
					.then(function () {
						wd.end()
							.elementById("nestedPopupOpener")
							.isDisplayed(function (err, displayed) {
								assert.isTrue(displayed, "nestedPopupOpener popup wasn't visible");
							});
					});
				return wd;
			},
			"open": function () {
				var wd = this.remote;
				wd.execute("nestedOpener._openPopup(nestedChoice1)")
					.wait(500)
					.then(function () {
						wd.elementById("nestedChoice1")
							.isDisplayed(function (err, displayed) {
								assert.isTrue(displayed, "nestedChoice1 popup wasn't visible");
							});
					});
				return wd;
			},
			"close": function () {
				var wd = this.remote;
				wd.elementById("stub-for-blurring")
					.wait(500)
					.end()
					.elementById("showNestedMenuButton_dropdown")
					.isDisplayed(function (err, displayed) {
						assert.isTrue(!displayed, "showNestedMenuButton_dropdown popup was visible");
					});
				wd.end();
				wd.elementById("nestedPopupOpener_dropdown")
					.isDisplayed(function (err, displayed) {
						assert.isTrue(!displayed, "nestedPopupOpener_dropdown popup was visible");
					});
				return wd;
			}
		},

		"no hidden tab stops": function () {
			var wd = this.remote;
			wd.execute("return tabOrder()[0].id")
				.then(function (value) {
					assert.strictEqual(value, "inputAtStart");
				});
			wd.execute("return tabOrder()[tabOrder().length - 1].id")
				.then(function (value) {
					assert.strictEqual(value, "inputAtEnd");
				});
			return wd;
		},
		"x/y placement": function () {
			var wd = this.remote, js = "xyPopup = new SimpleChoiceWidget({id : 'SimpleChoiceWidgetId'}); \
			glblPopupUtil.open({ \
				popup: xyPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
			}); return domGeometryGlobal.position(xyPopup)"; // return popup.getBoundingClientRect()
			wd.execute(js)
				.then(function (value) {
					assert.strictEqual(value.x, 10, "popup x coord wasn't 10");
					assert.strictEqual(value.y, 15, "popup y coord wasn't 15");
				})
				.then(function () {
					wd.execute("glblPopupUtil.close(xyPopup)");
				});

			return wd;
		},
		"orient callback": {
			"setup" : function () {
				var wd = this.remote;

				// TODO: don't like this calling setup functions on the client. Not much different to the x / y placement test though??
				wd.execute("setupOrientCallback()")
					.then(function () {
						wd.elementById("tooltipDropDownButton")
							.click()
							.end()
							.elementById("stub-for-blurring")
							.click();
						}
				);
			},
			"around" : function () {
				var wd = this.remote;
				wd.execute("return tooltipGlobal.orientCalls.length")
				.then(function (value) {
					assert.isTrue(value !== 0, "tooltipGlobal.orientCalls.length was zero");
				})
				.execute("return tooltipGlobal.orientCalls.pop();")
				.then(function (final){
					assert.strictEqual(final.corner, "TL", "popup corner");
					assert.strictEqual(final.aroundCorner, "BL", "aroundNode corner");
				})
				.execute("return tooltipGlobal.onOpenArg")
				.then(function (value) {
					assert.ok(value, "tooltipGlobal.onOpenArg wasn't truthy");
					assert.strictEqual(value.corner, "TL", "popup corner wasn't TL");
					assert.strictEqual(value.aroundCorner, "BL", "popup aroundCorner wasn't BL");
				});
				return wd;
			},
			"at" : function () {
				var wd = this.remote;
				var js1 = "tooltipGlobal.orientCalls = []; delete tooltipGlobal.onOpenArg; \
								glblPopupUtil.open({ \
								popup: tooltipGlobal, \
								orient: 'R', \
								x: 10, \
								y: 15 \
								});";
				wd.execute(js1)
					.then(function (value) {
						// The final call to orient(), as well as the call to onOpen(), should have been for the final
						// position of the node, where corner == TL and aroundCorner == BR (they are caddy-corner).
						assert.isTrue(value !== 0, "tooltipGlobal.orientCalls.length was zero");
					})
					.execute("return tooltipGlobal.orientCalls.pop()")
					.then(function (value) {
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					})
					.execute("return tooltipGlobal.onOpenArg")
					.then(function (value) {
						assert.ok(value, "onOpen called");
						assert.strictEqual(value.corner, "TL", "popup corner");
						assert.strictEqual(value.aroundCorner, "BR", "aroundNode corner");
					});
			}
		},
		"a11y" : function () {
			var wd = this.remote, js = "allyPopup = new SimpleChoiceWidget({id: 'scwPopup'});\
				glblPopupUtil.open({ \
				popup: allyPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
				}); return [allyPopup.parentNode.getAttribute('role'), allyPopup.parentNode.getAttribute('aria-label')]";
			wd.execute(js)
				.then(function (value) {
					assert.strictEqual(value[0], "region", "popup's wrapper node needs role=region");
					assert.strictEqual(value[1], "scwPopup", "popup's wrapper node needs aria-label");
				});
			return wd;
		},
		"scrollbar" : {
			"at" : function () {
				var wd = this.remote, js = "lotsOfChoicesPopup = new LotsOfChoicesWidget({id: 'tallPopup1'});\
				glblPopupUtil.open({ \
				popup: lotsOfChoicesPopup, \
				orient: 'R', \
				x: 10, \
				y: 15 \
				}); return [domStyleGlobal.get(lotsOfChoicesPopup, 'height'), winUtilsGlobal.getBox().h, domStyleGlobal.get(lotsOfChoicesPopup.parentNode, 'height')]";
				wd.execute(js)
					.then(function (value) {
						assert.isTrue(value[0] > value[1], "lotsOfChoicesPopup popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "lotsOfChoicesPopup wrapper is not shorter than viewport");
					});
				return wd;
			},
			"around" : function () {
				// cant use .click() here because it fails in chrome, see http://stackoverflow.com/questions/11908249/debugging-element-is-not-clickable-at-point-error
				var wd = this.remote, js = "tallChoiceDropDownButton.click();\
				return [domStyleGlobal.get(tallChoiceDropDown, 'height'), winUtilsGlobal.getBox().h, domStyleGlobal.get(tallChoiceDropDown.parentNode, 'height')]";
				wd.execute(js)
					.then(function (value) {
						assert.isTrue(value[0] > value[1], "tallChoiceDropDown popup is not taller than the viewport");
						assert.isTrue(value[2] < value[1], "tallChoiceDropDown wrapper is not shorter than viewport");
					});
				return wd;
			}

		}
	});
});
