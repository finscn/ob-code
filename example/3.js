var exports=this;

;(function(exports){

var foo=111;

exports.foo=foo

}(exports));



;(function(exports){

var foo=exports.foo;
var bar=222;
exports.bar=bar;

}(exports));

var a={
	foo : 333
}

var b={}
b.bar=444;