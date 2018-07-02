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
const CntcViewer = require('./Viewers/Cntc');

var Viewers = [
    new HeadViewer(),
    new HexaViewer(),
    new ModelViewer(),
    new PackViewer(),
    new SoundViewer(),
    new StringViewer(),
    new TextureViewer(),
    new CntcViewer()
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
},{"./Globals":4,"./Utils":7,"./Viewers/Cntc":8,"./Viewers/Head":9,"./Viewers/Hexa":10,"./Viewers/Model":11,"./Viewers/Pack":12,"./Viewers/Sound":13,"./Viewers/String":14,"./Viewers/Texture":15}],4:[function(require,module,exports){
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
const Tools = require("./Tools");

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
                        id: 'viewCntcSummary',
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
                case "tools:viewCntcSummary":
                    Tools.cntcSummary();
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
            multiSearch: false,
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

},{"./Filegrid":2,"./Fileviewer":3,"./Globals":4,"./Tools":6,"./Utils":7,"./Viewers/Hexa":10}],6:[function(require,module,exports){
const Globals = require('./Globals');

async function cntcSummary() {
    $().w2grid({
        name: 'cntcSummaryGrid',
        columns: [
            {field: 'typeId', caption: 'cntc type ID', size: '33%', sortable: true },
            {field: 'amount', caption: 'entries amount', size: '33%', sortable: true},
            {field: 'files', caption: 'files', size: '33%', sortable: false},
        ]
    });
    w2popup.open({
        title: 'Summary of cntc types.',
        body: '<div id="summaryGrid" style="height: 100%">Loading...</div>',
        modal     : true,
        showClose : true,
        showMax   : true,
        onClose: () => {
            $().w2destroy('cntcSummaryGrid');
        },
        onMax     : function (event) { setTimeout(function(){
            w2ui.cntcSummaryGrid.render('#summaryGrid'); }, 500) },
        onMin     : function (event) { setTimeout(function(){
            w2ui.cntcSummaryGrid.render('#summaryGrid'); }, 500) },
    });
    
    let res = await Globals._lr.readFileList();

    //Get the cntc files
    let cntcFiles = res.filter((i) => {
        return (i.fileType == "PF_cntc" && i.baseIdList[0] < 1000000);
    });

    let cntcTypes = [];

    for (let elt of cntcFiles) {
        let r = await Globals._lr.readFile(elt.mftId);
        let file = new T3D.GW2File(new DataStream(r.buffer), 0);
        let mainChunk = file.getChunk('Main').data;

        for (let entry of mainChunk.indexEntries) {
            let summary = cntcTypes.filter( t => {return t.typeId == entry.type}).length > 0 ?
            cntcTypes.filter( t => {return t.typeId == entry.type})[0] : cntcTypes[cntcTypes.push({typeId: entry.type, amount:0, files: []})-1];
            summary.amount += 1;
            if(!summary.files.includes(elt.baseIdList[0])){
                summary.files.push(elt.baseIdList[0]);
            }
        }
    }

    w2ui.cntcSummaryGrid.records = cntcTypes;
    w2ui.cntcSummaryGrid.render('#summaryGrid');
    w2ui.cntcSummaryGrid.refresh();

}

module.exports = {
    cntcSummary: cntcSummary
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
},{"./Globals":4}],8:[function(require,module,exports){
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

class CntcViewer extends Viewer {
    constructor() {
        super("cntcView", "Content");
        this.currentRenderId = null;
    }

    setup() {
        $(this.getOutputId(true)).height('70%').w2layout({
            name: 'cntcLayout',
            panels: [{
                type: 'main', size: '50%', resizable: true 
            }, {
                type: 'preview', size: '50%', resizable: true
            }]
        });
        w2ui.cntcLayout.content('main', $().w2grid({
            name: 'contentList',
            show: {
                toolbar: true,
                toolbarSearch: true,
                toolbarReload: false,
                toolbarColumns: false,
            },
            multiSearch: false,
            columns: [{
                    field: 'recid',
                    caption: 'Entry index',
                    size: '10%',
                    searchable: "int"
                },{
                    field: 'type',
                    caption: 'Type',
                    size: '10%',
                    searchable: "int"
                },{
                    field: 'size',
                    caption: 'Entry size',
                    size: '10%'
                },{
                    field: 'namespaceIndex',
                    caption: 'Namespace',
                    size: '10%'
                },{
                    field: 'rootIndex',
                    caption: 'Root index',
                    size: '10%'
                },{
                    field: 'guid',
                    caption: 'GUID',
                    size: '10%'
                },{
                    field: 'uid',
                    caption: 'UID',
                    size: '10%'
                },
            ],
            records: [],
            onClick: function(event){
                $().w2destroy('cntcEntryChunk');
                let record = w2ui.contentList.records[event.recid];
                console.log(record);
                Utils.generateHexTable(record.contentSlice, 'cntcEntryChunk', function(){
                    w2ui.cntcLayout.content('preview', w2ui.cntcEntryChunk);
                });
            }
        }))
    }

    render() {
        let fileId = Globals._fileId = T3D.getContextValue(Globals._context, T3D.DataRenderer, "fileId");
        w2ui.contentList.searchReset();
        //First check if we've already renderer it
        if (this.currentRenderId != fileId) {
            let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
            let mainChunk = packfile.chunks[0].data;
            let entryArray = [];

            $().w2destroy('cntcEntryChunk');

            const entriesAmount = mainChunk.indexEntries.length;
            for (let i = 0; i < entriesAmount; i++) {
                let begin = mainChunk.indexEntries[i].offset;
                let end = mainChunk.indexEntries[i + 1] ?
                    mainChunk.indexEntries[i + 1].offset : mainChunk.content.length;
                let contentSlice = mainChunk.content.slice(begin, end);
                let entry = {
                    type: mainChunk.indexEntries[i].type,
                    rootIndex: mainChunk.indexEntries[i].rootIndex,
                    namespaceIndex: mainChunk.indexEntries[i].namespaceIndex,
                    contentSlice: contentSlice,
                    size: contentSlice.length,
                    recid: entryArray.length,
                    guid: contentSlice.length > 15 ? parseGuid(contentSlice) : undefined
                }
                entryArray.push(entry);
            }
            w2ui.contentList.records = entryArray;
            w2ui.contentList.refresh();
            w2ui.cntcLayout.show('main');
        }

        $('.fileTab').hide();
        $(this.getDomTabId(true)).show();
    }

    canView() {
        let packfile = T3D.getContextValue(Globals._context, T3D.DataRenderer, "file");
        if (packfile && packfile.header.type == 'cntc') {
            return true;
        } else {
            return false;
        }
    }

    clean() {
    }
}

function parseGuid(uarr){
    function hexnum(num){
        return num.toString(16).length == 2 ? num.toString(16).toUpperCase() : '0' + num.toString(16).toUpperCase();
    }
    return '' + hexnum(uarr[3]) + hexnum(uarr[2]) + hexnum(uarr[1]) + hexnum(uarr[0])
        + '-' + hexnum(uarr[5]) + hexnum(uarr[4])
        + '-' + hexnum(uarr[7]) + hexnum(uarr[6])
        + '-' + hexnum(uarr[8]) + hexnum(uarr[9])
        + '-' + hexnum(uarr[10]) + hexnum(uarr[11]) + hexnum(uarr[12]) + hexnum(uarr[13]) + hexnum(uarr[14])  + hexnum(uarr[15]) 
}

module.exports = CntcViewer;
},{"../Globals":4,"../Utils":7,"./Viewer":16}],9:[function(require,module,exports){
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

            $(this.getOutputId(true)).html("");
            $(this.getOutputId(true)).append('<div id="headGrid" style="height: 90%"></div>');

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
        $(this.getDomTabId(true)).show();
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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],10:[function(require,module,exports){
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
            $(this.getOutputId(true)).append('<div id="hexaGrid" style="height: 90%"></div>');
            Utils.generateHexTable(rawData, this.getOutputId(), (grid) => {
                grid.render($(`#hexaGrid`));
                $(this.getOutputId(true)).show();
            });
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(this.getDomTabId(true)).show();
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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],11:[function(require,module,exports){
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
        $(this.getDomTabId(true)).show();
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

        $(this.getOutputId(true)).show();

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
        var canvasWidth = $(this.getOutputId(true)).width();
        var canvasHeight = $(this.getOutputId(true)).height();
        var canvasClearColor = 0x342920; // For happy rendering, always use Van Dyke Brown.
        var fov = 60;
        var aspect = 1;
        var near = 0.1;
        var far = 500000;

        Globals._onCanvasResize = () => {

            var sceneWidth = $(this.getOutputId(true)).width();
            var sceneHeight = $(this.getOutputId(true)).height();

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

        $(this.getOutputId(true))[0].appendChild(Globals._renderer.domElement);

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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],12:[function(require,module,exports){
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

            $(this.getOutputId(true)).html("");
            $(this.getOutputId(true)).append($("<h2>" + this.name + "</h2>"));

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

                $(this.getOutputId(true)).append(field);
                $(this.getOutputId(true)).show();
            }

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(this.getDomTabId(true)).show();
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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],13:[function(require,module,exports){
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
            $(this.getOutputId(true))
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
        $(this.getDomTabId(true)).show();
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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],14:[function(require,module,exports){
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
        $(this.getDomTabId(true)).show();
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
},{"../Globals":4,"../Utils":7,"./Viewer":16}],15:[function(require,module,exports){
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

            $(this.getOutputId(true)).append(canvas);

            //Register it
            this.currentRenderId = fileId;
        }

        $('.fileTab').hide();
        $(this.getDomTabId(true)).show();
    }

    canView() {
        //if texture file then return true
        //TODO use types from DataRenderer
        return false;
    }
}

module.exports = TextureViewer;
},{"../Globals":4,"../Utils":7,"./Viewer":16}],16:[function(require,module,exports){
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

    getOutputId(withSign) {
        if(withSign){
            return `#${this.id}Output`;
        } else {
            return `${this.id}Output`;
        }
    }

    getDomTabId(withSign) {
        if(withSign){
            return `#fileTab${this.id}`;
        } else {
            return `fileTab${this.id}`;
        }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9BcHAuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9GaWxlZ3JpZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL0ZpbGV2aWV3ZXIuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9HbG9iYWxzLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvTGF5b3V0LmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVG9vbHMuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9VdGlscy5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvQ250Yy5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvSGVhZC5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvSGV4YS5qcyIsImV4YW1wbGVzL1R5cmlhMkQvc3JjL1ZpZXdlcnMvTW9kZWwuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL1BhY2suanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL1NvdW5kLmpzIiwiZXhhbXBsZXMvVHlyaWEyRC9zcmMvVmlld2Vycy9TdHJpbmcuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL1RleHR1cmUuanMiLCJleGFtcGxlcy9UeXJpYTJEL3NyYy9WaWV3ZXJzL1ZpZXdlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3REQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDL0ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDNUtBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0Q0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pjQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNqUkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3hKQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeEdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0TUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDM0VBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbkhBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbigpe2Z1bmN0aW9uIHIoZSxuLHQpe2Z1bmN0aW9uIG8oaSxmKXtpZighbltpXSl7aWYoIWVbaV0pe3ZhciBjPVwiZnVuY3Rpb25cIj09dHlwZW9mIHJlcXVpcmUmJnJlcXVpcmU7aWYoIWYmJmMpcmV0dXJuIGMoaSwhMCk7aWYodSlyZXR1cm4gdShpLCEwKTt2YXIgYT1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK2krXCInXCIpO3Rocm93IGEuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixhfXZhciBwPW5baV09e2V4cG9ydHM6e319O2VbaV1bMF0uY2FsbChwLmV4cG9ydHMsZnVuY3Rpb24ocil7dmFyIG49ZVtpXVsxXVtyXTtyZXR1cm4gbyhufHxyKX0scCxwLmV4cG9ydHMscixlLG4sdCl9cmV0dXJuIG5baV0uZXhwb3J0c31mb3IodmFyIHU9XCJmdW5jdGlvblwiPT10eXBlb2YgcmVxdWlyZSYmcmVxdWlyZSxpPTA7aTx0Lmxlbmd0aDtpKyspbyh0W2ldKTtyZXR1cm4gb31yZXR1cm4gcn0pKCkiLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbi8vIFRoaXMgZmlsZSBpcyB0aGUgbWFpbiBlbnRyeSBwb2ludCBmb3IgdGhlIFR5cmlhMkQgYXBwbGljYXRpb25cclxuXHJcbi8vLyBSZXF1aXJlczpcclxuY29uc3QgTGF5b3V0ID0gcmVxdWlyZShcIi4vTGF5b3V0XCIpO1xyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoXCIuL0dsb2JhbHNcIik7XHJcblxyXG5mdW5jdGlvbiBvblJlYWRlckNyZWF0ZWQobHIpIHtcclxuICAgIEdsb2JhbHMuX2xyID0gbHI7XHJcblxyXG4gICAgdzJwb3B1cC5sb2NrKCk7XHJcblxyXG4gICAgJChcIiNmaWxlUGlja2VyUG9wXCIpLnByb3AoXCJkaXNhYmxlZFwiLCB0cnVlKTtcclxuICAgICQoXCIjZmlsZUxvYWRQcm9ncmVzc1wiKS5odG1sKFwiSW5kZXhpbmcgLmRhdCBmaWxlPGJyLz5cIiArIFwiPGJyLz48YnIvPlwiKTtcclxuICAgIFQzRC5nZXRGaWxlTGlzdEFzeW5jKGxyLCBmaWxlcyA9PiB7XHJcbiAgICAgICAgLy8vIFN0b3JlIGZpbGVMaXN0IGdsb2JhbGx5XHJcbiAgICAgICAgR2xvYmFscy5fZmlsZUxpc3QgPSBmaWxlcztcclxuXHJcbiAgICAgICAgTGF5b3V0LnNpZGViYXJOb2RlcygpO1xyXG5cclxuICAgICAgICAvLy8gQ2xvc2UgdGhlIHBvcFxyXG4gICAgICAgIHcycG9wdXAuY2xvc2UoKTtcclxuXHJcbiAgICAgICAgLy8vIFNlbGVjdCB0aGUgXCJBbGxcIiBjYXRlZ29yeVxyXG4gICAgICAgIHcydWkuc2lkZWJhci5jbGljayhcIkFsbFwiKTtcclxuICAgIH0pO1xyXG59XHJcblxyXG5MYXlvdXQuaW5pdExheW91dChvblJlYWRlckNyZWF0ZWQpO1xyXG5cclxuLy8vIE92ZXJ3cml0ZSBwcm9ncmVzcyBsb2dnZXJcclxuVDNELkxvZ2dlci5sb2dGdW5jdGlvbnNbVDNELkxvZ2dlci5UWVBFX1BST0dSRVNTXSA9IGZ1bmN0aW9uKCkge1xyXG4gICAgJChcIiNmaWxlTG9hZFByb2dyZXNzXCIpLmh0bWwoXHJcbiAgICAgICAgXCJJbmRleGluZyAuZGF0IGZpbGU8YnIvPlwiICsgYXJndW1lbnRzWzFdICsgXCIlPGJyLz48YnIvPlwiXHJcbiAgICApO1xyXG59O1xyXG4iLCIvKlxyXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcclxuXHJcblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XHJcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XHJcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXHJcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXHJcblxyXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXHJcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXHJcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcclxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cclxuXHJcbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXHJcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cclxuKi9cclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZShcIi4vR2xvYmFsc1wiKTtcclxuXHJcbmZ1bmN0aW9uIG9uRmlsdGVyQ2xpY2soZXZ0KSB7XHJcbiAgICAvLy8gTm8gZmlsdGVyIGlmIGNsaWNrZWQgZ3JvdXAgd2FzIFwiQWxsXCJcclxuICAgIGlmIChldnQudGFyZ2V0ID09IFwiQWxsXCIpIHtcclxuICAgICAgICBzaG93RmlsZUdyb3VwKCk7XHJcbiAgICB9XHJcblxyXG4gICAgLy8vIE90aGVyIGV2ZW50cyBhcmUgZmluZSB0byBqdXN0IHBhc3NcclxuICAgIGVsc2Uge1xyXG4gICAgICAgIHNob3dGaWxlR3JvdXAoW2V2dC50YXJnZXRdKTtcclxuICAgIH1cclxufVxyXG5cclxuZnVuY3Rpb24gc2hvd0ZpbGVHcm91cChmaWxlVHlwZUZpbHRlcikge1xyXG4gICAgdzJ1aS5ncmlkLnJlY29yZHMgPSBbXTtcclxuICAgIHcydWkuZ3JpZC5zZWFyY2hSZXNldCgpO1xyXG5cclxuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcclxuXHJcbiAgICBmb3IgKHZhciBmaWxlVHlwZSBpbiBHbG9iYWxzLl9maWxlTGlzdCkge1xyXG4gICAgICAgIC8vLyBPbmx5IHNob3cgdHlwZXMgd2UndmUgYXNrZWQgZm9yXHJcbiAgICAgICAgaWYgKGZpbGVUeXBlRmlsdGVyICYmIGZpbGVUeXBlRmlsdGVyLmluZGV4T2YoZmlsZVR5cGUpIDwgMCkge1xyXG4gICAgICAgICAgICAvLy8gU3BlY2lhbCBjYXNlIGZvciBcInBhY2tHcm91cFwiXHJcbiAgICAgICAgICAgIC8vLyBTaG91bGQgbGV0IHRyb3VnaCBhbGwgcGFjayB0eXBlc1xyXG4gICAgICAgICAgICAvLy8gU2hvdWxkIE5PVCBsZXQgdHJvdWdodCBhbnkgbm9uLXBhY2sgdHlwZXNcclxuICAgICAgICAgICAgLy8vIGkuZS4gU3RyaW5ncywgQmluYXJpZXMgZXRjXHJcbiAgICAgICAgICAgIGlmIChmaWxlVHlwZUZpbHRlci5pbmRleE9mKFwicGFja0dyb3VwXCIpID49IDApIHtcclxuICAgICAgICAgICAgICAgIGlmICghZmlsZVR5cGUuc3RhcnRzV2l0aChcIlBGXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGVGaWx0ZXIuaW5kZXhPZihcInRleHR1cmVHcm91cFwiKSA+PSAwKSB7XHJcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGVUeXBlLnN0YXJ0c1dpdGgoXCJURVhUVVJFXCIpKSB7XHJcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBjb250aW51ZTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKEdsb2JhbHMuX2ZpbGVMaXN0Lmhhc093blByb3BlcnR5KGZpbGVUeXBlKSkge1xyXG4gICAgICAgICAgICB2YXIgZmlsZUFyciA9IEdsb2JhbHMuX2ZpbGVMaXN0W2ZpbGVUeXBlXTtcclxuICAgICAgICAgICAgZmlsZUFyci5mb3JFYWNoKFxyXG4gICAgICAgICAgICAgICAgZnVuY3Rpb24obWZ0SW5kZXgpIHtcclxuICAgICAgICAgICAgICAgICAgICBsZXQgbWV0YSA9IEdsb2JhbHMuX2xyLmdldEZpbGVNZXRhKG1mdEluZGV4KTtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgdmFyIGJhc2VJZHMgPSByZXZlcnNlVGFibGVbbWZ0SW5kZXhdO1xyXG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlU2l6ZSA9IG1ldGEgPyBtZXRhLnNpemUgOiBcIlwiO1xyXG5cclxuICAgICAgICAgICAgICAgICAgICBpZiAoZmlsZVNpemUgPiAwICYmIG1mdEluZGV4ID4gMTUpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgZm9yIChsZXQgYmFzZUlkIG9mIGJhc2VJZHMpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHcydWlbXCJncmlkXCJdLnJlY29yZHMucHVzaCh7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IHcydWlbXCJncmlkXCJdLnJlY29yZHMubGVuZ3RoLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG1mdElkOiBtZnRJbmRleCwgLy8vIE1GVCBpbmRleFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGJhc2VJZDogYmFzZUlkLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZpbGVTaXplOiBmaWxlU2l6ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgICAgIG1mdEluZGV4Kys7XHJcbiAgICAgICAgICAgICAgICB9IC8vLyBFbmQgZm9yIGVhY2ggbWZ0IGluIHRoaXMgZmlsZSB0eXBlXHJcbiAgICAgICAgICAgICk7XHJcbiAgICAgICAgfSAvLy8gRW5kIGlmIF9maWxlTGlzdFtmaWxldHlwZV1cclxuICAgIH0gLy8vIEVuZCBmb3IgZWFjaCBmaWxlVHlwZSBrZXkgaW4gX2ZpbGVMaXN0IG9iamVjdFxyXG5cclxuICAgIC8vLyBVcGRhdGUgZmlsZSBncmlkXHJcbiAgICB3MnVpLmdyaWQuYnVmZmVyZWQgPSB3MnVpLmdyaWQucmVjb3Jkcy5sZW5ndGg7XHJcbiAgICB3MnVpLmdyaWQudG90YWwgPSB3MnVpLmdyaWQuYnVmZmVyZWQ7XHJcbiAgICB3MnVpLmdyaWQucmVmcmVzaCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIG9uRmlsdGVyQ2xpY2s6IG9uRmlsdGVyQ2xpY2tcclxufTtcclxuIiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxudmFyIEdsb2JhbHMgPSByZXF1aXJlKCcuL0dsb2JhbHMnKTtcbnZhciBVdGlscyA9IHJlcXVpcmUoJy4vVXRpbHMnKTtcblxuLy9SZWdpc3RlciB2aWV3ZXJzXG5jb25zdCBIZWFkVmlld2VyID0gcmVxdWlyZSgnLi9WaWV3ZXJzL0hlYWQnKTtcbmNvbnN0IEhleGFWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvSGV4YScpO1xuY29uc3QgTW9kZWxWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvTW9kZWwnKTtcbmNvbnN0IFBhY2tWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvUGFjaycpO1xuY29uc3QgU291bmRWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvU291bmQnKTtcbmNvbnN0IFN0cmluZ1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9TdHJpbmcnKTtcbmNvbnN0IFRleHR1cmVWaWV3ZXIgPSByZXF1aXJlKCcuL1ZpZXdlcnMvVGV4dHVyZScpO1xuY29uc3QgQ250Y1ZpZXdlciA9IHJlcXVpcmUoJy4vVmlld2Vycy9DbnRjJyk7XG5cbnZhciBWaWV3ZXJzID0gW1xuICAgIG5ldyBIZWFkVmlld2VyKCksXG4gICAgbmV3IEhleGFWaWV3ZXIoKSxcbiAgICBuZXcgTW9kZWxWaWV3ZXIoKSxcbiAgICBuZXcgUGFja1ZpZXdlcigpLFxuICAgIG5ldyBTb3VuZFZpZXdlcigpLFxuICAgIG5ldyBTdHJpbmdWaWV3ZXIoKSxcbiAgICBuZXcgVGV4dHVyZVZpZXdlcigpLFxuICAgIG5ldyBDbnRjVmlld2VyKClcbl07XG5cbnZhciBEZWZhdWx0Vmlld2VySW5kZXggPSAwO1xuXG5mdW5jdGlvbiBzZXR1cFZpZXdlcnMoKSB7XG4gICAgZm9yIChsZXQgdGFiIG9mIFZpZXdlcnMpIHtcbiAgICAgICAgdGFiLnNldHVwKCk7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZVRhYkxheW91dCgpIHtcbiAgICBmb3IgKGxldCB0YWIgb2YgVmlld2Vycykge1xuICAgICAgICBsZXQgaXNEZWZhdWx0ID0gdGFiID09IFZpZXdlcnNbRGVmYXVsdFZpZXdlckluZGV4XTtcbiAgICAgICAgbGV0IHRhYkh0bWwgPVxuICAgICAgICAgICAgJChgPGRpdiBjbGFzcz0nZmlsZVRhYicgaWQ9JyR7dGFiLmdldERvbVRhYklkKCl9Jz5cbiAgICAgICAgICAgIDxkaXYgY2xhc3M9J3RhYk91dHB1dCcgaWQ9JyR7dGFiLmdldE91dHB1dElkKCl9Jz48L2Rpdj5cbiAgICAgICAgICAgIDwvZGl2PmApO1xuXG4gICAgICAgIGlmICghaXNEZWZhdWx0KSB7XG4gICAgICAgICAgICB0YWJIdG1sLmhpZGUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJyNmaWxlVGFicycpLmFwcGVuZCh0YWJIdG1sKTtcblxuICAgICAgICB3MnVpWydmaWxlVGFicyddLmFkZCh7XG4gICAgICAgICAgICBpZDogdGFiLmdldFcyVGFiSWQoKSxcbiAgICAgICAgICAgIGNhcHRpb246IHRhYi5uYW1lLFxuICAgICAgICAgICAgZGlzYWJsZWQ6IHRydWUsXG4gICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgJCgnLmZpbGVUYWInKS5oaWRlKCk7XG4gICAgICAgICAgICAgICAgdGFiLnJlbmRlcigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgIH1cbiAgICB3MnVpWydmaWxlVGFicyddLnNlbGVjdChWaWV3ZXJzW0RlZmF1bHRWaWV3ZXJJbmRleF0uZ2V0VzJUYWJJZCgpKTtcbn1cblxuZnVuY3Rpb24gb25CYXNpY1JlbmRlcmVyRG9uZSgpIHtcbiAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcbiAgICAvL05vdCBpbXBsZW1lbnRlZCBpbiBUM0QgeWV0OlxuICAgIC8vbGV0IGZpbGVUeXBlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVUeXBlXCIpO1xuXG4gICAgLy9TaG93IHRoZSBmaWxlbmFtZVxuICAgIC8vVG9kbzogaW1wbGVtZW50IGZpbGVUeXBlXG4gICAgbGV0IGZpbGVOYW1lID0gYCR7ZmlsZUlkfWBcblxuICAgIC8vSXRlcmF0ZSB0aHJvdWdoIHRoZSByZW5kZXJlcnMgdG8ga25vdyB3aG8gY2FuIHNob3cgYW5kIHdob1xuICAgIGxldCBvdmVycmlkZTtcbiAgICBmb3IgKGxldCB2aWV3ZXIgb2YgVmlld2Vycykge1xuICAgICAgICAvL2NoZWNrIGlmIGNhbiB2aWV3XG4gICAgICAgIGlmICh2aWV3ZXIuY2FuVmlldygpKSB7XG4gICAgICAgICAgICB3MnVpLmZpbGVUYWJzLmVuYWJsZSh2aWV3ZXIuZ2V0VzJUYWJJZCgpKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vY2hlY2sgaWYgY2FuIG92ZXJyaWRlXG4gICAgICAgIGxldCBvdmVycmlkZUFiaWxpdHkgPSB2aWV3ZXIub3ZlcnJpZGVEZWZhdWx0KCk7XG4gICAgICAgIGlmIChvdmVycmlkZUFiaWxpdHkgJiYgb3ZlcnJpZGUgPT09IHVuZGVmaW5lZCkge1xuICAgICAgICAgICAgb3ZlcnJpZGUgPSB2aWV3ZXI7XG4gICAgICAgIH0gZWxzZSBpZiAob3ZlcnJpZGVBYmlsaXR5ICYmIG92ZXJyaWRlICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIG92ZXJyaWRlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgfVxuICAgIC8vU2V0IGFjdGl2ZSB0YWJcbiAgICBpZiAob3ZlcnJpZGUpIHtcbiAgICAgICAgdzJ1aS5maWxlVGFicy5jbGljayhvdmVycmlkZS5nZXRXMlRhYklkKCkpO1xuICAgIH0gZWxzZSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuY2xpY2soVmlld2Vyc1tEZWZhdWx0Vmlld2VySW5kZXhdLmdldFcyVGFiSWQoKSk7XG4gICAgfVxuXG4gICAgLy9FbmFibGUgY29udGV4dCB0b29sYmFyIGFuZCBkb3dubG9hZCBidXR0b25cbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpXG4gICAgICAgIC5hcHBlbmQoXG4gICAgICAgICAgICAkKFwiPGJ1dHRvbj5Eb3dubG9hZCByYXc8L2J1dHRvbj5cIilcbiAgICAgICAgICAgIC5jbGljayhcbiAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBibG9iID0gbmV3IEJsb2IoW3Jhd0RhdGFdLCB7XG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICBVdGlscy5zYXZlRGF0YShibG9iLCBmaWxlTmFtZSArIFwiLmJpblwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApXG4gICAgICAgICk7XG5cbn1cblxuZnVuY3Rpb24gdmlld0ZpbGVCeUZpbGVJZChmaWxlSWQpIHtcblxuICAgIC8vLyBDbGVhbiBvdXRwdXRzXG4gICAgJChcIiNmaWxlVGl0bGVcIikuaHRtbChcIlwiKTtcblxuICAgIC8vLyBDbGVhbiBjb250ZXh0IHRvb2xiYXJcbiAgICAkKFwiI2NvbnRleHRUb29sYmFyXCIpLmh0bWwoXCJcIik7XG5cbiAgICAvLy8gRGlzYWJsZSBhbmQgY2xlYW4gdGFic1xuICAgIGZvciAobGV0IHZpZXdlciBvZiBWaWV3ZXJzKSB7XG4gICAgICAgIHcydWkuZmlsZVRhYnMuZGlzYWJsZSh2aWV3ZXIuZ2V0VzJUYWJJZCgpKTtcbiAgICAgICAgdmlld2VyLmNsZWFuKCk7XG4gICAgfVxuXG4gICAgLy8vIE1ha2Ugc3VyZSBfY29udGV4dCBpcyBjbGVhblxuICAgIEdsb2JhbHMuX2NvbnRleHQgPSB7fTtcblxuICAgIGxldCByZW5kZXJlclNldHRpbmdzID0ge1xuICAgICAgICBpZDogZmlsZUlkXG4gICAgfTtcblxuICAgIC8vLyBSdW4gdGhlIGJhc2ljIERhdGFSZW5kZXJlclxuICAgIFQzRC5ydW5SZW5kZXJlcihcbiAgICAgICAgVDNELkRhdGFSZW5kZXJlcixcbiAgICAgICAgR2xvYmFscy5fbHIsXG4gICAgICAgIHJlbmRlcmVyU2V0dGluZ3MsXG4gICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXG4gICAgICAgIG9uQmFzaWNSZW5kZXJlckRvbmVcbiAgICApO1xufVxuXG5mdW5jdGlvbiB2aWV3RmlsZUJ5TUZUKG1mdElkeCkge1xuICAgIGxldCByZXZlcnNlVGFibGUgPSBHbG9iYWxzLl9sci5nZXRSZXZlcnNlSW5kZXgoKTtcblxuICAgIHZhciBiYXNlSWQgPSAocmV2ZXJzZVRhYmxlW21mdElkeF0pID8gcmV2ZXJzZVRhYmxlW21mdElkeF1bMF0gOiBcIlwiO1xuXG4gICAgdmlld0ZpbGVCeUZpbGVJZChiYXNlSWQpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBnZW5lcmF0ZVRhYkxheW91dDogZ2VuZXJhdGVUYWJMYXlvdXQsXG4gICAgc2V0dXBWaWV3ZXJzOiBzZXR1cFZpZXdlcnMsXG4gICAgdmlld0ZpbGVCeUZpbGVJZDogdmlld0ZpbGVCeUZpbGVJZCxcbiAgICB2aWV3RmlsZUJ5TUZUOiB2aWV3RmlsZUJ5TUZUXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuLy9TZXR0aW5nIHVwIHRoZSBnbG9iYWwgdmFyaWFibGVzIGZvciB0aGUgYXBwXG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIC8vLyBUM0RcbiAgICBfbHI6IHVuZGVmaW5lZCxcbiAgICBfY29udGV4dDogdW5kZWZpbmVkLFxuICAgIF9maWxlSWQ6IHVuZGVmaW5lZCxcbiAgICBfZmlsZUxpc3Q6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Tb3VyY2U6IHVuZGVmaW5lZCxcbiAgICBfYXVkaW9Db250ZXh0OiB1bmRlZmluZWQsXG5cbiAgICAvLy8gVEhSRUVcbiAgICBfc2NlbmU6IHVuZGVmaW5lZCxcbiAgICBfY2FtZXJhOiB1bmRlZmluZWQsXG4gICAgX3JlbmRlcmVyOiB1bmRlZmluZWQsXG4gICAgX21vZGVsczogW10sXG4gICAgX2NvbnRyb2xzOiB1bmRlZmluZWQsXG4gICAgX29uQ2FudmFzUmVzaXplOiBmdW5jdGlvbiAoKSB7fVxuXG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG5jb25zdCBGaWxlVmlld2VyID0gcmVxdWlyZShcIi4vRmlsZXZpZXdlclwiKTtcclxuY29uc3QgRmlsZUdyaWQgPSByZXF1aXJlKFwiLi9GaWxlZ3JpZFwiKTtcclxuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi9VdGlsc1wiKTtcclxuY29uc3QgVG9vbHMgPSByZXF1aXJlKFwiLi9Ub29sc1wiKTtcclxuXHJcbnZhciBHbG9iYWxzID0gcmVxdWlyZShcIi4vR2xvYmFsc1wiKTtcclxuXHJcbmNvbnN0IEhleGFWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJzL0hleGFcIik7XHJcblxyXG52YXIgb25SZWFkZXJDYWxsYmFjaztcclxuXHJcbi8qKlxyXG4gKiBTZXR1cCBtYWluIGdyaWRcclxuICovXHJcbmZ1bmN0aW9uIG1haW5HcmlkKCkge1xyXG4gICAgY29uc3QgcHN0eWxlID0gXCJib3JkZXI6IDFweCBzb2xpZCAjZGZkZmRmOyBwYWRkaW5nOiAwO1wiO1xyXG5cclxuICAgICQoXCIjbGF5b3V0XCIpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiBcImxheW91dFwiLFxyXG4gICAgICAgIHBhbmVsczogW1xyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcInRvcFwiLFxyXG4gICAgICAgICAgICAgICAgc2l6ZTogMjgsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IGZhbHNlLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArIFwiIHBhZGRpbmctdG9wOiAxcHg7XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJsZWZ0XCIsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA1NzAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlICsgXCJtYXJnaW46MFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwibWFpblwiLFxyXG4gICAgICAgICAgICAgICAgc3R5bGU6IHBzdHlsZSArIFwiIGJhY2tncm91bmQtY29sb3I6IHRyYW5zcGFyZW50O1wiLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhcjoge1xyXG4gICAgICAgICAgICAgICAgICAgIHN0eWxlOiBcImJhY2tncm91bmQtY29sb3I6I2VhZWFlYTsgaGVpZ2h0OjQwcHhcIixcclxuICAgICAgICAgICAgICAgICAgICBpdGVtczogW1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcImh0bWxcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlkOiBcImNvbnRleHRUb29sYmFyXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBodG1sOlxyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwidG9vbGJhckVudHJ5XCIgaWQ9XCJjb250ZXh0VG9vbGJhclwiPjwvZGl2PidcclxuICAgICAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgICAgICAgICAgb25DbGljazogZnVuY3Rpb24oZXZlbnQpIHtcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcy5vd25lci5jb250ZW50KFwibWFpblwiLCBldmVudCk7XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvblJlc2l6ZTogR2xvYmFscy5fb25DYW52YXNSZXNpemVcclxuICAgIH0pO1xyXG5cclxuICAgICQoXCIjZmlsZUlkSW5wdXRCdG5cIikuY2xpY2soZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5RmlsZUlkKCQoXCIjZmlsZUlkSW5wdXRcIikudmFsKCkpO1xyXG4gICAgfSk7XHJcblxyXG4gICAgLy8vIEdyaWQgaW5zaWRlIG1haW4gbGVmdFxyXG4gICAgJCgpLncybGF5b3V0KHtcclxuICAgICAgICBuYW1lOiBcImxlZnRMYXlvdXRcIixcclxuICAgICAgICBwYW5lbHM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJsZWZ0XCIsXHJcbiAgICAgICAgICAgICAgICBzaXplOiAxNTAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogXCJsZWZ0XCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJtYWluXCIsXHJcbiAgICAgICAgICAgICAgICBzaXplOiA0MjAsXHJcbiAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICBzdHlsZTogcHN0eWxlLFxyXG4gICAgICAgICAgICAgICAgY29udGVudDogXCJyaWdodFwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxuICAgIHcydWlbXCJsYXlvdXRcIl0uY29udGVudChcImxlZnRcIiwgdzJ1aVtcImxlZnRMYXlvdXRcIl0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgdG9vbGJhclxyXG4gKi9cclxuZnVuY3Rpb24gdG9vbGJhcigpIHtcclxuICAgICQoKS53MnRvb2xiYXIoe1xyXG4gICAgICAgIG5hbWU6IFwidG9vbGJhclwiLFxyXG4gICAgICAgIGl0ZW1zOiBbXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYnV0dG9uXCIsXHJcbiAgICAgICAgICAgICAgICBpZDogXCJsb2FkRmlsZVwiLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCJPcGVuIGZpbGVcIixcclxuICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwiYnJlYWtcIlxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcIm1lbnVcIixcclxuICAgICAgICAgICAgICAgIGlkOiBcInZpZXdcIixcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IFwiVmlld1wiLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tcGFnZVwiLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiSGlkZSBmaWxlIGxpc3RcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tcGFnZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiSGlkZSBmaWxlIGNhdGVnb3JpZXNcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tcGFnZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIHRleHQ6IFwiSGlkZSBmaWxlIHByZXZpZXdcIixcclxuICAgICAgICAgICAgICAgICAgICAgICAgaW1nOiBcImljb24tcGFnZVwiXHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgXVxyXG4gICAgICAgICAgICB9LFxyXG4gICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICB0eXBlOiBcImJyZWFrXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJtZW51XCIsXHJcbiAgICAgICAgICAgICAgICBpZDogXCJ0b29sc1wiLFxyXG4gICAgICAgICAgICAgICAgY2FwdGlvbjogXCJUb29sc1wiLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tcGFnZVwiLFxyXG4gICAgICAgICAgICAgICAgaXRlbXM6IFtcclxuICAgICAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgICAgIGlkOiAndmlld0NudGNTdW1tYXJ5JyxcclxuICAgICAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJWaWV3IGNudGMgc3VtbWFyeVwiLFxyXG4gICAgICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1wYWdlXCJcclxuICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICBdXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIHR5cGU6IFwic3BhY2VyXCJcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgdHlwZTogXCJidXR0b25cIixcclxuICAgICAgICAgICAgICAgIGlkOiBcIm1lbnRpb25zXCIsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlR5cmlhMkRcIixcclxuICAgICAgICAgICAgICAgIGltZzogXCJpY29uLXBhZ2VcIlxyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgXSxcclxuICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihldmVudCkge1xyXG4gICAgICAgICAgICBzd2l0Y2ggKGV2ZW50LnRhcmdldCkge1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcImxvYWRGaWxlXCI6XHJcbiAgICAgICAgICAgICAgICAgICAgb3BlbkZpbGVQb3B1cCgpO1xyXG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xyXG4gICAgICAgICAgICAgICAgY2FzZSBcInRvb2xzOnZpZXdDbnRjU3VtbWFyeVwiOlxyXG4gICAgICAgICAgICAgICAgICAgIFRvb2xzLmNudGNTdW1tYXJ5KCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICB9KTtcclxuXHJcbiAgICB3MnVpW1wibGF5b3V0XCJdLmNvbnRlbnQoXCJ0b3BcIiwgdzJ1aVtcInRvb2xiYXJcIl0pO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgc2lkZWJhclxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhcigpIHtcclxuICAgIC8qXHJcbiAgICAgICAgU0lERUJBUlxyXG4gICAgKi9cclxuICAgIHcydWlbXCJsZWZ0TGF5b3V0XCJdLmNvbnRlbnQoXHJcbiAgICAgICAgXCJsZWZ0XCIsXHJcbiAgICAgICAgJCgpLncyc2lkZWJhcih7XHJcbiAgICAgICAgICAgIG5hbWU6IFwic2lkZWJhclwiLFxyXG4gICAgICAgICAgICBpbWc6IG51bGwsXHJcbiAgICAgICAgICAgIG5vZGVzOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IFwiQWxsXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogXCJBbGxcIixcclxuICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2VcclxuICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgXSxcclxuICAgICAgICAgICAgb25DbGljazogRmlsZUdyaWQub25GaWx0ZXJDbGlja1xyXG4gICAgICAgIH0pXHJcbiAgICApO1xyXG59XHJcblxyXG4vKipcclxuICogU2V0dXAgZmlsZWJyb3dzZXJcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVCcm93c2VyKCkge1xyXG4gICAgdzJ1aVtcImxlZnRMYXlvdXRcIl0uY29udGVudChcclxuICAgICAgICBcIm1haW5cIixcclxuICAgICAgICAkKCkudzJncmlkKHtcclxuICAgICAgICAgICAgbmFtZTogXCJncmlkXCIsXHJcbiAgICAgICAgICAgIHNob3c6IHtcclxuICAgICAgICAgICAgICAgIHRvb2xiYXI6IHRydWUsXHJcbiAgICAgICAgICAgICAgICB0b29sYmFyU2VhcmNoOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgdG9vbGJhclJlbG9hZDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICBmb290ZXI6IHRydWVcclxuICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgbXVsdGlTZWFyY2g6IGZhbHNlLFxyXG4gICAgICAgICAgICBjb2x1bW5zOiBbXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6IFwiYmFzZUlkXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJCYXNlIElEXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogXCIyNSVcIixcclxuICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogXCJpbnRcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJtZnRJZFwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246IFwiTUZUIElEXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogXCIyNSVcIixcclxuICAgICAgICAgICAgICAgICAgICBzb3J0YWJsZTogdHJ1ZSxcclxuICAgICAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogXCJpbnRcIlxyXG4gICAgICAgICAgICAgICAgfSxcclxuICAgICAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgICAgICBmaWVsZDogXCJ0eXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogXCJUeXBlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogXCIyNSVcIixcclxuICAgICAgICAgICAgICAgICAgICByZXNpemFibGU6IHRydWUsXHJcbiAgICAgICAgICAgICAgICAgICAgc29ydGFibGU6IHRydWVcclxuICAgICAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgICAgICB7XHJcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6IFwiZmlsZVNpemVcIixcclxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlBhY2sgU2l6ZVwiLFxyXG4gICAgICAgICAgICAgICAgICAgIHNpemU6IFwiMjUlXCIsXHJcbiAgICAgICAgICAgICAgICAgICAgcmVzaXphYmxlOiB0cnVlLFxyXG4gICAgICAgICAgICAgICAgICAgIHNvcnRhYmxlOiB0cnVlXHJcbiAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgICAgIG9uQ2xpY2s6IGZ1bmN0aW9uKGV2ZW50KSB7XHJcbiAgICAgICAgICAgICAgICBsZXQgYmFzZUlkID0gdzJ1aVtcImdyaWRcIl0ucmVjb3Jkc1tldmVudC5yZWNpZF0uYmFzZUlkO1xyXG4gICAgICAgICAgICAgICAgRmlsZVZpZXdlci52aWV3RmlsZUJ5RmlsZUlkKGJhc2VJZCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9KVxyXG4gICAgKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFNldHVwIGZpbGUgdmlldyB3aW5kb3dcclxuICovXHJcbmZ1bmN0aW9uIGZpbGVWaWV3KCkge1xyXG4gICAgJCh3MnVpW1wibGF5b3V0XCJdLmVsKFwibWFpblwiKSlcclxuICAgICAgICAuYXBwZW5kKCQoXCI8aDEgaWQ9J2ZpbGVUaXRsZScgLz5cIikpXHJcbiAgICAgICAgLmFwcGVuZCgkKFwiPGRpdiBpZD0nZmlsZVRhYnMnIC8+XCIpKTtcclxuXHJcbiAgICAkKFwiI2ZpbGVUYWJzXCIpLncydGFicyh7XHJcbiAgICAgICAgbmFtZTogXCJmaWxlVGFic1wiLFxyXG4gICAgICAgIHRhYnM6IFtdXHJcbiAgICB9KTtcclxuXHJcbiAgICBGaWxlVmlld2VyLmdlbmVyYXRlVGFiTGF5b3V0KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIHN0cmluZ0dyaWQoKSB7XHJcbiAgICAvLy8gU2V0IHVwIGdyaWQgZm9yIHN0cmluZ3Mgdmlld1xyXG4gICAgLy8vQ3JlYXRlIGdyaWRcclxuICAgICQoXCIjc3RyaW5nT3V0cHV0XCIpLncyZ3JpZCh7XHJcbiAgICAgICAgbmFtZTogXCJzdHJpbmdHcmlkXCIsXHJcbiAgICAgICAgc2VsZWN0VHlwZTogXCJjZWxsXCIsXHJcbiAgICAgICAgc2hvdzoge1xyXG4gICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxyXG4gICAgICAgICAgICBmb290ZXI6IHRydWVcclxuICAgICAgICB9LFxyXG4gICAgICAgIGNvbHVtbnM6IFtcclxuICAgICAgICAgICAge1xyXG4gICAgICAgICAgICAgICAgZmllbGQ6IFwicmVjaWRcIixcclxuICAgICAgICAgICAgICAgIGNhcHRpb246IFwiUm93ICNcIixcclxuICAgICAgICAgICAgICAgIHNpemU6IFwiNjBweFwiXHJcbiAgICAgICAgICAgIH0sXHJcbiAgICAgICAgICAgIHtcclxuICAgICAgICAgICAgICAgIGZpZWxkOiBcInZhbHVlXCIsXHJcbiAgICAgICAgICAgICAgICBjYXB0aW9uOiBcIlRleHRcIixcclxuICAgICAgICAgICAgICAgIHNpemU6IFwiMTAwJVwiXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICBdXHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIHdoZW4gd2UgaGF2ZSBhIGxpc3Qgb2YgdGhlIGZpbGVzIHRvIG9yZ2FuaXplIHRoZSBjYXRlZ29yaWVzLlxyXG4gKi9cclxuZnVuY3Rpb24gc2lkZWJhck5vZGVzKCkge1xyXG4gICAgLy9DbGVhciBzaWRlYmFyIGlmIGFscmVhZHkgc2V0IHVwXHJcbiAgICBmb3IgKGxldCBlbGVtZW50IG9mIHcydWlbXCJzaWRlYmFyXCJdLm5vZGVzKSB7XHJcbiAgICAgICAgaWYgKGVsZW1lbnQuaWQgIT0gXCJBbGxcIikge1xyXG4gICAgICAgICAgICB3MnVpW1wic2lkZWJhclwiXS5ub2Rlcy5zcGxpY2UoXHJcbiAgICAgICAgICAgICAgICB3MnVpW1wic2lkZWJhclwiXS5ub2Rlcy5pbmRleE9mKGVsZW1lbnQuaWQpLFxyXG4gICAgICAgICAgICAgICAgMVxyXG4gICAgICAgICAgICApO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuICAgIHcydWlbXCJzaWRlYmFyXCJdLnJlZnJlc2goKTtcclxuXHJcbiAgICAvL1JlZ2VuZXJhdGVcclxuXHJcbiAgICBsZXQgcGFja05vZGUgPSB7XHJcbiAgICAgICAgaWQ6IFwicGFja0dyb3VwXCIsXHJcbiAgICAgICAgdGV4dDogXCJQYWNrIEZpbGVzXCIsXHJcbiAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdGV4dHVyZU5vZGUgPSB7XHJcbiAgICAgICAgaWQ6IFwidGV4dHVyZUdyb3VwXCIsXHJcbiAgICAgICAgdGV4dDogXCJUZXh0dXJlIGZpbGVzXCIsXHJcbiAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICBsZXQgdW5zb3J0ZWROb2RlID0ge1xyXG4gICAgICAgIGlkOiBcInVuc29ydGVkR3JvdXBcIixcclxuICAgICAgICB0ZXh0OiBcIlVuc29ydGVkXCIsXHJcbiAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgZ3JvdXA6IGZhbHNlLFxyXG4gICAgICAgIG5vZGVzOiBbXVxyXG4gICAgfTtcclxuXHJcbiAgICAvLy8gQnVpbGQgc2lkZWJhciBub2Rlc1xyXG4gICAgZm9yIChsZXQgZmlsZVR5cGUgaW4gR2xvYmFscy5fZmlsZUxpc3QpIHtcclxuICAgICAgICBpZiAoR2xvYmFscy5fZmlsZUxpc3QuaGFzT3duUHJvcGVydHkoZmlsZVR5cGUpKSB7XHJcbiAgICAgICAgICAgIGxldCBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgaW1nOiBcImljb24tZm9sZGVyXCIsXHJcbiAgICAgICAgICAgICAgICBncm91cDogZmFsc2VcclxuICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgbGV0IGlzUGFjayA9IGZhbHNlO1xyXG4gICAgICAgICAgICBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcIlRFWFRVUkVcIikpIHtcclxuICAgICAgICAgICAgICAgIG5vZGUgPSB7XHJcbiAgICAgICAgICAgICAgICAgICAgaWQ6IGZpbGVUeXBlLFxyXG4gICAgICAgICAgICAgICAgICAgIGltZzogXCJpY29uLWZvbGRlclwiLFxyXG4gICAgICAgICAgICAgICAgICAgIGdyb3VwOiBmYWxzZSxcclxuICAgICAgICAgICAgICAgICAgICB0ZXh0OiBmaWxlVHlwZVxyXG4gICAgICAgICAgICAgICAgfTtcclxuICAgICAgICAgICAgICAgIHRleHR1cmVOb2RlLm5vZGVzLnB1c2gobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUgPT0gXCJCSU5BUklFU1wiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIkJpbmFyaWVzXCI7XHJcbiAgICAgICAgICAgICAgICB3MnVpLnNpZGViYXIuYWRkKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlID09IFwiU1RSSU5HU1wiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlN0cmluZ3NcIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZmlsZVR5cGUuc3RhcnRzV2l0aChcIlBGXCIpKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogZmlsZVR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICBwYWNrTm9kZS5ub2Rlcy5wdXNoKG5vZGUpO1xyXG4gICAgICAgICAgICB9IGVsc2UgaWYgKGZpbGVUeXBlID09IFwiVU5LTk9XTlwiKSB7XHJcbiAgICAgICAgICAgICAgICBub2RlLnRleHQgPSBcIlVua25vd25cIjtcclxuICAgICAgICAgICAgICAgIHcydWkuc2lkZWJhci5hZGQobm9kZSk7XHJcbiAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICBub2RlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlVHlwZSxcclxuICAgICAgICAgICAgICAgICAgICBpbWc6IFwiaWNvbi1mb2xkZXJcIixcclxuICAgICAgICAgICAgICAgICAgICBncm91cDogZmFsc2UsXHJcbiAgICAgICAgICAgICAgICAgICAgdGV4dDogZmlsZVR5cGVcclxuICAgICAgICAgICAgICAgIH07XHJcbiAgICAgICAgICAgICAgICB1bnNvcnRlZE5vZGUubm9kZXMucHVzaChub2RlKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBpZiAocGFja05vZGUubm9kZXMubGVuZ3RoID4gMCkge1xyXG4gICAgICAgIHcydWkuc2lkZWJhci5hZGQocGFja05vZGUpO1xyXG4gICAgfVxyXG5cclxuICAgIGlmICh0ZXh0dXJlTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh0ZXh0dXJlTm9kZSk7XHJcbiAgICB9XHJcblxyXG4gICAgaWYgKHVuc29ydGVkTm9kZS5ub2Rlcy5sZW5ndGggPiAwKSB7XHJcbiAgICAgICAgdzJ1aS5zaWRlYmFyLmFkZCh1bnNvcnRlZE5vZGUpO1xyXG4gICAgfVxyXG59XHJcblxyXG5mdW5jdGlvbiBvcGVuRmlsZVBvcHVwKCkge1xyXG4gICAgLy8vIEFzayBmb3IgZmlsZVxyXG4gICAgdzJwb3B1cC5vcGVuKHtcclxuICAgICAgICBzcGVlZDogMCxcclxuICAgICAgICB0aXRsZTogXCJMb2FkIEEgR1cyIGRhdFwiLFxyXG4gICAgICAgIG1vZGFsOiB0cnVlLFxyXG4gICAgICAgIHNob3dDbG9zZTogZmFsc2UsXHJcbiAgICAgICAgYm9keTpcclxuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJ3MnVpLWNlbnRlcmVkXCI+JyArXHJcbiAgICAgICAgICAgICc8ZGl2IGlkPVwiZmlsZUxvYWRQcm9ncmVzc1wiIC8+JyArXHJcbiAgICAgICAgICAgICc8aW5wdXQgaWQ9XCJmaWxlUGlja2VyUG9wXCIgdHlwZT1cImZpbGVcIiAvPicgK1xyXG4gICAgICAgICAgICBcIjwvZGl2PlwiXHJcbiAgICB9KTtcclxuXHJcbiAgICAkKFwiI2ZpbGVQaWNrZXJQb3BcIikuY2hhbmdlKGZ1bmN0aW9uKGV2dCkge1xyXG4gICAgICAgIEdsb2JhbHMuX2xyID0gVDNELmdldExvY2FsUmVhZGVyKFxyXG4gICAgICAgICAgICBldnQudGFyZ2V0LmZpbGVzWzBdLFxyXG4gICAgICAgICAgICBvblJlYWRlckNhbGxiYWNrLFxyXG4gICAgICAgICAgICBcIi4uL3N0YXRpYy90M2R3b3JrZXIuanNcIlxyXG4gICAgICAgICk7XHJcbiAgICB9KTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFRoaXMgZnVuY3Rpb24gaXMgY2FsbGVkIGJ5IHRoZSBtYWluIGFwcCB0byBjcmVhdGUgdGhlIGd1aSBsYXlvdXQuXHJcbiAqL1xyXG5mdW5jdGlvbiBpbml0TGF5b3V0KG9uUmVhZGVyQ3JlYXRlZCkge1xyXG4gICAgb25SZWFkZXJDYWxsYmFjayA9IG9uUmVhZGVyQ3JlYXRlZDtcclxuXHJcbiAgICBtYWluR3JpZCgpO1xyXG4gICAgdG9vbGJhcigpO1xyXG4gICAgc2lkZWJhcigpO1xyXG4gICAgZmlsZUJyb3dzZXIoKTtcclxuICAgIGZpbGVWaWV3KCk7XHJcbiAgICBzdHJpbmdHcmlkKCk7XHJcblxyXG4gICAgLy9TZXR1cCB2aWV3ZXJzXHJcbiAgICBGaWxlVmlld2VyLnNldHVwVmlld2VycygpO1xyXG5cclxuICAgIC8qXHJcbiAgICAgICAgU0VUIFVQIFRSRUUgM0QgU0NFTkVcclxuICAgICovXHJcbiAgICAvLyBVdGlscy5zZXR1cFNjZW5lKCk7XHJcblxyXG4gICAgb3BlbkZpbGVQb3B1cCgpO1xyXG59XHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IHtcclxuICAgIGluaXRMYXlvdXQ6IGluaXRMYXlvdXQsXHJcbiAgICBzaWRlYmFyTm9kZXM6IHNpZGViYXJOb2Rlc1xyXG59O1xyXG4iLCJjb25zdCBHbG9iYWxzID0gcmVxdWlyZSgnLi9HbG9iYWxzJyk7XG5cbmFzeW5jIGZ1bmN0aW9uIGNudGNTdW1tYXJ5KCkge1xuICAgICQoKS53MmdyaWQoe1xuICAgICAgICBuYW1lOiAnY250Y1N1bW1hcnlHcmlkJyxcbiAgICAgICAgY29sdW1uczogW1xuICAgICAgICAgICAge2ZpZWxkOiAndHlwZUlkJywgY2FwdGlvbjogJ2NudGMgdHlwZSBJRCcsIHNpemU6ICczMyUnLCBzb3J0YWJsZTogdHJ1ZSB9LFxuICAgICAgICAgICAge2ZpZWxkOiAnYW1vdW50JywgY2FwdGlvbjogJ2VudHJpZXMgYW1vdW50Jywgc2l6ZTogJzMzJScsIHNvcnRhYmxlOiB0cnVlfSxcbiAgICAgICAgICAgIHtmaWVsZDogJ2ZpbGVzJywgY2FwdGlvbjogJ2ZpbGVzJywgc2l6ZTogJzMzJScsIHNvcnRhYmxlOiBmYWxzZX0sXG4gICAgICAgIF1cbiAgICB9KTtcbiAgICB3MnBvcHVwLm9wZW4oe1xuICAgICAgICB0aXRsZTogJ1N1bW1hcnkgb2YgY250YyB0eXBlcy4nLFxuICAgICAgICBib2R5OiAnPGRpdiBpZD1cInN1bW1hcnlHcmlkXCIgc3R5bGU9XCJoZWlnaHQ6IDEwMCVcIj5Mb2FkaW5nLi4uPC9kaXY+JyxcbiAgICAgICAgbW9kYWwgICAgIDogdHJ1ZSxcbiAgICAgICAgc2hvd0Nsb3NlIDogdHJ1ZSxcbiAgICAgICAgc2hvd01heCAgIDogdHJ1ZSxcbiAgICAgICAgb25DbG9zZTogKCkgPT4ge1xuICAgICAgICAgICAgJCgpLncyZGVzdHJveSgnY250Y1N1bW1hcnlHcmlkJyk7XG4gICAgICAgIH0sXG4gICAgICAgIG9uTWF4ICAgICA6IGZ1bmN0aW9uIChldmVudCkgeyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3MnVpLmNudGNTdW1tYXJ5R3JpZC5yZW5kZXIoJyNzdW1tYXJ5R3JpZCcpOyB9LCA1MDApIH0sXG4gICAgICAgIG9uTWluICAgICA6IGZ1bmN0aW9uIChldmVudCkgeyBzZXRUaW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICB3MnVpLmNudGNTdW1tYXJ5R3JpZC5yZW5kZXIoJyNzdW1tYXJ5R3JpZCcpOyB9LCA1MDApIH0sXG4gICAgfSk7XG4gICAgXG4gICAgbGV0IHJlcyA9IGF3YWl0IEdsb2JhbHMuX2xyLnJlYWRGaWxlTGlzdCgpO1xuXG4gICAgLy9HZXQgdGhlIGNudGMgZmlsZXNcbiAgICBsZXQgY250Y0ZpbGVzID0gcmVzLmZpbHRlcigoaSkgPT4ge1xuICAgICAgICByZXR1cm4gKGkuZmlsZVR5cGUgPT0gXCJQRl9jbnRjXCIgJiYgaS5iYXNlSWRMaXN0WzBdIDwgMTAwMDAwMCk7XG4gICAgfSk7XG5cbiAgICBsZXQgY250Y1R5cGVzID0gW107XG5cbiAgICBmb3IgKGxldCBlbHQgb2YgY250Y0ZpbGVzKSB7XG4gICAgICAgIGxldCByID0gYXdhaXQgR2xvYmFscy5fbHIucmVhZEZpbGUoZWx0Lm1mdElkKTtcbiAgICAgICAgbGV0IGZpbGUgPSBuZXcgVDNELkdXMkZpbGUobmV3IERhdGFTdHJlYW0oci5idWZmZXIpLCAwKTtcbiAgICAgICAgbGV0IG1haW5DaHVuayA9IGZpbGUuZ2V0Q2h1bmsoJ01haW4nKS5kYXRhO1xuXG4gICAgICAgIGZvciAobGV0IGVudHJ5IG9mIG1haW5DaHVuay5pbmRleEVudHJpZXMpIHtcbiAgICAgICAgICAgIGxldCBzdW1tYXJ5ID0gY250Y1R5cGVzLmZpbHRlciggdCA9PiB7cmV0dXJuIHQudHlwZUlkID09IGVudHJ5LnR5cGV9KS5sZW5ndGggPiAwID9cbiAgICAgICAgICAgIGNudGNUeXBlcy5maWx0ZXIoIHQgPT4ge3JldHVybiB0LnR5cGVJZCA9PSBlbnRyeS50eXBlfSlbMF0gOiBjbnRjVHlwZXNbY250Y1R5cGVzLnB1c2goe3R5cGVJZDogZW50cnkudHlwZSwgYW1vdW50OjAsIGZpbGVzOiBbXX0pLTFdO1xuICAgICAgICAgICAgc3VtbWFyeS5hbW91bnQgKz0gMTtcbiAgICAgICAgICAgIGlmKCFzdW1tYXJ5LmZpbGVzLmluY2x1ZGVzKGVsdC5iYXNlSWRMaXN0WzBdKSl7XG4gICAgICAgICAgICAgICAgc3VtbWFyeS5maWxlcy5wdXNoKGVsdC5iYXNlSWRMaXN0WzBdKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIHcydWkuY250Y1N1bW1hcnlHcmlkLnJlY29yZHMgPSBjbnRjVHlwZXM7XG4gICAgdzJ1aS5jbnRjU3VtbWFyeUdyaWQucmVuZGVyKCcjc3VtbWFyeUdyaWQnKTtcbiAgICB3MnVpLmNudGNTdW1tYXJ5R3JpZC5yZWZyZXNoKCk7XG5cbn1cblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgY250Y1N1bW1hcnk6IGNudGNTdW1tYXJ5XG59IiwiLypcclxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXHJcblxyXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cclxuXHJcblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxyXG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxyXG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxyXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxyXG5cclxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxyXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxyXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXHJcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXHJcblxyXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxyXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXHJcbiovXHJcblxyXG52YXIgR2xvYmFscyA9IHJlcXVpcmUoJy4vR2xvYmFscycpO1xyXG5cclxuLy8vIEV4cG9ydHMgY3VycmVudCBtb2RlbCBhcyBhbiAub2JqIGZpbGUgd2l0aCBhIC5tdGwgcmVmZXJpbmcgLnBuZyB0ZXh0dXJlcy5cclxuZnVuY3Rpb24gZXhwb3J0U2NlbmUoKSB7XHJcblxyXG4gICAgLy8vIEdldCBsYXN0IGxvYWRlZCBmaWxlSWRcdFx0XHJcbiAgICB2YXIgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkO1xyXG5cclxuICAgIC8vLyBSdW4gVDNEIGhhY2tlZCB2ZXJzaW9uIG9mIE9CSkV4cG9ydGVyXHJcbiAgICB2YXIgcmVzdWx0ID0gbmV3IFRIUkVFLk9CSkV4cG9ydGVyKCkucGFyc2UoR2xvYmFscy5fc2NlbmUsIGZpbGVJZCk7XHJcblxyXG4gICAgLy8vIFJlc3VsdCBsaXN0cyB3aGF0IGZpbGUgaWRzIGFyZSB1c2VkIGZvciB0ZXh0dXJlcy5cclxuICAgIHZhciB0ZXhJZHMgPSByZXN1bHQudGV4dHVyZUlkcztcclxuXHJcbiAgICAvLy8gU2V0IHVwIHZlcnkgYmFzaWMgbWF0ZXJpYWwgZmlsZSByZWZlcmluZyB0aGUgdGV4dHVyZSBwbmdzXHJcbiAgICAvLy8gcG5ncyBhcmUgZ2VuZXJhdGVkIGEgZmV3IGxpbmVzIGRvd24uXHJcbiAgICB2YXIgbXRsU291cmNlID0gXCJcIjtcclxuICAgIHRleElkcy5mb3JFYWNoKGZ1bmN0aW9uICh0ZXhJZCkge1xyXG4gICAgICAgIG10bFNvdXJjZSArPSBcIm5ld210bCB0ZXhfXCIgKyB0ZXhJZCArIFwiXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0thIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXCIgK1xyXG4gICAgICAgICAgICBcIiAgbWFwX0tkIHRleF9cIiArIHRleElkICsgXCIucG5nXFxuXFxuXCI7XHJcbiAgICB9KTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgb2JqXHJcbiAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtyZXN1bHQub2JqXSwge1xyXG4gICAgICAgIHR5cGU6IFwib2N0ZXQvc3RyZWFtXCJcclxuICAgIH0pO1xyXG4gICAgc2F2ZURhdGEoYmxvYiwgXCJleHBvcnQuXCIgKyBmaWxlSWQgKyBcIi5vYmpcIik7XHJcblxyXG4gICAgLy8vIERvd25sb2FkIG10bFxyXG4gICAgYmxvYiA9IG5ldyBCbG9iKFttdGxTb3VyY2VdLCB7XHJcbiAgICAgICAgdHlwZTogXCJvY3RldC9zdHJlYW1cIlxyXG4gICAgfSk7XHJcbiAgICBzYXZlRGF0YShibG9iLCBcImV4cG9ydC5cIiArIGZpbGVJZCArIFwiLm10bFwiKTtcclxuXHJcbiAgICAvLy8gRG93bmxvYWQgdGV4dHVyZSBwbmdzXHJcbiAgICB0ZXhJZHMuZm9yRWFjaChmdW5jdGlvbiAodGV4SWQpIHtcclxuXHJcbiAgICAgICAgLy8vIExvY2FsUmVhZGVyIHdpbGwgaGF2ZSB0byByZS1sb2FkIHRoZSB0ZXh0dXJlcywgZG9uJ3Qgd2FudCB0byBmZXRjaFxyXG4gICAgICAgIC8vLyB0aGVuIGZyb20gdGhlIG1vZGVsIGRhdGEuLlxyXG4gICAgICAgIEdsb2JhbHMuX2xyLmxvYWRUZXh0dXJlRmlsZSh0ZXhJZCxcclxuICAgICAgICAgICAgZnVuY3Rpb24gKGluZmxhdGVkRGF0YSwgZHh0VHlwZSwgaW1hZ2VXaWR0aCwgaW1hZ2VIZWlndGgpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIGpzIGltYWdlIHVzaW5nIHJldHVybmVkIGJpdG1hcCBkYXRhLlxyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlID0ge1xyXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IG5ldyBVaW50OEFycmF5KGluZmxhdGVkRGF0YSksXHJcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IGltYWdlV2lkdGgsXHJcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBpbWFnZUhlaWd0aFxyXG4gICAgICAgICAgICAgICAgfTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gTmVlZCBhIGNhbnZhcyBpbiBvcmRlciB0byBkcmF3XHJcbiAgICAgICAgICAgICAgICB2YXIgY2FudmFzID0gJChcIjxjYW52YXMgLz5cIik7XHJcbiAgICAgICAgICAgICAgICAkKFwiYm9keVwiKS5hcHBlbmQoY2FudmFzKTtcclxuXHJcbiAgICAgICAgICAgICAgICBjYW52YXNbMF0ud2lkdGggPSBpbWFnZS53aWR0aDtcclxuICAgICAgICAgICAgICAgIGNhbnZhc1swXS5oZWlnaHQgPSBpbWFnZS5oZWlnaHQ7XHJcblxyXG4gICAgICAgICAgICAgICAgdmFyIGN0eCA9IGNhbnZhc1swXS5nZXRDb250ZXh0KFwiMmRcIik7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIERyYXcgcmF3IGJpdG1hcCB0byBjYW52YXNcclxuICAgICAgICAgICAgICAgIHZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xyXG4gICAgICAgICAgICAgICAgdmFyIGltYWdlZGF0YSA9IG5ldyBJbWFnZURhdGEodWljYSwgaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcbiAgICAgICAgICAgICAgICBjdHgucHV0SW1hZ2VEYXRhKGltYWdlZGF0YSwgMCwgMCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFRoaXMgaXMgd2hlcmUgc2hpdCBnZXRzIHN0dXBpZC4gRmxpcHBpbmcgcmF3IGJpdG1hcHMgaW4ganNcclxuICAgICAgICAgICAgICAgIC8vLyBpcyBhcHBhcmVudGx5IGEgcGFpbi4gQmFzaWNseSByZWFkIGN1cnJlbnQgc3RhdGUgcGl4ZWwgYnkgcGl4ZWxcclxuICAgICAgICAgICAgICAgIC8vLyBhbmQgd3JpdGUgaXQgYmFjayB3aXRoIGZsaXBwZWQgeS1heGlzIFxyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gY3R4LmdldEltYWdlRGF0YSgwLCAwLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcclxuXHJcbiAgICAgICAgICAgICAgICAvLy8gQ3JlYXRlIG91dHB1dCBpbWFnZSBkYXRhIGJ1ZmZlclxyXG4gICAgICAgICAgICAgICAgdmFyIG91dHB1dCA9IGN0eC5jcmVhdGVJbWFnZURhdGEoaW1hZ2Uud2lkdGgsIGltYWdlLmhlaWdodCk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIEdldCBpbWFnZWRhdGEgc2l6ZVxyXG4gICAgICAgICAgICAgICAgdmFyIHcgPSBpbnB1dC53aWR0aCxcclxuICAgICAgICAgICAgICAgICAgICBoID0gaW5wdXQuaGVpZ2h0O1xyXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0RGF0YSA9IGlucHV0LmRhdGE7XHJcbiAgICAgICAgICAgICAgICB2YXIgb3V0cHV0RGF0YSA9IG91dHB1dC5kYXRhXHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIExvb3AgcGl4ZWxzXHJcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB5ID0gMTsgeSA8IGggLSAxOyB5ICs9IDEpIHtcclxuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciB4ID0gMTsgeCA8IHcgLSAxOyB4ICs9IDEpIHtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBJbnB1dCBsaW5lYXIgY29vcmRpbmF0ZVxyXG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgaSA9ICh5ICogdyArIHgpICogNDtcclxuXHJcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vLyBPdXRwdXQgbGluZWFyIGNvb3JkaW5hdGVcclxuICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGZsaXAgPSAoKGggLSB5KSAqIHcgKyB4KSAqIDQ7XHJcblxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gUmVhZCBhbmQgd3JpdGUgUkdCQVxyXG4gICAgICAgICAgICAgICAgICAgICAgICAvLy8gVE9ETzogUGVyaGFwcyBwdXQgYWxwaGEgdG8gMTAwJVxyXG4gICAgICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBjID0gMDsgYyA8IDQ7IGMgKz0gMSkge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0RGF0YVtpICsgY10gPSBpbnB1dERhdGFbZmxpcCArIGNdO1xyXG4gICAgICAgICAgICAgICAgICAgICAgICB9XHJcbiAgICAgICAgICAgICAgICAgICAgfVxyXG4gICAgICAgICAgICAgICAgfVxyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBXcml0ZSBiYWNrIGZsaXBwZWQgZGF0YVxyXG4gICAgICAgICAgICAgICAgY3R4LnB1dEltYWdlRGF0YShvdXRwdXQsIDAsIDApO1xyXG5cclxuICAgICAgICAgICAgICAgIC8vLyBGZXRjaCBjYW52YXMgZGF0YSBhcyBwbmcgYW5kIGRvd25sb2FkLlxyXG4gICAgICAgICAgICAgICAgY2FudmFzWzBdLnRvQmxvYihcclxuICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAocG5nQmxvYikge1xyXG4gICAgICAgICAgICAgICAgICAgICAgICBzYXZlRGF0YShwbmdCbG9iLCBcInRleF9cIiArIHRleElkICsgXCIucG5nXCIpO1xyXG4gICAgICAgICAgICAgICAgICAgIH1cclxuICAgICAgICAgICAgICAgICk7XHJcblxyXG4gICAgICAgICAgICAgICAgLy8vIFJlbW92ZSBjYW52YXMgZnJvbSBET01cclxuICAgICAgICAgICAgICAgIGNhbnZhcy5yZW1vdmUoKTtcclxuXHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICApO1xyXG5cclxuXHJcbiAgICB9KTtcclxuXHJcbn1cclxuXHJcblxyXG5cclxuLy8vIFV0aWxpdHkgZm9yIGRvd25sb2FkaW5nIGZpbGVzIHRvIGNsaWVudFxyXG52YXIgc2F2ZURhdGEgPSAoZnVuY3Rpb24gKCkge1xyXG4gICAgdmFyIGEgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiYVwiKTtcclxuICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoYSk7XHJcbiAgICBhLnN0eWxlID0gXCJkaXNwbGF5OiBub25lXCI7XHJcbiAgICByZXR1cm4gZnVuY3Rpb24gKGJsb2IsIGZpbGVOYW1lKSB7XHJcbiAgICAgICAgdmFyIHVybCA9IHdpbmRvdy5VUkwuY3JlYXRlT2JqZWN0VVJMKGJsb2IpO1xyXG4gICAgICAgIGEuaHJlZiA9IHVybDtcclxuICAgICAgICBhLmRvd25sb2FkID0gZmlsZU5hbWU7XHJcbiAgICAgICAgYS5jbGljaygpO1xyXG4gICAgICAgIHdpbmRvdy5VUkwucmV2b2tlT2JqZWN0VVJMKHVybCk7XHJcbiAgICB9O1xyXG59KCkpO1xyXG5cclxuZnVuY3Rpb24gZ2VuZXJhdGVIZXhUYWJsZShyYXdEYXRhLCBncmlkTmFtZSwgY2FsbGJhY2spIHtcclxuICAgIGxldCBieXRlQXJyYXkgPSBuZXcgVWludDhBcnJheShyYXdEYXRhKTtcclxuICAgIGxldCBoZXhPdXRwdXQgPSBbXTtcclxuICAgIGxldCBhc2NpaU91dHB1dCA9IFtdO1xyXG4gICAgY29uc3QgbG9vcENodW5rU2l6ZSA9IDEwMDAwO1xyXG5cclxuICAgIGNvbnN0IEFTQ0lJID0gJ2FiY2RlZmdoaWprbG1ub3BxcnN0dXZ3eHl6JyArICdBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWicgK1xyXG4gICAgICAgICcwMTIzNDU2Nzg5JyArICchXCIjJCUmXFwnKCkqKywtLi86Ozw9Pj9AW1xcXFxdXl9ge3x9fic7XHJcblxyXG4gICAgbGV0IGdyaWQgPSAkKCkudzJncmlkKFxyXG4gICAgICAgIHsgXHJcbiAgICAgICAgICAgIG5hbWUgICA6IGdyaWROYW1lLCBcclxuICAgICAgICAgICAgY29sdW1uczogWyAgICAgICAgICAgICAgICBcclxuICAgICAgICAgICAgICAgIC8veyBmaWVsZDogJ2ZuYW1lJywgY2FwdGlvbjogJ0ZpcnN0IE5hbWUnLCBzaXplOiAnMzAlJyB9LFxyXG4gICAgICAgICAgICAgICAge2ZpZWxkOiAnYWRkcmVzcycsIGNhcHRpb246ICdBZGRyZXNzJywgc2l6ZTogJzgwcHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MwJywgY2FwdGlvbjogJzAwJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MxJywgY2FwdGlvbjogJzAxJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MyJywgY2FwdGlvbjogJzAyJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MzJywgY2FwdGlvbjogJzAzJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M0JywgY2FwdGlvbjogJzA0Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M1JywgY2FwdGlvbjogJzA1Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M2JywgY2FwdGlvbjogJzA2Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M3JywgY2FwdGlvbjogJzA3Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M4JywgY2FwdGlvbjogJzA4Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2M5JywgY2FwdGlvbjogJzA5Jywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MxMCcsIGNhcHRpb246ICcwQScsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMTEnLCBjYXB0aW9uOiAnMEInLCBzaXplOiAnMjVweCd9LFxyXG4gICAgICAgICAgICAgICAge2ZpZWxkOiAnYzEyJywgY2FwdGlvbjogJzBDJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2MxMycsIGNhcHRpb246ICcwRCcsIHNpemU6ICcyNXB4J30sXHJcbiAgICAgICAgICAgICAgICB7ZmllbGQ6ICdjMTQnLCBjYXB0aW9uOiAnMEUnLCBzaXplOiAnMjVweCd9LFxyXG4gICAgICAgICAgICAgICAge2ZpZWxkOiAnYzE1JywgY2FwdGlvbjogJzBGJywgc2l6ZTogJzI1cHgnfSxcclxuICAgICAgICAgICAgICAgIHtmaWVsZDogJ2FzY2lpJywgY2FwdGlvbjogJ0FTQ0lJJywgc2l6ZTogJzE0MHB4Jywgc3R5bGUgOiAnZm9udC1mYW1pbHk6bW9ub3NwYWNlJ30sXHJcbiAgICAgICAgICAgIF0sXHJcbiAgICAgICAgfVxyXG4gICAgKTtcclxuXHJcbiAgICAvL0JyZWFrdXAgdGhlIHdvcmsgaW50byBzbGljZXMgb2YgMTBrQiBmb3IgcGVyZm9ybWFuY2VcclxuICAgIGxldCBieXRlQXJyYXlTbGljZSA9IFtdO1xyXG4gICAgZm9yIChsZXQgcG9zID0gMDsgcG9zIDwgYnl0ZUFycmF5Lmxlbmd0aDsgcG9zICs9IGxvb3BDaHVua1NpemUpIHtcclxuICAgICAgICBieXRlQXJyYXlTbGljZS5wdXNoKGJ5dGVBcnJheS5zbGljZShwb3MsIHBvcyArIGxvb3BDaHVua1NpemUpKTtcclxuICAgIH1cclxuXHJcbiAgICBsZXQgbG9vcENvdW50ID0gMDtcclxuICAgIGxldCByZWNvcmRzID0gW107XHJcbiAgICBsZXQgbG9vcEZ1bmMgPSBzZXRJbnRlcnZhbCgoKSA9PiB7XHJcbiAgICAgICAgbGV0IGJ5dGVBcnJheUl0ZW0gPSBieXRlQXJyYXlTbGljZVtsb29wQ291bnRdO1xyXG4gICAgICAgIC8vSWYgdGhlcmUgaXMgbm8gbW9yZSB3b3JrIHdlIGNsZWFyIHRoZSBsb29wIGFuZCBjYWxsYmFja1xyXG4gICAgICAgIGlmIChieXRlQXJyYXlJdGVtID09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgICAgICBjbGVhckludGVydmFsKGxvb3BGdW5jKTtcclxuICAgICAgICAgICAgZ3JpZC5yZWNvcmRzID0gcmVjb3JkcztcclxuICAgICAgICAgICAgZ3JpZC5yZWZyZXNoKCk7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrKGdyaWQpO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL1dvcmsgd2l0aCBsaW5lcyBvZiAxNiBieXRlc1xyXG4gICAgICAgIGZvciAobGV0IHBvcyA9IDA7IHBvcyA8IGJ5dGVBcnJheUl0ZW0ubGVuZ3RoOyBwb3MgKz0gMTYpIHtcclxuICAgICAgICAgICAgbGV0IHdvcmtTbGljZSA9IGJ5dGVBcnJheUl0ZW0uc2xpY2UocG9zLCBwb3MgKyAxNik7XHJcbiAgICAgICAgICAgIGxldCBhc2NpaUxpbmUgPSBcIlwiO1xyXG4gICAgICAgICAgICBsZXQgYWRkcmVzcyA9IE51bWJlcihwb3MgKyAobG9vcENvdW50ICogbG9vcENodW5rU2l6ZSkpLnRvU3RyaW5nKDE2KTtcclxuICAgICAgICAgICAgYWRkcmVzcyA9IGFkZHJlc3MubGVuZ3RoICE9IDggPyAnMCcucmVwZWF0KDggLSBhZGRyZXNzLmxlbmd0aCkgKyBhZGRyZXNzIDogYWRkcmVzcztcclxuICAgICAgICAgICAgbGV0IGxpbmUgPSB7XHJcbiAgICAgICAgICAgICAgICBhZGRyZXNzOmFkZHJlc3MsXHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIC8vSXRlcmF0ZSB0aHJvdWdoIGVhY2ggYnl0ZSBvZiB0aGUgMTZieXRlcyBsaW5lXHJcbiAgICAgICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgMTY7IGkrKykge1xyXG4gICAgICAgICAgICAgICAgbGV0IGJ5dGUgPSB3b3JrU2xpY2VbaV07XHJcbiAgICAgICAgICAgICAgICBsZXQgYnl0ZUhleENvZGU7XHJcbiAgICAgICAgICAgICAgICBpZiAoYnl0ZSAhPSB1bmRlZmluZWQpIHtcclxuICAgICAgICAgICAgICAgICAgICBieXRlSGV4Q29kZSA9IGJ5dGUudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBieXRlSGV4Q29kZS5sZW5ndGggPT0gMSA/IFwiMFwiICsgYnl0ZUhleENvZGUgOiBieXRlSGV4Q29kZTtcclxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgICAgICAgICAgYnl0ZUhleENvZGUgPSBcIiAgXCI7XHJcbiAgICAgICAgICAgICAgICB9XHJcblxyXG4gICAgICAgICAgICAgICAgbGluZVsnYycraV0gPSBieXRlSGV4Q29kZTtcclxuXHJcbiAgICAgICAgICAgICAgICBsZXQgYXNjaWlDb2RlID0gYnl0ZSA/IFN0cmluZy5mcm9tQ2hhckNvZGUoYnl0ZSkgOiBcIiBcIjtcclxuICAgICAgICAgICAgICAgIGFzY2lpQ29kZSA9IEFTQ0lJLmluY2x1ZGVzKGFzY2lpQ29kZSkgPyBhc2NpaUNvZGUgOiBcIi5cIjtcclxuICAgICAgICAgICAgICAgIGFzY2lpTGluZSArPSBhc2NpaUNvZGU7XHJcbiAgICAgICAgICAgIH1cclxuXHJcbiAgICAgICAgICAgIGxpbmUuYXNjaWkgPSBhc2NpaUxpbmU7XHJcbiAgICAgICAgICAgIHJlY29yZHMucHVzaChsaW5lKTtcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIGxvb3BDb3VudCArPSAxO1xyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbi8vVGhpcyBzcGVjaWFsIGZvckVhY2ggaGF2ZSBhbiBhZGRpdGlvbmFsIHBhcmFtZXRlciB0byBhZGQgYSBzZXRUaW1lb3V0KDEpIGJldHdlZW4gZWFjaCBcImNodW5rU2l6ZVwiIGl0ZW1zXHJcbmZ1bmN0aW9uIGFzeW5jRm9yRWFjaChhcnJheSwgY2h1bmtTaXplLCBmbikge1xyXG4gICAgbGV0IHdvcmtBcnJheSA9IFtdO1xyXG4gICAgLy9TbGljZSB1cCB0aGUgYXJyYXkgaW50byB3b3JrIGFycmF5IGZvciBzeW5jaHJvbm91cyBjYWxsXHJcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGFycmF5LnNpemU7IGkgKz0gY2h1bmtTaXplKSB7XHJcbiAgICAgICAgd29ya0FycmF5LnB1c2goYXJyYXkuc2xpY2UoaSwgaSArIGNodW5rU2l6ZSkpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vTG9vcGNvdW50IGlzIHRoZSBhbW91bnQgb2YgdGltZXMgY2h1bmtTaXplIGhhdmUgYmVlbiByZWFjaGVkXHJcbiAgICBsZXQgbG9vcGNvdW50ID0gMDtcclxuICAgIGxldCBpbnRlcnZhbCA9IHNldEludGVydmFsKCgpID0+IHtcclxuICAgICAgICAvL0l0ZXJhdGUgdGhyb3VnaCB0aGUgY2h1bmtcclxuICAgICAgICBmb3IgKGxldCBpbmRleCBpbiB3b3JrQXJyYXkpIHtcclxuICAgICAgICAgICAgbGV0IGl0ZW0gPSB3b3JrQXJyYXlbaW5kZXhdO1xyXG4gICAgICAgICAgICBsZXQgaW5kZXggPSBpbmRleCArIChsb29wY291bnQgKiBjaHVua1NpemUpO1xyXG4gICAgICAgICAgICBmbihpdGVtLCBpbmRleCk7XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICAvL0NoZWNrIGlmIHRoZXJlIGlzIG1vcmUgd29yayBvciBub3RcclxuICAgICAgICBsb29wY291bnQgKz0gMTtcclxuICAgICAgICBpZiAobG9vcGNvdW50ID09IHdvcmtBcnJheS5sZW5ndGgpIHtcclxuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChpbnRlcnZhbCk7XHJcbiAgICAgICAgfVxyXG4gICAgfSwgMSk7XHJcbn1cclxuXHJcbm1vZHVsZS5leHBvcnRzID0ge1xyXG4gICAgZXhwb3J0U2NlbmU6IGV4cG9ydFNjZW5lLFxyXG4gICAgc2F2ZURhdGE6IHNhdmVEYXRhLFxyXG4gICAgZ2VuZXJhdGVIZXhUYWJsZTogZ2VuZXJhdGVIZXhUYWJsZVxyXG59IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIENudGNWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcImNudGNWaWV3XCIsIFwiQ29udGVudFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldHVwKCkge1xuICAgICAgICAkKHRoaXMuZ2V0T3V0cHV0SWQodHJ1ZSkpLmhlaWdodCgnNzAlJykudzJsYXlvdXQoe1xuICAgICAgICAgICAgbmFtZTogJ2NudGNMYXlvdXQnLFxuICAgICAgICAgICAgcGFuZWxzOiBbe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdtYWluJywgc2l6ZTogJzUwJScsIHJlc2l6YWJsZTogdHJ1ZSBcbiAgICAgICAgICAgIH0sIHtcbiAgICAgICAgICAgICAgICB0eXBlOiAncHJldmlldycsIHNpemU6ICc1MCUnLCByZXNpemFibGU6IHRydWVcbiAgICAgICAgICAgIH1dXG4gICAgICAgIH0pO1xuICAgICAgICB3MnVpLmNudGNMYXlvdXQuY29udGVudCgnbWFpbicsICQoKS53MmdyaWQoe1xuICAgICAgICAgICAgbmFtZTogJ2NvbnRlbnRMaXN0JyxcbiAgICAgICAgICAgIHNob3c6IHtcbiAgICAgICAgICAgICAgICB0b29sYmFyOiB0cnVlLFxuICAgICAgICAgICAgICAgIHRvb2xiYXJTZWFyY2g6IHRydWUsXG4gICAgICAgICAgICAgICAgdG9vbGJhclJlbG9hZDogZmFsc2UsXG4gICAgICAgICAgICAgICAgdG9vbGJhckNvbHVtbnM6IGZhbHNlLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIG11bHRpU2VhcmNoOiBmYWxzZSxcbiAgICAgICAgICAgIGNvbHVtbnM6IFt7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiAncmVjaWQnLFxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiAnRW50cnkgaW5kZXgnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnMTAlJyxcbiAgICAgICAgICAgICAgICAgICAgc2VhcmNoYWJsZTogXCJpbnRcIlxuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3R5cGUnLFxuICAgICAgICAgICAgICAgICAgICBjYXB0aW9uOiAnVHlwZScsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6ICcxMCUnLFxuICAgICAgICAgICAgICAgICAgICBzZWFyY2hhYmxlOiBcImludFwiXG4gICAgICAgICAgICAgICAgfSx7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiAnc2l6ZScsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdFbnRyeSBzaXplJyxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogJzEwJSdcbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICduYW1lc3BhY2VJbmRleCcsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdOYW1lc3BhY2UnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnMTAlJ1xuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3Jvb3RJbmRleCcsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdSb290IGluZGV4JyxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogJzEwJSdcbiAgICAgICAgICAgICAgICB9LHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICdndWlkJyxcbiAgICAgICAgICAgICAgICAgICAgY2FwdGlvbjogJ0dVSUQnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnMTAlJ1xuICAgICAgICAgICAgICAgIH0se1xuICAgICAgICAgICAgICAgICAgICBmaWVsZDogJ3VpZCcsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdVSUQnLFxuICAgICAgICAgICAgICAgICAgICBzaXplOiAnMTAlJ1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgcmVjb3JkczogW10sXG4gICAgICAgICAgICBvbkNsaWNrOiBmdW5jdGlvbihldmVudCl7XG4gICAgICAgICAgICAgICAgJCgpLncyZGVzdHJveSgnY250Y0VudHJ5Q2h1bmsnKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVjb3JkID0gdzJ1aS5jb250ZW50TGlzdC5yZWNvcmRzW2V2ZW50LnJlY2lkXTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZWNvcmQpO1xuICAgICAgICAgICAgICAgIFV0aWxzLmdlbmVyYXRlSGV4VGFibGUocmVjb3JkLmNvbnRlbnRTbGljZSwgJ2NudGNFbnRyeUNodW5rJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgdzJ1aS5jbnRjTGF5b3V0LmNvbnRlbnQoJ3ByZXZpZXcnLCB3MnVpLmNudGNFbnRyeUNodW5rKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkpXG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcbiAgICAgICAgdzJ1aS5jb250ZW50TGlzdC5zZWFyY2hSZXNldCgpO1xuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgICAgICBsZXQgbWFpbkNodW5rID0gcGFja2ZpbGUuY2h1bmtzWzBdLmRhdGE7XG4gICAgICAgICAgICBsZXQgZW50cnlBcnJheSA9IFtdO1xuXG4gICAgICAgICAgICAkKCkudzJkZXN0cm95KCdjbnRjRW50cnlDaHVuaycpO1xuXG4gICAgICAgICAgICBjb25zdCBlbnRyaWVzQW1vdW50ID0gbWFpbkNodW5rLmluZGV4RW50cmllcy5sZW5ndGg7XG4gICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVudHJpZXNBbW91bnQ7IGkrKykge1xuICAgICAgICAgICAgICAgIGxldCBiZWdpbiA9IG1haW5DaHVuay5pbmRleEVudHJpZXNbaV0ub2Zmc2V0O1xuICAgICAgICAgICAgICAgIGxldCBlbmQgPSBtYWluQ2h1bmsuaW5kZXhFbnRyaWVzW2kgKyAxXSA/XG4gICAgICAgICAgICAgICAgICAgIG1haW5DaHVuay5pbmRleEVudHJpZXNbaSArIDFdLm9mZnNldCA6IG1haW5DaHVuay5jb250ZW50Lmxlbmd0aDtcbiAgICAgICAgICAgICAgICBsZXQgY29udGVudFNsaWNlID0gbWFpbkNodW5rLmNvbnRlbnQuc2xpY2UoYmVnaW4sIGVuZCk7XG4gICAgICAgICAgICAgICAgbGV0IGVudHJ5ID0ge1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBtYWluQ2h1bmsuaW5kZXhFbnRyaWVzW2ldLnR5cGUsXG4gICAgICAgICAgICAgICAgICAgIHJvb3RJbmRleDogbWFpbkNodW5rLmluZGV4RW50cmllc1tpXS5yb290SW5kZXgsXG4gICAgICAgICAgICAgICAgICAgIG5hbWVzcGFjZUluZGV4OiBtYWluQ2h1bmsuaW5kZXhFbnRyaWVzW2ldLm5hbWVzcGFjZUluZGV4LFxuICAgICAgICAgICAgICAgICAgICBjb250ZW50U2xpY2U6IGNvbnRlbnRTbGljZSxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogY29udGVudFNsaWNlLmxlbmd0aCxcbiAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IGVudHJ5QXJyYXkubGVuZ3RoLFxuICAgICAgICAgICAgICAgICAgICBndWlkOiBjb250ZW50U2xpY2UubGVuZ3RoID4gMTUgPyBwYXJzZUd1aWQoY29udGVudFNsaWNlKSA6IHVuZGVmaW5lZFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbnRyeUFycmF5LnB1c2goZW50cnkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdzJ1aS5jb250ZW50TGlzdC5yZWNvcmRzID0gZW50cnlBcnJheTtcbiAgICAgICAgICAgIHcydWkuY29udGVudExpc3QucmVmcmVzaCgpO1xuICAgICAgICAgICAgdzJ1aS5jbnRjTGF5b3V0LnNob3coJ21haW4nKTtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlICYmIHBhY2tmaWxlLmhlYWRlci50eXBlID09ICdjbnRjJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBjbGVhbigpIHtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHBhcnNlR3VpZCh1YXJyKXtcbiAgICBmdW5jdGlvbiBoZXhudW0obnVtKXtcbiAgICAgICAgcmV0dXJuIG51bS50b1N0cmluZygxNikubGVuZ3RoID09IDIgPyBudW0udG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCkgOiAnMCcgKyBudW0udG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG4gICAgfVxuICAgIHJldHVybiAnJyArIGhleG51bSh1YXJyWzNdKSArIGhleG51bSh1YXJyWzJdKSArIGhleG51bSh1YXJyWzFdKSArIGhleG51bSh1YXJyWzBdKVxuICAgICAgICArICctJyArIGhleG51bSh1YXJyWzVdKSArIGhleG51bSh1YXJyWzRdKVxuICAgICAgICArICctJyArIGhleG51bSh1YXJyWzddKSArIGhleG51bSh1YXJyWzZdKVxuICAgICAgICArICctJyArIGhleG51bSh1YXJyWzhdKSArIGhleG51bSh1YXJyWzldKVxuICAgICAgICArICctJyArIGhleG51bSh1YXJyWzEwXSkgKyBoZXhudW0odWFyclsxMV0pICsgaGV4bnVtKHVhcnJbMTJdKSArIGhleG51bSh1YXJyWzEzXSkgKyBoZXhudW0odWFyclsxNF0pICArIGhleG51bSh1YXJyWzE1XSkgXG59XG5cbm1vZHVsZS5leHBvcnRzID0gQ250Y1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgSGVhZFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwiaGVhZFZpZXdcIiwgXCJPdmVydmlld1wiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHNldHVwKCkge1xuICAgICAgICAkKCcjaGVhZEdyaWQnKS53MmdyaWQoe1xuICAgICAgICAgICAgbmFtZTogJ092ZXJ2aWV3JyxcbiAgICAgICAgICAgIGNvbHVtbnM6IFt7XG4gICAgICAgICAgICAgICAgICAgIGZpZWxkOiAndHlwZScsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdUeXBlJyxcbiAgICAgICAgICAgICAgICAgICAgc2l6ZTogJzUwJSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgZmllbGQ6ICd2YWx1ZScsXG4gICAgICAgICAgICAgICAgICAgIGNhcHRpb246ICdWYWx1ZScsXG4gICAgICAgICAgICAgICAgICAgIHNpemU6ICc1MCUnXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICByZWNvcmRzOiBbXVxuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG4gICAgICAgICAgICBsZXQgcmF3ID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG5cbiAgICAgICAgICAgIHZhciBkcyA9IG5ldyBEYXRhU3RyZWFtKHJhdyk7XG4gICAgICAgICAgICB2YXIgZmlyc3Q0ID0gZHMucmVhZENTdHJpbmcoNCk7XG5cbiAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuaHRtbChcIlwiKTtcbiAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuYXBwZW5kKCc8ZGl2IGlkPVwiaGVhZEdyaWRcIiBzdHlsZT1cImhlaWdodDogOTAlXCI+PC9kaXY+Jyk7XG5cbiAgICAgICAgICAgIHcydWlbJ092ZXJ2aWV3J10ucmVjb3JkcyA9IFt7XG4gICAgICAgICAgICAgICAgICAgIHJlY2lkOiAxLFxuICAgICAgICAgICAgICAgICAgICB0eXBlOiAnRmlsZSBJRCcsXG4gICAgICAgICAgICAgICAgICAgIHZhbHVlOiBmaWxlSWRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IDIsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGaWxlIHNpemUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogcmF3LmJ5dGVMZW5ndGhcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgcmVjaWQ6IDMsXG4gICAgICAgICAgICAgICAgICAgIHR5cGU6ICdGaWxlIHR5cGUnLFxuICAgICAgICAgICAgICAgICAgICB2YWx1ZTogZmlyc3Q0XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXTtcbiAgICAgICAgICAgIHcydWlbJ092ZXJ2aWV3J10ucmVmcmVzaCgpO1xuXG4gICAgICAgICAgICB3MnVpWydPdmVydmlldyddLnJlbmRlcigkKCcjaGVhZEdyaWQnKVswXSk7XG5cbiAgICAgICAgICAgIC8vVE9ETzpcbiAgICAgICAgICAgIC8vTUZUIGluZGV4XG4gICAgICAgICAgICAvL0Jhc2VJZFxuICAgICAgICAgICAgLy9GaWxlVHlwZVxuICAgICAgICAgICAgLy9Db21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vVW5jb21wcmVzc2VkIHNpemVcbiAgICAgICAgICAgIC8vXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICAvL0hlYWR2aWV3ZXIgY2FuIHZpZXcgZXZlcnkgZmlsZVxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cblxuICAgIGNsZWFuKCkge1xuICAgICAgICB3MnVpWydPdmVydmlldyddLmRlbGV0ZSgpO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBIZWFkVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBIZXhhVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJoZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIC8vc3VwZXIoXCIjZmlsZVRhYnNIZXhWaWV3XCIsIFwiI2hleFZpZXdcIiwgXCJ0YWJIZXhWaWV3XCIsIFwiSGV4IFZpZXdcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcbiAgICAgICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgICAgICAkKHRoaXMuZ2V0T3V0cHV0SWQodHJ1ZSkpLmFwcGVuZCgnPGRpdiBpZD1cImhleGFHcmlkXCIgc3R5bGU9XCJoZWlnaHQ6IDkwJVwiPjwvZGl2PicpO1xuICAgICAgICAgICAgVXRpbHMuZ2VuZXJhdGVIZXhUYWJsZShyYXdEYXRhLCB0aGlzLmdldE91dHB1dElkKCksIChncmlkKSA9PiB7XG4gICAgICAgICAgICAgICAgZ3JpZC5yZW5kZXIoJChgI2hleGFHcmlkYCkpO1xuICAgICAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuc2hvdygpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpe1xuICAgICAgICAkKCkudzJkZXN0cm95KHRoaXMuZ2V0T3V0cHV0SWQoKSk7XG4gICAgfVxuXG4gICAgLy9IZXhhIHZpZXdlciBjYW4gdmlldyBldmVyeSBmaWxlXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IEhleGFWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIE1vZGVsVmlld2VyIGV4dGVuZHMgVmlld2VyIHtcbiAgICBjb25zdHJ1Y3RvcigpIHtcbiAgICAgICAgc3VwZXIoXCJtb2RlbFwiLCBcIk1vZGVsXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuXG4gICAgICAgICAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxuICAgICAgICAgICAgVDNELnJ1blJlbmRlcmVyKFxuICAgICAgICAgICAgICAgIFQzRC5TaW5nbGVNb2RlbFJlbmRlcmVyLFxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2xyLCB7XG4gICAgICAgICAgICAgICAgICAgIGlkOiBmaWxlSWRcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIEdsb2JhbHMuX2NvbnRleHQsXG4gICAgICAgICAgICAgICAgKCkgPT4ge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9uUmVuZGVyZXJEb25lTW9kZWwoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICApO1xuXG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICBjbGVhbigpIHtcbiAgICAgICAgLy8vIFJlbW92ZSBvbGQgbW9kZWxzIGZyb20gdGhlIHNjZW5lXG4gICAgICAgIGlmIChHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgIGZvciAobGV0IG1kbCBvZiBHbG9iYWxzLl9tb2RlbHMpIHtcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9zY2VuZS5yZW1vdmUobWRsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cblxuICAgIGNhblZpZXcoKSB7XG4gICAgICAgIGxldCBwYWNrZmlsZSA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlXCIpO1xuICAgICAgICBpZiAocGFja2ZpbGUgJiYgcGFja2ZpbGUuaGVhZGVyLnR5cGUgPT0gJ01PREwnKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIG92ZXJyaWRlRGVmYXVsdCgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY2FuVmlldygpO1xuICAgIH1cblxuICAgIG9uUmVuZGVyZXJEb25lTW9kZWwoKSB7XG5cbiAgICAgICAgJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS5zaG93KCk7XG5cbiAgICAgICAgLy8vIFJlLWZpdCBjYW52YXNcbiAgICAgICAgR2xvYmFscy5fb25DYW52YXNSZXNpemUoKTtcblxuICAgICAgICAvLy8gQWRkIGNvbnRleHQgdG9vbGJhciBleHBvcnQgYnV0dG9uXG4gICAgICAgICQoXCIjY29udGV4dFRvb2xiYXJcIikuYXBwZW5kKFxuICAgICAgICAgICAgJChcIjxidXR0b24+RXhwb3J0IHNjZW5lPC9idXR0b24+XCIpXG4gICAgICAgICAgICAuY2xpY2soVXRpbHMuZXhwb3J0U2NlbmUpXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8vIFJlYWQgdGhlIG5ldyBtb2RlbHNcbiAgICAgICAgR2xvYmFscy5fbW9kZWxzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU2luZ2xlTW9kZWxSZW5kZXJlciwgXCJtZXNoZXNcIiwgW10pO1xuXG4gICAgICAgIC8vLyBLZWVwaW5nIHRyYWNrIG9mIHRoZSBiaWdnZXN0IG1vZGVsIGZvciBsYXRlclxuICAgICAgICB2YXIgYmlnZ2VzdE1kbCA9IG51bGw7XG5cbiAgICAgICAgLy8vIEFkZCBhbGwgbW9kZWxzIHRvIHRoZSBzY2VuZVxuICAgICAgICBmb3IgKGxldCBtb2RlbCBvZiBHbG9iYWxzLl9tb2RlbHMpIHtcblxuICAgICAgICAgICAgLy8vIEZpbmQgdGhlIGJpZ2dlc3QgbW9kZWwgZm9yIGNhbWVyYSBmb2N1cy9maXR0aW5nXG4gICAgICAgICAgICBpZiAoIWJpZ2dlc3RNZGwgfHwgYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgPCBtb2RlbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMpIHtcbiAgICAgICAgICAgICAgICBiaWdnZXN0TWRsID0gbW9kZWw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChtb2RlbCk7XG4gICAgICAgIH1cblxuICAgICAgICAvLy8gUmVzZXQgYW55IHpvb20gYW5kIHRyYW5zYWx0aW9uL3JvdGF0aW9uIGRvbmUgd2hlbiB2aWV3aW5nIGVhcmxpZXIgbW9kZWxzLlxuICAgICAgICBHbG9iYWxzLl9jb250cm9scy5yZXNldCgpO1xuXG4gICAgICAgIC8vLyBGb2N1cyBjYW1lcmEgdG8gdGhlIGJpZ2VzdCBtb2RlbCwgZG9lc24ndCB3b3JrIGdyZWF0LlxuICAgICAgICB2YXIgZGlzdCA9IChiaWdnZXN0TWRsICYmIGJpZ2dlc3RNZGwuYm91bmRpbmdTcGhlcmUpID8gYmlnZ2VzdE1kbC5ib3VuZGluZ1NwaGVyZS5yYWRpdXMgLyBNYXRoLnRhbihNYXRoLlBJICogNjAgLyAzNjApIDogMTAwO1xuICAgICAgICBkaXN0ID0gMS4yICogTWF0aC5tYXgoMTAwLCBkaXN0KTtcbiAgICAgICAgZGlzdCA9IE1hdGgubWluKDEwMDAsIGRpc3QpO1xuICAgICAgICBHbG9iYWxzLl9jYW1lcmEucG9zaXRpb24uem9vbSA9IDE7XG4gICAgICAgIEdsb2JhbHMuX2NhbWVyYS5wb3NpdGlvbi54ID0gZGlzdCAqIE1hdGguc3FydCgyKTtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnkgPSA1MDtcbiAgICAgICAgR2xvYmFscy5fY2FtZXJhLnBvc2l0aW9uLnogPSAwO1xuXG5cbiAgICAgICAgaWYgKGJpZ2dlc3RNZGwpXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEubG9va0F0KGJpZ2dlc3RNZGwucG9zaXRpb24pO1xuICAgIH1cblxuXG4gICAgc2V0dXAoKSB7XG4gICAgICAgIC8vLyBTZXR0aW5nIHVwIGEgc2NlbmUsIFRyZWUuanMgc3RhbmRhcmQgc3R1ZmYuLi5cbiAgICAgICAgdmFyIGNhbnZhc1dpZHRoID0gJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS53aWR0aCgpO1xuICAgICAgICB2YXIgY2FudmFzSGVpZ2h0ID0gJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS5oZWlnaHQoKTtcbiAgICAgICAgdmFyIGNhbnZhc0NsZWFyQ29sb3IgPSAweDM0MjkyMDsgLy8gRm9yIGhhcHB5IHJlbmRlcmluZywgYWx3YXlzIHVzZSBWYW4gRHlrZSBCcm93bi5cbiAgICAgICAgdmFyIGZvdiA9IDYwO1xuICAgICAgICB2YXIgYXNwZWN0ID0gMTtcbiAgICAgICAgdmFyIG5lYXIgPSAwLjE7XG4gICAgICAgIHZhciBmYXIgPSA1MDAwMDA7XG5cbiAgICAgICAgR2xvYmFscy5fb25DYW52YXNSZXNpemUgPSAoKSA9PiB7XG5cbiAgICAgICAgICAgIHZhciBzY2VuZVdpZHRoID0gJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS53aWR0aCgpO1xuICAgICAgICAgICAgdmFyIHNjZW5lSGVpZ2h0ID0gJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS5oZWlnaHQoKTtcblxuICAgICAgICAgICAgaWYgKCFzY2VuZUhlaWdodCB8fCAhc2NlbmVXaWR0aClcbiAgICAgICAgICAgICAgICByZXR1cm47XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX2NhbWVyYS5hc3BlY3QgPSBzY2VuZVdpZHRoIC8gc2NlbmVIZWlnaHQ7XG5cbiAgICAgICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyLnNldFNpemUoc2NlbmVXaWR0aCwgc2NlbmVIZWlnaHQpO1xuXG4gICAgICAgICAgICBHbG9iYWxzLl9jYW1lcmEudXBkYXRlUHJvamVjdGlvbk1hdHJpeCgpO1xuICAgICAgICB9XG5cbiAgICAgICAgR2xvYmFscy5fY2FtZXJhID0gbmV3IFRIUkVFLlBlcnNwZWN0aXZlQ2FtZXJhKGZvdiwgYXNwZWN0LCBuZWFyLCBmYXIpO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZSA9IG5ldyBUSFJFRS5TY2VuZSgpO1xuXG4gICAgICAgIC8vLyBUaGlzIHNjZW5lIGhhcyBvbmUgYW1iaWVudCBsaWdodCBzb3VyY2UgYW5kIHRocmVlIGRpcmVjdGlvbmFsIGxpZ2h0c1xuICAgICAgICB2YXIgYW1iaWVudExpZ2h0ID0gbmV3IFRIUkVFLkFtYmllbnRMaWdodCgweDU1NTU1NSk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChhbWJpZW50TGlnaHQpO1xuXG4gICAgICAgIHZhciBkaXJlY3Rpb25hbExpZ2h0MSA9IG5ldyBUSFJFRS5EaXJlY3Rpb25hbExpZ2h0KDB4ZmZmZmZmLCAuOCk7XG4gICAgICAgIGRpcmVjdGlvbmFsTGlnaHQxLnBvc2l0aW9uLnNldCgwLCAwLCAxKTtcbiAgICAgICAgR2xvYmFscy5fc2NlbmUuYWRkKGRpcmVjdGlvbmFsTGlnaHQxKTtcblxuICAgICAgICB2YXIgZGlyZWN0aW9uYWxMaWdodDIgPSBuZXcgVEhSRUUuRGlyZWN0aW9uYWxMaWdodCgweGZmZmZmZiwgLjgpO1xuICAgICAgICBkaXJlY3Rpb25hbExpZ2h0Mi5wb3NpdGlvbi5zZXQoMSwgMCwgMCk7XG4gICAgICAgIEdsb2JhbHMuX3NjZW5lLmFkZChkaXJlY3Rpb25hbExpZ2h0Mik7XG5cbiAgICAgICAgdmFyIGRpcmVjdGlvbmFsTGlnaHQzID0gbmV3IFRIUkVFLkRpcmVjdGlvbmFsTGlnaHQoMHhmZmZmZmYsIC44KTtcbiAgICAgICAgZGlyZWN0aW9uYWxMaWdodDMucG9zaXRpb24uc2V0KDAsIDEsIDApO1xuICAgICAgICBHbG9iYWxzLl9zY2VuZS5hZGQoZGlyZWN0aW9uYWxMaWdodDMpO1xuXG4gICAgICAgIC8vLyBTdGFuZGFyZCBUSFJFRSByZW5kZXJlciB3aXRoIEFBXG4gICAgICAgIEdsb2JhbHMuX3JlbmRlcmVyID0gbmV3IFRIUkVFLldlYkdMUmVuZGVyZXIoe1xuICAgICAgICAgICAgYW50aWFsaWFzaW5nOiB0cnVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSlbMF0uYXBwZW5kQ2hpbGQoR2xvYmFscy5fcmVuZGVyZXIuZG9tRWxlbWVudCk7XG5cbiAgICAgICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0U2l6ZShjYW52YXNXaWR0aCwgY2FudmFzSGVpZ2h0KTtcbiAgICAgICAgR2xvYmFscy5fcmVuZGVyZXIuc2V0Q2xlYXJDb2xvcihjYW52YXNDbGVhckNvbG9yKTtcblxuICAgICAgICAvLy8gQWRkIFRIUkVFIG9yYml0IGNvbnRyb2xzLCBmb3Igc2ltcGxlIG9yYml0aW5nLCBwYW5uaW5nIGFuZCB6b29taW5nXG4gICAgICAgIEdsb2JhbHMuX2NvbnRyb2xzID0gbmV3IFRIUkVFLk9yYml0Q29udHJvbHMoR2xvYmFscy5fY2FtZXJhLCBHbG9iYWxzLl9yZW5kZXJlci5kb21FbGVtZW50KTtcbiAgICAgICAgR2xvYmFscy5fY29udHJvbHMuZW5hYmxlWm9vbSA9IHRydWU7XG5cbiAgICAgICAgLy8vIFNlbXMgdzJ1aSBkZWxheXMgcmVzaXppbmcgOi9cbiAgICAgICAgJCh3aW5kb3cpLnJlc2l6ZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KEdsb2JhbHMuX29uQ2FudmFzUmVzaXplLCAxMClcbiAgICAgICAgfSk7XG5cbiAgICAgICAgLy8vIE5vdGU6IGNvbnN0YW50IGNvbnRpbm91cyByZW5kZXJpbmcgZnJvbSBwYWdlIGxvYWQgZXZlbnQsIG5vdCB2ZXJ5IG9wdC5cbiAgICAgICAgcmVuZGVyKCk7XG4gICAgfVxufVxuXG4vLy8gUmVuZGVyIGxvb3AsIG5vIGdhbWUgbG9naWMsIGp1c3QgcmVuZGVyaW5nLlxuZnVuY3Rpb24gcmVuZGVyKCkge1xuICAgIHdpbmRvdy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVuZGVyKTtcbiAgICBHbG9iYWxzLl9yZW5kZXJlci5yZW5kZXIoR2xvYmFscy5fc2NlbmUsIEdsb2JhbHMuX2NhbWVyYSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gTW9kZWxWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIFBhY2tWaWV3ZXIgZXh0ZW5kcyBWaWV3ZXIge1xuICAgIGNvbnN0cnVjdG9yKCkge1xuICAgICAgICBzdXBlcihcInBhY2tcIiwgXCJQYWNrIGZpbGVcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG5cbiAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuaHRtbChcIlwiKTtcbiAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuYXBwZW5kKCQoXCI8aDI+XCIgKyB0aGlzLm5hbWUgKyBcIjwvaDI+XCIpKTtcblxuICAgICAgICAgICAgZm9yIChsZXQgY2h1bmsgb2YgcGFja2ZpbGUuY2h1bmtzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpZWxkID0gJChcIjxmaWVsZHNldCAvPlwiKTtcbiAgICAgICAgICAgICAgICB2YXIgbGVnZW5kID0gJChcIjxsZWdlbmQ+XCIgKyBjaHVuay5oZWFkZXIudHlwZSArIFwiPC9sZWdlbmQ+XCIpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGxvZ0J1dHRvbiA9ICQoXCI8YnV0dG9uPkxvZyBDaHVuayBEYXRhIHRvIENvbnNvbGU8L2J1dHRvbj5cIik7XG4gICAgICAgICAgICAgICAgbG9nQnV0dG9uLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIFwiTG9nZ2luZ1wiLCBjaHVuay5oZWFkZXIudHlwZSwgXCJjaHVua1wiKTtcbiAgICAgICAgICAgICAgICAgICAgVDNELkxvZ2dlci5sb2coVDNELkxvZ2dlci5UWVBFX01FU1NBR0UsIGNodW5rLmRhdGEpO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKGxlZ2VuZCk7XG4gICAgICAgICAgICAgICAgZmllbGQuYXBwZW5kKCQoXCI8cD5TaXplOlwiICsgY2h1bmsuaGVhZGVyLmNodW5rRGF0YVNpemUgKyBcIjwvcD5cIikpO1xuICAgICAgICAgICAgICAgIGZpZWxkLmFwcGVuZChsb2dCdXR0b24pO1xuXG4gICAgICAgICAgICAgICAgJCh0aGlzLmdldE91dHB1dElkKHRydWUpKS5hcHBlbmQoZmllbGQpO1xuICAgICAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSkuc2hvdygpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHBhY2sgdGhlbiByZXR1cm4gdHJ1ZVxuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlKSB7XG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBQYWNrVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbmNvbnN0IFZpZXdlciA9IHJlcXVpcmUoXCIuL1ZpZXdlclwiKTtcbmNvbnN0IEdsb2JhbHMgPSByZXF1aXJlKFwiLi4vR2xvYmFsc1wiKTtcbmNvbnN0IFV0aWxzID0gcmVxdWlyZShcIi4uL1V0aWxzXCIpO1xuXG5jbGFzcyBTb3VuZFZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwic291bmRcIiwgXCJTb3VuZFwiKTtcbiAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBudWxsO1xuICAgIH1cblxuICAgIHJlbmRlcigpIHtcbiAgICAgICAgbGV0IGZpbGVJZCA9IEdsb2JhbHMuX2ZpbGVJZCA9IFQzRC5nZXRDb250ZXh0VmFsdWUoR2xvYmFscy5fY29udGV4dCwgVDNELkRhdGFSZW5kZXJlciwgXCJmaWxlSWRcIik7XG5cbiAgICAgICAgLy9GaXJzdCBjaGVjayBpZiB3ZSd2ZSBhbHJlYWR5IHJlbmRlcmVyIGl0XG4gICAgICAgIGlmICh0aGlzLmN1cnJlbnRSZW5kZXJJZCAhPSBmaWxlSWQpIHtcblxuICAgICAgICAgICAgbGV0IHBhY2tmaWxlID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVcIik7XG4gICAgICAgICAgICBsZXQgY2h1bmsgPSBwYWNrZmlsZS5nZXRDaHVuayhcIkFTTkRcIik7XG5cbiAgICAgICAgICAgIC8vLyBQcmludCBzb21lIHJhbmRvbSBkYXRhIGFib3V0IHRoaXMgc291bmRcbiAgICAgICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCh0cnVlKSlcbiAgICAgICAgICAgICAgICAuaHRtbChcbiAgICAgICAgICAgICAgICAgICAgXCJMZW5ndGg6IFwiICsgY2h1bmsuZGF0YS5sZW5ndGggKyBcIiBzZWNvbmRzPGJyLz5cIiArXG4gICAgICAgICAgICAgICAgICAgIFwiU2l6ZTogXCIgKyBjaHVuay5kYXRhLmF1ZGlvRGF0YS5sZW5ndGggKyBcIiBieXRlc1wiXG4gICAgICAgICAgICAgICAgKTtcblxuICAgICAgICAgICAgLy8vIEV4dHJhY3Qgc291bmQgZGF0YVxuICAgICAgICAgICAgdmFyIHNvdW5kVWludEFycmF5ID0gY2h1bmsuZGF0YS5hdWRpb0RhdGE7XG5cbiAgICAgICAgICAgICQoXCIjY29udGV4dFRvb2xiYXJcIilcbiAgICAgICAgICAgICAgICAuc2hvdygpXG4gICAgICAgICAgICAgICAgLmFwcGVuZChcbiAgICAgICAgICAgICAgICAgICAgJChcIjxidXR0b24+RG93bmxvYWQgTVAzPC9idXR0b24+XCIpXG4gICAgICAgICAgICAgICAgICAgIC5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICB2YXIgYmxvYiA9IG5ldyBCbG9iKFtzb3VuZFVpbnRBcnJheV0sIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiBcIm9jdGV0L3N0cmVhbVwiXG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgIFV0aWxzLnNhdmVEYXRhKGJsb2IsIGZpbGVOYW1lICsgXCIubXAzXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5QbGF5IE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soZnVuY3Rpb24gKCkge1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIUdsb2JhbHMuX2F1ZGlvQ29udGV4dCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvQ29udGV4dCA9IG5ldyBBdWRpb0NvbnRleHQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIFN0b3AgcHJldmlvdXMgc291bmRcbiAgICAgICAgICAgICAgICAgICAgICAgIHRyeSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBjYXRjaCAoZSkge31cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIENyZWF0ZSBuZXcgYnVmZmVyIGZvciBjdXJyZW50IHNvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZSA9IEdsb2JhbHMuX2F1ZGlvQ29udGV4dC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEdsb2JhbHMuX2F1ZGlvU291cmNlLmNvbm5lY3QoR2xvYmFscy5fYXVkaW9Db250ZXh0LmRlc3RpbmF0aW9uKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8vIERlY29kZSBhbmQgc3RhcnQgcGxheWluZ1xuICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Db250ZXh0LmRlY29kZUF1ZGlvRGF0YShzb3VuZFVpbnRBcnJheS5idWZmZXIsIGZ1bmN0aW9uIChyZXMpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBHbG9iYWxzLl9hdWRpb1NvdXJjZS5idWZmZXIgPSByZXM7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RhcnQoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICAuYXBwZW5kKFxuICAgICAgICAgICAgICAgICAgICAkKFwiPGJ1dHRvbj5TdG9wIE1QMzwvYnV0dG9uPlwiKVxuICAgICAgICAgICAgICAgICAgICAuY2xpY2soXG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgR2xvYmFscy5fYXVkaW9Tb3VyY2Uuc3RvcCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGUpIHt9XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIClcbiAgICAgICAgICAgICAgICApO1xuICAgICAgICAgICAgdGhpcy5jdXJyZW50UmVuZGVySWQgPSBmaWxlSWQ7XG4gICAgICAgIH1cblxuICAgICAgICAkKCcuZmlsZVRhYicpLmhpZGUoKTtcbiAgICAgICAgJCh0aGlzLmdldERvbVRhYklkKHRydWUpKS5zaG93KCk7XG4gICAgfVxuXG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICBsZXQgcGFja2ZpbGUgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZVwiKTtcbiAgICAgICAgaWYgKHBhY2tmaWxlICYmIHBhY2tmaWxlLmhlYWRlci50eXBlID09ICdBU05EJykge1xuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBvdmVycmlkZURlZmF1bHQoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNhblZpZXcoKTtcbiAgICB9XG59XG5cbm1vZHVsZS5leHBvcnRzID0gU291bmRWaWV3ZXI7IiwiLypcbkNvcHlyaWdodCDCqSBUeXJpYTNETGlicmFyeSBwcm9qZWN0IGNvbnRyaWJ1dG9yc1xuXG5UaGlzIGZpbGUgaXMgcGFydCBvZiB0aGUgVHlyaWEgM0QgTGlicmFyeS5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBmcmVlIHNvZnR3YXJlOiB5b3UgY2FuIHJlZGlzdHJpYnV0ZSBpdCBhbmQvb3IgbW9kaWZ5XG5pdCB1bmRlciB0aGUgdGVybXMgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGFzIHB1Ymxpc2hlZCBieVxudGhlIEZyZWUgU29mdHdhcmUgRm91bmRhdGlvbiwgZWl0aGVyIHZlcnNpb24gMyBvZiB0aGUgTGljZW5zZSwgb3JcbihhdCB5b3VyIG9wdGlvbikgYW55IGxhdGVyIHZlcnNpb24uXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZGlzdHJpYnV0ZWQgaW4gdGhlIGhvcGUgdGhhdCBpdCB3aWxsIGJlIHVzZWZ1bCxcbmJ1dCBXSVRIT1VUIEFOWSBXQVJSQU5UWTsgd2l0aG91dCBldmVuIHRoZSBpbXBsaWVkIHdhcnJhbnR5IG9mXG5NRVJDSEFOVEFCSUxJVFkgb3IgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UuICBTZWUgdGhlXG5HTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBmb3IgbW9yZSBkZXRhaWxzLlxuXG5Zb3Ugc2hvdWxkIGhhdmUgcmVjZWl2ZWQgYSBjb3B5IG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZVxuYWxvbmcgd2l0aCB0aGUgVHlyaWEgM0QgTGlicmFyeS4gSWYgbm90LCBzZWUgPGh0dHA6Ly93d3cuZ251Lm9yZy9saWNlbnNlcy8+LlxuKi9cblxuY29uc3QgVmlld2VyID0gcmVxdWlyZShcIi4vVmlld2VyXCIpO1xuY29uc3QgR2xvYmFscyA9IHJlcXVpcmUoXCIuLi9HbG9iYWxzXCIpO1xuY29uc3QgVXRpbHMgPSByZXF1aXJlKFwiLi4vVXRpbHNcIik7XG5cbmNsYXNzIFN0cmluZ1ZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwic3RyaW5nXCIsIFwiU3RyaW5nXCIpO1xuICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IG51bGw7XG4gICAgfVxuXG4gICAgcmVuZGVyKCkge1xuICAgICAgICBsZXQgZmlsZUlkID0gR2xvYmFscy5fZmlsZUlkID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcImZpbGVJZFwiKTtcblxuICAgICAgICAvL0ZpcnN0IGNoZWNrIGlmIHdlJ3ZlIGFscmVhZHkgcmVuZGVyZXIgaXRcbiAgICAgICAgaWYgKHRoaXMuY3VycmVudFJlbmRlcklkICE9IGZpbGVJZCkge1xuXG4gICAgICAgICAgICAvLy8gUnVuIHNpbmdsZSByZW5kZXJlclxuICAgICAgICAgICAgVDNELnJ1blJlbmRlcmVyKFxuICAgICAgICAgICAgICAgIFQzRC5TdHJpbmdSZW5kZXJlcixcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9sciwge1xuICAgICAgICAgICAgICAgICAgICBpZDogZmlsZUlkXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBHbG9iYWxzLl9jb250ZXh0LFxuICAgICAgICAgICAgICAgICgpID0+IHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vblJlbmRlcmVyRG9uZVN0cmluZygpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgKTtcblxuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cblxuICAgIGNsZWFuKCkge1xuXG4gICAgfVxuXG4gICAgY2FuVmlldygpIHtcbiAgICAgICAgLy9pZiBzdHJpbmcgZmlsZSB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIGxldCByYXdEYXRhID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuRGF0YVJlbmRlcmVyLCBcInJhd0RhdGFcIik7XG4gICAgICAgIGxldCBmY2MgPSBTdHJpbmcuZnJvbUNoYXJDb2RlKHJhd0RhdGFbMF0sIHJhd0RhdGFbMV0sIHJhd0RhdGFbMl0sIHJhd0RhdGFbM10pO1xuICAgICAgICBpZiAoZmNjID09PSAnc3RycycpIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gdGhpcy5jYW5WaWV3KCk7XG4gICAgfVxuXG4gICAgb25SZW5kZXJlckRvbmVTdHJpbmcoKSB7XG5cbiAgICAgICAgLy8vIFJlYWQgZGF0YSBmcm9tIHJlbmRlcmVyXG4gICAgICAgIGxldCBzdHJpbmdzID0gVDNELmdldENvbnRleHRWYWx1ZShHbG9iYWxzLl9jb250ZXh0LCBUM0QuU3RyaW5nUmVuZGVyZXIsIFwic3RyaW5nc1wiLCBbXSk7XG5cbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnJlY29yZHMgPSBzdHJpbmdzO1xuXG4gICAgICAgIHcydWkuc3RyaW5nR3JpZC5idWZmZXJlZCA9IHcydWkuc3RyaW5nR3JpZC5yZWNvcmRzLmxlbmd0aDtcbiAgICAgICAgdzJ1aS5zdHJpbmdHcmlkLnRvdGFsID0gdzJ1aS5zdHJpbmdHcmlkLmJ1ZmZlcmVkO1xuICAgICAgICB3MnVpLnN0cmluZ0dyaWQucmVmcmVzaCgpO1xuICAgIH1cbn1cblxuXG5tb2R1bGUuZXhwb3J0cyA9IFN0cmluZ1ZpZXdlcjsiLCIvKlxuQ29weXJpZ2h0IMKpIFR5cmlhM0RMaWJyYXJ5IHByb2plY3QgY29udHJpYnV0b3JzXG5cblRoaXMgZmlsZSBpcyBwYXJ0IG9mIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGZyZWUgc29mdHdhcmU6IHlvdSBjYW4gcmVkaXN0cmlidXRlIGl0IGFuZC9vciBtb2RpZnlcbml0IHVuZGVyIHRoZSB0ZXJtcyBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgYXMgcHVibGlzaGVkIGJ5XG50aGUgRnJlZSBTb2Z0d2FyZSBGb3VuZGF0aW9uLCBlaXRoZXIgdmVyc2lvbiAzIG9mIHRoZSBMaWNlbnNlLCBvclxuKGF0IHlvdXIgb3B0aW9uKSBhbnkgbGF0ZXIgdmVyc2lvbi5cblxuVHlyaWEgM0QgTGlicmFyeSBpcyBkaXN0cmlidXRlZCBpbiB0aGUgaG9wZSB0aGF0IGl0IHdpbGwgYmUgdXNlZnVsLFxuYnV0IFdJVEhPVVQgQU5ZIFdBUlJBTlRZOyB3aXRob3V0IGV2ZW4gdGhlIGltcGxpZWQgd2FycmFudHkgb2Zcbk1FUkNIQU5UQUJJTElUWSBvciBGSVRORVNTIEZPUiBBIFBBUlRJQ1VMQVIgUFVSUE9TRS4gIFNlZSB0aGVcbkdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlIGZvciBtb3JlIGRldGFpbHMuXG5cbllvdSBzaG91bGQgaGF2ZSByZWNlaXZlZCBhIGNvcHkgb2YgdGhlIEdOVSBHZW5lcmFsIFB1YmxpYyBMaWNlbnNlXG5hbG9uZyB3aXRoIHRoZSBUeXJpYSAzRCBMaWJyYXJ5LiBJZiBub3QsIHNlZSA8aHR0cDovL3d3dy5nbnUub3JnL2xpY2Vuc2VzLz4uXG4qL1xuXG5jb25zdCBWaWV3ZXIgPSByZXF1aXJlKFwiLi9WaWV3ZXJcIik7XG5jb25zdCBHbG9iYWxzID0gcmVxdWlyZShcIi4uL0dsb2JhbHNcIik7XG5jb25zdCBVdGlscyA9IHJlcXVpcmUoXCIuLi9VdGlsc1wiKTtcblxuY2xhc3MgVGV4dHVyZVZpZXdlciBleHRlbmRzIFZpZXdlciB7XG4gICAgY29uc3RydWN0b3IoKSB7XG4gICAgICAgIHN1cGVyKFwidGV4dHVyZVwiLCBcIlRleHR1cmVcIik7XG4gICAgICAgIHRoaXMuY3VycmVudFJlbmRlcklkID0gbnVsbDtcbiAgICB9XG5cbiAgICByZW5kZXIoKSB7XG4gICAgICAgIGxldCBmaWxlSWQgPSBHbG9iYWxzLl9maWxlSWQgPSBUM0QuZ2V0Q29udGV4dFZhbHVlKEdsb2JhbHMuX2NvbnRleHQsIFQzRC5EYXRhUmVuZGVyZXIsIFwiZmlsZUlkXCIpO1xuXG4gICAgICAgIC8vRmlyc3QgY2hlY2sgaWYgd2UndmUgYWxyZWFkeSByZW5kZXJlciBpdFxuICAgICAgICBpZiAodGhpcy5jdXJyZW50UmVuZGVySWQgIT0gZmlsZUlkKSB7XG5cblxuICAgICAgICAgICAgLy8vIERpc3BsYXkgYml0bWFwIG9uIGNhbnZhc1xuICAgICAgICAgICAgdmFyIGNhbnZhcyA9ICQoXCI8Y2FudmFzPlwiKTtcbiAgICAgICAgICAgIGNhbnZhc1swXS53aWR0aCA9IGltYWdlLndpZHRoO1xuICAgICAgICAgICAgY2FudmFzWzBdLmhlaWdodCA9IGltYWdlLmhlaWdodDtcbiAgICAgICAgICAgIHZhciBjdHggPSBjYW52YXNbMF0uZ2V0Q29udGV4dChcIjJkXCIpO1xuXG4gICAgICAgICAgICAvL1RPRE86IHVzZSBuZXcgdGV4dHVyZSByZW5kZXJlclxuXG4gICAgICAgICAgICAvL3ZhciB1aWNhID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGltYWdlLmRhdGEpO1xuICAgICAgICAgICAgLy92YXIgaW1hZ2VkYXRhID0gbmV3IEltYWdlRGF0YSh1aWNhLCBpbWFnZS53aWR0aCwgaW1hZ2UuaGVpZ2h0KTtcbiAgICAgICAgICAgIC8vY3R4LnB1dEltYWdlRGF0YShpbWFnZWRhdGEsIDAsIDApO1xuXG4gICAgICAgICAgICAkKHRoaXMuZ2V0T3V0cHV0SWQodHJ1ZSkpLmFwcGVuZChjYW52YXMpO1xuXG4gICAgICAgICAgICAvL1JlZ2lzdGVyIGl0XG4gICAgICAgICAgICB0aGlzLmN1cnJlbnRSZW5kZXJJZCA9IGZpbGVJZDtcbiAgICAgICAgfVxuXG4gICAgICAgICQoJy5maWxlVGFiJykuaGlkZSgpO1xuICAgICAgICAkKHRoaXMuZ2V0RG9tVGFiSWQodHJ1ZSkpLnNob3coKTtcbiAgICB9XG5cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICAvL2lmIHRleHR1cmUgZmlsZSB0aGVuIHJldHVybiB0cnVlXG4gICAgICAgIC8vVE9ETyB1c2UgdHlwZXMgZnJvbSBEYXRhUmVuZGVyZXJcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbn1cblxubW9kdWxlLmV4cG9ydHMgPSBUZXh0dXJlVmlld2VyOyIsIi8qXG5Db3B5cmlnaHQgwqkgVHlyaWEzRExpYnJhcnkgcHJvamVjdCBjb250cmlidXRvcnNcblxuVGhpcyBmaWxlIGlzIHBhcnQgb2YgdGhlIFR5cmlhIDNEIExpYnJhcnkuXG5cblR5cmlhIDNEIExpYnJhcnkgaXMgZnJlZSBzb2Z0d2FyZTogeW91IGNhbiByZWRpc3RyaWJ1dGUgaXQgYW5kL29yIG1vZGlmeVxuaXQgdW5kZXIgdGhlIHRlcm1zIG9mIHRoZSBHTlUgR2VuZXJhbCBQdWJsaWMgTGljZW5zZSBhcyBwdWJsaXNoZWQgYnlcbnRoZSBGcmVlIFNvZnR3YXJlIEZvdW5kYXRpb24sIGVpdGhlciB2ZXJzaW9uIDMgb2YgdGhlIExpY2Vuc2UsIG9yXG4oYXQgeW91ciBvcHRpb24pIGFueSBsYXRlciB2ZXJzaW9uLlxuXG5UeXJpYSAzRCBMaWJyYXJ5IGlzIGRpc3RyaWJ1dGVkIGluIHRoZSBob3BlIHRoYXQgaXQgd2lsbCBiZSB1c2VmdWwsXG5idXQgV0lUSE9VVCBBTlkgV0FSUkFOVFk7IHdpdGhvdXQgZXZlbiB0aGUgaW1wbGllZCB3YXJyYW50eSBvZlxuTUVSQ0hBTlRBQklMSVRZIG9yIEZJVE5FU1MgRk9SIEEgUEFSVElDVUxBUiBQVVJQT1NFLiAgU2VlIHRoZVxuR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2UgZm9yIG1vcmUgZGV0YWlscy5cblxuWW91IHNob3VsZCBoYXZlIHJlY2VpdmVkIGEgY29weSBvZiB0aGUgR05VIEdlbmVyYWwgUHVibGljIExpY2Vuc2VcbmFsb25nIHdpdGggdGhlIFR5cmlhIDNEIExpYnJhcnkuIElmIG5vdCwgc2VlIDxodHRwOi8vd3d3LmdudS5vcmcvbGljZW5zZXMvPi5cbiovXG5cbi8qKlxuICogVGhpcyBpcyBhbiBhYnN0cmFjdCBjbGFzcywgdXNlIG90aGVyIGNsYXNzIHRvIGRlZmluZSBiZWhhdmlvci5cbiAqIERlY2xhcmluZyBhIFZpZXdlciBjbGFzcyBpcyBub3QgZW5vdWdoLCBkb24ndCBmb3JnZXQgdG8gcmVnaXN0ZXIgaXQgaW4gdGhlIEZpbGVWaWV3ZXIgbW9kdWxlXG4gKi9cblxuY2xhc3MgVmlld2VyIHtcbiAgICAvKipcbiAgICAgKiBEZWZpbmVzIHRoZSB0YWIgaGVyZVxuICAgICAqL1xuICAgIGNvbnN0cnVjdG9yKGlkLCBuYW1lKSB7XG4gICAgICAgIHRoaXMuaWQgPSBpZDtcbiAgICAgICAgdGhpcy5uYW1lID0gbmFtZTtcbiAgICB9XG5cbiAgICBnZXRXMlRhYklkKCkge1xuICAgICAgICByZXR1cm4gYHRhYiR7dGhpcy5pZH1gO1xuICAgIH1cblxuICAgIGdldE91dHB1dElkKHdpdGhTaWduKSB7XG4gICAgICAgIGlmKHdpdGhTaWduKXtcbiAgICAgICAgICAgIHJldHVybiBgIyR7dGhpcy5pZH1PdXRwdXRgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGAke3RoaXMuaWR9T3V0cHV0YDtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIGdldERvbVRhYklkKHdpdGhTaWduKSB7XG4gICAgICAgIGlmKHdpdGhTaWduKXtcbiAgICAgICAgICAgIHJldHVybiBgI2ZpbGVUYWIke3RoaXMuaWR9YDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiBgZmlsZVRhYiR7dGhpcy5pZH1gO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogRmFjdWx0YXRpdmUgbWV0aG9kIHRoYXQgYWxsb3dzIHNvbWUgcmVuZGVyZXJzIHRvIHNldHVwIHN0dWZmIG9uIHN0YXJ0dXBcbiAgICAgKi9cbiAgICBzZXR1cCgpIHtcblxuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFJlbmRlciB0aGUgY29udGVudCBvZiB0aGUgdGFiIHdoZW4gY2FsbGVkXG4gICAgICogSXQgaXMgdGhlIHJlc3BvbnNhYmlsaXR5IG9mIHRoZSB2aWV3ZXIgdG8gY2FjaGUgaXQncyBoZWF2eSB0YXNrc1xuICAgICAqIEByZXR1cm5zIHtudWxsfVxuICAgICAqL1xuICAgIHJlbmRlcigpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTmVlZHMgdG8gYmUgaW1wbGVtZW50ZWQgYnkgY2hpbGRyZW4gY2xhc3NcIik7XG4gICAgfVxuXG4gICAgLyoqXG4gICAgICogVXNlZCB0byBjbGVhbiBtZW1vcnkgYXMgc29vbiBhcyBhbm90aGVyIGZpbGUgaXMgbG9hZGVkXG4gICAgICovXG4gICAgY2xlYW4oKSB7XG4gICAgICAgICQodGhpcy5nZXRPdXRwdXRJZCgpKS5odG1sKFwiXCIpO1xuICAgIH1cblxuICAgIC8qKlxuICAgICAqIFdpbGwgZGV0ZXJtaW5lIGlmIHRoZSB0YWIgY2FuIGJlIGFjdGl2ZSBvciBub3RcbiAgICAgKiBAcmV0dXJucyB7Ym9vbGVhbn1cbiAgICAgKi9cbiAgICBjYW5WaWV3KCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJOZWVkcyB0byBiZSBpbXBsZW1lbnRlZCBieSBjaGlsZHJlbiBjbGFzc1wiKTtcbiAgICB9XG5cbiAgICAvL0lmIHNldCB0byB0cnVlLCB0aGUgZmlsZSB3aWxsIGJlIG9wZW5lZCBkaXJlY3RseSBvbiB0aGlzIHZpZXdcbiAgICAvL0lmIG11bHRpcGxlIHZpZXdlcnMgcmV0dXJucyB0cnVlIGZvciB0aGUgc2FtZSBmaWxlLCBpdCBjb21lcyBiYWNrIHRvIGRlZmF1bHQuXG4gICAgb3ZlcnJpZGVEZWZhdWx0KCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxufVxuXG5tb2R1bGUuZXhwb3J0cyA9IFZpZXdlcjsiXX0=
