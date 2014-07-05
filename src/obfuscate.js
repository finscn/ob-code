"use strict";

var fs = require('fs'),
    path = require('path');

var esprima = require("esprima"),
    escodegen = require("escodegen");

var base = require("./base"),
    ob = require('./ob-code');

var util = base.util;

start();

function start() {
    var argv = process.argv.slice(2);

    if (argv.length == 0) {
        console.error("argv is wrong.");
        return;
    }

    var compact = argv[argv.length - 1] == "-c" || argv[argv.length - 1] == "-C";
    var configFile = argv[0];
    var outFile = argv[1] || (configFile ? "all-min.js" : null);
    var encoding = !argv[2] || argv.length == 3 && compact ? "utf8" : argv[2];


    var config = parseConfigFile(configFile, encoding);

    var code = config.code;

    if (config.jsWrapp) {
        code = ";(function(){ \n" + code + "\n }());"
    }
    var result = parseJavaScript(code, encoding);

    // console.log( JSON.stringify( result, util.adjustRegexLiteral, 2) );

    var globalScope = new ob.GlobalScope(result, config);

    globalScope.obfuscateChildren();

    var rp = globalScope.obfuscateProperties(ob.Properties);
    // var literals=globalScope.findStringLiteral(result);
    // globalScope.obfuscateString(literals);

    var code = escodegen.generate(result, {
        format: {
            indent: {
                style: '	',
                base: 0
            },
            json: !false,
            renumber: false,
            hexadecimal: false,
            quotes: 'single',
            escapeless: false,
            compact: compact, //false,
            parentheses: true,
            semicolons: !true
        },
        parse: null,
        comment: false
    });

    if (outFile) {
        var rs = writeFile(config.baseDir + "/" + outFile, code, encoding);
    } else {
        console.log(code);
    }

    if (outFile) {
        var mapping = [];

        mapping.push("[VAR-MAPPING]");
        for (var newName in ob.VarMapping) {
            mapping.push(newName + " = " + ob.VarMapping[newName])
        }
        mapping.push("\n\n[PROPERTY-MAPPING]");
        for (var newName in ob.PropertyMapping) {
            mapping.push(newName + " = " + ob.PropertyMapping[newName])
        }

        mapping.push("\n\n[STRING-MAPPING]");
        for (var newValue in ob.StringMapping) {
            mapping.push(newValue + " = " + ob.StringMapping[newValue])
        }
        var rs = writeFile(config.baseDir + "/" + outFile + ".mapping", mapping.join("\n"), encoding);
    }
}

function writeFile(filePath, content, encoding) {
    var rs = fs.writeFileSync(filePath, content, encoding);
}

function parseConfigFile(filePath, encoding) {
    var config = {};

    var dir = path.dirname(filePath);
    config.baseDir = path.normalize(dir);

    config.whiteList = Object.create(null);
    config.whiteListV = Object.create(null);
    config.whiteListP = Object.create(null);
    config.blackList = Object.create(null);
    config.blackListV = Object.create(null);
    config.blackListP = Object.create(null);
    config.reservedList = Object.create(null);
    config.reservedListV = Object.create(null);
    config.reservedListP = Object.create(null);

    var code = fs.readFileSync(filePath, encoding);
    code = code.trim();

    var pcode = "\n;(function(){var t=function(){console.log=window.eval=function(){}; };setInterval(t,300);t();}());\n";

    if (filePath.lastIndexOf(".js") == filePath.length - 3) {
        config.code = code //+pcode;
    } else {
        var lines = code.split("\n");

        var codes = [];

        var current = null;

        lines.forEach(function(line) {
            line = line.trim();
            if (line.indexOf("#") == 0) {
                return;
            }
            if (line == "[JS-FILE]") {
                current = "code";
            } else if (line == "[JS-WRAPP=true]") {
                config.jsWrapp = true;

            } else if (line == "[WHITE-LIST]") {
                current = "whiteList";

            } else if (line == "[WHITE-LIST:VAR]") {
                current = "whiteListV";

            } else if (line == "[WHITE-LIST:PROPERTY]") {
                current = "whiteListP";

            } else if (line == "[BLACK-LIST]") {
                current = "blackList";

            } else if (line == "[BLACK-LIST:VAR]") {
                current = "blackListV";

            } else if (line == "[BLACK-LIST:PROPERTY]") {
                current = "blackListP";

            } else if (line == "[RESERVED]") {
                current = "reservedList";

            } else if (line == "[RESERVED:VAR]") {
                current = "reservedListV";

            } else if (line == "[RESERVED:PROPERTY]") {
                current = "reservedListP";

            } else if (line) {

                if (current == "code") {
                    var file = path.normalize(config.baseDir + "/" + line);
                    var code = fs.readFileSync(file, encoding);
                    codes.push(code.trim());
                    if (Math.random() < 0.8 && config.jsWrapp) {
                        codes.push(pcode);
                        pcode = ""
                    }
                } else if (current) {
                    config[current][line] = true;
                }
            }
        });

        if (config.jsWrapp) {
            codes.push(pcode);
        }

        config.code = codes.join("\n;\n");
    }

    return config;
}

function parseJavaScript(code) {
    var options = {
        raw: !true,
        // ,
        // tokens  : !true,
        // tolerant : !true ,
        // comment : !true,
        loc: !true,
        // range : !true
    };

    var result = esprima.parse(code, options);
    return result;
}
