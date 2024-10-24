let drawEventHandler = null; // Store the draw event handler to remove it later

export function enterDrawMode(sceneInstance, pointsList, polygonsToExtrudeList) {
    console.log("Entering Draw Mode...");

    const instructionContainer = document.getElementById('instructions-container');
    instructionContainer.innerHTML = '<p>Click on the ground to add points and draw a polygon. Right-click to finish.</p>';
    
    // Optional: Add some styling for the instructions
    instructionContainer.style.textAlign = "center";
    instructionContainer.style.color = "#333";
    instructionContainer.style.marginTop = "1px";

    // Attach pointer event handler for draw mode
    drawEventHandler = function (pointerEventInfo) {
        handlePointerAction(pointerEventInfo, sceneInstance, pointsList, polygonsToExtrudeList);
    };
    
    // Adding pointer observable listener
    sceneInstance.onPointerObservable.add(drawEventHandler, BABYLON.PointerEventTypes.POINTERDOWN);
}

export function exitDrawMode(sceneInstance) {
    console.log("Exiting Draw Mode...");

    const instructionContainer = document.getElementById('instructions-container');
    instructionContainer.innerHTML = '';

    if (drawEventHandler) {
        // Remove the event listener when exiting draw mode
        sceneInstance.onPointerObservable.removeCallback(drawEventHandler);
        drawEventHandler = null; // Clear the handler reference
    }
}

function handlePointerAction(pointerEventInfo, sceneInstance, pointsList, polygonsToExtrudeList) {
    const pickInfo = pointerEventInfo.pickInfo;

    // Ensure the pointer event was on the ground or lines
    if (pointerEventInfo.type === BABYLON.PointerEventTypes.POINTERDOWN) {
        if (pointerEventInfo.event.button === 0 && pickInfo.pickedMesh &&
            (pickInfo.pickedMesh.id === "ground" || pickInfo.pickedMesh.id.startsWith("lines"))) {
            
            // Left-click: Add points to the list and draw a marker
            pointsList.push(pickInfo.pickedPoint);
            createPointMarker(pickInfo.pickedPoint, sceneInstance, pointsList, polygonsToExtrudeList);

        } else if (pointerEventInfo.event.button === 2 && pointsList.length > 0) {
            // Right-click: Complete the polygon by connecting to the first point
            pointsList.push(pointsList[0]);  // Close the loop
            
            const polygonIndex = polygonsToExtrudeList.length;
            const lineMesh = BABYLON.MeshBuilder.CreateLines("lines" + polygonIndex.toString(), { points: pointsList, updatable: true }, sceneInstance);
            lineMesh.color = new BABYLON.Color3(0, 1, 0);  // Green lines for the shape

            // Store the completed polygon and reset the points list
            polygonsToExtrudeList.push([...pointsList]);
            pointsList.length = 0;
        }
    }
}

function createPointMarker(pickedPoint, sceneInstance, pointsList, polygonsToExtrudeList) {
    const currentPolygonIndex = polygonsToExtrudeList.length;
    const currentPointIndex = pointsList.length - 1;

    const pointMarker = BABYLON.MeshBuilder.CreateSphere(
        "pointMarker" + currentPolygonIndex.toString() + "_" + currentPointIndex.toString(),
        { diameter: 0.5 },
        sceneInstance
    );
    pointMarker.position = pickedPoint;

    // Create and apply material to the point marker
    const pointMaterial = new BABYLON.StandardMaterial("pointMarkerMaterial", sceneInstance);
    pointMaterial.emissiveColor = new BABYLON.Color3(1, 1, 1);  // White color for the point marker
    pointMarker.material = pointMaterial;
}
