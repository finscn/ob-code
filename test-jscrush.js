#! /usr/bin/env node

var jscrush = require("./src/jscrush");
var fs = require("fs");

var code=fs.readFileSync("test.js", {encoding:"UTF-8"});
var result = jscrush(code);
console.log(result)
