var fs = require('fs');


var BOM = String.fromCharCode(0xfeff);
var XORKey = 1E6 % (1024 * 1E1);


function jsToText(file, outFile, callback) {
    var content = fs.readFileSync(file, {
        encoding: "UTF8"
    });

    if (content[0] != BOM) {
        content = BOM + content;
    }
    outFile = outFile || file + ".text";
    return codeToText(content, outFile, callback);
}

function codeToText(content, outFile, callback) {
    var outString = encode(content, XORKey);

    fs.writeFileSync(outFile, outString, {
        encoding: "UTF8"
    });
    if (callback) {
        callback(outString, content, outFile);
    }
}

function encode(content, secretKey) {

    var outString = [];

    secretKey = String(secretKey);
    var size = content.length;

    var keyLen = secretKey.length;
    for (var i = 0; i < size; i++) {
        var code = content.charCodeAt(i);
        var keyCode = secretKey.charCodeAt(i % keyLen);
        var outCode = code ^ keyCode;
        var outChar = String.fromCharCode(outCode);
        outString.push(outChar);
    }

    return outString.join("");

}

function decode(content, secretKey) {
    return encode(content, secretKey);
}

function textToCode(file, callback) {
    var content = fs.readFileSync(file, {
        encoding: "UTF8"
    });
    var outString = decode(content.toString(), XORKey);
    if (callback) {
        callback(outString, content);
    }
}



module.exports.jsToText = jsToText;
module.exports.codeToText = codeToText;
module.exports.textToCode = textToCode;

if (!module.parent) {

    var argv = process.argv.slice(2);

    var jsFile = argv[0];
    var outFile = argv[1];

    outFile = outFile || jsFile + ".text";

    jsToText(jsFile, outFile, function() {
        textToCode(outFile, function(jsCode) {
            console.log(jsCode);
            console.log("====== text created ======");
        });
    });
}
