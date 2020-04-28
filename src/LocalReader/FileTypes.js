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

const GW2File = require("../format/file/GW2File.js");

/**
 * @namespace FileTypes
 */

/**
 * Parse the beginning of a file to find its type
 *
 * @memberof FileTypes
 * @param {DataStream} ds
 * @return {number}
 */
function getFileType(ds) {
  let first4 = ds.readCString(4);

  let fileType = "UNKNOWN";

  // Parse textures
  const textureType = getAnetTextureType(first4);
  if (textureType) fileType = textureType;
  else if (first4.indexOf("DDS") === 0) fileType = "TEXTURE_DDS";
  else if (first4.indexOf("PNG") === 1) fileType = "TEXTURE_PNG";
  else if (first4.indexOf("RIFF") === 0) fileType = "TEXTURE_RIFF";
  else if (first4.indexOf("YUI") === 0) fileType = "TEXT_YUI";
  // PackFiles
  else if (first4.indexOf("PF") === 0) {
    let file = new GW2File(ds, 0, true); /// true for "plz no load chunkz"
    fileType = "PF_" + file.header.type;
  }

  // Binaries
  else if (first4.indexOf("MZ") === 0) fileType = "BINARIES";
  // Strings
  else if (first4.indexOf("strs") === 0) fileType = "STRINGS";
  // Raw asnd chunk (without pack file)
  else if (first4.indexOf("asnd") === 0) fileType = "CHUNK_ASND";

  // TODO: parse all datastream and if all bytes are valid unicode symbols then
  // TEXT_UNKNOWN;

  // Unknown
  return fileType;
}

/**
 * Returns the texture type if it's the Anet format, if not it returns undefined
 * @param {String} first4 First 4 bytes of the file
 * @returns {String|undefined}
 */
function getAnetTextureType(first4) {
  let textureType;
  if (first4 === "ATEC") textureType = "TEXTURE_ATEC";
  else if (first4 === "ATEP") textureType = "TEXTURE_ATEP";
  else if (first4 === "ATET") textureType = "TEXTURE_ATET";
  else if (first4 === "ATEU") textureType = "TEXTURE_ATEU";
  else if (first4 === "ATEX") textureType = "TEXTURE_ATEX";
  else if (first4 === "ATTX") textureType = "TEXTURE_ATTX";
  return textureType;
}

module.exports = {
  getFileType,
  getAnetTextureType
};
