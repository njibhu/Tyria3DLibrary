module.exports = [
    ///==================================================
    ///Chunk: txtp, versions: 1, strucTab: 0x13F089C 
    ///==================================================


    {
        name: 'txtp',
        versions: {


            // => Version: 0
            0: function() {
                this.TextPackPassword = [
                    'textId', 'uint32',
                    'password', Utils.getQWordReader(),
                ];

                this.__root = this.TextPackPasswords = [
                    'stringCount', 'uint32',
                    'passwords', Utils.getArrayReader(this.TextPackPassword),
                ];

            },
        }
    }


]