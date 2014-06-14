define(["intern!object",
	"intern/chai!assert",
	"require"
], function (registerSuite, assert, require) {

	registerSuite({
		name: "KeyNav functional tests",

		"setup": function () {
			return this.remote
				.get(require.toUrl("./KeyNavTests.html"))
				.waitForCondition("ready", 40000);
		},

		"tabindex": function () {
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver doesn't support tabbing, see https://code.google.com/p/selenium/issues/detail?id=5403
				return;
			}
			this.timeout = 10000;
			return this.remote.execute("return document.activeElement.value")
				.elementById("focus")
				.click()
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "input before grid", "<input> before <my-grid>");
				})
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "tabbed to apple");
				})
				.keys("\uE008\uE004") // shift tab
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "input before grid", "shift tabbed back to initial element");
				})
				.keys("\uE008") // release shift
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "tabbed to apple again");
				})
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "one", "tabbed to first element on programmatic KeyNav w/implicit tabIndex");
				})
				.execute("secondInput.focus()")// don't tab from previous KeyNav, it goes to address bar [on chrome]
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "tabindex=2", "focused input before prog KeyNav w/tabindex=3 setting");
				})
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "tabbed to declarative KeyNav with tabindex=3 setting");
				})
				.keys("\uE004") // tab
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "seven", "tabbed past INPUT to programmatic KeyNav with tabindex=5 setting");
				});

		},
		"grid arrow navigation": function () {
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver apparently doesn't support arrow keys either
				return;
			}
			return this.remote.execute("grid.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "focus");
				})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "pear", "down");
				})
				.keys("\uE014") // arrow right
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "grapes", "right");
				})
				.keys("\uE012") // arrow left
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "pear", "left");
				})
				.keys("\uE013") // arrow up
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "up");
				})
				.keys("\uE010") // end
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "raspberry", "end");
				})
				.keys("\uE011") // home
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "home");
				});
		},

		"grid letter search": function () {
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver just doesn't work testing keystrokes ...
				return;
			}
			return this.remote.execute("grid.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "apple", "focus");
				})
				.keys("b") // search for word starting with b
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "banana", "b");
				})
				.wait(100)		// clear timer so next keystroke taken as new search rather than continuation
				.keys("b") // search for next word starting with b
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "blueberry", "b again");
				})
				.wait(100)		// clear timer so next keystroke taken as new search rather than continuation
				.keys("r") // search for word starting with r
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "raspberry", "right");
				})
				.wait(100)		// clear timer so next keystroke taken as new search rather than continuation
				.keys("bl") // search for word starting with bl
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "blueberry", "bl");
				});
		},

		"multi char search with spaces": function () {
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver just doesn't work testing keystrokes ...
				return;
			}
			return this.remote
				.elementById("keyboardInput")
				.click()
				.keys("\uE004") // tab
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.equal(value, "Alabama", "clicked Alabama");
				})
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.equal(value, "0", "no click events yet");
				})
				.keys("new m")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.equal(value, "New Mexico", "new m");
				})
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.equal(value, "0", "no click events after 'new m' search");
				})
				.wait(1000)
				// Now that 1000ms have elapsed, the search should be canceled, and each space typed
				// should generate an a11y click event
				.keys("   ")
				.execute("return clicks.textContent")
				.then(function (value) {
					assert.equal(value, "3", "space key outside of search causes click events");
				})
				// And make sure that we can search to somewhere else
				.keys("n")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.equal(value, "New York", "n");
				});
		},

		"embedded form controls": function () {
			if (/safari|iphone/.test(this.remote.environmentType.browserName)) {
				// SafariDriver apparently doesn't support arrow keys either
				return;
			}
			return this.remote.execute("testContainer2.focus();")
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "focus");
				})
				.keys("\uE015") // arrow down
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "input", "down");
				})
				.keys("fo")		// should write to the <input> rather than letter searching to <div>four</div>
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "input", "still input1");
				})
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "fo", "input works");
				})
				.keys("\uE012l") // arrow left then type "l"
				.execute("return document.activeElement.value")
				.then(function (value) {
					assert.strictEqual(value, "flo", "left arrow worked");
				})
				.keys("\uE015") // arrow down should exit the <input> and go to the next node
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "five", "down to five");
				})
				.keys("\uE015") // arrow down again to checkbox
				.execute("return document.activeElement.id")
				.then(function (value) {
					assert.strictEqual(value, "checkbox", "down to checkbox");
				})
				.keys(" ") // check the checkbox using keyboard
				.execute("return document.activeElement.checked")
				.then(function (value) {
					assert.strictEqual(value, true, "checked the checkbox");
				})
				.keys("f") // keyboard search should go to "four" node
				.execute("return document.activeElement.textContent")
				.then(function (value) {
					assert.strictEqual(value, "four", "keyboard searched to 'four'");
				});
		}
	});
});