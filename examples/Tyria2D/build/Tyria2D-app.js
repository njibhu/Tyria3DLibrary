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
const Layout = require("./Layout");
var Globals = require("./Globals");

function onReaderCreated(lr) {
    Globals._lr = lr;

    w2popup.lock();

    $("#filePickerPop").prop("disabled", true);
    $("#fileLoadProgress").html("Indexing .dat file<br/>" + "<br/><br/>");
    T3D.getFileListAsync(lr, files => {
        /// Store fileList globally
        Globals._fileList = files;

        Layout.sidebarNodes();

        /// Close the pop
        w2popup.close();

        /// Select the "All" category
        w2ui.sidebar.click("All");
    });
}

Layout.initLayout(onReaderCreated);

/// Overwrite progress logger
T3D.Logger.logFunctions[T3D.Logger.TYPE_PROGRESS] = function() {
    $("#fileLoadProgress").html(
        "Indexing .dat file<br/>" + arguments[1] + "%<br/><br/>"
    );
};

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

var Globals = require("./Globals");

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
    w2ui.grid.searchReset();

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
                function(mftIndex) {
                    let meta = Globals._lr.getFileMeta(mftIndex);

                    var baseIds = reverseTable[mftIndex];
                    var fileSize = meta ? meta.size : "";

                    if (fileSize > 0 && mftIndex > 15) {
                        for (let baseId of baseIds) {
                            w2ui["grid"].records.push({
                                recid: w2ui["grid"].records.length,
                                mftId: mftIndex, /// MFT index
                                baseId: baseId,
                                type: fileType,
                                fileSize: fileSize
                            });
                        }
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
    onFilterClick: onFilterClick
};

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

const FileViewer = require("./Fileviewer");
const FileGrid = require("./Filegrid");
const Utils = require("./Utils");

var Globals = require("./Globals");

const HexaViewer = require("./Viewers/Hexa");

var onReaderCallback;

/**
 * Setup main grid
 */
function mainGrid() {
    const pstyle = "border: 1px solid #dfdfdf; padding: 0;";

    $("#layout").w2layout({
        name: "layout",
        panels: [
            {
                type: "top",
                size: 28,
                resizable: false,
                style: pstyle + " padding-top: 1px;"
            },
            {
                type: "left",
                size: 570,
                resizable: true,
                style: pstyle + "margin:0"
            },
            {
                type: "main",
                style: pstyle + " background-color: transparent;",
                toolbar: {
                    style: "background-color:#eaeaea; height:40px",
                    items: [
                        {
                            type: "html",
                            id: "contextToolbar",
                            html:
                                '<div class="toolbarEntry" id="contextToolbar"></div>'
                        }
                    ],
                    onClick: function(event) {
                        this.owner.content("main", event);
                    }
                }
            }
        ],
        onResize: Globals._onCanvasResize
    });

    $("#fileIdInputBtn").click(function() {
        FileViewer.viewFileByFileId($("#fileIdInput").val());
    });

    /// Grid inside main left
    $().w2layout({
        name: "leftLayout",
        panels: [
            {
                type: "left",
                size: 150,
                resizable: true,
                style: pstyle,
                content: "left"
            },
            {
                type: "main",
                size: 420,
                resizable: true,
                style: pstyle,
                content: "right"
            }
        ]
    });
    w2ui["layout"].content("left", w2ui["leftLayout"]);
}

/**
 * Setup toolbar
 */
function toolbar() {
    $().w2toolbar({
        name: "toolbar",
        items: [
            {
                type: "button",
                id: "loadFile",
                caption: "Open file",
                img: "icon-folder"
            },
            {
                type: "break"
            },
            {
                type: "menu",
                id: "view",
                caption: "View",
                img: "icon-page",
                items: [
                    {
                        text: "Hide file list",
                        img: "icon-page"
                    },
                    {
                        text: "Hide file categories",
                        img: "icon-page"
                    },
                    {
                        text: "Hide file preview",
                        img: "icon-page"
                    }
                ]
            },
            {
                type: "break"
            },
            {
                type: "menu",
                id: "tools",
                caption: "Tools",
                img: "icon-page",
                items: [
                    {
                        text: "View cntc summary",
                        img: "icon-page"
                    }
                ]
            },
            {
                type: "spacer"
            },
            {
                type: "button",
                id: "mentions",
                caption: "Tyria2D",
                img: "icon-page"
            }
        ],
        onClick: function(event) {
            switch (event.target) {
                case "loadFile":
                    openFilePopup();
                    break;
            }
        }
    });

    w2ui["layout"].content("top", w2ui["toolbar"]);
}

/**
 * Setup sidebar
 */
function sidebar() {
    /*
        SIDEBAR
    */
    w2ui["leftLayout"].content(
        "left",
        $().w2sidebar({
            name: "sidebar",
            img: null,
            nodes: [
                {
                    id: "All",
                    text: "All",
                    img: "icon-folder",
                    group: false
                }
            ],
            onClick: FileGrid.onFilterClick
        })
    );
}

/**
 * Setup filebrowser
 */
function fileBrowser() {
    w2ui["leftLayout"].content(
        "main",
        $().w2grid({
            name: "grid",
            show: {
                toolbar: true,
                toolbarSearch: true,
                toolbarReload: false,
                footer: true
            },
            columns: [
                {
                    field: "baseId",
                    caption: "Base ID",
                    size: "25%",
                    sortable: true,
                    resizable: true,
                    searchable: "int"
                },
                {
                    field: "mftId",
                    caption: "MFT ID",
                    size: "25%",
                    sortable: true,
                    resizable: true,
                    searchable: "int"
                },
                {
                    field: "type",
                    caption: "Type",
                    size: "25%",
                    resizable: true,
                    sortable: true
                },
                {
                    field: "fileSize",
                    caption: "Pack Size",
                    size: "25%",
                    resizable: true,
                    sortable: true
                }
            ],
            onClick: function(event) {
                let baseId = w2ui["grid"].records[event.recid].baseId;
                FileViewer.viewFileByFileId(baseId);
            }
        })
    );
}

/**
 * Setup file view window
 */
function fileView() {
    $(w2ui["layout"].el("main"))
        .append($("<h1 id='fileTitle' />"))
        .append($("<div id='fileTabs' />"));

    $("#fileTabs").w2tabs({
        name: "fileTabs",
        tabs: []
    });

    FileViewer.generateTabLayout();
}

function stringGrid() {
    /// Set up grid for strings view
    ///Create grid
    $("#stringOutput").w2grid({
        name: "stringGrid",
        selectType: "cell",
        show: {
            toolbar: true,
            footer: true
        },
        columns: [
            {
                field: "recid",
                caption: "Row #",
                size: "60px"
            },
            {
                field: "value",
                caption: "Text",
                size: "100%"
            }
        ]
    });
}

/**
 * This function is called when we have a list of the files to organize the categories.
 */
function sidebarNodes() {
    //Clear sidebar if already set up
    for (let element of w2ui["sidebar"].nodes) {
        if (element.id != "All") {
            w2ui["sidebar"].nodes.splice(
                w2ui["sidebar"].nodes.indexOf(element.id),
                1
            );
        }
    }
    w2ui["sidebar"].refresh();

    //Regenerate

    let packNode = {
        id: "packGroup",
        text: "Pack Files",
        img: "icon-folder",
        group: false,
        nodes: []
    };

    let textureNode = {
        id: "textureGroup",
        text: "Texture files",
        img: "icon-folder",
        group: false,
        nodes: []
    };

    let unsortedNode = {
        id: "unsortedGroup",
        text: "Unsorted",
        img: "icon-folder",
        group: false,
        nodes: []
    };

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
            } else if (fileType == "BINARIES") {
                node.text = "Binaries";
                w2ui.sidebar.add(node);
            } else if (fileType == "STRINGS") {
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
            } else if (fileType == "UNKNOWN") {
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
        title: "Load A GW2 dat",
        modal: true,
        showClose: false,
        body:
            '<div class="w2ui-centered">' +
            '<div id="fileLoadProgress" />' +
            '<input id="filePickerPop" type="file" />' +
            "</div>"
    });

    $("#filePickerPop").change(function(evt) {
        Globals._lr = T3D.getLocalReader(
            evt.target.files[0],
            onReaderCallback,
            "../static/t3dworker.js"
        );
    });
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
    sidebarNodes: sidebarNodes
};

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

function generateHexTable(rawData, gridName, callback) {
    let byteArray = new Uint8Array(rawData);
    let hexOutput = [];
    let asciiOutput = [];
    const loopChunkSize = 10000;

    const ASCII = 'abcdefghijklmnopqrstuvwxyz' + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' +
        '0123456789' + '!"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

    let grid = $().w2grid(
        { 
            name   : gridName, 
            columns: [                
                //{ field: 'fname', caption: 'First Name', size: '30%' },
                {field: 'address', caption: 'Address', size: '80px'},
                {field: 'c0', caption: '00', size: '25px'},
                {field: 'c1', caption: '01', size: '25px'},
                {field: 'c2', caption: '02', size: '25px'},
                {field: 'c3', caption: '03', size: '25px'},
                {field: 'c4', caption: '04', size: '25px'},
                {field: 'c5', caption: '05', size: '25px'},
                {field: 'c6', caption: '06', size: '25px'},
                {field: 'c7', caption: '07', size: '25px'},
                {field: 'c8', caption: '08', size: '25px'},
                {field: 'c9', caption: '09', size: '25px'},
                {field: 'c10', caption: '0A', size: '25px'},
                {field: 'c11', caption: '0B', size: '25px'},
                {field: 'c12', caption: '0C', size: '25px'},
                {field: 'c13', caption: '0D', size: '25px'},
                {field: 'c14', caption: '0E', size: '25px'},
                {field: 'c15', caption: '0F', size: '25px'},
                {field: 'ascii', caption: 'ASCII', size: '140px', style : 'font-family:monospace'},
            ],
        }
    );

    //Breakup the work into slices of 10kB for performance
    let byteArraySlice = [];
    for (let pos = 0; pos < byteArray.length; pos += loopChunkSize) {
        byteArraySlice.push(byteArray.slice(pos, pos + loopChunkSize));
    }

    let loopCount = 0;
    let records = [];
    let loopFunc = setInterval(() => {
        let byteArrayItem = byteArraySlice[loopCount];
        //If there is no more work we clear the loop and callback
        if (byteArrayItem == undefined) {
            clearInterval(loopFunc);
            grid.records = records;
            grid.refresh();
            callback(grid);
            return;
        }

        //Work with lines of 16 bytes
        for (let pos = 0; pos < byteArrayItem.length; pos += 16) {
            let workSlice = byteArrayItem.slice(pos, pos + 16);
            let asciiLine = "";
            let address = Number(pos + (loopCount * loopChunkSize)).toString(16);
            address = address.length != 8 ? '0'.repeat(8 - address.length) + address : address;
            let line = {
                address:address,
            }

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

                line['c'+i] = byteHexCode;

                let asciiCode = byte ? String.fromCharCode(byte) : " ";
                asciiCode = ASCII.includes(asciiCode) ? asciiCode : ".";
                asciiLine += asciiCode;
            }

            line.ascii = asciiLine;
            records.push(line);
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
            $(`#${this.getOutputId()}`).append('<div id="headGrid" style="height: 90%"></div>');

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
            $(`#${this.getOutputId()}`).append('<div id="hexaGrid" style="height: 90%"></div>');
            Utils.generateHexTable(rawData, this.getOutputId(), (grid) => {
                grid.render($(`#hexaGrid`));
                $(`#${this.getOutputId()}`).show();
            });
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(`#${this.getDomTabId()}`).show();
    }

    clean(){
        $().w2destroy(this.getOutputId());
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVXRpbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hlYWQuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL0hleGEuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL01vZGVsLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9QYWNrLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9Tb3VuZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvU3RyaW5nLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9UZXh0dXJlLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9WaWV3ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQy9GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNiQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hHQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN6REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdE1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25IQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxRkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbi8vIFRoaXMgZmlsZSBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFR5cmlhMkQgYXBwbGljYXRpb25cclxuXHJcbi8vLyBSZXF1aXJlczpcclxuY29uc3QgTGF5b3V0ID0gcmVxdWlyZShcIi4vTGF5b3V0XCIpO1xyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoXCIuL0dsb2JhbHNcIik7XHJcblxyXG5mdW5jdGlvbiBvblJlYWRlckNyZWF0ZWQobHIpIHtcclxuICAgIEdsb2JhbHMuX2xyID0gbHI7XHJcblxyXG4gICAgdzJwb3B1cC5sb2NrKCk7XHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArIFwiPGJyLz48YnIvPlwiKTtcclxuICAgIFQzRC5nZXRGaWxlTGlzdEFzeW5jKGxyLCBmaWxlcyA9PiB7XHJcbiAgICAgICAgLy8vIFN0b3JlIGZpbGVMaXN0IGdsb2JhbGx5XHJcbiAgICAgICAgR2xvYmFscy5fZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgTGF5b3V0LnNpZGViYXJOb2RlcygpO1xyXG5cclxuICAgICAgICAvLy8gQ2xvc2UgdGhlIHBvcFxyXG4gICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgLy8vIFNlbGVjdCB0aGUgXCJBbGxcIiBjYXRlZ29yeVxyXG4gICAgICAgIHcydWkuc2lkZWJhci5jbGljayhcIkFsbFwiKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5MYXlvdXQuaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpO1xyXG5cclxuLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuVDNELkxvZ2dlci5sb2dGdW5jdGlvbnNbVDNELkxvZ2dlci5UWVBFX1BST0dSRVNTXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGU8YnIvPlwiICsgYXJndW1lbnRzWzFdICsgXCIlPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG59O1xyXG4iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZShcIi4vR2xvYmFsc1wiKTtcclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcbiAgICAvLy8gTm8gZmlsdGVyIGlmIGNsaWNrZWQgZ3JvdXAgd2FzIFwiQWxsXCJcclxuICAgIGlmIChldnQudGFyZ2V0ID09IFwiQWxsXCIpIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVHcm91cChmaWxlVHlwZUZpbHRlcikge1xyXG4gICAgdzJ1aS5ncmlkLnJlY29yZHMgPSBbXTtcclxuICAgIHcydWkuZ3JpZC5zZWFyY2hSZXNldCgpO1xyXG5cclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG4gICAgICAgIC8vLyBPbmx5IHNob3cgdHlwZXMgd2UndmUgYXNrZWQgZm9yXHJcbiAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyICYmIGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoZmlsZVR5cGUpIDwgMCkge1xyXG4gICAgICAgICAgICAvLy8gU3BlY2lhbCBjYXNlIGZvciBcInBhY2tHcm91cFwiXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgbGV0IHRyb3VnaCBhbGwgcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIE5PVCBsZXQgdHJvdWdodCBhbnkgbm9uLXBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIGkuZS4gU3RyaW5ncywgQmluYXJpZXMgZXRjXHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwicGFja0dyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlBGXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInRleHR1cmVHcm91cFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZUFyciA9IEdsb2JhbHMuX2ZpbGVMaXN0W2ZpbGVUeXBlXTtcclxuICAgICAgICAgICAgZmlsZUFyci5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24obWZ0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IEdsb2JhbHMuX2xyLmdldEZpbGVNZXRhKG1mdEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VJZHMgPSByZXZlcnNlVGFibGVbbWZ0SW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IG1ldGEgPyBtZXRhLnNpemUgOiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVNpemUgPiAwICYmIG1mdEluZGV4ID4gMTUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYmFzZUlkIG9mIGJhc2VJZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcydWlbXCJncmlkXCJdLnJlY29yZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IHcydWlbXCJncmlkXCJdLnJlY29yZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1mdElkOiBtZnRJbmRleCwgLy8vIE1GVCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZDogYmFzZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1mdEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9IC8vLyBFbmQgZm9yIGVhY2ggbWZ0IGluIHRoaXMgZmlsZSB0eXBlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSAvLy8gRW5kIGlmIF9maWxlTGlzdFtmaWxldHlwZV1cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2tcclxufTtcclxuIiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuLy9SZWdpc3RlciB2aWV3ZXJzXG5jb25zdCBIZWFkVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hlYWQnKTtcbmNvbnN0IEhleGFWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGV4YScpO1xuY29uc3QgTW9kZWxWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvTW9kZWwnKTtcbmNvbnN0IFBhY2tWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvUGFjaycpO1xuY29uc3QgU291bmRWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvU291bmQnKTtcbmNvbnN0IFN0cmluZ1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9TdHJpbmcnKTtcbmNvbnN0IFRleHR1cmVWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvVGV4dHVyZScpO1xuXG52YXIgVmlld2VycyA9IFtcbiAgICBuZXcgSGVhZFZpZXdlcigpLFxuICAgIG5ldyBIZXhhVmlld2VyKCksXG4gICAgbmV3IE1vZGVsVmlld2VyKCksXG4gICAgbmV3IFBhY2tWaWV3ZXIoKSxcbiAgICBuZXcgU291bmRWaWV3ZXIoKSxcbiAgICBuZXcgU3RyaW5nVmlld2VyKCksXG4gICAgbmV3IFRleHR1cmVWaWV3ZXIoKVxuXTtcblxudmFyIERlZmF1bHRWaWV3ZXJJbmRleCA9IDA7XG5cbmZ1bmN0aW9uIHNldHVwVmlld2VycygpIHtcbiAgICBmb3IgKGxldCB0YWIgb2YgVmlld2Vycykge1xuICAgICAgICB0YWIuc2V0dXAoKTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlVGFiTGF5b3V0KCkge1xuICAgIGZvciAobGV0IHRhYiBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIGxldCBpc0RlZmF1bHQgPSB0YWIgPT0gVmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdO1xuICAgICAgICBsZXQgdGFiSHRtbCA9XG4gICAgICAgICAgICAkKGA8ZGl2IGNsYXNzPSdmaWxlVGFiJyBpZD0nJHt0YWIuZ2V0RG9tVGFiSWQoKX0nPlxuICAgICAgICAgICAgPGRpdiBjbGFzcz0ndGFiT3V0cHV0JyBpZD0nJHt0YWIuZ2V0T3V0cHV0SWQoKX0nPjwvZGl2PlxuICAgICAgICAgICAgPC9kaXY+YCk7XG5cbiAgICAgICAgaWYgKCFpc0RlZmF1bHQpIHtcbiAgICAgICAgICAgIHRhYkh0bWwuaGlkZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnI2ZpbGVUYWJzJykuYXBwZW5kKHRhYkh0bWwpO1xuXG4gICAgICAgIHcydWlbJ2ZpbGVUYWJzJ10uYWRkKHtcbiAgICAgICAgICAgIGlkOiB0YWIuZ2V0VzJUYWJJZCgpLFxuICAgICAgICAgICAgY2FwdGlvbjogdGFiLm5hbWUsXG4gICAgICAgICAgICBkaXNhYmxlZDogdHJ1ZSxcbiAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgICAgICAgICB0YWIucmVuZGVyKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgfVxuICAgIHcydWlbJ2ZpbGVUYWJzJ10uc2VsZWN0KFZpZXdlcnNbRGVmYXVsdFZpZXdlckluZGV4XS5nZXRXMlRhYklkKCkpO1xufVxuXG5mdW5jdGlvbiBvbkJhc2ljUmVuZGVyZXJEb25lKCkge1xuICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuICAgIC8vTm90IGltcGxlbWVudGVkIGluIFQzRCB5ZXQ6XG4gICAgLy9sZXQgZmlsZVR5cGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVR5cGVcIik7XG5cbiAgICAvL1Nob3cgdGhlIGZpbGVuYW1lXG4gICAgLy9Ub2RvOiBpbXBsZW1lbnQgZmlsZVR5cGVcbiAgICBsZXQgZmlsZU5hbWUgPSBgJHtmaWxlSWR9YFxuXG4gICAgLy9JdGVyYXRlIHRocm91Z2ggdGhlIHJlbmRlcmVycyB0byBrbm93IHdobyBjYW4gc2hvdyBhbmQgd2hvXG4gICAgbGV0IG92ZXJyaWRlO1xuICAgIGZvciAobGV0IHZpZXdlciBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIC8vY2hlY2sgaWYgY2FuIHZpZXdcbiAgICAgICAgaWYgKHZpZXdlci5jYW5WaWV3KCkpIHtcbiAgICAgICAgICAgIHcydWkuZmlsZVRhYnMuZW5hYmxlKHZpZXdlci5nZXRXMlRhYklkKCkpO1xuICAgICAgICB9XG5cbiAgICAgICAgLy9jaGVjayBpZiBjYW4gb3ZlcnJpZGVcbiAgICAgICAgbGV0IG92ZXJyaWRlQWJpbGl0eSA9IHZpZXdlci5vdmVycmlkZURlZmF1bHQoKTtcbiAgICAgICAgaWYgKG92ZXJyaWRlQWJpbGl0eSAmJiBvdmVycmlkZSA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICAgICAgICBvdmVycmlkZSA9IHZpZXdlcjtcbiAgICAgICAgfSBlbHNlIGlmIChvdmVycmlkZUFiaWxpdHkgJiYgb3ZlcnJpZGUgIT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3ZlcnJpZGUgPSBudWxsO1xuICAgICAgICB9XG5cbiAgICB9XG4gICAgLy9TZXQgYWN0aXZlIHRhYlxuICAgIGlmIChvdmVycmlkZSkge1xuICAgICAgICB3MnVpLmZpbGVUYWJzLmNsaWNrKG92ZXJyaWRlLmdldFcyVGFiSWQoKSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljayhWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF0uZ2V0VzJUYWJJZCgpKTtcbiAgICB9XG5cbiAgICAvL0VuYWJsZSBjb250ZXh0IHRvb2xiYXIgYW5kIGRvd25sb2FkIGJ1dHRvblxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIilcbiAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICQoXCI8YnV0dG9uPkRvd25sb2FkIHJhdzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgLmNsaWNrKFxuICAgICAgICAgICAgICAgIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmF3RGF0YV0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsIGZpbGVOYW1lICsgXCIuYmluXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIClcbiAgICAgICAgKTtcblxufVxuXG5mdW5jdGlvbiB2aWV3RmlsZUJ5RmlsZUlkKGZpbGVJZCkge1xuXG4gICAgLy8vIENsZWFuIG91dHB1dHNcbiAgICAkKFwiI2ZpbGVUaXRsZVwiKS5odG1sKFwiXCIpO1xuXG4gICAgLy8vIENsZWFuIGNvbnRleHQgdG9vbGJhclxuICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuaHRtbChcIlwiKTtcblxuICAgIC8vLyBEaXNhYmxlIGFuZCBjbGVhbiB0YWJzXG4gICAgZm9yIChsZXQgdmlld2VyIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5kaXNhYmxlKHZpZXdlci5nZXRXMlRhYklkKCkpO1xuICAgICAgICB2aWV3ZXIuY2xlYW4oKTtcbiAgICB9XG5cbiAgICAvLy8gTWFrZSBzdXJlIF9jb250ZXh0IGlzIGNsZWFuXG4gICAgR2xvYmFscy5fY29udGV4dCA9IHt9O1xuXG4gICAgbGV0IHJlbmRlcmVyU2V0dGluZ3MgPSB7XG4gICAgICAgIGlkOiBmaWxlSWRcbiAgICB9O1xuXG4gICAgLy8vIFJ1biB0aGUgYmFzaWMgRGF0YVJlbmRlcmVyXG4gICAgVDNELnJ1blJlbmRlcmVyKFxuICAgICAgICBUM0QuRGF0YVJlbmRlcmVyLFxuICAgICAgICBHbG9iYWxzLl9scixcbiAgICAgICAgcmVuZGVyZXJTZXR0aW5ncyxcbiAgICAgICAgR2xvYmFscy5fY29udGV4dCxcbiAgICAgICAgb25CYXNpY1JlbmRlcmVyRG9uZVxuICAgICk7XG59XG5cbmZ1bmN0aW9uIHZpZXdGaWxlQnlNRlQobWZ0SWR4KSB7XG4gICAgbGV0IHJldmVyc2VUYWJsZSA9IEdsb2JhbHMuX2xyLmdldFJldmVyc2VJbmRleCgpO1xuXG4gICAgdmFyIGJhc2VJZCA9IChyZXZlcnNlVGFibGVbbWZ0SWR4XSkgPyByZXZlcnNlVGFibGVbbWZ0SWR4XVswXSA6IFwiXCI7XG5cbiAgICB2aWV3RmlsZUJ5RmlsZUlkKGJhc2VJZCk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGdlbmVyYXRlVGFiTGF5b3V0OiBnZW5lcmF0ZVRhYkxheW91dCxcbiAgICBzZXR1cFZpZXdlcnM6IHNldHVwVmlld2VycyxcbiAgICB2aWV3RmlsZUJ5RmlsZUlkOiB2aWV3RmlsZUJ5RmlsZUlkLFxuICAgIHZpZXdGaWxlQnlNRlQ6IHZpZXdGaWxlQnlNRlRcbn0iLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG4vL1NldHRpbmcgdXAgdGhlIGdsb2JhbCB2YXJpYWJsZXMgZm9yIHRoZSBhcHBcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgLy8vIFQzRFxuICAgIF9scjogdW5kZWZpbmVkLFxuICAgIF9jb250ZXh0OiB1bmRlZmluZWQsXG4gICAgX2ZpbGVJZDogdW5kZWZpbmVkLFxuICAgIF9maWxlTGlzdDogdW5kZWZpbmVkLFxuICAgIF9hdWRpb1NvdXJjZTogdW5kZWZpbmVkLFxuICAgIF9hdWRpb0NvbnRleHQ6IHVuZGVmaW5lZCxcblxuICAgIC8vLyBUSFJFRVxuICAgIF9zY2VuZTogdW5kZWZpbmVkLFxuICAgIF9jYW1lcmE6IHVuZGVmaW5lZCxcbiAgICBfcmVuZGVyZXI6IHVuZGVmaW5lZCxcbiAgICBfbW9kZWxzOiBbXSxcbiAgICBfY29udHJvbHM6IHVuZGVmaW5lZCxcbiAgICBfb25DYW52YXNSZXNpemU6IGZ1bmN0aW9uICgpIHt9XG5cbn0iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbmNvbnN0IEZpbGVWaWV3ZXIgPSByZXF1aXJlKFwiLi9GaWxldmlld2VyXCIpO1xyXG5jb25zdCBGaWxlR3JpZCA9IHJlcXVpcmUoXCIuL0ZpbGVncmlkXCIpO1xyXG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuL1V0aWxzXCIpO1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKFwiLi9HbG9iYWxzXCIpO1xyXG5cclxuY29uc3QgSGV4YVZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlcnMvSGV4YVwiKTtcclxuXHJcbnZhciBvblJlYWRlckNhbGxiYWNrO1xyXG5cclxuLyoqXHJcbiAqIFNldHVwIG1haW4gZ3JpZFxyXG4gKi9cclxuZnVuY3Rpb24gbWFpbkdyaWQoKSB7XHJcbiAgICBjb25zdCBwc3R5bGUgPSBcImJvcmRlcjogMXB4IHNvbGlkICNkZmRmZGY7IHBhZGRpbmc6IDA7XCI7XHJcblxyXG4gICAgJChcIiNsYXlvdXRcIikudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6IFwibGF5b3V0XCIsXHJcbiAgICAgICAgcGFuZWxzOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwidG9wXCIsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAyOCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgXCIgcGFkZGluZy10b3A6IDFweDtcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxlZnRcIixcclxuICAgICAgICAgICAgICAgIHNpemU6IDU3MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUgKyBcIm1hcmdpbjowXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJtYWluXCIsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgXCIgYmFja2dyb3VuZC1jb2xvcjogdHJhbnNwYXJlbnQ7XCIsXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB7XHJcbiAgICAgICAgICAgICAgICAgICAgc3R5bGU6IFwiYmFja2dyb3VuZC1jb2xvcjojZWFlYWVhOyBoZWlnaHQ6NDBweFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IFwiaHRtbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWQ6IFwiY29udGV4dFRvb2xiYXJcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGh0bWw6XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ0b29sYmFyRW50cnlcIiBpZD1cImNvbnRleHRUb29sYmFyXCI+PC9kaXY+J1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLm93bmVyLmNvbnRlbnQoXCJtYWluXCIsIGV2ZW50KTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdLFxyXG4gICAgICAgIG9uUmVzaXplOiBHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZVxyXG4gICAgfSk7XHJcblxyXG4gICAgJChcIiNmaWxlSWRJbnB1dEJ0blwiKS5jbGljayhmdW5jdGlvbigpIHtcclxuICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlGaWxlSWQoJChcIiNmaWxlSWRJbnB1dFwiKS52YWwoKSk7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8gR3JpZCBpbnNpZGUgbWFpbiBsZWZ0XHJcbiAgICAkKCkudzJsYXlvdXQoe1xyXG4gICAgICAgIG5hbWU6IFwibGVmdExheW91dFwiLFxyXG4gICAgICAgIHBhbmVsczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImxlZnRcIixcclxuICAgICAgICAgICAgICAgIHNpemU6IDE1MCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBcImxlZnRcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm1haW5cIixcclxuICAgICAgICAgICAgICAgIHNpemU6IDQyMCxcclxuICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHN0eWxlOiBwc3R5bGUsXHJcbiAgICAgICAgICAgICAgICBjb250ZW50OiBcInJpZ2h0XCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG4gICAgdzJ1aVtcImxheW91dFwiXS5jb250ZW50KFwibGVmdFwiLCB3MnVpW1wibGVmdExheW91dFwiXSk7XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBTZXR1cCB0b29sYmFyXHJcbiAqL1xyXG5mdW5jdGlvbiB0b29sYmFyKCkge1xyXG4gICAgJCgpLncydG9vbGJhcih7XHJcbiAgICAgICAgbmFtZTogXCJ0b29sYmFyXCIsXHJcbiAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJidXR0b25cIixcclxuICAgICAgICAgICAgICAgIGlkOiBcImxvYWRGaWxlXCIsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIk9wZW4gZmlsZVwiLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJicmVha1wiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibWVudVwiLFxyXG4gICAgICAgICAgICAgICAgaWQ6IFwidmlld1wiLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCJWaWV3XCIsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJIaWRlIGZpbGUgbGlzdFwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJIaWRlIGZpbGUgY2F0ZWdvcmllc1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJIaWRlIGZpbGUgcHJldmlld1wiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYnJlYWtcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgIGlkOiBcInRvb2xzXCIsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlRvb2xzXCIsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCIsXHJcbiAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJWaWV3IGNudGMgc3VtbWFyeVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwic3BhY2VyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJidXR0b25cIixcclxuICAgICAgICAgICAgICAgIGlkOiBcIm1lbnRpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlR5cmlhMkRcIixcclxuICAgICAgICAgICAgICAgIGltZzogXCJpY29uLXBhZ2VcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImxvYWRGaWxlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkZpbGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfSk7XHJcblxyXG4gICAgdzJ1aVtcImxheW91dFwiXS5jb250ZW50KFwidG9wXCIsIHcydWlbXCJ0b29sYmFyXCJdKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIHNpZGViYXJcclxuICovXHJcbmZ1bmN0aW9uIHNpZGViYXIoKSB7XHJcbiAgICAvKlxyXG4gICAgICAgIFNJREVCQVJcclxuICAgICovXHJcbiAgICB3MnVpW1wibGVmdExheW91dFwiXS5jb250ZW50KFxyXG4gICAgICAgIFwibGVmdFwiLFxyXG4gICAgICAgICQoKS53MnNpZGViYXIoe1xyXG4gICAgICAgICAgICBuYW1lOiBcInNpZGViYXJcIixcclxuICAgICAgICAgICAgaW1nOiBudWxsLFxyXG4gICAgICAgICAgICBub2RlczogW1xyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBcIkFsbFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiQWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIG9uQ2xpY2s6IEZpbGVHcmlkLm9uRmlsdGVyQ2xpY2tcclxuICAgICAgICB9KVxyXG4gICAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGVicm93c2VyXHJcbiAqL1xyXG5mdW5jdGlvbiBmaWxlQnJvd3NlcigpIHtcclxuICAgIHcydWlbXCJsZWZ0TGF5b3V0XCJdLmNvbnRlbnQoXHJcbiAgICAgICAgXCJtYWluXCIsXHJcbiAgICAgICAgJCgpLncyZ3JpZCh7XHJcbiAgICAgICAgICAgIG5hbWU6IFwiZ3JpZFwiLFxyXG4gICAgICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhclNlYXJjaDogdHJ1ZSxcclxuICAgICAgICAgICAgICAgIHRvb2xiYXJSZWxvYWQ6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgZm9vdGVyOiB0cnVlXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJiYXNlSWRcIixcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIkJhc2UgSURcIixcclxuICAgICAgICAgICAgICAgICAgICBzaXplOiBcIjI1JVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBcImludFwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiBcIm1mdElkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJNRlQgSURcIixcclxuICAgICAgICAgICAgICAgICAgICBzaXplOiBcIjI1JVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBcImludFwiXHJcbiAgICAgICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiBcInR5cGVcIixcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlR5cGVcIixcclxuICAgICAgICAgICAgICAgICAgICBzaXplOiBcIjI1JVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHJlc2l6YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogdHJ1ZVxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJmaWxlU2l6ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiUGFjayBTaXplXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogXCIyNSVcIixcclxuICAgICAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc29ydGFibGU6IHRydWVcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgIGxldCBiYXNlSWQgPSB3MnVpW1wiZ3JpZFwiXS5yZWNvcmRzW2V2ZW50LnJlY2lkXS5iYXNlSWQ7XHJcbiAgICAgICAgICAgICAgICBGaWxlVmlld2VyLnZpZXdGaWxlQnlGaWxlSWQoYmFzZUlkKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH0pXHJcbiAgICApO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZSB2aWV3IHdpbmRvd1xyXG4gKi9cclxuZnVuY3Rpb24gZmlsZVZpZXcoKSB7XHJcbiAgICAkKHcydWlbXCJsYXlvdXRcIl0uZWwoXCJtYWluXCIpKVxyXG4gICAgICAgIC5hcHBlbmQoJChcIjxoMSBpZD0nZmlsZVRpdGxlJyAvPlwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8ZGl2IGlkPSdmaWxlVGFicycgLz5cIikpO1xyXG5cclxuICAgICQoXCIjZmlsZVRhYnNcIikudzJ0YWJzKHtcclxuICAgICAgICBuYW1lOiBcImZpbGVUYWJzXCIsXHJcbiAgICAgICAgdGFiczogW11cclxuICAgIH0pO1xyXG5cclxuICAgIEZpbGVWaWV3ZXIuZ2VuZXJhdGVUYWJMYXlvdXQoKTtcclxufVxyXG5cclxuZnVuY3Rpb24gc3RyaW5nR3JpZCgpIHtcclxuICAgIC8vLyBTZXQgdXAgZ3JpZCBmb3Igc3RyaW5ncyB2aWV3XHJcbiAgICAvLy9DcmVhdGUgZ3JpZFxyXG4gICAgJChcIiNzdHJpbmdPdXRwdXRcIikudzJncmlkKHtcclxuICAgICAgICBuYW1lOiBcInN0cmluZ0dyaWRcIixcclxuICAgICAgICBzZWxlY3RUeXBlOiBcImNlbGxcIixcclxuICAgICAgICBzaG93OiB7XHJcbiAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgIGZvb3RlcjogdHJ1ZVxyXG4gICAgICAgIH0sXHJcbiAgICAgICAgY29sdW1uczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICBmaWVsZDogXCJyZWNpZFwiLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCJSb3cgI1wiLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogXCI2MHB4XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6IFwidmFsdWVcIixcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IFwiVGV4dFwiLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogXCIxMDAlXCJcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIF1cclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgd2hlbiB3ZSBoYXZlIGEgbGlzdCBvZiB0aGUgZmlsZXMgdG8gb3JnYW5pemUgdGhlIGNhdGVnb3JpZXMuXHJcbiAqL1xyXG5mdW5jdGlvbiBzaWRlYmFyTm9kZXMoKSB7XHJcbiAgICAvL0NsZWFyIHNpZGViYXIgaWYgYWxyZWFkeSBzZXQgdXBcclxuICAgIGZvciAobGV0IGVsZW1lbnQgb2YgdzJ1aVtcInNpZGViYXJcIl0ubm9kZXMpIHtcclxuICAgICAgICBpZiAoZWxlbWVudC5pZCAhPSBcIkFsbFwiKSB7XHJcbiAgICAgICAgICAgIHcydWlbXCJzaWRlYmFyXCJdLm5vZGVzLnNwbGljZShcclxuICAgICAgICAgICAgICAgIHcydWlbXCJzaWRlYmFyXCJdLm5vZGVzLmluZGV4T2YoZWxlbWVudC5pZCksXHJcbiAgICAgICAgICAgICAgICAxXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG4gICAgdzJ1aVtcInNpZGViYXJcIl0ucmVmcmVzaCgpO1xyXG5cclxuICAgIC8vUmVnZW5lcmF0ZVxyXG5cclxuICAgIGxldCBwYWNrTm9kZSA9IHtcclxuICAgICAgICBpZDogXCJwYWNrR3JvdXBcIixcclxuICAgICAgICB0ZXh0OiBcIlBhY2sgRmlsZXNcIixcclxuICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIGxldCB0ZXh0dXJlTm9kZSA9IHtcclxuICAgICAgICBpZDogXCJ0ZXh0dXJlR3JvdXBcIixcclxuICAgICAgICB0ZXh0OiBcIlRleHR1cmUgZmlsZXNcIixcclxuICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIGxldCB1bnNvcnRlZE5vZGUgPSB7XHJcbiAgICAgICAgaWQ6IFwidW5zb3J0ZWRHcm91cFwiLFxyXG4gICAgICAgIHRleHQ6IFwiVW5zb3J0ZWRcIixcclxuICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgbm9kZXM6IFtdXHJcbiAgICB9O1xyXG5cclxuICAgIC8vLyBCdWlsZCBzaWRlYmFyIG5vZGVzXHJcbiAgICBmb3IgKGxldCBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG4gICAgICAgIGlmIChHbG9iYWxzLl9maWxlTGlzdC5oYXNPd25Qcm9wZXJ0eShmaWxlVHlwZSkpIHtcclxuICAgICAgICAgICAgbGV0IG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZVxyXG4gICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICBsZXQgaXNQYWNrID0gZmFsc2U7XHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiVEVYVFVSRVwiKSkge1xyXG4gICAgICAgICAgICAgICAgbm9kZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZVR5cGUsXHJcbiAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgICAgIHRleHQ6IGZpbGVUeXBlXHJcbiAgICAgICAgICAgICAgICB9O1xyXG4gICAgICAgICAgICAgICAgdGV4dHVyZU5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZSA9PSBcIkJJTkFSSUVTXCIpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiQmluYXJpZXNcIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gXCJTVFJJTkdTXCIpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiU3RyaW5nc1wiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIGlmIChmaWxlVHlwZS5zdGFydHNXaXRoKFwiUEZcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHBhY2tOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gXCJVTktOT1dOXCIpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUudGV4dCA9IFwiVW5rbm93blwiO1xyXG4gICAgICAgICAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChub2RlKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHVuc29ydGVkTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGlmIChwYWNrTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZChwYWNrTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHRleHR1cmVOb2RlLm5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHRleHR1cmVOb2RlKTtcclxuICAgIH1cclxuXHJcbiAgICBpZiAodW5zb3J0ZWROb2RlLm5vZGVzLmxlbmd0aCA+IDApIHtcclxuICAgICAgICB3MnVpLnNpZGViYXIuYWRkKHVuc29ydGVkTm9kZSk7XHJcbiAgICB9XHJcbn1cclxuXHJcbmZ1bmN0aW9uIG9wZW5GaWxlUG9wdXAoKSB7XHJcbiAgICAvLy8gQXNrIGZvciBmaWxlXHJcbiAgICB3MnBvcHVwLm9wZW4oe1xyXG4gICAgICAgIHNwZWVkOiAwLFxyXG4gICAgICAgIHRpdGxlOiBcIkxvYWQgQSBHVzIgZGF0XCIsXHJcbiAgICAgICAgbW9kYWw6IHRydWUsXHJcbiAgICAgICAgc2hvd0Nsb3NlOiBmYWxzZSxcclxuICAgICAgICBib2R5OlxyXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cIncydWktY2VudGVyZWRcIj4nICtcclxuICAgICAgICAgICAgJzxkaXYgaWQ9XCJmaWxlTG9hZFByb2dyZXNzXCIgLz4nICtcclxuICAgICAgICAgICAgJzxpbnB1dCBpZD1cImZpbGVQaWNrZXJQb3BcIiB0eXBlPVwiZmlsZVwiIC8+JyArXHJcbiAgICAgICAgICAgIFwiPC9kaXY+XCJcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCIjZmlsZVBpY2tlclBvcFwiKS5jaGFuZ2UoZnVuY3Rpb24oZXZ0KSB7XHJcbiAgICAgICAgR2xvYmFscy5fbHIgPSBUM0QuZ2V0TG9jYWxSZWFkZXIoXHJcbiAgICAgICAgICAgIGV2dC50YXJnZXQuZmlsZXNbMF0sXHJcbiAgICAgICAgICAgIG9uUmVhZGVyQ2FsbGJhY2ssXHJcbiAgICAgICAgICAgIFwiLi4vc3RhdGljL3QzZHdvcmtlci5qc1wiXHJcbiAgICAgICAgKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG4vKipcclxuICogVGhpcyBmdW5jdGlvbiBpcyBjYWxsZWQgYnkgdGhlIG1haW4gYXBwIHRvIGNyZWF0ZSB0aGUgZ3VpIGxheW91dC5cclxuICovXHJcbmZ1bmN0aW9uIGluaXRMYXlvdXQob25SZWFkZXJDcmVhdGVkKSB7XHJcbiAgICBvblJlYWRlckNhbGxiYWNrID0gb25SZWFkZXJDcmVhdGVkO1xyXG5cclxuICAgIG1haW5HcmlkKCk7XHJcbiAgICB0b29sYmFyKCk7XHJcbiAgICBzaWRlYmFyKCk7XHJcbiAgICBmaWxlQnJvd3NlcigpO1xyXG4gICAgZmlsZVZpZXcoKTtcclxuICAgIHN0cmluZ0dyaWQoKTtcclxuXHJcbiAgICAvL1NldHVwIHZpZXdlcnNcclxuICAgIEZpbGVWaWV3ZXIuc2V0dXBWaWV3ZXJzKCk7XHJcblxyXG4gICAgLypcclxuICAgICAgICBTRVQgVVAgVFJFRSAzRCBTQ0VORVxyXG4gICAgKi9cclxuICAgIC8vIFV0aWxzLnNldHVwU2NlbmUoKTtcclxuXHJcbiAgICBvcGVuRmlsZVBvcHVwKCk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgaW5pdExheW91dDogaW5pdExheW91dCxcclxuICAgIHNpZGViYXJOb2Rlczogc2lkZWJhck5vZGVzXHJcbn07XHJcbiIsIi8qXHJcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xyXG5cclxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcclxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcclxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcclxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2ZcclxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxyXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxyXG5cclxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcclxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxyXG4qL1xyXG5cclxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcclxuXHJcbi8vLyBFeHBvcnRzIGN1cnJlbnQgbW9kZWwgYXMgYW4gLm9iaiBmaWxlIHdpdGggYSAubXRsIHJlZmVyaW5nIC5wbmcgdGV4dHVyZXMuXHJcbmZ1bmN0aW9uIGV4cG9ydFNjZW5lKCkge1xyXG5cclxuICAgIC8vLyBHZXQgbGFzdCBsb2FkZWQgZmlsZUlkXHRcdFxyXG4gICAgdmFyIGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZDtcclxuXHJcbiAgICAvLy8gUnVuIFQzRCBoYWNrZWQgdmVyc2lvbiBvZiBPQkpFeHBvcnRlclxyXG4gICAgdmFyIHJlc3VsdCA9IG5ldyBUSFJFRS5PQkpFeHBvcnRlcigpLnBhcnNlKEdsb2JhbHMuX3NjZW5lLCBmaWxlSWQpO1xyXG5cclxuICAgIC8vLyBSZXN1bHQgbGlzdHMgd2hhdCBmaWxlIGlkcyBhcmUgdXNlZCBmb3IgdGV4dHVyZXMuXHJcbiAgICB2YXIgdGV4SWRzID0gcmVzdWx0LnRleHR1cmVJZHM7XHJcblxyXG4gICAgLy8vIFNldCB1cCB2ZXJ5IGJhc2ljIG1hdGVyaWFsIGZpbGUgcmVmZXJpbmcgdGhlIHRleHR1cmUgcG5nc1xyXG4gICAgLy8vIHBuZ3MgYXJlIGdlbmVyYXRlZCBhIGZldyBsaW5lcyBkb3duLlxyXG4gICAgdmFyIG10bFNvdXJjZSA9IFwiXCI7XHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuICAgICAgICBtdGxTb3VyY2UgKz0gXCJuZXdtdGwgdGV4X1wiICsgdGV4SWQgKyBcIlxcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LYSB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblwiICtcclxuICAgICAgICAgICAgXCIgIG1hcF9LZCB0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1xcblxcblwiO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG9ialxyXG4gICAgdmFyIGJsb2IgPSBuZXcgQmxvYihbcmVzdWx0Lm9ial0sIHtcclxuICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXHJcbiAgICB9KTtcclxuICAgIHNhdmVEYXRhKGJsb2IsIFwiZXhwb3J0LlwiICsgZmlsZUlkICsgXCIub2JqXCIpO1xyXG5cclxuICAgIC8vLyBEb3dubG9hZCBtdGxcclxuICAgIGJsb2IgPSBuZXcgQmxvYihbbXRsU291cmNlXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5tdGxcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIHRleHR1cmUgcG5nc1xyXG4gICAgdGV4SWRzLmZvckVhY2goZnVuY3Rpb24gKHRleElkKSB7XHJcblxyXG4gICAgICAgIC8vLyBMb2NhbFJlYWRlciB3aWxsIGhhdmUgdG8gcmUtbG9hZCB0aGUgdGV4dHVyZXMsIGRvbid0IHdhbnQgdG8gZmV0Y2hcclxuICAgICAgICAvLy8gdGhlbiBmcm9tIHRoZSBtb2RlbCBkYXRhLi5cclxuICAgICAgICBHbG9iYWxzLl9sci5sb2FkVGV4dHVyZUZpbGUodGV4SWQsXHJcbiAgICAgICAgICAgIGZ1bmN0aW9uIChpbmZsYXRlZERhdGEsIGR4dFR5cGUsIGltYWdlV2lkdGgsIGltYWdlSGVpZ3RoKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBqcyBpbWFnZSB1c2luZyByZXR1cm5lZCBiaXRtYXAgZGF0YS5cclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZSA9IHtcclxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBuZXcgVWludDhBcnJheShpbmZsYXRlZERhdGEpLFxyXG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBpbWFnZVdpZHRoLFxyXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogaW1hZ2VIZWlndGhcclxuICAgICAgICAgICAgICAgIH07XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIE5lZWQgYSBjYW52YXMgaW4gb3JkZXIgdG8gZHJhd1xyXG4gICAgICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzIC8+XCIpO1xyXG4gICAgICAgICAgICAgICAgJChcImJvZHlcIikuYXBwZW5kKGNhbnZhcyk7XHJcblxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLndpZHRoID0gaW1hZ2Uud2lkdGg7XHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0uaGVpZ2h0ID0gaW1hZ2UuaGVpZ2h0O1xyXG5cclxuICAgICAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBEcmF3IHJhdyBiaXRtYXAgdG8gY2FudmFzXHJcbiAgICAgICAgICAgICAgICB2YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcclxuICAgICAgICAgICAgICAgIHZhciBpbWFnZWRhdGEgPSBuZXcgSW1hZ2VEYXRhKHVpY2EsIGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBUaGlzIGlzIHdoZXJlIHNoaXQgZ2V0cyBzdHVwaWQuIEZsaXBwaW5nIHJhdyBiaXRtYXBzIGluIGpzXHJcbiAgICAgICAgICAgICAgICAvLy8gaXMgYXBwYXJlbnRseSBhIHBhaW4uIEJhc2ljbHkgcmVhZCBjdXJyZW50IHN0YXRlIHBpeGVsIGJ5IHBpeGVsXHJcbiAgICAgICAgICAgICAgICAvLy8gYW5kIHdyaXRlIGl0IGJhY2sgd2l0aCBmbGlwcGVkIHktYXhpcyBcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGN0eC5nZXRJbWFnZURhdGEoMCwgMCwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBvdXRwdXQgaW1hZ2UgZGF0YSBidWZmZXJcclxuICAgICAgICAgICAgICAgIHZhciBvdXRwdXQgPSBjdHguY3JlYXRlSW1hZ2VEYXRhKGltYWdlLndpZHRoLCBpbWFnZS5oZWlnaHQpO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBHZXQgaW1hZ2VkYXRhIHNpemVcclxuICAgICAgICAgICAgICAgIHZhciB3ID0gaW5wdXQud2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaCA9IGlucHV0LmhlaWdodDtcclxuICAgICAgICAgICAgICAgIHZhciBpbnB1dERhdGEgPSBpbnB1dC5kYXRhO1xyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dERhdGEgPSBvdXRwdXQuZGF0YVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBMb29wIHBpeGVsc1xyXG4gICAgICAgICAgICAgICAgZm9yICh2YXIgeSA9IDE7IHkgPCBoIC0gMTsgeSArPSAxKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgeCA9IDE7IHggPCB3IC0gMTsgeCArPSAxKSB7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gSW5wdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGkgPSAoeSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gT3V0cHV0IGxpbmVhciBjb29yZGluYXRlXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmbGlwID0gKChoIC0geSkgKiB3ICsgeCkgKiA0O1xyXG5cclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFJlYWQgYW5kIHdyaXRlIFJHQkFcclxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFRPRE86IFBlcmhhcHMgcHV0IGFscGhhIHRvIDEwMCVcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yICh2YXIgYyA9IDA7IGMgPCA0OyBjICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dERhdGFbaSArIGNdID0gaW5wdXREYXRhW2ZsaXAgKyBjXTtcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gV3JpdGUgYmFjayBmbGlwcGVkIGRhdGFcclxuICAgICAgICAgICAgICAgIGN0eC5wdXRJbWFnZURhdGEob3V0cHV0LCAwLCAwKTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gRmV0Y2ggY2FudmFzIGRhdGEgYXMgcG5nIGFuZCBkb3dubG9hZC5cclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS50b0Jsb2IoXHJcbiAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb24gKHBuZ0Jsb2IpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgc2F2ZURhdGEocG5nQmxvYiwgXCJ0ZXhfXCIgKyB0ZXhJZCArIFwiLnBuZ1wiKTtcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBSZW1vdmUgY2FudmFzIGZyb20gRE9NXHJcbiAgICAgICAgICAgICAgICBjYW52YXMucmVtb3ZlKCk7XHJcblxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgKTtcclxuXHJcblxyXG4gICAgfSk7XHJcblxyXG59XHJcblxyXG5cclxuXHJcbi8vLyBVdGlsaXR5IGZvciBkb3dubG9hZGluZyBmaWxlcyB0byBjbGllbnRcclxudmFyIHNhdmVEYXRhID0gKGZ1bmN0aW9uICgpIHtcclxuICAgIHZhciBhID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcImFcIik7XHJcbiAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGEpO1xyXG4gICAgYS5zdHlsZSA9IFwiZGlzcGxheTogbm9uZVwiO1xyXG4gICAgcmV0dXJuIGZ1bmN0aW9uIChibG9iLCBmaWxlTmFtZSkge1xyXG4gICAgICAgIHZhciB1cmwgPSB3aW5kb3cuVVJMLmNyZWF0ZU9iamVjdFVSTChibG9iKTtcclxuICAgICAgICBhLmhyZWYgPSB1cmw7XHJcbiAgICAgICAgYS5kb3dubG9hZCA9IGZpbGVOYW1lO1xyXG4gICAgICAgIGEuY2xpY2soKTtcclxuICAgICAgICB3aW5kb3cuVVJMLnJldm9rZU9iamVjdFVSTCh1cmwpO1xyXG4gICAgfTtcclxufSgpKTtcclxuXHJcbmZ1bmN0aW9uIGdlbmVyYXRlSGV4VGFibGUocmF3RGF0YSwgZ3JpZE5hbWUsIGNhbGxiYWNrKSB7XHJcbiAgICBsZXQgYnl0ZUFycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmF3RGF0YSk7XHJcbiAgICBsZXQgaGV4T3V0cHV0ID0gW107XHJcbiAgICBsZXQgYXNjaWlPdXRwdXQgPSBbXTtcclxuICAgIGNvbnN0IGxvb3BDaHVua1NpemUgPSAxMDAwMDtcclxuXHJcbiAgICBjb25zdCBBU0NJSSA9ICdhYmNkZWZnaGlqa2xtbm9wcXJzdHV2d3h5eicgKyAnQUJDREVGR0hJSktMTU5PUFFSU1RVVldYWVonICtcclxuICAgICAgICAnMDEyMzQ1Njc4OScgKyAnIVwiIyQlJlxcJygpKissLS4vOjs8PT4/QFtcXFxcXV5fYHt8fX4nO1xyXG5cclxuICAgIGxldCBncmlkID0gJCgpLncyZ3JpZChcclxuICAgICAgICB7IFxyXG4gICAgICAgICAgICBuYW1lICAgOiBncmlkTmFtZSwgXHJcbiAgICAgICAgICAgIGNvbHVtbnM6IFsgICAgICAgICAgICAgICAgXHJcbiAgICAgICAgICAgICAgICAvL3sgZmllbGQ6ICdmbmFtZScsIGNhcHRpb246ICdGaXJzdCBOYW1lJywgc2l6ZTogJzMwJScgfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2FkZHJlc3MnLCBjYXB0aW9uOiAnQWRkcmVzcycsIHNpemU6ICc4MHB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMCcsIGNhcHRpb246ICcwMCcsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMScsIGNhcHRpb246ICcwMScsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMicsIGNhcHRpb246ICcwMicsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMycsIGNhcHRpb246ICcwMycsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjNCcsIGNhcHRpb246ICcwNCcsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjNScsIGNhcHRpb246ICcwNScsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjNicsIGNhcHRpb246ICcwNicsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjNycsIGNhcHRpb246ICcwNycsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjOCcsIGNhcHRpb246ICcwOCcsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjOScsIGNhcHRpb246ICcwOScsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMTAnLCBjYXB0aW9uOiAnMEEnLCBzaXplOiAnMjVweCd9LFxyXG4gICAgICAgICAgICAgICAge2ZpZWxkOiAnYzExJywgY2FwdGlvbjogJzBCJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MxMicsIGNhcHRpb246ICcwQycsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMTMnLCBjYXB0aW9uOiAnMEQnLCBzaXplOiAnMjVweCd9LFxyXG4gICAgICAgICAgICAgICAge2ZpZWxkOiAnYzE0JywgY2FwdGlvbjogJzBFJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MxNScsIGNhcHRpb246ICcwRicsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdhc2NpaScsIGNhcHRpb246ICdBU0NJSScsIHNpemU6ICcxNDBweCcsIHN0eWxlIDogJ2ZvbnQtZmFtaWx5Om1vbm9zcGFjZSd9LFxyXG4gICAgICAgICAgICBdLFxyXG4gICAgICAgIH1cclxuICAgICk7XHJcblxyXG4gICAgLy9CcmVha3VwIHRoZSB3b3JrIGludG8gc2xpY2VzIG9mIDEwa0IgZm9yIHBlcmZvcm1hbmNlXHJcbiAgICBsZXQgYnl0ZUFycmF5U2xpY2UgPSBbXTtcclxuICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGJ5dGVBcnJheS5sZW5ndGg7IHBvcyArPSBsb29wQ2h1bmtTaXplKSB7XHJcbiAgICAgICAgYnl0ZUFycmF5U2xpY2UucHVzaChieXRlQXJyYXkuc2xpY2UocG9zLCBwb3MgKyBsb29wQ2h1bmtTaXplKSk7XHJcbiAgICB9XHJcblxyXG4gICAgbGV0IGxvb3BDb3VudCA9IDA7XHJcbiAgICBsZXQgcmVjb3JkcyA9IFtdO1xyXG4gICAgbGV0IGxvb3BGdW5jID0gc2V0SW50ZXJ2YWwoKCkgPT4ge1xyXG4gICAgICAgIGxldCBieXRlQXJyYXlJdGVtID0gYnl0ZUFycmF5U2xpY2VbbG9vcENvdW50XTtcclxuICAgICAgICAvL0lmIHRoZXJlIGlzIG5vIG1vcmUgd29yayB3ZSBjbGVhciB0aGUgbG9vcCBhbmQgY2FsbGJhY2tcclxuICAgICAgICBpZiAoYnl0ZUFycmF5SXRlbSA9PSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChsb29wRnVuYyk7XHJcbiAgICAgICAgICAgIGdyaWQucmVjb3JkcyA9IHJlY29yZHM7XHJcbiAgICAgICAgICAgIGdyaWQucmVmcmVzaCgpO1xyXG4gICAgICAgICAgICBjYWxsYmFjayhncmlkKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9Xb3JrIHdpdGggbGluZXMgb2YgMTYgYnl0ZXNcclxuICAgICAgICBmb3IgKGxldCBwb3MgPSAwOyBwb3MgPCBieXRlQXJyYXlJdGVtLmxlbmd0aDsgcG9zICs9IDE2KSB7XHJcbiAgICAgICAgICAgIGxldCB3b3JrU2xpY2UgPSBieXRlQXJyYXlJdGVtLnNsaWNlKHBvcywgcG9zICsgMTYpO1xyXG4gICAgICAgICAgICBsZXQgYXNjaWlMaW5lID0gXCJcIjtcclxuICAgICAgICAgICAgbGV0IGFkZHJlc3MgPSBOdW1iZXIocG9zICsgKGxvb3BDb3VudCAqIGxvb3BDaHVua1NpemUpKS50b1N0cmluZygxNik7XHJcbiAgICAgICAgICAgIGFkZHJlc3MgPSBhZGRyZXNzLmxlbmd0aCAhPSA4ID8gJzAnLnJlcGVhdCg4IC0gYWRkcmVzcy5sZW5ndGgpICsgYWRkcmVzcyA6IGFkZHJlc3M7XHJcbiAgICAgICAgICAgIGxldCBsaW5lID0ge1xyXG4gICAgICAgICAgICAgICAgYWRkcmVzczphZGRyZXNzLFxyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAvL0l0ZXJhdGUgdGhyb3VnaCBlYWNoIGJ5dGUgb2YgdGhlIDE2Ynl0ZXMgbGluZVxyXG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IDE2OyBpKyspIHtcclxuICAgICAgICAgICAgICAgIGxldCBieXRlID0gd29ya1NsaWNlW2ldO1xyXG4gICAgICAgICAgICAgICAgbGV0IGJ5dGVIZXhDb2RlO1xyXG4gICAgICAgICAgICAgICAgaWYgKGJ5dGUgIT0gdW5kZWZpbmVkKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBieXRlLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gYnl0ZUhleENvZGUubGVuZ3RoID09IDEgPyBcIjBcIiArIGJ5dGVIZXhDb2RlIDogYnl0ZUhleENvZGU7XHJcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICAgICAgICAgIGJ5dGVIZXhDb2RlID0gXCIgIFwiO1xyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIGxpbmVbJ2MnK2ldID0gYnl0ZUhleENvZGU7XHJcblxyXG4gICAgICAgICAgICAgICAgbGV0IGFzY2lpQ29kZSA9IGJ5dGUgPyBTdHJpbmcuZnJvbUNoYXJDb2RlKGJ5dGUpIDogXCIgXCI7XHJcbiAgICAgICAgICAgICAgICBhc2NpaUNvZGUgPSBBU0NJSS5pbmNsdWRlcyhhc2NpaUNvZGUpID8gYXNjaWlDb2RlIDogXCIuXCI7XHJcbiAgICAgICAgICAgICAgICBhc2NpaUxpbmUgKz0gYXNjaWlDb2RlO1xyXG4gICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICBsaW5lLmFzY2lpID0gYXNjaWlMaW5lO1xyXG4gICAgICAgICAgICByZWNvcmRzLnB1c2gobGluZSk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBsb29wQ291bnQgKz0gMTtcclxuICAgIH0sIDEpO1xyXG59XHJcblxyXG4vL1RoaXMgc3BlY2lhbCBmb3JFYWNoIGhhdmUgYW4gYWRkaXRpb25hbCBwYXJhbWV0ZXIgdG8gYWRkIGEgc2V0VGltZW91dCgxKSBiZXR3ZWVuIGVhY2ggXCJjaHVua1NpemVcIiBpdGVtc1xyXG5mdW5jdGlvbiBhc3luY0ZvckVhY2goYXJyYXksIGNodW5rU2l6ZSwgZm4pIHtcclxuICAgIGxldCB3b3JrQXJyYXkgPSBbXTtcclxuICAgIC8vU2xpY2UgdXAgdGhlIGFycmF5IGludG8gd29yayBhcnJheSBmb3Igc3luY2hyb25vdXMgY2FsbFxyXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhcnJheS5zaXplOyBpICs9IGNodW5rU2l6ZSkge1xyXG4gICAgICAgIHdvcmtBcnJheS5wdXNoKGFycmF5LnNsaWNlKGksIGkgKyBjaHVua1NpemUpKTtcclxuICAgIH1cclxuXHJcbiAgICAvL0xvb3Bjb3VudCBpcyB0aGUgYW1vdW50IG9mIHRpbWVzIGNodW5rU2l6ZSBoYXZlIGJlZW4gcmVhY2hlZFxyXG4gICAgbGV0IGxvb3Bjb3VudCA9IDA7XHJcbiAgICBsZXQgaW50ZXJ2YWwgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgLy9JdGVyYXRlIHRocm91Z2ggdGhlIGNodW5rXHJcbiAgICAgICAgZm9yIChsZXQgaW5kZXggaW4gd29ya0FycmF5KSB7XHJcbiAgICAgICAgICAgIGxldCBpdGVtID0gd29ya0FycmF5W2luZGV4XTtcclxuICAgICAgICAgICAgbGV0IGluZGV4ID0gaW5kZXggKyAobG9vcGNvdW50ICogY2h1bmtTaXplKTtcclxuICAgICAgICAgICAgZm4oaXRlbSwgaW5kZXgpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgLy9DaGVjayBpZiB0aGVyZSBpcyBtb3JlIHdvcmsgb3Igbm90XHJcbiAgICAgICAgbG9vcGNvdW50ICs9IDE7XHJcbiAgICAgICAgaWYgKGxvb3Bjb3VudCA9PSB3b3JrQXJyYXkubGVuZ3RoKSB7XHJcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoaW50ZXJ2YWwpO1xyXG4gICAgICAgIH1cclxuICAgIH0sIDEpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGV4cG9ydFNjZW5lOiBleHBvcnRTY2VuZSxcclxuICAgIHNhdmVEYXRhOiBzYXZlRGF0YSxcclxuICAgIGdlbmVyYXRlSGV4VGFibGU6IGdlbmVyYXRlSGV4VGFibGVcclxufSIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZWFkVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZWFkVmlld1wiLCBcIk92ZXJ2aWV3XCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgc2V0dXAoKSB7XG4gICAgICAgICQoJyNoZWFkR3JpZCcpLncyZ3JpZCh7XG4gICAgICAgICAgICBuYW1lOiAnT3ZlcnZpZXcnLFxuICAgICAgICAgICAgY29sdW1uczogW3tcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICd0eXBlJyxcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogJ1R5cGUnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnNTAlJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3ZhbHVlJyxcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogJ1ZhbHVlJyxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogJzUwJSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHJlY29yZHM6IFtdXG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCByYXcgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcblxuICAgICAgICAgICAgdmFyIGRzID0gbmV3IERhdGFTdHJlYW0ocmF3KTtcbiAgICAgICAgICAgIHZhciBmaXJzdDQgPSBkcy5yZWFkQ1N0cmluZyg0KTtcblxuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuYXBwZW5kKCc8ZGl2IGlkPVwiaGVhZEdyaWRcIiBzdHlsZT1cImhlaWdodDogOTAlXCI+PC9kaXY+Jyk7XG5cbiAgICAgICAgICAgIHcydWlbJ092ZXJ2aWV3J10ucmVjb3JkcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIHJlY2lkOiAxLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnRmlsZSBJRCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWxlSWRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IDIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGaWxlIHNpemUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmF3LmJ5dGVMZW5ndGhcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IDMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGaWxlIHR5cGUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmlyc3Q0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHcydWlbJ092ZXJ2aWV3J10ucmVmcmVzaCgpO1xuXG4gICAgICAgICAgICB3MnVpWydPdmVydmlldyddLnJlbmRlcigkKCcjaGVhZEdyaWQnKVswXSk7XG5cbiAgICAgICAgICAgIC8vVE9ETzpcbiAgICAgICAgICAgIC8vTUZUIGluZGV4XG4gICAgICAgICAgICAvL0Jhc2VJZFxuICAgICAgICAgICAgLy9GaWxlVHlwZVxuICAgICAgICAgICAgLy9Db21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vVW5jb21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIC8vSGVhZHZpZXdlciBjYW4gdmlldyBldmVyeSBmaWxlXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG4gICAgICAgIHcydWlbJ092ZXJ2aWV3J10uZGVsZXRlKCk7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhlYWRWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIEhleGFWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcImhleFZpZXdcIiwgXCJIZXggVmlld1wiKTtcbiAgICAgICAgLy9zdXBlcihcIiNmaWxlVGFic0hleFZpZXdcIiwgXCIjaGV4Vmlld1wiLCBcInRhYkhleFZpZXdcIiwgXCJIZXggVmlld1wiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHJhd0RhdGEgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwicmF3RGF0YVwiKTtcbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gKS5hcHBlbmQoJzxkaXYgaWQ9XCJoZXhhR3JpZFwiIHN0eWxlPVwiaGVpZ2h0OiA5MCVcIj48L2Rpdj4nKTtcbiAgICAgICAgICAgIFV0aWxzLmdlbmVyYXRlSGV4VGFibGUocmF3RGF0YSwgdGhpcy5nZXRPdXRwdXRJZCgpLCAoZ3JpZCkgPT4ge1xuICAgICAgICAgICAgICAgIGdyaWQucmVuZGVyKCQoYCNoZXhhR3JpZGApKTtcbiAgICAgICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuc2hvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKGAjJHt0aGlzLmdldERvbVRhYklkKCl9YCkuc2hvdygpO1xuICAgIH1cblxuICAgIGNsZWFuKCl7XG4gICAgICAgICQoKS53MmRlc3Ryb3kodGhpcy5nZXRPdXRwdXRJZCgpKTtcbiAgICB9XG5cbiAgICAvL0hleGEgdmlld2VyIGNhbiB2aWV3IGV2ZXJ5IGZpbGVcbiAgICBjYW5WaWV3KCkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gSGV4YVZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgTW9kZWxWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcIm1vZGVsXCIsIFwiTW9kZWxcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cbiAgICAgICAgICAgIC8vLyBSdW4gc2luZ2xlIHJlbmRlcmVyXG4gICAgICAgICAgICBUM0QucnVuUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgVDNELlNpbmdsZU1vZGVsUmVuZGVyZXIsXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fbHIsIHtcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVJZFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgR2xvYmFscy5fY29udGV4dCxcbiAgICAgICAgICAgICAgICAoKSA9PiB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub25SZW5kZXJlckRvbmVNb2RlbCgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICk7XG5cbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5zaG93KCk7XG4gICAgfVxuXG4gICAgY2xlYW4oKSB7XG4gICAgICAgIC8vLyBSZW1vdmUgb2xkIG1vZGVscyBmcm9tIHRoZSBzY2VuZVxuICAgICAgICBpZiAoR2xvYmFscy5fbW9kZWxzKSB7XG4gICAgICAgICAgICBmb3IgKGxldCBtZGwgb2YgR2xvYmFscy5fbW9kZWxzKSB7XG4gICAgICAgICAgICAgICAgR2xvYmFscy5fc2NlbmUucmVtb3ZlKG1kbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlICYmIHBhY2tmaWxlLmhlYWRlci50eXBlID09ICdNT0RMJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhblZpZXcoKTtcbiAgICB9XG5cbiAgICBvblJlbmRlcmVyRG9uZU1vZGVsKCkge1xuXG4gICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWQoKX1gKS5zaG93KCk7XG5cbiAgICAgICAgLy8vIFJlLWZpdCBjYW52YXNcbiAgICAgICAgR2xvYmFscy5fb25DYW52YXNSZXNpemUoKTtcblxuICAgICAgICAvLy8gQWRkIGNvbnRleHQgdG9vbGJhciBleHBvcnQgYnV0dG9uXG4gICAgICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuYXBwZW5kKFxuICAgICAgICAgICAgJChcIjxidXR0b24+RXhwb3J0IHNjZW5lPC9idXR0b24+XCIpXG4gICAgICAgICAgICAuY2xpY2soVXRpbHMuZXhwb3J0U2NlbmUpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8vIFJlYWQgdGhlIG5ldyBtb2RlbHNcbiAgICAgICAgR2xvYmFscy5fbW9kZWxzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlciwgXCJtZXNoZXNcIiwgW10pO1xuXG4gICAgICAgIC8vLyBLZWVwaW5nIHRyYWNrIG9mIHRoZSBiaWdnZXN0IG1vZGVsIGZvciBsYXRlclxuICAgICAgICB2YXIgYmlnZ2VzdE1kbCA9IG51bGw7XG5cbiAgICAgICAgLy8vIEFkZCBhbGwgbW9kZWxzIHRvIHRoZSBzY2VuZVxuICAgICAgICBmb3IgKGxldCBtb2RlbCBvZiBHbG9iYWxzLl9tb2RlbHMpIHtcblxuICAgICAgICAgICAgLy8vIEZpbmQgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGNhbWVyYSBmb2N1cy9maXR0aW5nXG4gICAgICAgICAgICBpZiAoIWJpZ2dlc3RNZGwgfHwgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgPCBtb2RlbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBiaWdnZXN0TWRsID0gbW9kZWw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChtb2RlbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLy8gUmVzZXQgYW55IHpvb20gYW5kIHRyYW5zYWx0aW9uL3JvdGF0aW9uIGRvbmUgd2hlbiB2aWV3aW5nIGVhcmxpZXIgbW9kZWxzLlxuICAgICAgICBHbG9iYWxzLl9jb250cm9scy5yZXNldCgpO1xuXG4gICAgICAgIC8vLyBGb2N1cyBjYW1lcmEgdG8gdGhlIGJpZ2VzdCBtb2RlbCwgZG9lc24ndCB3b3JrIGdyZWF0LlxuICAgICAgICB2YXIgZGlzdCA9IChiaWdnZXN0TWRsICYmIGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUpID8gYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgLyBNYXRoLnRhbihNYXRoLlBJICogNjAgLyAzNjApIDogMTAwO1xuICAgICAgICBkaXN0ID0gMS4yICogTWF0aC5tYXgoMTAwLCBkaXN0KTtcbiAgICAgICAgZGlzdCA9IE1hdGgubWluKDEwMDAsIGRpc3QpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24uem9vbSA9IDE7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi54ID0gZGlzdCAqIE1hdGguc3FydCgyKTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnogPSAwO1xuXG5cbiAgICAgICAgaWYgKGJpZ2dlc3RNZGwpXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEubG9va0F0KGJpZ2dlc3RNZGwucG9zaXRpb24pO1xuICAgIH1cblxuXG4gICAgc2V0dXAoKSB7XG4gICAgICAgIC8vLyBTZXR0aW5nIHVwIGEgc2NlbmUsIFRyZWUuanMgc3RhbmRhcmQgc3R1ZmYuLi5cbiAgICAgICAgdmFyIGNhbnZhc1dpZHRoID0gJChcIiNcIiArIHRoaXMuZ2V0T3V0cHV0SWQoKSkud2lkdGgoKTtcbiAgICAgICAgdmFyIGNhbnZhc0hlaWdodCA9ICQoXCIjXCIgKyB0aGlzLmdldE91dHB1dElkKCkpLmhlaWdodCgpO1xuICAgICAgICB2YXIgY2FudmFzQ2xlYXJDb2xvciA9IDB4MzQyOTIwOyAvLyBGb3IgaGFwcHkgcmVuZGVyaW5nLCBhbHdheXMgdXNlIFZhbiBEeWtlIEJyb3duLlxuICAgICAgICB2YXIgZm92ID0gNjA7XG4gICAgICAgIHZhciBhc3BlY3QgPSAxO1xuICAgICAgICB2YXIgbmVhciA9IDAuMTtcbiAgICAgICAgdmFyIGZhciA9IDUwMDAwMDtcblxuICAgICAgICBHbG9iYWxzLl9vbkNhbnZhc1Jlc2l6ZSA9ICgpID0+IHtcblxuICAgICAgICAgICAgdmFyIHNjZW5lV2lkdGggPSAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKS53aWR0aCgpO1xuICAgICAgICAgICAgdmFyIHNjZW5lSGVpZ2h0ID0gJChcIiNcIiArIHRoaXMuZ2V0T3V0cHV0SWQoKSkuaGVpZ2h0KCk7XG5cbiAgICAgICAgICAgIGlmICghc2NlbmVIZWlnaHQgfHwgIXNjZW5lV2lkdGgpXG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEuYXNwZWN0ID0gc2NlbmVXaWR0aCAvIHNjZW5lSGVpZ2h0O1xuXG4gICAgICAgICAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRTaXplKHNjZW5lV2lkdGgsIHNjZW5lSGVpZ2h0KTtcblxuICAgICAgICAgICAgR2xvYmFscy5fY2FtZXJhLnVwZGF0ZVByb2plY3Rpb25NYXRyaXgoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYSA9IG5ldyBUSFJFRS5QZXJzcGVjdGl2ZUNhbWVyYShmb3YsIGFzcGVjdCwgbmVhciwgZmFyKTtcbiAgICAgICAgR2xvYmFscy5fc2NlbmUgPSBuZXcgVEhSRUUuU2NlbmUoKTtcblxuICAgICAgICAvLy8gVGhpcyBzY2VuZSBoYXMgb25lIGFtYmllbnQgbGlnaHQgc291cmNlIGFuZCB0aHJlZSBkaXJlY3Rpb25hbCBsaWdodHNcbiAgICAgICAgdmFyIGFtYmllbnRMaWdodCA9IG5ldyBUSFJFRS5BbWJpZW50TGlnaHQoMHg1NTU1NTUpO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQoYW1iaWVudExpZ2h0KTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDEgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xuICAgICAgICBkaXJlY3Rpb25hbExpZ2h0MS5wb3NpdGlvbi5zZXQoMCwgMCwgMSk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0MSk7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQyID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodDIucG9zaXRpb24uc2V0KDEsIDAsIDApO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodDIpO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MyA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAuOCk7XG4gICAgICAgIGRpcmVjdGlvbmFsTGlnaHQzLnBvc2l0aW9uLnNldCgwLCAxLCAwKTtcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQzKTtcblxuICAgICAgICAvLy8gU3RhbmRhcmQgVEhSRUUgcmVuZGVyZXIgd2l0aCBBQVxuICAgICAgICBHbG9iYWxzLl9yZW5kZXJlciA9IG5ldyBUSFJFRS5XZWJHTFJlbmRlcmVyKHtcbiAgICAgICAgICAgIGFudGlhbGlhc2luZzogdHJ1ZVxuICAgICAgICB9KTtcblxuICAgICAgICAkKFwiI1wiICsgdGhpcy5nZXRPdXRwdXRJZCgpKVswXS5hcHBlbmRDaGlsZChHbG9iYWxzLl9yZW5kZXJlci5kb21FbGVtZW50KTtcblxuICAgICAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRTaXplKGNhbnZhc1dpZHRoLCBjYW52YXNIZWlnaHQpO1xuICAgICAgICBHbG9iYWxzLl9yZW5kZXJlci5zZXRDbGVhckNvbG9yKGNhbnZhc0NsZWFyQ29sb3IpO1xuXG4gICAgICAgIC8vLyBBZGQgVEhSRUUgb3JiaXQgY29udHJvbHMsIGZvciBzaW1wbGUgb3JiaXRpbmcsIHBhbm5pbmcgYW5kIHpvb21pbmdcbiAgICAgICAgR2xvYmFscy5fY29udHJvbHMgPSBuZXcgVEhSRUUuT3JiaXRDb250cm9scyhHbG9iYWxzLl9jYW1lcmEsIEdsb2JhbHMuX3JlbmRlcmVyLmRvbUVsZW1lbnQpO1xuICAgICAgICBHbG9iYWxzLl9jb250cm9scy5lbmFibGVab29tID0gdHJ1ZTtcblxuICAgICAgICAvLy8gU2VtcyB3MnVpIGRlbGF5cyByZXNpemluZyA6L1xuICAgICAgICAkKHdpbmRvdykucmVzaXplKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoR2xvYmFscy5fb25DYW52YXNSZXNpemUsIDEwKVxuICAgICAgICB9KTtcblxuICAgICAgICAvLy8gTm90ZTogY29uc3RhbnQgY29udGlub3VzIHJlbmRlcmluZyBmcm9tIHBhZ2UgbG9hZCBldmVudCwgbm90IHZlcnkgb3B0LlxuICAgICAgICByZW5kZXIoKTtcbiAgICB9XG59XG5cbi8vLyBSZW5kZXIgbG9vcCwgbm8gZ2FtZSBsb2dpYywganVzdCByZW5kZXJpbmcuXG5mdW5jdGlvbiByZW5kZXIoKSB7XG4gICAgd2luZG93LnJlcXVlc3RBbmltYXRpb25GcmFtZShyZW5kZXIpO1xuICAgIEdsb2JhbHMuX3JlbmRlcmVyLnJlbmRlcihHbG9iYWxzLl9zY2VuZSwgR2xvYmFscy5fY2FtZXJhKTtcbn1cblxubW9kdWxlLmV4cG9ydHMgPSBNb2RlbFZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgUGFja1ZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwicGFja1wiLCBcIlBhY2sgZmlsZVwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcblxuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLmh0bWwoXCJcIik7XG4gICAgICAgICAgICAkKGAjJHt0aGlzLmdldE91dHB1dElkKCl9YCkuYXBwZW5kKCQoXCI8aDI+XCIgKyB0aGlzLm5hbWUgKyBcIjwvaDI+XCIpKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY2h1bmsgb2YgcGFja2ZpbGUuY2h1bmtzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkID0gJChcIjxmaWVsZHNldCAvPlwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVnZW5kID0gJChcIjxsZWdlbmQ+XCIgKyBjaHVuay5oZWFkZXIudHlwZSArIFwiPC9sZWdlbmQ+XCIpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGxvZ0J1dHRvbiA9ICQoXCI8YnV0dG9uPkxvZyBDaHVuayBEYXRhIHRvIENvbnNvbGU8L2J1dHRvbj5cIik7XG4gICAgICAgICAgICAgICAgbG9nQnV0dG9uLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIFwiTG9nZ2luZ1wiLCBjaHVuay5oZWFkZXIudHlwZSwgXCJjaHVua1wiKTtcbiAgICAgICAgICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIGNodW5rLmRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKGxlZ2VuZCk7XG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKCQoXCI8cD5TaXplOlwiICsgY2h1bmsuaGVhZGVyLmNodW5rRGF0YVNpemUgKyBcIjwvcD5cIikpO1xuICAgICAgICAgICAgICAgIGZpZWxkLmFwcGVuZChsb2dCdXR0b24pO1xuXG4gICAgICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLmFwcGVuZChmaWVsZCk7XG4gICAgICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZCgpfWApLnNob3coKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHBhY2sgdGhlbiByZXR1cm4gdHJ1ZVxuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWNrVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBTb3VuZFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwic291bmRcIiwgXCJTb3VuZFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgICAgICBsZXQgY2h1bmsgPSBwYWNrZmlsZS5nZXRDaHVuayhcIkFTTkRcIik7XG5cbiAgICAgICAgICAgIC8vLyBQcmludCBzb21lIHJhbmRvbSBkYXRhIGFib3V0IHRoaXMgc291bmRcbiAgICAgICAgICAgICQoYCMke3RoaXMuZ2V0T3V0cHV0SWR9YClcbiAgICAgICAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgICAgICAgICAgXCJMZW5ndGg6IFwiICsgY2h1bmsuZGF0YS5sZW5ndGggKyBcIiBzZWNvbmRzPGJyLz5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiU2l6ZTogXCIgKyBjaHVuay5kYXRhLmF1ZGlvRGF0YS5sZW5ndGggKyBcIiBieXRlc1wiXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8vIEV4dHJhY3Qgc291bmQgZGF0YVxuICAgICAgICAgICAgdmFyIHNvdW5kVWludEFycmF5ID0gY2h1bmsuZGF0YS5hdWRpb0RhdGE7XG5cbiAgICAgICAgICAgICQoXCIjY29udGV4dFRvb2xiYXJcIilcbiAgICAgICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+RG93bmxvYWQgTVAzPC9idXR0b24+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtzb3VuZFVpbnRBcnJheV0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsIGZpbGVOYW1lICsgXCIubXAzXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5QbGF5IE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUdsb2JhbHMuX2F1ZGlvQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFN0b3AgcHJldmlvdXMgc291bmRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBuZXcgYnVmZmVyIGZvciBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZSA9IEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLmNvbm5lY3QoR2xvYmFscy5fYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIERlY29kZSBhbmQgc3RhcnQgcGxheWluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShzb3VuZFVpbnRBcnJheS5idWZmZXIsIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5idWZmZXIgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5TdG9wIE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUgJiYgcGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ0FTTkQnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBTb3VuZFZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgU3RyaW5nVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJzdHJpbmdcIiwgXCJTdHJpbmdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cbiAgICAgICAgICAgIC8vLyBSdW4gc2luZ2xlIHJlbmRlcmVyXG4gICAgICAgICAgICBUM0QucnVuUmVuZGVyZXIoXG4gICAgICAgICAgICAgICAgVDNELlN0cmluZ1JlbmRlcmVyLFxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2xyLCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlSWRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUmVuZGVyZXJEb25lU3RyaW5nKClcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG5cbiAgICAgICAgICAgIC8vUmVnaXN0ZXIgaXRcbiAgICAgICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gZmlsZUlkO1xuICAgICAgICB9XG5cbiAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICQoYCMke3RoaXMuZ2V0RG9tVGFiSWQoKX1gKS5zaG93KCk7XG4gICAgfVxuXG5cbiAgICBjbGVhbigpIHtcblxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIC8vaWYgc3RyaW5nIGZpbGUgdGhlbiByZXR1cm4gdHJ1ZVxuICAgICAgICBsZXQgcmF3RGF0YSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJyYXdEYXRhXCIpO1xuICAgICAgICBsZXQgZmNjID0gU3RyaW5nLmZyb21DaGFyQ29kZShyYXdEYXRhWzBdLCByYXdEYXRhWzFdLCByYXdEYXRhWzJdLCByYXdEYXRhWzNdKTtcbiAgICAgICAgaWYgKGZjYyA9PT0gJ3N0cnMnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cblxuICAgIG9uUmVuZGVyZXJEb25lU3RyaW5nKCkge1xuXG4gICAgICAgIC8vLyBSZWFkIGRhdGEgZnJvbSByZW5kZXJlclxuICAgICAgICBsZXQgc3RyaW5ncyA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELlN0cmluZ1JlbmRlcmVyLCBcInN0cmluZ3NcIiwgW10pO1xuXG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzID0gc3RyaW5ncztcblxuICAgICAgICB3MnVpLnN0cmluZ0dyaWQuYnVmZmVyZWQgPSB3MnVpLnN0cmluZ0dyaWQucmVjb3Jkcy5sZW5ndGg7XG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC50b3RhbCA9IHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZDtcbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnJlZnJlc2goKTtcbiAgICB9XG59XG5cblxubW9kdWxlLmV4cG9ydHMgPSBTdHJpbmdWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIFRleHR1cmVWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInRleHR1cmVcIiwgXCJUZXh0dXJlXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuXG5cbiAgICAgICAgICAgIC8vLyBEaXNwbGF5IGJpdG1hcCBvbiBjYW52YXNcbiAgICAgICAgICAgIHZhciBjYW52YXMgPSAkKFwiPGNhbnZhcz5cIik7XG4gICAgICAgICAgICBjYW52YXNbMF0ud2lkdGggPSBpbWFnZS53aWR0aDtcbiAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XG4gICAgICAgICAgICB2YXIgY3R4ID0gY2FudmFzWzBdLmdldENvbnRleHQoXCIyZFwiKTtcblxuICAgICAgICAgICAgLy9UT0RPOiB1c2UgbmV3IHRleHR1cmUgcmVuZGVyZXJcblxuICAgICAgICAgICAgLy92YXIgdWljYSA9IG5ldyBVaW50OENsYW1wZWRBcnJheShpbWFnZS5kYXRhKTtcbiAgICAgICAgICAgIC8vdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XG4gICAgICAgICAgICAvL2N0eC5wdXRJbWFnZURhdGEoaW1hZ2VkYXRhLCAwLCAwKTtcblxuICAgICAgICAgICAgJChgIyR7dGhpcy5nZXRPdXRwdXRJZH1gKS5hcHBlbmQoY2FudmFzKTtcblxuICAgICAgICAgICAgLy9SZWdpc3RlciBpdFxuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJChgIyR7dGhpcy5nZXREb21UYWJJZCgpfWApLnNob3coKTtcbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHRleHR1cmUgZmlsZSB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIC8vVE9ETyB1c2UgdHlwZXMgZnJvbSBEYXRhUmVuZGVyZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0dXJlVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8qKlxuICogVGhpcyBpcyBhbiBhYnN0cmFjdCBjbGFzcywgdXNlIG90aGVyIGNsYXNzIHRvIGRlZmluZSBiZWhhdmlvci5cbiAqIERlY2xhcmluZyBhIFZpZXdlciBjbGFzcyBpcyBub3QgZW5vdWdoLCBkb24ndCBmb3JnZXQgdG8gcmVnaXN0ZXIgaXQgaW4gdGhlIEZpbGVWaWV3ZXIgbW9kdWxlXG4gKi9cblxuY2xhc3MgVmlld2VyIHtcbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIHRoZSB0YWIgaGVyZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGlkLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICBnZXRXMlRhYklkKCkge1xuICAgICAgICByZXR1cm4gYHRhYiR7dGhpcy5pZH1gO1xuICAgIH1cblxuICAgIGdldE91dHB1dElkKCkge1xuICAgICAgICByZXR1cm4gYCR7dGhpcy5pZH1PdXRwdXRgO1xuICAgIH1cblxuICAgIGdldERvbVRhYklkKCkge1xuICAgICAgICByZXR1cm4gYGZpbGVUYWIke3RoaXMuaWR9YDtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBGYWN1bHRhdGl2ZSBtZXRob2QgdGhhdCBhbGxvd3Mgc29tZSByZW5kZXJlcnMgdG8gc2V0dXAgc3R1ZmYgb24gc3RhcnR1cFxuICAgICAqL1xuICAgIHNldHVwKCkge1xuXG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogUmVuZGVyIHRoZSBjb250ZW50IG9mIHRoZSB0YWIgd2hlbiBjYWxsZWRcbiAgICAgKiBJdCBpcyB0aGUgcmVzcG9uc2FiaWxpdHkgb2YgdGhlIHZpZXdlciB0byBjYWNoZSBpdCdzIGhlYXZ5IHRhc2tzXG4gICAgICogQHJldHVybnMge251bGx9XG4gICAgICovXG4gICAgcmVuZGVyKCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkcyB0byBiZSBpbXBsZW1lbnRlZCBieSBjaGlsZHJlbiBjbGFzc1wiKTtcbiAgICB9XG5cbiAgICAvKipcbiAgICAgKiBVc2VkIHRvIGNsZWFuIG1lbW9yeSBhcyBzb29uIGFzIGFub3RoZXIgZmlsZSBpcyBsb2FkZWRcbiAgICAgKi9cbiAgICBjbGVhbigpIHtcbiAgICAgICAgJCh0aGlzLmdldE91dHB1dElkKCkpLmh0bWwoXCJcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogV2lsbCBkZXRlcm1pbmUgaWYgdGhlIHRhYiBjYW4gYmUgYWN0aXZlIG9yIG5vdFxuICAgICAqIEByZXR1cm5zIHtib29sZWFufVxuICAgICAqL1xuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5lZWRzIHRvIGJlIGltcGxlbWVudGVkIGJ5IGNoaWxkcmVuIGNsYXNzXCIpO1xuICAgIH1cblxuICAgIC8vSWYgc2V0IHRvIHRydWUsIHRoZSBmaWxlIHdpbGwgYmUgb3BlbmVkIGRpcmVjdGx5IG9uIHRoaXMgdmlld1xuICAgIC8vSWYgbXVsdGlwbGUgdmlld2VycyByZXR1cm5zIHRydWUgZm9yIHRoZSBzYW1lIGZpbGUsIGl0IGNvbWVzIGJhY2sgdG8gZGVmYXVsdC5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gVmlld2VyOyJdfQ==
