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
var version = require('../T3DLib').version;

/// Indexed DB versioning
const DB_VERSION = 1;

/**
 * This class handles offline storage of the .dat indexes and files metadata
 * @class PersistantStore
 * @constructor
 */
var PersistantStore = function(){
    /// True if the database connection is ready to be used
    this.isReady = false;

    this.connectDB();
}

/**
 * Initialize the IndexedDB connection and manages version changes.
 * Usually automatically called by the constructor
 * @async
 * @method connectDB
 * @param  {Function} callback Fires when the connection is established and ready.
 */
PersistantStore.prototype.connectDB = function(callback){
    //Check that callback is a function
    callback = (typeof callback === 'function') ? callback : () => {return;};

	//Access the localStorage object inside the callbacks
	var self = this;

	// Let us open our database
    var request = window.indexedDB.open("Tyria3DLibrary", DB_VERSION);
    
    /// onblocked is fired when the db needs an upgrade but an older version is opened in another tab
    request.onblocked = function(event) {
        T3D.Logger.log(
			T3D.Logger.TYPE_ERROR,
			"The T3D persistant database cannot be upgraded while the app is opened somewhere else."
		);
    }

    /// fired when the database needs to be upgraded (or the first time)
	request.onupgradeneeded = function(event){
		var db = event.target.result;
		var currentVersion = event.oldVersion;

        /// Define the database structure:
		if(currentVersion < 1){
            db.createObjectStore("filelist", { keyPath: "baseId", unique: true});
            db.createObjectStore("maplist", {keyPath: "baseId", unique: true});
		}
	}

	request.onsuccess = function(event){
        self._dbConnection = event.target.result;
        self.isReady = true;
        callback();
	}

	request.onerror = function(event){
        T3D.Logger.log(
			T3D.Logger.TYPE_ERROR,
			"The T3D persistant database could not be opened."
        );
        T3D.Logger.log(
			T3D.Logger.TYPE_DEBUG,
			request.error
		);
	}
}

/**
 * TODO
 * getIDBDatabase
 * @method
 */
PersistantStore.prototype.getIDBDatabase = function() {
    if(this.isReady)
        return this._dbConnection;
    else
        return null;
}

/**
 * TODO
 * @param {*} itemArray 
 */
PersistantStore.prototype.insertFileList = function(itemArray, callback){
    //Check that callback is a function
    callback = (typeof callback === 'function') ? callback : () => {return;};

    var db = this.getIDBDatabase();
    if(db)
        insertStore(db, "filelist", itemArray, callback);
    else
        T3D.Logger.log(T3D.Logger.TYPE_ERROR, "PersistantStore: database not ready");
}

/**
 * TODO
 */
PersistantStore.prototype.readFileList = function(callback){
    //Check that callback is a function
    callback = (typeof callback === 'function') ? callback : () => {return;};

}

/**
 * TODO
 */
PersistantStore.prototype.insertMapList = function(indexArray, callback){
    //Check that callback is a function
    callback = (typeof callback === 'function') ? callback : () => {return;};
    
    var db = this.getIDBDatabase();
    if(db)
        insertStore(db, "maplist", itemArray, callback);
    else
        T3D.Logger.log(T3D.Logger.TYPE_ERROR, "PersistantStore: database not ready");
}

/**
 * TODO
 */
PersistantStore.prototype.readMapList = function(callback){
    //Check that callback is a function
    callback = (typeof callback === 'function') ? callback : () => {return;};
    
}



/// This function is used internally to insert data in the indexeddb
function insertStore(db, objectStoreName, dataArray, callback){

    // Start a new transaction with the filelist objectStore
    var transaction = db.transaction([objectStoreName], "readwrite").objectStore(objectStoreName);
    
    var errorCount = 0;
    var index = 0;
    var insert = function(){
        //Check if there is still data to insert
        if(index < dataArray.length){
            var elem = dataArray[index];
            index += 1;

            var request = transaction.add(obj);

            //Continue inserting data after success
            request.onsuccess = insert;

            //On errors log and watch for too many errors
            request.onerror = function(){
                if(errorCount > 15){
                    throw new Error("PersistantStore generated too many errors on insert");
                }
                errorCount += 1;
                T3D.Logger.log(
                    T3D.Logger.TYPE_WARNING,
                    "PersistantStore could not store item",
                    request.error
                );

                //But continue inserting
                insert();
            }
        } else {
            //If there is no more data we callback
            callback();
        }
    };

    //Start inserting the data
    insert();
}


module.exports = PersistantStore;