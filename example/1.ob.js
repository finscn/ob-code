
function foo(m) {
	var M = 1;
	var whiteVar = M + (m || 0);
	var v = {};
	v.whiteProperty = 10;
	v.r = 20;
	var S = {
			whiteProperty: 100,
			r: 200
		};
	var k = "whiteProperty";
	var E = "r";
	var Y = whiteVar + v[k] + v[E] + S[k] + S[E];
	console.log("sum: ", Y);
	var A = "objects info: ";
	console.log(A, "\n\t", v, "\n\t", S);
	return Y
}
function test() {
	return foo(5)
}
test()