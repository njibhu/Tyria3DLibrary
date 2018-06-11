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