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
 * Todo doc
 */


/**
 * @function
 * @param   {Array}     array           Array to iterate over
 * @param   {Function}  promiseTask     Working function on the element that returns a promise
 * @param   {Number}    limit           Amount of simultaneously spawned promises
 * @param   {String}    logPrefix       Progress prefix
 * @returns {Promise}   Return a promise that resolves when it has done iterating over
 */
function limitedAsyncIterator(array, promiseTask, limit, logPrefix){
    return new Promise((resolve, reject) => {
        let index = 0;
        let returned = 0;
    
        function startNewPromise(){
            //Progress:
            if(logPrefix)
                progress(index, array.length, logPrefix);

            //Continues iterating as long as we're in the range of the array
            if(index<array.length){
                //Tasks are supposed to handle their faults, it will spawn a new task
                //either way if it resolves or rejects
                promiseTask(array[index], index)
                    .then(startNewPromise)
                    .catch(startNewPromise);
                index += 1;
            } else {
                returned += 1;
                //Wait for the last promise to return
                if(returned == limit)
                    resolve();
            }
        }

        //Start the first promise
        for(let p = 0; p<limit; p++)
            startNewPromise();
    
    })
}

function progress(done, amount, prefix){
    done += 1;
    //Call at every percent
    if(done%Math.floor(amount/100) == 0) {
        T3D.Logger.log(T3D.Logger.TYPE_PROGRESS,
            prefix, done/Math.floor(amount/100))
    }

    return done;
}

module.exports = {
    limitedAsyncIterator: limitedAsyncIterator
}