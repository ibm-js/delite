define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil",
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "KeyNav functional tests",

		setup: function () {
			return this.remote
				.get(require.toUrl("./KeyNavTests.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tabIndex: function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			this.timeout = intern.config.TEST_TIMEOUT;
			return this.remote.execute("return document.activeElement.value")
				.findById("focus")
				.click()
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "input before grid", "<input> before <my-grid>");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "tabbed to apple");
				})
				.pressKeys(keys.SHIFT + keys.TAB)
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "input before grid", "shift tabbed back to initial element");
				})
				.pressKeys(keys.SHIFT)// release shift
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "tabbed to apple again");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "one",
						"tabbed to first element on programmatic KeyNav w/implicit tabIndex");
				})
				.execute("secondInput.focus()")// don't tab from previous KeyNav, it goes to address bar [on chrome]
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "tabindex=2", "focused input before prog KeyNav w/tabindex=3 setting");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "tabbed to declarative KeyNav with tabindex=3 setting");
				})
				.pressKeys(keys.TAB)
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "seven",
						"tabbed past INPUT to programmatic KeyNav with tabindex=5 setting");
				});
		},

		"grid arrow navigation": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.execute("grid.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "focus");
				})
				.pressKeys(keys.ARROW_DOWN)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "pear", "down");
				})
				.pressKeys(keys.ARROW_RIGHT)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "grapes", "right");
				})
				.pressKeys(keys.ARROW_LEFT)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "pear", "left");
				})
				.pressKeys(keys.ARROW_UP)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "up");
				})
				.pressKeys(keys.END)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "raspberry", "end");
				})
				.pressKeys(keys.HOME)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "home");
				});
		},

		"grid letter search": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.execute("grid.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "focus");
				})
				.pressKeys("b") // search for word starting with b
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "banana", "b");
				})
				.sleep(100)		// clear timer so next keystroke taken as new search rather than continuation
				.pressKeys("b") // search for next word starting with b
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "blueberry", "b again");
				})
				.sleep(100)		// clear timer so next keystroke taken as new search rather than continuation
				.pressKeys("r") // search for word starting with r
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "raspberry", "right");
				})
				.sleep(100)		// clear timer so next keystroke taken as new search rather than continuation
				.pressKeys("bl") // search for word starting with bl
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "blueberry", "bl");
				});
		},

		"multi char search with spaces": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote
				.findById("keyboardInput")
				.click()
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "Alabama", "clicked Alabama");
				})
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "no click events yet");
				})
				.pressKeys("new m")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "New Mexico", "new m");
				})
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "no click events after 'new m' search");
				})
				.sleep(1000)
				// Now that 1000ms have elapsed, the search should be canceled, and each space typed
				// should generate an a11y click event
				.pressKeys("   ")
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.strictEqual(value, "3", "space key outside of search causes click events");
				})
				// And make sure that we can search to somewhere else
				.pressKeys("n")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "New York", "n");
				});
		},

		"setup key handler for space": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote
				.findByCssSelector("#keyboardCust > input")
					.click()
					.pressKeys("a b c")	// sending space to input shouldn't call registered handler for space key
					.execute("return spaces.textContent")
					.then(function (value) {
						assert.strictEqual(value, "0", "no handler callbacks yet");
					})
					.end()
				.pressKeys(keys.ARROW_DOWN)
				.pressKeys("new m")// similarly, handler shouldn't be called for space within a searchstring
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "New Mexico", "new m");
				})
				.execute("return spaces.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "no handler callback after 'new m' search");
				})
				.sleep(1000)
				// Now that 1000ms have elapsed, the search should be canceled, and each space typed
				// should call the handler registered for the space key.
				.pressKeys("   ")
				.execute("return spaces.textContent")
				.then(function (value) {
					assert.strictEqual(value, "3", "space key outside of search calls registered handler");
				});
		},

		"embedded form controls": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			return this.remote.execute("testContainer2.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "focus");
				})
				.pressKeys(keys.ARROW_DOWN)
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "input", "down");
				})
				.pressKeys("fo")		// should write to the <input> rather than letter searching to <div>four</div>
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "input", "still input1");
				})
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "fo", "input works");
				})
				.pressKeys(keys.ARROW_LEFT + "l")
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "flo", "left arrow worked");
				})
				.pressKeys(keys.ARROW_DOWN) // arrow down should exit the <input> and go to the next node
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "five", "down to five");
				})
				.pressKeys(keys.ARROW_DOWN) // arrow down again to checkbox
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "checkbox", "down to checkbox");
				})
				.pressKeys(" ") // check the checkbox using keyboard
				.execute("return document.activeElement.checked")
				.then(function (value) {
					assert.strictEqual(value, true, "checked the checkbox");
				})
				.pressKeys("f") // keyboard search should go to "four" node
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "keyboard searched to 'four'");
				});
		},

		"combobox": function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}
			var chain = this.remote.execute("document.body.scrollTop = 10000; combobox.focus();")
				.pressKeys(keys.ARROW_DOWN)
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "combobox", "down arrow leaves focus on combobox");
				})
				.findByCssSelector("#combobox_dropdown .d-active-descendant")
					.getVisibleText().then(function (value) {
						assert.strictEqual(value, "Alaska", "navigated to Alaska");
					})
					.end()
				.findById("combobox_dropdown_previous_node")
					.getVisibleText().then(function (value) {
						assert.strictEqual(value, "Alabama", "got navigation event (prev)");
					})
					.end()
				.findById("combobox_dropdown_current_node")
					.getVisibleText().then(function (value) {
						assert.strictEqual(value, "Alaska", "got navigation event (cur)");
					})
					.end()
				.execute("return combobox_dropdown.getAttribute('aria-activedescendant');")
				.then(function (value) {
					assert.strictEqual(value, "unfocusable_AK", "aria-activedescendant set on root node");
				});

			if (this.remote.environmentType.browserName !== "internet explorer") {
				// click() doesn't generate pointerdown event on IE10+ and neither does
				// moveMouseTo().pressMouseButton(1).releaseMouseButton(1).
				// see https://github.com/theintern/leadfoot/issues/17.
				chain = chain.findByCssSelector("#combobox_dropdown > *:nth-child(5)")
						.click()
						.end()
					.findById("combobox_dropdown_current_node")
						.getVisibleText().then(function (value) {
							assert.strictEqual(value, "California", "got navigation event from click");
						})
						.end();
			}

			return chain;
		}
	});
});