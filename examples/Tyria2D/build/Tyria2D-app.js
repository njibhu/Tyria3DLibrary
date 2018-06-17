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

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");

        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {
            $(`#${this.getOutputId()}`).html("");
            $(`#${this.getOutputId()}`).append($("<h2>" + this.name + "</h2>"));

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
            Utils.generateHexTable(rawData, `#${this.getOutputId()}`, () => {});
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

            /// Make sure output is clean
            Globals._context = {};

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
        if (packfile.header.type == 'MODL') {
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

            $(`#${this.getDomTabId()}`).html("");
            $(`#${this.getDomTabId()}`).append($("<h2>" + this.name + "</h2>"));

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

                $(`#${this.getDomTabId()}`).append(field);
                $(`#${this.getDomTabId()}`).show();
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
        if (packfile.header.type == 'ASND') {
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
            /// Make sure output is clean
            Globals._context = {};

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hlYWQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hleGEuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL01vZGVsLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9QYWNrLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9Tb3VuZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvU3RyaW5nLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9UZXh0dXJlLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9WaWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5UEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDekRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakRBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pNQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzVFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24oKXtmdW5jdGlvbiByKGUsbix0KXtmdW5jdGlvbiBvKGksZil7aWYoIW5baV0pe2lmKCFlW2ldKXt2YXIgYz1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlO2lmKCFmJiZjKXJldHVybiBjKGksITApO2lmKHUpcmV0dXJuIHUoaSwhMCk7dmFyIGE9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitpK1wiJ1wiKTt0aHJvdyBhLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsYX12YXIgcD1uW2ldPXtleHBvcnRzOnt9fTtlW2ldWzBdLmNhbGwocC5leHBvcnRzLGZ1bmN0aW9uKHIpe3ZhciBuPWVbaV1bMV1bcl07cmV0dXJuIG8obnx8cil9LHAscC5leHBvcnRzLHIsZSxuLHQpfXJldHVybiBuW2ldLmV4cG9ydHN9Zm9yKHZhciB1PVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmUsaT0wO2k8dC5sZW5ndGg7aSsrKW8odFtpXSk7cmV0dXJuIG99cmV0dXJuIHJ9KSgpIiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG4vLyBUaGlzIGZpbGUgaXMgdGhlIG1haW4gZW50cnkgcG9pbnQgZm9yIHRoZSBUeXJpYTJEIGFwcGxpY2F0aW9uXHJcblxyXG4vLy8gUmVxdWlyZXM6XHJcbmNvbnN0IExheW91dCA9IHJlcXVpcmUoJy4vTGF5b3V0Jyk7XHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5cclxuZnVuY3Rpb24gb25SZWFkZXJDcmVhdGVkKCkge1xyXG5cclxuICAgIHcycG9wdXAubG9jaygpO1xyXG5cclxuICAgICQoXCIjZmlsZVBpY2tlclBvcFwiKS5wcm9wKCdkaXNhYmxlZCcsIHRydWUpO1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGU8YnIvPlwiICtcclxuICAgICAgICBcIjxici8+PGJyLz5cIlxyXG4gICAgKTtcclxuXHJcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcclxuICAgICAgICBUM0QuZ2V0RmlsZUxpc3RBc3luYyhHbG9iYWxzLl9scixcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGZpbGVzKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFN0b3JlIGZpbGVMaXN0IGdsb2JhbGx5XHJcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9maWxlTGlzdCA9IGZpbGVzO1xyXG5cclxuICAgICAgICAgICAgICAgIExheW91dC5zaWRlYmFyTm9kZXMoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ2xvc2UgdGhlIHBvcFxyXG4gICAgICAgICAgICAgICAgdzJwb3B1cC5jbG9zZSgpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBTZWxlY3QgdGhlIFwiQWxsXCIgY2F0ZWdvcnlcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5jbGljayhcIkFsbFwiKTtcclxuXHJcbiAgICAgICAgICAgIH0gLy8vIEVuZCByZWFkRmlsZUxpc3RBc3luYyBjYWxsYmFja1xyXG4gICAgICAgICk7XHJcbiAgICB9LCAxKTtcclxuXHJcbn1cclxuXHJcbkxheW91dC5pbml0TGF5b3V0KG9uUmVhZGVyQ3JlYXRlZCk7XHJcblxyXG4vLy8gT3ZlcndyaXRlIHByb2dyZXNzIGxvZ2dlclxyXG5UM0QuTG9nZ2VyLmxvZ0Z1bmN0aW9uc1tUM0QuTG9nZ2VyLlRZUEVfUFJPR1JFU1NdID0gZnVuY3Rpb24gKCkge1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGU8YnIvPlwiICtcclxuICAgICAgICBhcmd1bWVudHNbMV0gKyBcIiU8YnIvPjxici8+XCJcclxuICAgICk7XHJcbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5mdW5jdGlvbiBvbkZpbHRlckNsaWNrKGV2dCkge1xyXG5cclxuICAgIC8vLyBObyBmaWx0ZXIgaWYgY2xpY2tlZCBncm91cCB3YXMgXCJBbGxcIlxyXG4gICAgaWYgKGV2dC50YXJnZXQgPT0gXCJBbGxcIikge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoKTtcclxuICAgIH1cclxuXHJcbiAgICAvLy8gT3RoZXIgZXZlbnRzIGFyZSBmaW5lIHRvIGp1c3QgcGFzc1xyXG4gICAgZWxzZSB7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cChbZXZ0LnRhcmdldF0pO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVHcm91cChmaWxlVHlwZUZpbHRlcikge1xyXG5cclxuICAgIHcydWkuZ3JpZC5yZWNvcmRzID0gW107XHJcblxyXG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IEdsb2JhbHMuX2xyLmdldFJldmVyc2VJbmRleCgpO1xyXG5cclxuICAgIGZvciAodmFyIGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcblxyXG4gICAgICAgIC8vLyBPbmx5IHNob3cgdHlwZXMgd2UndmUgYXNrZWQgZm9yXHJcbiAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyICYmIGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoZmlsZVR5cGUpIDwgMCkge1xyXG5cclxuICAgICAgICAgICAgLy8vIFNwZWNpYWwgY2FzZSBmb3IgXCJwYWNrR3JvdXBcIlxyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIGxldCB0cm91Z2ggYWxsIHBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBOT1QgbGV0IHRyb3VnaHQgYW55IG5vbi1wYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBpLmUuIFN0cmluZ3MsIEJpbmFyaWVzIGV0Y1xyXG4gICAgICAgICAgICBpZiAoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInBhY2tHcm91cFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoXCJ0ZXh0dXJlR3JvdXBcIikgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSkge1xyXG4gICAgICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAoR2xvYmFscy5fZmlsZUxpc3QuaGFzT3duUHJvcGVydHkoZmlsZVR5cGUpKSB7XHJcblxyXG4gICAgICAgICAgICB2YXIgZmlsZUFyciA9IEdsb2JhbHMuX2ZpbGVMaXN0W2ZpbGVUeXBlXTtcclxuICAgICAgICAgICAgZmlsZUFyci5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKG1mdEluZGV4KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGxldCBtZXRhID0gR2xvYmFscy5fbHIuZ2V0RmlsZU1ldGEobWZ0SW5kZXgpO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB2YXIgYmFzZUlkcyA9IHJldmVyc2VUYWJsZVttZnRJbmRleF07XHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVTaXplID0gKG1ldGEpID8gbWV0YS5zaXplIDogXCJcIjtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgaWYgKGZpbGVTaXplID4gMCAmJiBtZnRJbmRleCA+IDE1KSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICB3MnVpWydncmlkJ10ucmVjb3Jkcy5wdXNoKHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlY2lkOiBtZnRJbmRleCwgLy8vIE1GVCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYmFzZUlkczogYmFzZUlkcyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmlsZVNpemU6IGZpbGVTaXplXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1mdEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9IC8vLyBFbmQgZm9yIGVhY2ggbWZ0IGluIHRoaXMgZmlsZSB0eXBlXHJcbiAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgIH0gLy8vIEVuZCBpZiBfZmlsZUxpc3RbZmlsZXR5cGVdXHJcblxyXG4gICAgfSAvLy8gRW5kIGZvciBlYWNoIGZpbGVUeXBlIGtleSBpbiBfZmlsZUxpc3Qgb2JqZWN0XHJcblxyXG4gICAgLy8vIFVwZGF0ZSBmaWxlIGdyaWRcclxuICAgIHcydWkuZ3JpZC5idWZmZXJlZCA9IHcydWkuZ3JpZC5yZWNvcmRzLmxlbmd0aDtcclxuICAgIHcydWkuZ3JpZC50b3RhbCA9IHcydWkuZ3JpZC5idWZmZXJlZDtcclxuICAgIHcydWkuZ3JpZC5yZWZyZXNoKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgb25GaWx0ZXJDbGljazogb25GaWx0ZXJDbGljayxcclxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XG52YXIgVXRpbHMgPSByZXF1aXJlKCcuL1V0aWxzJyk7XG5cbi8vUmVnaXN0ZXIgdmlld2Vyc1xuY29uc3QgSGVhZFZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9IZWFkJyk7XG5jb25zdCBIZXhhVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hleGEnKTtcbmNvbnN0IE1vZGVsVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL01vZGVsJyk7XG5jb25zdCBQYWNrVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL1BhY2snKTtcbmNvbnN0IFNvdW5kVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL1NvdW5kJyk7XG5jb25zdCBTdHJpbmdWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvU3RyaW5nJyk7XG5jb25zdCBUZXh0dXJlVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL1RleHR1cmUnKTtcblxudmFyIFZpZXdlcnMgPSBbXG4gICAgbmV3IEhlYWRWaWV3ZXIoKSxcbiAgICBuZXcgSGV4YVZpZXdlcigpLFxuICAgIG5ldyBNb2RlbFZpZXdlcigpLFxuICAgIG5ldyBQYWNrVmlld2VyKCksXG4gICAgbmV3IFNvdW5kVmlld2VyKCksXG4gICAgbmV3IFN0cmluZ1ZpZXdlcigpLFxuICAgIG5ldyBUZXh0dXJlVmlld2VyKClcbl07XG5cbnZhciBEZWZhdWx0Vmlld2VySW5kZXggPSAwO1xuXG5mdW5jdGlvbiBzZXR1cFZpZXdlcnMoKSB7XG4gICAgZm9yIChsZXQgdGFiIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgdGFiLnNldHVwKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVRhYkxheW91dCgpIHtcbiAgICBmb3IgKGxldCB0YWIgb2YgVmlld2Vycykge1xuICAgICAgICBsZXQgaXNEZWZhdWx0ID0gdGFiID09IFZpZXdlcnNbRGVmYXVsdFZpZXdlckluZGV4XTtcbiAgICAgICAgbGV0IHRhYkh0bWwgPVxuICAgICAgICAgICAgJChgPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9JyR7dGFiLmdldERvbVRhYklkKCl9Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9JyR7dGFiLmdldE91dHB1dElkKCl9Jz48L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PmApO1xuXG4gICAgICAgIGlmICghaXNEZWZhdWx0KSB7XG4gICAgICAgICAgICB0YWJIdG1sLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJyNmaWxlVGFicycpLmFwcGVuZCh0YWJIdG1sKTtcblxuICAgICAgICB3MnVpWydmaWxlVGFicyddLmFkZCh7XG4gICAgICAgICAgICBpZDogdGFiLmdldFcyVGFiSWQoKSxcbiAgICAgICAgICAgIGNhcHRpb246IHRhYi5uYW1lLFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgdGFiLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH1cbiAgICB3MnVpWydmaWxlVGFicyddLnNlbGVjdChWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF0uZ2V0VzJUYWJJZCgpKTtcbn1cblxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpIHtcbiAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcbiAgICAvL05vdCBpbXBsZW1lbnRlZCBpbiBUM0QgeWV0OlxuICAgIC8vbGV0IGZpbGVUeXBlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVUeXBlXCIpO1xuXG4gICAgLy9TaG93IHRoZSBmaWxlbmFtZVxuICAgIC8vVG9kbzogaW1wbGVtZW50IGZpbGVUeXBlXG4gICAgbGV0IGZpbGVOYW1lID0gYCR7ZmlsZUlkfWBcblxuICAgIC8vSXRlcmF0ZSB0aHJvdWdoIHRoZSByZW5kZXJlcnMgdG8ga25vdyB3aG8gY2FuIHNob3cgYW5kIHdob1xuICAgIGxldCBvdmVycmlkZTtcbiAgICBmb3IgKGxldCB2aWV3ZXIgb2YgVmlld2Vycykge1xuICAgICAgICAvL2NoZWNrIGlmIGNhbiB2aWV3XG4gICAgICAgIGlmICh2aWV3ZXIuY2FuVmlldygpKSB7XG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSh2aWV3ZXIuZ2V0VzJUYWJJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgaWYgY2FuIG92ZXJyaWRlXG4gICAgICAgIGxldCBvdmVycmlkZUFiaWxpdHkgPSB2aWV3ZXIub3ZlcnJpZGVEZWZhdWx0KCk7XG4gICAgICAgIGlmIChvdmVycmlkZUFiaWxpdHkgJiYgb3ZlcnJpZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3ZlcnJpZGUgPSB2aWV3ZXI7XG4gICAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVBYmlsaXR5ICYmIG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIC8vU2V0IGFjdGl2ZSB0YWJcbiAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljayhvdmVycmlkZS5nZXRXMlRhYklkKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soVmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdLmdldFcyVGFiSWQoKSk7XG4gICAgfVxuXG4gICAgLy9FbmFibGUgY29udGV4dCB0b29sYmFyIGFuZCBkb3dubG9hZCBidXR0b25cbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCByYXc8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jhd0RhdGFdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLmJpblwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgICk7XG5cbn1cblxuZnVuY3Rpb24gdmlld0ZpbGVCeUZpbGVJZChmaWxlSWQpIHtcblxuICAgIC8vLyBDbGVhbiBvdXRwdXRzXG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChcIlwiKTtcblxuICAgIC8vLyBDbGVhbiBjb250ZXh0IHRvb2xiYXJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmh0bWwoXCJcIik7XG5cbiAgICAvLy8gRGlzYWJsZSBhbmQgY2xlYW4gdGFic1xuICAgIGZvciAobGV0IHZpZXdlciBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSh2aWV3ZXIuZ2V0VzJUYWJJZCgpKTtcbiAgICAgICAgdmlld2VyLmNsZWFuKCk7XG4gICAgfVxuXG4gICAgLy8vIE1ha2Ugc3VyZSBfY29udGV4dCBpcyBjbGVhblxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgIGxldCByZW5kZXJlclNldHRpbmdzID0ge1xuICAgICAgICBpZDogZmlsZUlkXG4gICAgfTtcblxuICAgIC8vLyBSdW4gdGhlIGJhc2ljIERhdGFSZW5kZXJlclxuICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgVDNELkRhdGFSZW5kZXJlcixcbiAgICAgICAgR2xvYmFscy5fbHIsXG4gICAgICAgIHJlbmRlcmVyU2V0dGluZ3MsXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXG4gICAgICAgIG9uQmFzaWNSZW5kZXJlckRvbmVcbiAgICApO1xufVxuXG5mdW5jdGlvbiB2aWV3RmlsZUJ5TUZUKG1mdElkeCkge1xuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcblxuICAgIHZhciBiYXNlSWQgPSAocmV2ZXJzZVRhYmxlW21mdElkeF0pID8gcmV2ZXJzZVRhYmxlW21mdElkeF1bMF0gOiBcIlwiO1xuXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZW5lcmF0ZVRhYkxheW91dDogZ2VuZXJhdGVUYWJMYXlvdXQsXG4gICAgc2V0dXBWaWV3ZXJzOiBzZXR1cFZpZXdlcnMsXG4gICAgdmlld0ZpbGVCeUZpbGVJZDogdmlld0ZpbGVCeUZpbGVJZCxcbiAgICB2aWV3RmlsZUJ5TUZUOiB2aWV3RmlsZUJ5TUZUXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLy9TZXR0aW5nIHVwIHRoZSBnbG9iYWwgdmFyaWFibGVzIGZvciB0aGUgYXBwXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vLyBUM0RcbiAgICBfbHI6IHVuZGVmaW5lZCxcbiAgICBfY29udGV4dDogdW5kZWZpbmVkLFxuICAgIF9maWxlSWQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUxpc3Q6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Tb3VyY2U6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Db250ZXh0OiB1bmRlZmluZWQsXG5cbiAgICAvLy8gVEhSRUVcbiAgICBfc2NlbmU6IHVuZGVmaW5lZCxcbiAgICBfY2FtZXJhOiB1bmRlZmluZWQsXG4gICAgX3JlbmRlcmVyOiB1bmRlZmluZWQsXG4gICAgX21vZGVsczogW10sXG4gICAgX2NvbnRyb2xzOiB1bmRlZmluZWQsXG4gICAgX29uQ2FudmFzUmVzaXplOiBmdW5jdGlvbiAoKSB7fVxuXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBGaWxlVmlld2VyID0gcmVxdWlyZSgnLi9GaWxldmlld2VyJyk7XHJcbmNvbnN0IEZpbGVHcmlkID0gcmVxdWlyZSgnLi9GaWxlZ3JpZCcpO1xyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5jb25zdCBIZXhhVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hleGEnKTtcclxuXHJcblxyXG52YXIgb25SZWFkZXJDYWxsYmFjaztcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBtYWluIGdyaWRcclxuICovXHJcbmZ1bmN0aW9uIG1haW5HcmlkKCkge1xyXG4gICAgY29uc3QgcHN0eWxlID0gJ2JvcmRlcjogMXB4IHNvbGlkICNkZmRmZGY7IHBhZGRpbmc6IDA7JztcclxuXHJcbiAgICAkKCcjbGF5b3V0JykudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd0b3AnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogMjgsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArICcgcGFkZGluZy10b3A6IDFweDsnXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDU3MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnbWFyZ2luOjAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyBcIiBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcIixcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2JhY2tncm91bmQtY29sb3I6I2VhZWFlYTsgaGVpZ2h0OjQwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnY29udGV4dFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRvb2xiYXJFbnRyeVwiIGlkPVwiY29udGV4dFRvb2xiYXJcIj48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuY29udGVudCgnbWFpbicsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uUmVzaXplOiBHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNmaWxlSWRJbnB1dEJ0blwiKS5jbGljayhcclxuICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIEZpbGVWaWV3ZXIudmlld0ZpbGVCeUZpbGVJZCgkKFwiI2ZpbGVJZElucHV0XCIpLnZhbCgpKTtcclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG5cclxuICAgIC8vLyBHcmlkIGluc2lkZSBtYWluIGxlZnRcclxuICAgICQoKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xlZnRMYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDE1MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnbGVmdCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21haW4nLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogNDIwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdyaWdodCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgnbGVmdCcsIHcydWlbJ2xlZnRMYXlvdXQnXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCB0b29sYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiB0b29sYmFyKCkge1xyXG4gICAgJCgpLncydG9vbGJhcih7XHJcbiAgICAgICAgbmFtZTogJ3Rvb2xiYXInLFxyXG4gICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICBpZDogJ2xvYWRGaWxlJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdPcGVuIGZpbGUnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdicmVhaydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21lbnUnLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICd2aWV3JyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdWaWV3JyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBsaXN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBjYXRlZ29yaWVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBwcmV2aWV3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdicmVhaydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21lbnUnLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICd0b29scycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVG9vbHMnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdWaWV3IGNudGMgc3VtbWFyeScsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgIH1dXHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAnb3BlbmVudHJ5JyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdPcGVuIGVudHJ5JyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQmFzZUlEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnTUZUIElEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwYWNlcidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICBpZDogJ21lbnRpb25zJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdUeXJpYTJEJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsb2FkRmlsZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkZpbGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgndG9wJywgdzJ1aVsndG9vbGJhciddKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIHNpZGViYXJcclxuICovXHJcbmZ1bmN0aW9uIHNpZGViYXIoKSB7XHJcbiAgICAvKlxyXG4gICAgICAgIFNJREVCQVJcclxuICAgICovXHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbGVmdCcsICQoKS53MnNpZGViYXIoe1xyXG4gICAgICAgIG5hbWU6ICdzaWRlYmFyJyxcclxuICAgICAgICBpbWc6IG51bGwsXHJcbiAgICAgICAgbm9kZXM6IFt7XHJcbiAgICAgICAgICAgIGlkOiAnQWxsJyxcclxuICAgICAgICAgICAgdGV4dDogJ0FsbCcsXHJcbiAgICAgICAgICAgIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICAgICAgZ3JvdXA6IGZhbHNlXHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgb25DbGljazogRmlsZUdyaWQub25GaWx0ZXJDbGlja1xyXG4gICAgfSkpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZWJyb3dzZXJcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVCcm93c2VyKCkge1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ21haW4nLCAkKCkudzJncmlkKHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZSxcclxuICAgICAgICAgICAgdG9vbGJhclJlbG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFt7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3JlY2lkJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdNRlQgaW5kZXgnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzgwcHgnLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgLy9zZWFyY2hhYmxlOiAnaW50J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2Jhc2VJZHMnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ0Jhc2VJZCBsaXN0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vc2VhcmNoYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3R5cGUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1R5cGUnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzEwMHB4JyxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2ZpbGVTaXplJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdQYWNrIFNpemUnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzg1cHgnLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlNRlQoZXZlbnQucmVjaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGUgdmlldyB3aW5kb3dcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVWaWV3KCkge1xyXG4gICAgJCh3MnVpWydsYXlvdXQnXS5lbCgnbWFpbicpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2IGlkPSdmaWxlVGFicycgLz5cIikpXHJcblxyXG5cclxuICAgICQoXCIjZmlsZVRhYnNcIikudzJ0YWJzKHtcclxuICAgICAgICBuYW1lOiAnZmlsZVRhYnMnLFxyXG4gICAgICAgIHRhYnM6IFtdXHJcbiAgICB9KTtcclxuXHJcbiAgICBGaWxlVmlld2VyLmdlbmVyYXRlVGFiTGF5b3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0dyaWQoKSB7XHJcbiAgICAvLy8gU2V0IHVwIGdyaWQgZm9yIHN0cmluZ3Mgdmlld1xyXG4gICAgLy8vQ3JlYXRlIGdyaWRcclxuICAgICQoXCIjc3RyaW5nT3V0cHV0XCIpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ3N0cmluZ0dyaWQnLFxyXG4gICAgICAgIHNlbGVjdFR5cGU6ICdjZWxsJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFt7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3JlY2lkJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdSb3cgIycsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnNjBweCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICd2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVGV4dCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBoYXZlIGEgbGlzdCBvZiB0aGUgZmlsZXMgdG8gb3JnYW5pemUgdGhlIGNhdGVnb3JpZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyTm9kZXMoKSB7XHJcblxyXG4gICAgLy9DbGVhciBzaWRlYmFyIGlmIGFscmVhZHkgc2V0IHVwXHJcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIHcydWlbJ3NpZGViYXInXS5ub2Rlcykge1xyXG4gICAgICAgIGlmIChlbGVtZW50LmlkICE9ICdBbGwnKSB7XHJcbiAgICAgICAgICAgIHcydWlbJ3NpZGViYXInXS5ub2Rlcy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICB3MnVpWydzaWRlYmFyJ10ubm9kZXMuaW5kZXhPZihlbGVtZW50LmlkKSxcclxuICAgICAgICAgICAgICAgIDFcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB3MnVpWydzaWRlYmFyJ10ucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vUmVnZW5lcmF0ZSAgICBcclxuXHJcbiAgICBsZXQgcGFja05vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICdwYWNrR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdQYWNrIEZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdGV4dHVyZU5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd0ZXh0dXJlR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdUZXh0dXJlIGZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd1bnNvcnRlZEdyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnVW5zb3J0ZWQnLFxyXG4gICAgICAgIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEJ1aWxkIHNpZGViYXIgbm9kZXNcclxuICAgIGZvciAobGV0IGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZU5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnQklOQVJJRVMnKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIkJpbmFyaWVzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlID09ICdTVFJJTkdTJykge1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcGFja05vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnVU5LTk9XTicpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiVW5rbm93blwiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHVuc29ydGVkTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFja05vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQocGFja05vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHVuc29ydGVkTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh1bnNvcnRlZE5vZGUpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gb3BlbkZpbGVQb3B1cCgpIHtcclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3Blbih7XHJcbiAgICAgICAgc3BlZWQ6IDAsXHJcbiAgICAgICAgdGl0bGU6ICdMb2FkIEEgR1cyIGRhdCcsXHJcbiAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgc2hvd0Nsb3NlOiBmYWxzZSxcclxuICAgICAgICBib2R5OiAnPGRpdiBjbGFzcz1cIncydWktY2VudGVyZWRcIj4nICtcclxuICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgJzxpbnB1dCBpZD1cImZpbGVQaWNrZXJQb3BcIiB0eXBlPVwiZmlsZVwiIC8+JyArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpXHJcbiAgICAgICAgLmNoYW5nZShcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBvblJlYWRlckNhbGxiYWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiLi4vc3RhdGljL3QzZHdvcmtlci5qc1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAgdG8gY3JlYXRlIHRoZSBndWkgbGF5b3V0LlxyXG4gKi9cclxuZnVuY3Rpb24gaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpIHtcclxuXHJcbiAgICBvblJlYWRlckNhbGxiYWNrID0gb25SZWFkZXJDcmVhdGVkO1xyXG5cclxuICAgIG1haW5HcmlkKCk7XHJcbiAgICB0b29sYmFyKCk7XHJcbiAgICBzaWRlYmFyKCk7XHJcbiAgICBmaWxlQnJvd3NlcigpO1xyXG4gICAgZmlsZVZpZXcoKTtcclxuICAgIHN0cmluZ0dyaWQoKTtcclxuXHJcbiAgICAvL1NldHVwIHZpZXdlcnNcclxuICAgIEZpbGVWaWV3ZXIuc2V0dXBWaWV3ZXJzKCk7XHJcblxyXG4gICAgLypcclxuICAgICAgICBTRVQgVVAgVFJFRSAzRCBTQ0VORVxyXG4gICAgKi9cclxuICAgIC8vIFV0aWxzLnNldHVwU2NlbmUoKTtcclxuXHJcbiAgICBvcGVuRmlsZVBvcHVwKCk7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2RlcyxcclxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcbi8vLyBFeHBvcnRzIGN1cnJlbnQgbW9kZWwgYXMgYW4gLm9iaiBmaWxlIHdpdGggYSAubXRsIHJlZmVyaW5nIC5wbmcgdGV4dHVyZXMuXHJcbmZ1bmN0aW9uIGV4cG9ydFNjZW5lKCkge1xyXG5cclxuICAgIC8vLyBHZXQgbGFzdCBsb2FkZWQgZmlsZUlkXHRcdFxyXG4gICAgdmFyIGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZDtcclxuXHJcbiAgICAvLy8gUnVuIFQzRCBoYWNrZWQgdmVyc2lvbiBvZiBPQkpFeHBvcnRlclxyXG4gICAgdmFyIHJlc3VsdCA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpLnBhcnNlKEdsb2JhbHMuX3NjZW5lLCBmaWxlSWQpO1xyXG5cclxuICAgIC8vLyBSZXN1bHQgbGlzdHMgd2hhdCBmaWxlIGlkcyBhcmUgdXNlZCBmb3IgdGV4dHVyZXMuXHJcbiAgICB2YXIgdGV4SWRzID0gcmVzdWx0LnRleHR1cmVJZHM7XHJcblxyXG4gICAgLy8vIFNldCB1cCB2ZXJ5IGJhc2ljIG1hdGVyaWFsIGZpbGUgcmVmZXJpbmcgdGhlIHRleHR1cmUgcG5nc1xyXG4gICAgLy8vIHBuZ3MgYXJlIGdlbmVyYXRlZCBhIGZldyBsaW5lcyBkb3duLlxyXG4gICAgdmFyIG10bFNvdXJjZSA9IFwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuICAgICAgICBtdGxTb3VyY2UgKz0gXCJuZXdtdGwgdGV4X1wiICsgdGV4SWQgKyBcIlxcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LYSB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LZCB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblxcblwiO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG9ialxyXG4gICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmVzdWx0Lm9ial0sIHtcclxuICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXHJcbiAgICB9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsIFwiZXhwb3J0LlwiICsgZmlsZUlkICsgXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5tdGxcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24gKHRleElkKSB7XHJcblxyXG4gICAgICAgIC8vLyBMb2NhbFJlYWRlciB3aWxsIGhhdmUgdG8gcmUtbG9hZCB0aGUgdGV4dHVyZXMsIGRvbid0IHdhbnQgdG8gZmV0Y2hcclxuICAgICAgICAvLy8gdGhlbiBmcm9tIHRoZSBtb2RlbCBkYXRhLi5cclxuICAgICAgICBHbG9iYWxzLl9sci5sb2FkVGV4dHVyZUZpbGUodGV4SWQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChpbmZsYXRlZERhdGEsIGR4dFR5cGUsIGltYWdlV2lkdGgsIGltYWdlSGVpZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBqcyBpbWFnZSB1c2luZyByZXR1cm5lZCBiaXRtYXAgZGF0YS5cclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShpbmZsYXRlZERhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2VIZWlndGhcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIE5lZWQgYSBjYW52YXMgaW4gb3JkZXIgdG8gZHJhd1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKGNhbnZhcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBvdXRwdXQgaW1hZ2UgZGF0YSBidWZmZXJcclxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBHZXQgaW1hZ2VkYXRhIHNpemVcclxuICAgICAgICAgICAgICAgIHZhciB3ID0gaW5wdXQud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBMb29wIHBpeGVsc1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeSA9IDE7IHkgPCBoIC0gMTsgeSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDE7IHggPCB3IC0gMTsgeCArPSAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gT3V0cHV0IGxpbmVhciBjb29yZGluYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGlwID0gKChoIC0geSkgKiB3ICsgeCkgKiA0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaSArIGNdID0gaW5wdXREYXRhW2ZsaXAgKyBjXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gV3JpdGUgYmFjayBmbGlwcGVkIGRhdGFcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEob3V0cHV0LCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gRmV0Y2ggY2FudmFzIGRhdGEgYXMgcG5nIGFuZCBkb3dubG9hZC5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS50b0Jsb2IoXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBuZ0Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZURhdGEocG5nQmxvYiwgXCJ0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBSZW1vdmUgY2FudmFzIGZyb20gRE9NXHJcbiAgICAgICAgICAgICAgICBjYW52YXMucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBhLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVOYW1lO1xyXG4gICAgICAgIGEuY2xpY2soKTtcclxuICAgICAgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgfTtcclxufSgpKTtcclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlSGV4VGFibGUocmF3RGF0YSwgZG9tQ29udGFpbmVyLCBjYWxsYmFjaykge1xyXG4gICAgbGV0IGJ5dGVBcnJheSA9IG5ldyBVaW50OEFycmF5KHJhd0RhdGEpO1xyXG4gICAgbGV0IGhleE91dHB1dCA9IFtdO1xyXG4gICAgbGV0IGFzY2lpT3V0cHV0ID0gW107XHJcbiAgICBjb25zdCBsb29wQ2h1bmtTaXplID0gMTAwMDA7XHJcblxyXG4gICAgY29uc3QgQVNDSUkgPSAnYWJjZGVmZ2hpamtsbW5vcHFyc3R1dnd4eXonICsgJ0FCQ0RFRkdISUpLTE1OT1BRUlNUVVZXWFlaJyArXHJcbiAgICAgICAgJzAxMjM0NTY3ODknICsgJyFcIiMkJSZcXCcoKSorLC0uLzo7PD0+P0BbXFxcXF1eX2B7fH1+JztcclxuXHJcbiAgICAkKGRvbUNvbnRhaW5lcikuaHRtbChcIlwiKTtcclxuICAgICQoZG9tQ29udGFpbmVyKS5hcHBlbmQoYFxyXG48dGFibGUgY2xhc3M9XCJoZXhhVGFibGVcIj5cclxuICAgIDx0cj5cclxuICAgICAgICA8dGg+QWRkcmVzczwvdGg+XHJcbiAgICAgICAgPHRoPjAwPC90aD48dGg+MDE8L3RoPjx0aD4wMjwvdGg+PHRoPjAzPC90aD48dGg+MDQ8L3RoPjx0aD4wNTwvdGg+PHRoPjA2PC90aD48dGg+MDc8L3RoPlxyXG4gICAgICAgIDx0aD4wODwvdGg+PHRoPjA5PC90aD48dGg+MEE8L3RoPjx0aD4wQjwvdGg+PHRoPjBDPC90aD48dGg+MEQ8L3RoPjx0aD4wRTwvdGg+PHRoPjBGPC90aD5cclxuICAgICAgICA8dGg+QVNDSUk8L3RoPlxyXG4gICAgPC90cj5gKTtcclxuXHJcblxyXG4gICAgLy9CcmVha3VwIHRoZSB3b3JrIGludG8gc2xpY2VzIG9mIDEwa0IgZm9yIHBlcmZvcm1hbmNlXHJcbiAgICBsZXQgYnl0ZUFycmF5U2xpY2UgPSBbXTtcclxuICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGJ5dGVBcnJheS5sZW5ndGg7IHBvcyArPSBsb29wQ2h1bmtTaXplKSB7XHJcbiAgICAgICAgYnl0ZUFycmF5U2xpY2UucHVzaChieXRlQXJyYXkuc2xpY2UocG9zLCBwb3MgKyBsb29wQ2h1bmtTaXplKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGxvb3BDb3VudCA9IDA7XHJcbiAgICBsZXQgbG9vcEZ1bmMgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgbGV0IGJ5dGVBcnJheUl0ZW0gPSBieXRlQXJyYXlTbGljZVtsb29wQ291bnRdO1xyXG4gICAgICAgIC8vSWYgdGhlcmUgaXMgbm8gbW9yZSB3b3JrIHdlIGNsZWFyIHRoZSBsb29wIGFuZCBjYWxsYmFja1xyXG4gICAgICAgIGlmIChieXRlQXJyYXlJdGVtID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGxvb3BGdW5jKTtcclxuICAgICAgICAgICAgJChkb21Db250YWluZXIgKyBcIiB0YWJsZVwiKS5hcHBlbmQoXCI8L3RhYmxlPlwiKTtcclxuICAgICAgICAgICAgJChkb21Db250YWluZXIpLnNob3coKTtcclxuICAgICAgICAgICAgY2FsbGJhY2soKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9Xb3JrIHdpdGggbGluZXMgb2YgMTYgYnl0ZXNcclxuICAgICAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBieXRlQXJyYXlJdGVtLmxlbmd0aDsgcG9zICs9IDE2KSB7XHJcbiAgICAgICAgICAgIGxldCB3b3JrU2xpY2UgPSBieXRlQXJyYXlJdGVtLnNsaWNlKHBvcywgcG9zICsgMTYpO1xyXG4gICAgICAgICAgICBsZXQgcm93SFRNTCA9IFwiPHRyPlwiO1xyXG4gICAgICAgICAgICBsZXQgYXNjaWlMaW5lID0gXCJcIjtcclxuICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBOdW1iZXIocG9zICsgKGxvb3BDb3VudCAqIGxvb3BDaHVua1NpemUpKS50b1N0cmluZygxNik7XHJcbiAgICAgICAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLmxlbmd0aCAhPSA4ID8gJzAnLnJlcGVhdCg4IC0gYWRkcmVzcy5sZW5ndGgpICsgYWRkcmVzcyA6IGFkZHJlc3M7XHJcbiAgICAgICAgICAgIHJvd0hUTUwgKz0gJzx0ZD4nICsgYWRkcmVzcyArICc8L3RkPic7XHJcblxyXG4gICAgICAgICAgICAvL0l0ZXJhdGUgdGhyb3VnaCBlYWNoIGJ5dGUgb2YgdGhlIDE2Ynl0ZXMgbGluZVxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBieXRlID0gd29ya1NsaWNlW2ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IGJ5dGVIZXhDb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ5dGUgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBieXRlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gYnl0ZUhleENvZGUubGVuZ3RoID09IDEgPyBcIjBcIiArIGJ5dGVIZXhDb2RlIDogYnl0ZUhleENvZGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gXCIgIFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIHJvd0hUTUwgKz0gJzx0ZD4nICsgYnl0ZUhleENvZGUgKyAnPC90ZD4nO1xyXG4gICAgICAgICAgICAgICAgbGV0IGFzY2lpQ29kZSA9IGJ5dGUgPyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpIDogXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBhc2NpaUNvZGUgPSBBU0NJSS5pbmNsdWRlcyhhc2NpaUNvZGUpID8gYXNjaWlDb2RlIDogXCIuXCI7XHJcbiAgICAgICAgICAgICAgICBhc2NpaUxpbmUgKz0gYXNjaWlDb2RlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICByb3dIVE1MICs9ICc8dGQ+JyArIGFzY2lpTGluZSArICc8L3RkPjwvdHI+ICc7XHJcbiAgICAgICAgICAgICQoZG9tQ29udGFpbmVyICsgXCIgdGFibGVcIikuYXBwZW5kKHJvd0hUTUwpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgbG9vcENvdW50ICs9IDE7XHJcbiAgICB9LCAxKTtcclxufVxyXG5cclxuLy9UaGlzIHNwZWNpYWwgZm9yRWFjaCBoYXZlIGFuIGFkZGl0aW9uYWwgcGFyYW1ldGVyIHRvIGFkZCBhIHNldFRpbWVvdXQoMSkgYmV0d2VlbiBlYWNoIFwiY2h1bmtTaXplXCIgaXRlbXNcclxuZnVuY3Rpb24gYXN5bmNGb3JFYWNoKGFycmF5LCBjaHVua1NpemUsIGZuKSB7XHJcbiAgICBsZXQgd29ya0FycmF5ID0gW107XHJcbiAgICAvL1NsaWNlIHVwIHRoZSBhcnJheSBpbnRvIHdvcmsgYXJyYXkgZm9yIHN5bmNocm9ub3VzIGNhbGxcclxuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYXJyYXkuc2l6ZTsgaSArPSBjaHVua1NpemUpIHtcclxuICAgICAgICB3b3JrQXJyYXkucHVzaChhcnJheS5zbGljZShpLCBpICsgY2h1bmtTaXplKSk7XHJcbiAgICB9XHJcblxyXG4gICAgLy9Mb29wY291bnQgaXMgdGhlIGFtb3VudCBvZiB0aW1lcyBjaHVua1NpemUgaGF2ZSBiZWVuIHJlYWNoZWRcclxuICAgIGxldCBsb29wY291bnQgPSAwO1xyXG4gICAgbGV0IGludGVydmFsID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgIC8vSXRlcmF0ZSB0aHJvdWdoIHRoZSBjaHVua1xyXG4gICAgICAgIGZvciAobGV0IGluZGV4IGluIHdvcmtBcnJheSkge1xyXG4gICAgICAgICAgICBsZXQgaXRlbSA9IHdvcmtBcnJheVtpbmRleF07XHJcbiAgICAgICAgICAgIGxldCBpbmRleCA9IGluZGV4ICsgKGxvb3Bjb3VudCAqIGNodW5rU2l6ZSk7XHJcbiAgICAgICAgICAgIGZuKGl0ZW0sIGluZGV4KTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vQ2hlY2sgaWYgdGhlcmUgaXMgbW9yZSB3b3JrIG9yIG5vdFxyXG4gICAgICAgIGxvb3Bjb3VudCArPSAxO1xyXG4gICAgICAgIGlmIChsb29wY291bnQgPT0gd29ya0FycmF5Lmxlbmd0aCkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGludGVydmFsKTtcclxuICAgICAgICB9XHJcbiAgICB9LCAxKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBleHBvcnRTY2VuZTogZXhwb3J0U2NlbmUsXHJcbiAgICBzYXZlRGF0YTogc2F2ZURhdGEsXHJcbiAgICBnZW5lcmF0ZUhleFRhYmxlOiBnZW5lcmF0ZUhleFRhYmxlXHJcbn0iLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgSGVhZFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwiaGVhZFZpZXdcIiwgXCJPdmVydmlld1wiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gKS5odG1sKFwiXCIpO1xuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLmFwcGVuZCgkKFwiPGgyPlwiICsgdGhpcy5uYW1lICsgXCI8L2gyPlwiKSk7XG5cbiAgICAgICAgICAgIC8vVE9ETzpcbiAgICAgICAgICAgIC8vTUZUIGluZGV4XG4gICAgICAgICAgICAvL0Jhc2VJZFxuICAgICAgICAgICAgLy9GaWxlVHlwZVxuICAgICAgICAgICAgLy9Db21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vVW5jb21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIC8vSGVhZHZpZXdlciBjYW4gdmlldyBldmVyeSBmaWxlXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIEhleGFWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcImhleFZpZXdcIiwgXCJIZXggVmlld1wiKTtcbiAgICAgICAgLy9zdXBlcihcIiNmaWxlVGFic0hleFZpZXdcIiwgXCIjaGV4Vmlld1wiLCBcInRhYkhleFZpZXdcIiwgXCJIZXggVmlld1wiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHJhd0RhdGEgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcbiAgICAgICAgICAgIFV0aWxzLmdlbmVyYXRlSGV4VGFibGUocmF3RGF0YSwgYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gLCAoKSA9PiB7fSk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIC8vSGV4YSB2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZXhhVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBNb2RlbFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwibW9kZWxcIiwgXCJNb2RlbFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZU1vZGVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcbiAgICAgICAgLy8vIFJlbW92ZSBvbGQgbW9kZWxzIGZyb20gdGhlIHNjZW5lXG4gICAgICAgIGlmIChHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG1kbCBvZiBHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9zY2VuZS5yZW1vdmUobWRsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ01PREwnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cblxuICAgIG9uUmVuZGVyZXJEb25lTW9kZWwoKSB7XG5cbiAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLnNob3coKTtcblxuICAgICAgICAvLy8gUmUtZml0IGNhbnZhc1xuICAgICAgICBHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZSgpO1xuXG4gICAgICAgIC8vLyBBZGQgY29udGV4dCB0b29sYmFyIGV4cG9ydCBidXR0b25cbiAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhVdGlscy5leHBvcnRTY2VuZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xuICAgICAgICBHbG9iYWxzLl9tb2RlbHMgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLCBcIm1lc2hlc1wiLCBbXSk7XG5cbiAgICAgICAgLy8vIEtlZXBpbmcgdHJhY2sgb2YgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGxhdGVyXG4gICAgICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcblxuICAgICAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXG4gICAgICAgIGZvciAobGV0IG1vZGVsIG9mIEdsb2JhbHMuX21vZGVscykge1xuXG4gICAgICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcbiAgICAgICAgICAgIGlmICghYmlnZ2VzdE1kbCB8fCBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyA8IG1vZGVsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGJpZ2dlc3RNZGwgPSBtb2RlbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8vIEZvY3VzIGNhbWVyYSB0byB0aGUgYmlnZXN0IG1vZGVsLCBkb2Vzbid0IHdvcmsgZ3JlYXQuXG4gICAgICAgIHZhciBkaXN0ID0gKGJpZ2dlc3RNZGwgJiYgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZSkgPyBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyAvIE1hdGgudGFuKE1hdGguUEkgKiA2MCAvIDM2MCkgOiAxMDA7XG4gICAgICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsIGRpc3QpO1xuICAgICAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnggPSBkaXN0ICogTWF0aC5zcXJ0KDIpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueSA9IDUwO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueiA9IDA7XG5cblxuICAgICAgICBpZiAoYmlnZ2VzdE1kbClcbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XG4gICAgfVxuXG5cbiAgICBzZXR1cCgpIHtcbiAgICAgICAgLy8vIFNldHRpbmcgdXAgYSBzY2VuZSwgVHJlZS5qcyBzdGFuZGFyZCBzdHVmZi4uLlxuICAgICAgICB2YXIgY2FudmFzV2lkdGggPSAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKS53aWR0aCgpO1xuICAgICAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJChcIiNcIiArIHRoaXMuZ2V0T3V0cHV0SWQoKSkuaGVpZ2h0KCk7XG4gICAgICAgIHZhciBjYW52YXNDbGVhckNvbG9yID0gMHgzNDI5MjA7IC8vIEZvciBoYXBweSByZW5kZXJpbmcsIGFsd2F5cyB1c2UgVmFuIER5a2UgQnJvd24uXG4gICAgICAgIHZhciBmb3YgPSA2MDtcbiAgICAgICAgdmFyIGFzcGVjdCA9IDE7XG4gICAgICAgIHZhciBuZWFyID0gMC4xO1xuICAgICAgICB2YXIgZmFyID0gNTAwMDAwO1xuXG4gICAgICAgIEdsb2JhbHMuX29uQ2FudmFzUmVzaXplID0gKCkgPT4ge1xuXG4gICAgICAgICAgICB2YXIgc2NlbmVXaWR0aCA9ICQoXCIjXCIgKyB0aGlzLmdldE91dHB1dElkKCkpLndpZHRoKCk7XG4gICAgICAgICAgICB2YXIgc2NlbmVIZWlnaHQgPSAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgaWYgKCFzY2VuZUhlaWdodCB8fCAhc2NlbmVXaWR0aClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoc2NlbmVXaWR0aCwgc2NlbmVIZWlnaHQpO1xuXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgR2xvYmFscy5fY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xuICAgICAgICB2YXIgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDU1NTU1NSk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChhbWJpZW50TGlnaHQpO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAuOCk7XG4gICAgICAgIGRpcmVjdGlvbmFsTGlnaHQxLnBvc2l0aW9uLnNldCgwLCAwLCAxKTtcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQxKTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xuICAgICAgICBkaXJlY3Rpb25hbExpZ2h0Mi5wb3NpdGlvbi5zZXQoMSwgMCwgMCk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0Mik7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodDMpO1xuXG4gICAgICAgIC8vLyBTdGFuZGFyZCBUSFJFRSByZW5kZXJlciB3aXRoIEFBXG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgICAgICAgYW50aWFsaWFzaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQoXCIjXCIgKyB0aGlzLmdldE91dHB1dElkKCkpWzBdLmFwcGVuZENoaWxkKEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xuXG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCk7XG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldENsZWFyQ29sb3IoY2FudmFzQ2xlYXJDb2xvcik7XG5cbiAgICAgICAgLy8vIEFkZCBUSFJFRSBvcmJpdCBjb250cm9scywgZm9yIHNpbXBsZSBvcmJpdGluZywgcGFubmluZyBhbmQgem9vbWluZ1xuICAgICAgICBHbG9iYWxzLl9jb250cm9scyA9IG5ldyBUSFJFRS5PcmJpdENvbnRyb2xzKEdsb2JhbHMuX2NhbWVyYSwgR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlO1xuXG4gICAgICAgIC8vLyBTZW1zIHcydWkgZGVsYXlzIHJlc2l6aW5nIDovXG4gICAgICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2V0VGltZW91dChHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZSwgMTApXG4gICAgICAgIH0pO1xuXG4gICAgICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXG4gICAgICAgIHJlbmRlcigpO1xuICAgIH1cbn1cblxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cbmZ1bmN0aW9uIHJlbmRlcigpIHtcbiAgICB3aW5kb3cucmVxdWVzdEFuaW1hdGlvbkZyYW1lKHJlbmRlcik7XG4gICAgR2xvYmFscy5fcmVuZGVyZXIucmVuZGVyKEdsb2JhbHMuX3NjZW5lLCBHbG9iYWxzLl9jYW1lcmEpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBQYWNrVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJwYWNrXCIsIFwiUGFjayBmaWxlXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG5cbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5odG1sKFwiXCIpO1xuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLmFwcGVuZCgkKFwiPGgyPlwiICsgdGhpcy5uYW1lICsgXCI8L2gyPlwiKSk7XG5cbiAgICAgICAgICAgIGZvciAobGV0IGNodW5rIG9mIHBhY2tmaWxlLmNodW5rcykge1xuICAgICAgICAgICAgICAgIHZhciBmaWVsZCA9ICQoXCI8ZmllbGRzZXQgLz5cIik7XG4gICAgICAgICAgICAgICAgdmFyIGxlZ2VuZCA9ICQoXCI8bGVnZW5kPlwiICsgY2h1bmsuaGVhZGVyLnR5cGUgKyBcIjwvbGVnZW5kPlwiKTtcblxuICAgICAgICAgICAgICAgIHZhciBsb2dCdXR0b24gPSAkKFwiPGJ1dHRvbj5Mb2cgQ2h1bmsgRGF0YSB0byBDb25zb2xlPC9idXR0b24+XCIpO1xuICAgICAgICAgICAgICAgIGxvZ0J1dHRvbi5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIFQzRC5Mb2dnZXIubG9nKFQzRC5Mb2dnZXIuVFlQRV9NRVNTQUdFLCBcIkxvZ2dpbmdcIiwgY2h1bmsuaGVhZGVyLnR5cGUsIFwiY2h1bmtcIik7XG4gICAgICAgICAgICAgICAgICAgIFQzRC5Mb2dnZXIubG9nKFQzRC5Mb2dnZXIuVFlQRV9NRVNTQUdFLCBjaHVuay5kYXRhKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGZpZWxkLmFwcGVuZChsZWdlbmQpO1xuICAgICAgICAgICAgICAgIGZpZWxkLmFwcGVuZCgkKFwiPHA+U2l6ZTpcIiArIGNodW5rLmhlYWRlci5jaHVua0RhdGFTaXplICsgXCI8L3A+XCIpKTtcbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQobG9nQnV0dG9uKTtcblxuICAgICAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5hcHBlbmQoZmllbGQpO1xuICAgICAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5zaG93KCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vUmVnaXN0ZXIgaXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBwYWNrIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFja1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU291bmRWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInNvdW5kXCIsIFwiU291bmRcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cbiAgICAgICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICAgICAgbGV0IGNodW5rID0gcGFja2ZpbGUuZ2V0Q2h1bmsoXCJBU05EXCIpO1xuXG4gICAgICAgICAgICAvLy8gUHJpbnQgc29tZSByYW5kb20gZGF0YSBhYm91dCB0aGlzIHNvdW5kXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkfWApXG4gICAgICAgICAgICAgICAgLmh0bWwoXG4gICAgICAgICAgICAgICAgICAgIFwiTGVuZ3RoOiBcIiArIGNodW5rLmRhdGEubGVuZ3RoICsgXCIgc2Vjb25kczxici8+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIlNpemU6IFwiICsgY2h1bmsuZGF0YS5hdWRpb0RhdGEubGVuZ3RoICsgXCIgYnl0ZXNcIlxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vLyBFeHRyYWN0IHNvdW5kIGRhdGFcbiAgICAgICAgICAgIHZhciBzb3VuZFVpbnRBcnJheSA9IGNodW5rLmRhdGEuYXVkaW9EYXRhO1xuXG4gICAgICAgICAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLm1wM1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+UGxheSBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFHbG9iYWxzLl9hdWRpb0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBTdG9wIHByZXZpb3VzIHNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgbmV3IGJ1ZmZlciBmb3IgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UgPSBHbG9iYWxzLl9hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5jb25uZWN0KEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBEZWNvZGUgYW5kIHN0YXJ0IHBsYXlpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UuYnVmZmVyID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+U3RvcCBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5zaG93KCk7XG4gICAgfVxuXG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlLmhlYWRlci50eXBlID09ICdBU05EJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhblZpZXcoKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU291bmRWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIFN0cmluZ1ZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwic3RyaW5nXCIsIFwiU3RyaW5nXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU3RyaW5nUmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVJZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fY29udGV4dCxcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZW5kZXJlckRvbmVTdHJpbmcoKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cblxuICAgIGNsZWFuKCkge1xuXG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBzdHJpbmcgZmlsZSB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgIGxldCBmY2MgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJhd0RhdGFbMF0sIHJhd0RhdGFbMV0sIHJhd0RhdGFbMl0sIHJhd0RhdGFbM10pO1xuICAgICAgICBpZiAoZmNjID09PSAnc3RycycpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxuXG4gICAgb25SZW5kZXJlckRvbmVTdHJpbmcoKSB7XG5cbiAgICAgICAgLy8vIFJlYWQgZGF0YSBmcm9tIHJlbmRlcmVyXG4gICAgICAgIGxldCBzdHJpbmdzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU3RyaW5nUmVuZGVyZXIsIFwic3RyaW5nc1wiLCBbXSk7XG5cbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMgPSBzdHJpbmdzO1xuXG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZCA9IHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzLmxlbmd0aDtcbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnRvdGFsID0gdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkO1xuICAgICAgICB3MnVpLnN0cmluZ0dyaWQucmVmcmVzaCgpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgVGV4dHVyZVZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwidGV4dHVyZVwiLCBcIlRleHR1cmVcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cblxuICAgICAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzPlwiKTtcbiAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICAvL1RPRE86IHVzZSBuZXcgdGV4dHVyZSByZW5kZXJlclxuXG4gICAgICAgICAgICAvL3ZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xuICAgICAgICAgICAgLy92YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgICAgIC8vY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xuXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkfWApLmFwcGVuZChjYW52YXMpO1xuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgdGV4dHVyZSBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgLy9UT0RPIHVzZSB0eXBlcyBmcm9tIERhdGFSZW5kZXJlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGFic3RyYWN0IGNsYXNzLCB1c2Ugb3RoZXIgY2xhc3MgdG8gZGVmaW5lIGJlaGF2aW9yLlxuICogRGVjbGFyaW5nIGEgVmlld2VyIGNsYXNzIGlzIG5vdCBlbm91Z2gsIGRvbid0IGZvcmdldCB0byByZWdpc3RlciBpdCBpbiB0aGUgRmlsZVZpZXdlciBtb2R1bGVcbiAqL1xuXG5jbGFzcyBWaWV3ZXIge1xuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIHRhYiBoZXJlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaWQsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIGdldFcyVGFiSWQoKSB7XG4gICAgICAgIHJldHVybiBgdGFiJHt0aGlzLmlkfWA7XG4gICAgfVxuXG4gICAgZ2V0T3V0cHV0SWQoKSB7XG4gICAgICAgIHJldHVybiBgJHt0aGlzLmlkfU91dHB1dGA7XG4gICAgfVxuXG4gICAgZ2V0RG9tVGFiSWQoKSB7XG4gICAgICAgIHJldHVybiBgZmlsZVRhYiR7dGhpcy5pZH1gO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIEZhY3VsdGF0aXZlIG1ldGhvZCB0aGF0IGFsbG93cyBzb21lIHJlbmRlcmVycyB0byBzZXR1cCBzdHVmZiBvbiBzdGFydHVwXG4gICAgICovXG4gICAgc2V0dXAoKSB7XG5cbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGhlIGNvbnRlbnQgb2YgdGhlIHRhYiB3aGVuIGNhbGxlZFxuICAgICAqIEl0IGlzIHRoZSByZXNwb25zYWJpbGl0eSBvZiB0aGUgdmlld2VyIHRvIGNhY2hlIGl0J3MgaGVhdnkgdGFza3NcbiAgICAgKiBAcmV0dXJucyB7bnVsbH1cbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWRzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNoaWxkcmVuIGNsYXNzXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gY2xlYW4gbWVtb3J5IGFzIHNvb24gYXMgYW5vdGhlciBmaWxlIGlzIGxvYWRlZFxuICAgICAqL1xuICAgIGNsZWFuKCkge1xuICAgICAgICAkKHRoaXMuZ2V0T3V0cHV0SWQoKSkuaHRtbChcIlwiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaWxsIGRldGVybWluZSBpZiB0aGUgdGFiIGNhbiBiZSBhY3RpdmUgb3Igbm90XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZHMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY2hpbGRyZW4gY2xhc3NcIik7XG4gICAgfVxuXG4gICAgLy9JZiBzZXQgdG8gdHJ1ZSwgdGhlIGZpbGUgd2lsbCBiZSBvcGVuZWQgZGlyZWN0bHkgb24gdGhpcyB2aWV3XG4gICAgLy9JZiBtdWx0aXBsZSB2aWV3ZXJzIHJldHVybnMgdHJ1ZSBmb3IgdGhlIHNhbWUgZmlsZSwgaXQgY29tZXMgYmFjayB0byBkZWZhdWx0LlxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXI7Il19
