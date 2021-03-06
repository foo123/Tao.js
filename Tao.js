/**
*  Tao
*  A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
*
*  @version: 0.3.4
*  https://github.com/foo123/Tao.js
*
**/
!function( root, name, factory ) {
"use strict";
if ( 'object' === typeof exports )
    // CommonJS module
    module.exports = factory( );
else if ( 'function' === typeof define && define.amd )
    // AMD. Register as an anonymous module.
    define(function( req ) { return factory( ); });
else
    root[name] = factory( );
}(this, 'Tao', function( undef ) {
"use strict";

var HAS = 'hasOwnProperty', POS = 'lastIndexOf', MATCH = 'match'
    ,VALUE = 'nodeValue', NODETYPE = 'nodeType', PARENTNODE = 'parentNode'
    ,G = 'global', I = 'ignoreCase'
    ,Keys = Object.keys, ATT_RE = /[a-zA-Z0-9_\-]/
    ,to_int = function(v){return parseInt(v||0,10)||0;}
    ,get_nested_key = function( key, item, sep ) {
        var kk = key.split(sep||'.'), kl = kk.length-1, k, o = item;
        for (k=0; k<kl; k++)
        {
            if ( null != o[kk[k]] ) o = o[kk[k]];
            else { o = null; break; }
        }
        return o ? [1, o[kk[kl]]] : [0, null];
    }
    ,multisplit_string = function multisplit_string( str, re_keys, revivable, key_separator ) {
        var tpl = [ ], i = 0, m, sel_pos, sel, ch, ind,
            atName = false, atIndex, atKeyStart = -1, atKeyEnd = -1, atPos = 0,
            openTag, closeTag, tagEnd, insideTag = false, tpl_keys = {},
            key, with_nested_keys = !!key_separator;
        // find and split the tpl_keys
        while ( m = re_keys.exec( str ) )
        {
            sel_pos = re_keys.lastIndex - m[0].length;
            sel = str.slice(i, sel_pos);
            tagEnd = -1;
            if ( revivable )
            {
                openTag = sel[POS]('<'); closeTag = sel[POS]('>');
                // match and annotate open close xml tags as well
                if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
                {
                    tagEnd = -1; insideTag = true;
                }
                else if ( closeTag > openTag ) 
                {
                    tagEnd = closeTag+1; insideTag = false;
                }
            }
            tpl.push([1, insideTag, sel, tagEnd]);
            
            // match and annotate attributes
            if ( insideTag )
            {
                if ( -1 < (ind=sel[POS]('=')) )
                {
                    atName = ''; atIndex = ind;
                    while ( -1 < ind && ATT_RE.test(ch=sel.charAt(--ind)) ) atName = ch + atName;
                    atKeyStart = sel_pos - i - atIndex-2;
                    atPos = atKeyStart + m[0].length;
                }
                else if ( atName )
                {
                    atKeyStart = atPos + sel_pos - i - 2 -1;
                    atPos += atKeyStart + m[0].length;
                }
            }
            else
            {
                atName = false; atPos = 0; atKeyStart = -1;
            }
            key = m[1] ? m[1] : m[0];
            if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [tpl.length];
            else tpl_keys[key].push(tpl.length);
            tpl.push([0, insideTag, key, undef, atName, atKeyStart, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0]);
            i = re_keys.lastIndex;
        }
        sel = str.slice(i);
        tagEnd = -1;
        if ( revivable )
        {
            openTag = sel[POS]('<'); closeTag = sel[POS]('>');
            // match and annotate open close xml tags as well
            if ( openTag > closeTag /*&& '/' !== sel.charAt(openTag+1)*/ ) 
            {
                tagEnd = -1; insideTag = true;
            }
            else if ( closeTag > openTag ) 
            {
                tagEnd = closeTag+1; insideTag = false;
            }
        }
        tpl.push([1, insideTag, sel, tagEnd]);
        return [tpl_keys, tpl];
    }
    ,multisplit_node = function multisplit_node( node, re_keys, revivable, key_separator ) {
        var tpl_keys, matchedNodes, matchedAtts, i, l, m, matched, matches, ml, n, a, key, 
            keyNode, atnodes, aNodes, aNodesCached, txt, txtkey, txtcnt = 0, atName, att, pos, rest, stack,
            nested_key, with_nested_keys = !!key_separator
        ;
         matchedNodes = [ ]; matchedAtts = [ ]; n = node;
        // find the nodes having tpl_keys
        if ( n.attributes && (l=n.attributes.length) ) 
        {
            // revive: match key:val attribute annotations in wrapping comments
            if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
            {
                matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                atnodes = {};
                for (i=0; i<l; i++)
                {
                    m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                    if ( !atnodes[HAS](atName) )
                    {
                        atnodes[atName] = [1, []];
                        matchedAtts.push([a, atnodes[atName], n]);
                    }
                    atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                }
            }
            else
            {
                for (i=0; i<l; i++)
                {
                    a = n.attributes[ i ];
                    if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
                }
            }
        }
        if ( 3 === n[NODETYPE] ) // textNode 
        {
            // revive: match key:val annotations in wrapping comments
            if ( revivable && n.previousSibling && n.nextSibling && 
                8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                '/key' === n.nextSibling[VALUE]
            ) 
            {
                m = [n[VALUE], key.slice(4)];
                matchedNodes.push([n, m, n[PARENTNODE]]);
            }
            else if ( m=n[VALUE][MATCH](re_keys) ) 
            {
                matchedNodes.push([n, m, n[PARENTNODE]]);
            }
        }  
        else if ( n.firstChild )
        {
            stack = [ n=n.firstChild ];
            while ( stack.length ) 
            {
                if ( n.attributes && (l=n.attributes.length) ) 
                {
                    // revive: match key:val attribute annotations in wrapping comments
                    if ( revivable && n.firstChild && 8 === n.firstChild[NODETYPE] && 'att:' === n.firstChild[VALUE].slice(0,4) )
                    {
                        matches = n.firstChild[VALUE].split("\n"); l = matches.length; 
                        atnodes = {};
                        for (i=0; i<l; i++)
                        {
                            m = matches[i].split('|'); atName = m[0].slice(4); a = n.attributes[atName];
                            if ( !atnodes[HAS](atName) )
                            {
                                atnodes[atName] = [1, []];
                                matchedAtts.push([a, atnodes[atName], n]);
                            }
                            atnodes[atName][1].push([m[1].slice(4),m[2].split(',').map(to_int)]);
                        }
                    }
                    else
                    {
                        for (i=0; i<l; i++)
                        {
                            a = n.attributes[ i ];
                            if ( m=a[VALUE][MATCH](re_keys) ) matchedAtts.push([a, m, n]);
                        }
                    }
                }
                if ( n.firstChild ) stack.push( n=n.firstChild );
                else 
                {
                    if ( 3 === n[NODETYPE] )
                    {
                        // revive: match key:val annotations in wrapping comments
                        if ( revivable && n.previousSibling && n.nextSibling && 
                            8 === n.previousSibling[NODETYPE] && 8 === n.nextSibling[NODETYPE] &&
                            'key:' === (key=n.previousSibling[VALUE]).slice(0,4) &&
                            '/key' === n.nextSibling[VALUE]
                        ) 
                        {
                            m = [n[VALUE], key.slice(4)];
                            matchedNodes.push([n, m, n[PARENTNODE]]);
                        }
                        else if ( (m=n[VALUE][MATCH](re_keys)) ) 
                        {
                            matchedNodes.push([n, m, n[PARENTNODE]]);
                        }
                    }
                    n = stack.pop( );
                    while ( stack.length && !n.nextSibling ) n = stack.pop( );
                    if ( n.nextSibling ) stack.push( n=n.nextSibling );
                }
            }
        }
        // split the tpl_keys nodes
        tpl_keys = { };
        for (i=0,l=matchedNodes.length; i<l; i++)
        {
            matched = matchedNodes[ i ];
            rest = matched[0]; m = matched[1]; n = matched[2];
            txt = rest[VALUE];  
            if ( txt.length > m[0].length )
            {
                // node contains more text than just the $(key) ref
                do {
                    key = m[1] ? m[1] : m[0]; keyNode = rest.splitText( m.index );
                    rest = keyNode.splitText( m[0].length );
                    if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, []/*ATTS*/, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0];
                    else tpl_keys[key][0/*KEYS*/].push( [keyNode, n] );
                    m = rest[VALUE][MATCH]( re_keys );
                } while ( m );
            }
            else
            {
                key = m[1] ? m[1] : m[0]; keyNode = rest;
                if ( !tpl_keys[HAS](key) ) tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, []/*ATTS*/, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0];
                else tpl_keys[key][0/*KEYS*/].push( [keyNode, n] );
            }
        }
        //aNodes = { };
        for (i=0,l=matchedAtts.length; i<l; i++)
        {
            matched = matchedAtts[ i ];
            a = matched[0]; m = matched[1]; n = matched[2];
            txt = a[VALUE];  //txtkey = txt; aNodesCached = (txtkey in aNodes);
            //if ( aNodesCached ) {txtkey += '_' + (++txtcnt); aNodesCached = false;}
            /*if ( !aNodesCached ) 
            {*/
                rest = document.createTextNode(txt||''); aNodes/*[ txtkey ]*/ = [[], [ rest ]];
                if ( 1 === m[0] ) // revived attribute
                {
                    matches = m[1]; ml = matches.length; pos = 0;
                    for (i=0; i<ml; i++)
                    {
                        att = matches[i];
                        key = att[0];
                        keyNode = rest.splitText( att[1][0]-pos );
                        rest = keyNode.splitText( att[1][1] );
                        aNodes/*[ txtkey ]*/[0].push( key );
                        aNodes/*[ txtkey ]*/[1].push( keyNode, rest ); 
                        if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0];}
                        else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                        pos += att[1][1] + att[1][0];
                    }
                }
                else if ( txt.length > m[0].length )
                {
                    // attr contains more text than just the $(key) ref
                    do {
                        key = m[1] ? m[1] : m[0];
                        keyNode = rest.splitText( m.index );
                        rest = keyNode.splitText( m[0].length );
                        aNodes/*[ txtkey ]*/[0].push( key );
                        aNodes/*[ txtkey ]*/[1].push( keyNode, rest ); 
                        if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0];}
                        else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                        m = rest[VALUE][MATCH]( re_keys );
                    } while ( m );
                }
                else
                {
                    keyNode = rest; key = m[1] ? m[1] : m[0];
                    aNodes/*[ txtkey ]*/[0].push( key );
                    if ( !tpl_keys[HAS](key) ) {tpl_keys[key] = [[[keyNode, n]]/*KEYS*/, [[a, aNodes/*[ txtkey ]*/[1], txt, n]]/*ATTS*/, with_nested_keys && (-1 < key.indexOf(key_separator)) ? key_separator : 0];}
                    else {tpl_keys[key][0/*KEYS*/].push( [keyNode, n] ); tpl_keys[key][1/*ATTS*/].push( [a, aNodes/*[ txtkey ]*/[1], txt, n] );}
                }
            /*}
            else
            {
                // share txt nodes between same (value) attributes
                for (m=0; m<aNodes[ txtkey ][0].length; m++)
                {
                    key = aNodes[ txtkey ][0][m];
                    tpl_keys[key][1/*ATTS* /].push( [a, aNodes[ txtkey ][1], txt, n] );
                }
            }*/
        }
        return [tpl_keys, node];
    }
;

function Tpl( tpl, re_keys, revivable, nested_key_separator )
{
    var renderer;
    revivable = true === revivable;
    if ( tpl )
    {
    if ( tpl.substr && tpl.substring )
    {
        tpl = multisplit_string( tpl, re_keys[G] ? re_keys : new RegExp(re_keys.source, re_keys[I]?"gi":"g") /* make sure global flag is added */, revivable, nested_key_separator );
        renderer = function renderer( data ) {
            var tpl = renderer.tpl[1/*TPL*/], l = tpl.length, t, atts = [],
                i, notIsSub, s, insideTag, nestedKey, nk, out = ''
            ;
            for (i=0; i<l; i++)
            {
                t = tpl[ i ]; 
                notIsSub = t[ 0 ]; 
                insideTag = t[ 1 ];
                s = t[ 2 ];
                if ( notIsSub )
                {
                    // add comment annotations for template to be revived on client-side
                    if ( revivable && !insideTag && t[ 3 ] > -1 && atts.length )
                    {
                        s = s.slice(0,t[ 3 ]) + '<!--' + atts.join("\n") + '-->' + s.slice(t[ 3 ]);
                        atts = [];
                    }
                    out += s;
                }
                else
                {
                    // enable to render/update tempate with partial data updates only
                    // check if not key set and re-use the previous value (if any)
                    if ( (nestedKey = t[ 6 ]) )
                    {
                        nk = get_nested_key( s, data, nestedKey );
                        if ( nk[0] ) t[ 3 ] = String(nk[1]);
                    }
                    else if ( data[HAS](s) )
                    {
                        t[ 3 ] = String(data[ s ]);
                    }
                    // add comment annotations for template to be revived on client-side
                    if ( revivable ) 
                    {
                        if ( insideTag )
                        {
                            out += t[ 3 ];
                            if ( t[ 4 ] ) atts.push('att:'+t[ 4 ]+'|key:'+s+'|'+[t[ 5 ],t[ 3 ].length].join(','));
                        }
                        else
                        {
                            out += '<!--key:'+s+'-->' + t[ 3 ] + '<!--/key-->';
                        }
                    }
                    else out += t[ 3 ];
                }
            }
            return out;
        };
    }
    else //if (tpl is dom_node)
    {
        tpl = multisplit_node( tpl, re_keys[G] ? new RegExp(re_keys.source, re_keys[I]?"i":"") : re_keys /* make sure global flag is removed */, revivable, nested_key_separator );
        renderer = function renderer( data ) {
            var att, i, l, keys, key, k, kl, val, TK, keyNodes, keyAtts, nestedKey, nk, nodes, ni, nl, txt, 
                tpl_keys = renderer.tpl[0/*KEYS*/];
            keys = Keys(tpl_keys); kl = keys.length
            for (k=0; k<kl; k++)
            {
                key = keys[k]; TK = tpl_keys[key];
                if ( (nestedKey = TK[2/*NESTED*/]) )
                {
                    nk = get_nested_key( key, data, nestedKey );
                    if ( nk[0] ) val = String(nk[1]);
                    else continue;
                }
                else if ( data[HAS](key) ) val = String(data[key]);
                else continue;
                
                // element live text nodes
                keyNodes = TK[0/*KEYS*/]; 
                for (i=0,l=keyNodes.length; i<l; i++) 
                {
                    keyNodes[i][0][VALUE] = val;
                }
                
                // element live attributes
                keyAtts = TK[1/*ATTS*/];
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
    }
    }
    else
    {
        renderer = function(){};
    }
    renderer.tpl = tpl;
    renderer.dispose = function( ){ renderer.tpl = null; };
    return renderer;
}
Tpl.VERSION = "0.3.4";
// export it
return Tpl;
});