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
 * DataWorkers are a simple callback based replacement of the DataReader class
 * but for the new LocalReader (v3).
 *
 * decompress pushes work to the queue
 * checks if a worker is free (assignedWork.length < workLoadPerWorkers),
 *
 */

const DataWorkers = function({
  workersAmount = 1,
  workersPath,
  workLoadPerWorkers = 2
} = {}) {
  const workers = Array(workersAmount)
    .fill() // .map doesnt work on freshly created arrays
    .map(() => ({ ...initWorker(workersPath) }));

  // {...workItem, assigned: bool}
  const workQueue = [];
  let handleCounter = 0;

  // Create a worker and
  function initWorker(id, path) {
    const assignedWork = []; // contains references from the queue
    const worker = new Worker(path);

    return {
      worker,
      id,
      assignedWork
    };
  }

  function distributeWork() {
    const busyWorkers = workers.reduce((busyAmount, worker) => {
      return isWorkerFree(worker) ? busyAmount : busyAmount + 1;
    }, 0);

    while (busyWorkers < workersAmount) {
      for (const worker of workers) {
        if (isWorkerFree(worker)) {
          const work = getWork();
          if (!work) {
            return;
          }

          pushWork(work, worker);
          busyWorkers = isWorkerFree(worker) ? busyWorkers : busyWorkers + 1;
        }
      }
    }
  }

  function pushWork(work, worker) {
    work.handle = getNewHandle();
    worker.worker.postMessage([
      work.handle,
      work.buffer,
      work.isImage,
      work.capLength
    ]);
    worker.assignedWork.push(work);
  }

  function getNewHandle() {
    handleCounter += 1;
    return handleCounter;
  }

  function getWork() {
    for (const work of workQueue) {
      if (!work.assigned) {
        return work;
      }
    }
  }

  function isWorkerFree(worker) {
    return worker.assignedWork.length < workLoadPerWorkers;
  }

  /**
   * workItems = [{buffer, isImage, capLength, meta}]
   * meta here is anything that will be given back on callback
   */
  function decompress(workItems, callback) {}

  function decodeImage(workItems, callback) {}

  return {
    decompress,
    decodeImage
  };
};

module.exports = DataWorkers;
