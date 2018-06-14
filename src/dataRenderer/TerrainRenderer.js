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

const DataRenderer = require('./DataRenderer');

const MapTerrainUtils = require("../util/MapTerrainUtils");

/**
 *
 * A renderer that generates the meshes for the terrain of a map.
 *
 * 
 * Requires a context previously populated by a 
 * {{#crossLink "EnvironmentRenderer"}}{{/crossLink}}.
 * 
 * @class TerrainRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "mapFile", a GW2File.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */
class TerrainRenderer extends DataRenderer {
	constructor(localReader, settings, context, logger) {
		super(localReader, settings, context, logger);

		this.mapFile = this.settings.mapFile;
	}


	/**
	 * Output fileds generated:
	 * 
	 * - *terrainTiles* An array of THREE.Mesh objects visualizing terrain of the map.
	 * 
	 * - *water* A THREE.Mesh object visualizing the bounds of the map.
	 * 
	 * - *bounds* An object wiht x1, x2, y1, and y2 properties specifying the bounds of the map.
	 * 
	 * @async
	 * @param  {Function} callback Fires when renderer is finished, does not take arguments.
	 */
	renderAsync(callback) {

		/// Load all paged Images, requires inflation of other pack files!
		var pagedImageId = this.mapFile.getChunk("trn").data.materials.pagedImage;
		this.localReader.readFile(pagedImageId, false, false, undefined, undefined, true).then((result) => {

			return MapTerrainUtils.loadPagedImageCallback(
				result.buffer,
				this.mapFile,
				this.settings.anisotropy,
				this.getOutput(T3D.EnvironmentRenderer),
				this.localReader);

		}).then((terrainResult) => {
			//Populate the output
			this.getOutput().terrainTiles = terrainResult.terrainTiles;
			this.getOutput().water = terrainResult.water;
			this.getOutput().bounds = terrainResult.mapRect;

			callback();
		});
	}

	/**
	 * TODO: write description. Used for export feature
	 * 
	 * @param  {Function} callback [description]
	 * @return {*}            [description]
	 */
	getFileIdsAsync(callback) {

		var terrainChunk = this.mapFile.getChunk("trn");
		var pimgTableDataChunk = this.mapFile.getChunk("pimg");
		var fileIds = [];

		/// ------------ SPLASH TEXTURES ------------
		var pimgData = pimgTableDataChunk && pimgTableDataChunk.data;
		var strippedPages = pimgData.strippedPages;

		///Only use layer 0
		strippedPages.forEach(function (page) {

			/// Only load layer 0 and 1
			if (page.layer <= 1 && page.filename > 0) {
				fileIds.push(page.filename);
			}
		});
		/// ------------ END SPLASH TEXTURES ------------



		/// ------------ TILED IMAGES ------------
		var terrainData = terrainChunk.data;
		var allTextures = terrainData.materials.texFileArray;
		allTextures.forEach(function (texture) {
			if (texture.filename > 0)
				fileIds.push(texture.filename);
		})
		/// ------------ END TILED IMAGES ------------

		return fileIds;
	}
}

module.exports = TerrainRenderer;