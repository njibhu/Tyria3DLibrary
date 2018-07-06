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
const ModelUtils = require("../util/ModelUtils");

function renderZone(rendererData, zone, zoneDefs, mapRect, renderZoneCallback) {
  /// Get Zone Definition
  let zoneDef = null;
  zoneDefs.forEach(function(zd) {
    if (!zoneDef && zd.token === zone.defToken) zoneDef = zd;
  });

  /// Create array of all models to add:
  let modelGroups = getModelGroups(rendererData, zone, zoneDef, mapRect);

  /// Create empty mesh cache
  rendererData.meshCache = {};
  rendererData.textureCache = {};

  /*
   * ---Keeping this out of the doc for now---
   * Steps trough each model and renders it to the scene, allowing for efficient caching.
   * @param  {Number} i - Current index within the models array
   */
  // var lastPct = -1;
  let groupKeys = Object.keys(modelGroups);

  function stepModels(i) {
    /* var pct = Math.round(100.0*i / groupKeys.length);
    if(lastPct!=pct){
      console.log("Rendering ZONE models "+pct);
      lastPct = pct;
    } */

    if (i >= groupKeys.length) {
      /// Empty mesh cache
      rendererData.meshCache = {};
      rendererData.textureCache = {};

      /// Tell caller this zone is done loading
      renderZoneCallback();
      return;
    }

    /// Read model at index
    /// var model = models[i];
    let key = groupKeys[i]; /// key is model filename
    let group = modelGroups[key];

    let meshGroups = [];

    /// Get model just once for this group
    let showUnmaterialed = false;
    ModelUtils.getMeshesForFilename(
      key,
      null,
      rendererData.localReader,
      rendererData.meshCache,
      rendererData.textureCache,
      showUnmaterialed,
      false,

      function(meshes, isCached) {
        /// If there were meshes, add them to the scene with correct scaling rotation etc.
        if (meshes /* && meshes.length == 3 */) {
          /// Add one copy per model instance
          /// TODO: add rotation!
          /// TODO: fine tune position?
          /// TODO: POTIMIZE!

          group.forEach(function(model, instanceIdx) {
            /// For each Mesh in the model
            meshes.forEach(function(mesh, meshIdx) {
              if (
                mesh.materialFlags ===
                525 /* || mesh.materialFlags == 520 || mesh.materialFlags == 521 */
              ) {
                // console.log("Skipping lod");
                return;
              }

              let move = {
                x: 0,
                y: 0,
                z: 0
              };

              /// Add to big mesh
              if (!meshGroups[meshIdx]) {
                let mg = mesh.geometry.clone();
                meshGroups[meshIdx] = {
                  readVerts: mg.getAttribute("position").array,
                  verts: new Float32Array(
                    group.length * mg.getAttribute("position").array.length
                  ),

                  readIndices: mg.getIndex().array,
                  indices: new Uint32Array(
                    group.length * mg.getIndex().array.length
                  ),

                  readUVs: mg.getAttribute("uv").array,
                  uvs: new Float32Array(
                    group.length * mg.getAttribute("uv").array.length
                  ),

                  readNormals: mg.getAttribute("normal").array,
                  normals: new Float32Array(
                    group.length * mg.getAttribute("normal").array.length
                  ),

                  material: mesh.material,
                  // material:new THREE.MeshBasicMaterial( {color: 0xffcccc, wireframe:true} ),
                  /* material : new THREE.PointCloudMaterial ({
                  color: 0xFF0000,
                  size: 20
                  }), */
                  position: {
                    x: model.x,
                    y: model.y,
                    z: model.z
                  }
                };
              } else {
                /// Translate
                move.x = model.x - meshGroups[meshIdx].position.x;
                move.y = model.z - meshGroups[meshIdx].position.z;
                move.z = model.y - meshGroups[meshIdx].position.y;
              }

              /// Add geom verts
              let readVerts = meshGroups[meshIdx].readVerts;
              let writeVerts = meshGroups[meshIdx].verts;
              let stride = readVerts.length;

              for (
                let i = 0, j = instanceIdx * stride;
                i < stride;
                i += 3, j += 3
              ) {
                writeVerts[j + 0] = readVerts[i + 0] + move.x;
                writeVerts[j + 1] = readVerts[i + 1] + move.y;
                writeVerts[j + 2] = readVerts[i + 2] + move.z;
              }

              let readIndices = meshGroups[meshIdx].readIndices;
              let writeIndices = meshGroups[meshIdx].indices;
              let strideIndices = readIndices.length;
              let shift = (stride * instanceIdx) / 3;

              for (
                let i = 0, j = instanceIdx * strideIndices;
                i < strideIndices;
                i++, j++
              ) {
                writeIndices[j] = readIndices[i] + shift;
              }

              let readUVs = meshGroups[meshIdx].readUVs;
              let writeUvs = meshGroups[meshIdx].uvs;
              let uvStride = readUVs.length;
              for (
                let i = 0, j = instanceIdx * uvStride;
                i < uvStride;
                i++, j++
              ) {
                writeUvs[j] = readUVs[i];
              }

              let readNormals = meshGroups[meshIdx].readNormals;
              let writeNormals = meshGroups[meshIdx].normals;
              let normalStride = readNormals.length;
              for (
                let i = 0, j = instanceIdx * normalStride;
                i < normalStride;
                i++, j++
              ) {
                writeNormals[j] = readNormals[i];
              }
            });
          }); // End for each model in group
        } /// End if meshes

        /// Add each cluster of merged meshes to scene
        meshGroups.forEach(function(meshGroup) {
          let mergedGeom = new THREE.BufferGeometry();

          mergedGeom.addAttribute(
            "position",
            new THREE.BufferAttribute(meshGroup.verts, 3)
          );
          // mergedGeom.addAttribute( 'index', new THREE.BufferAttribute( meshGroup.indices, 1) );
          mergedGeom.setIndex(new THREE.BufferAttribute(meshGroup.indices, 1));
          mergedGeom.addAttribute(
            "normal",
            new THREE.BufferAttribute(meshGroup.normals, 3)
          );
          mergedGeom.addAttribute(
            "uv",
            new THREE.BufferAttribute(meshGroup.uvs, 2)
          );

          mergedGeom.buffersNeedUpdate = true;

          let mesh = new THREE.Mesh(mergedGeom, meshGroup.material);
          mesh.position.set(
            meshGroup.position.x,
            meshGroup.position.z,
            meshGroup.position.y
          );

          rendererData.output.meshes.push(mesh);
        }); // End for each meshgroup

        /// Rendering is done, render next.
        stepModels(i + 1);
      }
    );
  } /// End function stepModels

  /// Begin stepping trough the models, rendering them.
  stepModels(0);
}

function getModelGroups(rendererData, zone, zoneDef, mapRect) {
  /// Calculate rect in global coordinates

  let mapX = mapRect[0];
  let mapY = mapRect[1];
  let c = 32 + 16;

  // ["x1","uint32","y1","uint32","x2","uint32", "y2", "uint32"]
  let zoneRect = {
    x1: zone.vertRect[0] * c + mapX,
    x2: zone.vertRect[2] * c + mapX,
    y1: zone.vertRect[1] * -c - mapY,
    y2: zone.vertRect[3] * -c - mapY
  };

  /// Zone width and depth in local corrdinates
  /* var zdx = zone.vertRect.x1-zone.vertRect.x2;
  var zdy = zone.vertRect.y1-zone.vertRect.y2; */

  /// These zones seems to overflow :/
  if (zone.encodeData.length === 0) {
    return {};
  }

  let zdx = zone.vertRect[0] - zone.vertRect[2];
  // let zdy = zone.vertRect[1] - zone.vertRect[3];

  /// Zone Flags increases a linear position, used to step trough the Zone.
  let linearPos = 0;

  let modelGroups = {};

  let terrainTiles = rendererData.terrainTiles;

  for (let i = 0; i < zone.flags.length; i += 2) {
    /// Step forward
    linearPos += zone.flags[i];

    /// Check if a model should be placed
    let flag = zone.flags[i + 1];
    if (flag !== 0) {
      /// Extract flag data
      /// Layer is written in the last 4 bytes
      let zoneDefLayer = flag >> 4;

      /// Get Zone Definition Layer
      let layer = zoneDef.layerDefArray[zoneDefLayer - 1];

      /// TESTING Only show layers with height >= 3
      if (layer /* && layer.height >= 0 */) {
        /// Get X and Y from linear position
        let modelX = (linearPos % zdx) * c + zoneRect.x1;
        let modelY = Math.floor(linearPos / zdx) * c + zoneRect.y1;

        /// Get Z from intersection with terrain
        let modelZ = null;

        const startZ = 100000;

        const raycaster = new THREE.Raycaster(
          new THREE.Vector3(modelX, startZ, modelY),
          new THREE.Vector3(0, -1, 0)
        );

        /// TODO: OPT?
        terrainTiles.forEach(function(chunk) {
          if (modelZ === null) {
            let intersections = raycaster.intersectObject(chunk);
            if (intersections.length > 0) {
              modelZ = startZ - intersections[0].distance;
            }
          }
        });

        /// Get model id
        /// TODO: check with modelIdx = flag & 0xf;
        let modelIdx = 0;
        let model = layer.modelArray[modelIdx];
        let modelFilename = model.filename;
        // let zOffsets = model.zOffsets;

        // let layerFlags = layer.layerFlags; // NOrmaly 128, 128

        // TODO: flip z,y?
        let rotRangeX = layer.rotRangeX; // max min
        let rotRangeY = layer.rotRangeY; // max min
        let rotRangeZ = layer.rotRangeZ; // max min
        let scaleRange = layer.scaleRange; // max min
        let fadeRange = layer.fadeRange; // max min

        // Unused
        // tiling: 3
        // type: 1
        // width: 2
        // radiusGround: 2

        /// Create modelGroup (this zone only)
        if (!modelGroups[modelFilename]) {
          modelGroups[modelFilename] = [];
        }

        /// Add entry to model group
        modelGroups[modelFilename].push({
          x: modelX,
          y: modelY,
          z: modelZ,
          rotRangeX: rotRangeX,
          rotRangeY: rotRangeY,
          rotRangeZ: rotRangeZ,
          scaleRange: scaleRange,
          fadeRange: fadeRange
        });
      } /// End if layer
    } /// End if flag != 0
  } /// End for each flag

  return modelGroups;
}

module.exports = { renderZone };
