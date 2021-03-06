let Utils = T3D.ParserUtils;

module.exports = [
  /// ==================================================
  /// Chunk: comp, versions: 20, strucTab: 0x18840B0
  /// ==================================================

  {
    name: "comp",
    versions: {
      // => Version: 19
      19: function() {
        this.PackCompositeBlitRectSetV19 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV19 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV19 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV19)
        ];

        this.PackCompositeMorphWeightV19 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV19 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV19),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV19)
        ];

        this.PackCompositeBoneScaleFileV19 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV19 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "animRoleOverride",
          Utils.getQWordReader(),
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV19 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeSkinStyleV19 = [
          "chest",
          Utils.getQWordReader(),
          "feet",
          Utils.getQWordReader(),
          "hands",
          Utils.getQWordReader(),
          "legs",
          Utils.getQWordReader()
        ];

        this.PackCompositeColorV19 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV19 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV19,
          "color1",
          this.PackCompositeColorV19,
          "color2",
          this.PackCompositeColorV19,
          "color3",
          this.PackCompositeColorV19
        ];

        this.PackCompositeVariantV19 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV19),
          "eyeColor",
          this.PackCompositeColorV19,
          "hairColor",
          this.PackCompositeColorV19,
          "hairColor2",
          this.PackCompositeColorV19,
          "patternColor",
          this.PackCompositeColorV19,
          "skinColor",
          this.PackCompositeColorV19,
          "skinIndex",
          "uint32",
          "skinStyle",
          "uint32"
        ];

        this.PackCompositeAnimOverrideV19 = [
          "animRole",
          Utils.getQWordReader(),
          "filepath",
          Utils.getFileNameReader()
        ];

        this.PackCompositeRaceDataV19 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV19),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV19),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV19),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV19),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV19),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyles",
          Utils.getArrayReader(this.PackCompositeSkinStyleV19),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV19),
          "animOverrides",
          Utils.getArrayReader(this.PackCompositeAnimOverrideV19)
        ];

        this.__root = this.PackCompositeV19 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV19),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV19),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV19),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 18
      18: function() {
        this.PackCompositeBlitRectSetV18 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV18 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV18 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV18)
        ];

        this.PackCompositeMorphWeightV18 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV18 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV18),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV18)
        ];

        this.PackCompositeBoneScaleFileV18 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV18 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "animRoleOverride",
          Utils.getQWordReader(),
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV18 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeSkinStyleV18 = [
          "chest",
          Utils.getQWordReader(),
          "feet",
          Utils.getQWordReader(),
          "hands",
          Utils.getQWordReader(),
          "legs",
          Utils.getQWordReader()
        ];

        this.PackCompositeColorV18 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV18 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV18,
          "color1",
          this.PackCompositeColorV18,
          "color2",
          this.PackCompositeColorV18,
          "color3",
          this.PackCompositeColorV18
        ];

        this.PackCompositeVariantV18 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV18),
          "eyeColor",
          this.PackCompositeColorV18,
          "hairColor",
          this.PackCompositeColorV18,
          "hairColor2",
          this.PackCompositeColorV18,
          "patternColor",
          this.PackCompositeColorV18,
          "skinColor",
          this.PackCompositeColorV18,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeAnimOverrideV18 = [
          "animRole",
          Utils.getQWordReader(),
          "filepath",
          Utils.getFileNameReader()
        ];

        this.PackCompositeRaceDataV18 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV18),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV18),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV18),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV18),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV18),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyles",
          Utils.getArrayReader(this.PackCompositeSkinStyleV18),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV18),
          "animOverrides",
          Utils.getArrayReader(this.PackCompositeAnimOverrideV18)
        ];

        this.__root = this.PackCompositeV18 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV18),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV18),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV18),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 17, ReferencedFunction: 0x1103270
      17: function() {
        this.PackCompositeBlitRectSetV17 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV17 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV17 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV17)
        ];

        this.PackCompositeMorphWeightV17 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV17 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV17),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV17)
        ];

        this.PackCompositeBoneScaleFileV17 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV17 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV17 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeSkinStyleV17 = [
          "chest",
          Utils.getQWordReader(),
          "feet",
          Utils.getQWordReader(),
          "hands",
          Utils.getQWordReader(),
          "legs",
          Utils.getQWordReader()
        ];

        this.PackCompositeColorV17 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV17 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV17,
          "color1",
          this.PackCompositeColorV17,
          "color2",
          this.PackCompositeColorV17,
          "color3",
          this.PackCompositeColorV17
        ];

        this.PackCompositeVariantV17 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV17),
          "eyeColor",
          this.PackCompositeColorV17,
          "hairColor",
          this.PackCompositeColorV17,
          "hairColor2",
          this.PackCompositeColorV17,
          "patternColor",
          this.PackCompositeColorV17,
          "skinColor",
          this.PackCompositeColorV17,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeAnimOverrideV17 = [
          "animRole",
          Utils.getQWordReader(),
          "filepath",
          Utils.getFileNameReader()
        ];

        this.PackCompositeRaceDataV17 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV17),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV17),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV17),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV17),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV17),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyles",
          Utils.getArrayReader(this.PackCompositeSkinStyleV17),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV17),
          "animOverrides",
          Utils.getArrayReader(this.PackCompositeAnimOverrideV17)
        ];

        this.__root = this.PackCompositeV17 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV17),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV17),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV17),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 16, ReferencedFunction: 0x1102ED0
      16: function() {
        this.PackCompositeBlitRectSetV16 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV16 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV16 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV16)
        ];

        this.PackCompositeMorphWeightV16 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV16 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV16),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV16)
        ];

        this.PackCompositeBoneScaleFileV16 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV16 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV16 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV16 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV16 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV16,
          "color1",
          this.PackCompositeColorV16,
          "color2",
          this.PackCompositeColorV16,
          "color3",
          this.PackCompositeColorV16
        ];

        this.PackCompositeVariantV16 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV16),
          "eyeColor",
          this.PackCompositeColorV16,
          "hairColor",
          this.PackCompositeColorV16,
          "hairColor2",
          this.PackCompositeColorV16,
          "patternColor",
          this.PackCompositeColorV16,
          "skinColor",
          this.PackCompositeColorV16,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeAnimOverrideV16 = [
          "animRole",
          Utils.getQWordReader(),
          "filepath",
          Utils.getFileNameReader()
        ];

        this.PackCompositeRaceDataV16 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV16),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV16),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV16),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV16),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV16),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyleCount",
          "uint8",
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV16),
          "animOverrides",
          Utils.getArrayReader(this.PackCompositeAnimOverrideV16)
        ];

        this.__root = this.PackCompositeV16 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV16),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV16),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV16),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 15
      15: function() {
        this.PackCompositeBlitRectSetV15 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV15 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV15 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV15)
        ];

        this.PackCompositeMorphWeightV15 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV15 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV15),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV15)
        ];

        this.PackCompositeBoneScaleFileV15 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV15 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV15 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV15 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV15 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV15,
          "color1",
          this.PackCompositeColorV15,
          "color2",
          this.PackCompositeColorV15,
          "color3",
          this.PackCompositeColorV15
        ];

        this.PackCompositeVariantV15 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV15),
          "eyeColor",
          this.PackCompositeColorV15,
          "hairColor",
          this.PackCompositeColorV15,
          "hairColor2",
          this.PackCompositeColorV15,
          "patternColor",
          this.PackCompositeColorV15,
          "skinColor",
          this.PackCompositeColorV15,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeAnimOverrideV15 = [
          "animRole",
          Utils.getQWordReader(),
          "filepath",
          Utils.getFileNameReader()
        ];

        this.PackCompositeRaceDataV15 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV15),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV15),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV15),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV15),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV15),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyleCount",
          "uint8",
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV15),
          "animOverrides",
          Utils.getArrayReader(this.PackCompositeAnimOverrideV15)
        ];

        this.__root = this.PackCompositeV15 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV15),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV15),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV15),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 14
      14: function() {
        this.PackCompositeBlitRectSetV14 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV14 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV14 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV14)
        ];

        this.PackCompositeMorphWeightV14 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32"
        ];

        this.PackCompositeBoneScaleV14 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV14),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV14)
        ];

        this.PackCompositeBoneScaleFileV14 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV14 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV14 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV14 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV14 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV14,
          "color1",
          this.PackCompositeColorV14,
          "color2",
          this.PackCompositeColorV14,
          "color3",
          this.PackCompositeColorV14
        ];

        this.PackCompositeVariantV14 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV14),
          "eyeColor",
          this.PackCompositeColorV14,
          "hairColor",
          this.PackCompositeColorV14,
          "hairColor2",
          this.PackCompositeColorV14,
          "patternColor",
          this.PackCompositeColorV14,
          "skinColor",
          this.PackCompositeColorV14,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV14 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV14),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV14),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "eyeColorPalette",
          Utils.getString16Reader(),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV14),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV14),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV14),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyleCount",
          "uint8",
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV14)
        ];

        this.__root = this.PackCompositeV14 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV14),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV14),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV14),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 13
      13: function() {
        this.PackCompositeBlitRectSetV13 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV13 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV13 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV13)
        ];

        this.PackCompositeMorphWeightV13 = [
          "value",
          "float32",
          "name",
          Utils.getQWordReader()
        ];

        this.PackCompositeBoneScaleV13 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV13),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV13)
        ];

        this.PackCompositeBoneScaleFileV13 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV13 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint8",
          "flags",
          "uint8",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint8"
        ];

        this.PackCompositeSkinPatternV13 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV13 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV13 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV13,
          "color1",
          this.PackCompositeColorV13,
          "color2",
          this.PackCompositeColorV13,
          "color3",
          this.PackCompositeColorV13
        ];

        this.PackCompositeVariantV13 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV13),
          "hairColor",
          this.PackCompositeColorV13,
          "hairColor2",
          this.PackCompositeColorV13,
          "patternColor",
          this.PackCompositeColorV13,
          "skinColor",
          this.PackCompositeColorV13,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV13 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV13),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV13),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV13),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV13),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV13),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyleCount",
          "uint8",
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV13)
        ];

        this.__root = this.PackCompositeV13 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV13),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV13),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV13),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 12
      12: function() {
        this.PackCompositeBlitRectSetV12 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV12 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV12 = [
          "name",
          Utils.getQWordReader(),
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV12)
        ];

        this.PackCompositeMorphWeightV12 = [
          "value",
          "float32",
          "name",
          Utils.getQWordReader()
        ];

        this.PackCompositeBoneScaleV12 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV12),
          "MorphWeight",
          Utils.getArrayReader(this.PackCompositeMorphWeightV12)
        ];

        this.PackCompositeBoneScaleFileV12 = [
          "fileName",
          Utils.getString16Reader()
        ];

        this.PackCompositeFileDataV12 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV12 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV12 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV12 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV12,
          "color1",
          this.PackCompositeColorV12,
          "color2",
          this.PackCompositeColorV12,
          "color3",
          this.PackCompositeColorV12
        ];

        this.PackCompositeVariantV12 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV12),
          "hairColor",
          this.PackCompositeColorV12,
          "hairColor2",
          this.PackCompositeColorV12,
          "patternColor",
          this.PackCompositeColorV12,
          "skinColor",
          this.PackCompositeColorV12,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV12 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "bodyBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV12),
          "bodyBoneScaleFiles",
          Utils.getArrayReader(this.PackCompositeBoneScaleFileV12),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faceBoneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV12),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV12),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV12),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "skinStyleCount",
          "uint8",
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV12)
        ];

        this.__root = this.PackCompositeV12 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV12),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV12),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV12),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 11, ReferencedFunction: 0x1102E90
      11: function() {
        this.PackCompositeBlitRectSetV11 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeBoneScaleParamV11 = [
          "name",
          Utils.getQWordReader(),
          "flags",
          "uint8",
          "max",
          "float32",
          "min",
          "float32",
          "rotate",
          ["[]", "float32", 3],
          "scale",
          ["[]", "float32", 3],
          "translate",
          ["[]", "float32", 3]
        ];

        this.PackCompositeBoneScaleRegionV11 = [
          "value",
          "float32",
          "Bone",
          Utils.getArrayReader(this.PackCompositeBoneScaleParamV11)
        ];

        this.PackCompositeBoneScaleV11 = [
          "BodyRegion",
          Utils.getArrayReader(this.PackCompositeBoneScaleRegionV11)
        ];

        this.PackCompositeFileDataV11 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV11 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV11 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV11 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV11,
          "color1",
          this.PackCompositeColorV11,
          "color2",
          this.PackCompositeColorV11,
          "color3",
          this.PackCompositeColorV11
        ];

        this.PackCompositeVariantV11 = [
          "token",
          Utils.getQWordReader(),
          "boneScaleIndex",
          "uint32",
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV11),
          "hairColor",
          this.PackCompositeColorV11,
          "hairColor2",
          this.PackCompositeColorV11,
          "patternColor",
          this.PackCompositeColorV11,
          "skinColor",
          this.PackCompositeColorV11,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV11 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV11),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV11),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV11)
        ];

        this.__root = this.PackCompositeV11 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV11),
          "boneScales",
          Utils.getArrayReader(this.PackCompositeBoneScaleV11),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV11),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 10
      10: function() {
        this.PackCompositeBlitRectSetV10 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV10 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV10 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV10 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV10 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV10,
          "color1",
          this.PackCompositeColorV10,
          "color2",
          this.PackCompositeColorV10,
          "color3",
          this.PackCompositeColorV10
        ];

        this.PackCompositeVariantV10 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV10),
          "hairColor",
          this.PackCompositeColorV10,
          "hairColor2",
          this.PackCompositeColorV10,
          "patternColor",
          this.PackCompositeColorV10,
          "skinColor",
          this.PackCompositeColorV10,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV10 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV10),
          "flags",
          "uint32",
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV10),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV10)
        ];

        this.__root = this.PackCompositeV10 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV10),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV10),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 9
      9: function() {
        this.PackCompositeBlitRectSetV9 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV9 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV9 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV9 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV9 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV9,
          "color1",
          this.PackCompositeColorV9,
          "color2",
          this.PackCompositeColorV9,
          "color3",
          this.PackCompositeColorV9
        ];

        this.PackCompositeVariantV9 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV9),
          "hairColor",
          this.PackCompositeColorV9,
          "hairColor2",
          this.PackCompositeColorV9,
          "patternColor",
          this.PackCompositeColorV9,
          "skinColor",
          this.PackCompositeColorV9,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV9 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV9),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV9),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV9)
        ];

        this.__root = this.PackCompositeV9 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV9),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV9),
          "configVersion",
          "uint16"
        ];
      },

      // => Version: 8
      8: function() {
        this.PackCompositeBlitRectSetV8 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV8 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV8 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV8 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV8 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV8,
          "color1",
          this.PackCompositeColorV8,
          "color2",
          this.PackCompositeColorV8,
          "color3",
          this.PackCompositeColorV8
        ];

        this.PackCompositeVariantV8 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV8),
          "hairColor",
          this.PackCompositeColorV8,
          "hairColor2",
          this.PackCompositeColorV8,
          "patternColor",
          this.PackCompositeColorV8,
          "skinColor",
          this.PackCompositeColorV8,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV8 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "baseHeadToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV8),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV8),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV8)
        ];

        this.__root = this.PackCompositeV8 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV8),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV8)
        ];
      },

      // => Version: 7
      7: function() {
        this.PackCompositeBlitRectSetV7 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV7 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV7 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV7 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV7 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV7,
          "color1",
          this.PackCompositeColorV7,
          "color2",
          this.PackCompositeColorV7,
          "color3",
          this.PackCompositeColorV7
        ];

        this.PackCompositeVariantV7 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV7),
          "hairColor",
          this.PackCompositeColorV7,
          "hairColor2",
          this.PackCompositeColorV7,
          "patternColor",
          this.PackCompositeColorV7,
          "skinColor",
          this.PackCompositeColorV7,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV7 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV7),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV7),
          "skinColorPalette",
          Utils.getString16Reader(),
          "skinPatternPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV7)
        ];

        this.__root = this.PackCompositeV7 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV7),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV7)
        ];
      },

      // => Version: 6
      6: function() {
        this.PackCompositeBlitRectSetV6 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV6 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV6 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader(),
          "ears",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV6 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV6 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV6,
          "color1",
          this.PackCompositeColorV6,
          "color2",
          this.PackCompositeColorV6,
          "color3",
          this.PackCompositeColorV6
        ];

        this.PackCompositeVariantV6 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV6),
          "hairColor",
          this.PackCompositeColorV6,
          "hairColor2",
          this.PackCompositeColorV6,
          "patternColor",
          this.PackCompositeColorV6,
          "skinColor",
          this.PackCompositeColorV6,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV6 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV6),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV6),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV6)
        ];

        this.__root = this.PackCompositeV6 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV6),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV6)
        ];
      },

      // => Version: 5
      5: function() {
        this.PackCompositeBlitRectSetV5 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV5 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV5 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV5 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV5 = [
          "nameToken",
          Utils.getQWordReader(),
          "color0",
          this.PackCompositeColorV5,
          "color1",
          this.PackCompositeColorV5,
          "color2",
          this.PackCompositeColorV5,
          "color3",
          this.PackCompositeColorV5
        ];

        this.PackCompositeVariantV5 = [
          "token",
          Utils.getQWordReader(),
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV5),
          "hairColor",
          this.PackCompositeColorV5,
          "hairColor2",
          this.PackCompositeColorV5,
          "patternColor",
          this.PackCompositeColorV5,
          "skinColor",
          this.PackCompositeColorV5,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV5 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV5),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV5),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV5)
        ];

        this.__root = this.PackCompositeV5 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV5),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV5)
        ];
      },

      // => Version: 4
      4: function() {
        this.PackCompositeBlitRectSetV4 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint8"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV4 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV4 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV4 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV4 = [
          "nameToken",
          Utils.getQWordReader(),
          "clothColor",
          this.PackCompositeColorV4,
          "leatherColor",
          this.PackCompositeColorV4,
          "metalColor",
          this.PackCompositeColorV4
        ];

        this.PackCompositeVariantV4 = [
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV4),
          "hairColor",
          this.PackCompositeColorV4,
          "patternColor",
          this.PackCompositeColorV4,
          "skinColor",
          this.PackCompositeColorV4,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV4 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV4),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV4),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV4)
        ];

        this.__root = this.PackCompositeV4 = [
          "armorColorIds",
          Utils.getArrayReader("uint32"),
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV4),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV4)
        ];
      },

      // => Version: 3
      3: function() {
        this.PackCompositeBlitRectSetV3 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint32"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV3 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV3 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV3 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV3 = [
          "nameToken",
          Utils.getQWordReader(),
          "clothColor",
          this.PackCompositeColorV3,
          "leatherColor",
          this.PackCompositeColorV3,
          "metalColor",
          this.PackCompositeColorV3
        ];

        this.PackCompositeVariantV3 = [
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV3),
          "hairColor",
          this.PackCompositeColorV3,
          "patternColor",
          this.PackCompositeColorV3,
          "skinColor",
          this.PackCompositeColorV3,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV3 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "beard",
          Utils.getArrayReader(Utils.getQWordReader()),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV3),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV3),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV3)
        ];

        this.__root = this.PackCompositeV3 = [
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV3),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV3)
        ];
      },

      // => Version: 2
      2: function() {
        this.PackCompositeBlitRectSetV2 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint32"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV2 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV2 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV2 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV2 = [
          "nameToken",
          Utils.getQWordReader(),
          "clothColor",
          this.PackCompositeColorV2,
          "leatherColor",
          this.PackCompositeColorV2,
          "metalColor",
          this.PackCompositeColorV2
        ];

        this.PackCompositeVariantV2 = [
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV2),
          "hairColor",
          this.PackCompositeColorV2,
          "patternColor",
          this.PackCompositeColorV2,
          "skinColor",
          this.PackCompositeColorV2,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV2 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV2),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV2),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV2)
        ];

        this.__root = this.PackCompositeV2 = [
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV2),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV2)
        ];
      },

      // => Version: 1
      1: function() {
        this.PackCompositeBlitRectSetV1 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint32"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV1 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskDye1",
          Utils.getFileNameReader(),
          "maskDye2",
          Utils.getFileNameReader(),
          "maskDye3",
          Utils.getFileNameReader(),
          "maskDye4",
          Utils.getFileNameReader(),
          "maskCut",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "dyeFlags",
          "uint32",
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV1 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV1 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV1 = [
          "nameToken",
          Utils.getQWordReader(),
          "clothColor",
          this.PackCompositeColorV1,
          "leatherColor",
          this.PackCompositeColorV1,
          "metalColor",
          this.PackCompositeColorV1
        ];

        this.PackCompositeVariantV1 = [
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV1),
          "hairColor",
          this.PackCompositeColorV1,
          "patternColor",
          this.PackCompositeColorV1,
          "skinColor",
          this.PackCompositeColorV1,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV1 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV1),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "hairColorPalette",
          Utils.getString16Reader(),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV1),
          "skinColorPalette",
          Utils.getString16Reader(),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV1)
        ];

        this.__root = this.PackCompositeV1 = [
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV1),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV1)
        ];
      },

      // => Version: 0
      0: function() {
        this.PackCompositeBlitRectSetV0 = [
          "name",
          Utils.getString16Reader(),
          "size",
          ["[]", "uint32", 2],
          "rectIndex",
          Utils.getArrayReader("uint32"),
          "rectArray",
          Utils.getArrayReader(["[]", "uint32", 4])
        ];

        this.PackCompositeFileDataV0 = [
          "name",
          Utils.getQWordReader(),
          "type",
          "uint32",
          "meshBase",
          Utils.getFileNameReader(),
          "meshOverlap",
          Utils.getFileNameReader(),
          "maskClothSkin",
          Utils.getFileNameReader(),
          "maskLeather",
          Utils.getFileNameReader(),
          "maskMetal",
          Utils.getFileNameReader(),
          "maskGlow",
          Utils.getFileNameReader(),
          "textureBase",
          Utils.getFileNameReader(),
          "textureNormal",
          Utils.getFileNameReader(),
          "hideFlags",
          "uint32",
          "skinFlags",
          "uint32",
          "blitRectIndex",
          "uint32"
        ];

        this.PackCompositeSkinPatternV0 = [
          "chest",
          Utils.getFileNameReader(),
          "face",
          Utils.getFileNameReader(),
          "feet",
          Utils.getFileNameReader(),
          "hands",
          Utils.getFileNameReader(),
          "legs",
          Utils.getFileNameReader()
        ];

        this.PackCompositeColorV0 = [
          "brightness",
          "uint8",
          "contrast",
          "uint8",
          "hue",
          "uint8",
          "saturation",
          "uint8",
          "lightness",
          "uint8"
        ];

        this.PackCompositeVariantComponentV0 = [
          "nameToken",
          Utils.getQWordReader(),
          "clothColor",
          this.PackCompositeColorV0,
          "leatherColor",
          this.PackCompositeColorV0,
          "metalColor",
          this.PackCompositeColorV0
        ];

        this.PackCompositeVariantV0 = [
          "components",
          Utils.getArrayReader(this.PackCompositeVariantComponentV0),
          "hairColor",
          this.PackCompositeColorV0,
          "patternColor",
          this.PackCompositeColorV0,
          "skinColor",
          this.PackCompositeColorV0,
          "skinIndex",
          "uint32"
        ];

        this.PackCompositeRaceDataV0 = [
          "name",
          Utils.getString16Reader(),
          "nameToken",
          Utils.getQWordReader(),
          "ears",
          Utils.getArrayReader(Utils.getQWordReader()),
          "faces",
          Utils.getArrayReader(Utils.getQWordReader()),
          "fileData",
          Utils.getArrayReader(this.PackCompositeFileDataV0),
          "hairStyles",
          Utils.getArrayReader(Utils.getQWordReader()),
          "skeletonFile",
          Utils.getFileNameReader(),
          "skinPatterns",
          Utils.getArrayReader(this.PackCompositeSkinPatternV0),
          "type",
          "uint32",
          "variantRefRace",
          Utils.getQWordReader(),
          "variants",
          Utils.getArrayReader(this.PackCompositeVariantV0)
        ];

        this.__root = this.PackCompositeV0 = [
          "blitRects",
          Utils.getArrayReader(this.PackCompositeBlitRectSetV0),
          "raceSexData",
          Utils.getArrayReader(this.PackCompositeRaceDataV0)
        ];
      }
    }
  }
];
