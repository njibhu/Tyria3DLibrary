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

const GW2File = require("../format/file/GW2File");
const MaterialUtils = require("./MaterialUtils");
const MathUtils = require("./MathUtils");

//TODO: Remove this local cache!!
let matFiles = {};

const fvfFormat = require('./Constants').fvfFormat;


/**
 * Returns a THREE representation of the data contained by a GW2 model file.
 * The data is read using a LocalReader reference into the GW2 .dat.
 *
 * @memberof ModelUtils 
 * @param {LocalReader} localReader The LocalReader to load the file contents from.
 * @param {Object} chunk Model GEOM chunk.
 * @param {Object} modelDataChunk Model MODL chunk.
 * @param {Object} sharedTextures  Value Object for keeping the texture cache.
 * @param {boolean} showUnmaterialed If false does not render any models with missing materials.
 * 
 * @return {Array} Each geometry in the model file represented by a textured THREE.Mesh object
 */
function renderGeomChunk(localReader, chunk, modelDataChunk, sharedTextures, showUnmaterialed) {

	var rawMeshes = chunk.data.meshes;
	var meshes = [];
	var mats = modelDataChunk.data.permutations[0].materials;

	for (let rawMesh of rawMeshes) {

		var rawGeom = rawMesh.geometry;
		var fvf = rawGeom.verts.mesh.fvf; //rawGeom.fvf;

		var numVerts = rawGeom.verts.vertexCount; //rawGeom.vertexCount;

		var rawVerts = rawGeom.verts.mesh.vertices; //rawGeom.vertices

		var indices = rawGeom.indices.indices;

		var geom = new THREE.BufferGeometry();

		var vertDS = new DataStream(rawVerts.buffer);

		//Dirty step length for now:
		var stride = rawVerts.length / numVerts;

		//Each vertex
		//DO UV as well
		var vertices = new Float32Array(numVerts * 3);
		var tangents = null;
		var normals = null;
		var uvs = [];


		/// Calculate the distance to the first pair of UV data from the
		/// start of the vertex entry
		/// 
		var distToNormals = !!(fvf & fvfFormat.Position) * 12 +
			!!(fvf & fvfFormat.Weights) * 4 +
			!!(fvf & fvfFormat.Group) * 4;

		var distToTangent =
			distToNormals +
			!!(fvf & fvfFormat.Normal) * 12 +
			!!(fvf & fvfFormat.Color) * 4;

		var distToBittangent =
			distToTangent +
			!!(fvf & fvfFormat.Tangent) * 12;

		var distToTangentFrame = distToBittangent +
			!!(fvf & fvfFormat.Bitangent) * 12;

		var distToUV =
			distToTangentFrame +
			!!(fvf & fvfFormat.TangentFrame) * 12;

		/// Check if the UV is 32 bit float or 16 bit float.
		var uv32Flag = (fvf & fvfFormat.UV32Mask) >> 8;
		var uv16Flag = (fvf & fvfFormat.UV16Mask) >> 16;
		var isUV32 = !!uv32Flag;
		var hasUV = !!uv16Flag || !!uv32Flag;

		/// Popcount (count the number of binary 1's) in the UV flag
		/// to get the number of UV pairs used in this vertex format.
		var masked = isUV32 ? uv32Flag : uv16Flag;
		var numUV = MathUtils.popcount(masked);

		numUV = Math.min(numUV, 1.0);

		/// Create typed UV arrays
		if (hasUV) {
			for (var i = 0; i < numUV; i++) {
				uvs[i] = new Float32Array(numVerts * 2);
			}
		}


		// if (!!(fvf & fvfFormat.Normal)) {
		// 	console.log("HAS Normal");
		// }
		// if (!!(fvf & fvfFormat.Tangent)) {
		// 	console.log("HAS Tangent");
		// }
		// if (!!(fvf & fvfFormat.Bitangent)) {
		// 	console.log("HAS Bitangent");
		// }
		// if (!!(fvf & fvfFormat.TangentFrame)) {
		// 	console.log("HAS TangentFrame");
		// }

		/// Read data from each vertex data entry
		for (var i = 0; i < numVerts; i++) {

			/// Go to vertex memory position
			vertDS.seek(i * stride);

			/// Read position data
			/// (we just hope all meshes has 32 bit position...)
			var x = vertDS.readFloat32();
			var z = vertDS.readFloat32();
			var y = vertDS.readFloat32();

			/// Write position data, transformed to Tyria3D coordinate system.
			vertices[i * 3 + 0] = x; //- c.x;
			vertices[i * 3 + 1] = -y; //+ c.y;
			vertices[i * 3 + 2] = -z; //+ c.z;

			/// Read data at UV position
			if (hasUV) {

				for (var uvIdx = 0; uvIdx < numUV; uvIdx++) {

					vertDS.seek(
						i * stride +
						distToUV +
						uvIdx * (isUV32 ? 8 : 4)
					);

					/// Add one UV pair:

					var u, v;
					if (isUV32) {
						u = vertDS.readUint32();
						v = vertDS.readUint32();
					} else {
						u = MathUtils.f16(vertDS.readUint16());
						v = MathUtils.f16(vertDS.readUint16());
					}

					/// Push to correct UV array
					uvs[uvIdx][i * 2 + 0] = u;
					uvs[uvIdx][i * 2 + 1] = v;
				}


			} /// End if has UV

		} /// End each vertex

		/// Each face descripbed in indices
		var faces = new Uint16Array(indices.length);
		for (var i = 0; i < indices.length; i += 3) {

			// This is ONE face
			faces[i + 0] = indices[i + 2];
			faces[i + 1] = indices[i + 1];
			faces[i + 2] = indices[i + 0];

		} // End each index aka "face"


		/// Add position, index and uv props to buffered geometry
		geom.addAttribute('position', new THREE.BufferAttribute(vertices, 3));
		//geom.addAttribute( 'index', new THREE.BufferAttribute( faces, 1) );
		geom.setIndex(new THREE.BufferAttribute(faces, 1));


		/// Calculate normals
		/// Not all models have normals included, so we ask THREE to do the math at runtime.
		geom.computeVertexNormals();

		if (hasUV) {

			for (var uvIdx = 0; uvIdx < numUV; uvIdx++) {

				/// Names are "uv", "uv2", "uv3", ... , "uvN"
				var uvName = "uv" + (uvIdx > 0 ? uvIdx + 1 : "");

				/// Set "custom" attribute uvN
				geom.addAttribute(uvName, new THREE.BufferAttribute(uvs[uvIdx], 2));

				/// Flag for update
				geom.attributes[uvName].needsUpdate = true;
			}


			/// Not needed anymore?
			geom.uvsNeedUpdate = true;
		}


		/// Tell geometry to update its UVs and buffers
		geom.buffersNeedUpdate = true;

		/// DONE READING VERTEX DATA

		/// Get material used for this mesh
		var matIdx = rawMesh.materialIndex;
		var mat = mats[matIdx];
		var materialFile = null

		if (mat && matFiles[mat.filename]) {
			materialFile = matFiles[mat.filename];
		}

		var finalMaterial = MaterialUtils.getMaterial(mat, materialFile, localReader, sharedTextures);

		/// IF we could not find a material abort OR use a wireframe placeholder.
		if (!finalMaterial) {
			if (showUnmaterialed) {
				finalMaterial = new THREE.MeshLambertMaterial({
					color: 0x5bb1e8,
					wireframe: false,
					side: THREE.DoubleSide
				});
			} else {
				return [];
			}
		}

		/// Create the final mesh from the BufferedGeometry and MeshBasicMaterial
		var finalMesh = new THREE.Mesh(geom, finalMaterial);

		/// Set material info on the returned mesh
		if (mat) {
			finalMesh.materialFlags = mat.materialFlags;
			finalMesh.materialFilename = mat.filename;
		}

		finalMesh.materialName = rawMesh.materialName;

		/// Use materialFilename, materialName, and material.textureFilename in order to build export

		/// Set lod info on the returned mesh
		finalMesh.numLods = rawMesh.geometry.lods.length;
		finalMesh.lodOverride = modelDataChunk.data.lodOverride;

		/// Set flag and UV info on the returned mehs
		finalMesh.flags = rawMesh.flags;
		finalMesh.numUV = numUV;

		/// Add mesh to returned Array
		meshes.push(finalMesh);

	} /// End rawMeshes forEach

	return meshes;
}

/**
 * Loads mesh array from Model file and sends as argument to callback.
 * 
 * @memberof ModelUtils
 * @async
 * @param  {Number} filename Name of the model file to load data from.
 * @param  {Array} solidColor RGBA array of 4 integers
 * @param {LocalReader} localReader The LocalReader to load the file contents from.
 * @param {Object} sharedTextures  Value Object for keeping the texture cache.
 * @param {boolean} showUnmaterialed If false does not render any models with missing materials.
 
 * @param  {Function} callback Fired once all meshes have been loaded.
 * two arguments are passed to the callback function.
 * 
 * The first argument is an Array with each textured THREE.Mesh objects.
 * 
 * The second argument is the bounding spehere of this model file.
 * 
 */

function loadMeshFromModelFile(filename, solidColor, localReader, sharedTextures, showUnmaterialed, hideLOD, callback) {

	//Short handles prop attributes
	var finalMeshes = [];

	///Load file
	localReader.readFile(filename, false, false, undefined, undefined, true).then((result) => {
		let inflatedData = result.buffer;

		try {
			if (!inflatedData) {
				throw "Could not find MFT entry for " + filename;
			}

			var ds = new DataStream(inflatedData);

			var modelFile = new GW2File(ds, 0);

			//MODL for materials -> textures
			var modelDataChunk = modelFile.getChunk("modl");

			//GEOM for geometry
			var geometryDataChunk = modelFile.getChunk("geom");

			/// Hacky fix for not being able to adjust for position
			var boundingSphere = modelDataChunk.data.boundingSphere;
			var bsc = boundingSphere.center;
			boundingSphere.radius += Math.sqrt(bsc[0] * bsc[0] + Math.sqrt(bsc[1] * bsc[1] + bsc[2] * bsc[2]));

			/// Load all material files
			var allMats = modelDataChunk.data.permutations[0].materials;

			function loadMaterialIndex(mIdx, matCallback) {

				if (mIdx >= allMats.length) {

					matCallback();
					return;
				}

				var mat = allMats[mIdx];

				/// Skip if file is loaded
				if (matFiles[mat.filename]) {
					loadMaterialIndex(mIdx + 1, matCallback);
					return;
				}

				localReader.readFile(mat.filename, false, false, undefined, undefined, true)
					.then((result) => {
						let inflatedData = result.buffer;
						if (inflatedData) {
							var ds = new DataStream(inflatedData);
							var materialFile = new GW2File(ds, 0);
							matFiles[mat.filename] = materialFile;
						}

						loadMaterialIndex(mIdx + 1, matCallback);

					});
			}



			loadMaterialIndex(0, function () {

				/// Create meshes
				var meshes = renderGeomChunk(localReader, geometryDataChunk, modelDataChunk, sharedTextures, showUnmaterialed);

				// Build mesh group
				for (let mesh of meshes) {

					var texMask = 0x8 + 0x0800;

					//Must have texture
					if (!showUnmaterialed && !(mesh.materialFlags & texMask)) {
						return;
					}

					//Hide LOD meshes if hideLOD is true
					if (hideLOD && (mesh.flags == 4 || mesh.flags == 1)) {
						continue;
					}

					//Add to final colection
					finalMeshes.push(mesh);

				} /// END FOR EACH meshes

				callback(finalMeshes, boundingSphere);


			}); /// END LOAD MATERIALS CALLBACK


		} catch (e) {
			console.warn("Failed rendering model " + filename, e);
			var mesh = new THREE.Mesh(new THREE.BoxGeometry(200, 2000, 200), new THREE.MeshNormalMaterial());
			mesh.flags = 4;
			mesh.materialFlags = 2056;
			mesh.lodOverride = [1000000, 1000000];
			finalMeshes.push(mesh);

			/// Send the final meshes to callback function
			callback(finalMeshes);
		}

	}); /// END FILE LOADED CALLBACK FUNCTION
}


/**
 * Gets a mesh array from Model file and sends as argument to callback. Uses a cache of meshes in order
 * to never read the same model file twice.
 * 
 * @memberof ModelUtils
 * @async
 * @param  {Number} filename The fileId or baseId of the Model file to load
 * @param  {Array} color RGBA array of 4 integers
 * @param  {LocalReader} localReader The LocalReader object used to read data from the GW2 .dat file.
 * @param {Object} sharedMeshes  Value Object for keeping the texture cache.
 * @param {Object} sharedTextures  Value Object for keeping the texture cache.
 * @param {boolean} showUnmaterialed If false does not render any models with missing materials.
 * @param  {Function} callback Fired once all meshes have been loaded.
 * three arguments are passed to the callback function.
 * 
 * The first argument is an Array with each textured THREE.Mesh objects.
 *
 * The second argument is a boolean, true indicates that these meshes were not
 * loaded from the dat file, but retrieved from the run time cache.
 * 
 * The third argument is the bounding spehere of this model file.
 */
function getMeshesForFilename(filename, color, localReader, sharedMeshes, sharedTextures, showUnmaterialed, hideLOD, callback) {

	/// If this file has already been loaded, just return a reference to the meshes.
	/// isCached will be set to true to inform the caller the meshes will probably
	/// have to be cloned in some way.
	if (sharedMeshes[filename]) {
		callback(sharedMeshes[filename].meshes, true, sharedMeshes[filename].boundingSphere)
	}

	/// If this file has never been loaded, load it using loadMeshFromModelFile
	/// the resulting mesh array will be cached within this model's scope.
	else {

		loadMeshFromModelFile(filename, color, localReader, sharedTextures, showUnmaterialed, hideLOD, function (meshes, boundingSphere) {

			/// Cache result if any.
			if (meshes) {
				sharedMeshes[filename] = {
					meshes: meshes,
					boundingSphere: boundingSphere
				}
			}

			/// Allways fire callback.
			callback(meshes, false, boundingSphere);

		});
	}
}


/**
 * WIP, Tries to find all fileIds refered by a model file.
 * 
 * @memberof ModelUtils
 * @async
 * @param  {Number}   filename    Model file Id
 * @param  {LocalReader}   localReader LocalReader instance to read from
 * @param  {Function} callback   First argument is list of used file IDs
 */
function getFilesUsedByModel(filename, localReader, callback) {
	var fileIds = [filename];

	///Load model file
	localReader.readFile(filename, false, false, undefined, undefined, true).then((result) => {
		let inflatedData = result.buffer;

		try {
			if (!inflatedData) {
				throw "Could not find MFT entry for " + filename;
			}

			var ds = new DataStream(inflatedData);
			var modelFile = new GW2File(ds, 0);

			//MODL for materials -> textures
			var modelDataChunk = modelFile.getChunk("modl");

			/// Get materials used by model
			var mats = modelDataChunk.data.permutations[0].materials;

			/// Add each material file AND referenced TEXTURES
			for (let mat of mats) {

				/// Add material file id
				var matFileName = mat.filename;
				fileIds.push(matFileName);

				/// Add each texture file id
				mat.textures.forEach(function (tex) {
					fileIds.push(tex.filename);
				})

			}

		} catch (e) {
			console.warn("Could not export any data", e);
		}

		callback(fileIds);
	});

}

module.exports = {
	renderGeomChunk: renderGeomChunk,
	getMeshesForFilename: getMeshesForFilename,
	getFilesUsedByModel: getFilesUsedByModel
};