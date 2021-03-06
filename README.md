# Tao.js

**A simple, tiny (~5kB minified, ~2kB gzipped), isomorphic, precise and fast template engine for handling both string and live dom based templates with custom keys, including nested keys. No dependencies.**

![Tao.js](tao.jpg)

[Tao.js](https://raw.githubusercontent.com/foo123/Tao.js/master/Tao.js),  [Tao.min.js](https://raw.githubusercontent.com/foo123/Tao.js/master/Tao.min.js)


[Meaning of Dao (Tao) in Chinese Philosophy (wikipedia)](https://en.wikipedia.org/wiki/Tao)


**see also:**

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/JS, PHP, Python, ActionScript
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets used as (template) plugins and/or standalone for PHP, Node/JS, Python both client and server-side (can be used as [plugins for Contemplate](/src/js/plugins/plugins.txt))
* [Importer](https://github.com/foo123/Importer) simple class &amp; dependency manager and loader for PHP, Node/JS, Python
* [DateX](https://github.com/foo123/DateX) eXtended &amp; localised Date parsing, diffing, formatting and validation for Node/JS, Python, PHP
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node/JS, PHP, Python, ActionScript
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node/JS, PHP, Python, ActionScript
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node/JS, PHP, Python, ActionScript
* [RegExpX](https://github.com/foo123/RegExpX) powerful and versatile pattern matching for Node/JS (in progress)
* [Xpresion](https://github.com/foo123/Xpresion) a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, Node/JS, ActionScript
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for PHP, Python, Node/JS
* [Abacus](https://github.com/foo123/Abacus) a fast combinatorics and computation library for Node/JS, PHP, Python
* [RT](https://github.com/foo123/RT) client-side real-time communication for Node/XPCOM/JS with support for Poll/BOSH/WebSockets
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


Parts of this tiny project were implemented and used in other projects like `Xpresion`, `Contemplate` and `ModelView`.
However decided to unify these parts into a tiny, re-usable and modular library.


**Isomorphism**

**Tao** can handle templates both as a string format and as a live DOM Node format.
String Templates accept a string input (the template) and output also a string. Dom Templates accept a live DOM Node as input (the template) and update this same node with the given data in an efficient and fast way.

On the server-side one can render the templates (with given data) as html strings and revive these templates (which are now HTML DOM Nodes) on the client. This is how isomorphism works for the `Tao` engine.


**Template Revival**

**Template revival** feature (version `0.3+`) is what gives Tao Engine its (full) isomorphism capability. Other approaches at template isomorphy employ *Virtual DOM* (e.g `React.js`) or some other **diffing/patching pattern**. The problem is that when a template is rendered as html string, the information about where the dynamic parts (template keys) are in the template is lost, so the client-side part of the isomorphic code cannot take it from there and continue. `Tao` solves this problem by **leveraging the functionality of HTML comments**, which are not rendered on the browser and which can be used to annotate the template with the missing template key information (when rendered as html string, e.g on the server). Then the client-side part of the engine can *revive* the rendered html template and make it a **live DOM template** with minimum processing and hussle as if it was defined directly as DOM template and not passed as, already rendered, html string template. This can be very efficient.


If a template is to be revived, one sets the `revivable` option to **true** (**false** by default) both on the string template when defined and on the definition of the revived dom template (see test examples).


**Nested Keys**

By default the `Tao` engine, handles single keys ie `$(key1)`, `$(key2)`. However by setting a `key separator` parameter (see examples, version `0.3.4+`), `Tao` can use nested keys efficiently, i.e `$(key1.key2)`, `$(a.nested.key)` and so on.



**API and Examples**

```html
<script src="./Tao.js"></script>
<!-- assume a dom template like this: -->
<div id="node" class="$(className)">Hello $(user), your location is $(nested.location)</div>

```

```javascript
// Tao is a UMD module and can be used in both Node, browser <script></script> tags and requireJS
var isNode = 'undefined' !== typeof global && '[object global]' === Object.prototype.toString.call(global);
var Tao = isNode ? require('./Tao.js') : window.Tao;
var keys_re = /\$\(([^\)]+)\)/;
var tpl_data = {className1: 'div-class1', className3: 'div-class3', attribute: 'attribute', user: 'Nikos', nested:{location: 'GR'}};

if ( isNode )
{
    var str_tpl = '<div id="node" class="$(className1) div-class2 $(className3)" data-att="$(attribute) $(className1)">Hello $(user), your location is $(location)</div>';
    var tao_renderer = Tao( str_tpl, keys_re, false, '.' /* nested key separator, optional default is none */ );
    console.log(tao_renderer(tpl_data));
    // re-render/update template with only partial data (previous values will be used if missing)
    console.log(tao_renderer({user: 'Yianis', className3: 'div-class4'}));
    // dispose the templates and any dependencies
    tao_renderer.dispose();
}
else
{
    var str_tpl = '<div id="node2" class="$(className1) div-class2 $(className3)" data-att="$(attribute) $(className1)">Hello $(user), your location is $(nested.location)</div>';
    // manipulate template so it can be revived on client-side from rendered string
    var tao_renderer_str = Tao( str_tpl, keys_re, true, '.' /* nested key separator, optional default is none */ );
    document.body.innerHTML += tao_renderer_str( tpl_data );
    var dom_tpl = document.getElementById('node');
    var dom_tpl_revivable = document.getElementById('node2');
    var tao_renderer_dom = Tao( dom_tpl, keys_re, false, '.' /* nested key separator, optional default is none */ );
    // template can be revived on client-side from rendered string
    var tao_renderer_dom_revivable = Tao( dom_tpl_revivable, keys_re, true, '.' /* nested key separator, optional default is none */ );
    tao_renderer_dom(tpl_data);
    // template can be revived on client-side from rendered string
    tao_renderer_dom_revivable({user: 'Yianis', className3: 'div-class4', nested:{location:'FR'}});
    // dispose the templates and any dependencies
    tao_renderer_str.dispose();
    tao_renderer_dom.dispose(); // does NOT remove any dom Node
    tao_renderer_dom_revivable.dispose(); // does NOT remove any dom Node
}
```



**Tests**

see **./test.js** and **./test.html** for node and browser basic functionality tests


**Performance**

to be added


**Todo**

* add `foreach` functionality for data keys which are arrays/collections
* enable special `DOM` attributes/properties like `input.value`, `select.value`, .. by updating the necessary element properties accordingly
