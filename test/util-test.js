var esprima=require("../parser/esprima"),
    escodegen=require("../parser/escodegen");


var fs = require('fs');

var base=require("../src/base"),
    Syntax=base.Syntax,
    util= base.util;

var ob = require('../src/ob-code');


function testStringShuffle(){

    var number="0123456789";
    var letter="abcdefghijklmnopqrstuvwxyz";
    letter+=letter.toUpperCase();

    var firstSeed="$_"+letter;
    var seed=firstSeed+number;

    var newSeed=util.stringShuffle(seed);

    console.log(newSeed);

    var a=seed.split("");
    a.sort();
    var b=newSeed.split("");
    b.sort();
    console.log(a.join("")==b.join(""))
  

}

testStringShuffle();