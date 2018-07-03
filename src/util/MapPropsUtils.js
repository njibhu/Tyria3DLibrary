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

const renderIndex = function(
  localReader,
  propsArray,
  idx,
  callback,
  lastPct = -1,
  meshCache = {},
  textureCache = {},
  output = { meshes: [] }
) {
  if (idx >= propsArray.length) {
    /// Empty mesh cache
    meshCache = {};
    textureCache = {};
    callback(output);
    return;
  }

  let pct = Math.round((1000.0 * idx) / propsArray.length);
  pct /= 10.0;

  /// Log progress
  if (lastPct !== pct) {
    let pctStr = pct + (pct.toString().indexOf(".") < 0 ? ".0" : "");

    T3D.logger.log(
      T3D.Logger.TYPE_PROGRESS,
      "Loading 3D Models (Props)",
      pctStr
    );
    lastPct = pct;
  }

  /// Read prop at index.
  let prop = propsArray[idx];

  /// Adds a single mesh to a group.
  let addMeshToLOD = function(mesh, groups, lod, prop, needsClone) {
    /// Read lod distance before overwriting mesh variable
    let lodDist = prop.lod2 !== 0 ? prop.lod2 : mesh.lodOverride[1];

    /// Read flags before overwriting mesh variable
    let flags = mesh.flags;

    /// Mesh flags are 0 1 4
    /// For now, use flag 0 as the default level of detail
    if (flags === 0) lodDist = 0;

    /// Create new empty mesh if needed
    if (needsClone) {
      mesh = new THREE.Mesh(mesh.geometry, mesh.material);
    }

    mesh.updateMatrix();
    mesh.matrixAutoUpdate = false;

    // Find group for this LOD distance
    if (groups[lodDist]) {
      groups[lodDist].add(mesh);
    }
    // Or create LOD group and add to a level of detail
    // WIP, needs some testing!
    else {
      let group = new THREE.Group();
      group.updateMatrix();
      group.matrixAutoUpdate = false;
      group.add(mesh);
      groups[lodDist] = group;
      lod.addLevel(group, lodDist);
    }

    return lodDist;
  };

  /// Adds array of meshes to the scene, also adds transform clones
  let addMeshesToScene = function(meshArray, needsClone, boundingSphere) {
    /// Add original

    /// Make LOD object and an array of groups for each LOD level
    let groups = {};
    let lod = new THREE.LOD();

    /// Each mesh is added to a group corresponding to its LOD distane
    let maxDist = 0;
    meshArray.forEach(function(mesh) {
      maxDist = Math.max(
        maxDist,
        addMeshToLOD(mesh, groups, lod, prop, needsClone)
      );
    });

    /// Add invisible level (the raycaster crashes on lod without any levels)
    lod.addLevel(new THREE.Group(), 100000);

    /// Set position, scale and rotation of the LOD object
    if (prop.rotation) {
      lod.rotation.order = "ZXY";
      // ["x","float32","z","float32","y","float32"],
      lod.rotation.set(prop.rotation[0], -prop.rotation[2], -prop.rotation[1]);
    }
    lod.scale.set(prop.scale, prop.scale, prop.scale);
    lod.position.set(prop.position[0], -prop.position[2], -prop.position[1]);

    lod.boundingSphereRadius =
      (boundingSphere && boundingSphere.radius ? boundingSphere.radius : 1.0) *
      prop.scale;

    lod.updateMatrix();
    lod.matrixAutoUpdate = false;

    /// Show highest level always
    // lod.update(lod);

    // Add LOD containing mesh instances to scene
    // self.getOutput().meshes.push(lod);
    output.meshes.push(lod);

    // Add one copy per transform, needs to be within it's own LOD
    if (prop.transforms) {
      prop.transforms.forEach(function(transform) {
        /// Make LOD object and an array of groups for each LOD level
        let groups = {};
        let lod = new THREE.LOD();

        /// Each mesh is added to a group corresponding to its LOD distane
        let maxDist = 0;
        meshArray.forEach(function(mesh) {
          maxDist = Math.max(
            maxDist,
            addMeshToLOD(mesh, groups, lod, prop, true)
          );
        });

        /// Add invisible level
        // lod.addLevel(new THREE.Group(),10000);

        /// Set position, scale and rotation of the LOD object
        if (transform.rotation) {
          lod.rotation.order = "ZXY";
          lod.rotation.set(
            transform.rotation[0],
            -transform.rotation[2],
            -transform.rotation[1]
          );
        }
        lod.scale.set(transform.scale, transform.scale, transform.scale);
        lod.position.set(
          transform.position[0],
          -transform.position[2],
          -transform.position[1]
        );

        lod.updateMatrix();
        lod.matrixAutoUpdate = false;

        lod.boundingSphereRadius =
          (boundingSphere && boundingSphere.radius
            ? boundingSphere.radius
            : 1.0) * prop.scale;

        /// Show highest level always
        lod.update(lod);

        /// Add LOD containing mesh instances to scenerender: function(propertiesChunkHeader, map, localReader, renderCallback){
        // self.getOutput().meshes.push(lod);
        output.meshes.push(lod);
      });
    }
  };

  /// Get meshes
  let showUnmaterialed = false;
  ModelUtils.getMeshesForFilename(
    prop.filename,
    prop.color,
    localReader,
    meshCache,
    textureCache,
    showUnmaterialed,
    false,
    function(meshes, isCached, boundingSphere) {
      if (meshes) {
        addMeshesToScene(meshes, isCached, boundingSphere);
      }

      /// Render next prop
      renderIndex(
        localReader,
        propsArray,
        idx + 1,
        callback,
        lastPct,
        meshCache,
        textureCache
      );
    }
  );
};

const getIdsForProp = function(props, idx, callback, fileIds = []) {
  if (idx >= props.length) {
    callback(fileIds);
    return;
  }

  if (idx % 100 === 0) {
    this.logger.log(
      T3D.Logger.TYPE_MESSAGE,
      "getting ids for entry",
      idx,
      "of",
      props.length
    );
  }

  let prop = props[idx];
  ModelUtils.getFilesUsedByModel(prop.filename, this.localReader, function(
    propFileIds
  ) {
    fileIds = fileIds.concat(propFileIds);
    getIdsForProp(props, idx + 1, callback, fileIds);
  });
};

module.exports = {
  renderIndex: renderIndex,
  getIdsForProp: getIdsForProp
};
