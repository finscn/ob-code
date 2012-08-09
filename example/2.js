
// run : 
//     node ../src/obfuscate.js 1.config 1.ob.js

function foo(args){

	var a=1;
	var b=2;
	var white=3;
	var c=a+b+white;

	var colors=[ "red" , "green" , "blue" ];

	colors.whiteProperty=111;
	colors.otherProperty=222;

	var key1="whiteProperty";
	var key2="otherProperty";

	var result= colors[key1] +colors[key2]+(args[0]||c);

	console.log( "args: ", args );
	console.log( "propertyies: ", colors.whiteProperty, colors.otherProperty );
	console.log( "result: " ,result );
	console.log( "colors: " ,colors.join(",") );

	return result;

}

function test(arge){
	var a=1,b=2,c=3;
	arge=arge||[a,b,c];
	return  foo(arge);
}

test();

