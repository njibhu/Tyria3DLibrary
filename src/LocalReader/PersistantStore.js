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

/// T3DLib version
let version = require('../T3DLib').version;

/// Indexed DB versioning
const DB_VERSION = 1;

/**
 * This class handles offline storage of the .dat indexes and files metadata
 * @class PersistantStore
 * @constructor
 */
class PersistantStore{

    constructor() {
        //They may be multiple connection request issued at the same time, but it's actually okay since
        //as soon as they are registered, the not-used ones will get garbage collected
        this._dbConnection = undefined;
        this._getConnection();
    }

    /**
     * Initialize the IndexedDB connection and manages version changes.
     * @async
     * @method connectDB
     */
    _getConnection(){
        let self = this;
        return new Promise(function(resolve, reject){

            if(self._dbConnection){
                return resolve(self._dbConnection);
            }

            // Let us open our database
            let request = window.indexedDB.open("Tyria3DLibrary", DB_VERSION);
            
            /// onblocked is fired when the db needs an upgrade but an older version is opened in another tab
            request.onblocked = function(event) {
                T3D.Logger.log(
                    T3D.Logger.TYPE_ERROR,
                    "The T3D persistant database cannot be upgraded while the app is opened somewhere else."
                );
            }

            /// fired when the database needs to be upgraded (or the first time)
            request.onupgradeneeded = function(event){
                let db = event.target.result;
                let currentVersion = event.oldVersion;

                /// Define the database structure:
                if(currentVersion < 1){
                    let store = db.createObjectStore("fileList", { keyPath: "baseId", unique: true});
                    store.createIndex("fileType", "fileType", {unique: false});
                }
            }

            request.onsuccess = function(event){
                self._dbConnection = event.target.result;
                self.isReady = true;
                resolve(self._dbConnection);
            }

            request.onerror = function(event){
                T3D.Logger.log(
                    T3D.Logger.TYPE_ERROR,
                    "The T3D persistant database could not be opened."
                );
                reject(request.error);
            }
        });
    }

    getFile(id) {
        let self = this;
        return new Resolve(function(resolve, reject){
            self._getConnection().then((db) => {
                let request = db.transaction(["fileList"], "readonly")
                                .objectStore("fileList")
                                .get(itemId);
                request.onsuccess = function(event){
                    resolve(request.result);
                }
                request.onerror = function(event){
                    reject(request.result);
                }
            });
        });
    }

    getTypeFiles(fileType, limit) {
        let self = this;
        return new Resolve(function(resolve, reject){
            self._getConnection().then((db) => {
                let request = db.transaction(["fileList"], "readonly")
                    .objectStore("fileList")
                    .index("fileType")
                    .getAll(IDBKeyRange.only(fileType), limit);
                request.onsuccess = function(event){
                    resolve(request.result);
                }
                request.onerror = function(event){
                    reject(request.result);
                }
            });
        });
    }

    getHighestId() {
        let self = this;
        return new Promise((resolve, reject) => {
            self._getConnection().then((db) => {

            });
        });
    }

    getCount() {
        let self = this;
        return new Promise(function(resolve, reject){
            self._getConnection().then((db) => {
                let store = db.transaction(["fileList"], "readonly")
                    .objectStore("fileList");
                let reqCount = store.count();
                reqCount.onsuccess = () => {
                    resolve(reqCount.result);
                };
                reqCount.onerror = reject;
            });
        });
    }

    getFiles(offset, limit) {
        let self = this;
        return new Promise(function(resolve, reject){

            let range;
            if(!offset && !limit)
                //warning this will blow up
                range = IDBKeyRange.lowerBound(0);
            else if(!offset)
                range = IDBKeyRange.upperBound(limit);
            else if(!limit)
                range = IDBKeyRange.lowerBound(offset);
            else
                range = IDBKeyRange.bound(offset, limit);

            let returnArray = [];
            self._getConnection().then((db) => {
                let request = db.transaction(["fileList"], "readonly")
                    .objectStore("fileList")
                    .getAll(range);

                request.onsuccess = function(event){
                    //Unfold the result into a usable array
                    for(let item of request.result){
                        returnArray[item.baseId] = item;
                    }
                    resolve(returnArray);
                }
                request.onerror = function(event){
                    reject(request.result);
                }
                
            });
        });
    }

    putFile(item){
        let self = this;
        return new Promise(function(resolve, reject){
            self._getConnection().then((db) => {
                let request = db.transaction(["fileList"], "readwrite")
                .objectStore("fileList")
                .put(item);

                request.onsuccess = function(event){
                    resolve(request.result);
                }
                request.onerror = function(event){
                    reject(request.result);
                }
            });
        });
    }

    deleteFile(item){
        let self = this;
        return new Promise(function(resolve, reject){
            self._getConnection().then((db) => {
                let request = self._dbConnection.transaction(["fileList"], "readwrite")
                    .objectStore("fileList")
                    .delete(item);

                request.onsuccess = function(event){
                    resolve(request.result);
                }
                request.onerror = function(event){
                    reject(request.result);
                }
            });
        });
    }
}

module.exports = PersistantStore;