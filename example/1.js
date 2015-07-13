// run :      node ../src/obfuscate.js 1.config 1.ob.js



// test comment
window["xyz"]="abcdefg";

function foo(args) {

	var a = 1;
	var whiteVar = a + (args || 0);

	var obj1 = {};
	obj1.whiteProperty = 10;
	obj1.otherProperty = 20;

	var obj2 = {
		sports: 123,
		whiteProperty: 100,
		"otherProperty": 200
	};

	var ss1 = /*s*/"abc";
	var ss2 = /*xs*/"abc";

	console.log(ss1==ss2,ss1,ss2)

/* <$ */
	var key1 = /*s*/"whiteProperty";
	var key2 = /*xs*/"otherProperty";
	var sum = whiteVar + obj1[key1] + obj1[key2] + obj2[key1] + obj2[key2];
/* >$ */

/* <$ */
    console.log(key1,key2,sum);
	console.log("sum: ", sum);
/* >$ */
	var str = "objects info: ";
	console.log(str, "\n\t", obj1, "\n\t", obj2);

	return sum;

}

var ImageUtils={
	readCodeFromURL: function(){

	}
}

function test() {
	var obj3 = {};
	obj3.whiteProperty = 10;
	obj3.otherProperty = 20;
	return foo(5);
}

test();

var test = {
	// c1
	fun: function(){
		// c2
		/* aaa
		ccc */
		var a=1
	}
}



