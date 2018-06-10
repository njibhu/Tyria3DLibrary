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

function viewFileByMFT(mftIdx){
    let reverseTable = _lr.getReverseIndex();
    
    var baseId = (reverseTable[mftIdx]) ? reverseTable[mftIdx][0] : "";

    viewFileByFileId(baseId);
}

function viewFileByFileId(fileId){

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
    if(_models){
        _models.forEach(function(mdl){
            _scene.remove(mdl);
        });	
    }

    /// Make sure _context is clean
    _context = {};

    /// Run the basic DataRenderer, handles all sorts of files for us.
    T3D.runRenderer(
        T3D.DataRenderer,
        _lr,
        {id:fileId},
        _context,
        onBasicRendererDone
    );
}

function onBasicRendererDone(){

    /// Read render output from _context VO
    var fileId = _fileId = T3D.getContextValue(_context, T3D.DataRenderer, "fileId");

    var rawData = T3D.getContextValue(_context, T3D.DataRenderer, "rawData");

    var raw = T3D.getContextValue(_context, T3D.DataRenderer, "rawString");

    var packfile = T3D.getContextValue(_context, T3D.DataRenderer, "file");

    var image = T3D.getContextValue(_context, T3D.DataRenderer, "image");


    var fcc = raw.substring(0,4);

    /// Update main header to show filename
    
    var fileName = fileId + (image || !packfile ? "."+fcc : "."+packfile.header.type );
    $("#fileTitle").html(fileName);

    /// Update raw view and enable tab
    w2ui.fileTabs.enable('tabRaw');
    

    $("#contextToolbar")
    .append(
        $("<button>Download raw</button>")
        .click(
            function(){
                var blob = new Blob([rawData], {type: "octet/stream"});
                saveData(blob,fileName+".raw");
            }
        )
    )

    $("#rawOutput")
    .append(
        $("<div>").text( raw )
    )
    

    /// Texture file
    if(image){

        /// Select texture tab
        w2ui.fileTabs.enable('tabTexture');
        w2ui.fileTabs.click('tabTexture');

        /// Display bitmap on canvas
        var canvas = $("<canvas>");
        canvas[0].width =  image.width;
        canvas[0].height =  image.height;
        var ctx = canvas[0].getContext("2d");
        var uica = new Uint8ClampedArray(image.data);
        var imagedata = new ImageData(uica, image.width, image.height);
        ctx.putImageData(imagedata,0,0);

        $("#textureOutput").append(canvas);
    }

    /// PF Pack file
    else if(packfile){ 	

        /// Always render the pack file chunk data
        displayPackFile();

        /// Enable corresponding tab
        w2ui.fileTabs.enable('tabPF');

        /// If the pack file was a model, render it!
        if(packfile.header.type == "MODL"){

            /// Render model
            renderFileModel(fileId);	        	
        }
        else if(packfile.header.type == "ASND"){

            /// Get a chunk, this is really the job of a renderer but whatevs
            var chunk =packfile.getChunk("ASND");

            /// Enable and select sound tab
            w2ui.fileTabs.enable('tabSound');
            w2ui.fileTabs.click('tabSound');


            /// Print some random data about this sound
            $("#soundOutput")
            .html(
                "Length: "+chunk.data.length+" seconds<br/>"+
                "Size: "+chunk.data.audioData.length+" bytes"
                );

            /// Extract sound data
            
            var soundUintArray = chunk.data.audioData;

            $("#contextToolbar")
            .show()
            .append(
                $("<button>Download MP3</button>")
                .click(function(){
                    var blob = new Blob([soundUintArray], {type: "octet/stream"});
                    saveData(blob,fileName+".mp3");
                })
            )
            .append(
                $("<button>Play MP3</button>")
                .click(function(){

                    if(!_audioContext){
                        _audioContext = new AudioContext();
                    }

                    /// Stop previous sound
                    try{
                        _audioSource.stop();	
                    }catch(e){}

                    /// Create new buffer for current sound
                    _audioSource = _audioContext.createBufferSource();
                    _audioSource.connect( _audioContext.destination );

                    /// Decode and start playing
                    _audioContext.decodeAudioData( soundUintArray.buffer, function( res ) {
                        _audioSource.buffer = res;							
                        _audioSource.start();
                    } );
                })
            )
            .append(
                $("<button>Stop MP3</button>")
                .click(
                    function(){
                        try{
                            _audioSource.stop();	
                        }catch(e){}
                    }
                )
            );
        }
        else{
            /// Select PF tab
            w2ui.fileTabs.click('tabPF');
        }	
    }

    else if(fcc == "strs"){

        showFileString(fileId);
        
    }

    /// Else just show raw view
    else{
        w2ui.fileTabs.click('tabRaw');
    }
}

function displayPackFile(){

    var fileId = T3D.getContextValue(_context, T3D.DataRenderer, "fileId");
    var packfile = T3D.getContextValue(_context, T3D.DataRenderer, "file");

    $("#packOutput").html("");
    $("#packOutput").append($("<h2>Chunks</h2>"));

    packfile.chunks.forEach(function(chunk){

        var field = $("<fieldset />");
        var legend = $("<legend>"+chunk.header.type+"</legend>");

        var logButton = $("<button>Log Chunk Data to Console</button>");
        logButton.click(function(){
            T3D.Logger.log(T3D.Logger.TYPE_MESSAGE, "Logging",chunk.header.type, "chunk");
            T3D.Logger.log(T3D.Logger.TYPE_MESSAGE, chunk.data);
        });

        field.append(legend);
        field.append($("<p>Size:"+chunk.header.chunkDataSize+"</p>"));
        field.append(logButton);

        $("#packOutput").append(field);
        $("#packOutput").show();
    });        
}


function showFileString(fileId){

    /// Make sure output is clean
    _context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.StringRenderer,
        _lr,
        {id:fileId},
        _context,
        onRendererDoneString
    );
}	

function onRendererDoneString(){

    /// Read data from renderer
    var strings = T3D.getContextValue(_context, T3D.StringRenderer, "strings", []);

    w2ui.stringGrid.records = strings;

    

    w2ui.stringGrid.buffered = w2ui.stringGrid.records.length;
    w2ui.stringGrid.total = w2ui.stringGrid.buffered;
    w2ui.stringGrid.refresh();

    /// Select this view
    w2ui.fileTabs.enable('tabString');
    w2ui.fileTabs.click('tabString');
}



function renderFileModel(fileId){

    /// Make sure output is clean
    _context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.SingleModelRenderer,
        _lr,
        {id:fileId},
        _context,
        onRendererDoneModel
    );
}	

function onRendererDoneModel(){

    /// Enable and select model tab
    w2ui.fileTabs.enable('tabModel');
    w2ui.fileTabs.click('tabModel');
    $("#modelOutput").show();

    /// Re-fit canvas
    onCanvasResize();

    /// Add context toolbar export button
    $("#contextToolbar").append(
        $("<button>Export scene</button>")
        .click(exportScene)
    );
    
    /// Read the new models
    _models = T3D.getContextValue(_context, T3D.SingleModelRenderer, "meshes", []);

    /// Keeping track of the biggest model for later
    var biggestMdl = null;

    /// Add all models to the scene
    _models.forEach(function(model){

        /// Find the biggest model for camera focus/fitting
        if(!biggestMdl || biggestMdl.boundingSphere.radius < model.boundingSphere.radius){
            biggestMdl = model;
        }

        _scene.add(model);
    });

    /// Reset any zoom and transaltion/rotation done when viewing earlier models.
    _controls.reset();

    /// Focus camera to the bigest model, doesn't work great.
    var dist = (biggestMdl && biggestMdl.boundingSphere) ? biggestMdl.boundingSphere.radius / Math.tan(Math.PI * 60 / 360) : 100;
    dist = 1.2 * Math.max(100,dist);
    dist = Math.min(1000, dist);
    _camera.position.zoom = 1;
    _camera.position.x = dist*Math.sqrt(2);
    _camera.position.y = 50;
    _camera.position.z = 0;


    if(biggestMdl)
        _camera.lookAt(biggestMdl.position);
}

module.exports = {
    viewFileByMFT: viewFileByMFT,
    viewFileByFileId: viewFileByFileId,
}