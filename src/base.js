
;(function(exports){

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

