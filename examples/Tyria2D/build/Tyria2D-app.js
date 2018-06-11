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

var Globals = require('./globals');

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

    let reverseTable = Globals._lr.getReverseIndex();

    for (var fileType in Globals._fileList) {

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

        if (Globals._fileList.hasOwnProperty(fileType)) {

            var fileArr = Globals._fileList[fileType];
            fileArr.forEach(
                function(mftIndex){

                    let meta = Globals._lr.getFileMeta(mftIndex);

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
},{"./globals":3}],2:[function(require,module,exports){
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

var Globals = require('./globals');
var Utils = require('./utils');

function viewFileByMFT(mftIdx){
    let reverseTable = Globals._lr.getReverseIndex();
    
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
    if(Globals._models){
        Globals._models.forEach(function(mdl){
            Globals._scene.remove(mdl);
        });	
    }

    /// Make sure _context is clean
    Globals._context = {};

    /// Run the basic DataRenderer, handles all sorts of files for us.
    T3D.runRenderer(
        T3D.DataRenderer,
        Globals._lr,
        {id:fileId},
        Globals._context,
        onBasicRendererDone
    );
}

function onBasicRendererDone(){

    /// Read render output from _context VO
    var fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

    var rawData = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");

    var raw = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawString");

    var packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");

    var image = T3D.getContextValue(Globals._context, T3D.DataRenderer, "image");


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
                Utils.saveData(blob,fileName+".raw");
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
                    Utils.saveData(blob,fileName+".mp3");
                })
            )
            .append(
                $("<button>Play MP3</button>")
                .click(function(){

                    if(!Globals._audioContext){
                        Globals._audioContext = new AudioContext();
                    }

                    /// Stop previous sound
                    try{
                        Globals._audioSource.stop();	
                    }catch(e){}

                    /// Create new buffer for current sound
                    Globals._audioSource = Globals._audioContext.createBufferSource();
                    Globals._audioSource.connect( Globals._audioContext.destination );

                    /// Decode and start playing
                    Globals._audioContext.decodeAudioData( soundUintArray.buffer, function( res ) {
                        Globals._audioSource.buffer = res;							
                        Globals._audioSource.start();
                    } );
                })
            )
            .append(
                $("<button>Stop MP3</button>")
                .click(
                    function(){
                        try{
                            Globals._audioSource.stop();	
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

    var fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");
    var packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");

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
    Globals._context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.StringRenderer,
        Globals._lr,
        {id:fileId},
        Globals._context,
        onRendererDoneString
    );
}	

function onRendererDoneString(){

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



function renderFileModel(fileId){

    /// Make sure output is clean
    Globals._context = {};

    /// Run single renderer
    T3D.runRenderer(
        T3D.SingleModelRenderer,
        Globals._lr,
        {id:fileId},
        Globals._context,
        onRendererDoneModel
    );
}	

function onRendererDoneModel(){

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
    Globals._models.forEach(function(model){

        /// Find the biggest model for camera focus/fitting
        if(!biggestMdl || biggestMdl.boundingSphere.radius < model.boundingSphere.radius){
            biggestMdl = model;
        }

        Globals._scene.add(model);
    });

    /// Reset any zoom and transaltion/rotation done when viewing earlier models.
    Globals._controls.reset();

    /// Focus camera to the bigest model, doesn't work great.
    var dist = (biggestMdl && biggestMdl.boundingSphere) ? biggestMdl.boundingSphere.radius / Math.tan(Math.PI * 60 / 360) : 100;
    dist = 1.2 * Math.max(100,dist);
    dist = Math.min(1000, dist);
    Globals._camera.position.zoom = 1;
    Globals._camera.position.x = dist*Math.sqrt(2);
    Globals._camera.position.y = 50;
    Globals._camera.position.z = 0;


    if(biggestMdl)
        Globals._camera.lookAt(biggestMdl.position);
}

module.exports = {
    viewFileByMFT: viewFileByMFT,
    viewFileByFileId: viewFileByFileId,
}
},{"./globals":3,"./utils":6}],3:[function(require,module,exports){
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

//Setting up the global variables for the app

module.exports = {
    /// T3D
    _lr: undefined,
    _context: undefined,
    _fileId: undefined,
    _fileList: undefined,
    _audioSource: undefined,
    _audioContext: undefined,

    /// THREE
    _scene: undefined,
    _camera: undefined,
    _renderer: undefined,
    _models: [],
    _controls: undefined,

}
},{}],4:[function(require,module,exports){
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

var Globals = require('./globals');

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
    for (var fileType in Globals._fileList) {
        if (Globals._fileList.hasOwnProperty(fileType)) {

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
function initLayout(onReaderCreated) {

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
                Globals._lr = T3D.getLocalReader(
                    evt.target.files[0],
                    onReaderCreated,
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
},{"./filegrid":1,"./fileviewer":2,"./globals":3,"./utils":6}],5:[function(require,module,exports){
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

/// Requires:
const Layout = require('./layout');
var Globals = require('./globals');


function onReaderCreated(){

    T3D.getFileListAsync(Globals._lr,
        function(files){

            /// Store fileList globally
            Globals._fileList = files;

            Layout.sidebarNodes();

            /// Close the pop
            w2popup.close();

            /// Select the "All" category
            w2ui.sidebar.click("All");

        } /// End readFileListAsync callback
    );
    
}

Layout.initLayout(onReaderCreated);
},{"./globals":3,"./layout":4}],6:[function(require,module,exports){
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

var Globals = require('./globals');

/// Exports current model as an .obj file with a .mtl refering .png textures.
function exportScene(){

    /// Get last loaded fileId		
    var fileId = Globals._fileId;

    /// Run T3D hacked version of OBJExporter
    var result = new THREE.OBJExporter().parse( Globals._scene, fileId);

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
        Globals._lr.loadTextureFile(texId,
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

    Globals._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);

    Globals._scene = new THREE.Scene();

    /// This scene has one ambient light source and three directional lights
    var ambientLight = new THREE.AmbientLight( 0x555555 );
    Globals._scene.add( ambientLight );

    var directionalLight1 = new THREE.DirectionalLight( 0xffffff, .8 );
    directionalLight1.position.set( 0, 0, 1 );
    Globals._scene.add( directionalLight1 );

    var directionalLight2 = new THREE.DirectionalLight( 0xffffff, .8);
    directionalLight2.position.set( 1, 0, 0 );
    Globals._scene.add( directionalLight2 );

    var directionalLight3 = new THREE.DirectionalLight( 0xffffff, .8 );
    directionalLight3.position.set( 0, 1, 0 );
    Globals._scene.add( directionalLight3 );
    
    /// Standard THREE renderer with AA
    Globals._renderer = new THREE.WebGLRenderer({antialiasing: true});
    $("#modelOutput")[0].appendChild(Globals._renderer.domElement);
    
    Globals._renderer.setSize( canvasWidth, canvasHeight );
    Globals._renderer.setClearColor( canvasClearColor );

    /// Add THREE orbit controls, for simple orbiting, panning and zooming
    Globals._controls = new THREE.OrbitControls( Globals._camera, Globals._renderer.domElement );
    Globals._controls.enableZoom = true;     

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

    Globals._camera.aspect = sceneWidth / sceneHeight;

    Globals._renderer.setSize(sceneWidth, sceneHeight);

    Globals._camera.updateProjectionMatrix();
}

/// Render loop, no game logic, just rendering.
function render(){
    window.requestAnimationFrame( render );
    Globals._renderer.render(Globals._scene, Globals._camera);
}

module.exports = {
    exportScene: exportScene,
    saveData: saveData,
    setupScene: setupScene,
    onCanvasResize: onCanvasResize,
    render: render
}
},{"./globals":3}]},{},[5])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9maWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL2ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9nbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvbGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvbWFpbi5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuWUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9DQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vZ2xvYmFscycpO1xyXG5cclxuZnVuY3Rpb24gb25GaWx0ZXJDbGljayhldnQpIHtcclxuICAgIFxyXG4gICAgLy8vIE5vIGZpbHRlciBpZiBjbGlja2VkIGdyb3VwIHdhcyBcIkFsbFwiXHJcbiAgICBpZihldnQudGFyZ2V0PT1cIkFsbFwiKXtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2V7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cChbZXZ0LnRhcmdldF0pO1x0XHJcbiAgICB9XHJcbiAgICBcclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVHcm91cChmaWxlVHlwZUZpbHRlcil7XHJcblxyXG4gICAgdzJ1aS5ncmlkLnJlY29yZHMgPSBbXTtcclxuXHJcbiAgICBsZXQgcmV2ZXJzZVRhYmxlID0gR2xvYmFscy5fbHIuZ2V0UmV2ZXJzZUluZGV4KCk7XHJcblxyXG4gICAgZm9yICh2YXIgZmlsZVR5cGUgaW4gR2xvYmFscy5fZmlsZUxpc3QpIHtcclxuXHJcbiAgICAgICAgLy8vIE9ubHkgc2hvdyB0eXBlcyB3ZSd2ZSBhc2tlZCBmb3JcclxuICAgICAgICBpZihmaWxlVHlwZUZpbHRlciAmJiBmaWxlVHlwZUZpbHRlci5pbmRleE9mKGZpbGVUeXBlKSA8IDApe1xyXG5cclxuICAgICAgICAgICAgLy8vIFNwZWNpYWwgY2FzZSBmb3IgXCJwYWNrR3JvdXBcIlxyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIGxldCB0cm91Z2ggYWxsIHBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBOT1QgbGV0IHRyb3VnaHQgYW55IG5vbi1wYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBpLmUuIFN0cmluZ3MsIEJpbmFyaWVzIGV0Y1xyXG4gICAgICAgICAgICBpZihmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwicGFja0dyb3VwXCIpPj0wKXtcclxuICAgICAgICAgICAgICAgIGlmKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2UgaWYoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInRleHR1cmVHcm91cFwiKT49MCl7XHJcbiAgICAgICAgICAgICAgICBpZighZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpe1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcdFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIFxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGVBcnIgPSBHbG9iYWxzLl9maWxlTGlzdFtmaWxlVHlwZV07XHJcbiAgICAgICAgICAgIGZpbGVBcnIuZm9yRWFjaChcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uKG1mdEluZGV4KXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ldGEgPSBHbG9iYWxzLl9sci5nZXRGaWxlTWV0YShtZnRJbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlSWRzID0gcmV2ZXJzZVRhYmxlW21mdEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVNpemUgPSAgKG1ldGEpID8gbWV0YS5zaXplOiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZihmaWxlU2l6ZT4wICYmIG1mdEluZGV4ID4gMTUpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJ1aVsnZ3JpZCddLnJlY29yZHMucHVzaCh7IFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjaWQgOiBtZnRJbmRleCwgLy8vIE1GVCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZUlkczogYmFzZUlkcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGUgOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplIDogZmlsZVNpemVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHRcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZnRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfS8vLyBFbmQgZm9yIGVhY2ggbWZ0IGluIHRoaXMgZmlsZSB0eXBlXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIH0gLy8vIEVuZCBpZiBfZmlsZUxpc3RbZmlsZXR5cGVdXHJcblxyXG4gICAgfSAvLy8gRW5kIGZvciBlYWNoIGZpbGVUeXBlIGtleSBpbiBfZmlsZUxpc3Qgb2JqZWN0XHJcblxyXG4gICAgLy8vIFVwZGF0ZSBmaWxlIGdyaWRcclxuICAgIHcydWkuZ3JpZC5idWZmZXJlZCA9IHcydWkuZ3JpZC5yZWNvcmRzLmxlbmd0aDtcclxuICAgIHcydWkuZ3JpZC50b3RhbCA9IHcydWkuZ3JpZC5idWZmZXJlZDtcclxuICAgIHcydWkuZ3JpZC5yZWZyZXNoKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb25GaWx0ZXJDbGljazogb25GaWx0ZXJDbGljayxcclxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL2dsb2JhbHMnKTtcclxudmFyIFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxuZnVuY3Rpb24gdmlld0ZpbGVCeU1GVChtZnRJZHgpe1xyXG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IEdsb2JhbHMuX2xyLmdldFJldmVyc2VJbmRleCgpO1xyXG4gICAgXHJcbiAgICB2YXIgYmFzZUlkID0gKHJldmVyc2VUYWJsZVttZnRJZHhdKSA/IHJldmVyc2VUYWJsZVttZnRJZHhdWzBdIDogXCJcIjtcclxuXHJcbiAgICB2aWV3RmlsZUJ5RmlsZUlkKGJhc2VJZCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHZpZXdGaWxlQnlGaWxlSWQoZmlsZUlkKXtcclxuXHJcbiAgICAvLy8gQ2xlYW4gb3V0cHV0c1xyXG4gICAgJChcIi50YWJPdXRwdXRcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjZmlsZVRpdGxlXCIpLmh0bWwoXCJcIik7XHJcblxyXG4gICAgLy8vIENsZWFuIGNvbnRleHQgdG9vbGJhclxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5odG1sKFwiXCIpO1xyXG5cclxuICAgIC8vLyBEaXNhYmxlIHRhYnNcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiUmF3Jyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlBGJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlRleHR1cmUnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiU3RyaW5nJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYk1vZGVsJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlNvdW5kJyk7XHJcblxyXG4gICAgLy8vIFJlbW92ZSBvbGQgbW9kZWxzIGZyb20gdGhlIHNjZW5lXHJcbiAgICBpZihHbG9iYWxzLl9tb2RlbHMpe1xyXG4gICAgICAgIEdsb2JhbHMuX21vZGVscy5mb3JFYWNoKGZ1bmN0aW9uKG1kbCl7XHJcbiAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLnJlbW92ZShtZGwpO1xyXG4gICAgICAgIH0pO1x0XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE1ha2Ugc3VyZSBfY29udGV4dCBpcyBjbGVhblxyXG4gICAgR2xvYmFscy5fY29udGV4dCA9IHt9O1xyXG5cclxuICAgIC8vLyBSdW4gdGhlIGJhc2ljIERhdGFSZW5kZXJlciwgaGFuZGxlcyBhbGwgc29ydHMgb2YgZmlsZXMgZm9yIHVzLlxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5EYXRhUmVuZGVyZXIsXHJcbiAgICAgICAgR2xvYmFscy5fbHIsXHJcbiAgICAgICAge2lkOmZpbGVJZH0sXHJcbiAgICAgICAgR2xvYmFscy5fY29udGV4dCxcclxuICAgICAgICBvbkJhc2ljUmVuZGVyZXJEb25lXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvbkJhc2ljUmVuZGVyZXJEb25lKCl7XHJcblxyXG4gICAgLy8vIFJlYWQgcmVuZGVyIG91dHB1dCBmcm9tIF9jb250ZXh0IFZPXHJcbiAgICB2YXIgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcclxuXHJcbiAgICB2YXIgcmF3RGF0YSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdEYXRhXCIpO1xyXG5cclxuICAgIHZhciByYXcgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3U3RyaW5nXCIpO1xyXG5cclxuICAgIHZhciBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xyXG5cclxuICAgIHZhciBpbWFnZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJpbWFnZVwiKTtcclxuXHJcblxyXG4gICAgdmFyIGZjYyA9IHJhdy5zdWJzdHJpbmcoMCw0KTtcclxuXHJcbiAgICAvLy8gVXBkYXRlIG1haW4gaGVhZGVyIHRvIHNob3cgZmlsZW5hbWVcclxuICAgIFxyXG4gICAgdmFyIGZpbGVOYW1lID0gZmlsZUlkICsgKGltYWdlIHx8ICFwYWNrZmlsZSA/IFwiLlwiK2ZjYyA6IFwiLlwiK3BhY2tmaWxlLmhlYWRlci50eXBlICk7XHJcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKGZpbGVOYW1lKTtcclxuXHJcbiAgICAvLy8gVXBkYXRlIHJhdyB2aWV3IGFuZCBlbmFibGUgdGFiXHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiUmF3Jyk7XHJcbiAgICBcclxuXHJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXHJcbiAgICAuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIHJhdzwvYnV0dG9uPlwiKVxyXG4gICAgICAgIC5jbGljayhcclxuICAgICAgICAgICAgZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jhd0RhdGFdLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgICAgICAgICAgICAgVXRpbHMuc2F2ZURhdGEoYmxvYixmaWxlTmFtZStcIi5yYXdcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApXHJcbiAgICApXHJcblxyXG4gICAgJChcIiNyYXdPdXRwdXRcIilcclxuICAgIC5hcHBlbmQoXHJcbiAgICAgICAgJChcIjxkaXY+XCIpLnRleHQoIHJhdyApXHJcbiAgICApXHJcbiAgICBcclxuXHJcbiAgICAvLy8gVGV4dHVyZSBmaWxlXHJcbiAgICBpZihpbWFnZSl7XHJcblxyXG4gICAgICAgIC8vLyBTZWxlY3QgdGV4dHVyZSB0YWJcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiVGV4dHVyZScpO1xyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlRleHR1cmUnKTtcclxuXHJcbiAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xyXG4gICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcz5cIik7XHJcbiAgICAgICAgY2FudmFzWzBdLndpZHRoID0gIGltYWdlLndpZHRoO1xyXG4gICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSAgaW1hZ2UuaGVpZ2h0O1xyXG4gICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG4gICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xyXG4gICAgICAgIHZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VkYXRhLDAsMCk7XHJcblxyXG4gICAgICAgICQoXCIjdGV4dHVyZU91dHB1dFwiKS5hcHBlbmQoY2FudmFzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLy8gUEYgUGFjayBmaWxlXHJcbiAgICBlbHNlIGlmKHBhY2tmaWxlKXsgXHRcclxuXHJcbiAgICAgICAgLy8vIEFsd2F5cyByZW5kZXIgdGhlIHBhY2sgZmlsZSBjaHVuayBkYXRhXHJcbiAgICAgICAgZGlzcGxheVBhY2tGaWxlKCk7XHJcblxyXG4gICAgICAgIC8vLyBFbmFibGUgY29ycmVzcG9uZGluZyB0YWJcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiUEYnKTtcclxuXHJcbiAgICAgICAgLy8vIElmIHRoZSBwYWNrIGZpbGUgd2FzIGEgbW9kZWwsIHJlbmRlciBpdCFcclxuICAgICAgICBpZihwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSBcIk1PRExcIil7XHJcblxyXG4gICAgICAgICAgICAvLy8gUmVuZGVyIG1vZGVsXHJcbiAgICAgICAgICAgIHJlbmRlckZpbGVNb2RlbChmaWxlSWQpO1x0ICAgICAgICBcdFxyXG4gICAgICAgIH1cclxuICAgICAgICBlbHNlIGlmKHBhY2tmaWxlLmhlYWRlci50eXBlID09IFwiQVNORFwiKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBHZXQgYSBjaHVuaywgdGhpcyBpcyByZWFsbHkgdGhlIGpvYiBvZiBhIHJlbmRlcmVyIGJ1dCB3aGF0ZXZzXHJcbiAgICAgICAgICAgIHZhciBjaHVuayA9cGFja2ZpbGUuZ2V0Q2h1bmsoXCJBU05EXCIpO1xyXG5cclxuICAgICAgICAgICAgLy8vIEVuYWJsZSBhbmQgc2VsZWN0IHNvdW5kIHRhYlxyXG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiU291bmQnKTtcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiU291bmQnKTtcclxuXHJcblxyXG4gICAgICAgICAgICAvLy8gUHJpbnQgc29tZSByYW5kb20gZGF0YSBhYm91dCB0aGlzIHNvdW5kXHJcbiAgICAgICAgICAgICQoXCIjc291bmRPdXRwdXRcIilcclxuICAgICAgICAgICAgLmh0bWwoXHJcbiAgICAgICAgICAgICAgICBcIkxlbmd0aDogXCIrY2h1bmsuZGF0YS5sZW5ndGgrXCIgc2Vjb25kczxici8+XCIrXHJcbiAgICAgICAgICAgICAgICBcIlNpemU6IFwiK2NodW5rLmRhdGEuYXVkaW9EYXRhLmxlbmd0aCtcIiBieXRlc1wiXHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgLy8vIEV4dHJhY3Qgc291bmQgZGF0YVxyXG4gICAgICAgICAgICBcclxuICAgICAgICAgICAgdmFyIHNvdW5kVWludEFycmF5ID0gY2h1bmsuZGF0YS5hdWRpb0RhdGE7XHJcblxyXG4gICAgICAgICAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXHJcbiAgICAgICAgICAgIC5zaG93KClcclxuICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIE1QMzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsZmlsZU5hbWUrXCIubXAzXCIpO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChcIjxidXR0b24+UGxheSBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbigpe1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZighR2xvYmFscy5fYXVkaW9Db250ZXh0KXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8vIFN0b3AgcHJldmlvdXMgc291bmRcclxuICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcdFxyXG4gICAgICAgICAgICAgICAgICAgIH1jYXRjaChlKXt9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgbmV3IGJ1ZmZlciBmb3IgY3VycmVudCBzb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlID0gR2xvYmFscy5fYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLmNvbm5lY3QoIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbiApO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLy8gRGVjb2RlIGFuZCBzdGFydCBwbGF5aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YSggc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiggcmVzICkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5idWZmZXIgPSByZXM7XHRcdFx0XHRcdFx0XHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RhcnQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9ICk7XHJcbiAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5TdG9wIE1QMzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAgICAgLmNsaWNrKFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeXtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcdFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7fVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIClcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZXtcclxuICAgICAgICAgICAgLy8vIFNlbGVjdCBQRiB0YWJcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiUEYnKTtcclxuICAgICAgICB9XHRcclxuICAgIH1cclxuXHJcbiAgICBlbHNlIGlmKGZjYyA9PSBcInN0cnNcIil7XHJcblxyXG4gICAgICAgIHNob3dGaWxlU3RyaW5nKGZpbGVJZCk7XHJcbiAgICAgICAgXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEVsc2UganVzdCBzaG93IHJhdyB2aWV3XHJcbiAgICBlbHNle1xyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlJhdycpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBkaXNwbGF5UGFja0ZpbGUoKXtcclxuXHJcbiAgICB2YXIgZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcclxuICAgIHZhciBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xyXG5cclxuICAgICQoXCIjcGFja091dHB1dFwiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNwYWNrT3V0cHV0XCIpLmFwcGVuZCgkKFwiPGgyPkNodW5rczwvaDI+XCIpKTtcclxuXHJcbiAgICBwYWNrZmlsZS5jaHVua3MuZm9yRWFjaChmdW5jdGlvbihjaHVuayl7XHJcblxyXG4gICAgICAgIHZhciBmaWVsZCA9ICQoXCI8ZmllbGRzZXQgLz5cIik7XHJcbiAgICAgICAgdmFyIGxlZ2VuZCA9ICQoXCI8bGVnZW5kPlwiK2NodW5rLmhlYWRlci50eXBlK1wiPC9sZWdlbmQ+XCIpO1xyXG5cclxuICAgICAgICB2YXIgbG9nQnV0dG9uID0gJChcIjxidXR0b24+TG9nIENodW5rIERhdGEgdG8gQ29uc29sZTwvYnV0dG9uPlwiKTtcclxuICAgICAgICBsb2dCdXR0b24uY2xpY2soZnVuY3Rpb24oKXtcclxuICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIFwiTG9nZ2luZ1wiLGNodW5rLmhlYWRlci50eXBlLCBcImNodW5rXCIpO1xyXG4gICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgY2h1bmsuZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZpZWxkLmFwcGVuZChsZWdlbmQpO1xyXG4gICAgICAgIGZpZWxkLmFwcGVuZCgkKFwiPHA+U2l6ZTpcIitjaHVuay5oZWFkZXIuY2h1bmtEYXRhU2l6ZStcIjwvcD5cIikpO1xyXG4gICAgICAgIGZpZWxkLmFwcGVuZChsb2dCdXR0b24pO1xyXG5cclxuICAgICAgICAkKFwiI3BhY2tPdXRwdXRcIikuYXBwZW5kKGZpZWxkKTtcclxuICAgICAgICAkKFwiI3BhY2tPdXRwdXRcIikuc2hvdygpO1xyXG4gICAgfSk7ICAgICAgICBcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlU3RyaW5nKGZpbGVJZCl7XHJcblxyXG4gICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cclxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcclxuICAgICAgICBHbG9iYWxzLl9scixcclxuICAgICAgICB7aWQ6ZmlsZUlkfSxcclxuICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxyXG4gICAgICAgIG9uUmVuZGVyZXJEb25lU3RyaW5nXHJcbiAgICApO1xyXG59XHRcclxuXHJcbmZ1bmN0aW9uIG9uUmVuZGVyZXJEb25lU3RyaW5nKCl7XHJcblxyXG4gICAgLy8vIFJlYWQgZGF0YSBmcm9tIHJlbmRlcmVyXHJcbiAgICB2YXIgc3RyaW5ncyA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELlN0cmluZ1JlbmRlcmVyLCBcInN0cmluZ3NcIiwgW10pO1xyXG5cclxuICAgIHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzID0gc3RyaW5ncztcclxuXHJcbiAgICBcclxuXHJcbiAgICB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQgPSB3MnVpLnN0cmluZ0dyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLnN0cmluZ0dyaWQudG90YWwgPSB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLnN0cmluZ0dyaWQucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vLyBTZWxlY3QgdGhpcyB2aWV3XHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiU3RyaW5nJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJTdHJpbmcnKTtcclxufVxyXG5cclxuXHJcblxyXG5mdW5jdGlvbiByZW5kZXJGaWxlTW9kZWwoZmlsZUlkKXtcclxuXHJcbiAgICAvLy8gTWFrZSBzdXJlIG91dHB1dCBpcyBjbGVhblxyXG4gICAgR2xvYmFscy5fY29udGV4dCA9IHt9O1xyXG5cclxuICAgIC8vLyBSdW4gc2luZ2xlIHJlbmRlcmVyXHJcbiAgICBUM0QucnVuUmVuZGVyZXIoXHJcbiAgICAgICAgVDNELlNpbmdsZU1vZGVsUmVuZGVyZXIsXHJcbiAgICAgICAgR2xvYmFscy5fbHIsXHJcbiAgICAgICAge2lkOmZpbGVJZH0sXHJcbiAgICAgICAgR2xvYmFscy5fY29udGV4dCxcclxuICAgICAgICBvblJlbmRlcmVyRG9uZU1vZGVsXHJcbiAgICApO1xyXG59XHRcclxuXHJcbmZ1bmN0aW9uIG9uUmVuZGVyZXJEb25lTW9kZWwoKXtcclxuXHJcbiAgICAvLy8gRW5hYmxlIGFuZCBzZWxlY3QgbW9kZWwgdGFiXHJcbiAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiTW9kZWwnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYk1vZGVsJyk7XHJcbiAgICAkKFwiI21vZGVsT3V0cHV0XCIpLnNob3coKTtcclxuXHJcbiAgICAvLy8gUmUtZml0IGNhbnZhc1xyXG4gICAgVXRpbHMub25DYW52YXNSZXNpemUoKTtcclxuXHJcbiAgICAvLy8gQWRkIGNvbnRleHQgdG9vbGJhciBleHBvcnQgYnV0dG9uXHJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmFwcGVuZChcclxuICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcclxuICAgICAgICAuY2xpY2soVXRpbHMuZXhwb3J0U2NlbmUpXHJcbiAgICApO1xyXG4gICAgXHJcbiAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xyXG4gICAgR2xvYmFscy5fbW9kZWxzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlciwgXCJtZXNoZXNcIiwgW10pO1xyXG5cclxuICAgIC8vLyBLZWVwaW5nIHRyYWNrIG9mIHRoZSBiaWdnZXN0IG1vZGVsIGZvciBsYXRlclxyXG4gICAgdmFyIGJpZ2dlc3RNZGwgPSBudWxsO1xyXG5cclxuICAgIC8vLyBBZGQgYWxsIG1vZGVscyB0byB0aGUgc2NlbmVcclxuICAgIEdsb2JhbHMuX21vZGVscy5mb3JFYWNoKGZ1bmN0aW9uKG1vZGVsKXtcclxuXHJcbiAgICAgICAgLy8vIEZpbmQgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGNhbWVyYSBmb2N1cy9maXR0aW5nXHJcbiAgICAgICAgaWYoIWJpZ2dlc3RNZGwgfHwgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgPCBtb2RlbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMpe1xyXG4gICAgICAgICAgICBiaWdnZXN0TWRsID0gbW9kZWw7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQobW9kZWwpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIFJlc2V0IGFueSB6b29tIGFuZCB0cmFuc2FsdGlvbi9yb3RhdGlvbiBkb25lIHdoZW4gdmlld2luZyBlYXJsaWVyIG1vZGVscy5cclxuICAgIEdsb2JhbHMuX2NvbnRyb2xzLnJlc2V0KCk7XHJcblxyXG4gICAgLy8vIEZvY3VzIGNhbWVyYSB0byB0aGUgYmlnZXN0IG1vZGVsLCBkb2Vzbid0IHdvcmsgZ3JlYXQuXHJcbiAgICB2YXIgZGlzdCA9IChiaWdnZXN0TWRsICYmIGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUpID8gYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgLyBNYXRoLnRhbihNYXRoLlBJICogNjAgLyAzNjApIDogMTAwO1xyXG4gICAgZGlzdCA9IDEuMiAqIE1hdGgubWF4KDEwMCxkaXN0KTtcclxuICAgIGRpc3QgPSBNYXRoLm1pbigxMDAwLCBkaXN0KTtcclxuICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcclxuICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi54ID0gZGlzdCpNYXRoLnNxcnQoMik7XHJcbiAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueSA9IDUwO1xyXG4gICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnogPSAwO1xyXG5cclxuXHJcbiAgICBpZihiaWdnZXN0TWRsKVxyXG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgdmlld0ZpbGVCeU1GVDogdmlld0ZpbGVCeU1GVCxcclxuICAgIHZpZXdGaWxlQnlGaWxlSWQ6IHZpZXdGaWxlQnlGaWxlSWQsXHJcbn0iLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG4vL1NldHRpbmcgdXAgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBhcHBcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy8vIFQzRFxuICAgIF9scjogdW5kZWZpbmVkLFxuICAgIF9jb250ZXh0OiB1bmRlZmluZWQsXG4gICAgX2ZpbGVJZDogdW5kZWZpbmVkLFxuICAgIF9maWxlTGlzdDogdW5kZWZpbmVkLFxuICAgIF9hdWRpb1NvdXJjZTogdW5kZWZpbmVkLFxuICAgIF9hdWRpb0NvbnRleHQ6IHVuZGVmaW5lZCxcblxuICAgIC8vLyBUSFJFRVxuICAgIF9zY2VuZTogdW5kZWZpbmVkLFxuICAgIF9jYW1lcmE6IHVuZGVmaW5lZCxcbiAgICBfcmVuZGVyZXI6IHVuZGVmaW5lZCxcbiAgICBfbW9kZWxzOiBbXSxcbiAgICBfY29udHJvbHM6IHVuZGVmaW5lZCxcblxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuY29uc3QgRmlsZVZpZXdlciA9IHJlcXVpcmUoJy4vZmlsZXZpZXdlcicpO1xyXG5jb25zdCBGaWxlR3JpZCA9IHJlcXVpcmUoJy4vZmlsZWdyaWQnKTtcclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuL3V0aWxzJyk7XHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vZ2xvYmFscycpO1xyXG5cclxuLyoqXHJcbiAqIFNldHVwIG1haW4gZ3JpZFxyXG4gKi9cclxuZnVuY3Rpb24gbWFpbkdyaWQoKSB7XHJcbiAgICBjb25zdCBwc3R5bGUgPSAnYm9yZGVyOiAxcHggc29saWQgI2RmZGZkZjsgcGFkZGluZzogMDsnO1xyXG4gICAgJCgnI2xheW91dCcpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnbGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogNTcwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArICdtYXJnaW46MCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21haW4nLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArIFwiIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1wiLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnYmFja2dyb3VuZC1jb2xvcjojZWFlYWVhOyBoZWlnaHQ6NDBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLCBpZDogJ2ZpbGVJZFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnIEZpbGUgSUQ6JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgICA8aW5wdXQgaWQ9XCJmaWxlSWRJbnB1dFwiLz4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIDxidXR0b24gaWQ9XCJmaWxlSWRJbnB1dEJ0blwiPicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgICAgTG9hZCA8L2J1dHRvbj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsIGlkOiAnY29udGV4dFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIiBpZD1cImNvbnRleHRUb29sYmFyXCI+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lci5jb250ZW50KCdtYWluJywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25SZXNpemU6IFV0aWxzLm9uQ2FudmFzUmVzaXplXHJcbiAgICB9KTtcclxuXHJcbiAgICAkKFwiI2ZpbGVJZElucHV0QnRuXCIpLmNsaWNrKFxyXG4gICAgICAgIGZ1bmN0aW9uICgpIHsgRmlsZVZpZXdlci52aWV3RmlsZUJ5RmlsZUlkKCQoXCIjZmlsZUlkSW5wdXRcIikudmFsKCkpOyB9XHJcbiAgICApXHJcblxyXG5cclxuICAgIC8vLyBHcmlkIGluc2lkZSBtYWluIGxlZnRcclxuICAgICQoKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xlZnRMYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW1xyXG4gICAgICAgICAgICB7IHR5cGU6ICdsZWZ0Jywgc2l6ZTogMTUwLCByZXNpemFibGU6IHRydWUsIHN0eWxlOiBwc3R5bGUsIGNvbnRlbnQ6ICdsZWZ0JyB9LFxyXG4gICAgICAgICAgICB7IHR5cGU6ICdtYWluJywgc2l6ZTogNDIwLCByZXNpemFibGU6IHRydWUsIHN0eWxlOiBwc3R5bGUsIGNvbnRlbnQ6ICdyaWdodCcgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgnbGVmdCcsIHcydWlbJ2xlZnRMYXlvdXQnXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBzaWRlYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyKCl7XHJcbiAgICAvKlxyXG4gICAgICAgIFNJREVCQVJcclxuICAgICovXHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbGVmdCcsICQoKS53MnNpZGViYXIoe1xyXG4gICAgICAgIG5hbWU6ICdzaWRlYmFyJyxcclxuICAgICAgICBpbWc6IG51bGwsXHJcbiAgICAgICAgbm9kZXM6IFtcclxuICAgICAgICAgICAgeyBpZDogJ0FsbCcsIHRleHQ6ICdBbGwnLCBpbWc6ICdpY29uLWZvbGRlcicsIGdyb3VwOiBmYWxzZSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBGaWxlR3JpZC5vbkZpbHRlckNsaWNrXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlYnJvd3NlclxyXG4gKi9cclxuZnVuY3Rpb24gZmlsZUJyb3dzZXIoKXtcclxuICAgIHcydWlbJ2xlZnRMYXlvdXQnXS5jb250ZW50KCdtYWluJywgJCgpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICB7IGZpZWxkOiAncmVjaWQnLCBjYXB0aW9uOiAnTUZUIGluZGV4Jywgc2l6ZTogJzgwcHgnLCBzb3J0YWJsZTogdHJ1ZSwgcmVzaXphYmxlOiB0cnVlLCBzZWFyY2hhYmxlOiAnaW50JyB9LFxyXG4gICAgICAgICAgICB7IGZpZWxkOiAnYmFzZUlkcycsIGNhcHRpb246ICdCYXNlSWQgbGlzdCcsIHNpemU6ICcxMDAlJywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgc2VhcmNoYWJsZTogdHJ1ZSB9LFxyXG5cdFx0XHR7IGZpZWxkOiAndHlwZScsIGNhcHRpb246ICdUeXBlJywgc2l6ZTogJzEwMHB4JywgcmVzaXphYmxlOiB0cnVlLCBzb3J0YWJsZTogdHJ1ZSB9LFxyXG5cdFx0XHR7IGZpZWxkOiAnZmlsZVNpemUnLCBjYXB0aW9uOiAnUGFjayBTaXplJywgc2l6ZTogJzg1cHgnLCByZXNpemFibGU6IHRydWUsIHNvcnRhYmxlOiB0cnVlIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlNRlQoZXZlbnQucmVjaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGUgdmlldyB3aW5kb3dcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVWaWV3KCkge1xyXG4gICAgJCh3MnVpWydsYXlvdXQnXS5lbCgnbWFpbicpKVxyXG4gICAgICAgLmFwcGVuZCgkKFwiPGgxIGlkPSdmaWxlVGl0bGUnIC8+XCIpKVxyXG4gICAgICAgLmFwcGVuZCgkKFwiPGRpdiBpZD0nZmlsZVRhYnMnIC8+XCIpKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1Jhdyc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3Jhd091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICApXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzUGFjayc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3BhY2tPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzVGV4dHVyZSc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3RleHR1cmVPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzU3RyaW5nJz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBpZD0nc3RyaW5nT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic01vZGVsJz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBpZD0nbW9kZWxPdXRwdXQnLz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgIClcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNTb3VuZCc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3NvdW5kT3V0cHV0Jy8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApO1xyXG5cclxuXHJcbiAgICQoXCIjZmlsZVRhYnNcIikudzJ0YWJzKHtcclxuICAgICAgIG5hbWU6ICdmaWxlVGFicycsXHJcbiAgICAgICBhY3RpdmU6ICd0YWJSYXcnLFxyXG4gICAgICAgdGFiczogW1xyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJSYXcnLFxyXG4gICAgICAgICAgICAgICBjYXB0aW9uOiAnUmF3JyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzUmF3Jykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiUEYnLFxyXG4gICAgICAgICAgICAgICBjYXB0aW9uOiAnUGFjayBGaWxlJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzUGFjaycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYlRleHR1cmUnLFxyXG4gICAgICAgICAgICAgICBjYXB0aW9uOiAnVGV4dHVyZScsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1RleHR1cmUnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJTdHJpbmcnLFxyXG4gICAgICAgICAgICAgICBjYXB0aW9uOiAnU3RyaW5nJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzU3RyaW5nJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiTW9kZWwnLFxyXG4gICAgICAgICAgICAgICBjYXB0aW9uOiAnTW9kZWwnLFxyXG4gICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcjZmlsZVRhYnNNb2RlbCcpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYlNvdW5kJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1NvdW5kJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzU291bmQnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9XHJcbiAgICAgICBdXHJcbiAgIH0pO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdHJpbmdHcmlkKCl7XHJcbiAgICAvLy8gU2V0IHVwIGdyaWQgZm9yIHN0cmluZ3Mgdmlld1xyXG4gICAgLy8vQ3JlYXRlIGdyaWRcclxuICAgICQoXCIjc3RyaW5nT3V0cHV0XCIpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ3N0cmluZ0dyaWQnLFxyXG4gICAgICAgIHNlbGVjdFR5cGU6ICdjZWxsJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgeyBmaWVsZDogJ3JlY2lkJywgY2FwdGlvbjogJ1JvdyAjJywgc2l6ZTogJzYwcHgnIH0sXHJcbiAgICAgICAgICAgIHsgZmllbGQ6ICd2YWx1ZScsIGNhcHRpb246ICdUZXh0Jywgc2l6ZTogJzEwMCUnIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gd2UgaGF2ZSBhIGxpc3Qgb2YgdGhlIGZpbGVzIHRvIG9yZ2FuaXplIHRoZSBjYXRlZ29yaWVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhck5vZGVzKCl7XHJcblxyXG4gICAgdmFyIHBhY2tOb2RlID0ge1xyXG4gICAgICAgIGlkOiAncGFja0dyb3VwJywgdGV4dDogJ1BhY2sgRmlsZXMnLCBpbWc6ICdpY29uLWZvbGRlcicsIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH07XHJcblxyXG4gICAgdmFyIHRleHR1cmVOb2RlID0ge1xyXG4gICAgICAgIGlkOiAndGV4dHVyZUdyb3VwJywgdGV4dDogJ1RleHR1cmUgZmlsZXMnLCBpbWc6ICdpY29uLWZvbGRlcicsIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH1cclxuICAgIFxyXG4gICAgdmFyIHVuc29ydGVkTm9kZSA9IHtcclxuICAgICAgICBpZDogJ3Vuc29ydGVkR3JvdXAnLCB0ZXh0OiAnVW5zb3J0ZWQnLCBpbWc6ICdpY29uLWZvbGRlcicsIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH1cclxuXHJcbiAgICAvLy8gQnVpbGQgc2lkZWJhciBub2Rlc1xyXG4gICAgZm9yICh2YXIgZmlsZVR5cGUgaW4gR2xvYmFscy5fZmlsZUxpc3QpIHtcclxuICAgICAgICBpZiAoR2xvYmFscy5fZmlsZUxpc3QuaGFzT3duUHJvcGVydHkoZmlsZVR5cGUpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHtpZDpmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSB9O1xyXG4gICAgICAgICAgICB2YXIgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKXtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7aWQ6IGZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlLCB0ZXh0OiBmaWxlVHlwZX07XHJcbiAgICAgICAgICAgICAgICB0ZXh0dXJlTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmKGZpbGVUeXBlID09ICdCSU5BUklFUycpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJCaW5hcmllc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZSA9PSAnU1RSSU5HUycpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIGlmKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSl7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge2lkOiBmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSwgdGV4dDogZmlsZVR5cGV9O1xyXG4gICAgICAgICAgICAgICAgcGFja05vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZSA9PSAnVU5LTk9XTicpe1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJVbmtub3duXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7aWQ6IGZpbGVUeXBlLCBpbWc6IFwiaWNvbi1mb2xkZXJcIiwgZ3JvdXA6IGZhbHNlLCB0ZXh0OiBmaWxlVHlwZX07XHJcbiAgICAgICAgICAgICAgICB1bnNvcnRlZE5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9IFxyXG4gICAgfVxyXG5cclxuICAgIGlmKHBhY2tOb2RlLm5vZGVzLmxlbmd0aD4wKXtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHBhY2tOb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZih0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodW5zb3J0ZWROb2RlLm5vZGVzLmxlbmd0aD4wKXtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHVuc29ydGVkTm9kZSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKSB7XHJcblxyXG4gICAgbWFpbkdyaWQoKTtcclxuICAgIHNpZGViYXIoKTtcclxuICAgIGZpbGVCcm93c2VyKCk7XHJcbiAgICBmaWxlVmlldygpO1xyXG4gICAgc3RyaW5nR3JpZCgpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgU0VUIFVQIFRSRUUgM0QgU0NFTkVcclxuICAgICovXHJcbiAgICBVdGlscy5zZXR1cFNjZW5lKCk7XHJcblxyXG5cclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3BlbihcclxuICAgICAgICB7XHJcbiAgICAgICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgICAgICB0aXRsZTogJ0xvYWQgQSBHVzIgZGF0JyxcclxuICAgICAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgICAgIGJvZHk6ICc8ZGl2IGNsYXNzPVwidzJ1aS1jZW50ZXJlZFwiPicgK1xyXG4gICAgICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICB9XHJcbiAgICApO1xyXG5cclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIilcclxuICAgICAgICAuY2hhbmdlKFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZXZ0KSB7XHJcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciA9IFQzRC5nZXRMb2NhbFJlYWRlcihcclxuICAgICAgICAgICAgICAgICAgICBldnQudGFyZ2V0LmZpbGVzWzBdLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uUmVhZGVyQ3JlYXRlZCxcclxuICAgICAgICAgICAgICAgICAgICBcIi4uL3N0YXRpYy90M2R3b3JrZXIuanNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICAvLy8gT3ZlcndyaXRlIHByb2dyZXNzIGxvZ2dlclxyXG4gICAgVDNELkxvZ2dlci5sb2dGdW5jdGlvbnNbVDNELkxvZ2dlci5UWVBFX1BST0dSRVNTXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICAgICAkKFwiI2ZpbGVMb2FkUHJvZ3Jlc3NcIikuaHRtbChcclxuICAgICAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGUgKGZpcnN0IHZpc2l0IG9ubHkpPGJyLz5cIiArXHJcbiAgICAgICAgICAgIGFyZ3VtZW50c1sxXSArIFwiJTxici8+PGJyLz5cIlxyXG4gICAgICAgICk7XHJcbiAgICB9XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW5pdExheW91dDogaW5pdExheW91dCxcclxuICAgIHNpZGViYXJOb2Rlczogc2lkZWJhck5vZGVzXHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbi8vIFRoaXMgZmlsZSBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFR5cmlhMkQgYXBwbGljYXRpb25cclxuXHJcbi8vLyBSZXF1aXJlczpcclxuY29uc3QgTGF5b3V0ID0gcmVxdWlyZSgnLi9sYXlvdXQnKTtcclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL2dsb2JhbHMnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBvblJlYWRlckNyZWF0ZWQoKXtcclxuXHJcbiAgICBUM0QuZ2V0RmlsZUxpc3RBc3luYyhHbG9iYWxzLl9scixcclxuICAgICAgICBmdW5jdGlvbihmaWxlcyl7XHJcblxyXG4gICAgICAgICAgICAvLy8gU3RvcmUgZmlsZUxpc3QgZ2xvYmFsbHlcclxuICAgICAgICAgICAgR2xvYmFscy5fZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgICAgIExheW91dC5zaWRlYmFyTm9kZXMoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBDbG9zZSB0aGUgcG9wXHJcbiAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTZWxlY3QgdGhlIFwiQWxsXCIgY2F0ZWdvcnlcclxuICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmNsaWNrKFwiQWxsXCIpO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgcmVhZEZpbGVMaXN0QXN5bmMgY2FsbGJhY2tcclxuICAgICk7XHJcbiAgICBcclxufVxyXG5cclxuTGF5b3V0LmluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKTsiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9nbG9iYWxzJyk7XHJcblxyXG4vLy8gRXhwb3J0cyBjdXJyZW50IG1vZGVsIGFzIGFuIC5vYmogZmlsZSB3aXRoIGEgLm10bCByZWZlcmluZyAucG5nIHRleHR1cmVzLlxyXG5mdW5jdGlvbiBleHBvcnRTY2VuZSgpe1xyXG5cclxuICAgIC8vLyBHZXQgbGFzdCBsb2FkZWQgZmlsZUlkXHRcdFxyXG4gICAgdmFyIGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZDtcclxuXHJcbiAgICAvLy8gUnVuIFQzRCBoYWNrZWQgdmVyc2lvbiBvZiBPQkpFeHBvcnRlclxyXG4gICAgdmFyIHJlc3VsdCA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpLnBhcnNlKCBHbG9iYWxzLl9zY2VuZSwgZmlsZUlkKTtcclxuXHJcbiAgICAvLy8gUmVzdWx0IGxpc3RzIHdoYXQgZmlsZSBpZHMgYXJlIHVzZWQgZm9yIHRleHR1cmVzLlxyXG4gICAgdmFyIHRleElkcyA9IHJlc3VsdC50ZXh0dXJlSWRzO1xyXG5cclxuICAgIC8vLyBTZXQgdXAgdmVyeSBiYXNpYyBtYXRlcmlhbCBmaWxlIHJlZmVyaW5nIHRoZSB0ZXh0dXJlIHBuZ3NcclxuICAgIC8vLyBwbmdzIGFyZSBnZW5lcmF0ZWQgYSBmZXcgbGluZXMgZG93bi5cclxuICAgIHZhciBtdGxTb3VyY2UgPVwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbih0ZXhJZCl7XHJcbiAgICAgICAgbXRsU291cmNlICs9XCJuZXdtdGwgdGV4X1wiK3RleElkK1wiXFxuXCIrXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFwiICBtYXBfS2EgdGV4X1wiK3RleElkK1wiLnBuZ1xcblwiK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIit0ZXhJZCtcIi5wbmdcXG5cXG5cIjtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBvYmpcclxuICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jlc3VsdC5vYmpdLCB7dHlwZTogXCJvY3RldC9zdHJlYW1cIn0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYixcImV4cG9ydC5cIitmaWxlSWQrXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsXCJleHBvcnQuXCIrZmlsZUlkK1wiLm10bFwiKTtcclxuICAgIFxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24odGV4SWQpe1xyXG5cclxuICAgICAgICAvLy8gTG9jYWxSZWFkZXIgd2lsbCBoYXZlIHRvIHJlLWxvYWQgdGhlIHRleHR1cmVzLCBkb24ndCB3YW50IHRvIGZldGNoXHJcbiAgICAgICAgLy8vIHRoZW4gZnJvbSB0aGUgbW9kZWwgZGF0YS4uXHJcbiAgICAgICAgR2xvYmFscy5fbHIubG9hZFRleHR1cmVGaWxlKHRleElkLFxyXG4gICAgICAgICAgICBmdW5jdGlvbihpbmZsYXRlZERhdGEsIGR4dFR5cGUsIGltYWdlV2lkdGgsIGltYWdlSGVpZ3RoKXtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBqcyBpbWFnZSB1c2luZyByZXR1cm5lZCBiaXRtYXAgZGF0YS5cclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhICAgOiBuZXcgVWludDhBcnJheShpbmZsYXRlZERhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoICA6IGltYWdlV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0IDogaW1hZ2VIZWlndGhcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIE5lZWQgYSBjYW52YXMgaW4gb3JkZXIgdG8gZHJhd1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKGNhbnZhcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gIGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9ICBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIERyYXcgcmF3IGJpdG1hcCB0byBjYW52YXNcclxuICAgICAgICAgICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1x0XHQgICAgICAgIFx0XHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VkYXRhLDAsMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFRoaXMgaXMgd2hlcmUgc2hpdCBnZXRzIHN0dXBpZC4gRmxpcHBpbmcgcmF3IGJpdG1hcHMgaW4ganNcclxuICAgICAgICAgICAgICAgIC8vLyBpcyBhcHBhcmVudGx5IGEgcGFpbi4gQmFzaWNseSByZWFkIGN1cnJlbnQgc3RhdGUgcGl4ZWwgYnkgcGl4ZWxcclxuICAgICAgICAgICAgICAgIC8vLyBhbmQgd3JpdGUgaXQgYmFjayB3aXRoIGZsaXBwZWQgeS1heGlzIFxyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBvdXRwdXQgaW1hZ2UgZGF0YSBidWZmZXJcclxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLy8gR2V0IGltYWdlZGF0YSBzaXplXHJcbiAgICAgICAgICAgICAgICB2YXIgdyA9IGlucHV0LndpZHRoLCBoID0gaW5wdXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0RGF0YSA9IGlucHV0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0RGF0YSA9IG91dHB1dC5kYXRhXHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBMb29wIHBpeGVsc1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeSA9IDE7IHkgPCBoLTE7IHkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHggPSAxOyB4IDwgdy0xOyB4ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBJbnB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9ICh5KncgKyB4KSo0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIE91dHB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmxpcCA9ICggKGgteSkqdyArIHgpKjQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUmVhZCBhbmQgd3JpdGUgUkdCQVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gVE9ETzogUGVyaGFwcyBwdXQgYWxwaGEgdG8gMTAwJVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDQ7IGMgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YVtpK2NdID0gaW5wdXREYXRhW2ZsaXArY107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFdyaXRlIGJhY2sgZmxpcHBlZCBkYXRhXHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKG91dHB1dCwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIEZldGNoIGNhbnZhcyBkYXRhIGFzIHBuZyBhbmQgZG93bmxvYWQuXHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0udG9CbG9iKFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uKHBuZ0Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZURhdGEoIHBuZ0Jsb2IsIFwidGV4X1wiK3RleElkK1wiLnBuZ1wiICk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gUmVtb3ZlIGNhbnZhcyBmcm9tIERPTVxyXG4gICAgICAgICAgICAgICAgY2FudmFzLnJlbW92ZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcbiAgICAgICAgXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vIFV0aWxpdHkgZm9yIGRvd25sb2FkaW5nIGZpbGVzIHRvIGNsaWVudFxyXG52YXIgc2F2ZURhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICBhLnN0eWxlID0gXCJkaXNwbGF5OiBub25lXCI7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJsb2IsIGZpbGVOYW1lKSB7ICAgICAgICBcclxuICAgICAgICB2YXIgdXJsID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgYS5ocmVmID0gdXJsO1xyXG4gICAgICAgIGEuZG93bmxvYWQgPSBmaWxlTmFtZTtcclxuICAgICAgICBhLmNsaWNrKCk7XHJcbiAgICAgICAgd2luZG93LlVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgIH07XHJcbn0oKSk7XHJcblxyXG5cclxuXHJcbi8vLyBTZXR0aW5nIHVwIGEgc2NlbmUsIFRyZWUuanMgc3RhbmRhcmQgc3R1ZmYuLi5cclxuZnVuY3Rpb24gc2V0dXBTY2VuZSgpe1xyXG5cclxuICAgIHZhciBjYW52YXNXaWR0aCA9ICQoXCIjbW9kZWxPdXRwdXRcIikud2lkdGgoKTtcclxuICAgIHZhciBjYW52YXNIZWlnaHQgPSAkKFwiI21vZGVsT3V0cHV0XCIpLmhlaWdodCgpO1xyXG4gICAgdmFyIGNhbnZhc0NsZWFyQ29sb3IgPSAweDM0MjkyMDsgLy8gRm9yIGhhcHB5IHJlbmRlcmluZywgYWx3YXlzIHVzZSBWYW4gRHlrZSBCcm93bi5cclxuICAgIHZhciBmb3YgPSA2MDtcclxuICAgIHZhciBhc3BlY3QgPSAxO1xyXG4gICAgdmFyIG5lYXIgPSAwLjE7XHJcbiAgICB2YXIgZmFyID0gNTAwMDAwO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCwgbmVhciwgZmFyKTtcclxuXHJcbiAgICBHbG9iYWxzLl9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xyXG4gICAgdmFyIGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoIDB4NTU1NTU1ICk7XHJcbiAgICBHbG9iYWxzLl9zY2VuZS5hZGQoIGFtYmllbnRMaWdodCApO1xyXG5cclxuICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweGZmZmZmZiwgLjggKTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQxLnBvc2l0aW9uLnNldCggMCwgMCwgMSApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKCBkaXJlY3Rpb25hbExpZ2h0MSApO1xyXG5cclxuICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MiA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDIucG9zaXRpb24uc2V0KCAxLCAwLCAwICk7XHJcbiAgICBHbG9iYWxzLl9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQyICk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoIDB4ZmZmZmZmLCAuOCApO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KCAwLCAxLCAwICk7XHJcbiAgICBHbG9iYWxzLl9zY2VuZS5hZGQoIGRpcmVjdGlvbmFsTGlnaHQzICk7XHJcbiAgICBcclxuICAgIC8vLyBTdGFuZGFyZCBUSFJFRSByZW5kZXJlciB3aXRoIEFBXHJcbiAgICBHbG9iYWxzLl9yZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHthbnRpYWxpYXNpbmc6IHRydWV9KTtcclxuICAgICQoXCIjbW9kZWxPdXRwdXRcIilbMF0uYXBwZW5kQ2hpbGQoR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcbiAgICBcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoIGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQgKTtcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldENsZWFyQ29sb3IoIGNhbnZhc0NsZWFyQ29sb3IgKTtcclxuXHJcbiAgICAvLy8gQWRkIFRIUkVFIG9yYml0IGNvbnRyb2xzLCBmb3Igc2ltcGxlIG9yYml0aW5nLCBwYW5uaW5nIGFuZCB6b29taW5nXHJcbiAgICBHbG9iYWxzLl9jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKCBHbG9iYWxzLl9jYW1lcmEsIEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQgKTtcclxuICAgIEdsb2JhbHMuX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlOyAgICAgXHJcblxyXG4gICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cclxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24oKXtzZXRUaW1lb3V0KG9uQ2FudmFzUmVzaXplLDEwKX0pO1xyXG5cclxuICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIG9uQ2FudmFzUmVzaXplKCl7XHJcbiAgICBcclxuICAgIHZhciBzY2VuZVdpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIHNjZW5lSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuXHJcbiAgICBpZighc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XHJcblxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShzY2VuZVdpZHRoLCBzY2VuZUhlaWdodCk7XHJcblxyXG4gICAgR2xvYmFscy5fY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcclxufVxyXG5cclxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cclxuZnVuY3Rpb24gcmVuZGVyKCl7XHJcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKCByZW5kZXIgKTtcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnJlbmRlcihHbG9iYWxzLl9zY2VuZSwgR2xvYmFscy5fY2FtZXJhKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBleHBvcnRTY2VuZTogZXhwb3J0U2NlbmUsXHJcbiAgICBzYXZlRGF0YTogc2F2ZURhdGEsXHJcbiAgICBzZXR1cFNjZW5lOiBzZXR1cFNjZW5lLFxyXG4gICAgb25DYW52YXNSZXNpemU6IG9uQ2FudmFzUmVzaXplLFxyXG4gICAgcmVuZGVyOiByZW5kZXJcclxufSJdfQ==
