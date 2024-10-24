import { computeConvexHull } from './convex_hull.js';

export function enterExtrudeShapeMode(sceneInstance, extrusionDepth, PolygonsToExtrude, isPolygonAlreadyExtruded) {
    extrudeShape(sceneInstance, extrusionDepth, isPolygonAlreadyExtruded, PolygonsToExtrude);

}
function extrudeShape(sceneInstance, extrusionDepth, isPolygonAlreadyExtruded, PolygonsToExtrude) {
    for (let i = 0; i < PolygonsToExtrude.length; i++) {
        if (i == isPolygonAlreadyExtruded.length) {
            isPolygonAlreadyExtruded.push(false); // Initialize boolean array
        }

        if (isPolygonAlreadyExtruded[i] == false) {
            // Compute the convex hull to ensure the points are ordered
            let hullPoints = computeConvexHull(PolygonsToExtrude[i]);

            // Extruding shape with constant height = 6 units
            var extrudedShapeUniqueId = "shapeExtruded" + i.toString();
            const extrusion = BABYLON.MeshBuilder.ExtrudePolygon(extrudedShapeUniqueId, {
                shape: hullPoints,
                depth: extrusionDepth,  // Set extrusion depth to 6 units
                sideOrientation: BABYLON.Mesh.DOUBLESIDE
            }, sceneInstance);

            // Adjust the position of the extruded shape
            extrusion.position.y = extrusionDepth;  // Shift upwards by half the extrusion depth

            // Extruded shape UI Enhancements
            var material = new BABYLON.StandardMaterial("extrudedMaterial", sceneInstance);
            material.diffuseColor = new BABYLON.Color3(0, 0, 1);  // Dark blue color for extrusion
            extrusion.material = material;
            extrusion.enableEdgesRendering();
            extrusion.edgesWidth = 4.0;
            extrusion.edgesColor = new BABYLON.Color4(0, 0, 0, 1);  // Black edges

            // Mark the shape as extruded to avoid multiple extrusions
            isPolygonAlreadyExtruded[i] = true;
        }
    }
}
