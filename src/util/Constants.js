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

/**
 * Object describing the meaning of the bits in fvf integers.
 * @private
 * @type {Object}
 */
let fvfFormat = {
  Position: 0x00000001,
  /** < 12 bytes. Position as three 32-bit floats in the order x, y, z. */
  Weights: 0x00000002,
  /** < 4 bytes. Contains bone weights. */
  Group: 0x00000004,
  /** < 4 bytes. Related to bone weights. */
  Normal: 0x00000008,
  /** < 12 bytes. Normal as three 32-bit floats in the order x, y, z. */
  Color: 0x00000010,
  /** < 4 bytes. Vertex color. */
  Tangent: 0x00000020,
  /** < 12 bytes. Tangent as three 32-bit floats in the order x, y, z. */
  Bitangent: 0x00000040,
  /** < 12 bytes. Bitangent as three 32-bit floats in the order x, y, z. */
  TangentFrame: 0x00000080,
  /** < 12 bytes. */
  UV32Mask: 0x0000ff00,
  /** < 8 bytes for each set bit. Contains UV-coords as two 32-bit floats in the order u, v. */
  UV16Mask: 0x00ff0000,
  /** < 4 bytes for each set bit. Contains UV-coords as two 16-bit floats in the order u, v. */
  Unknown1: 0x01000000,
  /** < 48 bytes. Unknown data. */
  Unknown2: 0x02000000,
  /** < 4 bytes. Unknown data. */
  Unknown3: 0x04000000,
  /** < 4 bytes. Unknown data. */
  Unknown4: 0x08000000,
  /** < 16 bytes. Unknown data. */
  PositionCompressed: 0x10000000,
  /** < 6 bytes. Position as three 16-bit floats in the order x, y, z. */
  Unknown5: 0x20000000
  /** < 12 bytes. Unknown data. **/
};

/// Known material flags, not used yet
const knownflags = [
  0, // 0 0000 0000 0000		Ground / Wall splashes
  8, // 0 0000 0000 1000		Broken Khylo roof DDS
  9, // 0 0000 0000 1001		Tree leaves

  520, // 0 0010 0000 1000		Some LOD modules, fires, smoke, inside of tents (some DSS textures)

  2056, // 0 1000 0000 1000		Solid objects, also broken animations

  /// Solids here are unhappy, or are they? could be animations etc
  2057, // 0 1000 0000 1001		Windmill sails, bushes, trees, but also a statue and a few pieces of wall

  2060, // 0 1000 0000 1100		A few solid objects, like wooden barricades, one(!) painting
  2061, // 0 1000 0000 1101		A few bushes, two paintings

  2312, // 0 1001 0000 1000		Opaque Clock tower main walls AND IVY
  2316, // 0 1001 0000 1100		Bushes, inner flower walkway a ramp and a box

  // Number 10
  2568, // 0 1010 0000 1000		Lots of solids; walls, tents also some tent details WITH alpa

  // Number 11
  2569, // 0 1010 0000 1001		Solids like walls and roofs and appernt non solids like ropes

  2572, // 0 1010 0000 1100		Solid wooden beems, lamp posts
  2573, // 0 1010 0000 1101		Lamp holders, bushes, fences, apparent non solids
  2584, // 0 1010 0001 1000		Fountain Well water

  2824, // 0 1011 0000 1000		Windows, sign arrows, cloth roofs (non solids) BUT straw roofs
  2828, // 0 1011 0000 1100		A few fence post (non solids)
  2840, // 0 1011 0001 1000		Fountain running water + pipe water

  4617, // 1 0010 0000 1001		Found nothing
  6664 // 1 1010 0000 1000		Two groups of solid boxes
];

module.exports = {
  fvfFormat: fvfFormat
};
