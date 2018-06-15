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

// This file is the main entry point for the Tyria2D application

/// Requires:
const Layout = require('./Layout');
var Globals = require('./Globals');


function onReaderCreated() {

    w2popup.lock();

    $("#filePickerPop").prop('disabled', true);
    $("#fileLoadProgress").html(
        "Indexing .dat file<br/>" +
        "<br/><br/>"
    );

    setTimeout(() => {
        T3D.getFileListAsync(Globals._lr,
            function (files) {

                /// Store fileList globally
                Globals._fileList = files;

                Layout.sidebarNodes();

                /// Close the pop
                w2popup.close();

                /// Select the "All" category
                w2ui.sidebar.click("All");

            } /// End readFileListAsync callback
        );
    }, 1);

}

Layout.initLayout(onReaderCreated);

/// Overwrite progress logger
T3D.Logger.logFunctions[T3D.Logger.TYPE_PROGRESS] = function () {
    $("#fileLoadProgress").html(
        "Indexing .dat file (first visit only)<br/>" +
        arguments[1] + "%<br/><br/>"
    );
}
},{"./Globals":4,"./Layout":5}],2:[function(require,module,exports){
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

function onFilterClick(evt) {

    /// No filter if clicked group was "All"
    if (evt.target == "All") {
        showFileGroup();
    }

    /// Other events are fine to just pass
    else {
        showFileGroup([evt.target]);
    }

}

function showFileGroup(fileTypeFilter) {

    w2ui.grid.records = [];

    let reverseTable = Globals._lr.getReverseIndex();

    for (var fileType in Globals._fileList) {

        /// Only show types we've asked for
        if (fileTypeFilter && fileTypeFilter.indexOf(fileType) < 0) {

            /// Special case for "packGroup"
            /// Should let trough all pack types
            /// Should NOT let trought any non-pack types
            /// i.e. Strings, Binaries etc
            if (fileTypeFilter.indexOf("packGroup") >= 0) {
                if (!fileType.startsWith("PF")) {
                    continue;
                }
            } else if (fileTypeFilter.indexOf("textureGroup") >= 0) {
                if (!fileType.startsWith("TEXTURE")) {
                    continue;
                }
            } else {
                continue;
            }

        }

        if (Globals._fileList.hasOwnProperty(fileType)) {

            var fileArr = Globals._fileList[fileType];
            fileArr.forEach(
                function (mftIndex) {

                    let meta = Globals._lr.getFileMeta(mftIndex);

                    var baseIds = reverseTable[mftIndex];
                    var fileSize = (meta) ? meta.size : "";

                    if (fileSize > 0 && mftIndex > 15) {

                        w2ui['grid'].records.push({
                            recid: mftIndex, /// MFT index
                            baseIds: baseIds,
                            type: fileType,
                            fileSize: fileSize
                        });

                    }

                    mftIndex++;
                } /// End for each mft in this file type
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
},{"./Globals":4}],3:[function(require,module,exports){
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

    /// Run the basic DataRenderer, handles all sorts of files for us.
    T3D.runRenderer(
        T3D.DataRenderer,
        Globals._lr, {
            id: fileId
        },
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

module.exports = {
    viewFileByMFT: viewFileByMFT,
    viewFileByFileId: viewFileByFileId,
}
},{"./Globals":4,"./Utils":6}],4:[function(require,module,exports){
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
},{}],5:[function(require,module,exports){
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

const FileViewer = require('./Fileviewer');
const FileGrid = require('./Filegrid');
const Utils = require('./Utils');

var Globals = require('./Globals');


var onReaderCallback;

/**
 * Setup main grid
 */
function mainGrid() {
    const pstyle = 'border: 1px solid #dfdfdf; padding: 0;';

    $('#layout').w2layout({
        name: 'layout',
        panels: [{
                type: 'top',
                size: 28,
                resizable: false,
                style: pstyle + ' padding-top: 1px;'
            }, {
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
                    items: [{
                        type: 'html',
                        id: 'contextToolbar',
                        html: '<div class="toolbarEntry" id="contextToolbar"></div>'
                    }],
                    onClick: function (event) {
                        this.owner.content('main', event);
                    }
                }
            }
        ],
        onResize: Utils.onCanvasResize
    });

    $("#fileIdInputBtn").click(
        function () {
            FileViewer.viewFileByFileId($("#fileIdInput").val());
        }
    )


    /// Grid inside main left
    $().w2layout({
        name: 'leftLayout',
        panels: [{
                type: 'left',
                size: 150,
                resizable: true,
                style: pstyle,
                content: 'left'
            },
            {
                type: 'main',
                size: 420,
                resizable: true,
                style: pstyle,
                content: 'right'
            }
        ]
    });
    w2ui['layout'].content('left', w2ui['leftLayout']);
}

/**
 * Setup toolbar
 */
function toolbar() {
    $().w2toolbar({
        name: 'toolbar',
        items: [{
                type: 'button',
                id: 'loadFile',
                caption: 'Open file',
                img: 'icon-folder'
            },
            {
                type: 'break'
            },
            {
                type: 'menu',
                id: 'view',
                caption: 'View',
                img: 'icon-page',
                items: [{
                        text: 'Hide file list',
                        img: 'icon-page',
                    },
                    {
                        text: 'Hide file categories',
                        img: 'icon-page',
                    },
                    {
                        text: 'Hide file preview',
                        img: 'icon-page',
                    }
                ]
            },
            {
                type: 'break'
            },
            {
                type: 'menu',
                id: 'tools',
                caption: 'Tools',
                img: 'icon-page',
                items: [{
                    text: 'View cntc summary',
                    img: 'icon-page',
                }]

            },
            {
                type: 'break'
            },
            {
                type: 'menu',
                id: 'openentry',
                img: 'icon-search',
                caption: 'Open entry',
                items: [{
                        text: 'BaseID',
                        img: 'icon-search',
                    },
                    {
                        text: 'MFT ID',
                        img: 'icon-search',
                    }
                ]
            },
            {
                type: 'spacer'
            },
            {
                type: 'button',
                id: 'mentions',
                caption: 'Tyria2D',
                img: 'icon-page'
            }
        ],
        onClick: function (event) {
            switch (event.target) {
                case 'loadFile':
                    openFilePopup();
                    break;
            }
        }
    });

    w2ui['layout'].content('top', w2ui['toolbar']);
}

/**
 * Setup sidebar
 */
function sidebar() {
    /*
        SIDEBAR
    */
    w2ui['leftLayout'].content('left', $().w2sidebar({
        name: 'sidebar',
        img: null,
        nodes: [{
            id: 'All',
            text: 'All',
            img: 'icon-folder',
            group: false
        }],
        onClick: FileGrid.onFilterClick
    }));
}

/**
 * Setup filebrowser
 */
function fileBrowser() {
    w2ui['leftLayout'].content('main', $().w2grid({
        name: 'grid',
        show: {
            toolbar: true,
            toolbarSearch: false,
            toolbarReload: false,
            footer: true,
        },
        columns: [{
                field: 'recid',
                caption: 'MFT index',
                size: '80px',
                sortable: false,
                resizable: true,
                //searchable: 'int'
            },
            {
                field: 'baseIds',
                caption: 'BaseId list',
                size: '100%',
                sortable: false,
                resizable: true,
                //searchable: true
            },
            {
                field: 'type',
                caption: 'Type',
                size: '100px',
                resizable: true,
                sortable: false
            },
            {
                field: 'fileSize',
                caption: 'Pack Size',
                size: '85px',
                resizable: true,
                sortable: false
            }
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
        tabs: [{
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

function stringGrid() {
    /// Set up grid for strings view
    ///Create grid
    $("#stringOutput").w2grid({
        name: 'stringGrid',
        selectType: 'cell',
        show: {
            toolbar: true,
            footer: true,
        },
        columns: [{
                field: 'recid',
                caption: 'Row #',
                size: '60px'
            },
            {
                field: 'value',
                caption: 'Text',
                size: '100%'
            }
        ]
    });
}

/**
 * This function is called when we have a list of the files to organize the categories.
 */
function sidebarNodes() {

    //Clear sidebar if already set up
    for (let element of w2ui['sidebar'].nodes) {
        if (element.id != 'All') {
            w2ui['sidebar'].nodes.splice(
                w2ui['sidebar'].nodes.indexOf(element.id),
                1
            );
        }
    }
    w2ui['sidebar'].refresh();

    //Regenerate    

    let packNode = {
        id: 'packGroup',
        text: 'Pack Files',
        img: 'icon-folder',
        group: false,
        nodes: []
    };

    let textureNode = {
        id: 'textureGroup',
        text: 'Texture files',
        img: 'icon-folder',
        group: false,
        nodes: []
    }

    let unsortedNode = {
        id: 'unsortedGroup',
        text: 'Unsorted',
        img: 'icon-folder',
        group: false,
        nodes: []
    }

    /// Build sidebar nodes
    for (let fileType in Globals._fileList) {
        if (Globals._fileList.hasOwnProperty(fileType)) {

            let node = {
                id: fileType,
                img: "icon-folder",
                group: false
            };
            let isPack = false;
            if (fileType.startsWith("TEXTURE")) {
                node = {
                    id: fileType,
                    img: "icon-folder",
                    group: false,
                    text: fileType
                };
                textureNode.nodes.push(node);
            } else if (fileType == 'BINARIES') {
                node.text = "Binaries";
                w2ui.sidebar.add(node);
            } else if (fileType == 'STRINGS') {
                node.text = "Strings";
                w2ui.sidebar.add(node);
            } else if (fileType.startsWith("PF")) {
                node = {
                    id: fileType,
                    img: "icon-folder",
                    group: false,
                    text: fileType
                };
                packNode.nodes.push(node);
            } else if (fileType == 'UNKNOWN') {
                node.text = "Unknown";
                w2ui.sidebar.add(node);
            } else {
                node = {
                    id: fileType,
                    img: "icon-folder",
                    group: false,
                    text: fileType
                };
                unsortedNode.nodes.push(node);
            }

        }
    }

    if (packNode.nodes.length > 0) {
        w2ui.sidebar.add(packNode);
    }

    if (textureNode.nodes.length > 0) {
        w2ui.sidebar.add(textureNode);
    }

    if (unsortedNode.nodes.length > 0) {
        w2ui.sidebar.add(unsortedNode);
    }

}

function openFilePopup() {
    /// Ask for file
    w2popup.open({
        speed: 0,
        title: 'Load A GW2 dat',
        modal: true,
        showClose: false,
        body: '<div class="w2ui-centered">' +
            '<div id="fileLoadProgress" />' +
            '<input id="filePickerPop" type="file" />' +
            '</div>'
    });


    $("#filePickerPop")
        .change(
            function (evt) {
                Globals._lr = T3D.getLocalReader(
                    evt.target.files[0],
                    onReaderCallback,
                    "../static/t3dworker.js");
            }
        );
}

/**
 * This function is called by the main app to create the gui layout.
 */
function initLayout(onReaderCreated) {

    onReaderCallback = onReaderCreated;

    mainGrid();
    toolbar();
    sidebar();
    fileBrowser();
    fileView();
    stringGrid();

    /*
        SET UP TREE 3D SCENE
    */
    Utils.setupScene();

    openFilePopup();

}

module.exports = {
    initLayout: initLayout,
    sidebarNodes: sidebarNodes,
}
},{"./Filegrid":2,"./Fileviewer":3,"./Globals":4,"./Utils":6}],6:[function(require,module,exports){
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

/// Exports current model as an .obj file with a .mtl refering .png textures.
function exportScene() {

    /// Get last loaded fileId		
    var fileId = Globals._fileId;

    /// Run T3D hacked version of OBJExporter
    var result = new THREE.OBJExporter().parse(Globals._scene, fileId);

    /// Result lists what file ids are used for textures.
    var texIds = result.textureIds;

    /// Set up very basic material file refering the texture pngs
    /// pngs are generated a few lines down.
    var mtlSource = "";
    texIds.forEach(function (texId) {
        mtlSource += "newmtl tex_" + texId + "\n" +
            "  map_Ka tex_" + texId + ".png\n" +
            "  map_Kd tex_" + texId + ".png\n\n";
    });

    /// Download obj
    var blob = new Blob([result.obj], {
        type: "octet/stream"
    });
    saveData(blob, "export." + fileId + ".obj");

    /// Download mtl
    blob = new Blob([mtlSource], {
        type: "octet/stream"
    });
    saveData(blob, "export." + fileId + ".mtl");

    /// Download texture pngs
    texIds.forEach(function (texId) {

        /// LocalReader will have to re-load the textures, don't want to fetch
        /// then from the model data..
        Globals._lr.loadTextureFile(texId,
            function (inflatedData, dxtType, imageWidth, imageHeigth) {

                /// Create js image using returned bitmap data.
                var image = {
                    data: new Uint8Array(inflatedData),
                    width: imageWidth,
                    height: imageHeigth
                };

                /// Need a canvas in order to draw
                var canvas = $("<canvas />");
                $("body").append(canvas);

                canvas[0].width = image.width;
                canvas[0].height = image.height;

                var ctx = canvas[0].getContext("2d");

                /// Draw raw bitmap to canvas
                var uica = new Uint8ClampedArray(image.data);
                var imagedata = new ImageData(uica, image.width, image.height);
                ctx.putImageData(imagedata, 0, 0);

                /// This is where shit gets stupid. Flipping raw bitmaps in js
                /// is apparently a pain. Basicly read current state pixel by pixel
                /// and write it back with flipped y-axis 
                var input = ctx.getImageData(0, 0, image.width, image.height);

                /// Create output image data buffer
                var output = ctx.createImageData(image.width, image.height);

                /// Get imagedata size
                var w = input.width,
                    h = input.height;
                var inputData = input.data;
                var outputData = output.data

                /// Loop pixels
                for (var y = 1; y < h - 1; y += 1) {
                    for (var x = 1; x < w - 1; x += 1) {

                        /// Input linear coordinate
                        var i = (y * w + x) * 4;

                        /// Output linear coordinate
                        var flip = ((h - y) * w + x) * 4;

                        /// Read and write RGBA
                        /// TODO: Perhaps put alpha to 100%
                        for (var c = 0; c < 4; c += 1) {
                            outputData[i + c] = inputData[flip + c];
                        }
                    }
                }

                /// Write back flipped data
                ctx.putImageData(output, 0, 0);

                /// Fetch canvas data as png and download.
                canvas[0].toBlob(
                    function (pngBlob) {
                        saveData(pngBlob, "tex_" + texId + ".png");
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
function setupScene() {

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
    var ambientLight = new THREE.AmbientLight(0x555555);
    Globals._scene.add(ambientLight);

    var directionalLight1 = new THREE.DirectionalLight(0xffffff, .8);
    directionalLight1.position.set(0, 0, 1);
    Globals._scene.add(directionalLight1);

    var directionalLight2 = new THREE.DirectionalLight(0xffffff, .8);
    directionalLight2.position.set(1, 0, 0);
    Globals._scene.add(directionalLight2);

    var directionalLight3 = new THREE.DirectionalLight(0xffffff, .8);
    directionalLight3.position.set(0, 1, 0);
    Globals._scene.add(directionalLight3);

    /// Standard THREE renderer with AA
    Globals._renderer = new THREE.WebGLRenderer({
        antialiasing: true
    });
    $("#modelOutput")[0].appendChild(Globals._renderer.domElement);

    Globals._renderer.setSize(canvasWidth, canvasHeight);
    Globals._renderer.setClearColor(canvasClearColor);

    /// Add THREE orbit controls, for simple orbiting, panning and zooming
    Globals._controls = new THREE.OrbitControls(Globals._camera, Globals._renderer.domElement);
    Globals._controls.enableZoom = true;

    /// Sems w2ui delays resizing :/
    $(window).resize(function () {
        setTimeout(onCanvasResize, 10)
    });

    /// Note: constant continous rendering from page load event, not very opt.
    render();
}


function onCanvasResize() {

    var sceneWidth = $("#modelOutput").width();
    var sceneHeight = $("#modelOutput").height();

    if (!sceneHeight || !sceneWidth)
        return;

    Globals._camera.aspect = sceneWidth / sceneHeight;

    Globals._renderer.setSize(sceneWidth, sceneHeight);

    Globals._camera.updateProjectionMatrix();
}

/// Render loop, no game logic, just rendering.
function render() {
    window.requestAnimationFrame(render);
    Globals._renderer.render(Globals._scene, Globals._camera);
}

module.exports = {
    exportScene: exportScene,
    saveData: saveData,
    setupScene: setupScene,
    onCanvasResize: onCanvasResize,
    render: render
}
},{"./Globals":4}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pXQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcGlCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG4vLyBUaGlzIGZpbGUgaXMgdGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBUeXJpYTJEIGFwcGxpY2F0aW9uXHJcblxyXG4vLy8gUmVxdWlyZXM6XHJcbmNvbnN0IExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0Jyk7XHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gb25SZWFkZXJDcmVhdGVkKCkge1xyXG5cclxuICAgIHcycG9wdXAubG9jaygpO1xyXG5cclxuICAgICQoXCIjZmlsZVBpY2tlclBvcFwiKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGU8YnIvPlwiICtcclxuICAgICAgICBcIjxici8+PGJyLz5cIlxyXG4gICAgKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBUM0QuZ2V0RmlsZUxpc3RBc3luYyhHbG9iYWxzLl9scixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGZpbGVzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFN0b3JlIGZpbGVMaXN0IGdsb2JhbGx5XHJcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9maWxlTGlzdCA9IGZpbGVzO1xyXG5cclxuICAgICAgICAgICAgICAgIExheW91dC5zaWRlYmFyTm9kZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ2xvc2UgdGhlIHBvcFxyXG4gICAgICAgICAgICAgICAgdzJwb3B1cC5jbG9zZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBTZWxlY3QgdGhlIFwiQWxsXCIgY2F0ZWdvcnlcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5jbGljayhcIkFsbFwiKTtcclxuXHJcbiAgICAgICAgICAgIH0gLy8vIEVuZCByZWFkRmlsZUxpc3RBc3luYyBjYWxsYmFja1xyXG4gICAgICAgICk7XHJcbiAgICB9LCAxKTtcclxuXHJcbn1cclxuXHJcbkxheW91dC5pbml0TGF5b3V0KG9uUmVhZGVyQ3JlYXRlZCk7XHJcblxyXG4vLy8gT3ZlcndyaXRlIHByb2dyZXNzIGxvZ2dlclxyXG5UM0QuTG9nZ2VyLmxvZ0Z1bmN0aW9uc1tUM0QuTG9nZ2VyLlRZUEVfUFJPR1JFU1NdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGUgKGZpcnN0IHZpc2l0IG9ubHkpPGJyLz5cIiArXHJcbiAgICAgICAgYXJndW1lbnRzWzFdICsgXCIlPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuZnVuY3Rpb24gb25GaWx0ZXJDbGljayhldnQpIHtcclxuXHJcbiAgICAvLy8gTm8gZmlsdGVyIGlmIGNsaWNrZWQgZ3JvdXAgd2FzIFwiQWxsXCJcclxuICAgIGlmIChldnQudGFyZ2V0ID09IFwiQWxsXCIpIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpIHtcclxuXHJcbiAgICB3MnVpLmdyaWQucmVjb3JkcyA9IFtdO1xyXG5cclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG5cclxuICAgICAgICAvLy8gT25seSBzaG93IHR5cGVzIHdlJ3ZlIGFza2VkIGZvclxyXG4gICAgICAgIGlmIChmaWxlVHlwZUZpbHRlciAmJiBmaWxlVHlwZUZpbHRlci5pbmRleE9mKGZpbGVUeXBlKSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNhc2UgZm9yIFwicGFja0dyb3VwXCJcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBsZXQgdHJvdWdoIGFsbCBwYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgTk9UIGxldCB0cm91Z2h0IGFueSBub24tcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gaS5lLiBTdHJpbmdzLCBCaW5hcmllcyBldGNcclxuICAgICAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoXCJwYWNrR3JvdXBcIikgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwidGV4dHVyZUdyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGVBcnIgPSBHbG9iYWxzLl9maWxlTGlzdFtmaWxlVHlwZV07XHJcbiAgICAgICAgICAgIGZpbGVBcnIuZm9yRWFjaChcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChtZnRJbmRleCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IEdsb2JhbHMuX2xyLmdldEZpbGVNZXRhKG1mdEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VJZHMgPSByZXZlcnNlVGFibGVbbWZ0SW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IChtZXRhKSA/IG1ldGEuc2l6ZSA6IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlU2l6ZSA+IDAgJiYgbWZ0SW5kZXggPiAxNSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJ1aVsnZ3JpZCddLnJlY29yZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpZDogbWZ0SW5kZXgsIC8vLyBNRlQgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZHM6IGJhc2VJZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZnRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfSAvLy8gRW5kIGZvciBlYWNoIG1mdCBpbiB0aGlzIGZpbGUgdHlwZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgaWYgX2ZpbGVMaXN0W2ZpbGV0eXBlXVxyXG5cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2ssXHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcclxuXHJcbmZ1bmN0aW9uIHZpZXdGaWxlQnlNRlQobWZ0SWR4KSB7XHJcbiAgICBsZXQgcmV2ZXJzZVRhYmxlID0gR2xvYmFscy5fbHIuZ2V0UmV2ZXJzZUluZGV4KCk7XHJcblxyXG4gICAgdmFyIGJhc2VJZCA9IChyZXZlcnNlVGFibGVbbWZ0SWR4XSkgPyByZXZlcnNlVGFibGVbbWZ0SWR4XVswXSA6IFwiXCI7XHJcblxyXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xyXG59XHJcblxyXG5mdW5jdGlvbiB2aWV3RmlsZUJ5RmlsZUlkKGZpbGVJZCkge1xyXG5cclxuICAgIC8vLyBDbGVhbiBvdXRwdXRzXHJcbiAgICAkKFwiLnRhYk91dHB1dFwiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChcIlwiKTtcclxuXHJcbiAgICAvLy8gQ2xlYW4gY29udGV4dCB0b29sYmFyXHJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmh0bWwoXCJcIik7XHJcblxyXG4gICAgLy8vIERpc2FibGUgdGFic1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJSYXcnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiUEYnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiVGV4dHVyZScpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKCd0YWJTdHJpbmcnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiTW9kZWwnKTtcclxuICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSgndGFiU291bmQnKTtcclxuXHJcbiAgICAvLy8gUmVtb3ZlIG9sZCBtb2RlbHMgZnJvbSB0aGUgc2NlbmVcclxuICAgIGlmIChHbG9iYWxzLl9tb2RlbHMpIHtcclxuICAgICAgICBHbG9iYWxzLl9tb2RlbHMuZm9yRWFjaChmdW5jdGlvbiAobWRsKSB7XHJcbiAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLnJlbW92ZShtZGwpO1xyXG4gICAgICAgIH0pO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgX2NvbnRleHQgaXMgY2xlYW5cclxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHRoZSBiYXNpYyBEYXRhUmVuZGVyZXIsIGhhbmRsZXMgYWxsIHNvcnRzIG9mIGZpbGVzIGZvciB1cy5cclxuICAgIFQzRC5ydW5SZW5kZXJlcihcclxuICAgICAgICBUM0QuRGF0YVJlbmRlcmVyLFxyXG4gICAgICAgIEdsb2JhbHMuX2xyLCB7XHJcbiAgICAgICAgICAgIGlkOiBmaWxlSWRcclxuICAgICAgICB9LFxyXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXHJcbiAgICAgICAgb25CYXNpY1JlbmRlcmVyRG9uZVxyXG4gICAgKTtcclxufVxyXG5cclxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpIHtcclxuXHJcbiAgICAvLy8gUmVhZCByZW5kZXIgb3V0cHV0IGZyb20gX2NvbnRleHQgVk9cclxuICAgIHZhciBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xyXG5cclxuICAgIHZhciByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XHJcblxyXG4gICAgdmFyIHJhdyA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdTdHJpbmdcIik7XHJcblxyXG4gICAgdmFyIHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XHJcblxyXG4gICAgdmFyIGltYWdlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImltYWdlXCIpO1xyXG5cclxuXHJcbiAgICB2YXIgZmNjID0gcmF3LnN1YnN0cmluZygwLCA0KTtcclxuXHJcbiAgICAvLy8gVXBkYXRlIG1haW4gaGVhZGVyIHRvIHNob3cgZmlsZW5hbWVcclxuXHJcbiAgICB2YXIgZmlsZU5hbWUgPSBmaWxlSWQgKyAoaW1hZ2UgfHwgIXBhY2tmaWxlID8gXCIuXCIgKyBmY2MgOiBcIi5cIiArIHBhY2tmaWxlLmhlYWRlci50eXBlKTtcclxuICAgICQoXCIjZmlsZVRpdGxlXCIpLmh0bWwoZmlsZU5hbWUpO1xyXG5cclxuICAgIC8vLyBVcGRhdGUgcmF3IHZpZXcgYW5kIGVuYWJsZSB0YWJcclxuICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKCd0YWJSYXcnKTtcclxuXHJcblxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxyXG4gICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIHJhdzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAuY2xpY2soXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmF3RGF0YV0sIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxyXG4gICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsIGZpbGVOYW1lICsgXCIucmF3XCIpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG5cclxuICAgICQoXCIjcmF3T3V0cHV0XCIpXHJcbiAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgJChcIjxkaXY+XCIpLnRleHQocmF3KVxyXG4gICAgICAgIClcclxuXHJcblxyXG4gICAgLy8vIFRleHR1cmUgZmlsZVxyXG4gICAgaWYgKGltYWdlKSB7XHJcblxyXG4gICAgICAgIC8vLyBTZWxlY3QgdGV4dHVyZSB0YWJcclxuICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSgndGFiVGV4dHVyZScpO1xyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soJ3RhYlRleHR1cmUnKTtcclxuXHJcbiAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xyXG4gICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcz5cIik7XHJcbiAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9IGltYWdlLmhlaWdodDtcclxuICAgICAgICB2YXIgY3R4ID0gY2FudmFzWzBdLmdldENvbnRleHQoXCIyZFwiKTtcclxuICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICB2YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XHJcblxyXG4gICAgICAgICQoXCIjdGV4dHVyZU91dHB1dFwiKS5hcHBlbmQoY2FudmFzKTtcclxuICAgIH1cclxuXHJcbiAgICAvLy8gUEYgUGFjayBmaWxlXHJcbiAgICBlbHNlIGlmIChwYWNrZmlsZSkge1xyXG5cclxuICAgICAgICAvLy8gQWx3YXlzIHJlbmRlciB0aGUgcGFjayBmaWxlIGNodW5rIGRhdGFcclxuICAgICAgICBkaXNwbGF5UGFja0ZpbGUoKTtcclxuXHJcbiAgICAgICAgLy8vIEVuYWJsZSBjb3JyZXNwb25kaW5nIHRhYlxyXG4gICAgICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKCd0YWJQRicpO1xyXG5cclxuICAgICAgICAvLy8gSWYgdGhlIHBhY2sgZmlsZSB3YXMgYSBtb2RlbCwgcmVuZGVyIGl0IVxyXG4gICAgICAgIGlmIChwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSBcIk1PRExcIikge1xyXG5cclxuICAgICAgICAgICAgLy8vIFJlbmRlciBtb2RlbFxyXG4gICAgICAgICAgICByZW5kZXJGaWxlTW9kZWwoZmlsZUlkKTtcclxuICAgICAgICB9IGVsc2UgaWYgKHBhY2tmaWxlLmhlYWRlci50eXBlID09IFwiQVNORFwiKSB7XHJcblxyXG4gICAgICAgICAgICAvLy8gR2V0IGEgY2h1bmssIHRoaXMgaXMgcmVhbGx5IHRoZSBqb2Igb2YgYSByZW5kZXJlciBidXQgd2hhdGV2c1xyXG4gICAgICAgICAgICB2YXIgY2h1bmsgPSBwYWNrZmlsZS5nZXRDaHVuayhcIkFTTkRcIik7XHJcblxyXG4gICAgICAgICAgICAvLy8gRW5hYmxlIGFuZCBzZWxlY3Qgc291bmQgdGFiXHJcbiAgICAgICAgICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKCd0YWJTb3VuZCcpO1xyXG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJTb3VuZCcpO1xyXG5cclxuXHJcbiAgICAgICAgICAgIC8vLyBQcmludCBzb21lIHJhbmRvbSBkYXRhIGFib3V0IHRoaXMgc291bmRcclxuICAgICAgICAgICAgJChcIiNzb3VuZE91dHB1dFwiKVxyXG4gICAgICAgICAgICAgICAgLmh0bWwoXHJcbiAgICAgICAgICAgICAgICAgICAgXCJMZW5ndGg6IFwiICsgY2h1bmsuZGF0YS5sZW5ndGggKyBcIiBzZWNvbmRzPGJyLz5cIiArXHJcbiAgICAgICAgICAgICAgICAgICAgXCJTaXplOiBcIiArIGNodW5rLmRhdGEuYXVkaW9EYXRhLmxlbmd0aCArIFwiIGJ5dGVzXCJcclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAvLy8gRXh0cmFjdCBzb3VuZCBkYXRhXHJcblxyXG4gICAgICAgICAgICB2YXIgc291bmRVaW50QXJyYXkgPSBjaHVuay5kYXRhLmF1ZGlvRGF0YTtcclxuXHJcbiAgICAgICAgICAgICQoXCIjY29udGV4dFRvb2xiYXJcIilcclxuICAgICAgICAgICAgICAgIC5zaG93KClcclxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+RG93bmxvYWQgTVAzPC9idXR0b24+XCIpXHJcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLm1wM1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5QbGF5IE1QMzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUdsb2JhbHMuX2F1ZGlvQ29udGV4dCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gU3RvcCBwcmV2aW91cyBzb3VuZFxyXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RvcCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBuZXcgYnVmZmVyIGZvciBjdXJyZW50IHNvdW5kXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlID0gR2xvYmFscy5fYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5jb25uZWN0KEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gRGVjb2RlIGFuZCBzdGFydCBwbGF5aW5nXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiAocmVzKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5idWZmZXIgPSByZXM7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdGFydCgpO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuICAgICAgICAgICAgICAgICAgICB9KVxyXG4gICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5TdG9wIE1QMzwvYnV0dG9uPlwiKVxyXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhcclxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdG9wKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAgICAgKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAvLy8gU2VsZWN0IFBGIHRhYlxyXG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJQRicpO1xyXG4gICAgICAgIH1cclxuICAgIH0gZWxzZSBpZiAoZmNjID09IFwic3Ryc1wiKSB7XHJcblxyXG4gICAgICAgIHNob3dGaWxlU3RyaW5nKGZpbGVJZCk7XHJcblxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBFbHNlIGp1c3Qgc2hvdyByYXcgdmlld1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiUmF3Jyk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGRpc3BsYXlQYWNrRmlsZSgpIHtcclxuXHJcbiAgICB2YXIgZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcclxuICAgIHZhciBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xyXG5cclxuICAgICQoXCIjcGFja091dHB1dFwiKS5odG1sKFwiXCIpO1xyXG4gICAgJChcIiNwYWNrT3V0cHV0XCIpLmFwcGVuZCgkKFwiPGgyPkNodW5rczwvaDI+XCIpKTtcclxuXHJcbiAgICBwYWNrZmlsZS5jaHVua3MuZm9yRWFjaChmdW5jdGlvbiAoY2h1bmspIHtcclxuXHJcbiAgICAgICAgdmFyIGZpZWxkID0gJChcIjxmaWVsZHNldCAvPlwiKTtcclxuICAgICAgICB2YXIgbGVnZW5kID0gJChcIjxsZWdlbmQ+XCIgKyBjaHVuay5oZWFkZXIudHlwZSArIFwiPC9sZWdlbmQ+XCIpO1xyXG5cclxuICAgICAgICB2YXIgbG9nQnV0dG9uID0gJChcIjxidXR0b24+TG9nIENodW5rIERhdGEgdG8gQ29uc29sZTwvYnV0dG9uPlwiKTtcclxuICAgICAgICBsb2dCdXR0b24uY2xpY2soZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgXCJMb2dnaW5nXCIsIGNodW5rLmhlYWRlci50eXBlLCBcImNodW5rXCIpO1xyXG4gICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgY2h1bmsuZGF0YSk7XHJcbiAgICAgICAgfSk7XHJcblxyXG4gICAgICAgIGZpZWxkLmFwcGVuZChsZWdlbmQpO1xyXG4gICAgICAgIGZpZWxkLmFwcGVuZCgkKFwiPHA+U2l6ZTpcIiArIGNodW5rLmhlYWRlci5jaHVua0RhdGFTaXplICsgXCI8L3A+XCIpKTtcclxuICAgICAgICBmaWVsZC5hcHBlbmQobG9nQnV0dG9uKTtcclxuXHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLmFwcGVuZChmaWVsZCk7XHJcbiAgICAgICAgJChcIiNwYWNrT3V0cHV0XCIpLnNob3coKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVTdHJpbmcoZmlsZUlkKSB7XHJcblxyXG4gICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cclxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcclxuXHJcbiAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxyXG4gICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcclxuICAgICAgICBHbG9iYWxzLl9sciwge1xyXG4gICAgICAgICAgICBpZDogZmlsZUlkXHJcbiAgICAgICAgfSxcclxuICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxyXG4gICAgICAgIG9uUmVuZGVyZXJEb25lU3RyaW5nXHJcbiAgICApO1xyXG59XHJcblxyXG5mdW5jdGlvbiBvblJlbmRlcmVyRG9uZVN0cmluZygpIHtcclxuXHJcbiAgICAvLy8gUmVhZCBkYXRhIGZyb20gcmVuZGVyZXJcclxuICAgIHZhciBzdHJpbmdzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU3RyaW5nUmVuZGVyZXIsIFwic3RyaW5nc1wiLCBbXSk7XHJcblxyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMgPSBzdHJpbmdzO1xyXG5cclxuXHJcblxyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkID0gdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMubGVuZ3RoO1xyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnRvdGFsID0gdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkO1xyXG4gICAgdzJ1aS5zdHJpbmdHcmlkLnJlZnJlc2goKTtcclxuXHJcbiAgICAvLy8gU2VsZWN0IHRoaXMgdmlld1xyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYlN0cmluZycpO1xyXG4gICAgdzJ1aS5maWxlVGFicy5jbGljaygndGFiU3RyaW5nJyk7XHJcbn1cclxuXHJcblxyXG5cclxuZnVuY3Rpb24gcmVuZGVyRmlsZU1vZGVsKGZpbGVJZCkge1xyXG5cclxuICAgIC8vLyBNYWtlIHN1cmUgb3V0cHV0IGlzIGNsZWFuXHJcbiAgICBHbG9iYWxzLl9jb250ZXh0ID0ge307XHJcblxyXG4gICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcclxuICAgIFQzRC5ydW5SZW5kZXJlcihcclxuICAgICAgICBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlcixcclxuICAgICAgICBHbG9iYWxzLl9sciwge1xyXG4gICAgICAgICAgICBpZDogZmlsZUlkXHJcbiAgICAgICAgfSxcclxuICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxyXG4gICAgICAgIG9uUmVuZGVyZXJEb25lTW9kZWxcclxuICAgICk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9uUmVuZGVyZXJEb25lTW9kZWwoKSB7XHJcblxyXG4gICAgLy8vIEVuYWJsZSBhbmQgc2VsZWN0IG1vZGVsIHRhYlxyXG4gICAgdzJ1aS5maWxlVGFicy5lbmFibGUoJ3RhYk1vZGVsJyk7XHJcbiAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKCd0YWJNb2RlbCcpO1xyXG4gICAgJChcIiNtb2RlbE91dHB1dFwiKS5zaG93KCk7XHJcblxyXG4gICAgLy8vIFJlLWZpdCBjYW52YXNcclxuICAgIFV0aWxzLm9uQ2FudmFzUmVzaXplKCk7XHJcblxyXG4gICAgLy8vIEFkZCBjb250ZXh0IHRvb2xiYXIgZXhwb3J0IGJ1dHRvblxyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXHJcbiAgICAgICAgJChcIjxidXR0b24+RXhwb3J0IHNjZW5lPC9idXR0b24+XCIpXHJcbiAgICAgICAgLmNsaWNrKFV0aWxzLmV4cG9ydFNjZW5lKVxyXG4gICAgKTtcclxuXHJcbiAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xyXG4gICAgR2xvYmFscy5fbW9kZWxzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlciwgXCJtZXNoZXNcIiwgW10pO1xyXG5cclxuICAgIC8vLyBLZWVwaW5nIHRyYWNrIG9mIHRoZSBiaWdnZXN0IG1vZGVsIGZvciBsYXRlclxyXG4gICAgdmFyIGJpZ2dlc3RNZGwgPSBudWxsO1xyXG5cclxuICAgIC8vLyBBZGQgYWxsIG1vZGVscyB0byB0aGUgc2NlbmVcclxuICAgIEdsb2JhbHMuX21vZGVscy5mb3JFYWNoKGZ1bmN0aW9uIChtb2RlbCkge1xyXG5cclxuICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcclxuICAgICAgICBpZiAoIWJpZ2dlc3RNZGwgfHwgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgPCBtb2RlbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMpIHtcclxuICAgICAgICAgICAgYmlnZ2VzdE1kbCA9IG1vZGVsO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXHJcbiAgICBHbG9iYWxzLl9jb250cm9scy5yZXNldCgpO1xyXG5cclxuICAgIC8vLyBGb2N1cyBjYW1lcmEgdG8gdGhlIGJpZ2VzdCBtb2RlbCwgZG9lc24ndCB3b3JrIGdyZWF0LlxyXG4gICAgdmFyIGRpc3QgPSAoYmlnZ2VzdE1kbCAmJiBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlKSA/IGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUucmFkaXVzIC8gTWF0aC50YW4oTWF0aC5QSSAqIDYwIC8gMzYwKSA6IDEwMDtcclxuICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsIGRpc3QpO1xyXG4gICAgZGlzdCA9IE1hdGgubWluKDEwMDAsIGRpc3QpO1xyXG4gICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnpvb20gPSAxO1xyXG4gICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnggPSBkaXN0ICogTWF0aC5zcXJ0KDIpO1xyXG4gICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcclxuICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56ID0gMDtcclxuXHJcblxyXG4gICAgaWYgKGJpZ2dlc3RNZGwpXHJcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLmxvb2tBdChiaWdnZXN0TWRsLnBvc2l0aW9uKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICB2aWV3RmlsZUJ5TUZUOiB2aWV3RmlsZUJ5TUZULFxyXG4gICAgdmlld0ZpbGVCeUZpbGVJZDogdmlld0ZpbGVCeUZpbGVJZCxcclxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8vU2V0dGluZyB1cCB0aGUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIGFwcFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLy8gVDNEXG4gICAgX2xyOiB1bmRlZmluZWQsXG4gICAgX2NvbnRleHQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUlkOiB1bmRlZmluZWQsXG4gICAgX2ZpbGVMaXN0OiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvU291cmNlOiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvQ29udGV4dDogdW5kZWZpbmVkLFxuXG4gICAgLy8vIFRIUkVFXG4gICAgX3NjZW5lOiB1bmRlZmluZWQsXG4gICAgX2NhbWVyYTogdW5kZWZpbmVkLFxuICAgIF9yZW5kZXJlcjogdW5kZWZpbmVkLFxuICAgIF9tb2RlbHM6IFtdLFxuICAgIF9jb250cm9sczogdW5kZWZpbmVkLFxuXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBGaWxlVmlld2VyID0gcmVxdWlyZSgnLi9GaWxldmlld2VyJyk7XHJcbmNvbnN0IEZpbGVHcmlkID0gcmVxdWlyZSgnLi9GaWxlZ3JpZCcpO1xyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5cclxudmFyIG9uUmVhZGVyQ2FsbGJhY2s7XHJcblxyXG4vKipcclxuICogU2V0dXAgbWFpbiBncmlkXHJcbiAqL1xyXG5mdW5jdGlvbiBtYWluR3JpZCgpIHtcclxuICAgIGNvbnN0IHBzdHlsZSA9ICdib3JkZXI6IDFweCBzb2xpZCAjZGZkZmRmOyBwYWRkaW5nOiAwOyc7XHJcblxyXG4gICAgJCgnI2xheW91dCcpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnbGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndG9wJyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDI4LFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnIHBhZGRpbmctdG9wOiAxcHg7J1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA1NzAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgJ21hcmdpbjowJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWFpbicsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgXCIgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XCIsXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdiYWNrZ3JvdW5kLWNvbG9yOiNlYWVhZWE7IGhlaWdodDo0MHB4JyxcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJ2NvbnRleHRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIiBpZD1cImNvbnRleHRUb29sYmFyXCI+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyLmNvbnRlbnQoJ21haW4nLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvblJlc2l6ZTogVXRpbHMub25DYW52YXNSZXNpemVcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCIjZmlsZUlkSW5wdXRCdG5cIikuY2xpY2soXHJcbiAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlGaWxlSWQoJChcIiNmaWxlSWRJbnB1dFwiKS52YWwoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxuXHJcbiAgICAvLy8gR3JpZCBpbnNpZGUgbWFpbiBsZWZ0XHJcbiAgICAkKCkudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsZWZ0TGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAxNTAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2xlZnQnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDQyMCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAncmlnaHQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ2xlZnQnLCB3MnVpWydsZWZ0TGF5b3V0J10pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgdG9vbGJhclxyXG4gKi9cclxuZnVuY3Rpb24gdG9vbGJhcigpIHtcclxuICAgICQoKS53MnRvb2xiYXIoe1xyXG4gICAgICAgIG5hbWU6ICd0b29sYmFyJyxcclxuICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICdsb2FkRmlsZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnT3BlbiBmaWxlJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tZm9sZGVyJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAndmlldycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVmlldycsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgbGlzdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgY2F0ZWdvcmllcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgcHJldmlldycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAndG9vbHMnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1Rvb2xzJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnVmlldyBjbnRjIHN1bW1hcnknLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICB9XVxyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2JyZWFrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVudScsXHJcbiAgICAgICAgICAgICAgICBpZDogJ29wZW5lbnRyeScsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXNlYXJjaCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnT3BlbiBlbnRyeScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0Jhc2VJRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ01GVCBJRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGFjZXInXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICdtZW50aW9ucycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVHlyaWEyRCcsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG9hZEZpbGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wZW5GaWxlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ3RvcCcsIHcydWlbJ3Rvb2xiYXInXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBzaWRlYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyKCkge1xyXG4gICAgLypcclxuICAgICAgICBTSURFQkFSXHJcbiAgICAqL1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ2xlZnQnLCAkKCkudzJzaWRlYmFyKHtcclxuICAgICAgICBuYW1lOiAnc2lkZWJhcicsXHJcbiAgICAgICAgaW1nOiBudWxsLFxyXG4gICAgICAgIG5vZGVzOiBbe1xyXG4gICAgICAgICAgICBpZDogJ0FsbCcsXHJcbiAgICAgICAgICAgIHRleHQ6ICdBbGwnLFxyXG4gICAgICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIG9uQ2xpY2s6IEZpbGVHcmlkLm9uRmlsdGVyQ2xpY2tcclxuICAgIH0pKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGVicm93c2VyXHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlQnJvd3NlcigpIHtcclxuICAgIHcydWlbJ2xlZnRMYXlvdXQnXS5jb250ZW50KCdtYWluJywgJCgpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbGJhclNlYXJjaDogZmFsc2UsXHJcbiAgICAgICAgICAgIHRvb2xiYXJSZWxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbe1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZWNpZCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnTUZUIGluZGV4JyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICc4MHB4JyxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vc2VhcmNoYWJsZTogJ2ludCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdiYXNlSWRzJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdCYXNlSWQgbGlzdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAvL3NlYXJjaGFibGU6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICd0eXBlJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdUeXBlJyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICcxMDBweCcsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdmaWxlU2l6ZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUGFjayBTaXplJyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICc4NXB4JyxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5TUZUKGV2ZW50LnJlY2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlIHZpZXcgd2luZG93XHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlVmlldygpIHtcclxuICAgICQodzJ1aVsnbGF5b3V0J10uZWwoJ21haW4nKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8aDEgaWQ9J2ZpbGVUaXRsZScgLz5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdiBpZD0nZmlsZVRhYnMnIC8+XCIpKVxyXG4gICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1Jhdyc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPSdyYXdPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1BhY2snPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0ndGFiT3V0cHV0JyBpZD0ncGFja091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgIClcclxuICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNUZXh0dXJlJz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3RleHR1cmVPdXRwdXQnIC8+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgICApXHJcbiAgICAgICAgLmFwcGVuZChcclxuICAgICAgICAgICAgJChcclxuICAgICAgICAgICAgICAgIFwiPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWJzU3RyaW5nJz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgaWQ9J3N0cmluZ091dHB1dCcgLz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICAgICAgICAgIClcclxuICAgICAgICAgICAgLmhpZGUoKVxyXG4gICAgICAgIClcclxuICAgICAgICAuYXBwZW5kKFxyXG4gICAgICAgICAgICAkKFxyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYnNNb2RlbCc+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8ZGl2IGlkPSdtb2RlbE91dHB1dCcvPlwiICtcclxuICAgICAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgICAgICAgICAgKVxyXG4gICAgICAgICAgICAuaGlkZSgpXHJcbiAgICAgICAgKVxyXG4gICAgICAgIC5hcHBlbmQoXHJcbiAgICAgICAgICAgICQoXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPSdmaWxlVGFic1NvdW5kJz5cIiArXHJcbiAgICAgICAgICAgICAgICBcIjxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9J3NvdW5kT3V0cHV0Jy8+XCIgK1xyXG4gICAgICAgICAgICAgICAgXCI8L2Rpdj5cIlxyXG4gICAgICAgICAgICApXHJcbiAgICAgICAgICAgIC5oaWRlKClcclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICAgbmFtZTogJ2ZpbGVUYWJzJyxcclxuICAgICAgICBhY3RpdmU6ICd0YWJSYXcnLFxyXG4gICAgICAgIHRhYnM6IFt7XHJcbiAgICAgICAgICAgICAgICBpZDogJ3RhYlJhdycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUmF3JyxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1JhdycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6ICd0YWJQRicsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUGFjayBGaWxlJyxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1BhY2snKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiAndGFiVGV4dHVyZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVGV4dHVyZScsXHJcbiAgICAgICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcclxuICAgICAgICAgICAgICAgICAgICAkKCcjZmlsZVRhYnNUZXh0dXJlJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBpZDogJ3RhYlN0cmluZycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnU3RyaW5nJyxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1N0cmluZycpLnNob3coKTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgaWQ6ICd0YWJNb2RlbCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnTW9kZWwnLFxyXG4gICAgICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgJCgnI2ZpbGVUYWJzTW9kZWwnKS5zaG93KCk7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGlkOiAndGFiU291bmQnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1NvdW5kJyxcclxuICAgICAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgICQoJyNmaWxlVGFic1NvdW5kJykuc2hvdygpO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0dyaWQoKSB7XHJcbiAgICAvLy8gU2V0IHVwIGdyaWQgZm9yIHN0cmluZ3Mgdmlld1xyXG4gICAgLy8vQ3JlYXRlIGdyaWRcclxuICAgICQoXCIjc3RyaW5nT3V0cHV0XCIpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ3N0cmluZ0dyaWQnLFxyXG4gICAgICAgIHNlbGVjdFR5cGU6ICdjZWxsJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFt7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3JlY2lkJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdSb3cgIycsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnNjBweCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICd2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVGV4dCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBoYXZlIGEgbGlzdCBvZiB0aGUgZmlsZXMgdG8gb3JnYW5pemUgdGhlIGNhdGVnb3JpZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyTm9kZXMoKSB7XHJcblxyXG4gICAgLy9DbGVhciBzaWRlYmFyIGlmIGFscmVhZHkgc2V0IHVwXHJcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIHcydWlbJ3NpZGViYXInXS5ub2Rlcykge1xyXG4gICAgICAgIGlmIChlbGVtZW50LmlkICE9ICdBbGwnKSB7XHJcbiAgICAgICAgICAgIHcydWlbJ3NpZGViYXInXS5ub2Rlcy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICB3MnVpWydzaWRlYmFyJ10ubm9kZXMuaW5kZXhPZihlbGVtZW50LmlkKSxcclxuICAgICAgICAgICAgICAgIDFcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB3MnVpWydzaWRlYmFyJ10ucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vUmVnZW5lcmF0ZSAgICBcclxuXHJcbiAgICBsZXQgcGFja05vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICdwYWNrR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdQYWNrIEZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdGV4dHVyZU5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd0ZXh0dXJlR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdUZXh0dXJlIGZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd1bnNvcnRlZEdyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnVW5zb3J0ZWQnLFxyXG4gICAgICAgIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEJ1aWxkIHNpZGViYXIgbm9kZXNcclxuICAgIGZvciAobGV0IGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZU5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnQklOQVJJRVMnKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIkJpbmFyaWVzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlID09ICdTVFJJTkdTJykge1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcGFja05vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnVU5LTk9XTicpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiVW5rbm93blwiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHVuc29ydGVkTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFja05vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQocGFja05vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHVuc29ydGVkTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh1bnNvcnRlZE5vZGUpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gb3BlbkZpbGVQb3B1cCgpIHtcclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3Blbih7XHJcbiAgICAgICAgc3BlZWQ6IDAsXHJcbiAgICAgICAgdGl0bGU6ICdMb2FkIEEgR1cyIGRhdCcsXHJcbiAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgc2hvd0Nsb3NlOiBmYWxzZSxcclxuICAgICAgICBib2R5OiAnPGRpdiBjbGFzcz1cIncydWktY2VudGVyZWRcIj4nICtcclxuICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgJzxpbnB1dCBpZD1cImZpbGVQaWNrZXJQb3BcIiB0eXBlPVwiZmlsZVwiIC8+JyArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpXHJcbiAgICAgICAgLmNoYW5nZShcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBvblJlYWRlckNhbGxiYWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiLi4vc3RhdGljL3QzZHdvcmtlci5qc1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAgdG8gY3JlYXRlIHRoZSBndWkgbGF5b3V0LlxyXG4gKi9cclxuZnVuY3Rpb24gaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpIHtcclxuXHJcbiAgICBvblJlYWRlckNhbGxiYWNrID0gb25SZWFkZXJDcmVhdGVkO1xyXG5cclxuICAgIG1haW5HcmlkKCk7XHJcbiAgICB0b29sYmFyKCk7XHJcbiAgICBzaWRlYmFyKCk7XHJcbiAgICBmaWxlQnJvd3NlcigpO1xyXG4gICAgZmlsZVZpZXcoKTtcclxuICAgIHN0cmluZ0dyaWQoKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICAgIFNFVCBVUCBUUkVFIDNEIFNDRU5FXHJcbiAgICAqL1xyXG4gICAgVXRpbHMuc2V0dXBTY2VuZSgpO1xyXG5cclxuICAgIG9wZW5GaWxlUG9wdXAoKTtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW5pdExheW91dDogaW5pdExheW91dCxcclxuICAgIHNpZGViYXJOb2Rlczogc2lkZWJhck5vZGVzLFxyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKSB7XHJcblxyXG4gICAgLy8vIEdldCBsYXN0IGxvYWRlZCBmaWxlSWRcdFx0XHJcbiAgICB2YXIgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkO1xyXG5cclxuICAgIC8vLyBSdW4gVDNEIGhhY2tlZCB2ZXJzaW9uIG9mIE9CSkV4cG9ydGVyXHJcbiAgICB2YXIgcmVzdWx0ID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKCkucGFyc2UoR2xvYmFscy5fc2NlbmUsIGZpbGVJZCk7XHJcblxyXG4gICAgLy8vIFJlc3VsdCBsaXN0cyB3aGF0IGZpbGUgaWRzIGFyZSB1c2VkIGZvciB0ZXh0dXJlcy5cclxuICAgIHZhciB0ZXhJZHMgPSByZXN1bHQudGV4dHVyZUlkcztcclxuXHJcbiAgICAvLy8gU2V0IHVwIHZlcnkgYmFzaWMgbWF0ZXJpYWwgZmlsZSByZWZlcmluZyB0aGUgdGV4dHVyZSBwbmdzXHJcbiAgICAvLy8gcG5ncyBhcmUgZ2VuZXJhdGVkIGEgZmV3IGxpbmVzIGRvd24uXHJcbiAgICB2YXIgbXRsU291cmNlID0gXCJcIjtcclxuICAgIHRleElkcy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXhJZCkge1xyXG4gICAgICAgIG10bFNvdXJjZSArPSBcIm5ld210bCB0ZXhfXCIgKyB0ZXhJZCArIFwiXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0thIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXFxuXCI7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgb2JqXHJcbiAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyZXN1bHQub2JqXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5vYmpcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG10bFxyXG4gICAgYmxvYiA9IG5ldyBCbG9iKFttdGxTb3VyY2VdLCB7XHJcbiAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxyXG4gICAgfSk7XHJcbiAgICBzYXZlRGF0YShibG9iLCBcImV4cG9ydC5cIiArIGZpbGVJZCArIFwiLm10bFwiKTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgdGV4dHVyZSBwbmdzXHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuXHJcbiAgICAgICAgLy8vIExvY2FsUmVhZGVyIHdpbGwgaGF2ZSB0byByZS1sb2FkIHRoZSB0ZXh0dXJlcywgZG9uJ3Qgd2FudCB0byBmZXRjaFxyXG4gICAgICAgIC8vLyB0aGVuIGZyb20gdGhlIG1vZGVsIGRhdGEuLlxyXG4gICAgICAgIEdsb2JhbHMuX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGluZmxhdGVkRGF0YSwgZHh0VHlwZSwgaW1hZ2VXaWR0aCwgaW1hZ2VIZWlndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIGpzIGltYWdlIHVzaW5nIHJldHVybmVkIGJpdG1hcCBkYXRhLlxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGluZmxhdGVkRGF0YSksXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZUhlaWd0aFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gTmVlZCBhIGNhbnZhcyBpbiBvcmRlciB0byBkcmF3XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXMgLz5cIik7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQoY2FudmFzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0ud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIERyYXcgcmF3IGJpdG1hcCB0byBjYW52YXNcclxuICAgICAgICAgICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFRoaXMgaXMgd2hlcmUgc2hpdCBnZXRzIHN0dXBpZC4gRmxpcHBpbmcgcmF3IGJpdG1hcHMgaW4ganNcclxuICAgICAgICAgICAgICAgIC8vLyBpcyBhcHBhcmVudGx5IGEgcGFpbi4gQmFzaWNseSByZWFkIGN1cnJlbnQgc3RhdGUgcGl4ZWwgYnkgcGl4ZWxcclxuICAgICAgICAgICAgICAgIC8vLyBhbmQgd3JpdGUgaXQgYmFjayB3aXRoIGZsaXBwZWQgeS1heGlzIFxyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG91dHB1dCBpbWFnZSBkYXRhIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dCA9IGN0eC5jcmVhdGVJbWFnZURhdGEoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBoID0gaW5wdXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0RGF0YSA9IGlucHV0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0RGF0YSA9IG91dHB1dC5kYXRhXHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIExvb3AgcGl4ZWxzXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB5ID0gMTsgeSA8IGggLSAxOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHcgLSAxOyB4ICs9IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBJbnB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9ICh5ICogdyArIHgpICogNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoKGggLSB5KSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUmVhZCBhbmQgd3JpdGUgUkdCQVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gVE9ETzogUGVyaGFwcyBwdXQgYWxwaGEgdG8gMTAwJVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDQ7IGMgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YVtpICsgY10gPSBpbnB1dERhdGFbZmxpcCArIGNdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG5nQmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlRGF0YShwbmdCbG9iLCBcInRleF9cIiArIHRleElkICsgXCIucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vIFV0aWxpdHkgZm9yIGRvd25sb2FkaW5nIGZpbGVzIHRvIGNsaWVudFxyXG52YXIgc2F2ZURhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICBhLnN0eWxlID0gXCJkaXNwbGF5OiBub25lXCI7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJsb2IsIGZpbGVOYW1lKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuXHJcblxyXG4vLy8gU2V0dGluZyB1cCBhIHNjZW5lLCBUcmVlLmpzIHN0YW5kYXJkIHN0dWZmLi4uXHJcbmZ1bmN0aW9uIHNldHVwU2NlbmUoKSB7XHJcblxyXG4gICAgdmFyIGNhbnZhc1dpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIGNhbnZhc0hlaWdodCA9ICQoXCIjbW9kZWxPdXRwdXRcIikuaGVpZ2h0KCk7XHJcbiAgICB2YXIgY2FudmFzQ2xlYXJDb2xvciA9IDB4MzQyOTIwOyAvLyBGb3IgaGFwcHkgcmVuZGVyaW5nLCBhbHdheXMgdXNlIFZhbiBEeWtlIEJyb3duLlxyXG4gICAgdmFyIGZvdiA9IDYwO1xyXG4gICAgdmFyIGFzcGVjdCA9IDE7XHJcbiAgICB2YXIgbmVhciA9IDAuMTtcclxuICAgIHZhciBmYXIgPSA1MDAwMDA7XHJcblxyXG4gICAgR2xvYmFscy5fY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xyXG5cclxuICAgIEdsb2JhbHMuX3NjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XHJcblxyXG4gICAgLy8vIFRoaXMgc2NlbmUgaGFzIG9uZSBhbWJpZW50IGxpZ2h0IHNvdXJjZSBhbmQgdGhyZWUgZGlyZWN0aW9uYWwgbGlnaHRzXHJcbiAgICB2YXIgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDU1NTU1NSk7XHJcbiAgICBHbG9iYWxzLl9zY2VuZS5hZGQoYW1iaWVudExpZ2h0KTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDEucG9zaXRpb24uc2V0KDAsIDAsIDEpO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQxKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDIucG9zaXRpb24uc2V0KDEsIDAsIDApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQyKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDMgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KDAsIDEsIDApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQzKTtcclxuXHJcbiAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7XHJcbiAgICAgICAgYW50aWFsaWFzaW5nOiB0cnVlXHJcbiAgICB9KTtcclxuICAgICQoXCIjbW9kZWxPdXRwdXRcIilbMF0uYXBwZW5kQ2hpbGQoR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KTtcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldENsZWFyQ29sb3IoY2FudmFzQ2xlYXJDb2xvcik7XHJcblxyXG4gICAgLy8vIEFkZCBUSFJFRSBvcmJpdCBjb250cm9scywgZm9yIHNpbXBsZSBvcmJpdGluZywgcGFubmluZyBhbmQgem9vbWluZ1xyXG4gICAgR2xvYmFscy5fY29udHJvbHMgPSBuZXcgVEhSRUUuT3JiaXRDb250cm9scyhHbG9iYWxzLl9jYW1lcmEsIEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgR2xvYmFscy5fY29udHJvbHMuZW5hYmxlWm9vbSA9IHRydWU7XHJcblxyXG4gICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cclxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQob25DYW52YXNSZXNpemUsIDEwKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIE5vdGU6IGNvbnN0YW50IGNvbnRpbm91cyByZW5kZXJpbmcgZnJvbSBwYWdlIGxvYWQgZXZlbnQsIG5vdCB2ZXJ5IG9wdC5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gb25DYW52YXNSZXNpemUoKSB7XHJcblxyXG4gICAgdmFyIHNjZW5lV2lkdGggPSAkKFwiI21vZGVsT3V0cHV0XCIpLndpZHRoKCk7XHJcbiAgICB2YXIgc2NlbmVIZWlnaHQgPSAkKFwiI21vZGVsT3V0cHV0XCIpLmhlaWdodCgpO1xyXG5cclxuICAgIGlmICghc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XHJcblxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShzY2VuZVdpZHRoLCBzY2VuZUhlaWdodCk7XHJcblxyXG4gICAgR2xvYmFscy5fY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcclxufVxyXG5cclxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIucmVuZGVyKEdsb2JhbHMuX3NjZW5lLCBHbG9iYWxzLl9jYW1lcmEpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGV4cG9ydFNjZW5lOiBleHBvcnRTY2VuZSxcclxuICAgIHNhdmVEYXRhOiBzYXZlRGF0YSxcclxuICAgIHNldHVwU2NlbmU6IHNldHVwU2NlbmUsXHJcbiAgICBvbkNhbnZhc1Jlc2l6ZTogb25DYW52YXNSZXNpemUsXHJcbiAgICByZW5kZXI6IHJlbmRlclxyXG59Il19
