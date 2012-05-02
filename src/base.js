
;(function(exports){

var ReservedWords=[
    'class',
    'enum',
    'export',
    'extends',
    'import',
    'super',

    'implements',
    'interface',
    'package',
    'private',
    'protected',
    'public',
    'static',
    'yield',
    'let',
    'const',

    'undefined',
    'null',
    'true',
    'false',
    'NaN',
    'undefined',
    'Infinty',
    'eval',
    'arguments',

    'if','in','do',
    'var','for','new','try',
    'this','else','case','void','with',
    'return','typeof','delete','switch',
    'default','finally',
    'function','continue','debugger',
    'instanceof'

];

var Syntax = {
    Anonymous : "(Anonymous)",

    AssignmentExpression: 'AssignmentExpression',
    ArrayExpression: 'ArrayExpression',
    BlockStatement: 'BlockStatement',
    BinaryExpression: 'BinaryExpression',
    BreakStatement: 'BreakStatement',
    CallExpression: 'CallExpression',
    CatchClause: 'CatchClause',
    ConditionalExpression: 'ConditionalExpression',
    ContinueStatement: 'ContinueStatement',
    DoWhileStatement: 'DoWhileStatement',
    DebuggerStatement: 'DebuggerStatement',
    EmptyStatement: 'EmptyStatement',
    ExpressionStatement: 'ExpressionStatement',
    ForStatement: 'ForStatement',
    ForInStatement: 'ForInStatement',
    FunctionDeclaration: 'FunctionDeclaration',
    FunctionExpression: 'FunctionExpression',
    Identifier: 'Identifier',
    IfStatement: 'IfStatement',
    Literal: 'Literal',
    LabeledStatement: 'LabeledStatement',
    LogicalExpression: 'LogicalExpression',
    MemberExpression: 'MemberExpression',
    NewExpression: 'NewExpression',
    ObjectExpression: 'ObjectExpression',
    Program: 'Program',
    Property: 'Property',
    ReturnStatement: 'ReturnStatement',
    SequenceExpression: 'SequenceExpression',
    SwitchStatement: 'SwitchStatement',
    SwitchCase: 'SwitchCase',
    ThisExpression: 'ThisExpression',
    ThrowStatement: 'ThrowStatement',
    TryStatement: 'TryStatement',
    UnaryExpression: 'UnaryExpression',
    UpdateExpression: 'UpdateExpression',
    VariableDeclaration: 'VariableDeclaration',
    VariableDeclarator: 'VariableDeclarator',
    WhileStatement: 'WhileStatement',
    WithStatement: 'WithStatement'
    };
	

exports.Syntax = Syntax;
exports.ReservedWords=ReservedWords;

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
        lower = (lower||lower===0)?lower : 0;
        higher = (higher||higher===0)?higher : 9999;
        return Math.floor( (higher - lower + 1) * Math.random() ) + lower;
    },

    getRandomWord : function(len, seed){
        var word=[];
        for (var i=0;i<len;i++){
            var idx= util.getRandom(0,seed.length-1);
            word.push(seed[idx]);
        }
        return word;
    },
    getRandomNames : function(count, cache){
        var number="0123456789";
        var letter="abcdefghijklmnopqrstuvwxyz";
        letter+=letter.toUpperCase();

        var seed1="$_"+letter;
        var seed=seed1+number;

        cache=cache||{};

        var len=1;
        var list=[];
        var tried=0;
        while(count){
            var name= util.getRandomWord(len, len<2?seed1:seed);
            tried++;
            if (!cache[name]){
                list.push(name);
                cache[name]=true;
                count--;
            }else{
                if ( len<2&&tried>seed1 || tried>1000){
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

