module.exports = [
    ///================================================== 
    ///Chunk: msn, versions: 3, strucTab: 0x157D980 
    ///==================================================
    {
        name: 'msn',
        versions: {


            // => Version: 2
            2: function() {
                this.PackMapInterestPoint = [
                    'position', ['[]', 'float32', 3],
                    'forward', ['[]', 'float32', 3],
                    'description', Utils.getString16Reader(),
                ];

                this.__root = this.MapMission = [
                    'interestPoint', Utils.getArrayReader(this.PackMapInterestPoint),
                ];

            },

            // => Version: 1
            1: function() {
                this.PackMapInterestPoint = [
                    'position', ['[]', 'float32', 3],
                    'forward', ['[]', 'float32', 3],
                ];

                this.__root = this.MapMission = [
                    'interestPoint', Utils.getArrayReader(this.PackMapInterestPoint),
                ];

            },
        }
    }

]