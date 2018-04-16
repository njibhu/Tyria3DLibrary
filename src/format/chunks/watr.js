module.exports = [
    ///==================================================
    ///Chunk: watr, versions: 1, strucTab: 0x157FE34     ///==================================================


    {
        name: 'watr',
        versions: {


            // => Version: 0
            0: function() {
                this.__root = this.PackMapWaterV0 = [
                    'waterFoamData', Utils.getArrayReader('uint8'),
                    'waterChunks', Utils.getArrayReader('uint32'),
                ];

            },
        }
    }


]