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
        "Indexing .dat file<br/>" +
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

//Register viewers
const HeadViewer = require('./Viewers/Head');
const HexaViewer = require('./Viewers/Hexa');
const ModelViewer = require('./Viewers/Model');
const PackViewer = require('./Viewers/Pack');
const SoundViewer = require('./Viewers/Sound');
const StringViewer = require('./Viewers/String');
const TextureViewer = require('./Viewers/Texture');

var Viewers = [
    new HeadViewer(),
    new HexaViewer(),
    new ModelViewer(),
    new PackViewer(),
    new SoundViewer(),
    new StringViewer(),
    new TextureViewer()
];

var DefaultViewerIndex = 0;

function setupViewers() {
    for (let tab of Viewers) {
        tab.setup();
    }
}

function generateTabLayout() {
    for (let tab of Viewers) {
        let isDefault = tab == Viewers[DefaultViewerIndex];
        let tabHtml =
            $(`<div class='fileTab' id='${tab.getDomTabId()}'>
            <div class='tabOutput' id='${tab.getOutputId()}'></div>
            </div>`);

        if (!isDefault) {
            tabHtml.hide();
        }

        $('#fileTabs').append(tabHtml);

        w2ui['fileTabs'].add({
            id: tab.getW2TabId(),
            caption: tab.name,
            disabled: true,
            onClick: function () {
                $('.fileTab').hide();
                tab.render();
            }
        });

    }
    w2ui['fileTabs'].select(Viewers[DefaultViewerIndex].getW2TabId());
}

function onBasicRendererDone() {
    let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");
    //Not implemented in T3D yet:
    //let fileType = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileType");

    //Show the filename
    //Todo: implement fileType
    let fileName = `${fileId}`

    //Iterate through the renderers to know who can show and who
    let override;
    for (let viewer of Viewers) {
        //check if can view
        if (viewer.canView()) {
            w2ui.fileTabs.enable(viewer.getW2TabId());
        }

        //check if can override
        let overrideAbility = viewer.overrideDefault();
        if (overrideAbility && override === undefined) {
            override = viewer;
        } else if (overrideAbility && override !== undefined) {
            override = null;
        }

    }
    //Set active tab
    if (override) {
        w2ui.fileTabs.click(override.getW2TabId());
    } else {
        w2ui.fileTabs.click(Viewers[DefaultViewerIndex].getW2TabId());
    }

    //Enable context toolbar and download button
    $("#contextToolbar")
        .append(
            $("<button>Download raw</button>")
            .click(
                function () {
                    var blob = new Blob([rawData], {
                        type: "octet/stream"
                    });
                    Utils.saveData(blob, fileName + ".bin");
                }
            )
        );

}

function viewFileByFileId(fileId) {

    /// Clean outputs
    $("#fileTitle").html("");

    /// Clean context toolbar
    $("#contextToolbar").html("");

    /// Disable and clean tabs
    for (let viewer of Viewers) {
        w2ui.fileTabs.disable(viewer.getW2TabId());
        viewer.clean();
    }

    /// Make sure _context is clean
    Globals._context = {};

    let rendererSettings = {
        id: fileId
    };

    /// Run the basic DataRenderer
    T3D.runRenderer(
        T3D.DataRenderer,
        Globals._lr,
        rendererSettings,
        Globals._context,
        onBasicRendererDone
    );
}

function viewFileByMFT(mftIdx) {
    let reverseTable = Globals._lr.getReverseIndex();

    var baseId = (reverseTable[mftIdx]) ? reverseTable[mftIdx][0] : "";

    viewFileByFileId(baseId);
}

module.exports = {
    generateTabLayout: generateTabLayout,
    setupViewers: setupViewers,
    viewFileByFileId: viewFileByFileId,
    viewFileByMFT: viewFileByMFT
}
},{"./Globals":4,"./Utils":6,"./Viewers/Head":7,"./Viewers/Hexa":8,"./Viewers/Model":9,"./Viewers/Pack":10,"./Viewers/Sound":11,"./Viewers/String":12,"./Viewers/Texture":13}],4:[function(require,module,exports){
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
    _onCanvasResize: function () {}

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

const HexaViewer = require('./Viewers/Hexa');


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
        onResize: Globals._onCanvasResize
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


    $("#fileTabs").w2tabs({
        name: 'fileTabs',
        tabs: []
    });

    FileViewer.generateTabLayout();
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

    //Setup viewers
    FileViewer.setupViewers();

    /*
        SET UP TREE 3D SCENE
    */
    // Utils.setupScene();

    openFilePopup();

}

module.exports = {
    initLayout: initLayout,
    sidebarNodes: sidebarNodes,
}
},{"./Filegrid":2,"./Fileviewer":3,"./Globals":4,"./Utils":6,"./Viewers/Hexa":8}],6:[function(require,module,exports){
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

function generateHexTable(rawData, domContainer, callback) {
    let byteArray = new Uint8Array(rawData);
    let hexOutput = [];
    let asciiOutput = [];
    const loopChunkSize = 10000;

    const ASCII = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        '0123456789' + '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

    $(domContainer).html("");
    $(domContainer).append(`
<table class="hexaTable">
    <tr>
        <th>Address</th>
        <th>00</th><th>01</th><th>02</th><th>03</th><th>04</th><th>05</th><th>06</th><th>07</th>
        <th>08</th><th>09</th><th>0A</th><th>0B</th><th>0C</th><th>0D</th><th>0E</th><th>0F</th>
        <th>ASCII</th>
    </tr>`);


    //Breakup the work into slices of 10kB for performance
    let byteArraySlice = [];
    for (let pos = 0; pos < byteArray.length; pos += loopChunkSize) {
        byteArraySlice.push(byteArray.slice(pos, pos + loopChunkSize));
    }

    let loopCount = 0;
    let loopFunc = setInterval(() => {
        let byteArrayItem = byteArraySlice[loopCount];
        //If there is no more work we clear the loop and callback
        if (byteArrayItem == undefined) {
            clearInterval(loopFunc);
            $(domContainer + " table").append("</table>");
            $(domContainer).show();
            callback();
            return;
        }

        //Work with lines of 16 bytes
        for (let pos = 0; pos < byteArrayItem.length; pos += 16) {
            let workSlice = byteArrayItem.slice(pos, pos + 16);
            let rowHTML = "<tr>";
            let asciiLine = "";
            let address = Number(pos + (loopCount * loopChunkSize)).toString(16);
            address = address.length != 8 ? '0'.repeat(8 - address.length) + address : address;
            rowHTML += '<td>' + address + '</td>';

            //Iterate through each byte of the 16bytes line
            for (let i = 0; i < 16; i++) {
                let byte = workSlice[i];
                let byteHexCode;
                if (byte != undefined) {
                    byteHexCode = byte.toString(16).toUpperCase();
                    byteHexCode = byteHexCode.length == 1 ? "0" + byteHexCode : byteHexCode;
                } else {
                    byteHexCode = "  ";
                }

                rowHTML += '<td>' + byteHexCode + '</td>';
                let asciiCode = byte ? String.fromCharCode(byte) : " ";
                asciiCode = ASCII.includes(asciiCode) ? asciiCode : ".";
                asciiLine += asciiCode;
            }

            rowHTML += '<td>' + asciiLine + '</td></tr> ';
            $(domContainer + " table").append(rowHTML);
        }

        loopCount += 1;
    }, 1);
}

//This special forEach have an additional parameter to add a setTimeout(1) between each "chunkSize" items
function asyncForEach(array, chunkSize, fn) {
    let workArray = [];
    //Slice up the array into work array for synchronous call
    for (let i = 0; i < array.size; i += chunkSize) {
        workArray.push(array.slice(i, i + chunkSize));
    }

    //Loopcount is the amount of times chunkSize have been reached
    let loopcount = 0;
    let interval = setInterval(() => {
        //Iterate through the chunk
        for (let index in workArray) {
            let item = workArray[index];
            let index = index + (loopcount * chunkSize);
            fn(item, index);
        }

        //Check if there is more work or not
        loopcount += 1;
        if (loopcount == workArray.length) {
            clearInterval(interval);
        }
    }, 1);
}

module.exports = {
    exportScene: exportScene,
    saveData: saveData,
    generateHexTable: generateHexTable
}
},{"./Globals":4}],7:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class HeadViewer extends Viewer {
    constructor() {
        super("headView", "Overview");
        this.currentRenderId = null;
    }

    setup() {
        $('#headGrid').w2grid({
            name: 'Overview',
            columns: [{
                    field: 'type',
                    caption: 'Type',
                    size: '50%'
                },
                {
                    field: 'value',
                    caption: 'Value',
                    size: '50%'
                },
            ],
            records: []
        });
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {
            let raw = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");

            var ds = new DataStream(raw);
            var first4 = ds.readCString(4);

            $(`#${this.getOutputId()}`).html("");
            $(`#${this.getOutputId()}`).append('<div id="headGrid" style="height: 450px"></div>');

            w2ui['Overview'].records = [{
                    recid: 1,
                    type: 'File ID',
                    value: fileId
                },
                {
                    recid: 2,
                    type: 'File size',
                    value: raw.byteLength
                },
                {
                    recid: 3,
                    type: 'File type',
                    value: first4
                }
            ];
            w2ui['Overview'].refresh();

            w2ui['Overview'].render($('#headGrid')[0]);

            //TODO:
            //MFT index
            //BaseId
            //FileType
            //Compressed size
            //Uncompressed size
            //
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    //Headviewer can view every file
    canView() {
        return true;
    }

    clean() {
        w2ui['Overview'].delete();
    }
}

module.exports = HeadViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],8:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class HexaViewer extends Viewer {
    constructor() {
        super("hexView", "Hex View");
        //super("#fileTabsHexView", "#hexView", "tabHexView", "Hex View");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        if (this.currentRenderId != fileId) {
            let rawData = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");
            //Utils.generateHexTable(rawData, `#${this.getOutputId()}`, () => {});
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    //Hexa viewer can view every file
    canView() {
        return true;
    }
}

module.exports = HexaViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],9:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class ModelViewer extends Viewer {
    constructor() {
        super("model", "Model");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {

            /// Run single renderer
            T3D.runRenderer(
                T3D.SingleModelRenderer,
                Globals._lr, {
                    id: fileId
                },
                Globals._context,
                () => {
                    this.onRendererDoneModel();
                }
            );

            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    clean() {
        /// Remove old models from the scene
        if (Globals._models) {
            for (let mdl of Globals._models) {
                Globals._scene.remove(mdl);
            }
        }
    }

    canView() {
        let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
        if (packfile && packfile.header.type == 'MODL') {
            return true;
        } else {
            return false;
        }
    }

    overrideDefault() {
        return this.canView();
    }

    onRendererDoneModel() {

        $(`#${this.getOutputId()}`).show();

        /// Re-fit canvas
        Globals._onCanvasResize();

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
        for (let model of Globals._models) {

            /// Find the biggest model for camera focus/fitting
            if (!biggestMdl || biggestMdl.boundingSphere.radius < model.boundingSphere.radius) {
                biggestMdl = model;
            }

            Globals._scene.add(model);
        }

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


    setup() {
        /// Setting up a scene, Tree.js standard stuff...
        var canvasWidth = $("#" + this.getOutputId()).width();
        var canvasHeight = $("#" + this.getOutputId()).height();
        var canvasClearColor = 0x342920; // For happy rendering, always use Van Dyke Brown.
        var fov = 60;
        var aspect = 1;
        var near = 0.1;
        var far = 500000;

        Globals._onCanvasResize = () => {

            var sceneWidth = $("#" + this.getOutputId()).width();
            var sceneHeight = $("#" + this.getOutputId()).height();

            if (!sceneHeight || !sceneWidth)
                return;

            Globals._camera.aspect = sceneWidth / sceneHeight;

            Globals._renderer.setSize(sceneWidth, sceneHeight);

            Globals._camera.updateProjectionMatrix();
        }

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

        $("#" + this.getOutputId())[0].appendChild(Globals._renderer.domElement);

        Globals._renderer.setSize(canvasWidth, canvasHeight);
        Globals._renderer.setClearColor(canvasClearColor);

        /// Add THREE orbit controls, for simple orbiting, panning and zooming
        Globals._controls = new THREE.OrbitControls(Globals._camera, Globals._renderer.domElement);
        Globals._controls.enableZoom = true;

        /// Sems w2ui delays resizing :/
        $(window).resize(function () {
            setTimeout(Globals._onCanvasResize, 10)
        });

        /// Note: constant continous rendering from page load event, not very opt.
        render();
    }
}

/// Render loop, no game logic, just rendering.
function render() {
    window.requestAnimationFrame(render);
    Globals._renderer.render(Globals._scene, Globals._camera);
}

module.exports = ModelViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],10:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class PackViewer extends Viewer {
    constructor() {
        super("pack", "Pack file");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");
        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {
            let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");

            $(`#${this.getOutputId()}`).html("");
            $(`#${this.getOutputId()}`).append($("<h2>" + this.name + "</h2>"));

            for (let chunk of packfile.chunks) {
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

                $(`#${this.getOutputId()}`).append(field);
                $(`#${this.getOutputId()}`).show();
            }

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    canView() {
        //if pack then return true
        let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
        if (packfile) {
            return true;
        } else {
            return false;
        }
    }
}

module.exports = PackViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],11:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class SoundViewer extends Viewer {
    constructor() {
        super("sound", "Sound");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {

            let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
            let chunk = packfile.getChunk("ASND");

            /// Print some random data about this sound
            $(`#${this.getOutputId}`)
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
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }


    canView() {
        let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
        if (packfile && packfile.header.type == 'ASND') {
            return true;
        } else {
            return false;
        }
    }

    overrideDefault() {
        return this.canView();
    }
}

module.exports = SoundViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],12:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class StringViewer extends Viewer {
    constructor() {
        super("string", "String");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {

            /// Run single renderer
            T3D.runRenderer(
                T3D.StringRenderer,
                Globals._lr, {
                    id: fileId
                },
                Globals._context,
                () => {
                    this.onRendererDoneString()
                }
            );


            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }


    clean() {

    }

    canView() {
        //if string file then return true
        let rawData = T3D.getContextValue(Globals._context, T3D.DataRenderer, "rawData");
        let fcc = String.fromCharCode(rawData[0], rawData[1], rawData[2], rawData[3]);
        if (fcc === 'strs') {
            return true;
        } else {
            return false;
        }
    }

    overrideDefault() {
        return this.canView();
    }

    onRendererDoneString() {

        /// Read data from renderer
        let strings = T3D.getContextValue(Globals._context, T3D.StringRenderer, "strings", []);

        w2ui.stringGrid.records = strings;

        w2ui.stringGrid.buffered = w2ui.stringGrid.records.length;
        w2ui.stringGrid.total = w2ui.stringGrid.buffered;
        w2ui.stringGrid.refresh();
    }
}


module.exports = StringViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],13:[function(require,module,exports){
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

const Viewer = require("./Viewer");
const Globals = require("../Globals");
const Utils = require("../Utils");

class TextureViewer extends Viewer {
    constructor() {
        super("texture", "Texture");
        this.currentRenderId = null;
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {


            /// Display bitmap on canvas
            var canvas = $("<canvas>");
            canvas[0].width = image.width;
            canvas[0].height = image.height;
            var ctx = canvas[0].getContext("2d");

            //TODO: use new texture renderer

            //var uica = new Uint8ClampedArray(image.data);
            //var imagedata = new ImageData(uica, image.width, image.height);
            //ctx.putImageData(imagedata, 0, 0);

            $(`#${this.getOutputId}`).append(canvas);

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    canView() {
        //if texture file then return true
        //TODO use types from DataRenderer
        return false;
    }
}

module.exports = TextureViewer;
},{"../Globals":4,"../Utils":6,"./Viewer":14}],14:[function(require,module,exports){
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

/**
 * This is an abstract class, use other class to define behavior.
 * Declaring a Viewer class is not enough, don't forget to register it in the FileViewer module
 */

class Viewer {
    /**
     * Defines the tab here
     */
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }

    getW2TabId() {
        return `tab${this.id}`;
    }

    getOutputId() {
        return `${this.id}Output`;
    }

    getDomTabId() {
        return `fileTab${this.id}`;
    }

    /**
     * Facultative method that allows some renderers to setup stuff on startup
     */
    setup() {

    }

    /**
     * Render the content of the tab when called
     * It is the responsability of the viewer to cache it's heavy tasks
     * @returns {null}
     */
    render() {
        throw new Error("Needs to be implemented by children class");
    }

    /**
     * Used to clean memory as soon as another file is loaded
     */
    clean() {
        $(this.getOutputId()).html("");
    }

    /**
     * Will determine if the tab can be active or not
     * @returns {boolean}
     */
    canView() {
        throw new Error("Needs to be implemented by children class");
    }

    //If set to true, the file will be opened directly on this view
    //If multiple viewers returns true for the same file, it comes back to default.
    overrideDefault() {
        return false;
    }
}

module.exports = Viewer;
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hlYWQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hleGEuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL01vZGVsLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9QYWNrLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9Tb3VuZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvU3RyaW5nLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9UZXh0dXJlLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9WaWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuLy8gVGhpcyBmaWxlIGlzIHRoZSBtYWluIGVudHJ5IHBvaW50IGZvciB0aGUgVHlyaWEyRCBhcHBsaWNhdGlvblxyXG5cclxuLy8vIFJlcXVpcmVzOlxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL0xheW91dCcpO1xyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIG9uUmVhZGVyQ3JlYXRlZCgpIHtcclxuXHJcbiAgICB3MnBvcHVwLmxvY2soKTtcclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFxyXG4gICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArXHJcbiAgICAgICAgXCI8YnIvPjxici8+XCJcclxuICAgICk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgVDNELmdldEZpbGVMaXN0QXN5bmMoR2xvYmFscy5fbHIsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChmaWxlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBTdG9yZSBmaWxlTGlzdCBnbG9iYWxseVxyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgICAgICAgICBMYXlvdXQuc2lkZWJhck5vZGVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENsb3NlIHRoZSBwb3BcclxuICAgICAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gU2VsZWN0IHRoZSBcIkFsbFwiIGNhdGVnb3J5XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuY2xpY2soXCJBbGxcIik7XHJcblxyXG4gICAgICAgICAgICB9IC8vLyBFbmQgcmVhZEZpbGVMaXN0QXN5bmMgY2FsbGJhY2tcclxuICAgICAgICApO1xyXG4gICAgfSwgMSk7XHJcblxyXG59XHJcblxyXG5MYXlvdXQuaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpO1xyXG5cclxuLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuVDNELkxvZ2dlci5sb2dGdW5jdGlvbnNbVDNELkxvZ2dlci5UWVBFX1BST0dSRVNTXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFxyXG4gICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArXHJcbiAgICAgICAgYXJndW1lbnRzWzFdICsgXCIlPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuZnVuY3Rpb24gb25GaWx0ZXJDbGljayhldnQpIHtcclxuXHJcbiAgICAvLy8gTm8gZmlsdGVyIGlmIGNsaWNrZWQgZ3JvdXAgd2FzIFwiQWxsXCJcclxuICAgIGlmIChldnQudGFyZ2V0ID09IFwiQWxsXCIpIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpIHtcclxuXHJcbiAgICB3MnVpLmdyaWQucmVjb3JkcyA9IFtdO1xyXG5cclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG5cclxuICAgICAgICAvLy8gT25seSBzaG93IHR5cGVzIHdlJ3ZlIGFza2VkIGZvclxyXG4gICAgICAgIGlmIChmaWxlVHlwZUZpbHRlciAmJiBmaWxlVHlwZUZpbHRlci5pbmRleE9mKGZpbGVUeXBlKSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNhc2UgZm9yIFwicGFja0dyb3VwXCJcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBsZXQgdHJvdWdoIGFsbCBwYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgTk9UIGxldCB0cm91Z2h0IGFueSBub24tcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gaS5lLiBTdHJpbmdzLCBCaW5hcmllcyBldGNcclxuICAgICAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoXCJwYWNrR3JvdXBcIikgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwidGV4dHVyZUdyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGVBcnIgPSBHbG9iYWxzLl9maWxlTGlzdFtmaWxlVHlwZV07XHJcbiAgICAgICAgICAgIGZpbGVBcnIuZm9yRWFjaChcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChtZnRJbmRleCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IEdsb2JhbHMuX2xyLmdldEZpbGVNZXRhKG1mdEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VJZHMgPSByZXZlcnNlVGFibGVbbWZ0SW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IChtZXRhKSA/IG1ldGEuc2l6ZSA6IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlU2l6ZSA+IDAgJiYgbWZ0SW5kZXggPiAxNSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJ1aVsnZ3JpZCddLnJlY29yZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpZDogbWZ0SW5kZXgsIC8vLyBNRlQgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZHM6IGJhc2VJZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZnRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfSAvLy8gRW5kIGZvciBlYWNoIG1mdCBpbiB0aGlzIGZpbGUgdHlwZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgaWYgX2ZpbGVMaXN0W2ZpbGV0eXBlXVxyXG5cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2ssXHJcbn0iLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG4vL1JlZ2lzdGVyIHZpZXdlcnNcbmNvbnN0IEhlYWRWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGVhZCcpO1xuY29uc3QgSGV4YVZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9IZXhhJyk7XG5jb25zdCBNb2RlbFZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9Nb2RlbCcpO1xuY29uc3QgUGFja1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9QYWNrJyk7XG5jb25zdCBTb3VuZFZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9Tb3VuZCcpO1xuY29uc3QgU3RyaW5nVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL1N0cmluZycpO1xuY29uc3QgVGV4dHVyZVZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9UZXh0dXJlJyk7XG5cbnZhciBWaWV3ZXJzID0gW1xuICAgIG5ldyBIZWFkVmlld2VyKCksXG4gICAgbmV3IEhleGFWaWV3ZXIoKSxcbiAgICBuZXcgTW9kZWxWaWV3ZXIoKSxcbiAgICBuZXcgUGFja1ZpZXdlcigpLFxuICAgIG5ldyBTb3VuZFZpZXdlcigpLFxuICAgIG5ldyBTdHJpbmdWaWV3ZXIoKSxcbiAgICBuZXcgVGV4dHVyZVZpZXdlcigpXG5dO1xuXG52YXIgRGVmYXVsdFZpZXdlckluZGV4ID0gMDtcblxuZnVuY3Rpb24gc2V0dXBWaWV3ZXJzKCkge1xuICAgIGZvciAobGV0IHRhYiBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIHRhYi5zZXR1cCgpO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVUYWJMYXlvdXQoKSB7XG4gICAgZm9yIChsZXQgdGFiIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgbGV0IGlzRGVmYXVsdCA9IHRhYiA9PSBWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF07XG4gICAgICAgIGxldCB0YWJIdG1sID1cbiAgICAgICAgICAgICQoYDxkaXYgY2xhc3M9J2ZpbGVUYWInIGlkPScke3RhYi5nZXREb21UYWJJZCgpfSc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPScke3RhYi5nZXRPdXRwdXRJZCgpfSc+PC9kaXY+XG4gICAgICAgICAgICA8L2Rpdj5gKTtcblxuICAgICAgICBpZiAoIWlzRGVmYXVsdCkge1xuICAgICAgICAgICAgdGFiSHRtbC5oaWRlKCk7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcjZmlsZVRhYnMnKS5hcHBlbmQodGFiSHRtbCk7XG5cbiAgICAgICAgdzJ1aVsnZmlsZVRhYnMnXS5hZGQoe1xuICAgICAgICAgICAgaWQ6IHRhYi5nZXRXMlRhYklkKCksXG4gICAgICAgICAgICBjYXB0aW9uOiB0YWIubmFtZSxcbiAgICAgICAgICAgIGRpc2FibGVkOiB0cnVlLFxuICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAgICAgICAgIHRhYi5yZW5kZXIoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICB9XG4gICAgdzJ1aVsnZmlsZVRhYnMnXS5zZWxlY3QoVmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdLmdldFcyVGFiSWQoKSk7XG59XG5cbmZ1bmN0aW9uIG9uQmFzaWNSZW5kZXJlckRvbmUoKSB7XG4gICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG4gICAgLy9Ob3QgaW1wbGVtZW50ZWQgaW4gVDNEIHlldDpcbiAgICAvL2xldCBmaWxlVHlwZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlVHlwZVwiKTtcblxuICAgIC8vU2hvdyB0aGUgZmlsZW5hbWVcbiAgICAvL1RvZG86IGltcGxlbWVudCBmaWxlVHlwZVxuICAgIGxldCBmaWxlTmFtZSA9IGAke2ZpbGVJZH1gXG5cbiAgICAvL0l0ZXJhdGUgdGhyb3VnaCB0aGUgcmVuZGVyZXJzIHRvIGtub3cgd2hvIGNhbiBzaG93IGFuZCB3aG9cbiAgICBsZXQgb3ZlcnJpZGU7XG4gICAgZm9yIChsZXQgdmlld2VyIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgLy9jaGVjayBpZiBjYW4gdmlld1xuICAgICAgICBpZiAodmlld2VyLmNhblZpZXcoKSkge1xuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUodmlld2VyLmdldFcyVGFiSWQoKSk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGNhbiBvdmVycmlkZVxuICAgICAgICBsZXQgb3ZlcnJpZGVBYmlsaXR5ID0gdmlld2VyLm92ZXJyaWRlRGVmYXVsdCgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVBYmlsaXR5ICYmIG92ZXJyaWRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlID0gdmlld2VyO1xuICAgICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlQWJpbGl0eSAmJiBvdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvdmVycmlkZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICAvL1NldCBhY3RpdmUgdGFiXG4gICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2sob3ZlcnJpZGUuZ2V0VzJUYWJJZCgpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKFZpZXdlcnNbRGVmYXVsdFZpZXdlckluZGV4XS5nZXRXMlRhYklkKCkpO1xuICAgIH1cblxuICAgIC8vRW5hYmxlIGNvbnRleHQgdG9vbGJhciBhbmQgZG93bmxvYWQgYnV0dG9uXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxuICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgJChcIjxidXR0b24+RG93bmxvYWQgcmF3PC9idXR0b24+XCIpXG4gICAgICAgICAgICAuY2xpY2soXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyYXdEYXRhXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuc2F2ZURhdGEoYmxvYiwgZmlsZU5hbWUgKyBcIi5iaW5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuXG59XG5cbmZ1bmN0aW9uIHZpZXdGaWxlQnlGaWxlSWQoZmlsZUlkKSB7XG5cbiAgICAvLy8gQ2xlYW4gb3V0cHV0c1xuICAgICQoXCIjZmlsZVRpdGxlXCIpLmh0bWwoXCJcIik7XG5cbiAgICAvLy8gQ2xlYW4gY29udGV4dCB0b29sYmFyXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5odG1sKFwiXCIpO1xuXG4gICAgLy8vIERpc2FibGUgYW5kIGNsZWFuIHRhYnNcbiAgICBmb3IgKGxldCB2aWV3ZXIgb2YgVmlld2Vycykge1xuICAgICAgICB3MnVpLmZpbGVUYWJzLmRpc2FibGUodmlld2VyLmdldFcyVGFiSWQoKSk7XG4gICAgICAgIHZpZXdlci5jbGVhbigpO1xuICAgIH1cblxuICAgIC8vLyBNYWtlIHN1cmUgX2NvbnRleHQgaXMgY2xlYW5cbiAgICBHbG9iYWxzLl9jb250ZXh0ID0ge307XG5cbiAgICBsZXQgcmVuZGVyZXJTZXR0aW5ncyA9IHtcbiAgICAgICAgaWQ6IGZpbGVJZFxuICAgIH07XG5cbiAgICAvLy8gUnVuIHRoZSBiYXNpYyBEYXRhUmVuZGVyZXJcbiAgICBUM0QucnVuUmVuZGVyZXIoXG4gICAgICAgIFQzRC5EYXRhUmVuZGVyZXIsXG4gICAgICAgIEdsb2JhbHMuX2xyLFxuICAgICAgICByZW5kZXJlclNldHRpbmdzLFxuICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICBvbkJhc2ljUmVuZGVyZXJEb25lXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gdmlld0ZpbGVCeU1GVChtZnRJZHgpIHtcbiAgICBsZXQgcmV2ZXJzZVRhYmxlID0gR2xvYmFscy5fbHIuZ2V0UmV2ZXJzZUluZGV4KCk7XG5cbiAgICB2YXIgYmFzZUlkID0gKHJldmVyc2VUYWJsZVttZnRJZHhdKSA/IHJldmVyc2VUYWJsZVttZnRJZHhdWzBdIDogXCJcIjtcblxuICAgIHZpZXdGaWxlQnlGaWxlSWQoYmFzZUlkKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2VuZXJhdGVUYWJMYXlvdXQ6IGdlbmVyYXRlVGFiTGF5b3V0LFxuICAgIHNldHVwVmlld2Vyczogc2V0dXBWaWV3ZXJzLFxuICAgIHZpZXdGaWxlQnlGaWxlSWQ6IHZpZXdGaWxlQnlGaWxlSWQsXG4gICAgdmlld0ZpbGVCeU1GVDogdmlld0ZpbGVCeU1GVFxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8vU2V0dGluZyB1cCB0aGUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIGFwcFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLy8gVDNEXG4gICAgX2xyOiB1bmRlZmluZWQsXG4gICAgX2NvbnRleHQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUlkOiB1bmRlZmluZWQsXG4gICAgX2ZpbGVMaXN0OiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvU291cmNlOiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvQ29udGV4dDogdW5kZWZpbmVkLFxuXG4gICAgLy8vIFRIUkVFXG4gICAgX3NjZW5lOiB1bmRlZmluZWQsXG4gICAgX2NhbWVyYTogdW5kZWZpbmVkLFxuICAgIF9yZW5kZXJlcjogdW5kZWZpbmVkLFxuICAgIF9tb2RlbHM6IFtdLFxuICAgIF9jb250cm9sczogdW5kZWZpbmVkLFxuICAgIF9vbkNhbnZhc1Jlc2l6ZTogZnVuY3Rpb24gKCkge31cblxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuY29uc3QgRmlsZVZpZXdlciA9IHJlcXVpcmUoJy4vRmlsZXZpZXdlcicpO1xyXG5jb25zdCBGaWxlR3JpZCA9IHJlcXVpcmUoJy4vRmlsZWdyaWQnKTtcclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuY29uc3QgSGV4YVZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9IZXhhJyk7XHJcblxyXG5cclxudmFyIG9uUmVhZGVyQ2FsbGJhY2s7XHJcblxyXG4vKipcclxuICogU2V0dXAgbWFpbiBncmlkXHJcbiAqL1xyXG5mdW5jdGlvbiBtYWluR3JpZCgpIHtcclxuICAgIGNvbnN0IHBzdHlsZSA9ICdib3JkZXI6IDFweCBzb2xpZCAjZGZkZmRmOyBwYWRkaW5nOiAwOyc7XHJcblxyXG4gICAgJCgnI2xheW91dCcpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnbGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAndG9wJyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDI4LFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnIHBhZGRpbmctdG9wOiAxcHg7J1xyXG4gICAgICAgICAgICB9LCB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA1NzAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgJ21hcmdpbjowJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWFpbicsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgXCIgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XCIsXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6ICdiYWNrZ3JvdW5kLWNvbG9yOiNlYWVhZWE7IGhlaWdodDo0MHB4JyxcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ2h0bWwnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpZDogJ2NvbnRleHRUb29sYmFyJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaHRtbDogJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIiBpZD1cImNvbnRleHRUb29sYmFyXCI+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgIH1dLFxyXG4gICAgICAgICAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyLmNvbnRlbnQoJ21haW4nLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvblJlc2l6ZTogR2xvYmFscy5fb25DYW52YXNSZXNpemVcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCIjZmlsZUlkSW5wdXRCdG5cIikuY2xpY2soXHJcbiAgICAgICAgZnVuY3Rpb24gKCkge1xyXG4gICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlGaWxlSWQoJChcIiNmaWxlSWRJbnB1dFwiKS52YWwoKSk7XHJcbiAgICAgICAgfVxyXG4gICAgKVxyXG5cclxuXHJcbiAgICAvLy8gR3JpZCBpbnNpZGUgbWFpbiBsZWZ0XHJcbiAgICAkKCkudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsZWZ0TGF5b3V0JyxcclxuICAgICAgICBwYW5lbHM6IFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbGVmdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAxNTAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ2xlZnQnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDQyMCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAncmlnaHQnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ2xlZnQnLCB3MnVpWydsZWZ0TGF5b3V0J10pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgdG9vbGJhclxyXG4gKi9cclxuZnVuY3Rpb24gdG9vbGJhcigpIHtcclxuICAgICQoKS53MnRvb2xiYXIoe1xyXG4gICAgICAgIG5hbWU6ICd0b29sYmFyJyxcclxuICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICdsb2FkRmlsZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnT3BlbiBmaWxlJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tZm9sZGVyJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAndmlldycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVmlldycsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgbGlzdCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgY2F0ZWdvcmllcycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdIaWRlIGZpbGUgcHJldmlldycsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAndG9vbHMnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1Rvb2xzJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnVmlldyBjbnRjIHN1bW1hcnknLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICB9XVxyXG5cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2JyZWFrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVudScsXHJcbiAgICAgICAgICAgICAgICBpZDogJ29wZW5lbnRyeScsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXNlYXJjaCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnT3BlbiBlbnRyeScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0Jhc2VJRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ01GVCBJRCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdzcGFjZXInXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdidXR0b24nLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICdtZW50aW9ucycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVHlyaWEyRCcsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSAnbG9hZEZpbGUnOlxyXG4gICAgICAgICAgICAgICAgICAgIG9wZW5GaWxlUG9wdXAoKTtcclxuICAgICAgICAgICAgICAgICAgICBicmVhaztcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH0pO1xyXG5cclxuICAgIHcydWlbJ2xheW91dCddLmNvbnRlbnQoJ3RvcCcsIHcydWlbJ3Rvb2xiYXInXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBzaWRlYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyKCkge1xyXG4gICAgLypcclxuICAgICAgICBTSURFQkFSXHJcbiAgICAqL1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ2xlZnQnLCAkKCkudzJzaWRlYmFyKHtcclxuICAgICAgICBuYW1lOiAnc2lkZWJhcicsXHJcbiAgICAgICAgaW1nOiBudWxsLFxyXG4gICAgICAgIG5vZGVzOiBbe1xyXG4gICAgICAgICAgICBpZDogJ0FsbCcsXHJcbiAgICAgICAgICAgIHRleHQ6ICdBbGwnLFxyXG4gICAgICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgIH1dLFxyXG4gICAgICAgIG9uQ2xpY2s6IEZpbGVHcmlkLm9uRmlsdGVyQ2xpY2tcclxuICAgIH0pKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGVicm93c2VyXHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlQnJvd3NlcigpIHtcclxuICAgIHcydWlbJ2xlZnRMYXlvdXQnXS5jb250ZW50KCdtYWluJywgJCgpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ2dyaWQnLFxyXG4gICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgdG9vbGJhcjogdHJ1ZSxcclxuICAgICAgICAgICAgdG9vbGJhclNlYXJjaDogZmFsc2UsXHJcbiAgICAgICAgICAgIHRvb2xiYXJSZWxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbe1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZWNpZCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnTUZUIGluZGV4JyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICc4MHB4JyxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vc2VhcmNoYWJsZTogJ2ludCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdiYXNlSWRzJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdCYXNlSWQgbGlzdCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwJScsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAvL3NlYXJjaGFibGU6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICd0eXBlJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdUeXBlJyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICcxMDBweCcsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdmaWxlU2l6ZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUGFjayBTaXplJyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICc4NXB4JyxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5TUZUKGV2ZW50LnJlY2lkKTtcclxuICAgICAgICB9XHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlIHZpZXcgd2luZG93XHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlVmlldygpIHtcclxuICAgICQodzJ1aVsnbGF5b3V0J10uZWwoJ21haW4nKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8aDEgaWQ9J2ZpbGVUaXRsZScgLz5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdiBpZD0nZmlsZVRhYnMnIC8+XCIpKVxyXG5cclxuXHJcbiAgICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICAgbmFtZTogJ2ZpbGVUYWJzJyxcclxuICAgICAgICB0YWJzOiBbXVxyXG4gICAgfSk7XHJcblxyXG4gICAgRmlsZVZpZXdlci5nZW5lcmF0ZVRhYkxheW91dCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdHJpbmdHcmlkKCkge1xyXG4gICAgLy8vIFNldCB1cCBncmlkIGZvciBzdHJpbmdzIHZpZXdcclxuICAgIC8vL0NyZWF0ZSBncmlkXHJcbiAgICAkKFwiI3N0cmluZ091dHB1dFwiKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdzdHJpbmdHcmlkJyxcclxuICAgICAgICBzZWxlY3RUeXBlOiAnY2VsbCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbe1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZWNpZCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUm93ICMnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzYwcHgnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAndmFsdWUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1RleHQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzEwMCUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gd2UgaGF2ZSBhIGxpc3Qgb2YgdGhlIGZpbGVzIHRvIG9yZ2FuaXplIHRoZSBjYXRlZ29yaWVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhck5vZGVzKCkge1xyXG5cclxuICAgIC8vQ2xlYXIgc2lkZWJhciBpZiBhbHJlYWR5IHNldCB1cFxyXG4gICAgZm9yIChsZXQgZWxlbWVudCBvZiB3MnVpWydzaWRlYmFyJ10ubm9kZXMpIHtcclxuICAgICAgICBpZiAoZWxlbWVudC5pZCAhPSAnQWxsJykge1xyXG4gICAgICAgICAgICB3MnVpWydzaWRlYmFyJ10ubm9kZXMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgdzJ1aVsnc2lkZWJhciddLm5vZGVzLmluZGV4T2YoZWxlbWVudC5pZCksXHJcbiAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdzJ1aVsnc2lkZWJhciddLnJlZnJlc2goKTtcclxuXHJcbiAgICAvL1JlZ2VuZXJhdGUgICAgXHJcblxyXG4gICAgbGV0IHBhY2tOb2RlID0ge1xyXG4gICAgICAgIGlkOiAncGFja0dyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnUGFjayBGaWxlcycsXHJcbiAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInLFxyXG4gICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH07XHJcblxyXG4gICAgbGV0IHRleHR1cmVOb2RlID0ge1xyXG4gICAgICAgIGlkOiAndGV4dHVyZUdyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnVGV4dHVyZSBmaWxlcycsXHJcbiAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInLFxyXG4gICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdW5zb3J0ZWROb2RlID0ge1xyXG4gICAgICAgIGlkOiAndW5zb3J0ZWRHcm91cCcsXHJcbiAgICAgICAgdGV4dDogJ1Vuc29ydGVkJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBCdWlsZCBzaWRlYmFyIG5vZGVzXHJcbiAgICBmb3IgKGxldCBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG4gICAgICAgIGlmIChHbG9iYWxzLl9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICBncm91cDogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IGlzUGFjayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRleHR1cmVOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gJ0JJTkFSSUVTJykge1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJCaW5hcmllc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnU1RSSU5HUycpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiU3RyaW5nc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHBhY2tOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gJ1VOS05PV04nKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlVua25vd25cIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogZmlsZVR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB1bnNvcnRlZE5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBhY2tOb2RlLm5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHBhY2tOb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGV4dHVyZU5vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQodGV4dHVyZU5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh1bnNvcnRlZE5vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQodW5zb3J0ZWROb2RlKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9wZW5GaWxlUG9wdXAoKSB7XHJcbiAgICAvLy8gQXNrIGZvciBmaWxlXHJcbiAgICB3MnBvcHVwLm9wZW4oe1xyXG4gICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgIHRpdGxlOiAnTG9hZCBBIEdXMiBkYXQnLFxyXG4gICAgICAgIG1vZGFsOiB0cnVlLFxyXG4gICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgYm9keTogJzxkaXYgY2xhc3M9XCJ3MnVpLWNlbnRlcmVkXCI+JyArXHJcbiAgICAgICAgICAgICc8ZGl2IGlkPVwiZmlsZUxvYWRQcm9ncmVzc1wiIC8+JyArXHJcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgICQoXCIjZmlsZVBpY2tlclBvcFwiKVxyXG4gICAgICAgIC5jaGFuZ2UoXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChldnQpIHtcclxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2xyID0gVDNELmdldExvY2FsUmVhZGVyKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2dC50YXJnZXQuZmlsZXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25SZWFkZXJDYWxsYmFjayxcclxuICAgICAgICAgICAgICAgICAgICBcIi4uL3N0YXRpYy90M2R3b3JrZXIuanNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKSB7XHJcblxyXG4gICAgb25SZWFkZXJDYWxsYmFjayA9IG9uUmVhZGVyQ3JlYXRlZDtcclxuXHJcbiAgICBtYWluR3JpZCgpO1xyXG4gICAgdG9vbGJhcigpO1xyXG4gICAgc2lkZWJhcigpO1xyXG4gICAgZmlsZUJyb3dzZXIoKTtcclxuICAgIGZpbGVWaWV3KCk7XHJcbiAgICBzdHJpbmdHcmlkKCk7XHJcblxyXG4gICAgLy9TZXR1cCB2aWV3ZXJzXHJcbiAgICBGaWxlVmlld2VyLnNldHVwVmlld2VycygpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgU0VUIFVQIFRSRUUgM0QgU0NFTkVcclxuICAgICovXHJcbiAgICAvLyBVdGlscy5zZXR1cFNjZW5lKCk7XHJcblxyXG4gICAgb3BlbkZpbGVQb3B1cCgpO1xyXG5cclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBpbml0TGF5b3V0OiBpbml0TGF5b3V0LFxyXG4gICAgc2lkZWJhck5vZGVzOiBzaWRlYmFyTm9kZXMsXHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG4vLy8gRXhwb3J0cyBjdXJyZW50IG1vZGVsIGFzIGFuIC5vYmogZmlsZSB3aXRoIGEgLm10bCByZWZlcmluZyAucG5nIHRleHR1cmVzLlxyXG5mdW5jdGlvbiBleHBvcnRTY2VuZSgpIHtcclxuXHJcbiAgICAvLy8gR2V0IGxhc3QgbG9hZGVkIGZpbGVJZFx0XHRcclxuICAgIHZhciBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQ7XHJcblxyXG4gICAgLy8vIFJ1biBUM0QgaGFja2VkIHZlcnNpb24gb2YgT0JKRXhwb3J0ZXJcclxuICAgIHZhciByZXN1bHQgPSBuZXcgVEhSRUUuT0JKRXhwb3J0ZXIoKS5wYXJzZShHbG9iYWxzLl9zY2VuZSwgZmlsZUlkKTtcclxuXHJcbiAgICAvLy8gUmVzdWx0IGxpc3RzIHdoYXQgZmlsZSBpZHMgYXJlIHVzZWQgZm9yIHRleHR1cmVzLlxyXG4gICAgdmFyIHRleElkcyA9IHJlc3VsdC50ZXh0dXJlSWRzO1xyXG5cclxuICAgIC8vLyBTZXQgdXAgdmVyeSBiYXNpYyBtYXRlcmlhbCBmaWxlIHJlZmVyaW5nIHRoZSB0ZXh0dXJlIHBuZ3NcclxuICAgIC8vLyBwbmdzIGFyZSBnZW5lcmF0ZWQgYSBmZXcgbGluZXMgZG93bi5cclxuICAgIHZhciBtdGxTb3VyY2UgPSBcIlwiO1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24gKHRleElkKSB7XHJcbiAgICAgICAgbXRsU291cmNlICs9IFwibmV3bXRsIHRleF9cIiArIHRleElkICsgXCJcXG5cIiArXHJcbiAgICAgICAgICAgIFwiICBtYXBfS2EgdGV4X1wiICsgdGV4SWQgKyBcIi5wbmdcXG5cIiArXHJcbiAgICAgICAgICAgIFwiICBtYXBfS2QgdGV4X1wiICsgdGV4SWQgKyBcIi5wbmdcXG5cXG5cIjtcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBvYmpcclxuICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jlc3VsdC5vYmpdLCB7XHJcbiAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxyXG4gICAgfSk7XHJcbiAgICBzYXZlRGF0YShibG9iLCBcImV4cG9ydC5cIiArIGZpbGVJZCArIFwiLm9ialwiKTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgbXRsXHJcbiAgICBibG9iID0gbmV3IEJsb2IoW210bFNvdXJjZV0sIHtcclxuICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXHJcbiAgICB9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsIFwiZXhwb3J0LlwiICsgZmlsZUlkICsgXCIubXRsXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCB0ZXh0dXJlIHBuZ3NcclxuICAgIHRleElkcy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXhJZCkge1xyXG5cclxuICAgICAgICAvLy8gTG9jYWxSZWFkZXIgd2lsbCBoYXZlIHRvIHJlLWxvYWQgdGhlIHRleHR1cmVzLCBkb24ndCB3YW50IHRvIGZldGNoXHJcbiAgICAgICAgLy8vIHRoZW4gZnJvbSB0aGUgbW9kZWwgZGF0YS4uXHJcbiAgICAgICAgR2xvYmFscy5fbHIubG9hZFRleHR1cmVGaWxlKHRleElkLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoaW5mbGF0ZWREYXRhLCBkeHRUeXBlLCBpbWFnZVdpZHRoLCBpbWFnZUhlaWd0aCkge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUganMgaW1hZ2UgdXNpbmcgcmV0dXJuZWQgYml0bWFwIGRhdGEuXHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2UgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogbmV3IFVpbnQ4QXJyYXkoaW5mbGF0ZWREYXRhKSxcclxuICAgICAgICAgICAgICAgICAgICB3aWR0aDogaW1hZ2VXaWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IGltYWdlSGVpZ3RoXHJcbiAgICAgICAgICAgICAgICB9O1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBOZWVkIGEgY2FudmFzIGluIG9yZGVyIHRvIGRyYXdcclxuICAgICAgICAgICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcyAvPlwiKTtcclxuICAgICAgICAgICAgICAgICQoXCJib2R5XCIpLmFwcGVuZChjYW52YXMpO1xyXG5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9IGltYWdlLndpZHRoO1xyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9IGltYWdlLmhlaWdodDtcclxuXHJcbiAgICAgICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzWzBdLmdldENvbnRleHQoXCIyZFwiKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gRHJhdyByYXcgYml0bWFwIHRvIGNhbnZhc1xyXG4gICAgICAgICAgICAgICAgdmFyIHVpY2EgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoaW1hZ2UuZGF0YSk7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEoaW1hZ2VkYXRhLCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gVGhpcyBpcyB3aGVyZSBzaGl0IGdldHMgc3R1cGlkLiBGbGlwcGluZyByYXcgYml0bWFwcyBpbiBqc1xyXG4gICAgICAgICAgICAgICAgLy8vIGlzIGFwcGFyZW50bHkgYSBwYWluLiBCYXNpY2x5IHJlYWQgY3VycmVudCBzdGF0ZSBwaXhlbCBieSBwaXhlbFxyXG4gICAgICAgICAgICAgICAgLy8vIGFuZCB3cml0ZSBpdCBiYWNrIHdpdGggZmxpcHBlZCB5LWF4aXMgXHJcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBjdHguZ2V0SW1hZ2VEYXRhKDAsIDAsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgb3V0cHV0IGltYWdlIGRhdGEgYnVmZmVyXHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0ID0gY3R4LmNyZWF0ZUltYWdlRGF0YShpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gR2V0IGltYWdlZGF0YSBzaXplXHJcbiAgICAgICAgICAgICAgICB2YXIgdyA9IGlucHV0LndpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGggPSBpbnB1dC5oZWlnaHQ7XHJcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXREYXRhID0gaW5wdXQuZGF0YTtcclxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXREYXRhID0gb3V0cHV0LmRhdGFcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gTG9vcCBwaXhlbHNcclxuICAgICAgICAgICAgICAgIGZvciAodmFyIHkgPSAxOyB5IDwgaCAtIDE7IHkgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGZvciAodmFyIHggPSAxOyB4IDwgdyAtIDE7IHggKz0gMSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIElucHV0IGxpbmVhciBjb29yZGluYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBpID0gKHkgKiB3ICsgeCkgKiA0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIE91dHB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgZmxpcCA9ICgoaCAtIHkpICogdyArIHgpICogNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBSZWFkIGFuZCB3cml0ZSBSR0JBXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBUT0RPOiBQZXJoYXBzIHB1dCBhbHBoYSB0byAxMDAlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvciAodmFyIGMgPSAwOyBjIDwgNDsgYyArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXREYXRhW2kgKyBjXSA9IGlucHV0RGF0YVtmbGlwICsgY107XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFdyaXRlIGJhY2sgZmxpcHBlZCBkYXRhXHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKG91dHB1dCwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIEZldGNoIGNhbnZhcyBkYXRhIGFzIHBuZyBhbmQgZG93bmxvYWQuXHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0udG9CbG9iKFxyXG4gICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChwbmdCbG9iKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHNhdmVEYXRhKHBuZ0Jsb2IsIFwidGV4X1wiICsgdGV4SWQgKyBcIi5wbmdcIik7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gUmVtb3ZlIGNhbnZhcyBmcm9tIERPTVxyXG4gICAgICAgICAgICAgICAgY2FudmFzLnJlbW92ZSgpO1xyXG5cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcblxyXG5cclxuICAgIH0pO1xyXG5cclxufVxyXG5cclxuXHJcblxyXG4vLy8gVXRpbGl0eSBmb3IgZG93bmxvYWRpbmcgZmlsZXMgdG8gY2xpZW50XHJcbnZhciBzYXZlRGF0YSA9IChmdW5jdGlvbiAoKSB7XHJcbiAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xyXG4gICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChhKTtcclxuICAgIGEuc3R5bGUgPSBcImRpc3BsYXk6IG5vbmVcIjtcclxuICAgIHJldHVybiBmdW5jdGlvbiAoYmxvYiwgZmlsZU5hbWUpIHtcclxuICAgICAgICB2YXIgdXJsID0gd2luZG93LlVSTC5jcmVhdGVPYmplY3RVUkwoYmxvYik7XHJcbiAgICAgICAgYS5ocmVmID0gdXJsO1xyXG4gICAgICAgIGEuZG93bmxvYWQgPSBmaWxlTmFtZTtcclxuICAgICAgICBhLmNsaWNrKCk7XHJcbiAgICAgICAgd2luZG93LlVSTC5yZXZva2VPYmplY3RVUkwodXJsKTtcclxuICAgIH07XHJcbn0oKSk7XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUhleFRhYmxlKHJhd0RhdGEsIGRvbUNvbnRhaW5lciwgY2FsbGJhY2spIHtcclxuICAgIGxldCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShyYXdEYXRhKTtcclxuICAgIGxldCBoZXhPdXRwdXQgPSBbXTtcclxuICAgIGxldCBhc2NpaU91dHB1dCA9IFtdO1xyXG4gICAgY29uc3QgbG9vcENodW5rU2l6ZSA9IDEwMDAwO1xyXG5cclxuICAgIGNvbnN0IEFTQ0lJID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JyArICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWicgK1xyXG4gICAgICAgICcwMTIzNDU2Nzg5JyArICchXCIjJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXFxdXl9ge3x9fic7XHJcblxyXG4gICAgJChkb21Db250YWluZXIpLmh0bWwoXCJcIik7XHJcbiAgICAkKGRvbUNvbnRhaW5lcikuYXBwZW5kKGBcclxuPHRhYmxlIGNsYXNzPVwiaGV4YVRhYmxlXCI+XHJcbiAgICA8dHI+XHJcbiAgICAgICAgPHRoPkFkZHJlc3M8L3RoPlxyXG4gICAgICAgIDx0aD4wMDwvdGg+PHRoPjAxPC90aD48dGg+MDI8L3RoPjx0aD4wMzwvdGg+PHRoPjA0PC90aD48dGg+MDU8L3RoPjx0aD4wNjwvdGg+PHRoPjA3PC90aD5cclxuICAgICAgICA8dGg+MDg8L3RoPjx0aD4wOTwvdGg+PHRoPjBBPC90aD48dGg+MEI8L3RoPjx0aD4wQzwvdGg+PHRoPjBEPC90aD48dGg+MEU8L3RoPjx0aD4wRjwvdGg+XHJcbiAgICAgICAgPHRoPkFTQ0lJPC90aD5cclxuICAgIDwvdHI+YCk7XHJcblxyXG5cclxuICAgIC8vQnJlYWt1cCB0aGUgd29yayBpbnRvIHNsaWNlcyBvZiAxMGtCIGZvciBwZXJmb3JtYW5jZVxyXG4gICAgbGV0IGJ5dGVBcnJheVNsaWNlID0gW107XHJcbiAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBieXRlQXJyYXkubGVuZ3RoOyBwb3MgKz0gbG9vcENodW5rU2l6ZSkge1xyXG4gICAgICAgIGJ5dGVBcnJheVNsaWNlLnB1c2goYnl0ZUFycmF5LnNsaWNlKHBvcywgcG9zICsgbG9vcENodW5rU2l6ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBsb29wQ291bnQgPSAwO1xyXG4gICAgbGV0IGxvb3BGdW5jID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgIGxldCBieXRlQXJyYXlJdGVtID0gYnl0ZUFycmF5U2xpY2VbbG9vcENvdW50XTtcclxuICAgICAgICAvL0lmIHRoZXJlIGlzIG5vIG1vcmUgd29yayB3ZSBjbGVhciB0aGUgbG9vcCBhbmQgY2FsbGJhY2tcclxuICAgICAgICBpZiAoYnl0ZUFycmF5SXRlbSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChsb29wRnVuYyk7XHJcbiAgICAgICAgICAgICQoZG9tQ29udGFpbmVyICsgXCIgdGFibGVcIikuYXBwZW5kKFwiPC90YWJsZT5cIik7XHJcbiAgICAgICAgICAgICQoZG9tQ29udGFpbmVyKS5zaG93KCk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vV29yayB3aXRoIGxpbmVzIG9mIDE2IGJ5dGVzXHJcbiAgICAgICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgYnl0ZUFycmF5SXRlbS5sZW5ndGg7IHBvcyArPSAxNikge1xyXG4gICAgICAgICAgICBsZXQgd29ya1NsaWNlID0gYnl0ZUFycmF5SXRlbS5zbGljZShwb3MsIHBvcyArIDE2KTtcclxuICAgICAgICAgICAgbGV0IHJvd0hUTUwgPSBcIjx0cj5cIjtcclxuICAgICAgICAgICAgbGV0IGFzY2lpTGluZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTnVtYmVyKHBvcyArIChsb29wQ291bnQgKiBsb29wQ2h1bmtTaXplKSkudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgICAgICBhZGRyZXNzID0gYWRkcmVzcy5sZW5ndGggIT0gOCA/ICcwJy5yZXBlYXQoOCAtIGFkZHJlc3MubGVuZ3RoKSArIGFkZHJlc3MgOiBhZGRyZXNzO1xyXG4gICAgICAgICAgICByb3dIVE1MICs9ICc8dGQ+JyArIGFkZHJlc3MgKyAnPC90ZD4nO1xyXG5cclxuICAgICAgICAgICAgLy9JdGVyYXRlIHRocm91Z2ggZWFjaCBieXRlIG9mIHRoZSAxNmJ5dGVzIGxpbmVcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYnl0ZSA9IHdvcmtTbGljZVtpXTtcclxuICAgICAgICAgICAgICAgIGxldCBieXRlSGV4Q29kZTtcclxuICAgICAgICAgICAgICAgIGlmIChieXRlICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gYnl0ZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IGJ5dGVIZXhDb2RlLmxlbmd0aCA9PSAxID8gXCIwXCIgKyBieXRlSGV4Q29kZSA6IGJ5dGVIZXhDb2RlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IFwiICBcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByb3dIVE1MICs9ICc8dGQ+JyArIGJ5dGVIZXhDb2RlICsgJzwvdGQ+JztcclxuICAgICAgICAgICAgICAgIGxldCBhc2NpaUNvZGUgPSBieXRlID8gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSA6IFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgYXNjaWlDb2RlID0gQVNDSUkuaW5jbHVkZXMoYXNjaWlDb2RlKSA/IGFzY2lpQ29kZSA6IFwiLlwiO1xyXG4gICAgICAgICAgICAgICAgYXNjaWlMaW5lICs9IGFzY2lpQ29kZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcm93SFRNTCArPSAnPHRkPicgKyBhc2NpaUxpbmUgKyAnPC90ZD48L3RyPiAnO1xyXG4gICAgICAgICAgICAkKGRvbUNvbnRhaW5lciArIFwiIHRhYmxlXCIpLmFwcGVuZChyb3dIVE1MKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvb3BDb3VudCArPSAxO1xyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbi8vVGhpcyBzcGVjaWFsIGZvckVhY2ggaGF2ZSBhbiBhZGRpdGlvbmFsIHBhcmFtZXRlciB0byBhZGQgYSBzZXRUaW1lb3V0KDEpIGJldHdlZW4gZWFjaCBcImNodW5rU2l6ZVwiIGl0ZW1zXHJcbmZ1bmN0aW9uIGFzeW5jRm9yRWFjaChhcnJheSwgY2h1bmtTaXplLCBmbikge1xyXG4gICAgbGV0IHdvcmtBcnJheSA9IFtdO1xyXG4gICAgLy9TbGljZSB1cCB0aGUgYXJyYXkgaW50byB3b3JrIGFycmF5IGZvciBzeW5jaHJvbm91cyBjYWxsXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5LnNpemU7IGkgKz0gY2h1bmtTaXplKSB7XHJcbiAgICAgICAgd29ya0FycmF5LnB1c2goYXJyYXkuc2xpY2UoaSwgaSArIGNodW5rU2l6ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vTG9vcGNvdW50IGlzIHRoZSBhbW91bnQgb2YgdGltZXMgY2h1bmtTaXplIGhhdmUgYmVlbiByZWFjaGVkXHJcbiAgICBsZXQgbG9vcGNvdW50ID0gMDtcclxuICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAvL0l0ZXJhdGUgdGhyb3VnaCB0aGUgY2h1bmtcclxuICAgICAgICBmb3IgKGxldCBpbmRleCBpbiB3b3JrQXJyYXkpIHtcclxuICAgICAgICAgICAgbGV0IGl0ZW0gPSB3b3JrQXJyYXlbaW5kZXhdO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSBpbmRleCArIChsb29wY291bnQgKiBjaHVua1NpemUpO1xyXG4gICAgICAgICAgICBmbihpdGVtLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0NoZWNrIGlmIHRoZXJlIGlzIG1vcmUgd29yayBvciBub3RcclxuICAgICAgICBsb29wY291bnQgKz0gMTtcclxuICAgICAgICBpZiAobG9vcGNvdW50ID09IHdvcmtBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZXhwb3J0U2NlbmU6IGV4cG9ydFNjZW5lLFxyXG4gICAgc2F2ZURhdGE6IHNhdmVEYXRhLFxyXG4gICAgZ2VuZXJhdGVIZXhUYWJsZTogZ2VuZXJhdGVIZXhUYWJsZVxyXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIEhlYWRWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcImhlYWRWaWV3XCIsIFwiT3ZlcnZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICBzZXR1cCgpIHtcbiAgICAgICAgJCgnI2hlYWRHcmlkJykudzJncmlkKHtcbiAgICAgICAgICAgIG5hbWU6ICdPdmVydmlldycsXG4gICAgICAgICAgICBjb2x1bW5zOiBbe1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3R5cGUnLFxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVHlwZScsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6ICc1MCUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiAndmFsdWUnLFxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVmFsdWUnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnNTAlJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb3JkczogW11cbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHJhdyA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdEYXRhXCIpO1xuXG4gICAgICAgICAgICB2YXIgZHMgPSBuZXcgRGF0YVN0cmVhbShyYXcpO1xuICAgICAgICAgICAgdmFyIGZpcnN0NCA9IGRzLnJlYWRDU3RyaW5nKDQpO1xuXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuaHRtbChcIlwiKTtcbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gKS5hcHBlbmQoJzxkaXYgaWQ9XCJoZWFkR3JpZFwiIHN0eWxlPVwiaGVpZ2h0OiA0NTBweFwiPjwvZGl2PicpO1xuXG4gICAgICAgICAgICB3MnVpWydPdmVydmlldyddLnJlY29yZHMgPSBbe1xuICAgICAgICAgICAgICAgICAgICByZWNpZDogMSxcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogJ0ZpbGUgSUQnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlY2lkOiAyLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnRmlsZSBzaXplJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IHJhdy5ieXRlTGVuZ3RoXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIHJlY2lkOiAzLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnRmlsZSB0eXBlJyxcbiAgICAgICAgICAgICAgICAgICAgdmFsdWU6IGZpcnN0NFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF07XG4gICAgICAgICAgICB3MnVpWydPdmVydmlldyddLnJlZnJlc2goKTtcblxuICAgICAgICAgICAgdzJ1aVsnT3ZlcnZpZXcnXS5yZW5kZXIoJCgnI2hlYWRHcmlkJylbMF0pO1xuXG4gICAgICAgICAgICAvL1RPRE86XG4gICAgICAgICAgICAvL01GVCBpbmRleFxuICAgICAgICAgICAgLy9CYXNlSWRcbiAgICAgICAgICAgIC8vRmlsZVR5cGVcbiAgICAgICAgICAgIC8vQ29tcHJlc3NlZCBzaXplXG4gICAgICAgICAgICAvL1VuY29tcHJlc3NlZCBzaXplXG4gICAgICAgICAgICAvL1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cbiAgICAvL0hlYWR2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICB3MnVpWydPdmVydmlldyddLmRlbGV0ZSgpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZXhhVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIC8vc3VwZXIoXCIjZmlsZVRhYnNIZXhWaWV3XCIsIFwiI2hleFZpZXdcIiwgXCJ0YWJIZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgICAgICAvL1V0aWxzLmdlbmVyYXRlSGV4VGFibGUocmF3RGF0YSwgYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gLCAoKSA9PiB7fSk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIC8vSGV4YSB2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZXhhVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBNb2RlbFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwibW9kZWxcIiwgXCJNb2RlbFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZU1vZGVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcbiAgICAgICAgLy8vIFJlbW92ZSBvbGQgbW9kZWxzIGZyb20gdGhlIHNjZW5lXG4gICAgICAgIGlmIChHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG1kbCBvZiBHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9zY2VuZS5yZW1vdmUobWRsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUgJiYgcGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ01PREwnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cblxuICAgIG9uUmVuZGVyZXJEb25lTW9kZWwoKSB7XG5cbiAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLnNob3coKTtcblxuICAgICAgICAvLy8gUmUtZml0IGNhbnZhc1xuICAgICAgICBHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZSgpO1xuXG4gICAgICAgIC8vLyBBZGQgY29udGV4dCB0b29sYmFyIGV4cG9ydCBidXR0b25cbiAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhVdGlscy5leHBvcnRTY2VuZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xuICAgICAgICBHbG9iYWxzLl9tb2RlbHMgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLCBcIm1lc2hlc1wiLCBbXSk7XG5cbiAgICAgICAgLy8vIEtlZXBpbmcgdHJhY2sgb2YgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGxhdGVyXG4gICAgICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcblxuICAgICAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXG4gICAgICAgIGZvciAobGV0IG1vZGVsIG9mIEdsb2JhbHMuX21vZGVscykge1xuXG4gICAgICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcbiAgICAgICAgICAgIGlmICghYmlnZ2VzdE1kbCB8fCBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyA8IG1vZGVsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGJpZ2dlc3RNZGwgPSBtb2RlbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8vIEZvY3VzIGNhbWVyYSB0byB0aGUgYmlnZXN0IG1vZGVsLCBkb2Vzbid0IHdvcmsgZ3JlYXQuXG4gICAgICAgIHZhciBkaXN0ID0gKGJpZ2dlc3RNZGwgJiYgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZSkgPyBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyAvIE1hdGgudGFuKE1hdGguUEkgKiA2MCAvIDM2MCkgOiAxMDA7XG4gICAgICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsIGRpc3QpO1xuICAgICAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnggPSBkaXN0ICogTWF0aC5zcXJ0KDIpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueSA9IDUwO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueiA9IDA7XG5cblxuICAgICAgICBpZiAoYmlnZ2VzdE1kbClcbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XG4gICAgfVxuXG5cbiAgICBzZXR1cCgpIHtcbiAgICAgICAgLy8vIFNldHRpbmcgdXAgYSBzY2VuZSwgVHJlZS5qcyBzdGFuZGFyZCBzdHVmZi4uLlxuICAgICAgICB2YXIgY2FudmFzV2lkdGggPSAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKS53aWR0aCgpO1xuICAgICAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJChcIiNcIiArIHRoaXMuZ2V0T3V0cHV0SWQoKSkuaGVpZ2h0KCk7XG4gICAgICAgIHZhciBjYW52YXNDbGVhckNvbG9yID0gMHgzNDI5MjA7IC8vIEZvciBoYXBweSByZW5kZXJpbmcsIGFsd2F5cyB1c2UgVmFuIER5a2UgQnJvd24uXG4gICAgICAgIHZhciBmb3YgPSA2MDtcbiAgICAgICAgdmFyIGFzcGVjdCA9IDE7XG4gICAgICAgIHZhciBuZWFyID0gMC4xO1xuICAgICAgICB2YXIgZmFyID0gNTAwMDAwO1xuXG4gICAgICAgIEdsb2JhbHMuX29uQ2FudmFzUmVzaXplID0gKCkgPT4ge1xuXG4gICAgICAgICAgICB2YXIgc2NlbmVXaWR0aCA9ICQoXCIjXCIgKyB0aGlzLmdldE91dHB1dElkKCkpLndpZHRoKCk7XG4gICAgICAgICAgICB2YXIgc2NlbmVIZWlnaHQgPSAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgaWYgKCFzY2VuZUhlaWdodCB8fCAhc2NlbmVXaWR0aClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoc2NlbmVXaWR0aCwgc2NlbmVIZWlnaHQpO1xuXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgR2xvYmFscy5fY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xuICAgICAgICB2YXIgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDU1NTU1NSk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChhbWJpZW50TGlnaHQpO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAuOCk7XG4gICAgICAgIGRpcmVjdGlvbmFsTGlnaHQxLnBvc2l0aW9uLnNldCgwLCAwLCAxKTtcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQxKTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xuICAgICAgICBkaXJlY3Rpb25hbExpZ2h0Mi5wb3NpdGlvbi5zZXQoMSwgMCwgMCk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0Mik7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodDMpO1xuXG4gICAgICAgIC8vLyBTdGFuZGFyZCBUSFJFRSByZW5kZXJlciB3aXRoIEFBXG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgICAgICAgYW50aWFsaWFzaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoXCIjXCIgKyB0aGlzLmdldE91dHB1dElkKCkpWzBdLmFwcGVuZENoaWxkKEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCk7XG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldENsZWFyQ29sb3IoY2FudmFzQ2xlYXJDb2xvcik7XG5cbiAgICAgICAgLy8vIEFkZCBUSFJFRSBvcmJpdCBjb250cm9scywgZm9yIHNpbXBsZSBvcmJpdGluZywgcGFubmluZyBhbmQgem9vbWluZ1xuICAgICAgICBHbG9iYWxzLl9jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKEdsb2JhbHMuX2NhbWVyYSwgR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlO1xuXG4gICAgICAgIC8vLyBTZW1zIHcydWkgZGVsYXlzIHJlc2l6aW5nIDovXG4gICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZSwgMTApXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXG4gICAgICAgIHJlbmRlcigpO1xuICAgIH1cbn1cblxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cbmZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgR2xvYmFscy5fcmVuZGVyZXIucmVuZGVyKEdsb2JhbHMuX3NjZW5lLCBHbG9iYWxzLl9jYW1lcmEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBQYWNrVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJwYWNrXCIsIFwiUGFjayBmaWxlXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuaHRtbChcIlwiKTtcbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gKS5hcHBlbmQoJChcIjxoMj5cIiArIHRoaXMubmFtZSArIFwiPC9oMj5cIikpO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBjaHVuayBvZiBwYWNrZmlsZS5jaHVua3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSAkKFwiPGZpZWxkc2V0IC8+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBsZWdlbmQgPSAkKFwiPGxlZ2VuZD5cIiArIGNodW5rLmhlYWRlci50eXBlICsgXCI8L2xlZ2VuZD5cIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgbG9nQnV0dG9uID0gJChcIjxidXR0b24+TG9nIENodW5rIERhdGEgdG8gQ29uc29sZTwvYnV0dG9uPlwiKTtcbiAgICAgICAgICAgICAgICBsb2dCdXR0b24uY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgXCJMb2dnaW5nXCIsIGNodW5rLmhlYWRlci50eXBlLCBcImNodW5rXCIpO1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgY2h1bmsuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQobGVnZW5kKTtcbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQoJChcIjxwPlNpemU6XCIgKyBjaHVuay5oZWFkZXIuY2h1bmtEYXRhU2l6ZSArIFwiPC9wPlwiKSk7XG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKGxvZ0J1dHRvbik7XG5cbiAgICAgICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuYXBwZW5kKGZpZWxkKTtcbiAgICAgICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuc2hvdygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgcGFjayB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFBhY2tWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIFNvdW5kVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJzb3VuZFwiLCBcIlNvdW5kXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuXG4gICAgICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgICAgIGxldCBjaHVuayA9IHBhY2tmaWxlLmdldENodW5rKFwiQVNORFwiKTtcblxuICAgICAgICAgICAgLy8vIFByaW50IHNvbWUgcmFuZG9tIGRhdGEgYWJvdXQgdGhpcyBzb3VuZFxuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZH1gKVxuICAgICAgICAgICAgICAgIC5odG1sKFxuICAgICAgICAgICAgICAgICAgICBcIkxlbmd0aDogXCIgKyBjaHVuay5kYXRhLmxlbmd0aCArIFwiIHNlY29uZHM8YnIvPlwiICtcbiAgICAgICAgICAgICAgICAgICAgXCJTaXplOiBcIiArIGNodW5rLmRhdGEuYXVkaW9EYXRhLmxlbmd0aCArIFwiIGJ5dGVzXCJcbiAgICAgICAgICAgICAgICApO1xuXG4gICAgICAgICAgICAvLy8gRXh0cmFjdCBzb3VuZCBkYXRhXG4gICAgICAgICAgICB2YXIgc291bmRVaW50QXJyYXkgPSBjaHVuay5kYXRhLmF1ZGlvRGF0YTtcblxuICAgICAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxuICAgICAgICAgICAgICAgIC5zaG93KClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3NvdW5kVWludEFycmF5XSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAgICAgVXRpbHMuc2F2ZURhdGEoYmxvYiwgZmlsZU5hbWUgKyBcIi5tcDNcIik7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPlBsYXkgTVAzPC9idXR0b24+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghR2xvYmFscy5fYXVkaW9Db250ZXh0KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0ID0gbmV3IEF1ZGlvQ29udGV4dCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gU3RvcCBwcmV2aW91cyBzb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG5ldyBidWZmZXIgZm9yIGN1cnJlbnQgc291bmRcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlID0gR2xvYmFscy5fYXVkaW9Db250ZXh0LmNyZWF0ZUJ1ZmZlclNvdXJjZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UuY29ubmVjdChHbG9iYWxzLl9hdWRpb0NvbnRleHQuZGVzdGluYXRpb24pO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gRGVjb2RlIGFuZCBzdGFydCBwbGF5aW5nXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb0NvbnRleHQuZGVjb2RlQXVkaW9EYXRhKHNvdW5kVWludEFycmF5LmJ1ZmZlciwgZnVuY3Rpb24gKHJlcykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLmJ1ZmZlciA9IHJlcztcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdGFydCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPlN0b3AgTVAzPC9idXR0b24+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5zdG9wKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgKVxuICAgICAgICAgICAgICAgICk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZSAmJiBwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSAnQVNORCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFNvdW5kVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBTdHJpbmdWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInN0cmluZ1wiLCBcIlN0cmluZ1wiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU3RyaW5nUmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVJZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fY29udGV4dCxcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZW5kZXJlckRvbmVTdHJpbmcoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cblxuICAgIGNsZWFuKCkge1xuXG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBzdHJpbmcgZmlsZSB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgIGxldCBmY2MgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJhd0RhdGFbMF0sIHJhd0RhdGFbMV0sIHJhd0RhdGFbMl0sIHJhd0RhdGFbM10pO1xuICAgICAgICBpZiAoZmNjID09PSAnc3RycycpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxuXG4gICAgb25SZW5kZXJlckRvbmVTdHJpbmcoKSB7XG5cbiAgICAgICAgLy8vIFJlYWQgZGF0YSBmcm9tIHJlbmRlcmVyXG4gICAgICAgIGxldCBzdHJpbmdzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU3RyaW5nUmVuZGVyZXIsIFwic3RyaW5nc1wiLCBbXSk7XG5cbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMgPSBzdHJpbmdzO1xuXG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZCA9IHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzLmxlbmd0aDtcbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnRvdGFsID0gdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkO1xuICAgICAgICB3MnVpLnN0cmluZ0dyaWQucmVmcmVzaCgpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgVGV4dHVyZVZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwidGV4dHVyZVwiLCBcIlRleHR1cmVcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cblxuICAgICAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzPlwiKTtcbiAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICAvL1RPRE86IHVzZSBuZXcgdGV4dHVyZSByZW5kZXJlclxuXG4gICAgICAgICAgICAvL3ZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xuICAgICAgICAgICAgLy92YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgICAgIC8vY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xuXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkfWApLmFwcGVuZChjYW52YXMpO1xuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgdGV4dHVyZSBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgLy9UT0RPIHVzZSB0eXBlcyBmcm9tIERhdGFSZW5kZXJlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGFic3RyYWN0IGNsYXNzLCB1c2Ugb3RoZXIgY2xhc3MgdG8gZGVmaW5lIGJlaGF2aW9yLlxuICogRGVjbGFyaW5nIGEgVmlld2VyIGNsYXNzIGlzIG5vdCBlbm91Z2gsIGRvbid0IGZvcmdldCB0byByZWdpc3RlciBpdCBpbiB0aGUgRmlsZVZpZXdlciBtb2R1bGVcbiAqL1xuXG5jbGFzcyBWaWV3ZXIge1xuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIHRhYiBoZXJlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaWQsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIGdldFcyVGFiSWQoKSB7XG4gICAgICAgIHJldHVybiBgdGFiJHt0aGlzLmlkfWA7XG4gICAgfVxuXG4gICAgZ2V0T3V0cHV0SWQoKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmlkfU91dHB1dGA7XG4gICAgfVxuXG4gICAgZ2V0RG9tVGFiSWQoKSB7XG4gICAgICAgIHJldHVybiBgZmlsZVRhYiR7dGhpcy5pZH1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZhY3VsdGF0aXZlIG1ldGhvZCB0aGF0IGFsbG93cyBzb21lIHJlbmRlcmVycyB0byBzZXR1cCBzdHVmZiBvbiBzdGFydHVwXG4gICAgICovXG4gICAgc2V0dXAoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGhlIGNvbnRlbnQgb2YgdGhlIHRhYiB3aGVuIGNhbGxlZFxuICAgICAqIEl0IGlzIHRoZSByZXNwb25zYWJpbGl0eSBvZiB0aGUgdmlld2VyIHRvIGNhY2hlIGl0J3MgaGVhdnkgdGFza3NcbiAgICAgKiBAcmV0dXJucyB7bnVsbH1cbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWRzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNoaWxkcmVuIGNsYXNzXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gY2xlYW4gbWVtb3J5IGFzIHNvb24gYXMgYW5vdGhlciBmaWxlIGlzIGxvYWRlZFxuICAgICAqL1xuICAgIGNsZWFuKCkge1xuICAgICAgICAkKHRoaXMuZ2V0T3V0cHV0SWQoKSkuaHRtbChcIlwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaWxsIGRldGVybWluZSBpZiB0aGUgdGFiIGNhbiBiZSBhY3RpdmUgb3Igbm90XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZHMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY2hpbGRyZW4gY2xhc3NcIik7XG4gICAgfVxuXG4gICAgLy9JZiBzZXQgdG8gdHJ1ZSwgdGhlIGZpbGUgd2lsbCBiZSBvcGVuZWQgZGlyZWN0bHkgb24gdGhpcyB2aWV3XG4gICAgLy9JZiBtdWx0aXBsZSB2aWV3ZXJzIHJldHVybnMgdHJ1ZSBmb3IgdGhlIHNhbWUgZmlsZSwgaXQgY29tZXMgYmFjayB0byBkZWZhdWx0LlxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXI7Il19
