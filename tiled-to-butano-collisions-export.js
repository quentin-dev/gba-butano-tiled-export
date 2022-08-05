/// <reference types="@mapeditor/tiled-api" />

/*
* tiled-to-butano-collisions-export.js
*
* Generate a Butano header file containing collision info
*/

/* global tiled, FileInfo, TextFile */

const WalkableTileId = 0;
const NonWalkableTileId = 1;

const NON_WALKABLE = 0;
const WALKABLE = 1;

/**
 * Get the walkable value from a given tile's ID
 * Defaults to Non-Walkable if tile ID is not expected
 * @param {number} tileId - The tile ID to check 
 * @return {number} - The corresponding walkable value
 */
function getWalkableValueFromTileId(tileId) {
    switch (tileId) {
        case WalkableTileId:
            return WALKABLE;
        case NonWalkableTileId:
            return NON_WALKABLE;
        default:
            return NON_WALKABLE;
    }
}

/**
 * Write Butano header includes to the specified file
 * @param {TextFile} file - The file to write the header to
 * @param {string} baseName - The file's name without path and extension
 * @param {number} spritesPerRow - Number of sprites per row
 * @param {number} spritesPerColumn - Number of sprites per column
 * @return {void} Nothing
 */
function writeHeader(file, baseName, spritesPerRow, spritesPerColumn) {
    const definition = `${baseName.toUpperCase()}_HH`;
    file.writeLine(`#ifndef ${definition}`);
    file.writeLine(`#define ${definition}`)
    file.writeLine("");
    file.writeLine('#include "bn_core.h"');
    file.writeLine("");
    file.writeLine("namespace gj {");
    file.writeLine("");
    file.writeLine(`const uint8_t SPRITES_PER_ROW = ${spritesPerRow};`);
    file.writeLine("");
    file.writeLine(`const uint8_t SPRITES_PER_COLUMN = ${spritesPerColumn};`);
    file.writeLine("");
}

/**
 * Write footer to the specified file
 * @param {TextFile} file - The file to write the footer to
 * @return {void} Nothing
 */
function writeFooter(file) {
    file.writeLine("}");
    file.writeLine("");
    file.writeLine("#endif");
}


tiled.registerMapFormat("butano-collisions", {
    name: "Butano Header - Collision Map",
    extension: "hh",

    write: (map, filename) => {

        /** @type {TileLayer | undefined} */
        const collisionsLayer = map.layers.find((layer) => layer.name == "Collisions" && layer.isTileLayer);

        if (!collisionsLayer) {
            return "Export failed: Could not find a tile layer called 'Collisions'"
        }

        /** @type {string} */
        const path = FileInfo.path(filename);
        /** @type {string} */
        const baseName = FileInfo.baseName(filename);

        /** @type {string} */
        const completePath = FileInfo.joinPaths(path, `${baseName}.hh`);

        const file = new TextFile(completePath, TextFile.WriteOnly);

        writeHeader(file, baseName, map.width, map.height);

        file.writeLine("constexpr const uint8_t collisions[] = {");

        for (let y = 0; y < collisionsLayer.height; ++y) {
            const row = [];

            for (let x = 0; x < collisionsLayer.width; ++x) {
                const currentTileId = collisionsLayer.tileAt(x, y).id;
                const walkableValue = getWalkableValueFromTileId(currentTileId);
                row.push(walkableValue);
            }

            file.writeLine("\t" + row.join(", ") + ",");
        }

        file.writeLine("};")

        writeFooter(file);

        file.commit();
    },
});
