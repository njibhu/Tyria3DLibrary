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
let GW2File = require('../format/file/GW2File.js');
/// EndIncludes

let FileTypes = {};

FileTypes.TYPE = {};

FileTypes.TYPE['UNKNOWN'] = 0x000;

FileTypes.TYPE['TEXTURE_ATEC'] = 0x101;
FileTypes.TYPE['TEXTURE_ATEP'] = 0x102;
FileTypes.TYPE['TEXTURE_ATET'] = 0x103;
FileTypes.TYPE['TEXTURE_ATEU'] = 0x104;
FileTypes.TYPE['TEXTURE_ATEX'] = 0x105;
FileTypes.TYPE['TEXTURE_ATTX'] = 0x106;
FileTypes.TYPE['TEXTURE_DDS'] = 0x120;
FileTypes.TYPE['TEXTURE_PNG'] = 0x121;

FileTypes.TYPE['STRINGS'] = 0x200;

FileTypes.TYPE['BINARIES'] = 0x300;

FileTypes.TYPE['PACK_UNSORTED'] = 0x400;
FileTypes.TYPE['PACK_ABIX'] = 0x401; //ABIX
FileTypes.TYPE['PACK_ABNK'] = 0x402; //ABNK
FileTypes.TYPE['PACK_AFNT'] = 0x403; //AFNT
FileTypes.TYPE['PACK_AMAT'] = 0x404; //AMAT
FileTypes.TYPE['PACK_AMSP'] = 0x405; //AMSP
FileTypes.TYPE['PACK_ANIC'] = 0x406; //anic
FileTypes.TYPE['PACK_ASND'] = 0x407; //ASND
FileTypes.TYPE['PACK_CDHS'] = 0x408; //CDHS
FileTypes.TYPE['PACK_CINP'] = 0x409; //CINP
FileTypes.TYPE['PACK_CMAC'] = 0x410; //cmaC
FileTypes.TYPE['PACK_CMPC'] = 0x411; //cmpc
FileTypes.TYPE['PACK_CNTC'] = 0x412; //cntc
FileTypes.TYPE['PACK_EMOC'] = 0x413; //emoc
FileTypes.TYPE['PACK_EULA'] = 0x414; //eula
FileTypes.TYPE['PACK_HVKC'] = 0x415; //hvkC
FileTypes.TYPE['PACK_MAPC'] = 0x416; //mapc
FileTypes.TYPE['PACK_MMET'] = 0x417; //mMet
FileTypes.TYPE['PACK_MODL'] = 0x418; //MODL
FileTypes.TYPE['PACK_MPSD'] = 0x419; //mpsd
FileTypes.TYPE['PACK_PIMG'] = 0x420; //PIMG
FileTypes.TYPE['PACK_PRLT'] = 0x421; //prlt
FileTypes.TYPE['PACK_STAR'] = 0x422; //STAR
FileTypes.TYPE['PACK_TXTM'] = 0x423; //txtm
FileTypes.TYPE['PACK_TXTV'] = 0x424; //txtv && txtV

/**
 * TODO
 * @function getTypeName
 */
FileTypes.getTypeName = function(typeID){
    for (let key in FileTypes.TYPE){
        if(FileTypes.TYPE[key] === typeID){
            return key;
        }
    }
    return undefined;
}

/**
 * TODO
 * @function getFileType 
 * @param {DataStream} ds 
 */
FileTypes.getFileType = function(ds){
    let first4 = ds.readCString(4);

    //Parse textures
    switch(first4){
        case 'ATEC':
            return FileTypes.TYPE.TEXTURE_ATEC;
        case 'ATEP':
            return FileTypes.TYPE.TEXTURE_ATEP;
        case 'ATET':
            return FileTypes.TYPE.TEXTURE_ATET;
        case 'ATEU':
            return FileTypes.TYPE.TEXTURE_ATEU;
        case 'ATEX':
            return FileTypes.TYPE.TEXTURE_ATEX;
        case 'ATTX':
            return FileTypes.TYPE.TEXTURE_ATTX;
    };

    if (first4.indexOf("DDS") === 0)
        return FileTypes.TYPE.TEXTURE_DDS;
    
    if (first4.indexOf("PNG") === 0)
        return FileTypes.TYPE.TEXTURE_PNG;

    // PackFiles
    if (first4.indexOf("PF") === 0){
        let file = new GW2File(ds, 0, true);/// true for "plz no load chunkz"
        switch(file.header.type) {
            case 'ABIX':
                return FileTypes.TYPE.PACK_ABIX;
            case 'ABNK':
                return FileTypes.TYPE.PACK_ABNK;
            case 'AFNT':
                return FileTypes.TYPE.PACK_AFNT;
            case 'AMAT':
                return FileTypes.TYPE.PACK_AMAT;
            case 'AMSP':
                return FileTypes.TYPE.PACK_AMSP;
            case 'anic':
                return FileTypes.TYPE.PACK_ANIC
            case 'ASND':
                return FileTypes.TYPE.PACK_ASND;
            case 'CDHS':
                return FileTypes.TYPE.PACK_CDHS;
            case 'CINP':
                return FileTypes.TYPE.PACK_CINP;
            case 'cmaC':
                return FileTypes.TYPE.PACK_CMAC;
            case 'cmpc':
                return FileTypes.TYPE.PACK_CMPC;
            case 'cntc':
                return FileTypes.TYPE.PACK_CNTC;
            case 'emoc':
                return FileTypes.TYPE.PACK_EMOC
            case 'eula':
                return FileTypes.TYPE.PACK_EULA;
            case 'hvkC':
                return FileTypes.TYPE.PACK_HVKC;
            case 'mapc':
                return FileTypes.TYPE.PACK_MAPC;
            case 'mMet':
                return FileTypes.TYPE.PACK_MMET;
            case 'MODL':
                return FileTypes.TYPE.PACK_MODL;
            case 'mpsd':
                return FileTypes.TYPE.PACK_MPSD;
            case 'PIMG':
                return FileTypes.TYPE.PACK_PIMG;
            case 'prlt':
                return FileTypes.TYPE.PACK_PRLT;
            case 'STAR':
                return FileTypes.TYPE.PACK_STAR;
            case 'txtm':
                return FileTypes.TYPE.PACK_TXTM;
            case 'txtv':
            case 'txtV':
                return FileTypes.TYPE.PACK_TXTV;
            default:
                return FileTypes.TYPE.PACK_UNSORTED;
        }
    }
    
    // Binaries
    if (first4.indexOf("MZ") === 0)
        return FileTypes.TYPE.BINARIES;
    
    // Strings
    if (first4.indexOf("strs") === 0)
        return FileTypes.TYPE.STRINGS;

    // Unknown
    return FileTypes.TYPE.UNKNOWN;
}

function isCorrectItem(item){
    return (
        Object.keys(item).length === 4 &&
        item[baseId] != undefined &&
        item[size] != undefined &&
        item[type] != undefined &&
        item[crc] != undefined
    );
}

module.exports = FileTypes;