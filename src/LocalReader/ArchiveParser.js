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

/// Includes
const MathUtils = require('../util/MathUtils');
const defANDAT = require('../format/definition/ANDAT');
const defMFT = require('../format/definition/MFT');
/// EndIncludes

/**
 * TODO - doc
 * The ArchiveParser module is a set of tools for the Archive class to
 * correctly read the Archive
 */

readArchive = function(file, callback){
    let ANDatHeader, MFTTable, MFTIndex;

    //Parse the Archive Header
    function firstStep(callback) {
        getFilePart(file, 0, 40, (ds, len) => {
            ANDatHeader = parseANDatHeader(ds);
            callback();
        });
    }

    //Parse the file meta information table
    function secondStep(callback) {
        getFilePart(file, ANDatHeader.mftOffset, ANDatHeader.mftSize, (ds, len) => {
            MFTTable = parseMFTTable(ds, len);
            callback();
        });
    }

    //Parse the real index of each file
    function thirdStep(callback) {
        getFilePart(file, MFTTable.mftIndexOffset, MFTTable.mftIndexSize, (ds, len) => {
            MFTIndex = parseMFTIndex(ds, len);
            callback();
        });
    }

    firstStep(secondStep.bind(null, thirdStep.bind(null, () => {
        callback({
            ANDatHeader: ANDatHeader,
            MFTTable: MFTTable,
            MFTIndex: MFTIndex
        });
    })));
}

/**
 * TODO-doc
 * @function parseANDatHeader
 * @param {DataStream} ds
 * @return {Object|null} Returns null if the header couldn't be parsed
 */
parseANDatHeader = function(ds){
    var header = {};

    // Header parsing
    header.version = ds.readUint8();
    header.magic = ds.readString(3);
    header.headerSize = ds.readUint32();
    ds.seek(ds.position + 4); //Skip uint32
    header.chunkSize = ds.readUint32();
    header.crc = ds.readUint32();
    ds.seek(ds.position + 4); //Skip uint32
    header.mftOffset = MathUtils.arr32To64([ds.readUint32(), ds.readUint32()]);
    header.mftSize = ds.readUint32();
    header.flags = ds.readUint32();
    // End header parsing

    //Check MAGIC
    if(header.magic != "AN\u001A"){
        T3D.Logger.log(
            T3D.Logger.TYPE_ERROR, "ANDat header is not valid", header.magic);
        return null;
    }

    T3D.Logger.log(
        T3D.Logger.TYPE_DEBUG,
        "Loaded Main .dat header"
    );

    return header;
}

/**
 * TODO- doc
 * @function parseMFTTable
 * @param {Datastream}  ds
 * @return  {Object|null}   Returns null if it couldn't parse the table
 */
parseMFTTable = function(ds){
    // Parse the table header
    var header = {};
    header.magic = ds.readString(4);
    ds.seek(ds.position + 8) //Skip uint64
    header.nbOfEntries = ds.readUint32();
    ds.seek(ds.position + 4 + 4); //Skip uint32 * 2

    //check MAGIC
    if(header.magic != "Mft\u001A"){
        T3D.Logger.log(
            T3D.Logger.TYPE_ERROR, "MFTTable header is not valid", header.magic);
        return null;
    }

    //Where we put all the parsed data
    //We don't pre-alloc anymore since not having the data aligned together procs too many
    //cache misses during a fullscan
    let fullTable = [];
    
    // Go through the table
    for(let i=0; i<header.nbOfEntries - 1; i++){
        let item = {};
        item['offset'] = MathUtils.arr32To64([ds.readUint32(), ds.readUint32()]);
        item['size'] = ds.readUint32();
        item['compressed'] = ds.readUint16();
        ds.seek(ds.position + 4 + 2); //Skip uint16 + uint32
        item['crc'] = ds.readUint32();
        fullTable[i] = item;
    }

    T3D.Logger.log(
		T3D.Logger.TYPE_DEBUG,
		"Loaded MFTTable"
	);

    return {
        header: header, 
        table: fullTable, 
        //Register the MFTIndex table position and size
        mftIndexOffset: fullTable[1].offset, 
        mftIndexSize: fullTable[1].size
    };
}

/**
 * TODO - doc
 *   This function used to be much more complex with the use of
 *   a "fileId" which in the end was just the equivalent of 
 *   MFTbaseIds[mftId].sort().reverse()[0] (aka the bigger baseId found)
 * @param {*} ds 
 * @param {*} size 
 */
parseMFTIndex = function(ds, size){
    let length = size / 8;

    let baseIdToMFT = [];
    let MFTbaseIds = [];

    for(let i=0; i<length; i++){
        //Parse table
        let id = ds.readUint32();
        let mftIndex = ds.readUint32();
        //Store the values
        baseIdToMFT[id] = mftIndex;
        if(!MFTbaseIds[mftIndex])
            MFTbaseIds[mftIndex] = [];
        MFTbaseIds[mftIndex].push(id);
    }

    T3D.Logger.log(
		T3D.Logger.TYPE_DEBUG,
		"Finished indexing MFT"
	);

    return {
        baseIdToMFT: baseIdToMFT, 
        MFTbaseIds: MFTbaseIds
    };
}

getFilePart = function(file, offset, length, callback){
    var reader = new FileReader();
		
	reader.onerror = function(fileEvent){
		throw new Error(fileEvent);
	}
	reader.onload  = function(fileEvent){
		var buffer = fileEvent.target.result;
		var ds = new DataStream(buffer);
	  	ds.endianness = DataStream.LITTLE_ENDIAN;
        /// Pass data stream and data length to callback function, keeping "this" scope
        callback(ds, length);
	}
	
	reader.readAsArrayBuffer(file.slice(offset, offset + length));
}

module.exports = {
    readArchive: readArchive,
    parseANDatHeader: parseANDatHeader,
    parseMFTTable: parseMFTTable,
    parseMFTIndex: parseMFTIndex,
    getFilePart: getFilePart
};