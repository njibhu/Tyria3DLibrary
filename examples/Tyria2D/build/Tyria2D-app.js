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
        let tabHtml = $('#fileTabs').append(
            $(`<div class='fileTab' id='fileTab${tab.id}'>
            <div class='tabOutput' id='${tab.id}Output'></div>
            </div>`)
        )
        if (!isDefault) {
            tabHtml.hide();
        }

        w2ui['fileTabs'].add({
            id: `tab${tab.id}`,
            caption: tab.name,
            disabled: !isDefault,
            onClick: function () {
                tab.render();
            }
        });

    }
    w2ui['fileTabs'].select(Viewers[DefaultViewerIndex].w2tabId);
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
            w2ui.fileTabs.enable(viewer.w2tabId);
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
        w2ui.fileTabs.click(override.w2tabId);
    } else {
        w2ui.fileTabs.click(Viewers[DefaultViewerIndex].w2tabId);
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
        w2ui.fileTabs.disable(viewer.w2tabId);
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
        active: 'tabRaw',
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
        //super("#fileTabsHead", "#headView", "tabHeadView", "Overview");
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
        //fileTab, tabOutput, tabId, caption
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hlYWQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hleGEuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL01vZGVsLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9QYWNrLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9Tb3VuZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvU3RyaW5nLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9UZXh0dXJlLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9WaWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDaktBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbmNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOVVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM5REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN0hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNoRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMzRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uKCl7ZnVuY3Rpb24gcihlLG4sdCl7ZnVuY3Rpb24gbyhpLGYpe2lmKCFuW2ldKXtpZighZVtpXSl7dmFyIGM9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZTtpZighZiYmYylyZXR1cm4gYyhpLCEwKTtpZih1KXJldHVybiB1KGksITApO3ZhciBhPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIraStcIidcIik7dGhyb3cgYS5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGF9dmFyIHA9bltpXT17ZXhwb3J0czp7fX07ZVtpXVswXS5jYWxsKHAuZXhwb3J0cyxmdW5jdGlvbihyKXt2YXIgbj1lW2ldWzFdW3JdO3JldHVybiBvKG58fHIpfSxwLHAuZXhwb3J0cyxyLGUsbix0KX1yZXR1cm4gbltpXS5leHBvcnRzfWZvcih2YXIgdT1cImZ1bmN0aW9uXCI9PXR5cGVvZiByZXF1aXJlJiZyZXF1aXJlLGk9MDtpPHQubGVuZ3RoO2krKylvKHRbaV0pO3JldHVybiBvfXJldHVybiByfSkoKSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxuLy8gVGhpcyBmaWxlIGlzIHRoZSBtYWluIGVudHJ5IHBvaW50IGZvciB0aGUgVHlyaWEyRCBhcHBsaWNhdGlvblxyXG5cclxuLy8vIFJlcXVpcmVzOlxyXG5jb25zdCBMYXlvdXQgPSByZXF1aXJlKCcuL0xheW91dCcpO1xyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuXHJcbmZ1bmN0aW9uIG9uUmVhZGVyQ3JlYXRlZCgpIHtcclxuXHJcbiAgICB3MnBvcHVwLmxvY2soKTtcclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIikucHJvcCgnZGlzYWJsZWQnLCB0cnVlKTtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFxyXG4gICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArXHJcbiAgICAgICAgXCI8YnIvPjxici8+XCJcclxuICAgICk7XHJcblxyXG4gICAgc2V0VGltZW91dCgoKSA9PiB7XHJcbiAgICAgICAgVDNELmdldEZpbGVMaXN0QXN5bmMoR2xvYmFscy5fbHIsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChmaWxlcykge1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBTdG9yZSBmaWxlTGlzdCBnbG9iYWxseVxyXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgICAgICAgICBMYXlvdXQuc2lkZWJhck5vZGVzKCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENsb3NlIHRoZSBwb3BcclxuICAgICAgICAgICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gU2VsZWN0IHRoZSBcIkFsbFwiIGNhdGVnb3J5XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuY2xpY2soXCJBbGxcIik7XHJcblxyXG4gICAgICAgICAgICB9IC8vLyBFbmQgcmVhZEZpbGVMaXN0QXN5bmMgY2FsbGJhY2tcclxuICAgICAgICApO1xyXG4gICAgfSwgMSk7XHJcblxyXG59XHJcblxyXG5MYXlvdXQuaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpO1xyXG5cclxuLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuVDNELkxvZ2dlci5sb2dGdW5jdGlvbnNbVDNELkxvZ2dlci5UWVBFX1BST0dSRVNTXSA9IGZ1bmN0aW9uICgpIHtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFxyXG4gICAgICAgIFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArXHJcbiAgICAgICAgYXJndW1lbnRzWzFdICsgXCIlPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuZnVuY3Rpb24gb25GaWx0ZXJDbGljayhldnQpIHtcclxuXHJcbiAgICAvLy8gTm8gZmlsdGVyIGlmIGNsaWNrZWQgZ3JvdXAgd2FzIFwiQWxsXCJcclxuICAgIGlmIChldnQudGFyZ2V0ID09IFwiQWxsXCIpIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIHNob3dGaWxlR3JvdXAoZmlsZVR5cGVGaWx0ZXIpIHtcclxuXHJcbiAgICB3MnVpLmdyaWQucmVjb3JkcyA9IFtdO1xyXG5cclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG5cclxuICAgICAgICAvLy8gT25seSBzaG93IHR5cGVzIHdlJ3ZlIGFza2VkIGZvclxyXG4gICAgICAgIGlmIChmaWxlVHlwZUZpbHRlciAmJiBmaWxlVHlwZUZpbHRlci5pbmRleE9mKGZpbGVUeXBlKSA8IDApIHtcclxuXHJcbiAgICAgICAgICAgIC8vLyBTcGVjaWFsIGNhc2UgZm9yIFwicGFja0dyb3VwXCJcclxuICAgICAgICAgICAgLy8vIFNob3VsZCBsZXQgdHJvdWdoIGFsbCBwYWNrIHR5cGVzXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgTk9UIGxldCB0cm91Z2h0IGFueSBub24tcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gaS5lLiBTdHJpbmdzLCBCaW5hcmllcyBldGNcclxuICAgICAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoXCJwYWNrR3JvdXBcIikgPj0gMCkge1xyXG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwidGV4dHVyZUdyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIGNvbnRpbnVlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG5cclxuICAgICAgICAgICAgdmFyIGZpbGVBcnIgPSBHbG9iYWxzLl9maWxlTGlzdFtmaWxlVHlwZV07XHJcbiAgICAgICAgICAgIGZpbGVBcnIuZm9yRWFjaChcclxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uIChtZnRJbmRleCkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IEdsb2JhbHMuX2xyLmdldEZpbGVNZXRhKG1mdEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VJZHMgPSByZXZlcnNlVGFibGVbbWZ0SW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IChtZXRhKSA/IG1ldGEuc2l6ZSA6IFwiXCI7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIGlmIChmaWxlU2l6ZSA+IDAgJiYgbWZ0SW5kZXggPiAxNSkge1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgdzJ1aVsnZ3JpZCddLnJlY29yZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZWNpZDogbWZ0SW5kZXgsIC8vLyBNRlQgaW5kZXhcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZHM6IGJhc2VJZHMsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgICAgICBtZnRJbmRleCsrO1xyXG4gICAgICAgICAgICAgICAgfSAvLy8gRW5kIGZvciBlYWNoIG1mdCBpbiB0aGlzIGZpbGUgdHlwZVxyXG4gICAgICAgICAgICApO1xyXG5cclxuICAgICAgICB9IC8vLyBFbmQgaWYgX2ZpbGVMaXN0W2ZpbGV0eXBlXVxyXG5cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2ssXHJcbn0iLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xudmFyIFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xuXG4vL1JlZ2lzdGVyIHZpZXdlcnNcbmNvbnN0IEhlYWRWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGVhZCcpO1xuY29uc3QgSGV4YVZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9IZXhhJyk7XG5jb25zdCBNb2RlbFZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9Nb2RlbCcpO1xuY29uc3QgUGFja1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9QYWNrJyk7XG5jb25zdCBTb3VuZFZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9Tb3VuZCcpO1xuY29uc3QgU3RyaW5nVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL1N0cmluZycpO1xuY29uc3QgVGV4dHVyZVZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9UZXh0dXJlJyk7XG5cbnZhciBWaWV3ZXJzID0gW1xuICAgIG5ldyBIZWFkVmlld2VyKCksXG4gICAgbmV3IEhleGFWaWV3ZXIoKSxcbiAgICBuZXcgTW9kZWxWaWV3ZXIoKSxcbiAgICBuZXcgUGFja1ZpZXdlcigpLFxuICAgIG5ldyBTb3VuZFZpZXdlcigpLFxuICAgIG5ldyBTdHJpbmdWaWV3ZXIoKSxcbiAgICBuZXcgVGV4dHVyZVZpZXdlcigpXG5dO1xuXG52YXIgRGVmYXVsdFZpZXdlckluZGV4ID0gMDtcblxuZnVuY3Rpb24gZ2VuZXJhdGVUYWJMYXlvdXQoKSB7XG4gICAgZm9yIChsZXQgdGFiIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgbGV0IGlzRGVmYXVsdCA9IHRhYiA9PSBWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF07XG4gICAgICAgIGxldCB0YWJIdG1sID0gJCgnI2ZpbGVUYWJzJykuYXBwZW5kKFxuICAgICAgICAgICAgJChgPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9J2ZpbGVUYWIke3RhYi5pZH0nPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndGFiT3V0cHV0JyBpZD0nJHt0YWIuaWR9T3V0cHV0Jz48L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PmApXG4gICAgICAgIClcbiAgICAgICAgaWYgKCFpc0RlZmF1bHQpIHtcbiAgICAgICAgICAgIHRhYkh0bWwuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgdzJ1aVsnZmlsZVRhYnMnXS5hZGQoe1xuICAgICAgICAgICAgaWQ6IGB0YWIke3RhYi5pZH1gLFxuICAgICAgICAgICAgY2FwdGlvbjogdGFiLm5hbWUsXG4gICAgICAgICAgICBkaXNhYmxlZDogIWlzRGVmYXVsdCxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB0YWIucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfVxuICAgIHcydWlbJ2ZpbGVUYWJzJ10uc2VsZWN0KFZpZXdlcnNbRGVmYXVsdFZpZXdlckluZGV4XS53MnRhYklkKTtcbn1cblxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpIHtcbiAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcbiAgICAvL05vdCBpbXBsZW1lbnRlZCBpbiBUM0QgeWV0OlxuICAgIC8vbGV0IGZpbGVUeXBlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVUeXBlXCIpO1xuXG4gICAgLy9TaG93IHRoZSBmaWxlbmFtZVxuICAgIC8vVG9kbzogaW1wbGVtZW50IGZpbGVUeXBlXG4gICAgbGV0IGZpbGVOYW1lID0gYCR7ZmlsZUlkfWBcblxuICAgIC8vSXRlcmF0ZSB0aHJvdWdoIHRoZSByZW5kZXJlcnMgdG8ga25vdyB3aG8gY2FuIHNob3cgYW5kIHdob1xuICAgIGxldCBvdmVycmlkZTtcbiAgICBmb3IgKGxldCB2aWV3ZXIgb2YgVmlld2Vycykge1xuICAgICAgICAvL2NoZWNrIGlmIGNhbiB2aWV3XG4gICAgICAgIGlmICh2aWV3ZXIuY2FuVmlldygpKSB7XG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSh2aWV3ZXIudzJ0YWJJZCk7XG4gICAgICAgIH1cblxuICAgICAgICAvL2NoZWNrIGlmIGNhbiBvdmVycmlkZVxuICAgICAgICBsZXQgb3ZlcnJpZGVBYmlsaXR5ID0gdmlld2VyLm92ZXJyaWRlRGVmYXVsdCgpO1xuICAgICAgICBpZiAob3ZlcnJpZGVBYmlsaXR5ICYmIG92ZXJyaWRlID09PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlID0gdmlld2VyO1xuICAgICAgICB9IGVsc2UgaWYgKG92ZXJyaWRlQWJpbGl0eSAmJiBvdmVycmlkZSAhPT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvdmVycmlkZSA9IG51bGw7XG4gICAgICAgIH1cblxuICAgIH1cbiAgICAvL1NldCBhY3RpdmUgdGFiXG4gICAgaWYgKG92ZXJyaWRlKSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2sob3ZlcnJpZGUudzJ0YWJJZCk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljayhWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF0udzJ0YWJJZCk7XG4gICAgfVxuXG4gICAgLy9FbmFibGUgY29udGV4dCB0b29sYmFyIGFuZCBkb3dubG9hZCBidXR0b25cbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCByYXc8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jhd0RhdGFdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLmJpblwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgICk7XG5cbn1cblxuZnVuY3Rpb24gdmlld0ZpbGVCeUZpbGVJZChmaWxlSWQpIHtcblxuICAgIC8vLyBDbGVhbiBvdXRwdXRzXG4gICAgJChcIi50YWJPdXRwdXRcIikuaHRtbChcIlwiKTtcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKFwiXCIpO1xuXG4gICAgLy8vIENsZWFuIGNvbnRleHQgdG9vbGJhclxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuaHRtbChcIlwiKTtcblxuICAgIC8vLyBEaXNhYmxlIGFuZCBjbGVhbiB0YWJzXG4gICAgZm9yIChsZXQgdmlld2VyIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKHZpZXdlci53MnRhYklkKTtcbiAgICAgICAgdmlld2VyLmNsZWFuKCk7XG4gICAgfVxuXG4gICAgLy8vIE1ha2Ugc3VyZSBfY29udGV4dCBpcyBjbGVhblxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgIGxldCByZW5kZXJlclNldHRpbmdzID0ge1xuICAgICAgICBpZDogZmlsZUlkXG4gICAgfTtcblxuICAgIC8vLyBSdW4gdGhlIGJhc2ljIERhdGFSZW5kZXJlclxuICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgVDNELkRhdGFSZW5kZXJlcixcbiAgICAgICAgR2xvYmFscy5fbHIsXG4gICAgICAgIHJlbmRlcmVyU2V0dGluZ3MsXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXG4gICAgICAgIG9uQmFzaWNSZW5kZXJlckRvbmVcbiAgICApO1xufVxuXG5mdW5jdGlvbiB2aWV3RmlsZUJ5TUZUKG1mdElkeCkge1xuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcblxuICAgIHZhciBiYXNlSWQgPSAocmV2ZXJzZVRhYmxlW21mdElkeF0pID8gcmV2ZXJzZVRhYmxlW21mdElkeF1bMF0gOiBcIlwiO1xuXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZW5lcmF0ZVRhYkxheW91dDogZ2VuZXJhdGVUYWJMYXlvdXQsXG4gICAgdmlld0ZpbGVCeUZpbGVJZDogdmlld0ZpbGVCeUZpbGVJZCxcbiAgICB2aWV3RmlsZUJ5TUZUOiB2aWV3RmlsZUJ5TUZUXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLy9TZXR0aW5nIHVwIHRoZSBnbG9iYWwgdmFyaWFibGVzIGZvciB0aGUgYXBwXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vLyBUM0RcbiAgICBfbHI6IHVuZGVmaW5lZCxcbiAgICBfY29udGV4dDogdW5kZWZpbmVkLFxuICAgIF9maWxlSWQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUxpc3Q6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Tb3VyY2U6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Db250ZXh0OiB1bmRlZmluZWQsXG5cbiAgICAvLy8gVEhSRUVcbiAgICBfc2NlbmU6IHVuZGVmaW5lZCxcbiAgICBfY2FtZXJhOiB1bmRlZmluZWQsXG4gICAgX3JlbmRlcmVyOiB1bmRlZmluZWQsXG4gICAgX21vZGVsczogW10sXG4gICAgX2NvbnRyb2xzOiB1bmRlZmluZWQsXG5cbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmNvbnN0IEZpbGVWaWV3ZXIgPSByZXF1aXJlKCcuL0ZpbGV2aWV3ZXInKTtcclxuY29uc3QgRmlsZUdyaWQgPSByZXF1aXJlKCcuL0ZpbGVncmlkJyk7XHJcbmNvbnN0IFV0aWxzID0gcmVxdWlyZSgnLi9VdGlscycpO1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcbmNvbnN0IEhleGFWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGV4YScpO1xyXG5cclxuXHJcbnZhciBvblJlYWRlckNhbGxiYWNrO1xyXG5cclxuLyoqXHJcbiAqIFNldHVwIG1haW4gZ3JpZFxyXG4gKi9cclxuZnVuY3Rpb24gbWFpbkdyaWQoKSB7XHJcbiAgICBjb25zdCBwc3R5bGUgPSAnYm9yZGVyOiAxcHggc29saWQgI2RmZGZkZjsgcGFkZGluZzogMDsnO1xyXG5cclxuICAgICQoJyNsYXlvdXQnKS53MmxheW91dCh7XHJcbiAgICAgICAgbmFtZTogJ2xheW91dCcsXHJcbiAgICAgICAgcGFuZWxzOiBbe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ3RvcCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAyOCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgJyBwYWRkaW5nLXRvcDogMXB4OydcclxuICAgICAgICAgICAgfSwge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogNTcwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArICdtYXJnaW46MCdcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21haW4nLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArIFwiIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1wiLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiAnYmFja2dyb3VuZC1jb2xvcjojZWFlYWVhOyBoZWlnaHQ6NDBweCcsXHJcbiAgICAgICAgICAgICAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdodG1sJyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgaWQ6ICdjb250ZXh0VG9vbGJhcicsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6ICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCIgaWQ9XCJjb250ZXh0VG9vbGJhclwiPjwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICB9XSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lci5jb250ZW50KCdtYWluJywgZXZlbnQpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25SZXNpemU6IFV0aWxzLm9uQ2FudmFzUmVzaXplXHJcbiAgICB9KTtcclxuXHJcbiAgICAkKFwiI2ZpbGVJZElucHV0QnRuXCIpLmNsaWNrKFxyXG4gICAgICAgIGZ1bmN0aW9uICgpIHtcclxuICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5RmlsZUlkKCQoXCIjZmlsZUlkSW5wdXRcIikudmFsKCkpO1xyXG4gICAgICAgIH1cclxuICAgIClcclxuXHJcblxyXG4gICAgLy8vIEdyaWQgaW5zaWRlIG1haW4gbGVmdFxyXG4gICAgJCgpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiAnbGVmdExheW91dCcsXHJcbiAgICAgICAgcGFuZWxzOiBbe1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2xlZnQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogMTUwLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSxcclxuICAgICAgICAgICAgICAgIGNvbnRlbnQ6ICdsZWZ0J1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWFpbicsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA0MjAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogJ3JpZ2h0J1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXVxyXG4gICAgfSk7XHJcbiAgICB3MnVpWydsYXlvdXQnXS5jb250ZW50KCdsZWZ0JywgdzJ1aVsnbGVmdExheW91dCddKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIHRvb2xiYXJcclxuICovXHJcbmZ1bmN0aW9uIHRvb2xiYXIoKSB7XHJcbiAgICAkKCkudzJ0b29sYmFyKHtcclxuICAgICAgICBuYW1lOiAndG9vbGJhcicsXHJcbiAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgIGlkOiAnbG9hZEZpbGUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ09wZW4gZmlsZScsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLWZvbGRlcidcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2JyZWFrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVudScsXHJcbiAgICAgICAgICAgICAgICBpZDogJ3ZpZXcnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1ZpZXcnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJyxcclxuICAgICAgICAgICAgICAgIGl0ZW1zOiBbe1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnSGlkZSBmaWxlIGxpc3QnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnSGlkZSBmaWxlIGNhdGVnb3JpZXMnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZXh0OiAnSGlkZSBmaWxlIHByZXZpZXcnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIF1cclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ2JyZWFrJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnbWVudScsXHJcbiAgICAgICAgICAgICAgICBpZDogJ3Rvb2xzJyxcclxuICAgICAgICAgICAgICAgIGNhcHRpb246ICdUb29scycsXHJcbiAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogJ1ZpZXcgY250YyBzdW1tYXJ5JyxcclxuICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXBhZ2UnLFxyXG4gICAgICAgICAgICAgICAgfV1cclxuXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6ICdicmVhaydcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogJ21lbnUnLFxyXG4gICAgICAgICAgICAgICAgaWQ6ICdvcGVuZW50cnknLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1zZWFyY2gnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ09wZW4gZW50cnknLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFt7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdCYXNlSUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXNlYXJjaCcsXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6ICdNRlQgSUQnLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6ICdpY29uLXNlYXJjaCcsXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnc3BhY2VyJ1xyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiAnYnV0dG9uJyxcclxuICAgICAgICAgICAgICAgIGlkOiAnbWVudGlvbnMnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1R5cmlhMkQnLFxyXG4gICAgICAgICAgICAgICAgaW1nOiAnaWNvbi1wYWdlJ1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoZXZlbnQpIHtcclxuICAgICAgICAgICAgc3dpdGNoIChldmVudC50YXJnZXQpIHtcclxuICAgICAgICAgICAgICAgIGNhc2UgJ2xvYWRGaWxlJzpcclxuICAgICAgICAgICAgICAgICAgICBvcGVuRmlsZVBvcHVwKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB3MnVpWydsYXlvdXQnXS5jb250ZW50KCd0b3AnLCB3MnVpWyd0b29sYmFyJ10pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgc2lkZWJhclxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhcigpIHtcclxuICAgIC8qXHJcbiAgICAgICAgU0lERUJBUlxyXG4gICAgKi9cclxuICAgIHcydWlbJ2xlZnRMYXlvdXQnXS5jb250ZW50KCdsZWZ0JywgJCgpLncyc2lkZWJhcih7XHJcbiAgICAgICAgbmFtZTogJ3NpZGViYXInLFxyXG4gICAgICAgIGltZzogbnVsbCxcclxuICAgICAgICBub2RlczogW3tcclxuICAgICAgICAgICAgaWQ6ICdBbGwnLFxyXG4gICAgICAgICAgICB0ZXh0OiAnQWxsJyxcclxuICAgICAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInLFxyXG4gICAgICAgICAgICBncm91cDogZmFsc2VcclxuICAgICAgICB9XSxcclxuICAgICAgICBvbkNsaWNrOiBGaWxlR3JpZC5vbkZpbHRlckNsaWNrXHJcbiAgICB9KSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBmaWxlYnJvd3NlclxyXG4gKi9cclxuZnVuY3Rpb24gZmlsZUJyb3dzZXIoKSB7XHJcbiAgICB3MnVpWydsZWZ0TGF5b3V0J10uY29udGVudCgnbWFpbicsICQoKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdncmlkJyxcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIHRvb2xiYXJTZWFyY2g6IGZhbHNlLFxyXG4gICAgICAgICAgICB0b29sYmFyUmVsb2FkOiBmYWxzZSxcclxuICAgICAgICAgICAgZm9vdGVyOiB0cnVlLFxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29sdW1uczogW3tcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAncmVjaWQnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ01GVCBpbmRleCcsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnODBweCcsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAvL3NlYXJjaGFibGU6ICdpbnQnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAnYmFzZUlkcycsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnQmFzZUlkIGxpc3QnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzEwMCUnLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgLy9zZWFyY2hhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAndHlwZScsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVHlwZScsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnMTAwcHgnLFxyXG4gICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgc29ydGFibGU6IGZhbHNlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAnZmlsZVNpemUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1BhY2sgU2l6ZScsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAnODVweCcsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzb3J0YWJsZTogZmFsc2VcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF0sXHJcbiAgICAgICAgb25DbGljazogZnVuY3Rpb24gKGV2ZW50KSB7XHJcbiAgICAgICAgICAgIEZpbGVWaWV3ZXIudmlld0ZpbGVCeU1GVChldmVudC5yZWNpZCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSkpO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZSB2aWV3IHdpbmRvd1xyXG4gKi9cclxuZnVuY3Rpb24gZmlsZVZpZXcoKSB7XHJcbiAgICAkKHcydWlbJ2xheW91dCddLmVsKCdtYWluJykpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGgxIGlkPSdmaWxlVGl0bGUnIC8+XCIpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxkaXYgaWQ9J2ZpbGVUYWJzJyAvPlwiKSlcclxuXHJcblxyXG4gICAgJChcIiNmaWxlVGFic1wiKS53MnRhYnMoe1xyXG4gICAgICAgIG5hbWU6ICdmaWxlVGFicycsXHJcbiAgICAgICAgYWN0aXZlOiAndGFiUmF3JyxcclxuICAgICAgICB0YWJzOiBbXVxyXG4gICAgfSk7XHJcblxyXG4gICAgRmlsZVZpZXdlci5nZW5lcmF0ZVRhYkxheW91dCgpO1xyXG59XHJcblxyXG5mdW5jdGlvbiBzdHJpbmdHcmlkKCkge1xyXG4gICAgLy8vIFNldCB1cCBncmlkIGZvciBzdHJpbmdzIHZpZXdcclxuICAgIC8vL0NyZWF0ZSBncmlkXHJcbiAgICAkKFwiI3N0cmluZ091dHB1dFwiKS53MmdyaWQoe1xyXG4gICAgICAgIG5hbWU6ICdzdHJpbmdHcmlkJyxcclxuICAgICAgICBzZWxlY3RUeXBlOiAnY2VsbCcsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWUsXHJcbiAgICAgICAgfSxcclxuICAgICAgICBjb2x1bW5zOiBbe1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6ICdyZWNpZCcsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiAnUm93ICMnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzYwcHgnXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiAndmFsdWUnLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogJ1RleHQnLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogJzEwMCUnXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gd2UgaGF2ZSBhIGxpc3Qgb2YgdGhlIGZpbGVzIHRvIG9yZ2FuaXplIHRoZSBjYXRlZ29yaWVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhck5vZGVzKCkge1xyXG5cclxuICAgIC8vQ2xlYXIgc2lkZWJhciBpZiBhbHJlYWR5IHNldCB1cFxyXG4gICAgZm9yIChsZXQgZWxlbWVudCBvZiB3MnVpWydzaWRlYmFyJ10ubm9kZXMpIHtcclxuICAgICAgICBpZiAoZWxlbWVudC5pZCAhPSAnQWxsJykge1xyXG4gICAgICAgICAgICB3MnVpWydzaWRlYmFyJ10ubm9kZXMuc3BsaWNlKFxyXG4gICAgICAgICAgICAgICAgdzJ1aVsnc2lkZWJhciddLm5vZGVzLmluZGV4T2YoZWxlbWVudC5pZCksXHJcbiAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdzJ1aVsnc2lkZWJhciddLnJlZnJlc2goKTtcclxuXHJcbiAgICAvL1JlZ2VuZXJhdGUgICAgXHJcblxyXG4gICAgbGV0IHBhY2tOb2RlID0ge1xyXG4gICAgICAgIGlkOiAncGFja0dyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnUGFjayBGaWxlcycsXHJcbiAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInLFxyXG4gICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH07XHJcblxyXG4gICAgbGV0IHRleHR1cmVOb2RlID0ge1xyXG4gICAgICAgIGlkOiAndGV4dHVyZUdyb3VwJyxcclxuICAgICAgICB0ZXh0OiAnVGV4dHVyZSBmaWxlcycsXHJcbiAgICAgICAgaW1nOiAnaWNvbi1mb2xkZXInLFxyXG4gICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICBub2RlczogW11cclxuICAgIH1cclxuXHJcbiAgICBsZXQgdW5zb3J0ZWROb2RlID0ge1xyXG4gICAgICAgIGlkOiAndW5zb3J0ZWRHcm91cCcsXHJcbiAgICAgICAgdGV4dDogJ1Vuc29ydGVkJyxcclxuICAgICAgICBpbWc6ICdpY29uLWZvbGRlcicsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfVxyXG5cclxuICAgIC8vLyBCdWlsZCBzaWRlYmFyIG5vZGVzXHJcbiAgICBmb3IgKGxldCBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG4gICAgICAgIGlmIChHbG9iYWxzLl9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuXHJcbiAgICAgICAgICAgIGxldCBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICBncm91cDogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IGlzUGFjayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRleHR1cmVOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gJ0JJTkFSSUVTJykge1xyXG4gICAgICAgICAgICAgICAgbm9kZS50ZXh0ID0gXCJCaW5hcmllc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSAnU1RSSU5HUycpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiU3RyaW5nc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHBhY2tOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gJ1VOS05PV04nKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlVua25vd25cIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogZmlsZVR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB1bnNvcnRlZE5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHBhY2tOb2RlLm5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHBhY2tOb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodGV4dHVyZU5vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQodGV4dHVyZU5vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh1bnNvcnRlZE5vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQodW5zb3J0ZWROb2RlKTtcclxuICAgIH1cclxuXHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9wZW5GaWxlUG9wdXAoKSB7XHJcbiAgICAvLy8gQXNrIGZvciBmaWxlXHJcbiAgICB3MnBvcHVwLm9wZW4oe1xyXG4gICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgIHRpdGxlOiAnTG9hZCBBIEdXMiBkYXQnLFxyXG4gICAgICAgIG1vZGFsOiB0cnVlLFxyXG4gICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgYm9keTogJzxkaXYgY2xhc3M9XCJ3MnVpLWNlbnRlcmVkXCI+JyArXHJcbiAgICAgICAgICAgICc8ZGl2IGlkPVwiZmlsZUxvYWRQcm9ncmVzc1wiIC8+JyArXHJcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICAnPC9kaXY+J1xyXG4gICAgfSk7XHJcblxyXG5cclxuICAgICQoXCIjZmlsZVBpY2tlclBvcFwiKVxyXG4gICAgICAgIC5jaGFuZ2UoXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChldnQpIHtcclxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2xyID0gVDNELmdldExvY2FsUmVhZGVyKFxyXG4gICAgICAgICAgICAgICAgICAgIGV2dC50YXJnZXQuZmlsZXNbMF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25SZWFkZXJDYWxsYmFjayxcclxuICAgICAgICAgICAgICAgICAgICBcIi4uL3N0YXRpYy90M2R3b3JrZXIuanNcIik7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKSB7XHJcblxyXG4gICAgb25SZWFkZXJDYWxsYmFjayA9IG9uUmVhZGVyQ3JlYXRlZDtcclxuXHJcbiAgICBtYWluR3JpZCgpO1xyXG4gICAgdG9vbGJhcigpO1xyXG4gICAgc2lkZWJhcigpO1xyXG4gICAgZmlsZUJyb3dzZXIoKTtcclxuICAgIGZpbGVWaWV3KCk7XHJcbiAgICBzdHJpbmdHcmlkKCk7XHJcblxyXG4gICAgLypcclxuICAgICAgICBTRVQgVVAgVFJFRSAzRCBTQ0VORVxyXG4gICAgKi9cclxuICAgIFV0aWxzLnNldHVwU2NlbmUoKTtcclxuXHJcbiAgICBvcGVuRmlsZVBvcHVwKCk7XHJcblxyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2RlcyxcclxufSIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcbi8vLyBFeHBvcnRzIGN1cnJlbnQgbW9kZWwgYXMgYW4gLm9iaiBmaWxlIHdpdGggYSAubXRsIHJlZmVyaW5nIC5wbmcgdGV4dHVyZXMuXHJcbmZ1bmN0aW9uIGV4cG9ydFNjZW5lKCkge1xyXG5cclxuICAgIC8vLyBHZXQgbGFzdCBsb2FkZWQgZmlsZUlkXHRcdFxyXG4gICAgdmFyIGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZDtcclxuXHJcbiAgICAvLy8gUnVuIFQzRCBoYWNrZWQgdmVyc2lvbiBvZiBPQkpFeHBvcnRlclxyXG4gICAgdmFyIHJlc3VsdCA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpLnBhcnNlKEdsb2JhbHMuX3NjZW5lLCBmaWxlSWQpO1xyXG5cclxuICAgIC8vLyBSZXN1bHQgbGlzdHMgd2hhdCBmaWxlIGlkcyBhcmUgdXNlZCBmb3IgdGV4dHVyZXMuXHJcbiAgICB2YXIgdGV4SWRzID0gcmVzdWx0LnRleHR1cmVJZHM7XHJcblxyXG4gICAgLy8vIFNldCB1cCB2ZXJ5IGJhc2ljIG1hdGVyaWFsIGZpbGUgcmVmZXJpbmcgdGhlIHRleHR1cmUgcG5nc1xyXG4gICAgLy8vIHBuZ3MgYXJlIGdlbmVyYXRlZCBhIGZldyBsaW5lcyBkb3duLlxyXG4gICAgdmFyIG10bFNvdXJjZSA9IFwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuICAgICAgICBtdGxTb3VyY2UgKz0gXCJuZXdtdGwgdGV4X1wiICsgdGV4SWQgKyBcIlxcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LYSB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LZCB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblxcblwiO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG9ialxyXG4gICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmVzdWx0Lm9ial0sIHtcclxuICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXHJcbiAgICB9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsIFwiZXhwb3J0LlwiICsgZmlsZUlkICsgXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5tdGxcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24gKHRleElkKSB7XHJcblxyXG4gICAgICAgIC8vLyBMb2NhbFJlYWRlciB3aWxsIGhhdmUgdG8gcmUtbG9hZCB0aGUgdGV4dHVyZXMsIGRvbid0IHdhbnQgdG8gZmV0Y2hcclxuICAgICAgICAvLy8gdGhlbiBmcm9tIHRoZSBtb2RlbCBkYXRhLi5cclxuICAgICAgICBHbG9iYWxzLl9sci5sb2FkVGV4dHVyZUZpbGUodGV4SWQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChpbmZsYXRlZERhdGEsIGR4dFR5cGUsIGltYWdlV2lkdGgsIGltYWdlSGVpZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBqcyBpbWFnZSB1c2luZyByZXR1cm5lZCBiaXRtYXAgZGF0YS5cclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShpbmZsYXRlZERhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2VIZWlndGhcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIE5lZWQgYSBjYW52YXMgaW4gb3JkZXIgdG8gZHJhd1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKGNhbnZhcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBvdXRwdXQgaW1hZ2UgZGF0YSBidWZmZXJcclxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBHZXQgaW1hZ2VkYXRhIHNpemVcclxuICAgICAgICAgICAgICAgIHZhciB3ID0gaW5wdXQud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBMb29wIHBpeGVsc1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeSA9IDE7IHkgPCBoIC0gMTsgeSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDE7IHggPCB3IC0gMTsgeCArPSAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gT3V0cHV0IGxpbmVhciBjb29yZGluYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGlwID0gKChoIC0geSkgKiB3ICsgeCkgKiA0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaSArIGNdID0gaW5wdXREYXRhW2ZsaXAgKyBjXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gV3JpdGUgYmFjayBmbGlwcGVkIGRhdGFcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEob3V0cHV0LCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gRmV0Y2ggY2FudmFzIGRhdGEgYXMgcG5nIGFuZCBkb3dubG9hZC5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS50b0Jsb2IoXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBuZ0Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZURhdGEocG5nQmxvYiwgXCJ0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBSZW1vdmUgY2FudmFzIGZyb20gRE9NXHJcbiAgICAgICAgICAgICAgICBjYW52YXMucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBhLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVOYW1lO1xyXG4gICAgICAgIGEuY2xpY2soKTtcclxuICAgICAgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgfTtcclxufSgpKTtcclxuXHJcblxyXG5cclxuLy8vIFNldHRpbmcgdXAgYSBzY2VuZSwgVHJlZS5qcyBzdGFuZGFyZCBzdHVmZi4uLlxyXG5mdW5jdGlvbiBzZXR1cFNjZW5lKCkge1xyXG5cclxuICAgIHZhciBjYW52YXNXaWR0aCA9ICQoXCIjbW9kZWxPdXRwdXRcIikud2lkdGgoKTtcclxuICAgIHZhciBjYW52YXNIZWlnaHQgPSAkKFwiI21vZGVsT3V0cHV0XCIpLmhlaWdodCgpO1xyXG4gICAgdmFyIGNhbnZhc0NsZWFyQ29sb3IgPSAweDM0MjkyMDsgLy8gRm9yIGhhcHB5IHJlbmRlcmluZywgYWx3YXlzIHVzZSBWYW4gRHlrZSBCcm93bi5cclxuICAgIHZhciBmb3YgPSA2MDtcclxuICAgIHZhciBhc3BlY3QgPSAxO1xyXG4gICAgdmFyIG5lYXIgPSAwLjE7XHJcbiAgICB2YXIgZmFyID0gNTAwMDAwO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCwgbmVhciwgZmFyKTtcclxuXHJcbiAgICBHbG9iYWxzLl9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xyXG5cclxuICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xyXG4gICAgdmFyIGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoMHg1NTU1NTUpO1xyXG4gICAgR2xvYmFscy5fc2NlbmUuYWRkKGFtYmllbnRMaWdodCk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQxID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQxLnBvc2l0aW9uLnNldCgwLCAwLCAxKTtcclxuICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0MSk7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQyID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQyLnBvc2l0aW9uLnNldCgxLCAwLCAwKTtcclxuICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0Mik7XHJcblxyXG4gICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcclxuICAgIGRpcmVjdGlvbmFsTGlnaHQzLnBvc2l0aW9uLnNldCgwLCAxLCAwKTtcclxuICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0Myk7XHJcblxyXG4gICAgLy8vIFN0YW5kYXJkIFRIUkVFIHJlbmRlcmVyIHdpdGggQUFcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xyXG4gICAgICAgIGFudGlhbGlhc2luZzogdHJ1ZVxyXG4gICAgfSk7XHJcbiAgICAkKFwiI21vZGVsT3V0cHV0XCIpWzBdLmFwcGVuZENoaWxkKEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xyXG5cclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoY2FudmFzV2lkdGgsIGNhbnZhc0hlaWdodCk7XHJcbiAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRDbGVhckNvbG9yKGNhbnZhc0NsZWFyQ29sb3IpO1xyXG5cclxuICAgIC8vLyBBZGQgVEhSRUUgb3JiaXQgY29udHJvbHMsIGZvciBzaW1wbGUgb3JiaXRpbmcsIHBhbm5pbmcgYW5kIHpvb21pbmdcclxuICAgIEdsb2JhbHMuX2NvbnRyb2xzID0gbmV3IFRIUkVFLk9yYml0Q29udHJvbHMoR2xvYmFscy5fY2FtZXJhLCBHbG9iYWxzLl9yZW5kZXJlci5kb21FbGVtZW50KTtcclxuICAgIEdsb2JhbHMuX2NvbnRyb2xzLmVuYWJsZVpvb20gPSB0cnVlO1xyXG5cclxuICAgIC8vLyBTZW1zIHcydWkgZGVsYXlzIHJlc2l6aW5nIDovXHJcbiAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcclxuICAgICAgICBzZXRUaW1lb3V0KG9uQ2FudmFzUmVzaXplLCAxMClcclxuICAgIH0pO1xyXG5cclxuICAgIC8vLyBOb3RlOiBjb25zdGFudCBjb250aW5vdXMgcmVuZGVyaW5nIGZyb20gcGFnZSBsb2FkIGV2ZW50LCBub3QgdmVyeSBvcHQuXHJcbiAgICByZW5kZXIoKTtcclxufVxyXG5cclxuXHJcbmZ1bmN0aW9uIG9uQ2FudmFzUmVzaXplKCkge1xyXG5cclxuICAgIHZhciBzY2VuZVdpZHRoID0gJChcIiNtb2RlbE91dHB1dFwiKS53aWR0aCgpO1xyXG4gICAgdmFyIHNjZW5lSGVpZ2h0ID0gJChcIiNtb2RlbE91dHB1dFwiKS5oZWlnaHQoKTtcclxuXHJcbiAgICBpZiAoIXNjZW5lSGVpZ2h0IHx8ICFzY2VuZVdpZHRoKVxyXG4gICAgICAgIHJldHVybjtcclxuXHJcbiAgICBHbG9iYWxzLl9jYW1lcmEuYXNwZWN0ID0gc2NlbmVXaWR0aCAvIHNjZW5lSGVpZ2h0O1xyXG5cclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoc2NlbmVXaWR0aCwgc2NlbmVIZWlnaHQpO1xyXG5cclxuICAgIEdsb2JhbHMuX2NhbWVyYS51cGRhdGVQcm9qZWN0aW9uTWF0cml4KCk7XHJcbn1cclxuXHJcbi8vLyBSZW5kZXIgbG9vcCwgbm8gZ2FtZSBsb2dpYywganVzdCByZW5kZXJpbmcuXHJcbmZ1bmN0aW9uIHJlbmRlcigpIHtcclxuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcclxuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnJlbmRlcihHbG9iYWxzLl9zY2VuZSwgR2xvYmFscy5fY2FtZXJhKTtcclxufVxyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVIZXhUYWJsZShyYXdEYXRhLCBkb21Db250YWluZXIsIGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmF3RGF0YSk7XHJcbiAgICBsZXQgaGV4T3V0cHV0ID0gW107XHJcbiAgICBsZXQgYXNjaWlPdXRwdXQgPSBbXTtcclxuICAgIGNvbnN0IGxvb3BDaHVua1NpemUgPSAxMDAwMDtcclxuXHJcbiAgICBjb25zdCBBU0NJSSA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicgKyAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonICtcclxuICAgICAgICAnMDEyMzQ1Njc4OScgKyAnIVwiIyQlJlxcJygpKissLS4vOjs8PT4/QFtcXFxcXV5fYHt8fX4nO1xyXG5cclxuICAgICQoZG9tQ29udGFpbmVyKS5odG1sKFwiXCIpO1xyXG4gICAgJChkb21Db250YWluZXIpLmFwcGVuZChgXHJcbjx0YWJsZSBjbGFzcz1cImhleGFUYWJsZVwiPlxyXG4gICAgPHRyPlxyXG4gICAgICAgIDx0aD5BZGRyZXNzPC90aD5cclxuICAgICAgICA8dGg+MDA8L3RoPjx0aD4wMTwvdGg+PHRoPjAyPC90aD48dGg+MDM8L3RoPjx0aD4wNDwvdGg+PHRoPjA1PC90aD48dGg+MDY8L3RoPjx0aD4wNzwvdGg+XHJcbiAgICAgICAgPHRoPjA4PC90aD48dGg+MDk8L3RoPjx0aD4wQTwvdGg+PHRoPjBCPC90aD48dGg+MEM8L3RoPjx0aD4wRDwvdGg+PHRoPjBFPC90aD48dGg+MEY8L3RoPlxyXG4gICAgICAgIDx0aD5BU0NJSTwvdGg+XHJcbiAgICA8L3RyPmApO1xyXG5cclxuXHJcbiAgICAvL0JyZWFrdXAgdGhlIHdvcmsgaW50byBzbGljZXMgb2YgMTBrQiBmb3IgcGVyZm9ybWFuY2VcclxuICAgIGxldCBieXRlQXJyYXlTbGljZSA9IFtdO1xyXG4gICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgYnl0ZUFycmF5Lmxlbmd0aDsgcG9zICs9IGxvb3BDaHVua1NpemUpIHtcclxuICAgICAgICBieXRlQXJyYXlTbGljZS5wdXNoKGJ5dGVBcnJheS5zbGljZShwb3MsIHBvcyArIGxvb3BDaHVua1NpemUpKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbG9vcENvdW50ID0gMDtcclxuICAgIGxldCBsb29wRnVuYyA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICBsZXQgYnl0ZUFycmF5SXRlbSA9IGJ5dGVBcnJheVNsaWNlW2xvb3BDb3VudF07XHJcbiAgICAgICAgLy9JZiB0aGVyZSBpcyBubyBtb3JlIHdvcmsgd2UgY2xlYXIgdGhlIGxvb3AgYW5kIGNhbGxiYWNrXHJcbiAgICAgICAgaWYgKGJ5dGVBcnJheUl0ZW0gPT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwobG9vcEZ1bmMpO1xyXG4gICAgICAgICAgICAkKGRvbUNvbnRhaW5lciArIFwiIHRhYmxlXCIpLmFwcGVuZChcIjwvdGFibGU+XCIpO1xyXG4gICAgICAgICAgICAkKGRvbUNvbnRhaW5lcikuc2hvdygpO1xyXG4gICAgICAgICAgICBjYWxsYmFjaygpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL1dvcmsgd2l0aCBsaW5lcyBvZiAxNiBieXRlc1xyXG4gICAgICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGJ5dGVBcnJheUl0ZW0ubGVuZ3RoOyBwb3MgKz0gMTYpIHtcclxuICAgICAgICAgICAgbGV0IHdvcmtTbGljZSA9IGJ5dGVBcnJheUl0ZW0uc2xpY2UocG9zLCBwb3MgKyAxNik7XHJcbiAgICAgICAgICAgIGxldCByb3dIVE1MID0gXCI8dHI+XCI7XHJcbiAgICAgICAgICAgIGxldCBhc2NpaUxpbmUgPSBcIlwiO1xyXG4gICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE51bWJlcihwb3MgKyAobG9vcENvdW50ICogbG9vcENodW5rU2l6ZSkpLnRvU3RyaW5nKDE2KTtcclxuICAgICAgICAgICAgYWRkcmVzcyA9IGFkZHJlc3MubGVuZ3RoICE9IDggPyAnMCcucmVwZWF0KDggLSBhZGRyZXNzLmxlbmd0aCkgKyBhZGRyZXNzIDogYWRkcmVzcztcclxuICAgICAgICAgICAgcm93SFRNTCArPSAnPHRkPicgKyBhZGRyZXNzICsgJzwvdGQ+JztcclxuXHJcbiAgICAgICAgICAgIC8vSXRlcmF0ZSB0aHJvdWdoIGVhY2ggYnl0ZSBvZiB0aGUgMTZieXRlcyBsaW5lXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJ5dGUgPSB3b3JrU2xpY2VbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgYnl0ZUhleENvZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnl0ZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IGJ5dGUudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBieXRlSGV4Q29kZS5sZW5ndGggPT0gMSA/IFwiMFwiICsgYnl0ZUhleENvZGUgOiBieXRlSGV4Q29kZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBcIiAgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgcm93SFRNTCArPSAnPHRkPicgKyBieXRlSGV4Q29kZSArICc8L3RkPic7XHJcbiAgICAgICAgICAgICAgICBsZXQgYXNjaWlDb2RlID0gYnl0ZSA/IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkgOiBcIiBcIjtcclxuICAgICAgICAgICAgICAgIGFzY2lpQ29kZSA9IEFTQ0lJLmluY2x1ZGVzKGFzY2lpQ29kZSkgPyBhc2NpaUNvZGUgOiBcIi5cIjtcclxuICAgICAgICAgICAgICAgIGFzY2lpTGluZSArPSBhc2NpaUNvZGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIHJvd0hUTUwgKz0gJzx0ZD4nICsgYXNjaWlMaW5lICsgJzwvdGQ+PC90cj4gJztcclxuICAgICAgICAgICAgJChkb21Db250YWluZXIgKyBcIiB0YWJsZVwiKS5hcHBlbmQocm93SFRNTCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb29wQ291bnQgKz0gMTtcclxuICAgIH0sIDEpO1xyXG59XHJcblxyXG4vL1RoaXMgc3BlY2lhbCBmb3JFYWNoIGhhdmUgYW4gYWRkaXRpb25hbCBwYXJhbWV0ZXIgdG8gYWRkIGEgc2V0VGltZW91dCgxKSBiZXR3ZWVuIGVhY2ggXCJjaHVua1NpemVcIiBpdGVtc1xyXG5mdW5jdGlvbiBhc3luY0ZvckVhY2goYXJyYXksIGNodW5rU2l6ZSwgZm4pIHtcclxuICAgIGxldCB3b3JrQXJyYXkgPSBbXTtcclxuICAgIC8vU2xpY2UgdXAgdGhlIGFycmF5IGludG8gd29yayBhcnJheSBmb3Igc3luY2hyb25vdXMgY2FsbFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5zaXplOyBpICs9IGNodW5rU2l6ZSkge1xyXG4gICAgICAgIHdvcmtBcnJheS5wdXNoKGFycmF5LnNsaWNlKGksIGkgKyBjaHVua1NpemUpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL0xvb3Bjb3VudCBpcyB0aGUgYW1vdW50IG9mIHRpbWVzIGNodW5rU2l6ZSBoYXZlIGJlZW4gcmVhY2hlZFxyXG4gICAgbGV0IGxvb3Bjb3VudCA9IDA7XHJcbiAgICBsZXQgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgLy9JdGVyYXRlIHRocm91Z2ggdGhlIGNodW5rXHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXggaW4gd29ya0FycmF5KSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gd29ya0FycmF5W2luZGV4XTtcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gaW5kZXggKyAobG9vcGNvdW50ICogY2h1bmtTaXplKTtcclxuICAgICAgICAgICAgZm4oaXRlbSwgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9DaGVjayBpZiB0aGVyZSBpcyBtb3JlIHdvcmsgb3Igbm90XHJcbiAgICAgICAgbG9vcGNvdW50ICs9IDE7XHJcbiAgICAgICAgaWYgKGxvb3Bjb3VudCA9PSB3b3JrQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGV4cG9ydFNjZW5lOiBleHBvcnRTY2VuZSxcclxuICAgIHNhdmVEYXRhOiBzYXZlRGF0YSxcclxuICAgIHNldHVwU2NlbmU6IHNldHVwU2NlbmUsXHJcbiAgICBvbkNhbnZhc1Jlc2l6ZTogb25DYW52YXNSZXNpemUsXHJcbiAgICByZW5kZXI6IHJlbmRlcixcclxuICAgIGdlbmVyYXRlSGV4VGFibGU6IGdlbmVyYXRlSGV4VGFibGVcclxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZWFkVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZWFkVmlld1wiLCBcIk92ZXJ2aWV3XCIpO1xuICAgICAgICAvL3N1cGVyKFwiI2ZpbGVUYWJzSGVhZFwiLCBcIiNoZWFkVmlld1wiLCBcInRhYkhlYWRWaWV3XCIsIFwiT3ZlcnZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApLmFwcGVuZCgkKFwiPGgyPlwiICsgdGhpcy5uYW1lICsgXCI8L2gyPlwiKSk7XG5cbiAgICAgICAgICAgIC8vVE9ETzpcbiAgICAgICAgICAgIC8vTUZUIGluZGV4XG4gICAgICAgICAgICAvL0Jhc2VJZFxuICAgICAgICAgICAgLy9GaWxlVHlwZVxuICAgICAgICAgICAgLy9Db21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vVW5jb21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG5cbiAgICB9XG5cbiAgICAvL0hlYWR2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZXhhVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIC8vc3VwZXIoXCIjZmlsZVRhYnNIZXhWaWV3XCIsIFwiI2hleFZpZXdcIiwgXCJ0YWJIZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgICAgICBVdGlscy5nZW5lcmF0ZUhleFRhYmxlKHJhd0RhdGEsIGAjJHt0aGlzLmlkfU91dHB1dGAsICgpID0+IHt9KTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIC8vSGV4YSB2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZXhhVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBNb2RlbFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwibW9kZWxcIiwgXCJNb2RlbFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgLy8vIE1ha2Ugc3VyZSBvdXRwdXQgaXMgY2xlYW5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgICAgICAgICAgLy8vIFJ1biBzaW5nbGUgcmVuZGVyZXJcbiAgICAgICAgICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgICAgICAgICBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZU1vZGVsKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgI2ZpbGVUYWIke3RoaXMuaWR9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICAvLy8gUmVtb3ZlIG9sZCBtb2RlbHMgZnJvbSB0aGUgc2NlbmVcbiAgICAgICAgaWYgKEdsb2JhbHMuX21vZGVscykge1xuICAgICAgICAgICAgZm9yIChsZXQgbWRsIG9mIEdsb2JhbHMuX21vZGVscykge1xuICAgICAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLnJlbW92ZShtZGwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZS5oZWFkZXIudHlwZSA9PSAnTU9ETCcpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxuXG4gICAgb25SZW5kZXJlckRvbmVNb2RlbCgpIHtcblxuICAgICAgICAvLy8gUmUtZml0IGNhbnZhc1xuICAgICAgICBVdGlscy5vbkNhbnZhc1Jlc2l6ZSgpO1xuXG4gICAgICAgIC8vLyBBZGQgY29udGV4dCB0b29sYmFyIGV4cG9ydCBidXR0b25cbiAgICAgICAgJChcIiNjb250ZXh0VG9vbGJhclwiKS5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5FeHBvcnQgc2NlbmU8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhVdGlscy5leHBvcnRTY2VuZSlcbiAgICAgICAgKTtcblxuICAgICAgICAvLy8gUmVhZCB0aGUgbmV3IG1vZGVsc1xuICAgICAgICBHbG9iYWxzLl9tb2RlbHMgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLCBcIm1lc2hlc1wiLCBbXSk7XG5cbiAgICAgICAgLy8vIEtlZXBpbmcgdHJhY2sgb2YgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGxhdGVyXG4gICAgICAgIHZhciBiaWdnZXN0TWRsID0gbnVsbDtcblxuICAgICAgICAvLy8gQWRkIGFsbCBtb2RlbHMgdG8gdGhlIHNjZW5lXG4gICAgICAgIGZvciAobGV0IG1vZGVsIG9mIEdsb2JhbHMuX21vZGVscykge1xuXG4gICAgICAgICAgICAvLy8gRmluZCB0aGUgYmlnZ2VzdCBtb2RlbCBmb3IgY2FtZXJhIGZvY3VzL2ZpdHRpbmdcbiAgICAgICAgICAgIGlmICghYmlnZ2VzdE1kbCB8fCBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyA8IG1vZGVsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cykge1xuICAgICAgICAgICAgICAgIGJpZ2dlc3RNZGwgPSBtb2RlbDtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKG1vZGVsKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vLyBSZXNldCBhbnkgem9vbSBhbmQgdHJhbnNhbHRpb24vcm90YXRpb24gZG9uZSB3aGVuIHZpZXdpbmcgZWFybGllciBtb2RlbHMuXG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzLnJlc2V0KCk7XG5cbiAgICAgICAgLy8vIEZvY3VzIGNhbWVyYSB0byB0aGUgYmlnZXN0IG1vZGVsLCBkb2Vzbid0IHdvcmsgZ3JlYXQuXG4gICAgICAgIHZhciBkaXN0ID0gKGJpZ2dlc3RNZGwgJiYgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZSkgPyBiaWdnZXN0TWRsLmJvdW5kaW5nU3BoZXJlLnJhZGl1cyAvIE1hdGgudGFuKE1hdGguUEkgKiA2MCAvIDM2MCkgOiAxMDA7XG4gICAgICAgIGRpc3QgPSAxLjIgKiBNYXRoLm1heCgxMDAsIGRpc3QpO1xuICAgICAgICBkaXN0ID0gTWF0aC5taW4oMTAwMCwgZGlzdCk7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi56b29tID0gMTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnggPSBkaXN0ICogTWF0aC5zcXJ0KDIpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueSA9IDUwO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24ueiA9IDA7XG5cblxuICAgICAgICBpZiAoYmlnZ2VzdE1kbClcbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5sb29rQXQoYmlnZ2VzdE1kbC5wb3NpdGlvbik7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IE1vZGVsVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBQYWNrVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJwYWNrXCIsIFwiUGFjayBmaWxlXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG5cbiAgICAgICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5hcHBlbmQoJChcIjxoMj5cIiArIHRoaXMubmFtZSArIFwiPC9oMj5cIikpO1xuXG4gICAgICAgICAgICBmb3IgKGxldCBjaHVuayBvZiBwYWNrZmlsZS5jaHVua3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmllbGQgPSAkKFwiPGZpZWxkc2V0IC8+XCIpO1xuICAgICAgICAgICAgICAgIHZhciBsZWdlbmQgPSAkKFwiPGxlZ2VuZD5cIiArIGNodW5rLmhlYWRlci50eXBlICsgXCI8L2xlZ2VuZD5cIik7XG5cbiAgICAgICAgICAgICAgICB2YXIgbG9nQnV0dG9uID0gJChcIjxidXR0b24+TG9nIENodW5rIERhdGEgdG8gQ29uc29sZTwvYnV0dG9uPlwiKTtcbiAgICAgICAgICAgICAgICBsb2dCdXR0b24uY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgXCJMb2dnaW5nXCIsIGNodW5rLmhlYWRlci50eXBlLCBcImNodW5rXCIpO1xuICAgICAgICAgICAgICAgICAgICBUM0QuTG9nZ2VyLmxvZyhUM0QuTG9nZ2VyLlRZUEVfTUVTU0FHRSwgY2h1bmsuZGF0YSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQobGVnZW5kKTtcbiAgICAgICAgICAgICAgICBmaWVsZC5hcHBlbmQoJChcIjxwPlNpemU6XCIgKyBjaHVuay5oZWFkZXIuY2h1bmtEYXRhU2l6ZSArIFwiPC9wPlwiKSk7XG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKGxvZ0J1dHRvbik7XG5cbiAgICAgICAgICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5hcHBlbmQoZmllbGQpO1xuICAgICAgICAgICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgI2ZpbGVUYWIke3RoaXMuaWR9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBwYWNrIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgIGlmIChwYWNrZmlsZSkge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gUGFja1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU291bmRWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInNvdW5kXCIsIFwiU291bmRcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cbiAgICAgICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICAgICAgbGV0IGNodW5rID0gcGFja2ZpbGUuZ2V0Q2h1bmsoXCJBU05EXCIpO1xuXG4gICAgICAgICAgICAvLy8gUHJpbnQgc29tZSByYW5kb20gZGF0YSBhYm91dCB0aGlzIHNvdW5kXG4gICAgICAgICAgICAkKGAjJHt0aGlzLmlkfU91dHB1dGApXG4gICAgICAgICAgICAgICAgLmh0bWwoXG4gICAgICAgICAgICAgICAgICAgIFwiTGVuZ3RoOiBcIiArIGNodW5rLmRhdGEubGVuZ3RoICsgXCIgc2Vjb25kczxici8+XCIgK1xuICAgICAgICAgICAgICAgICAgICBcIlNpemU6IFwiICsgY2h1bmsuZGF0YS5hdWRpb0RhdGEubGVuZ3RoICsgXCIgYnl0ZXNcIlxuICAgICAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIC8vLyBFeHRyYWN0IHNvdW5kIGRhdGFcbiAgICAgICAgICAgIHZhciBzb3VuZFVpbnRBcnJheSA9IGNodW5rLmRhdGEuYXVkaW9EYXRhO1xuXG4gICAgICAgICAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgICAgICAgICAgLnNob3coKVxuICAgICAgICAgICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbc291bmRVaW50QXJyYXldLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLm1wM1wiKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+UGxheSBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKGZ1bmN0aW9uICgpIHtcblxuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFHbG9iYWxzLl9hdWRpb0NvbnRleHQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb0NvbnRleHQgPSBuZXcgQXVkaW9Db250ZXh0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBTdG9wIHByZXZpb3VzIHNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBDcmVhdGUgbmV3IGJ1ZmZlciBmb3IgY3VycmVudCBzb3VuZFxuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UgPSBHbG9iYWxzLl9hdWRpb0NvbnRleHQuY3JlYXRlQnVmZmVyU291cmNlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5jb25uZWN0KEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZXN0aW5hdGlvbik7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBEZWNvZGUgYW5kIHN0YXJ0IHBsYXlpbmdcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5kZWNvZGVBdWRpb0RhdGEoc291bmRVaW50QXJyYXkuYnVmZmVyLCBmdW5jdGlvbiAocmVzKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2UuYnVmZmVyID0gcmVzO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0YXJ0KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+U3RvcCBNUDM8L2J1dHRvbj5cIilcbiAgICAgICAgICAgICAgICAgICAgLmNsaWNrKFxuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLnN0b3AoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGNhdGNoIChlKSB7fVxuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICApXG4gICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ0FTTkQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU3RyaW5nVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJzdHJpbmdcIiwgXCJTdHJpbmdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICAvLy8gTWFrZSBzdXJlIG91dHB1dCBpcyBjbGVhblxuICAgICAgICAgICAgR2xvYmFscy5fY29udGV4dCA9IHt9O1xuXG4gICAgICAgICAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxuICAgICAgICAgICAgVDNELnJ1blJlbmRlcmVyKFxuICAgICAgICAgICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZVN0cmluZygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjZmlsZVRhYiR7dGhpcy5pZH1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG5cbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHN0cmluZyBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgbGV0IHJhd0RhdGEgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcbiAgICAgICAgbGV0IGZjYyA9IFN0cmluZy5mcm9tQ2hhckNvZGUocmF3RGF0YVswXSwgcmF3RGF0YVsxXSwgcmF3RGF0YVsyXSwgcmF3RGF0YVszXSk7XG4gICAgICAgIGlmIChmY2MgPT09ICdzdHJzJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhblZpZXcoKTtcbiAgICB9XG5cbiAgICBvblJlbmRlcmVyRG9uZVN0cmluZygpIHtcblxuICAgICAgICAvLy8gUmVhZCBkYXRhIGZyb20gcmVuZGVyZXJcbiAgICAgICAgbGV0IHN0cmluZ3MgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5TdHJpbmdSZW5kZXJlciwgXCJzdHJpbmdzXCIsIFtdKTtcblxuICAgICAgICB3MnVpLnN0cmluZ0dyaWQucmVjb3JkcyA9IHN0cmluZ3M7XG5cbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkID0gdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMubGVuZ3RoO1xuICAgICAgICB3MnVpLnN0cmluZ0dyaWQudG90YWwgPSB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQ7XG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5yZWZyZXNoKCk7XG4gICAgfVxufVxuXG5cbm1vZHVsZS5leHBvcnRzID0gU3RyaW5nVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBUZXh0dXJlVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJ0ZXh0dXJlXCIsIFwiVGV4dHVyZVwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuXG4gICAgICAgICAgICAvLy8gRGlzcGxheSBiaXRtYXAgb24gY2FudmFzXG4gICAgICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXM+XCIpO1xuICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XG4gICAgICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xuICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XG5cbiAgICAgICAgICAgIC8vVE9ETzogdXNlIG5ldyB0ZXh0dXJlIHJlbmRlcmVyXG5cbiAgICAgICAgICAgIC8vdmFyIHVpY2EgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoaW1hZ2UuZGF0YSk7XG4gICAgICAgICAgICAvL3ZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xuICAgICAgICAgICAgLy9jdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XG5cbiAgICAgICAgICAgICQoYCMke3RoaXMuaWR9T3V0cHV0YCkuYXBwZW5kKGNhbnZhcyk7XG5cbiAgICAgICAgICAgIC8vUmVnaXN0ZXIgaXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCNmaWxlVGFiJHt0aGlzLmlkfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgdGV4dHVyZSBmaWxlIHRoZW4gcmV0dXJuIHRydWVcbiAgICAgICAgLy9UT0RPIHVzZSB0eXBlcyBmcm9tIERhdGFSZW5kZXJlclxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFRleHR1cmVWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLyoqXG4gKiBUaGlzIGlzIGFuIGFic3RyYWN0IGNsYXNzLCB1c2Ugb3RoZXIgY2xhc3MgdG8gZGVmaW5lIGJlaGF2aW9yLlxuICogRGVjbGFyaW5nIGEgVmlld2VyIGNsYXNzIGlzIG5vdCBlbm91Z2gsIGRvbid0IGZvcmdldCB0byByZWdpc3RlciBpdCBpbiB0aGUgRmlsZVZpZXdlciBtb2R1bGVcbiAqL1xuXG5jbGFzcyBWaWV3ZXIge1xuICAgIC8qKlxuICAgICAqIERlZmluZXMgdGhlIHRhYiBoZXJlXG4gICAgICovXG4gICAgY29uc3RydWN0b3IoaWQsIG5hbWUpIHtcbiAgICAgICAgLy9maWxlVGFiLCB0YWJPdXRwdXQsIHRhYklkLCBjYXB0aW9uXG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBSZW5kZXIgdGhlIGNvbnRlbnQgb2YgdGhlIHRhYiB3aGVuIGNhbGxlZFxuICAgICAqIEl0IGlzIHRoZSByZXNwb25zYWJpbGl0eSBvZiB0aGUgdmlld2VyIHRvIGNhY2hlIGl0J3MgaGVhdnkgdGFza3NcbiAgICAgKiBAcmV0dXJucyB7bnVsbH1cbiAgICAgKi9cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWRzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNoaWxkcmVuIGNsYXNzXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFVzZWQgdG8gY2xlYW4gbWVtb3J5IGFzIHNvb24gYXMgYW5vdGhlciBmaWxlIGlzIGxvYWRlZFxuICAgICAqL1xuICAgIGNsZWFuKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkcyB0byBiZSBpbXBsZW1lbnRlZCBieSBjaGlsZHJlbiBjbGFzc1wiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBXaWxsIGRldGVybWluZSBpZiB0aGUgdGFiIGNhbiBiZSBhY3RpdmUgb3Igbm90XG4gICAgICogQHJldHVybnMge2Jvb2xlYW59XG4gICAgICovXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZHMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY2hpbGRyZW4gY2xhc3NcIik7XG4gICAgfVxuXG4gICAgLy9JZiBzZXQgdG8gdHJ1ZSwgdGhlIGZpbGUgd2lsbCBiZSBvcGVuZWQgZGlyZWN0bHkgb24gdGhpcyB2aWV3XG4gICAgLy9JZiBtdWx0aXBsZSB2aWV3ZXJzIHJldHVybnMgdHJ1ZSBmb3IgdGhlIHNhbWUgZmlsZSwgaXQgY29tZXMgYmFjayB0byBkZWZhdWx0LlxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBWaWV3ZXI7Il19
