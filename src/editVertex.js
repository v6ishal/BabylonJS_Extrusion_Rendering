import { computeConvexHull } from './convex_hull.js';
// vertexEdit.js
let moveEventHandlers = null;

export function enterVertexEditMode(scene, camera, engine, ground, vertexEditMode) {
    console.log("Enter Vertex edit mode ...")
    runVertexEditMode(scene, camera, engine, ground, vertexEditMode);
}

export function exitVertexEditMode(engine) {
    console.log("Exiting Move Mode...");
    if (moveEventHandlers) {
        let canvasElement = engine.getRenderingCanvas();
        canvasElement.removeEventListener("pointerdown", moveEventHandlers.pointerDown);
        canvasElement.removeEventListener("pointerup", moveEventHandlers.pointerUp);
        canvasElement.removeEventListener("pointermove", moveEventHandlers.pointerMove);
        moveEventHandlers = null;
    }
}

function runVertexEditMode(scene, camera, engine, ground, vertexEditMode) {
    var canvas = engine.getRenderingCanvas();
    var startingPoint;
    var currentMesh;
    var currentMeshNonSphere;

    // Helper function to check if the picked mesh is a vertex
    var isVertex = function () {
        var isVertexflag = false;

        // Determine the cursor point from scene 2D coordinates to vector 3D coordinates
        var ray = scene.createPickingRay(scene.pointerX, scene.pointerY, BABYLON.Matrix.Identity(), camera);
        var rayCastHit = scene.pickWithRay(ray);

        // Prepare parameters for ray from cursor perpendicular to ground in -ve y-axis direction
        var origin = rayCastHit.pickedPoint;
        var direction = new BABYLON.Vector3(0, -1, 0);
        var length = 5;

        var rayPerpendicular = new BABYLON.Ray(origin, direction, length);
        
        // Determine all the meshes hit by the perpendicular ray
        var hits = scene.multiPickWithRay(rayPerpendicular);
        if (hits) {
            for (var i = 0; i < hits.length; i++) {
                // If pointMarker on the ground is hit, it's a vertex of the extruded polygon
                if (hits[i].pickedMesh.name.startsWith("pointMarker")) {
                    currentMeshNonSphere = hits[i].pickedMesh;
                    isVertexflag = true;
                    break;
                }
            }
        }
        return isVertexflag;
    }

    // Helper function to get ground position
    var getGroundPosition = function () {
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) { return mesh == ground; });
        if (pickInfo.hit) {
            return pickInfo.pickedPoint;
        }
        return null;
    }

    // On pointer down, detect and start editing
    var onPointerDown = function (evt) {
        if (!vertexEditMode) {
            canvas.removeEventListener("pointerdown", onPointerDown);
            canvas.removeEventListener("pointerup", onPointerUp);
            canvas.removeEventListener("pointermove", onPointerMove);
            return;
        }

        if (evt.button !== 0) {
            return;
        }

        // Check if we are under a mesh
        var pickInfo = scene.pick(scene.pointerX, scene.pointerY, function (mesh) {
            return mesh !== ground && (mesh.id.startsWith("pointMarker") || (mesh.id.startsWith("shapeExtruded") && isVertex()));
        });

        if (pickInfo.hit) {
            currentMesh = pickInfo.pickedMesh;
            if (!currentMesh.id.startsWith("pointMarker")) {
                currentMesh = currentMeshNonSphere;  // If we pick the shape, get the associated pointMarker
            }
            startingPoint = getGroundPosition(evt);

            if (startingPoint) {
                // Disconnect camera from canvas during vertex move
                setTimeout(function () {
                    camera.detachControl(canvas);
                }, 0);
            }
        }
    }

    // On pointer up, stop editing
    var onPointerUp = function () {
        if (startingPoint) {
            camera.attachControl(canvas, true);
            startingPoint = null;
        }
    }

    // On pointer move, update vertex position and related meshes
    var onPointerMove = function (evt) {
        if (!startingPoint) {
            return;
        }

        var current = getGroundPosition(evt);

        if (!current) {
            return;
        }

        // Update the vertex position
        var diff = current.subtract(startingPoint);
        currentMesh.position.addInPlace(diff);

        // Update the line mesh 2D shape
        var curMeshIdxs = currentMesh.id.split("_");
        var lineMeshId = "lines" + curMeshIdxs[0].slice(11);
        var pointToUpdate = Number(curMeshIdxs[1]);
        var lineMesh = scene.getMeshByID(lineMeshId);
        
        var positions = lineMesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
        var startIdx = 3 * pointToUpdate;
        
        positions[startIdx] = currentMesh.position.x;
        positions[startIdx + 1] = currentMesh.position.y;
        positions[startIdx + 2] = currentMesh.position.z;

        // Ensure the shape is closed by updating the first point again
        if (startIdx === 0) {
            var n = positions.length;
            positions[n - 3] = positions[startIdx];
            positions[n - 2] = positions[startIdx + 1];
            positions[n - 1] = positions[startIdx + 2];
        }

        var myPoints = [];

        // Create updated points array for new line mesh and extruded mesh
        for (var i = 0; i < positions.length; i += 3) {
            var x = positions[i];
            var y = positions[i + 1];
            var z = positions[i + 2];

            myPoints.push(new BABYLON.Vector3(x, y, z));
        }

        // Dispose of the old line mesh and create the new one
        lineMesh.dispose();
        lineMesh = BABYLON.MeshBuilder.CreateLines(lineMeshId, { points: myPoints, updatable: true }, scene);
        lineMesh.color = new BABYLON.Color3(0, 0, 1); // Set line color to blue
        
        let hullPoints = computeConvexHull(myPoints);
        // Get the height of the existing extruded mesh before disposal
        

        //updating the extruded polygon
        var extrudedMeshId = "shapeExtruded" + curMeshIdxs[0].slice(11);
        var extrudedMesh = scene.getMeshByID(extrudedMeshId);
        var existingHeight = getExtrudedHeight(extrudedMesh);
        extrudedMesh.dispose();
        extrudedMesh = BABYLON.MeshBuilder.ExtrudePolygon(extrudedMeshId, {shape: hullPoints, depth: existingHeight, updatable: true}, scene);
        extrudedMesh.position.y = existingHeight;
        
        var material = new BABYLON.StandardMaterial("extrudedMaterial", scene);
        material.diffuseColor = new BABYLON.Color3(0, 0, 1 );
        extrudedMesh.material = material;
        extrudedMesh.enableEdgesRendering();
        extrudedMesh.edgesWidth = 4.0; // Set the width of the edges
        extrudedMesh.edgesColor = new BABYLON.Color4(0, 0, 0, 1);
        
        startingPoint = current;
    }

    moveEventHandlers = {
        pointerDown: onPointerDown,
        pointerUp: onPointerUp,
        pointerMove: onPointerMove
    };

    canvas.addEventListener("pointerdown", moveEventHandlers.pointerDown, false);
    canvas.addEventListener("pointerup", moveEventHandlers.pointerUp, false);
    canvas.addEventListener("pointermove", moveEventHandlers.pointerMove, false);
}

function getExtrudedHeight(mesh) {
    const boundingInfo = mesh.getBoundingInfo(); // Get bounding box info
    const boundingBox = boundingInfo.boundingBox;
    const height = boundingBox.maximum.y - boundingBox.minimum.y; // Calculate height
    return height;
}
