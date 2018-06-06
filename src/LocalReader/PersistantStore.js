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
const version = require('../T3DLib').version;

/// Indexed DB versioning
const DB_VERSION = 4;

/**
 * This class handles offline storage of the .dat indexes and files metadata
 * @class PersistantStore
 */
class PersistantStore {

    constructor() {
        //They may be multiple connection request issued at the same time, but it's actually okay since
        //as soon as they are registered, the not-used ones will get garbage collected
        this._dbConnection = undefined;
        this._getConnection(() => {});
    }

    /**
     *   Initialize the IndexedDB connection and manages version changes.
     * 
     * @async
     * @private
     * @returns {Promise<IDBDatabase>} Promise to the Database connection
     */
    _getConnection() {
        return new Promise((resolve, reject) => {
            if (this._dbConnection)
                resolve(this._dbConnection);

            // Let us open our database
            let request = window.indexedDB.open("Tyria3DLibrary", DB_VERSION);

            /// onblocked is fired when the db needs an upgrade but an older version is opened in another tab
            request.onblocked = (event) => {
                T3D.Logger.log(
                    T3D.Logger.TYPE_ERROR,
                    "The T3D persistant database cannot be upgraded while the app is opened somewhere else."
                );
            }

            /// fired when the database needs to be upgraded (or the first time)
            request.onupgradeneeded = (event) => {
                /** @type {IDBDatabase} */
                let db = event.target.result;
                let currentVersion = event.oldVersion;

                if (currentVersion < 2) {
                    let newstore = db.createObjectStore("listings", {
                        autoIncrement: true
                    });
                }

                if (currentVersion < 3) {
                    let storeListing = event.currentTarget.transaction.objectStore("listings");
                    storeListing.createIndex('filename', 'filename', {
                        unique: false
                    });
                }

            }

            request.onsuccess = (event) => {
                this._dbConnection = event.target.result;
                this.isReady = true;
                resolve(this._dbConnection);
            }

            request.onerror = (event) => {
                T3D.Logger.log(
                    T3D.Logger.TYPE_ERROR,
                    "The T3D persistant database could not be opened."
                );
                reject();
            }
        });
    }

    /**
     *   Add or update a listing into the database
     * 
     * @async
     * @param {number|undefined} id This ID doesn't really matter, it's just the index of the object in the database, can be undefined
     * @param {Array} listing 
     * @param {string} fileName .dat file name, allows to have multiple listings for different .dat files.
     * @param {boolean} isComplete Keep back the information if that was the last update on the current scan or not.
     * @returns {Promise<number>} On success, the number is the object key in the database
     */
    putListing(id, listing, fileName, isComplete) {
        return new Promise((resolve, reject) => {
            this._getConnection().then((db) => {
                let store = db.transaction(["listings"], "readwrite").objectStore("listings");

                let request = (id) ? store.put({
                    array: listing,
                    filename: fileName,
                    complete: isComplete
                }, id) : store.put({
                    array: listing,
                    name: fileName
                });

                request.onsuccess = (event) => {
                    resolve(request.result);
                }
                request.onerror = (event) => {
                    reject();
                }
            })
        });
    }

    /**
     * Returns the last valid listing in the database
     * 
     * @async
     * @param {string} fileName .dat file name, allows to have multiple listings for different .dat files.
     * @returns {Promise<{array: Array, key: number, complete: boolean}>}
     *      array: the last listing
     *      key: the index of the last listing in the database
     */
    getLastListing(fileName) {
        return new Promise((resolve, reject) => {
            this._getConnection().then((db) => {
                let listingsStore = db.transaction(["listings"], "readonly")
                    .objectStore("listings").index("filename");

                listingsStore.openCursor(IDBKeyRange.only(fileName), "prev").onsuccess = (event) => {
                    let cursor = event.target.result;
                    if (!cursor)
                        resolve({
                            array: [],
                            key: undefined,
                            complete: true
                        });
                    else {
                        resolve({
                            array: cursor.value.array,
                            key: cursor.primaryKey,
                            complete: cursor.value.complete
                        });
                    }

                }
            });
        });
    }
}

module.exports = PersistantStore;