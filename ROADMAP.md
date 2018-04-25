# Roadmap
* [+] = done
* [~] = ongoing

____
## ROADMAP 1.2.0

### Major: 

    ⋅ Cleanup of the Utils + DataRenderers:
        ⋅ Move all the chunk handling stuff into utils and make the DataRenderers pretty interfaces []
        ⋅ RenderUtils []
        ⋅ MaterialUtils []
    ⋅ Use gw2 skydomes + (threejs example sky) []

### Minor: 

    ⋅  Clean all the todos []
    ⋅  Rework the LOD in TerrainRenderer:
        ⋅  Debug tool: (see threejs example interactive/buffergeometry ): Tells name of a mesh by pointing at it [+] (Done in example)
    ⋅ Make EmissiveMap work []
        ⋅ Fix (if not with emissivemap) the black not transparent textures (backside) []
    ⋅ Check normal maps and other kind of maps []
____
## ROADMAP 1.1.0

### Major: 

    ⋅ Update THREEjs + tools [+]
    ⋅ Major revamp of the LocalReader:
        ⋅ Only use of t3dtools [+]
        ⋅ Allow spawn of webworkers [+]
        ⋅ Migrate to IndexedDB; store all Mft data (Type, CRC, size) into it [~]
        ⋅ Fast rescan with existing data:
            ⋅ Report of rescan  []
            ⋅ (indexedDB logs) []
        ⋅ Full rewrite of LocalReader (archive) [+]
        ⋅ Replace all uses of LocalReader and remove it []
            ⋅ Remove definitions/ANDat + MFT []
    ⋅ Tyria3DFormats splitup + autoscript [~]
        ⋅ Multiple use: add a chunk_prefered field []
        ⋅ Remove Allformats []
    ⋅ Cleanup the GW2Chunk []

### Minor: 

    ⋅  Bump to 1.1 [+]
    ⋅  Copyrights mentions and headers [+]
    ⋅  Rewrite gulpfile [+]
    ⋅  Check npm dependencies [+]
