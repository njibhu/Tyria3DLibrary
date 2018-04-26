var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: octm, versions: 1, strucTab: 0x157DAA4 
    ///==================================================


    {
        name: 'octm',
        versions: {


            // => Version: 0
            0: function() {
                this.__root = this.MapOcclusionTome = [
                    'enableTomeQueries', 'uint32',
                    'tome', Utils.getArrayReader('uint8'),
                    'propIDMap', Utils.getArrayReader('uint8'),
                    'reserved', Utils.getArrayReader('uint8'),
                ];

            },
        }
    }


]