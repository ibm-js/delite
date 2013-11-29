define(["require", "dojo/has"], function (require, has) {
	has.add("delite-DisplayController", "dui/DisplayController");
	return {
		// summary:
		//		AMD plugin that loads the module corresponding to the MID returned by a has() check
		// description:
		//		require(["dui/hasLoad!delite-DisplayController"], function (DisplayController) { });
		//		with has("delite-DisplayController") === "my/DisplayController"
		//		will load my/DisplayController module.
		//		If the has check returns null no module is loaded and no error thrown.

		load: function (id, require, onload) {
			if (id && has(id)) {
				require([has(id)], onload);
			} else {
				onload();
			}
		}
	};
});
