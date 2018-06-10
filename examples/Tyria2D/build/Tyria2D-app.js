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

    /// Pack files should remove leading "PF-"
    else if(evt.target.indexOf("PF-")==0){
        showFileGroup([evt.target.split("PF-")[1]]);
    }

    /// Other events are fine to just pass
    else{
        showFileGroup([evt.target]);	
    }
    
}

function showFileGroup(fileTypeFilter){

    w2ui.grid.records = [];

    for (var fileType in _fileList) {

        /// Only show types we've asked for
        if(fileTypeFilter && fileTypeFilter.indexOf(fileType) < 0){

            /// Special case for "packGroup"
            /// Should let trough all pack types
            /// Should NOT let trought any non-pack types
            /// i.e. Strings, Binaries etc
            if(fileTypeFilter.indexOf("packGroup")>=0){
                if(["Texture","Binary","String","Unknown"].indexOf(fileType)>=0){
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

                    mftIndex++;

                    var baseId = _lr.mft.m_entryToId.baseId[mftIndex];
                    var fileId = _lr.mft.m_entryToId.fileId[mftIndex];
                    var fileSize =  _lr.mft.entryDict.size[mftIndex-1];

                    if(fileSize>0){

                        w2ui['grid'].records.push({ 
                            recid : mftIndex, /// MFT index
                            baseId: baseId,
                            fileId: fileId,
                            type : fileType,
                            fileSize : fileSize
                        });	

                    }
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
    
    var fileId = _lr.mft.m_entryToId.fileId[mftIdx];
    var baseId = _lr.mft.m_entryToId.baseId[mftIdx];

    if(baseId==0)
        baseId = fileId;

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
            { field: 'fileId', caption: 'File Id', size: '80px', sortable: true, resizable: true, searchable: 'int' },
            { field: 'baseId', caption: 'Base Id', size: '80px', sortable: true, resizable: true, searchable: 'int' },
            { field: 'type', caption: 'Type', size: '100%', resizable: true, sortable: true },
            { field: 'fileSize', caption: 'Size', size: '85px', resizable: true, sortable: true }
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
           },
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
        id: 'packGroup', text: 'Pack Files', img: 'icon-folder',
        expanded: true, group: false,
        nodes: []
    };

    /// Build sidebar nodes
    for (var fileType in _fileList) {
        if (_fileList.hasOwnProperty(fileType)) {

            var node = {id:fileType, img: "icon-folder", group: false };
            var isPack = false;
            switch(fileType){
                
                case "Texture":
                    node.text = "Textures";
                    break;

                case "Binary":
                    node.text = "Binaries";
                    break;

                case "String":
                    node.text = "Strings";
                    break;

                case "Unknown":
                    node.text = "Unknown";
                    break;

                default:
                    isPack = true;
                    node = {id:"PF-"+fileType, img: "icon-folder", group: false };
                    node.text = fileType;
                    /// Pack file!
            }

            /// Not a pack file just add to root list
            if(!isPack){
                w2ui.sidebar.add(node);	
            }

            /// Pack file types found!
            /// Add sub node for this pack type
            else{
                packNode.nodes.push(node);
            }
            
        } 
    }

    if(packNode.nodes.length>0){
        w2ui.sidebar.add(packNode);
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
                    "lib/t3dworker.js");
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

const Layout = require('./layout');

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9maWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL2ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9sYXlvdXQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9tYWluLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvdXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdFhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3BDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcbiAgICBcclxuICAgIC8vLyBObyBmaWx0ZXIgaWYgY2xpY2tlZCBncm91cCB3YXMgXCJBbGxcIlxyXG4gICAgaWYoZXZ0LnRhcmdldD09XCJBbGxcIil7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBQYWNrIGZpbGVzIHNob3VsZCByZW1vdmUgbGVhZGluZyBcIlBGLVwiXHJcbiAgICBlbHNlIGlmKGV2dC50YXJnZXQuaW5kZXhPZihcIlBGLVwiKT09MCl7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cChbZXZ0LnRhcmdldC5zcGxpdChcIlBGLVwiKVsxXV0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBPdGhlciBldmVudHMgYXJlIGZpbmUgdG8ganVzdCBwYXNzXHJcbiAgICBlbHNle1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcdFxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpe1xyXG5cclxuICAgIHcydWkuZ3JpZC5yZWNvcmRzID0gW107XHJcblxyXG4gICAgZm9yICh2YXIgZmlsZVR5cGUgaW4gX2ZpbGVMaXN0KSB7XHJcblxyXG4gICAgICAgIC8vLyBPbmx5IHNob3cgdHlwZXMgd2UndmUgYXNrZWQgZm9yXHJcbiAgICAgICAgaWYoZmlsZVR5cGVGaWx0ZXIgJiYgZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihmaWxlVHlwZSkgPCAwKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNhc2UgZm9yIFwicGFja0dyb3VwXCJcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBsZXQgdHJvdWdoIGFsbCBwYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgTk9UIGxldCB0cm91Z2h0IGFueSBub24tcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gaS5lLiBTdHJpbmdzLCBCaW5hcmllcyBldGNcclxuICAgICAgICAgICAgaWYoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInBhY2tHcm91cFwiKT49MCl7XHJcbiAgICAgICAgICAgICAgICBpZihbXCJUZXh0dXJlXCIsXCJCaW5hcnlcIixcIlN0cmluZ1wiLFwiVW5rbm93blwiXS5pbmRleE9mKGZpbGVUeXBlKT49MCl7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1x0XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGVBcnIgPSBfZmlsZUxpc3RbZmlsZVR5cGVdO1xyXG4gICAgICAgICAgICBmaWxlQXJyLmZvckVhY2goXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihtZnRJbmRleCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1mdEluZGV4Kys7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlSWQgPSBfbHIubWZ0Lm1fZW50cnlUb0lkLmJhc2VJZFttZnRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVJZCA9IF9sci5tZnQubV9lbnRyeVRvSWQuZmlsZUlkW21mdEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVNpemUgPSAgX2xyLm1mdC5lbnRyeURpY3Quc2l6ZVttZnRJbmRleC0xXTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZmlsZVNpemU+MCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3MnVpWydncmlkJ10ucmVjb3Jkcy5wdXNoKHsgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpZCA6IG1mdEluZGV4LCAvLy8gTUZUIGluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlSWQ6IGJhc2VJZCxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVJZDogZmlsZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZSA6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVNpemUgOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcdFxyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9Ly8vIEVuZCBmb3IgZWFjaCBtZnQgaW4gdGhpcyBmaWxlIHR5cGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgfSAvLy8gRW5kIGlmIF9maWxlTGlzdFtmaWxldHlwZV1cclxuXHJcbiAgICB9IC8vLyBFbmQgZm9yIGVhY2ggZmlsZVR5cGUga2V5IGluIF9maWxlTGlzdCBvYmplY3RcclxuXHJcbiAgICAvLy8gVXBkYXRlIGZpbGUgZ3JpZFxyXG4gICAgdzJ1aS5ncmlkLmJ1ZmZlcmVkID0gdzJ1aS5ncmlkLnJlY29yZHMubGVuZ3RoO1xyXG4gICAgdzJ1aS5ncmlkLnRvdGFsID0gdzJ1aS5ncmlkLmJ1ZmZlcmVkO1xyXG4gICAgdzJ1aS5ncmlkLnJlZnJlc2goKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbkZpbHRlckNsaWNrOiBvbkZpbHRlckNsaWNrLFxyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5mdW5jdGlvbiB2aWV3RmlsZUJ5TUZUKG1mdElkeCl7XHJcbiAgICBcclxuICAgIHZhciBmaWxlSWQgPSBfbHIubWZ0Lm1fZW50cnlUb0lkLmZpbGVJZFttZnRJZHhdO1xyXG4gICAgdmFyIGJhc2VJZCA9IF9sci5tZnQubV9lbnRyeVRvSWQuYmFzZUlkW21mdElkeF07XHJcblxyXG4gICAgaWYoYmFzZUlkPT0wKVxyXG4gICAgICAgIGJhc2VJZCA9IGZpbGVJZDtcclxuXHJcbiAgICB2aWV3RmlsZUJ5RmlsZUlkKGJhc2VJZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZpZXdGaWxlQnlGaWxlSWQoZmlsZUlkKXtcclxuXHJcbiAgICAvLy8gQ2xlYW4gb3V0cHV0c1xyXG4gICAgJChcIi50YWJPdXRwdXRcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjZmlsZVRpdGxlXCIpLmh0bWwoXCJcIik7XHJcblxyXG4gICAgLy8vIENsZWFuIGNvbnRleHQgdG9vbGJhclxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5odG1sKFwiXCIpO1xyXG5cclxuICAgIC8vLyBEaXNhYmxlIHRhYnNcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiUmF3Jyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlBGJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlRleHR1cmUnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiU3RyaW5nJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYk1vZGVsJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlNvdW5kJyk7XHJcblxyXG4gICAgLy8vIFJlbW92ZSBvbGQgbW9kZWxzIGZyb20gdGhlIHNjZW5lXHJcbiAgICBpZihfbW9kZWxzKXtcclxuICAgICAgICBfbW9kZWxzLmZvckVhY2goZnVuY3Rpb24obWRsKXtcclxuICAgICAgICAgICAgX3NjZW5lLnJlbW92ZShtZGwpO1xyXG4gICAgICAgIH0pO1x0XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE1ha2Ugc3VyZSBfY29udGV4dCBpcyBjbGVhblxyXG4gICAgX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHRoZSBiYXNpYyBEYXRhUmVuZGVyZXIsIGhhbmRsZXMgYWxsIHNvcnRzIG9mIGZpbGVzIGZvciB1cy5cclxuICAgIFQzRC5ydW5SZW5kZXJlcihcclxuICAgICAgICBUM0QuRGF0YVJlbmRlcmVyLFxyXG4gICAgICAgIF9scixcclxuICAgICAgICB7aWQ6ZmlsZUlkfSxcclxuICAgICAgICBfY29udGV4dCxcclxuICAgICAgICBvbkJhc2ljUmVuZGVyZXJEb25lXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkJhc2ljUmVuZGVyZXJEb25lKCl7XHJcblxyXG4gICAgLy8vIFJlYWQgcmVuZGVyIG91dHB1dCBmcm9tIF9jb250ZXh0IFZPXHJcbiAgICB2YXIgZmlsZUlkID0gX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xyXG5cclxuICAgIHZhciByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdEYXRhXCIpO1xyXG5cclxuICAgIHZhciByYXcgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd1N0cmluZ1wiKTtcclxuXHJcbiAgICB2YXIgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XHJcblxyXG4gICAgdmFyIGltYWdlID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJpbWFnZVwiKTtcclxuXHJcblxyXG4gICAgdmFyIGZjYyA9IHJhdy5zdWJzdHJpbmcoMCw0KTtcclxuXHJcbiAgICAvLy8gVXBkYXRlIG1haW4gaGVhZGVyIHRvIHNob3cgZmlsZW5hbWVcclxuICAgIFxyXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZUlkICsgKGltYWdlIHx8ICFwYWNrZmlsZSA/IFwiLlwiK2ZjYyA6IFwiLlwiK3BhY2tmaWxlLmhlYWRlci50eXBlICk7XHJcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKGZpbGVOYW1lKTtcclxuXHJcbiAgICAvLy8gVXBkYXRlIHJhdyB2aWV3IGFuZCBlbmFibGUgdGFiXHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiUmF3Jyk7XHJcbiAgICBcclxuXHJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXHJcbiAgICAuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIHJhdzwvYnV0dG9uPlwiKVxyXG4gICAgICAgIC5jbGljayhcclxuICAgICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jhd0RhdGFdLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgICAgICAgICAgICAgc2F2ZURhdGEoYmxvYixmaWxlTmFtZStcIi5yYXdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICApXHJcblxyXG4gICAgJChcIiNyYXdPdXRwdXRcIilcclxuICAgIC5hcHBlbmQoXHJcbiAgICAgICAgJChcIjxkaXY+XCIpLnRleHQoIHJhdyApXHJcbiAgICApXHJcbiAgICBcclxuXHJcbiAgICAvLy8gVGV4dHVyZSBmaWxlXHJcbiAgICBpZihpbWFnZSl7XHJcblxyXG4gICAgICAgIC8vLyBTZWxlY3QgdGV4dHVyZSB0YWJcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiVGV4dHVyZScpO1xyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlRleHR1cmUnKTtcclxuXHJcbiAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xyXG4gICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcz5cIik7XHJcbiAgICAgICAgY2FudmFzWzBdLndpZHRoID0gIGltYWdlLndpZHRoO1xyXG4gICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSAgaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xyXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VkYXRhLDAsMCk7XHJcblxyXG4gICAgICAgICQoXCIjdGV4dHVyZU91dHB1dFwiKS5hcHBlbmQoY2FudmFzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLy8gUEYgUGFjayBmaWxlXHJcbiAgICBlbHNlIGlmKHBhY2tmaWxlKXsgXHRcclxuXHJcbiAgICAgICAgLy8vIEFsd2F5cyByZW5kZXIgdGhlIHBhY2sgZmlsZSBjaHVuayBkYXRhXHJcbiAgICAgICAgZGlzcGxheVBhY2tGaWxlKCk7XHJcblxyXG4gICAgICAgIC8vLyBFbmFibGUgY29ycmVzcG9uZGluZyB0YWJcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiUEYnKTtcclxuXHJcbiAgICAgICAgLy8vIElmIHRoZSBwYWNrIGZpbGUgd2FzIGEgbW9kZWwsIHJlbmRlciBpdCFcclxuICAgICAgICBpZihwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSBcIk1PRExcIil7XHJcblxyXG4gICAgICAgICAgICAvLy8gUmVuZGVyIG1vZGVsXHJcbiAgICAgICAgICAgIHJlbmRlckZpbGVNb2RlbChmaWxlSWQpO1x0ICAgICAgICBcdFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhY2tmaWxlLmhlYWRlci50eXBlID09IFwiQVNORFwiKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBHZXQgYSBjaHVuaywgdGhpcyBpcyByZWFsbHkgdGhlIGpvYiBvZiBhIHJlbmRlcmVyIGJ1dCB3aGF0ZXZzXHJcbiAgICAgICAgICAgIHZhciBjaHVuayA9cGFja2ZpbGUuZ2V0Q2h1bmsoXCJBU05EXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8vIEVuYWJsZSBhbmQgc2VsZWN0IHNvdW5kIHRhYlxyXG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiU291bmQnKTtcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiU291bmQnKTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLy8gUHJpbnQgc29tZSByYW5kb20gZGF0YSBhYm91dCB0aGlzIHNvdW5kXHJcbiAgICAgICAgICAgICQoXCIjc291bmRPdXRwdXRcIilcclxuICAgICAgICAgICAgLmh0bWwoXHJcbiAgICAgICAgICAgICAgICBcIkxlbmd0aDogXCIrY2h1bmsuZGF0YS5sZW5ndGgrXCIgc2Vjb25kczxici8+XCIrXHJcbiAgICAgICAgICAgICAgICBcIlNpemU6IFwiK2NodW5rLmRhdGEuYXVkaW9EYXRhLmxlbmd0aCtcIiBieXRlc1wiXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLy8vIEV4dHJhY3Qgc291bmQgZGF0YVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHNvdW5kVWludEFycmF5ID0gY2h1bmsuZGF0YS5hdWRpb0RhdGE7XHJcblxyXG4gICAgICAgICAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXHJcbiAgICAgICAgICAgIC5zaG93KClcclxuICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIE1QMzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgICAgICAgICAgICAgICAgIHNhdmVEYXRhKGJsb2IsZmlsZU5hbWUrXCIubXAzXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChcIjxidXR0b24+UGxheSBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZighX2F1ZGlvQ29udGV4dCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLy8gU3RvcCBwcmV2aW91cyBzb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2F1ZGlvU291cmNlLnN0b3AoKTtcdFxyXG4gICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXt9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgbmV3IGJ1ZmZlciBmb3IgY3VycmVudCBzb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgIF9hdWRpb1NvdXJjZSA9IF9hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgX2F1ZGlvU291cmNlLmNvbm5lY3QoIF9hdWRpb0NvbnRleHQuZGVzdGluYXRpb24gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8vIERlY29kZSBhbmQgc3RhcnQgcGxheWluZ1xyXG4gICAgICAgICAgICAgICAgICAgIF9hdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKCBzb3VuZFVpbnRBcnJheS5idWZmZXIsIGZ1bmN0aW9uKCByZXMgKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIF9hdWRpb1NvdXJjZS5idWZmZXIgPSByZXM7XHRcdFx0XHRcdFx0XHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgX2F1ZGlvU291cmNlLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChcIjxidXR0b24+U3RvcCBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBfYXVkaW9Tb3VyY2Uuc3RvcCgpO1x0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXt9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAvLy8gU2VsZWN0IFBGIHRhYlxyXG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJQRicpO1xyXG4gICAgICAgIH1cdFxyXG4gICAgfVxyXG5cclxuICAgIGVsc2UgaWYoZmNjID09IFwic3Ryc1wiKXtcclxuXHJcbiAgICAgICAgc2hvd0ZpbGVTdHJpbmcoZmlsZUlkKTtcclxuICAgICAgICBcclxuICAgIH1cclxuXHJcbiAgICAvLy8gRWxzZSBqdXN0IHNob3cgcmF3IHZpZXdcclxuICAgIGVsc2V7XHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiUmF3Jyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BsYXlQYWNrRmlsZSgpe1xyXG5cclxuICAgIHZhciBmaWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcclxuICAgIHZhciBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcclxuXHJcbiAgICAkKFwiI3BhY2tPdXRwdXRcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGFja091dHB1dFwiKS5hcHBlbmQoJChcIjxoMj5DaHVua3M8L2gyPlwiKSk7XHJcblxyXG4gICAgcGFja2ZpbGUuY2h1bmtzLmZvckVhY2goZnVuY3Rpb24oY2h1bmspe1xyXG5cclxuICAgICAgICB2YXIgZmllbGQgPSAkKFwiPGZpZWxkc2V0IC8+XCIpO1xyXG4gICAgICAgIHZhciBsZWdlbmQgPSAkKFwiPGxlZ2VuZD5cIitjaHVuay5oZWFkZXIudHlwZStcIjwvbGVnZW5kPlwiKTtcclxuXHJcbiAgICAgICAgdmFyIGxvZ0J1dHRvbiA9ICQoXCI8YnV0dG9uPkxvZyBDaHVuayBEYXRhIHRvIENvbnNvbGU8L2J1dHRvbj5cIik7XHJcbiAgICAgICAgbG9nQnV0dG9uLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIFQzRC5Mb2dnZXIubG9nKFQzRC5Mb2dnZXIuVFlQRV9NRVNTQUdFLCBcIkxvZ2dpbmdcIixjaHVuay5oZWFkZXIudHlwZSwgXCJjaHVua1wiKTtcclxuICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIGNodW5rLmRhdGEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmaWVsZC5hcHBlbmQobGVnZW5kKTtcclxuICAgICAgICBmaWVsZC5hcHBlbmQoJChcIjxwPlNpemU6XCIrY2h1bmsuaGVhZGVyLmNodW5rRGF0YVNpemUrXCI8L3A+XCIpKTtcclxuICAgICAgICBmaWVsZC5hcHBlbmQobG9nQnV0dG9uKTtcclxuXHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLmFwcGVuZChmaWVsZCk7XHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLnNob3coKTtcclxuICAgIH0pOyAgICAgICAgXHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBzaG93RmlsZVN0cmluZyhmaWxlSWQpe1xyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgb3V0cHV0IGlzIGNsZWFuXHJcbiAgICBfY29udGV4dCA9IHt9O1xyXG5cclxuICAgIC8vLyBSdW4gc2luZ2xlIHJlbmRlcmVyXHJcbiAgICBUM0QucnVuUmVuZGVyZXIoXHJcbiAgICAgICAgVDNELlN0cmluZ1JlbmRlcmVyLFxyXG4gICAgICAgIF9scixcclxuICAgICAgICB7aWQ6ZmlsZUlkfSxcclxuICAgICAgICBfY29udGV4dCxcclxuICAgICAgICBvblJlbmRlcmVyRG9uZVN0cmluZ1xyXG4gICAgKTtcclxufVx0XHJcblxyXG5mdW5jdGlvbiBvblJlbmRlcmVyRG9uZVN0cmluZygpe1xyXG5cclxuICAgIC8vLyBSZWFkIGRhdGEgZnJvbSByZW5kZXJlclxyXG4gICAgdmFyIHN0cmluZ3MgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKF9jb250ZXh0LCBUM0QuU3RyaW5nUmVuZGVyZXIsIFwic3RyaW5nc1wiLCBbXSk7XHJcblxyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMgPSBzdHJpbmdzO1xyXG5cclxuICAgIFxyXG5cclxuICAgIHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZCA9IHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzLmxlbmd0aDtcclxuICAgIHcydWkuc3RyaW5nR3JpZC50b3RhbCA9IHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZDtcclxuICAgIHcydWkuc3RyaW5nR3JpZC5yZWZyZXNoKCk7XHJcblxyXG4gICAgLy8vIFNlbGVjdCB0aGlzIHZpZXdcclxuICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKCd0YWJTdHJpbmcnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlN0cmluZycpO1xyXG59XHJcblxyXG5cclxuXHJcbmZ1bmN0aW9uIHJlbmRlckZpbGVNb2RlbChmaWxlSWQpe1xyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgb3V0cHV0IGlzIGNsZWFuXHJcbiAgICBfY29udGV4dCA9IHt9O1xyXG5cclxuICAgIC8vLyBSdW4gc2luZ2xlIHJlbmRlcmVyXHJcbiAgICBUM0QucnVuUmVuZGVyZXIoXHJcbiAgICAgICAgVDNELlNpbmdsZU1vZGVsUmVuZGVyZXIsXHJcbiAgICAgICAgX2xyLFxyXG4gICAgICAgIHtpZDpmaWxlSWR9LFxyXG4gICAgICAgIF9jb250ZXh0LFxyXG4gICAgICAgIG9uUmVuZGVyZXJEb25lTW9kZWxcclxuICAgICk7XHJcbn1cdFxyXG5cclxuZnVuY3Rpb24gb25SZW5kZXJlckRvbmVNb2RlbCgpe1xyXG5cclxuICAgIC8vLyBFbmFibGUgYW5kIHNlbGVjdCBtb2RlbCB0YWJcclxuICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKCd0YWJNb2RlbCcpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiTW9kZWwnKTtcclxuICAgICQoXCIjbW9kZWxPdXRwdXRcIikuc2hvdygpO1xyXG5cclxuICAgIC8vLyBSZS1maXQgY2FudmFzXHJcbiAgICBvbkNhbnZhc1Jlc2l6ZSgpO1xyXG5cclxuICAgIC8vLyBBZGQgY29udGV4dCB0b29sYmFyIGV4cG9ydCBidXR0b25cclxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8YnV0dG9uPkV4cG9ydCBzY2VuZTwvYnV0dG9uPlwiKVxyXG4gICAgICAgIC5jbGljayhleHBvcnRTY2VuZSlcclxuICAgICk7XHJcbiAgICBcclxuICAgIC8vLyBSZWFkIHRoZSBuZXcgbW9kZWxzXHJcbiAgICBfbW9kZWxzID0gVDNELmdldENvbnRleHRWYWx1ZShfY29udGV4dCwgVDNELlNpbmdsZU1vZGVsUmVuZGVyZXIsIFwibWVzaGVzXCIsIFtdKTtcclxuXHJcbiAgICAvLy8gS2VlcGluZyB0cmFjayBvZiB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgbGF0ZXJcclxuICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcclxuXHJcbiAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXHJcbiAgICBfbW9kZWxzLmZvckVhY2goZnVuY3Rpb24obW9kZWwpe1xyXG5cclxuICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcclxuICAgICAgICBpZighYmlnZ2VzdE1kbCB8fCBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyA8IG1vZGVsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyl7XHJcbiAgICAgICAgICAgIGJpZ2dlc3RNZGwgPSBtb2RlbDtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIF9zY2VuZS5hZGQobW9kZWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIFJlc2V0IGFueSB6b29tIGFuZCB0cmFuc2FsdGlvbi9yb3RhdGlvbiBkb25lIHdoZW4gdmlld2luZyBlYXJsaWVyIG1vZGVscy5cclxuICAgIF9jb250cm9scy5yZXNldCgpO1xyXG5cclxuICAgIC8vLyBGb2N1cyBjYW1lcmEgdG8gdGhlIGJpZ2VzdCBtb2RlbCwgZG9lc24ndCB3b3JrIGdyZWF0LlxyXG4gICAgdmFyIGRpc3QgPSAoYmlnZ2VzdE1kbCAmJiBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlKSA/IGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUucmFkaXVzIC8gTWF0aC50YW4oTWF0aC5QSSAqIDYwIC8gMzYwKSA6IDEwMDtcclxuICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsZGlzdCk7XHJcbiAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XHJcbiAgICBfY2FtZXJhLnBvc2l0aW9uLnpvb20gPSAxO1xyXG4gICAgX2NhbWVyYS5wb3NpdGlvbi54ID0gZGlzdCpNYXRoLnNxcnQoMik7XHJcbiAgICBfY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcclxuICAgIF9jYW1lcmEucG9zaXRpb24ueiA9IDA7XHJcblxyXG5cclxuICAgIGlmKGJpZ2dlc3RNZGwpXHJcbiAgICAgICAgX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdmlld0ZpbGVCeU1GVDogdmlld0ZpbGVCeU1GVCxcclxuICAgIHZpZXdGaWxlQnlGaWxlSWQ6IHZpZXdGaWxlQnlGaWxlSWQsXHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmNvbnN0IEZpbGVWaWV3ZXIgPSByZXF1aXJlKCcuL2ZpbGV2aWV3ZXInKTtcclxuY29uc3QgRmlsZUdyaWQgPSByZXF1aXJlKCcuL2ZpbGVncmlkJyk7XHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuLyoqXHJcbiAqIFNldHVwIG1haW4gZ3JpZFxyXG4gKi9cclxuZnVuY3Rpb24gbWFpbkdyaWQoKSB7XHJcbiAgICBjb25zdCBwc3R5bGUgPSAnYm9yZGVyOiAxcHggc29saWQgI2RmZGZkZjsgcGFkZGluZzogMDsnO1xyXG4gICAgJCgnI2xheW91dCcpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnbGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogNTcwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArICdtYXJnaW46MCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21haW4nLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArIFwiIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1wiLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnYmFja2dyb3VuZC1jb2xvcjojZWFlYWVhOyBoZWlnaHQ6NDBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLCBpZDogJ2ZpbGVJZFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIEZpbGUgSUQ6JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgICA8aW5wdXQgaWQ9XCJmaWxlSWRJbnB1dFwiLz4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIDxidXR0b24gaWQ9XCJmaWxlSWRJbnB1dEJ0blwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgICAgTG9hZCA8L2J1dHRvbj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsIGlkOiAnY29udGV4dFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIiBpZD1cImNvbnRleHRUb29sYmFyXCI+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lci5jb250ZW50KCdtYWluJywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25SZXNpemU6IFV0aWxzLm9uQ2FudmFzUmVzaXplXHJcbiAgICB9KTtcclxuXHJcbiAgICAkKFwiI2ZpbGVJZElucHV0QnRuXCIpLmNsaWNrKFxyXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgRmlsZVZpZXdlci52aWV3RmlsZUJ5RmlsZUlkKCQoXCIjZmlsZUlkSW5wdXRcIikudmFsKCkpOyB9XHJcbiAgICApXHJcblxyXG5cclxuICAgIC8vLyBHcmlkIGluc2lkZSBtYWluIGxlZnRcclxuICAgICQoKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xlZnRMYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW1xyXG4gICAgICAgICAgICB7IHR5cGU6ICdsZWZ0Jywgc2l6ZTogMTUwLCByZXNpemFibGU6IHRydWUsIHN0eWxlOiBwc3R5bGUsIGNvbnRlbnQ6ICdsZWZ0JyB9LFxyXG4gICAgICAgICAgICB7IHR5cGU6ICdtYWluJywgc2l6ZTogNDIwLCByZXNpemFibGU6IHRydWUsIHN0eWxlOiBwc3R5bGUsIGNvbnRlbnQ6ICdyaWdodCcgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgnbGVmdCcsIHcydWlbJ2xlZnRMYXlvdXQnXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBzaWRlYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyKCl7XHJcbiAgICAvKlxyXG4gICAgICAgIFNJREVCQVJcclxuICAgICovXHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbGVmdCcsICQoKS53MnNpZGViYXIoe1xyXG4gICAgICAgIG5hbWU6ICdzaWRlYmFyJyxcclxuICAgICAgICBpbWc6IG51bGwsXHJcbiAgICAgICAgbm9kZXM6IFtcclxuICAgICAgICAgICAgeyBpZDogJ0FsbCcsIHRleHQ6ICdBbGwnLCBpbWc6ICdpY29uLWZvbGRlcicsIGdyb3VwOiBmYWxzZSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBGaWxlR3JpZC5vbkZpbHRlckNsaWNrXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlYnJvd3NlclxyXG4gKi9cclxuZnVuY3Rpb24gZmlsZUJyb3dzZXIoKXtcclxuICAgIHcydWlbJ2xlZnRMYXlvdXQnXS5jb250ZW50KCdtYWluJywgJCgpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICB7IGZpZWxkOiAncmVjaWQnLCBjYXB0aW9uOiAnTUZUIGluZGV4Jywgc2l6ZTogJzgwcHgnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBzZWFyY2hhYmxlOiAnaW50JyB9LFxyXG4gICAgICAgICAgICB7IGZpZWxkOiAnZmlsZUlkJywgY2FwdGlvbjogJ0ZpbGUgSWQnLCBzaXplOiAnODBweCcsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIHNlYXJjaGFibGU6ICdpbnQnIH0sXHJcbiAgICAgICAgICAgIHsgZmllbGQ6ICdiYXNlSWQnLCBjYXB0aW9uOiAnQmFzZSBJZCcsIHNpemU6ICc4MHB4Jywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgc2VhcmNoYWJsZTogJ2ludCcgfSxcclxuICAgICAgICAgICAgeyBmaWVsZDogJ3R5cGUnLCBjYXB0aW9uOiAnVHlwZScsIHNpemU6ICcxMDAlJywgcmVzaXphYmxlOiB0cnVlLCBzb3J0YWJsZTogdHJ1ZSB9LFxyXG4gICAgICAgICAgICB7IGZpZWxkOiAnZmlsZVNpemUnLCBjYXB0aW9uOiAnU2l6ZScsIHNpemU6ICc4NXB4JywgcmVzaXphYmxlOiB0cnVlLCBzb3J0YWJsZTogdHJ1ZSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5TUZUKGV2ZW50LnJlY2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlIHZpZXcgd2luZG93XHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlVmlldygpIHtcclxuICAgICQodzJ1aVsnbGF5b3V0J10uZWwoJ21haW4nKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxkaXYgaWQ9J2ZpbGVUYWJzJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNSYXcnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdyYXdPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1BhY2snPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdwYWNrT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1RleHR1cmUnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSd0ZXh0dXJlT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1N0cmluZyc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J3N0cmluZ091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgIClcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNNb2RlbCc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J21vZGVsT3V0cHV0Jy8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzU291bmQnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdzb3VuZE91dHB1dCcvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKTtcclxuXHJcblxyXG4gICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICBuYW1lOiAnZmlsZVRhYnMnLFxyXG4gICAgICAgYWN0aXZlOiAndGFiUmF3JyxcclxuICAgICAgIHRhYnM6IFtcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiUmF3JyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1JhdycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1JhdycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYlBGJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1BhY2sgRmlsZScsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1BhY2snKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJUZXh0dXJlJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1RleHR1cmUnLFxyXG4gICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcjZmlsZVRhYnNUZXh0dXJlJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiU3RyaW5nJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1N0cmluZycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1N0cmluZycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYk1vZGVsJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ01vZGVsJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzTW9kZWwnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGNhcHRpb246ICdTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1NvdW5kJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgIF1cclxuICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0dyaWQoKXtcclxuICAgIC8vLyBTZXQgdXAgZ3JpZCBmb3Igc3RyaW5ncyB2aWV3XHJcbiAgICAvLy9DcmVhdGUgZ3JpZFxyXG4gICAgJChcIiNzdHJpbmdPdXRwdXRcIikudzJncmlkKHtcclxuICAgICAgICBuYW1lOiAnc3RyaW5nR3JpZCcsXHJcbiAgICAgICAgc2VsZWN0VHlwZTogJ2NlbGwnLFxyXG4gICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICB7IGZpZWxkOiAncmVjaWQnLCBjYXB0aW9uOiAnUm93ICMnLCBzaXplOiAnNjBweCcgfSxcclxuICAgICAgICAgICAgeyBmaWVsZDogJ3ZhbHVlJywgY2FwdGlvbjogJ1RleHQnLCBzaXplOiAnMTAwJScgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBoYXZlIGEgbGlzdCBvZiB0aGUgZmlsZXMgdG8gb3JnYW5pemUgdGhlIGNhdGVnb3JpZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyTm9kZXMoKXtcclxuXHJcbiAgICB2YXIgcGFja05vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICdwYWNrR3JvdXAnLCB0ZXh0OiAnUGFjayBGaWxlcycsIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICBleHBhbmRlZDogdHJ1ZSwgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy8gQnVpbGQgc2lkZWJhciBub2Rlc1xyXG4gICAgZm9yICh2YXIgZmlsZVR5cGUgaW4gX2ZpbGVMaXN0KSB7XHJcbiAgICAgICAgaWYgKF9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBub2RlID0ge2lkOmZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlIH07XHJcbiAgICAgICAgICAgIHZhciBpc1BhY2sgPSBmYWxzZTtcclxuICAgICAgICAgICAgc3dpdGNoKGZpbGVUeXBlKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIlRleHR1cmVcIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlRleHR1cmVzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIkJpbmFyeVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiQmluYXJpZXNcIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBjYXNlIFwiU3RyaW5nXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FzZSBcIlVua25vd25cIjpcclxuICAgICAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlVua25vd25cIjtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuXHJcbiAgICAgICAgICAgICAgICBkZWZhdWx0OlxyXG4gICAgICAgICAgICAgICAgICAgIGlzUGFjayA9IHRydWU7XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IHtpZDpcIlBGLVwiK2ZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlIH07XHJcbiAgICAgICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gZmlsZVR5cGU7XHJcbiAgICAgICAgICAgICAgICAgICAgLy8vIFBhY2sgZmlsZSFcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgLy8vIE5vdCBhIHBhY2sgZmlsZSBqdXN0IGFkZCB0byByb290IGxpc3RcclxuICAgICAgICAgICAgaWYoIWlzUGFjayl7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1x0XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vLyBQYWNrIGZpbGUgdHlwZXMgZm91bmQhXHJcbiAgICAgICAgICAgIC8vLyBBZGQgc3ViIG5vZGUgZm9yIHRoaXMgcGFjayB0eXBlXHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBwYWNrTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH0gXHJcbiAgICB9XHJcblxyXG4gICAgaWYocGFja05vZGUubm9kZXMubGVuZ3RoPjApe1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQocGFja05vZGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQoKSB7XHJcblxyXG4gICAgbWFpbkdyaWQoKTtcclxuICAgIHNpZGViYXIoKTtcclxuICAgIGZpbGVCcm93c2VyKCk7XHJcbiAgICBmaWxlVmlldygpO1xyXG4gICAgc3RyaW5nR3JpZCgpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgU0VUIFVQIFRSRUUgM0QgU0NFTkVcclxuICAgICovXHJcbiAgICBVdGlscy5zZXR1cFNjZW5lKCk7XHJcblxyXG5cclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3BlbihcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgICAgICB0aXRsZTogJ0xvYWQgQSBHVzIgZGF0JyxcclxuICAgICAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGJvZHk6ICc8ZGl2IGNsYXNzPVwidzJ1aS1jZW50ZXJlZFwiPicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICB9XHJcbiAgICApO1xyXG5cclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIilcclxuICAgICAgICAuY2hhbmdlKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICBfbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5vblJlYWRlckNyZWF0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCJsaWIvdDNkd29ya2VyLmpzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuICAgIFQzRC5Mb2dnZXIubG9nRnVuY3Rpb25zW1QzRC5Mb2dnZXIuVFlQRV9QUk9HUkVTU10gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlIChmaXJzdCB2aXNpdCBvbmx5KTxici8+XCIgK1xyXG4gICAgICAgICAgICBhcmd1bWVudHNbMV0gKyBcIiU8YnIvPjxici8+XCJcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2Rlc1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dCcpO1xyXG5cclxuLy8vIFQzRFxyXG52YXIgX2xyO1xyXG52YXIgX2NvbnRleHQ7XHJcbnZhciBfZmlsZUlkO1xyXG52YXIgX2ZpbGVMaXN0O1xyXG52YXIgX2F1ZGlvU291cmNlO1xyXG52YXIgX2F1ZGlvQ29udGV4dDtcclxuXHJcbi8vLyBUSFJFRVxyXG52YXIgX3NjZW5lO1xyXG52YXIgX2NhbWVyYTtcclxudmFyIF9yZW5kZXJlcjtcclxudmFyIF9tb2RlbHMgPSBbXTtcclxudmFyIF9jb250cm9scztcclxuXHJcbkxheW91dC5pbml0TGF5b3V0KCk7IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL2xheW91dCcpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKXtcclxuXHJcbiAgICAvLy8gR2V0IGxhc3QgbG9hZGVkIGZpbGVJZFx0XHRcclxuICAgIHZhciBmaWxlSWQgPSBfZmlsZUlkO1xyXG5cclxuICAgIC8vLyBSdW4gVDNEIGhhY2tlZCB2ZXJzaW9uIG9mIE9CSkV4cG9ydGVyXHJcbiAgICB2YXIgcmVzdWx0ID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKCkucGFyc2UoIF9zY2VuZSwgZmlsZUlkKTtcclxuXHJcbiAgICAvLy8gUmVzdWx0IGxpc3RzIHdoYXQgZmlsZSBpZHMgYXJlIHVzZWQgZm9yIHRleHR1cmVzLlxyXG4gICAgdmFyIHRleElkcyA9IHJlc3VsdC50ZXh0dXJlSWRzO1xyXG5cclxuICAgIC8vLyBTZXQgdXAgdmVyeSBiYXNpYyBtYXRlcmlhbCBmaWxlIHJlZmVyaW5nIHRoZSB0ZXh0dXJlIHBuZ3NcclxuICAgIC8vLyBwbmdzIGFyZSBnZW5lcmF0ZWQgYSBmZXcgbGluZXMgZG93bi5cclxuICAgIHZhciBtdGxTb3VyY2UgPVwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbih0ZXhJZCl7XHJcbiAgICAgICAgbXRsU291cmNlICs9XCJuZXdtdGwgdGV4X1wiK3RleElkK1wiXFxuXCIrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiICBtYXBfS2EgdGV4X1wiK3RleElkK1wiLnBuZ1xcblwiK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIit0ZXhJZCtcIi5wbmdcXG5cXG5cIjtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBvYmpcclxuICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jlc3VsdC5vYmpdLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYixcImV4cG9ydC5cIitmaWxlSWQrXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsXCJleHBvcnQuXCIrZmlsZUlkK1wiLm10bFwiKTtcclxuICAgIFxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24odGV4SWQpe1xyXG5cclxuICAgICAgICAvLy8gTG9jYWxSZWFkZXIgd2lsbCBoYXZlIHRvIHJlLWxvYWQgdGhlIHRleHR1cmVzLCBkb24ndCB3YW50IHRvIGZldGNoXHJcbiAgICAgICAgLy8vIHRoZW4gZnJvbSB0aGUgbW9kZWwgZGF0YS4uXHJcbiAgICAgICAgX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24oaW5mbGF0ZWREYXRhLCBkeHRUeXBlLCBpbWFnZVdpZHRoLCBpbWFnZUhlaWd0aCl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUganMgaW1hZ2UgdXNpbmcgcmV0dXJuZWQgYml0bWFwIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSAgIDogbmV3IFVpbnQ4QXJyYXkoaW5mbGF0ZWREYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGltYWdlSGVpZ3RoXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBOZWVkIGEgY2FudmFzIGluIG9yZGVyIHRvIGRyYXdcclxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcyAvPlwiKTtcclxuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChjYW52YXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9ICBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSAgaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcdFx0ICAgICAgICBcdFxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwwLDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgb3V0cHV0IGltYWdlIGRhdGEgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gY3R4LmNyZWF0ZUltYWdlRGF0YShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCwgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLy8gTG9vcCBwaXhlbHNcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSAxOyB5IDwgaC0xOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHctMTsgeCArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSp3ICsgeCkqNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoIChoLXkpKncgKyB4KSo0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaStjXSA9IGlucHV0RGF0YVtmbGlwK2NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihwbmdCbG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVEYXRhKCBwbmdCbG9iLCBcInRleF9cIit0ZXhJZCtcIi5wbmdcIiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkgeyAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuXHJcblxyXG4vLy8gU2V0dGluZyB1cCBhIHNjZW5lLCBUcmVlLmpzIHN0YW5kYXJkIHN0dWZmLi4uXHJcbmZ1bmN0aW9uIHNldHVwU2NlbmUoKXtcclxuXHJcbiAgICB2YXIgY2FudmFzV2lkdGggPSAkKFwiI21vZGVsT3V0cHV0XCIpLndpZHRoKCk7XHJcbiAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuICAgIHZhciBjYW52YXNDbGVhckNvbG9yID0gMHgzNDI5MjA7IC8vIEZvciBoYXBweSByZW5kZXJpbmcsIGFsd2F5cyB1c2UgVmFuIER5a2UgQnJvd24uXHJcbiAgICB2YXIgZm92ID0gNjA7XHJcbiAgICB2YXIgYXNwZWN0ID0gMTtcclxuICAgIHZhciBuZWFyID0gMC4xO1xyXG4gICAgdmFyIGZhciA9IDUwMDAwMDtcclxuXHJcbiAgICBfY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xyXG5cclxuICAgIF9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xyXG4gICAgdmFyIGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4NTU1NTU1ICk7XHJcbiAgICBfc2NlbmUuYWRkKCBhbWJpZW50TGlnaHQgKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIC44ICk7XHJcbiAgICBkaXJlY3Rpb25hbExpZ2h0MS5wb3NpdGlvbi5zZXQoIDAsIDAsIDEgKTtcclxuICAgIF9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQxICk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQyID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAuOCk7XHJcbiAgICBkaXJlY3Rpb25hbExpZ2h0Mi5wb3NpdGlvbi5zZXQoIDEsIDAsIDAgKTtcclxuICAgIF9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQyICk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAuOCApO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KCAwLCAxLCAwICk7XHJcbiAgICBfc2NlbmUuYWRkKCBkaXJlY3Rpb25hbExpZ2h0MyApO1xyXG4gICAgXHJcbiAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxyXG4gICAgX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe2FudGlhbGlhc2luZzogdHJ1ZX0pO1xyXG4gICAgJChcIiNtb2RlbE91dHB1dFwiKVswXS5hcHBlbmRDaGlsZChfcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICBcclxuICAgIF9yZW5kZXJlci5zZXRTaXplKCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0ICk7XHJcbiAgICBfcmVuZGVyZXIuc2V0Q2xlYXJDb2xvciggY2FudmFzQ2xlYXJDb2xvciApO1xyXG5cclxuICAgIC8vLyBBZGQgVEhSRUUgb3JiaXQgY29udHJvbHMsIGZvciBzaW1wbGUgb3JiaXRpbmcsIHBhbm5pbmcgYW5kIHpvb21pbmdcclxuICAgIF9jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKCBfY2FtZXJhLCBfcmVuZGVyZXIuZG9tRWxlbWVudCApO1xyXG4gICAgX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlOyAgICAgXHJcblxyXG4gICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cclxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKXtzZXRUaW1lb3V0KG9uQ2FudmFzUmVzaXplLDEwKX0pO1xyXG5cclxuICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIG9uQ2FudmFzUmVzaXplKCl7XHJcbiAgICBcclxuICAgIHZhciBzY2VuZVdpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIHNjZW5lSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuXHJcbiAgICBpZighc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIF9jYW1lcmEuYXNwZWN0ID0gc2NlbmVXaWR0aCAvIHNjZW5lSGVpZ2h0O1xyXG5cclxuICAgIF9yZW5kZXJlci5zZXRTaXplKHNjZW5lV2lkdGgsIHNjZW5lSGVpZ2h0KTtcclxuXHJcbiAgICBfY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25SZWFkZXJDcmVhdGVkKCl7XHJcblxyXG4gICAgVDNELmdldEZpbGVMaXN0QXN5bmMoX2xyLFxyXG4gICAgICAgIGZ1bmN0aW9uKGZpbGVzKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTdG9yZSBmaWxlTGlzdCBnbG9iYWxseVxyXG4gICAgICAgICAgICBfZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgICAgIExheW91dC5zaWRlYmFyTm9kZXMoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBDbG9zZSB0aGUgcG9wXHJcbiAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTZWxlY3QgdGhlIFwiQWxsXCIgY2F0ZWdvcnlcclxuICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmNsaWNrKFwiQWxsXCIpO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgcmVhZEZpbGVMaXN0QXN5bmMgY2FsbGJhY2tcclxuICAgICk7XHJcbiAgICBcclxufVxyXG5cclxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cclxuZnVuY3Rpb24gcmVuZGVyKCl7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCByZW5kZXIgKTtcclxuICAgIF9yZW5kZXJlci5yZW5kZXIoX3NjZW5lLCBfY2FtZXJhKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBleHBvcnRTY2VuZTogZXhwb3J0U2NlbmUsXHJcbiAgICBzYXZlRGF0YTogc2F2ZURhdGEsXHJcbiAgICBzZXR1cFNjZW5lOiBzZXR1cFNjZW5lLFxyXG4gICAgb25DYW52YXNSZXNpemU6IG9uQ2FudmFzUmVzaXplLFxyXG4gICAgb25SZWFkZXJDcmVhdGVkOiBvblJlYWRlckNyZWF0ZWQsXHJcbiAgICByZW5kZXI6IHJlbmRlclxyXG59Il19
