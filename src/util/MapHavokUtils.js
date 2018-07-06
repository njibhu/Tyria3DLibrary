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

function renderModels(rendererData, models, title, callback) {
  let mat;
  if (rendererData.settings && rendererData.settings.visible) {
    mat = new THREE.MeshNormalMaterial({
      side: THREE.DoubleSide
    });
  } else {
    mat = new THREE.MeshBasicMaterial({
      visible: false
    });
  }

  parseAllModels(rendererData, models, mat, title, 200, 0, callback);
}

function getCollisionsForAnimation(animation, collisions) {
  let ret = [];

  for (let i = 0; i < animation.collisionIndices.length; i++) {
    let index = animation.collisionIndices[i];
    let collision = collisions[index];
    collision.index = index;
    ret.push(collision);
  }

  return ret;
}

function parseAllModels(
  rendererData,
  models,
  mat,
  title,
  chunkSize,
  offset,
  callback
) {
  let i = offset;

  for (; i < offset + chunkSize && i < models.length; i++) {
    let p = Math.round((i * 100) / models.length);
    if (p !== rendererData.lastP) {
      T3D.Logger.log(
        T3D.Logger.TYPE_PROGRESS,
        "Loading Collision Models (" + title + ")",
        p
      );
      rendererData.lastP = p;
    }

    /// Get animation object
    let animation = animationFromGeomIndex(
      models[i].geometryIndex,
      rendererData.geometries,
      rendererData.animations
    );

    let collisions = getCollisionsForAnimation(
      animation,
      rendererData.havokChunkData.collisions
    );

    for (let j = 0; j < collisions.length; j++) {
      let collision = collisions[j];
      renderMesh(rendererData, collision, models[i], mat);
    }
  }

  if (i < models.length) {
    window.setTimeout(() => {
      parseAllModels(
        rendererData,
        models,
        mat,
        title,
        chunkSize,
        offset + chunkSize,
        callback
      );
    }, 10 /* time in ms to next call */);
  } else {
    callback(rendererData.output);
  }
}

function animationFromGeomIndex(propGeomIndex, geometries, animations) {
  // geometries is just list of all geometries.animations[end] for now
  let l = geometries[propGeomIndex].animations.length;

  return animations[geometries[propGeomIndex].animations[l - 1]];
  // return animations[ geometries[propGeomIndex].animations[0] ];
}

function renderMesh(rendererData, collision, model, mat) {
  let pos = model.translate;
  let rot = model.rotate;
  let scale = 32 * model.scale;

  /// Generate mesh
  let mesh = parseHavokMesh(rendererData, collision, mat);

  /// Position mesh
  /// "x","float32","z","float32","y","float32"
  mesh.position.set(pos[0], -pos[2], -pos[1]);

  /// Scale mesh
  if (scale) mesh.scale.set(scale, scale, scale);

  /// Rotate mesh
  if (rot) {
    mesh.rotation.order = "ZXY";

    // ["x","float32","z","float32","y","float32"],
    mesh.rotation.set(rot[0], -rot[2], -rot[1]);
  }

  /// Add mesh to scene and collisions
  rendererData.output.meshes.push(mesh);
}

function parseHavokMesh(rendererData, collision, mat) {
  let index = collision.index;

  if (!rendererData.meshes[index]) {
    let geom = new THREE.Geometry();

    /// Pass vertices
    for (let i = 0; i < collision.vertices.length; i++) {
      let v = collision.vertices[i];
      // "x","float32","z","float32","y","float32"]
      geom.vertices.push(new THREE.Vector3(v[0], v[2], -v[1]));
    }

    /// Pass faces
    for (let i = 0; i < collision.indices.length; i += 3) {
      let f1 = collision.indices[i];
      let f2 = collision.indices[i + 1];
      let f3 = collision.indices[i + 2];

      if (
        f1 <= collision.vertices.length &&
        f2 <= collision.vertices.length &&
        f3 <= collision.vertices.length
      ) {
        geom.faces.push(new THREE.Face3(f1, f2, f3));
      } else {
        T3D.Logger.log(
          T3D.Logger.TYPE_ERROR,
          "Errorus index in havok model geometry."
        );
      }
    }

    /// Prepare geometry and pass new mesh
    geom.computeFaceNormals();
    // geom.computeVertexNormals();

    rendererData.meshes[index] = new THREE.Mesh(geom, mat);

    return rendererData.meshes[index];
  } else {
    return rendererData.meshes[index].clone();
  }
}

module.exports = { renderModels };
