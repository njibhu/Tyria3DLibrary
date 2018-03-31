module.exports = [
    ///================================================== 
    ///Chunk: BIDX, versions: 1, strucTab: 0x1526E2C 
    ///==================================================
    {
        name: 'BIDX',
        versions: {


            // => Version: 0
            0: function() {
                this.BankFileNameDataV0 = [
                    'fileName', Utils.getFileNameReader(),
                ];

                this.BankLanguageDataV0 = [
                    'bankFileName', Utils.getArrayReader(this.BankFileNameDataV0),
                ];

                this.__root = this.BankIndexDataV0 = [
                    'bankLanguage', Utils.getArrayReader(this.BankLanguageDataV0),
                ];

            },
        }
    }

]