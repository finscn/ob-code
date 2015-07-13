"use strict";

var fs = require('fs'),
    Path = require('path');

var esprima = require("esprima"),
    escodegen = require("escodegen");

var base = require("./base"),
    ob = require('./ob-code');


var util = base.util;

var BOM = String.fromCharCode(0xfeff);
var cwd = process.env.PWD || process.cwd();


var argv = process.argv.slice(2);
if (argv.length == 0) {
    console.error("argv is wrong.");
}


var comment = false;

if (argv.length > 0) {
    setTimeout(function() {
        start();
    }, 1);
}


function start() {

    var filename = argv[0];

    var code = fs.readFileSync(filename);

    var result = parseJavaScript(code, true);
    var globalScope = new ob.GlobalScope(result, {});

    console.log("\n");
    console.log("###############################");
    console.log("[VAR]");
    console.log("\n");
    var allVariables = globalScope.getObfuscateVariables(globalScope.variables);
    allVariables.sort();
    allVariables.forEach(function(v) {
        // if (k[0] === k[0].toUpperCase()) {
        console.log(v.name);
        // }
    });
    console.log("\n");
    console.log("###############################");
    console.log("[PROPERTY]");
    console.log("\n");
    var allProperties = globalScope.getObfuscateProperties(ob.Properties);
    allProperties.sort();
    allProperties.forEach(function(p) {
        if (p.nodeType == "Property") {
            console.log(p.name)
        }
    });
    console.log("\n");
    console.log("###############################");
    console.log("\n");

}


function parseJavaScript(code, comment) {
    var options = {
        raw: !true,
        loc: !true,
        // tolerant : !true ,
        // attachComment: comment,
    };
    var ast;
    if (comment) {
        options.range = true;
        options.tokens = true;
        options.comment = true;
        var ast = esprima.parse(code, options);
        ast = escodegen.attachComments(ast, ast.comments, ast.tokens);
    } else {
        ast = esprima.parse(code, options);
    }
    return ast;
}
