
// run : 
//     node ../src/obfuscate.js 1.config 1.ob.js

function foo(args){

	var a=1;
	var b=2;
	var white=3;
	var c=a+b+white;

	var colors=[ "red" , "green" , "blue", "white", "black" ];

	colors.whiteProperty=111;
	colors.otherProperty=222;

	colors.blackProperty=333;
	var key="blackProperty";

	var result= colors[key] +(args[0]||c);

	console.log( "args", args );
	console.log( "result" ,result );

	return result;

}

function test(arge){
	var a=1,b=2,c=3;
	arge=arge||[a,b,c];
	return  foo(arge);
}

test();

