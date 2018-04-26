var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: nvms, versions: 3, strucTab: 0x1580A24 
    ///==================================================


    {
        name: 'nvms',
        versions: {


            // => Version: 2
            2: function() {
                this.PackMapNavMeshChunkV2 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

                this.PackMapNavMeshMoverV2 = [
                    'mapPropId', Utils.getQWordReader(),
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'mediatorData', Utils.getArrayReader('uint8'),
                ];

                this.__root = this.PackMapNavMeshV2 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkV2),
                    'dynamicArray', Utils.getArrayReader(this.PackMapNavMeshMoverV2),
                ];

            },

            // => Version: 1, ReferencedFunction: 0xFFCF40
            1: function() {
                this.PackMapNavMeshChunkV1 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

                this.__root = this.PackMapNavMeshV1 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkV1),
                ];

            },

            // => Version: 0
            0: function() {
                this.PackMapNavMeshChunkV0 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

                this.__root = this.PackMapNavMeshV0 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'chunkDims', ['[]', 'uint32', 2],
                    'chunkArray', Utils.getArrayReader(this.PackMapNavMeshChunkV0),
                ];

            },
        }
    },


    ///==================================================
    ///Chunk: nvms, versions: 3, strucTab: 0x1580D3C 
    ///==================================================


    {
        name: 'nvms',
        versions: {


            // => Version: 2
            2: function() {
                this.__root = this.PackMapNavMeshChunkV2 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

            },

            // => Version: 1, ReferencedFunction: 0xFFCEE0
            1: function() {
                this.__root = this.PackMapNavMeshChunkV1 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

            },

            // => Version: 0
            0: function() {
                this.__root = this.PackMapNavMeshChunkV0 = [
                    'boundsMin', ['[]', 'float32', 3],
                    'boundsMax', ['[]', 'float32', 3],
                    'navMeshData', Utils.getArrayReader('uint8'),
                    'coarseGraphData', Utils.getArrayReader('uint8'),
                    'queryMediatorMoppData', Utils.getArrayReader('uint8'),
                ];

            },
        }
    }


]