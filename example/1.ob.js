function foo(w) {
	var j = 1;
	var q = 2;
	var white = 3;
	var m = j + q + white;
	var g = [
			"red",
			"green",
			"blue",
			"white",
			"black"
		];
	g.whiteProperty = 111;
	g.L = 222;
	g.blackProperty = 333;
	var J = "blackProperty";
	var T = g[J] + (w[0] || m);
	console.log("args", w);
	console.log("result", T);
	return T
}
function test(r) {
	var l = 1, R = 2, e = 3;
	r = r || [
		l,
		R,
		e
	];
	return foo(r)
}
test()