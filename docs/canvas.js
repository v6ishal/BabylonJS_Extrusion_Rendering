export function setupCanvas(sceneInstance, engineInstance, ground) {    
    // Set the background color for the scene
    sceneInstance.clearColor = new BABYLON.Color3(0.85, 0.95, 1);  // Light blue background

    // Create a hemispheric light source
    const hemisphericLight = new BABYLON.HemisphericLight(
        "hemisphericLight", 
        new BABYLON.Vector3(0, 1, 0), 
        sceneInstance
    );

    // Create and configure the ground material
    const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", sceneInstance);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.55, 0.27, 0.07);  // Brown color (RGB for brown)
    ground.material = groundMaterial;

    // Enable edge rendering for the ground (optional visual enhancement)
    ground.enableEdgesRendering();
    ground.edgesWidth = 4.0;
    ground.edgesColor = new BABYLON.Color4(0, 0, 0, 1);  // Black edges

    // Render loop to update and draw the scene continuously
    engineInstance.runRenderLoop(function () {
        sceneInstance.render();
    });

    // Event listener to handle canvas resize events
    window.addEventListener("resize", function () {
        engineInstance.resize();
    });
}
