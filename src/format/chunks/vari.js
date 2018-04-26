var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: vari, versions: 1, strucTab: 0x13F08CC 
    ///==================================================


    {
        name: 'vari',
        versions: {


            // => Version: 0
            0: function() {
                this.TextPackVariant = [
                    'textId', 'uint32',
                    'variantTextIds', Utils.getArrayReader('uint32'),
                ];

                this.__root = this.TextPackVariants = [
                    'variants', Utils.getArrayReader(this.TextPackVariant),
                ];

            },
        }
    }


]