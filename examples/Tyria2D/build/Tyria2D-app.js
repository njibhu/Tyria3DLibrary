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

function generateTabLayout() {
    for (let tab of Viewers) {
        let isDefault = tab == Viewers[DefaultViewerIndex];
        let tabHtml =
            $(`<div class='fileTab' id='fileTab${tab.id}'>
            <div class='tabOutput' id='${tab.id}Output'></div>
            </div>`);

        if (!isDefault) {
            tabHtml.hide();
        }

        $('#fileTabs').append(tabHtml);

        w2ui['fileTabs'].add({
            id: `tab${tab.id}`,
            caption: tab.name,
            disabled: true,
            onClick: function () {
                tab.render();
            }
        });

    }
    w2ui['fileTabs'].select(`tab${Viewers[DefaultViewerIndex].id}`);
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
            w2ui.fileTabs.enable(`tab${viewer.id}`);
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
        w2ui.fileTabs.click(`tab${override.id}`);
    } else {
        w2ui.fileTabs.click(`tab${Viewers[DefaultViewerIndex].id}`);
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
    $(".tabOutput").html("");
    $("#fileTitle").html("");

    /// Clean context toolbar
    $("#contextToolbar").html("");

    /// Disable and clean tabs
    for (let viewer of Viewers) {
        w2ui.fileTabs.disable(`tab${viewer.id}`);
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
    setupScene: setupScene,
    onCanvasResize: onCanvasResize,
    render: render,
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
            $(`#${this.id}Output`).html("");
            $(`#${this.id}Output`).append($("<h2>" + this.name + "</h2>"));

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
        $(`#fileTab${this.id}`).show();
    }

    clean() {

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
            Utils.generateHexTable(rawData, `#${this.id}Output`, () => {});
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#fileTab${this.id}`).show();
    }

    clean() {

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
        $(`#fileTab${this.id}`).show();
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

            $(`#fileTab${this.id}`).html("");
            $(`#fileTab${this.id}`).append($("<h2>" + this.name + "</h2>"));

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

                $(`#fileTab${this.id}`).append(field);
                $(`#fileTab${this.id}`).show();
            }

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#fileTab${this.id}`).show();
    }

    clean() {
        this.currentRenderId = null;
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
            $(`#${this.id}Output`)
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
        $(`#fileTab${this.id}`).show();
    }

    clean() {

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
        $(`#fileTab${this.id}`).show();
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

            $(`#${this.id}Output`).append(canvas);

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#fileTab${this.id}`).show();
    }

    clean() {

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
        throw new Error("Needs to be implemented by children class");
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hlYWQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hleGEuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL01vZGVsLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9QYWNrLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9Tb3VuZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvU3RyaW5nLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9UZXh0dXJlLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9WaWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25LQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNsY0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5VUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM3REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbi8vIFRoaXMgZmlsZSBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFR5cmlhMkQgYXBwbGljYXRpb25cclxuXHJcbi8vLyBSZXF1aXJlczpcclxuY29uc3QgTGF5b3V0ID0gcmVxdWlyZSgnLi9MYXlvdXQnKTtcclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcblxyXG5mdW5jdGlvbiBvblJlYWRlckNyZWF0ZWQoKSB7XHJcblxyXG4gICAgdzJwb3B1cC5sb2NrKCk7XHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoJ2Rpc2FibGVkJywgdHJ1ZSk7XHJcbiAgICAkKFwiI2ZpbGVMb2FkUHJvZ3Jlc3NcIikuaHRtbChcclxuICAgICAgICBcIkluZGV4aW5nIC5kYXQgZmlsZTxici8+XCIgK1xyXG4gICAgICAgIFwiPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG5cclxuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xyXG4gICAgICAgIFQzRC5nZXRGaWxlTGlzdEFzeW5jKEdsb2JhbHMuX2xyLFxyXG4gICAgICAgICAgICBmdW5jdGlvbiAoZmlsZXMpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gU3RvcmUgZmlsZUxpc3QgZ2xvYmFsbHlcclxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2ZpbGVMaXN0ID0gZmlsZXM7XHJcblxyXG4gICAgICAgICAgICAgICAgTGF5b3V0LnNpZGViYXJOb2RlcygpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBDbG9zZSB0aGUgcG9wXHJcbiAgICAgICAgICAgICAgICB3MnBvcHVwLmNsb3NlKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFNlbGVjdCB0aGUgXCJBbGxcIiBjYXRlZ29yeVxyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmNsaWNrKFwiQWxsXCIpO1xyXG5cclxuICAgICAgICAgICAgfSAvLy8gRW5kIHJlYWRGaWxlTGlzdEFzeW5jIGNhbGxiYWNrXHJcbiAgICAgICAgKTtcclxuICAgIH0sIDEpO1xyXG5cclxufVxyXG5cclxuTGF5b3V0LmluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKTtcclxuXHJcbi8vLyBPdmVyd3JpdGUgcHJvZ3Jlc3MgbG9nZ2VyXHJcblQzRC5Mb2dnZXIubG9nRnVuY3Rpb25zW1QzRC5Mb2dnZXIuVFlQRV9QUk9HUkVTU10gPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAkKFwiI2ZpbGVMb2FkUHJvZ3Jlc3NcIikuaHRtbChcclxuICAgICAgICBcIkluZGV4aW5nIC5kYXQgZmlsZTxici8+XCIgK1xyXG4gICAgICAgIGFyZ3VtZW50c1sxXSArIFwiJTxici8+PGJyLz5cIlxyXG4gICAgKTtcclxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcblxyXG4gICAgLy8vIE5vIGZpbHRlciBpZiBjbGlja2VkIGdyb3VwIHdhcyBcIkFsbFwiXHJcbiAgICBpZiAoZXZ0LnRhcmdldCA9PSBcIkFsbFwiKSB7XHJcbiAgICAgICAgc2hvd0ZpbGVHcm91cCgpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vLyBPdGhlciBldmVudHMgYXJlIGZpbmUgdG8ganVzdCBwYXNzXHJcbiAgICBlbHNlIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKFtldnQudGFyZ2V0XSk7XHJcbiAgICB9XHJcblxyXG59XHJcblxyXG5mdW5jdGlvbiBzaG93RmlsZUdyb3VwKGZpbGVUeXBlRmlsdGVyKSB7XHJcblxyXG4gICAgdzJ1aS5ncmlkLnJlY29yZHMgPSBbXTtcclxuXHJcbiAgICBsZXQgcmV2ZXJzZVRhYmxlID0gR2xvYmFscy5fbHIuZ2V0UmV2ZXJzZUluZGV4KCk7XHJcblxyXG4gICAgZm9yICh2YXIgZmlsZVR5cGUgaW4gR2xvYmFscy5fZmlsZUxpc3QpIHtcclxuXHJcbiAgICAgICAgLy8vIE9ubHkgc2hvdyB0eXBlcyB3ZSd2ZSBhc2tlZCBmb3JcclxuICAgICAgICBpZiAoZmlsZVR5cGVGaWx0ZXIgJiYgZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihmaWxlVHlwZSkgPCAwKSB7XHJcblxyXG4gICAgICAgICAgICAvLy8gU3BlY2lhbCBjYXNlIGZvciBcInBhY2tHcm91cFwiXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgbGV0IHRyb3VnaCBhbGwgcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIE5PVCBsZXQgdHJvdWdodCBhbnkgbm9uLXBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIGkuZS4gU3RyaW5ncywgQmluYXJpZXMgZXRjXHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwicGFja0dyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlBGXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInRleHR1cmVHcm91cFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGlmIChHbG9iYWxzLl9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIHZhciBmaWxlQXJyID0gR2xvYmFscy5fZmlsZUxpc3RbZmlsZVR5cGVdO1xyXG4gICAgICAgICAgICBmaWxlQXJyLmZvckVhY2goXHJcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAobWZ0SW5kZXgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbGV0IG1ldGEgPSBHbG9iYWxzLl9sci5nZXRGaWxlTWV0YShtZnRJbmRleCk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIHZhciBiYXNlSWRzID0gcmV2ZXJzZVRhYmxlW21mdEluZGV4XTtcclxuICAgICAgICAgICAgICAgICAgICB2YXIgZmlsZVNpemUgPSAobWV0YSkgPyBtZXRhLnNpemUgOiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVNpemUgPiAwICYmIG1mdEluZGV4ID4gMTUpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHcydWlbJ2dyaWQnXS5yZWNvcmRzLnB1c2goe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IG1mdEluZGV4LCAvLy8gTUZUIGluZGV4XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBiYXNlSWRzOiBiYXNlSWRzLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBmaWxlU2l6ZTogZmlsZVNpemVcclxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAgICAgbWZ0SW5kZXgrKztcclxuICAgICAgICAgICAgICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBtZnQgaW4gdGhpcyBmaWxlIHR5cGVcclxuICAgICAgICAgICAgKTtcclxuXHJcbiAgICAgICAgfSAvLy8gRW5kIGlmIF9maWxlTGlzdFtmaWxldHlwZV1cclxuXHJcbiAgICB9IC8vLyBFbmQgZm9yIGVhY2ggZmlsZVR5cGUga2V5IGluIF9maWxlTGlzdCBvYmplY3RcclxuXHJcbiAgICAvLy8gVXBkYXRlIGZpbGUgZ3JpZFxyXG4gICAgdzJ1aS5ncmlkLmJ1ZmZlcmVkID0gdzJ1aS5ncmlkLnJlY29yZHMubGVuZ3RoO1xyXG4gICAgdzJ1aS5ncmlkLnRvdGFsID0gdzJ1aS5ncmlkLmJ1ZmZlcmVkO1xyXG4gICAgdzJ1aS5ncmlkLnJlZnJlc2goKTtcclxufVxyXG5cclxubW9kdWxlLmV4cG9ydHMgPSB7XHJcbiAgICBvbkZpbHRlckNsaWNrOiBvbkZpbHRlckNsaWNrLFxyXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuLy9SZWdpc3RlciB2aWV3ZXJzXG5jb25zdCBIZWFkVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hlYWQnKTtcbmNvbnN0IEhleGFWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGV4YScpO1xuY29uc3QgTW9kZWxWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvTW9kZWwnKTtcbmNvbnN0IFBhY2tWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvUGFjaycpO1xuY29uc3QgU291bmRWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvU291bmQnKTtcbmNvbnN0IFN0cmluZ1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9TdHJpbmcnKTtcbmNvbnN0IFRleHR1cmVWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvVGV4dHVyZScpO1xuXG52YXIgVmlld2VycyA9IFtcbiAgICBuZXcgSGVhZFZpZXdlcigpLFxuICAgIG5ldyBIZXhhVmlld2VyKCksXG4gICAgbmV3IE1vZGVsVmlld2VyKCksXG4gICAgbmV3IFBhY2tWaWV3ZXIoKSxcbiAgICBuZXcgU291bmRWaWV3ZXIoKSxcbiAgICBuZXcgU3RyaW5nVmlld2VyKCksXG4gICAgbmV3IFRleHR1cmVWaWV3ZXIoKVxuXTtcblxudmFyIERlZmF1bHRWaWV3ZXJJbmRleCA9IDA7XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFiTGF5b3V0KCkge1xuICAgIGZvciAobGV0IHRhYiBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIGxldCBpc0RlZmF1bHQgPSB0YWIgPT0gVmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdO1xuICAgICAgICBsZXQgdGFiSHRtbCA9XG4gICAgICAgICAgICAkKGA8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nZmlsZVRhYiR7dGFiLmlkfSc+XG4gICAgICAgICAgICA8ZGl2IGNsYXNzPSd0YWJPdXRwdXQnIGlkPScke3RhYi5pZH1PdXRwdXQnPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+YCk7XG5cbiAgICAgICAgaWYgKCFpc0RlZmF1bHQpIHtcbiAgICAgICAgICAgIHRhYkh0bWwuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnI2ZpbGVUYWJzJykuYXBwZW5kKHRhYkh0bWwpO1xuXG4gICAgICAgIHcydWlbJ2ZpbGVUYWJzJ10uYWRkKHtcbiAgICAgICAgICAgIGlkOiBgdGFiJHt0YWIuaWR9YCxcbiAgICAgICAgICAgIGNhcHRpb246IHRhYi5uYW1lLFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdGFiLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH1cbiAgICB3MnVpWydmaWxlVGFicyddLnNlbGVjdChgdGFiJHtWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF0uaWR9YCk7XG59XG5cbmZ1bmN0aW9uIG9uQmFzaWNSZW5kZXJlckRvbmUoKSB7XG4gICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG4gICAgLy9Ob3QgaW1wbGVtZW50ZWQgaW4gVDNEIHlldDpcbiAgICAvL2xldCBmaWxlVHlwZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlVHlwZVwiKTtcblxuICAgIC8vU2hvdyB0aGUgZmlsZW5hbWVcbiAgICAvL1RvZG86IGltcGxlbWVudCBmaWxlVHlwZVxuICAgIGxldCBmaWxlTmFtZSA9IGAke2ZpbGVJZH1gXG5cbiAgICAvL0l0ZXJhdGUgdGhyb3VnaCB0aGUgcmVuZGVyZXJzIHRvIGtub3cgd2hvIGNhbiBzaG93IGFuZCB3aG9cbiAgICBsZXQgb3ZlcnJpZGU7XG4gICAgZm9yIChsZXQgdmlld2VyIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgLy9jaGVjayBpZiBjYW4gdmlld1xuICAgICAgICBpZiAodmlld2VyLmNhblZpZXcoKSkge1xuICAgICAgICAgICAgdzJ1aS5maWxlVGFicy5lbmFibGUoYHRhYiR7dmlld2VyLmlkfWApO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayBpZiBjYW4gb3ZlcnJpZGVcbiAgICAgICAgbGV0IG92ZXJyaWRlQWJpbGl0eSA9IHZpZXdlci5vdmVycmlkZURlZmF1bHQoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlQWJpbGl0eSAmJiBvdmVycmlkZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvdmVycmlkZSA9IHZpZXdlcjtcbiAgICAgICAgfSBlbHNlIGlmIChvdmVycmlkZUFiaWxpdHkgJiYgb3ZlcnJpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3ZlcnJpZGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgLy9TZXQgYWN0aXZlIHRhYlxuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKGB0YWIke292ZXJyaWRlLmlkfWApO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soYHRhYiR7Vmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdLmlkfWApO1xuICAgIH1cblxuICAgIC8vRW5hYmxlIGNvbnRleHQgdG9vbGJhciBhbmQgZG93bmxvYWQgYnV0dG9uXG4gICAgJChcIiNjb250ZXh0VG9vbGJhclwiKVxuICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgJChcIjxidXR0b24+RG93bmxvYWQgcmF3PC9idXR0b24+XCIpXG4gICAgICAgICAgICAuY2xpY2soXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyYXdEYXRhXSwge1xuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgVXRpbHMuc2F2ZURhdGEoYmxvYiwgZmlsZU5hbWUgKyBcIi5iaW5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKVxuICAgICAgICApO1xuXG59XG5cbmZ1bmN0aW9uIHZpZXdGaWxlQnlGaWxlSWQoZmlsZUlkKSB7XG5cbiAgICAvLy8gQ2xlYW4gb3V0cHV0c1xuICAgICQoXCIudGFiT3V0cHV0XCIpLmh0bWwoXCJcIik7XG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChcIlwiKTtcblxuICAgIC8vLyBDbGVhbiBjb250ZXh0IHRvb2xiYXJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmh0bWwoXCJcIik7XG5cbiAgICAvLy8gRGlzYWJsZSBhbmQgY2xlYW4gdGFic1xuICAgIGZvciAobGV0IHZpZXdlciBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZShgdGFiJHt2aWV3ZXIuaWR9YCk7XG4gICAgICAgIHZpZXdlci5jbGVhbigpO1xuICAgIH1cblxuICAgIC8vLyBNYWtlIHN1cmUgX2NvbnRleHQgaXMgY2xlYW5cbiAgICBHbG9iYWxzLl9jb250ZXh0ID0ge307XG5cbiAgICBsZXQgcmVuZGVyZXJTZXR0aW5ncyA9IHtcbiAgICAgICAgaWQ6IGZpbGVJZFxuICAgIH07XG5cbiAgICAvLy8gUnVuIHRoZSBiYXNpYyBEYXRhUmVuZGVyZXJcbiAgICBUM0QucnVuUmVuZGVyZXIoXG4gICAgICAgIFQzRC5EYXRhUmVuZGVyZXIsXG4gICAgICAgIEdsb2JhbHMuX2xyLFxuICAgICAgICByZW5kZXJlclNldHRpbmdzLFxuICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICBvbkJhc2ljUmVuZGVyZXJEb25lXG4gICAgKTtcbn1cblxuZnVuY3Rpb24gdmlld0ZpbGVCeU1GVChtZnRJZHgpIHtcbiAgICBsZXQgcmV2ZXJzZVRhYmxlID0gR2xvYmFscy5fbHIuZ2V0UmV2ZXJzZUluZGV4KCk7XG5cbiAgICB2YXIgYmFzZUlkID0gKHJldmVyc2VUYWJsZVttZnRJZHhdKSA/IHJldmVyc2VUYWJsZVttZnRJZHhdWzBdIDogXCJcIjtcblxuICAgIHZpZXdGaWxlQnlGaWxlSWQoYmFzZUlkKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZ2VuZXJhdGVUYWJMYXlvdXQ6IGdlbmVyYXRlVGFiTGF5b3V0LFxuICAgIHZpZXdGaWxlQnlGaWxlSWQ6IHZpZXdGaWxlQnlGaWxlSWQsXG4gICAgdmlld0ZpbGVCeU1GVDogdmlld0ZpbGVCeU1GVFxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8vU2V0dGluZyB1cCB0aGUgZ2xvYmFsIHZhcmlhYmxlcyBmb3IgdGhlIGFwcFxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICAvLy8gVDNEXG4gICAgX2xyOiB1bmRlZmluZWQsXG4gICAgX2NvbnRleHQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUlkOiB1bmRlZmluZWQsXG4gICAgX2ZpbGVMaXN0OiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvU291cmNlOiB1bmRlZmluZWQsXG4gICAgX2F1ZGlvQ29udGV4dDogdW5kZWZpbmVkLFxuXG4gICAgLy8vIFRIUkVFXG4gICAgX3NjZW5lOiB1bmRlZmluZWQsXG4gICAgX2NhbWVyYTogdW5kZWZpbmVkLFxuICAgIF9yZW5kZXJlcjogdW5kZWZpbmVkLFxuICAgIF9tb2RlbHM6IFtdLFxuICAgIF9jb250cm9sczogdW5kZWZpbmVkLFxuXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBGaWxlVmlld2VyID0gcmVxdWlyZSgnLi9GaWxldmlld2VyJyk7XHJcbmNvbnN0IEZpbGVHcmlkID0gcmVxdWlyZSgnLi9GaWxlZ3JpZCcpO1xyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XHJcblxyXG5jb25zdCBIZXhhVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hleGEnKTtcclxuXHJcblxyXG52YXIgb25SZWFkZXJDYWxsYmFjaztcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBtYWluIGdyaWRcclxuICovXHJcbmZ1bmN0aW9uIG1haW5HcmlkKCkge1xyXG4gICAgY29uc3QgcHN0eWxlID0gJ2JvcmRlcjogMXB4IHNvbGlkICNkZmRmZGY7IHBhZGRpbmc6IDA7JztcclxuXHJcbiAgICAkKCcjbGF5b3V0JykudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6ICdsYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICd0b3AnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogMjgsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArICcgcGFkZGluZy10b3A6IDFweDsnXHJcbiAgICAgICAgICAgIH0sIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDU3MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyAnbWFyZ2luOjAnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJyxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyBcIiBiYWNrZ3JvdW5kLWNvbG9yOiB0cmFuc3BhcmVudDtcIixcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHtcclxuICAgICAgICAgICAgICAgICAgICBzdHlsZTogJ2JhY2tncm91bmQtY29sb3I6I2VhZWFlYTsgaGVpZ2h0OjQwcHgnLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnaHRtbCcsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAnY29udGV4dFRvb2xiYXInLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBodG1sOiAnPGRpdiBjbGFzcz1cInRvb2xiYXJFbnRyeVwiIGlkPVwiY29udGV4dFRvb2xiYXJcIj48L2Rpdj4nXHJcbiAgICAgICAgICAgICAgICAgICAgfV0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXMub3duZXIuY29udGVudCgnbWFpbicsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uUmVzaXplOiBVdGlscy5vbkNhbnZhc1Jlc2l6ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNmaWxlSWRJbnB1dEJ0blwiKS5jbGljayhcclxuICAgICAgICBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgICAgIEZpbGVWaWV3ZXIudmlld0ZpbGVCeUZpbGVJZCgkKFwiI2ZpbGVJZElucHV0XCIpLnZhbCgpKTtcclxuICAgICAgICB9XHJcbiAgICApXHJcblxyXG5cclxuICAgIC8vLyBHcmlkIGluc2lkZSBtYWluIGxlZnRcclxuICAgICQoKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xlZnRMYXlvdXQnLFxyXG4gICAgICAgIHBhbmVsczogW3tcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdsZWZ0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6IDE1MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiAnbGVmdCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21haW4nLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogNDIwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdyaWdodCdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgnbGVmdCcsIHcydWlbJ2xlZnRMYXlvdXQnXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCB0b29sYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiB0b29sYmFyKCkge1xyXG4gICAgJCgpLncydG9vbGJhcih7XHJcbiAgICAgICAgbmFtZTogJ3Rvb2xiYXInLFxyXG4gICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICBpZDogJ2xvYWRGaWxlJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdPcGVuIGZpbGUnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdicmVhaydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21lbnUnLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICd2aWV3JyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdWaWV3JyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZScsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW3tcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBsaXN0JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBjYXRlZ29yaWVzJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogJ0hpZGUgZmlsZSBwcmV2aWV3JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdicmVhaydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21lbnUnLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICd0b29scycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVG9vbHMnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6ICdWaWV3IGNudGMgc3VtbWFyeScsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgIH1dXHJcblxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnJlYWsnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdtZW51JyxcclxuICAgICAgICAgICAgICAgIGlkOiAnb3BlbmVudHJ5JyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tc2VhcmNoJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdPcGVuIGVudHJ5JyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnQmFzZUlEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnTUZUIElEJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3NwYWNlcidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2J1dHRvbicsXHJcbiAgICAgICAgICAgICAgICBpZDogJ21lbnRpb25zJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdUeXJpYTJEJyxcclxuICAgICAgICAgICAgICAgIGltZzogJ2ljb24tcGFnZSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIHN3aXRjaCAoZXZlbnQudGFyZ2V0KSB7XHJcbiAgICAgICAgICAgICAgICBjYXNlICdsb2FkRmlsZSc6XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkZpbGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdzJ1aVsnbGF5b3V0J10uY29udGVudCgndG9wJywgdzJ1aVsndG9vbGJhciddKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIHNpZGViYXJcclxuICovXHJcbmZ1bmN0aW9uIHNpZGViYXIoKSB7XHJcbiAgICAvKlxyXG4gICAgICAgIFNJREVCQVJcclxuICAgICovXHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbGVmdCcsICQoKS53MnNpZGViYXIoe1xyXG4gICAgICAgIG5hbWU6ICdzaWRlYmFyJyxcclxuICAgICAgICBpbWc6IG51bGwsXHJcbiAgICAgICAgbm9kZXM6IFt7XHJcbiAgICAgICAgICAgIGlkOiAnQWxsJyxcclxuICAgICAgICAgICAgdGV4dDogJ0FsbCcsXHJcbiAgICAgICAgICAgIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICAgICAgZ3JvdXA6IGZhbHNlXHJcbiAgICAgICAgfV0sXHJcbiAgICAgICAgb25DbGljazogRmlsZUdyaWQub25GaWx0ZXJDbGlja1xyXG4gICAgfSkpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZWJyb3dzZXJcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVCcm93c2VyKCkge1xyXG4gICAgdzJ1aVsnbGVmdExheW91dCddLmNvbnRlbnQoJ21haW4nLCAkKCkudzJncmlkKHtcclxuICAgICAgICBuYW1lOiAnZ3JpZCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICB0b29sYmFyU2VhcmNoOiBmYWxzZSxcclxuICAgICAgICAgICAgdG9vbGJhclJlbG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFt7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3JlY2lkJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdNRlQgaW5kZXgnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzgwcHgnLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgLy9zZWFyY2hhYmxlOiAnaW50J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2Jhc2VJZHMnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ0Jhc2VJZCBsaXN0JyxcclxuICAgICAgICAgICAgICAgIHNpemU6ICcxMDAlJyxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIC8vc2VhcmNoYWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3R5cGUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1R5cGUnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzEwMHB4JyxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHNvcnRhYmxlOiBmYWxzZVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ2ZpbGVTaXplJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdQYWNrIFNpemUnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzg1cHgnLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uIChldmVudCkge1xyXG4gICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlNRlQoZXZlbnQucmVjaWQpO1xyXG4gICAgICAgIH1cclxuICAgIH0pKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGUgdmlldyB3aW5kb3dcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVWaWV3KCkge1xyXG4gICAgJCh3MnVpWydsYXlvdXQnXS5lbCgnbWFpbicpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2IGlkPSdmaWxlVGFicycgLz5cIikpXHJcblxyXG5cclxuICAgICQoXCIjZmlsZVRhYnNcIikudzJ0YWJzKHtcclxuICAgICAgICBuYW1lOiAnZmlsZVRhYnMnLFxyXG4gICAgICAgIHRhYnM6IFtdXHJcbiAgICB9KTtcclxuXHJcbiAgICBGaWxlVmlld2VyLmdlbmVyYXRlVGFiTGF5b3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0dyaWQoKSB7XHJcbiAgICAvLy8gU2V0IHVwIGdyaWQgZm9yIHN0cmluZ3Mgdmlld1xyXG4gICAgLy8vQ3JlYXRlIGdyaWRcclxuICAgICQoXCIjc3RyaW5nT3V0cHV0XCIpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogJ3N0cmluZ0dyaWQnLFxyXG4gICAgICAgIHNlbGVjdFR5cGU6ICdjZWxsJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZSxcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFt7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogJ3JlY2lkJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdSb3cgIycsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnNjBweCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICd2YWx1ZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVGV4dCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwJSdcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBoYXZlIGEgbGlzdCBvZiB0aGUgZmlsZXMgdG8gb3JnYW5pemUgdGhlIGNhdGVnb3JpZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyTm9kZXMoKSB7XHJcblxyXG4gICAgLy9DbGVhciBzaWRlYmFyIGlmIGFscmVhZHkgc2V0IHVwXHJcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIHcydWlbJ3NpZGViYXInXS5ub2Rlcykge1xyXG4gICAgICAgIGlmIChlbGVtZW50LmlkICE9ICdBbGwnKSB7XHJcbiAgICAgICAgICAgIHcydWlbJ3NpZGViYXInXS5ub2Rlcy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICB3MnVpWydzaWRlYmFyJ10ubm9kZXMuaW5kZXhPZihlbGVtZW50LmlkKSxcclxuICAgICAgICAgICAgICAgIDFcclxuICAgICAgICAgICAgKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICB3MnVpWydzaWRlYmFyJ10ucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vUmVnZW5lcmF0ZSAgICBcclxuXHJcbiAgICBsZXQgcGFja05vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICdwYWNrR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdQYWNrIEZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdGV4dHVyZU5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd0ZXh0dXJlR3JvdXAnLFxyXG4gICAgICAgIHRleHQ6ICdUZXh0dXJlIGZpbGVzJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIGxldCB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6ICd1bnNvcnRlZEdyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnVW5zb3J0ZWQnLFxyXG4gICAgICAgIGltZzogJ2ljb24tZm9sZGVyJyxcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9XHJcblxyXG4gICAgLy8vIEJ1aWxkIHNpZGViYXIgbm9kZXNcclxuICAgIGZvciAobGV0IGZpbGVUeXBlIGluIEdsb2JhbHMuX2ZpbGVMaXN0KSB7XHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgbGV0IG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZU5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnQklOQVJJRVMnKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIkJpbmFyaWVzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlID09ICdTVFJJTkdTJykge1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJTdHJpbmdzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJQRlwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgcGFja05vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnVU5LTk9XTicpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiVW5rbm93blwiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHVuc29ydGVkTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFja05vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQocGFja05vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHVuc29ydGVkTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh1bnNvcnRlZE5vZGUpO1xyXG4gICAgfVxyXG5cclxufVxyXG5cclxuZnVuY3Rpb24gb3BlbkZpbGVQb3B1cCgpIHtcclxuICAgIC8vLyBBc2sgZm9yIGZpbGVcclxuICAgIHcycG9wdXAub3Blbih7XHJcbiAgICAgICAgc3BlZWQ6IDAsXHJcbiAgICAgICAgdGl0bGU6ICdMb2FkIEEgR1cyIGRhdCcsXHJcbiAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgc2hvd0Nsb3NlOiBmYWxzZSxcclxuICAgICAgICBib2R5OiAnPGRpdiBjbGFzcz1cIncydWktY2VudGVyZWRcIj4nICtcclxuICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgJzxpbnB1dCBpZD1cImZpbGVQaWNrZXJQb3BcIiB0eXBlPVwiZmlsZVwiIC8+JyArXHJcbiAgICAgICAgICAgICc8L2Rpdj4nXHJcbiAgICB9KTtcclxuXHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpXHJcbiAgICAgICAgLmNoYW5nZShcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGV2dCkge1xyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgICAgICAgICAgZXZ0LnRhcmdldC5maWxlc1swXSxcclxuICAgICAgICAgICAgICAgICAgICBvblJlYWRlckNhbGxiYWNrLFxyXG4gICAgICAgICAgICAgICAgICAgIFwiLi4vc3RhdGljL3QzZHdvcmtlci5qc1wiKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgICk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBUaGlzIGZ1bmN0aW9uIGlzIGNhbGxlZCBieSB0aGUgbWFpbiBhcHAgdG8gY3JlYXRlIHRoZSBndWkgbGF5b3V0LlxyXG4gKi9cclxuZnVuY3Rpb24gaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpIHtcclxuXHJcbiAgICBvblJlYWRlckNhbGxiYWNrID0gb25SZWFkZXJDcmVhdGVkO1xyXG5cclxuICAgIG1haW5HcmlkKCk7XHJcbiAgICB0b29sYmFyKCk7XHJcbiAgICBzaWRlYmFyKCk7XHJcbiAgICBmaWxlQnJvd3NlcigpO1xyXG4gICAgZmlsZVZpZXcoKTtcclxuICAgIHN0cmluZ0dyaWQoKTtcclxuXHJcbiAgICAvKlxyXG4gICAgICAgIFNFVCBVUCBUUkVFIDNEIFNDRU5FXHJcbiAgICAqL1xyXG4gICAgVXRpbHMuc2V0dXBTY2VuZSgpO1xyXG5cclxuICAgIG9wZW5GaWxlUG9wdXAoKTtcclxuXHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW5pdExheW91dDogaW5pdExheW91dCxcclxuICAgIHNpZGViYXJOb2Rlczogc2lkZWJhck5vZGVzLFxyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKSB7XHJcblxyXG4gICAgLy8vIEdldCBsYXN0IGxvYWRlZCBmaWxlSWRcdFx0XHJcbiAgICB2YXIgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkO1xyXG5cclxuICAgIC8vLyBSdW4gVDNEIGhhY2tlZCB2ZXJzaW9uIG9mIE9CSkV4cG9ydGVyXHJcbiAgICB2YXIgcmVzdWx0ID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKCkucGFyc2UoR2xvYmFscy5fc2NlbmUsIGZpbGVJZCk7XHJcblxyXG4gICAgLy8vIFJlc3VsdCBsaXN0cyB3aGF0IGZpbGUgaWRzIGFyZSB1c2VkIGZvciB0ZXh0dXJlcy5cclxuICAgIHZhciB0ZXhJZHMgPSByZXN1bHQudGV4dHVyZUlkcztcclxuXHJcbiAgICAvLy8gU2V0IHVwIHZlcnkgYmFzaWMgbWF0ZXJpYWwgZmlsZSByZWZlcmluZyB0aGUgdGV4dHVyZSBwbmdzXHJcbiAgICAvLy8gcG5ncyBhcmUgZ2VuZXJhdGVkIGEgZmV3IGxpbmVzIGRvd24uXHJcbiAgICB2YXIgbXRsU291cmNlID0gXCJcIjtcclxuICAgIHRleElkcy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXhJZCkge1xyXG4gICAgICAgIG10bFNvdXJjZSArPSBcIm5ld210bCB0ZXhfXCIgKyB0ZXhJZCArIFwiXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0thIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXFxuXCI7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgb2JqXHJcbiAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyZXN1bHQub2JqXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5vYmpcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG10bFxyXG4gICAgYmxvYiA9IG5ldyBCbG9iKFttdGxTb3VyY2VdLCB7XHJcbiAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxyXG4gICAgfSk7XHJcbiAgICBzYXZlRGF0YShibG9iLCBcImV4cG9ydC5cIiArIGZpbGVJZCArIFwiLm10bFwiKTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgdGV4dHVyZSBwbmdzXHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuXHJcbiAgICAgICAgLy8vIExvY2FsUmVhZGVyIHdpbGwgaGF2ZSB0byByZS1sb2FkIHRoZSB0ZXh0dXJlcywgZG9uJ3Qgd2FudCB0byBmZXRjaFxyXG4gICAgICAgIC8vLyB0aGVuIGZyb20gdGhlIG1vZGVsIGRhdGEuLlxyXG4gICAgICAgIEdsb2JhbHMuX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGluZmxhdGVkRGF0YSwgZHh0VHlwZSwgaW1hZ2VXaWR0aCwgaW1hZ2VIZWlndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIGpzIGltYWdlIHVzaW5nIHJldHVybmVkIGJpdG1hcCBkYXRhLlxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGluZmxhdGVkRGF0YSksXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZUhlaWd0aFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gTmVlZCBhIGNhbnZhcyBpbiBvcmRlciB0byBkcmF3XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXMgLz5cIik7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQoY2FudmFzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0ud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIERyYXcgcmF3IGJpdG1hcCB0byBjYW52YXNcclxuICAgICAgICAgICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFRoaXMgaXMgd2hlcmUgc2hpdCBnZXRzIHN0dXBpZC4gRmxpcHBpbmcgcmF3IGJpdG1hcHMgaW4ganNcclxuICAgICAgICAgICAgICAgIC8vLyBpcyBhcHBhcmVudGx5IGEgcGFpbi4gQmFzaWNseSByZWFkIGN1cnJlbnQgc3RhdGUgcGl4ZWwgYnkgcGl4ZWxcclxuICAgICAgICAgICAgICAgIC8vLyBhbmQgd3JpdGUgaXQgYmFjayB3aXRoIGZsaXBwZWQgeS1heGlzIFxyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG91dHB1dCBpbWFnZSBkYXRhIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dCA9IGN0eC5jcmVhdGVJbWFnZURhdGEoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBoID0gaW5wdXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0RGF0YSA9IGlucHV0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0RGF0YSA9IG91dHB1dC5kYXRhXHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIExvb3AgcGl4ZWxzXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB5ID0gMTsgeSA8IGggLSAxOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHcgLSAxOyB4ICs9IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBJbnB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9ICh5ICogdyArIHgpICogNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoKGggLSB5KSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUmVhZCBhbmQgd3JpdGUgUkdCQVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gVE9ETzogUGVyaGFwcyBwdXQgYWxwaGEgdG8gMTAwJVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDQ7IGMgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YVtpICsgY10gPSBpbnB1dERhdGFbZmxpcCArIGNdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG5nQmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlRGF0YShwbmdCbG9iLCBcInRleF9cIiArIHRleElkICsgXCIucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vIFV0aWxpdHkgZm9yIGRvd25sb2FkaW5nIGZpbGVzIHRvIGNsaWVudFxyXG52YXIgc2F2ZURhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICBhLnN0eWxlID0gXCJkaXNwbGF5OiBub25lXCI7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJsb2IsIGZpbGVOYW1lKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuXHJcblxyXG4vLy8gU2V0dGluZyB1cCBhIHNjZW5lLCBUcmVlLmpzIHN0YW5kYXJkIHN0dWZmLi4uXHJcbmZ1bmN0aW9uIHNldHVwU2NlbmUoKSB7XHJcblxyXG4gICAgdmFyIGNhbnZhc1dpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIGNhbnZhc0hlaWdodCA9ICQoXCIjbW9kZWxPdXRwdXRcIikuaGVpZ2h0KCk7XHJcbiAgICB2YXIgY2FudmFzQ2xlYXJDb2xvciA9IDB4MzQyOTIwOyAvLyBGb3IgaGFwcHkgcmVuZGVyaW5nLCBhbHdheXMgdXNlIFZhbiBEeWtlIEJyb3duLlxyXG4gICAgdmFyIGZvdiA9IDYwO1xyXG4gICAgdmFyIGFzcGVjdCA9IDE7XHJcbiAgICB2YXIgbmVhciA9IDAuMTtcclxuICAgIHZhciBmYXIgPSA1MDAwMDA7XHJcblxyXG4gICAgR2xvYmFscy5fY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xyXG5cclxuICAgIEdsb2JhbHMuX3NjZW5lID0gbmV3IFRIUkVFLlNjZW5lKCk7XHJcblxyXG4gICAgLy8vIFRoaXMgc2NlbmUgaGFzIG9uZSBhbWJpZW50IGxpZ2h0IHNvdXJjZSBhbmQgdGhyZWUgZGlyZWN0aW9uYWwgbGlnaHRzXHJcbiAgICB2YXIgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDU1NTU1NSk7XHJcbiAgICBHbG9iYWxzLl9zY2VuZS5hZGQoYW1iaWVudExpZ2h0KTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDEucG9zaXRpb24uc2V0KDAsIDAsIDEpO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQxKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDIucG9zaXRpb24uc2V0KDEsIDAsIDApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQyKTtcclxuXHJcbiAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDMgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xyXG4gICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KDAsIDEsIDApO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQzKTtcclxuXHJcbiAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIgPSBuZXcgVEhSRUUuV2ViR0xSZW5kZXJlcih7XHJcbiAgICAgICAgYW50aWFsaWFzaW5nOiB0cnVlXHJcbiAgICB9KTtcclxuICAgICQoXCIjbW9kZWxPdXRwdXRcIilbMF0uYXBwZW5kQ2hpbGQoR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XHJcblxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KTtcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldENsZWFyQ29sb3IoY2FudmFzQ2xlYXJDb2xvcik7XHJcblxyXG4gICAgLy8vIEFkZCBUSFJFRSBvcmJpdCBjb250cm9scywgZm9yIHNpbXBsZSBvcmJpdGluZywgcGFubmluZyBhbmQgem9vbWluZ1xyXG4gICAgR2xvYmFscy5fY29udHJvbHMgPSBuZXcgVEhSRUUuT3JiaXRDb250cm9scyhHbG9iYWxzLl9jYW1lcmEsIEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG4gICAgR2xvYmFscy5fY29udHJvbHMuZW5hYmxlWm9vbSA9IHRydWU7XHJcblxyXG4gICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cclxuICAgICQod2luZG93KS5yZXNpemUoZnVuY3Rpb24gKCkge1xyXG4gICAgICAgIHNldFRpbWVvdXQob25DYW52YXNSZXNpemUsIDEwKVxyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIE5vdGU6IGNvbnN0YW50IGNvbnRpbm91cyByZW5kZXJpbmcgZnJvbSBwYWdlIGxvYWQgZXZlbnQsIG5vdCB2ZXJ5IG9wdC5cclxuICAgIHJlbmRlcigpO1xyXG59XHJcblxyXG5cclxuZnVuY3Rpb24gb25DYW52YXNSZXNpemUoKSB7XHJcblxyXG4gICAgdmFyIHNjZW5lV2lkdGggPSAkKFwiI21vZGVsT3V0cHV0XCIpLndpZHRoKCk7XHJcbiAgICB2YXIgc2NlbmVIZWlnaHQgPSAkKFwiI21vZGVsT3V0cHV0XCIpLmhlaWdodCgpO1xyXG5cclxuICAgIGlmICghc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXHJcbiAgICAgICAgcmV0dXJuO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XHJcblxyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShzY2VuZVdpZHRoLCBzY2VuZUhlaWdodCk7XHJcblxyXG4gICAgR2xvYmFscy5fY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcclxufVxyXG5cclxuLy8vIFJlbmRlciBsb29wLCBubyBnYW1lIGxvZ2ljLCBqdXN0IHJlbmRlcmluZy5cclxuZnVuY3Rpb24gcmVuZGVyKCkge1xyXG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xyXG4gICAgR2xvYmFscy5fcmVuZGVyZXIucmVuZGVyKEdsb2JhbHMuX3NjZW5lLCBHbG9iYWxzLl9jYW1lcmEpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBnZW5lcmF0ZUhleFRhYmxlKHJhd0RhdGEsIGRvbUNvbnRhaW5lciwgY2FsbGJhY2spIHtcclxuICAgIGxldCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShyYXdEYXRhKTtcclxuICAgIGxldCBoZXhPdXRwdXQgPSBbXTtcclxuICAgIGxldCBhc2NpaU91dHB1dCA9IFtdO1xyXG4gICAgY29uc3QgbG9vcENodW5rU2l6ZSA9IDEwMDAwO1xyXG5cclxuICAgIGNvbnN0IEFTQ0lJID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JyArICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWicgK1xyXG4gICAgICAgICcwMTIzNDU2Nzg5JyArICchXCIjJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXFxdXl9ge3x9fic7XHJcblxyXG4gICAgJChkb21Db250YWluZXIpLmh0bWwoXCJcIik7XHJcbiAgICAkKGRvbUNvbnRhaW5lcikuYXBwZW5kKGBcclxuPHRhYmxlIGNsYXNzPVwiaGV4YVRhYmxlXCI+XHJcbiAgICA8dHI+XHJcbiAgICAgICAgPHRoPkFkZHJlc3M8L3RoPlxyXG4gICAgICAgIDx0aD4wMDwvdGg+PHRoPjAxPC90aD48dGg+MDI8L3RoPjx0aD4wMzwvdGg+PHRoPjA0PC90aD48dGg+MDU8L3RoPjx0aD4wNjwvdGg+PHRoPjA3PC90aD5cclxuICAgICAgICA8dGg+MDg8L3RoPjx0aD4wOTwvdGg+PHRoPjBBPC90aD48dGg+MEI8L3RoPjx0aD4wQzwvdGg+PHRoPjBEPC90aD48dGg+MEU8L3RoPjx0aD4wRjwvdGg+XHJcbiAgICAgICAgPHRoPkFTQ0lJPC90aD5cclxuICAgIDwvdHI+YCk7XHJcblxyXG5cclxuICAgIC8vQnJlYWt1cCB0aGUgd29yayBpbnRvIHNsaWNlcyBvZiAxMGtCIGZvciBwZXJmb3JtYW5jZVxyXG4gICAgbGV0IGJ5dGVBcnJheVNsaWNlID0gW107XHJcbiAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBieXRlQXJyYXkubGVuZ3RoOyBwb3MgKz0gbG9vcENodW5rU2l6ZSkge1xyXG4gICAgICAgIGJ5dGVBcnJheVNsaWNlLnB1c2goYnl0ZUFycmF5LnNsaWNlKHBvcywgcG9zICsgbG9vcENodW5rU2l6ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIGxldCBsb29wQ291bnQgPSAwO1xyXG4gICAgbGV0IGxvb3BGdW5jID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgIGxldCBieXRlQXJyYXlJdGVtID0gYnl0ZUFycmF5U2xpY2VbbG9vcENvdW50XTtcclxuICAgICAgICAvL0lmIHRoZXJlIGlzIG5vIG1vcmUgd29yayB3ZSBjbGVhciB0aGUgbG9vcCBhbmQgY2FsbGJhY2tcclxuICAgICAgICBpZiAoYnl0ZUFycmF5SXRlbSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChsb29wRnVuYyk7XHJcbiAgICAgICAgICAgICQoZG9tQ29udGFpbmVyICsgXCIgdGFibGVcIikuYXBwZW5kKFwiPC90YWJsZT5cIik7XHJcbiAgICAgICAgICAgICQoZG9tQ29udGFpbmVyKS5zaG93KCk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XHJcbiAgICAgICAgICAgIHJldHVybjtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIC8vV29yayB3aXRoIGxpbmVzIG9mIDE2IGJ5dGVzXHJcbiAgICAgICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgYnl0ZUFycmF5SXRlbS5sZW5ndGg7IHBvcyArPSAxNikge1xyXG4gICAgICAgICAgICBsZXQgd29ya1NsaWNlID0gYnl0ZUFycmF5SXRlbS5zbGljZShwb3MsIHBvcyArIDE2KTtcclxuICAgICAgICAgICAgbGV0IHJvd0hUTUwgPSBcIjx0cj5cIjtcclxuICAgICAgICAgICAgbGV0IGFzY2lpTGluZSA9IFwiXCI7XHJcbiAgICAgICAgICAgIGxldCBhZGRyZXNzID0gTnVtYmVyKHBvcyArIChsb29wQ291bnQgKiBsb29wQ2h1bmtTaXplKSkudG9TdHJpbmcoMTYpO1xyXG4gICAgICAgICAgICBhZGRyZXNzID0gYWRkcmVzcy5sZW5ndGggIT0gOCA/ICcwJy5yZXBlYXQoOCAtIGFkZHJlc3MubGVuZ3RoKSArIGFkZHJlc3MgOiBhZGRyZXNzO1xyXG4gICAgICAgICAgICByb3dIVE1MICs9ICc8dGQ+JyArIGFkZHJlc3MgKyAnPC90ZD4nO1xyXG5cclxuICAgICAgICAgICAgLy9JdGVyYXRlIHRocm91Z2ggZWFjaCBieXRlIG9mIHRoZSAxNmJ5dGVzIGxpbmVcclxuICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCAxNjsgaSsrKSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYnl0ZSA9IHdvcmtTbGljZVtpXTtcclxuICAgICAgICAgICAgICAgIGxldCBieXRlSGV4Q29kZTtcclxuICAgICAgICAgICAgICAgIGlmIChieXRlICE9IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gYnl0ZS50b1N0cmluZygxNikudG9VcHBlckNhc2UoKTtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IGJ5dGVIZXhDb2RlLmxlbmd0aCA9PSAxID8gXCIwXCIgKyBieXRlSGV4Q29kZSA6IGJ5dGVIZXhDb2RlO1xyXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IFwiICBcIjtcclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICByb3dIVE1MICs9ICc8dGQ+JyArIGJ5dGVIZXhDb2RlICsgJzwvdGQ+JztcclxuICAgICAgICAgICAgICAgIGxldCBhc2NpaUNvZGUgPSBieXRlID8gU3RyaW5nLmZyb21DaGFyQ29kZShieXRlKSA6IFwiIFwiO1xyXG4gICAgICAgICAgICAgICAgYXNjaWlDb2RlID0gQVNDSUkuaW5jbHVkZXMoYXNjaWlDb2RlKSA/IGFzY2lpQ29kZSA6IFwiLlwiO1xyXG4gICAgICAgICAgICAgICAgYXNjaWlMaW5lICs9IGFzY2lpQ29kZTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgcm93SFRNTCArPSAnPHRkPicgKyBhc2NpaUxpbmUgKyAnPC90ZD48L3RyPiAnO1xyXG4gICAgICAgICAgICAkKGRvbUNvbnRhaW5lciArIFwiIHRhYmxlXCIpLmFwcGVuZChyb3dIVE1MKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvb3BDb3VudCArPSAxO1xyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbi8vVGhpcyBzcGVjaWFsIGZvckVhY2ggaGF2ZSBhbiBhZGRpdGlvbmFsIHBhcmFtZXRlciB0byBhZGQgYSBzZXRUaW1lb3V0KDEpIGJldHdlZW4gZWFjaCBcImNodW5rU2l6ZVwiIGl0ZW1zXHJcbmZ1bmN0aW9uIGFzeW5jRm9yRWFjaChhcnJheSwgY2h1bmtTaXplLCBmbikge1xyXG4gICAgbGV0IHdvcmtBcnJheSA9IFtdO1xyXG4gICAgLy9TbGljZSB1cCB0aGUgYXJyYXkgaW50byB3b3JrIGFycmF5IGZvciBzeW5jaHJvbm91cyBjYWxsXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5LnNpemU7IGkgKz0gY2h1bmtTaXplKSB7XHJcbiAgICAgICAgd29ya0FycmF5LnB1c2goYXJyYXkuc2xpY2UoaSwgaSArIGNodW5rU2l6ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vTG9vcGNvdW50IGlzIHRoZSBhbW91bnQgb2YgdGltZXMgY2h1bmtTaXplIGhhdmUgYmVlbiByZWFjaGVkXHJcbiAgICBsZXQgbG9vcGNvdW50ID0gMDtcclxuICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAvL0l0ZXJhdGUgdGhyb3VnaCB0aGUgY2h1bmtcclxuICAgICAgICBmb3IgKGxldCBpbmRleCBpbiB3b3JrQXJyYXkpIHtcclxuICAgICAgICAgICAgbGV0IGl0ZW0gPSB3b3JrQXJyYXlbaW5kZXhdO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSBpbmRleCArIChsb29wY291bnQgKiBjaHVua1NpemUpO1xyXG4gICAgICAgICAgICBmbihpdGVtLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0NoZWNrIGlmIHRoZXJlIGlzIG1vcmUgd29yayBvciBub3RcclxuICAgICAgICBsb29wY291bnQgKz0gMTtcclxuICAgICAgICBpZiAobG9vcGNvdW50ID09IHdvcmtBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZXhwb3J0U2NlbmU6IGV4cG9ydFNjZW5lLFxyXG4gICAgc2F2ZURhdGE6IHNhdmVEYXRhLFxyXG4gICAgc2V0dXBTY2VuZTogc2V0dXBTY2VuZSxcclxuICAgIG9uQ2FudmFzUmVzaXplOiBvbkNhbnZhc1Jlc2l6ZSxcclxuICAgIHJlbmRlcjogcmVuZGVyLFxyXG4gICAgZ2VuZXJhdGVIZXhUYWJsZTogZ2VuZXJhdGVIZXhUYWJsZVxyXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIEhlYWRWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcImhlYWRWaWV3XCIsIFwiT3ZlcnZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApLmFwcGVuZCgkKFwiPGgyPlwiICsgdGhpcy5uYW1lICsgXCI8L2gyPlwiKSk7XG5cbiAgICAgICAgICAgIC8vVE9ETzpcbiAgICAgICAgICAgIC8vTUZUIGluZGV4XG4gICAgICAgICAgICAvL0Jhc2VJZFxuICAgICAgICAgICAgLy9GaWxlVHlwZVxuICAgICAgICAgICAgLy9Db21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vVW5jb21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG5cbiAgICB9XG5cbiAgICAvL0hlYWR2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZXhhVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIC8vc3VwZXIoXCIjZmlsZVRhYnNIZXhWaWV3XCIsIFwiI2hleFZpZXdcIiwgXCJ0YWJIZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgICAgICBVdGlscy5nZW5lcmF0ZUhleFRhYmxlKHJhd0RhdGEsIGAjJHt0aGlzLmlkfU91dHB1dGAsICgpID0+IHt9KTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIC8vSGV4YSB2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZXhhVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBNb2RlbFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwibW9kZWxcIiwgXCJNb2RlbFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZU1vZGVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgI2ZpbGVUYWIke3RoaXMuaWR9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICAvLy8gUmVtb3ZlIG9sZCBtb2RlbHMgZnJvbSB0aGUgc2NlbmVcbiAgICAgICAgaWYgKEdsb2JhbHMuX21vZGVscykge1xuICAgICAgICAgICAgZm9yIChsZXQgbWRsIG9mIEdsb2JhbHMuX21vZGVscykge1xuICAgICAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLnJlbW92ZShtZGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSAnTU9ETCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxuXG4gICAgb25SZW5kZXJlckRvbmVNb2RlbCgpIHtcblxuICAgICAgICAvLy8gUmUtZml0IGNhbnZhc1xuICAgICAgICBVdGlscy5vbkNhbnZhc1Jlc2l6ZSgpO1xuXG4gICAgICAgIC8vLyBBZGQgY29udGV4dCB0b29sYmFyIGV4cG9ydCBidXR0b25cbiAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhVdGlscy5leHBvcnRTY2VuZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xuICAgICAgICBHbG9iYWxzLl9tb2RlbHMgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLCBcIm1lc2hlc1wiLCBbXSk7XG5cbiAgICAgICAgLy8vIEtlZXBpbmcgdHJhY2sgb2YgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGxhdGVyXG4gICAgICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcblxuICAgICAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXG4gICAgICAgIGZvciAobGV0IG1vZGVsIG9mIEdsb2JhbHMuX21vZGVscykge1xuXG4gICAgICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcbiAgICAgICAgICAgIGlmICghYmlnZ2VzdE1kbCB8fCBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyA8IG1vZGVsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGJpZ2dlc3RNZGwgPSBtb2RlbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8vIEZvY3VzIGNhbWVyYSB0byB0aGUgYmlnZXN0IG1vZGVsLCBkb2Vzbid0IHdvcmsgZ3JlYXQuXG4gICAgICAgIHZhciBkaXN0ID0gKGJpZ2dlc3RNZGwgJiYgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZSkgPyBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyAvIE1hdGgudGFuKE1hdGguUEkgKiA2MCAvIDM2MCkgOiAxMDA7XG4gICAgICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsIGRpc3QpO1xuICAgICAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnggPSBkaXN0ICogTWF0aC5zcXJ0KDIpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueSA9IDUwO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueiA9IDA7XG5cblxuICAgICAgICBpZiAoYmlnZ2VzdE1kbClcbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBQYWNrVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJwYWNrXCIsIFwiUGFjayBmaWxlXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG5cbiAgICAgICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5hcHBlbmQoJChcIjxoMj5cIiArIHRoaXMubmFtZSArIFwiPC9oMj5cIikpO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBjaHVuayBvZiBwYWNrZmlsZS5jaHVua3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSAkKFwiPGZpZWxkc2V0IC8+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBsZWdlbmQgPSAkKFwiPGxlZ2VuZD5cIiArIGNodW5rLmhlYWRlci50eXBlICsgXCI8L2xlZ2VuZD5cIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgbG9nQnV0dG9uID0gJChcIjxidXR0b24+TG9nIENodW5rIERhdGEgdG8gQ29uc29sZTwvYnV0dG9uPlwiKTtcbiAgICAgICAgICAgICAgICBsb2dCdXR0b24uY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgXCJMb2dnaW5nXCIsIGNodW5rLmhlYWRlci50eXBlLCBcImNodW5rXCIpO1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgY2h1bmsuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQobGVnZW5kKTtcbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQoJChcIjxwPlNpemU6XCIgKyBjaHVuay5oZWFkZXIuY2h1bmtEYXRhU2l6ZSArIFwiPC9wPlwiKSk7XG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKGxvZ0J1dHRvbik7XG5cbiAgICAgICAgICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5hcHBlbmQoZmllbGQpO1xuICAgICAgICAgICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgI2ZpbGVUYWIke3RoaXMuaWR9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBwYWNrIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFja1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU291bmRWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInNvdW5kXCIsIFwiU291bmRcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cbiAgICAgICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICAgICAgbGV0IGNodW5rID0gcGFja2ZpbGUuZ2V0Q2h1bmsoXCJBU05EXCIpO1xuXG4gICAgICAgICAgICAvLy8gUHJpbnQgc29tZSByYW5kb20gZGF0YSBhYm91dCB0aGlzIHNvdW5kXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApXG4gICAgICAgICAgICAgICAgLmh0bWwoXG4gICAgICAgICAgICAgICAgICAgIFwiTGVuZ3RoOiBcIiArIGNodW5rLmRhdGEubGVuZ3RoICsgXCIgc2Vjb25kczxici8+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIlNpemU6IFwiICsgY2h1bmsuZGF0YS5hdWRpb0RhdGEubGVuZ3RoICsgXCIgYnl0ZXNcIlxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vLyBFeHRyYWN0IHNvdW5kIGRhdGFcbiAgICAgICAgICAgIHZhciBzb3VuZFVpbnRBcnJheSA9IGNodW5rLmRhdGEuYXVkaW9EYXRhO1xuXG4gICAgICAgICAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLm1wM1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+UGxheSBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFHbG9iYWxzLl9hdWRpb0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBTdG9wIHByZXZpb3VzIHNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgbmV3IGJ1ZmZlciBmb3IgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UgPSBHbG9iYWxzLl9hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5jb25uZWN0KEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBEZWNvZGUgYW5kIHN0YXJ0IHBsYXlpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UuYnVmZmVyID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+U3RvcCBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ0FTTkQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU3RyaW5nVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJzdHJpbmdcIiwgXCJTdHJpbmdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICAvLy8gTWFrZSBzdXJlIG91dHB1dCBpcyBjbGVhblxuICAgICAgICAgICAgR2xvYmFscy5fY29udGV4dCA9IHt9O1xuXG4gICAgICAgICAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxuICAgICAgICAgICAgVDNELnJ1blJlbmRlcmVyKFxuICAgICAgICAgICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZVN0cmluZygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG5cbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHN0cmluZyBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgbGV0IHJhd0RhdGEgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcbiAgICAgICAgbGV0IGZjYyA9IFN0cmluZy5mcm9tQ2hhckNvZGUocmF3RGF0YVswXSwgcmF3RGF0YVsxXSwgcmF3RGF0YVsyXSwgcmF3RGF0YVszXSk7XG4gICAgICAgIGlmIChmY2MgPT09ICdzdHJzJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhblZpZXcoKTtcbiAgICB9XG5cbiAgICBvblJlbmRlcmVyRG9uZVN0cmluZygpIHtcblxuICAgICAgICAvLy8gUmVhZCBkYXRhIGZyb20gcmVuZGVyZXJcbiAgICAgICAgbGV0IHN0cmluZ3MgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TdHJpbmdSZW5kZXJlciwgXCJzdHJpbmdzXCIsIFtdKTtcblxuICAgICAgICB3MnVpLnN0cmluZ0dyaWQucmVjb3JkcyA9IHN0cmluZ3M7XG5cbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkID0gdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMubGVuZ3RoO1xuICAgICAgICB3MnVpLnN0cmluZ0dyaWQudG90YWwgPSB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQ7XG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5yZWZyZXNoKCk7XG4gICAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RyaW5nVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBUZXh0dXJlVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJ0ZXh0dXJlXCIsIFwiVGV4dHVyZVwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuXG4gICAgICAgICAgICAvLy8gRGlzcGxheSBiaXRtYXAgb24gY2FudmFzXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXM+XCIpO1xuICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgICAgIC8vVE9ETzogdXNlIG5ldyB0ZXh0dXJlIHJlbmRlcmVyXG5cbiAgICAgICAgICAgIC8vdmFyIHVpY2EgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoaW1hZ2UuZGF0YSk7XG4gICAgICAgICAgICAvL3ZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xuICAgICAgICAgICAgLy9jdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XG5cbiAgICAgICAgICAgICQoYCMke3RoaXMuaWR9T3V0cHV0YCkuYXBwZW5kKGNhbnZhcyk7XG5cbiAgICAgICAgICAgIC8vUmVnaXN0ZXIgaXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgdGV4dHVyZSBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgLy9UT0RPIHVzZSB0eXBlcyBmcm9tIERhdGFSZW5kZXJlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGFic3RyYWN0IGNsYXNzLCB1c2Ugb3RoZXIgY2xhc3MgdG8gZGVmaW5lIGJlaGF2aW9yLlxuICogRGVjbGFyaW5nIGEgVmlld2VyIGNsYXNzIGlzIG5vdCBlbm91Z2gsIGRvbid0IGZvcmdldCB0byByZWdpc3RlciBpdCBpbiB0aGUgRmlsZVZpZXdlciBtb2R1bGVcbiAqL1xuXG5jbGFzcyBWaWV3ZXIge1xuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIHRhYiBoZXJlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaWQsIG5hbWUpIHtcbiAgICAgICAgdGhpcy5pZCA9IGlkO1xuICAgICAgICB0aGlzLm5hbWUgPSBuYW1lO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbmRlciB0aGUgY29udGVudCBvZiB0aGUgdGFiIHdoZW4gY2FsbGVkXG4gICAgICogSXQgaXMgdGhlIHJlc3BvbnNhYmlsaXR5IG9mIHRoZSB2aWV3ZXIgdG8gY2FjaGUgaXQncyBoZWF2eSB0YXNrc1xuICAgICAqIEByZXR1cm5zIHtudWxsfVxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZHMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY2hpbGRyZW4gY2xhc3NcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjbGVhbiBtZW1vcnkgYXMgc29vbiBhcyBhbm90aGVyIGZpbGUgaXMgbG9hZGVkXG4gICAgICovXG4gICAgY2xlYW4oKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWRzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNoaWxkcmVuIGNsYXNzXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdpbGwgZGV0ZXJtaW5lIGlmIHRoZSB0YWIgY2FuIGJlIGFjdGl2ZSBvciBub3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkcyB0byBiZSBpbXBsZW1lbnRlZCBieSBjaGlsZHJlbiBjbGFzc1wiKTtcbiAgICB9XG5cbiAgICAvL0lmIHNldCB0byB0cnVlLCB0aGUgZmlsZSB3aWxsIGJlIG9wZW5lZCBkaXJlY3RseSBvbiB0aGlzIHZpZXdcbiAgICAvL0lmIG11bHRpcGxlIHZpZXdlcnMgcmV0dXJucyB0cnVlIGZvciB0aGUgc2FtZSBmaWxlLCBpdCBjb21lcyBiYWNrIHRvIGRlZmF1bHQuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdlcjsiXX0=
