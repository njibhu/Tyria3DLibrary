module.exports = [
    ///==================================================
    ///Chunk: eula, versions: 1, strucTab: 0x16E93AC 
    ///==================================================


    {
        name: 'eula',
        versions: {


            // => Version: 0
            0: function() {
                this.PackEulaLanguageV0 = [
                    'Language', 'uint8',
                    'Text', Utils.getString16Reader(),
                ];

                this.__root = this.PackEulaV0 = [
                    'Language', Utils.getArrayReader(this.PackEulaLanguageV0),
                    'Version', 'uint8',
                ];

            },
        }
    }


]