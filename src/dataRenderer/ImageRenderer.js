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

const DataRenderer = require('./DataRenderer');

/**
 *
 * A renderer that extract and decompress images and textures
 * 
 * @class ImageRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "id" the base ID or file ID of the model to generate meshes for.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */
class ImageRenderer extends DataRenderer {
    constructor(localReader, settings, context, logger) {
        super(localReader, settings, context, logger);
    }

    /**
     * Extract the image or texture
     * Output fileds generated:
     *
     * - *image* An object containing 5 fields:
     *      - data          An Uint8Array containing the image data
     *      - type          Type detected by the localReader
     *      - dxtType       (only DXT textures) The DXT type
     *      - imageWidth    (only DXT textures) The width of the dxt texture
     *      - imageHeight   (only DXT textures) The height of the dxt texture
     * 
     * @param  {Function} callback Fires when renderer is finished, does not take arguments.
     */
    renderAsync(callback) {
        //Ask the localReader for the file type
        const fileId = this.localReader.getFileIndex(this.settings.id);
        this.localReader.readFileType(fileId).then((fileType) => {

            //If it's a DXT texture then decompress it
            if (fileType.startsWith("TEXTURE_AT")) {
                return this.localReader.readFile(fileId, true).then((buffer, dxtType, imageWidth, imageHeight) => {
                    return {
                        type: fileType,
                        data: result,
                        dxtType: dxtType,
                        imageWidth: imageWidth,
                        imageHeight: imageHeight
                    };
                });
            }

            //If it's not a DXT just extract it (can be DDS/PNG/GIF...)
            else if (fileType.startsWith("TEXTURE_")) {
                return this.localReader.readFile(fileId).then((result) => {
                    return {
                        type: fileType,
                        data: result.buffer
                    };
                });
            }
        }).then((image) => {
            //Then with the result we give the informations and send the callback
            if (image) {
                this.getOutput().fileId = this.settings.id;
                this.getOutput().image = {
                    data: new Uint8Array(image.data),
                    type: fileType,
                    dxtType: dxtType,
                    imageWidth: imageWidth,
                    imageHeight: imageHeight
                }

                callback();
            }
        });
    }
}