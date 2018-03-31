module.exports = [
    ///================================================== 
    ///Chunk: PRPS, versions: 1, strucTab: 0x15D06C4 
    ///==================================================
    {
        name: 'PRPS',
        versions: {


            // => Version: 0
            0: function() {
                this.ModelFixedOffsetData = [
                    'name', Utils.getQWordReader(),
                    'parentBone', Utils.getQWordReader(),
                    'translation', ['[]', 'float32', 3],
                ];

                this.ModelPropertyData = [
                    'id', Utils.getQWordReader(),
                    'type', 'uint32',
                    'mergeIndex', 'uint32',
                    'time', 'float32',
                    'val', Utils.getQWordReader(),
                    'strVal', Utils.getFileNameReader(),
                ];

                this.__root = this.ModelFileProperties = [
                    'fixedOffsetData', Utils.getArrayReader(this.ModelFixedOffsetData),
                    'properties', Utils.getArrayReader(this.ModelPropertyData),
                ];

            },
        }
    }

]