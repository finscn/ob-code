function foo(v) {
	var d = 1;
	var z = 2;
	var white = 3;
	var x = d + z + white;
	var i = [
			"red",
			"green",
			"blue"
		];
	i.whiteProperty = 111;
	i.M = 222;
	var V = "whiteProperty";
	var y = "M";
	var f = i[V] + i[y] + (v[0] || x);
	console.log("args: ", v);
	console.log("propertyies: ", i.whiteProperty, i.M);
	console.log("result: ", f);
	console.log("colors: ", i.join(","));
	return f
}
function test(J) {
	var N = 1, O = 2, y = 3;
	J = J || [
		N,
		O,
		y
	];
	return foo(J)
}
test()