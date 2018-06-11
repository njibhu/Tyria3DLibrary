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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9maWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL2ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9nbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvbGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvbWFpbi5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL3V0aWxzLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsQkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbllBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL2dsb2JhbHMnKTtcclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcbiAgICBcclxuICAgIC8vLyBObyBmaWx0ZXIgaWYgY2xpY2tlZCBncm91cCB3YXMgXCJBbGxcIlxyXG4gICAgaWYoZXZ0LnRhcmdldD09XCJBbGxcIil7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBPdGhlciBldmVudHMgYXJlIGZpbmUgdG8ganVzdCBwYXNzXHJcbiAgICBlbHNle1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcdFxyXG4gICAgfVxyXG4gICAgXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpe1xyXG5cclxuICAgIHcydWkuZ3JpZC5yZWNvcmRzID0gW107XHJcblxyXG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IEdsb2JhbHMuX2xyLmdldFJldmVyc2VJbmRleCgpO1xyXG5cclxuICAgIGZvciAodmFyIGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcblxyXG4gICAgICAgIC8vLyBPbmx5IHNob3cgdHlwZXMgd2UndmUgYXNrZWQgZm9yXHJcbiAgICAgICAgaWYoZmlsZVR5cGVGaWx0ZXIgJiYgZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihmaWxlVHlwZSkgPCAwKXtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNhc2UgZm9yIFwicGFja0dyb3VwXCJcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBsZXQgdHJvdWdoIGFsbCBwYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgTk9UIGxldCB0cm91Z2h0IGFueSBub24tcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gaS5lLiBTdHJpbmdzLCBCaW5hcmllcyBldGNcclxuICAgICAgICAgICAgaWYoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInBhY2tHcm91cFwiKT49MCl7XHJcbiAgICAgICAgICAgICAgICBpZighZmlsZVR5cGUuc3RhcnRzV2l0aChcIlBGXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNlIGlmKGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoXCJ0ZXh0dXJlR3JvdXBcIik+PTApe1xyXG4gICAgICAgICAgICAgICAgaWYoIWZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKXtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBlbHNle1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHRcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICBcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChHbG9iYWxzLl9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaWxlQXJyID0gR2xvYmFscy5fZmlsZUxpc3RbZmlsZVR5cGVdO1xyXG4gICAgICAgICAgICBmaWxlQXJyLmZvckVhY2goXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbihtZnRJbmRleCl7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXRhID0gR2xvYmFscy5fbHIuZ2V0RmlsZU1ldGEobWZ0SW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYmFzZUlkcyA9IHJldmVyc2VUYWJsZVttZnRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVTaXplID0gIChtZXRhKSA/IG1ldGEuc2l6ZTogXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoZmlsZVNpemU+MCAmJiBtZnRJbmRleCA+IDE1KXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHcydWlbJ2dyaWQnXS5yZWNvcmRzLnB1c2goeyBcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2lkIDogbWZ0SW5kZXgsIC8vLyBNRlQgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZHM6IGJhc2VJZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlIDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlU2l6ZSA6IGZpbGVTaXplXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1x0XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWZ0SW5kZXgrKztcclxuICAgICAgICAgICAgICAgIH0vLy8gRW5kIGZvciBlYWNoIG1mdCBpbiB0aGlzIGZpbGUgdHlwZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgaWYgX2ZpbGVMaXN0W2ZpbGV0eXBlXVxyXG5cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2ssXHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9nbG9iYWxzJyk7XHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vdXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIHZpZXdGaWxlQnlNRlQobWZ0SWR4KXtcclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuICAgIFxyXG4gICAgdmFyIGJhc2VJZCA9IChyZXZlcnNlVGFibGVbbWZ0SWR4XSkgPyByZXZlcnNlVGFibGVbbWZ0SWR4XVswXSA6IFwiXCI7XHJcblxyXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB2aWV3RmlsZUJ5RmlsZUlkKGZpbGVJZCl7XHJcblxyXG4gICAgLy8vIENsZWFuIG91dHB1dHNcclxuICAgICQoXCIudGFiT3V0cHV0XCIpLmh0bWwoXCJcIik7XHJcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKFwiXCIpO1xyXG5cclxuICAgIC8vLyBDbGVhbiBjb250ZXh0IHRvb2xiYXJcclxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuaHRtbChcIlwiKTtcclxuXHJcbiAgICAvLy8gRGlzYWJsZSB0YWJzXHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlJhdycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJQRicpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJUZXh0dXJlJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUoJ3RhYlN0cmluZycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJNb2RlbCcpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJTb3VuZCcpO1xyXG5cclxuICAgIC8vLyBSZW1vdmUgb2xkIG1vZGVscyBmcm9tIHRoZSBzY2VuZVxyXG4gICAgaWYoR2xvYmFscy5fbW9kZWxzKXtcclxuICAgICAgICBHbG9iYWxzLl9tb2RlbHMuZm9yRWFjaChmdW5jdGlvbihtZGwpe1xyXG4gICAgICAgICAgICBHbG9iYWxzLl9zY2VuZS5yZW1vdmUobWRsKTtcclxuICAgICAgICB9KTtcdFxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgX2NvbnRleHQgaXMgY2xlYW5cclxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHRoZSBiYXNpYyBEYXRhUmVuZGVyZXIsIGhhbmRsZXMgYWxsIHNvcnRzIG9mIGZpbGVzIGZvciB1cy5cclxuICAgIFQzRC5ydW5SZW5kZXJlcihcclxuICAgICAgICBUM0QuRGF0YVJlbmRlcmVyLFxyXG4gICAgICAgIEdsb2JhbHMuX2xyLFxyXG4gICAgICAgIHtpZDpmaWxlSWR9LFxyXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXHJcbiAgICAgICAgb25CYXNpY1JlbmRlcmVyRG9uZVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpe1xyXG5cclxuICAgIC8vLyBSZWFkIHJlbmRlciBvdXRwdXQgZnJvbSBfY29udGV4dCBWT1xyXG4gICAgdmFyIGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XHJcblxyXG4gICAgdmFyIHJhd0RhdGEgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcclxuXHJcbiAgICB2YXIgcmF3ID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd1N0cmluZ1wiKTtcclxuXHJcbiAgICB2YXIgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcclxuXHJcbiAgICB2YXIgaW1hZ2UgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiaW1hZ2VcIik7XHJcblxyXG5cclxuICAgIHZhciBmY2MgPSByYXcuc3Vic3RyaW5nKDAsNCk7XHJcblxyXG4gICAgLy8vIFVwZGF0ZSBtYWluIGhlYWRlciB0byBzaG93IGZpbGVuYW1lXHJcbiAgICBcclxuICAgIHZhciBmaWxlTmFtZSA9IGZpbGVJZCArIChpbWFnZSB8fCAhcGFja2ZpbGUgPyBcIi5cIitmY2MgOiBcIi5cIitwYWNrZmlsZS5oZWFkZXIudHlwZSApO1xyXG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChmaWxlTmFtZSk7XHJcblxyXG4gICAgLy8vIFVwZGF0ZSByYXcgdmlldyBhbmQgZW5hYmxlIHRhYlxyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlJhdycpO1xyXG4gICAgXHJcblxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxyXG4gICAgLmFwcGVuZChcclxuICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCByYXc8L2J1dHRvbj5cIilcclxuICAgICAgICAuY2xpY2soXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyYXdEYXRhXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsZmlsZU5hbWUrXCIucmF3XCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKVxyXG4gICAgKVxyXG5cclxuICAgICQoXCIjcmF3T3V0cHV0XCIpXHJcbiAgICAuYXBwZW5kKFxyXG4gICAgICAgICQoXCI8ZGl2PlwiKS50ZXh0KCByYXcgKVxyXG4gICAgKVxyXG4gICAgXHJcblxyXG4gICAgLy8vIFRleHR1cmUgZmlsZVxyXG4gICAgaWYoaW1hZ2Upe1xyXG5cclxuICAgICAgICAvLy8gU2VsZWN0IHRleHR1cmUgdGFiXHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlRleHR1cmUnKTtcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJUZXh0dXJlJyk7XHJcblxyXG4gICAgICAgIC8vLyBEaXNwbGF5IGJpdG1hcCBvbiBjYW52YXNcclxuICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXM+XCIpO1xyXG4gICAgICAgIGNhbnZhc1swXS53aWR0aCA9ICBpbWFnZS53aWR0aDtcclxuICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gIGltYWdlLmhlaWdodDtcclxuICAgICAgICB2YXIgY3R4ID0gY2FudmFzWzBdLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwwLDApO1xyXG5cclxuICAgICAgICAkKFwiI3RleHR1cmVPdXRwdXRcIikuYXBwZW5kKGNhbnZhcyk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIFBGIFBhY2sgZmlsZVxyXG4gICAgZWxzZSBpZihwYWNrZmlsZSl7IFx0XHJcblxyXG4gICAgICAgIC8vLyBBbHdheXMgcmVuZGVyIHRoZSBwYWNrIGZpbGUgY2h1bmsgZGF0YVxyXG4gICAgICAgIGRpc3BsYXlQYWNrRmlsZSgpO1xyXG5cclxuICAgICAgICAvLy8gRW5hYmxlIGNvcnJlc3BvbmRpbmcgdGFiXHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlBGJyk7XHJcblxyXG4gICAgICAgIC8vLyBJZiB0aGUgcGFjayBmaWxlIHdhcyBhIG1vZGVsLCByZW5kZXIgaXQhXHJcbiAgICAgICAgaWYocGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gXCJNT0RMXCIpe1xyXG5cclxuICAgICAgICAgICAgLy8vIFJlbmRlciBtb2RlbFxyXG4gICAgICAgICAgICByZW5kZXJGaWxlTW9kZWwoZmlsZUlkKTtcdCAgICAgICAgXHRcclxuICAgICAgICB9XHJcbiAgICAgICAgZWxzZSBpZihwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSBcIkFTTkRcIil7XHJcblxyXG4gICAgICAgICAgICAvLy8gR2V0IGEgY2h1bmssIHRoaXMgaXMgcmVhbGx5IHRoZSBqb2Igb2YgYSByZW5kZXJlciBidXQgd2hhdGV2c1xyXG4gICAgICAgICAgICB2YXIgY2h1bmsgPXBhY2tmaWxlLmdldENodW5rKFwiQVNORFwiKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBFbmFibGUgYW5kIHNlbGVjdCBzb3VuZCB0YWJcclxuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlNvdW5kJyk7XHJcbiAgICAgICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlNvdW5kJyk7XHJcblxyXG5cclxuICAgICAgICAgICAgLy8vIFByaW50IHNvbWUgcmFuZG9tIGRhdGEgYWJvdXQgdGhpcyBzb3VuZFxyXG4gICAgICAgICAgICAkKFwiI3NvdW5kT3V0cHV0XCIpXHJcbiAgICAgICAgICAgIC5odG1sKFxyXG4gICAgICAgICAgICAgICAgXCJMZW5ndGg6IFwiK2NodW5rLmRhdGEubGVuZ3RoK1wiIHNlY29uZHM8YnIvPlwiK1xyXG4gICAgICAgICAgICAgICAgXCJTaXplOiBcIitjaHVuay5kYXRhLmF1ZGlvRGF0YS5sZW5ndGgrXCIgYnl0ZXNcIlxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgIC8vLyBFeHRyYWN0IHNvdW5kIGRhdGFcclxuICAgICAgICAgICAgXHJcbiAgICAgICAgICAgIHZhciBzb3VuZFVpbnRBcnJheSA9IGNodW5rLmRhdGEuYXVkaW9EYXRhO1xyXG5cclxuICAgICAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxyXG4gICAgICAgICAgICAuc2hvdygpXHJcbiAgICAgICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3NvdW5kVWludEFycmF5XSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLGZpbGVOYW1lK1wiLm1wM1wiKTtcclxuICAgICAgICAgICAgICAgIH0pXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPlBsYXkgTVAzPC9idXR0b24+XCIpXHJcbiAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24oKXtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYoIUdsb2JhbHMuX2F1ZGlvQ29udGV4dCl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIC8vLyBTdG9wIHByZXZpb3VzIHNvdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgdHJ5e1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdG9wKCk7XHRcclxuICAgICAgICAgICAgICAgICAgICB9Y2F0Y2goZSl7fVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG5ldyBidWZmZXIgZm9yIGN1cnJlbnQgc291bmRcclxuICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZSA9IEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5jb25uZWN0KCBHbG9iYWxzLl9hdWRpb0NvbnRleHQuZGVzdGluYXRpb24gKTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgLy8vIERlY29kZSBhbmQgc3RhcnQgcGxheWluZ1xyXG4gICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoIHNvdW5kVWludEFycmF5LmJ1ZmZlciwgZnVuY3Rpb24oIHJlcyApIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UuYnVmZmVyID0gcmVzO1x0XHRcdFx0XHRcdFx0XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0YXJ0KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfSApO1xyXG4gICAgICAgICAgICAgICAgfSlcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAgICAgJChcIjxidXR0b24+U3RvcCBNUDM8L2J1dHRvbj5cIilcclxuICAgICAgICAgICAgICAgIC5jbGljayhcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbigpe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnl7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdG9wKCk7XHRcclxuICAgICAgICAgICAgICAgICAgICAgICAgfWNhdGNoKGUpe31cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgICAgIGVsc2V7XHJcbiAgICAgICAgICAgIC8vLyBTZWxlY3QgUEYgdGFiXHJcbiAgICAgICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlBGJyk7XHJcbiAgICAgICAgfVx0XHJcbiAgICB9XHJcblxyXG4gICAgZWxzZSBpZihmY2MgPT0gXCJzdHJzXCIpe1xyXG5cclxuICAgICAgICBzaG93RmlsZVN0cmluZyhmaWxlSWQpO1xyXG4gICAgICAgIFxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBFbHNlIGp1c3Qgc2hvdyByYXcgdmlld1xyXG4gICAgZWxzZXtcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJSYXcnKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gZGlzcGxheVBhY2tGaWxlKCl7XHJcblxyXG4gICAgdmFyIGZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XHJcbiAgICB2YXIgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcclxuXHJcbiAgICAkKFwiI3BhY2tPdXRwdXRcIikuaHRtbChcIlwiKTtcclxuICAgICQoXCIjcGFja091dHB1dFwiKS5hcHBlbmQoJChcIjxoMj5DaHVua3M8L2gyPlwiKSk7XHJcblxyXG4gICAgcGFja2ZpbGUuY2h1bmtzLmZvckVhY2goZnVuY3Rpb24oY2h1bmspe1xyXG5cclxuICAgICAgICB2YXIgZmllbGQgPSAkKFwiPGZpZWxkc2V0IC8+XCIpO1xyXG4gICAgICAgIHZhciBsZWdlbmQgPSAkKFwiPGxlZ2VuZD5cIitjaHVuay5oZWFkZXIudHlwZStcIjwvbGVnZW5kPlwiKTtcclxuXHJcbiAgICAgICAgdmFyIGxvZ0J1dHRvbiA9ICQoXCI8YnV0dG9uPkxvZyBDaHVuayBEYXRhIHRvIENvbnNvbGU8L2J1dHRvbj5cIik7XHJcbiAgICAgICAgbG9nQnV0dG9uLmNsaWNrKGZ1bmN0aW9uKCl7XHJcbiAgICAgICAgICAgIFQzRC5Mb2dnZXIubG9nKFQzRC5Mb2dnZXIuVFlQRV9NRVNTQUdFLCBcIkxvZ2dpbmdcIixjaHVuay5oZWFkZXIudHlwZSwgXCJjaHVua1wiKTtcclxuICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIGNodW5rLmRhdGEpO1xyXG4gICAgICAgIH0pO1xyXG5cclxuICAgICAgICBmaWVsZC5hcHBlbmQobGVnZW5kKTtcclxuICAgICAgICBmaWVsZC5hcHBlbmQoJChcIjxwPlNpemU6XCIrY2h1bmsuaGVhZGVyLmNodW5rRGF0YVNpemUrXCI8L3A+XCIpKTtcclxuICAgICAgICBmaWVsZC5hcHBlbmQobG9nQnV0dG9uKTtcclxuXHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLmFwcGVuZChmaWVsZCk7XHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLnNob3coKTtcclxuICAgIH0pOyAgICAgICAgXHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBzaG93RmlsZVN0cmluZyhmaWxlSWQpe1xyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgb3V0cHV0IGlzIGNsZWFuXHJcbiAgICBHbG9iYWxzLl9jb250ZXh0ID0ge307XHJcblxyXG4gICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcclxuICAgIFQzRC5ydW5SZW5kZXJlcihcclxuICAgICAgICBUM0QuU3RyaW5nUmVuZGVyZXIsXHJcbiAgICAgICAgR2xvYmFscy5fbHIsXHJcbiAgICAgICAge2lkOmZpbGVJZH0sXHJcbiAgICAgICAgR2xvYmFscy5fY29udGV4dCxcclxuICAgICAgICBvblJlbmRlcmVyRG9uZVN0cmluZ1xyXG4gICAgKTtcclxufVx0XHJcblxyXG5mdW5jdGlvbiBvblJlbmRlcmVyRG9uZVN0cmluZygpe1xyXG5cclxuICAgIC8vLyBSZWFkIGRhdGEgZnJvbSByZW5kZXJlclxyXG4gICAgdmFyIHN0cmluZ3MgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TdHJpbmdSZW5kZXJlciwgXCJzdHJpbmdzXCIsIFtdKTtcclxuXHJcbiAgICB3MnVpLnN0cmluZ0dyaWQucmVjb3JkcyA9IHN0cmluZ3M7XHJcblxyXG4gICAgXHJcblxyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkID0gdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMubGVuZ3RoO1xyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnRvdGFsID0gdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkO1xyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnJlZnJlc2goKTtcclxuXHJcbiAgICAvLy8gU2VsZWN0IHRoaXMgdmlld1xyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlN0cmluZycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiU3RyaW5nJyk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gcmVuZGVyRmlsZU1vZGVsKGZpbGVJZCl7XHJcblxyXG4gICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cclxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLFxyXG4gICAgICAgIEdsb2JhbHMuX2xyLFxyXG4gICAgICAgIHtpZDpmaWxlSWR9LFxyXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXHJcbiAgICAgICAgb25SZW5kZXJlckRvbmVNb2RlbFxyXG4gICAgKTtcclxufVx0XHJcblxyXG5mdW5jdGlvbiBvblJlbmRlcmVyRG9uZU1vZGVsKCl7XHJcblxyXG4gICAgLy8vIEVuYWJsZSBhbmQgc2VsZWN0IG1vZGVsIHRhYlxyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYk1vZGVsJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJNb2RlbCcpO1xyXG4gICAgJChcIiNtb2RlbE91dHB1dFwiKS5zaG93KCk7XHJcblxyXG4gICAgLy8vIFJlLWZpdCBjYW52YXNcclxuICAgIFV0aWxzLm9uQ2FudmFzUmVzaXplKCk7XHJcblxyXG4gICAgLy8vIEFkZCBjb250ZXh0IHRvb2xiYXIgZXhwb3J0IGJ1dHRvblxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXHJcbiAgICAgICAgJChcIjxidXR0b24+RXhwb3J0IHNjZW5lPC9idXR0b24+XCIpXHJcbiAgICAgICAgLmNsaWNrKFV0aWxzLmV4cG9ydFNjZW5lKVxyXG4gICAgKTtcclxuICAgIFxyXG4gICAgLy8vIFJlYWQgdGhlIG5ldyBtb2RlbHNcclxuICAgIEdsb2JhbHMuX21vZGVscyA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELlNpbmdsZU1vZGVsUmVuZGVyZXIsIFwibWVzaGVzXCIsIFtdKTtcclxuXHJcbiAgICAvLy8gS2VlcGluZyB0cmFjayBvZiB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgbGF0ZXJcclxuICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcclxuXHJcbiAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXHJcbiAgICBHbG9iYWxzLl9tb2RlbHMuZm9yRWFjaChmdW5jdGlvbihtb2RlbCl7XHJcblxyXG4gICAgICAgIC8vLyBGaW5kIHRoZSBiaWdnZXN0IG1vZGVsIGZvciBjYW1lcmEgZm9jdXMvZml0dGluZ1xyXG4gICAgICAgIGlmKCFiaWdnZXN0TWRsIHx8IGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUucmFkaXVzIDwgbW9kZWwuYm91bmRpbmdTcGhlcmUucmFkaXVzKXtcclxuICAgICAgICAgICAgYmlnZ2VzdE1kbCA9IG1vZGVsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXHJcbiAgICBHbG9iYWxzLl9jb250cm9scy5yZXNldCgpO1xyXG5cclxuICAgIC8vLyBGb2N1cyBjYW1lcmEgdG8gdGhlIGJpZ2VzdCBtb2RlbCwgZG9lc24ndCB3b3JrIGdyZWF0LlxyXG4gICAgdmFyIGRpc3QgPSAoYmlnZ2VzdE1kbCAmJiBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlKSA/IGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUucmFkaXVzIC8gTWF0aC50YW4oTWF0aC5QSSAqIDYwIC8gMzYwKSA6IDEwMDtcclxuICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsZGlzdCk7XHJcbiAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XHJcbiAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24uem9vbSA9IDE7XHJcbiAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueCA9IGRpc3QqTWF0aC5zcXJ0KDIpO1xyXG4gICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcclxuICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56ID0gMDtcclxuXHJcblxyXG4gICAgaWYoYmlnZ2VzdE1kbClcclxuICAgICAgICBHbG9iYWxzLl9jYW1lcmEubG9va0F0KGJpZ2dlc3RNZGwucG9zaXRpb24pO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIHZpZXdGaWxlQnlNRlQ6IHZpZXdGaWxlQnlNRlQsXHJcbiAgICB2aWV3RmlsZUJ5RmlsZUlkOiB2aWV3RmlsZUJ5RmlsZUlkLFxyXG59IiwiLy9TZXR0aW5nIHVwIHRoZSBnbG9iYWwgdmFyaWFibGVzIGZvciB0aGUgYXBwXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vLyBUM0RcbiAgICBfbHI6IHVuZGVmaW5lZCxcbiAgICBfY29udGV4dDogdW5kZWZpbmVkLFxuICAgIF9maWxlSWQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUxpc3Q6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Tb3VyY2U6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Db250ZXh0OiB1bmRlZmluZWQsXG5cbiAgICAvLy8gVEhSRUVcbiAgICBfc2NlbmU6IHVuZGVmaW5lZCxcbiAgICBfY2FtZXJhOiB1bmRlZmluZWQsXG4gICAgX3JlbmRlcmVyOiB1bmRlZmluZWQsXG4gICAgX21vZGVsczogW10sXG4gICAgX2NvbnRyb2xzOiB1bmRlZmluZWQsXG5cbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmNvbnN0IEZpbGVWaWV3ZXIgPSByZXF1aXJlKCcuL2ZpbGV2aWV3ZXInKTtcclxuY29uc3QgRmlsZUdyaWQgPSByZXF1aXJlKCcuL2ZpbGVncmlkJyk7XHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi91dGlscycpO1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL2dsb2JhbHMnKTtcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBtYWluIGdyaWRcclxuICovXHJcbmZ1bmN0aW9uIG1haW5HcmlkKCkge1xyXG4gICAgY29uc3QgcHN0eWxlID0gJ2JvcmRlcjogMXB4IHNvbGlkICNkZmRmZGY7IHBhZGRpbmc6IDA7JztcclxuICAgICQoJyNsYXlvdXQnKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xheW91dCcsXHJcbiAgICAgICAgcGFuZWxzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDU3MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnbWFyZ2luOjAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyBcIiBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcIixcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2JhY2tncm91bmQtY29sb3I6I2VhZWFlYTsgaGVpZ2h0OjQwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdodG1sJywgaWQ6ICdmaWxlSWRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCI+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyBGaWxlIElEOicgK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICcgICAgPGlucHV0IGlkPVwiZmlsZUlkSW5wdXRcIi8+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJyAgICA8YnV0dG9uIGlkPVwiZmlsZUlkSW5wdXRCdG5cIj4nICtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnICAgIExvYWQgPC9idXR0b24+JyArXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLCBpZDogJ2NvbnRleHRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCIgaWQ9XCJjb250ZXh0VG9vbGJhclwiPjwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuY29udGVudCgnbWFpbicsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uUmVzaXplOiBVdGlscy5vbkNhbnZhc1Jlc2l6ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNmaWxlSWRJbnB1dEJ0blwiKS5jbGljayhcclxuICAgICAgICBmdW5jdGlvbiAoKSB7IEZpbGVWaWV3ZXIudmlld0ZpbGVCeUZpbGVJZCgkKFwiI2ZpbGVJZElucHV0XCIpLnZhbCgpKTsgfVxyXG4gICAgKVxyXG5cclxuXHJcbiAgICAvLy8gR3JpZCBpbnNpZGUgbWFpbiBsZWZ0XHJcbiAgICAkKCkudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsZWZ0TGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFtcclxuICAgICAgICAgICAgeyB0eXBlOiAnbGVmdCcsIHNpemU6IDE1MCwgcmVzaXphYmxlOiB0cnVlLCBzdHlsZTogcHN0eWxlLCBjb250ZW50OiAnbGVmdCcgfSxcclxuICAgICAgICAgICAgeyB0eXBlOiAnbWFpbicsIHNpemU6IDQyMCwgcmVzaXphYmxlOiB0cnVlLCBzdHlsZTogcHN0eWxlLCBjb250ZW50OiAncmlnaHQnIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ2xlZnQnLCB3MnVpWydsZWZ0TGF5b3V0J10pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgc2lkZWJhclxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhcigpe1xyXG4gICAgLypcclxuICAgICAgICBTSURFQkFSXHJcbiAgICAqL1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ2xlZnQnLCAkKCkudzJzaWRlYmFyKHtcclxuICAgICAgICBuYW1lOiAnc2lkZWJhcicsXHJcbiAgICAgICAgaW1nOiBudWxsLFxyXG4gICAgICAgIG5vZGVzOiBbXHJcbiAgICAgICAgICAgIHsgaWQ6ICdBbGwnLCB0ZXh0OiAnQWxsJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25DbGljazogRmlsZUdyaWQub25GaWx0ZXJDbGlja1xyXG4gICAgfSkpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZWJyb3dzZXJcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVCcm93c2VyKCl7XHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbWFpbicsICQoKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgeyBmaWVsZDogJ3JlY2lkJywgY2FwdGlvbjogJ01GVCBpbmRleCcsIHNpemU6ICc4MHB4Jywgc29ydGFibGU6IHRydWUsIHJlc2l6YWJsZTogdHJ1ZSwgc2VhcmNoYWJsZTogJ2ludCcgfSxcclxuICAgICAgICAgICAgeyBmaWVsZDogJ2Jhc2VJZHMnLCBjYXB0aW9uOiAnQmFzZUlkIGxpc3QnLCBzaXplOiAnMTAwJScsIHNvcnRhYmxlOiB0cnVlLCByZXNpemFibGU6IHRydWUsIHNlYXJjaGFibGU6IHRydWUgfSxcclxuXHRcdFx0eyBmaWVsZDogJ3R5cGUnLCBjYXB0aW9uOiAnVHlwZScsIHNpemU6ICcxMDBweCcsIHJlc2l6YWJsZTogdHJ1ZSwgc29ydGFibGU6IHRydWUgfSxcclxuXHRcdFx0eyBmaWVsZDogJ2ZpbGVTaXplJywgY2FwdGlvbjogJ1BhY2sgU2l6ZScsIHNpemU6ICc4NXB4JywgcmVzaXphYmxlOiB0cnVlLCBzb3J0YWJsZTogdHJ1ZSB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5TUZUKGV2ZW50LnJlY2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlIHZpZXcgd2luZG93XHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlVmlldygpIHtcclxuICAgICQodzJ1aVsnbGF5b3V0J10uZWwoJ21haW4nKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoJChcIjxkaXYgaWQ9J2ZpbGVUYWJzJyAvPlwiKSlcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNSYXcnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdyYXdPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1BhY2snPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdwYWNrT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1RleHR1cmUnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSd0ZXh0dXJlT3V0cHV0JyAvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKVxyXG4gICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1N0cmluZyc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J3N0cmluZ091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICApXHJcbiAgICAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgIClcclxuICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNNb2RlbCc+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjxkaXYgaWQ9J21vZGVsT3V0cHV0Jy8+XCIgK1xyXG4gICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICApXHJcbiAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzU291bmQnPlwiICtcclxuICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdzb3VuZE91dHB1dCcvPlwiICtcclxuICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgIClcclxuICAgICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgKTtcclxuXHJcblxyXG4gICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICBuYW1lOiAnZmlsZVRhYnMnLFxyXG4gICAgICAgYWN0aXZlOiAndGFiUmF3JyxcclxuICAgICAgIHRhYnM6IFtcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiUmF3JyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1JhdycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1JhdycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYlBGJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1BhY2sgRmlsZScsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1BhY2snKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJUZXh0dXJlJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1RleHR1cmUnLFxyXG4gICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcjZmlsZVRhYnNUZXh0dXJlJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfSxcclxuICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgIGlkOiAndGFiU3RyaW5nJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ1N0cmluZycsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1N0cmluZycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgIH0sXHJcbiAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICBpZDogJ3RhYk1vZGVsJyxcclxuICAgICAgICAgICAgICAgY2FwdGlvbjogJ01vZGVsJyxcclxuICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzTW9kZWwnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICB9LFxyXG4gICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgaWQ6ICd0YWJTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGNhcHRpb246ICdTb3VuZCcsXHJcbiAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1NvdW5kJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgfVxyXG4gICAgICAgXVxyXG4gICB9KTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RyaW5nR3JpZCgpe1xyXG4gICAgLy8vIFNldCB1cCBncmlkIGZvciBzdHJpbmdzIHZpZXdcclxuICAgIC8vL0NyZWF0ZSBncmlkXHJcbiAgICAkKFwiI3N0cmluZ091dHB1dFwiKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdzdHJpbmdHcmlkJyxcclxuICAgICAgICBzZWxlY3RUeXBlOiAnY2VsbCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbXHJcbiAgICAgICAgICAgIHsgZmllbGQ6ICdyZWNpZCcsIGNhcHRpb246ICdSb3cgIycsIHNpemU6ICc2MHB4JyB9LFxyXG4gICAgICAgICAgICB7IGZpZWxkOiAndmFsdWUnLCBjYXB0aW9uOiAnVGV4dCcsIHNpemU6ICcxMDAlJyB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCB3aGVuIHdlIGhhdmUgYSBsaXN0IG9mIHRoZSBmaWxlcyB0byBvcmdhbml6ZSB0aGUgY2F0ZWdvcmllcy5cclxuICovXHJcbmZ1bmN0aW9uIHNpZGViYXJOb2Rlcygpe1xyXG5cclxuICAgIHZhciBwYWNrTm9kZSA9IHtcclxuICAgICAgICBpZDogJ3BhY2tHcm91cCcsIHRleHQ6ICdQYWNrIEZpbGVzJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIHZhciB0ZXh0dXJlTm9kZSA9IHtcclxuICAgICAgICBpZDogJ3RleHR1cmVHcm91cCcsIHRleHQ6ICdUZXh0dXJlIGZpbGVzJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcbiAgICBcclxuICAgIHZhciB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd1bnNvcnRlZEdyb3VwJywgdGV4dDogJ1Vuc29ydGVkJywgaW1nOiAnaWNvbi1mb2xkZXInLCBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEJ1aWxkIHNpZGViYXIgbm9kZXNcclxuICAgIGZvciAodmFyIGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIG5vZGUgPSB7aWQ6ZmlsZVR5cGUsIGltZzogXCJpY29uLWZvbGRlclwiLCBncm91cDogZmFsc2UgfTtcclxuICAgICAgICAgICAgdmFyIGlzUGFjayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZihmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSl7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge2lkOiBmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSwgdGV4dDogZmlsZVR5cGV9O1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZU5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZSA9PSAnQklOQVJJRVMnKXtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiQmluYXJpZXNcIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYoZmlsZVR5cGUgPT0gJ1NUUklOR1MnKXtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiU3RyaW5nc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSBpZihmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpe1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtpZDogZmlsZVR5cGUsIGltZzogXCJpY29uLWZvbGRlclwiLCBncm91cDogZmFsc2UsIHRleHQ6IGZpbGVUeXBlfTtcclxuICAgICAgICAgICAgICAgIHBhY2tOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGVsc2UgaWYoZmlsZVR5cGUgPT0gJ1VOS05PV04nKXtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiVW5rbm93blwiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge2lkOiBmaWxlVHlwZSwgaW1nOiBcImljb24tZm9sZGVyXCIsIGdyb3VwOiBmYWxzZSwgdGV4dDogZmlsZVR5cGV9O1xyXG4gICAgICAgICAgICAgICAgdW5zb3J0ZWROb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXHJcbiAgICAgICAgfSBcclxuICAgIH1cclxuXHJcbiAgICBpZihwYWNrTm9kZS5ub2Rlcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChwYWNrTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYodGV4dHVyZU5vZGUubm9kZXMubGVuZ3RoPjApe1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQodGV4dHVyZU5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmKHVuc29ydGVkTm9kZS5ub2Rlcy5sZW5ndGg+MCl7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh1bnNvcnRlZE5vZGUpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IHRoZSBtYWluIGFwcCB0byBjcmVhdGUgdGhlIGd1aSBsYXlvdXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBpbml0TGF5b3V0KG9uUmVhZGVyQ3JlYXRlZCkge1xyXG5cclxuICAgIG1haW5HcmlkKCk7XHJcbiAgICBzaWRlYmFyKCk7XHJcbiAgICBmaWxlQnJvd3NlcigpO1xyXG4gICAgZmlsZVZpZXcoKTtcclxuICAgIHN0cmluZ0dyaWQoKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICAgIFNFVCBVUCBUUkVFIDNEIFNDRU5FXHJcbiAgICAqL1xyXG4gICAgVXRpbHMuc2V0dXBTY2VuZSgpO1xyXG5cclxuXHJcbiAgICAvLy8gQXNrIGZvciBmaWxlXHJcbiAgICB3MnBvcHVwLm9wZW4oXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgICBzcGVlZDogMCxcclxuICAgICAgICAgICAgdGl0bGU6ICdMb2FkIEEgR1cyIGRhdCcsXHJcbiAgICAgICAgICAgIG1vZGFsOiB0cnVlLFxyXG4gICAgICAgICAgICBzaG93Q2xvc2U6IGZhbHNlLFxyXG4gICAgICAgICAgICBib2R5OiAnPGRpdiBjbGFzcz1cIncydWktY2VudGVyZWRcIj4nICtcclxuICAgICAgICAgICAgICAgICc8ZGl2IGlkPVwiZmlsZUxvYWRQcm9ncmVzc1wiIC8+JyArXHJcbiAgICAgICAgICAgICAgICAnPGlucHV0IGlkPVwiZmlsZVBpY2tlclBvcFwiIHR5cGU9XCJmaWxlXCIgLz4nICtcclxuICAgICAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxuXHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpXHJcbiAgICAgICAgLmNoYW5nZShcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBvblJlYWRlckNyZWF0ZWQsXHJcbiAgICAgICAgICAgICAgICAgICAgXCIuLi9zdGF0aWMvdDNkd29ya2VyLmpzXCIpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuICAgIFQzRC5Mb2dnZXIubG9nRnVuY3Rpb25zW1QzRC5Mb2dnZXIuVFlQRV9QUk9HUkVTU10gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAgICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlIChmaXJzdCB2aXNpdCBvbmx5KTxici8+XCIgK1xyXG4gICAgICAgICAgICBhcmd1bWVudHNbMV0gKyBcIiU8YnIvPjxici8+XCJcclxuICAgICAgICApO1xyXG4gICAgfVxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2Rlc1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG4vLyBUaGlzIGZpbGUgaXMgdGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBUeXJpYTJEIGFwcGxpY2F0aW9uXHJcblxyXG4vLy8gUmVxdWlyZXM6XHJcbmNvbnN0IExheW91dCA9IHJlcXVpcmUoJy4vbGF5b3V0Jyk7XHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9nbG9iYWxzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gb25SZWFkZXJDcmVhdGVkKCl7XHJcblxyXG4gICAgVDNELmdldEZpbGVMaXN0QXN5bmMoR2xvYmFscy5fbHIsXHJcbiAgICAgICAgZnVuY3Rpb24oZmlsZXMpe1xyXG5cclxuICAgICAgICAgICAgLy8vIFN0b3JlIGZpbGVMaXN0IGdsb2JhbGx5XHJcbiAgICAgICAgICAgIEdsb2JhbHMuX2ZpbGVMaXN0ID0gZmlsZXM7XHJcblxyXG4gICAgICAgICAgICBMYXlvdXQuc2lkZWJhck5vZGVzKCk7XHJcblxyXG4gICAgICAgICAgICAvLy8gQ2xvc2UgdGhlIHBvcFxyXG4gICAgICAgICAgICB3MnBvcHVwLmNsb3NlKCk7XHJcblxyXG4gICAgICAgICAgICAvLy8gU2VsZWN0IHRoZSBcIkFsbFwiIGNhdGVnb3J5XHJcbiAgICAgICAgICAgIHcydWkuc2lkZWJhci5jbGljayhcIkFsbFwiKTtcclxuXHJcbiAgICAgICAgfSAvLy8gRW5kIHJlYWRGaWxlTGlzdEFzeW5jIGNhbGxiYWNrXHJcbiAgICApO1xyXG4gICAgXHJcbn1cclxuXHJcbkxheW91dC5pbml0TGF5b3V0KG9uUmVhZGVyQ3JlYXRlZCk7IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vZ2xvYmFscycpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKXtcclxuXHJcbiAgICAvLy8gR2V0IGxhc3QgbG9hZGVkIGZpbGVJZFx0XHRcclxuICAgIHZhciBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQ7XHJcblxyXG4gICAgLy8vIFJ1biBUM0QgaGFja2VkIHZlcnNpb24gb2YgT0JKRXhwb3J0ZXJcclxuICAgIHZhciByZXN1bHQgPSBuZXcgVEhSRUUuT0JKRXhwb3J0ZXIoKS5wYXJzZSggR2xvYmFscy5fc2NlbmUsIGZpbGVJZCk7XHJcblxyXG4gICAgLy8vIFJlc3VsdCBsaXN0cyB3aGF0IGZpbGUgaWRzIGFyZSB1c2VkIGZvciB0ZXh0dXJlcy5cclxuICAgIHZhciB0ZXhJZHMgPSByZXN1bHQudGV4dHVyZUlkcztcclxuXHJcbiAgICAvLy8gU2V0IHVwIHZlcnkgYmFzaWMgbWF0ZXJpYWwgZmlsZSByZWZlcmluZyB0aGUgdGV4dHVyZSBwbmdzXHJcbiAgICAvLy8gcG5ncyBhcmUgZ2VuZXJhdGVkIGEgZmV3IGxpbmVzIGRvd24uXHJcbiAgICB2YXIgbXRsU291cmNlID1cIlwiO1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24odGV4SWQpe1xyXG4gICAgICAgIG10bFNvdXJjZSArPVwibmV3bXRsIHRleF9cIit0ZXhJZCtcIlxcblwiK1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBcIiAgbWFwX0thIHRleF9cIit0ZXhJZCtcIi5wbmdcXG5cIitcclxuICAgICAgICAgICAgICAgICAgICAgICAgXCIgIG1hcF9LZCB0ZXhfXCIrdGV4SWQrXCIucG5nXFxuXFxuXCI7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgb2JqXHJcbiAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyZXN1bHQub2JqXSwge3R5cGU6IFwib2N0ZXQvc3RyZWFtXCJ9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsXCJleHBvcnQuXCIrZmlsZUlkK1wiLm9ialwiKTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgbXRsXHJcbiAgICBibG9iID0gbmV3IEJsb2IoW210bFNvdXJjZV0sIHt0eXBlOiBcIm9jdGV0L3N0cmVhbVwifSk7XHJcbiAgICBzYXZlRGF0YShibG9iLFwiZXhwb3J0LlwiK2ZpbGVJZCtcIi5tdGxcIik7XHJcbiAgICBcclxuICAgIC8vLyBEb3dubG9hZCB0ZXh0dXJlIHBuZ3NcclxuICAgIHRleElkcy5mb3JFYWNoKGZ1bmN0aW9uKHRleElkKXtcclxuXHJcbiAgICAgICAgLy8vIExvY2FsUmVhZGVyIHdpbGwgaGF2ZSB0byByZS1sb2FkIHRoZSB0ZXh0dXJlcywgZG9uJ3Qgd2FudCB0byBmZXRjaFxyXG4gICAgICAgIC8vLyB0aGVuIGZyb20gdGhlIG1vZGVsIGRhdGEuLlxyXG4gICAgICAgIEdsb2JhbHMuX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24oaW5mbGF0ZWREYXRhLCBkeHRUeXBlLCBpbWFnZVdpZHRoLCBpbWFnZUhlaWd0aCl7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUganMgaW1hZ2UgdXNpbmcgcmV0dXJuZWQgYml0bWFwIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YSAgIDogbmV3IFVpbnQ4QXJyYXkoaW5mbGF0ZWREYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aCAgOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodCA6IGltYWdlSGVpZ3RoXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBOZWVkIGEgY2FudmFzIGluIG9yZGVyIHRvIGRyYXdcclxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcyAvPlwiKTtcclxuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChjYW52YXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9ICBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSAgaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcdFx0ICAgICAgICBcdFxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwwLDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgb3V0cHV0IGltYWdlIGRhdGEgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gY3R4LmNyZWF0ZUltYWdlRGF0YShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCwgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG4gICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvLy8gTG9vcCBwaXhlbHNcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSAxOyB5IDwgaC0xOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHctMTsgeCArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSp3ICsgeCkqNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoIChoLXkpKncgKyB4KSo0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaStjXSA9IGlucHV0RGF0YVtmbGlwK2NdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbihwbmdCbG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVEYXRhKCBwbmdCbG9iLCBcInRleF9cIit0ZXhJZCtcIi5wbmdcIiApO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuICAgICAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG4gICAgICAgIFxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkgeyAgICAgICAgXHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuXHJcblxyXG4vLy8gU2V0dGluZyB1cCBhIHNjZW5lLCBUcmVlLmpzIHN0YW5kYXJkIHN0dWZmLi4uXHJcbmZ1bmN0aW9uIHNldHVwU2NlbmUoKXtcclxuXHJcbiAgICB2YXIgY2FudmFzV2lkdGggPSAkKFwiI21vZGVsT3V0cHV0XCIpLndpZHRoKCk7XHJcbiAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuICAgIHZhciBjYW52YXNDbGVhckNvbG9yID0gMHgzNDI5MjA7IC8vIEZvciBoYXBweSByZW5kZXJpbmcsIGFsd2F5cyB1c2UgVmFuIER5a2UgQnJvd24uXHJcbiAgICB2YXIgZm92ID0gNjA7XHJcbiAgICB2YXIgYXNwZWN0ID0gMTtcclxuICAgIHZhciBuZWFyID0gMC4xO1xyXG4gICAgdmFyIGZhciA9IDUwMDAwMDtcclxuXHJcbiAgICBHbG9iYWxzLl9jYW1lcmEgPSBuZXcgVEhSRUUuUGVyc3BlY3RpdmVDYW1lcmEoZm92LCBhc3BlY3QsIG5lYXIsIGZhcik7XHJcblxyXG4gICAgR2xvYmFscy5fc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcclxuXHJcbiAgICAvLy8gVGhpcyBzY2VuZSBoYXMgb25lIGFtYmllbnQgbGlnaHQgc291cmNlIGFuZCB0aHJlZSBkaXJlY3Rpb25hbCBsaWdodHNcclxuICAgIHZhciBhbWJpZW50TGlnaHQgPSBuZXcgVEhSRUUuQW1iaWVudExpZ2h0KCAweDU1NTU1NSApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKCBhbWJpZW50TGlnaHQgKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIC44ICk7XHJcbiAgICBkaXJlY3Rpb25hbExpZ2h0MS5wb3NpdGlvbi5zZXQoIDAsIDAsIDEgKTtcclxuICAgIEdsb2JhbHMuX3NjZW5lLmFkZCggZGlyZWN0aW9uYWxMaWdodDEgKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCggMHhmZmZmZmYsIC44KTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQyLnBvc2l0aW9uLnNldCggMSwgMCwgMCApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKCBkaXJlY3Rpb25hbExpZ2h0MiApO1xyXG5cclxuICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MyA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KCAweGZmZmZmZiwgLjggKTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQzLnBvc2l0aW9uLnNldCggMCwgMSwgMCApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKCBkaXJlY3Rpb25hbExpZ2h0MyApO1xyXG4gICAgXHJcbiAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7YW50aWFsaWFzaW5nOiB0cnVlfSk7XHJcbiAgICAkKFwiI21vZGVsT3V0cHV0XCIpWzBdLmFwcGVuZENoaWxkKEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgXHJcbiAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRTaXplKCBjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0ICk7XHJcbiAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRDbGVhckNvbG9yKCBjYW52YXNDbGVhckNvbG9yICk7XHJcblxyXG4gICAgLy8vIEFkZCBUSFJFRSBvcmJpdCBjb250cm9scywgZm9yIHNpbXBsZSBvcmJpdGluZywgcGFubmluZyBhbmQgem9vbWluZ1xyXG4gICAgR2xvYmFscy5fY29udHJvbHMgPSBuZXcgVEhSRUUuT3JiaXRDb250cm9scyggR2xvYmFscy5fY2FtZXJhLCBHbG9iYWxzLl9yZW5kZXJlci5kb21FbGVtZW50ICk7XHJcbiAgICBHbG9iYWxzLl9jb250cm9scy5lbmFibGVab29tID0gdHJ1ZTsgICAgIFxyXG5cclxuICAgIC8vLyBTZW1zIHcydWkgZGVsYXlzIHJlc2l6aW5nIDovXHJcbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uKCl7c2V0VGltZW91dChvbkNhbnZhc1Jlc2l6ZSwxMCl9KTtcclxuXHJcbiAgICAvLy8gTm90ZTogY29uc3RhbnQgY29udGlub3VzIHJlbmRlcmluZyBmcm9tIHBhZ2UgbG9hZCBldmVudCwgbm90IHZlcnkgb3B0LlxyXG4gICAgcmVuZGVyKCk7XHJcbn1cclxuXHJcblxyXG5mdW5jdGlvbiBvbkNhbnZhc1Jlc2l6ZSgpe1xyXG4gICAgXHJcbiAgICB2YXIgc2NlbmVXaWR0aCA9ICQoXCIjbW9kZWxPdXRwdXRcIikud2lkdGgoKTtcclxuICAgIHZhciBzY2VuZUhlaWdodCA9ICQoXCIjbW9kZWxPdXRwdXRcIikuaGVpZ2h0KCk7XHJcblxyXG4gICAgaWYoIXNjZW5lSGVpZ2h0IHx8ICFzY2VuZVdpZHRoKVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICBHbG9iYWxzLl9jYW1lcmEuYXNwZWN0ID0gc2NlbmVXaWR0aCAvIHNjZW5lSGVpZ2h0O1xyXG5cclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoc2NlbmVXaWR0aCwgc2NlbmVIZWlnaHQpO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XHJcbn1cclxuXHJcbi8vLyBSZW5kZXIgbG9vcCwgbm8gZ2FtZSBsb2dpYywganVzdCByZW5kZXJpbmcuXHJcbmZ1bmN0aW9uIHJlbmRlcigpe1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZSggcmVuZGVyICk7XHJcbiAgICBHbG9iYWxzLl9yZW5kZXJlci5yZW5kZXIoR2xvYmFscy5fc2NlbmUsIEdsb2JhbHMuX2NhbWVyYSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZXhwb3J0U2NlbmU6IGV4cG9ydFNjZW5lLFxyXG4gICAgc2F2ZURhdGE6IHNhdmVEYXRhLFxyXG4gICAgc2V0dXBTY2VuZTogc2V0dXBTY2VuZSxcclxuICAgIG9uQ2FudmFzUmVzaXplOiBvbkNhbnZhc1Jlc2l6ZSxcclxuICAgIHJlbmRlcjogcmVuZGVyXHJcbn0iXX0=
