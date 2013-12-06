define(["dcl/dcl",
        "dui/register",
        "./AbstractCategoryRenderer"
], function (dcl, register, AbstractCategoryRenderer) {
	
	var DefaultCategoryRenderer = dcl([AbstractCategoryRenderer], {

		renderCategory: function (category) {
			this.innerHTML = category;
		}

	});

	return register("d-list-category", [HTMLElement, DefaultCategoryRenderer]);
});