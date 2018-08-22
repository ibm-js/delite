define([
	"require",
	"intern",
	"intern!object",
	"intern/chai!assert",
	"intern/dojo/node!leadfoot/keys",
	"intern/dojo/node!leadfoot/helpers/pollUntil"
], function (require, intern, registerSuite, assert, keys, pollUntil) {

	registerSuite({
		name: "KeyNav functional tests",

		setup: function () {
			if (this.remote.environmentType.brokenSendKeys || !this.remote.environmentType.nativeEvents) {
				return this.skip("no keyboard support");
			}

			return this.remote
				.get(require.toUrl("./KeyNavTests.html"))
				.then(pollUntil("return ready || null;", [],
					intern.config.WAIT_TIMEOUT, intern.config.POLL_INTERVAL));
		},

		tabIndex: function () {
			return this.remote
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

		"tabIndex with mouse": function () {
			return this.remote
				.findById("focus").click().end()
				.execute("return document.activeElement.value").then(function (value) {
					assert.strictEqual(value, "input before grid", "<input> before <my-grid>");
				})
				.findById("apple").click().end()
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "apple", "focus");
				})
				.execute("return [].slice.call(document.querySelectorAll('my-grid my-cell'))" +
					".map(function(node){return node.tabIndex})").then(function (value) {
					assert.deepEqual(value, [0, -1, -1, -1, -1, -1, -1, -1], "tabindexes #1");
				})
				.findById("banana").click().end()
				.execute("return document.activeElement.id").then(function (value) {
					assert.strictEqual(value, "banana", "focus");
				})
				.execute("return [].slice.call(document.querySelectorAll('my-grid my-cell'))" +
					".map(function(node){return node.tabIndex})").then(function (value) {
					assert.deepEqual(value, [-1, 0, -1, -1, -1, -1, -1, -1], "tabindexes #2");
				});
		},

		"grid arrow navigation": function () {
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

		"activationTracker integration": function () {
			return this.remote
				.findById("keyboardInput").click().end()
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.activateLog.join(', ')").then(function (value) {
					// Test for bug where child would get a delite-deactivated event immediately after the
					// delite-activated event.
					assert.strictEqual(value, "activated");
				});
		},

		"multi char search with spaces": function () {
			return this.remote
				.findById("keyboardInput")
				.click()
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "Alabama", "navigated to Alabama");
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
			return this.remote
				.findByCssSelector("#keyboardInputCust")
					.click()
					.end()

				.pressKeys(keys.TAB)// enters KeyNav, navigates to <input>
				.execute("return document.activeElement.id;")
				.then(function (value) {
					assert.strictEqual(value, "myInput", "focused on <input>");
				})
				.pressKeys("a b c")	// sending space to input shouldn't call registered handler for space key
				.execute("return myInput.value")
				.then(function (value) {
					assert.strictEqual(value, "a b c", "typing into input");
				})
				.execute("return spaces.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "<input>: no handler callbacks");
				})

				.pressKeys(keys.ARROW_DOWN)		// navigate to <button>
				.execute("return document.activeElement.id;")
				.then(function (value) {
					assert.strictEqual(value, "myButton", "focused on <button>");
				})
				.pressKeys(" ")	// sending space to <button> shouldn't call registered handler for space key
				.pressKeys(keys.ENTER)	// likewise for enter key
				.execute("return spaces.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "<button>: no handler callbacks");
				})
				.execute("return myButton.innerHTML")
				.then(function (value) {
					assert.strictEqual(value, "2 clicks", "keyboard clicks on <button>");
				})

				.pressKeys(keys.ARROW_DOWN)	// navigate to <a>
				.execute("return document.activeElement.id;")
				.then(function (value) {
					assert.strictEqual(value, "myAnchor", "focused on <a>");
				})
				.pressKeys(keys.ENTER)	// sending Enter to <a> should click it, not be processed by KeyNav
				.execute("return myAnchor.innerHTML")
				.then(function (value) {
					assert.strictEqual(value, "1 click", "keyboard click on <a>");
				})
				.execute("return spaces.textContent")
				.then(function (value) {
					assert.strictEqual(value, "0", "<a>: no handler callbacks");
				})

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

		combobox: {
			keyboard: function () {
				return this.remote.execute("document.body.scrollTop = 10000; combobox.focus();")
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
						.end();
			},

			mouse: function () {
				var environmentType = this.remote.environmentType;
				if (environmentType.brokenMouseEvents) {
					// https://github.com/theintern/leadfoot/issues/17
					return this.skip("click() doesn't generate mousedown, so navigation won't work");
				}
				if (environmentType.platformName === "iOS" || environmentType.platform === "ANDROID") {
					// https://github.com/theintern/leadfoot/issues/61
					return this.skip("click() doesn't generate touchstart, so navigation won't work");
				}

				return this.remote.execute("document.body.scrollTop = 10000; combobox.focus();")
					.findById("unfocusable_NJ")
						.click()
						.end()
					.findByCssSelector("#combobox_dropdown .d-active-descendant")
						.getVisibleText().then(function (value) {
							assert.strictEqual(value, "New Jersey", "navigated to New Jersey");
						})
						.end()
					.findById("combobox_dropdown_current_node")
						.getVisibleText().then(function (value) {
							assert.strictEqual(value, "New Jersey", "got navigation event (cur)");
						})
						.end();
			}
		},

		"container node": function () {
			return this.remote
				.findById("keynavroot_before").click().end()
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "before button", "initial tab in");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "Alabama", "after tab");
				})
				.pressKeys(keys.ARROW_DOWN)
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "Alaska", "after arrow down");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "after button", "after tab");
				})
				.pressKeys(keys.TAB)
				.execute("return document.activeElement.id;").then(function (id) {
					assert.strictEqual(id, "keynavroot_after");
				})
				.pressKeys(keys.SHIFT + keys.TAB)		// start holding down shift key and press tab
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "after button", "after shift-tab");
				})
				.pressKeys(keys.TAB)	// effectively shift-tab,
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "Alabama", "after shift-tab");
				})
				.pressKeys(keys.ARROW_DOWN)
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "Alaska", "after shift-tab");
				})
				.pressKeys(keys.TAB)		// effectively shift-tab
				.execute("return document.activeElement.textContent.trim();").then(function (text) {
					assert.strictEqual(text, "before button", "after shift-tab");
				})
				.pressKeys(keys.SHIFT);	// release the shift key
		}
	});
});
