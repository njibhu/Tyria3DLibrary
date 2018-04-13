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
const DB_VERSION = 2;

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
    _getConnection(callback){
        let self = this;

        if(this._dbConnection){
            return callback(this._dbConnection);
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
                //This store was only used in version 1, it's not anymore since the performance was not good enough
                let store = db.createObjectStore("fileList", { keyPath: "baseId", unique: true});
                store.createIndex("fileType", "fileType", {unique: false});
            }

            if(currentVersion < 2){
                let newstore = db.createObjectStore("listings", 
                    {keyPath: "id", unique: true, autoIncrement: true});                    
            }
        }

        request.onsuccess = function(event){
            self._dbConnection = event.target.result;
            self.isReady = true;
            callback(self._dbConnection);
        }

        request.onerror = function(event){
            T3D.Logger.log(
                T3D.Logger.TYPE_ERROR,
                "The T3D persistant database could not be opened."
            );
            callback(null);
        }
    }

    updateListing(id, listing, callback){
        this._getConnection((db) => {
            if(!db)
                return callback(null);

            let item = {id: id, array: listing};
            let request = db.transaction(["updateListing"], "readwrite")
            .objectStore("listings")
            .put(item);

            request.onsuccess = function(event){
                callback(request.result);
            }
            request.onerror = function(event){
                callback(null);
            }
        });
    }

    getLastListing(callback) {
        this._getConnection((db) => {
            let listingsStore = db.transaction(["getLastListing"], "readonly")
                .objectStore("listings");
            
            let init = true; //Skip the first item
            listingsStore.openCursor(IDBKeyRange.only(0), "prev").onsuccess = () => {
                let cursor = event.target.result;
                if(!init)
                    return callback(cursor.key);
                else
                    init = false;
                cursor.continue();
            }
        });
    }
}

module.exports = PersistantStore;