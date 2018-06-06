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
 * Organized thread pool of extractors
 * @class DataReader
 */
class DataReader {
    /**
     * @constructor
     * @param {Object} settings
     * @param {number} settings.workersNb Amount of concurrent spawned workers
     * @param {string} settings.workerPath Path to the worker script
     */
    constructor(settings) {
        this._settings = settings;
        this._workerPool = [];
        this._workerLoad = [];

        //Makes individual ids for file extraction
        this._handleCounter = 0;

        /** 
         * Work to be processed
         * @private 
         * @type {[{buffer: ArrayBuffer, size: number, mftId: number, isImage: boolean, capLength: number, resolve: function, reject: function}]} 
         */
        this._workQueue = [];

        /**
         * Work currently processed
         * @private
         * Entries : {mftId: number, workerId: number, resolve: resolve, reject: reject}
         */
        this._handleRegister = {};

        for (let i = 0; i < settings.workersNb; i++) {
            this._startWorker(settings.workerPath);
        }
    }

    /**
     * @param {DataStream} ds 
     * @param {number} size 
     * @param {number} mftId
     * @param {boolean} [isImage] Parses the output as a dxt texture
     * @param {number} [capLength] Output size
     * @returns {Promise<{buffer: ArrayBuffer, dxtType: number, imageWidth: number, imageHeight: number}>} 
     */
    inflate(ds, size, mftId, isImage, capLength) {
        return new Promise((resolve, reject) => {
            let arrayBuffer = ds.buffer;

            //If no capLength then inflate the whole file
            if (!capLength || capLength < 0) {
                capLength = 0;
            }

            //Buffer length size check
            if (arrayBuffer.byteLength < 12) {
                T3D.Logger.log(
                    T3D.Logger.TYPE_WARNING,
                    `not inflating, length is too short (${arrayBuffer.byteLength})`, mftId
                );
                reject(new Error("Couldn't inflate " + mftId + " (mftId)"));
                return;
            }

            //Register the data to work with
            this._workQueue.push({
                buffer: arrayBuffer,
                size: size,
                mftId: mftId,
                isImage: isImage,
                capLength: capLength,
                resolve: resolve,
                reject: reject
            });

            // Check if there is a free worker and ask it to start
            const freeWorkerIndex = this._getFreeWorkerIndex();
            if (freeWorkerIndex >= 0) {
                this._workNext(freeWorkerIndex);
            }

        });
    }

    /**
     * Function used to give work to a worker
     * @private
     * @param {number} workerId
     **/
    _workNext(workerId) {
        const workData = this._workQueue.shift();

        if (workData) {
            //Get a handleID
            const handle = this._getNewHandle();

            this._handleRegister[handle] = {
                mftId: workData.mftId,
                workerId: workerId,
                resolve: workData.resolve,
                reject: workData.reject
            };

            this._workerLoad[workerId] += 1;
            this._workerPool[workerId].postMessage(
                [handle, workData.buffer, workData.isImage === true, workData.capLength]
            );
        }

    }

    _getNewHandle() {
        return this._handleCounter++;
    }

    // Initialization function for creating a new worker (thread)
    // _id should only be used to restart a worker !
    _startWorker(path, _id) {
        let worker = new Worker(path);
        let selfWorkerId;
        if (_id) {
            selfWorkerId = _id;
            this._workerPool[selfWorkerId] = worker;
            this._workerLoad[selfWorkerId] = 0;

        } else {
            selfWorkerId = this._workerPool.push(worker) - 1;
            if (this._workerLoad.push(0) != selfWorkerId + 1)
                throw new Error("WorkerLoad and WorkerPool don't have the same length");
        }

        //This
        worker.onmessage = (message_event) => {
            const answer = message_event.data;
            let handleID;

            // Remove load
            this._workerLoad[selfWorkerId] -= 1;

            // If error
            if (typeof answer === 'string') {
                T3D.Logger.log(
                    T3D.Logger.TYPE_WARNING,
                    "Inflater threw an error", answer
                );

                //Parse the handle
                handleID = answer.split(':')[0];

                //Get handle owner informations and reject then cleanup
                const handleData = this._handleRegister[handleID];
                if (handleData) {
                    handleData.reject(`Error: ${answer}`);
                    delete this._handleRegister[handleID];
                }
            } else {
                //Parse handle
                handleID = answer[0];

                const handleData = this._handleRegister[handleID];
                // If handle is recognized: success
                if (handleData) {
                    // Array buffer, dxtType, imageWidth, imageHeight			
                    handleData.resolve({
                        buffer: answer[1],
                        dxtType: answer[2],
                        imageWidth: answer[3],
                        imageHeight: answer[4]
                    });

                    //Cleanup
                    delete this._handleRegister[handleID];
                }

                // Unknown error
                else {
                    T3D.Logger.log(
                        T3D.Logger.TYPE_ERROR,
                        "Inflater threw an error", answer
                    );
                }
            }

            this._workNext(selfWorkerId);

        };

        //Handle errors, we assume worse case: it crashed and corrupted its memory
        worker.onerror = (error) => {
            //Get all handles sent to this worker and reject them
            for (let handle in this._handleRegister) {
                if (this._handleRegister[handle].workerId === selfWorkerId) {
                    this._handleRegister[handle].reject(`Error: Worker crashed while processing ${handleData.mftId}`);
                    delete this._handleRegister[handle];
                }
            }

            //Clean and restart the worker
            this._workerPool[selfWorkerId].terminate();
            this._startWorker(this._settings.workerPath, selfWorkerId);

        }

    }

    //Returns -1 if there are no free worker, or the index of a free worker
    _getFreeWorkerIndex() {
        return this._workerLoad.indexOf(0);
    }

}

module.exports = DataReader;