"use strict";

var objects = [
    'Object',
    'Function',
    'Array',
    'String',
    'Boolean',
    'Number',

    'RegExp',
    'Math',
    'Date',
    'Error',
    'JSON'
];

var propertiesM = {};
objects.forEach(function(oName) {
    var o = global[oName];
    var names = Object.getOwnPropertyNames(o);
    names.forEach(function(_n) {
        propertiesM[_n] = true;
    })
    if (o.prototype) {
        names = Object.getOwnPropertyNames(o.prototype);
        names.forEach(function(_n) {
            propertiesM[_n] = true;
        })
    }
});
var properties = [];
for (var key in propertiesM) {
    properties.push(key);
}
// console.log(properties)
module.exports = properties;
