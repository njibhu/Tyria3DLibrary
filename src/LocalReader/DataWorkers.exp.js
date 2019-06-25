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

const DataWorkers = function ({
  workersAmount = 1,
  workersPath,
  workLoadPerWorkers = 2
} = {}) {
  const workers = Array(workersAmount)
    .fill() // .map doesnt work on freshly created arrays
    .map(() => (initWorker(workersPath)));

  let handleCounter = 0;

  // Create a worker and
  function initWorker(path) {
    const assignedWork = []; // contains references from the queue
    const worker = new Worker(path);

    // There are no error recovery, we assume the worse and just reassign the work
    // and spawn a new worker
    worker.onerror = err => {
      console.err("Worker encountered an error, restarting... \n" + err);

      worker.terminate();
      workers.splice(workers.indexOf(worker), 1);

      const newWorker = initWorker(path);
      workers.push(newWorker);

      // push old work to it
      for (let work of assignedWork) {
        work.handle = undefined; // Invalidate the current handle
        pushWork(work, newWorker);
      }

    };

    worker.onmessage = ({ data }) => {
      if (typeof data === "string") {
        console.err("Inflater threw an error", data);
      }

      const [handle, buffer, dxtType, imageWidth, imageHeight] = data;
      const work = assignedWork.find(i => i.handle === handle);
      if (work) {
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

    worker.business = () => {
      return assignedWork.length;
    }

    return worker;
  }

  function getLeastBusyWorker() {
    // TODO

  }

  function pushWork(work, worker) {
    work.handle = getNewHandle();
    worker.postMessage([
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
      pushWork({ buffer, isImage, capLength, callback }, getLeastBusyWorker());
    }
  }

  return {
    decompress
  };
};

module.exports = DataWorkers;
