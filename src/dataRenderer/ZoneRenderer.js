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
const MapZoneUtils = require("../util/MapZoneUtils");

/**
 *
 * A renderer that generates zone models for a map.
 *
 * @class ZoneRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "mapFile", a GW2File.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */
class ZoneRenderer extends DataRenderer {
  constructor(localReader, settings, context, logger) {
    super(localReader, settings, context, logger);

    this.mapFile = this.settings.mapFile;
  }

  /**
   * Renders all zone meshes in a GW2 map described by the map's "zon2" chunk.
   * Output fileds generated:
   *
   * - *meshes* An array of THREE.Mesh objects visualizing all zone models refered by this map.
   *
   * @async
   * @param  {Function} callback Fires when renderer is finished, does not take arguments.
   */
  renderAsync(callback) {
    /// Set up output array
    this.getOutput().meshes = [];

    let zoneChunkData = this.mapFile.getChunk("zon2").data;
    let parameterChunkData = this.mapFile.getChunk("parm").data;
    // let terrainChunkData = this.mapFile.getChunk("trn").data;
    let mapRect = parameterChunkData.rect;

    /// Zone data
    let zones = zoneChunkData.zoneArray;
    let zoneDefs = zoneChunkData.zoneDefArray;

    /// Render each zone
    let lastPct = -1;

    const dataForUtils = {
      localReader: this.localReader,
      terrainTiles: this.getOutput(T3D.TerrainRenderer).terrainTiles,
      output: { meshes: [] }
    };

    /// Main render loop, render each zone
    const stepZone = i => {
      let pct = Math.round((100.0 * i) / zones.length);
      if (lastPct !== pct) {
        T3D.Logger.log(
          T3D.Logger.TYPE_PROGRESS,
          "Loading 3D Models (Zone)",
          pct
        );
        lastPct = pct;
      }

      if (i >= zones.length) {
        callback();
        return;
      }

      /// Main zone render function call
      MapZoneUtils.renderZone(dataForUtils, zones[i], zoneDefs, mapRect, () => {
        this.getOutput().meshes = this.getOutput().meshes.concat(
          dataForUtils.output.meshes
        );
        stepZone(i + 1);
      });
    };

    stepZone(0);
  }
}

module.exports = ZoneRenderer;
