/*
Copyright © Tyria3DLibrary project contributors

This file is part of the Tyria 3D Library.

Tyria 3D Library is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Tyria 3D Library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with the Tyria 3D Library. If not, see <http://www.gnu.org/licenses/>.
*/

var Globals = require('./Globals');
var Utils = require('./Utils');

function viewFileByMFT(mftIdx) {
    let reverseTable = Globals._lr.getReverseIndex();

    var baseId = (reverseTable[mftIdx]) ? reverseTable[mftIdx][0] : "";

    viewFileByFileId(baseId);
}

function viewFileByFileId(fileId) {

    /// Clean outputs
    $(".tabOutput").html("");
    $("#fileTitle").html("");

    /// Clean context toolbar
    $("#contextToolbar").html("");

    /// Disable tabs
    w2ui.fileTabs.disable('tabRaw');
    w2ui.fileTabs.disable('tabPF');
    w2ui.fileTabs.disable('tabTexture');
    w2ui.fileTabs.disable('tabString');
    w2ui.fileTabs.disable('tabModel');
    w2ui.fileTabs.disable('tabSound');

    /// Remove old models from the scene
    if (Globals._models) {
        Globals._models.forEach(function (mdl) {
            Globals._scene.remove(mdl);
        });
    }

    /// Make sure _context is clean
    Globals._context = {};

    let rendererSettings = {
        id: fileId
    };

    /// Run the basic DataRenderer, handles all sorts of files for us.
    T3D.runRenderer(
        T3D.DataRenderer,
        Globals._lr,
        rendererSettings,
        Globals._context,
        onBasicRendererDone
    );
}

function onBasicRendererDone() {

    /// Read render output from _context VO
    var fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

    var rawData = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");

    var raw = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawString");

    var packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");

    var image = T3D.getContextValue(Globals._context, T3D.DataRenderer, "image");

    var fcc = raw.substring(0, 4);

    /// Update main header to show filename

    var fileName = fileId + (image || !packfile ? "." + fcc : "." + packfile.header.type);
    $("#fileTitle").html(fileName);

    /// Update raw view and enable tab
    w2ui.fileTabs.enable('tabRaw');

    //Generate hex and enable tab
    renderHexView();
    w2ui.fileTabs.enable('tabHexView');


    $("#contextToolbar")
        .append(
            $("<button>Download raw</button>")
            .click(
                function () {
                    var blob = new Blob([rawData], {
                        type: "octet/stream"
                    });
                    Utils.saveData(blob, fileName + ".raw");
                }
            )
        )

    $("#rawOutput")
        .append(
            $("<div>").text(raw)
        )


    /// Texture file
    if (image) {

        /// Select texture tab
        w2ui.fileTabs.enable('tabTexture');
        w2ui.fileTabs.click('tabTexture');

        /// Display bitmap on canvas
        var canvas = $("<canvas>");
        canvas[0].width = image.width;
        canvas[0].height = image.height;
        var ctx = canvas[0].getContext("2d");
        var uica = new Uint8ClampedArray(image.data);
        var imagedata = new ImageData(uica, image.width, image.height);
        ctx.putImageData(imagedata, 0, 0);

        $("#textureOutput").append(canvas);
    }

    /// PF Pack file
    else if (packfile) {

        /// Always render the pack file chunk data
        displayPackFile();

        /// Enable corresponding tab
        w2ui.fileTabs.enable('tabPF');

        /// If the pack file was a model, render it!
        if (packfile.header.type == "MODL") {

            /// Render model
            renderFileModel(fileId);
        } else if (packfile.header.type == "ASND") {

            /// Get a chunk, this is really the job of a renderer but whatevs
            var chunk = packfile.getChunk("ASND");

            /// Enable and select sound tab
            w2ui.fileTabs.enable('tabSound');
            w2ui.fileTabs.click('tabSound');


            /// Print some random data about this sound
            $("#soundOutput")
                .html(
                    "Length: " + chunk.data.length + " seconds<br/>" +
                    "Size: " + chunk.data.audioData.length + " bytes"
                );

            /// Extract sound data

            var soundUintArray = chunk.data.audioData;

            $("#contextToolbar")
                .show()
                .append(
                    $("<button>Download MP3</button>")
                    .click(function () {
                        var blob = new Blob([soundUintArray], {
                            type: "octet/stream"
                        });
                        Utils.saveData(blob, fileName + ".mp3");
                    })
                )
                .append(
                    $("<button>Play MP3</button>")
                    .click(function () {

                        if (!Globals._audioContext) {
                            Globals._audioContext = new AudioContext();
                        }

                        /// Stop previous sound
                        try {
                            Globals._audioSource.stop();
                        } catch (e) {}

                        /// Create new buffer for current sound
                        Globals._audioSource = Globals._audioContext.createBufferSource();
                        Globals._audioSource.connect(Globals._audioContext.destination);

                        /// Decode and start playing
                        Globals._audioContext.decodeAudioData(soundUintArray.buffer, function (res) {
                            Globals._audioSource.buffer = res;
                            Globals._audioSource.start();
                        });
                    })
                )
                .append(
                    $("<button>Stop MP3</button>")
                    .click(
                        function () {
                            try {
                                Globals._audioSource.stop();
                            } catch (e) {}
                        }
                    )
                );
        } else {
            /// Select PF tab
            w2ui.fileTabs.click('tabPF');
        }
    } else if (fcc == "strs") {

        showFileString(fileId);

    }

    /// Else just show raw view
    else {
        w2ui.fileTabs.click('tabRaw');
    }
}

function displayPackFile() {

    var fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");
    var packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");

    $("#packOutput").html("");
    $("#packOutput").append($("<h2>Chunks</h2>"));

    packfile.chunks.forEach(function (chunk) {

        var field = $("<fieldset />");
        var legend = $("<legend>" + chunk.header.type + "</legend>");

        var logButton = $("<button>Log Chunk Data to Console</button>");
        logButton.click(function () {
            T3D.Logger.log(T3D.Logger.TYPE_MESSAGE, "Logging", chunk.header.type, "chunk");
            T3D.Logger.log(T3D.Logger.TYPE_MESSAGE, chunk.data);
        });

        field.append(legend);
        field.append($("<p>Size:" + chunk.header.chunkDataSize + "</p>"));
        field.append(logButton);

        $("#packOutput").append(field);
        $("#packOutput").show();
    });
}


function showFileString(fileId) {

    /// Make sure output is clean
    Globals._context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.StringRenderer,
        Globals._lr, {
            id: fileId
        },
        Globals._context,
        onRendererDoneString
    );
}

function onRendererDoneString() {

    /// Read data from renderer
    var strings = T3D.getContextValue(Globals._context, T3D.StringRenderer, "strings", []);

    w2ui.stringGrid.records = strings;



    w2ui.stringGrid.buffered = w2ui.stringGrid.records.length;
    w2ui.stringGrid.total = w2ui.stringGrid.buffered;
    w2ui.stringGrid.refresh();

    /// Select this view
    w2ui.fileTabs.enable('tabString');
    w2ui.fileTabs.click('tabString');
}

function renderFileModel(fileId) {

    /// Make sure output is clean
    Globals._context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.SingleModelRenderer,
        Globals._lr, {
            id: fileId
        },
        Globals._context,
        onRendererDoneModel
    );
}

function onRendererDoneModel() {

    /// Enable and select model tab
    w2ui.fileTabs.enable('tabModel');
    w2ui.fileTabs.click('tabModel');
    $("#modelOutput").show();

    /// Re-fit canvas
    Utils.onCanvasResize();

    /// Add context toolbar export button
    $("#contextToolbar").append(
        $("<button>Export scene</button>")
        .click(Utils.exportScene)
    );

    /// Read the new models
    Globals._models = T3D.getContextValue(Globals._context, T3D.SingleModelRenderer, "meshes", []);

    /// Keeping track of the biggest model for later
    var biggestMdl = null;

    /// Add all models to the scene
    Globals._models.forEach(function (model) {

        /// Find the biggest model for camera focus/fitting
        if (!biggestMdl || biggestMdl.boundingSphere.radius < model.boundingSphere.radius) {
            biggestMdl = model;
        }

        Globals._scene.add(model);
    });

    /// Reset any zoom and transaltion/rotation done when viewing earlier models.
    Globals._controls.reset();

    /// Focus camera to the bigest model, doesn't work great.
    var dist = (biggestMdl && biggestMdl.boundingSphere) ? biggestMdl.boundingSphere.radius / Math.tan(Math.PI * 60 / 360) : 100;
    dist = 1.2 * Math.max(100, dist);
    dist = Math.min(1000, dist);
    Globals._camera.position.zoom = 1;
    Globals._camera.position.x = dist * Math.sqrt(2);
    Globals._camera.position.y = 50;
    Globals._camera.position.z = 0;


    if (biggestMdl)
        Globals._camera.lookAt(biggestMdl.position);
}

function generateHex(rawData, callback) {
    let byteArray = new Uint8Array(rawData);
    let hexOutput = [];
    let asciiOutput = [];

    //Breakup the work into slices of 100kB for performance
    let byteArraySlice = [];
    for (let pos = 0; pos < byteArray.length; pos += 100000) {
        byteArraySlice.push(byteArray.slice(pos, pos + 100000));
    }

    let loopCount = 0;
    let loopFunc = setInterval(() => {
        let byteArrayItem = byteArraySlice[loopCount];
        //If there is no more work we clear the loop and callback
        if (byteArrayItem == undefined) {
            clearInterval(loopFunc);
            callback({
                hexa: hexOutput,
                ascii: asciiOutput
            });
            return;
        }

        //Work with lines of 16 bytes
        for (let pos = 0; pos < byteArrayItem.length; pos += 16) {
            let workSlice = byteArrayItem.slice(pos, pos + 16);
            let hexLine = "";
            let asciiLine = "";
            let wordCount = 0; //Used to separate words (4bytes)

            //Iterate through each byte of the 16bytes line
            for (let byte of workSlice) {
                let byteHexCode = byte.toString(16).toUpperCase();
                byteHexCode = byteHexCode.length == 1 ? "0" + byteHexCode : byteHexCode;
                hexLine += byteHexCode + " ";
                asciiLine += String.fromCharCode(byte);

                //Split words with double space in hex view
                if (wordCount = 3) {
                    hexLine += " ";
                    wordCount = 0;
                } else {
                    wordCount += 1;
                }
            }

            hexOutput.push(hexLine);
            asciiOutput.push(asciiLine);
        }

        loopCount += 1;
    }, 1);
}

function renderHexView() {
    let rawData = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");

    generateHex(rawData, (hexData) => {
        console.log(hexData);
        $('#hexView')
        $("#hexView").html("");
        for (let idx in hexData.hexa) {
            $("#hexView").append("<p>" + hexData.hexa[idx] + "    " + hexData.ascii[idx] + "</p>");
        }
        $("#hexView").show();
    });
}

module.exports = {
    viewFileByMFT: viewFileByMFT,
    viewFileByFileId: viewFileByFileId,
}