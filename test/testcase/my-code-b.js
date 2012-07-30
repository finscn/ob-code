var a = 123;

function foo(b, c, d) {

	try {
		z = 1;
	} catch (e) {
		z = 2;
		e++;
		z = e + 33;
		var cc = 1;
	}
	cc = 2;

	var e = a + b;
	b = c + d;
	d = 123;
	a++;

}


try {
	throw new Error()
} catch (e) {
	var t = e;

	function a() {
		var sdasf = 123;
		alert(t)
	}
}
a()
alert(t)