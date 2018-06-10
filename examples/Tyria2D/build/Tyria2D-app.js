(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

function onFilterClick(evt) {
    
    /// No filter if clicked group was "All"
    if(evt.target=="All"){
        showFileGroup();
    }

    /// Other events are fine to just pass
    else{
        showFileGroup([evt.target]);	
    }
    
}

function showFileGroup(fileTypeFilter){

    w2ui.grid.records = [];

    let reverseTable = _lr.getReverseIndex();

    for (var fileType in _fileList) {

        /// Only show types we've asked for
        if(fileTypeFilter && fileTypeFilter.indexOf(fileType) < 0){

            /// Special case for "packGroup"
            /// Should let trough all pack types
            /// Should NOT let trought any non-pack types
            /// i.e. Strings, Binaries etc
            if(fileTypeFilter.indexOf("packGroup")>=0){
                if(!fileType.startsWith("PF")){
                    continue;
                }
            }
            else if(fileTypeFilter.indexOf("textureGroup")>=0){
                if(!fileType.startsWith("TEXTURE")){
                    continue;
                }
            }
            else{
                continue;	
            }
            
        }

        if (_fileList.hasOwnProperty(fileType)) {

            var fileArr = _fileList[fileType];
            fileArr.forEach(
                function(mftIndex){

                    let meta = _lr.getFileMeta(mftIndex);

                    var baseIds = reverseTable[mftIndex];
                    var fileSize =  (meta) ? meta.size: "";

                    if(fileSize>0 && mftIndex > 15){

                        w2ui['grid'].records.push({ 
                            recid : mftIndex, /// MFT index
                            baseIds: baseIds,
                            type : fileType,
                            fileSize : fileSize
                        });	

                    }

                    mftIndex++;
                }/// End for each mft in this file type
            );

        } /// End if _fileList[filetype]

    } /// End for each fileType key in _fileList object

    /// Update file grid
    w2ui.grid.buffered = w2ui.grid.records.length;
    w2ui.grid.total = w2ui.grid.buffered;
    w2ui.grid.refresh();
}

module.exports = {
    onFilterClick: onFilterClick,
}
},{}],2:[function(require,module,exports){
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
},{}],3:[function(require,module,exports){
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

const FileViewer = require('./fileviewer');
const FileGrid = require('./filegrid');
const Utils = require('./utils');

/**
 * Setup main grid
 */
function mainGrid() {
    const pstyle = 'border: 1px solid #dfdfdf; padding: 0;';
    $('#layout').w2layout({
        name: 'layout',
        panels: [
            {
                type: 'left',
                size: 570,
                resizable: true,
                style: pstyle + 'margin:0'
            },
            {
                type: 'main',
                style: pstyle + " background-color: transparent;",
                toolbar: {
                    style: 'background-color:#eaeaea; height:40px',
                    items: [
                        {
                            type: 'html', id: 'fileIdToolbar',
                            html: '<div class="toolbarEntry">' +
                                ' File ID:' +
                                '    <input id="fileIdInput"/>' +
                                '    <button id="fileIdInputBtn">' +
                                '    Load </button>' +
                                '</div>'
                        },
                        {
                            type: 'html', id: 'contextToolbar',
                            html: '<div class="toolbarEntry" id="contextToolbar"></div>'
                        }
                    ],
                    onClick: function (event) {
                        this.owner.content('main', event);
                    }
                }
            }
        ],
        onResize: Utils.onCanvasResize
    });

    $("#fileIdInputBtn").click(
        function () { FileViewer.viewFileByFileId($("#fileIdInput").val()); }
    )


    /// Grid inside main left
    $().w2layout({
        name: 'leftLayout',
        panels: [
            { type: 'left', size: 150, resizable: true, style: pstyle, content: 'left' },
            { type: 'main', size: 420, resizable: true, style: pstyle, content: 'right' }
        ]
    });
    w2ui['layout'].content('left', w2ui['leftLayout']);
}

/**
 * Setup sidebar
 */
function sidebar(){
    /*
        SIDEBAR
    */
    w2ui['leftLayout'].content('left', $().w2sidebar({
        name: 'sidebar',
        img: null,
        nodes: [
            { id: 'All', text: 'All', img: 'icon-folder', group: false }
        ],
        onClick: FileGrid.onFilterClick
    }));
}

/**
 * Setup filebrowser
 */
function fileBrowser(){
    w2ui['leftLayout'].content('main', $().w2grid({
        name: 'grid',
        show: {
            toolbar: true,
            footer: true,
        },
        columns: [
            { field: 'recid', caption: 'MFT index', size: '80px', sortable: true, resizable: true, searchable: 'int' },
            { field: 'baseIds', caption: 'BaseId list', size: '100%', sortable: true, resizable: true, searchable: true },
			{ field: 'type', caption: 'Type', size: '100px', resizable: true, sortable: true },
			{ field: 'fileSize', caption: 'Pack Size', size: '85px', resizable: true, sortable: true }
        ],
        onClick: function (event) {
            FileViewer.viewFileByMFT(event.recid);
        }
    }));
}

/**
 * Setup file view window
 */
function fileView() {
    $(w2ui['layout'].el('main'))
       .append($("<h1 id='fileTitle' />"))
       .append($("<div id='fileTabs' />"))
       .append(
           $(
               "<div class='fileTab' id='fileTabsRaw'>" +
               "<div class='tabOutput' id='rawOutput' />" +
               "</div>"
           )
       )
       .append(
           $(
               "<div class='fileTab' id='fileTabsPack'>" +
               "<div class='tabOutput' id='packOutput' />" +
               "</div>"
           )
               .hide()
       )
       .append(
           $(
               "<div class='fileTab' id='fileTabsTexture'>" +
               "<div class='tabOutput' id='textureOutput' />" +
               "</div>"
           )
               .hide()
       )
       .append(
           $(
               "<div class='fileTab' id='fileTabsString'>" +
               "<div id='stringOutput' />" +
               "</div>"
           )
               .hide()
       )
       .append(
           $(
               "<div class='fileTab' id='fileTabsModel'>" +
               "<div id='modelOutput'/>" +
               "</div>"
           )
               .hide()
       )
       .append(
           $(
               "<div class='fileTab' id='fileTabsSound'>" +
               "<div class='tabOutput' id='soundOutput'/>" +
               "</div>"
           )
               .hide()
       );


   $("#fileTabs").w2tabs({
       name: 'fileTabs',
       active: 'tabRaw',
       tabs: [
           {
               id: 'tabRaw',
               caption: 'Raw',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsRaw').show();
               }
           },
           {
               id: 'tabPF',
               caption: 'Pack File',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsPack').show();
               }
           },
           {
               id: 'tabTexture',
               caption: 'Texture',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsTexture').show();
               }
           },
           {
               id: 'tabString',
               caption: 'String',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsString').show();
               }
           },
           {
               id: 'tabModel',
               caption: 'Model',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsModel').show();
               }
           },
           {
               id: 'tabSound',
               caption: 'Sound',
               disabled: true,
               onClick: function () {
                   $('.fileTab').hide();
                   $('#fileTabsSound').show();
               }
           }
       ]
   });
}

function stringGrid(){
    /// Set up grid for strings view
    ///Create grid
    $("#stringOutput").w2grid({
        name: 'stringGrid',
        selectType: 'cell',
        show: {
            toolbar: true,
            footer: true,
        },
        columns: [
            { field: 'recid', caption: 'Row #', size: '60px' },
            { field: 'value', caption: 'Text', size: '100%' }
        ]
    });
}

/**
 * This function is called when we have a list of the files to organize the categories.
 */
function sidebarNodes(){

    var packNode = {
        id: 'packGroup', text: 'Pack Files', img: 'icon-folder', group: false,
        nodes: []
    };

    var textureNode = {
        id: 'textureGroup', text: 'Texture files', img: 'icon-folder', group: false,
        nodes: []
    }
    
    var unsortedNode = {
        id: 'unsortedGroup', text: 'Unsorted', img: 'icon-folder', group: false,
        nodes: []
    }

    /// Build sidebar nodes
    for (var fileType in _fileList) {
        if (_fileList.hasOwnProperty(fileType)) {

            var node = {id:fileType, img: "icon-folder", group: false };
            var isPack = false;
            if(fileType.startsWith("TEXTURE")){
                node = {id: fileType, img: "icon-folder", group: false, text: fileType};
                textureNode.nodes.push(node);
            }

            else if(fileType == 'BINARIES'){
                node.text = "Binaries";
                w2ui.sidebar.add(node);
            }

            else if(fileType == 'STRINGS'){
                node.text = "Strings";
                w2ui.sidebar.add(node);
            }

            else if(fileType.startsWith("PF")){
                node = {id: fileType, img: "icon-folder", group: false, text: fileType};
                packNode.nodes.push(node);
            }

            else if(fileType == 'UNKNOWN'){
                node.text = "Unknown";
                w2ui.sidebar.add(node);
            }

            else {
                node = {id: fileType, img: "icon-folder", group: false, text: fileType};
                unsortedNode.nodes.push(node);
            }
            
        } 
    }

    if(packNode.nodes.length>0){
        w2ui.sidebar.add(packNode);
    }

    if(textureNode.nodes.length>0){
        w2ui.sidebar.add(textureNode);
    }

    if(unsortedNode.nodes.length>0){
        w2ui.sidebar.add(unsortedNode);
    }

}

/**
 * This function is called by the main app to create the gui layout.
 */
function initLayout() {

    mainGrid();
    sidebar();
    fileBrowser();
    fileView();
    stringGrid();

    /*
        SET UP TREE 3D SCENE
    */
    Utils.setupScene();


    /// Ask for file
    w2popup.open(
        {
            speed: 0,
            title: 'Load A GW2 dat',
            modal: true,
            showClose: false,
            body: '<div class="w2ui-centered">' +
                '<div id="fileLoadProgress" />' +
                '<input id="filePickerPop" type="file" />' +
                '</div>'
        }
    );


    $("#filePickerPop")
        .change(
            function (evt) {
                _lr = T3D.getLocalReader(
                    evt.target.files[0],
                    Utils.onReaderCreated,
                    "../static/t3dworker.js");
            }
        );


    /// Overwrite progress logger
    T3D.Logger.logFunctions[T3D.Logger.TYPE_PROGRESS] = function () {
        $("#filePickerPop").prop('disabled', true);
        $("#fileLoadProgress").html(
            "Indexing .dat file (first visit only)<br/>" +
            arguments[1] + "%<br/><br/>"
        );
    }
}

module.exports = {
    initLayout: initLayout,
    sidebarNodes: sidebarNodes
}
},{"./filegrid":1,"./fileviewer":2,"./utils":5}],4:[function(require,module,exports){
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

// This file is the main entry point for the Tyria2D application

const Layout = require('./layout');


//Setting up the global variables for the app

/// T3D
var _lr;
var _context;
var _fileId;
var _fileList;
var _audioSource;
var _audioContext;

/// THREE
var _scene;
var _camera;
var _renderer;
var _models = [];
var _controls;

Layout.initLayout();
},{"./layout":3}],5:[function(require,module,exports){
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

const Layout = require('./layout');

/// Exports current model as an .obj file with a .mtl refering .png textures.
function exportScene(){

    /// Get last loaded fileId		
    var fileId = _fileId;

    /// Run T3D hacked version of OBJExporter
    var result = new THREE.OBJExporter().parse( _scene, fileId);

    /// Result lists what file ids are used for textures.
    var texIds = result.textureIds;

    /// Set up very basic material file refering the texture pngs
    /// pngs are generated a few lines down.
    var mtlSource ="";
    texIds.forEach(function(texId){
        mtlSource +="newmtl tex_"+texId+"\n"+
                        "  map_Ka tex_"+texId+".png\n"+
                        "  map_Kd tex_"+texId+".png\n\n";
    });

    /// Download obj
    var blob = new Blob([result.obj], {type: "octet/stream"});
    saveData(blob,"export."+fileId+".obj");

    /// Download mtl
    blob = new Blob([mtlSource], {type: "octet/stream"});
    saveData(blob,"export."+fileId+".mtl");
    
    /// Download texture pngs
    texIds.forEach(function(texId){

        /// LocalReader will have to re-load the textures, don't want to fetch
        /// then from the model data..
        _lr.loadTextureFile(texId,
            function(inflatedData, dxtType, imageWidth, imageHeigth){
                
                /// Create js image using returned bitmap data.
                var image = {
                    data   : new Uint8Array(inflatedData),
                    width  : imageWidth,
                    height : imageHeigth
                };

                /// Need a canvas in order to draw
                var canvas = $("<canvas />");
                $("body").append(canvas);

                canvas[0].width =  image.width;
                canvas[0].height =  image.height;

                var ctx = canvas[0].getContext("2d");

                /// Draw raw bitmap to canvas
                var uica = new Uint8ClampedArray(image.data);		        	
                var imagedata = new ImageData(uica, image.width, image.height);
                ctx.putImageData(imagedata,0,0);

                /// This is where shit gets stupid. Flipping raw bitmaps in js
                /// is apparently a pain. Basicly read current state pixel by pixel
                /// and write it back with flipped y-axis 
                var input = ctx.getImageData(0, 0, image.width, image.height);
                
                /// Create output image data buffer
                var output = ctx.createImageData(image.width, image.height);
                
                /// Get imagedata size
                var w = input.width, h = input.height;
                var inputData = input.data;
                var outputData = output.data
                
                /// Loop pixels
                for (var y = 1; y < h-1; y += 1) {
                    for (var x = 1; x < w-1; x += 1) {
                        
                        /// Input linear coordinate
                        var i = (y*w + x)*4;

                        /// Output linear coordinate
                        var flip = ( (h-y)*w + x)*4;

                        /// Read and write RGBA
                        /// TODO: Perhaps put alpha to 100%
                        for (var c = 0; c < 4; c += 1) {
                            outputData[i+c] = inputData[flip+c];
                        }
                    }
                }

                /// Write back flipped data
                ctx.putImageData(output, 0, 0);

                /// Fetch canvas data as png and download.
                canvas[0].toBlob(
                    function(pngBlob) {
                        saveData( pngBlob, "tex_"+texId+".png" );
                    }
                );

                /// Remove canvas from DOM
                canvas.remove();
                    
            }
        );

        
    });

}



/// Utility for downloading files to client
var saveData = (function () {
    var a = document.createElement("a");
    document.body.appendChild(a);
    a.style = "display: none";
    return function (blob, fileName) {        
        var url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
    };
}());



/// Setting up a scene, Tree.js standard stuff...
function setupScene(){

    var canvasWidth = $("#modelOutput").width();
    var canvasHeight = $("#modelOutput").height();
    var canvasClearColor = 0x342920; // For happy rendering, always use Van Dyke Brown.
    var fov = 60;
    var aspect = 1;
    var near = 0.1;
    var far = 500000;

    _camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    _scene = new THREE.Scene();

    /// This scene has one ambient light source and three directional lights
    var ambientLight = new THREE.AmbientLight( 0x555555 );
    _scene.add( ambientLight );

    var directionalLight1 = new THREE.DirectionalLight( 0xffffff, .8 );
    directionalLight1.position.set( 0, 0, 1 );
    _scene.add( directionalLight1 );

    var directionalLight2 = new THREE.DirectionalLight( 0xffffff, .8);
    directionalLight2.position.set( 1, 0, 0 );
    _scene.add( directionalLight2 );

    var directionalLight3 = new THREE.DirectionalLight( 0xffffff, .8 );
    directionalLight3.position.set( 0, 1, 0 );
    _scene.add( directionalLight3 );
    
    /// Standard THREE renderer with AA
    _renderer = new THREE.WebGLRenderer({antialiasing: true});
    $("#modelOutput")[0].appendChild(_renderer.domElement);
    
    _renderer.setSize( canvasWidth, canvasHeight );
    _renderer.setClearColor( canvasClearColor );

    /// Add THREE orbit controls, for simple orbiting, panning and zooming
    _controls = new THREE.OrbitControls( _camera, _renderer.domElement );
    _controls.enableZoom = true;     

    /// Sems w2ui delays resizing :/
    $(window).resize(function(){setTimeout(onCanvasResize,10)});

    /// Note: constant continous rendering from page load event, not very opt.
    render();
}


function onCanvasResize(){
    
    var sceneWidth = $("#modelOutput").width();
    var sceneHeight = $("#modelOutput").height();

    if(!sceneHeight || !sceneWidth)
        return;

    _camera.aspect = sceneWidth / sceneHeight;

    _renderer.setSize(sceneWidth, sceneHeight);

    _camera.updateProjectionMatrix();
}

function onReaderCreated(){

    T3D.getFileListAsync(_lr,
        function(files){

            /// Store fileList globally
            _fileList = files;

            Layout.sidebarNodes();

            /// Close the pop
            w2popup.close();

            /// Select the "All" category
            w2ui.sidebar.click("All");

        } /// End readFileListAsync callback
    );
    
}

/// Render loop, no game logic, just rendering.
function render(){
    window.requestAnimationFrame( render );
    _renderer.render(_scene, _camera);
}

module.exports = {
    exportScene: exportScene,
    saveData: saveData,
    setupScene: setupScene,
    onCanvasResize: onCanvasResize,
    onReaderCreated: onReaderCreated,
    render: render
}
},{"./layout":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9maWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL2ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9sYXlvdXQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9tYWluLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0R0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuV0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcbiAgICBcclxuICAgIC8vLyBObyBmaWx0ZXIgaWYgY2xpY2tlZCBncm91cCB3YXMgXCJBbGxcIlxyXG4gICAgaWYoZXZ0LnRhcmdldD09XCJBbGxcIil7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBPdGhlciBldmVudHMgYXJlIGZpbmUgdG8ganVzdCBwYXNzXHJcbiAgICBlbHNle1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcdFxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpe1xyXG5cclxuICAgIHcydWkuZ3JpZC5yZWNvcmRzID0gW107XHJcblxyXG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IF9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBfZmlsZUxpc3QpIHtcclxuXHJcbiAgICAgICAgLy8vIE9ubHkgc2hvdyB0eXBlcyB3ZSd2ZSBhc2tlZCBmb3JcclxuICAgICAgICBpZihmaWxlVHlwZUZpbHRlciAmJiBmaWxlVHlwZUZpbHRlci5pbmRleE9mKGZpbGVUeXBlKSA8IDApe1xyXG5cclxuICAgICAgICAgICAgLy8vIFNwZWNpYWwgY2FzZSBmb3IgXCJwYWNrR3JvdXBcIlxyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIGxldCB0cm91Z2ggYWxsIHBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBOT1QgbGV0IHRyb3VnaHQgYW55IG5vbi1wYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBpLmUuIFN0cmluZ3MsIEJpbmFyaWVzIGV0Y1xyXG4gICAgICAgICAgICBpZihmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwicGFja0dyb3VwXCIpPj0wKXtcclxuICAgICAgICAgICAgICAgIGlmKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInRleHR1cmVHcm91cFwiKT49MCl7XHJcbiAgICAgICAgICAgICAgICBpZighZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcdFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKF9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaWxlQXJyID0gX2ZpbGVMaXN0W2ZpbGVUeXBlXTtcclxuICAgICAgICAgICAgZmlsZUFyci5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24obWZ0SW5kZXgpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IF9sci5nZXRGaWxlTWV0YShtZnRJbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlSWRzID0gcmV2ZXJzZVRhYmxlW21mdEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVNpemUgPSAgKG1ldGEpID8gbWV0YS5zaXplOiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZihmaWxlU2l6ZT4wICYmIG1mdEluZGV4ID4gMTUpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJ1aVsnZ3JpZCddLnJlY29yZHMucHVzaCh7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjaWQgOiBtZnRJbmRleCwgLy8vIE1GVCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZUlkczogYmFzZUlkcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplIDogZmlsZVNpemVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHRcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZnRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfS8vLyBFbmQgZm9yIGVhY2ggbWZ0IGluIHRoaXMgZmlsZSB0eXBlXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIH0gLy8vIEVuZCBpZiBfZmlsZUxpc3RbZmlsZXR5cGVdXHJcblxyXG4gICAgfSAvLy8gRW5kIGZvciBlYWNoIGZpbGVUeXBlIGtleSBpbiBfZmlsZUxpc3Qgb2JqZWN0XHJcblxyXG4gICAgLy8vIFVwZGF0ZSBmaWxlIGdyaWRcclxuICAgIHcydWkuZ3JpZC5idWZmZXJlZCA9IHcydWkuZ3JpZC5yZWNvcmRzLmxlbmd0aDtcclxuICAgIHcydWkuZ3JpZC50b3RhbCA9IHcydWkuZ3JpZC5idWZmZXJlZDtcclxuICAgIHcydWkuZ3JpZC5yZWZyZXNoKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb25GaWx0ZXJDbGljazogb25GaWx0ZXJDbGljayxcclxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuZnVuY3Rpb24gdmlld0ZpbGVCeU1GVChtZnRJZHgpe1xyXG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IF9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuICAgIFxyXG4gICAgdmFyIGJhc2VJZCA9IChyZXZlcnNlVGFibGVbbWZ0SWR4XSkgPyByZXZlcnNlVGFibGVbbWZ0SWR4XVswXSA6IFwiXCI7XHJcblxyXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB2aWV3RmlsZUJ5RmlsZUlkKGZpbGVJZCl7XHJcblxyXG4gICAgLy8vIENsZWFuIG91dHB1dHNcclxuICAgICQoXCIudGFiT3V0cHV0XCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKFwiXCIpO1xyXG5cclxuICAgIC8vLyBDbGVhbiBjb250ZXh0IHRvb2xiYXJcclxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuaHRtbChcIlwiKTtcclxuXHJcbiAgICAvLy8gRGlzYWJsZSB0YWJzXHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlJhdycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJQRicpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJUZXh0dXJlJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlN0cmluZycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJNb2RlbCcpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJTb3VuZCcpO1xyXG5cclxuICAgIC8vLyBSZW1vdmUgb2xkIG1vZGVscyBmcm9tIHRoZSBzY2VuZVxyXG4gICAgaWYoX21vZGVscyl7XHJcbiAgICAgICAgX21vZGVscy5mb3JFYWNoKGZ1bmN0aW9uKG1kbCl7XHJcbiAgICAgICAgICAgIF9zY2VuZS5yZW1vdmUobWRsKTtcclxuICAgICAgICB9KTtcdFxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgX2NvbnRleHQgaXMgY2xlYW5cclxuICAgIF9jb250ZXh0ID0ge307XHJcblxyXG4gICAgLy8vIFJ1biB0aGUgYmFzaWMgRGF0YVJlbmRlcmVyLCBoYW5kbGVzIGFsbCBzb3J0cyBvZiBmaWxlcyBmb3IgdXMuXHJcbiAgICBUM0QucnVuUmVuZGVyZXIoXHJcbiAgICAgICAgVDNELkRhdGFSZW5kZXJlcixcclxuICAgICAgICBfbHIsXHJcbiAgICAgICAge2lkOmZpbGVJZH0sXHJcbiAgICAgICAgX2NvbnRleHQsXHJcbiAgICAgICAgb25CYXNpY1JlbmRlcmVyRG9uZVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpe1xyXG5cclxuICAgIC8vLyBSZWFkIHJlbmRlciBvdXRwdXQgZnJvbSBfY29udGV4dCBWT1xyXG4gICAgdmFyIGZpbGVJZCA9IF9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcclxuXHJcbiAgICB2YXIgcmF3RGF0YSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcclxuXHJcbiAgICB2YXIgcmF3ID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdTdHJpbmdcIik7XHJcblxyXG4gICAgdmFyIHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xyXG5cclxuICAgIHZhciBpbWFnZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiaW1hZ2VcIik7XHJcblxyXG5cclxuICAgIHZhciBmY2MgPSByYXcuc3Vic3RyaW5nKDAsNCk7XHJcblxyXG4gICAgLy8vIFVwZGF0ZSBtYWluIGhlYWRlciB0byBzaG93IGZpbGVuYW1lXHJcbiAgICBcclxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVJZCArIChpbWFnZSB8fCAhcGFja2ZpbGUgPyBcIi5cIitmY2MgOiBcIi5cIitwYWNrZmlsZS5oZWFkZXIudHlwZSApO1xyXG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChmaWxlTmFtZSk7XHJcblxyXG4gICAgLy8vIFVwZGF0ZSByYXcgdmlldyBhbmQgZW5hYmxlIHRhYlxyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlJhdycpO1xyXG4gICAgXHJcblxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxyXG4gICAgLmFwcGVuZChcclxuICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCByYXc8L2J1dHRvbj5cIilcclxuICAgICAgICAuY2xpY2soXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyYXdEYXRhXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgICAgICAgICAgICAgIHNhdmVEYXRhKGJsb2IsZmlsZU5hbWUrXCIucmF3XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgKVxyXG5cclxuICAgICQoXCIjcmF3T3V0cHV0XCIpXHJcbiAgICAuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8ZGl2PlwiKS50ZXh0KCByYXcgKVxyXG4gICAgKVxyXG4gICAgXHJcblxyXG4gICAgLy8vIFRleHR1cmUgZmlsZVxyXG4gICAgaWYoaW1hZ2Upe1xyXG5cclxuICAgICAgICAvLy8gU2VsZWN0IHRleHR1cmUgdGFiXHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlRleHR1cmUnKTtcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJUZXh0dXJlJyk7XHJcblxyXG4gICAgICAgIC8vLyBEaXNwbGF5IGJpdG1hcCBvbiBjYW52YXNcclxuICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXM+XCIpO1xyXG4gICAgICAgIGNhbnZhc1swXS53aWR0aCA9ICBpbWFnZS53aWR0aDtcclxuICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gIGltYWdlLmhlaWdodDtcclxuICAgICAgICB2YXIgY3R4ID0gY2FudmFzWzBdLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwwLDApO1xyXG5cclxuICAgICAgICAkKFwiI3RleHR1cmVPdXRwdXRcIikuYXBwZW5kKGNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIFBGIFBhY2sgZmlsZVxyXG4gICAgZWxzZSBpZihwYWNrZmlsZSl7IFx0XHJcblxyXG4gICAgICAgIC8vLyBBbHdheXMgcmVuZGVyIHRoZSBwYWNrIGZpbGUgY2h1bmsgZGF0YVxyXG4gICAgICAgIGRpc3BsYXlQYWNrRmlsZSgpO1xyXG5cclxuICAgICAgICAvLy8gRW5hYmxlIGNvcnJlc3BvbmRpbmcgdGFiXHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlBGJyk7XHJcblxyXG4gICAgICAgIC8vLyBJZiB0aGUgcGFjayBmaWxlIHdhcyBhIG1vZGVsLCByZW5kZXIgaXQhXHJcbiAgICAgICAgaWYocGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gXCJNT0RMXCIpe1xyXG5cclxuICAgICAgICAgICAgLy8vIFJlbmRlciBtb2RlbFxyXG4gICAgICAgICAgICByZW5kZXJGaWxlTW9kZWwoZmlsZUlkKTtcdCAgICAgICAgXHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSBcIkFTTkRcIil7XHJcblxyXG4gICAgICAgICAgICAvLy8gR2V0IGEgY2h1bmssIHRoaXMgaXMgcmVhbGx5IHRoZSBqb2Igb2YgYSByZW5kZXJlciBidXQgd2hhdGV2c1xyXG4gICAgICAgICAgICB2YXIgY2h1bmsgPXBhY2tmaWxlLmdldENodW5rKFwiQVNORFwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBFbmFibGUgYW5kIHNlbGVjdCBzb3VuZCB0YWJcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlNvdW5kJyk7XHJcbiAgICAgICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlNvdW5kJyk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8vIFByaW50IHNvbWUgcmFuZG9tIGRhdGEgYWJvdXQgdGhpcyBzb3VuZFxyXG4gICAgICAgICAgICAkKFwiI3NvdW5kT3V0cHV0XCIpXHJcbiAgICAgICAgICAgIC5odG1sKFxyXG4gICAgICAgICAgICAgICAgXCJMZW5ndGg6IFwiK2NodW5rLmRhdGEubGVuZ3RoK1wiIHNlY29uZHM8YnIvPlwiK1xyXG4gICAgICAgICAgICAgICAgXCJTaXplOiBcIitjaHVuay5kYXRhLmF1ZGlvRGF0YS5sZW5ndGgrXCIgYnl0ZXNcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBFeHRyYWN0IHNvdW5kIGRhdGFcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBzb3VuZFVpbnRBcnJheSA9IGNodW5rLmRhdGEuYXVkaW9EYXRhO1xyXG5cclxuICAgICAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxyXG4gICAgICAgICAgICAuc2hvdygpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3NvdW5kVWludEFycmF5XSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgICAgICAgICAgICAgICAgICBzYXZlRGF0YShibG9iLGZpbGVOYW1lK1wiLm1wM1wiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPlBsYXkgTVAzPC9idXR0b24+XCIpXHJcbiAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIV9hdWRpb0NvbnRleHQpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8vIFN0b3AgcHJldmlvdXMgc291bmRcclxuICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hdWRpb1NvdXJjZS5zdG9wKCk7XHRcclxuICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7fVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG5ldyBidWZmZXIgZm9yIGN1cnJlbnQgc291bmRcclxuICAgICAgICAgICAgICAgICAgICBfYXVkaW9Tb3VyY2UgPSBfYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIF9hdWRpb1NvdXJjZS5jb25uZWN0KCBfYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uICk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vLyBEZWNvZGUgYW5kIHN0YXJ0IHBsYXlpbmdcclxuICAgICAgICAgICAgICAgICAgICBfYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YSggc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiggcmVzICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBfYXVkaW9Tb3VyY2UuYnVmZmVyID0gcmVzO1x0XHRcdFx0XHRcdFx0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hdWRpb1NvdXJjZS5zdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH0gKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPlN0b3AgTVAzPC9idXR0b24+XCIpXHJcbiAgICAgICAgICAgICAgICAuY2xpY2soXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgX2F1ZGlvU291cmNlLnN0b3AoKTtcdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7fVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgLy8vIFNlbGVjdCBQRiB0YWJcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiUEYnKTtcclxuICAgICAgICB9XHRcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIGlmKGZjYyA9PSBcInN0cnNcIil7XHJcblxyXG4gICAgICAgIHNob3dGaWxlU3RyaW5nKGZpbGVJZCk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEVsc2UganVzdCBzaG93IHJhdyB2aWV3XHJcbiAgICBlbHNle1xyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlJhdycpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5UGFja0ZpbGUoKXtcclxuXHJcbiAgICB2YXIgZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XHJcbiAgICB2YXIgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XHJcblxyXG4gICAgJChcIiNwYWNrT3V0cHV0XCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI3BhY2tPdXRwdXRcIikuYXBwZW5kKCQoXCI8aDI+Q2h1bmtzPC9oMj5cIikpO1xyXG5cclxuICAgIHBhY2tmaWxlLmNodW5rcy5mb3JFYWNoKGZ1bmN0aW9uKGNodW5rKXtcclxuXHJcbiAgICAgICAgdmFyIGZpZWxkID0gJChcIjxmaWVsZHNldCAvPlwiKTtcclxuICAgICAgICB2YXIgbGVnZW5kID0gJChcIjxsZWdlbmQ+XCIrY2h1bmsuaGVhZGVyLnR5cGUrXCI8L2xlZ2VuZD5cIik7XHJcblxyXG4gICAgICAgIHZhciBsb2dCdXR0b24gPSAkKFwiPGJ1dHRvbj5Mb2cgQ2h1bmsgRGF0YSB0byBDb25zb2xlPC9idXR0b24+XCIpO1xyXG4gICAgICAgIGxvZ0J1dHRvbi5jbGljayhmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgXCJMb2dnaW5nXCIsY2h1bmsuaGVhZGVyLnR5cGUsIFwiY2h1bmtcIik7XHJcbiAgICAgICAgICAgIFQzRC5Mb2dnZXIubG9nKFQzRC5Mb2dnZXIuVFlQRV9NRVNTQUdFLCBjaHVuay5kYXRhKTtcclxuICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgZmllbGQuYXBwZW5kKGxlZ2VuZCk7XHJcbiAgICAgICAgZmllbGQuYXBwZW5kKCQoXCI8cD5TaXplOlwiK2NodW5rLmhlYWRlci5jaHVua0RhdGFTaXplK1wiPC9wPlwiKSk7XHJcbiAgICAgICAgZmllbGQuYXBwZW5kKGxvZ0J1dHRvbik7XHJcblxyXG4gICAgICAgICQoXCIjcGFja091dHB1dFwiKS5hcHBlbmQoZmllbGQpO1xyXG4gICAgICAgICQoXCIjcGFja091dHB1dFwiKS5zaG93KCk7XHJcbiAgICB9KTsgICAgICAgIFxyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVTdHJpbmcoZmlsZUlkKXtcclxuXHJcbiAgICAvLy8gTWFrZSBzdXJlIG91dHB1dCBpcyBjbGVhblxyXG4gICAgX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcclxuICAgICAgICBfbHIsXHJcbiAgICAgICAge2lkOmZpbGVJZH0sXHJcbiAgICAgICAgX2NvbnRleHQsXHJcbiAgICAgICAgb25SZW5kZXJlckRvbmVTdHJpbmdcclxuICAgICk7XHJcbn1cdFxyXG5cclxuZnVuY3Rpb24gb25SZW5kZXJlckRvbmVTdHJpbmcoKXtcclxuXHJcbiAgICAvLy8gUmVhZCBkYXRhIGZyb20gcmVuZGVyZXJcclxuICAgIHZhciBzdHJpbmdzID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELlN0cmluZ1JlbmRlcmVyLCBcInN0cmluZ3NcIiwgW10pO1xyXG5cclxuICAgIHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzID0gc3RyaW5ncztcclxuXHJcbiAgICBcclxuXHJcbiAgICB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQgPSB3MnVpLnN0cmluZ0dyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLnN0cmluZ0dyaWQudG90YWwgPSB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLnN0cmluZ0dyaWQucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vLyBTZWxlY3QgdGhpcyB2aWV3XHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiU3RyaW5nJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJTdHJpbmcnKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiByZW5kZXJGaWxlTW9kZWwoZmlsZUlkKXtcclxuXHJcbiAgICAvLy8gTWFrZSBzdXJlIG91dHB1dCBpcyBjbGVhblxyXG4gICAgX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLFxyXG4gICAgICAgIF9scixcclxuICAgICAgICB7aWQ6ZmlsZUlkfSxcclxuICAgICAgICBfY29udGV4dCxcclxuICAgICAgICBvblJlbmRlcmVyRG9uZU1vZGVsXHJcbiAgICApO1xyXG59XHRcclxuXHJcbmZ1bmN0aW9uIG9uUmVuZGVyZXJEb25lTW9kZWwoKXtcclxuXHJcbiAgICAvLy8gRW5hYmxlIGFuZCBzZWxlY3QgbW9kZWwgdGFiXHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiTW9kZWwnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYk1vZGVsJyk7XHJcbiAgICAkKFwiI21vZGVsT3V0cHV0XCIpLnNob3coKTtcclxuXHJcbiAgICAvLy8gUmUtZml0IGNhbnZhc1xyXG4gICAgb25DYW52YXNSZXNpemUoKTtcclxuXHJcbiAgICAvLy8gQWRkIGNvbnRleHQgdG9vbGJhciBleHBvcnQgYnV0dG9uXHJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmFwcGVuZChcclxuICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcclxuICAgICAgICAuY2xpY2soZXhwb3J0U2NlbmUpXHJcbiAgICApO1xyXG4gICAgXHJcbiAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xyXG4gICAgX21vZGVscyA9IFQzRC5nZXRDb250ZXh0VmFsdWUoX2NvbnRleHQsIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLCBcIm1lc2hlc1wiLCBbXSk7XHJcblxyXG4gICAgLy8vIEtlZXBpbmcgdHJhY2sgb2YgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGxhdGVyXHJcbiAgICB2YXIgYmlnZ2VzdE1kbCA9IG51bGw7XHJcblxyXG4gICAgLy8vIEFkZCBhbGwgbW9kZWxzIHRvIHRoZSBzY2VuZVxyXG4gICAgX21vZGVscy5mb3JFYWNoKGZ1bmN0aW9uKG1vZGVsKXtcclxuXHJcbiAgICAgICAgLy8vIEZpbmQgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGNhbWVyYSBmb2N1cy9maXR0aW5nXHJcbiAgICAgICAgaWYoIWJpZ2dlc3RNZGwgfHwgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgPCBtb2RlbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMpe1xyXG4gICAgICAgICAgICBiaWdnZXN0TWRsID0gbW9kZWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBfc2NlbmUuYWRkKG1vZGVsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXHJcbiAgICBfY29udHJvbHMucmVzZXQoKTtcclxuXHJcbiAgICAvLy8gRm9jdXMgY2FtZXJhIHRvIHRoZSBiaWdlc3QgbW9kZWwsIGRvZXNuJ3Qgd29yayBncmVhdC5cclxuICAgIHZhciBkaXN0ID0gKGJpZ2dlc3RNZGwgJiYgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZSkgPyBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyAvIE1hdGgudGFuKE1hdGguUEkgKiA2MCAvIDM2MCkgOiAxMDA7XHJcbiAgICBkaXN0ID0gMS4yICogTWF0aC5tYXgoMTAwLGRpc3QpO1xyXG4gICAgZGlzdCA9IE1hdGgubWluKDEwMDAsIGRpc3QpO1xyXG4gICAgX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcclxuICAgIF9jYW1lcmEucG9zaXRpb24ueCA9IGRpc3QqTWF0aC5zcXJ0KDIpO1xyXG4gICAgX2NhbWVyYS5wb3NpdGlvbi55ID0gNTA7XHJcbiAgICBfY2FtZXJhLnBvc2l0aW9uLnogPSAwO1xyXG5cclxuXHJcbiAgICBpZihiaWdnZXN0TWRsKVxyXG4gICAgICAgIF9jYW1lcmEubG9va0F0KGJpZ2dlc3RNZGwucG9zaXRpb24pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHZpZXdGaWxlQnlNRlQ6IHZpZXdGaWxlQnlNRlQsXHJcbiAgICB2aWV3RmlsZUJ5RmlsZUlkOiB2aWV3RmlsZUJ5RmlsZUlkLFxyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBGaWxlVmlld2VyID0gcmVxdWlyZSgnLi9maWxldmlld2VyJyk7XHJcbmNvbnN0IEZpbGVHcmlkID0gcmVxdWlyZSgnLi9maWxlZ3JpZCcpO1xyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBtYWluIGdyaWRcclxuICovXHJcbmZ1bmN0aW9uIG1haW5HcmlkKCkge1xyXG4gICAgY29uc3QgcHN0eWxlID0gJ2JvcmRlcjogMXB4IHNvbGlkICNkZmRmZGY7IHBhZGRpbmc6IDA7JztcclxuICAgICQoJyNsYXlvdXQnKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xheW91dCcsXHJcbiAgICAgICAgcGFuZWxzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDU3MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnbWFyZ2luOjAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyBcIiBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcIixcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2JhY2tncm91bmQtY29sb3I6I2VhZWFlYTsgaGVpZ2h0OjQwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdodG1sJywgaWQ6ICdmaWxlSWRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyBGaWxlIElEOicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgICAgPGlucHV0IGlkPVwiZmlsZUlkSW5wdXRcIi8+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgICA8YnV0dG9uIGlkPVwiZmlsZUlkSW5wdXRCdG5cIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIExvYWQgPC9idXR0b24+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLCBpZDogJ2NvbnRleHRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCIgaWQ9XCJjb250ZXh0VG9vbGJhclwiPjwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuY29udGVudCgnbWFpbicsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uUmVzaXplOiBVdGlscy5vbkNhbnZhc1Jlc2l6ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNmaWxlSWRJbnB1dEJ0blwiKS5jbGljayhcclxuICAgICAgICBmdW5jdGlvbiAoKSB7IEZpbGVWaWV3ZXIudmlld0ZpbGVCeUZpbGVJZCgkKFwiI2ZpbGVJZElucHV0XCIpLnZhbCgpKTsgfVxyXG4gICAgKVxyXG5cclxuXHJcbiAgICAvLy8gR3JpZCBpbnNpZGUgbWFpbiBsZWZ0XHJcbiAgICAkKCkudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsZWZ0TGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFtcclxuICAgICAgICAgICAgeyB0eXBlOiAnbGVmdCcsIHNpemU6IDE1MCwgcmVzaXphYmxlOiB0cnVlLCBzdHlsZTogcHN0eWxlLCBjb250ZW50OiAnbGVmdCcgfSxcclxuICAgICAgICAgICAgeyB0eXBlOiAnbWFpbicsIHNpemU6IDQyMCwgcmVzaXphYmxlOiB0cnVlLCBzdHlsZTogcHN0eWxlLCBjb250ZW50OiAncmlnaHQnIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ2xlZnQnLCB3MnVpWydsZWZ0TGF5b3V0J10pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgc2lkZWJhclxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhcigpe1xyXG4gICAgLypcclxuICAgICAgICBTSURFQkFSXHJcbiAgICAqL1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ2xlZnQnLCAkKCkudzJzaWRlYmFyKHtcclxuICAgICAgICBuYW1lOiAnc2lkZWJhcicsXHJcbiAgICAgICAgaW1nOiBudWxsLFxyXG4gICAgICAgIG5vZGVzOiBbXHJcbiAgICAgICAgICAgIHsgaWQ6ICdBbGwnLCB0ZXh0OiAnQWxsJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25DbGljazogRmlsZUdyaWQub25GaWx0ZXJDbGlja1xyXG4gICAgfSkpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZWJyb3dzZXJcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVCcm93c2VyKCl7XHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbWFpbicsICQoKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgeyBmaWVsZDogJ3JlY2lkJywgY2FwdGlvbjogJ01GVCBpbmRleCcsIHNpemU6ICc4MHB4Jywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgc2VhcmNoYWJsZTogJ2ludCcgfSxcclxuICAgICAgICAgICAgeyBmaWVsZDogJ2Jhc2VJZHMnLCBjYXB0aW9uOiAnQmFzZUlkIGxpc3QnLCBzaXplOiAnMTAwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIHNlYXJjaGFibGU6IHRydWUgfSxcclxuXHRcdFx0eyBmaWVsZDogJ3R5cGUnLCBjYXB0aW9uOiAnVHlwZScsIHNpemU6ICcxMDBweCcsIHJlc2l6YWJsZTogdHJ1ZSwgc29ydGFibGU6IHRydWUgfSxcclxuXHRcdFx0eyBmaWVsZDogJ2ZpbGVTaXplJywgY2FwdGlvbjogJ1BhY2sgU2l6ZScsIHNpemU6ICc4NXB4JywgcmVzaXphYmxlOiB0cnVlLCBzb3J0YWJsZTogdHJ1ZSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5TUZUKGV2ZW50LnJlY2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlIHZpZXcgd2luZG93XHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlVmlldygpIHtcclxuICAgICQodzJ1aVsnbGF5b3V0J10uZWwoJ21haW4nKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxkaXYgaWQ9J2ZpbGVUYWJzJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNSYXcnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdyYXdPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1BhY2snPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdwYWNrT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1RleHR1cmUnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSd0ZXh0dXJlT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1N0cmluZyc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J3N0cmluZ091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgIClcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNNb2RlbCc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J21vZGVsT3V0cHV0Jy8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzU291bmQnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdzb3VuZE91dHB1dCcvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKTtcclxuXHJcblxyXG4gICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICBuYW1lOiAnZmlsZVRhYnMnLFxyXG4gICAgICAgYWN0aXZlOiAndGFiUmF3JyxcclxuICAgICAgIHRhYnM6IFtcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiUmF3JyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1JhdycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1JhdycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYlBGJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1BhY2sgRmlsZScsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1BhY2snKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJUZXh0dXJlJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1RleHR1cmUnLFxyXG4gICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcjZmlsZVRhYnNUZXh0dXJlJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiU3RyaW5nJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1N0cmluZycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1N0cmluZycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYk1vZGVsJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ01vZGVsJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzTW9kZWwnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGNhcHRpb246ICdTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1NvdW5kJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgXVxyXG4gICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RyaW5nR3JpZCgpe1xyXG4gICAgLy8vIFNldCB1cCBncmlkIGZvciBzdHJpbmdzIHZpZXdcclxuICAgIC8vL0NyZWF0ZSBncmlkXHJcbiAgICAkKFwiI3N0cmluZ091dHB1dFwiKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdzdHJpbmdHcmlkJyxcclxuICAgICAgICBzZWxlY3RUeXBlOiAnY2VsbCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbXHJcbiAgICAgICAgICAgIHsgZmllbGQ6ICdyZWNpZCcsIGNhcHRpb246ICdSb3cgIycsIHNpemU6ICc2MHB4JyB9LFxyXG4gICAgICAgICAgICB7IGZpZWxkOiAndmFsdWUnLCBjYXB0aW9uOiAnVGV4dCcsIHNpemU6ICcxMDAlJyB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHdlIGhhdmUgYSBsaXN0IG9mIHRoZSBmaWxlcyB0byBvcmdhbml6ZSB0aGUgY2F0ZWdvcmllcy5cclxuICovXHJcbmZ1bmN0aW9uIHNpZGViYXJOb2Rlcygpe1xyXG5cclxuICAgIHZhciBwYWNrTm9kZSA9IHtcclxuICAgICAgICBpZDogJ3BhY2tHcm91cCcsIHRleHQ6ICdQYWNrIEZpbGVzJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB0ZXh0dXJlTm9kZSA9IHtcclxuICAgICAgICBpZDogJ3RleHR1cmVHcm91cCcsIHRleHQ6ICdUZXh0dXJlIGZpbGVzJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd1bnNvcnRlZEdyb3VwJywgdGV4dDogJ1Vuc29ydGVkJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEJ1aWxkIHNpZGViYXIgbm9kZXNcclxuICAgIGZvciAodmFyIGZpbGVUeXBlIGluIF9maWxlTGlzdCkge1xyXG4gICAgICAgIGlmIChfZmlsZUxpc3QuaGFzT3duUHJvcGVydHkoZmlsZVR5cGUpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtpZDpmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICB2YXIgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKXtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7aWQ6IGZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlLCB0ZXh0OiBmaWxlVHlwZX07XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmKGZpbGVUeXBlID09ICdCSU5BUklFUycpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJCaW5hcmllc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZSA9PSAnU1RSSU5HUycpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSl7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge2lkOiBmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSwgdGV4dDogZmlsZVR5cGV9O1xyXG4gICAgICAgICAgICAgICAgcGFja05vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZSA9PSAnVU5LTk9XTicpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJVbmtub3duXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7aWQ6IGZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlLCB0ZXh0OiBmaWxlVHlwZX07XHJcbiAgICAgICAgICAgICAgICB1bnNvcnRlZE5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG5cclxuICAgIGlmKHBhY2tOb2RlLm5vZGVzLmxlbmd0aD4wKXtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHBhY2tOb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodW5zb3J0ZWROb2RlLm5vZGVzLmxlbmd0aD4wKXtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHVuc29ydGVkTm9kZSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQoKSB7XHJcblxyXG4gICAgbWFpbkdyaWQoKTtcclxuICAgIHNpZGViYXIoKTtcclxuICAgIGZpbGVCcm93c2VyKCk7XHJcbiAgICBmaWxlVmlldygpO1xyXG4gICAgc3RyaW5nR3JpZCgpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgU0VUIFVQIFRSRUUgM0QgU0NFTkVcclxuICAgICovXHJcbiAgICBVdGlscy5zZXR1cFNjZW5lKCk7XHJcblxyXG5cclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3BlbihcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgICAgICB0aXRsZTogJ0xvYWQgQSBHVzIgZGF0JyxcclxuICAgICAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGJvZHk6ICc8ZGl2IGNsYXNzPVwidzJ1aS1jZW50ZXJlZFwiPicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICB9XHJcbiAgICApO1xyXG5cclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIilcclxuICAgICAgICAuY2hhbmdlKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICBfbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5vblJlYWRlckNyZWF0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCIuLi9zdGF0aWMvdDNkd29ya2VyLmpzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuICAgIFQzRC5Mb2dnZXIubG9nRnVuY3Rpb25zW1QzRC5Mb2dnZXIuVFlQRV9QUk9HUkVTU10gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlIChmaXJzdCB2aXNpdCBvbmx5KTxici8+XCIgK1xyXG4gICAgICAgICAgICBhcmd1bWVudHNbMV0gKyBcIiU8YnIvPjxici8+XCJcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2Rlc1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG4vLyBUaGlzIGZpbGUgaXMgdGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBUeXJpYTJEIGFwcGxpY2F0aW9uXHJcblxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dCcpO1xyXG5cclxuXHJcbi8vU2V0dGluZyB1cCB0aGUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIGFwcFxyXG5cclxuLy8vIFQzRFxyXG52YXIgX2xyO1xyXG52YXIgX2NvbnRleHQ7XHJcbnZhciBfZmlsZUlkO1xyXG52YXIgX2ZpbGVMaXN0O1xyXG52YXIgX2F1ZGlvU291cmNlO1xyXG52YXIgX2F1ZGlvQ29udGV4dDtcclxuXHJcbi8vLyBUSFJFRVxyXG52YXIgX3NjZW5lO1xyXG52YXIgX2NhbWVyYTtcclxudmFyIF9yZW5kZXJlcjtcclxudmFyIF9tb2RlbHMgPSBbXTtcclxudmFyIF9jb250cm9scztcclxuXHJcbkxheW91dC5pbml0TGF5b3V0KCk7IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dCcpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKXtcclxuXHJcbiAgICAvLy8gR2V0IGxhc3QgbG9hZGVkIGZpbGVJZFx0XHRcclxuICAgIHZhciBmaWxlSWQgPSBfZmlsZUlkO1xyXG5cclxuICAgIC8vLyBSdW4gVDNEIGhhY2tlZCB2ZXJzaW9uIG9mIE9CSkV4cG9ydGVyXHJcbiAgICB2YXIgcmVzdWx0ID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKCkucGFyc2UoIF9zY2VuZSwgZmlsZUlkKTtcclxuXHJcbiAgICAvLy8gUmVzdWx0IGxpc3RzIHdoYXQgZmlsZSBpZHMgYXJlIHVzZWQgZm9yIHRleHR1cmVzLlxyXG4gICAgdmFyIHRleElkcyA9IHJlc3VsdC50ZXh0dXJlSWRzO1xyXG5cclxuICAgIC8vLyBTZXQgdXAgdmVyeSBiYXNpYyBtYXRlcmlhbCBmaWxlIHJlZmVyaW5nIHRoZSB0ZXh0dXJlIHBuZ3NcclxuICAgIC8vLyBwbmdzIGFyZSBnZW5lcmF0ZWQgYSBmZXcgbGluZXMgZG93bi5cclxuICAgIHZhciBtdGxTb3VyY2UgPVwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbih0ZXhJZCl7XHJcbiAgICAgICAgbXRsU291cmNlICs9XCJuZXdtdGwgdGV4X1wiK3RleElkK1wiXFxuXCIrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiICBtYXBfS2EgdGV4X1wiK3RleElkK1wiLnBuZ1xcblwiK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIit0ZXhJZCtcIi5wbmdcXG5cXG5cIjtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBvYmpcclxuICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jlc3VsdC5vYmpdLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYixcImV4cG9ydC5cIitmaWxlSWQrXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsXCJleHBvcnQuXCIrZmlsZUlkK1wiLm10bFwiKTtcclxuICAgIFxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24odGV4SWQpe1xyXG5cclxuICAgICAgICAvLy8gTG9jYWxSZWFkZXIgd2lsbCBoYXZlIHRvIHJlLWxvYWQgdGhlIHRleHR1cmVzLCBkb24ndCB3YW50IHRvIGZldGNoXHJcbiAgICAgICAgLy8vIHRoZW4gZnJvbSB0aGUgbW9kZWwgZGF0YS4uXHJcbiAgICAgICAgX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24oaW5mbGF0ZWREYXRhLCBkeHRUeXBlLCBpbWFnZVdpZHRoLCBpbWFnZUhlaWd0aCl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUganMgaW1hZ2UgdXNpbmcgcmV0dXJuZWQgYml0bWFwIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSAgIDogbmV3IFVpbnQ4QXJyYXkoaW5mbGF0ZWREYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGltYWdlSGVpZ3RoXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBOZWVkIGEgY2FudmFzIGluIG9yZGVyIHRvIGRyYXdcclxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcyAvPlwiKTtcclxuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChjYW52YXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9ICBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSAgaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcdFx0ICAgICAgICBcdFxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwwLDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgb3V0cHV0IGltYWdlIGRhdGEgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gY3R4LmNyZWF0ZUltYWdlRGF0YShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCwgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLy8gTG9vcCBwaXhlbHNcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSAxOyB5IDwgaC0xOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHctMTsgeCArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSp3ICsgeCkqNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoIChoLXkpKncgKyB4KSo0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaStjXSA9IGlucHV0RGF0YVtmbGlwK2NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihwbmdCbG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVEYXRhKCBwbmdCbG9iLCBcInRleF9cIit0ZXhJZCtcIi5wbmdcIiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkgeyAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuXHJcblxyXG4vLy8gU2V0dGluZyB1cCBhIHNjZW5lLCBUcmVlLmpzIHN0YW5kYXJkIHN0dWZmLi4uXHJcbmZ1bmN0aW9uIHNldHVwU2NlbmUoKXtcclxuXHJcbiAgICB2YXIgY2FudmFzV2lkdGggPSAkKFwiI21vZGVsT3V0cHV0XCIpLndpZHRoKCk7XHJcbiAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuICAgIHZhciBjYW52YXNDbGVhckNvbG9yID0gMHgzNDI5MjA7IC8vIEZvciBoYXBweSByZW5kZXJpbmcsIGFsd2F5cyB1c2UgVmFuIER5a2UgQnJvd24uXHJcbiAgICB2YXIgZm92ID0gNjA7XHJcbiAgICB2YXIgYXNwZWN0ID0gMTtcclxuICAgIHZhciBuZWFyID0gMC4xO1xyXG4gICAgdmFyIGZhciA9IDUwMDAwMDtcclxuXHJcbiAgICBfY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xyXG5cclxuICAgIF9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xyXG4gICAgdmFyIGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4NTU1NTU1ICk7XHJcbiAgICBfc2NlbmUuYWRkKCBhbWJpZW50TGlnaHQgKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIC44ICk7XHJcbiAgICBkaXJlY3Rpb25hbExpZ2h0MS5wb3NpdGlvbi5zZXQoIDAsIDAsIDEgKTtcclxuICAgIF9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQxICk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQyID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAuOCk7XHJcbiAgICBkaXJlY3Rpb25hbExpZ2h0Mi5wb3NpdGlvbi5zZXQoIDEsIDAsIDAgKTtcclxuICAgIF9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQyICk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAuOCApO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KCAwLCAxLCAwICk7XHJcbiAgICBfc2NlbmUuYWRkKCBkaXJlY3Rpb25hbExpZ2h0MyApO1xyXG4gICAgXHJcbiAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxyXG4gICAgX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe2FudGlhbGlhc2luZzogdHJ1ZX0pO1xyXG4gICAgJChcIiNtb2RlbE91dHB1dFwiKVswXS5hcHBlbmRDaGlsZChfcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICBcclxuICAgIF9yZW5kZXJlci5zZXRTaXplKCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0ICk7XHJcbiAgICBfcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggY2FudmFzQ2xlYXJDb2xvciApO1xyXG5cclxuICAgIC8vLyBBZGQgVEhSRUUgb3JiaXQgY29udHJvbHMsIGZvciBzaW1wbGUgb3JiaXRpbmcsIHBhbm5pbmcgYW5kIHpvb21pbmdcclxuICAgIF9jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKCBfY2FtZXJhLCBfcmVuZGVyZXIuZG9tRWxlbWVudCApO1xyXG4gICAgX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlOyAgICAgXHJcblxyXG4gICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cclxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKXtzZXRUaW1lb3V0KG9uQ2FudmFzUmVzaXplLDEwKX0pO1xyXG5cclxuICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIG9uQ2FudmFzUmVzaXplKCl7XHJcbiAgICBcclxuICAgIHZhciBzY2VuZVdpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIHNjZW5lSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuXHJcbiAgICBpZighc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIF9jYW1lcmEuYXNwZWN0ID0gc2NlbmVXaWR0aCAvIHNjZW5lSGVpZ2h0O1xyXG5cclxuICAgIF9yZW5kZXJlci5zZXRTaXplKHNjZW5lV2lkdGgsIHNjZW5lSGVpZ2h0KTtcclxuXHJcbiAgICBfY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25SZWFkZXJDcmVhdGVkKCl7XHJcblxyXG4gICAgVDNELmdldEZpbGVMaXN0QXN5bmMoX2xyLFxyXG4gICAgICAgIGZ1bmN0aW9uKGZpbGVzKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTdG9yZSBmaWxlTGlzdCBnbG9iYWxseVxyXG4gICAgICAgICAgICBfZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgICAgIExheW91dC5zaWRlYmFyTm9kZXMoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBDbG9zZSB0aGUgcG9wXHJcbiAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTZWxlY3QgdGhlIFwiQWxsXCIgY2F0ZWdvcnlcclxuICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmNsaWNrKFwiQWxsXCIpO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgcmVhZEZpbGVMaXN0QXN5bmMgY2FsbGJhY2tcclxuICAgICk7XHJcbiAgICBcclxufVxyXG5cclxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cclxuZnVuY3Rpb24gcmVuZGVyKCl7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCByZW5kZXIgKTtcclxuICAgIF9yZW5kZXJlci5yZW5kZXIoX3NjZW5lLCBfY2FtZXJhKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBleHBvcnRTY2VuZTogZXhwb3J0U2NlbmUsXHJcbiAgICBzYXZlRGF0YTogc2F2ZURhdGEsXHJcbiAgICBzZXR1cFNjZW5lOiBzZXR1cFNjZW5lLFxyXG4gICAgb25DYW52YXNSZXNpemU6IG9uQ2FudmFzUmVzaXplLFxyXG4gICAgb25SZWFkZXJDcmVhdGVkOiBvblJlYWRlckNyZWF0ZWQsXHJcbiAgICByZW5kZXI6IHJlbmRlclxyXG59Il19
