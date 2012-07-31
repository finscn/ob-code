var fs = require('fs'),
	path = require('path');

var esprima = require("../parser/esprima"),
	escodegen = require("../parser/escodegen");

var base = require("../src/base"),
	ob = require('../src/ob-code');

var util = base.util;

start();

function start() {
	var argv = process.argv.slice(2);

	if (argv.length == 0) {
		console.error("argv is wrong.");
		return;
	}

	var configFile = argv[0];
	var outFile = argv[1];
	var encode = argv[2] || "UTF-8";

	var config = parseConfigFile(configFile, encode);

	var code=config.code;

	if (config.jsWrapp){
		code=";(function(){ \n"+code+"\n }());"
	}
	var result = parseJavaScript(code, encode);

	var globalScope = new ob.GlobalScope(result, config);




	globalScope.obfuscateChildren();

	var literals=globalScope.findStringLiteral(result);
	var rp= globalScope.obfuscateProperties(ob.Properties,literals, config.blackListStr );


	var code = escodegen.generate(result, {
		indent: "	"
	});

	if (outFile) {
		var rs = writeFile(config.baseDir + "/" + outFile, code, encode);
	} else {
		console.log(code);
	}

	if (outFile) {	
		var mapping=[];

		mapping.push("[VAR-MAPPING]");
		for (var oldName in ob.VarMapping){
			mapping.push(oldName+"="+ob.VarMapping[oldName])
		}
		mapping.push("\n\n[PROPERTY-MAPPING]");
		for (var oldName in ob.PropertyMapping){
			mapping.push(oldName+"="+ob.PropertyMapping[oldName])
		}
		var rs = writeFile(config.baseDir + "/" + outFile+".mapping", mapping.join("\n"), encode);
	}
}

function writeFile(filePath, content, encode) {
	var rs = fs.writeFileSync(filePath, content, encode);
}

function parseConfigFile(filePath, encode) {
	var config = {};

	var dir = path.dirname(filePath);
	config.baseDir = path.normalize(dir);

	config.whiteList = Object.create(null);
	config.whiteListV = Object.create(null);
	config.whiteListP = Object.create(null);
	config.blackList = Object.create(null);
	config.blackListV = Object.create(null);
	config.blackListP = Object.create(null);
	config.blackListStr = Object.create(null);

	var code = fs.readFileSync(filePath, encode);
	code = code.trim();

		var pcode="\n;(function(){var t=function(){console.log=window.eval=function(){}; };setInterval(t,300);t();}());\n";

	if (filePath.lastIndexOf(".js") == filePath.length - 3) {
		config.code = code+pcode;
	} else {
		var lines = code.split("\n");

		var codes = [];

		var current = null;

		lines.forEach(function(line) {
			line = line.trim();
			if (line == "[JS-FILE]") {
				current = 1;
			}else if (line == "[JS-WRAPP=true]") {
				config.jsWrapp = true;

			} else if (line == "[WHITE-LIST]") {
				current = 2;

			} else if (line == "[WHITE-LIST:VAR]") {
				current = 3;

			} else if (line == "[WHITE-LIST:PROPERTY]") {
				current = 4;

			} else if (line == "[BLACK-LIST]") {
				current = 5;
			} else if (line == "[BLACK-LIST:VAR]") {
				current = 6;

			} else if (line == "[BLACK-LIST:PROPERTY]") {
				current = 7;

			} else if (line == "[BLACK-LIST:STRING]") {
				current = 8;

			} else if (line) {

				if (current == 1) {
					var file = path.normalize(config.baseDir + "/" + line);
					var code = fs.readFileSync(file, encode);
					codes.push(code.trim());
					if (Math.random()<0.8){
						codes.push(pcode);
						pcode=""
					}
				} else if (current == 2) {
					config.whiteList[line] = true;
				} else if (current == 3) {
					config.whiteListV[line] = true;
				} else if (current == 4) {
					config.whiteListP[line] = true;
				} else if (current == 5) {
					config.blackList[line] = true;
				} else if (current == 6) {
					config.blackListV[line] = true;
				} else if (current == 7) {
					config.blackListP[line] = true;
				} else if (current == 8) {
					config.blackListStr[line] = true;
				}
			}
		})
		codes.push(pcode);
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