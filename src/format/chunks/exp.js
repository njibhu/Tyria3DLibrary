module.exports = [
    ///================================================== 
    ///Chunk: exp, versions: 1, strucTab: 0x157D700 
    ///==================================================
    {
        name: 'exp',
        versions: {


            // => Version: 0
            0: function() {
                this.MapExpansionProperty = [
                    'type', 'uint32',
                    'val', Utils.getQWordReader(),
                    'strVal', Utils.getFileNameReader(),
                ];

                this.__root = this.MapExpansionProperties = [
                    'properties', Utils.getArrayReader(this.MapExpansionProperty),
                ];

            },
        }
    }

]