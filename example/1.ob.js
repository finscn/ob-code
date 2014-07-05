function foo(C) {
	var Q = 1;
	var whiteVar = Q + (C || 0);
	var t = {};
	t.whiteProperty = 10;
	t.S = 20;
	var j = {
			whiteProperty: 100,
			S: 200
		};
	var d = "whiteProperty";
	var L = "otherProperty";
	var R = whiteVar + t[d] + t[L] + j[d] + j[L];
	console.log("sum: ", R);
	var o = "objects info: ";
	console.log(o, "\n\t", t, "\n\t", j);
	return R
}
function test() {
	return foo(5)
}
test()