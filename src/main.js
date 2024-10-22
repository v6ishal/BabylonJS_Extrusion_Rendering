import { setupCanvas } from './canvas.js';
import { enterDrawMode, exitDrawMode } from './draw.js';
import { enterExtrudeShapeMode } from './extrude.js';
import { enterMoveMode, exitMoveMode } from './move.js';
import { enterVertexEditMode, exitVertexEditMode } from './editVertex.js'; 

// Global Variables
var canvasElement = document.getElementById('myCanvas');
var babylonEngine = new BABYLON.Engine(canvasElement, true);
let sceneInstance = new BABYLON.Scene(babylonEngine);

const camera = new BABYLON.ArcRotateCamera("Camera", 0, Math.PI / 3, 50, BABYLON.Vector3.Zero(), sceneInstance);
camera.attachControl(canvasElement, true);

let drawMode = false;
let moveMode = false;
let extrudeMode = false;
let vertexEditMode = false;
let def_depth = 5;

let points = [];
let PolygonsToExtrude = [];
let isPolygonAlreadyExtruded = [];  // boolean array to avoid multiple extrusion objects

// Create a ground
const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 20, height: 50 }, sceneInstance);

setupCanvas(sceneInstance, babylonEngine, ground);

window.toggleMode = toggleMode;

// Toggle modes based on the clicked button
function toggleMode(button, mode) {
    if (drawMode || moveMode || vertexEditMode || extrudeMode) {
        exitMode(button);  // Exit active mode
    } else {
        activateMode(button, mode);  // Activate the clicked mode
    }
}

// Activate the selected mode and disable other buttons
function activateMode(button, mode) {
    drawMode = (mode === 'drawMode');
    moveMode = (mode === 'moveMode');
    vertexEditMode = (mode === 'vertexEditMode');
    extrudeMode = (mode === 'extrudeMode');

    button.textContent = 'Exit ' + button.textContent;  // Change button text to Exit

    // Disable other buttons
    disableOtherButtons(button);

    if (drawMode) {
        enterDrawMode(sceneInstance, points, PolygonsToExtrude);
    }
    if (extrudeMode) {
        let extrusionUnit = prompt("Enter extrusion height (in units):", "6");
        let extrusionDepth = def_depth;
        if (extrusionUnit != null && !isNaN(extrusionUnit)) {
            extrusionDepth = parseFloat(extrusionUnit);
        } else {
            alert("Invalid extrusion depth entered. Using default depth.");
        }
        def_depth = extrusionDepth;
        enterExtrudeShapeMode(sceneInstance, extrusionDepth, PolygonsToExtrude, isPolygonAlreadyExtruded);
    }
    if (moveMode) {
        enterMoveMode(sceneInstance, camera, babylonEngine, ground, moveMode, PolygonsToExtrude);
    }
    if (vertexEditMode) {
        enterVertexEditMode(sceneInstance, camera, babylonEngine, ground, vertexEditMode);  // Call the function to enter vertex edit mode
        //enterVertexEditMode();
    }
}

// Disable all buttons except the one currently active
function disableOtherButtons(activeButton) {
    const buttons = document.querySelectorAll('#button-container button');
    buttons.forEach(btn => {
        if (btn !== activeButton) {
            btn.disabled = true;
        }
    });
}

// Exit the current mode and enable all buttons
function exitMode(button) {
    if (drawMode) {
        exitDrawMode(sceneInstance);  // Exit draw mode and remove listener
    }
    if (moveMode) {
        exitMoveMode(babylonEngine);  // Clean up move mode listeners
    }
    // You may want to clean up vertex editing if needed
    if(vertexEditMode)
    {
        exitVertexEditMode(babylonEngine);
    }
    drawMode = moveMode = vertexEditMode = extrudeMode = false;
    button.textContent = button.textContent.replace('Exit ', '');  // Reset button text
    enableAllButtons();
}

// Enable all buttons after exiting mode
function enableAllButtons() {
    const buttons = document.querySelectorAll('#button-container button');
    buttons.forEach(btn => btn.disabled = false);
}

// Run the app
babylonEngine.runRenderLoop(function(){
    sceneInstance.render();
});

