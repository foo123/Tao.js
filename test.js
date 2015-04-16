// Tao is a UMD module and can be used in both Node, browser <script></script> tags and requireJS
var isNode = 'undefined' !== typeof global && '[object global]' === Object.prototype.toString.call(global);
var Tao = isNode ? require('./Tao.js') : window.Tao;
var tpl = isNode ? '<div id="node" class="$(className)">Hello $(user), your location is $(location)</div>' : document.getElementById('node');
var keys_re = /\$\(([^\)]+)\)/;
var tpl_data = {className: 'div-class', user: 'Nikos', location: 'GR'};
var tao_renderer = Tao(tpl, keys_re);

// render/update templates

console.log(tao_renderer(tpl_data));

if ( isNode )
{
    // update the template with only partial data (preevious values will be used where missing)
    console.log(tao_renderer({user: 'Yianis'}));
}

// dispose the templates and any dependencies
tao_renderer.dispose(); // does NOT remove any dom Node
