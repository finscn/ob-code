function foo(g) {
	var W = 1;
	var R = 2;
	var white = 3;
	var H = W + R + white;
	var M = [
			"red",
			"green",
			"blue",
			"white",
			"K"
		];
	M.whiteProperty = 111;
	M.h = 222;
	M.z = 333;
	var m = "z";
	var v = M[m] + (g[0] || H);
	console.log("args", g);
	console.log("result", v);
	return v
}
function test(U) {
	var k = 1, R = 2, M = 3;
	U = U || [
		k,
		R,
		M
	];
	return foo(U)
}
test()