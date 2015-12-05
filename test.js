// Tao is a UMD module and can be used in both Node, browser <script></script> tags and requireJS
var isNode = 'undefined' !== typeof global && '[object global]' === Object.prototype.toString.call(global);
var Tao = isNode ? require('./Tao.js') : window.Tao;
var keys_re = /\$\(([^\(\)]+)\)/;
var tpl_data = {className1: 'div-class1', className3: 'div-class3', attribute: 'attribute', user: 'Nikos', nested:{location: 'GR'}};

if ( isNode )
{
    var str_tpl = '<div id="node" class="$(className1) div-class2 $(className3)" data-att="$(attribute) $(className1)">Hello $(user), your location is $(nested.location)</div>';
    var tao_renderer = Tao( str_tpl, keys_re, false, '.' );
    console.log(tao_renderer(tpl_data));
    // re-render/update template with only partial data (previous values will be used if missing)
    console.log(tao_renderer({user: 'Yianis', className3: 'div-class4', nested:{location:'FR'}}));
    // dispose the templates and any dependencies
    tao_renderer.dispose();
}
else
{
    var str_tpl = '<div id="node2" class="$(className1) div-class2 $(className3)" data-att="$(attribute) $(className1)">Hello $(user), your location is $(nested.location)</div>';
    // manipulate template so it can be revived on client-side from rendered string
    var tao_renderer_str = Tao( str_tpl, keys_re, true, '.' );
    document.body.innerHTML += tao_renderer_str( tpl_data );
    var dom_tpl = document.getElementById('node');
    var dom_tpl_revivable = document.getElementById('node2');
    var tao_renderer_dom = Tao( dom_tpl, keys_re, false, '.' );
    // template can be revived on client-side from rendered string
    var tao_renderer_dom_revivable = Tao( dom_tpl_revivable, keys_re, true, '.' );
    tao_renderer_dom(tpl_data);
    // template can be revived on client-side from rendered string
    tao_renderer_dom_revivable({user: 'Yianis', className3: 'div-class4', nested:{location:'FR'}});
    // dispose the templates and any dependencies
    tao_renderer_str.dispose();
    tao_renderer_dom.dispose(); // does NOT remove any dom Node
    tao_renderer_dom_revivable.dispose(); // does NOT remove any dom Node
}
