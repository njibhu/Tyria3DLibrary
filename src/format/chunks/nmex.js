module.exports = [
    ///==================================================
    ///Chunk: nmex, versions: 3, strucTab: 0x1580D18     ///==================================================


    {
        name: 'nmex',
        versions: {


            // => Version: 2
            2: function() {
                this.PackMapNavMeshChunkExternalV2 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'filename', Utils.getFileNameReader(),
                ];

                this.PackMapNavMeshMoverV2 = [
                    'mapPropId', Utils.getQWordReader(),
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'mediatorData', Utils.getArrayReader('uint8'),
                ];

                this.__root = this.PackMapNavMeshExternalV2 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkExternalV2),
                    'dynamicArray', Utils.getArrayReader(this.PackMapNavMeshMoverV2),
                ];

            },

            // => Version: 1
            1: function() {
                this.PackMapNavMeshChunkExternalV1 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'filename', Utils.getFileNameReader(),
                ];

                this.__root = this.PackMapNavMeshExternalV1 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkExternalV1),
                ];

            },

            // => Version: 0
            0: function() {
                this.PackMapNavMeshChunkExternalV0 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'filename', Utils.getFileNameReader(),
                ];

                this.__root = this.PackMapNavMeshExternalV0 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkExternalV0),
                ];

            },
        }
    }


]