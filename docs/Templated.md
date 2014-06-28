# delite/Templated

`delite/Templated` is a mixin used by widgets with templates, in conjunction with [`delite/handlebars`](handlebars.md).

Extending `delite/Templated` rather than `delite/Widget` has two effects:

(1) You specify the template via the `template` property rather than `buildRendering()` method:

```js
define(["delite/register", "delite/Templated", "delite/handlebars!./template/MyTemplate.html"],
   function (register, Templated, template){

	register("my-widget", [HTMLElement, Templated], {
		template: template
	});
});
```

(2) It allows subclasses of a Templated widget to more easily inline a template definition:

```js
define(["delite/register", "delite/SuperClass"],
		function (register, SuperClass){

	register("my-sub-widget", [SuperClass], {
		template: "<template>hello world</template>"
	});
});
```