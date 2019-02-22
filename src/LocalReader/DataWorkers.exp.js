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
  function initWorker(path) {
    const assignedWork = []; // contains references from the queue
    const worker = new Worker(path);

    // There are no error recovery, we assume the worse and just reassign the work
    // and spawn a new worker
    worker.onerror = err => {
      console.err("Worker encountered an error, restarting... \n" + err);
      for (let work of assignedWork) {
        work.assigned = false;
        work.handle = undefined;
      }
      worker.terminate();
      workers.splice(workers.indexOf(worker), 1);
      workers.push(initWorker(path));
    };

    worker.onmessage = ({ data }) => {
      if (typeof data === "string") {
        console.err("Inflater threw an error", data);
      }

      const [handle, buffer, dxtType, imageWidth, imageHeight] = data;
      const work = assignedWork.find(i => i.handle === handle);
      if (work) {
        workQueue.splice(workQueue.indexOf(work), 1);
        assignedWork.splice(assignedWork.indexOf(work), 1);
        work.callback({
          buffer,
          dxtType,
          imageWidth,
          imageHeight
        });
      } else {
        console.err("Inflater returned data from unknown work !");
      }
    };

    return {
      worker
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
    work.assigned = true;
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
   * @typedef {Object} Work
   * @property {ArrayBuffer} buffer
   * @property {boolean} isImage
   * @property {number} capLength
   * @property {function} callback
   */

  /**
   * Ask a worker to decompress / decode data
   * @param {Array<Work>} workItems
   */
  function decompress(workItems) {
    for (const { buffer, isImage, capLength, callback } of workItems) {
      workQueue.push({ buffer, isImage, capLength, callback });
    }
    distributeWork();
  }

  return {
    decompress
  };
};

module.exports = DataWorkers;
