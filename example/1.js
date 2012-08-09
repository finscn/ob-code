// run :      node ../src/obfuscate.js 1.config 1.ob.js

function foo(args) {

	var a = 1;
	var whiteVar = a + (args || 0);

	var obj1 = {};
	obj1.whiteProperty = 10;
	obj1.otherProperty = 20;

	var obj2 = {
		whiteProperty: 100,
		otherProperty: 200
	};

	var key1 = "whiteProperty";
	var key2 = "otherProperty";
	var sum = whiteVar + obj1[key1] + obj1[key2] + obj2[key1] + obj2[key2];

	console.log("sum: ", sum);
	var str = "objects info: ";
	console.log(str, "\n\t", obj1, "\n\t", obj2);

	return sum;

}

function test() {
	return foo(5);
}
test();