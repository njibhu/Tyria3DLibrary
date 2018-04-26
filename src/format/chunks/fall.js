var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: fall, versions: 1, strucTab: 0x16E9000 
    ///==================================================


    {
        name: 'fall',
        versions: {


            // => Version: 0
            0: function() {
                this.PackAnimFallbackV0 = [
                    'sourceAnim', Utils.getQWordReader(),
                    'targetAnims', Utils.getArrayReader(Utils.getQWordReader()),
                ];

                this.__root = this.PackAnimFallbacksV0 = [
                    'fallbacks', Utils.getArrayReader(this.PackAnimFallbackV0),
                ];

            },
        }
    }


]