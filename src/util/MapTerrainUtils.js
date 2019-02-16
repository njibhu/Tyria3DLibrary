/*
Copyright © Tyria3DLibrary project contributors

This file is part of the Tyria 3D Library.

Tyria 3D Library is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Tyria 3D Library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with the Tyria 3D Library. If not, see <http://www.gnu.org/licenses/>.
*/

const RenderUtils = require("./RenderUtils");
const MaterialUtils = require("./MaterialUtils");
const TerrainShader = require("./TerrainShader");
const GW2File = require("../format/file/GW2File");

function drawWater(rect) {
  /// Add Water
  const material = new THREE.MeshBasicMaterial({
    color: 0x5bb1e8,
    wireframe: false,
    opacity: 0.35
  });

  material.transparent = true;
  return RenderUtils.renderRect(rect, 0, material);
}

function parseNumChunks(terrainData) {
  terrainData.numChunksD_1 = Math.sqrt(
    (terrainData.dims[0] * terrainData.chunkArray.length) / terrainData.dims[1]
  );
  terrainData.numChunksD_2 =
    terrainData.chunkArray.length / terrainData.numChunksD_1;
}

/**
 *
 * @param {*} inflatedBuffer
 * @param {*} mapFile
 * @param {*} anisotropy
 * @param {*} envOutput
 * @param {*} localReader
 * @returns {Promise<{terrainTiles: Array, water: *, mapRect: *}>}
 */
async function loadPagedImageCallback(
  inflatedBuffer,
  mapFile,
  anisotropy,
  envOutput,
  localReader
) {
  // Prep output variables
  let terrainTiles = [];

  let pimgDS = new DataStream(inflatedBuffer);
  let pimgFile = new GW2File(pimgDS, 0);
  let pimgTableDataChunk = pimgFile.getChunk("pgtb");
  let pimgData = pimgTableDataChunk && pimgTableDataChunk.data;

  let mapRect = null;

  /// Fetch chunks
  let terrainData = mapFile.getChunk("trn").data;
  let parameterData = mapFile.getChunk("parm").data;

  /// Read settings
  let maxAnisotropy = anisotropy || 1;

  let chunkW = 35;

  /// Calculate numChunksD_1 and _2
  parseNumChunks(terrainData);

  let xChunks = terrainData.numChunksD_1;
  let yChunks = terrainData.numChunksD_2;

  let allMaterials = terrainData.materials.materials;
  let allTextures = terrainData.materials.texFileArray;

  // Total map dx and dy
  let dx = parameterData.rect[2] - parameterData.rect[0];
  let dy = parameterData.rect[3] - parameterData.rect[1];

  // Each chunk dx and dy
  let cdx = (dx / terrainData.numChunksD_1) * 1; //  35/33;
  let cdy = (dy / terrainData.numChunksD_2) * 1; // 35/33;
  let n = 0;
  let allMats = [];
  let customMaterial = new THREE.MeshLambertMaterial({
    side: THREE.DoubleSide,
    color: 0x666666,
    flatShading: true
  });

  /// Load textures from PIMG and inject as material maps (textures)
  let chunkTextures = {};

  /// Load textures
  if (pimgData) {
    let strippedPages = pimgData.strippedPages;

    /// Only use layer 0
    strippedPages.forEach(function(page) {
      /// Only load layer 0 and 1
      if (page.layer <= 1) {
        let filename = page.filename;
        let coord = page.coord;

        let matName = coord[0] + "," + coord[1];
        if (page.layer === 1) matName += "-2";

        /// Add texture to list, note that coord name is used, not actual file name
        if (!chunkTextures[matName]) {
          /// Load local texture, here we use file name!
          let chunkTex = MaterialUtils.loadLocalTexture(localReader, filename);

          if (chunkTex) {
            /// Set repeat, antistropy and repeat Y
            chunkTex.anisotropy = maxAnisotropy;
            chunkTex.wrapS = THREE.RepeatWrapping;
            chunkTex.wrapT = THREE.RepeatWrapping;
          }

          /// ...But store in coord name
          chunkTextures[matName] = chunkTex;
        }
      }
    }); /// end for each stripped page in pimgData
  }

  /// Render Each chunk
  /// We'll make this async in order for the screen to be able to update

  let renderChunk = function(cx, cy) {
    let chunkIndex = cy * xChunks + cx;

    let pageX = Math.floor(cx / 4);
    let pageY = Math.floor(cy / 4);

    // TODO: Terrain texture LOD ?
    let chunkTextureIndices =
      allMaterials[chunkIndex].loResMaterial.texIndexArray;

    // var chunkTextureIndices = allMaterials[chunkIndex].hiResMaterial.texIndexArray;
    // var matFileName = allMaterials[chunkIndex].hiResMaterial.materialFile;

    let mat = customMaterial;

    /// TODO: just tick invert y = false...?
    let pageOffetX = (cx % 4) / 4.0;
    let pageOffetY = 0.75 - (cy % 4) / 4.0;

    // offset 0 -> 0.75

    // Make sure we have shared textures

    /// Load and store all tiled textures
    let fileNames = [];
    for (let gi = 0; gi < chunkTextureIndices.length / 2; gi++) {
      let textureFileName = allTextures[chunkTextureIndices[gi]].filename;

      fileNames.push(textureFileName);

      /// If the texture is not already loaded, read it from the .dat!
      if (!chunkTextures[textureFileName]) {
        /// Load local texture
        let chunkTex = MaterialUtils.loadLocalTexture(
          localReader,
          textureFileName
        );

        if (chunkTex) {
          /// Set repeat, antistropy and repeat Y
          chunkTex.anisotropy = maxAnisotropy;
          chunkTex.wrapS = THREE.RepeatWrapping;
          chunkTex.wrapT = THREE.RepeatWrapping;
        }

        chunkTextures[textureFileName] = chunkTex;
      }
    } /// End for each chunkTextureIndices

    /// Create Composite texture material, refering the shared textures
    let pageTexName = pageX + "," + pageY;
    let pageTexName2 = pageX + "," + pageY + "-2";

    // var fog = SceneUtils.getScene().fog;
    let fog = {
      color: {
        r: 1,
        g: 1,
        b: 1
      },
      near: 0,
      far: 0
    };

    /// Set the haze from the environment output
    if (envOutput.hazeColor) {
      fog.color.r = envOutput.hazeColor[2] / 255.0;
      fog.color.g = envOutput.hazeColor[1] / 255.0;
      fog.color.b = envOutput.hazeColor[0] / 255.0;
    }

    let uniforms = THREE.UniformsUtils.merge([THREE.UniformsLib["lights"]]);

    /// TODO: READ FROM VO, don't default to hard coded scale
    uniforms.uvScale = {
      type: "v2",
      value: new THREE.Vector2(8.0, 8.0)
    };
    uniforms.offset = {
      type: "v2",
      value: new THREE.Vector2(pageOffetX, pageOffetY)
    };

    uniforms.texturePicker = {
      type: "t",
      value: chunkTextures[pageTexName]
    };
    uniforms.texturePicker2 = {
      type: "t",
      value: chunkTextures[pageTexName2]
    };

    uniforms.texture1 = {
      type: "t",
      value: chunkTextures[fileNames[0]]
    };
    uniforms.texture2 = {
      type: "t",
      value: chunkTextures[fileNames[1]]
    };
    uniforms.texture3 = {
      type: "t",
      value: chunkTextures[fileNames[2]]
    };
    uniforms.texture4 = {
      type: "t",
      value: chunkTextures[fileNames[3]]
    };

    mat = new THREE.ShaderMaterial({
      uniforms: uniforms,
      fragmentShader: TerrainShader.getFragmentShader(),
      vertexShader: TerrainShader.getVertexShader()
    });

    /// Store referenceto each material
    allMats.push(mat);

    /// -1 for faces -> vertices , -2 for ignoring outer faces
    let chunkGeo = new THREE.PlaneBufferGeometry(
      cdx,
      cdy,
      chunkW - 3,
      chunkW - 3
    );

    let cn = 0;

    /// Render chunk

    /// Each chunk vertex
    for (let y = 0; y < chunkW; y++) {
      for (let x = 0; x < chunkW; x++) {
        if (x !== 0 && x !== chunkW - 1 && y !== 0 && y !== chunkW - 1) {
          chunkGeo.getAttribute("position").array[cn * 3 + 2] =
            terrainData.heightMapArray[n];
          cn++;
        }

        n++;
      }
    } // End each chunk vertex

    /// Flip the plane to fit wonky THREE js world axes
    let mS = new THREE.Matrix4().identity();
    mS.elements[5] = -1;
    chunkGeo.applyMatrix(mS);

    /// Compute face normals for lighting, not used when textured
    chunkGeo.computeFaceNormals();
    // chunkGeo.computeVertexNormals();

    /// Build chunk mesh!
    let chunk;
    chunk = new THREE.Mesh(chunkGeo, customMaterial);
    if (mat.length) {
      chunk = THREE.SceneUtils.createMultiMaterialObject(chunkGeo, mat);
    } else {
      chunk = new THREE.Mesh(chunkGeo, mat);
    }

    /// Move and rotate Mesh to fit in place
    chunk.rotation.set(Math.PI / 2, 0, 0);

    /// Last term is the new one: -cdx*(2/35)
    let globalOffsetX = parameterData.rect[0] + cdx / 2;
    let chunkOffsetX = cx * cdx;

    chunk.position.x = globalOffsetX + chunkOffsetX;

    /// Adjust for odd / even number of chunks
    if (terrainData.numChunksD_2 % 2 === 0) {
      /// Last term is the new one: -cdx*(2/35)
      const globalOffsetY = parameterData.rect[1] + cdy / 2 - 0; // -cdy*(1/35);
      const chunkOffsetY = cy * cdy * 1; // 33/35;

      chunk.position.z = chunkOffsetY + globalOffsetY;
    } else {
      const globalOffsetY = parameterData.rect[1] - cdy / 2 + 0; // cdy*(1/35);
      const chunkOffsetY = cy * cdy * 1; // 33/35;

      chunk.position.z = globalOffsetY + chunkOffsetY;
    }

    let px = chunk.position.x;
    let py = chunk.position.z;

    if (!mapRect) {
      mapRect = {
        x1: px - cdx / 2,
        x2: px + cdx / 2,
        y1: py - cdy / 2,
        y2: py + cdy / 2
      };
    }

    mapRect.x1 = Math.min(mapRect.x1, px - cdx / 2);
    mapRect.x2 = Math.max(mapRect.x2, px + cdx / 2);

    mapRect.y1 = Math.min(mapRect.y1, py - cdy / 2);
    mapRect.y2 = Math.max(mapRect.y2, py + cdy / 2);

    chunk.updateMatrix();
    chunk.updateMatrixWorld();

    /// Add to list of stuff to render
    /// TODO: Perhaps use some kind of props for each entry instead?
    terrainTiles.push(chunk);
  }; /// End render chunk function

  let cx = 0;

  let cy = 0;

  while (cy < yChunks) {
    // Process chunk
    renderChunk(cx, cy);

    // Step to next chunk
    cx += 1;
    if (cx >= xChunks) {
      cx = 0;
      cy++;
    }

    await new Promise(resolve => setTimeout(resolve, 1));

    // Log
    let pct = Math.floor((100 * (cy * xChunks + cx)) / (xChunks * yChunks));
    T3D.Logger.log(T3D.Logger.TYPE_PROGRESS, "Loading Terrain", pct);
  }

  return {
    terrainTiles: terrainTiles,

    // Draw water surface using map bounds:
    water: drawWater(mapRect),

    // Return bounds:
    mapRect: mapRect
  };
}

function getTerrainFilesId(mapFile) {
  let terrainChunk = mapFile.getChunk("trn");
  let pimgTableDataChunk = mapFile.getChunk("pimg");
  let fileIds = [];

  /// ------------ SPLASH TEXTURES ------------
  let pimgData = pimgTableDataChunk && pimgTableDataChunk.data;
  let strippedPages = pimgData.strippedPages;

  /// Only use layer 0
  strippedPages.forEach(function(page) {
    /// Only load layer 0 and 1
    if (page.layer <= 1 && page.filename > 0) {
      fileIds.push(page.filename);
    }
  });
  /// ------------ END SPLASH TEXTURES ------------

  /// ------------ TILED IMAGES ------------
  let terrainData = terrainChunk.data;
  let allTextures = terrainData.materials.texFileArray;
  allTextures.forEach(function(texture) {
    if (texture.filename > 0) fileIds.push(texture.filename);
  });
  /// ------------ END TILED IMAGES ------------

  return fileIds;
}

module.exports = {
  loadPagedImageCallback: loadPagedImageCallback,
  getTerrainFilesId: getTerrainFilesId
};