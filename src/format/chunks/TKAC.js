module.exports = [
    ///================================================== 
    ///Chunk: TKAC, versions: 1, strucTab: 0x16923B8 
    ///==================================================
    {
        name: 'TKAC',
        versions: {


            // => Version: 0
            0: function() {
                this.KeyEntry = [
                    'assetType', 'uint32',
                    'assetId', 'uint32',
                    'key', Utils.getQWordReader(),
                ];

                this.__root = this.KeyTableData = [
                    'keyEntryArr', Utils.getArrayReader(this.KeyEntry),
                ];

            },
        }
    }

]