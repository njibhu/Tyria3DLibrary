module.exports = [
    ///==================================================
    ///Chunk: mach, versions: 1, strucTab: 0x16E9174 
    ///==================================================


    {
        name: 'mach',
        versions: {


            // => Version: 0
            0: function() {
                this.PackAnimMachineActionV0 = [
                    'actionData', Unknown0x1C,
                ];

                this.PackAnimMachineActionBlockV0 = [
                    'actions', Utils.getArrayReader(this.PackAnimMachineActionV0),
                ];

                this.PackAnimMachineActionVariantV0 = [
                    'token', Utils.getQWordReader(),
                    'actionBlock', Utils.getPointerReader(this.PackAnimMachineActionBlockV0),
                ];

                this.PackAnimMachineActionVariantBlockV0 = [
                    'actionVariants', Utils.getArrayReader(this.PackAnimMachineActionVariantV0),
                ];

                this.PackAnimMachineTransitionVariantV0 = [
                    'token', Utils.getQWordReader(),
                    'actionBlock', Utils.getPointerReader(this.PackAnimMachineActionBlockV0),
                ];

                this.PackAnimMachineTransitionV0 = [
                    'name', Utils.getString16Reader(),
                    'targetStateName', Utils.getString16Reader(),
                    'actionBlock', Utils.getPointerReader(this.PackAnimMachineActionBlockV0),
                    'variants', Utils.getArrayReader(this.PackAnimMachineTransitionVariantV0),
                ];

                this.PackAnimMachineStateVariantV0 = [
                    'token', Utils.getQWordReader(),
                    'actionBlock', Utils.getPointerReader(this.PackAnimMachineActionBlockV0),
                    'actionVariantBlock', Utils.getPointerReader(this.PackAnimMachineActionVariantBlockV0),
                    'transitions', Utils.getArrayReader(this.PackAnimMachineTransitionV0),
                ];

                this.PackAnimMachineStateV0 = [
                    'name', Utils.getString16Reader(),
                    'actionBlock', Utils.getPointerReader(this.PackAnimMachineActionBlockV0),
                    'actionVariantBlock', Utils.getPointerReader(this.PackAnimMachineActionVariantBlockV0),
                    'transitions', Utils.getArrayReader(this.PackAnimMachineTransitionV0),
                    'variants', Utils.getArrayReader(this.PackAnimMachineStateVariantV0),
                ];

                this.PackAnimMachineV0 = [
                    'states', Utils.getArrayReader(this.PackAnimMachineStateV0),
                ];

                this.PackAnimModelV0 = [
                    'modelFileId', Utils.getFileNameReader(),
                    'modelFileRaw', Utils.getString16Reader(),
                    'machineIndex', 'uint32',
                ];

                this.__root = this.PackAnimMachinesV0 = [
                    'machines', Utils.getArrayReader(this.PackAnimMachineV0),
                    'models', Utils.getArrayReader(this.PackAnimModelV0),
                ];

            },
        }
    }


]