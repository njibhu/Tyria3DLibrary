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
        this._indexTable = [];
        this._fileMetaTable = []; //fields: offset, size, compressed, crc, baseIds, fileType

        this._persistantStore = new PersistantStore();
        this._fileTypeCache = [];
    }

    //Makes all the basic header and table parsing to populate the basic archive data
    loadArchive(file, callback){
        let self = this;

        ArchiveParser.readArchive(file, (data) => {
            if(!data)
                callback({done: false});

            self._file = file;
            self._archiveMeta = data.ANDatHeader;
            self._fileMetaTable = data.MFTTable.table;
            self._indexTable = data.MFTIndex.baseIdToMFT;
            //Add the baseIds to the meta array
            for(let index in data.MFTIndex.MFTbaseIds){
                if(self._fileMetaTable[index] !== undefined)
                    self._fileMetaTable[index].baseIds = data.MFTIndex.MFTbaseIds[index];
            }

            callback({done: true});
        });
    }

    //Returns the mftId and the data parsed in the header tables
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

    //Parses the file type or return it if already parsed
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

    //baseId can be not-valid, it will log a deleted item
    persistantScanFile(baseId, cacheArray, logs, callback) {
        let self = this;

        if(baseId <= 0)
            return callback(null);

        let meta = self.getFileMeta(baseId);
        let mftId = meta.mftId;
        let metaData = meta.data;

        //Nothing interesting
        if(metaData === undefined && cacheArray[baseId] === undefined){
            return callback({done: true, change: false});
        }
        //If the file have been deleted
        else if(metaData === undefined){
            cacheArray[baseId] = undefined;
            if(logs)
                logs.push(`ItemDeleted: { baseId: ${baseId} }`);
            return callback({done: true, change: true});
        }
        //If the file is new
        else if(cacheArray[baseId] === undefined) {
            self.readFileType(mftId, true, (resultType) => {
                self._fileMetaTable[mftId].fileType = resultType;
                cacheArray[baseId] = 
                    {baseId: baseId, size: metaData.size, crc: metaData.crc, fileType: resultType};
                if(logs)
                    logs.push(`NewItem: { baseId: ${baseId}, type: ${resultType}, size: ${metaData.size} }`);
                return callback({done: true, change: true});
            });
        }
        //If the size or crc don't match
        else if(metaData.size !== cacheArray[baseId].size || metaData.crc !== cacheArray[baseId].crc){
            self.readFileType(mftId, true, (resultType) => {
                self._fileMetaTable[mftId].fileType = resultType;
                cacheArray[baseId] = 
                    {baseId: baseId, size: metaData.size, crc: metaData.crc, fileType: resultType};
                if(logs)
                    logs.push(`ItemModified: { baseId: ${baseId}, type: ${resultType}, size: ${metaData.size} }`);
                return callback({done: true, change: true});
            });
        }
        //If everything is the same
        else
        {
            self._fileMetaTable[mftId].fileType = metaData.fileType;
            return callback({done: true, change: false});
        }
    }


    //update the persistant storage
    persistantUpdate(disableDetailLog, callback) {
        let self = this;
        let logs = [];
        if(disableDetailLog)
            logs = false;

        let persistantList = []; //PersistantStore.getLastListing

        this._persistantStore.getLastListing((result) => {
            if(!result.done)
                return callback({done: false});
            
            if(!result.null)
                persistantList = result.array;

            let newPersistantId = null;

            let iterateList = Object.keys(self._indexTable).map(i=>Number(i));

            for (let index in persistantList){
                if(self._indexTable[index] === undefined)
                    iterateList.push(index);
            }
    
            let index = 0;
            let returned = 0;
            let needUpdate = false; //Define if we save more data (if there is a change or not)

            function saveProgress(){
                self._persistantStore.updateListing(newPersistantId, persistantList, (result) => {
                    if(result.done){
                        newPersistantId = result.key;
                    }                        
                    else
                        T3D.Logger.log(T3D.Logger.TYPE_ERROR, "Could not save persistant data");
                });
            }
    
            function progress(i){
                if(i%Math.floor(iterateList.length/100) == 0){
                    T3D.Logger.log(T3D.Logger.TYPE_PROGRESS,
                        "Finding types", i/Math.floor(iterateList.length/100));
                    if(needUpdate){
                        needUpdate = false;
                        saveProgress();
                    }
                }
            }
    
            function next(res) { //Break the recursion
                if(res.change)
                    needUpdate = true;

                if(index%1000 == 0)
                    setTimeout(startScan, 0);
                else
                    startScan();
            }
    
            function startScan() {
                if(index < iterateList.length){
                    let currentId = iterateList[index];
                    index += 1;
                    progress(index);
                    self.persistantScanFile(currentId, persistantList, logs, next);
                } else {
                    returned += 1;
                    if(returned == self._concurrentTasks)
                        return callback({done: true});
                }
            }
    
            for(let i = 0; i<self._concurrentTasks * 2; i++)
                startScan();

        });
    }
}

module.exports = Archive;