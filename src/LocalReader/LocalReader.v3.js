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
 * LocalReader (Back to synchronous calls, for performance reasons)
 *
 * - constructor(archive, options)
 * - getFiles([fileIndex], callback(err, {index, file}))
 * - getFilesMetaData([fileIndex], scanType, callback(err, {index, metadata}))
 */

const LocalReader = function(archive, { metaDataCache }) {
  if (metaDataCache) {
    // compare crcs and size for each entry and remove the entry from the cache if it doesn't match
  }

  /**
   * Replaces all the functions to get the decompressed file, decoded image or raw one.
   * But works natively in batch mode allowing to efficiently query multiple at once.
   */
  function getFiles(
    fileIndexArray,
    { uncompress = true, decodeImage = false } = {},
    callback
  ) {}

  /**
   * Replaces all the functions to get file types, maps, offsets, size, compression...
   * Some fields are hidden by default since they should never be used. (offset, mftIndex)
   * The "type" field is not enabled by default, if the the type is not in the cache it will be undefined
   * The "scanForType" option can be used to tell the LocalReader to read the file head to get its type
   * if it can't get it from the cache. But if it already knows it, it returns it from the cache.
   */
  function getFilesMetaData(
    fileIndexArray,
    {
      scanForType = false,
      filterFields = ["index", "compressed", "size", "crc"]
    } = {},
    callback
  ) {}

  /**
   * getCache returns a snapshot of the cache, it should be used with persistant storage to allow fast
   * archive opening times.
   */
  function getCache() {}

  return {
    getFiles,
    getFilesMetaData,
    getCache
  };
};

module.exports = LocalReader;
