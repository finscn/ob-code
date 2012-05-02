
var esprima=require("../parser/esprima"),
    escodegen=require("../parser/escodegen");


var fs = require('fs');

var base=require("../src/base"),
    Syntax=base.Syntax,
    util= base.util;

var ob = require('../src/ob-code');

ob.GlobalScope;
ob.FunctionScope;
ob.Properties;
ob.ScopePathMap;


var testFiles=[
    'my-code.js',
    'backbone-0.5.3.js',
    'mootools-1.4.1.js',
    'prototype-1.7.0.0.js',
    'jquery-1.7.1.js',
    'ext-core-3.1.0.js'
];

var testcase="./testcase";


function buildscope( idx ){
	var fileName=testFiles[idx||0];
	if (!fileName){
		if (idx=="all"){
			testFiles.forEach(function(f,i){
				buildscope(i);
			});
			return;		
		}else{
			return buildscope(0);
		}		
	}
	var filePath=testcase+"/"+fileName;

	var code = fs.readFileSync(filePath, "UTF-8");
	var options = {
            raw : !true,
            // ,
            // tokens  : !true,
            // tolerant : !true ,
            // comment : !true,
            loc : !true,
            // range : !true
        };

	var start=Date.now();
	var result = esprima.parse(code, options);
	var end1=Date.now();
	var global=new ob.GlobalScope(result);
	var end2=Date.now();
	console.log("===== ob-code : "+fileName+" =====");
	console.log( "esprima.parse cost time : "+ (end1-start) );
	console.log( "ob-code cost time : "+ (end2-end1) );

	return result;
}

var testFileIdx= process.argv[2]||0;
buildscope(testFileIdx);



// var start=Date.now();
// var result = esprima.parse(code, options);
// console.log("cost : "+(Date.now()-start) );

// console.log( JSON.stringify(result, util.adjustRegexLiteral ,2 ) );


// function getFileIdx(){
//     return 0;
// }
//
// var global=new ob.GlobalScope(result);
// console.log("======================");
// console.log(  JSON.stringify( global.variables,function(k,v){ return v},2) );
// // console.log(  JSON.stringify( ob.Properties,function(k,v){ return v},2) );

// // global.changePropertyName("qqq","eeeee");
// // global.changeVarName("q","c");

// console.log("======== output =========");
// var indent="    ";
// var outputCode = escodegen.generate(result, { indent: indent });
// // console.log(outputCode );
// // eval(outputCode)







