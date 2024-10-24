let moveEventHandlers = null; // Store the move event handlers to remove them later

export function enterMoveMode(sceneInstance, cameraInstance, babylonEngine, ground, isMoveModeActive, polygonsToExtrude) {
    console.log("Entering Move Mode...");

    // Call the function that handles the move functionality
    initiateMoveMode(sceneInstance, cameraInstance, babylonEngine, ground, isMoveModeActive, polygonsToExtrude);
}

export function exitMoveMode(babylonEngine) {
    console.log("Exiting Move Mode...");
    if (moveEventHandlers) {
        let canvasElement = babylonEngine.getRenderingCanvas();
        canvasElement.removeEventListener("pointerdown", moveEventHandlers.pointerDown);
        canvasElement.removeEventListener("pointerup", moveEventHandlers.pointerUp);
        canvasElement.removeEventListener("pointermove", moveEventHandlers.pointerMove);
        moveEventHandlers = null;
    }
}

function initiateMoveMode(sceneInstance, cameraInstance, babylonEngine, ground, isMoveModeActive, polygonsToExtrude) {
    var canvasElement = babylonEngine.getRenderingCanvas();
    var initialPointerPosition;
    var selectedMesh = null;

    var getGroundPosition = function () {
        var pickInfo = sceneInstance.pick(sceneInstance.pointerX, sceneInstance.pointerY, function (mesh) { return mesh === ground; });
        if (pickInfo.hit) {
            return pickInfo.pickedPoint;
        }
        return null;
    };

    var onPointerDownMove = function (event) {
        if (!isMoveModeActive) {  // Check if move mode is active
            exitMoveMode(babylonEngine);  // Remove event listeners if move mode is off
            return;
        }
        if (event.button !== 0) {
            return;
        }

        var pickInfo = sceneInstance.pick(sceneInstance.pointerX, sceneInstance.pointerY, function (mesh) 
        { 
            return mesh !== ground && mesh.id.startsWith("shapeExtruded"); 
        });
        
        if (pickInfo.hit) {
            selectedMesh = pickInfo.pickedMesh;
            initialPointerPosition = getGroundPosition(event);

            if (initialPointerPosition) {
                setTimeout(function () {
                    cameraInstance.detachControl(canvasElement);
                }, 0);

                var materialForMesh = new BABYLON.StandardMaterial("extrudedMaterial", sceneInstance);
                materialForMesh.diffuseColor = new BABYLON.Color3(0, 0, 1);
                selectedMesh.material = materialForMesh;
            }
        }
    };

    var onPointerUpMove = function () {
        if (initialPointerPosition) {
            cameraInstance.attachControl(canvasElement, true);
            initialPointerPosition = null;
        }
    };

    var onPointerMoveDrag = function (event) {
        if (!initialPointerPosition) {
            return; // Exit if no initial position is set (i.e., if we're not dragging)
        }

        // Get the new ground position while dragging
        var currentPointerPosition = getGroundPosition();

        if (!currentPointerPosition) {
            return; // Exit if no valid position is found
        }

        // Calculate the difference between the initial position and the current position
        var positionDifference = currentPointerPosition.subtract(initialPointerPosition);

        // Move the selected mesh by the difference in position
        selectedMesh.position.addInPlace(positionDifference);

        // Move the corresponding line mesh (2D shape) by the same amount
        var lineMeshId = "lines" + selectedMesh.id.slice(13); // Generate line mesh ID
        var lineMesh = sceneInstance.getMeshByID(lineMeshId);
        lineMesh.position.addInPlace(positionDifference);

        // Get the index of the selected mesh and update the points of the associated 2D shape
        var index = Number(selectedMesh.id.slice(13));    
        var currentPolygonPoints = polygonsToExtrude[index];

        // Update positions for the vertices (point markers)
        var updatedPath = [];
        for (var i = 0; i < currentPolygonPoints.length; i++) {
            var pointMarkerName = "pointMarker" + index.toString() + "_" + i.toString(); // Get sphere name
            var currentPointMarker = sceneInstance.getMeshByName(pointMarkerName);
            if (currentPointMarker != null) {
                currentPointMarker.position.addInPlace(positionDifference); // Update sphere position
                currentPolygonPoints[i] = currentPointMarker.position; // Update 2D shape point
                updatedPath.push(currentPointMarker.position.x, currentPointMarker.position.y, currentPointMarker.position.z); // Track new position
            } else {
                console.log("Point marker not found: ", pointMarkerName); // Log error if marker not found
                break;
            }
        }

        // Ensure the shape is closed by updating the last point to match the first
        var totalPoints = currentPolygonPoints.length;
        currentPolygonPoints[totalPoints - 1] = currentPolygonPoints[0];

        updatedPath.push(updatedPath[0], updatedPath[1], updatedPath[2]); // Add the first point to close the path

        // Dispose of the old line mesh and create a new one to reflect the updated positions
        var existingLineMesh = sceneInstance.getMeshByID(lineMeshId);
        existingLineMesh.dispose();
        var newLineMesh = BABYLON.MeshBuilder.CreateLines(lineMeshId, { points: currentPolygonPoints }, sceneInstance);
        newLineMesh.color = new BABYLON.Color3(0, 0, 1); // Set line color to blue

        // Set the new initial pointer position for the next move iteration
        initialPointerPosition = currentPointerPosition;
    }
    
    moveEventHandlers = {
        pointerDown: onPointerDownMove,
        pointerUp: onPointerUpMove,
        pointerMove: onPointerMoveDrag
    };

    canvasElement.addEventListener("pointerdown", moveEventHandlers.pointerDown, false);
    canvasElement.addEventListener("pointerup", moveEventHandlers.pointerUp, false);
    canvasElement.addEventListener("pointermove", moveEventHandlers.pointerMove, false);
}
