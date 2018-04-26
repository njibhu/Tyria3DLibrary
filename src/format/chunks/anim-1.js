var Utils = T3D.ParserUtils;

module.exports = [
    ///==================================================
    ///Chunk: anim, versions: 3, strucTab: 0x16E9280 
    ///==================================================


    {
        name: 'anim',
        versions: {


            // => Version: 2, ReferencedFunction: 0x1228B70
            2: function() {
                this.PackEmoteTimingV2 = [
                    'ModelFile', Utils.getFileNameReader(),
                    'BlendIn', 'float32',
                    'BlendOut', 'float32',
                    'IntroDuration', 'uint32',
                    'LoopDuration', 'uint32',
                    'OutroDuration', 'uint32',
                ];

                this.PackEmoteAnimationV2 = [
                    'Token', Utils.getQWordReader(),
                    'Timing', Utils.getArrayReader(this.PackEmoteTimingV2),
                ];

                this.__root = this.PackEmoteAnimationsV2 = [
                    'Animation', Utils.getArrayReader(this.PackEmoteAnimationV2),
                ];

            },

            // => Version: 1
            1: function() {
                this.PackEmoteTimingV1 = [
                    'modelFileId', Utils.getFileNameReader(),
                    'blendInTime', 'float32',
                    'blendOutTime', 'float32',
                    'duration', 'uint32',
                    'loopDuration', 'uint32',
                ];

                this.PackEmoteAnimationV1 = [
                    'token', Utils.getQWordReader(),
                    'timings', Utils.getArrayReader(this.PackEmoteTimingV1),
                ];

                this.__root = this.PackEmoteAnimationsV1 = [
                    'animations', Utils.getArrayReader(this.PackEmoteAnimationV1),
                ];

            },

            // => Version: 0
            0: function() {
                this.PackEmoteTimingV0 = [
                    'modelFileId', Utils.getFileNameReader(),
                    'blendInTime', 'float32',
                    'blendOutTime', 'float32',
                    'duration', 'uint32',
                ];

                this.PackEmoteAnimationV0 = [
                    'token', Utils.getQWordReader(),
                    'timings', Utils.getArrayReader(this.PackEmoteTimingV0),
                ];

                this.__root = this.PackEmoteAnimationsV0 = [
                    'animations', Utils.getArrayReader(this.PackEmoteAnimationV0),
                ];

            },
        }
    }


]