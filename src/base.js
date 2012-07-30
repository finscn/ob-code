


(function(exports){




var _util={

	merger : function(target, source,overwrite) {
		if (arguments.length<2 || source === undefined ) {
			source = target;
			target = {};
		}
		for ( var key in source) {
			if ( !(key in target) || overwrite!==false ) {
				target[key] = source[key];
			}
		}
		return target;
	},

	isObject : function (v){
	   return Object.prototype.toString.apply(v) === "[object Object]"
	},

    getRandom : function(lower, higher) {
        return Math.floor( (higher - lower + 1) * Math.random() ) + lower;
    },

    arrayShuffle : function (arr){
        for (var i=arr.length-1; i>0; i--) {
            var rnd = (Math.random()*(i))>>0;
            var temp=arr[i];
            arr[i] = arr[rnd];
            arr[rnd] = temp;
        }
        return arr;
    },

    stringShuffle : function (str){
        return util.arrayShuffle(str.split("")).join("");
    },
    getRandomVarName : function(){

    },
    getRandomWord : function(len, seed){
        var word=[];
        for (var i=0;i<len;i++){
            var idx= util.getRandom(0,seed.length-1);
            word.push(seed[idx]);
        }
        return word.join("");
    },

    getRandomNames : function(count, cache){
        var number="0123456789";
        var letter="abcdefghijklmnopqrstuvwxyz";
        letter+=letter.toUpperCase();
        var firstSeed="$_"+letter;
        var seed=firstSeed+number;


        cache=cache||{};

        var len=1;
        var list=[];
        var tried=0;
        while(count){
            var name= util.getRandomWord(len, len<2?firstSeed:seed);
            tried++;
            if (!cache[name]){
                list.push(name);
                cache[name]=true;
                count--;
            }else{
                if ( len<2&&tried>firstSeed || tried>1000){
                    len++;
                    tried=0;
                }
            }

        }
        return list;

    },	


	adjustRegexLiteral : function (key, value) {
	    if (key === 'value' && value instanceof RegExp) {
	    value = value.toString();
	    }
	    return value;
	}

}

var util=_util;
if (typeof require == 'function'){
	util= require('util');
	_util.merger(util,_util);
}
exports.util = util;


}(typeof exports === 'undefined' ? (GT = {}) : exports));

