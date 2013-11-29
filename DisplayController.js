define([], function () {
	var getDisplayContainer = function (element) {
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
	var displayHandler = function (event) {
		if (event.target === document) {
			var destElement = document.getElementById(event.dest);
			var destContainer = getDisplayContainer(destElement);
			destContainer.emit("delite-display", event);
		}
	};

	var loadHandler = function (event) {
		// TODO implement simple view loading like in dojox/mobile or let dojox/app always handle complex cases or
		// provide alternate DisplayController as separated projects
		event.loadDeferred.resolve(null);
	};

	document.addEventListener("delite-display-load", loadHandler);
	document.addEventListener("delite-display", displayHandler, true);
});

