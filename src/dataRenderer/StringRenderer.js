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

/**
 *
 * A renderer that generates a list of readable strings from a "strs" file.
 * 
 * @class StringRenderer
 * @constructor
 * @extends DataRenderer
 * @param  {LocalReader} localReader  The LocalReader instance to read data from.
 * @param  {Object} settings     Any settings used by this renderer.
 * *Must* specify "id" the base ID or file ID of the string file to read strings from.
 * @param  {Object} context      Shared value object between renderers.
 * @param  {Logger} logger       The logging class to use for progress, warnings, errors et cetera.
 */
class StringRenderer extends DataRenderer{
	constructor(localReader, settings, context, logger){
		super(localReader, settings, context, logger);
	}

	/**
	 * Output fileds generated:
	 *
	 * - *strings* An array of objects. Each object has a "recid"-property specifing on what index within the file
	 * a given string was found, and a "value"-property specigying the string value.
	 *
	 * - *language* An integer specifing the language of the loaded file.
	 * 
	 * @async
	 * @param  {Function} callback Fires when renderer is finished, does not take arguments.
	 */
	renderAsync(callback){
		var self = this;

		/// Get file id
		var fileId = this.settings.id;
		var showUnmaterialed = true;

		/// Load the string file

		/// Set up output array
		this.getOutput().strings = [];

		this.localReader.loadFile(this.settings.id, function(inflatedData){
			var ds = new DataStream(inflatedData);
			var end = ds.byteLength -2;

			/// skip past fcc
			ds.seek(4);

			var entryHeaderDef =
			[
				"size", "uint16",
				"decryptionOffset", "uint16",
				"bitsPerSymbol", "uint16"
			];

			var entryIndex = 0;

			while ( end - ds.position > 6) {
							
				var entry = ds.readStruct(entryHeaderDef);
				entry.size -= 6;

				if(entry.size > 0){


					var isEncrypted = entry.decryptionOffset != 0 || entry.bitsPerSymbol != 0x10;

					/// UTF-16
					if( !isEncrypted ){
						var value =  ds.readUCS2String(entry.size/2);
						self.getOutput().strings.push({
							value:value,
							recid:entryIndex
						});
					}

					/// Other... ignored
					else{

					}
				}

				entryIndex++;        
			}


			ds.seek(ds.byteLength - 2);
			self.getOutput().language = ds.readUint16();
			callback();
		});


	}
}

module.exports = StringRenderer;