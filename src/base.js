"use strict";

(function(exports) {

    var _util = {

        merger: function(target, source, overwrite) {
            if (arguments.length < 2 || source === undefined) {
                source = target;
                target = {};
            }
            for (var key in source) {
                if (!(key in target) || overwrite !== false) {
                    target[key] = source[key];
                }
            }
            return target;
        },

        isObject: function(v) {
            return Object.prototype.toString.apply(v) === "[object Object]"
        },
        generateRandomFunction: function(seed) {
            return function() {
                seed = (214013 * seed + 2531011) % 0x100000000;
                return seed / 4294967296;
            };
        },
        getRandom: function(lower, higher) {
            // return Math.floor((higher - lower + 1) * Math.random()) + lower;
            return Math.floor((higher - lower + 1) * this.random()) + lower;
        },

        // arrayShuffle: function(arr) {
        //     for (var i = arr.length - 1; i > 0; i--) {
        //         var rnd = (Math.random() * (i)) >> 0;
        //         var temp = arr[i];
        //         arr[i] = arr[rnd];
        //         arr[rnd] = temp;
        //     }
        //     return arr;
        // },

        // stringShuffle: function(str) {
        //     return util.arrayShuffle(str.split("")).join("");
        // },

        getRandomWord: function(len, seed, word) {
            word = word || [];
            len = len - word.length;
            for (var i = 0; i < len; i++) {
                var idx = util.getRandom(0, seed.length - 1);
                word.push(seed[idx]);
            }
            return word.join("");
        },

        getRandomNames: function(count, cache, reserved) {
            var number = "0123456789";
            var letter = "abcdefghijklmnopqrstuvwxyz";
            letter += letter.toUpperCase();
            var firstSeed = "$_" + letter;
            var specific = "\u0391\u0392\u0395\u0396\u0397\u0399\u039a\u039c\u039d\u039f\u03a1\u03a4\u03a5\u03a7\u03dc\u03f9\u03fa";
            specific+="\u0405\u0406\u0408\u0410\u0412\u0415\u041c\u041d\u041e\u0420\u0421\u0422";
            firstSeed+=specific;
            specific="";
            var seed = firstSeed + specific + number;

            reserved = reserved || {};

            cache = cache || {};

            var firstEnd = firstSeed.length - 1;
            var len = 1;
            var list = [];
            var tried = 0;
            var maxTry = Math.pow(seed.length, len);
            while (count) {
                var word = [firstSeed[util.getRandom(0, firstEnd)]]
                var name = util.getRandomWord(len, seed, word);
                tried++;
                if (!cache[name] && !reserved[name]) {
                    list.push(name);
                    cache[name] = true;
                    count--;
                } else {
                    if (tried > maxTry + 1) {
                        len++;
                        maxTry = Math.pow(seed.length, len);
                        tried = 0;
                    }
                }

            }
            return list;
        },
        getRandomVarName: function() {

        },

        adjustRegexLiteral: function(key, value) {
            if (key === 'value' && value instanceof RegExp) {
                value = value.toString();
            }
            return value;
        }

    }

    _util.random=_util.generateRandomFunction( Date.now()/(1000*1000)>>0);
    var util = _util;
    if (typeof require == 'function') {
        util = require('util');
        _util.merger(util, _util);
    }
    exports.util = util;


}(typeof exports === 'undefined' ? (GT = {}) : exports));
