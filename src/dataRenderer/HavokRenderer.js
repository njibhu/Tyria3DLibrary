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

const DataRenderer = require("./DataRenderer");
const MapHavokUtils = require("../util/MapHavokUtils");

/**
 *
 * A renderer that generates meshes describing the collisions of a map.
 *
 * @class HavokRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "mapFile", a GW2File. If "visible" is specified and true, the generated meshes will be textured
 * with a MeshNormalMaterial, otherwise they will not be visible.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */

class HavokRenderer extends DataRenderer {
  constructor(localReader, settings, context, logger) {
    super(localReader, settings, context, logger);

    this.mapFile = this.settings.mapFile;

    this.lastP = -1;
    this.seed = 1;
    this.meshes = [];
  }

  /**
   * Output fileds generated:
   *
   * - *boundingBox* Array of values describing the bounding box of all collision.
   * - *meshes* An array of THREE.Mesh objects visualizing all collision in the map.
   *
   * @async
   * @param  {Function} callback Fires when renderer is finished, does not take arguments.
   */
  renderAsync(callback) {
    // TODO:The design of this method pretty much requires one instance
    // of the class per parallel async render. Should probably fix this
    // at some point...

    /// Get required chunks
    this.havokChunkData = this.mapFile.getChunk("havk").data;

    /// Set static bounds to the bounds of the havk models
    this.getOutput().boundingBox = this.havokChunkData.boundsMax;

    this.meshes = [];

    /// Grab model raw data from the chunk.
    /// Add missing scale value to obs models.
    let propModels = this.havokChunkData.propModels;
    let zoneModels = this.havokChunkData.zoneModels;
    let obsModels = this.havokChunkData.obsModels;
    for (const mdl of obsModels) {
      mdl.scale = 1;
    }

    /// Store geoms and animations from the file in the instance so we don't
    /// have to pass them around too much. (fix this later)
    this.geometries = this.havokChunkData.geometries;
    this.animations = this.havokChunkData.animations;

    /// Render "prop", "zone" and "obs" models in that order.
    let renderPropModelsCB = () => {
      this.renderModels(zoneModels, "zone", renderZoneModelsCB);
    };
    const renderZoneModelsCB = () => {
      this.renderModels(obsModels, "obs", callback);
    };
    this.renderModels(propModels, "prop", renderPropModelsCB);
  }

  renderModels(models, title, callback) {
    MapHavokUtils.renderModels(
      {
        settings: this.settings,
        lastP: this.lastP,
        geometries: this.geometries,
        animations: this.animations,
        havokChunkData: this.havokChunkData,
        meshes: this.meshes,
        output: { meshes: [] }
      },
      models,
      title,
      output => {
        // Add to current output before calling the callback
        let currentOutput = this.getOutput().meshes;
        this.getOutput().meshes = currentOutput
          ? currentOutput.concat(output.meshes)
          : output.meshes;
        callback();
      }
    );
  }
}

module.exports = HavokRenderer;
