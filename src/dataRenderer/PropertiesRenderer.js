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
const MapPropsUtils = require("../util/MapPropsUtils");

/**
 *
 * A renderer that generates property models for a map.
 *
 * @class PropertiesRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "mapFile", a GW2File.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */

class PropertiesRenderer extends DataRenderer {
  constructor(localReader, settings, context, logger) {
    super(localReader, settings, context, logger);

    this.mapFile = this.settings.mapFile;
  }

  /**
   * Renders all property meshes in a GW2 map described by the map's PROP chunk.
   * Output fileds generated:
   *
   * - *meshes* An array of THREE.Mesh objects visualizing all property models refered by this map.
   *
   * @async
   * @param  {Function} callback Fires when renderer is finished, does not take arguments.
   */
  renderAsync(callback) {
    let propertiesChunkData = this.mapFile.getChunk("prp2").data;

    if (!propertiesChunkData) {
      callback();
      return;
    }

    let props = propertiesChunkData.propArray;
    let animProps = propertiesChunkData.propAnimArray;
    let instanceProps = propertiesChunkData.propInstanceArray;
    let metaProps = propertiesChunkData.propMetaArray;

    /// Concat all prop types
    props = props
      .concat(animProps)
      .concat(instanceProps)
      .concat(metaProps);

    /// Start serial loading and redering. (to allow re-using meshes and textures)
    MapPropsUtils.renderIndex(this.localReader, props, 0, output => {
      this.getOutput().meshes = output.meshes;
      callback();
    });
  }

  /**
   * TODO: write description. Used for export feature
   * @param  {Function} callback [description]
   * @return {*}            [description]
   */
  getFileIdsAsync(callback) {
    const propertiesChunkData = this.mapFile.getChunk("prp2").data;

    let props = propertiesChunkData.propArray;
    const animProps = propertiesChunkData.propAnimArray;
    const instanceProps = propertiesChunkData.propInstanceArray;
    const metaProps = propertiesChunkData.propMetaArray;

    props = props
      .concat(animProps)
      .concat(instanceProps)
      .concat(metaProps);

    MapPropsUtils.getIdsForProp(props, 0, callback);
  }
}

module.exports = PropertiesRenderer;
