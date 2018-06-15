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

const MapEnvUtils = require("../util/MapEnvUtils");
const DataRenderer = require('./DataRenderer');

/**
 *
 * A renderer that generates some of the environment objects of a map.
 * 
 * @class EnvironmentRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "mapFile", a GW2File.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */
class EnvironmentRenderer extends DataRenderer {
	constructor(localReader, settings, context, logger) {
		super(localReader, settings, context, logger);

		this.mapFile = this.settings.mapFile;

	}

	/**
	 * Output fileds generated:
	 *
	 * - *hazeColor* Array of RGBA values describing the global haze color of the map.
	 * - *lights* An array of THREE.DirectionalLight and  THREE.AmbientLight objects.
	 * - *hasLight* Boolean is false if no directional lights were added to "lights".
	 * - *skyElements* A textured THREE.Mesh skybox.
	 * 
	 * @async
	 * @param  {Function} callback Fires when renderer is finished, does not take arguments.
	 */
	renderAsync(callback) {

		var environmentChunkData = this.mapFile.getChunk("env").data;
		var parameterChunkData = this.mapFile.getChunk("parm").data;

		/// Set renderer clear color from environment haze
		var hazeColor = MapEnvUtils.getHazeColor(environmentChunkData);
		var hazeColorAsInt = hazeColor[2] * 256 * 256 + hazeColor[1] * 256 + hazeColor[0];
		this.getOutput().hazeColor = hazeColor;

		/// Add directional lights to output. Also write hasLight flag
		let lightData = MapEnvUtils.parseLights(environmentChunkData);
		this.getOutput().hasLight = lightData.hasLight;
		this.getOutput().lights = lightData.lights;

		/// Generate skybox
		this.getOutput().skyElements = MapEnvUtils.parseSkybox(
			environmentChunkData, parameterChunkData, hazeColorAsInt,
			//TODO: Move outside of library
			["img/193068.png", "img/193070.png", "img/193072.png"],
			this.localReader
		).skyElements;

		/// All parsing is synchronous, just fire callback
		callback();
	}
}


module.exports = EnvironmentRenderer;