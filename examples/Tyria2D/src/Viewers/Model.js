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
        super("#fileTabsModel", "#modelOutput", "tabModel", "Model");
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
        $(this.fileTabId).show();
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