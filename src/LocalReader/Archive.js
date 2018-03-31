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

/// Includes
const ArchiveParser = require('./ArchiveParser');
const FileTypes = require('./FileTypes');
const PersistantStore = require('./PersistantStore');
const DataReader = require('./DataReader');
/// EndIncludes

/**
 * TODO - doc
 * One of the big main advantages of this new API is that there is just only one nummeric ID 
 * for the files.
 */
class Archive {
    constructor() {
        this._dataReader = new DataReader({
            path: "lib/t3dworker.js",
            workers: (!global.navigator || !navigator.hardwareConcurrency) ? 4 : navigator.hardwareConcurrency
        });

        this._file;
        this._archiveMeta;
        this._mftTable;
        this._mftIndex;
    }

    loadArchive(file, callback){
        if(!callback) callback = () => {};
        var self = this;
        
        ArchiveParser.readArchive(file, function(data){
            if(!data) callback(true);
            self._file = file;
            self._archiveMeta = data.ANDatHeader;
            self._mftTable = data.MFTTable.table;
            self._mftTableSize = data.MFTTable.header.nbOfEntries;
            self._mftIndexTable = data.MFTIndex.baseIdToMFT;
            self._baseIdRegister = data.MFTIndex.MFTbaseIds;
            callback(false);
        });
        
    }

    getFile(baseId, callback, isImage){
        if(!callback) callback = () => {};
        var self = this;

        var metaData = this.getFileMeta(baseId);
        if(!metaData || metaData.offset <= 0) {
            T3D.Logger.log(T3D.Logger.TYPE_ERROR, "Specified baseId is invalid");
            callback(null);
        }

        ArchiveParser.getFilePart(this._file, metaData.offset, metaData.size, function(ds, len){
            //If the file is not compressed, return the data already
            if(!metaData.compressed){
                callback(ds.buffer);
            } else {
                self._dataReader.inflate(ds, len, baseId, callback, isImage);
            }
        })
        
    }

    getFileMeta(baseId) {
        var mftIndex = this._mftIndexTable[baseId];
        console.log(mftIndex);
        if(mftIndex && this._mftTable.offset[mftIndex]){
            return {
                offset: this._mftTable.offset[mftIndex],
                size: this._mftTable.size[mftIndex],
                compressed: this._mftTable.compressed[mftIndex],
                crc: this._mftTable.crc[mftIndex]
            } 
        }
        else {
            return null;
        }
    }
}

module.exports = Archive;