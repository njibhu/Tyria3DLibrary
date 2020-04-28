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

const MaterialUtils = require("./MaterialUtils");

function getMat(tex) {
  return new THREE.MeshBasicMaterial({
    map: tex,
    side: THREE.BackSide,
    fog: false,
    depthWrite: false,
  });
}

function loadTextureWithFallback(
  targetMatIndices,
  materialArray,
  filename,
  fallbackFilename,
  hazeColorAsInt,
  localReader
) {
  function writeMat(mat) {
    for (let i of targetMatIndices) {
      materialArray[i] = mat;
    }
  }

  function loadFallback() {
    let mat = getMat(new THREE.TextureLoader().load(fallbackFilename));

    writeMat(mat);
  }

  function errorCallback() {
    setTimeout(loadFallback, 1);
  }

  let mat = getMat(
    MaterialUtils.loadLocalTexture(
      localReader,
      filename,
      null,
      hazeColorAsInt,
      errorCallback
    )
  );

  writeMat(mat);
}

function getHazeColor(environmentChunkData) {
  let hazes = environmentChunkData && environmentChunkData.dataGlobal.haze;

  if (!hazes || hazes.length <= 0) {
    return [190, 160, 60];
  } else {
    return hazes[0].farColor;
  }
}

function parseLights(environmentChunkData) {
  let lightOutput = [];

  let lights = environmentChunkData
    ? environmentChunkData.dataGlobal.lighting
    : [
        {
          lights: [],
          backlightIntensity: 1.0,
          backlightColor: [255, 255, 255],
        },
      ];

  let ambientLight;

  let hasLight = false;

  // Iterate on each light
  for (let idx in lights) {
    let light = lights[idx];

    if (hasLight) break;

    /// Directional lights
    let sumDirLightIntensity = 0;

    for (let dirLightData of light.lights) {
      hasLight = true;

      let color = new THREE.Color(
        dirLightData.color[2] / 255.0,
        dirLightData.color[1] / 255.0,
        dirLightData.color[0] / 255.0
      );

      let directionalLight = new THREE.DirectionalLight(
        color.getHex(),
        dirLightData.intensity
      );

      directionalLight.position
        .set(
          -dirLightData.direction[0],
          dirLightData.direction[2],
          dirLightData.direction[1]
        )
        .normalize();

      sumDirLightIntensity += dirLightData.intensity;

      lightOutput.push(directionalLight);
    } // END for each directional light in light

    /// Add some random directional lighting if there was no, in order to se SOME depth on models
    if (!light.lights || light.lights.length === 0) {
      const directions = [
        [0, 1, 0, 0.3],
        [1, 2, 1, 0.3],
        [-1, -2, -1, 0.3],
      ];

      for (let lightDir of directions) {
        const color = new THREE.Color(1, 1, 1);
        let intensity = lightDir[3];
        let directionalLight = new THREE.DirectionalLight(
          color.getHex(),
          intensity
        );

        directionalLight.position
          .set(lightDir[0], lightDir[1], lightDir[2])
          .normalize();

        sumDirLightIntensity += intensity;

        lightOutput.push(directionalLight);
      }
    }

    /// Ambient light
    // light.backlightIntensity /= sumDirLightIntensity +light.backlightIntensity;
    light.backlightIntensity = sumDirLightIntensity; // light.backlightIntensity;
    const color = new THREE.Color(
      (light.backlightIntensity * (255.0 - light.backlightColor[2])) / 255.0,
      (light.backlightIntensity * (255.0 - light.backlightColor[1])) / 255.0,
      (light.backlightIntensity * (255.0 - light.backlightColor[0])) / 255.0
    );

    ambientLight = new THREE.AmbientLight(color);
  } // END for each light in lighting

  let ambientTotal = 0;
  if (ambientLight) {
    ambientTotal =
      ambientLight.color.r + ambientLight.color.g + ambientLight.color.b;
    lightOutput.push(ambientLight);
  }

  /// Parsing done, return hasLight flag and lights
  return {
    lights: lightOutput,
    hasLight: hasLight || ambientTotal > 0,
  };
}

function parseSkybox(
  environmentChunkData,
  parameterChunkData,
  hazeColorAsInt,
  skyboxFallbackArray,
  localReader
) {
  /// set up output array
  let skyElements = [];

  /// Grab sky texture.
  /// index 0 and 1 day
  /// index 2 and 3 evening
  let skyModeTex =
    this.environmentChunkData &&
    this.environmentChunkData.dataGlobal.skyModeTex[0];

  /// Fallback skyboxfrom dat.
  if (!skyModeTex) {
    skyModeTex = {
      texPathNE: 1930687,
      texPathSW: 193069,
      texPathT: 193071,
    };
  }

  /// Calculate bounds
  // const bounds = parameterChunkData.rect;
  // let mapW = Math.abs(bounds.x1 - bounds.x2);
  // let mapD = Math.abs(bounds.y1 - bounds.y2);
  // let boundSide = Math.max(mapW, mapD);

  let materialArray = [];

  /// Load skybox textures, fallback to hosted png files.
  loadTextureWithFallback(
    [1, 4],
    materialArray,
    skyModeTex.texPathNE + 1,
    skyboxFallbackArray[0],
    hazeColorAsInt,
    localReader
  );
  loadTextureWithFallback(
    [0, 5],
    materialArray,
    skyModeTex.texPathSW + 1,
    skyboxFallbackArray[1],
    hazeColorAsInt,
    localReader
  );
  loadTextureWithFallback(
    [2],
    materialArray,
    skyModeTex.texPathT + 1,
    skyboxFallbackArray[2],
    hazeColorAsInt,
    localReader
  );
  materialArray[3] = new THREE.MeshBasicMaterial({
    visible: false,
  });

  /// Create skybox geometry
  const boxSize = 1024;
  let skyGeometry = new THREE.BoxGeometry(boxSize, boxSize / 2, boxSize); // Width Height Depth

  /// Ugly way of fixing UV maps for the skybox (I think)
  for (let idx in skyGeometry.faceVertexUvs[0]) {
    let vecs = skyGeometry.faceVertexUvs[0][idx];

    let face = Math.floor(idx / 2);

    // PX NX
    // PY NY
    // PZ NZ

    /// PX - WEST 	NX - EAST
    if (face === 0 || face === 1) {
      for (let vec2 of vecs) {
        vec2.x = 1 - vec2.x;
        vec2.y /= 2.0;
        vec2.y += 0.5;
      }
    }

    /// NZ - SOUTH 	PZ - NORTH
    else if (face === 5 || face === 4) {
      for (let vec2 of vecs) {
        vec2.y /= -2.0;
        vec2.y += 0.5;
      }
    } else {
      for (let vec2 of vecs) {
        vec2.x = 1 - vec2.x;
      }
    }
  }

  skyGeometry.uvsNeedUpdate = true;

  /// Generate final skybox
  let skyBox = new THREE.Mesh(skyGeometry, materialArray);

  /// Put horizon in camera center
  skyBox.translateY(boxSize / 4);
  // skyBox.translateY( -environmentChunk.data.dataGlobal.sky.verticalOffset );

  /// Write to output
  skyElements.push(skyBox);

  /// And return
  return {
    skyElements: skyElements,
  };
}

module.exports = {
  getHazeColor: getHazeColor,
  parseLights: parseLights,
  parseSkybox: parseSkybox,
};
