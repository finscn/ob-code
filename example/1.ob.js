function W(X) {
    var N = 1;
    var whiteVar = N + (X || 0);
    var Υ = {};
    Υ.whiteProperty = 10;
    Υ.t = 20;
    var $ = {
            whiteProperty: 100,
            "otherProperty": 200
        };
    var V = "whiteProperty";
    var Ϲ = "otherProperty";
    var _ = whiteVar + Υ[V] + Υ[Ϲ] + $[V] + $[Ϲ];
    console.log("sum: ", _);
    var w = "objects info: ";
    console.log(w, "\n\t", Υ, "\n\t", $);
    return _
}
function A() {
    var g = {};
    g.whiteProperty = 10;
    g.t = 20;
    return W(5)
}
A()