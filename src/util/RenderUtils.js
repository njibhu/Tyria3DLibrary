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
 * Collection of methods used for generating THREE meshes from Guild Wars 2 data formats.
 * @namespace RenderUtils
 */


/**
 * Creates a mesh representing a single plane.
 * 
 * @memberof RenderUtils
 * @param  {Object} rect     An object with x1,x2,y1 and y2 properties.
 * @param  {Number} yPos     Vertical position of the rectangle.
 * @param  {THREE.Material} material 	Mesh material to apply.
 * @param  {Number} dy       Mesh height.
 * @return {THREE.Mesh}      The generated mesh.
 */
function renderRect(rect, yPos, material, dy) {
    var dx = rect.x1 - rect.x2;
    var dz = rect.y1 - rect.y2;
    if (!dy)
        dy = 1;

    var cx = (rect.x1 + rect.x2) / 2;
    var cz = (rect.y1 + rect.y2) / 2;
    var cy = yPos;

    var geometry = new THREE.BoxGeometry(dx, dy, dz);


    material = material || new THREE.MeshBasicMaterial({
        color: 0xff0000,
        wireframe: true,
    });
    var plane = new THREE.Mesh(geometry, material);
    plane.overdraw = true;

    plane.position.x = cx;
    plane.position.y = cy;
    plane.position.z = cz;

    return plane;
};

module.exports = {
    renderRect: renderRect
}