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
const PromiseUtils = require('../util/PromiseUtils');
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
 * One of the big main advantages of this new API is that there is just only one nummeric ID 
 * for the files.
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
        this._mftTable;
        this._mftIndex;

        this._persistantStore = new PersistantStore();
        this._persistantCache = undefined;
        this._fileTypeCache = [];
    }

    loadArchive(file, callback){
        if(!callback) callback = () => {};
        let self = this;
        
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

    getFileMeta(fileId, isMftID){
        if(!isMftID)
            fileId = this._mftIndexTable[fileId];

        return {
            mftId: fileId,
            offset: this._mftTable.offset[fileId],
            size: this._mftTable.size[fileId],
            compressed: this._mftTable.compressed[fileId],
            crc: this._mftTable.crc[fileId]
        }
    }

    getFile(baseId, isImage){
        let self = this;

        return new Promise((resolve, reject) => {
            let mftId = this._mftIndexTable[baseId];
            if(!mftId){
                T3D.Logger.log(T3D.Logger.TYPE_ERROR, "Specified baseId is invalid");
                reject();
            }

            let offset = this._mftTable.offset[mftId];
            let size = this._mftTable.size[mftId];
            let compressed = this._mftTable.compressed[mftId];

            if(offset <= 0) {
                T3D.Logger.log(T3D.Logger.TYPE_ERROR, "File location in archive is invalid");
                reject();
            }        

            ArchiveParser.getFilePart(this._file, offset, size, function(ds, len){
                //If the file is not compressed, return the data already
                if(!compressed){
                    resolve(ds.buffer);
                } else {
                    self._dataReader.inflate(ds, len, baseId, resolve, isImage);
                }
            })
        });
        
    }

    readFileType(id, isMftID){
        let self = this;
        return new Promise((resolve, reject) => {
            if(!isMftID)
                id = self._mftIndexTable[id];
            
            if(self._fileTypeCache[id] != undefined)
                return resolve(self._fileTypeCache[id]);

            let offset = self._mftTable.offset[id];
            let size = self._mftTable.size[id];
            let compressed = self._mftTable.compressed[id];
    
            ArchiveParser.getFilePart(self._file, offset, Math.min(size,2000), function(ds, _size){
                if(compressed){
                    self._dataReader.inflate(
                        ds,
                        _size,
                        id,
                        function(inflatedData){
                            let ds = new DataStream(inflatedData);
                            let resultType = FileTypes.getFileType(ds);
                            self._fileTypeCache[id] = resultType;
                            resolve(resultType);
                        }, 
                        false, 0x20
                    );
                } else {
                    let resultType = FileTypes.getFileType(ds);
                    self._fileTypeCache[id] = resultType;
                    resolve(resultType);
                }
            });
        });
    }

    updatePersistant(archive, disableLog) {
        let self = this;
        let logs = [];

        let persistantList = [];

        return new Promise((resolve, reject) => {
            let iterateList = Object.keys(this._mftIndexTable).map(i => Number(i));

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

    _updateFileListItem(baseId, persistantData, logArray){
        let self = this;
        if(!logArray)
            logArray = [];

        return new Promise((resolve, reject) => {
            let currentData = self.getFileMeta(baseId);

            function compareData(){
                //If the item has an invalid offset
                if(currentData.offset<=0)
                    return reject();
    
                //If the baseId didn't exist before
                if(persistantData !== undefined && currentData.size === undefined){
                    self.readFileType(currentData.mftId, true).then((resultType) => {
                        logArray.push(`NewItem: { baseId: ${baseId}, type: ${resultType}, size: ${currentData.size} }`);
                        self._persistantStore.putFile({ 
                            baseId: baseId, size: currentData.size, crc: currentData.crc, fileType: resultType
                        }).then(resolve);
                    });
                }
                //If the size or checksum of the current don't match the old one
                else if(currentData.size !== persistantData.size ||
                        currentData.crc !== persistantData.crc
                ){
                    self.readFileType(currentData.mftId, true).then((resultType) => {
                        logArray.push(`ItemModified: { baseId: ${baseId}, type: ${resultType}, size: ${currentData.size} }`);
                        self._persistantStore.putFile({ 
                            baseId: baseId, size: currentData.size, crc: currentData.crc, fileType: resultType
                        }).then(resolve);
                    });
                }
                //If nothing changed
                else {
                    resolve();
                }
            }

            //If the persistantData is not already loaded
            if(!persistantData)
                self._persistantStore.getFile(baseId).then((persistantData) => {
                    compareData();
                });
            else
                compareData();
        });
    }

    _cleanFileList(actualKeys, oldKeys, logArray) {
        let self = this;
        if(!logArray)
            logArray = [];

        return new Promise((resolve, reject) => {
            function checkAndClean(id) {
                return new Promise((done, fail) => {
                    if(!actualKeys.includes(id)){
                        logArray.push(`ItemDeleted: { baseId: ${id}}`);
                        self._persistantStore.deleteFile(id)
                            .then(done)
                            .catch(done);
                    }
                })
            }
            PromiseUtils.limitedAsyncIterator(oldKeys, checkAndClean, 
                                              self._concurrentTasks * 4)
                .then(resolve)
                .catch(reject);
        });
    } 

    _callUpdateItem(data, id, logs){
        let persistantData = data[id] ? data[id] : {};
        return this._updateFileListItem(id, persistantData, logs);
    }
}



module.exports = Archive;