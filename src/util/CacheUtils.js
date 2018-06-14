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
 * Basic helper function that returns a file either from cache or from archive.
 * @param {Number} baseId 
 * @param {Number} mftId 
 * @param {Boolean} isImage
 * @param {Object} fileCache 
 * @param {LocalReader} localReader 
 */
async function loadFile(baseId, mftId, isImage, fileCache, localReader) {
    if (!mftId) {
        mftId = localReader.getFileIndex(baseId);
        if (mftId <= 0) {
            throw new Error(`Could not find a valid file with baseID: ${baseId}`);
        }
    }

    if (fileCache[mftId]) {
        return fileCache[mftId];
    } else {
        return await localReader.readFile(mftId, isImage).then((result) => {
            fileCache[mftId] = result;
            return result;
        });
    }
}

module.exports = {
    loadFile: loadFile
}