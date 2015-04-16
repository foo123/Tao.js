/**
*  Tao
*  A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
*
*  @version: 0.2
*  https://github.com/foo123/Tao.js
*
**/
!function( root, name, factory ) {
    "use strict";
    //
    // export the module, umd-style (no other dependencies)
    var isCommonJS = ("object" === typeof(module)) && module.exports, 
        isAMD = ("function" === typeof(define)) && define.amd, m;
    // CommonJS, node, etc..
    if ( isCommonJS ) 
        module.exports = (module.$deps = module.$deps || {})[ name ] = module.$deps[ name ] || (factory.call( root, {NODE:module} ) || 1);
    // AMD, requireJS, etc..
    else if ( isAMD && ("function" === typeof(require)) && ("function" === typeof(require.specified)) && require.specified(name) ) 
        define( name, ['require', 'exports', 'module'], function( require, exports, module ){ return factory.call( root, {AMD:module} ); } );
    // browser, web worker, etc.. + AMD, other loaders
    else if ( !(name in root) ) 
        (root[ name ] = (m=factory.call( root, {} ) || 1)) && isAMD && define( name, [], function( ){ return m; } );
}(  /* current root */          this, 
    /* module name */           "Tao",
    /* module factory */        function( exports, undef ) {
"use strict";

var HAS = 'hasOwnProperty', MATCH = 'match', VALUE = 'nodeValue', PARENT = 'parentNode'
    ,KEYS = 0, ATTS = 1, Keys = Object.keys
    // use hexadecimal string representation in order to have optimal key distribution in hash (??)
    ,nuuid = 0, node_uuid = function( n ) { return n.$TID$ = n.$TID$ || n.id || ('_TID_'+(++nuuid).toString(16)); }
    ,multisplit_string = function multisplit_string( str, re_keys ) {
        var tpl = [ ], i = 0, m;
        // find and split the tpl_keys
        while ( m = re_keys.exec( str ) )
        {
            tpl.push([1, str.slice(i, re_keys.lastIndex - m[0].length)]);
            tpl.push([0, m[1] ? m[1] : m[0], undef]);
            i = re_keys.lastIndex;
        }
        tpl.push([1, str.slice(i)]);
        return tpl;
    }
    ,multisplit_node = function multisplit_node( node, re_keys ) {
        var tpl_keys, matchedNodes, matchedAtts, i, l, m, matched, n, a, key, nid, atnodes,
            keyNode, aNodes, aNodesCached, txt, rest, stack, keyNodes, keyAtts, hash = {}
        ;
         matchedNodes = [ ]; matchedAtts = [ ]; n = node;
        // find the nodes having tpl_keys
        if ( n.attributes && (l=n.attributes.length) ) 
        {
            for (i=0; i<l; i++)
            {
                a = n.attributes[ i ];
                if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
            }
        }
        if ( 3 === n.nodeType ) // textNode 
        {
            if ( m=n[VALUE][MATCH](re_keys) ) matchedNodes.push([n, m, n[PARENT]]);
        }  
        else if ( n.firstChild )
        {
            stack = [ n=n.firstChild ];
            while ( stack.length ) 
            {
                if ( n.attributes && (l=n.attributes.length) ) 
                {
                    for (i=0; i<l; i++)
                    {
                        a = n.attributes[ i ];
                        if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
                    }
                }
                if ( n.firstChild ) stack.push( n=n.firstChild );
                else 
                {
                    if ( 3 === n.nodeType && (m=n[VALUE][MATCH](re_keys)) ) matchedNodes.push([n, m, n[PARENT]]);
                    n = stack.pop( );
                    while ( stack.length && !n.nextSibling ) n = stack.pop( );
                    if ( n.nextSibling ) stack.push( n=n.nextSibling );
                }
            }
        }
        // split the tpl_keys nodes
        atnodes = { };
        for (i=0,l=matchedNodes.length; i<l; i++)
        {
            matched = matchedNodes[ i ];
            rest = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n );
            hash[nid] = hash[nid] || [{},{}]; atnodes[nid] = n;
            keyNodes = hash[nid][KEYS];
            txt = rest[VALUE];  
            if ( txt.length > m[0].length )
            {
                // node contains more text than just the $(key) ref
                do {
                    key = m[1]; keyNode = rest.splitText( m.index );
                    rest = keyNode.splitText( m[0].length );
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                    m = rest[VALUE][MATCH]( re_keys );
                } while ( m );
            }
            else
            {
                key = m[1]; keyNode = rest;
                (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
            }
        }
        aNodes = { };
        for (i=0,l=matchedAtts.length; i<l; i++)
        {
            matched = matchedAtts[ i ];
            a = matched[0]; m = matched[1]; n = matched[2];
            nid = node_uuid( n );
            hash[nid] = hash[nid] || [{},{}]; atnodes[nid] = n;
            keyNodes = hash[nid][KEYS]; keyAtts = hash[nid][ATTS];
            txt = a[VALUE];  aNodesCached = (txt in aNodes);
            if ( !aNodesCached ) 
            {
                rest = document.createTextNode(txt||''); aNodes[ txt ] = [[], [ rest ]];
                if ( txt.length > m[0].length )
                {
                    // attr contains more text than just the $(key) ref
                    do {
                        key = m[1];
                        keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        aNodes[ txt ][0].push( key );
                        aNodes[ txt ][1].push( keyNode ); 
                        aNodes[ txt ][1].push( rest );
                        (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                        (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                        m = rest[VALUE][MATCH]( re_keys );
                    } while ( m );
                }
                else
                {
                    keyNode = rest; key = m[1];
                    aNodes[ txt ][0].push( key );
                    (keyNodes[key]=keyNodes[key]||[]).push( keyNode );
                    (keyAtts[key]=keyAtts[key]||[]).push( [a, aNodes[ txt ][1], txt] );
                }
            }
            else
            {
                // share txt nodes between same (value) attributes
                for (m=0; m<aNodes[ txt ][0].length; m++)
                    keyAtts[aNodes[ txt ][0][m]].push( [a, aNodes[ txt ][1], txt] );
            }
        }
        
        // convert to another hash format based on tpl_key
        tpl_keys = {};
        for (nid in hash)
        {
            if ( !hash[HAS](nid) ) continue;
            for (key in hash[nid][KEYS] )
            {
                if ( !hash[nid][KEYS][HAS](key) ) continue;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [hash[nid][KEYS][key], hash[nid][ATTS][key]||[]];
                else tpl_keys[key][KEYS] = tpl_keys[key][KEYS].concat(hash[nid][KEYS][key]);
            }
            for (key in hash[nid][ATTS] )
            {
                if ( !hash[nid][ATTS][HAS](key) ) continue;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [hash[nid][KEYS][key]||[], hash[nid][ATTS][key]];
                else tpl_keys[key][ATTS] = tpl_keys[key][ATTS].concat(hash[nid][ATTS][key]);
            }
        }
        return tpl_keys;
    }
;

function Tpl( tpl, re_keys )
{
    if ( !tpl ) return null;
    if ( tpl.substr && tpl.substring )
    {
        var tpl_keys = multisplit_string( tpl, new RegExp(re_keys.source, "g") /* make sure global flag is added */);
        var renderer = function( data ) {
            var l = tpl_keys.length,
                i, notIsSub, s, out = ''
            ;
            for (i=0; i<l; i++)
            {
                notIsSub = tpl_keys[ i ][ 0 ]; s = tpl_keys[ i ][ 1 ];
                if ( notIsSub )
                {
                    out += s;
                }
                else
                {
                    // allow to render/update tempate with partial data updates only
                    // check if not key set and re-use the previous value (if any)
                    if ( data[HAS](s) ) tpl_keys[i][2] = String(data[ s ]);
                    out += tpl_keys[i][2];
                }
            }
            return out;
        };
        renderer.dispose = function(){ tpl = null; tpl_keys = null; };
        return renderer;
    }
    else //if (tpl is dom_node)
    {
        var tpl_keys = multisplit_node( tpl, new RegExp(re_keys.source, "") /* make sure global flag is removed */ );
        var renderer = function( data ) {
            var att, i, l, keys, key, k, kl, val, keyNodes, keyAtts, nodes, ni, nl, txt;
            keys = Keys(data); kl = keys.length
            for (k=0; k<kl; k++)
            {
                key = keys[k]; val = String(data[key]);
                if ( !tpl_keys[HAS](key) ) continue;
                
                // element live text nodes
                keyNodes = tpl_keys[key][KEYS]; 
                for (i=0,l=keyNodes.length; i<l; i++) 
                {
                    keyNodes[i][VALUE] = val;
                }
                
                // element live attributes
                keyAtts = tpl_keys[key][ATTS];
                for (i=0,l=keyAtts.length; i<l; i++) 
                {
                    att = keyAtts[i]; 
                    // inline join_text_nodes
                    nodes = att[1]; nl = nodes.length; 
                    txt = nl ? nodes[0][VALUE] : '';
                    if ( nl > 1 ) for (ni=1; ni<nl; ni++) txt += nodes[ni][VALUE];
                    att[0][VALUE] = txt;
                }
            }
        };
        renderer.dispose = function(){ tpl = null; tpl_keys = null; };
        return renderer;
    }
}
Tpl.VERSION = "0.2";
// export it
return Tpl;
});