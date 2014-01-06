define([], function () {
	function getDisplayContainer(element) {
		var parentNode = element.parentNode;
		if (parentNode == null) {
			return null;
		} else {
			if (parentNode.performDisplay) {
				return parentNode;
			}
			return getDisplayContainer(parentNode);
		}
	};

	function displayHandler(event) {
		if (event.target === document) {
			// we work either by id or by node
			var destElement = typeof event.dest === "string" ? document.getElementById(event.dest) : event.dest;
			var destContainer = getDisplayContainer(destElement);
			destContainer.emit("delite-display", event);
		}
	};

	function loadHandler(event) {
		// TODO implement simple view loading like in dojox/mobile or let dapp always handle complex cases or
		// provide alternate DisplayController as separated projects
		event.loadDeferred.resolve({
			child: typeof event.dest === "string" ? document.getElementById(event.dest) : event.dest
		});
	};

	document.addEventListener("delite-display-load", loadHandler);
	document.addEventListener("delite-display", displayHandler, true);
});

