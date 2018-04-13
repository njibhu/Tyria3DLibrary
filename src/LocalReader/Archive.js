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

const FETCHLIMIT = 100000;


/****
 * This current model doesn't work so well on the performance side
 * IndexedDB is not meant to be used to store a huge array of 500 000+ items
 * containing just 4 numbers.
 * Next iteration will be one item = Full List
 *   The last item is the most up to date version
 * During the scanning, the archive may upload incomplete versions of the list.
 ****/



/**
 * TODO - doc
 */
class Archive {
    constructor(settings) {
        this._dataReader = new DataReader({
            path: settings.t3dtoolsWorker,
            workers: settings.concurrentTasks
        });

        this._concurrentTasks = settings.concurrentTasks;

        this._file;
        this._archiveMeta;
        this._indexTable;
        this._fileMetaTable; //fields: offset, size, compressed, crc, baseIds, fileType

        this._persistantStore = new PersistantStore();
        this._fileTypeCache = [];
    }

    loadArchive(file, callback){
        let self = this;

        Archive.readArchive(file, (data) => {
            if(!data)
                callback(null);

            self._file = file;
            self._archiveMeta = data.ANDatHeader;
            self._fileMetaTable = data.MFTTable.table;
            self._indexTable = data.MFTIndex.baseIdToMFT;
            //Add the baseIds to the meta array
            data.MFTIndex.MFTbaseIds.forEach((value, index) => {
                self._fileMetaTable[index].baseIds = value;
            });

            callback(0);
        });
    }

    getFileMeta(fileId, isMftID){
        if(!isMftID)
            fileId = this._indexTable[fileId];

        return {mftId: fileId, data: this._fileMetaTable[fileId]};
    }

    /**
     * @method getFile
     * @param {*} baseId 
     * @param {*} isImage 
     * @param {Function} callback
     *      * 
     */
    getFile(baseId, isImage, callback){
        let self = this;

        let mftId = this._mftIndexTable[baseId];
        if(!mftId){
            T3D.Logger.log(T3D.Logger.TYPE_ERROR, "Specified baseId is invalid");
            callback(null);
        }

        //Get the file meta information
        let meta = this.getFileMeta(mftId, true).data;

        if(!meta || meta.offset <= 0) {
            T3D.Logger.log(T3D.Logger.TYPE_ERROR, "File location in archive is invalid");
            callback(null);
        }

        ArchiveParser.getFilePart(this._file, meta.offset, meta.size, (ds, len) => {
            //If the file is not compressed, return the data already
            if(!meta.compressed){
                callback(ds.buffer);
            } else {
                self._dataReader.inflate(ds, len, baseId, isImage, callback);
            }
        });
    }

    getAllBaseIds() {
        return Object.keys(this._mftIndexTable).map(i => Number(i));
    }

    readFileType(id, isMftID, callback){
        let self = this;
        if(!isMftID)
            id = this._mftIndexTable[id];
        
        if(this._fileTypeCache[id] != undefined)
            return callback(this._fileTypeCache[id]);

        let fileMeta = this.getFileMeta(id, true).data;
        if(!fileMeta)
            return callback(null);

        ArchiveParser.getFilePart(this._file, fileMeta.offset, Math.min(fileMeta.size,2000), (ds, size) => {
            if(fileMeta.compressed){
                self._dataReader.inflate(ds, size, id, false, 0x20,
                    (inflatedData) => {
                        if(!inflatedData)
                            return callback(null);

                        let ds = new DataStream(inflatedData);
                        let resultType = FileTypes.getFileType(ds);
                        self._fileTypeCache[id] = resultType;
                        callback(resultType);
                    });
            } else {
                let resultType = FileTypes.getFileType(ds);
                self._fileTypeCache[id] = resultType;
                callback(resultType);
            }
        });
    }

    updatePersistant(archive, disableLog) {
        let self = this;
        let logs = [];

        let persistantList = [];

        return new Promise((resolve, reject) => {
            let iterateList = self.getAllBaseIds();

            //Iterate through all the archive baseIds
            PromiseUtils.limitedAsyncIterator(iterateList, (id, index) => {
                
                return new Promise((done, fail) => {

                    if(index % FETCHLIMIT == 0){
                        let offset = id;
                        let limit = (index+FETCHLIMIT < iterateList.length) ? iterateList[index+FETCHLIMIT] : iterateList[iterateList.length - 1];


                        let fetchingData = self._persistantStore.getFiles(offset, limit);
                        fetchingData.then((data) => {
                            //just checking for deleted index in the current slice
                            let slice = iterateList.slice(index, (index + FETCHLIMIT + 1 < iterateList.length) ? 
                                index + FETCHLIMIT + 1 : iterateList.length);
                            let oldSlice = Object.keys(data).map(i => Number(i));
                            self._cleanFileList(slice, oldSlice, logs);

                            //Adding the newly fetched data
                            for (let dataIndex in data){
                                persistantList[dataIndex] = data[dataIndex];
                            }
                            
                            //Update the current item
                            self._callUpdateItem(persistantList, id, logs).then(done).catch(fail);
                        })
                        fetchingData.catch(reject); //Failing to fetch will call a reject
                    } else {
                        self._callUpdateItem(persistantList, id, logs).then(done).catch(fail);
                    }

                });
            }, self._concurrentTasks, "Finding types"
            ).then(() => {
                self._persistantCache = persistantList;
                resolve();
            }).catch(reject);
        });
    }

    //persistantData will be populated by the promise, it must be an object
    _scanListingItem(baseId, persistantData, logArray, callback){
        let self = this;
        if(!logArray)
            logArray = [];

        let meta = self.getFileMeta(baseId);
        let mftId = meta.mftId;
        meta = meta.data;

        //If the item has an invalid offset
        if(meta.offset<=0)
            return callback(null);

        //If the baseId didn't exist before
        if(meta.size === undefined){
            self.readFileType(mftId, true, (resultType) => {
                logArray.push(`NewItem: { baseId: ${baseId}, type: ${resultType}, size: ${meta.size} }`);
                persistantData.baseId = baseId;
                persistantData.size = meta.size;
                persistantData.crc = meta.crc;
                persistantData.fileType = resultType;
                callback();
            });
        }
        //If the size or checksum of the meta don't match the old one
        else if(meta.size !== persistantData.size ||
                meta.crc !== persistantData.crc
        ){
            self.readFileType(mftId, true, (resultType) => {
                logArray.push(`ItemModified: { baseId: ${baseId}, type: ${resultType}, size: ${meta.size} }`);
                persistantData.baseId = baseId;
                persistantData.size = meta.size;
                persistantData.crc = meta.crc;
                persistantData.fileType = resultType;
                callback();
            });
        }
        //If nothing changed
        else {
            callback(0);
        }
    }



    _callUpdateItem(data, id, logs){
        let persistantData = data[id] ? data[id] : {};
        return this._updateFileListItem(id, persistantData, logs);
    }
}



module.exports = Archive;