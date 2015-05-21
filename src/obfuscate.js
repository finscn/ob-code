"use strict";

var fs = require('fs'),
    Path = require('path');

var esprima = require("esprima"),
    escodegen = require("escodegen"),
    esmangle = require("esmangle");

var base = require("./base"),
    ob = require('./ob-code');

var JsPng = require("./lib/js-png");
var JsText = require("./lib/js-text");
var obf = require("./lib/node-obf");

var util = base.util;

var BOM = String.fromCharCode(0xfeff);
var cwd = process.env.PWD || process.cwd();


var argv = process.argv.slice(2);
if (argv.length == 0) {
    console.error("argv is wrong.");
}


var GlobalConfig = {
    protectGlobal: false,
    protectPropery: false,
    createMapping: false
};
var indent = '';
var comment = false;
var compact = argv[argv.length - 1] == "-c" || argv[argv.length - 1] == "-C";

if (argv.length > 0) {
    setTimeout(function() {
        start();
    }, 1);
}

var nowSecond = (Date.now() / 1000) >> 0;

function start() {

    var configFile = argv[0];
    var outFile = argv[1] || (configFile ? "all-min.js" : null);
    var encoding = !argv[2] || argv.length == 3 && compact ? "utf8" : argv[2];

    var config = parseConfigFile(configFile, encoding);

    var code = config.code;

    if (config.jsWrapp) {
        code = ";(function(){ \n" + code + "\n }());"
    }

    code = parseInsertFile(code, config.baseDir, encoding);
    code = enableProtectCode(code);

    // code.split("/*p< ").join("");
    // code.split(" >p*/").join("");

    var result = parseJavaScript(code, true);
    // console.log(JSON.stringify(result, util.adjustRegexLiteral, 2));

    var globalScope = new ob.GlobalScope(result, config);

    if (!GlobalConfig.protectGlobal) {
        globalScope.obfuscateSelf();
    }

    globalScope.obfuscateChildren();
    if (!GlobalConfig.protectPropery) {
        globalScope.obfuscateProperties(ob.Properties);
    }
    // if (!protectString) {
    //     var literals = globalScope.findStringLiteral(result);
    //     console.log(literals)
    //     globalScope.obfuscateString(literals);
    // }

    code = formatCodeTree(result, true, false);
    code = packShuffleString(code);
    code = packShuffleString(code, true);
    code = packCodeToDollar(code);
    // console.log(code)
    code = packCodeToText(code);
    code = packCodeToPng(code);


    code = minifier(code);

    if (outFile) {
        var rs = writeFile(config.baseDir + "/" + outFile, code, encoding);
        // console.log(code);
    } else {
        console.log(code);
    }

    if (GlobalConfig.createMapping && outFile) {
        var mapping = [];

        mapping.push("[VAR-MAPPING]");
        for (var newName in ob.VarMapping) {
            mapping.push(ob.VarMapping[newName] + " = " + newName)
        }
        mapping.push("\n\n[PROPERTY-MAPPING]");
        for (var newName in ob.PropertyMapping) {
            mapping.push(ob.PropertyMapping[newName] + " = " + newName)
        }

        mapping.push("\n\n[STRING-MAPPING]");
        for (var newValue in ob.StringMapping) {
            mapping.push(ob.StringMapping[newValue] + " = " + newValue)
        }
        var rs = writeFile(config.baseDir + "/" + outFile + ".mapping", mapping.join("\n"), encoding);
    }

    console.log("****************************** OVER ******************************")
}



function enableProtectCode(code) {
    code = code.replace(/\/\*p\</g, '');
    code = code.replace(/\>p\*\//g, '');
    return code;
}

function parseInsertFile(code, baseDir, encoding) {
    var allLines = code.split("\n");
    var startFlag = "/* file:";
    var outLines = [];

    for (var i = 0; i < allLines.length; i++) {
        var line = allLines[i];
        if (line.trim().indexOf("//") == 0) {
            continue;
        }
        var idx = line.indexOf(startFlag);
        if (idx != -1) {
            var file = line.substring(idx + startFlag.length, line.lastIndexOf("*/"));
            file = Path.normalize(baseDir + "/" + file.trim());
            file = fs.readFileSync(file, encoding);
            line = file.trim();
        }
        outLines.push(line);
    }
    code = outLines.join('\n');
    return code;
}

function packShuffleString(code, obed) {
    var allLines = code.split("\n");
    var shuffleFlag = obed ? "/*o-s*/" : "/*s*/";
    var shuffleFlagB = obed ? "/*o-xs*/" : "/*xs*/";
    var outLines = [];
    var pp = null;
    var ppB = null;
    var idx, idxB;
    for (var i = 0; i < allLines.length; i++) {
        var line = allLines[i];
        if (line.trim().indexOf("//") == 0) {
            continue;
        }
        if ((idx = line.indexOf(shuffleFlag)) != -1) {
            pp = line.substring(0, idx);
            continue;
        } else if ((idxB = line.indexOf(shuffleFlagB)) != -1) {
            // console.log("/*xs*/-----> ",line,allLines[i+1]);
            ppB = line.substring(0, idxB);
            continue;
        } else if (pp || ppB) {
            var str = line.trim();
            if (str[str.length - 1] == ";") {
                str = str.substring(0, str.length - 1);
            }
            str = str.substring(1, str.length - 1);
            if (obed) {
                str = Utils.getNewProperty(str);
                console.log(str + "<<<<");
            }
            var ss = getShuffleCode(str, !!ppB);
            line = (pp || ppB) + ss + ";";
            pp = ppB = null;
        }
        outLines.push(line);
    }
    code = outLines.join('\n');
    return code;
}


function getShuffleCode(str, methodB) {
    var ss, nstr;
    var u = ob.GlobalMapping["Utils"] || "Utils";
    var idx = Utils.randomInt(1, 3);
    var m = methodB ? "unXorString" + idx : "shuffleString";
    m = Utils.getNewProperty(m);
    if (methodB) {
        nstr = Utils["xorString" + idx](str);
        ss = u + "." + m + "([" + nstr.join(",") + "])";
    } else {
        nstr = Utils.shuffleString(str, 3);
        ss = u + "." + m + "(\"" + nstr + "\")";
    }
    return ss;
}

function packCodeToDollar(code) {
    var allLines = code.split("\n");
    var startFlag = "/* $< */";
    var endFlag = "/* >$ */";
    var outLines = [];
    var inDollar = false;
    var dollarLines = [];
    for (var i = 0; i < allLines.length; i++) {
        var line = allLines[i];
        var idx = line.indexOf(startFlag);
        if (idx != -1) {
            inDollar = true;
            var pp = line.substring(idx + startFlag.length);
            dollarLines.push(pp);
        } else if (line.indexOf(endFlag) != -1) {
            inDollar = false;
            var pp = line.substring(0, line.indexOf(endFlag));
            dollarLines.push(pp);
            var dl = dollarLines.join("\n");
            console.log(dl)
            dl = ";" + obf.obfuscate("$$", dl) + ";";
            outLines.push(dl);
            dollarLines.length = 0;
        } else if (inDollar) {
            dollarLines.push(line)
        } else {
            outLines.push(line);
        }
    }
    code = outLines.join('\n');
    return code;
}

function packCodeToText(code) {
    var allLines = code.split("\n");
    var startFlag = "/* text:";
    var endFlag = "/* text */";
    var textPool = {};
    var textFile = null;
    var outLines = [];
    var inText = false;
    var textLines;
    for (var i = 0; i < allLines.length; i++) {
        var line = allLines[i];
        var idx = line.indexOf(startFlag);

        if (idx != -1) {
            inText = true;
            textFile = line.substring(idx + startFlag.length, line.lastIndexOf(" */"));
            if (!textPool[textFile]) {
                var u = ob.GlobalMapping["Utils"] || "Utils";
                var m = Utils.getNewProperty("loadCodeFromText");
                var str = textFile + "?_t=" + nowSecond;
                console.log(str)
                var ss = getShuffleCode(str);
                var loadCode = u + "." + m + "(" + ss + ");";
                loadCode = ";" + obf.obfuscate("$$", loadCode) + ";";
                outLines.push(loadCode);
                textPool[textFile] = [];
            }
            textLines = textPool[textFile];
        } else if (inText && line.indexOf(endFlag) != -1) {
            inText = false;
            var pp = line.substring(0, line.indexOf(endFlag));
            textLines.push(pp);
        } else if (inText) {
            textLines.push(line)
        } else {
            outLines.push(line);
        }
    }
    code = outLines.join('\n');
    createTexts(textPool, function() {
        console.log("==== texts created ====");
    });
    return code;
}

function createTexts(textPool, callback) {
    var keys = Object.keys(textPool);
    var total = keys.length;
    var idx = -1;
    var $next = function() {
        idx++;
        if (idx >= total) {
            if (callback) {
                callback();
            }
            return;
        }
        var textFile = keys[idx];
        var code = textPool[textFile].join("\n");
        console.log("====== " + textFile + " ======");
        console.log(code);

        JsText.codeToText(code, textFile, function() {
            $next();
        });
    }
    $next();
}


function packCodeToPng(code) {
    var allLines = code.split("\n");
    var startFlag = "/* png:";
    var endFlag = "/* png */";
    var pngPool = {};
    var pngFile = null;
    var outLines = [];
    var inPng = false;
    var pngLines;
    for (var i = 0; i < allLines.length; i++) {
        var line = allLines[i];
        var idx = line.indexOf(startFlag);

        if (idx != -1) {
            inPng = true;
            pngFile = line.substring(idx + startFlag.length, line.lastIndexOf(" */"));
            if (!pngPool[pngFile]) {
                var u = ob.GlobalMapping["Utils"] || "Utils";
                var m = Utils.getNewProperty("loadCodeFromImage");
                var str = "\"" + pngFile + "?_t=" + nowSecond + "\"";
                console.log(str)
                var ss = getShuffleCode(str);
                var loadCode = u + "." + m + "(" + ss + ");";
                loadCode = ";" + obf.obfuscate("$$", loadCode) + ";";
                outLines.push(loadCode);
                pngPool[pngFile] = [];
            }
            pngLines = pngPool[pngFile];
        } else if (inPng && line.indexOf(endFlag) != -1) {
            inPng = false;
            var pp = line.substring(0, line.indexOf(endFlag));
            pngLines.push(pp);
        } else if (inPng) {
            pngLines.push(line)
        } else {
            outLines.push(line);
        }
    }
    code = outLines.join('\n');
    createPngs(pngPool, function() {
        console.log("==== pngs created ====");
    });
    return code;
}

function createPngs(pngPool, callback) {
    var keys = Object.keys(pngPool);
    var total = keys.length;
    var idx = -1;
    var $next = function() {
        idx++;
        if (idx >= total) {
            if (callback) {
                callback();
            }
            return;
        }
        var pngFile = keys[idx];
        var code = pngPool[pngFile].join("\n");
        console.log("====== " + pngFile + " ======");
        console.log(code);
        JsPng.codeToPng(code, pngFile, function() {
            $next();
        });
    }
    $next();
}

function minifier(code) {
    var ast = esprima.parse(code);

    // Get optimized AST
    var optimized = esmangle.optimize(ast, null);
    // gets mangled AST
    ast = esmangle.mangle(optimized);

    // ast = esmangle.mangle(ast);
    code = escodegen.generate(ast, {
        format: {
            //     renumber: true,
            //     hexadecimal: true,
            //     escapeless: true,
            compact: true,
            //     semicolons: false,
            //     parentheses: false
        },
        comment: false,
    }); // dump AST
    return code;
}

function formatCodeTree(codeTree, comment, compact) {
    var code = escodegen.generate(codeTree, {
        format: {
            indent: {
                // style: '    ',
                style: indent,
                base: 0,
                adjustMultilineComment: false,
            },
            renumber: false,
            hexadecimal: false,
            parentheses: !true,
            semicolons: !true,
            escapeless: false,
            json: false,
            quotes: 'double', //'single',
            compact: compact, //false,
            newline: '\n',
        },
        parse: null,
        comment: comment
    });
    return code;
}

function writeFile(filePath, content, encoding) {
    // content = BOM + content;
    var rs = fs.writeFileSync(filePath, content, encoding);
}

function parseConfigFile(filePath, encoding) {
    var config = {};

    var dir = Path.dirname(filePath);
    config.baseDir = cwd; //Path.normalize(dir);

    config.constList = Object.create(null);

    config.whiteList = Object.create(null);
    config.whiteListV = Object.create(null);
    config.whiteListP = Object.create(null);
    config.blackList = Object.create(null);
    config.blackListV = Object.create(null);
    config.blackListP = Object.create(null);
    config.reservedList = Object.create(null);
    config.reservedListV = Object.create(null);
    config.reservedListP = Object.create(null);

    config.varMapping = Object.create(null);
    config.propertyMapping = Object.create(null);

    var code = fs.readFileSync(filePath, encoding);
    code = code.trim();

    var pcode = "\n;(function(){var t=function(){console.log=window.eval=function(){}; };setInterval(t,300);t();}());\n";

    if (filePath.lastIndexOf(".js") == filePath.length - 3) {
        config.code = code //+pcode;
    } else {
        var lines = code.split("\n");

        var codes = [];

        var current = null;

        var lastCode;
        var code;
        var codeForPack = [];
        var lastPackFile,
            packType,
            packHead,
            packFoot;
        var createPackCode = function() {
            if (codeForPack.length > 0) {
                codeForPack.unshift(packHead);
                codeForPack.push(packFoot);
                codes.push(codeForPack.join("\n"));
                codeForPack.length = 0;
            }
        };
        lines.forEach(function(line) {
            line = line.trim();
            if (line.indexOf("#") == 0 || line.length < 1) {
                return;
            }
            if (line == "[CONFIG]") {
                current = "configList";
            } else if (line == "[CONST]") {
                current = "constList";
            } else if (line == "[JS-FILE]") {
                current = "jsFile";
            } else if (line == "[JS-WRAPP=true]") {
                config.jsWrapp = true;
            } else if (line == "[VAR-MAPPING]") {
                current = "varMapping";

            } else if (line == "[PROPERTY-MAPPING]") {
                current = "propertyMapping";

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

                if (current == "jsFile") {
                    if (line.indexOf("// ") === 0 || line.indexOf("//'") === 0 || line.indexOf("//\"") === 0) {
                        return;
                    }
                    if (line.lastIndexOf("#") > 0) {
                        line = line.substring(0, line.lastIndexOf("#"));
                        line = line.trim();
                    }
                    var qu = null;
                    if (line.indexOf("'") === 0) {
                        qu = "'";
                    } else if (line.indexOf("\"") === 0) {
                        qu = "\"";
                    }
                    if (qu) {
                        var endQu = line.indexOf(qu, 1);
                        var jsFilePart = line.substring(1, endQu);
                        var commPart = line.substring(endQu + 1, line.length);
                        var ltIdx = commPart.indexOf("<");
                        if (ltIdx != -1) {
                            commPart = commPart.substring(ltIdx, commPart.length);
                            line = jsFilePart + " " + commPart;
                        } else {
                            line = jsFilePart;
                        }
                    }

                    if (line.indexOf("<") > 0) {
                        line = line.split("<");
                        var file = line[0].trim();
                        file = Path.normalize(config.baseDir + "/" + file);
                        var code = fs.readFileSync(file, encoding);

                        var packFile = line[1].trim();
                        // packFile = Path.normalize(config.baseDir + "/" + packFile);
                        packFile = Path.normalize(packFile);

                        if (lastPackFile !== packFile) {
                            createPackCode();
                        }
                        packType = packFile.indexOf(".png") > 0 ? "png" : "text";
                        packHead = '/* ' + packType + ':' + packFile + ' */';
                        packFoot = '/* ' + packType + ' */' + "\n" + 'void(0);'
                        lastPackFile = packFile;

                        codeForPack.push(code.trim());

                    } else {
                        createPackCode();

                        var file = Path.normalize(config.baseDir + "/" + line);
                        var code = fs.readFileSync(file, encoding);
                        codes.push(code.trim());
                        // if (Math.random() < 0.8 && config.jsWrapp) {
                        //     codes.push(pcode);
                        //     pcode = ""
                        // }
                    }
                } else if (current == "configList") {
                    var lines = line.split("=");
                    var cfgName = lines[0].trim();
                    var cfgValue = lines[1].trim();
                    GlobalConfig[cfgName] = parseValue(cfgValue);
                } else if (current == "varMapping" || current == "propertyMapping" || current == "constList") {
                    config[current] = config[current] || {};
                    var lines = line.split("=");
                    var oname = lines[0].trim();
                    var nname = lines[1].trim();
                    config[current][oname] = nname;
                } else if (current) {
                    config[current][line] = true;
                }
            }
            if (current != "jsFile") {
                createPackCode();
            }
        });
        createPackCode();

        if (config.jsWrapp) {
            codes.push(pcode);
        }

        var code = codes.join("\n;\n");

        for (var constName in config.constList) {
            var value = config.constList[constName];
            console.log(constName, value)
            var cs = code.split(constName);
            code = cs.join(value);
        }
        config.code = code;
    }

    return config;
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

function parseValue(v) {
        if (v === "true") {
            v = true;
        } else if (v === "false") {
            v = false;
        } else if (v === "null") {
            v = null;
        } else if (!isNaN(Number(v))) {
            v = Number(v);
        } else {
            v = String(v);
        }
        return v;
    }
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////
    ///////////////////////////////////////


var Utils = Utils || {};

Utils.randomInt = function(min, max) {
    return ((max - min + 1) * Math.random() + min) >> 0;
};

Utils.getNewProperty = function(oldProperty) {
    for (var key in ob.PropertyMapping) {
        if (oldProperty == ob.PropertyMapping[key]) {
            return key;
        }
    }
    return oldProperty;
};

Utils.codeToChar = function(c) {
    return String.fromCharCode(c);
};

Utils.charToCode = function(c) {
    return c.charCodeAt(0);
};

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////

Utils.xorString1 = function(str, x, charArr, f) {
    var charArr = [];
    f = Utils.charToCode(str[0]) ^ (x || 0xA);
    charArr.push(f);
    for (var i = str.length - 1; i > 0; i--) {
        charArr.push(Utils.charToCode(str[i]) ^ f);
    }
    return charArr;
};
Utils.unXorString1 = function(charArr, x, f, c, n) {
    var str = [];
    str.push(Utils.codeToChar((f = charArr[0]) ^ (x || 0xA)));
    for (var i = charArr.length - 1; i > 0; i--) {
        str.push(Utils.codeToChar(charArr[i] ^ f));
    }
    // return str;
    return str.join("");
};

Utils.xorString2 = function(str, x, charArr, f) {
    var charArr = [];
    f = Utils.charToCode(str[0]) ^ (x || 0xB);
    charArr.push(f);
    for (var i = str.length - 1; i > 0; i--) {
        charArr.push(Utils.charToCode(str[i]) ^ f);
    }
    return charArr;
};
Utils.unXorString2 = function(charArr, x, f, c, n) {
    var str = [];
    str.push(Utils.codeToChar((f = charArr[0]) ^ (x || 0xB)));
    for (var i = charArr.length - 1; i > 0; i--) {
        str.push(Utils.codeToChar(charArr[i] ^ f));
    }
    // return str;
    return str.join("");
};

Utils.xorString3 = function(str, x, charArr, f) {
    var charArr = [];
    f = Utils.charToCode(str[0]) ^ (x || 0xC);
    charArr.push(f);
    for (var i = str.length - 1; i > 0; i--) {
        charArr.push(Utils.charToCode(str[i]) ^ f);
    }
    return charArr;
};
Utils.unXorString3 = function(charArr, x, f, c, n) {
    var str = [];
    str.push(Utils.codeToChar((f = charArr[0]) ^ (x || 0xC)));
    for (var i = charArr.length - 1; i > 0; i--) {
        str.push(Utils.codeToChar(charArr[i] ^ f));
    }
    // return str;
    return str.join("");
};

///////////////////////////////////
///////////////////////////////////
///////////////////////////////////


Utils.shuffleString = function(str, sc) {
    sc = sc || 3;
    var len = str.length;
    var outStr = [];
    var end, step = Math.max(1, len / sc >> 0);
    for (var c = 0; c < len; c += step) {
        if (c + step >= len) {
            end = len - 1;
        } else {
            end = c + step - 1;
        }
        for (var i = end; i >= c; i--) {
            outStr.push(str[i]);
        }
    }
    return outStr.join("");
};
