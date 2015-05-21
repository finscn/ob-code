var fs = require('fs');
var pngjs = require('pngjs');


var useBase64 = !true;

var BOM = String.fromCharCode(0xfeff);

function jsToPng(file, pngFile, callback) {
    var content = fs.readFileSync(file, {
        encoding: "UTF8"
    });

    if (content[0] != BOM) {
        content = BOM + content;
    }

    pngFile = pngFile || file + ".png";
    codeToPng(content, pngFile, callback);

}

function codeToPng(content, pngFile, callback) {

    if (useBase64) {
        content = new Buffer(content, "UTF8").toString('base64');
        content = "data:text/javascript;base64," + content;
    }

    var size = content.length + 1;
    var width = Math.ceil(Math.sqrt(size));
    if (width < 256) {
        width = 256;
    }
    var height = Math.ceil(size / width);

    var png = new pngjs.PNG({
        filterType: 4,
        width: width,
        height: height,
    });

    png.pack().pipe(png).on('parsed', function(dataArray) {
        var dataArray = this.data;
        var len = dataArray.length;
        var idx = 0;
        var maxIdx = content.length;
        var r, g, b, a;
        for (var i = 0; i < len; i += 4) {
            if (idx >= maxIdx) {
                r = g = b = 0;
                a = 0xFF
            } else {
                var code = content.charCodeAt(idx++);
                // r = (code & 0xFF000000) >> 24;
                r = (code & 0x000000FF);
                g = (code & 0x0000FF00) >> 8;
                b = (code & 0x00FF0000) >> 16;
                a = 0xFF;
            }
            // console.log(content[idx-1],code,r, g, b, a)
            dataArray[i] = r;
            dataArray[i + 1] = g;
            dataArray[i + 2] = b;
            dataArray[i + 3] = a;
        }
        var stream = fs.createWriteStream(pngFile);
        png.pack().pipe(stream);
        stream.on("finish", function() {
            if (callback) {
                callback(content, pngFile);
            }
        });
    });
}


function pngToCode(pngFile, callback) {
    fs.createReadStream(pngFile)
        .pipe(new pngjs.PNG({
            filterType: 4
        })).on('parsed', function(dataArray) {
            var source = [];
            var len = dataArray.length;
            for (var i = 0; i < len; i += 4) {
                var r = dataArray[i];
                var g = dataArray[i + 1];
                var b = dataArray[i + 2];
                // var a = dataArray[i + 3];
                r = r << 16
                g = g << 8
                b = b
                var code = r + g + b;
                if (code === 0) {
                    break;
                }
                source.push(String.fromCharCode(code));
            }
            source = source.join("");
            if (useBase64) {
                var h = "data:text/javascript;base64,";
                if (source.indexOf(h) == 0) {
                    source = source.substring(h.length);
                }
                source = new Buffer(source, 'base64').toString('UTF8');
            }
            if (callback) {
                callback(source);
            }
        });
}


function pngXORpng(pngFile, xorFile, callback) {
    fs.createReadStream(xorFile).pipe(new pngjs.PNG({
        filterType: 4
    })).on('parsed', function(dataArray) {
        var width = this.width;
        var height = this.height;
        _pngXOR(pngFile, dataArray, width, height, callback);
    });
}

function _pngXOR(pngFile, xorArray, xorW, xorH, callback) {
    var png = new pngjs.PNG({
        filterType: 4
    });
    fs.createReadStream(pngFile)
        .pipe(png).on('parsed', function(dataArray) {
            var width = Math.min(xorW, this.width);
            var height = Math.min(xorH, this.height);

            var i = 0,
                j = 0;
            var idx = 0;

            for (var r = 0; r < height; r++) {
                for (var c = 0; c < width; c++) {
                    i = (r * this.width + c) * 4;
                    j = (r * xorW + c) * 4;
                    var d = dataArray[i],
                        x = xorArray[j];
                    dataArray[i] = d ^ x;

                    var d = dataArray[i + 1],
                        x = xorArray[j + 1];
                    dataArray[i + 1] = d ^ x;

                    var d = dataArray[i + 2],
                        x = xorArray[j + 2];
                    dataArray[i + 2] = d ^ x;

                    var d = dataArray[i + 3],
                        x = xorArray[j + 3];
                    dataArray[i + 3] = d ^ x;
                    idx++;
                }
            }
            console.log(width, height, idx, r, height, c, width)
            var stream = fs.createWriteStream(pngFile + ".x.png");
            png.pack().pipe(stream);
            stream.on("finish", function() {
                if (callback) {
                    callback();
                }
            });
        });
}

module.exports.jsToPng = jsToPng;
module.exports.codeToPng = codeToPng;
module.exports.pngToCode = pngToCode;

if (!module.parent) {

    var argv = process.argv.slice(2);

    var jsFile = argv[0];
    var pngFile = argv[1];
    var xorFile = argv[2];

    pngFile = pngFile || jsFile + ".png";

    jsToPng(jsFile, pngFile, function() {
        pngToCode(pngFile, function(jsCode) {
            console.log(jsCode);
            console.log("====== png created ======");

            if (xorFile) {
                pngXORpng(pngFile, xorFile, function() {
                    console.log("====== XOR over ======");
                });
            }
        });
    });
}
