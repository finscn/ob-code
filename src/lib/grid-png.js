var fs = require('fs');
var path = require('path');
var pngjs = require('pngjs');


function enPng(pngFile, newPngFile, callback) {

    newPngFile = newPngFile || pngFile + "en.png";

    fs.createReadStream(pngFile)
        .pipe(new pngjs.PNG({
            // filterType: 4,
            // deflateLevel: 4,
            // deflateChunkSize: 256,
        })).on('parsed', function(dataArray) {
            var origWidth = this.width,
                origHeight = this.height;
            var newPng = new pngjs.PNG({
                // filterType: 4,
                // deflateLevel: 4,
                // deflateChunkSize: 256,
                width: origWidth,
                height: origHeight,
            });
            newPng.pack().pipe(newPng).on('parsed', function(newData) {
                var en = true;
                var offset1 = origWidth / 4 >> 0;
                offset1 -= offset1 % 2;
                var _offset2 = origWidth % 5 + 1;
                var offset2 = 0;
                var offset3 = 0;

                for (var y = 0; y < origHeight; y++) {
                    var newIndex = y * origWidth;
                    newIndex <<= 2;

                    var _y = y;
                    if (en) {
                        offset2 = _y % _offset2;
                        if (_y === 0 && origHeight % 2 !== 0) {
                            _y = origHeight - 1;
                        } else if (_y % 2 === 0) {
                            _y = _y - 2;
                        }
                        offset3 = _y % 3;
                        // _y = (_y - offset1 + origHeight) % origHeight;
                    }


                    var indexRow = _y * origWidth;

                    for (var x = 0; x < origWidth; x++) {

                        var _x = x;
                        if (en) {
                            _x = origWidth - 1 - _x;
                            // y
                            _x = (_x - offset1 - offset2 - offset3 + origWidth) % origWidth;
                        }
                        var index = indexRow + _x;
                        index <<= 2;

                        newData[newIndex + 0] = dataArray[index + 0];
                        newData[newIndex + 1] = dataArray[index + 1];
                        newData[newIndex + 2] = dataArray[index + 2];
                        newData[newIndex + 3] = dataArray[index + 3];
                        newIndex += 4;
                    }
                }

                var stream = fs.createWriteStream(newPngFile);
                newPng.pack().pipe(stream);
                stream.on("finish", function() {
                    if (callback) {
                        callback();
                    }
                });
            });

        });
}


module.exports.enPng = enPng;

if (!module.parent) {

    var argv = process.argv.slice(2);
    var pngFile = argv[0];
    var newPngFile = argv[1];

    if (pngFile) {
        enPng(pngFile, newPngFile, function() {
            console.log("====== " + newPngFile + " created ======");
        });
    } else {
        var inDir = "input/orig";
        fs.readdir(inDir, function(err, files) {
            if (err) {
                console.log(err);
                return;
            }
            files.forEach(function(file) {
                if (file.indexOf(".png") !== file.length - 4) {
                    return;
                }
                var newPngFile = "output/" + path.basename(file, ".png") + ".x5.png";
                file = inDir + "/" + file;
                enPng(file, newPngFile, function() {
                    console.log("====== " + newPngFile + " created ======");
                });
            });
        });
    }
}
