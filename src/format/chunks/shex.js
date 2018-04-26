var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: shex, versions: 2, strucTab: 0x157F268 
    ///==================================================


    {
        name: 'shex',
        versions: {


            // => Version: 1
            1: function() {
                this.__root = this.PackMapShadowExtV1 = [
                    'filename', Utils.getFileNameReader(),
                    'shadowDims', ['[]', 'uint32', 2],
                ];

            },
        }
    }


]