

(function(exports){

	var words=[
		'break',
		'case',
		'catch',
		'continue',
		'debugger',
		'default',
		'delete',
		'do',
		'else',
		'finally',
		'for',
		'function',
		'if',
		'in',
		'instanceof',
		'typeof',
		'new',
		'var',
		'return',
		'void',
		'switch',
		'while',
		'this',
		'with',
		'throw',
		'try',
		'class',
		'enum',
		'extends',
		'super',
		'const',
		'export',
		'import',
		'implements',
		'let',
		'private',
		'public',
		'interface',
		'package',
		'protected',
		'static',
		'yield',
		'goto'
	];

exports.words=words;

var globals=[
		'null',
		'true',
		'false',
		'NaN',
		'undefined',
		'Infinty',

		'eval',
		'setTimeout',
		'clearTimeout',
		'setInterval',
		'clearInterval',
		'parseInt',
		'parseFloat',
		'isNaN',
		'isFinite',
		'decodeURI',
		'encodedURI',
		'decodeURIComponent',
		'encodedURIComponent',
		'encodeURI',
		'encodeURIComponent'
		];

//Object.getOwnPropertyNames(Math)
var objects=[

	'Object',
	'Function',
	'Array',
	'String',
	'Boolean',
	'Number',

	'Math',
	'Date',
	'Error',
	'JSON'
];

var propertiesM={};
objects.forEach(function(oName){
	var o=global[oName];
	var names=Object.getOwnPropertyNames(o);
	names.forEach( function(_n){
		propertiesM[_n]=true;
	})
	if (o.prototype){
		names=Object.getOwnPropertyNames(o.prototype);
		names.forEach( function(_n){
			propertiesM[_n]=true;
		})
	}
});
var properties=[];
for (var key in propertiesM){
	properties.push(key);
}

console.log(properties)
}(typeof exports === 'undefined' ? (GT = {}) : exports));

