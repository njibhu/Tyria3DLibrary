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